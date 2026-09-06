import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, expect } from "@playwright/test";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import { digest } from "../src/documents/store";
import { crmCreate, crmBase } from "../tests/helpers/crm";
import { estimateInput, quoteCommand } from "../tests/helpers/estimating";
if(localConfig().database_name!=="ppo_synthetic_test")throw Error("Disposable ppo_synthetic_test only");
const phase=process.argv[2];if(!["write","recover","verify"].includes(phase))throw Error("Use write, recover or verify");
const root=join(process.env.RUNNER_TEMP??"/tmp","ppo-estimating-e1-restart"),evidence="verification-evidence/estimating-e1-restart",origin="http://127.0.0.1:3000";
await mkdir(root,{recursive:true});await mkdir(evidence,{recursive:true});
const server=spawn(process.execPath,["--env-file=.env.local","--import","tsx","scripts/local-server.ts"],{stdio:["ignore","inherit","inherit"]});
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try {
  let ready=false;for(let n=0;n<120;n++){try{if((await fetch(origin)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
  assert.ok(ready);assert.equal(server.exitCode,null);browser=await chromium.launch();
  const context=await browser.newContext({viewport:{width:1440,height:1000},locale:"en-AU"}),page=await context.newPage();
  async function call(path:string,body?:unknown){const r=await context.request.fetch(`${origin}/api/v1/${path}`,{method:body===undefined?"GET":"POST",headers:body===undefined?{}:{Origin:origin,"Content-Type":"application/json"},data:body});assert.ok(r.ok(),await r.text());return r.json();}
  const started=async()=>(await database().query("SELECT pg_postmaster_start_time() AS at")).rows[0].at.toISOString();
  await call("local-session",{profile:"coordinator"});let proof;
  if(phase==="write"){
    const o=crmCreate();await call("crm/opportunities",o);const input=estimateInput(o.id),first=await call("estimating/estimates",input),original=await call(`estimating/estimates/${input.id}`);
    const command={...crmBase(),expected_version:1,title:input.title,scope:{...input.scope,included:"SYN Exact successor retained after restart"},lines:input.lines.map(l=>({...l,quantity:"3"})),policy:input.policy},successor=await call(`estimating/estimates/${input.id}`,command),detail=await call(`estimating/estimates/${input.id}`);
    const quote=quoteCommand(detail.saved,2),prepared=await call(`estimating/estimates/${input.id}/quotes`,quote);
    proof={input,command,quote,operations:[first,successor,prepared],original:original.saved,detail,quote_before:await call(`estimating/quotes/${quote.id}`),application_pids:[server.pid],database_starts:[await started()]};
    assert.equal(proof.quote_before.job.state,"Pending");
  }else{
    proof=JSON.parse(await readFile(join(root,"proof.json"),"utf8"));assert.ok(!proof.application_pids.includes(server.pid));assert.ok(!proof.database_starts.includes(await started()));
    const detail=await call(`estimating/estimates/${proof.input.id}`);assert.deepEqual(detail.saved,proof.detail.saved);assert.deepEqual(detail.versions,proof.detail.versions);
    assert.deepEqual((await call(`estimating/estimates/${proof.input.id}?version_id=${proof.original.id}`)).saved,proof.original);
    for(const receipt of proof.operations)assert.deepEqual(await call(`operations/${receipt.operation_id}`),receipt);
    assert.deepEqual(await call("estimating/estimates",proof.input),proof.operations[0]);assert.deepEqual(await call(`estimating/estimates/${proof.input.id}`,proof.command),proof.operations[1]);assert.deepEqual(await call(`estimating/estimates/${proof.input.id}/quotes`,proof.quote),proof.operations[2]);
    const before=await call(`estimating/quotes/${proof.quote.id}`);assert.deepEqual(before.snapshot,proof.quote_before.snapshot);
    if(phase==="recover"){assert.equal(before.job.state,"Pending");await call(`estimating/quotes/${proof.quote.id}/render`,{});}else assert.equal(before.job.state,"Ready");
    const hashes:Record<string,string>={};for(const kind of ["html","pdf"]){const r=await context.request.get(`${origin}/api/v1/estimating/quotes/${proof.quote.id}/file?kind=${kind}`);assert.ok(r.ok());const bytes=await r.body();hashes[kind]=digest(bytes);if(phase==="recover")await writeFile(join(root,`exact.${kind}`),bytes);else assert.deepEqual(bytes,await readFile(join(root,`exact.${kind}`)));}
    if(phase==="verify")assert.deepEqual(hashes,proof.hashes);proof.hashes=hashes;proof.application_pids.push(server.pid);proof.database_starts.push(await started());
    assert.equal((await database().query("SELECT count(*)::int AS n FROM ppo.estimate_quote_jobs WHERE revision_id=$1",[proof.quote.id])).rows[0].n,1);
  }
  await page.goto(`${origin}/estimating/estimates/${proof.input.id}`);await expect(page.getByRole("heading",{name:"Scope and cost workbook"})).toBeVisible();await expect(page.getByText(/Viewing saved version 2/)).toBeVisible();
  await page.locator(".est-heading").evaluate(e=>e.scrollIntoView({block:"start"}));const screenshot=await page.screenshot({path:`${evidence}/${phase}.png`});
  await writeFile(join(root,"proof.json"),JSON.stringify(proof));
  await writeFile(`${evidence}/${phase}.json`,JSON.stringify({phase,source_head:process.env.PPO_SOURCE_HEAD,checkout:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),tree:execFileSync("git",["rev-parse","HEAD^{tree}"],{encoding:"utf8"}).trim(),run_id:process.env.GITHUB_RUN_ID,node:process.version,browser:browser.version(),database:(await database().query("SELECT version() AS version")).rows[0].version,application_pids:proof.application_pids,database_starts:proof.database_starts,operations:proof.operations.map((r:{operation_id:string})=>r.operation_id),hashes:proof.hashes??null,screenshot_sha256:digest(screenshot)},null,2));
  console.log(`E1 ${phase}: exact estimate predecessors, three original receipts, pending/ready draft and process identities verified.`);
}finally{await browser?.close();server.kill("SIGTERM");await new Promise<void>(r=>{if(server.exitCode!==null)r();else server.once("exit",()=>r());});await closeDatabase();}
