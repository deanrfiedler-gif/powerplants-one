import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, closeDatabase, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, saveEstimate, prepareQuote } from "../../src/estimating/service";
import { listEstimates, readEstimate, readQuote, estimatingOptions } from "../../src/estimating/reads";
import { readQuoteJob, runQuoteJob, draftBytes, retryQuote, QuoteWorkerInterrupted } from "../../src/estimating/worker";
import { readOperation } from "../../src/shared/receipts";
import { documentStore, digest } from "../../src/documents/store";
import { CRM, crmCreate, crmBase } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
if(localConfig().database_name!=="ppo_synthetic_test")throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET="dispose-synthetic";process.env.PPO_RESET_DATABASE="ppo_synthetic_test";
beforeEach(reset);after(closeDatabase);
const principal=async(profile="coordinator")=>(await createSession(profile)).principal;
const rows=async(q:string,v:unknown[]=[])=> (await database().query(q,v)).rows;
const code=(name:string)=>(e:unknown)=>(e as {code:string}).code===name;
async function setup(){const p=await principal(),o=crmCreate();await createOpportunity(p,o);const input=estimateInput(o.id);return {p,o,input};}
async function saved(){const s=await setup(),result=await createEstimate(s.p,s.input),e=await readEstimate(s.p,s.input.id);return {...s,result,e};}
async function quoted(){const s=await saved(),command=quoteCommand(s.e.saved),q=await prepareQuote(s.p,s.e.id,command);return {...s,command,q};}
test("E1-DB01 atomic creation, identical races and receipt recovery retain one original effect",async()=>{
  const {p,o,input}=await setup(),results=await Promise.all([createEstimate(p,input),createEstimate(p,input)]);
  assert.deepEqual(results[0].receipt,results[1].receipt);assert.equal(results.filter(r=>r.replayed).length,1);
  const e=await readEstimate(p,input.id);assert.equal(e.versions.length,1);assert.equal(e.totals.cost,"480.00");assert.equal(e.totals.sell,"720.00");
  assert.equal(new Set([e.id,e.saved.id,e.option_id,e.estimation_revision_id,e.saved.scope_revision_id]).size,5);
  assert.deepEqual(await readOperation(p,input.operation_id),results[0].receipt);
  assert.equal((await rows("SELECT count(*)::int AS n FROM ppo.audit_events WHERE operation_id=$1",[input.operation_id]))[0].n,1);
  assert.equal((await rows("SELECT count(*)::int AS n FROM ppo.outbox_jobs WHERE operation_id=$1",[input.operation_id]))[0].n,1);
  assert.deepEqual((await rows("SELECT version,stage_id,next_activity_id FROM ppo.opportunities WHERE id=$1",[o.id]))[0],{version:1,stage_id:"Enquiry",next_activity_id:o.initial_action.id});
  await assert.rejects(createEstimate(p,{...input,title:"Changed original"}),code("OperationConflict"));
  await assert.rejects(createEstimate(p,{...input,...crmBase(),id:randomUUID()}),code("RelationshipConflict"));
});
test("E1-DB02 reasoned successor, stale writers, exact predecessor and immutable original",async()=>{
  const {p,input,e}=await saved(),command={...crmBase(),expected_version:1,title:input.title,scope:input.scope,lines:input.lines.map(l=>({...l,quantity:"3"})),policy:input.policy};
  const commands=[command,{...command,...crmBase()}];
  const both=await Promise.allSettled(commands.map(candidate=>saveEstimate(p,e.id,candidate)));
  assert.equal(both.filter(r=>r.status==="fulfilled").length,1);assert.equal(both.filter(r=>r.status==="rejected"&&code("VersionConflict")(r.reason)).length,1);
  const current=await readEstimate(p,e.id);assert.equal(current.version,2);assert.equal(current.saved.predecessor_id,e.saved.id);assert.equal(current.versions.length,2);
  assert.deepEqual((await readEstimate(p,e.id,{version_id:e.saved.id})).saved,e.saved);
  const winner=commands[both.findIndex(result=>result.status==="fulfilled")];
  assert.deepEqual((await saveEstimate(p,e.id,winner)).receipt,await readOperation(p,winner.operation_id));
  await assert.rejects(rows("UPDATE ppo.estimate_versions SET title='Overwritten' WHERE id=$1",[e.saved.id]),code("55000"));
  await assert.rejects(rows("DELETE FROM ppo.estimate_versions WHERE id=$1",[e.saved.id]),code("55000"));
  await assert.rejects(rows("UPDATE ppo.estimates SET version=version+1,owner_id=$2 WHERE id=$1",[e.id,randomUUID()]),code("55000"));
});
test("E1-DB03 server scope denial covers lists, selectors, commands, receipt replay and cross-workspace guesses",async()=>{
  const {p,input,e}=await saved();
  for(const profile of ["systems","assigned-technician","second-company","other-workspace"]){const other=await principal(profile);await assert.rejects(readEstimate(other,e.id),code("RecordUnavailable"));await assert.rejects(readOperation(other,input.operation_id),code("RecordUnavailable"));}
  const other=await principal("second-company");assert.equal((await listEstimates(other,{})).items.length,0);assert.equal((await estimatingOptions(other)).items.some(o=>o.id===input.opportunity_id),false);
  await rows("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",[p.actor_id]);
  await assert.rejects(createEstimate(p,input),code("RecordUnavailable"));await assert.rejects(readOperation(p,input.operation_id),code("RecordUnavailable"));
  assert.equal((await readEstimate(p,e.id)).can_edit,false);
});
test("E1-DB04 loss of linked person relationship hides aggregates, original receipts and exact quote files",async()=>{
  const s=await quoted();await runQuoteJob((await readQuoteJob(s.p,s.command.id)).j.id);
  await rows("UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE workspace_id=$1 AND organisation_id=$2 AND person_id=$3",[CRM.workspace,CRM.org,CRM.person]);
  await assert.rejects(readEstimate(s.p,s.e.id),code("RecordUnavailable"));assert.equal((await listEstimates(s.p,{})).items.length,0);
  await assert.rejects(readQuote(s.p,s.command.id),code("RecordUnavailable"));await assert.rejects(draftBytes(s.p,s.command.id),code("RecordUnavailable"));
  await assert.rejects(readOperation(s.p,s.input.operation_id),code("RecordUnavailable"));await assert.rejects(prepareQuote(s.p,s.e.id,s.command),code("RecordUnavailable"));
});
test("E1-DB05 safe-only reader cannot retrieve internal costs; owner grants are not inferred",async()=>{
  const s=await quoted(),observer=await principal("observer");
  for(const capability of ["crm.opportunity.read","shared.internal.read","estimating.quote.read"]){await rows("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,valid_from) VALUES($1,$2,$3,$4,'Company',$3,'2026-01-01') ON CONFLICT DO NOTHING",[CRM.workspace,observer.actor_id,CRM.company,capability]);}
  const q=await readQuote(observer,s.command.id);assert.equal(q.snapshot.total,"720.00");assert.equal(q.can_prepare,false);assert.equal(q.estimate_id,undefined);
  assert.doesNotMatch(JSON.stringify(q),/unit_cost|cost_total|margin|markup|private supplier|labour assumption|estimate_version_id|choices/);
  await assert.rejects(readEstimate(observer,s.e.id),code("RecordUnavailable"));await assert.rejects(retryQuote(observer,s.command.id),code("RecordUnavailable"));
  await rows("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.quote.read'",[observer.actor_id]);await assert.rejects(readQuote(observer,s.command.id),code("RecordUnavailable"));
});
test("E1-DB06 quote revisions bind exact saved versions, choices, reason and captured template; originals never advance",async()=>{
  const s=await quoted(),first=await readQuote(s.p,s.command.id),original=(await readQuoteJob(s.p,s.command.id)).q;
  assert.equal(first.snapshot.items.at(-1)!.amount,"320.00");assert.equal(first.snapshot.items.at(-1)!.description,"Included scope allowance");
  const next={...s.command,...crmBase(),id:randomUUID(),expected_quote_version:1,choices:s.command.choices.map(c=>({...c,included:c.print}))};
  await prepareQuote(s.p,s.e.id,next);assert.equal((await readQuote(s.p,next.id)).snapshot.total,"400.00");
  assert.deepEqual((await readQuoteJob(s.p,s.command.id)).q,original);assert.equal(first.snapshot.state,"Draft");
  await assert.rejects(prepareQuote(s.p,s.e.id,{...next,...crmBase(),id:randomUUID()}),code("VersionConflict"));
  await assert.rejects(rows("UPDATE ppo.draft_quote_revisions SET state='Issued' WHERE id=$1",[s.command.id]),code("55000"));
  await assert.rejects(rows("UPDATE ppo.draft_quotes SET version=1 WHERE id=$1",[original.quote_id]),code("55000"));
  assert.equal(digest(original.input_html),original.input_hash);assert.match(original.input_html,/DRAFT · SYNTHETIC/);assert.doesNotMatch(original.input_html,/private supplier cost note|unit_cost|margin_percent/);
});
test("E1-DB07 complete decimal data and matching quote membership required; empty draft remains unknown",async()=>{
  const {p,input}=await setup();await assert.rejects(createEstimate(p,{...input,lines:input.lines.map(l=>({...l,unit_cost:""}))}),code("InvalidData"));
  await createEstimate(p,{...input,lines:[]});const e=await readEstimate(p,input.id);assert.equal(e.totals.sell,null);
  await assert.rejects(prepareQuote(p,e.id,{...quoteCommand({id:e.saved.id,lines:input.lines}),choices:[{line_id:input.lines[0].id,included:true,print:true}]}),code("QuoteSelectionInvalid"));
  const v={...crmBase(),expected_version:1,title:input.title,scope:input.scope,lines:input.lines,policy:input.policy};await saveEstimate(p,e.id,v);
  const current=await readEstimate(p,e.id),q=quoteCommand(current.saved,2);q.choices[0].line_id=randomUUID();await assert.rejects(prepareQuote(p,e.id,q),code("QuoteSelectionInvalid"));
});
test("E1-DB08 crash after durable storage recovers byte-identical HTML/PDF without regeneration",async()=>{
  const s=await quoted(),{j}=await readQuoteJob(s.p,s.command.id);let renders=0;
  const {renderQuote}=await import("../../src/estimating/worker");
  await assert.rejects(runQuoteJob(j.id,{render:async html=>{renders++;return renderQuote(html);},afterStore:async()=>{throw new QuoteWorkerInterrupted("Simulated process exit after durable file acknowledgement");}}),QuoteWorkerInterrupted);
  const stored=await documentStore().locate({...s.p,operation_id:j.id});assert.ok(stored);
  assert.equal((await readQuoteJob(s.p,s.command.id)).j.state,"Running");
  await rows("UPDATE ppo.estimate_quote_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1",[j.id]);
  await runQuoteJob(j.id,{render:async()=>{throw Error("Recovery must reuse original output");}});
  const exact=await draftBytes(s.p,s.command.id),ready=(await readQuoteJob(s.p,s.command.id)).j;
  assert.equal(ready.state,"Ready");assert.equal(renders,1);assert.equal(ready.attempts,2);assert.equal(ready.manifest!.key.sha256,stored.key.sha256);
  await retryQuote(s.p,s.command.id);assert.deepEqual(await draftBytes(s.p,s.command.id),exact);
  await closeDatabase();assert.deepEqual(await draftBytes(s.p,s.command.id),exact);
});
test("E1-DB09 failed rendering retains original revision and recovers same intent; Ready output cannot be overwritten",async()=>{
  const s=await quoted(),{j,q}=await readQuoteJob(s.p,s.command.id);
  await assert.rejects(runQuoteJob(j.id,{render:async()=>{throw Error("Renderer temporarily unavailable");}}),code("ExactDraftUnavailable"));
  assert.equal((await readQuoteJob(s.p,s.command.id)).j.state,"Failed");assert.deepEqual((await readQuoteJob(s.p,s.command.id)).q,q);
  await retryQuote(s.p,s.command.id);const data=await draftBytes(s.p,s.command.id);assert.ok(data.pdf.length>1000);
  await assert.rejects(rows("UPDATE ppo.estimate_quote_jobs SET manifest='{}'::jsonb WHERE id=$1",[j.id]),code("55000"));
  await assert.rejects(documentStore().store({...s.p,operation_id:j.id},Buffer.from("changed"),digest("changed")),code("StoredOperationConflict"));
});
test("E1-DB10 current-main upgrade and repeated seed preserve accepted CRM originals and revoked grants",async()=>{
  await rows(await readFile(new URL("../../db/migrations/0001-recover.sql",import.meta.url),"utf8"));await rows("DROP TABLE public.ppo_migrations");
  await migrate(10);await seed(10);const p=await principal(),o=crmCreate(),accepted=await createOpportunity(p,o);
  const tables=["opportunities","opportunity_events","activities","activity_links","operation_receipts","outbox_jobs"],before=await Promise.all(tables.map(t=>rows(`SELECT * FROM ppo.${t} ORDER BY 1`)));
  const hashes=await rows("SELECT * FROM public.ppo_migrations ORDER BY version");await migrate();await seed();
  // Migrations 0017/0018 add fields without changing any accepted source value.
  // Compare full rows, including the exact defaults, rather than dropping columns.
  for(let i=0;i<tables.length;i++){
    const expected=before[i].map(row=>tables[i]==="opportunities"
      ?{...row,value_amount:null,expected_close_date:null,scope_details:{}}
      :tables[i]==="opportunity_events"?{...row,record_snapshot:null}
      :tables[i]==="activity_links"?{...row,lead_id:null}:row);
    assert.deepEqual(await rows(`SELECT * FROM ppo.${tables[i]} ORDER BY 1`),expected);
  }
  assert.deepEqual(await rows("SELECT * FROM public.ppo_migrations WHERE version<=10 ORDER BY version"),hashes);assert.deepEqual(await readOperation(p,o.operation_id),accepted.receipt);
  const input=estimateInput(o.id);await createEstimate(p,input);const e=await readEstimate(p,input.id);
  await rows("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",[p.actor_id]);await seed();await seed();
  assert.equal((await readEstimate(p,e.id)).can_edit,false);assert.deepEqual((await readEstimate(p,e.id)).saved,e.saved);
});
test("E1-DB11 graph constraints reject forged aggregate totals and unrelated current versions atomically",async()=>{
  const s=await saved();
  await assert.rejects(transaction(async c=>{
    const id=randomUUID();await c.query("UPDATE ppo.estimates SET version=2,current_version_id=$2 WHERE id=$1",[s.e.id,id]);
    await c.query(`INSERT INTO ppo.estimate_versions(id,workspace_id,company_id,estimate_id,version,created_by,updated_by,predecessor_id,scope_revision_id,title,scope,lines,policy,content_hash,reason,cost_total,sell_total) SELECT $2,workspace_id,company_id,estimate_id,2,created_by,updated_by,id,gen_random_uuid(),title,scope,lines,policy,content_hash,'SYN invalid declared total',0,0 FROM ppo.estimate_versions WHERE id=$1`,[s.e.saved.id,id]);
  }),code("23514"));assert.equal((await readEstimate(s.p,s.e.id)).version,1);
});
