import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../../src/platform/errors";
const fieldError = (field: string, text: RegExp) => (e: unknown) =>
  e instanceof AppError &&
  e.code === "InvalidData" &&
  e.field_errors.some((f) => f.field === field && text.test(f.message));
import {
  fxContent,
  convertedTiers,
  fxReviewHash,
  fxCurrencies,
} from "../../src/estimating/sources/fx";
import {
  sourceContent,
  sourceDecision,
} from "../../src/estimating/sources/validation";
import { sourcePrice } from "../../src/estimating/sources/price";
import { decimal, extended } from "../../src/estimating/math";
import { sourceInput } from "../helpers/estimating-sources";
import { fxEvidence } from "../helpers/source-fx";
import { crmBase } from "../helpers/crm";
import { randomUUID } from "node:crypto";

test("FX original prices and AUD-per-foreign rate canonicalise without changing domestic content", () => {
  const domestic = sourceContent(sourceInput().content);
  assert.ok(!("fx" in domestic));
  const content = sourceContent({
    ...sourceInput().content,
    tiers: undefined,
    fx: fxEvidence(),
  });
  assert.equal(content.currency, "AUD");
  assert.equal(content.fx!.currency, "USD");
  assert.equal(content.fx!.tiers[0].unit_cost, "0.670000");
  assert.equal(content.tiers[0].unit_cost, "1.01");
  assert.equal(content.tiers[1].unit_cost, "0.75");
  assert.deepEqual(sourceContent(content), content);
  assert.equal(
    fxReviewHash(content.fx!),
    fxReviewHash(fxContent({ ...fxEvidence(), rate: "1.5" })),
  );
  assert.notEqual(
    fxReviewHash(content.fx!),
    fxReviewHash(
      fxContent({ ...fxEvidence(), evidence_excerpt: "Corrected evidence" }),
    ),
  );
});
test("FX independent expected unit-first HALF_UP ties, fractions and line extensions", () => {
  // Expected values independently calculated using decimal arithmetic, not this converter.
  for (const [foreign, rate, quantity, unit, line] of [
    ["0.004999", "1", "1", "0.00", "0.00"],
    ["0.005000", "1", "1.500", "0.01", "0.02"],
    ["0.005001", "1", "1", "0.01", "0.01"],
    ["12.345678", "1.532187", "1.125", "18.92", "21.29"],
    ["0.666666", "1.500001", "2.500", "1.00", "2.50"],
    ["0", "1000000", "100000", "0.00", "0.00"],
    ["1000000", "1", "0.001", "1000000.00", "1000.00"],
  ]) {
    const fx = fxContent({
      ...fxEvidence(),
      rate,
      tiers: [{ minimum_quantity: "0.001", unit_cost: foreign }],
    });
    assert.equal(convertedTiers(fx)[0].unit_cost, unit);
    assert.equal(decimal(extended(quantity, unit)), line);
  }
});
test("FX bounds refuse inferred, inverted, nondecimal, unsupported and overflow inputs", () => {
  for (const change of [
    { rate: "0" },
    { rate: "-1" },
    { rate: "1e2" },
    { rate: 1.5 },
    { rate: "1.0000001" },
    { rate: "1000000.000001" },
    { rate: null },
    { currency: "AUD" },
    { currency: "JPY" },
    { policy: "Market" },
    { direction: "ForeignPerAUD" },
    { rate_date: "2026-02-30" },
    { rate_date: "2026-10-02" },
    { valid_until: null },
    { valid_until: "2026-09-30" },
    { evidence_reference: "" },
    { tiers: [{ minimum_quantity: "1", unit_cost: "" }] },
    { tiers: [{ minimum_quantity: "1", unit_cost: "1.0000001" }] },
    { tiers: [{ minimum_quantity: "1", unit_cost: "1000000.000001" }] },
    {
      tiers: [
        { minimum_quantity: "1", unit_cost: "1" },
        { minimum_quantity: "1", unit_cost: "2" },
      ],
    },
  ])
    assert.throws(
      () => fxContent({ ...fxEvidence(), ...change }),
      JSON.stringify(change),
    );
  assert.throws(
    () =>
      convertedTiers(
        fxContent({
          ...fxEvidence(),
          rate: "1000000",
          tiers: [{ minimum_quantity: "1", unit_cost: "1.01" }],
        }),
      ),
    fieldError("fx", /exceeds/),
  );
  for (const currency of fxCurrencies)
    assert.equal(fxContent({ ...fxEvidence(), currency }).currency, currency);
});
test("FX refuses mismatched derived tiers, unsupported legacy use and expired pricing dates", () => {
  const input = {
      ...sourceInput().content,
      tiers: undefined,
      fx: fxEvidence(),
    },
    c = sourceContent(input);
  assert.throws(
    () =>
      sourceContent({
        ...input,
        tiers: [{ minimum_quantity: "1", unit_cost: "1.00" }],
      }),
    fieldError("tiers", /exactly/),
  );
  assert.throws(() => sourceContent({ ...input, fx: null }));
  assert.throws(() => sourcePrice(c, "1", "each", "2026-10-14"), /Excel/);
  assert.equal(
    sourcePrice(c, "1", "each", "2026-10-01", true).unit_cost,
    "1.01",
  );
  assert.equal(
    sourcePrice(c, "2", "each", "2026-10-31", true).unit_cost,
    "0.75",
  );
  assert.throws(() => sourcePrice(c, "1", "each", "2026-09-30", true), /FX/);
  assert.throws(() => sourcePrice(c, "1", "each", "2026-11-01", true), /FX/);
  assert.throws(
    () => sourcePrice(c, "1", "other", "2026-10-14", true),
    /units/,
  );
  const large = {
    ...input,
    title: "測".repeat(200),
    supplier_label: "測".repeat(200),
    item_reference: "測".repeat(200),
    unit: "測".repeat(40),
    evidence_reference: "測".repeat(300),
    evidence_excerpt: "測".repeat(6000),
    fx: {
      ...fxEvidence(),
      evidence_reference: "測".repeat(300),
      evidence_excerpt: "測".repeat(2000),
      tiers: Array.from({ length: 20 }, (_, i) => ({
        minimum_quantity: String(i + 1),
        unit_cost: "1",
      })),
    },
  };
  assert.throws(() => sourceContent(large), fieldError("fx", /28 KiB/));
  assert.equal(
    sourceContent({
      ...large,
      fx: { ...large.fx, evidence_excerpt: "測".repeat(1000) },
    }).tiers.length,
    20,
  );
  const decision = sourceDecision(randomUUID(), {
    ...crmBase(),
    expected_version: 1,
    revision_id: randomUUID(),
    action: "Reviewed",
  });
  assert.ok(!("fx_review_hash" in decision));
  assert.throws(() =>
    sourceDecision(decision.id, {
      ...crmBase(),
      expected_version: 1,
      revision_id: decision.revision_id,
      action: "Reviewed",
      fx_review_hash: "bad",
    }),
  );
});
