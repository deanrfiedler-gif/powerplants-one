import assert from "node:assert/strict";
import { test } from "node:test";
import {
  productContent,
  compareContent,
  relationshipContent,
  relationshipOutcome,
  hash,
} from "../../src/products/model";
import { parseImport } from "../../src/products/imports";
import {
  productContentFixture,
  relationshipFixture,
} from "../helpers/products";
import { AppError } from "../../src/platform/errors";
import { randomUUID } from "node:crypto";
import { acceptsProductCommand } from "../../src/products/journal";
import {
  readJournal,
  writeJournal,
  type JournalEntry,
} from "../../src/shared/lib/command-journal";

test("PD source-binding journal restores its exact revision target and rejects unrelated extra queries", () => {
  const id = randomUUID(),
    revision = randomUUID();
  const entry: JournalEntry = {
    version: 1,
    scope: { actor_id: randomUUID(), workspace_id: randomUUID() },
    path: `products/${id}/pricing`,
    target: `/products/pricing?product_id=${id}&revision_id=${revision}`,
    body: { operation_id: randomUUID(), schema_version: 1 },
    record_id: id,
    label: "Record exact source binding",
    phase: "pending",
  };
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  writeJournal(storage, "pricing", entry, acceptsProductCommand);
  assert.deepEqual(
    readJournal(storage, "pricing", entry.scope, acceptsProductCommand),
    entry,
  );
  for (const target of [
    `${entry.target}&next=elsewhere`,
    `https://example.test${entry.target}`,
    `/products/import?product_id=${id}&revision_id=${revision}`,
  ])
    assert.throws(() =>
      writeJournal(
        storage,
        "invalid",
        { ...entry, target },
        acceptsProductCommand,
      ),
    );
});

test("PD typed technical/source provenance preserves explicit units, nulls and document applicability", () => {
  const c = productContent(productContentFixture());
  assert.equal(c.attributes[1].value, null);
  assert.equal(c.attributes[1].status, "Unresolved");
  assert.equal(c.documents[1].applicability, "NotApplicable");
  assert.equal(c.technical_revision, "TECH-A");
  for (const bad of [
    { ...c, model: "" },
    { ...c, source_reference: "" },
    { ...c, source_date: "2026-02-30" },
    { ...c, attributes: [{ ...c.attributes[0], unit: "mV" }] },
    { ...c, attributes: [{ ...c.attributes[1], clarification_owner: null }] },
    { ...c, attributes: [{ ...c.attributes[1], status: "Reviewed" }] },
    { ...c, unit: "" },
    { ...c, supplier_price: "120" },
  ])
    assert.throws(() => productContent(bad), AppError);
});
test("PD exact change comparison and stable canonical hash separate technical from catalogue revisions", () => {
  const before = productContentFixture(),
    after = { ...before, title: "SYN New label" };
  assert.deepEqual(compareContent(before, after), [
    { field: "title", before: before.title, after: after.title },
  ]);
  assert.equal(after.technical_revision, before.technical_revision);
  assert.equal(
    hash(before),
    hash({ ...before, attributes: before.attributes }),
  );
  assert.deepEqual(compareContent(before, before), []);
});
test("PD unresolved interface cannot become a conditional compatibility conclusion", () => {
  const c = relationshipContent(relationshipFixture());
  assert.equal(relationshipOutcome(c, "Unresolved"), "Unresolved");
  assert.throws(() => relationshipOutcome(c, "Conditional"), AppError);
  assert.throws(() => relationshipOutcome(c, "Compatible"), AppError);
  assert.equal(
    relationshipOutcome(
      { ...c, criteria: c.criteria.map((x) => ({ ...x, outcome: "Met" })) },
      "Conditional",
    ),
    "Conditional",
  );
  assert.throws(() => relationshipContent({ ...c, criteria: [] }), AppError);
});
test("PD staged format is bounded and retains invalid row evidence for exception review", () => {
  const raw = JSON.stringify({
    format: "PPO synthetic catalogue 1",
    rows: [{ external_key: "unknown", content: { unit: "" } }, "invalid row"],
  });
  assert.equal(parseImport(raw).length, 2);
  for (const raw of [
    "not json",
    JSON.stringify({ format: "Supplier production CSV", rows: [{}] }),
    JSON.stringify({ format: "PPO synthetic catalogue 1", rows: [] }),
    JSON.stringify({
      format: "PPO synthetic catalogue 1",
      rows: Array(51).fill({}),
    }),
    " ".repeat(12001),
  ])
    assert.throws(() => parseImport(raw), AppError);
});
