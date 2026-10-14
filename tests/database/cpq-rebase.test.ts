import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import { rebaseRun, previewRebase } from "../../src/cpq/rebase";
import { readRun, readEstimateProducts } from "../../src/cpq/reads";
import { previewAdoption, adoptRun } from "../../src/cpq/runs";
import { readEstimate } from "../../src/estimating/reads";
import { prepareQuote } from "../../src/estimating/service";
import { reviseCostSource } from "../../src/estimating/sources/commands";
import { readOperation } from "../../src/shared/receipts";
import {
  rebaseSetup,
  rebaseSuccessor,
  rebaseDecision,
  rebaseAdoption,
  editRebaseEstimate,
} from "../helpers/cpq-rebase";
import { calculateCosts } from "../helpers/cpq-costs";
import { cpqInput } from "../helpers/cpq";
import { CRM, crmBase } from "../helpers/crm";
import { manualLines, quoteCommand } from "../helpers/estimating";
import { hash } from "../../src/cpq/hash";
import { decideProduct } from "../../src/products/commands";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const graph = () =>
  rows(`SELECT * FROM (
 SELECT 'run' kind,to_jsonb(r) value FROM ppo.cpq_runs r
 UNION ALL SELECT 'adoption',to_jsonb(a) FROM ppo.cpq_adoptions a
 UNION ALL SELECT 'estimate',to_jsonb(e) FROM ppo.estimates e
 UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v
 UNION ALL SELECT 'binding',to_jsonb(b) FROM ppo.estimate_cost_source_bindings b
 UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r
 UNION ALL SELECT 'audit',to_jsonb(a) FROM ppo.audit_events a
 UNION ALL SELECT 'outbox',to_jsonb(o) FROM ppo.outbox_jobs o) e ORDER BY kind,value::text`);

test("exact rebase decisions preserve parents, recompute labour, recover originals and reject stale source previews", async () => {
  const s = await rebaseSetup();
  const parent = s.original.run;
  const next = await rebaseSuccessor(s);
  assert.equal(next.run.result.ready, true);
  assert.equal(next.run.result.lines[1].line.quantity, "2.000");
  assert.equal(
    next.run.binding.rebase!.parent_content_hash,
    parent.content_hash,
  );
  assert.equal(
    (await readRun(s.p, parent.id)).content_hash,
    parent.content_hash,
  );
  assert.deepEqual(
    await readOperation(s.p, next.command.operation_id),
    next.receipt.receipt,
  );
  const replay = await rebaseRun(s.p, parent.id, next.command);
  assert.equal(replay.replayed, true);
  const retry = {
    ...next.command,
    id: randomUUID(),
    operation_id: randomUUID(),
  };
  const beforeFailure = await graph();
  await rows(
    "CREATE FUNCTION ppo.test_rebase_run_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN forced run rollback'; END $$",
  );
  await rows(
    "CREATE TRIGGER test_rebase_run_fail BEFORE INSERT ON ppo.cpq_runs FOR EACH ROW EXECUTE FUNCTION ppo.test_rebase_run_fail()",
  );
  await assert.rejects(
    rebaseRun(s.p, parent.id, retry),
    /SYN forced run rollback/,
  );
  await rows("DROP TRIGGER test_rebase_run_fail ON ppo.cpq_runs");
  await rows("DROP FUNCTION ppo.test_rebase_run_fail()");
  assert.deepEqual(await graph(), beforeFailure);
  const simultaneous = await Promise.all([
    rebaseRun(s.p, parent.id, retry),
    rebaseRun(s.p, parent.id, retry),
  ]);
  assert.deepEqual(simultaneous[0].receipt, simultaneous[1].receipt);
  assert.deepEqual(simultaneous.map((result) => result.replayed).sort(), [
    false,
    true,
  ]);
  await assert.rejects(
    rebaseRun(s.p, parent.id, {
      ...next.command,
      reason: "SYN changed operation",
    }),
    code("OperationConflict"),
  );
  const proposal = {
    ...next.proposal,
    decisions: [
      rebaseDecision(s.overrides[0], "Replace", "8.000"),
      rebaseDecision(s.overrides[1]),
    ],
  };
  const preview = await previewRebase(s.p, parent.id, proposal);
  assert.equal(preview.result.lines[1].line.quantity, "4.000");
  await reviseCostSource(s.p, s.refs[0].source_id, {
    ...crmBase(),
    expected_version: 3,
    content: { ...s.refs[0].content, title: "SYN successor draft" },
  });
  await assert.rejects(
    rebaseRun(s.p, parent.id, {
      ...crmBase(),
      ...proposal,
      id: randomUUID(),
      preview_hash: preview.preview_hash,
    }),
    code("CpqCostSourceChanged"),
  );
  assert.equal((await rebaseRun(s.p, parent.id, next.command)).replayed, true);
  assert.deepEqual(
    await readOperation(s.p, next.command.operation_id),
    next.receipt.receipt,
  );
});

test("rebase denies incomplete decisions, stale discovery, wrong company/access and changed confirmations without writes", async () => {
  const s = await rebaseSetup(),
    input = cpqInput();
  const proposal = { revision_id: s.g.revision_id, input, decisions: [] };
  const preview = await previewRebase(s.p, s.original.run.id, proposal);
  assert.equal(preview.ready, false);
  assert.equal(preview.unresolved.length, 2);
  const before = await graph();
  await assert.rejects(
    rebaseRun(s.p, s.original.run.id, {
      ...crmBase(),
      ...proposal,
      id: randomUUID(),
      preview_hash: preview.preview_hash,
    }),
    code("CpqRebaseDecisionsRequired"),
  );
  assert.deepEqual(await graph(), before);
  const nextProposal = {
    ...proposal,
    decisions: s.overrides.map((o) => rebaseDecision(o)),
  };
  const exact = await previewRebase(s.p, s.original.run.id, nextProposal);
  const changed = structuredClone(nextProposal);
  changed.input.instances[0].facts.count = "7";
  await assert.rejects(
    rebaseRun(s.p, s.original.run.id, {
      ...crmBase(),
      ...changed,
      id: randomUUID(),
      preview_hash: exact.preview_hash,
    }),
    code("CpqRebasePreviewChanged"),
  );
  await assert.rejects(
    previewRebase(s.p, s.original.run.id, {
      ...nextProposal,
      revision_id: randomUUID(),
    }),
    code("DiscoveryRevisionChanged"),
  );
  const reader = (await createSession("observer")).principal;
  await assert.rejects(
    previewRebase(reader, s.original.run.id, nextProposal),
    code("RecordUnavailable"),
  );
  const other = (await createSession("second-company")).principal;
  for (const cap of ["cpq.read", "cpq.calculate"])
    await rows(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3)",
      [CRM.workspace, other.actor_id, CRM.companyB, cap],
    );
  await assert.rejects(
    previewRebase(other, s.original.run.id, nextProposal),
    code("RecordUnavailable"),
  );
  const grants = await rows(
    "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='cpq.calculate'",
    [s.p.actor_id],
  );
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 second' WHERE user_id=$1 AND capability='cpq.calculate'",
    [s.p.actor_id],
  );
  await assert.rejects(
    previewRebase(s.p, s.original.run.id, nextProposal),
    code("RecordUnavailable"),
  );
  for (const grant of grants)
    await rows("UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1", [
      grant.id,
      grant.valid_to,
    ]);
  assert.equal(
    (await rows("SELECT count(*)::integer n FROM ppo.cpq_runs"))[0].n,
    1,
  );
});

test("explicit receiving keeps manual/native source attribution, acknowledges obsolete removal and preserves private quotation projection", async () => {
  const s = await rebaseSetup(true),
    first = rebaseAdoption(await previewAdoption(s.p, s.original.run.id));
  await adoptRun(s.p, s.original.run.id, first);
  const old = await readEstimate(s.p, first.estimate_id);
  const sensor = {
    ...old.saved.lines[0],
    description: "SYN manually retained sensor",
    unit_sell: "16.00",
  };
  const manual = { ...manualLines()[0], allowance: false };
  const edited = await editRebaseEstimate(s.p, old.id, [
    sensor,
    old.saved.lines[1],
    manual,
  ]);
  const inherited = edited.saved.source_bindings!.find(
    (b) => b.line_id === sensor.id,
  )!;
  const next = await rebaseSuccessor(s, false);
  await assert.rejects(
    previewAdoption(s.p, next.run.id),
    code("CpqOwnedLineChanged"),
  );
  const initial = await previewAdoption(s.p, next.run.id, { decisions: [] });
  assert.equal(initial.ready, false);
  assert.equal(initial.unresolved!.length, 2);
  const decisions = [
    {
      line_id: sensor.id,
      action: "Keep" as const,
      reason: "SYN preserve reviewed manual change",
    },
    {
      line_id: old.saved.lines[1].id,
      action: "Remove" as const,
      reason: "SYN acknowledge obsolete installation",
    },
  ];
  const preview = await previewAdoption(s.p, next.run.id, { decisions });
  assert.equal(preview.ready, true);
  assert.equal(preview.product_provenance!.length, 0);
  const command = rebaseAdoption(preview, decisions),
    accepted = await adoptRun(s.p, next.run.id, command);
  const result = await readEstimate(s.p, old.id);
  assert.deepEqual(
    result.saved.lines,
    edited.saved.lines.filter((line) => line.id !== old.saved.lines[1].id),
  );
  assert.deepEqual(
    result.saved.source_bindings!.find((b) => b.line_id === sensor.id),
    inherited,
  );
  const evidence = await readEstimateProducts(s.p, old.id, {
    version_id: result.saved.id,
  });
  assert.equal(evidence.status, "ResolvedAdoption");
  assert.equal(evidence.product_provenance.length, 0);
  assert.equal(evidence.retained_history![0].origin_run_id, s.original.run.id);
  assert.equal(
    evidence.retained_history![0].historical_product_provenance[0].product
      .revision_id,
    s.product!.revision.id,
  );
  assert.equal(
    (await readEstimateProducts(s.p, old.id, { version_id: old.saved.id }))
      .status,
    "ExactAdoption",
  );
  const quote = quoteCommand(result.saved, result.version);
  await prepareQuote(s.p, old.id, quote);
  const snapshot = JSON.stringify(
    (
      await rows(
        "SELECT safe_snapshot FROM ppo.draft_quote_revisions WHERE id=$1",
        [quote.id],
      )
    )[0],
  );
  for (const forbidden of [
    "cost_source",
    "cpq_resolution",
    "unit_cost",
    "review_event_id",
    "parent_content_hash",
  ])
    assert.equal(snapshot.includes(forbidden), false);
  assert.deepEqual(
    await readOperation(s.p, command.operation_id),
    accepted.receipt,
  );
  const future = await calculateCosts(s.p, s.g, next.run.id, next.run.input);
  await assert.rejects(
    previewAdoption(s.p, future.run.id),
    code("CpqOwnedLineChanged"),
  );
  const keep = [decisions[0]];
  const intermediate = await previewAdoption(s.p, future.run.id, {
    decisions: keep,
  });
  await adoptRun(s.p, future.run.id, rebaseAdoption(intermediate, keep));
  const absent = await readEstimate(s.p, old.id);
  const absentHistory = await readEstimateProducts(s.p, old.id, {
    version_id: absent.saved.id,
  });
  assert.equal(absentHistory.status, "ResolvedAdoption");
  assert.ok(
    absentHistory.retained_history!.some(
      (line) =>
        line.line_id === old.saved.lines[1].id &&
        line.status === "ExplicitlyRemoved",
    ),
  );
  const reintroduced = await rebaseSuccessor(s, true);
  const reviewAgain = await previewAdoption(s.p, reintroduced.run.id, {
    decisions: keep,
  });
  assert.equal(reviewAgain.ready, false);
  assert.ok(
    reviewAgain.unresolved!.some(
      (line) =>
        line.line_id === old.saved.lines[1].id &&
        line.code === "CpqOwnedLineChanged",
    ),
  );
  assert.equal(
    (await readEstimate(s.p, old.id)).saved.lines.some(
      (line) => line.id === old.saved.lines[1].id,
    ),
    false,
  );
});

test("resolution and rebase commands roll back atomically, serialize competitors and reject stale receiving", async () => {
  const s = await rebaseSetup(),
    original = rebaseAdoption(await previewAdoption(s.p, s.original.run.id));
  await adoptRun(s.p, s.original.run.id, original);
  const e = await readEstimate(s.p, original.estimate_id);
  await editRebaseEstimate(
    s.p,
    e.id,
    e.saved.lines.map((line, i) =>
      i === 0 ? { ...line, description: "SYN edited" } : line,
    ),
  );
  const next = await rebaseSuccessor(s);
  const decisions = [
    {
      line_id: e.saved.lines[0].id,
      action: "Replace" as const,
      reason: "SYN accept calculated replacement",
    },
  ];
  const preview = await previewAdoption(s.p, next.run.id, { decisions }),
    command = rebaseAdoption(preview, decisions);
  const before = await graph();
  await rows(
    "CREATE FUNCTION ppo.test_rebase_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN forced adoption rollback'; END $$",
  );
  await rows(
    "CREATE TRIGGER test_rebase_fail BEFORE INSERT ON ppo.cpq_adoptions FOR EACH ROW EXECUTE FUNCTION ppo.test_rebase_fail()",
  );
  await assert.rejects(adoptRun(s.p, next.run.id, command));
  await rows("DROP TRIGGER test_rebase_fail ON ppo.cpq_adoptions");
  await rows("DROP FUNCTION ppo.test_rebase_fail()");
  assert.deepEqual(await graph(), before);
  const identical = await Promise.all([
    adoptRun(s.p, next.run.id, command),
    adoptRun(s.p, next.run.id, command),
  ]);
  assert.deepEqual(identical[0].receipt, identical[1].receipt);
  const following = await calculateCosts(s.p, s.g, next.run.id, next.run.input);
  const plain = rebaseAdoption(await previewAdoption(s.p, following.run.id));
  const race = await Promise.allSettled([
    adoptRun(s.p, following.run.id, plain),
    adoptRun(s.p, following.run.id, { ...plain, operation_id: randomUUID() }),
  ]);
  assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
  await assert.rejects(
    adoptRun(s.p, next.run.id, { ...command, operation_id: randomUUID() }),
    code("CpqBasisChanged"),
  );
  assert.equal((await adoptRun(s.p, next.run.id, command)).replayed, true);
});

test("populated resolution history, grants, ledgers and receipts survive repeated migration and seeding", async () => {
  const s = await rebaseSetup(),
    next = await rebaseSuccessor(s);
  const command = rebaseAdoption(
    await previewAdoption(s.p, next.run.id, { decisions: [] }),
    [],
  );
  await adoptRun(s.p, next.run.id, command);
  const before = await graph(),
    ledgers = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    ),
    grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id");
  const run = await readRun(s.p, next.run.id);
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await graph(), before);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    ledgers,
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    grants,
  );
  assert.deepEqual(await readRun(s.p, next.run.id), run);
  await assert.rejects(
    rows("UPDATE ppo.cpq_runs SET reason='SYN rewrite' WHERE id=$1", [
      next.run.id,
    ]),
  );
  assert.equal(
    hash((await readRun(s.p, next.run.id)).binding.rebase),
    hash(run.binding.rebase),
  );
  assert.equal(
    (await rebaseRun(s.p, s.original.run.id, next.command)).replayed,
    true,
  );
  assert.equal((await adoptRun(s.p, next.run.id, command)).replayed, true);
});

test("explicit removal stays protected until replacement; withdrawal and lost access cannot bypass new-use or receipt authority", async () => {
  const s = await rebaseSetup(true);
  const first = rebaseAdoption(await previewAdoption(s.p, s.original.run.id));
  await adoptRun(s.p, s.original.run.id, first);
  const next = await rebaseSuccessor(s),
    line = next.run.result.lines[0].line;
  const emptyDecisions = next.run.result.lines.map(({ line }) => ({
    line_id: line.id,
    action: "Remove" as const,
    reason: "SYN attempt to remove every received line",
  }));
  const beforeEmpty = await graph();
  await assert.rejects(
    previewAdoption(s.p, next.run.id, { decisions: emptyDecisions }),
    code("CpqReceivingLinesRequired"),
  );
  await assert.rejects(
    adoptRun(
      s.p,
      next.run.id,
      rebaseAdoption(await previewAdoption(s.p, next.run.id), emptyDecisions),
    ),
    code("CpqReceivingLinesRequired"),
  );
  assert.deepEqual(await graph(), beforeEmpty);
  const decisions = [
    {
      line_id: line.id,
      action: "Remove" as const,
      reason: "SYN intentionally omit generated product",
    },
  ];
  const preview = await previewAdoption(s.p, next.run.id, { decisions });
  const command = rebaseAdoption(preview, decisions),
    before = await graph();
  await assert.rejects(
    adoptRun(s.p, next.run.id, {
      ...command,
      resolution: { decisions: [{ ...decisions[0], action: "Keep" }] },
    }),
    code("CpqPreviewChanged"),
  );
  assert.deepEqual(await graph(), before);
  await adoptRun(s.p, next.run.id, command);
  const removed = await readEstimate(s.p, first.estimate_id);
  assert.equal(
    removed.saved.lines.some((l) => l.id === line.id),
    false,
  );
  const evidence = await readEstimateProducts(s.p, first.estimate_id, {
    version_id: removed.saved.id,
  });
  assert.equal(evidence.status, "ResolvedAdoption");
  assert.equal(evidence.retained_history![0].status, "ExplicitlyRemoved");
  const later = await calculateCosts(s.p, s.g, next.run.id, next.run.input);
  const incomplete = await previewAdoption(s.p, later.run.id, {
    decisions: [],
  });
  assert.equal(incomplete.ready, false);
  const unchanged = await graph();
  await assert.rejects(
    adoptRun(s.p, later.run.id, rebaseAdoption(incomplete, [])),
    code("CpqLineDecisionsRequired"),
  );
  assert.deepEqual(await graph(), unchanged);
  const replace = [
    {
      ...decisions[0],
      action: "Replace" as const,
      reason: "SYN deliberately restore exact generated item",
    },
  ];
  await adoptRun(
    s.p,
    later.run.id,
    rebaseAdoption(
      await previewAdoption(s.p, later.run.id, { decisions: replace }),
      replace,
    ),
  );
  assert.deepEqual(
    (await readEstimate(s.p, first.estimate_id)).saved.lines.find(
      (l) => l.id === line.id,
    ),
    later.run.result.lines[0].line,
  );
  await decideProduct(s.productAuthor!, s.product!.product.id, {
    ...crmBase(),
    expected_version: s.product!.product.version,
    revision_id: s.product!.revision.id,
    action: "Withdrawn",
    reason: "SYN withdraw after accepted decisions",
  });
  await assert.rejects(
    previewRebase(s.p, s.original.run.id, next.proposal),
    code("CpqProductPublicationChanged"),
  );
  await assert.rejects(
    previewAdoption(s.p, later.run.id, { decisions: [] }),
    code("CpqProductPublicationChanged"),
  );
  assert.equal(
    (await rebaseRun(s.p, s.original.run.id, next.command)).replayed,
    true,
  );
  assert.equal((await adoptRun(s.p, next.run.id, command)).replayed, true);
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 second' WHERE user_id=$1 AND capability='products.read'",
    [s.p.actor_id],
  );
  for (const operation of [next.command.operation_id, command.operation_id])
    await assert.rejects(
      readOperation(s.p, operation),
      code("RecordUnavailable"),
    );
  await assert.rejects(
    adoptRun(s.p, next.run.id, command),
    code("RecordUnavailable"),
  );
});

test("legacy adoption carries prior removals through an omitted target without losing later review", async () => {
  const s = await rebaseSetup();
  const first = rebaseAdoption(await previewAdoption(s.p, s.original.run.id));
  await adoptRun(s.p, s.original.run.id, first);
  const omitted = await rebaseSuccessor(s, false);
  const labourId = s.original.run.result.lines[1].line.id;
  const decisions = [
    {
      line_id: labourId,
      action: "Remove" as const,
      reason: "SYN explicit obsolete labour removal",
    },
  ];
  await adoptRun(
    s.p,
    omitted.run.id,
    rebaseAdoption(
      await previewAdoption(s.p, omitted.run.id, { decisions }),
      decisions,
    ),
  );
  const intervening = await calculateCosts(
    s.p,
    s.g,
    omitted.run.id,
    omitted.run.input,
  );
  const legacyPreview = await previewAdoption(s.p, intervening.run.id);
  assert.equal(
    legacyPreview.resolution!.retained_cpq_lines[0].line_id,
    labourId,
  );
  const legacyCommand = rebaseAdoption(legacyPreview);
  assert.equal(
    "resolution" in legacyCommand && legacyCommand.resolution !== undefined,
    false,
  );
  const accepted = await adoptRun(s.p, intervening.run.id, legacyCommand);
  const audit = (
    await rows(
      "SELECT details->'cpq_resolution' resolution FROM ppo.audit_events WHERE operation_id=$1",
      [legacyCommand.operation_id],
    )
  )[0].resolution;
  assert.equal(audit.retained_cpq_lines[0].line_id, labourId);
  assert.equal(audit.retained_cpq_lines[0].retained_line, null);
  const reintroduced = await rebaseSuccessor(s, true);
  await assert.rejects(
    previewAdoption(s.p, reintroduced.run.id),
    code("CpqOwnedLineChanged"),
  );
  const review = await previewAdoption(s.p, reintroduced.run.id, {
    decisions: [],
  });
  assert.ok(review.unresolved!.some((line) => line.line_id === labourId));
  assert.equal(
    (await readEstimate(s.p, first.estimate_id)).saved.lines.some(
      (line) => line.id === labourId,
    ),
    false,
  );
  assert.equal(
    (await adoptRun(s.p, intervening.run.id, legacyCommand)).replayed,
    true,
  );
  assert.deepEqual(
    await readOperation(s.p, legacyCommand.operation_id),
    accepted.receipt,
  );
});
