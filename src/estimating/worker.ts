import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
import type { Principal } from "../platform/identity";
import { database, transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { digest, documentStore } from "../documents/store";
import type { DocumentKey } from "../adapters/contracts";
import { quoteContext, type QuoteRevision } from "./context";
type Manifest={key:DocumentKey;html_hash:string;pdf_hash:string;html_bytes:number;pdf_bytes:number;browser_version:string;revision_id:string;template_hash:string};
type Job={id:string;workspace_id:string;actor_id:string;revision_id:string;state:"Pending"|"Running"|"Ready"|"Failed";attempts:number;lease_token:string|null;lease_until:Date|null;error_code:string|null;manifest:Manifest|null};
type Bundle={schema:1;job_id:string;workspace_id:string;revision_id:string;template_hash:string;html:string;html_hash:string;pdf_base64:string;pdf_hash:string;browser_version:string};
const missing=()=>new AppError(503,"ExactDraftUnavailable","The exact draft output is unavailable. Its saved revision is retained for recovery.");
export async function renderQuote(html:string) {
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage();
    await page.route("**/*",route=>route.request().url().startsWith("data:")?route.continue():route.abort());
    await page.setContent(html,{waitUntil:"load"});
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
    const pdf=await page.pdf({format:"A4",printBackground:true,preferCSSPageSize:true,tagged:true,displayHeaderFooter:true,headerTemplate:"<span></span>",footerTemplate:'<div style="font:8px Verdana;width:100%;text-align:center;color:#505a66">DRAFT · SYNTHETIC · Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'});
    return {pdf,browser_version:browser.version()};
  } finally {await browser.close();}
}
function inspect(bytes:Uint8Array,j:Job,q:QuoteRevision) {
  try {
    const b=JSON.parse(Buffer.from(bytes).toString("utf8")) as Bundle,pdf=Buffer.from(b.pdf_base64,"base64");
    if(b.schema!==1 || b.job_id!==j.id || b.workspace_id!==j.workspace_id || b.revision_id!==q.id || b.template_hash!==q.template_hash ||
      b.html_hash!==q.input_hash || b.html!==q.input_html || digest(b.html)!==b.html_hash || digest(pdf)!==b.pdf_hash || !pdf.subarray(0,5).equals(Buffer.from("%PDF-")) || !b.browser_version) throw missing();
    return {bundle:b,pdf};
  } catch {throw missing();}
}
export async function readQuoteJob(p:Principal,id:string) {
  const {q}=await quoteContext(database(),p,id);
  const j=(await database().query<Job>("SELECT * FROM ppo.estimate_quote_jobs WHERE workspace_id=$1 AND revision_id=$2",[p.workspace_id,q.id])).rows[0];
  if(!j) throw unavailable(); return {j,q};
}
export async function draftBytes(p:Principal,id:string) {
  const {j,q}=await readQuoteJob(p,id);
  if(j.state!=="Ready" || !j.manifest) throw missing();
  const bytes=await documentStore().read({...p,operation_id:j.id},j.manifest.key),{bundle,pdf}=inspect(bytes,j,q),m=j.manifest;
  if(m.revision_id!==q.id || m.template_hash!==q.template_hash || m.html_hash!==bundle.html_hash || m.pdf_hash!==bundle.pdf_hash || m.html_bytes!==Buffer.byteLength(bundle.html) || m.pdf_bytes!==pdf.length || m.browser_version!==bundle.browser_version) throw missing();
  return {html:bundle.html,pdf,manifest:m};
}
// A process exit after store but before Ready is recovered from the original bundle.
// Hooks are in-process verification seams, never HTTP inputs or environment flags.
export class QuoteWorkerInterrupted extends Error {}
export async function runQuoteJob(id:string,hooks:{render?:typeof renderQuote;afterStore?:()=>Promise<void>}={}) {
  const claimed=await transaction(async c=>{
    const found=(await c.query<Job>("SELECT * FROM ppo.estimate_quote_jobs WHERE id=$1",[id])).rows[0];
    if(!found) throw unavailable();
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE",[found.workspace_id]);
    const j=(await c.query<Job>("SELECT * FROM ppo.estimate_quote_jobs WHERE id=$1 FOR UPDATE",[id])).rows[0];
    if(j.state==="Ready" || (j.state==="Running" && j.lease_until && j.lease_until.getTime()>Date.now())) return null;
    const p={workspace_id:j.workspace_id,actor_id:j.actor_id,display_name:"Stored preparation owner"};
    const {q}=await quoteContext(c,p,j.revision_id,"estimating.quote.prepare");
    // The preparation capability cannot stand in for access to its quotation.
    await quoteContext(c,p,j.revision_id);
    if(digest(q.input_html)!==q.input_hash) throw missing();
    const token=randomUUID(),attempt=j.attempts+1;
    await c.query("UPDATE ppo.estimate_quote_jobs SET state='Running',attempts=$2,lease_token=$3,lease_until=clock_timestamp()+interval '2 minutes',error_code=NULL,updated_at=clock_timestamp() WHERE id=$1",[id,attempt,token]);
    await c.query("INSERT INTO ppo.estimate_quote_attempts(job_id,attempt,outcome) VALUES($1,$2,'Claimed')",[id,attempt]);
    return {j:{...j,attempts:attempt,lease_token:token},q,p};
  });
  if(!claimed) return;
  const {j,q,p}=claimed,context={...p,operation_id:j.id};
  try {
    let stored=await documentStore().locate(context);
    if(!stored) {
      const output=await (hooks.render??renderQuote)(q.input_html);
      const bundle:Bundle={schema:1,job_id:j.id,workspace_id:j.workspace_id,revision_id:q.id,template_hash:q.template_hash,html:q.input_html,html_hash:q.input_hash,pdf_base64:output.pdf.toString("base64"),pdf_hash:digest(output.pdf),browser_version:output.browser_version};
      const bytes=Buffer.from(JSON.stringify(bundle));
      await documentStore().store(context,bytes,digest(bytes));
      stored=await documentStore().locate(context);
    }
    if(!stored) throw missing();
    const {bundle,pdf}=inspect(stored.bytes,j,q);
    await hooks.afterStore?.();
    const manifest:Manifest={key:stored.key,html_hash:bundle.html_hash,pdf_hash:bundle.pdf_hash,html_bytes:Buffer.byteLength(bundle.html),pdf_bytes:pdf.length,browser_version:bundle.browser_version,revision_id:q.id,template_hash:q.template_hash};
    await transaction(async c=>{
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE",[p.workspace_id]);
      await quoteContext(c,p,q.id,"estimating.quote.prepare");
      await quoteContext(c,p,q.id);
      const changed=await c.query("UPDATE ppo.estimate_quote_jobs SET state='Ready',manifest=$3,lease_token=NULL,lease_until=NULL,error_code=NULL,updated_at=clock_timestamp() WHERE id=$1 AND state='Running' AND lease_token=$2",[j.id,j.lease_token,manifest]);
      if(changed.rowCount) await c.query("INSERT INTO ppo.estimate_quote_attempts(job_id,attempt,outcome) VALUES($1,$2,'Ready')",[id,j.attempts]);
    });
  } catch(e) {
    if(e instanceof QuoteWorkerInterrupted) throw e;
    await transaction(async c=>{
      const changed=await c.query("UPDATE ppo.estimate_quote_jobs SET state='Failed',lease_token=NULL,lease_until=NULL,error_code='DraftRenderFailed',updated_at=clock_timestamp() WHERE id=$1 AND state='Running' AND lease_token=$2",[id,j.lease_token]);
      if(changed.rowCount) await c.query("INSERT INTO ppo.estimate_quote_attempts(job_id,attempt,outcome,code) VALUES($1,$2,'Failed','DraftRenderFailed')",[id,j.attempts]);
    });
    throw missing();
  }
}
export async function retryQuote(p:Principal,id:string) {
  await quoteContext(database(),p,id,"estimating.quote.prepare");
  const {j}=await readQuoteJob(p,id);
  await runQuoteJob(j.id);
}
export async function runPendingQuoteJobs() {
  if(!(await database().query("SELECT to_regclass('ppo.estimate_quote_jobs') AS relation")).rows[0].relation) return;
  const jobs=(await database().query("SELECT id FROM ppo.estimate_quote_jobs WHERE state='Pending' OR (state='Running' AND lease_until<clock_timestamp()) ORDER BY created_at LIMIT 10")).rows;
  for(const j of jobs) {try {await runQuoteJob(j.id);} catch { /* Durable attempt state retains recoverable failures. */ }}
}
