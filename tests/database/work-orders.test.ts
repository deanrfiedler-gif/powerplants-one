import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, seed, migrate } from "../../scripts/database";
import {
  createWorkOrder,
  saveWorkScope,
  authoriseWorkOrder,
  assessWorkReadiness,
  proposeVisit,
  readWorkOrder,
  listWorkOrders,
  POLICY_ID,
} from "../../src/service/work-orders";
import { readOperation } from "../../src/shared/receipts";
import { saveDraft } from "../../src/service/tickets";
import { ownerOptions } from "../../src/shared/context";
import { scopeFields } from "../../src/service/work-scope-validation";
const id = (t: number, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const company = id(20),
  site = id(70),
  owner = id(30),
  customer = id(50),
  ticket = id(40, 20);
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN P04 component verification",
});
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const code = (value: string) => (e: unknown) =>
  (e as { code?: string }).code === value;
const doc = () => ({
  title: "SYN manual authority",
  content_text:
    "SYN reviewed limited external visual inspection; no financial approval.",
  source_reference: "SYN-PPO-EVIDENCE-TEST",
  source_version: "1",
});
const input = () => ({
  summary: "SYN inspection scope",
  exclusions: "No shutdown, intervention or extra work.",
  diagnostic_limit: "External visual inspection only.",
  pending_account_plan:
    "Owner obtains account clarification; Finance decides charging independently.",
  authority_evidence: doc(),
  coverage: {
    status: "Disputed",
    agreement_reference: null,
    source_version: null,
    effective_from: null,
    effective_to: null,
    assessment: "Dispute retained pending review.",
    reason: "SYN disputed agreement evidence.",
    charging_route: "FinanceReview",
  },
  items: [
    {
      task_kind: "Inspection",
      task_description: "Inspect external display",
      expected_outcome: "Record observed display state",
      completion_requirements: ["Record findings", "Stop before intervention"],
      required_skill_codes: ["SYN-VISUAL"],
      shutdown_condition: null,
      access_condition: null,
      assets: [
        { asset_id: id(80), configuration_id: null, identification_plan: null },
      ],
    },
  ],
});
async function order(n = 1) {
  return (await readWorkOrder(await principal(), id(90, n))).items[0];
}
async function authCommand(n = 1) {
  const w = await order(n),
    r = w.scopes.find((s) => s.id === w.scope_revision_id)!;
  return {
    ...base(),
    expected_version: w.version,
    scope_revision_id: r.id,
    scope_version: r.version,
    policy_version_id: r.policy_version_id,
  };
}
async function reviewAll(n: number) {
  const p = await principal();
  for (const criterion of [
    "SiteAccess",
    "SiteControls",
    "CompetencyPlan",
    "MandatoryIsolation",
    "ShutdownAuthority",
  ]) {
    const w = await order(n),
      r = w.scopes.find((s) => s.id === w.scope_revision_id)!;
    await assessWorkReadiness(p, w.id, {
      ...base(),
      expected_version: w.version,
      assessment: {
        scope_revision_id: r.id,
        scope_version: r.version,
        criterion_code: criterion,
        outcome: ["MandatoryIsolation", "ShutdownAuthority"].includes(criterion)
          ? "NotApplicable"
          : "Pass",
        reason: "SYN reviewed exact non-intervention scope.",
        evidence: doc(),
        source_as_at: "2026-09-05T00:00:00Z",
      },
    });
  }
}
test("P04 migration upgrades exact P03 evidence; repeat migration/seed retains deliberate edits and revoked grants", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(3);
  await seed(3);
  const p = await principal();
  const op = {
    ...base(),
    expected_version: 1,
    summary: "SYN preserved P03 era operation",
  };
  const accepted = await saveDraft(p, id(40), op);
  const old: Record<string, unknown> = {};
  for (const t of [
    "tickets",
    "activities",
    "activity_links",
    "history_records",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
  ])
    old[t] = await rows(`SELECT * FROM ppo.${t} ORDER BY 1,2`);
  const checks = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.ticket.edit'",
    [owner],
  );
  await migrate();
  await seed();
  await migrate();
  await seed();
  for (const t of [
    "activities",
    "activity_links",
    "history_records",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
  ])
    assert.deepEqual(await rows(`SELECT * FROM ppo.${t} ORDER BY 1,2`), old[t]);
  assert.deepEqual(
    await rows("SELECT * FROM ppo.tickets WHERE id<>$1 ORDER BY 1,2", [ticket]),
    old.tickets,
  );
  assert.deepEqual(
    await rows(
      "SELECT * FROM public.ppo_migrations WHERE version<=3 ORDER BY version",
    ),
    checks,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.permission_grants WHERE user_id=$1 AND capability IN ('service.scope.authorise','service.work_order.edit')",
        [owner],
      )
    )[0].n,
    0,
  );
  assert.deepEqual(
    (
      await rows(
        "SELECT result FROM ppo.operation_receipts WHERE operation_id=$1",
        [op.operation_id],
      )
    )[0].result,
    accepted,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM public.ppo_migrations"))[0].n,
    4,
  );
});
test("typed work-order creation allocates permanent references and supports many-to-many tickets without rewriting history", async () => {
  const p = await principal(),
    before = await rows("SELECT * FROM ppo.tickets ORDER BY id");
  const payload = {
    ...base(),
    id: randomUUID(),
    company_id: company,
    site_id: site,
    customer_id: customer,
    service_owner_id: owner,
    tickets: [
      { ticket_id: ticket, issue_disposition: "SYN shared source need" },
    ],
  };
  const a = await createWorkOrder(p, payload),
    b = await createWorkOrder(p, payload);
  assert.deepEqual(a.receipt, b.receipt);
  assert.equal(b.replayed, true);
  assert.equal(a.receipt.state, "Draft");
  const w = (await readWorkOrder(p, payload.id)).items[0];
  assert.match(w.display_number, /^SYN-PPO-WO-\d{6,}$/);
  assert.equal(w.tickets.length, 1);
  assert.equal(w.blockers[0].field, "scope");
  await assert.rejects(
    authoriseWorkOrder(p, w.id, {
      ...base(),
      expected_version: 1,
      scope_revision_id: randomUUID(),
      scope_version: 1,
      policy_version_id: POLICY_ID,
    }),
    code("VersionConflict"),
  );
  await createWorkOrder(p, { ...payload, ...base(), id: randomUUID() });
  assert.deepEqual(await rows("SELECT * FROM ppo.tickets ORDER BY id"), before);
  await assert.rejects(
    createWorkOrder(p, {
      ...payload,
      ...base(),
      id: randomUUID(),
      tickets: [...payload.tickets, ...payload.tickets],
    }),
    code("InvalidData"),
  );
});
test("TR-02 accepts exact ready scope once, freezes source and atomically records audit, receipt and durable synthetic intent", async () => {
  const p = await principal(),
    cmd = await authCommand();
  const a = await authoriseWorkOrder(p, id(90), cmd);
  assert.equal(a.receipt.state, "Authorised");
  assert.equal(a.receipt.record_version, 2);
  assert.deepEqual(
    (await authoriseWorkOrder(p, id(90), cmd)).receipt,
    a.receipt,
  );
  assert.deepEqual(await readOperation(p, cmd.operation_id), a.receipt);
  for (const t of ["audit_events", "operation_receipts", "outbox_jobs"])
    assert.equal(
      (
        await rows(
          `SELECT count(*)::int n FROM ppo.${t} WHERE operation_id=$1`,
          [cmd.operation_id],
        )
      )[0].n,
      1,
    );
  const s = (
    await rows("SELECT * FROM ppo.scope_revisions WHERE id=$1", [id(91)])
  )[0];
  assert.equal(s.approved_by, owner);
  assert.equal(
    s.approved_snapshot.financial_disposition,
    "PendingFinanceReview",
  );
  assert.match(s.content_hash, /^[a-f0-9]{64}$/);
  assert.equal(
    (
      await rows(
        "SELECT content_hash=encode(sha256(convert_to(approved_snapshot::text,'UTF8')),'hex') AS ok FROM ppo.scope_revisions WHERE id=$1",
        [id(91)],
      )
    )[0].ok,
    true,
  );
  await assert.rejects(
    authoriseWorkOrder(p, id(90), { ...cmd, reason: "Changed meaning" }),
    code("OperationConflict"),
  );
});
test("missing authority, unresolved identity and mandatory control refuse authorisation with field-level blockers; urgent bypasses nothing", async () => {
  const p = await principal();
  for (const [n, field] of [
    [3, "authority_evidence"],
    [5, "items.1.asset"],
    [6, "SiteAccess"],
  ] as const) {
    await assert.rejects(
      authoriseWorkOrder(p, id(90, n), await authCommand(n)),
      (e: unknown) => {
        const error = e as { code: string; field_errors: { field: string }[] };
        assert.equal(error.code, "AuthorisationBlocked");
        assert.ok(error.field_errors.some((x) => x.field === field));
        return true;
      },
    );
    assert.equal((await order(n)).status, "Draft");
  }
});
test("approved identification is limited to Identification tasks and preserves uncertain asset identity", async () => {
  const p = await principal(),
    before = await rows("SELECT * FROM ppo.assets WHERE id=$1", [id(80, 2)]);
  await authoriseWorkOrder(p, id(90, 9), await authCommand(9));
  assert.deepEqual(
    await rows("SELECT * FROM ppo.assets WHERE id=$1", [id(80, 2)]),
    before,
  );
  assert.equal(
    (
      await rows(
        "SELECT approved_by FROM ppo.identification_plans WHERE id=$1",
        [id(96, 9)],
      )
    )[0].approved_by,
    owner,
  );
  const w = await order(5),
    draft = input();
  draft.items[0].assets[0].asset_id = id(80, 2);
  await saveWorkScope(p, w.id, {
    ...base(),
    expected_version: w.version,
    scope: draft,
  });
  await reviewAll(5);
  await assert.rejects(
    authoriseWorkOrder(p, w.id, await authCommand(5)),
    code("AuthorisationBlocked"),
  );
});
test("non-waivable controls reject a generic override, forged policy input and invalid N/A; valid reviewed evidence changes readiness", async () => {
  const p = await principal(),
    w = await order(6),
    r = w.scopes[0];
  const assessment = {
    scope_revision_id: r.id,
    scope_version: r.version,
    criterion_code: "SiteAccess",
    outcome: "PermittedException",
    reason: "Urgent override",
    evidence: doc(),
    source_as_at: "2026-09-05T00:00:00Z",
  };
  await assert.rejects(
    assessWorkReadiness(p, w.id, {
      ...base(),
      expected_version: w.version,
      assessment,
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    assessWorkReadiness(p, w.id, {
      ...base(),
      expected_version: w.version,
      assessment: { ...assessment, exception_allowed: true },
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    assessWorkReadiness(p, w.id, {
      ...base(),
      expected_version: w.version,
      assessment: { ...assessment, outcome: "NotApplicable" },
    }),
    code("InvalidData"),
  );
  await assessWorkReadiness(p, w.id, {
    ...base(),
    expected_version: w.version,
    assessment: {
      ...assessment,
      outcome: "Pass",
      reason: "SYN reviewer confirmed actual access evidence.",
    },
  });
  await authoriseWorkOrder(p, w.id, await authCommand(6));
  assert.equal((await order(6)).status, "Authorised");
});
test("proposed visit permits evidenced tool preparation exception but cannot clear unimplemented crew or dispatch controls", async () => {
  const p = await principal(),
    w = await order(7),
    r = w.scopes[0],
    visit = w.visits[0];
  assert.equal(visit.status, "Proposed");
  assert.equal(
    visit.readiness.find(
      (a: { criterion_code: string }) => a.criterion_code === "ToolPreparation",
    ).outcome,
    "PermittedException",
  );
  const assessment = {
    scope_revision_id: r.id,
    scope_version: r.version,
    appointment_id: visit.id,
    criterion_code: "ToolPreparation",
    outcome: "PermittedException",
    reason: "SYN collect tool kit before dispatch.",
    evidence: doc(),
    source_as_at: "2026-09-05T00:00:00Z",
  };
  await assessWorkReadiness(p, w.id, {
    ...base(),
    expected_version: w.version,
    assessment,
  });
  const current = await order(7);
  await assert.rejects(
    assessWorkReadiness(p, w.id, {
      ...base(),
      expected_version: current.version,
      assessment: {
        ...assessment,
        criterion_code: "CrewCompetency",
        outcome: "Pass",
      },
    }),
    code("InvalidData"),
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.appointments WHERE status<>'Proposed'",
      )
    )[0].n,
    0,
  );
});
test("all canonical coverage positions remain distinct and no coverage outcome creates a financial disposition", async () => {
  const p = await principal();
  for (const status of [
    "Unknown",
    "Covered",
    "NotCovered",
    "Disputed",
    "NotApplicable",
  ]) {
    const w = await order(),
      draft = input();
    draft.coverage.status = status;
    await saveWorkScope(p, w.id, {
      ...base(),
      expected_version: w.version,
      scope: draft,
    });
    const current = await order();
    assert.equal(current.scopes[0].coverage.status, status);
    assert.equal(current.financial_disposition, "PendingFinanceReview");
  }
  const w = await order(),
    draft = input();
  draft.coverage.charging_route = "ApprovedNonBillable";
  await assert.rejects(
    saveWorkScope(p, w.id, {
      ...base(),
      expected_version: w.version,
      scope: draft,
    }),
    code("InvalidData"),
  );
  const other = input();
  other.coverage.status = "NotApplicable";
  other.coverage.reason = "";
  assert.throws(() => scopeFields(other), code("InvalidData"));
});
test("approved scope and children resist SQL/API mutation; reviewed successor preserves original bytes and holds old visit context", async () => {
  const p = await principal(),
    before = await rows("SELECT * FROM ppo.scope_revisions WHERE id=$1", [
      id(91, 2),
    ]),
    w = await order(2);
  await assert.rejects(
    saveWorkScope(p, w.id, {
      ...base(),
      expected_version: w.version,
      scope: input(),
    }),
    code("ScopeImmutable"),
  );
  for (const sql of [
    "UPDATE ppo.scope_revisions SET summary='changed' WHERE id=$1",
    "DELETE FROM ppo.scope_items WHERE scope_revision_id=$1",
    "UPDATE ppo.scope_items SET task_description='extra' WHERE scope_revision_id=$1",
    "DELETE FROM ppo.scope_assets WHERE scope_revision_id=$1",
  ]) {
    await assert.rejects(database().query(sql, [id(91, 2)]));
  }
  await saveWorkScope(
    p,
    w.id,
    {
      ...base(),
      expected_version: w.version,
      scope: input(),
      change_reason: "SYN extra external inspection; no shutdown.",
    },
    true,
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.scope_revisions WHERE id=$1", [id(91, 2)]),
    before,
  );
  await reviewAll(2);
  await authoriseWorkOrder(p, w.id, await authCommand(2));
  const current = await order(2);
  assert.equal(current.scopes.length, 2);
  assert.equal(current.scopes[0].revision, 2);
  assert.equal(current.visits[0].scope_revision_id, id(91, 2));
  assert.equal(current.visits[0].scope_review_required, true);
  assert.equal(current.scopes[0].coverage.status, "Disputed");
  assert.deepEqual(
    await rows("SELECT * FROM ppo.scope_revisions WHERE id=$1", [id(91, 2)]),
    before,
  );
});
test("stale scope/readiness and expired evidence cannot silently clear authority", async () => {
  const p = await principal(),
    old = await authCommand(),
    w = await order();
  await saveWorkScope(p, w.id, {
    ...base(),
    expected_version: w.version,
    scope: input(),
  });
  await assert.rejects(
    authoriseWorkOrder(p, w.id, old),
    code("VersionConflict"),
  );
  const current = await order();
  assert.ok(current.blockers.some((x) => x.field === "SiteAccess"));
  const r = current.scopes[0];
  await assert.rejects(
    assessWorkReadiness(p, w.id, {
      ...base(),
      expected_version: current.version,
      assessment: {
        scope_revision_id: r.id,
        scope_version: r.version,
        criterion_code: "SiteAccess",
        outcome: "Pass",
        reason: "Expired evidence",
        evidence: doc(),
        source_as_at: "2026-01-01T00:00:00Z",
        valid_until: "2026-01-02T00:00:00Z",
      },
    }),
    code("InvalidData"),
  );
});
test("concurrent authorisations produce one business effect and reject the stale proposal", async () => {
  const p = await principal(),
    a = await authCommand(),
    b = { ...a, ...base() };
  const result = await Promise.allSettled([
    authoriseWorkOrder(p, id(90), a),
    authoriseWorkOrder(p, id(90), b),
  ]);
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    result.filter(
      (r) => r.status === "rejected" && r.reason.code === "VersionConflict",
    ).length,
    1,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.outbox_jobs WHERE kind='ScopeAuthorised'",
      )
    )[0].n,
    1,
  );
});
test("capability plus scope governs order/list/owner/receipt traversal; technical and technician identities cannot approve", async () => {
  for (const name of ["systems", "technician"]) {
    const p = await principal(name);
    await assert.rejects(readWorkOrder(p, id(90)), code("Forbidden"));
    await assert.rejects(
      authoriseWorkOrder(p, id(90), await authCommand()),
      code("Forbidden"),
    );
  }
  const p = await principal("second-company");
  await assert.rejects(readWorkOrder(p, id(90)), code("RecordUnavailable"));
  assert.equal((await listWorkOrders(p)).items.length, 0);
  const observer = await principal("site-observer");
  assert.ok((await listWorkOrders(observer)).items.length);
  await assert.rejects(
    authoriseWorkOrder(observer, id(90), await authCommand()),
    code("Forbidden"),
  );
  const options = await ownerOptions(await principal(), {
    company_id: company,
    site_id: site,
    purpose: "WorkOrder",
  });
  assert.ok(
    !options.items.some((x: { id: string }) =>
      [id(30, 3), id(30, 6)].includes(x.id),
    ),
  );
  const actor = await principal(),
    cmd = await authCommand();
  await authoriseWorkOrder(actor, id(90), cmd);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.scope.authorise'",
    [owner],
  );
  await assert.rejects(
    readOperation(actor, cmd.operation_id),
    code("Forbidden"),
  );
  await assert.rejects(
    authoriseWorkOrder(actor, id(90), cmd),
    code("Forbidden"),
  );
});
test("cross-site/company substitution and ReviewRequired configuration are refused", async () => {
  const p = await principal(),
    w = await order(),
    draft = input();
  draft.items[0].assets[0].asset_id = id(80, 4);
  await assert.rejects(
    saveWorkScope(p, w.id, {
      ...base(),
      expected_version: w.version,
      scope: draft,
    }),
  );
  const configs = await rows(
    "SELECT id FROM ppo.asset_configurations WHERE asset_id=$1",
    [id(80)],
  );
  const configured = input();
  configured.items[0].assets[0].configuration_id = configs[0].id;
  await saveWorkScope(p, w.id, {
    ...base(),
    expected_version: w.version,
    scope: configured,
  });
  await reviewAll(1);
  await assert.rejects(
    authoriseWorkOrder(p, w.id, await authCommand()),
    code("AuthorisationBlocked"),
  );
  const dto = JSON.stringify(await order());
  assert.ok(!dto.includes("erp_connection_id"));
  assert.ok(!dto.includes("billing_mapping_id"));
  assert.equal(
    (await order()).scopes[0].items[0].assets[0].serial,
    "000Ab-C.01",
  );
  assert.ok(!dto.includes("erp_company_id"));
});
test("injected scope/order/audit/receipt/outbox failures roll authorisation back without partial approval", async () => {
  const p = await principal();
  for (const table of [
    "work_orders",
    "scope_revisions",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ]) {
    const before = await rows("SELECT * FROM ppo.scope_revisions WHERE id=$1", [
        id(91),
      ]),
      cmd = await authCommand();
    await database().query(
      `CREATE FUNCTION ppo.inject_p04_failure() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'SYN injected rollback'; END$$; CREATE TRIGGER inject_failure BEFORE ${["work_orders", "scope_revisions"].includes(table) ? "UPDATE" : "INSERT"} ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.inject_p04_failure();`,
    );
    await assert.rejects(authoriseWorkOrder(p, id(90), cmd));
    await database().query(
      `DROP TRIGGER inject_failure ON ppo.${table}; DROP FUNCTION ppo.inject_p04_failure();`,
    );
    assert.deepEqual(
      await rows("SELECT * FROM ppo.scope_revisions WHERE id=$1", [id(91)]),
      before,
    );
    assert.equal((await order()).status, "Draft");
    for (const t of ["audit_events", "operation_receipts", "outbox_jobs"])
      assert.equal(
        (
          await rows(
            `SELECT count(*)::int n FROM ppo.${t} WHERE operation_id=$1`,
            [cmd.operation_id],
          )
        )[0].n,
        0,
      );
  }
});
test("proposed visits validate interval/scope, allocate APT once and retain exact receipt after connection restart", async () => {
  const p = await principal(),
    w = await order(),
    r = w.scopes[0];
  const cmd = {
    ...base(),
    id: randomUUID(),
    expected_version: w.version,
    scope_revision_id: r.id,
    scope_version: r.version,
    start_at: "2026-09-20T00:00:00Z",
    end_at: "2026-09-20T02:00:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  };
  const receipt = await proposeVisit(p, w.id, cmd);
  assert.equal(receipt.receipt.state, "Proposed");
  assert.deepEqual((await proposeVisit(p, w.id, cmd)).receipt, receipt.receipt);
  assert.deepEqual(await readOperation(p, cmd.operation_id), receipt.receipt);
  await assert.rejects(
    proposeVisit(p, w.id, { ...cmd, ...base(), end_at: cmd.start_at }),
    code("InvalidData"),
  );
  await assert.rejects(
    proposeVisit(p, w.id, { ...cmd, ...base(), status: "Confirmed" }),
    code("InvalidData"),
  );
  await closeDatabase();
  assert.equal((await order()).visits[0].status, "Proposed");
  const before = await rows("SELECT * FROM ppo.work_orders ORDER BY id");
  await seed();
  await migrate();
  assert.deepEqual(
    await rows("SELECT * FROM ppo.work_orders ORDER BY id"),
    before,
  );
});
