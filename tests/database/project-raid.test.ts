import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { AppError } from "../../src/platform/errors";
import { withWorkingCompany } from "../../src/platform/working-company";
import { reset, migrate, seed } from "../../scripts/database";
import { createProject, readSchedule, saveTask } from "../../src/projects/service";
import { recordBaseline, readBaselines } from "../../src/projects/baselines";
import { saveRaid, readRaid } from "../../src/projects/raid";
import { createActivity, activityCommand } from "../../src/activities/activities";
import { readOperation } from "../../src/shared/receipts";
import { projectInput, taskInput } from "../helpers/projects";
import { raidInput, raidAction } from "../helpers/project-raid";
import { CRM, crmBase } from "../helpers/crm";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name!=="ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET="dispose-synthetic";
process.env.PPO_RESET_DATABASE="ppo_synthetic_test";
beforeEach(reset); after(closeDatabase);
const code=(name:string)=>(e:unknown)=>e instanceof AppError && e.code===name;
async function setup() {
  const p=(await createSession("coordinator")).principal, project=projectInput();
  await createProject(p,project); return {p,project};
}
async function current(p: Parameters<typeof readRaid>[0], project:string,id:string) {
  const data=await readRaid(p,project,{id}); if (!data.current) throw Error("Missing detail"); return data.current;
}
test("PJ04-01 connected action completion, closure, reopening and immutable history preserve schedule and original recovery",async()=>{
  const {p,project}=await setup(), input=raidInput(), action=raidAction(project.id);
  await saveTask(p,project.id,taskInput());
  await recordBaseline(p,project.id,{...crmBase(),expected_version:2,expected_baseline_revision:0,label:"SYN before RAID",reviewed:true});
  const schedule=await readSchedule(p,project.id), baseline=(await readBaselines(p,project.id)).selected;
  await createActivity(p,action); input.action_ids=[action.id];
  const first=await saveRaid(p,project.id,input);
  assert.equal(first.receipt.record_version,1);
  assert.deepEqual((await saveRaid(p,project.id,input)).receipt,first.receipt);
  assert.deepEqual(await readOperation(p,input.operation_id),first.receipt);
  await assert.rejects(saveRaid(p,project.id,{...input,title:"SYN changed retry"}),code("OperationConflict"));
  const closing={...input,...crmBase(),expected_version:1,state:"Closed",outcome:"SYN supplier date confirmed"};
  await assert.rejects(saveRaid(p,project.id,closing),code("OpenActions"));
  assert.equal((await current(p,project.id,input.id)).version,1);
  await activityCommand(p,action.id,{...crmBase(),expected_version:1,outcome:"SYN forecast confirmed"},"complete");
  await saveRaid(p,project.id,closing);
  const closed=await current(p,project.id,input.id);
  assert.equal(closed.state,"Closed"); assert.equal(closed.actions[0].state,"Completed");
  assert.deepEqual(closed.action_basis,[{id:action.id,version:2,state:"Completed"}]);
  await assert.rejects(saveRaid(p,project.id,{...closing,...crmBase(),expected_version:2}),code("InvalidData"));
  await saveRaid(p,project.id,{...input,...crmBase(),expected_version:2,detail:"SYN new uncertainty after delivery review"});
  await closeDatabase(); await migrate(); await seed();
  const detail=await readRaid(p,project.id,{id:input.id});
  assert.deepEqual(detail.history!.map(r=>r.state),["Open","Closed","Open"]);
  assert.deepEqual(detail.history![2].action_basis,[{id:action.id,version:1,state:"Open"}]);
  assert.equal(detail.history![2].actions[0].state,"Completed");
  assert.deepEqual(await readOperation(p,input.operation_id),first.receipt);
  assert.deepEqual({...await readSchedule(p,project.id),observed_at:schedule.observed_at},schedule);
  assert.deepEqual((await readBaselines(p,project.id)).selected,baseline);
  for (const table of ["project_raid_entries","project_raid_revisions"]) for (const verb of ["DELETE FROM", "UPDATE"]) {
    const sql=verb==="UPDATE" ? `UPDATE ppo.${table} SET created_by=created_by` : `DELETE FROM ppo.${table}`;
    await assert.rejects(database().query(sql),(e:unknown)=>(e as {code:string}).code==="55000");
  }
});
test("PJ04-02 races, stale versions, immutable kind, retained actions and evidence rollback",async()=>{
  const {p,project}=await setup(), input=raidInput(), action=raidAction(project.id);
  await createActivity(p,action); input.action_ids=[action.id]; await saveRaid(p,project.id,input);
  const results=await Promise.allSettled([1,2].map(()=>saveRaid(p,project.id,{...input,...crmBase(),expected_version:1,state:"Monitoring"})));
  assert.equal(results.filter(r=>r.status==="fulfilled").length,1);
  assert.equal(results.filter(r=>r.status==="rejected" && r.reason.code==="VersionConflict").length,1);
  for (const changed of [{kind:"Issue"},{action_ids:[]}]) await assert.rejects(saveRaid(p,project.id,{...input,...crmBase(),expected_version:2,...changed}),code("InvalidData"));
  const other=projectInput(); await createProject(p,other);
  await assert.rejects(saveRaid(p,other.id,{...input,...crmBase(),expected_version:2}),code("RecordUnavailable"));
  await assert.rejects(saveRaid(p,other.id,{...raidInput(),action_ids:[action.id]}),code("RecordUnavailable"));
  await assert.rejects(transaction(async c=>{
    await c.query(`INSERT INTO ppo.project_raid_revisions SELECT workspace_id,entry_id,3,title,detail,owner_id,priority,due_at,due_needed,response,interface_notes,state,outcome,action_ids,action_snapshot,reason,created_by,clock_timestamp(),$1 FROM ppo.project_raid_revisions WHERE entry_id=$2 AND version=2`,[randomUUID(),input.id]);
  }),(e:unknown)=>(e as {code:string}).code==="23514");
  assert.equal((await current(p,project.id,input.id)).version,2);
  const id=randomUUID();
  await assert.rejects(transaction(async c=>{await c.query("INSERT INTO ppo.project_raid_entries(id,workspace_id,company_id,project_id,kind,created_by) VALUES($1,$2,$3,$4,'Risk',$5)",[id,p.workspace_id,CRM.company,project.id,p.actor_id]);}));
  assert.equal((await database().query("SELECT 1 FROM ppo.business_identities WHERE id=$1",[id])).rowCount,0);
});
test("PJ04-03 current project and Activity authority guards detail, historical basis, edits and original receipts",async()=>{
  const {p,project}=await setup(), input=raidInput(), action=raidAction(project.id);
  const other=(await createSession("second-company")).principal;
  await createActivity(p,action); input.action_ids=[action.id]; await saveRaid(p,project.id,input);
  await assert.rejects(readRaid(other,project.id),code("RecordUnavailable"));
  await assert.rejects(readRaid({...p,workspace_id:randomUUID()},project.id),code("RecordUnavailable"));
  await assert.rejects(withWorkingCompany(p.actor_id,CRM.companyB,()=>readRaid(p,project.id)),code("RecordUnavailable"));
  await database().query("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='activity.read'",[p.workspace_id,p.actor_id]);
  const hidden=await current(p,project.id,input.id);
  assert.equal(hidden.action_completeness,"Partial"); assert.equal(hidden.can_edit,false);
  assert.deepEqual(hidden.actions,[]); assert.deepEqual(hidden.action_basis,[]);
  assert.ok(!JSON.stringify(await readRaid(p,project.id,{id:input.id})).includes(action.id));
  await assert.rejects(saveRaid(p,project.id,input),code("RecordUnavailable"));
  await assert.rejects(readOperation(p,input.operation_id),code("RecordUnavailable"));
  await database().query("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",[p.workspace_id,p.actor_id]);
  await assert.rejects(readRaid(p,project.id),code("RecordUnavailable"));
});
test("PJ04-04 invalid owner and read-only project authority refuse writes; read-only actors retain scoped inspection",async()=>{
  const {p,project}=await setup(), input=raidInput();
  await assert.rejects(saveRaid(p,project.id,{...input,owner_id:(await createSession("second-company")).principal.actor_id}),code("RecordUnavailable"));
  await saveRaid(p,project.id,input);
  await database().query("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.edit'",[p.workspace_id,p.actor_id]);
  assert.equal((await current(p,project.id,input.id)).can_edit,false);
  await assert.rejects(saveRaid(p,project.id,input),code("RecordUnavailable"));
  await assert.rejects(readOperation(p,input.operation_id),code("RecordUnavailable"));
});
test("PJ04-05 scoped kind/state/owner search and signed pages preserve all five record types",async()=>{
  const {p,project}=await setup();
  const ids=[];
  for (const kind of ["Risk","Assumption","Issue","Dependency","Decision"]) {const input={...raidInput(),kind}; await saveRaid(p,project.id,input); ids.push(input.id);}
  const first=await readRaid(p,project.id,{limit:"2"});
  assert.equal(first.items!.length,2); assert.ok(first.next_cursor);
  const second=await readRaid(p,project.id,{limit:"2",cursor:first.next_cursor});
  const third=await readRaid(p,project.id,{limit:"2",cursor:second.next_cursor});
  assert.deepEqual([...first.items!,...second.items!,...third.items!].map(r=>r.id),ids.sort());
  assert.equal(third.next_cursor,null);
  await assert.rejects(readRaid(p,project.id,{limit:"2",cursor:first.next_cursor,kind:"Risk"}),code("InvalidData"));
  await assert.rejects(readRaid(p,project.id,{cursor:"forged"}),code("InvalidData"));
  const filtered=await readRaid(p,project.id,{kind:"Decision",state:"Open",owner_id:p.actor_id,q:"supplier"});
  assert.equal(filtered.items!.length,1); assert.equal(filtered.items![0].kind,"Decision");
  assert.deepEqual((await readRaid(p,project.id,{state:"Closed"})).items,[]);
});
for (const through of [86, 87])
test(`PJ04-06 populated 00${through} upgrade preserves originals through 0096 and repeats without writes`,async()=>{
  await recoverSchema();
  await database().query("DROP TABLE public.ppo_migrations"); await migrate(through); await seed(through);
  const {p,project}=await setup(), action=raidAction(project.id); await createActivity(p,action); await saveTask(p,project.id,taskInput());
  const tables=["projects","project_tasks","project_dependencies","project_schedule_events","activities","activity_links","business_identities","operation_receipts","audit_events","outbox_jobs","permission_grants","users","seed_receipts"];
  const existing=through===87 ? {...raidInput(),action_ids:[action.id]} : null;
  if(existing) {
    await saveRaid(p,project.id,existing);
    tables.push("project_raid_entries","project_raid_revisions");
  }
  const existingRecord=existing ? await current(p,project.id,existing.id) : null;
  // Later seeds 107 (readiness), 108 (Conversations) and 110 (agent ask) are proved in readiness-gate.test.ts, conversations-upgrade.test.ts and assistant-upgrade.test.ts.
  const snapshot=()=>Promise.all(tables.map(t=>database().query(`SELECT to_jsonb(r) value FROM ppo.${t} r${t === "seed_receipts" ? " WHERE r.version NOT IN (107,108,110,120, 121)" : t === "permission_grants" ? " WHERE r.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(r)::text`).then(r=>r.rows)));
  const before=await snapshot(), ledger=(await database().query("SELECT * FROM public.ppo_migrations ORDER BY version")).rows;
  await migrate(); await seed(); assert.deepEqual(await snapshot(),before);
  const after=(await database().query("SELECT * FROM public.ppo_migrations ORDER BY version")).rows;
  assert.deepEqual(after.filter(r=>r.version<=through),ledger); assert.deepEqual(after.filter(r=>r.version>through).map(r=>r.version),through===86 ? [87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121] : [88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121]);
  if(existing) assert.deepEqual(await current(p,project.id,existing.id),existingRecord);
  const input={...raidInput(),action_ids:[action.id]}; await saveRaid(p,project.id,input);
  const recorded=await current(p,project.id,input.id), settled=await snapshot();
  await migrate(); await seed(); assert.deepEqual(await snapshot(),settled);
  assert.deepEqual(await current(p,project.id,input.id),recorded);
  assert.deepEqual((await database().query("SELECT * FROM public.ppo_migrations ORDER BY version")).rows,after);
});
