import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { createOpportunity, qualifyOpportunity, planOpportunityAction } from "../../src/crm/opportunities";
import { listOpportunities, worklistOptions } from "../../src/crm/worklist";
import { readOpportunity } from "../../src/crm/reads";
import { createActivity, readActivity } from "../../src/activities/activities";
import { readOperation } from "../../src/shared/receipts";
import { CRM, crmCreate, crmQualify, crmAction, crmBase } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") => (await createSession(profile)).principal;
const code = (name: string) => (e: unknown) => (e as { code: string }).code === name;
const snapshot = async () => Promise.all(["opportunities", "activities", "activity_links", "opportunity_events", "business_identities", "audit_events", "operation_receipts", "outbox_jobs", "reference_counters"].map(async (table) => (await database().query(`SELECT md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY to_jsonb(t)::text),'')) AS hash FROM ppo.${table} t`)).rows[0].hash));

test("CA-02/03/05 I2 shared result contract has stable tied sorts, exact page counts and no business effects", async () => {
  const p = await principal();
  const actionOwner = randomUUID();
  await database().query("INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN distinct action owner')", [actionOwner, CRM.workspace, randomUUID()]);
  await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2 AND capability NOT IN ('crm.opportunity.create','crm.opportunity.edit')", [actionOwner, CRM.owner]);
  const inputs = ["Zulu", "Alpha", "Alpha", "Echo", "Bravo"].map((title, index) => ({ ...crmCreate(), title: `SYN I2 ${title}`, ...(index === 4 ? { site_id: null, site_unknown_reason: "SYN not yet identified" } : {}) }));
  inputs[0].initial_action = crmAction(actionOwner);
  for (const input of inputs) await createOpportunity(p, input);
  const distinct = (await listOpportunities(p)).items.find(i => i.id === inputs[0].id)!;
  assert.equal(distinct.owner_id, CRM.owner);
  assert.equal(distinct.action_owner_id, actionOwner);
  assert.equal(distinct.action_owner_name, "SYN distinct action owner");
  await qualifyOpportunity(p, inputs[2].id, crmQualify());
  const before = await snapshot();
  for (const sort of ["Reference", "Title", "Newest"]) {
    const complete = await listOpportunities(p, { sort });
    assert.equal(complete.completeness, "Complete");
    assert.deepEqual(complete.stages.map((s) => [s.stage_id, s.ordinal, s.count]), [["Enquiry", 1, 4], ["Qualified", 2, 1]]);
    const found: string[] = [];
    let cursor: string | undefined;
    do {
      const result = await listOpportunities(p, { sort, limit: 2, ...(cursor ? { cursor } : {}) });
      assert.equal(result.completeness, "Partial");
      assert.equal(result.window.count_basis, "ReturnedPage");
      assert.equal(result.stages.reduce((n, s) => n + s.count, 0), result.items.length);
      assert.equal(result.window.first_page, !cursor);
      found.push(...result.items.map((o) => o.id));
      cursor = result.next_cursor ?? undefined;
    } while (cursor);
    assert.deepEqual(found, complete.items.map((o) => o.id));
    assert.equal(new Set(found).size, inputs.length);
    for (const item of complete.items) assert.equal((await readOpportunity(p, item.id)).id, item.id);
  }
  const sorted = (await listOpportunities(p, { sort: "Title" })).items;
  assert.deepEqual(sorted.map((i) => i.title), ["SYN I2 Alpha", "SYN I2 Alpha", "SYN I2 Bravo", "SYN I2 Echo", "SYN I2 Zulu"]);
  assert.ok(sorted[0].id < sorted[1].id);
  for (const filters of [{ q: "Alpha" }, { company_id: CRM.company, site_id: CRM.site }, { stage_id: "Qualified", owner_id: CRM.owner, next_action: "DueNeeded" }, { company_id: CRM.companyB }, { owner_id: randomUUID() }, { site_id: randomUUID() }]) {
    const result = await listOpportunities(p, filters);
    const matching = (await listOpportunities(p)).items.filter((i) => (!filters.q || i.title.includes(filters.q)) && (!filters.company_id || i.company_id === filters.company_id) && (!filters.site_id || i.site_id === filters.site_id) && (!filters.owner_id || i.owner_id === filters.owner_id) && (!filters.stage_id || i.stage_id === filters.stage_id) && (!filters.next_action || i.next_action_state === filters.next_action));
    assert.deepEqual(result.items, matching);
  }
  assert.deepEqual(await snapshot(), before);
});

test("CA-02/06 I2 cursors bind identity and every filter and detect changed authorised result windows", async () => {
  const p = await principal();
  const first = crmCreate(), second = crmCreate();
  await createOpportunity(p, first); await createOpportunity(p, second);
  const pg = await listOpportunities(p, { limit: 1, sort: "Title" });
  assert.ok(pg.next_cursor);
  for (const changed of [{ sort: "Newest" }, { q: "SYN" }, { company_id: CRM.company }, { site_id: CRM.site }, { owner_id: CRM.owner }, { stage_id: "Enquiry" }, { next_action: "DueNeeded" }, { limit: 2 }])
    await assert.rejects(listOpportunities(p, { limit: 1, sort: "Title", cursor: pg.next_cursor, ...changed }), code("InvalidData"));
  await qualifyOpportunity(p, second.id, crmQualify());
  await assert.rejects(listOpportunities(p, { limit: 1, sort: "Title", cursor: pg.next_cursor }), code("WorklistChanged"));
  const refreshed = await listOpportunities(p, { limit: 1, sort: "Title" });
  const third = crmCreate(); await createOpportunity(p, third);
  const terminal = await listOpportunities(p, { limit: 1, sort: "Title", cursor: refreshed.next_cursor! });
  assert.equal(terminal.window.as_of, refreshed.window.as_of);
  assert.equal(terminal.items.length, 1);
  assert.equal(terminal.next_cursor, null);
  assert.equal((await listOpportunities(p)).items.length, 3);
  for (const sort of ["money", "owner_id; DELETE", "title desc"]) await assert.rejects(listOpportunities(p, { sort }));
});

test("CA-06/10 I2 reader selectors, company/site/person boundaries and denied identities share opportunity scope", async () => {
  const p = await principal();
  const known = crmCreate(), unknown = { ...crmCreate(), site_id: null, site_unknown_reason: "SYN site not yet known" };
  await createOpportunity(p, known); await createOpportunity(p, unknown);
  const reader = await principal("site-observer");
  await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,user_id,company_id,c,'Site',scope_id,site_id FROM ppo.permission_grants CROSS JOIN unnest(ARRAY['crm.opportunity.read','shared.internal.read']) c WHERE user_id=$1 AND capability='shared.read' ON CONFLICT DO NOTHING", [reader.actor_id]);
  const list = await listOpportunities(reader);
  assert.deepEqual(list.items.map((i) => i.id), [known.id]);
  assert.equal(list.can_create, false);
  for (const [kind, expected] of [["Company", CRM.company], ["Site", CRM.site], ["Owner", CRM.owner]]) {
    const result = await worklistOptions(reader, { kind });
    assert.deepEqual(result.items.map((i) => i.id), [expected]);
    assert.equal((await worklistOptions(reader, { kind, company_id: CRM.companyB })).items.length, 0);
  }
  await assert.rejects(readOpportunity(reader, unknown.id), code("RecordUnavailable"));
  await assert.rejects(readOpportunity(reader, randomUUID()), code("RecordUnavailable"));
  await assert.rejects(listOpportunities(reader, { limit: 1, cursor: (await listOpportunities(p, { limit: 1 })).next_cursor! }), code("InvalidData"));
  // A site reader's person authority is independently derived from the actual primary-contact relationship.
  await database().query("UPDATE ppo.sites SET primary_contact_id=NULL,version=version+1 WHERE id=$1", [CRM.site]);
  assert.equal((await listOpportunities(reader)).items.length, 0);
  assert.equal((await worklistOptions(reader, { kind: "Owner" })).items.length, 0);
  await assert.rejects(readOpportunity(reader, known.id), code("RecordUnavailable"));
  for (const profile of ["systems", "technician", "other-workspace"]) {
    const denied = await principal(profile);
    await assert.rejects(listOpportunities(denied));
    await assert.rejects(worklistOptions(denied, { kind: "Company" }));
    await assert.rejects(readOpportunity(denied, known.id));
  }
  const missingDefinition = await principal("other-workspace");
  await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,capability,scope_type,scope_id) VALUES($1,$2,'crm.opportunity.read','Workspace',$1)", [missingDefinition.workspace_id, missingDefinition.actor_id]);
  await assert.rejects(listOpportunities(missingDefinition), code("PipelineUnavailable"));
});

test("CA-06/10 I2 all-target Activity content, aggregates and receipts obey current grant revocation", async () => {
  const p = await principal(), input = crmCreate();
  await createOpportunity(p, input);
  const mixed = { ...crmBase(), ...crmAction(), summary: "SYN I2 mixed target private content", company_id: CRM.company, site_id: CRM.site, access_class: "Internal", links: [{ object_type: "Opportunity", object_id: input.id }, { object_type: "Ticket", object_id: "40000000-0000-4000-8000-000000000020" }] };
  await createActivity(p, mixed);
  const plan = { ...crmBase(), expected_version: 1, activity_id: mixed.id };
  await planOpportunityAction(p, input.id, plan);
  assert.equal((await listOpportunities(p)).items[0].next_action_id, mixed.id);
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.ticket.read'", [p.actor_id]);
  const result = await listOpportunities(p, { next_action: "Unavailable" });
  assert.equal(result.stages[0].count, 1);
  assert.equal(result.items[0].next_action_summary, null);
  assert.equal(result.items[0].action_owner_id, null);
  assert.equal(result.items[0].action_owner_name, null);
  assert.equal(result.items[0].due_at, null);
  assert.ok(!JSON.stringify(result).includes(mixed.id));
  assert.ok(!JSON.stringify(result).includes(mixed.summary));
  assert.equal((await listOpportunities(p, { q: mixed.summary })).items.length, 0);
  await assert.rejects(readActivity(p, mixed.id));
  await assert.rejects(readOperation(p, plan.operation_id));
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'", [p.actor_id]);
  await assert.rejects(listOpportunities(p));
  await assert.rejects(worklistOptions(p, { kind: "Owner" }));
  await assert.rejects(readOpportunity(p, input.id));
  await assert.rejects(readOperation(p, input.operation_id));
});
