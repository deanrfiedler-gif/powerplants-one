import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createEstimate,
  saveEstimate,
  prepareQuote,
} from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import {
  submitEstimateReview,
  decideEstimateReview,
} from "../../src/estimating/review/service";
import { readEstimateReview } from "../../src/estimating/review/reads";
import { readOperation } from "../../src/shared/receipts";
import { reviewKinds } from "../../src/estimating/review/validation";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { sourceInput } from "../helpers/estimating-sources";
import {
  createCostSource,
  decideCostSource,
  reviseCostSource,
} from "../../src/estimating/sources/commands";
import { readCostSource } from "../../src/estimating/sources/reads";
import {
  previewSourceRefresh,
  applySourceRefresh,
} from "../../src/estimating/sources/refresh";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
async function fixture() {
  const p = (await createSession("coordinator")).principal,
    r = (await createSession("estimating-source-reviewer")).principal,
    o = crmCreate();
  await createOpportunity(p, o);
  const input = estimateInput(o.id);
  await createEstimate(p, input);
  const d = await readEstimate(p, input.id);
  return { p, r, input, d };
}
const submit = (d: Awaited<ReturnType<typeof readEstimateReview>>) => ({
  ...crmBase(),
  estimate_version_id: d.saved.id,
  basis_hash: d.basis_hash,
  expected_version: d.estimate.version,
  expected_review_version: d.sequence,
  responses: [],
});
const decide = (
  d: Awaited<ReturnType<typeof readEstimateReview>>,
  kind: string = "Completeness",
) => ({
  ...crmBase(),
  submission_id: d.submissions.at(-1)!.id,
  expected_version: d.estimate.version,
  expected_review_version: d.sequence,
  kind,
  outcome: "Reviewed",
  findings: [],
});
test("ES04 concurrent submission, original recovery and immutable events preserve exact estimate and Draft input", async () => {
  const f = await fixture(),
    before = f.d.saved,
    q = quoteCommand(before);
  await prepareQuote(f.p, f.d.id, q);
  const quote = (
    await database().query(
      "SELECT to_jsonb(q) AS row FROM ppo.draft_quote_revisions q WHERE id=$1",
      [q.id],
    )
  ).rows;
  const command = submit(await readEstimateReview(f.p, f.d.id));
  const races = await Promise.allSettled([
    submitEstimateReview(f.p, f.d.id, command),
    submitEstimateReview(f.p, f.d.id, {
      ...command,
      operation_id: randomUUID(),
    }),
  ]);
  assert.equal(races.filter((r) => r.status === "fulfilled").length, 1);
  const accepted = races.findIndex((r) => r.status === "fulfilled");
  // Always retain and replay the first intent separately; the concurrent loser cannot create a second submission.
  if (accepted === 0) {
    const original = await readOperation(f.p, command.operation_id);
    assert.deepEqual(
      (await submitEstimateReview(f.p, f.d.id, command)).receipt,
      original,
    );
    await assert.rejects(
      submitEstimateReview(f.p, f.d.id, {
        ...command,
        reason: "Altered original",
      }),
      code("OperationConflict"),
    );
  }
  const d = await readEstimateReview(f.r, f.d.id);
  assert.equal(d.submissions.length, 1);
  assert.equal(d.sequence, 1);
  await assert.rejects(
    submitEstimateReview(f.p, f.d.id, submit(d)),
    code("ReviewConflict"),
  );
  assert.equal(d.commercial_approval, "Not configured");
  await assert.rejects(
    database().query(
      "UPDATE ppo.estimate_review_events SET reason='Changed' WHERE estimate_id=$1",
      [f.d.id],
    ),
    code("55000"),
  );
  await assert.rejects(
    database().query(
      "DELETE FROM ppo.estimate_review_events WHERE estimate_id=$1",
      [f.d.id],
    ),
    code("55000"),
  );
  assert.deepEqual((await readEstimate(f.p, f.d.id)).saved, before);
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(q) AS row FROM ppo.draft_quote_revisions q WHERE id=$1",
        [q.id],
      )
    ).rows,
    quote,
  );
});
test("ES04 returned findings require attributable responses and independent review of a corrected successor", async () => {
  const f = await fixture();
  await submitEstimateReview(
    f.p,
    f.d.id,
    submit(await readEstimateReview(f.p, f.d.id)),
  );
  let d = await readEstimateReview(f.r, f.d.id);
  const returned = {
    ...decide(d),
    outcome: "Returned",
    findings: [
      {
        line_id: f.d.saved.lines[0].id,
        detail: "Clarify the scope description",
      },
    ],
  };
  await decideEstimateReview(f.r, f.d.id, returned);
  d = await readEstimateReview(f.p, f.d.id);
  await assert.rejects(
    submitEstimateReview(f.p, f.d.id, submit(d)),
    code("FindingResponsesRequired"),
  );
  const {
    id: _id,
    opportunity_id: _op,
    owner_id: _owner,
    ...content
  } = f.input;
  void _id;
  void _op;
  void _owner;
  await saveEstimate(f.p, f.d.id, {
    ...content,
    ...crmBase(),
    expected_version: 1,
    scope: { ...content.scope, included: "SYN clarified exact scope" },
  });
  d = await readEstimateReview(f.p, f.d.id);
  const correction = {
    ...submit(d),
    responses: [
      {
        finding_id: d.decisions[0].findings[0].id,
        response: "Saved the clarified scope in version 2",
      },
    ],
  };
  await submitEstimateReview(f.p, f.d.id, correction);
  for (const kind of reviewKinds) {
    d = await readEstimateReview(f.r, f.d.id);
    await decideEstimateReview(f.r, f.d.id, decide(d, kind));
  }
  d = await readEstimateReview(f.p, f.d.id);
  assert.equal(d.outcome, "Reviewed");
  assert.equal(d.submissions.length, 2);
  assert.equal(d.decisions[0].outcome, "Returned");
  assert.equal(d.submissions[1].predecessor_id, d.submissions[0].id);
  assert.deepEqual(d.submissions[1].responses, correction.responses);
  assert.equal(
    (await readOperation(f.r, returned.operation_id)).state,
    "Returned",
  );
});
test("ES04 price-only successor retains technical and completeness evidence but refuses stale price review", async () => {
  const f = await fixture();
  await submitEstimateReview(
    f.p,
    f.d.id,
    submit(await readEstimateReview(f.p, f.d.id)),
  );
  for (const kind of ["Completeness", "Technical"]) {
    await decideEstimateReview(
      f.r,
      f.d.id,
      decide(await readEstimateReview(f.r, f.d.id), kind),
    );
  }
  const stale = decide(await readEstimateReview(f.r, f.d.id), "SourcePrice");
  await saveEstimate(f.p, f.d.id, {
    ...crmBase(),
    expected_version: 1,
    title: f.input.title,
    scope: f.input.scope,
    policy: f.input.policy,
    lines: f.input.lines.map((l) => ({ ...l, unit_sell: "250" })),
  });
  await assert.rejects(
    decideEstimateReview(f.r, f.d.id, { ...stale, expected_version: 2 }),
    code("ReviewConflict"),
  );
  let d = await readEstimateReview(f.p, f.d.id);
  assert.deepEqual(
    d.statuses.map((s) => [s.kind, s.applicable]),
    [
      ["Completeness", true],
      ["SourcePrice", false],
      ["Technical", true],
    ],
  );
  await submitEstimateReview(f.p, f.d.id, submit(d));
  d = await readEstimateReview(f.r, f.d.id);
  await decideEstimateReview(f.r, f.d.id, decide(d, "SourcePrice"));
  d = await readEstimateReview(f.r, f.d.id);
  assert.equal(d.outcome, "Reviewed");
  assert.equal(d.decisions.length, 3);
  assert.equal(d.statuses[0].decision!.submission_id, d.submissions[0].id);
});
test("ES04 scope and duty revocation protect commands, exact originals and history; source duty alone cannot review", async () => {
  const f = await fixture(),
    command = submit(await readEstimateReview(f.p, f.d.id));
  await submitEstimateReview(f.p, f.d.id, command);
  let d = await readEstimateReview(f.r, f.d.id);
  const decision = decide(d);
  await decideEstimateReview(f.r, f.d.id, decision);
  for (const profile of [
    "second-company",
    "other-workspace",
    "assigned-technician",
    "systems",
  ]) {
    const p = (await createSession(profile)).principal;
    await assert.rejects(
      readEstimateReview(p, f.d.id),
      code("RecordUnavailable"),
    );
    await assert.rejects(submitEstimateReview(p, f.d.id, command));
    await assert.rejects(
      readOperation(p, command.operation_id),
      code("RecordUnavailable"),
    );
  }
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.review.completeness'",
    [f.r.actor_id],
  );
  await assert.rejects(
    readOperation(f.r, decision.operation_id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    decideEstimateReview(f.r, f.d.id, decision),
    code("RecordUnavailable"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='estimating.review.completeness'",
    [f.r.actor_id],
  );
  // Granting a duty to the owner still does not permit self-review.
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'estimating.review.technical','Company',$3)",
    [CRM.workspace, f.p.actor_id, CRM.company],
  );
  d = await readEstimateReview(f.p, f.d.id);
  await assert.rejects(
    decideEstimateReview(f.p, f.d.id, decide(d, "Technical")),
    code("IndependentReviewRequired"),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.review.technical'",
    [f.p.actor_id],
  );
  await database().query(
    "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE workspace_id=$1 AND organisation_id=$2 AND person_id=$3",
    [CRM.workspace, CRM.org, CRM.person],
  );
  await assert.rejects(
    readEstimateReview(f.r, f.d.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(f.p, command.operation_id),
    code("RecordUnavailable"),
  );
  await database().query(
    "UPDATE ppo.relationships SET valid_to=NULL WHERE workspace_id=$1 AND organisation_id=$2 AND person_id=$3",
    [CRM.workspace, CRM.org, CRM.person],
  );
});
test("ES04 two reviewers racing, and late evidence failure, cannot duplicate or partly record a decision", async () => {
  const f = await fixture();
  await submitEstimateReview(
    f.p,
    f.d.id,
    submit(await readEstimateReview(f.p, f.d.id)),
  );
  const d = await readEstimateReview(f.r, f.d.id),
    input = decide(d);
  const results = await Promise.allSettled([
    decideEstimateReview(f.r, f.d.id, input),
    decideEstimateReview(f.r, f.d.id, { ...input, operation_id: randomUUID() }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const next = decide(await readEstimateReview(f.r, f.d.id), "Technical");
  await database().query(
    "CREATE FUNCTION ppo.es04_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='EstimateReviewRecorded' THEN RAISE EXCEPTION 'Injected late failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER es04_test_failure BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.es04_test_failure()",
  );
  try {
    await assert.rejects(decideEstimateReview(f.r, f.d.id, next));
  } finally {
    await database().query(
      "DROP TRIGGER es04_test_failure ON ppo.outbox_jobs; DROP FUNCTION ppo.es04_test_failure()",
    );
  }
  assert.equal((await readEstimateReview(f.r, f.d.id)).sequence, 2);
  assert.equal(
    (
      await database().query(
        "SELECT 1 FROM ppo.operation_receipts WHERE operation_id=$1",
        [next.operation_id],
      )
    ).rowCount,
    0,
  );
  const accepted = await decideEstimateReview(f.r, f.d.id, next);
  assert.deepEqual(
    (await decideEstimateReview(f.r, f.d.id, next)).receipt,
    accepted.receipt,
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "INSERT INTO ppo.estimate_review_events SELECT $1,workspace_id,company_id,estimate_id,estimate_version_id,4,submission_id,NULL,'SourcePrice','Reviewed',NULL,'[]','[]',reason,created_by,clock_timestamp(),$2 FROM ppo.estimate_review_events WHERE id=$3",
        [
          randomUUID(),
          randomUUID(),
          (await readEstimateReview(f.r, f.d.id)).decisions[0].id,
        ],
      );
    }),
    code("23514"),
  );
});
test("ES04 later source revisions invalidate only source-price review and preserve earlier reviewed bindings", async () => {
  const f = await fixture(),
    source = sourceInput();
  await createCostSource(f.p, source);
  const sd = await readCostSource(f.p, source.id);
  await decideCostSource(f.p, source.id, {
    ...crmBase(),
    expected_version: 1,
    revision_id: sd.revision.id,
    action: "Submit",
  });
  await decideCostSource(f.r, source.id, {
    ...crmBase(),
    expected_version: 2,
    revision_id: sd.revision.id,
    action: "Reviewed",
  });
  const proposal = {
    estimate_version_id: f.d.saved.id,
    pricing_date: "2026-09-24",
    selections: [
      {
        line_id: f.d.saved.lines[0].id,
        source_id: source.id,
        revision_id: sd.revision.id,
        expected_source_version: 3,
      },
    ],
  };
  const comparison = await previewSourceRefresh(f.p, f.d.id, proposal);
  await applySourceRefresh(f.p, f.d.id, {
    ...crmBase(),
    expected_version: 1,
    proposal,
    comparison_hash: comparison.comparison_hash,
    reviewed: true,
  });
  await submitEstimateReview(
    f.p,
    f.d.id,
    submit(await readEstimateReview(f.p, f.d.id)),
  );
  for (const kind of reviewKinds)
    await decideEstimateReview(
      f.r,
      f.d.id,
      decide(await readEstimateReview(f.r, f.d.id), kind),
    );
  const before = await readEstimateReview(f.p, f.d.id);
  await reviseCostSource(f.p, source.id, {
    ...crmBase(),
    expected_version: 3,
    content: {
      ...source.content,
      evidence_excerpt: "SYN newer source observation; original retained",
    },
  });
  let d = await readEstimateReview(f.r, f.d.id);
  assert.deepEqual(
    d.statuses.map((s) => s.applicable),
    [true, false, true],
  );
  assert.equal(d.outcome, "Review required");
  assert.deepEqual(d.saved, before.saved);
  await assert.rejects(
    submitEstimateReview(f.p, f.d.id, submit(before)),
    code("ReviewConflict"),
  );
  assert.equal(
    (await readEstimateReview(f.p, f.d.id)).sequence,
    before.sequence,
  );
  await submitEstimateReview(f.p, f.d.id, submit(d));
  d = await readEstimateReview(f.r, f.d.id);
  await decideEstimateReview(f.r, f.d.id, decide(d, "SourcePrice"));
  assert.equal((await readEstimateReview(f.r, f.d.id)).outcome, "Reviewed");
  assert.deepEqual(
    (await readEstimate(f.p, f.d.id)).saved.source_bindings,
    before.saved.source_bindings,
  );
});
