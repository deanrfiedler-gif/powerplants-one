import assert from "node:assert/strict";
import { test } from "node:test";
import {
  lifecycleStoredValues,
  lifecycleLabel,
  currentLifecycle,
  lifecycleFilterValues,
  relationshipTypes,
  relationshipLabel,
  criterionOutcomes,
  criterionLabel,
  conclusionLabel,
  normaliseDuplicate,
} from "../../src/products/vocabulary";
import {
  productContent,
  productWriteContent,
  relationshipContent,
  hash,
  compareContent,
} from "../../src/products/model";
import { createInput, reviseProduct } from "../../src/products/commands";
import {
  productInput,
  productContentFixture,
  relationshipFixture,
} from "../helpers/products";
import { crmBase } from "../helpers/crm";
import { AppError } from "../../src/platform/errors";

test("PD every lifecycle has one display word; legacy reads and hashes remain as recorded", () => {
  const expected = {
    Current: "Current",
    Supported: "Current",
    LastTimeBuy: "Last-time buy",
    Discontinued: "Discontinued",
    Retired: "Discontinued",
    Unknown: "Unknown",
  };
  assert.equal(lifecycleStoredValues.length, Object.keys(expected).length);
  for (const lifecycle of lifecycleStoredValues) {
    const stored = productContentFixture({ lifecycle });
    assert.deepEqual(productContent(stored), stored);
    assert.equal(hash(productContent(stored)), hash(stored));
    assert.equal(lifecycleLabel(lifecycle), expected[lifecycle]);
    assert.ok(
      lifecycleFilterValues(currentLifecycle(lifecycle)).includes(lifecycle),
    );
  }
  assert.deepEqual(lifecycleFilterValues("Current"), ["Current", "Supported"]);
  assert.deepEqual(lifecycleFilterValues("Discontinued"), [
    "Discontinued",
    "Retired",
  ]);
  const before = productContentFixture({ lifecycle: "Supported" });
  const after = productWriteContent({
    ...before,
    lifecycle: currentLifecycle(before.lifecycle),
  });
  assert.deepEqual(compareContent(before, after), [
    { field: "lifecycle", before: "Supported", after: "Current" },
  ]);
});

test("PD create and revise validation refuses legacy writes with the current word", async () => {
  for (const lifecycle of ["Supported", "Retired"] as const) {
    const input = productInput({
      content: productContentFixture({ lifecycle }),
    });
    const refusal = (e: unknown) =>
      e instanceof AppError &&
      e.field_errors.some(
        (f) =>
          f.field === "lifecycle" &&
          f.message ===
            `Use ${lifecycleLabel(lifecycle)}; ${lifecycle} is an earlier word.`,
      );
    assert.throws(() => productWriteContent(input.content), refusal);
    assert.throws(() => createInput(input), refusal);
    // Validation happens before access to any database or identity.
    await assert.rejects(
      reviseProduct(
        { actor_id: input.id, workspace_id: input.id, display_name: "SYN" },
        input.id,
        { ...crmBase(), expected_version: 1, content: input.content },
      ),
      refusal,
    );
  }
  for (const lifecycle of [
    "Current",
    "LastTimeBuy",
    "Discontinued",
    "Unknown",
  ] as const)
    assert.equal(
      createInput(
        productInput({ content: productContentFixture({ lifecycle }) }),
      ).content.lifecycle,
      lifecycle,
    );
});

test("PD relationship and criterion storage is unchanged while each side has its accepted words", () => {
  const expected = {
    Compatibility: ["Compatible with", "Compatible with"],
    CandidateReplacement: ["Alternative to", "Alternative to"],
    Replaces: ["Replaced by", "Replaces"],
    RequiresAccessory: ["Requires accessory", "Accessory for"],
  };
  for (const type of relationshipTypes) {
    const content = relationshipFixture({ type });
    assert.deepEqual(relationshipContent(content), content);
    assert.equal(hash(relationshipContent(content)), hash(content));
    assert.equal(relationshipLabel(type, "from"), expected[type][0]);
    assert.equal(relationshipLabel(type, "to"), expected[type][1]);
  }
  assert.deepEqual(criterionOutcomes.map(criterionLabel), [
    "Met",
    "Not met",
    "Unresolved",
  ]);
  for (const outcome of criterionOutcomes) {
    const content = relationshipFixture();
    content.criteria[0].outcome = outcome;
    assert.deepEqual(relationshipContent(content), content);
  }
  assert.throws(
    () => relationshipContent(relationshipFixture({ criteria: [] })),
    (e: unknown) =>
      e instanceof AppError &&
      e.field_errors.some((f) =>
        f.message.includes("owned Unresolved criterion"),
      ),
  );
  assert.equal(conclusionLabel(null), "Not reviewed");
  assert.equal(conclusionLabel("Unreviewed"), "Not reviewed");
  for (const value of ["Conditional", "Unresolved", "Rejected"])
    assert.equal(conclusionLabel(value), value);
});

test("PD duplicate suggestions ignore case, whitespace and every specified hyphen without prefix matching", () => {
  for (const model of [
    "DP-25",
    "dp 25",
    "DP25",
    "DP‑25",
    "DP\t2\n5",
    "DP\u00a025",
    ...Array.from(
      { length: 6 },
      (_, i) => `DP${String.fromCharCode(0x2010 + i)}25`,
    ),
    "DP−25",
  ])
    assert.equal(normaliseDuplicate(model), "dp25");
  assert.notEqual(normaliseDuplicate("DP-25"), normaliseDuplicate("DP-250"));
  assert.notEqual(normaliseDuplicate("DP.25"), normaliseDuplicate("DP-25"));
});
