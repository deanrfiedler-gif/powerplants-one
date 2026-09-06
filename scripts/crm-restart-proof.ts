import assert from "node:assert/strict";
import { spawn,execFileSync } from "node:child_process";
import { mkdir,readFile,writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { chromium,expect } from "@playwright/test";
import { localConfig } from "../src/platform/config";
import { database,closeDatabase } from "../src/platform/database";
import { crmCreate,crmQualify,crmBase,crmAction } from "../tests/helpers/crm";
if(localConfig().database_name!=="ppo_synthetic_test")throw Error("Disposable ppo_synthetic_test only");
const phase=process.argv[2];if(!["write","verify"].includes(phase))throw Error("Use write or verify");
const root=join(process.env.RUNNER_TEMP??"/tmp","ppo-crm-i1-restart"),evidence="verification-evidence/crm-i1-restart",origin="http://127.0.0.1:3000";
await mkdir(root,{recursive:true});await mkdir(evidence,{recursive:true});
const server=spawn(process.execPath,["--env-file=.env.local","--import","tsx","scripts/local-server.ts"],{stdio:["ignore","inherit","inherit"]});
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try {
 let ready=false;for(let n=0;n<120;n++){try{if((await fetch(origin)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}assert.ok(ready,"Application must start");
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000},locale:"en-AU"});const page=await context.newPage();
 async function call(path:string,body?:unknown){const r=await context.request.fetch(origin+"/api/v1/"+path,{method:body===undefined?"GET":"POST",headers:body===undefined?{}:{Origin:origin,"Content-Type":"application/json"},data:body});assert.ok(r.ok(),await r.text());return r.json();}
 await call("local-session",{profile:"coordinator"});
 let proof;
 if(phase==="write"){
  const input={...crmCreate(),title:"SYN I1 durable opportunity after process restart"},created=await call("crm/opportunities",input);
  const completed={...crmBase(),expected_version:1,outcome:"SYN Exact first outcome retained across application and PostgreSQL restarts"};const completionReceipt=await call(`activities/${input.initial_action.id}/complete`,completed);
  const qualification=crmQualify();const qualificationReceipt=await call(`crm/opportunities/${input.id}/qualify`,qualification);
  const action={...crmBase(),expected_version:2,new_action:crmAction()};const planned=await call(`crm/opportunities/${input.id}/next-action`,action);
  const operations=[created,completionReceipt,qualificationReceipt,planned];
  const db=(await database().query("SELECT r.operation_id,r.payload_hash,r.result FROM ppo.operation_receipts r WHERE r.operation_id=ANY($1::uuid[]) ORDER BY operation_id",[operations.map(r=>r.operation_id)])).rows;
  proof={input,operations,db,detail:(await call(`crm/opportunities/${input.id}`)).items[0]};await writeFile(join(root,"proof.json"),JSON.stringify(proof));
 }else{
  proof=JSON.parse(await readFile(join(root,"proof.json"),"utf8"));
  const o=(await call(`crm/opportunities/${proof.input.id}`)).items[0];assert.equal(o.version,3);assert.equal(o.stage_id,"Qualified");assert.equal(o.close_outcome,"Open");assert.equal(o.display_number,proof.detail.display_number);assert.equal(o.next_action_state,"DueNeeded");assert.equal(o.actions.length,2);assert.equal(o.actions[0].outcome,proof.detail.actions[0].outcome);assert.deepEqual(o.events,proof.detail.events);
  for(const receipt of proof.operations)assert.deepEqual(await call(`operations/${receipt.operation_id}`),receipt);
  const db=(await database().query("SELECT r.operation_id,r.payload_hash,r.result FROM ppo.operation_receipts r WHERE r.operation_id=ANY($1::uuid[]) ORDER BY operation_id",[proof.operations.map((r:{operation_id:string})=>r.operation_id)])).rows;assert.deepEqual(db,proof.db);
  const replay=await call("crm/opportunities",proof.input);assert.deepEqual(replay,proof.operations[0]);
  assert.equal((await database().query("SELECT count(*)::int AS n FROM ppo.opportunities WHERE id=$1",[proof.input.id])).rows[0].n,1);
  assert.equal((await database().query("SELECT count(*)::int AS n FROM ppo.activity_links WHERE opportunity_id=$1",[proof.input.id])).rows[0].n,2);
 }
 await page.goto(origin+`/crm/opportunities/${proof.input.id}`);await expect(page.getByRole("heading",{name:proof.input.title,exact:true})).toBeVisible();await expect(page.getByText("Qualified",{exact:true}).first()).toBeVisible();
 const bytes=await page.screenshot({path:`${evidence}/${phase}.png`,fullPage:false});
 await writeFile(`${evidence}/${phase}.json`,JSON.stringify({phase,scenario:"Accepted opportunity, completed outcome, qualification, successor and four receipts across actual application/PostgreSQL/browser process restart",source_head:process.env.PPO_SOURCE_HEAD,executed_checkout:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),tree:execFileSync("git",["rev-parse","HEAD^{tree}"],{encoding:"utf8"}).trim(),run_id:process.env.GITHUB_RUN_ID,run_attempt:process.env.GITHUB_RUN_ATTEMPT,node:process.version,viewport:page.viewportSize(),sha256:createHash("sha256").update(bytes).digest("hex"),opportunity_id:proof.input.id,operations:proof.operations.map((r:{operation_id:string})=>r.operation_id),database_version:(await database().query("SELECT version() AS version")).rows[0].version},null,2));
 console.log(`I1 ${phase}: real PostgreSQL and HTTP accepted opportunity, two actions, exact completed outcome, qualification/events and four immutable receipts verified. Application PID ${server.pid}.`);
}finally{await browser?.close();server.kill("SIGTERM");await new Promise<void>(resolve=>{if(server.exitCode!==null)resolve();else server.once("exit",()=>resolve());});await closeDatabase();}
