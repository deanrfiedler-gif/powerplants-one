import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { withWorkingCompany } from "../../src/platform/working-company";
import {
  createProposal,
  reviseProposal,
  reviewProposal,
} from "../../src/documents/drafts/commands";
import {
  listProposals,
  readProposal,
  proposalHistory,
  readBindings,
} from "../../src/documents/drafts/reads";
import { readTemplateScopes } from "../../src/documents/workspace-reads";
import { readOperation } from "../../src/shared/receipts";
import {
  base,
  id,
  principal,
  setupDraft,
  draftInput,
  revisionInput,
  reviewCommand,
  grantDraft,
} from "../helpers/template-drafts";
import { queued } from "../helpers/packs";
import { processRenderJob, readBundle } from "../../src/documents/worker";
import { reconciledFinance, readFinance } from "../helpers/finance";
import {
  requestFinanceEvidence,
  processFinanceJob,
} from "../../src/finance/worker";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const rows = async (sql: string, args: unknown[] = []) =>
  (await database().query(sql, args)).rows;
const unavailable = { code: "RecordUnavailable" };

test("R2 denies all new duties by default; creates exact proposals for three families with original receipts", async () => {
  assert.equal(
    (
      await rows(
        "SELECT id FROM ppo.permission_grants WHERE capability LIKE 'template.%'",
      )
    ).length,
    0,
  );
  const p0 = await principal(),
    first = await draftInput(p0);
  await assert.rejects(createProposal(p0, first), unavailable);
  await assert.rejects(readTemplateScopes(p0, { family: "OUT-09" }), {
    code: "Forbidden",
  });
  assert.deepEqual((await listProposals(p0, { family: "OUT-09" })).items, []);
  const { p } = await setupDraft();
  const scopes = await readTemplateScopes(p, { family: "OUT-09", limit: "1" });
  assert.equal(scopes.items.length, 1);
  assert.ok(scopes.items[0].company_name);
  assert.ok(scopes.items[0].site_name);
  assert.equal(scopes.items[0].can_propose, true);
  assert.equal(scopes.items[0].can_assign, false);
  const other = await principal("systems");
  await assert.rejects(readTemplateScopes(other, { family: "OUT-09" }), {
    code: "Forbidden",
  });
  if (scopes.next_cursor)
    await assert.rejects(
      readTemplateScopes(p, {
        family: "OUT-10",
        limit: "1",
        cursor: scopes.next_cursor,
      }),
      { code: "InvalidData" },
    );
  for (const family of ["OUT-09", "OUT-10", "OUT-14"] as const) {
    const input = await draftInput(p, family),
      a = await createProposal(p, input);
    assert.equal(a.replayed, false);
    const d = await readProposal(p, input.id);
    assert.equal(d.proposal.state, "Draft");
    assert.equal(d.publication_eligible, false);
    assert.equal(d.supported_runtime_version, null);
    assert.equal(d.revision.base.content_hash, input.base_content_hash);
    assert.deepEqual(d.revision.body, input.body);
    assert.deepEqual((await createProposal(p, input)).receipt, a.receipt);
    assert.deepEqual(await readOperation(p, input.operation_id), a.receipt);
    await assert.rejects(
      createProposal(p, { ...input, reason: "Different original intent" }),
      { code: "OperationConflict" },
    );
    await assert.rejects(
      createProposal(p, {
        ...input,
        ...base(),
        id: randomUUID(),
        revision_id: randomUUID(),
        base_content_hash: "a".repeat(64),
      }),
      { code: "StaleTemplate" },
    );
  }
});
test("R2 independent exact reviews remain historical; edits invalidate review, and concurrent writes accept only one", async () => {
  const { p, reviewer } = await setupDraft(),
    input = await draftInput(p);
  await createProposal(p, input);
  const review = await reviewCommand(reviewer, input.id);
  await assert.rejects(reviewProposal(p, input.id, { ...review, ...base() }), {
    code: "IndependentReviewRequired",
  });
  await assert.rejects(
    reviewProposal(reviewer, input.id, {
      ...review,
      content_hash: "0".repeat(64),
    }),
    { code: "StaleVersion" },
  );
  const accepted = await reviewProposal(reviewer, input.id, review);
  assert.deepEqual(
    (await reviewProposal(reviewer, input.id, review)).receipt,
    accepted.receipt,
  );
  assert.equal((await readProposal(p, input.id)).proposal.state, "Reviewed");
  const a = await revisionInput(p, input.id),
    b = {
      ...a,
      ...base(),
      revision_id: randomUUID(),
      body: { ...a.body, title: "SYN competing edit" },
    };
  const race = await Promise.allSettled([
    reviseProposal(p, input.id, a),
    reviseProposal(p, input.id, b),
  ]);
  assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    (race.find((r) => r.status === "rejected") as PromiseRejectedResult).reason
      .code,
    "StaleVersion",
  );
  const current = await readProposal(p, input.id);
  assert.equal(current.proposal.state, "Draft");
  assert.equal(current.latest_review, null);
  const old = await readProposal(p, input.id, {
    revision_id: input.revision_id,
  });
  assert.equal(old.latest_review.id, review.review_id);
  assert.equal(old.is_current_revision, false);
  await assert.rejects(
    reviewProposal(reviewer, input.id, {
      ...review,
      ...base(),
      review_id: randomUUID(),
      expected_version: current.proposal.version,
    }),
    { code: "StaleVersion" },
  );
  assert.equal((await createProposal(p, input)).replayed, true);
  assert.deepEqual(
    await readOperation(reviewer, review.operation_id),
    accepted.receipt,
  );
  await assert.rejects(readOperation(p, review.operation_id), unavailable);
  const correction = await reviewCommand(
    reviewer,
    input.id,
    "ChangesRequested",
  );
  correction.checks.audience = {
    result: "Blocked",
    note: "SYN wording needs correction.",
  };
  await reviewProposal(reviewer, input.id, correction);
  assert.equal(
    (await readProposal(p, input.id)).proposal.state,
    "ChangesRequested",
  );
  const history = await proposalHistory(p, input.id, {
    kind: "Revision",
    limit: "1",
  });
  assert.equal(history.completeness, "Partial");
  assert.equal(history.items[0].revision, 1);
  assert.equal(history.items[0].id, input.revision_id);
  const continuation = await proposalHistory(p, input.id, {
    kind: "Revision",
    limit: "1",
    cursor: history.next_cursor!,
  });
  assert.equal(continuation.items[0].revision, 2);
  assert.equal(continuation.next_cursor, null);
  assert.ok(continuation.items[0].actor_name);
  assert.equal(
    (
      await proposalHistory(p, input.id, {
        kind: "Revision",
        limit: "1",
        cursor: history.next_cursor!,
      })
    ).items.length,
    1,
  );
  await assert.rejects(
    proposalHistory(reviewer, input.id, {
      kind: "Revision",
      limit: "1",
      cursor: history.next_cursor!,
    }),
    { code: "InvalidData" },
  );
});
test("R2 current company, site, family and source grants govern lists, bindings, originals and history", async () => {
  const { p } = await setupDraft(),
    input = await draftInput(p);
  input.body.fields = [
    { key: "work", label: "Work", binding: "work.reference", required: true },
  ];
  await createProposal(p, input);
  for (const profile of ["second-company", "other-workspace", "systems"]) {
    const actor = await principal(profile);
    assert.deepEqual(
      (await listProposals(actor, { family: "OUT-09" })).items,
      [],
    );
    await assert.rejects(readProposal(actor, input.id), unavailable);
  }
  await assert.rejects(
    withWorkingCompany(p.actor_id, id("20", 2), () =>
      readProposal(p, input.id),
    ),
    unavailable,
  );
  const bindings = await readBindings(p, {
    family: "OUT-09",
    company_id: id("20"),
    site_id: id("70"),
  });
  assert.equal(bindings.items.length, 4);
  const grants = await rows(
    "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.work_order.read'",
    [p.actor_id],
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='service.work_order.read'",
    [p.actor_id],
  );
  try {
    await assert.rejects(readProposal(p, input.id), unavailable);
    await assert.rejects(createProposal(p, input), unavailable);
    await assert.rejects(readOperation(p, input.operation_id), unavailable);
    assert.equal(
      (await listProposals(p, { family: "OUT-09" })).items.some(
        (x) => x.id === input.id,
      ),
      false,
    );
    assert.equal(
      (
        await readBindings(p, {
          family: "OUT-09",
          company_id: id("20"),
          site_id: id("70"),
        })
      ).items.some((x) => x.binding === "work.reference"),
      false,
    );
  } finally {
    for (const g of grants)
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
        [g.id, g.valid_to],
      );
  }
  const reader = await principal("observer");
  await grantDraft(reader, ["template.read", "pack.read", "shared.read"]);
  await assert.rejects(
    createProposal(reader, await draftInput(reader)),
    unavailable,
  );
  const finance = await draftInput(p, "OUT-14");
  finance.body.fields = [
    { key: "account", label: "Account", binding: "account", required: true },
  ];
  const accountGrants = await rows(
    "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='finance.account.read'",
    [p.actor_id],
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='finance.account.read'",
    [p.actor_id],
  );
  try {
    await assert.rejects(createProposal(p, finance), unavailable);
  } finally {
    for (const g of accountGrants)
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
        [g.id, g.valid_to],
      );
  }
});
test("R2 rollback leaves no partial graph; retry of the same originals persists once and SQL evidence cannot be rewritten", async () => {
  const { p } = await setupDraft(),
    input = await draftInput(p);
  await database().query(
    "CREATE FUNCTION ppo.reject_draft_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.payload->>'object_type'='TemplateProposal' THEN RAISE EXCEPTION 'SYN injected write failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_draft_test BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.reject_draft_test()",
  );
  try {
    await assert.rejects(
      createProposal(p, input),
      /SYN injected write failure/,
    );
  } finally {
    await database().query(
      "DROP TRIGGER reject_draft_test ON ppo.outbox_jobs; DROP FUNCTION ppo.reject_draft_test()",
    );
  }
  assert.equal(
    (
      await rows("SELECT id FROM ppo.business_identities WHERE id=$1", [
        input.id,
      ])
    ).length,
    0,
  );
  assert.equal(
    (
      await rows(
        "SELECT id FROM ppo.operation_receipts WHERE operation_id=$1",
        [input.operation_id],
      )
    ).length,
    0,
  );
  await createProposal(p, input);
  for (const table of [
    "template_proposal_revisions",
    "template_proposal_events",
  ])
    await assert.rejects(
      database().query(`DELETE FROM ppo.${table} WHERE proposal_id=$1`, [
        input.id,
      ]),
      { code: "55000" },
    );
  await assert.rejects(
    database().query(
      "UPDATE ppo.template_proposals SET state='Reviewed',version=version+1 WHERE id=$1",
      [input.id],
    ),
    { code: "23514" },
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "UPDATE ppo.template_proposals SET version=version+1 WHERE id=$1",
        [input.id],
      );
      await c.query("SET CONSTRAINTS ALL IMMEDIATE");
    }),
    { code: "23514" },
  );
  assert.equal((await readProposal(p, input.id)).proposal.version, 1);
  await closeDatabase();
  assert.equal((await createProposal(p, input)).replayed, true);
});
test("R2 retains a queued render unchanged, lets that exact job complete, and preserves issued bytes through later edits", async () => {
  const { p, reviewer } = await setupDraft(),
    f = await reconciledFinance(),
    fd = await readFinance(f.reconciler, f.id);
  const review = (
      await rows("SELECT id FROM ppo.finance_reviews WHERE handoff_id=$1", [
        f.id,
      ])
    )[0],
    recon = (
      await rows(
        "SELECT id FROM ppo.finance_reconciliations WHERE handoff_id=$1",
        [f.id],
      )
    )[0];
  await requestFinanceEvidence(f.reconciler, f.id, {
    ...base(),
    expected_version: fd.handoff.version,
    revision_id: fd.handoff.current_revision_id,
    review_id: review.id,
    reconciliation_id: recon.id,
  });
  const fj = (
    await rows("SELECT id FROM ppo.finance_render_jobs WHERE handoff_id=$1", [
      f.id,
    ])
  )[0];
  assert.ok("issue_id" in (await processFinanceJob(fj.id)));
  const q = await queued(10);
  const tables = [
    "pack_templates",
    "report_templates",
    "finance_templates",
    "pack_policy",
    "report_template_policy",
    "finance_template_policy",
    "pack_revisions",
    "report_revisions",
    "finance_revisions",
    "pack_render_jobs",
    "report_render_jobs",
    "finance_render_jobs",
    "pack_issues",
    "report_issues",
    "finance_issues",
  ];
  const snapshot = () =>
    Promise.all(
      tables.map((t) =>
        rows(
          `SELECT to_jsonb(r) AS value FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
        ),
      ),
    );
  const before = await snapshot(),
    input = await draftInput(p);
  for (const draft of [
    input,
    await draftInput(p, "OUT-10"),
    await draftInput(p, "OUT-14"),
  ]) {
    await createProposal(p, draft);
    await reviewProposal(
      reviewer,
      draft.id,
      await reviewCommand(reviewer, draft.id),
    );
  }
  assert.deepEqual(await snapshot(), before);
  const job = q.pack.jobs[0],
    released = await processRenderJob(job.id);
  assert.ok("issue_id" in released);
  const issue = String(released.issue_id);
  const manifest = (
    await rows("SELECT manifest FROM ppo.pack_issues WHERE id=$1", [issue])
  )[0].manifest;
  const bytes = await readBundle(p, manifest);
  const frozen = await snapshot();
  await reviseProposal(p, input.id, await revisionInput(p, input.id));
  assert.deepEqual(await snapshot(), frozen);
  assert.deepEqual((await readBundle(p, manifest)).pdf, bytes.pdf);
});
