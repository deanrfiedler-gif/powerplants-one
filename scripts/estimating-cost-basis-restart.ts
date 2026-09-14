import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { database } from "../src/platform/database";
import { digest } from "../src/documents/store";
import { runQuoteJob, QuoteWorkerInterrupted } from "../src/estimating/worker";
import type { readEstimate } from "../src/estimating/reads";
import type { OperationReceipt } from "../src/platform/operations";
import { createCostingWorkspace, costingApiCommand, costingScopeSuccessor, type CostingCall } from "../tests/helpers/estimating-costing-api";
import { quoteCommand } from "../tests/helpers/estimating";
import { CRM } from "../tests/helpers/crm";
import type { DocumentKey } from "../src/adapters/contracts";
type Accepted={path:string;body:Record<string,unknown>;receipt:OperationReceipt};
type Proof={estimate_id:string;quote_id:string;job_id:string;original_quote:unknown;rows:unknown[];accepted:Accepted[];pids:number[];starts:string[];manifest:DocumentKey};
async function basisRows(id:string) {
  return Promise.all(["estimates","estimate_versions","estimate_discovery_roots","estimate_discovery_bases"].map(async table=>(await database().query(`SELECT to_jsonb(t) AS row FROM ppo.${table} t WHERE ${table==="estimates"?"id":"estimate_id"}=$1 ORDER BY to_jsonb(t)::text`,[id])).rows));
}
export async function costBasisRestart({phase,root,evidence,call,page,pid,databaseStart}:{phase:string;root:string;evidence:string;call:CostingCall;page:Page;pid:number;databaseStart:string}) {
  const file=join(root,"e2-cost-basis-proof.json");let proof:Proof;
  if(phase==="write") {
    const accepted:Accepted[]=[],record:CostingCall=async(path,body)=>{const result=await call(path,body);if(body&&typeof body==="object"&&"operation_id" in body)accepted.push({path,body:body as Record<string,unknown>,receipt:result as OperationReceipt});return result;};
    const s=await createCostingWorkspace(record),first=await costingApiCommand(record,s);await record(s.path+"/costing",first);
    const saved=await call(`estimating/estimates/${first.estimate_id}`) as Awaited<ReturnType<typeof readEstimate>>;
    const q1=quoteCommand(saved.saved);await record(`estimating/estimates/${saved.id}/quotes`,q1);await call(`estimating/quotes/${q1.id}/render`,{});
    const original_quote=(await database().query("SELECT to_jsonb(q) AS row FROM ppo.draft_quote_revisions q WHERE id=$1",[q1.id])).rows;
    const successor=await costingScopeSuccessor(record,s),next=await costingApiCommand(record,s,successor.body.revision_id);await record(s.path+"/costing",next);
    const current=await call(`estimating/estimates/${saved.id}`) as Awaited<ReturnType<typeof readEstimate>>;
    assert.equal(current.version,2);assert.equal(current.saved.discovery_basis!.revision_id,successor.body.revision_id);
    const q2=quoteCommand(current.saved,2,1);await record(`estimating/estimates/${saved.id}/quotes`,q2);
    const job=(await database().query("SELECT id FROM ppo.estimate_quote_jobs WHERE revision_id=$1",[q2.id])).rows[0].id;
    await assert.rejects(runQuoteJob(job,{afterStore:async()=>{throw new QuoteWorkerInterrupted("SYN E2 cost output interrupted after durable storage");}}),QuoteWorkerInterrupted);
    await database().query("UPDATE ppo.estimate_quote_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1",[job]);
    const {documentStore}=await import("../src/documents/store");
    const manifest=await documentStore().locate({workspace_id:CRM.workspace,actor_id:CRM.owner,operation_id:job});assert.ok(manifest);
    await writeFile(join(root,"e2-cost-original.bundle"),manifest.bytes);
    proof={estimate_id:saved.id,quote_id:q2.id,job_id:job,original_quote,rows:await basisRows(saved.id),accepted,pids:[pid],starts:[databaseStart],manifest:manifest.key};
  } else {
    proof=JSON.parse(await readFile(file,"utf8"));assert.ok(!proof.pids.includes(pid));assert.ok(!proof.starts.includes(databaseStart));
    proof.pids.push(pid);proof.starts.push(databaseStart);
    if(phase==="recover")await runQuoteJob(proof.job_id,{render:async()=>{throw Error("The original E2 cost quote must not be regenerated");}});
    assert.equal((await database().query("SELECT state FROM ppo.estimate_quote_jobs WHERE id=$1",[proof.job_id])).rows[0].state,"Ready");
    const {documentStore}=await import("../src/documents/store");
    const stored=await documentStore().locate({workspace_id:CRM.workspace,actor_id:CRM.owner,operation_id:proof.job_id});assert.ok(stored);
    assert.deepEqual(stored.key,proof.manifest);
    assert.equal(stored.bytes.equals(await readFile(join(root,"e2-cost-original.bundle"))),true,"The original stored E2 quote bundle must be byte-for-byte unchanged");
    assert.equal(digest(stored.bytes),proof.manifest.sha256);
  }
  assert.deepEqual(await basisRows(proof.estimate_id),proof.rows);
  const q1=(proof.original_quote as {row:{id:string}}[])[0].row.id;
  assert.deepEqual((await database().query("SELECT to_jsonb(q) AS row FROM ppo.draft_quote_revisions q WHERE id=$1",[q1])).rows,proof.original_quote);
  for(const original of proof.accepted){assert.deepEqual(await call(`operations/${original.body.operation_id}`),original.receipt);assert.deepEqual(await call(original.path,original.body),original.receipt);}
  await page.goto(`http://127.0.0.1:3000/estimating/estimates/${proof.estimate_id}`);
  await expect(page.getByRole("region",{name:"Saved discovery basis",exact:true})).toContainText("discovery revision 2");
  await page.getByRole("region",{name:"Saved discovery basis",exact:true}).evaluate(e=>e.scrollIntoView({block:"start"}));
  const screenshot=await page.screenshot({path:join(evidence,`cost-basis-${phase}.png`)}),checkout=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
  await writeFile(join(evidence,`cost-basis-${phase}.json`),JSON.stringify({phase,source_head:process.env.PPO_SOURCE_HEAD??checkout,executed_checkout:checkout,tree:execFileSync("git",["rev-parse","HEAD^{tree}"],{encoding:"utf8"}).trim(),run_id:process.env.GITHUB_RUN_ID,run_attempt:process.env.GITHUB_RUN_ATTEMPT,viewport:page.viewportSize(),byte_count:screenshot.length,sha256:digest(screenshot),application_pids:proof.pids,database_starts:proof.starts,estimate_id:proof.estimate_id,quote_id:proof.quote_id},null,2));
  await writeFile(file,JSON.stringify(proof,null,2));
  console.log(`E2 cost ${phase}: two exact version bases, ${proof.accepted.length} original receipts and original quote lease retained across actual processes.`);
}
