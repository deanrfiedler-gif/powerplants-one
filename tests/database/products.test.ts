import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset } from "../../scripts/database";
import { createSession } from "../../src/platform/identity";
import { readOperation } from "../../src/shared/receipts";
import {
  createProduct,
  reviseProduct,
  decideProduct,
  bindProductSource,
} from "../../src/products/commands";
import {
  listProducts,
  readProduct,
  productPricing,
} from "../../src/products/reads";
import {
  createRelationship,
  reviewRelationship,
  listRelationships,
} from "../../src/products/relationships";
import {
  stageImport,
  mapImport,
  readImport,
  decideImport,
} from "../../src/products/imports";
import {
  createCostSource,
  decideCostSource,
} from "../../src/estimating/sources/commands";
import { readCostSource } from "../../src/estimating/sources/reads";
import {
  productActor,
  productFixture,
  productInput,
  productContentFixture,
  publishProduct,
  relationshipFixture,
} from "../helpers/products";
import { crmBase, CRM } from "../helpers/crm";
import { sourceInput } from "../helpers/estimating-sources";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (c: string) => (e: unknown) =>
  Boolean(e && typeof e === "object" && "code" in e && e.code === c);

test("PD named synthetic grants only; exact identity hierarchy, scoped reads, technical projection and immutable publication successors", async () => {
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.permission_grants WHERE capability LIKE 'products.%'",
      )
    ).rows[0].n,
    15,
  );
  await assert.rejects(
    listProducts((await createSession("coordinator")).principal),
    code("Forbidden"),
  );
  const f = await productFixture(),
    p = f.author.p,
    id = f.variant.id;
  const first = await readProduct(p, id);
  assert.equal(first.product.parent_id, f.model.id);
  assert.equal(
    (await listProducts(p, { q: first.revision.content.title })).items.length >=
      2,
    true,
  );
  await assert.rejects(readProduct(f.other.p, id), code("RecordUnavailable"));
  assert.equal((await listProducts(f.other.p)).items.length, 0);
  const published = await publishProduct(p, f.reviewer.p, id),
    old = JSON.stringify(published.revision);
  const command = {
    ...crmBase(),
    expected_version: published.product.version,
    content: {
      ...first.revision.content,
      title: "SYN Revised technical label",
    },
  };
  const saved = await reviseProduct(p, id, command);
  assert.equal((await reviseProduct(p, id, command)).replayed, true);
  assert.deepEqual(await readOperation(p, command.operation_id), saved.receipt);
  await assert.rejects(
    reviseProduct(p, id, { ...command, reason: "Different original" }),
    code("OperationConflict"),
  );
  const current = await readProduct(p, id);
  assert.equal(current.product.state, "Draft");
  assert.equal(current.product.published_revision_id, first.revision.id);
  assert.equal(current.previous?.id, first.revision.id);
  assert.equal(
    current.revision.content.technical_revision,
    first.revision.content.technical_revision,
  );
  assert.equal(
    JSON.stringify(
      (await readProduct(p, id, { revision_id: first.revision.id })).revision,
    ),
    old,
  );
  await assert.rejects(
    reviseProduct(p, id, { ...command, ...crmBase() }),
    code("StaleVersion"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.product_revisions SET reason='rewrite' WHERE id=$1",
      [first.revision.id],
    ),
    code("55000"),
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.product_events WHERE product_id=$1", [
      id,
    ]),
    code("55000"),
  );
  const second = await publishProduct(p, f.reviewer.p, id);
  assert.equal(second.product.published_revision_id, current.revision.id);
  assert.equal(
    second.history.find((e) => e.action === "Published")?.supersedes_id,
    first.revision.id,
  );
  await decideProduct(p, id, {
    ...crmBase(),
    expected_version: second.product.version,
    revision_id: second.revision.id,
    action: "Withdrawn",
  });
  assert.equal((await readProduct(p, id)).product.published_revision_id, null);
  const bad = productInput({ kind: "Variant", parent_id: f.family.id });
  await assert.rejects(createProduct(p, bad));
  assert.equal(
    (await database().query("SELECT 1 FROM ppo.products WHERE id=$1", [bad.id]))
      .rowCount,
    0,
  );
});
test("PD review authority and exact concurrency refuse self-review, stale revision and revoked recovery", async () => {
  const { p } = await productActor(),
    input = productInput();
  await createProduct(p, input);
  const d = await readProduct(p, input.id);
  const submit = {
    ...crmBase(),
    expected_version: 1,
    revision_id: d.revision.id,
    action: "Submit",
  };
  await decideProduct(p, input.id, submit);
  await assert.rejects(
    decideProduct(p, input.id, {
      ...crmBase(),
      expected_version: 2,
      revision_id: d.revision.id,
      action: "Reviewed",
    }),
    code("IndependentReviewRequired"),
  );
  await assert.rejects(
    reviseProduct(p, input.id, {
      ...crmBase(),
      expected_version: 2,
      content: { ...input.content, title: "SYN blocked" },
    }),
    code("ProductInReview"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='products.edit'",
    [p.actor_id],
  );
  await assert.rejects(readOperation(p, submit.operation_id));
  await assert.rejects(decideProduct(p, input.id, submit));
});
test("PD source binding reuses exact ES03 evidence and withholds supplier fields from technical readers", async () => {
  const f = await productFixture(),
    s = sourceInput(),
    coordinator = (await createSession("coordinator")).principal,
    reviewer = (await createSession("estimating-source-reviewer")).principal;
  await createCostSource(coordinator, s);
  let source = await readCostSource(coordinator, s.id);
  await decideCostSource(coordinator, s.id, {
    ...crmBase(),
    expected_version: 1,
    revision_id: source.revision.id,
    action: "Submit",
  });
  await decideCostSource(reviewer, s.id, {
    ...crmBase(),
    expected_version: 2,
    revision_id: source.revision.id,
    action: "Reviewed",
  });
  source = await readCostSource(coordinator, s.id);
  for (const cap of ["estimating.read"])
    await database().query(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3)",
      [CRM.workspace, f.author.p.actor_id, CRM.company, cap],
    );
  const d = await readProduct(f.author.p, f.variant.id),
    body = {
      ...crmBase(),
      expected_version: 1,
      revision_id: d.revision.id,
      source_id: s.id,
      source_revision_id: source.revision.id,
      status: "Mapped",
      evidence: "SYN exact supplier item and each unit mapping",
    };
  await bindProductSource(f.author.p, f.variant.id, body);
  assert.equal(
    (await productPricing(f.author.p, f.variant.id)).sources[0].source?.revision
      .id,
    source.revision.id,
  );
  await assert.rejects(productPricing(f.technical.p, f.variant.id));
  assert.doesNotMatch(
    JSON.stringify(await readProduct(f.technical.p, f.variant.id)),
    /supplier_label|unit_cost|SourceBound|exact supplier item/,
  );
  assert.equal(
    (await bindProductSource(f.author.p, f.variant.id, body)).replayed,
    true,
  );
  const mismatch = productInput({
    content: productContentFixture({ unit: "m" }),
  });
  await createProduct(f.author.p, mismatch);
  const md = await readProduct(f.author.p, mismatch.id);
  await assert.rejects(
    bindProductSource(f.author.p, mismatch.id, {
      ...body,
      ...crmBase(),
      expected_version: 1,
      revision_id: md.revision.id,
    }),
  );
});
test("PD replacement candidates retain original identities and unresolved owned criteria", async () => {
  const f = await productFixture(),
    from = await readProduct(f.author.p, f.variant.id),
    to = await readProduct(f.author.p, f.similar.id),
    id = randomUUID(),
    content = relationshipFixture();
  const input = {
    ...crmBase(),
    id,
    from: { product_id: from.product.id, revision_id: from.revision.id },
    to: { product_id: to.product.id, revision_id: to.revision.id },
    content,
    predecessor_id: null,
  };
  await createRelationship(f.author.p, input);
  const row = (
    await listRelationships(f.reviewer.p, { product_id: from.product.id })
  ).items[0];
  await assert.rejects(
    reviewRelationship(f.author.p, id, {
      ...crmBase(),
      expected_version: 1,
      content_hash: row.content_hash,
      outcome: "Unresolved",
    }),
    code("IndependentReviewRequired"),
  );
  await assert.rejects(
    reviewRelationship(f.reviewer.p, id, {
      ...crmBase(),
      expected_version: 1,
      content_hash: row.content_hash,
      outcome: "Conditional",
    }),
    code("InvalidData"),
  );
  const review = {
      ...crmBase(),
      expected_version: 1,
      content_hash: row.content_hash,
      outcome: "Unresolved",
    },
    saved = await reviewRelationship(f.reviewer.p, id, review);
  assert.deepEqual(
    await readOperation(f.reviewer.p, review.operation_id),
    saved.receipt,
  );
  assert.equal(
    (await listRelationships(f.reviewer.p)).items.find((r) => r.id === id)
      ?.outcome,
    "Unresolved",
  );
  assert.equal(
    (await readProduct(f.author.p, from.product.id)).revision.id,
    from.revision.id,
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.product_relationships WHERE id=$1", [id]),
    code("55000"),
  );
});
test("PD staged import detects unmapped, duplicate, conflicting and invalid rows without merging", async () => {
  const f = await productFixture(),
    d = await readProduct(f.author.p, f.variant.id),
    id = randomUUID();
  const row = {
    external_key: f.variant.entity_key,
    kind: "Variant",
    parent_id: f.model.id,
    reference: f.variant.reference,
    content: { ...d.revision.content, title: "SYN imported successor" },
  };
  const raw_content = JSON.stringify({
    format: "PPO synthetic catalogue 1",
    rows: [
      row,
      row,
      { ...row, external_key: "UNKNOWN" },
      {
        ...row,
        external_key: "INVALID",
        content: { ...row.content, unit: "litre" },
      },
      { ...row, external_key: "CLAIM", replacement_claim: "drop-in" },
      { ...row, external_key: "OTHER-COMPANY", company_id: CRM.companyB },
    ],
  });
  const input = {
    ...crmBase(),
    id,
    company_id: CRM.company,
    filename: "synthetic-mixed.json",
    source_description: "SYN mixed validation proof",
    provider: "Synthetic catalogue",
    source_time: null,
    raw_content,
  };
  const saved = await stageImport(f.author.p, input);
  assert.equal((await stageImport(f.author.p, input)).replayed, true);
  assert.deepEqual(
    await readOperation(f.author.p, input.operation_id),
    saved.receipt,
  );
  let batch = await readImport(f.author.p, id);
  assert.equal(batch.rows.length, 6);
  assert.ok(batch.rows.every((r) => r.errors.length));
  assert.ok(batch.rows[0].duplicate_candidates.length >= 2);
  await mapImport(f.author.p, id, {
    ...crmBase(),
    expected_version: 1,
    mappings: [],
  });
  batch = await readImport(f.author.p, id);
  await assert.rejects(
    decideImport(f.reviewer.p, id, {
      ...crmBase(),
      expected_version: 2,
      plan_id: batch.current!.id,
      comparison_hash: batch.current!.comparison_hash,
      action: "Reviewed",
    }),
  );
  await assert.rejects(
    stageImport(f.author.p, { ...input, ...crmBase(), id: randomUUID() }),
    code("ImportAlreadyStaged"),
  );
  const decisions = batch.rows.map((r) => ({
    row_number: r.row_number,
    action: r.row_number === 1 ? "Resolve" : "Exclude",
    target_id: r.row_number === 1 ? d.product.id : null,
    reason:
      r.row_number === 1
        ? "Exact key/unit confirmed"
        : "Retain invalid/duplicate raw evidence; no change",
  }));
  await mapImport(f.author.p, id, {
    ...crmBase(),
    expected_version: 2,
    mappings: decisions,
  });
  batch = await readImport(f.author.p, id);
  assert.deepEqual(batch.rows[0].errors, []);
  const base = {
    expected_version: 3,
    plan_id: batch.current!.id,
    comparison_hash: batch.current!.comparison_hash,
  };
  await assert.rejects(
    decideImport(f.author.p, id, { ...crmBase(), ...base, action: "Reviewed" }),
    code("IndependentReviewRequired"),
  );
  await decideImport(f.reviewer.p, id, {
    ...crmBase(),
    ...base,
    action: "Reviewed",
  });
  const apply = { ...crmBase(), ...base, expected_version: 4, action: "Apply" };
  const receipt = await decideImport(f.author.p, id, apply);
  assert.equal((await decideImport(f.author.p, id, apply)).replayed, true);
  assert.deepEqual(
    await readOperation(f.author.p, apply.operation_id),
    receipt.receipt,
  );
  assert.equal(
    (await readProduct(f.author.p, d.product.id)).revision.revision,
    2,
  );
  assert.equal(
    (await readProduct(f.author.p, d.product.id)).product.state,
    "Draft",
  );
  await assert.rejects(
    decideImport(f.author.p, id, {
      ...apply,
      ...crmBase(),
      expected_version: 5,
    }),
    code("ImportStateChanged"),
  );
  assert.equal((await readImport(f.author.p, id)).plans.length, 2);
  assert.equal((await readImport(f.author.p, id)).history[0].result?.length, 1);
});
test("PD reviewed import refuses stale targets and rolls back every product and receipt on failure", async () => {
  const f = await productFixture(),
    id = randomUUID(),
    one = await readProduct(f.author.p, f.variant.id),
    two = await readProduct(f.author.p, f.similar.id);
  const rows = [one, two].map((d) => ({
    external_key: d.product.entity_key,
    kind: d.product.kind,
    parent_id: d.product.parent_id,
    reference: d.product.reference,
    content: { ...d.revision.content, title: "SYN proposed rollback update" },
  }));
  await stageImport(f.author.p, {
    ...crmBase(),
    id,
    company_id: CRM.company,
    filename: "rollback.json",
    source_description: "SYN atomic rollback proof",
    provider: "Synthetic catalogue",
    source_time: null,
    raw_content: JSON.stringify({ format: "PPO synthetic catalogue 1", rows }),
  });
  await mapImport(f.author.p, id, {
    ...crmBase(),
    expected_version: 1,
    mappings: [one, two].map((d, i) => ({
      row_number: i + 1,
      action: "Resolve",
      target_id: d.product.id,
      reason: "SYN exact identity",
    })),
  });
  const batch = await readImport(f.author.p, id),
    base = {
      plan_id: batch.current!.id,
      comparison_hash: batch.current!.comparison_hash,
    };
  await decideImport(f.reviewer.p, id, {
    ...crmBase(),
    ...base,
    expected_version: 2,
    action: "Reviewed",
  });
  await database().query(
    "CREATE FUNCTION ppo.products_injected_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.content->>'title'='SYN proposed rollback update' AND NEW.product_id='" +
      two.product.id +
      "'::uuid THEN RAISE EXCEPTION 'Synthetic injected second-row failure' USING ERRCODE='23514'; END IF; RETURN NEW; END $$; CREATE TRIGGER injected_product_failure BEFORE INSERT ON ppo.product_revisions FOR EACH ROW EXECUTE FUNCTION ppo.products_injected_failure()",
  );
  const apply = { ...crmBase(), ...base, expected_version: 3, action: "Apply" };
  try {
    await assert.rejects(decideImport(f.author.p, id, apply));
    assert.equal(
      (await readProduct(f.author.p, one.product.id)).revision.id,
      one.revision.id,
    );
    assert.equal((await readImport(f.author.p, id)).batch.state, "Reviewed");
    await assert.rejects(readOperation(f.author.p, apply.operation_id));
  } finally {
    await database().query(
      "DROP TRIGGER injected_product_failure ON ppo.product_revisions; DROP FUNCTION ppo.products_injected_failure()",
    );
  }
  await reviseProduct(f.author.p, one.product.id, {
    ...crmBase(),
    expected_version: 1,
    content: { ...one.revision.content, title: "SYN concurrent author change" },
  });
  await assert.rejects(
    decideImport(f.author.p, id, apply),
    code("StaleVersion"),
  );
});
