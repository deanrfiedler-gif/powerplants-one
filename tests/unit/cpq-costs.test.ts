import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "../../src/cpq/engine";
import { definition } from "../../src/cpq/validation";
import { hash } from "../../src/cpq/hash";
import { costDefinition } from "../helpers/cpq-costs";
import { cpqDefinition, cpqInput } from "../helpers/cpq";

test("governed costs resolve exact product and labour tiers after quantity overrides; sell policy stays authored", () => {
  const d = costDefinition(),
    input = cpqInput(),
    first = evaluate(d, input);
  assert.equal(first.ready, true);
  assert.equal(first.totals.cost, "56.00");
  assert.equal(first.totals.sell, "105.00");
  assert.equal(first.lines[0].cost_source?.validity_end, null);
  assert.match(first.lines[0].cost_source!.validity_warning!, /Unknown/);
  const sensor = first.lines.find((l) => l.line.unit === "each")!;
  input.overrides = [
    {
      target: sensor.target,
      basis_hash: sensor.basis_hash,
      kind: "Quantity",
      value: "10.000",
      reason: "SYN explicit quantity",
    },
  ];
  const changed = evaluate(d, input);
  assert.equal(changed.totals.cost, "270.00");
  assert.equal(
    changed.lines.find((l) => l.line.unit === "each")!.cost_source!
      .tier_minimum_quantity,
    "10.000",
  );
  assert.equal(
    changed.lines.find((l) => l.line.unit === "hour")!.line.quantity,
    "5.000",
  );
  assert.equal(evaluate(d, input).result_hash, changed.result_hash);
});
test("governed cost validity and supplier minimum block without an authored-price fallback", () => {
  for (const [change, code] of [
    [
      (d: ReturnType<typeof costDefinition>) =>
        (d.parts[0].cost_source!.content.valid_until = "2026-09-30"),
      "SourceOutsideValidity",
    ],
    [
      (d: ReturnType<typeof costDefinition>) =>
        (d.parts[0].cost_source!.content.effective_from = "2026-11-01"),
      "SourceOutsideValidity",
    ],
    [
      (d: ReturnType<typeof costDefinition>) =>
        (d.parts[0].cost_source!.content.tiers[0].minimum_quantity = "5.000"),
      "SourceQuantityBelowMinimum",
    ],
    [
      (d: ReturnType<typeof costDefinition>) =>
        (d.parts[0].cost_source!.content.tiers[0].unit_cost = "100.00"),
      "BelowCost",
    ],
  ] as const) {
    const d = costDefinition();
    change(d);
    d.parts[0].cost_source!.content_hash = hash(
      d.parts[0].cost_source!.content,
    );
    const r = evaluate(definition(d), cpqInput());
    assert.equal(r.ready, false);
    assert.ok(r.diagnostics.some((x) => x.code === code));
    assert.ok(!r.lines.some((l) => l.line.unit === "each"));
  }
});
test("strict cost profile rejects forged content, units, authored costs, categories and empty mappings; old profiles reject new fields", () => {
  for (const mutate of [
    (d: ReturnType<typeof costDefinition>) =>
      (d.parts[0].cost_source!.content_hash = "a".repeat(64)),
    (d: ReturnType<typeof costDefinition>) => (d.parts[0].unit = "box"),
    (d: ReturnType<typeof costDefinition>) =>
      (d.parts[0].tiers[0].unit_cost = "1.00"),
    (d: ReturnType<typeof costDefinition>) => (d.parts[0].category = "Freight"),
    (d: ReturnType<typeof costDefinition>) =>
      d.parts.forEach((p) => delete p.cost_source),
    (d: ReturnType<typeof costDefinition>) => (d.schema_version = 1),
    (d: ReturnType<typeof costDefinition>) => (d.schema_version = 2),
    (d: ReturnType<typeof costDefinition>) => (d.schema_version = 3),
  ]) {
    const d = costDefinition();
    mutate(d);
    assert.throws(() => definition(d));
  }
});
test("deliberately changed source requires override review; zero source cost remains an actual reviewed zero", () => {
  const d = costDefinition(),
    first = evaluate(d, cpqInput()),
    input = cpqInput();
  input.overrides = [
    {
      target: first.lines[0].target,
      basis_hash: first.lines[0].basis_hash,
      kind: "SellPrice",
      value: "20.00",
      reason: "SYN reviewed selling price",
    },
  ];
  d.parts[0].cost_source!.source_version++;
  assert.ok(
    evaluate(d, input).diagnostics.some(
      (x) => x.code === "OverrideRebaseRequired",
    ),
  );
  d.parts[0].cost_source!.content.tiers[0].unit_cost = "0.00";
  assert.equal(
    evaluate(d, cpqInput()).lines.find((l) => l.line.unit === "each")!.line
      .unit_cost,
    "0.00",
  );
  assert.equal(
    evaluate(definition(cpqDefinition()), cpqInput()).totals.cost,
    "70.00",
  );
});
