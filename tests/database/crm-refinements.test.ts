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
import { readOpportunity } from "../../src/crm/reads";
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
import { CRM, crmCreate, crmBase } from "../helpers/crm";
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
