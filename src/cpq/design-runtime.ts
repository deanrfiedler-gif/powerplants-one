import { evaluateCondition } from "./engine";
import { Fraction } from "./expression";
import { decimal, halfUp } from "../estimating/math";
import type {
  Calculation,
  CalculationInput,
  Condition,
  ConditionEvidence,
  Definition,
  Diagnostic,
  Scalar,
  DesignContract,
} from "./types";

export function conditionEvidence(
  c: Condition,
  values: Record<string, Scalar>,
  d: Definition,
  notApplicable: string[] = [],
): ConditionEvidence {
  return {
    condition: c,
    result: evaluateCondition(c, values, d.facts, notApplicable),
    ...("fact" in c ? { actual: values[c.fact] ?? null } : {}),
    ...("items" in c
      ? {
          children: c.items.map((x) =>
            conditionEvidence(x, values, d, notApplicable),
          ),
        }
      : "item" in c
        ? { children: [conditionEvidence(c.item, values, d, notApplicable)] }
        : {}),
  };
}
export function tableMatch(
  table: DesignContract["decision_tables"][number],
  values: Record<string, Scalar>,
  d: Definition,
  notApplicable: string[] = [],
) {
  const evaluated = table.rows.map((row) => ({
    row,
    result: evaluateCondition(row.when, values, d.facts, notApplicable),
  }));
  const matches = evaluated.filter((r) => r.result === true).map((r) => r.row);
  const selected =
    table.hit_policy === "PRIORITY"
      ? matches.filter(
          (r) => r.priority === Math.max(...matches.map((r) => r.priority)),
        )
      : matches;
  const state = evaluated.some((r) => r.result === null)
    ? "Unknown"
    : selected.length > 1
      ? "Conflict"
      : selected.length === 0
        ? "Gap"
        : "Matched";
  return {
    matches: matches.map((r) => r.key),
    selected: state === "Matched" ? selected.map((r) => r.key) : [],
    state,
  } as const;
}
export function prepareDesign(
  d: Definition,
  input: CalculationInput,
  diagnostics: Diagnostic[],
) {
  const design = d.design!;
  const pricing =
    input.pricing && design.pricing.allow_override
      ? input.pricing
      : design.pricing;
  const evidence: NonNullable<Calculation["explanation"]> = {
    rules: [],
    lines: [],
    options: [],
    capacity: [],
    tables: [],
    pricing: {
      mode: pricing.mode,
      percent: pricing.percent,
      source:
        input.pricing && design.pricing.allow_override
          ? "Configuration"
          : "Release",
    },
    instances: input.instances.map((i) => ({
      id: i.id,
      label: i.label,
      kind: "System",
    })),
    milestones: [],
    readiness: {
      configuration: "NeedsAttention",
      price: "Indicative",
      adoption: "Blocked",
    },
  };
  const add = (
    code: string,
    message: string,
    instance_id: string | null = null,
    target: string | null = null,
  ) => diagnostics.push({ code, message, instance_id, target });
  if (input.pricing && !design.pricing.allow_override)
    add(
      "PricingOverrideNotAllowed",
      "This release does not permit configuration pricing adjustments.",
    );
  const enabled = new Map<string, Set<string>>();
  for (const instance of input.instances) {
    for (const m of design.milestones ?? []) {
      const applies = evaluateCondition(
        m.when,
        instance.facts,
        d.facts,
        instance.not_applicable,
      );
      if (applies !== false)
        evidence.milestones.push({
          key: m.key,
          instance_id: instance.id,
          label: m.label,
          anchor: m.anchor,
          offset_days: m.offset_days,
          calendar: m.calendar,
          date: null,
          state: applies === null ? "Unknown" : "Proposed",
        });
      if (applies === null)
        add(
          "MilestoneUnknown",
          `Complete the facts for proposed milestone ${m.label}.`,
          instance.id,
          m.key,
        );
    }
    for (const fact of d.facts) {
      const value = instance.facts[fact.key];
      if (
        ["Decimal", "Integer"].includes(fact.type) &&
        typeof value === "string"
      ) {
        const n = Fraction.fromDecimal(value);
        if (
          (fact.minimum != null &&
            n.subtract(Fraction.fromDecimal(fact.minimum)).numerator < 0n) ||
          (fact.maximum != null &&
            n.subtract(Fraction.fromDecimal(fact.maximum)).numerator > 0n)
        )
          add(
            "FactOutOfRange",
            `${fact.label} is outside its declared range.`,
            instance.id,
            fact.key,
          );
      }
      if (
        fact.scope === "Global" &&
        input.instances.some((i) => i.facts[fact.key] !== value)
      )
        add(
          "GlobalFactMismatch",
          `${fact.label} must agree across all systems.`,
          instance.id,
          fact.key,
        );
    }
    for (const set of design.option_sets)
      for (const option of set.options) {
        const available = evaluateCondition(
          option.available_when,
          instance.facts,
          d.facts,
          instance.not_applicable,
        );
        evidence.options.push({
          instance_id: instance.id,
          set: set.key,
          value: option.value,
          available,
          reason: option.reason,
        });
        if (instance.facts[set.fact] === option.value && available !== true)
          add(
            available === false ? "OptionUnavailable" : "OptionUnknown",
            option.reason,
            instance.id,
            set.key,
          );
      }
    const allowed = new Set(d.rules.map((r) => r.key));
    for (const table of design.decision_tables) {
      const result = tableMatch(
        table,
        instance.facts,
        d,
        instance.not_applicable,
      );
      evidence.tables.push({
        key: table.key,
        instance_id: instance.id,
        ...result,
      });
      const selected = new Set(
        table.rows
          .filter((r) => result.selected.includes(r.key))
          .flatMap((r) => r.rules),
      );
      for (const key of table.rows.flatMap((r) => r.rules))
        if (!selected.has(key)) allowed.delete(key);
      if (
        result.state !== "Matched" &&
        (result.state !== "Gap" || table.required)
      )
        add(
          `DecisionTable${result.state}`,
          `${table.label}: ${result.state.toLowerCase()} in decision table.`,
          instance.id,
          table.key,
        );
    }
    enabled.set(instance.id, allowed);
  }
  for (const cap of design.shared_capacity) {
    const groups = new Map<string, typeof input.instances>();
    for (const i of input.instances) {
      const group = i.facts[cap.group_fact];
      if (typeof group !== "string" || !group.trim()) {
        add("SharedCapacityUnknown", cap.message, i.id, cap.key);
        continue;
      }
      groups.set(group, [...(groups.get(group) ?? []), i]);
    }
    for (const [group, instances] of groups) {
      let demand = new Fraction(0n),
        capacity: Fraction | null = null,
        unknown = false;
      for (const i of instances) {
        const n = i.facts[cap.demand_fact],
          c = i.facts[cap.capacity_fact];
        if (typeof n !== "string" || typeof c !== "string") {
          unknown = true;
          continue;
        }
        const limit = Fraction.fromDecimal(c),
          need = Fraction.fromDecimal(n);
        if (
          need.numerator < 0n ||
          limit.numerator < 0n ||
          (capacity && capacity.subtract(limit).numerator !== 0n)
        )
          unknown = true;
        demand = demand.add(need);
        capacity = limit;
      }
      const state =
        unknown || !capacity
          ? "Unknown"
          : demand.subtract(capacity).numerator > 0n
            ? "Exceeded"
            : "Ready";
      evidence.capacity.push({
        key: cap.key,
        group,
        demand: unknown ? null : demand.exactDecimal(),
        capacity: capacity?.exactDecimal() ?? null,
        state,
      });
      if (state !== "Ready")
        add(
          state === "Exceeded"
            ? "SharedCapacityExceeded"
            : "SharedCapacityUnknown",
          cap.message,
          null,
          cap.key,
        );
    }
  }
  return { evidence, enabled };
}
export function price(
  cost: string,
  catalog: string,
  policy: { mode: "Catalog" | "Margin" | "Markup"; percent: string },
) {
  if (policy.mode === "Catalog") return catalog;
  const c = Fraction.fromDecimal(cost),
    rate = Fraction.fromDecimal(policy.percent).divide(new Fraction(100n));
  const sell =
    policy.mode === "Margin"
      ? c.divide(new Fraction(1n).subtract(rate))
      : c.multiply(new Fraction(1n).add(rate));
  return decimal(halfUp(sell.numerator * 100n, sell.denominator), 2);
}

// Exhaustive partitions for this restricted comparison language. Each numeric
// boundary, open interval and text equality class is represented exactly.
export function tableCoverage(d: Definition) {
  return (d.design?.decision_tables ?? []).map((table) => {
    const literals = (c: Condition, fact: string): Scalar[] =>
      "fact" in c
        ? c.fact === fact
          ? "value" in c
            ? [c.value]
            : "values" in c
              ? c.values
              : []
          : []
        : "items" in c
          ? c.items.flatMap((x) => literals(x, fact))
          : "item" in c
            ? literals(c.item, fact)
            : [];
    const domains = table.columns.map((key) => {
      const f = d.facts.find((f) => f.key === key)!;
      const values = [
        ...new Set(table.rows.flatMap((r) => literals(r.when, key))),
      ];
      if (f.type === "Boolean") return [false, true];
      if (f.type === "Choice") return f.choices;
      if (f.type === "Text") {
        let other = "__other__";
        while (values.includes(other)) other += "_";
        return [...values, other];
      }
      const limits = [...values, f.minimum, f.maximum]
        .filter((v) => v != null)
        .map((v) => Fraction.fromDecimal(String(v)))
        .sort((a, b) => (a.subtract(b).numerator < 0n ? -1 : 1));
      const points: string[] = [];
      for (let i = 0; i < limits.length; i++) {
        const n = limits[i];
        points.push(n.exactDecimal()!);
        if (i === 0) points.push(n.subtract(new Fraction(1n)).exactDecimal()!);
        if (i === limits.length - 1)
          points.push(n.add(new Fraction(1n)).exactDecimal()!);
        else
          points.push(
            n
              .add(limits[i + 1])
              .divide(new Fraction(2n))
              .exactDecimal(12)!,
          );
      }
      // Integer intervals need adjacent whole numbers, not fractional midpoints.
      if (f.type === "Integer")
        for (const n of limits) {
          const floor =
            n.numerator / n.denominator -
            (n.numerator < 0n && n.numerator % n.denominator !== 0n ? 1n : 0n);
          points.push(String(floor - 1n), String(floor), String(floor + 1n));
        }
      return [...new Set(points.length ? points : ["0"])].filter((v) => {
        if (v === null) return false;
        const n = Fraction.fromDecimal(v);
        return (
          (f.type !== "Integer" || n.denominator === 1n) &&
          (f.minimum == null ||
            n.subtract(Fraction.fromDecimal(f.minimum)).numerator >= 0n) &&
          (f.maximum == null ||
            n.subtract(Fraction.fromDecimal(f.maximum)).numerator <= 0n)
        );
      });
    });
    const size = domains.reduce((n, values) => n * values.length, 1);
    if (size > 256)
      return {
        key: table.key,
        complete: false,
        cases: size,
        issues: [],
        message:
          "More than 256 input partitions; split this table before creating a version.",
      };
    let cases: Record<string, Scalar>[] = [{}];
    domains.forEach((values, i) => {
      cases = cases.flatMap((c) =>
        values.map((v) => ({ ...c, [table.columns[i]]: v })),
      );
    });
    const issues = cases
      .map((facts) => ({ facts, ...tableMatch(table, facts, d) }))
      .filter(
        (r) => r.state === "Conflict" || (table.required && r.state === "Gap"),
      );
    return {
      key: table.key,
      complete: true,
      cases: size,
      issues,
      message: null,
    };
  });
}
