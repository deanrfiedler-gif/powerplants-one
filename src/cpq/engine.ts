import { sourcePrice } from "../estimating/sources/price";
import { AppError } from "../platform/errors";
import { calculate, decimal, halfUp } from "../estimating/math";
import {
  CceError,
  compileFormula,
  evaluateFormula,
  Fraction,
} from "./expression";
import { hash, lineIdentity } from "./hash";
import {
  conditionEvidence,
  prepareDesign,
  price,
  tableCoverage,
} from "./design-runtime";
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
  notApplicable: string[] = [],
): Truth {
  if (c.op === "ALWAYS") return true;
  if (c.op === "NOT") {
    const v = evaluateCondition(c.item, values, facts, notApplicable);
    return v === null ? null : !v;
  }
  if (c.op === "ALL" || c.op === "ANY") {
    const v = c.items.map((i) =>
      evaluateCondition(i, values, facts, notApplicable),
    );
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
  if (c.op === "KNOWN")
    return (
      value !== null && value !== undefined && !notApplicable.includes(c.fact)
    );
  if (c.op === "NOT_APPLICABLE") return notApplicable.includes(c.fact);
  if (c.op === "IN")
    return value === null || value === undefined
      ? null
      : c.values.includes(value);
  if (!("value" in c))
    throw new CceError("CONDITION_INVALID", "A comparison requires a literal");
  if (value === null || value === undefined) return null;
  const f = facts.find((f) => f.key === c.fact)!;
  const comparison = ["Decimal", "Integer"].includes(f.type)
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
export function evaluate(
  d: Definition,
  input: CalculationInput,
  onTarget?: (target: import("./rebase-model").RebaseTarget) => void,
): Calculation {
  const diagnostics: Diagnostic[] = [],
    lines: ResultLine[] = [],
    seenOverrides = new Set<string>();
  const design =
    d.schema_version === 3 ? prepareDesign(d, input, diagnostics) : null;
  const add = (
    code: string,
    message: string,
    instance_id: string | null = null,
    target: string | null = null,
  ) => diagnostics.push({ code, message, instance_id, target });
  if (
    d.schema_version === 4 &&
    (input.pricing_date < "0001-01-01" || input.pricing_date > "9998-12-31")
  )
    add(
      "CpqCostPricingDateRange",
      "Governed pricing dates must be between 0001-01-01 and 9998-12-31, matching the native estimate source-binding contract.",
    );
  if (d.schema_version === 4)
    for (const part of d.parts) {
      const content = part.cost_source?.content;
      if (
        content &&
        (content.effective_from < "0001-01-01" ||
          (content.valid_until !== null && content.valid_until < "0001-01-01"))
      )
        add(
          "CpqCostSourceDateRange",
          "Governed source validity dates must use year 0001 or later, matching native PostgreSQL date storage.",
          null,
          part.key,
        );
    }
  const symbols = new Set(
    d.facts
      .filter((f) => ["Decimal", "Integer"].includes(f.type))
      .map((f) => f.key),
  );
  const compiled = new Map(
    d.rules.map((r) => [
      r.key,
      compileFormula(
        r.quantity,
        new Set([
          ...symbols,
          ...(r.parameters ?? []).map((p) => p.key),
          ...(r.phase === "Labour"
            ? d.parts
                .filter((p) => p.category !== "Labour")
                .map((p) => `bom_${p.key}`)
            : []),
        ]),
        d.schema_version === 3,
      ),
    ]),
  );
  const contexts: {
    instance: import("./types").Instance;
    kind: "System" | "Shared" | "Configuration";
    group_fact: string | null;
  }[] = input.instances.map((instance) => ({
    instance,
    kind: "System",
    group_fact: null,
  }));
  if (design) {
    const specs = [
      ...new Set(
        d.parts
          .filter((p) => p.scope && p.scope.kind !== "System")
          .map((p) => JSON.stringify(p.scope)),
      ),
    ].map((s) => JSON.parse(s) as NonNullable<import("./types").Part["scope"]>);
    for (const spec of specs) {
      if (spec.kind === "Shared")
        for (const i of input.instances) {
          if (
            typeof i.facts[spec.group_fact!] !== "string" ||
            !String(i.facts[spec.group_fact!]).trim()
          )
            add(
              "SharedGroupingUnknown",
              "Choose the shared group before calculating shared equipment.",
              i.id,
              spec.group_fact,
            );
        }
      const groups =
        spec.kind === "Configuration"
          ? ["configuration"]
          : [
              ...new Set(
                input.instances
                  .map((i) => i.facts[spec.group_fact!])
                  .filter((v): v is string => typeof v === "string" && !!v),
              ),
            ].sort();
      for (const group of groups) {
        if (contexts.length >= 120) {
          add(
            "ScopeLimit",
            "Split this configuration: more than 100 shared or configuration output groups.",
          );
          break;
        }
        const members =
          spec.kind === "Configuration"
            ? input.instances
            : input.instances.filter(
                (i) => i.facts[spec.group_fact!] === group,
              );
        const id = lineIdentity(
          `cpq-scope:${spec.kind}:${spec.group_fact ?? ""}:${group}`,
        );
        if (input.instances.some((i) => i.id === id)) {
          add(
            "InstanceIdentityConflict",
            "A system identity collides with a shared output identity.",
          );
          continue;
        }
        const instance = {
          id,
          not_applicable: d.facts
            .filter((f) =>
              members.every((i) => i.not_applicable?.includes(f.key)),
            )
            .map((f) => f.key),
          label:
            spec.kind === "Configuration"
              ? "Configuration-wide"
              : `Shared · ${group}`,
          facts: Object.fromEntries(
            d.facts.map((f) => {
              const values = members.map((i) => i.facts[f.key] ?? null);
              return [
                f.key,
                values.every((v) => v === values[0]) ? values[0] : null,
              ];
            }),
          ),
        };
        contexts.push({
          instance,
          kind: spec.kind,
          group_fact: spec.group_fact,
        });
        design.evidence.instances.push({
          id,
          label: instance.label,
          kind: spec.kind,
        });
      }
    }
  }
  for (const context of contexts.sort((a, b) =>
    a.instance.id < b.instance.id ? -1 : a.instance.id > b.instance.id ? 1 : 0,
  )) {
    const { instance } = context;
    const inScope = (part: import("./types").Part) =>
      !design ||
      ((part.scope?.kind ?? "System") === context.kind &&
        (part.scope?.group_fact ?? null) === context.group_fact);
    for (const f of d.facts)
      if (
        context.kind === "System" &&
        f.required &&
        instance.facts[f.key] === null
      )
        add("FactRequired", `Record ${f.label} (${f.unit}).`, instance.id);
    for (const c of context.kind === "System" ? d.constraints : []) {
      const applies = evaluateCondition(
          c.when,
          instance.facts,
          d.facts,
          instance.not_applicable,
        ),
        valid = evaluateCondition(
          c.require,
          instance.facts,
          d.facts,
          instance.not_applicable,
        );
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
        .filter(
          (r) =>
            r.phase === phase &&
            inScope(d.parts.find((p) => p.key === r.part)!),
        )
        .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))) {
        const applies = evaluateCondition(
          rule.when,
          instance.facts,
          d.facts,
          instance.not_applicable,
        );
        const trace = design
          ? ({
              instance_id: instance.id,
              rule: rule.key,
              condition: conditionEvidence(
                rule.when,
                instance.facts,
                d,
                instance.not_applicable,
              ),
              outcome:
                applies === null
                  ? ("Unknown" as const)
                  : applies
                    ? ("Applied" as const)
                    : ("NotApplicable" as const),
            } as import("./types").RuleTrace)
          : null;
        if (trace) design!.evidence.rules.push(trace);
        if (
          design &&
          context.kind === "System" &&
          !design.enabled.get(instance.id)!.has(rule.key)
        ) {
          trace!.outcome = "TableExcluded";
          continue;
        }
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
        for (const parameter of rule.parameters ?? [])
          values.set(parameter.key, parameter.value);
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
          if (result.numerator === 0n) {
            if (trace) trace.outcome = "Zero";
            continue;
          }
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
          if (trace) {
            trace.outcome = "Error";
            trace.error =
              e instanceof Error ? e.message : "Calculation failed.";
          }
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
        const detail: import("./types").LineDetail | null = design
          ? {
              target,
              instance_id: instance.id,
              part: part.key,
              description: part.description,
              unit: part.unit,
              resolver: part.resolver,
              contributions,
              selected_rules: [],
              basis_hash: hash({ target, part, contributions }),
              base_quantity: null,
              effective_quantity: null,
              state: "Incomplete",
              overrides: input.overrides.filter((o) => o.target === target),
              source: part.source,
              effective_from: part.effective_from,
              effective_to: part.effective_to,
              price_tier: null,
              unit_sell: null,
            }
          : null;
        if (detail) design!.evidence.lines.push(detail);
        let chosen = contributions;
        if (part.resolver === "UNIQUE" && contributions.length !== 1) {
          if (detail) detail.state = "Conflict";
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
            if (detail) detail.state = "Conflict";
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
        onTarget?.({
          target,
          basis_hash,
          category: part.category,
          unit: part.unit,
        });
        if (detail) {
          detail.selected_rules = (
            part.resolver === "MAX"
              ? chosen.filter(
                  (c) =>
                    new Fraction(
                      BigInt(c.exact.numerator),
                      BigInt(c.exact.denominator),
                    ).subtract(quantity).numerator === 0n,
                )
              : chosen
          ).map((c) => c.rule);
          detail.base_quantity = decimal(
            halfUp(quantity.numerator * 1000n, quantity.denominator),
            3,
          );
        }
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
            if (detail) detail.state = "NeedsReview";
            else continue;
          }
          if (o.kind === "Suppress") suppressed = true;
          if (o.kind === "Quantity") quantity = Fraction.fromDecimal(o.value!);
          if (o.kind === "SellPrice") sellOverride = o.value;
        }
        if (suppressed) {
          if (detail) {
            detail.state =
              detail.state === "NeedsReview" ? "NeedsReview" : "Excluded";
            detail.effective_quantity = "0.000";
          }
          continue;
        }
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
        if (detail) detail.effective_quantity = resolvedQuantity;
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
          input.pricing_date > part.effective_to ||
          (part.price_context &&
            input.pricing_date < part.price_context.recorded_at.slice(0, 10))
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
        let unit_cost = tier.unit_cost;
        let cost_source: import("./types").CostSelection | undefined;
        if (d.schema_version === 4 && part.cost_source) {
          const ref = part.cost_source;
          try {
            const selected = sourcePrice(
              ref.content,
              resolvedQuantity,
              part.unit,
              input.pricing_date,
            );
            unit_cost = selected.unit_cost;
            cost_source = {
              line_id: lineIdentity(target),
              source_id: ref.source_id,
              source_revision_id: ref.revision_id,
              review_event_id: ref.review_event_id,
              pricing_date: input.pricing_date,
              tier_minimum_quantity: selected.minimum_quantity,
              unit_cost,
              validity_end: selected.validity_end,
              validity_warning: selected.validity_warning,
            };
          } catch (e) {
            if (!(e instanceof AppError)) throw e;
            add(e.code, e.message, instance.id, target);
            continue;
          }
        }
        const unit_sell =
          sellOverride ??
          (design
            ? price(tier.unit_cost, tier.unit_sell, design.evidence.pricing)
            : tier.unit_sell);
        if (detail) {
          detail.price_tier = tier;
          detail.unit_sell = unit_sell;
        }
        if (
          Fraction.fromDecimal(unit_sell).subtract(
            Fraction.fromDecimal(unit_cost),
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
        if (detail && detail.state !== "NeedsReview") detail.state = "Ready";
        lines.push({
          target,
          basis_hash,
          contributions,
          overrides,
          ...(cost_source ? { cost_source } : {}),
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
            unit_cost,
            unit_sell,
            source: cost_source
              ? `${part.cost_source!.reference} / r${part.cost_source!.revision} / ${part.cost_source!.content.evidence_reference}`
              : part.source,
            effective_date: cost_source
              ? part.cost_source!.content.source_date
              : part.effective_from,
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
  if (design)
    design.evidence.readiness = {
      configuration: diagnostics.length ? "NeedsAttention" : "Complete",
      price: diagnostics.length
        ? "Indicative"
        : input.pricing || input.overrides.some((o) => o.kind === "SellPrice")
          ? "RequiresApproval"
          : "Complete",
      adoption: diagnostics.length ? "Blocked" : "Ready",
    };
  const body = {
    engine:
      d.schema_version === 4
        ? ("PPO-CPQ-4" as const)
        : d.schema_version === 3
          ? ("PPO-CPQ-3" as const)
          : ("PPO-CPQ-1" as const),
    ready: diagnostics.length === 0,
    lines,
    diagnostics,
    totals: calculate(lines.map((x) => x.line)),
    input_hash: hash(input),
    definition_hash: hash(d),
    ...(design ? { explanation: design.evidence } : {}),
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
      ...(d.schema_version === 3 ? { result, coverage: tableCoverage(d) } : {}),
    };
  });
}
