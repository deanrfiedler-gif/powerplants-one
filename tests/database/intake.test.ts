import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  database,
  transaction,
  closeDatabase,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { recordOperation } from "../../src/platform/operations";
import { reset, seed, migrate } from "../../scripts/database";
import {
  createTicket,
  saveIntake,
  requestInformation,
  triageTicket,
  readIntake,
  listTickets,
} from "../../src/service/intake";
import { saveDraft } from "../../src/service/tickets";
import {
  activityCommand,
  createActivity,
  listActivities,
  readActivity,
} from "../../src/activities/activities";
import {
  companyOptions,
  ownerOptions,
  personContext,
  siteHistory,
} from "../../src/shared/context";
import {
  assetHistory,
  customerContext,
  listShared,
  mappingViews,
} from "../../src/shared/reads";
import { createOrganisation, recordHistory } from "../../src/shared/commands";
import { readOperation } from "../../src/shared/receipts";
const id = (type: number, n = 1) =>
  `${type}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const company = id(20),
  site = id(70),
  actor = id(30),
  workspace = id(10),
  person = id(60),
  asset = id(80);
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN P03 behaviour verification",
});
const fields = () => ({
  received_at: "2026-09-04T00:00:00Z",
  channel: "Phone",
  requester_id: person,
  requester_description: null,
  site_id: site,
  site_identification_needed: false,
  asset_id: asset,
  summary: "SYN P03 intermittent fault",
  symptom: "Reported intermittent alarm.\nPrevious replacement did not fix it.",
  impact: "Monitoring interrupted",
  priority: "Urgent",
  priority_reason: "Urgency does not authorise work",
  triage_owner_id: actor,
  next_action: "Review OEM question",
});
const ticket = () => ({
  ...base(),
  id: randomUUID(),
  company_id: company,
  ...fields(),
});
const activity = () => ({
  ...base(),
  id: randomUUID(),
  company_id: company,
  site_id: site,
  kind: "TechnicalFollowUp",
  owner_id: actor,
  summary: "SYN owned technical question",
  due_at: null,
  due_needed: true,
  access_class: "RestrictedService",
  links: [{ object_type: "Asset", object_id: asset }],
});
const information = (version = 1) => ({
  ...base(),
  expected_version: version,
  open_questions: "Who called?\nWhich equipment?",
  next_action: "Obtain caller and equipment details",
  follow_up: {
    id: randomUUID(),
    owner_id: actor,
    due_needed: true,
    due_at: null,
  },
});
const code = (name: string) => (e: unknown) =>
  (e as { code?: string }).code === name;
const rows = async (q: string, values: unknown[] = []) =>
  (await database().query(q, values)).rows;

test("P03 migration preserves every P02 legacy field, accepted operation hash and original receipt; additive seed does not revive grants", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(2);
  await seed(2);
  const p = await principal(),
    draft = {
      ...base(),
      expected_version: 1,
      summary: "SYN preserved accepted P01 draft",
    };
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        command: "SaveTicketDraft",
        record_id: id(40),
        operation_id: draft.operation_id,
        expected_version: draft.expected_version,
        schema_version: 1,
        summary: draft.summary,
        reason: draft.reason,
      }),
    )
    .digest("hex");
  const receipt = await transaction(async (c) => {
    const row = (
      await c.query(
        "UPDATE ppo.tickets SET summary=$1,version=2,updated_at=clock_timestamp(),updated_by=$2 WHERE id=$3 RETURNING *",
        [draft.summary, p.actor_id, id(40)],
      )
    ).rows[0];
    return recordOperation(
      c,
      p,
      draft,
      { ...row, state: "New" },
      "Ticket",
      "TicketDraftSaved",
      hash,
      { previous_version: 1, record_version: 2 },
    );
  });
  const original = await rows("SELECT * FROM ppo.tickets ORDER BY id");
  const accepted = await rows("SELECT * FROM ppo.operation_receipts"),
    history = await rows("SELECT * FROM ppo.history_records ORDER BY id"),
    checksums = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.create'",
    [actor],
  );
  await migrate();
  await seed();
  await seed();
  const expanded = await rows(
    "SELECT * FROM ppo.tickets WHERE intake_schema_version=1 ORDER BY id",
  );
  assert.deepEqual(
    expanded.map((r) =>
      Object.fromEntries(Object.keys(original[0]).map((k) => [k, r[k]])),
    ),
    original,
  );
  assert.ok(
    expanded.every(
      (r) =>
        r.site_id === null &&
        r.requester_id === null &&
        r.impact === null &&
        r.next_action === null &&
        r.received_time_basis === "LegacyUnverified",
    ),
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.operation_receipts"),
    accepted,
  );
  assert.deepEqual(await saveDraft(p, id(40), draft), receipt);
  assert.deepEqual(await readOperation(p, draft.operation_id), receipt);
  assert.deepEqual(
    await rows("SELECT * FROM ppo.history_records ORDER BY id"),
    history,
  );
  assert.deepEqual(
    await rows(
      "SELECT * FROM public.ppo_migrations WHERE version<=2 ORDER BY version",
    ),
    checksums,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.create'",
        [actor],
      )
    )[0].n,
    0,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM public.ppo_migrations"))[0].n,
    3,
  );
});

test("scoped search/traversal, same-name organisations, shared contacts, exact keys and safe customer/owner selectors", async () => {
  const p = await principal(),
    siteOnly = await principal("site-observer"),
    b = await principal("second-company"),
    sys = await principal("systems");
  assert.equal(
    (await listShared(p, "Organisation", { q: "SYN Greenhouse Demonstration" }))
      .items.length,
    2,
  );
  assert.equal((await personContext(p, person)).affiliations.length, 1);
  assert.equal((await personContext(b, person)).affiliations.length, 1);
  assert.equal((await personContext(siteOnly, person)).affiliations.length, 0);
  assert.equal((await mappingViews(p, id(50)))[0].customer_id, "000Ab-C.01");
  assert.equal((await mappingViews(b, id(50, 3)))[0].customer_id, "000ab-C.01");
  assert.ok(
    !JSON.stringify((await customerContext(p, id(50))).mappings).includes(
      "000Ab",
    ),
  );
  assert.ok(!JSON.stringify(await companyOptions(p)).includes("erp_"));
  assert.equal(
    (await listShared(p, "Asset", { q: "SYN-PPO-AST-000001" })).items.length,
    1,
  );
  const owners = await ownerOptions(p, {
    company_id: company,
    site_id: site,
    purpose: "Ticket",
  });
  assert.deepEqual(
    owners.items.map((u) => u.id),
    [actor],
  );
  await assert.rejects(
    ownerOptions(p, { company_id: id(20, 2), purpose: "Ticket" }),
    code("RecordUnavailable"),
  );
  await assert.rejects(companyOptions(sys), code("Forbidden"));
  await assert.rejects(
    ownerOptions(p, {
      company_id: company,
      purpose: "Activity",
      access_class: "RestrictedFinance",
    }),
    code("RecordUnavailable"),
  );
  assert.equal((await listTickets(siteOnly)).items.length, 1);
  await assert.rejects(readIntake(siteOnly, id(40)), code("RecordUnavailable"));
  assert.equal((await listTickets(b)).items.length, 1);
  await assert.rejects(readIntake(b, id(40, 10)), code("RecordUnavailable"));
  const first = await listTickets(p, { limit: "1" });
  await assert.rejects(
    listTickets(siteOnly, { limit: "1", cursor: first.next_cursor! }),
    code("InvalidData"),
  );
});

test("incomplete urgent intake saves explicit unknowns; invalid and valid TR-01 transitions retain separate authority", async () => {
  const p = await principal(),
    c = {
      ...ticket(),
      requester_id: null,
      requester_description: "Caller identity needs clarification",
      site_id: null,
      site_identification_needed: true,
      asset_id: null,
      impact: null,
      priority_reason: null,
    };
  await createTicket(p, c);
  const t = await readIntake(p, c.id);
  assert.equal(t.status, "New");
  assert.equal(t.priority, "Urgent");
  assert.ok(t.triage_blockers.some((x) => x.field === "site_id"));
  await assert.rejects(
    triageTicket(p, c.id, { ...base(), expected_version: 1 }),
    code("TICKET_TRIAGE_BLOCKED"),
  );
  const q = information();
  await requestInformation(p, c.id, q);
  assert.equal((await readIntake(p, c.id)).status, "NeedsInformation");
  assert.deepEqual(
    (await requestInformation(p, c.id, q)).receipt,
    await readOperation(p, q.operation_id),
  );
  await assert.rejects(
    requestInformation(p, c.id, { ...information(2) }),
    code("TICKET_STATE_INVALID"),
  );
  await saveIntake(p, c.id, { ...base(), expected_version: 2, ...fields() });
  await assert.rejects(
    triageTicket(p, c.id, {
      ...base(),
      expected_version: 3,
      clarification_outcome: "Recorded details",
    }),
    code("TICKET_TRIAGE_BLOCKED"),
  );
  await activityCommand(
    p,
    q.follow_up.id,
    {
      ...base(),
      expected_version: 1,
      outcome: "Caller and site confirmed; original question retained",
    },
    "complete",
  );
  const tr = {
    ...base(),
    expected_version: 3,
    clarification_outcome: "Requester and site questions resolved",
  };
  await triageTicket(p, c.id, tr);
  assert.equal((await readIntake(p, c.id)).status, "Triaged");
  assert.equal((await readOperation(p, tr.operation_id)).state, "Triaged");
  assert.equal((await triageTicket(p, c.id, tr)).replayed, true);
  await assert.rejects(
    saveIntake(p, c.id, { ...base(), expected_version: 4, ...fields() }),
    code("TICKET_STATE_INVALID"),
  );
  const direct = ticket();
  await createTicket(p, direct);
  await triageTicket(p, direct.id, { ...base(), expected_version: 1 });
  assert.equal((await readIntake(p, direct.id)).status, "Triaged");
  assert.equal(
    (await rows("SELECT to_regclass('ppo.work_orders') AS table"))[0].table,
    null,
  );
});

test("activity lifecycle requires owned outcomes/reasons and distinguishes due-needed, overdue, upcoming and terminal records", async () => {
  const p = await principal(),
    a = activity();
  await createActivity(p, a);
  assert.ok(
    (await listActivities(p, { due: "Needed", status: "Active" })).items.some(
      (x) => x.id === a.id,
    ),
  );
  assert.ok(
    (await listActivities(p, { due: "Overdue", status: "Active" })).items.some(
      (x) => x.id === id(85),
    ),
  );
  const future = {
    ...activity(),
    due_at: new Date(Date.now() + 86400000).toISOString(),
    due_needed: false,
  };
  await createActivity(p, future);
  assert.ok(
    (await listActivities(p, { due: "Upcoming", status: "Active" })).items.some(
      (x) => x.id === future.id,
    ),
  );
  await assert.rejects(
    activityCommand(
      p,
      a.id,
      { ...base(), expected_version: 1, outcome: "" },
      "complete",
    ),
    code("InvalidData"),
  );
  await activityCommand(p, a.id, { ...base(), expected_version: 1 }, "start");
  await activityCommand(
    p,
    a.id,
    {
      ...base(),
      expected_version: 2,
      outcome: "OEM advice received.\nResolution remains to be reviewed.",
    },
    "complete",
  );
  assert.equal((await readActivity(p, a.id)).status, "Completed");
  assert.match((await readActivity(p, a.id)).outcome!, /\n/);
  await assert.rejects(
    activityCommand(
      p,
      a.id,
      { ...base(), expected_version: 3, cancellation_reason: "Change mind" },
      "cancel",
    ),
    code("ACTIVITY_STATE_INVALID"),
  );
  const other = activity();
  await createActivity(p, other);
  await activityCommand(
    p,
    other.id,
    {
      ...base(),
      expected_version: 1,
      cancellation_reason: "No longer required; original context retained",
    },
    "cancel",
  );
  assert.equal((await readActivity(p, other.id)).status, "Cancelled");
  await assert.rejects(
    createActivity(p, { ...activity(), due_needed: false }),
    code("InvalidData"),
  );
});

test("activity links have real targets and all-target access, including owner, Finance, site and future-record refusals", async () => {
  const p = await principal(),
    obs = await principal("observer"),
    siteOnly = await principal("site-observer"),
    finance = await principal("finance");
  for (const link of [
    { object_type: "WorkOrder", object_id: randomUUID() },
    { object_type: "Asset", object_id: randomUUID() },
  ])
    await assert.rejects(createActivity(p, { ...activity(), links: [link] }));
  await assert.rejects(
    createActivity(p, { ...activity(), owner_id: id(30, 3) }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    createActivity(p, {
      ...activity(),
      site_id: null,
      links: [{ object_type: "Site", object_id: id(70, 3) }],
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(createActivity(obs, activity()), code("Forbidden"));
  const mixed = {
    ...activity(),
    site_id: null,
    links: [
      { object_type: "Site", object_id: site },
      { object_type: "Site", object_id: id(70, 2) },
    ],
  };
  await createActivity(p, mixed);
  assert.ok(
    !(await listActivities(siteOnly)).items.some((x) => x.id === mixed.id),
  );
  await assert.rejects(
    readActivity(siteOnly, mixed.id),
    code("RecordUnavailable"),
  );
  assert.ok(!(await listActivities(p)).items.some((x) => x.id === id(85, 6)));
  await assert.rejects(readActivity(p, id(85, 6)), code("RecordUnavailable"));
  assert.equal((await readActivity(finance, id(85, 6))).kind, "FinanceQuery");
  const a = activity();
  await createActivity(p, a);
  await database().query("UPDATE ppo.activities SET owner_id=$1 WHERE id=$2", [
    id(30, 5),
    a.id,
  ]);
  await assert.rejects(
    activityCommand(
      p,
      a.id,
      {
        ...base(),
        expected_version: 1,
        outcome: "Cannot finish someone else's action",
      },
      "complete",
    ),
    code("ACTIVITY_OWNER_REQUIRED"),
  );
  // Even SQL cannot point a supported target at a dangling UUID.
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,'Ticket',$4)",
      [workspace, company, a.id, randomUUID()],
    ),
    (e: unknown) => (e as { code: string }).code === "23503",
  );
});

test("concurrent allocation, competing edits and accepted retries preserve ticket/activity versions and unique identities", async () => {
  const p = await principal(),
    commands = Array.from({ length: 12 }, ticket);
  const created = await Promise.all(commands.map((c) => createTicket(p, c)));
  assert.equal(new Set(created.map((c) => c.receipt.record_id)).size, 12);
  const refs = await rows(
    "SELECT display_number FROM ppo.tickets WHERE id=ANY($1::uuid[])",
    [commands.map((c) => c.id)],
  );
  assert.equal(new Set(refs.map((r) => r.display_number)).size, 12);
  const c = ticket(),
    result = await Promise.all([createTicket(p, c), createTicket(p, { ...c })]);
  assert.deepEqual(result[0].receipt, result[1].receipt);
  await assert.rejects(
    createTicket(p, { ...c, summary: "Different payload" }),
    code("OperationConflict"),
  );
  const competing = await Promise.allSettled([
    saveIntake(p, c.id, {
      ...base(),
      expected_version: 1,
      ...fields(),
      summary: "First writer",
    }),
    saveIntake(p, c.id, {
      ...base(),
      expected_version: 1,
      ...fields(),
      summary: "Second writer",
    }),
  ]);
  assert.equal(competing.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await readIntake(p, c.id)).version, 2);
  // P01 retains a separate hash/receipt path; both generations must still compete on the same row.
  const legacyRace = await Promise.allSettled([
    saveDraft(p, c.id, {
      ...base(),
      expected_version: 2,
      summary: "P01 competing writer",
    }),
    saveIntake(p, c.id, {
      ...base(),
      expected_version: 2,
      ...fields(),
      summary: "P03 competing writer",
    }),
  ]);
  assert.equal(legacyRace.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    legacyRace.filter(
      (r) => r.status === "rejected" && code("VersionConflict")(r.reason),
    ).length,
    1,
  );
  assert.equal((await readIntake(p, c.id)).version, 3);
  const a = activity();
  await createActivity(p, a);
  const update = {
    ...base(),
    expected_version: 1,
    owner_id: actor,
    summary: "Revised question",
    due_needed: true,
    due_at: null,
  };
  const retries = await Promise.all([
    activityCommand(p, a.id, update, "update"),
    activityCommand(p, a.id, update, "update"),
  ]);
  assert.deepEqual(retries[0].receipt, retries[1].receipt);
  await assert.rejects(
    activityCommand(
      p,
      a.id,
      { ...update, operation_id: randomUUID() },
      "update",
    ),
    code("VersionConflict"),
  );
  const race = await Promise.allSettled([
    activityCommand(
      p,
      a.id,
      { ...base(), expected_version: 2, outcome: "Done" },
      "complete",
    ),
    activityCommand(
      p,
      a.id,
      { ...base(), expected_version: 2, cancellation_reason: "Stopped" },
      "cancel",
    ),
  ]);
  assert.equal(race.filter((x) => x.status === "fulfilled").length, 1);
});

test("current permission governs accepted ticket/activity replay and receipts after revocation", async () => {
  const p = await principal(),
    c = ticket(),
    a = activity();
  await createTicket(p, c);
  await createActivity(p, a);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability IN ('service.ticket.edit','activity.edit')",
    [actor],
  );
  await assert.rejects(createTicket(p, c));
  await assert.rejects(createActivity(p, a));
  await assert.rejects(readOperation(p, c.operation_id));
  await assert.rejects(readOperation(p, a.operation_id));
  await seed();
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.permission_grants WHERE user_id=$1 AND capability='activity.edit'",
        [actor],
      )
    )[0].n,
    0,
  );
});

test("request-information changes roll back atomically when activity, link, audit, receipt or final outbox persistence fails", async () => {
  const p = await principal();
  for (const table of [
    "activities",
    "activity_links",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ]) {
    const c = ticket();
    await createTicket(p, c);
    const q = information();
    const before = await rows(
      "SELECT last_value FROM ppo.reference_counters ORDER BY workspace_id,record_type",
    );
    await database().query(
      `CREATE FUNCTION ppo.fail_p03_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN injected transaction failure'; END $$; CREATE TRIGGER fail_p03 BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.fail_p03_write()`,
    );
    await assert.rejects(requestInformation(p, c.id, q));
    await database().query(
      `DROP TRIGGER fail_p03 ON ppo.${table}; DROP FUNCTION ppo.fail_p03_write()`,
    );
    assert.equal((await readIntake(p, c.id)).version, 1);
    assert.equal((await readIntake(p, c.id)).status, "New");
    assert.equal(
      (
        await rows("SELECT count(*)::int n FROM ppo.activities WHERE id=$1", [
          q.follow_up.id,
        ])
      )[0].n,
      0,
    );
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int n FROM ppo.business_identities WHERE id=$1",
          [q.follow_up.id],
        )
      )[0].n,
      0,
    );
    for (const evidence of [
      "audit_events",
      "operation_receipts",
      "outbox_jobs",
    ])
      assert.equal(
        (
          await rows(
            `SELECT count(*)::int n FROM ppo.${evidence} WHERE operation_id=$1`,
            [q.operation_id],
          )
        )[0].n,
        0,
      );
    assert.deepEqual(
      await rows(
        "SELECT last_value FROM ppo.reference_counters ORDER BY workspace_id,record_type",
      ),
      before,
    );
    await requestInformation(p, c.id, q);
    assert.equal((await readIntake(p, c.id)).status, "NeedsInformation");
  }
});

test("immutable unsuccessful fix, historical attribution and uncertainty coexist with real OEM follow-up and multiline capture", async () => {
  const p = await principal(),
    h = await assetHistory(p, asset),
    limited = await assetHistory(await principal("site-observer"), asset);
  assert.ok(JSON.stringify(h.items).includes("did not resolve"));
  assert.ok(h.items.length > limited.items.length);
  const follow = (
    await listActivities(p, { object_type: "Asset", object_id: asset })
  ).items;
  assert.ok(follow.some((a) => a.id === id(85)));
  await recordHistory(p, site, {
    ...base(),
    id: randomUUID(),
    expected_version: 1,
    asset_id: asset,
    occurred_at: "2026-09-04T00:00:00Z",
    author_label: "SYN Original source engineer",
    kind: "AttemptedFix",
    summary: "Replaced cable.\nIssue remains unresolved.",
    confidence: "Reported",
    source_system: "OEM-Query",
    source_id: "000aB.C-01",
  });
  const after = await siteHistory(p, site);
  assert.ok(
    after.items.some(
      (x) => x.summary.includes("\n") && x.source_id === "000aB.C-01",
    ),
  );
  const original = await rows("SELECT * FROM ppo.history_records WHERE id=$1", [
    id(83),
  ]);
  await assert.rejects(
    database().query(
      "UPDATE ppo.history_records SET summary='Erase prior evidence' WHERE id=$1",
      [id(83)],
    ),
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.history_records WHERE id=$1", [id(83)]),
    original,
  );
});

test("fresh/repeated seed preserves deliberate P03 edits, counters, terminal outcomes and revoked grants across connection restart", async () => {
  const p = await principal(),
    c = ticket();
  await createTicket(p, c);
  const a = activity();
  await createActivity(p, a);
  await activityCommand(
    p,
    a.id,
    { ...base(), expected_version: 1, outcome: "SYN completed deliberately" },
    "complete",
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.history.record'",
    [actor],
  );
  const before = {
    tickets: await rows("SELECT * FROM ppo.tickets ORDER BY id"),
    activities: await rows("SELECT * FROM ppo.activities ORDER BY id"),
    links: await rows(
      "SELECT * FROM ppo.activity_links ORDER BY activity_id,object_type,object_id",
    ),
    counters: await rows(
      "SELECT * FROM ppo.reference_counters ORDER BY workspace_id,record_type",
    ),
  };
  await seed();
  await migrate();
  await seed();
  await closeDatabase();
  assert.deepEqual(
    await rows("SELECT * FROM ppo.tickets ORDER BY id"),
    before.tickets,
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.activities ORDER BY id"),
    before.activities,
  );
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.activity_links ORDER BY activity_id,object_type,object_id",
    ),
    before.links,
  );
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.reference_counters ORDER BY workspace_id,record_type",
    ),
    before.counters,
  );
  assert.equal(
    (await readActivity(p, a.id)).outcome,
    "SYN completed deliberately",
  );
});

test("unlisted authority fields, invalid dates, out-of-scope requester/site and current P01 summary hashing are rejected or retained", async () => {
  const p = await principal();
  for (const changed of [
    { actor_id: actor },
    { status: "Triaged" },
    { received_at: "2026-02-30T00:00:00Z" },
    { site_id: id(70, 3) },
    { requester_id: id(60, 2) },
    { summary: "bad\u0000text" },
  ])
    await assert.rejects(createTicket(p, { ...ticket(), ...changed }));
  const original = {
    ...base(),
    expected_version: 1,
    summary: "SYN P01 compatibility",
  };
  const first = await saveDraft(p, id(40), original);
  assert.deepEqual(await saveDraft(p, id(40), original), first);
  await createOrganisation(p, {
    ...base(),
    id: randomUUID(),
    company_id: company,
    display_name: "SYN customer still works",
    relationship_status: "Prospect",
    owner_id: actor,
  });
});
