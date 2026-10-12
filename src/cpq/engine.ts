import { calculate, decimal, halfUp } from "../estimating/math";
import {
  CceError,
  compileFormula,
  evaluateFormula,
  Fraction,
} from "./expression";
import { hash, lineIdentity } from "./hash";
import type {
  Calculation,
  CalculationInput,
  Condition,
  Contribution,
  Definition,
  Diagnostic,
  Fact,
  ResultLine,
  Scalar,
} from "./types";

type Truth = boolean | null;
export function evaluateCondition(
  c: Condition,
  values: Record<string, Scalar>,
  facts: Fact[],
): Truth {
  if (c.op === "NOT") {
    const v = evaluateCondition(c.item, values, facts);
    return v === null ? null : !v;
  }
  if (c.op === "ALL" || c.op === "ANY") {
    const v = c.items.map((i) => evaluateCondition(i, values, facts));
    return c.op === "ALL"
      ? v.includes(false)
        ? false
        : v.includes(null)
          ? null
          : true
      : v.includes(true)
        ? true
        : v.includes(null)
          ? null
          : false;
  }
  if (!("fact" in c))
    throw new CceError("CONDITION_INVALID", "Unsupported condition");
  const value = values[c.fact];
  if (value === null || value === undefined) return null;
  const f = facts.find((f) => f.key === c.fact)!;
  const comparison =
    f.type === "Decimal"
      ? Fraction.fromDecimal(String(value)).subtract(
          Fraction.fromDecimal(String(c.value)),
        ).numerator
      : null;
  switch (c.op) {
    case "EQ":
      return comparison === null ? value === c.value : comparison === 0n;
    case "NE":
      return comparison === null ? value !== c.value : comparison !== 0n;
    case "GT":
      return comparison! > 0n;
    case "GTE":
      return comparison! >= 0n;
    case "LT":
      return comparison! < 0n;
    case "LTE":
      return comparison! <= 0n;
  }
}

// Pure evaluation over already validated, frozen inputs. No external lookups.
export function evaluate(d: Definition, input: CalculationInput): Calculation {
  const diagnostics: Diagnostic[] = [],
    lines: ResultLine[] = [],
    seenOverrides = new Set<string>();
  const add = (
    code: string,
    message: string,
    instance_id: string | null = null,
    target: string | null = null,
  ) => diagnostics.push({ code, message, instance_id, target });
  const symbols = new Set(
    d.facts.filter((f) => f.type === "Decimal").map((f) => f.key),
  );
  const compiled = new Map(
    d.rules.map((r) => [
      r.key,
      compileFormula(
        r.quantity,
        new Set([
          ...symbols,
          ...(r.phase === "Labour"
            ? d.parts
                .filter((p) => p.category !== "Labour")
                .map((p) => `bom_${p.key}`)
            : []),
        ]),
      ),
    ]),
  );
  for (const instance of [...input.instances].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  )) {
    for (const f of d.facts)
      if (f.required && instance.facts[f.key] === null)
        add("FactRequired", `Record ${f.label} (${f.unit}).`, instance.id);
    for (const c of d.constraints) {
      const applies = evaluateCondition(c.when, instance.facts, d.facts),
        valid = evaluateCondition(c.require, instance.facts, d.facts);
      if (applies === null || (applies === true && valid === null))
        add("ConstraintUnknown", c.message, instance.id, c.key);
      else if (applies === true && !valid)
        add("ConstraintConflict", c.message, instance.id, c.key);
    }
    const bom = new Map(
      d.parts
        .filter((p) => p.category !== "Labour")
        .map((p) => [`bom_${p.key}`, "0.000"]),
    );
    for (const phase of ["Materials", "Labour"] as const) {
      const groups = new Map<string, Contribution[]>();
      for (const rule of d.rules
        .filter((r) => r.phase === phase)
        .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))) {
        const applies = evaluateCondition(rule.when, instance.facts, d.facts);
        if (applies === null) {
          add(
            "RuleUnknown",
            `Complete the facts for ${rule.description}.`,
            instance.id,
            rule.key,
          );
          continue;
        }
        if (!applies) continue;
        const formula = compiled.get(rule.key)!,
          values = new Map<string, string>();
        for (const k of formula.dependencies) {
          if (k.startsWith("bom_")) values.set(k, bom.get(k)!);
          else if (typeof instance.facts[k] === "string")
            values.set(k, instance.facts[k] as string);
        }
        try {
          const result = evaluateFormula(formula, values);
          if (result.numerator < 0n)
            throw new CceError(
              "NegativeQuantity",
              "A generated quantity cannot be negative.",
            );
          if (result.numerator === 0n) continue;
          const quantity = decimal(
            halfUp(result.numerator * 1000n, result.denominator),
            3,
          );
          if (result.numerator > 100000n * result.denominator)
            throw new CceError(
              "QuantityLimit",
              "Quantity must be representable at the native three-place scale and at most 100,000.",
            );
          const contribution = {
            rule: rule.key,
            quantity,
            exact: {
              numerator: result.numerator.toString(),
              denominator: result.denominator.toString(),
            },
            priority: rule.priority,
            formula: rule.quantity,
            facts: Object.fromEntries(values),
          };
          groups.set(rule.part, [
            ...(groups.get(rule.part) ?? []),
            contribution,
          ]);
        } catch (e) {
          add(
            e instanceof CceError ? e.code : "FormulaFailure",
            e instanceof Error ? e.message : "Calculation failed.",
            instance.id,
            rule.key,
          );
        }
      }
      for (const [partKey, contributions] of [...groups].sort(([a], [b]) =>
        a < b ? -1 : a > b ? 1 : 0,
      )) {
        const part = d.parts.find((p) => p.key === partKey)!,
          target = `${instance.id}:${partKey}:${part.unit}`;
        let chosen = contributions;
        if (part.resolver === "UNIQUE" && contributions.length !== 1) {
          add(
            "ContributionConflict",
            `More than one rule supplied ${part.description}.`,
            instance.id,
            target,
          );
          continue;
        }
        if (part.resolver === "PRIORITY") {
          const highest = Math.max(...contributions.map((c) => c.priority));
          chosen = contributions.filter((c) => c.priority === highest);
          if (chosen.length !== 1) {
            add(
              "PriorityConflict",
              `Equal priorities supplied ${part.description}.`,
              instance.id,
              target,
            );
            continue;
          }
        }
        let quantity =
          part.resolver === "MAX"
            ? chosen
                .map(
                  (c) =>
                    new Fraction(
                      BigInt(c.exact.numerator),
                      BigInt(c.exact.denominator),
                    ),
                )
                .reduce((a, b) => (a.subtract(b).numerator >= 0n ? a : b))
            : chosen.reduce(
                (a, c) =>
                  a.add(
                    new Fraction(
                      BigInt(c.exact.numerator),
                      BigInt(c.exact.denominator),
                    ),
                  ),
                new Fraction(0n),
              );
        const basis_hash = hash({ target, part, contributions }),
          overrides = input.overrides.filter((o) => o.target === target);
        let suppressed = false,
          sellOverride: string | null = null;
        for (const o of overrides) {
          seenOverrides.add(`${o.target}:${o.kind}`);
          if (o.basis_hash !== basis_hash) {
            add(
              "OverrideRebaseRequired",
              "This override's generated basis changed. Review it against the new line before recalculating.",
              instance.id,
              target,
            );
            continue;
          }
          if (o.kind === "Suppress") suppressed = true;
          if (o.kind === "Quantity") quantity = Fraction.fromDecimal(o.value!);
          if (o.kind === "SellPrice") sellOverride = o.value;
        }
        if (suppressed) continue;
        if (quantity.numerator > 100000n * quantity.denominator) {
          add(
            "QuantityLimit",
            "Resolved quantity exceeds the native estimate limit.",
            instance.id,
            target,
          );
          continue;
        }
        // Quantize after resolution. Labour references each part in its own unit.
        const resolvedQuantity = decimal(
          halfUp(quantity.numerator * 1000n, quantity.denominator),
          3,
        );
        if (resolvedQuantity === "0.000") {
          add(
            "QuantityLimit",
            "Resolved quantity rounds to zero at the native scale.",
            instance.id,
            target,
          );
          continue;
        }
        quantity = Fraction.fromDecimal(resolvedQuantity);
        if (phase === "Materials") bom.set(`bom_${partKey}`, resolvedQuantity);
        if (
          input.pricing_date < part.effective_from ||
          input.pricing_date > part.effective_to
        ) {
          add(
            "PriceExpired",
            `Review the effective price for ${part.description}.`,
            instance.id,
            target,
          );
          continue;
        }
        const tier = part.tiers.findLast(
          (t) =>
            quantity.subtract(Fraction.fromDecimal(t.minimum)).numerator >= 0n,
        );
        if (!tier) {
          add(
            "PriceMissing",
            `No price break covers ${part.description}.`,
            instance.id,
            target,
          );
          continue;
        }
        const unit_sell = sellOverride ?? tier.unit_sell;
        if (
          Fraction.fromDecimal(unit_sell).subtract(
            Fraction.fromDecimal(tier.unit_cost),
          ).numerator < 0n
        ) {
          add(
            "BelowCost",
            "The native synthetic pricing policy does not allow sell below cost.",
            instance.id,
            target,
          );
          continue;
        }
        lines.push({
          target,
          basis_hash,
          contributions,
          overrides,
          line: {
            id: lineIdentity(target),
            description: part.description,
            category: part.category,
            allowance: false,
            quantity: decimal(
              halfUp(quantity.numerator * 1000n, quantity.denominator),
              3,
            ),
            unit: part.unit,
            unit_cost: tier.unit_cost,
            unit_sell,
            source: part.source,
            effective_date: part.effective_from,
          },
        });
      }
    }
  }
  for (const o of input.overrides)
    if (!seenOverrides.has(`${o.target}:${o.kind}`))
      add(
        "OverrideOrphaned",
        "The overridden target is no longer generated. Remove or explicitly remap the override.",
        null,
        o.target,
      );
  if (lines.length > 100)
    add(
      "ReceivingLineLimit",
      "The native estimate accepts at most 100 lines, including retained manual lines.",
    );
  if (!lines.length) add("NoCostLines", "No cost lines were generated.");
  const body = {
    engine: "PPO-CPQ-1" as const,
    ready: diagnostics.length === 0,
    lines,
    diagnostics,
    totals: calculate(lines.map((x) => x.line)),
    input_hash: hash(input),
    definition_hash: hash(d),
  };
  return { ...body, result_hash: hash(body) };
}
export function testDefinition(d: Definition) {
  return d.fixtures.map((f) => {
    const result = evaluate(d, f.input),
      actual = {
        ready: result.ready,
        cost: result.totals.cost,
        sell: result.totals.sell,
        diagnostic_codes: [
          ...new Set(result.diagnostics.map((d) => d.code)),
        ].sort(),
      };
    return {
      name: f.name,
      passed:
        hash(actual) ===
        hash({
          ...f.expected,
          diagnostic_codes: [...new Set(f.expected.diagnostic_codes)].sort(),
        }),
      expected: f.expected,
      actual,
      result_hash: result.result_hash,
    };
  });
}
