import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID, createHash } from "node:crypto";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset } from "../../scripts/database";
import { createProduct, reviseProduct } from "../../src/products/commands";
import { listProducts, readProduct } from "../../src/products/reads";
import {
  stageImport,
  mapImport,
  readImport,
  decideImport,
} from "../../src/products/imports";
import {
  createRelationship,
  listRelationships,
} from "../../src/products/relationships";
import { AppError } from "../../src/platform/errors";
import { hash } from "../../src/products/model";
import {
  currentLifecycle,
  relationshipLabel,
} from "../../src/products/vocabulary";
import {
  productActor,
  productContentFixture,
  productInput,
  storedProductFixture,
  relationshipFixture,
} from "../helpers/products";
import { crmBase, CRM } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

test("PD legacy revisions verify unchanged, group under current lifecycle filters and produce honest successors", async () => {
  const { p } = await productActor();
  const marker = `SYN Vocabulary ${randomUUID()}`;
  const supported = await storedProductFixture(
    p,
    productContentFixture({
      title: `${marker} supported`,
      lifecycle: "Supported",
    }),
  );
  const retired = await storedProductFixture(
    p,
    productContentFixture({ title: `${marker} retired`, lifecycle: "Retired" }),
  );
  const current = productInput({
    content: productContentFixture({
      title: `${marker} current`,
      lifecycle: "Current",
    }),
  });
  const discontinued = productInput({
    content: productContentFixture({
      title: `${marker} discontinued`,
      lifecycle: "Discontinued",
    }),
  });
  const lastTimeBuy = productInput({
    content: productContentFixture({
      title: `${marker} last`,
      lifecycle: "LastTimeBuy",
    }),
  });
  const unknown = productInput({
    content: productContentFixture({
      title: `${marker} unknown`,
      lifecycle: "Unknown",
    }),
  });
  for (const input of [current, discontinued, lastTimeBuy, unknown])
    await createProduct(p, input);
  const ids = async (lifecycle: string) =>
    (await listProducts(p, { q: marker, lifecycle })).items
      .map((r) => r.id)
      .sort();
  assert.deepEqual(await ids("Current"), [supported.id, current.id].sort());
  assert.deepEqual(
    await ids("Discontinued"),
    [retired.id, discontinued.id].sort(),
  );
  assert.deepEqual(await ids("LastTimeBuy"), [lastTimeBuy.id]);
  assert.deepEqual(await ids("Unknown"), [unknown.id]);
  for (const input of [supported, retired]) {
    const original = (await readProduct(p, input.id)).revision;
    assert.deepEqual(original.content, input.content);
    assert.equal(original.content_hash, hash(input.content));
    const next = {
      ...original.content,
      lifecycle: currentLifecycle(original.content.lifecycle),
    };
    await reviseProduct(p, input.id, {
      ...crmBase(),
      expected_version: 1,
      content: next,
    });
    const detail = await readProduct(p, input.id);
    assert.equal(detail.revision.content.lifecycle, next.lifecycle);
    assert.deepEqual(detail.changes, [
      {
        field: "lifecycle",
        before: original.content.lifecycle,
        after: next.lifecycle,
      },
    ]);
    assert.deepEqual(detail.previous, original);
    assert.deepEqual(
      (await readProduct(p, input.id, { revision_id: original.id })).revision,
      original,
    );
    assert.equal(detail.revision.content_hash, hash(next));
  }
  for (const lifecycle of ["Supported", "Retired", "Last-time buy"])
    await assert.rejects(
      listProducts(p, { lifecycle }),
      (e: unknown) =>
        e instanceof AppError &&
        e.status === 422 &&
        e.field_errors.some((f) => f.field === "lifecycle"),
    );
});

test("PD catalogue default and updated orders use stable id ties, retain the bound and return transaction read time", async () => {
  const { p } = await productActor();
  const marker = `SYN Order ${randomUUID()}`;
  const a = await storedProductFixture(
    p,
    productContentFixture({ title: `${marker} A` }),
    new Date("2026-01-01T00:00:00Z"),
  );
  const b = await storedProductFixture(
    p,
    productContentFixture({ title: `${marker} B` }),
    new Date("2026-01-02T00:00:00Z"),
  );
  const c = await storedProductFixture(
    p,
    productContentFixture({ title: `${marker} B` }),
    new Date("2026-01-02T00:00:00Z"),
  );
  const before = (
    await database().query<{ now: Date }>("SELECT clock_timestamp() AS now")
  ).rows[0].now;
  const byProduct = await listProducts(p, { q: marker });
  const byUpdated = await listProducts(p, { q: marker, sort: "updated" });
  const after = (
    await database().query<{ now: Date }>("SELECT clock_timestamp() AS now")
  ).rows[0].now;
  const ties = [b.id, c.id].sort();
  assert.deepEqual(
    byProduct.items.map((r) => r.id),
    [a.id, ...ties],
  );
  assert.deepEqual(
    (await listProducts(p, { q: marker, sort: "product" })).items,
    byProduct.items,
  );
  assert.deepEqual(
    byUpdated.items.map((r) => r.id),
    [...ties, a.id],
  );
  for (const result of [byProduct, byUpdated]) {
    assert.equal(result.limit, 100);
    assert.equal("total" in result, false);
    assert.ok(
      Date.parse(result.read_at) >= before.getTime() &&
        Date.parse(result.read_at) <= after.getTime(),
    );
  }
  assert.equal(byProduct.filters.sort, "product");
  assert.equal(byUpdated.filters.sort, "updated");
  for (const sort of ["", "title", "Updated", "updated DESC; SELECT 1"])
    await assert.rejects(listProducts(p, { sort }));
});

test("PD import legacy words and duplicate suggestions preserve exact source bytes and require explicit identity decisions", async () => {
  const { p } = await productActor(),
    reviewer = await productActor();
  const existing = productInput({
    content: productContentFixture({
      title: "SYN Unrelated title",
      model: "DP‑25",
    }),
  });
  const titleMatch = productInput({
    content: productContentFixture({ title: "SYN DP‑25", model: "DIFFERENT" }),
  });
  await createProduct(p, existing);
  await createProduct(p, titleMatch);
  const batchId = randomUUID();
  const stagedRows = ["DP-25", "dp 25", "DP25", "DP‑25", "DP-250"].map(
    (model, i) => ({
      external_key: i === 0 ? existing.entity_key : `SYN-${randomUUID()}`,
      reference: `SYN-${randomUUID()}`,
      kind: "Family",
      parent_id: null,
      content: productContentFixture({
        title: `SYN Unique staged ${i}`,
        model,
        lifecycle: i === 1 ? "Retired" : "Supported",
      }),
    }),
  );
  stagedRows.push({
    external_key: `SYN-${randomUUID()}`,
    reference: `SYN-${randomUUID()}`,
    kind: "Family",
    parent_id: null,
    content: productContentFixture({
      title: "syn dp 25",
      model: "OTHER",
      lifecycle: "Supported",
    }),
  });
  const raw = JSON.stringify(
    { format: "PPO synthetic catalogue 1", rows: stagedRows },
    null,
    1,
  );
  const rawHash = createHash("sha256").update(raw).digest("hex");
  await stageImport(p, {
    ...crmBase(),
    id: batchId,
    company_id: CRM.company,
    filename: "legacy-words.json",
    provider: existing.provider,
    source_description: "SYN retained supplier words and duplicate candidates",
    source_time: null,
    raw_content: raw,
  });
  const staged = await readImport(p, batchId);
  assert.equal(staged.batch.raw_content, raw);
  assert.equal(staged.batch.content_hash, rawHash);
  for (const [i, row] of staged.rows.entries()) {
    assert.equal(row.parsed?.lifecycle, i === 1 ? "Discontinued" : "Current");
    assert.ok(
      row.warnings.includes(
        i === 1
          ? "Supplier word Retired read as Discontinued"
          : "Supplier word Supported read as Current",
      ),
    );
    assert.equal(row.target_id, null);
    assert.ok(row.errors.length);
    if (i < 4)
      assert.ok(row.duplicate_candidates.some((c) => c.id === existing.id));
    if (i === 4) assert.equal(row.duplicate_candidates.length, 0);
    if (i === 5)
      assert.ok(row.duplicate_candidates.some((c) => c.id === titleMatch.id));
  }
  await mapImport(p, batchId, {
    ...crmBase(),
    expected_version: 1,
    mappings: stagedRows.map((_, i) => ({
      row_number: i + 1,
      action: i === 0 ? "Resolve" : "New",
      target_id: i === 0 ? existing.id : null,
      reason: "SYN explicit identity decision",
    })),
  });
  let mapped = await readImport(p, batchId);
  assert.equal(mapped.rows[0].target_id, existing.id);
  assert.ok(mapped.rows.every((r) => r.errors.length === 0));
  const reviewedPlan = structuredClone(mapped.current);
  for (const action of ["Reviewed", "Apply"] as const) {
    await decideImport(action === "Reviewed" ? reviewer.p : p, batchId, {
      ...crmBase(),
      expected_version: mapped.batch.version,
      plan_id: mapped.current!.id,
      comparison_hash: mapped.current!.comparison_hash,
      action,
    });
    mapped = await readImport(p, batchId);
  }
  assert.equal(mapped.batch.raw_content, raw);
  assert.equal(mapped.batch.content_hash, rawHash);
  assert.deepEqual(mapped.current, reviewedPlan);
  for (const row of mapped.rows) {
    const result = await readProduct(p, row.target_id ?? row.proposed_id);
    assert.equal(result.revision.content.lifecycle, row.parsed!.lifecycle);
    assert.equal(result.product.state, "Draft");
  }
  assert.equal((await readProduct(p, existing.id)).product.revision, 2);
});

test("PD new relationship types retain one exact relationship from either product side", async () => {
  const { p } = await productActor();
  const a = productInput(),
    b = productInput();
  await createProduct(p, a);
  await createProduct(p, b);
  const from = (await readProduct(p, a.id)).revision,
    to = (await readProduct(p, b.id)).revision;
  for (const type of [
    "Compatibility",
    "CandidateReplacement",
    "Replaces",
    "RequiresAccessory",
  ] as const) {
    const id = randomUUID(),
      content = relationshipFixture({ type });
    await createRelationship(p, {
      ...crmBase(),
      id,
      from: { product_id: a.id, revision_id: from.id },
      to: { product_id: b.id, revision_id: to.id },
      predecessor_id: null,
      content,
    });
    const left = (await listRelationships(p, { product_id: a.id })).items.find(
      (r) => r.id === id,
    )!;
    const right = (await listRelationships(p, { product_id: b.id })).items.find(
      (r) => r.id === id,
    )!;
    assert.deepEqual(left, right);
    assert.deepEqual(left.content, content);
    assert.equal(left.content_hash, hash(content));
    if (type === "Replaces") {
      assert.equal(relationshipLabel(left.content.type, "from"), "Replaced by");
      assert.equal(relationshipLabel(right.content.type, "to"), "Replaces");
    }
  }
});

test("PD legacy mapped plans refuse Review, remain Mapped and can be mapped again without changing retained evidence", async () => {
  const { p } = await productActor(),
    reviewer = await productActor();
  for (const lifecycle of ["Supported", "Retired"] as const) {
    const id = randomUUID();
    const raw = JSON.stringify({
      format: "PPO synthetic catalogue 1",
      rows: [
        {
          external_key: `SYN-${randomUUID()}`,
          reference: `SYN-${randomUUID()}`,
          kind: "Family",
          parent_id: null,
          content: productContentFixture({ lifecycle }),
        },
      ],
    });
    await stageImport(p, {
      ...crmBase(),
      id,
      company_id: CRM.company,
      filename: "old-mapped-plan.json",
      provider: "SYN historical supplier",
      source_description: "SYN pre-vocabulary plan",
      source_time: null,
      raw_content: raw,
    });
    const mappings = [
      {
        row_number: 1,
        action: "New",
        target_id: null,
        reason: "SYN explicit new identity",
      },
    ];
    await mapImport(p, id, { ...crmBase(), expected_version: 1, mappings });
    const mapped = await readImport(p, id);
    // Install a historical plan as new immutable evidence, retaining the graph
    // and event constraints. Never rewrite a retained plan or disable triggers.
    const rows = structuredClone(mapped.rows);
    rows[0].parsed!.lifecycle = lifecycle;
    rows[0].create!.content.lifecycle = lifecycle;
    rows[0].changes = rows[0].changes.map((change) =>
      change.field === "lifecycle" ? { ...change, after: lifecycle } : change,
    );
    rows[0].warnings = [];
    const planId = randomUUID();
    await transaction(async (c) => {
      await c.query(
        `INSERT INTO ppo.product_import_plans
        (id,workspace_id,batch_id,predecessor_id,rows,comparison_hash,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [
          planId,
          p.workspace_id,
          id,
          mapped.current!.id,
          JSON.stringify(rows),
          hash(rows),
          p.actor_id,
        ],
      );
      await c.query(
        `UPDATE ppo.product_imports SET current_plan_id=$3,
        version=version+1,updated_by=$4,updated_at=clock_timestamp()
        WHERE workspace_id=$1 AND id=$2`,
        [p.workspace_id, id, planId, p.actor_id],
      );
      await c.query(
        `INSERT INTO ppo.product_import_events
        (id,workspace_id,batch_id,plan_id,batch_version,action,reason,operation_id,created_by)
        VALUES($1,$2,$3,$4,$5,'Mapped','SYN historical plan',$6,$7)`,
        [
          randomUUID(),
          p.workspace_id,
          id,
          planId,
          mapped.batch.version + 1,
          randomUUID(),
          p.actor_id,
        ],
      );
    });
    const historical = await readImport(p, id);
    await assert.rejects(
      decideImport(reviewer.p, id, {
        ...crmBase(),
        expected_version: historical.batch.version,
        plan_id: planId,
        comparison_hash: historical.current!.comparison_hash,
        action: "Reviewed",
      }),
      (e: unknown) =>
        e instanceof AppError &&
        e.status === 422 &&
        e.field_errors.some(
          (f) =>
            f.field === "rows" && f.message.startsWith("Map this batch again"),
        ),
    );
    const refused = await readImport(p, id);
    assert.equal(refused.batch.state, "Mapped");
    assert.equal(refused.can_map, true);
    assert.deepEqual(refused.batch, historical.batch);
    assert.deepEqual(refused.current, historical.current);
    assert.deepEqual(refused.history, historical.history);
    await mapImport(p, id, {
      ...crmBase(),
      expected_version: refused.batch.version,
      mappings,
    });
    const remapped = await readImport(p, id);
    assert.equal(remapped.batch.state, "Mapped");
    assert.notEqual(remapped.current!.id, planId);
    assert.equal(
      remapped.rows[0].parsed!.lifecycle,
      currentLifecycle(lifecycle),
    );
    assert.deepEqual(
      remapped.plans.find((plan) => plan.id === planId),
      historical.current,
    );
    assert.equal(remapped.batch.raw_content, raw);
    assert.equal(remapped.batch.content_hash, historical.batch.content_hash);
    for (const action of ["Reviewed", "Apply"] as const) {
      const current = await readImport(p, id);
      await decideImport(action === "Reviewed" ? reviewer.p : p, id, {
        ...crmBase(),
        expected_version: current.batch.version,
        plan_id: current.current!.id,
        comparison_hash: current.current!.comparison_hash,
        action,
      });
    }
    const applied = await readImport(p, id);
    assert.equal(applied.batch.state, "Applied");
    assert.equal(
      (await readProduct(p, applied.rows[0].proposed_id)).revision.content
        .lifecycle,
      currentLifecycle(lifecycle),
    );
  }
});
