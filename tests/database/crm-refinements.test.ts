import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import { readOpportunity, listOpportunities } from "../../src/crm/reads";
import {
  editDealInformation,
  editDealScope,
  changeDealStage,
} from "../../src/crm/refinements";
import {
  readDirectory,
  readDirectoryViews,
  saveDirectoryViews,
} from "../../src/crm/directory";
import { CRM, crmCreate, crmBase, crmDiscovery } from "../helpers/crm";
import { recordOpportunityOutcome } from "../../src/crm/outcomes";
import { readOperation } from "../../src/shared/receipts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const information = (version = 1) => ({
  ...crmBase(),
  expected_version: version,
  title: "SYN Refined controls upgrade",
  primary_person_id: CRM.person,
  contact_unknown_reason: null,
  value_amount: "12,345.67",
  expected_close_date: "2026-11-30",
});
const stage = (version: number, stage_id: string) => ({
  ...crmBase(),
  expected_version: version,
  stage_id,
  qualification_note:
    stage_id === "Qualified" ? "SYN Need and contact confirmed" : null,
  identification_activity_id: null,
});
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
const outcome = (expected_version: number, close_outcome = "Lost", lost_reason: string | null = "Timing") => ({
  ...crmBase(), expected_version, close_outcome,
  lost_reason: close_outcome === "Lost" ? lost_reason : null,
  acceptance_evidence: close_outcome === "Won" ? "SYN Accepted fictional scope at customer review; no external order." : null,
});
async function closing(p: Awaited<ReturnType<typeof principal>>, id: string) {
  let version = 1;
  for (const next of ["Scoping", "Quoting", "Negotiation", "Closing"])
    await changeDealStage(p, id, stage(version++, next));
}
test("Won from Closing records one owned handover due and preserves original activities and receipts", async () => {
  const p = await principal(), input = crmDiscovery();
  await createOpportunity(p,input);
  await assert.rejects(recordOpportunityOutcome(p,input.id,outcome(1,"Won")),code("CRM_WON_REQUIRES_CLOSING"));
  await closing(p,input.id);
  const before = await readOpportunity(p,input.id), body = outcome(5,"Won");
  const result = await recordOpportunityOutcome(p,input.id,body);
  assert.equal(result.receipt.state,"Won");
  assert.equal(result.receipt.record_version,6);
  assert.deepEqual((await recordOpportunityOutcome(p,input.id,body)).receipt,result.receipt);
  assert.deepEqual(await readOperation(p,body.operation_id),result.receipt);
  const saved = await readOpportunity(p,input.id);
  assert.equal(saved.close_outcome,"Won");
  assert.equal(saved.stage_id,"Closing");
  assert.deepEqual(saved.actions,before.actions);
  assert.deepEqual(saved.events.slice(0,-1),before.events);
  assert.equal(saved.events.at(-1).acceptance_evidence,body.acceptance_evidence);
  assert.equal(saved.handover_due?.owner_id,input.owner_id);
  assert.equal(saved.handover_due?.opportunity_version,6);
  assert.equal(saved.can_record_outcome,false);
  assert.equal((await database().query("SELECT count(*)::int AS n FROM ppo.opportunity_handovers_due WHERE opportunity_id=$1",[input.id])).rows[0].n,1);
  assert.equal((await database().query("SELECT count(*)::int AS n FROM ppo.outbox_jobs WHERE operation_id=$1",[body.operation_id])).rows[0].n,1);
  await assert.rejects(recordOpportunityOutcome(p,input.id,{...body,reason:"SYN changed original"}),code("OperationConflict"));
  await assert.rejects(recordOpportunityOutcome(p,input.id,outcome(6)),code("CRM_OUTCOME_CLOSED"));
  await assert.rejects(changeDealStage(p,input.id,stage(6,"Discovery")),code("CRM_OUTCOME_CLOSED"));
  // Existing information rights remain; they cannot rewrite the original handover basis.
  await editDealInformation(p,input.id,information(6));
  assert.deepEqual((await readOpportunity(p,input.id)).handover_due,saved.handover_due);
  assert.deepEqual((await recordOpportunityOutcome(p,input.id,body)).receipt,result.receipt);
});
test("Lost requires a structured reason at each stage and Board/List queries explicitly select outcomes", async () => {
  const p = await principal();
  for (const [index,target] of ["Discovery","Scoping","Quoting","Negotiation","Closing"].entries()) {
    const input = crmDiscovery(); await createOpportunity(p,input);
    const stages = ["Scoping","Quoting","Negotiation","Closing"];
    for (let n=0;n<index;n++) await changeDealStage(p,input.id,stage(n+1,stages[n]));
    const before = await readOpportunity(p,input.id), body = outcome(index+1,"Lost",["Price","Competitor","Timing","No decision","Price"][index]);
    await assert.rejects(recordOpportunityOutcome(p,input.id,{...body,lost_reason:null}),code("InvalidData"));
    await recordOpportunityOutcome(p,input.id,body);
    const saved = await readOpportunity(p,input.id);
    assert.equal(saved.stage_id,target); assert.equal(saved.close_outcome,"Lost");
    assert.equal(saved.events.at(-1).lost_reason,body.lost_reason);
    assert.equal(saved.handover_due,null); assert.deepEqual(saved.actions,before.actions);
    const filter = {pipeline_definition_id:input.pipeline_definition_id,q:input.title};
    assert.ok(!(await listOpportunities(p,filter)).items.some(o=>o.id===input.id));
    assert.ok((await listOpportunities(p,{...filter,outcome:"Lost"})).items.some(o=>o.id===input.id));
    assert.ok(!(await listOpportunities(p,{...filter,outcome:"Won"})).items.some(o=>o.id===input.id));
  }
});
test("competing outcomes accept one original; stale, scoped, legacy and reopened proposals have no effects", async () => {
  const p = await principal(), input = crmDiscovery(); await createOpportunity(p,input);
  await assert.rejects(recordOpportunityOutcome(await principal("observer"),input.id,outcome(1)));
  await assert.rejects(recordOpportunityOutcome(await principal("second-company"),input.id,outcome(1)));
  const results = await Promise.allSettled([recordOpportunityOutcome(p,input.id,outcome(1)),recordOpportunityOutcome(p,input.id,outcome(1,"Lost","Competitor"))]);
  assert.equal(results.filter(r=>r.status==="fulfilled").length,1);
  assert.equal((await readOpportunity(p,input.id)).version,2);
  for (const assignment of ["close_outcome='Open'","stage_id='Scoping'"])
    await assert.rejects(transaction(c=>c.query(`UPDATE ppo.opportunities SET ${assignment},version=version+1 WHERE id=$1`,[input.id])));
  const legacy=crmCreate(); await createOpportunity(p,legacy);
  await assert.rejects(recordOpportunityOutcome(p,legacy.id,outcome(1)),code("CRM_OUTCOME_PIPELINE"));
  assert.equal((await readOpportunity(p,legacy.id)).close_outcome,"Open");
});
test("SQL cannot close without the exact outcome event or insert a handover for an open opportunity", async () => {
  const p=await principal(),input=crmDiscovery(); await createOpportunity(p,input);
  await assert.rejects(transaction(c=>c.query("UPDATE ppo.opportunities SET close_outcome='Lost',version=version+1 WHERE id=$1",[input.id])));
  await assert.rejects(transaction(c=>c.query(`INSERT INTO ppo.opportunity_handovers_due(workspace_id,company_id,opportunity_id,outcome_event_id,opportunity_version,owner_id,created_by,created_at)
    SELECT workspace_id,company_id,opportunity_id,id,2,created_by,created_by,created_at FROM ppo.opportunity_events WHERE opportunity_id=$1`,[input.id])));
  assert.equal((await readOpportunity(p,input.id)).version,1);
});
test("core and scope commands persist separate data, replay once and retain next action and exact history", async () => {
  const p = await principal(),
    input = crmCreate();
  await createOpportunity(p, input);
  const body = information();
  const result = await editDealInformation(p, input.id, body);
  assert.equal(result.receipt.record_version, 2);
  assert.equal((await editDealInformation(p, input.id, body)).replayed, true);
  let saved = await readOpportunity(p, input.id);
  assert.equal(saved.title, body.title);
  assert.equal(saved.value_amount, "12345.67");
  assert.equal(saved.expected_close_date, "2026-11-30");
  assert.equal(saved.need_summary, input.need_summary);
  assert.equal(saved.next_activity?.id, input.initial_action.id);
  await editDealScope(p, input.id, {
    ...crmBase(),
    expected_version: 2,
    need_summary: "SYN Defined growing requirements",
    scope_details: {
      inclusions: "SYN Sensors",
      exclusions: "SYN Civil works",
      acceptance: "SYN Commissioning review",
    },
  });
  saved = await readOpportunity(p, input.id);
  assert.equal(saved.version, 3);
  assert.equal(saved.value_amount, "12345.67");
  assert.equal(saved.scope_details.exclusions, "SYN Civil works");
  const events = (
    await database().query(
      "SELECT event_type,record_snapshot FROM ppo.opportunity_events WHERE opportunity_id=$1 ORDER BY opportunity_version",
      [input.id],
    )
  ).rows;
  assert.deepEqual(
    events.map((e) => e.event_type),
    [
      "OpportunityCreated",
      "OpportunityInformationEdited",
      "OpportunityScopeEdited",
    ],
  );
  assert.equal(events[1].record_snapshot.title, body.title);
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int AS n FROM ppo.outbox_jobs WHERE operation_id=$1",
        [body.operation_id],
      )
    ).rows[0].n,
    1,
  );
  await assert.rejects(
    editDealInformation(p, input.id, information(1)),
    code("VersionConflict"),
  );
  await assert.rejects(
    editDealInformation(await principal("observer"), input.id, information(3)),
  );
});
test("stage moves preserve qualification gates, reversible history, active actions and optimistic undo", async () => {
  const p = await principal(),
    input = crmCreate();
  await createOpportunity(p, input);
  await changeDealStage(p, input.id, stage(1, "Qualified"));
  await changeDealStage(p, input.id, stage(2, "Enquiry"));
  let o = await readOpportunity(p, input.id);
  assert.equal(o.stage_id, "Enquiry");
  assert.equal(o.qualification_note, null);
  assert.equal(
    o.events[1].qualification_note,
    "SYN Need and contact confirmed",
  );
  assert.equal(o.next_activity?.id, input.initial_action.id);
  await editDealInformation(p, input.id, information(3));
  await assert.rejects(
    changeDealStage(p, input.id, stage(3, "Qualified")),
    code("VersionConflict"),
  );
  const unknown = crmCreate();
  unknown.primary_person_id = null;
  unknown.contact_unknown_reason = "SYN Awaiting introduction";
  await createOpportunity(p, unknown);
  await assert.rejects(
    changeDealStage(p, unknown.id, stage(1, "Qualified")),
    code("CRM_IDENTIFICATION_REQUIRED"),
  );
  await changeDealStage(p, unknown.id, {
    ...stage(1, "Qualified"),
    identification_activity_id: unknown.initial_action.id,
  });
  o = await readOpportunity(p, unknown.id);
  assert.equal(o.stage_id, "Qualified");
});
test("database refuses unaudited information or scope changes and non-finite money", async () => {
  const p = await principal(),
    input = crmCreate();
  await createOpportunity(p, input);
  for (const sql of [
    "title='SYN unaudited'",
    'scope_details=\'{"inclusions":"SYN unaudited"}\'::jsonb',
    "value_amount='NaN'::numeric",
  ]) {
    await assert.rejects(
      transaction(async (c) => {
        await c.query(
          `UPDATE ppo.opportunities SET ${sql},version=version+1 WHERE id=$1`,
          [input.id],
        );
      }),
    );
  }
  await migrate();
  assert.equal((await readOpportunity(p, input.id)).version, 1);
});
test("directories scope affiliations and counts, search channels, sort and isolate saved views", async () => {
  const p = await principal();
  const orgs = await readDirectory(p, { kind: "organisations" });
  assert.ok(orgs.items.length);
  assert.ok(orgs.items.some((r) => r.id === CRM.org && r.sites > 0));
  const people = await readDirectory(p, { kind: "people" });
  const person = people.items.find((r) => r.id === CRM.person)!;
  assert.ok(person.organisations.some((o) => o.id === CRM.org));
  if (person.email)
    assert.ok(
      (await readDirectory(p, { kind: "people", q: person.email })).items.some(
        (r) => r.id === person.id,
      ),
    );
  const other = await readDirectory(await principal("second-company"), {
    kind: "organisations",
  });
  assert.ok(other.items.every((r) => r.id !== CRM.org));
  const view = {
    name: "Active contacts",
    q: "",
    status: "Active",
    mine: "false",
    sort: "name",
    direction: "asc",
    limit: "25",
    columns: ["name", "email", "phone"],
  };
  const saved = await saveDirectoryViews(p, {
    kind: "people",
    expected_version: 0,
    views: [view],
  });
  assert.equal(saved.version, 1);
  assert.equal(
    (await readDirectoryViews(p, "people")).views[0].name,
    view.name,
  );
  assert.deepEqual(
    (await readDirectoryViews(await principal("observer"), "people")).views,
    [],
  );
  await assert.rejects(
    saveDirectoryViews(p, { kind: "people", expected_version: 0, views: [] }),
    code("VersionConflict"),
  );
});


test("SA-02/03/05/12 qualified Discovery creation and five-column reads retain original receipts and history", async () => {
  const p = await principal(); const input = crmDiscovery();
  const created = await createOpportunity(p, input);
  assert.equal(created.receipt.state, "Discovery");
  assert.equal(created.receipt.record_version, 1);
  const replay = await createOpportunity(p, input);
  assert.equal(replay.replayed, true); assert.deepEqual(replay.receipt, created.receipt);
  const initial = await readOpportunity(p, input.id);
  assert.equal(initial.qualification_note, input.qualification_note);
  assert.equal(initial.events.length, 1);
  const list = await listOpportunities(p, { pipeline_definition_id: input.pipeline_definition_id });
  assert.deepEqual(list.stages.map(s => s.stage_id), ["Discovery", "Scoping", "Quoting", "Negotiation", "Closing"]);
  assert.deepEqual(list.items.map(i => i.id), [input.id]);
  await assert.rejects(changeDealStage(p, input.id, stage(1, "Quoting")), code("CRM_PROGRESS_INVALID"));
  let version = 1;
  for (const next of ["Scoping", "Quoting", "Negotiation", "Closing", "Scoping", "Quoting"]) {
    await changeDealStage(p, input.id, stage(version++, next));
    const current = await readOpportunity(p, input.id);
    assert.equal(current.qualification_note, input.qualification_note);
    assert.equal(current.version, version);
    assert.equal(current.events.at(-1)?.created_at.toISOString(), current.stage_entered_at);
  }
  const final = await readOpportunity(p, input.id);
  assert.deepEqual(final.events.slice(0, 1), initial.events);
  await closeDatabase();
  assert.deepEqual((await readOpportunity(p, input.id)).events, final.events);
});

test("SA-02 a Discovery unknown contact is bound to its own active identification action", async () => {
  const p = await principal(); const input = crmDiscovery();
  input.primary_person_id = null;
  input.contact_unknown_reason = "SYN named contact must be identified";
  input.initial_action.summary = "SYN identify the named customer contact before scope confirmation";
  await createOpportunity(p, input);
  const saved = await readOpportunity(p, input.id);
  assert.equal(saved.identification_activity_id, input.initial_action.id);
  assert.equal(saved.next_activity?.owner_id, input.owner_id);
  assert.equal(saved.qualification_note, input.qualification_note);
  await changeDealStage(p, input.id, stage(1, "Scoping"));
  assert.equal((await readOpportunity(p, input.id)).identification_activity_id, input.initial_action.id);
});

test("five-stage database guard refuses rewritten qualification even with a matching stage event", async () => {
  const p = await principal(); const input = crmDiscovery();
  await createOpportunity(p, input);
  const before = await readOpportunity(p, input.id);
  await assert.rejects(transaction(async c => {
    await c.query("UPDATE ppo.opportunities SET stage_id='Scoping',qualification_note='SYN forged replacement',version=version+1,stage_entered_at=clock_timestamp(),updated_at=clock_timestamp() WHERE id=$1", [input.id]);
    await c.query(`INSERT INTO ppo.opportunity_events(id,workspace_id,company_id,opportunity_id,created_by,updated_by,operation_id,opportunity_version,event_type,pipeline_definition_id,from_stage,to_stage,next_activity_id,identification_activity_id,reason,need_summary,qualification_note,record_snapshot,created_at)
      SELECT gen_random_uuid(),workspace_id,company_id,id,updated_by,updated_by,gen_random_uuid(),version,'OpportunityStageChanged',pipeline_definition_id,'Discovery',stage_id,next_activity_id,identification_activity_id,'SYN guard challenge',need_summary,qualification_note,ppo.crm_record_snapshot(o),stage_entered_at FROM ppo.opportunities o WHERE id=$1`, [input.id]);
  }), /Five-stage qualification evidence is retained/);
  const after = await readOpportunity(p, input.id);
  assert.equal(after.version, before.version); assert.deepEqual(after.events, before.events);
});
