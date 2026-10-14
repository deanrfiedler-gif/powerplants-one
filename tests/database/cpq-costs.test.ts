import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import {
  adoptRun,
  previewAdoption,
  previewCalculation,
  calculateRun,
} from "../../src/cpq/runs";
import { readRun, readRelease, compareRuns } from "../../src/cpq/reads";
import { validateDraft } from "../../src/cpq/ui-reads";
import { sourceInput } from "../helpers/estimating-sources";
import { createCostSource } from "../../src/estimating/sources/commands";
import { saveRelease } from "../../src/cpq/releases";
import { hash } from "../../src/cpq/hash";
import { readEstimate } from "../../src/estimating/reads";
import { saveEstimate, prepareQuote } from "../../src/estimating/service";
import { arithmeticPolicy } from "../../src/estimating/math";
import {
  reviseCostSource,
  decideCostSource,
} from "../../src/estimating/sources/commands";
import {
  previewSourceRefresh,
  applySourceRefresh,
} from "../../src/estimating/sources/refresh";
import { readOperation } from "../../src/shared/receipts";
import {
  costActors,
  costDefinition,
  reviewedCost,
  publishCosts,
  costDiscovery,
  calculateCosts,
  costRef,
} from "../helpers/cpq-costs";
import { crmBase, CRM } from "../helpers/crm";
import { manualLines, quoteCommand } from "../helpers/estimating";
import { cpqInput } from "../helpers/cpq";
import { productFixture, publishProduct } from "../helpers/products";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
const adoption = (v: Awaited<ReturnType<typeof previewAdoption>>) => ({
  ...crmBase(),
  preview_hash: v.preview_hash,
  result_hash: v.result_hash,
  estimate_id: v.binding.estimate_id ?? randomUUID(),
  title: "SYN governed CPQ",
  scope: {
    included: "SYN sensors",
    excluded: "Live work",
    assumptions: "Fictional costs only",
  },
});
async function setup() {
  const actors = await costActors(),
    refs = [
      await reviewedCost(actors.p),
      await reviewedCost(actors.p, "hour", "40"),
    ];
  const d = costDefinition(refs),
    release = await publishCosts(actors, d),
    g = await costDiscovery(actors.p);
  return {
    ...actors,
    refs,
    d,
    release,
    g,
    ...(await calculateCosts(actors.p, g)),
  };
}
async function successor(s: Awaited<ReturnType<typeof setup>>, cost = "9") {
  const ref = s.refs[0];
  await reviseCostSource(s.p, ref.source_id, {
    ...crmBase(),
    expected_version: ref.source_version,
    content: {
      ...ref.content,
      tiers: [{ minimum_quantity: "0.001", unit_cost: cost }],
    },
  });
  let next = await costRef(s.p, ref.source_id);
  await decideCostSource(s.p, ref.source_id, {
    ...crmBase(),
    expected_version: next.source_version,
    revision_id: next.revision_id,
    action: "Submit",
  });
  await decideCostSource(
    (await createSession("estimating-source-reviewer")).principal,
    ref.source_id,
    {
      ...crmBase(),
      expected_version: next.source_version + 1,
      revision_id: next.revision_id,
      action: "Reviewed",
    },
  );
  next = await costRef(s.p, ref.source_id);
  return next;
}
async function graph(id: string) {
  return rows(
    "SELECT * FROM (SELECT 'estimate' kind,to_jsonb(e) value FROM ppo.estimates e WHERE id=$1 UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v WHERE estimate_id=$1 UNION ALL SELECT 'binding',to_jsonb(b) FROM ppo.estimate_cost_source_bindings b WHERE estimate_version_id IN(SELECT id FROM ppo.estimate_versions WHERE estimate_id=$1) ) evidence ORDER BY kind,value::text",
    [id],
  );
}
test("governed CPQ adopts exact costs, refreshes deliberately with margin comparison and retains manual source provenance", async () => {
  const s = await setup(),
    preview = await previewAdoption(s.p, s.run.id),
    command = adoption(preview);
  assert.equal(preview.cost_provenance!.length, 2);
  await adoptRun(s.p, s.run.id, command);
  const first = await readEstimate(s.p, command.estimate_id);
  assert.equal(first.saved.source_bindings!.length, 2);
  assert.equal(first.totals.cost, "56.00");
  const manual = {
    ...manualLines()[0],
    allowance: false,
    unit_cost: "8.00",
    unit_sell: "175.00",
  };
  await saveEstimate(s.p, first.id, {
    ...crmBase(),
    expected_version: first.version,
    title: first.saved.title,
    scope: first.saved.scope,
    schema_version: 2,
    policy: arithmeticPolicy,
    lines: [...first.saved.lines, manual],
  });
  let current = await readEstimate(s.p, first.id);
  const selection = {
    estimate_version_id: current.saved.id,
    pricing_date: s.command.input.pricing_date,
    selections: [
      {
        line_id: manual.id,
        source_id: s.refs[0].source_id,
        revision_id: s.refs[0].revision_id,
        expected_source_version: 3,
      },
    ],
  };
  const refresh = await previewSourceRefresh(s.p, first.id, selection);
  await applySourceRefresh(s.p, first.id, {
    ...crmBase(),
    proposal: selection,
    reviewed: true,
    expected_version: current.version,
    comparison_hash: refresh.comparison_hash,
  });
  current = await readEstimate(s.p, first.id);
  const retainedManual = current.saved.lines.find((l) => l.id === manual.id)!;
  const manualBinding = current.saved.source_bindings!.find(
    (b) => b.line_id === manual.id,
  )!;
  const oldGraph = await graph(first.id);
  const next = await successor(s);
  await assert.rejects(
    previewAdoption(s.p, s.run.id),
    code("CpqCostSourceChanged"),
  );
  assert.equal((await readRun(s.p, s.run.id)).content_hash, s.run.content_hash);
  const d = costDefinition([next, s.refs[1]]);
  d.fixtures[0].expected.cost = "58.00";
  await publishCosts(s, d);
  const recalculated = await calculateCosts(s.p, s.g, s.run.id);
  const compare = await compareRuns(s.p, s.run.id, {
    with: recalculated.run.id,
  });
  assert.equal(compare.totals.before.cost, "56.00");
  assert.equal(compare.totals.after.cost, "58.00");
  assert.notEqual(
    compare.totals.before.margin_percent,
    compare.totals.after.margin_percent,
  );
  assert.equal(
    compare.changes.find((l) => l.after?.line.unit === "each")!.after!
      .cost_source!.source_revision_id,
    next.revision_id,
  );
  const newInput = adoption(await previewAdoption(s.p, recalculated.run.id));
  await adoptRun(s.p, recalculated.run.id, newInput);
  const result = await readEstimate(s.p, first.id);
  assert.deepEqual(
    result.saved.lines.find((l) => l.id === manual.id),
    retainedManual,
  );
  assert.deepEqual(
    result.saved.source_bindings!.find((b) => b.line_id === manual.id),
    manualBinding,
  );
  assert.equal(result.saved.source_bindings!.length, 3);
  assert.equal(
    result.saved.source_bindings!.find(
      (b) => b.line_id !== manual.id && b.source_id === next.source_id,
    )!.source_revision_id,
    next.revision_id,
  );
  const oldRows = oldGraph.filter((r) => r.kind !== "estimate");
  assert.deepEqual(
    (await graph(first.id)).filter((r) =>
      oldRows.some((o) => hash(o) === hash(r)),
    ),
    oldRows,
  );
  assert.equal((await adoptRun(s.p, s.run.id, command)).replayed, true);
  assert.deepEqual(
    await readOperation(s.p, command.operation_id),
    (await adoptRun(s.p, s.run.id, command)).receipt,
  );
  await prepareQuote(s.p, first.id, quoteCommand(result.saved, result.version));
  const safe = JSON.stringify(
    (
      await rows(
        "SELECT safe_snapshot FROM ppo.draft_quote_revisions WHERE estimate_id=$1",
        [first.id],
      )
    )[0],
  );
  for (const secret of [
    "cost_source",
    "unit_cost",
    "supplier_label",
    "content_hash",
    "review_event_id",
    "margin",
    s.refs[0].reference,
  ])
    assert.ok(!safe.includes(secret), secret);
});
test("changed source refuses new calculation/adoption while exact history and original receipts survive; access and company remain current", async () => {
  const s = await setup(),
    command = adoption(await previewAdoption(s.p, s.run.id));
  const accepted = await adoptRun(s.p, s.run.id, command);
  await reviseCostSource(s.p, s.refs[0].source_id, {
    ...crmBase(),
    expected_version: 3,
    content: { ...s.refs[0].content, title: "SYN successor awaiting review" },
  });
  await assert.rejects(
    previewCalculation(s.p, s.g.id, {
      option_id: s.g.option_id,
      revision_id: s.g.revision_id,
    }),
    code("CpqCostSourceChanged"),
  );
  await assert.rejects(
    adoptRun(s.p, s.run.id, { ...command, operation_id: randomUUID() }),
    code("CpqCostSourceChanged"),
  );
  assert.equal((await calculateRun(s.p, s.g.id, s.command)).replayed, true);
  assert.equal((await adoptRun(s.p, s.run.id, command)).replayed, true);
  assert.deepEqual(
    await readOperation(s.p, command.operation_id),
    accepted.receipt,
  );
  const rebound = structuredClone(s.d);
  rebound.parts[0].cost_source!.source_version = 4;
  await publishCosts(s, rebound); // explicit historical reviewed revision is allowed with current header
  await assert.rejects(
    readRun((await createSession("second-company")).principal, s.run.id),
    code("RecordUnavailable"),
  );
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 second' WHERE user_id=$1 AND capability='estimating.read'",
    [s.reviewer.actor_id],
  );
  await assert.rejects(
    readRelease(s.reviewer, s.release.release.id),
    code("RecordUnavailable"),
  );
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 second' WHERE user_id=$1 AND capability='estimating.read'",
    [s.p.actor_id],
  );
  for (const call of [
    () => readRun(s.p, s.run.id),
    () => readOperation(s.p, command.operation_id),
    () => adoptRun(s.p, s.run.id, command),
  ])
    await assert.rejects(call(), code("RecordUnavailable"));
});
test("governed source identity and independent review cannot be forged or selected from another company", async () => {
  const s = await setup();
  for (const mutate of [
    (d: typeof s.d) => (d.parts[0].cost_source!.reference = "SYN-INVENTED"),
    (d: typeof s.d) => d.parts[0].cost_source!.revision++,
    (d: typeof s.d) =>
      (d.parts[0].cost_source!.review_event_id = s.refs[1].review_event_id),
    (d: typeof s.d) => (d.parts[0].cost_source!.source_version = 2),
  ]) {
    const d = structuredClone(s.d);
    mutate(d);
    await assert.rejects(
      saveRelease(s.p, {
        ...crmBase(),
        id: randomUUID(),
        company_id: CRM.company,
        expected_version: 0,
        definition: d,
      }),
    );
  }
  await assert.rejects(
    validateDraft(s.reviewer, { company_id: CRM.company, definition: s.d }),
  );
  const other = (await createSession("second-company")).principal;
  const foreignInput = { ...sourceInput(), company_id: CRM.companyB };
  await createCostSource(other, foreignInput);
  const foreign = await costRef(other, foreignInput.id);
  for (const cap of ["shared.read", "estimating.read"])
    await rows(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3) ON CONFLICT DO NOTHING",
      [CRM.workspace, s.p.actor_id, CRM.companyB, cap],
    );
  const crossed = structuredClone(s.d);
  crossed.parts[0].cost_source = foreign;
  await assert.rejects(
    saveRelease(s.p, {
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.company,
      expected_version: 0,
      definition: crossed,
    }),
    code("RecordUnavailable"),
  );
  await rows(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'cpq.read','Company',$3),($1,$2,$3,'cpq.author','Company',$3)",
    [CRM.workspace, other.actor_id, CRM.companyB],
  );
  await assert.rejects(
    saveRelease(other, {
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.companyB,
      expected_version: 0,
      definition: s.d,
    }),
    code("RecordUnavailable"),
  );
});
test("governed adoption rolls back source bindings with native writes, accepts concurrent originals once and refuses competing commands", async () => {
  const s = await setup(),
    command = adoption(await previewAdoption(s.p, s.run.id));
  const count = async () =>
    rows(
      "SELECT (SELECT count(*) FROM ppo.estimates) estimates,(SELECT count(*) FROM ppo.estimate_versions) versions,(SELECT count(*) FROM ppo.estimate_cost_source_bindings) bindings,(SELECT count(*) FROM ppo.audit_events) audits,(SELECT count(*) FROM ppo.outbox_jobs) jobs,(SELECT count(*) FROM ppo.operation_receipts) receipts",
    );
  const before = await count();
  await rows(
    "CREATE FUNCTION ppo.cpq_cost_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN fail after bindings'; END $$",
  );
  await rows(
    "CREATE TRIGGER cpq_cost_fail BEFORE INSERT ON ppo.cpq_adoptions FOR EACH ROW EXECUTE FUNCTION ppo.cpq_cost_fail()",
  );
  await assert.rejects(adoptRun(s.p, s.run.id, command), /SYN fail/);
  assert.deepEqual(await count(), before);
  await rows("DROP TRIGGER cpq_cost_fail ON ppo.cpq_adoptions");
  const accepted = await Promise.all([
    adoptRun(s.p, s.run.id, command),
    adoptRun(s.p, s.run.id, command),
  ]);
  assert.deepEqual(accepted.map((a) => a.replayed).sort(), [false, true]);
  const evidence = await graph(command.estimate_id);
  await assert.rejects(
    adoptRun(s.p, s.run.id, { ...command, operation_id: randomUUID() }),
    code("CpqBasisChanged"),
  );
  assert.deepEqual(await graph(command.estimate_id), evidence);
  const next = await calculateCosts(s.p, s.g, s.run.id);
  const a = adoption(await previewAdoption(s.p, next.run.id));
  const race = await Promise.allSettled([
    adoptRun(s.p, next.run.id, a),
    adoptRun(s.p, next.run.id, { ...a, operation_id: randomUUID() }),
  ]);
  assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    (await readEstimate(s.p, command.estimate_id)).saved.source_bindings!
      .length,
    2,
  );
});
test("governed sources coexist with exact published Products and refuse withdrawn technical mappings", async () => {
  const actors = await costActors(),
    refs = [
      await reviewedCost(actors.p),
      await reviewedCost(actors.p, "hour", "40"),
    ],
    d = costDefinition(refs);
  const f = await productFixture(),
    product = await publishProduct(f.author.p, f.reviewer.p, f.variant.id);
  for (const actor of [actors.p, actors.reviewer, actors.publisher])
    await rows(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'products.read','Company',$3) ON CONFLICT DO NOTHING",
      [CRM.workspace, actor.actor_id, CRM.company],
    );
  d.parts[0].product = {
    product_id: product.product.id,
    revision_id: product.revision.id,
    content_hash: product.revision.content_hash,
    relationships: [],
  };
  await publishCosts(actors, d);
  const g = await costDiscovery(actors.p),
    run = await calculateCosts(actors.p, g);
  assert.equal(run.run.product_provenance!.length, 1);
  assert.equal(run.run.cost_provenance!.length, 2);
  const { decideProduct } = await import("../../src/products/commands");
  await decideProduct(f.author.p, product.product.id, {
    ...crmBase(),
    expected_version: product.product.version,
    revision_id: product.revision.id,
    action: "Withdrawn",
    reason: "SYN withdrawn mapping",
  });
  await assert.rejects(
    previewAdoption(actors.p, run.run.id),
    code("CpqProductPublicationChanged"),
  );
  assert.equal(
    (await readRun(actors.p, run.run.id)).content_hash,
    run.run.content_hash,
  );
});
test("populated governed history survives repeat migration and seeding without evidence or ledger changes", async () => {
  const s = await setup(),
    command = adoption(await previewAdoption(s.p, s.run.id));
  await adoptRun(s.p, s.run.id, command);
  const before = await graph(command.estimate_id),
    run = await readRun(s.p, s.run.id);
  const ledger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    ledger,
  );
  assert.deepEqual(await graph(command.estimate_id), before);
  assert.deepEqual(await readRun(s.p, s.run.id), run);
  assert.equal((await adoptRun(s.p, s.run.id, command)).replayed, true);
});
