import assert from "node:assert/strict";
import { test } from "node:test";
import { cpqDefinition, cpqInput } from "../helpers/cpq";
import {
  definition,
  calculationInput,
  condition,
} from "../../src/cpq/validation";
import { compileFormula, evaluateFormula } from "../../src/cpq/expression";
import {
  evaluate,
  evaluateCondition,
  testDefinition,
} from "../../src/cpq/engine";
import { screenDefinition } from "../../src/cpq/pilot";
import { tableCoverage } from "../../src/cpq/design-runtime";
import { boundInput } from "../../src/cpq/source-facts";
import { hash } from "../../src/cpq/hash";
import type { Definition } from "../../src/cpq/types";
export const designDefinition = (): Definition =>
  definition({
    ...cpqDefinition(),
    schema_version: 3,
    design: {
      option_sets: [],
      structure: [],
      shared_capacity: [],
      decision_tables: [],
      pricing: { mode: "Catalog", percent: "0", allow_override: true },
    },
  });

test("schema-3 round functions use exact rationals and signed boundaries; schema-1 rejects them", () => {
  for (const [formula, expected] of [
    ["ceil(145 / 10) * 2 + 5", "35"],
    ["ceil(140 / 10) * 2 + 5", "33"],
    ["ceil(-1.2)", "-1"],
    ["floor(-1.2)", "-2"],
    ["round(-1.5)", "-2"],
    ["round(1.5)", "2"],
    ["floor(1 / 3)", "0"],
    ["ceil(1 / 3)", "1"],
    ["round(1.235, 2)", "1.24"],
    ["round(-1.235, 2)", "-1.24"],
    ["round(1 / 3, 12)", "0.333333333333"],
    ["round(4.4, 0)", "4"],
    ["min(1 / 3, 0.3)", "0.3"],
    ["max(-2.1, -3.2)", "-2.1"],
    ["max(min(20, 12), ceil(14.1))", "15"],
  ]) {
    assert.equal(
      evaluateFormula(
        compileFormula(formula, new Set(), true),
        new Map(),
      ).exactDecimal(),
      expected,
    );
    assert.throws(() => compileFormula(formula, new Set()));
  }
  for (const formula of [
    "ceil(1,2)",
    "Math.ceil(1)",
    "min(1)",
    "max(1,2,3)",
    "round(1,2,3)",
    "floor(1,2)",
    "round()",
    "ceil(process.env)",
    "ceil(1);1",
  ])
    assert.throws(() => compileFormula(formula, new Set(), true));
  for (const places of ["-1", "13", "1.5", "100000000000000000"])
    assert.throws(() => evaluateFormula(compileFormula(`round(1.234, ${places})`, new Set(), true), new Map()), { code: "SCALE_INVALID" });
  const selected = compileFormula("round(max(value, floor(minimum)), places)", new Set(["value", "minimum", "places"]), true);
  assert.deepEqual(selected.dependencies, ["minimum", "places", "value"]);
  assert.equal(evaluateFormula(selected, new Map([["value", "1.234"], ["minimum", "0"], ["places", "2"]])).exactDecimal(), "1.23");
  assert.throws(() => evaluateFormula(selected, new Map()), { code: "FACT_MISSING" });
});

test("normalised schema-3 dictionary and inputs are idempotent; integers, text and NA remain distinct", () => {
  const d = designDefinition();
  d.facts.push(
    {
      key: "note",
      label: "Site note",
      type: "Text",
      unit: "text",
      required: false,
      choices: [],
    },
    {
      key: "drives",
      label: "Drives",
      type: "Integer",
      unit: "each",
      required: false,
      choices: [],
    },
  );
  const valid = definition(d);
  assert.deepEqual(definition(valid), valid);
  const raw = cpqInput();
  raw.instances[0].facts.note = null;
  raw.instances[0].facts.drives = "4";
  raw.instances[0].not_applicable = ["note"];
  const input = calculationInput(raw, valid.facts, true);
  assert.deepEqual(calculationInput(input, valid.facts, true), input);
  assert.equal(
    evaluateCondition(
      condition({ op: "NOT_APPLICABLE", fact: "note" }, valid.facts),
      input.instances[0].facts,
      valid.facts,
      input.instances[0].not_applicable,
    ),
    true,
  );
  assert.equal(
    evaluateCondition(
      condition({ op: "KNOWN", fact: "note" }, valid.facts),
      input.instances[0].facts,
      valid.facts,
      input.instances[0].not_applicable,
    ),
    false,
  );
  raw.instances[0].facts.drives = "4.5";
  assert.throws(() => calculationInput(raw, valid.facts, true));
  assert.throws(() =>
    condition({ op: "GT", fact: "note", value: "x" }, valid.facts),
  );
});

test("parameters, formula evidence, exact pricing and range diagnostics are retained", () => {
  const d = designDefinition(),
    i = cpqInput();
  d.rules[0].quantity = "ceil(count / spacing) * brackets + spares";
  d.rules[0].parameters = [
    { key: "spacing", label: "Spacing", value: "10", unit: "m" },
    { key: "brackets", label: "Per span", value: "2", unit: "each" },
    { key: "spares", label: "Spares", value: "5", unit: "each" },
  ];
  d.facts[0].maximum = "2000";
  d.constraints = [];
  i.instances[0].facts.count = "145";
  i.pricing = { mode: "Margin", percent: "20" };
  let result = evaluate(definition(d), calculationInput(i, d.facts, true));
  const line = result.lines.find((l) => l.line.category === "Product")!;
  assert.equal(line.line.quantity, "35.000");
  assert.equal(line.line.unit_sell, "11.25");
  assert.equal(line.contributions[0].facts.spacing, "10");
  assert.equal(result.explanation?.pricing.source, "Configuration");
  assert.equal(result.explanation?.rules[0].condition.result, true);
  i.instances[0].facts.count = "2001";
  result = evaluate(definition(d), calculationInput(i, d.facts, true));
  assert(result.diagnostics.some((d) => d.code === "FactOutOfRange"));
});

test("stale overrides keep effective quantity, block use, and explicitly rebase or restore", () => {
  const d = designDefinition(),
    i = cpqInput();
  const base = evaluate(d, i).lines.find((l) => l.line.category === "Product")!;
  i.overrides = [
    {
      target: base.target,
      basis_hash: base.basis_hash,
      kind: "Quantity",
      value: "4.000",
      reason: "SYN spares",
    },
  ];
  i.instances[0].facts.count = "3";
  let result = evaluate(d, i);
  const line = result.lines.find((l) => l.target === base.target)!;
  assert.equal(line.line.quantity, "4.000");
  assert.equal(result.ready, false);
  assert.equal(
    result.explanation?.lines.find((l) => l.target === base.target)
      ?.base_quantity,
    "3.000",
  );
  assert.equal(
    result.explanation?.lines.find((l) => l.target === base.target)?.state,
    "NeedsReview",
  );
  i.overrides[0].basis_hash = line.basis_hash;
  assert.equal(evaluate(d, i).ready, true);
  i.overrides = [];
  result = evaluate(d, i);
  assert.equal(
    result.lines.find((l) => l.target === base.target)?.line.quantity,
    "3.000",
  );
  const { result_hash, ...body } = result;
  assert.equal(result_hash, hash(body));
});

test("suppressed and conflicting lines stay available to explanations without entering native totals", () => {
  const d = designDefinition(),
    i = cpqInput();
  const l = evaluate(d, i).lines.find((l) => l.line.category === "Product")!;
  i.overrides = [
    {
      target: l.target,
      basis_hash: l.basis_hash,
      kind: "Suppress",
      value: null,
      reason: "SYN excluded",
    },
  ];
  const suppressed = evaluate(d, i);
  assert.equal(suppressed.lines.length, 0);
  assert.equal(suppressed.explanation?.lines[0].state, "Excluded");
  i.overrides = [];
  d.parts[0].resolver = "PRIORITY";
  d.rules.push({ ...d.rules[0], key: "tie" });
  const conflict = evaluate(d, i);
  assert.equal(conflict.ready, false);
  assert.equal(conflict.explanation?.lines[0].state, "Conflict");
  assert.equal(conflict.explanation?.lines[0].contributions.length, 2);
});

test("shared capacity adds demand across systems and never treats unknown capacity as zero", () => {
  const d = designDefinition(),
    i = cpqInput();
  d.facts.push(
    {
      key: "controller",
      label: "Controller",
      type: "Text",
      unit: "reference",
      required: true,
      choices: [],
    },
    {
      key: "outputs",
      label: "Outputs",
      type: "Integer",
      unit: "each",
      required: true,
      choices: [],
    },
  );
  d.design!.shared_capacity = [
    {
      key: "shared",
      label: "Controller capacity",
      group_fact: "controller",
      demand_fact: "count",
      capacity_fact: "outputs",
      message: "Check shared controller outputs.",
    },
  ];
  Object.assign(i.instances[0].facts, {
    controller: "CP-01",
    outputs: "8",
    count: "4",
  });
  i.instances.push({
    ...structuredClone(i.instances[0]),
    id: "c0870000-0000-4000-8000-000000000002",
  });
  assert.equal(
    evaluate(definition(d), i).explanation?.capacity[0].state,
    "Ready",
  );
  i.instances[1].facts.count = "5";
  assert(
    evaluate(definition(d), i).diagnostics.some(
      (x) => x.code === "SharedCapacityExceeded",
    ),
  );
  i.instances[1].facts.outputs = null;
  assert.equal(
    evaluate(definition(d), i).explanation?.capacity[0].state,
    "Unknown",
  );
});

test("decision table coverage catches exact numeric boundary overlaps and gaps; priority resolves only an unambiguous winner", () => {
  const d = designDefinition();
  d.design!.decision_tables = [
    {
      key: "counts",
      label: "Counts",
      hit_policy: "UNIQUE",
      required: true,
      columns: ["count"],
      rows: [
        {
          key: "low",
          when: { op: "LTE", fact: "count", value: "5" },
          rules: ["sensors"],
          priority: 1,
        },
        {
          key: "high",
          when: { op: "GTE", fact: "count", value: "5" },
          rules: ["sensors"],
          priority: 2,
        },
      ],
    },
  ];
  assert(
    tableCoverage(d)[0].issues.some(
      (x) => x.state === "Conflict" && x.facts.count === "5",
    ),
  );
  d.design!.decision_tables[0].hit_policy = "PRIORITY";
  assert.deepEqual(tableCoverage(d)[0].issues, []);
  const i = cpqInput();
  i.instances[0].facts.count = "5";
  assert.deepEqual(evaluate(d, i).explanation?.tables[0].selected, ["high"]);
  d.design!.decision_tables[0].rows[1].when = {
    op: "GT",
    fact: "count",
    value: "6",
  };
  assert(tableCoverage(d)[0].issues.some((x) => x.state === "Gap"));
});

test("source-bound values reject browser edits and are taken only from the selected discovery", () => {
  const d = designDefinition(),
    i = cpqInput();
  d.facts[0].binding = { question_id: "fixture-count" };
  const discovery = {
    answers: [
      {
        question_id: "fixture-count",
        state: "Confirmed",
        value: 2,
        source: "SYN",
      },
    ],
  } as never;
  assert.equal(boundInput(d, i, discovery).instances[0].facts.count, "2");
  i.instances[0].facts.count = "3";
  assert.throws(() => boundInput(d, i, discovery), {
    code: "CpqSourceFactChanged",
  });
});

test("shared parts resolve once per group, configuration freight once, and missing groups block", () => {
  const d = designDefinition(),
    i = cpqInput();
  d.facts.push({
    key: "panel",
    label: "Panel",
    type: "Text",
    unit: "reference",
    required: false,
    choices: [],
  });
  i.instances[0].facts.panel = "CP-01";
  i.instances.push({
    ...structuredClone(i.instances[0]),
    id: "c0870000-0000-4000-8000-000000000002",
  });
  d.parts.push(
    {
      ...d.parts[0],
      key: "shared",
      scope: { kind: "Shared", group_fact: "panel" },
    },
    {
      ...d.parts[0],
      key: "freight",
      category: "Freight",
      scope: { kind: "Configuration", group_fact: null },
    },
  );
  d.rules.push(
    {
      ...d.rules[0],
      key: "shared_rule",
      part: "shared",
      quantity: "1",
      when: { op: "ALWAYS" },
    },
    {
      ...d.rules[0],
      key: "freight_rule",
      part: "freight",
      quantity: "1",
      when: { op: "ALWAYS" },
    },
  );
  const valid = definition(d),
    result = evaluate(valid, i);
  assert.equal(
    result.lines.filter((l) => l.target.includes(":shared:")).length,
    1,
  );
  assert.equal(
    result.lines.filter((l) => l.target.includes(":freight:")).length,
    1,
  );
  assert.equal(
    result.explanation?.instances.filter((x) => x.kind === "Shared").length,
    1,
  );
  const reordered = evaluate(valid, {
    ...i,
    instances: [...i.instances].reverse(),
  });
  assert.deepEqual(reordered.lines, result.lines);
  assert.deepEqual(reordered.totals, result.totals);
  i.instances[1].facts.panel = null;
  assert(
    evaluate(valid, i).diagnostics.some(
      (d) => d.code === "SharedGroupingUnknown",
    ),
  );
});

test("milestone dates stay unresolved and unknown predicates block handover", () => {
  const d = designDefinition(),
    i = cpqInput();
  d.design!.milestones = [
    {
      key: "commission",
      label: "Commissioning",
      when: { op: "GT", fact: "count", value: "0" },
      anchor: "Installation complete",
      offset_days: 2,
      calendar: "BusinessDays",
    },
  ];
  const valid = definition(d),
    r = evaluate(valid, i);
  assert.equal(r.explanation?.milestones[0].date, null);
  assert.equal(r.explanation?.milestones[0].state, "Proposed");
  i.instances[0].facts.count = null;
  assert(
    evaluate(valid, i).diagnostics.some((x) => x.code === "MilestoneUnknown"),
  );
});

test("price evidence verifies frozen FX conversion; margin adjustments carry approval readiness", () => {
  const d = designDefinition(),
    i = cpqInput();
  d.parts[0].price_context = {
    book: "SYN",
    policy: "SYN frozen conversion",
    source_currency: "EUR",
    currency_per_aud: "0.5",
    recorded_at: "2026-01-01T00:00:00Z",
  };
  d.parts[0].tiers = d.parts[0].tiers.map((t) => ({
    ...t,
    source_unit_cost: String(Number(t.unit_cost) / 2),
  }));
  const valid = definition(d);
  assert.deepEqual(definition(valid), valid);
  i.pricing = { mode: "Margin", percent: "20" };
  const result = evaluate(valid, i);
  assert.equal(result.explanation?.readiness.price, "RequiresApproval");
  assert.equal(result.explanation?.readiness.adoption, "Ready");
  d.parts[0].tiers[0].source_unit_cost = "1";
  assert.throws(() => definition(d));
});

test("decision-table integer ranges omit unreachable fractions and out-of-range values; IN stays three valued", () => {
  const d = designDefinition();
  d.facts[0].type = "Integer";
  d.facts[0].minimum = "1";
  d.facts[0].maximum = "2";
  d.design!.decision_tables = [
    {
      key: "whole",
      label: "Whole",
      hit_policy: "UNIQUE",
      required: true,
      columns: ["count"],
      rows: [
        {
          key: "one",
          when: { op: "EQ", fact: "count", value: "1" },
          rules: ["sensors"],
          priority: 1,
        },
        {
          key: "two",
          when: { op: "EQ", fact: "count", value: "2" },
          rules: ["sensors"],
          priority: 1,
        },
      ],
    },
  ];
  assert.deepEqual(tableCoverage(definition(d))[0].issues, []);
  const facts = definition(d).facts;
  const choice = facts.find((f) => f.type === "Choice");
  if (choice) {
    const c = condition(
      { op: "IN", fact: choice.key, values: [choice.choices[0]] },
      facts,
    );
    assert.equal(evaluateCondition(c, { [choice.key]: null }, facts), null);
    assert.equal(
      evaluateCondition(c, { [choice.key]: choice.choices[0] }, facts),
      true,
    );
  }
});

test("explicit synthetic screen authoring template passes its independent fixture", () => {
  assert(testDefinition(definition(screenDefinition())).every((t) => t.passed));
});
