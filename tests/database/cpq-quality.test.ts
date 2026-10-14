import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  assessQuality,
  reviewQuality,
  readQuality,
} from "../../src/cpq/quality";
import {
  saveRelease,
  activateRelease,
  reviewRelease,
  sealRelease,
} from "../../src/cpq/releases";
import { readRelease } from "../../src/cpq/reads";
import { readEstimate } from "../../src/estimating/reads";
import { saveEstimate, prepareQuote } from "../../src/estimating/service";
import { arithmeticPolicy } from "../../src/estimating/math";
import { readOperation } from "../../src/shared/receipts";
import { reviseCostSource } from "../../src/estimating/sources/commands";
import {
  qualitySetup,
  qualityActors,
  qualityEstimate,
  currentQuality,
  retainedQuality,
  assessAndReview,
} from "../helpers/cpq-quality";
import { reviewedCost, costDefinition } from "../helpers/cpq-costs";
import { cpqDefinition } from "../helpers/cpq";
import { manualLines, quoteCommand } from "../helpers/estimating";
import { crmBase, CRM } from "../helpers/crm";
import { productFixture, publishProduct } from "../helpers/products";
import { decideProduct } from "../../src/products/commands";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
const activation = async (s: Awaited<ReturnType<typeof qualitySetup>>) => ({
  ...crmBase(),
  expected_version: (await readRelease(s.publisher, s.view.release.id)).release
    .version,
  revision_id: s.view.current.id,
  content_hash: s.view.current.content_hash,
  expected_activation_version: 1,
});
async function manualChange(s: Awaited<ReturnType<typeof qualitySetup>>) {
  const prior = await readEstimate(s.p, s.estimate!.command.estimate_id);
  await saveEstimate(s.p, prior.id, {
    ...crmBase(),
    expected_version: prior.version,
    title: prior.saved.title,
    scope: prior.saved.scope,
    schema_version: 2,
    policy: arithmeticPolicy,
    lines: [
      ...prior.saved.lines.map((l, i) => (i ? l : { ...l, quantity: "3.000" })),
      { ...manualLines()[0], allowance: false },
    ],
  });
  return readEstimate(s.p, prior.id);
}
async function evidence() {
  return rows(`SELECT * FROM (SELECT 'audit' kind,to_jsonb(a) value FROM ppo.audit_events a WHERE object_type IN ('CpqRelease','CpqRun')
    UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r
    UNION ALL SELECT 'run',to_jsonb(r) FROM ppo.cpq_runs r
    UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v
    UNION ALL SELECT 'grant',to_jsonb(g) FROM ppo.permission_grants g
    ) evidence ORDER BY kind,value::text`);
}

test("quality binds manual/current estimate and immutable catalogue basis; independent activation and original recovery preserve quotation privacy", async () => {
  const s = await qualitySetup(true);
  const native = await manualChange(s);
  const q = await currentQuality(s.p, s.view.release.id);
  assert.equal(q.enrolled, false);
  assert.equal(q.report.baseline!.revision_id, s.baseline.current.id);
  assert.equal(q.report.fixtures[0].passed, true);
  assert.equal(q.report.baseline_regression[0].passed, false);
  assert.equal(q.report.affected_estimates.length, 1);
  const impact = q.report.affected_estimates[0];
  assert.deepEqual(impact.current_native.lines, native.saved.lines);
  assert.equal(impact.simulation!.totals.cost, "74.00");
  assert.equal(impact.previous_calculation.totals.cost, "70.00");
  assert.equal(impact.receiving, "ExplicitRebaseAndAdoptionRequired");
  const accepted = await assessAndReview(s);
  const before = await evidence();
  const command = await activation(s);
  const published = await activateRelease(
    s.publisher,
    s.view.release.id,
    command,
  );
  assert.equal(
    (await activateRelease(s.publisher, s.view.release.id, command)).replayed,
    true,
  );
  assert.deepEqual(
    await readOperation(s.publisher, command.operation_id),
    published.receipt,
  );
  assert.deepEqual(
    (await assessQuality(s.p, s.view.release.id, accepted.assess)).receipt,
    accepted.receipt.receipt,
  );
  assert.deepEqual(
    (await reviewQuality(s.reviewer, s.view.release.id, accepted.review))
      .receipt,
    accepted.reviewed.receipt,
  );
  assert.deepEqual(
    await readOperation(s.p, accepted.assess.operation_id),
    accepted.receipt.receipt,
  );
  assert.deepEqual(
    (
      await retainedQuality(
        s.p,
        s.view.release.id,
        accepted.review.assessment_id,
      )
    ).assessment.details.report,
    q.report,
  );
  assert.deepEqual((await readEstimate(s.p, native.id)).saved, native.saved);
  const quote = await prepareQuote(
    s.p,
    native.id,
    quoteCommand(native.saved, native.version),
  );
  const safe = (
    await rows(
      "SELECT safe_snapshot,input_html FROM ppo.draft_quote_revisions WHERE id=$1",
      [quote.receipt.record_id],
    )
  )[0];
  assert.ok(safe);
  assert.doesNotMatch(
    JSON.stringify(safe),
    /report_hash|quality_assessment|unit_cost|rule_members|baseline_regression/,
  );
  const after = await evidence();
  for (const row of before)
    assert.ok(after.some((v) => JSON.stringify(v) === JSON.stringify(row)));
  await assert.rejects(
    rows("UPDATE ppo.audit_events SET reason='changed' WHERE id=$1", [
      accepted.review.assessment_id,
    ]),
    code("55000"),
  );
});

test("changed native versions and new affected estimates refuse exact approval/publication; historical receipts survive", async () => {
  const s = await qualitySetup(true);
  const preview = await currentQuality(s.p, s.view.release.id);
  const command = {
    ...crmBase(),
    expected_version: preview.expected_version,
    report_hash: preview.report_hash,
  };
  const receipt = await assessQuality(s.p, s.view.release.id, command);
  const current = await currentQuality(s.reviewer, s.view.release.id);
  await manualChange(s);
  await assert.rejects(
    reviewQuality(s.reviewer, s.view.release.id, {
      ...crmBase(),
      expected_version: current.expected_version,
      assessment_id: current.latest_assessment!.id,
      report_hash: current.report_hash,
      outcome: "Approved",
    }),
    code("CpqQualityChanged"),
  );
  assert.deepEqual(
    (await assessQuality(s.p, s.view.release.id, command)).receipt,
    receipt.receipt,
  );
  const accepted = await assessAndReview(s);
  await qualityEstimate(s.p);
  await assert.rejects(
    activateRelease(s.publisher, s.view.release.id, await activation(s)),
    code("CpqQualityChanged"),
  );
  const historical = await retainedQuality(
    s.p,
    s.view.release.id,
    accepted.review.assessment_id,
  );
  assert.equal(
    historical.assessment.details.report.affected_estimates.length,
    1,
  );
  assert.equal(
    (await currentQuality(s.p, s.view.release.id)).report.affected_estimates
      .length,
    2,
  );
});

test("assessment enrollment cannot be bypassed by a successor; independent duties and revoked authority gate new use and recovery", async () => {
  const s = await qualitySetup(true);
  const accepted = await assessAndReview(s);
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'",
    [s.reviewer.actor_id],
  );
  await assert.rejects(
    activateRelease(s.publisher, s.view.release.id, await activation(s)),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(s.reviewer, accepted.review.operation_id),
    code("RecordUnavailable"),
  );
  await rows(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'crm.opportunity.read','Company',$3)",
    [CRM.workspace, s.reviewer.actor_id, CRM.company],
  );
  const root = await readRelease(s.p, s.view.release.id);
  await saveRelease(s.p, {
    ...crmBase(),
    id: s.view.release.id,
    company_id: CRM.company,
    expected_version: root.release.version,
    definition: cpqDefinition(),
  });
  const next = await readRelease(s.p, s.view.release.id);
  await reviewRelease(s.reviewer, s.view.release.id, {
    ...crmBase(),
    expected_version: next.release.version,
    revision_id: next.current.id,
    content_hash: next.current.content_hash,
    outcome: "Approved",
  });
  await assert.rejects(
    activateRelease(s.publisher, s.view.release.id, {
      ...(await activation(s)),
      revision_id: next.current.id,
      content_hash: next.current.content_hash,
    }),
    code("CpqQualityReviewRequired"),
  );
  assert.equal((await currentQuality(s.p, s.view.release.id)).enrolled, true);
  const outsider = (await createSession("second-company")).principal;
  await assert.rejects(
    readQuality(outsider, s.view.release.id),
    code("RecordUnavailable"),
  );
});

test("atomic assessment rollback and concurrent original commands retain exactly one accepted audit, outbox and receipt", async () => {
  const s = await qualitySetup();
  const preview = await currentQuality(s.p, s.view.release.id);
  const command = {
    ...crmBase(),
    expected_version: preview.expected_version,
    report_hash: preview.report_hash,
  };
  await rows(`CREATE FUNCTION ppo.fail_quality_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF NEW.operation_id='${command.operation_id}'::uuid THEN RAISE EXCEPTION 'SYN rollback proof'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER fail_quality_test BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.fail_quality_test()`);
  try {
    await assert.rejects(
      assessQuality(s.p, s.view.release.id, command),
      /SYN rollback proof/,
    );
  } finally {
    await rows(
      "DROP TRIGGER fail_quality_test ON ppo.outbox_jobs; DROP FUNCTION ppo.fail_quality_test()",
    );
  }
  assert.equal(
    (await readRelease(s.p, s.view.release.id)).release.version,
    preview.expected_version,
  );
  assert.equal((await currentQuality(s.p, s.view.release.id)).enrolled, false);
  assert.equal(
    (
      await rows(
        "SELECT id FROM ppo.operation_receipts WHERE operation_id=$1",
        [command.operation_id],
      )
    ).length,
    0,
  );
  const results = await Promise.all([
    assessQuality(s.p, s.view.release.id, command),
    assessQuality(s.p, s.view.release.id, command),
  ]);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.deepEqual(results.map((r) => r.replayed).sort(), [false, true]);
  for (const table of ["audit_events", "operation_receipts", "outbox_jobs"])
    assert.equal(
      (
        await rows(
          `SELECT count(*)::integer n FROM ppo.${table} WHERE operation_id=$1`,
          [command.operation_id],
        )
      )[0].n,
      1,
    );
  const now = await currentQuality(s.p, s.view.release.id);
  const race = await Promise.allSettled(
    [1, 2].map(() =>
      assessQuality(s.p, s.view.release.id, {
        ...crmBase(),
        expected_version: now.expected_version,
        report_hash: now.report_hash,
      }),
    ),
  );
  assert.equal(race.filter((x) => x.status === "fulfilled").length, 1);
  await assert.rejects(
    assessQuality(s.p, s.view.release.id, {
      ...command,
      reason: "Changed reason",
    }),
    code("OperationConflict"),
  );
  const before = await evidence();
  const ledger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await evidence(), before);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    ledger,
  );
});

test("independent assessment decisions are immutable; rejected and superseded assessments never authorise publication", async () => {
  const s = await qualitySetup();
  const q = await currentQuality(s.p, s.view.release.id);
  await assessQuality(s.p, s.view.release.id, {
    ...crmBase(),
    expected_version: q.expected_version,
    report_hash: q.report_hash,
  });
  const assessed = await currentQuality(s.p, s.view.release.id);
  await rows(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'cpq.review','Company',$3)",
    [CRM.workspace, s.p.actor_id, CRM.company],
  );
  const review = {
    ...crmBase(),
    expected_version: assessed.expected_version,
    assessment_id: assessed.latest_assessment!.id,
    report_hash: assessed.report_hash,
    outcome: "Approved",
  };
  await assert.rejects(
    reviewQuality(s.p, s.view.release.id, review),
    code("CpqIndependentQualityReview"),
  );
  await reviewQuality(s.reviewer, s.view.release.id, {
    ...review,
    outcome: "Rejected",
  });
  await assert.rejects(
    activateRelease(s.publisher, s.view.release.id, await activation(s)),
    code("CpqQualityReviewRequired"),
  );
  const accepted = await assessAndReview(s);
  const newer = await currentQuality(s.p, s.view.release.id);
  await assessQuality(s.p, s.view.release.id, {
    ...crmBase(),
    expected_version: newer.expected_version,
    report_hash: newer.report_hash,
  });
  await assert.rejects(
    activateRelease(s.publisher, s.view.release.id, await activation(s)),
    code("CpqQualityReviewRequired"),
  );
  assert.deepEqual(
    (await reviewQuality(s.reviewer, s.view.release.id, accepted.review))
      .receipt,
    accepted.reviewed.receipt,
  );
});

test("schema-three native members and seal survive quality review; schema-four changed sources preserve historical evidence only", async () => {
  const actors = await qualityActors();
  const d = {
    ...cpqDefinition(),
    schema_version: 3,
    design: {
      option_sets: [],
      structure: [],
      shared_capacity: [],
      decision_tables: [],
      pricing: { mode: "Catalog", percent: "0", allow_override: false },
    },
  };
  const id = randomUUID();
  await saveRelease(actors.p, {
    ...crmBase(),
    id,
    company_id: CRM.company,
    expected_version: 0,
    definition: d,
  });
  const v = await readRelease(actors.p, id);
  await reviewRelease(actors.reviewer, id, {
    ...crmBase(),
    expected_version: 1,
    revision_id: v.current.id,
    content_hash: v.current.content_hash,
    outcome: "Approved",
  });
  const q = await currentQuality(actors.p, id);
  assert.equal(q.report.rule_members.length, 2);
  await assessQuality(actors.p, id, {
    ...crmBase(),
    expected_version: 2,
    report_hash: q.report_hash,
  });
  const a = await currentQuality(actors.reviewer, id);
  await reviewQuality(actors.reviewer, id, {
    ...crmBase(),
    expected_version: 3,
    assessment_id: a.latest_assessment!.id,
    report_hash: a.report_hash,
    outcome: "Approved",
  });
  await sealRelease(actors.publisher, id, {
    ...crmBase(),
    expected_version: 4,
    revision_id: v.current.id,
    content_hash: v.current.content_hash,
  });
  await activateRelease(actors.publisher, id, {
    ...crmBase(),
    expected_version: 5,
    revision_id: v.current.id,
    content_hash: v.current.content_hash,
    expected_activation_version: 0,
  });
  const ref = await reviewedCost(actors.p);
  const labour = await reviewedCost(actors.p, "hour", "40");
  const costId = randomUUID();
  await saveRelease(actors.p, {
    ...crmBase(),
    id: costId,
    company_id: CRM.company,
    expected_version: 0,
    definition: costDefinition([ref, labour]),
  });
  const cq = await currentQuality(actors.p, costId);
  const command = {
    ...crmBase(),
    expected_version: 1,
    report_hash: cq.report_hash,
  };
  const receipt = await assessQuality(actors.p, costId, command);
  const ca = await currentQuality(actors.p, costId);
  await reviseCostSource(actors.p, ref.source_id, {
    ...crmBase(),
    expected_version: ref.source_version,
    content: {
      ...ref.content,
      tiers: [{ minimum_quantity: "0.001", unit_cost: "9.00" }],
    },
  });
  await assert.rejects(
    currentQuality(actors.p, costId),
    code("CpqCostSourceChanged"),
  );
  assert.equal(
    (await retainedQuality(actors.p, costId, ca.latest_assessment!.id))
      .assessment.details.report.cost_sources.length,
    2,
  );
  assert.deepEqual(
    (await assessQuality(actors.p, costId, command)).receipt,
    receipt.receipt,
  );
});

test("exact published Product assessment is retained after withdrawal while new assessment and approval refuse it", async () => {
  const actors = await qualityActors(),
    f = await productFixture();
  const product = await publishProduct(f.author.p, f.reviewer.p, f.variant.id);
  for (const actor of [actors.p, actors.reviewer, actors.publisher])
    await rows(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'products.read','Company',$3) ON CONFLICT DO NOTHING",
      [CRM.workspace, actor.actor_id, CRM.company],
    );
  const d = cpqDefinition();
  d.schema_version = 2;
  d.parts[0].product = {
    product_id: product.product.id,
    revision_id: product.revision.id,
    content_hash: product.revision.content_hash,
    relationships: [],
  };
  const id = randomUUID();
  await saveRelease(actors.p, {
    ...crmBase(),
    id,
    company_id: CRM.company,
    expected_version: 0,
    definition: d,
  });
  const q = await currentQuality(actors.p, id);
  assert.equal(q.report.products[0].revision_id, product.revision.id);
  assert.equal(q.report.products[0].availability, "Unknown");
  const command = {
    ...crmBase(),
    expected_version: 1,
    report_hash: q.report_hash,
  };
  const receipt = await assessQuality(actors.p, id, command);
  const a = await currentQuality(actors.reviewer, id);
  await decideProduct(f.author.p, product.product.id, {
    ...crmBase(),
    expected_version: product.product.version,
    revision_id: product.revision.id,
    action: "Withdrawn",
  });
  await assert.rejects(
    reviewQuality(actors.reviewer, id, {
      ...crmBase(),
      expected_version: 2,
      assessment_id: a.latest_assessment!.id,
      report_hash: a.report_hash,
      outcome: "Approved",
    }),
    code("CpqProductPublicationChanged"),
  );
  assert.deepEqual(
    (await retainedQuality(actors.p, id, a.latest_assessment!.id)).assessment
      .details.report,
    q.report,
  );
  assert.deepEqual(
    (await assessQuality(actors.p, id, command)).receipt,
    receipt.receipt,
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='products.read'",
    [actors.p.actor_id],
  );
  await assert.rejects(
    readOperation(actors.p, command.operation_id),
    code("RecordUnavailable"),
  );
});

test("complete 25-estimate impact is measured and 26 refuses without enrolling a partial assessment", async (t) => {
  const s = await qualitySetup();
  for (let n = 0; n < 25; n++) await qualityEstimate(s.p);
  const started = performance.now();
  const q = await currentQuality(s.p, s.view.release.id);
  t.diagnostic(
    JSON.stringify({
      synthetic_open_estimates: 25,
      report_bytes: Buffer.byteLength(JSON.stringify(q.report)),
      elapsed_ms: Math.round(performance.now() - started),
    }),
  );
  assert.equal(q.report.affected_estimates.length, 25);
  await qualityEstimate(s.p);
  await assert.rejects(
    currentQuality(s.p, s.view.release.id),
    code("CpqQualityLimit"),
  );
  await assert.rejects(
    assessQuality(s.p, s.view.release.id, {
      ...crmBase(),
      expected_version: q.expected_version,
      report_hash: q.report_hash,
    }),
    code("CpqQualityLimit"),
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.audit_events WHERE object_id=$1 AND details->>'command'='Cpq:AssessQuality'",
        [s.view.release.id],
      )
    )[0].n,
    0,
  );
});

test("failed candidate fixtures cannot receive impact approval; rejected evidence remains readable", async () => {
  const s = await qualityActors();
  const id = randomUUID(),
    d = cpqDefinition();
  d.fixtures[0].expected.cost = "0.00";
  await saveRelease(s.p, {
    ...crmBase(),
    id,
    company_id: CRM.company,
    expected_version: 0,
    definition: d,
  });
  const q = await currentQuality(s.p, id);
  assert.equal(q.report.approval_eligible, false);
  await assessQuality(s.p, id, {
    ...crmBase(),
    expected_version: 1,
    report_hash: q.report_hash,
  });
  const a = await currentQuality(s.reviewer, id);
  const review = {
    ...crmBase(),
    expected_version: 2,
    assessment_id: a.latest_assessment!.id,
    report_hash: a.report_hash,
    outcome: "Approved",
  };
  await assert.rejects(
    reviewQuality(s.reviewer, id, review),
    code("CpqQualityFailed"),
  );
  await reviewQuality(s.reviewer, id, { ...review, outcome: "Rejected" });
  assert.equal(
    (await retainedQuality(s.p, id, review.assessment_id)).review!.details
      .outcome,
    "Rejected",
  );
});
