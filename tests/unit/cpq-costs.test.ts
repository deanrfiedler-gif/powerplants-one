import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../../src/platform/errors";
import { costLineEvidence } from "../../src/cpq/costs";
import type { Binding } from "../../src/cpq/context";
import { evaluate } from "../../src/cpq/engine";
import { definition } from "../../src/cpq/validation";
import { hash } from "../../src/cpq/hash";
import { costDefinition } from "../helpers/cpq-costs";
import { cpqDefinition, cpqInput } from "../helpers/cpq";
import { fxEvidence } from "../helpers/source-fx";
import { sourceContent } from "../../src/estimating/sources/validation";

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

test("governed pricing dates obey native binding bounds before reporting adoption readiness", () => {
  const d = costDefinition();
  for (const part of d.parts) {
    part.effective_from = "0000-01-01";
    part.effective_to = "9999-12-31";
    part.cost_source!.content.effective_from = "0001-01-01";
    part.cost_source!.content_hash = hash(part.cost_source!.content);
  }
  const valid = definition(d);
  for (const pricing_date of ["0000-01-01", "9999-01-01", "9999-12-31"]) {
    const result = evaluate(valid, { ...cpqInput(), pricing_date });
    assert.equal(result.ready, false);
    assert.ok(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "CpqCostPricingDateRange",
      ),
    );
  }
  for (const pricing_date of ["0001-01-01", "9998-12-31"])
    assert.equal(evaluate(valid, { ...cpqInput(), pricing_date }).ready, true);
});

test("governed source validity cannot contain PostgreSQL's unsupported year zero", () => {
  for (const valid_until of [null, "0000-12-31"]) {
    const d = costDefinition();
    d.parts[0].cost_source!.content.effective_from = "0000-01-01";
    d.parts[0].cost_source!.content.valid_until = valid_until;
    d.parts[0].cost_source!.content_hash = hash(
      d.parts[0].cost_source!.content,
    );
    const result = evaluate(definition(d), cpqInput());
    assert.equal(result.ready, false);
    assert.ok(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "CpqCostSourceDateRange",
      ),
    );
  }
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

test("governed CPQ rejects otherwise-valid reviewed FX evidence instead of bypassing its separate receiving review", () => {
  const d = costDefinition(),
    ref = d.parts[0].cost_source!;
  ref.content = sourceContent({
    ...ref.content,
    tiers: undefined,
    fx: fxEvidence(),
  });
  ref.content_hash = hash(ref.content);
  assert.throws(
    () => definition(d),
    (e: unknown) =>
      e instanceof AppError &&
      e.field_errors.some(
        (f) =>
          f.field === "cost_source" &&
          f.message.includes("direct AUD source evidence"),
      ),
  );
});

test("source attribution uses the exact part identity when a unit contains another target suffix", () => {
  const d = costDefinition();
  d.parts[0].unit = "pack:installation:hour";
  d.parts[0].cost_source!.content.unit = d.parts[0].unit;
  d.parts[0].cost_source!.content_hash = hash(d.parts[0].cost_source!.content);
  const parsed = definition(d),
    result = evaluate(parsed, cpqInput());
  const cost_sources = parsed.parts
    .map((p) => ({
      ...p.cost_source!,
      part_key: p.key,
      review: {
        id: p.cost_source!.review_event_id,
        source_version: 3,
        reason: "SYN reviewed",
        created_by: p.cost_source!.source_id,
        created_at: "2026-10-01T00:00:00.000Z",
      },
    }))
    .reverse();
  const evidence = costLineEvidence({
    binding: { cost_sources } as Binding,
    result,
  });
  assert.equal(
    evidence.find((e) => e.target.includes(":sensor:"))!.source.source_id,
    d.parts[0].cost_source!.source_id,
  );
  assert.equal(
    evidence.find((e) => e.target.includes(":sensor:"))!.source.part_key,
    "sensor",
  );
});
