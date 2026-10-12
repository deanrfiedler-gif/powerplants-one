import assert from "node:assert/strict";
import { test } from "node:test";
import { cpqDefinition, cpqInput } from "../helpers/cpq";
import {
  definition,
  calculationInput,
  condition,
} from "../../src/cpq/validation";
import {
  evaluate,
  evaluateCondition,
  testDefinition,
} from "../../src/cpq/engine";
import { compileFormula, evaluateFormula } from "../../src/cpq/expression";
import { calculateIsolated, testIsolated } from "../../src/cpq/runner";
import { hash } from "../../src/cpq/hash";

test("quantities resolve exactly before rounding and labour keeps material units separate", () => {
  const d = definition(cpqDefinition()),
    i = cpqInput();
  d.rules[0].quantity = "1 / 3";
  d.rules.push(
    { ...d.rules[0], key: "third_two" },
    { ...d.rules[0], key: "third_three" },
  );
  const r = evaluate(d, i);
  assert.equal(r.ready, true);
  assert.equal(
    r.lines.find((l) => l.line.category === "Product")?.line.quantity,
    "1.000",
  );
  assert.equal(
    r.lines.find((l) => l.line.category === "Labour")?.line.quantity,
    "0.500",
  );
  assert.equal(r.lines[0].contributions[0].exact.denominator, "3");
  assert.throws(() =>
    definition({
      ...cpqDefinition(),
      rules: cpqDefinition().rules.map((r) =>
        r.phase === "Labour" ? { ...r, quantity: "bom_quantity" } : r,
      ),
    }),
  );
});

test("CPQ exact material/labour costs, explanations and deterministic isolated execution", async () => {
  const d = definition(cpqDefinition()),
    i = calculationInput(cpqInput(), d.facts),
    r = evaluate(d, i);
  assert.equal(r.ready, true);
  assert.equal(r.totals.cost, "70.00");
  assert.equal(r.totals.sell, "105.00");
  assert.equal(r.lines[0].contributions[0].facts.count, "2");
  assert.deepEqual(evaluate(d, i), r);
  assert.deepEqual(await calculateIsolated(d, i), r);
  assert.equal((await testIsolated(d))[0].passed, true);
  const { result_hash, ...body } = r;
  assert.equal(result_hash, hash(body));
});
test("typed UNKNOWN uses three-valued ALL ANY and NOT", () => {
  const d = definition(cpqDefinition()),
    i = cpqInput();
  i.instances[0].facts.count = null;
  const unknown = { op: "GT" as const, fact: "count", value: "0" },
    yes = { op: "EQ" as const, fact: "install", value: true },
    no = { ...yes, value: false };
  assert.equal(
    evaluateCondition(
      { op: "NOT", item: unknown },
      i.instances[0].facts,
      d.facts,
    ),
    null,
  );
  assert.equal(
    evaluateCondition(
      { op: "ALL", items: [unknown, no] },
      i.instances[0].facts,
      d.facts,
    ),
    false,
  );
  assert.equal(
    evaluateCondition(
      { op: "ANY", items: [unknown, yes] },
      i.instances[0].facts,
      d.facts,
    ),
    true,
  );
  const r = evaluate(d, i);
  assert.equal(r.ready, false);
  assert(r.diagnostics.some((x) => x.code === "FactRequired"));
  assert(r.diagnostics.some((x) => x.code === "RuleUnknown"));
});
test("compatibility, price validity and missing tiers block adoption", () => {
  const d = definition(cpqDefinition()),
    i = cpqInput();
  i.instances[0].facts.count = "21";
  assert(
    evaluate(d, i).diagnostics.some((x) => x.code === "ConstraintConflict"),
  );
  i.pricing_date = "2027-01-01";
  assert(evaluate(d, i).diagnostics.some((x) => x.code === "PriceExpired"));
  i.pricing_date = "2026-10-12";
  i.instances[0].facts.count = "0.100";
  d.parts[0].tiers[0].minimum = "1.000";
  assert(evaluate(d, i).diagnostics.some((x) => x.code === "PriceMissing"));
});
test("resolvers reject ambiguity and apply sum, max and quantity price breaks", () => {
  const d = definition(cpqDefinition()),
    i = cpqInput();
  d.rules.push({ ...d.rules[0], key: "extra", quantity: "10" });
  let r = evaluate(d, i);
  assert.equal(
    r.lines.find((x) => x.line.category === "Product")?.line.quantity,
    "12.000",
  );
  assert.equal(
    r.lines.find((x) => x.line.category === "Product")?.line.unit_cost,
    "9.00",
  );
  d.parts[0].resolver = "MAX";
  r = evaluate(d, i);
  assert.equal(
    r.lines.find((x) => x.line.category === "Product")?.line.quantity,
    "10.000",
  );
  d.parts[0].resolver = "UNIQUE";
  assert(
    evaluate(d, i).diagnostics.some((x) => x.code === "ContributionConflict"),
  );
  d.parts[0].resolver = "PRIORITY";
  assert(evaluate(d, i).diagnostics.some((x) => x.code === "PriorityConflict"));
  d.rules[2].priority = 2;
  assert.equal(
    evaluate(d, i).lines.find((x) => x.line.category === "Product")?.line
      .quantity,
    "10.000",
  );
});
test("overrides retain reasons and require exact generated basis; labour sees resolved quantity", () => {
  const d = definition(cpqDefinition()),
    i = cpqInput(),
    line = evaluate(d, i).lines.find((l) => l.line.category === "Product")!;
  i.overrides = [
    {
      target: line.target,
      basis_hash: line.basis_hash,
      kind: "Quantity",
      value: "4.000",
      reason: "SYN include spares",
    },
  ];
  let r = evaluate(d, i);
  assert.equal(r.ready, true);
  assert.equal(
    r.lines.find((l) => l.line.category === "Labour")?.line.quantity,
    "2.000",
  );
  i.instances[0].facts.count = "3";
  r = evaluate(d, i);
  assert(r.diagnostics.some((x) => x.code === "OverrideRebaseRequired"));
  i.instances[0].facts.count = "0";
  assert(evaluate(d, i).diagnostics.some((x) => x.code === "OverrideOrphaned"));
});
test("below-cost sell overrides and oversize receiving are explicit blockers", () => {
  const d = definition(cpqDefinition()),
    i = cpqInput(),
    l = evaluate(d, i).lines[0];
  i.overrides = [
    {
      target: l.target,
      basis_hash: l.basis_hash,
      kind: "SellPrice",
      value: "0.00",
      reason: "SYN invalid policy exception",
    },
  ];
  assert(evaluate(d, i).diagnostics.some((x) => x.code === "BelowCost"));
  i.overrides = [];
  d.parts[0].tiers[0].unit_cost = "0.01";
  d.rules[0].quantity = "100000 + 1";
  assert(evaluate(d, i).diagnostics.some((x) => x.code === "QuantityLimit"));
});
test("fixtures compare independent expectations and catch wrong totals", () => {
  const d = definition(cpqDefinition());
  d.fixtures[0].expected.sell = "0.00";
  assert.equal(testDefinition(d)[0].passed, false);
});
test("strict semantic validation rejects unknown keys, duplicates, untyped facts and invalid dates", () => {
  for (const mutation of [
    (d: ReturnType<typeof cpqDefinition>) => d.rules.push(d.rules[0]),
    (d: ReturnType<typeof cpqDefinition>) => {
      d.parts[0].effective_to = "2026-02-30";
    },
    (d: ReturnType<typeof cpqDefinition>) => {
      d.rules[0].part = "missing";
    },
    (d: ReturnType<typeof cpqDefinition>) => {
      d.rules[0].quantity = "install * 2";
    },
    (d: ReturnType<typeof cpqDefinition>) => {
      d.facts[0].key = "constructor";
    },
  ]) {
    const d = cpqDefinition();
    mutation(d);
    assert.throws(() => definition(d));
  }
  const d = definition(cpqDefinition());
  assert.throws(() => definition({ ...d, secret: "unexpected" }));
  assert.throws(() =>
    calculationInput(
      {
        ...cpqInput(),
        instances: [
          {
            id: cpqInput().instances[0].id,
            label: "SYN",
            facts: { count: 2, install: true },
          },
        ],
      },
      d.facts,
    ),
  );
  assert.throws(() =>
    condition({ op: "GT", fact: "install", value: true }, d.facts),
  );
});
test("arithmetic accepts only registered scalar names and bounded four-operator expressions", () => {
  for (const value of [
    "process.exit()",
    "count[0]",
    "Math.ceil(count)",
    "count ** 2",
    "(()=>1)()",
    "missing + 1",
    "(",
  ])
    assert.throws(() => compileFormula(value, new Set(["count"])));
  const compiled = compileFormula("(count + 1) / 3", new Set(["count"]));
  assert.equal(
    evaluateFormula(compiled, new Map([["count", "2"]])).exactDecimal(),
    "1",
  );
  assert.throws(() =>
    evaluateFormula(compileFormula("1 / 0", new Set()), new Map()),
  );
  assert.throws(() => compileFormula("1+".repeat(300) + "1", new Set()));
});
