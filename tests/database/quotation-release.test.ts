import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import { readRelease } from "../../src/estimating/release/reads";
import {
  prepareRelease,
  approveRelease,
  issueRelease,
  recordDistribution,
} from "../../src/estimating/release/service";
import { readOperation } from "../../src/shared/receipts";
import {
  retryQuote,
  draftBytes,
  readQuoteJob,
  runQuoteJob,
  QuoteWorkerInterrupted,
} from "../../src/estimating/worker";
import {
  saveEstimate,
  createEstimate,
  prepareQuote,
} from "../../src/estimating/service";
import { createSession } from "../../src/platform/identity";
import {
  releaseFixture,
  preparation,
  prepared,
  approved,
  issued,
  approval,
  issue,
  releaseCommand,
} from "../helpers/quotation-release";
import { crmBase, CRM } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (name: string) => (error: unknown) =>
  (error as { code: string }).code === name;

test("ES05 exact preparation, independent approval, exact issue and simulated distribution preserve original Draft bytes", async () => {
  const f = await releaseFixture();
  await retryQuote(f.owner, f.draft.id);
  const original = await draftBytes(f.owner, f.draft.id);
  const next = await prepared(f);
  assert.equal(next.result.receipt.state, "Prepared");
  assert.deepEqual(
    (await prepareRelease(f.owner, f.draft.id, next.input)).receipt,
    next.result.receipt,
  );
  const a = await approved(f, next.id);
  let d = await readRelease(f.issuer, next.id);
  const command = issue(d),
    races = await Promise.all([
      issueRelease(f.issuer, next.id, command),
      issueRelease(f.issuer, next.id, command),
    ]);
  assert.deepEqual(races[0].receipt, races[1].receipt);
  assert.equal(races.filter((r) => r.replayed).length, 1);
  d = await readRelease(f.issuer, next.id);
  assert.equal(
    d.approval!.id,
    (await readRelease(f.approver, next.id)).approval!.id,
  );
  assert.equal(d.events.filter((e) => e.action === "Issue").length, 1);
  const distribute = {
    ...releaseCommand(d),
    issue_id: d.issue!.id,
    attempt_id: randomUUID(),
    resolves_event_id: null,
    outcome: "SimulatedDelivered",
  };
  const result = await recordDistribution(f.issuer, next.id, distribute);
  assert.deepEqual(
    (await recordDistribution(f.issuer, next.id, distribute)).receipt,
    result.receipt,
  );
  assert.deepEqual(
    await readOperation(f.approver, a.input.operation_id),
    a.result.receipt,
  );
  assert.deepEqual((await draftBytes(f.owner, f.draft.id)).pdf, original.pdf);
  assert.equal((await draftBytes(f.owner, f.draft.id)).html, original.html);
  assert.match(
    (await draftBytes(f.owner, next.id)).html,
    /NO COMMERCIAL VALIDITY/,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.quote_release_events SET reason='overwritten' WHERE revision_id=$1",
      [next.id],
    ),
    code("55000"),
  );
  await assert.rejects(
    database().query(
      "DELETE FROM ppo.quote_release_bases WHERE revision_id=$1",
      [next.id],
    ),
    code("55000"),
  );
});
test("ES05 stale observed recipient refuses preparation; changed saved estimate holds approved issue without editing evidence", async () => {
  const f = await releaseFixture(),
    old = preparation(await readRelease(f.owner, f.draft.id));
  await database().query(
    "UPDATE ppo.people SET version=version+1,display_name=display_name||' SYN changed' WHERE workspace_id=$1 AND id=$2",
    [CRM.workspace, CRM.person],
  );
  await assert.rejects(
    prepareRelease(f.owner, f.draft.id, old),
    code("ReleaseConflict"),
  );
  const next = await prepared(f),
    a = await approved(f, next.id),
    before = await readRelease(f.issuer, next.id),
    input = issue(before);
  await saveEstimate(f.owner, f.input.id, {
    ...crmBase(),
    expected_version: 1,
    title: f.input.title,
    scope: f.input.scope,
    lines: f.input.lines.map((l) => ({ ...l, unit_cost: "50.00" })),
    policy: f.input.policy,
  });
  await assert.rejects(
    issueRelease(f.issuer, next.id, input),
    code("ReleaseConflict"),
  );
  assert.equal((await readRelease(f.issuer, next.id)).current, false);
  assert.deepEqual(
    await readOperation(f.approver, a.input.operation_id),
    a.result.receipt,
  );
  assert.equal((await readRelease(f.issuer, next.id)).issue, null);
});
test("ES05 unknown simulation holds a new attempt and retains attributable exact-attempt resolution", async () => {
  const f = await releaseFixture(),
    next = await prepared(f);
  await issued(f, next.id);
  let d = await readRelease(f.issuer, next.id);
  const command = {
    ...releaseCommand(d),
    issue_id: d.issue!.id,
    attempt_id: randomUUID(),
    resolves_event_id: null,
    outcome: "Unknown",
  };
  const unknown = await recordDistribution(f.issuer, next.id, command);
  d = await readRelease(f.issuer, next.id);
  await assert.rejects(
    recordDistribution(f.issuer, next.id, {
      ...command,
      ...releaseCommand(d),
      attempt_id: randomUUID(),
    }),
    code("ReleaseConflict"),
  );
  const original = d.events.at(-1)!;
  await recordDistribution(f.issuer, next.id, {
    ...command,
    ...releaseCommand(d),
    resolves_event_id: original.id,
    outcome: "SimulatedDelivered",
  });
  d = await readRelease(f.issuer, next.id);
  assert.equal(d.events.at(-2)!.outcome, "Unknown");
  assert.equal(d.events.at(-1)!.resolves_event_id, original.id);
  assert.deepEqual(
    await readOperation(f.issuer, command.operation_id),
    unknown.receipt,
  );
});
test("ES05 independent duties and current permission refusal cover commands and original receipt recovery", async () => {
  const f = await releaseFixture(),
    next = await prepared(f),
    other = (await createSession("second-company")).principal;
  await assert.rejects(readRelease(other, next.id), code("RecordUnavailable"));
  await assert.rejects(
    approveRelease(
      f.owner,
      next.id,
      approval(await readRelease(f.owner, next.id)),
    ),
    code("RecordUnavailable"),
  );
  const a = await approved(f, next.id);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.quote.approve'",
    [f.approver.actor_id],
  );
  try {
    await assert.rejects(
      readOperation(f.approver, a.input.operation_id),
      code("RecordUnavailable"),
    );
    await assert.rejects(
      approveRelease(f.approver, next.id, a.input),
      code("RecordUnavailable"),
    );
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='estimating.quote.approve'",
      [f.approver.actor_id],
    );
  }
  await database().query(
    "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE workspace_id=$1 AND organisation_id=$2 AND person_id=$3",
    [CRM.workspace, CRM.org, CRM.person],
  );
  try {
    await assert.rejects(
      draftBytes(f.issuer, next.id),
      code("RecordUnavailable"),
    );
    await assert.rejects(
      readOperation(f.owner, next.input.operation_id),
      code("RecordUnavailable"),
    );
  } finally {
    await database().query(
      "UPDATE ppo.relationships SET valid_to=NULL WHERE workspace_id=$1 AND organisation_id=$2 AND person_id=$3",
      [CRM.workspace, CRM.org, CRM.person],
    );
  }
});

test("ES05 concurrent independent approvals and late issue failure leave exactly one complete operation", async () => {
  const f = await releaseFixture(),
    next = await prepared(f),
    d = await readRelease(f.approver, next.id),
    first = approval(d),
    second = approval(d);
  const results = await Promise.allSettled([
    approveRelease(f.approver, next.id, first),
    approveRelease(f.approver, next.id, second),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const rejected = results.find((r) => r.status === "rejected")!;
  assert.equal(rejected.status, "rejected");
  assert.ok(code("VersionConflict")(rejected.reason));
  const command = issue(await readRelease(f.issuer, next.id));
  await database().query(
    "CREATE FUNCTION ppo.es05_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='QuotationReleaseRecorded' THEN RAISE EXCEPTION 'Injected late failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER es05_test_failure BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.es05_test_failure()",
  );
  try {
    await assert.rejects(
      issueRelease(f.issuer, next.id, command),
      /Injected late failure/,
    );
  } finally {
    await database().query(
      "DROP TRIGGER es05_test_failure ON ppo.outbox_jobs; DROP FUNCTION ppo.es05_test_failure()",
    );
  }
  assert.equal((await readRelease(f.issuer, next.id)).issue, null);
  for (const table of [
    "quote_release_events",
    "audit_events",
    "outbox_jobs",
    "operation_receipts",
  ])
    assert.equal(
      (
        await database().query(
          `SELECT 1 FROM ppo.${table} WHERE operation_id=$1`,
          [command.operation_id],
        )
      ).rowCount,
      0,
    );
  const result = await issueRelease(f.issuer, next.id, command);
  assert.deepEqual(
    (await issueRelease(f.issuer, next.id, command)).receipt,
    result.receipt,
  );
});

test("ES05 broad duty grants cannot permit owner approval or approver issue", async () => {
  const f = await releaseFixture(),
    next = await prepared(f);
  const inserted = (
    await database().query(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from) SELECT workspace_id,d.actor::uuid,company_id,d.capability,scope_type,scope_id,site_id,valid_from FROM ppo.permission_grants CROSS JOIN (VALUES($1::text,'estimating.quote.approve'),($2::text,'estimating.quote.issue')) d(actor,capability) WHERE user_id=$1::uuid AND permission_grants.capability='estimating.read' AND company_id=$3 RETURNING id",
      [f.owner.actor_id, f.approver.actor_id, CRM.company],
    )
  ).rows;
  assert.equal(inserted.length, 2);
  try {
    await assert.rejects(
      approveRelease(
        f.owner,
        next.id,
        approval(await readRelease(f.owner, next.id)),
      ),
      code("IndependentApprovalRequired"),
    );
    await approved(f, next.id);
    await assert.rejects(
      issueRelease(
        f.approver,
        next.id,
        issue(await readRelease(f.approver, next.id)),
      ),
      code("IndependentIssueRequired"),
    );
    assert.equal((await readRelease(f.approver, next.id)).can.issue, false);
  } finally {
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE id=ANY($1::uuid[])",
      [inserted.map((r) => r.id)],
    );
  }
});

test("ES05 interrupted release rendering recovers the retained bundle without regenerating output", async () => {
  const f = await releaseFixture(),
    input = preparation(await readRelease(f.owner, f.draft.id));
  await prepareRelease(f.owner, f.draft.id, input);
  const { j } = await readQuoteJob(f.owner, input.id);
  await assert.rejects(
    runQuoteJob(j.id, {
      afterStore: async () => {
        throw new QuoteWorkerInterrupted("Synthetic lost acknowledgement");
      },
    }),
    QuoteWorkerInterrupted,
  );
  const { documentStore } = await import("../../src/documents/store"),
    stored = await documentStore().locate({ ...f.owner, operation_id: j.id });
  assert.ok(stored);
  await database().query(
    "UPDATE ppo.estimate_quote_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1",
    [j.id],
  );
  await runQuoteJob(j.id, {
    render: async () => {
      throw Error("Must not regenerate retained release");
    },
  });
  const output = await draftBytes(f.owner, input.id);
  assert.equal(output.manifest.key.sha256, stored.key.sha256);
  await issued(f, input.id);
  assert.deepEqual(await draftBytes(f.issuer, input.id), output);
});

test("ES05 explicit issue successor does not inherit approval and preserves both exact issued originals", async () => {
  const f = await releaseFixture(),
    first = await prepared(f);
  await issued(f, first.id);
  const before = await draftBytes(f.owner, first.id),
    old = await readRelease(f.owner, first.id),
    next = preparation(old);
  assert.equal(next.predecessor_issue_id, old.issue!.id);
  await assert.rejects(
    prepareRelease(f.owner, first.id, { ...next, predecessor_issue_id: null }),
    code("ReleaseConflict"),
  );
  await prepareRelease(f.owner, first.id, next);
  await retryQuote(f.owner, next.id);
  assert.equal((await readRelease(f.issuer, next.id)).approval, null);
  await assert.rejects(
    issueRelease(f.issuer, next.id, {
      ...releaseCommand(await readRelease(f.issuer, next.id)),
      approval_id: old.approval!.id,
      output_hash: old.job.output_hash,
    }),
    code("ReleaseConflict"),
  );
  await issued(f, next.id);
  const current = await readRelease(f.issuer, next.id);
  assert.equal(current.base!.predecessor_issue_id, old.issue!.id);
  assert.equal(current.events.filter((e) => e.action === "Issue").length, 2);
  assert.deepEqual(await draftBytes(f.issuer, first.id), before);
  assert.notEqual(
    (await draftBytes(f.issuer, next.id)).manifest.html_hash,
    before.manifest.html_hash,
  );
});

test("ES05 captured recipient authority is required even after a permitted contact replaces the opportunity contact", async () => {
  const { readEstimate, readQuote } =
    await import("../../src/estimating/reads");
  const f = await releaseFixture(),
    next = await prepared(f),
    person = randomUUID();
  await database().query(
    "INSERT INTO ppo.people(id,workspace_id,created_by,updated_by,display_name) VALUES($1,$2,$3,$3,'SYN Release replacement contact')",
    [person, CRM.workspace, f.owner.actor_id],
  );
  await database().query(
    "INSERT INTO ppo.person_company_contexts(workspace_id,company_id,person_id) VALUES($1,$2,$3)",
    [CRM.workspace, CRM.company, person],
  );
  await database().query(
    "INSERT INTO ppo.relationships(id,workspace_id,created_by,updated_by,company_id,organisation_id,person_id,role_label,valid_from) VALUES($1,$2,$3,$3,$4,$5,$6,'SYN replacement contact','2026-01-01')",
    [
      randomUUID(),
      CRM.workspace,
      f.owner.actor_id,
      CRM.company,
      CRM.org,
      person,
    ],
  );
  const { editDealInformation } = await import("../../src/crm/refinements");
  await editDealInformation(f.owner, f.o.id, {
    ...crmBase(),
    expected_version: 1,
    title: f.o.title,
    primary_person_id: person,
    contact_unknown_reason: null,
    value_amount: null,
    expected_close_date: null,
  });
  await database().query(
    "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE organisation_id=$1 AND person_id=$2",
    [CRM.org, CRM.person],
  );
  try {
    const estimate = await readEstimate(f.owner, f.input.id);
    assert.equal(
      estimate.quotes.some((q) => q.id === next.id),
      false,
    );
    // Current opportunity remains visible; the extra refusal is for the original recipient.
    assert.equal(estimate.opportunity.id, f.o.id);
    for (const read of [
      () => readRelease(f.owner, next.id),
      () => readQuote(f.owner, next.id),
      () => draftBytes(f.owner, next.id),
      () => readOperation(f.owner, next.input.operation_id),
    ])
      await assert.rejects(read(), code("RecordUnavailable"));
  } finally {
    await database().query(
      "UPDATE ppo.relationships SET valid_to=NULL WHERE organisation_id=$1 AND person_id=$2",
      [CRM.org, CRM.person],
    );
  }
});

test("ES05 populated migration 58 upgrade preserves reviewed estimates, receipts, output and exact prior grants", async () => {
  const { readFile } = await import("node:fs/promises"),
    { createOpportunity } = await import("../../src/crm/opportunities"),
    { crmCreate } = await import("../helpers/crm"),
    { estimateInput, quoteCommand } = await import("../helpers/estimating"),
    { reviewed } = await import("../helpers/quotation-release"),
    { readEstimate } = await import("../../src/estimating/reads"),
    { quotationReleaseSeedGrants } =
      await import("../helpers/engineering-materials-grants");
  const rows = async (sql: string, params: unknown[] = []) =>
    (await database().query(sql, params)).rows;
  await rows(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await rows("DROP TABLE public.ppo_migrations");
  await migrate(58);
  await seed(58);
  const owner = (await createSession("coordinator")).principal,
    reviewer = (await createSession("estimating-source-reviewer")).principal,
    o = crmCreate();
  await createOpportunity(owner, o);
  const input = estimateInput(o.id),
    created = await createEstimate(owner, input);
  await reviewed(owner, reviewer, input.id);
  const d = await readEstimate(owner, input.id),
    q = quoteCommand(d.saved);
  await prepareQuote(owner, input.id, q);
  await retryQuote(owner, q.id);
  const bytes = await draftBytes(owner, q.id);
  const tables = [
    "estimates",
    "estimate_versions",
    "estimate_review_events",
    "draft_quotes",
    "draft_quote_revisions",
    "estimate_quote_jobs",
    "estimate_quote_attempts",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ];
  const snapshot = () =>
    Promise.all(
      tables.map((t) =>
        rows(
          `SELECT to_jsonb(v) value FROM ppo.${t} v ORDER BY to_jsonb(v)::text`,
        ),
      ),
    );
  const original = await snapshot(),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    users = await rows("SELECT id FROM ppo.users ORDER BY id");
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), original);
  assert.deepEqual(
    await rows(
      "SELECT * FROM public.ppo_migrations WHERE version<=58 ORDER BY version",
    ),
    ledger,
  );
  assert.deepEqual(
    (await rows("SELECT version FROM public.ppo_migrations WHERE version>58 ORDER BY version")).map(r => r.version),
    [59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71],
  );
  const after = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    ids = new Set(grants.map((g) => g.id));
  assert.deepEqual(
    after.filter((g) => ids.has(g.id)),
    grants,
  );
  const sorted = (gs: typeof grants) =>
    gs.map(({ id: _, ...g }) => JSON.stringify(g)).sort();
  assert.deepEqual(
    sorted(after.filter((g) => !ids.has(g.id))),
    sorted(quotationReleaseSeedGrants(grants)),
  );
  assert.equal(after.length - grants.length, 13);
  assert.equal(
    (await rows("SELECT id FROM ppo.users")).length - users.length,
    2,
  );
  assert.deepEqual(await draftBytes(owner, q.id), bytes);
  assert.deepEqual(
    await readOperation(owner, input.operation_id),
    created.receipt,
  );
  const approver = (await createSession("quotation-approver")).principal;
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.quote.approve'",
    [approver.actor_id],
  );
  await seed();
  assert.equal(
    (
      await rows(
        "SELECT 1 FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.quote.approve' AND valid_to IS NULL",
        [approver.actor_id],
      )
    ).length,
    0,
  );
});
