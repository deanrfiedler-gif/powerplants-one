import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { cancelAppointment } from "../../src/scheduling/planner";
import {
  readWorkOrderRegister,
  readWorkOrderRecord,
} from "../../src/service/work-order-register";
import {
  authoriseWorkOrder,
  assessWorkReadiness,
  createWorkOrder,
  proposeVisit,
  readWorkOrder,
  saveWorkScope,
} from "../../src/service/work-orders";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const wo = (n = 1) => `90000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN Work orders register proof",
});
const denied = (e: unknown) =>
  [403, 404].includes((e as { status: number }).status);
async function draft(n = 1) {
  const p = await principal();
  const w = (await readWorkOrder(p, wo(n))).items[0];
  return { p, w, r: w.scopes.find((s) => s.id === w.scope_revision_id)! };
}
async function dataCounts() {
  return (
    await database().query(`SELECT
    (SELECT count(*) FROM ppo.work_orders) orders,(SELECT count(*) FROM ppo.scope_revisions) scopes,
    (SELECT count(*) FROM ppo.appointments) visits,(SELECT count(*) FROM ppo.audit_events) audits,
    (SELECT count(*) FROM ppo.operation_receipts) receipts,(SELECT count(*) FROM ppo.outbox_jobs) jobs`)
  ).rows;
}
async function visit(
  n = 1,
  start = "2026-11-20T00:00:00Z",
  end = "2026-11-20T02:00:00Z",
) {
  const { p, w, r } = await draft(n);
  const id = randomUUID();
  await proposeVisit(p, w.id, {
    ...base(),
    id,
    expected_version: w.version,
    scope_revision_id: r.id,
    scope_version: r.version,
    start_at: start,
    end_at: end,
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  return id;
}
function scopeInput() {
  return {
    summary: "SYN successor inspection",
    exclusions: "No intervention",
    diagnostic_limit: "External observations only",
    pending_account_plan: "Finance independently reviews charging",
    authority_evidence: {
      title: "SYN authority",
      content_text: "SYN reviewed external inspection only",
      source_reference: "SYN-WO-REGISTER",
      source_version: "1",
    },
    coverage: {
      status: "Unknown",
      assessment: "Unknown coverage retained",
      reason: "SYN investigate",
      charging_route: "FinanceReview",
      agreement_reference: null,
      source_version: null,
      effective_from: null,
      effective_to: null,
    },
    items: [
      {
        task_kind: "Inspection",
        task_description: "Observe external display",
        expected_outcome: "Saved finding",
        completion_requirements: ["Record observation"],
        required_skill_codes: ["SYN-VISUAL"],
        shutdown_condition: null,
        access_condition: null,
        assets: [
          {
            asset_id: "80000000-0000-4000-8000-000000000001",
            configuration_id: null,
            identification_plan: null,
          },
        ],
      },
    ],
  };
}

test("Work order register follows native readiness, authorisation and immutable successor scope", async () => {
  const { p, w, r } = await draft();
  let record = await readWorkOrderRecord(p, w.id);
  assert.equal(record.work_order.authorisation, "ReadyToAuthorise");
  assert.equal(record.work_order.blocker_count, 0);
  assert.equal(record.work_order.linked_request_count, w.tickets.length);
  assert.equal(record.work_order.owner_name, w.owner_name);
  assert.equal(
    (await readWorkOrderRecord(p, wo(3))).work_order.authorisation,
    "Blocked",
  );
  const id = randomUUID();
  await createWorkOrder(p, {
    ...base(),
    id,
    company_id: w.company_id,
    site_id: w.site_id,
    customer_id: w.customer_id,
    service_owner_id: w.service_owner_id,
    tickets: w.tickets.map((t) => ({
      ticket_id: t.id,
      issue_disposition: "SYN separate diagnostic work",
    })),
  });
  assert.equal(
    (await readWorkOrderRecord(p, id)).work_order.authorisation,
    "ScopeNeeded",
  );
  await authoriseWorkOrder(p, w.id, {
    ...base(),
    expected_version: w.version,
    scope_revision_id: r.id,
    scope_version: r.version,
    policy_version_id: r.policy_version_id,
  });
  record = await readWorkOrderRecord(p, w.id);
  assert.equal(record.work_order.authorisation, "Authorised");
  const original = (
    await database().query(
      "SELECT approved_snapshot,content_hash FROM ppo.scope_revisions WHERE id=$1",
      [r.id],
    )
  ).rows;
  await saveWorkScope(
    p,
    w.id,
    {
      ...base(),
      expected_version: record.work_order.version,
      change_reason: "SYN reviewed successor proposal",
      scope: scopeInput(),
    },
    true,
  );
  record = await readWorkOrderRecord(p, w.id);
  assert.equal(record.work_order.authorisation, "SuccessorDraft");
  assert.ok(record.work_order.blocker_count > 0);
  assert.deepEqual(
    (
      await database().query(
        "SELECT approved_snapshot,content_hash FROM ppo.scope_revisions WHERE id=$1",
        [r.id],
      )
    ).rows,
    original,
  );
  const before = await dataCounts();
  assert.equal(
    (
      await readWorkOrderRegister(p, {
        q: w.display_number,
        view: "successor_draft",
      })
    ).items[0].id,
    w.id,
  );
  await readWorkOrderRecord(p, w.id);
  assert.deepEqual(await dataCounts(), before);
  await closeDatabase();
  assert.equal(
    (await readWorkOrderRecord(p, w.id)).work_order.authorisation,
    "SuccessorDraft",
  );
});

test("Work order register preserves draft visit review and selects earliest active visit", async () => {
  const p = await principal();
  const later = await visit();
  const earlier = await visit(
    1,
    "2026-11-19T00:00:00Z",
    "2026-11-19T02:00:00Z",
  );
  const d = await readWorkOrderRecord(p, wo());
  assert.equal(d.work_order.next_visit?.id, earlier);
  assert.notEqual(d.work_order.next_visit?.id, later);
  assert.equal(d.work_order.next_visit?.scope_review_required, true);
  const appointment = (
    await database().query("SELECT * FROM ppo.appointments WHERE id=$1", [
      earlier,
    ])
  ).rows[0];
  await cancelAppointment(p, earlier, {
    ...base(),
    expected_version: appointment.version,
    expected_work_order_version: d.work_order.version,
    expected_assignment_version: appointment.assignment_version,
  });
  assert.equal(
    (await readWorkOrderRecord(p, wo())).work_order.next_visit?.id,
    later,
  );
  let w = (await readWorkOrder(p, wo())).items[0];
  const r = w.scopes.find((s) => s.id === w.scope_revision_id)!;
  await authoriseWorkOrder(p, w.id, {
    ...base(),
    expected_version: w.version,
    scope_revision_id: r.id,
    scope_version: r.version,
    policy_version_id: r.policy_version_id,
  });
  assert.equal(
    (await readWorkOrderRecord(p, w.id)).work_order.next_visit
      ?.scope_review_required,
    false,
  );
  w = (await readWorkOrder(p, wo())).items[0];
  await saveWorkScope(
    p,
    w.id,
    {
      ...base(),
      expected_version: w.version,
      change_reason: "SYN changed visit basis",
      scope: scopeInput(),
    },
    true,
  );
  assert.equal(
    (await readWorkOrderRecord(p, w.id)).work_order.next_visit
      ?.scope_review_required,
    true,
  );
  assert.equal(
    (
      await readWorkOrderRegister(p, {
        q: w.display_number,
        view: "visit_review",
      })
    ).counts.visit_review,
    1,
  );
});

test("Work order record returns exact scoped evidence and bounded native history without business writes", async () => {
  const { p, w } = await draft();
  await saveWorkScope(p, w.id, {
    ...base(),
    expected_version: w.version,
    scope: scopeInput(),
  });
  const visitId = await visit();
  const before = await dataCounts();
  const d = await readWorkOrderRecord(p, w.id);
  assert.ok(d.work_order.created_at);
  assert.ok(d.history.items.some((x) => x.command === "SaveScopeDraft"));
  assert.ok(
    d.history.items.some(
      (x) => x.command === "ProposeVisit" && x.object_id === visitId,
    ),
  );
  assert.ok(d.history.items.every((x) => x.actor_name && x.occurred_at));
  assert.ok(
    d.evidence.items.some((x) => x.source_reference === "SYN-WO-REGISTER"),
  );
  for (const e of d.evidence.items) {
    const source = (
      await database().query(
        "SELECT content_hash FROM ppo.document_references WHERE id=$1",
        [e.id],
      )
    ).rows[0];
    assert.equal(e.content_hash, source.content_hash);
    assert.ok(!("content_text" in e));
    assert.ok(!("local_object_key" in e));
  }
  const first = await readWorkOrderRecord(p, w.id, { limit: "1" });
  assert.equal(first.history.next_offset, 1);
  const second = await readWorkOrderRecord(p, w.id, {
    limit: "1",
    history_offset: "1",
    evidence_offset: "1",
  });
  assert.notEqual(first.history.items[0].id, second.history.items[0].id);
  assert.notEqual(first.evidence.items[0].id, second.evidence.items[0].id);
  assert.ok(!JSON.stringify(d).includes('"operation_id"'));
  assert.deepEqual(await dataCounts(), before);
});

test("Work order register scopes rows, counts, evidence and direct history to current company/site/source permissions", async () => {
  const p = await principal();
  const other = await principal("second-company"),
    systems = await principal("systems"),
    observer = await principal("site-observer");
  for (const actor of [other, systems])
    await assert.rejects(readWorkOrderRecord(actor, wo()), denied);
  await assert.rejects(readWorkOrderRegister(systems), denied);
  assert.equal(
    (await readWorkOrderRegister(other, { q: "SYN-WO-000001" })).items.length,
    0,
  );
  const observed = await readWorkOrderRegister(observer);
  assert.ok(
    observed.items.every(
      (row) => row.site_id === "70000000-0000-4000-8000-000000000001",
    ),
  );
  await withWorkingCompany(
    p.actor_id,
    "20000000-0000-4000-8000-000000000002",
    async () => {
      assert.equal((await readWorkOrderRegister(p)).counts.all, 0);
      await assert.rejects(readWorkOrderRecord(p, wo()), denied);
    },
  );
  // Losing shared-source authority suppresses both projections.
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='shared.read'",
    [p.actor_id],
  );
  await assert.rejects(readWorkOrderRegister(p), denied);
  await assert.rejects(readWorkOrderRecord(p, wo()), denied);
});

test("Work order register reports expired and stale readiness as blockers without changing recorded evidence", async (t) => {
  let { p, w, r } = await draft();
  const expiry = new Date(Date.now() + 3600000).toISOString();
  await assessWorkReadiness(p, w.id, {
    ...base(),
    expected_version: w.version,
    assessment: {
      scope_revision_id: r.id,
      scope_version: r.version,
      criterion_code: "SiteAccess",
      outcome: "Pass",
      reason: "SYN accepted evidence later expires",
      source_as_at: "2026-01-01T00:00:00Z",
      valid_until: expiry,
      evidence: {
        title: "SYN expired access",
        content_text: "SYN original evidence is retained",
        source_reference: "SYN-WO-EXPIRY",
        source_version: "1",
      },
    },
  });
  const clock = t.mock.method(Date, "now", () => Date.parse(expiry) + 1);
  let d = await readWorkOrderRecord(p, w.id);
  assert.equal(d.work_order.authorisation, "Blocked");
  assert.ok(
    d.blockers.some(
      (b) => b.field === "SiteAccess" && b.message.includes("expired"),
    ),
  );
  clock.mock.restore();
  ({ p, w, r } = await draft());
  await saveWorkScope(p, w.id, {
    ...base(),
    expected_version: w.version,
    scope: scopeInput(),
  });
  d = await readWorkOrderRecord(p, w.id);
  assert.ok(d.blockers.some((b) => b.message.includes("scope changed")));
  const original = (
    await database().query(
      "SELECT outcome,scope_version FROM ppo.readiness_assessments WHERE scope_revision_id=$1 AND criterion_code='SiteAccess' ORDER BY assessment_version DESC LIMIT 1",
      [r.id],
    )
  ).rows[0];
  assert.equal(original.outcome, "Pass");
  assert.equal(original.scope_version, r.version);
});

test("Work order record rechecks current grants after collecting evidence and history", async () => {
  const p = await principal();
  const pool = database(),
    client = await pool.connect();
  const connect = pool.connect,
    query = client.query;
  const execute = client.query.bind(client);
  let intercepted = false;
  pool.connect = (async () => client) as typeof pool.connect;
  client.query = (async (text: string, values?: unknown[]) => {
    const result = await execute(text, values);
    if (text.includes("FROM ppo.audit_events e")) {
      intercepted = true;
      await execute(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='service.work_order.read'",
        [p.actor_id],
      );
    }
    return result;
  }) as typeof client.query;
  try {
    await assert.rejects(readWorkOrderRecord(p, wo()), denied);
    assert.equal(intercepted, true);
  } finally {
    pool.connect = connect;
    client.query = query;
  }
  // The refused read rolled back the test's injected revocation.
  assert.equal((await readWorkOrderRecord(p, wo())).work_order.id, wo());
});

test("Work order register filters before paging and counts the entire permitted matching population", async () => {
  const p = await principal();
  const original = await readWorkOrderRegister(p);
  const a = await readWorkOrderRegister(p, {
    limit: "1",
    sort: "reference_asc",
  });
  assert.equal(a.items.length, 1);
  assert.equal(a.next_offset, 1);
  assert.equal(a.counts.all, original.counts.all);
  assert.equal(a.total, original.total);
  assert.equal(a.count_scope, "PermissionScopedMatchingFilters");
  const b = await readWorkOrderRegister(p, {
    limit: "1",
    sort: "reference_asc",
    offset: "1",
  });
  assert.notEqual(a.items[0].id, b.items[0].id);
  const empty = await readWorkOrderRegister(p, {
    limit: "1",
    sort: "reference_asc",
    view: "scope_needed",
  });
  assert.equal(empty.items.length, 0);
  assert.equal(empty.next_offset, null);
  assert.equal(empty.counts.all, original.counts.all);
  assert.equal((await readWorkOrderRegister(p, { q: "%_" })).items.length, 0);
  const exact = await readWorkOrderRegister(p, {
    q: a.items[0].display_number,
    owner_id: a.items[0].service_owner_id,
    site_id: a.items[0].site_id,
    view: "mine",
  });
  assert.equal(exact.items.length, 1);
  for (const query of [
    { limit: "26" },
    { offset: "-1" },
    { sort: "status;drop" },
    { view: "secret" },
    { owner_id: "bad" },
    { q: "x\n" },
    { bogus: "1" },
  ])
    await assert.rejects(
      readWorkOrderRegister(p, query),
      (e) => (e as { code: string }).code === "InvalidData",
    );
  await assert.rejects(readWorkOrderRecord(p, wo(), { history_offset: "-1" }));
});

test("SV-03 complete view totals and stable filtered paging exceed a page without leaking other company records", async () => {
  const { p, w } = await draft();
  const ids: string[] = [];
  for (let i = 0; i < 31; i++) {
    const id = randomUUID();
    await createWorkOrder(p, {
      ...base(),
      id,
      company_id: w.company_id,
      customer_id: w.customer_id,
      site_id: w.site_id,
      service_owner_id: w.service_owner_id,
      tickets: w.tickets.map((t) => ({
        ticket_id: t.id,
        issue_disposition: "SYN pagination proof",
      })),
    });
    ids.push(id);
  }
  const query = {
    view: "scope_needed",
    sort: "reference_asc",
    site_id: w.site_id,
    owner_id: w.service_owner_id,
  };
  const first = await readWorkOrderRegister(p, query);
  const second = await readWorkOrderRegister(p, {
    ...query,
    offset: first.next_offset,
  });
  assert.equal(first.items.length, 25);
  assert.equal(first.total, 31);
  assert.equal(first.counts.scope_needed, 31);
  assert.equal(first.next_offset, 25);
  assert.equal(second.items.length, 6);
  assert.equal(second.next_offset, null);
  assert.deepEqual(second.counts, first.counts);
  assert.deepEqual(
    [...first.items, ...second.items].map((r) => r.id).sort(),
    ids.sort(),
  );
  assert.equal(first.completeness, "Complete");
  const other = await readWorkOrderRegister(await principal("second-company"));
  assert.ok(other.items.every((row) => !ids.includes(row.id)));
  assert.equal(other.counts.scope_needed, 0);
});
