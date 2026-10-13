import { object, label, choice, invalid } from "../shared/validation";
import { bounded, key, condition } from "./validation";
import { Fraction } from "./expression";
import type { Fact, Rule, DesignContract, CalculationInput } from "./types";
import { discoveryDefinition } from "../estimating/discovery-definition";

const numeric = (v: unknown, field: string) => {
  try {
    if (typeof v === "string") return Fraction.fromDecimal(v).exactDecimal()!;
  } catch {
    /* field error below */
  }
  return invalid(field, "Use a bounded decimal string.");
};
export function factMetadata(f: Record<string, unknown>, type: Fact["type"]) {
  const binding =
    f.binding == null
      ? null
      : {
          question_id: label(
            object(f.binding, ["question_id"]).question_id,
            "question_id",
            100,
          ),
        };
  if (binding) {
    const question = discoveryDefinition.questions.find(
      (q) => q.id === binding.question_id,
    );
    if (
      !question ||
      !(
        question.type === type ||
        (question.type === "TextOrNone" && type === "Text") ||
        (question.type === "Integer" && type === "Decimal")
      )
    )
      invalid(
        "binding",
        "Bind to a registered discovery question of the same scalar type.",
      );
  }
  const minimum = f.minimum == null ? null : numeric(f.minimum, "minimum");
  const maximum = f.maximum == null ? null : numeric(f.maximum, "maximum");
  if (
    !["Decimal", "Integer"].includes(type) &&
    (minimum !== null || maximum !== null)
  )
    invalid("bounds", "Only decimal facts have numeric bounds.");
  if (
    minimum !== null &&
    maximum !== null &&
    Fraction.fromDecimal(minimum).subtract(Fraction.fromDecimal(maximum))
      .numerator > 0n
  )
    invalid("maximum", "Maximum must be at least the minimum.");
  return {
    description:
      f.description === undefined || f.description === ""
        ? ""
        : label(f.description, "description", 500),
    scope: choice(f.scope ?? "System", "scope", [
      "System",
      "Global",
      "Shared",
    ] as const),
    source: label(f.source ?? "User input", "source", 300),
    minimum,
    maximum,
    binding,
  };
}
export function parameters(value: unknown, facts: Fact[]) {
  const params = bounded(value, "parameters", 20).map((v) => {
    const p = object(v, ["key", "label", "unit", "value"]);
    return {
      key: key(p.key),
      label: label(p.label, "label", 100),
      unit: label(p.unit, "unit", 40),
      value: numeric(p.value, "value"),
    };
  });
  if (
    new Set(params.map((p) => p.key)).size !== params.length ||
    params.some((p) => facts.some((f) => f.key === p.key))
  )
    invalid(
      "parameters",
      "Parameter names must be unique and cannot shadow facts.",
    );
  return params;
}
function percent(value: unknown, margin: boolean) {
  const v = numeric(value, "percent"),
    n = Fraction.fromDecimal(v);
  if (
    n.numerator < 0n ||
    n.subtract(new Fraction(margin ? 100n : 1000n)).numerator >= 0n
  )
    invalid(
      "percent",
      margin
        ? "Margin must be 0 to less than 100%."
        : "Markup must be 0 to less than 1000%.",
    );
  return v;
}
export function pricingInput(value: unknown): CalculationInput["pricing"] {
  if (value === null) return null;
  const p = object(value, ["mode", "percent"]);
  const mode = choice(p.mode, "mode", ["Margin", "Markup"] as const);
  return { mode, percent: percent(p.percent, mode === "Margin") };
}
function unique<T extends { key: string }>(items: T[], field: string) {
  if (new Set(items.map((x) => x.key)).size !== items.length)
    invalid(field, "Use unique stable keys.");
  return items;
}
export function designContract(
  value: unknown,
  facts: Fact[],
  rules: Rule[],
  parts: import("./types").Part[],
): DesignContract {
  const d = object(value, [
    "option_sets",
    "structure",
    "shared_capacity",
    "decision_tables",
    "pricing",
    "milestones",
  ]);
  const milestones = unique(
    bounded(d.milestones ?? [], "milestones", 30).map((v) => {
      const m = object(v, [
        "key",
        "label",
        "when",
        "anchor",
        "offset_days",
        "calendar",
      ]);
      if (
        !Number.isInteger(m.offset_days) ||
        Math.abs(Number(m.offset_days)) > 365
      )
        invalid("offset_days", "Use a signed offset from -365 to 365 days.");
      return {
        key: key(m.key),
        label: label(m.label, "label", 200),
        when: condition(m.when, facts),
        anchor: label(m.anchor, "anchor", 200),
        offset_days: Number(m.offset_days),
        calendar: choice(m.calendar, "calendar", [
          "BusinessDays",
          "CalendarDays",
        ] as const),
      };
    }),
    "milestones",
  );
  const fact = (k: unknown, types: Fact["type"][]) => {
    const f = facts.find((f) => f.key === k && types.includes(f.type));
    if (!f)
      return invalid("fact", "Choose a registered fact of the required type.");
    return f.key;
  };
  const option_sets = unique(
    bounded(d.option_sets, "option_sets", 20).map((v) => {
      const s = object(v, ["key", "label", "fact", "options"]),
        f = fact(s.fact, ["Choice"]);
      const options = bounded(s.options, "options", 30, 1).map((v) => {
        const o = object(v, ["value", "label", "available_when", "reason"]);
        const value = label(o.value, "value", 100);
        if (!facts.find((x) => x.key === f)!.choices.includes(value))
          invalid("value", "Use a registered choice.");
        return {
          value,
          label: label(o.label, "label", 100),
          available_when: condition(o.available_when, facts),
          reason: label(o.reason, "reason", 500),
        };
      });
      if (new Set(options.map((o) => o.value)).size !== options.length)
        invalid("options", "Choice values must be unique.");
      return {
        key: key(s.key),
        label: label(s.label, "label", 100),
        fact: f,
        options,
      };
    }),
    "option_sets",
  );
  const structure = unique(
    bounded(d.structure, "structure", 40).map((v) => {
      const s = object(v, ["key", "label", "parent", "option_sets"]);
      const sets = bounded(s.option_sets, "option_sets", 20).map((v) => key(v));
      if (sets.some((k) => !option_sets.some((s) => s.key === k)))
        invalid("option_sets", "Choose registered option sets.");
      return {
        key: key(s.key),
        label: label(s.label, "label", 100),
        parent: s.parent === null ? null : key(s.parent),
        option_sets: sets,
      };
    }),
    "structure",
  );
  for (const item of structure) {
    const seen = new Set([item.key]);
    let parent = item.parent;
    while (parent) {
      if (seen.has(parent))
        invalid("parent", "Product structures cannot contain cycles.");
      seen.add(parent);
      const node = structure.find((n) => n.key === parent);
      if (!node) invalid("parent", "Choose an existing parent structure.");
      parent = node!.parent;
    }
  }
  const shared_capacity = unique(
    bounded(d.shared_capacity, "shared_capacity", 20).map((v) => {
      const s = object(v, [
        "key",
        "label",
        "group_fact",
        "demand_fact",
        "capacity_fact",
        "message",
      ]);
      return {
        key: key(s.key),
        label: label(s.label, "label", 100),
        group_fact: fact(s.group_fact, ["Choice", "Text"]),
        demand_fact: fact(s.demand_fact, ["Decimal", "Integer"]),
        capacity_fact: fact(s.capacity_fact, ["Decimal", "Integer"]),
        message: label(s.message, "message", 500),
      };
    }),
    "shared_capacity",
  );
  const boundRules = new Set<string>();
  const decision_tables = unique(
    bounded(d.decision_tables, "decision_tables", 20).map((v) => {
      const t = object(v, [
        "key",
        "label",
        "hit_policy",
        "required",
        "columns",
        "rows",
      ]);
      if (typeof t.required !== "boolean")
        invalid("required", "Declare whether this table requires a match.");
      const columns = bounded(t.columns, "columns", 10, 1).map((v) =>
        fact(v, ["Decimal", "Integer", "Boolean", "Choice", "Text"]),
      );
      if (new Set(columns).size !== columns.length)
        invalid("columns", "Choose each input column once.");
      const rows = unique(
        bounded(t.rows, "rows", 50, 1).map((v) => {
          const r = object(v, ["key", "when", "rules", "priority"]);
          if (
            !Number.isSafeInteger(r.priority) ||
            Number(r.priority) < 0 ||
            Number(r.priority) > 1000
          )
            invalid("priority", "Use an integer from 0 to 1000.");
          const selected = bounded(r.rules, "rules", 20, 1).map((v) => key(v));
          if (
            new Set(selected).size !== selected.length ||
            selected.some((k) => !rules.some((r) => r.key === k))
          )
            invalid("rules", "Select each registered rule once per row.");
          if (
            selected.some(
              (k) =>
                parts.find(
                  (p) => p.key === rules.find((r) => r.key === k)?.part,
                )?.scope?.kind !== "System",
            )
          )
            invalid(
              "rules",
              "Decision tables gate system rules. Shared and configuration outputs use their own explicit conditions.",
            );
          return {
            key: key(r.key),
            when: condition(
              r.when,
              facts.filter((f) => columns.includes(f.key)),
            ),
            rules: selected,
            priority: Number(r.priority),
          };
        }),
        "rows",
      );
      const members = new Set(rows.flatMap((r) => r.rules));
      for (const k of members) {
        if (boundRules.has(k))
          invalid("rules", "A rule can belong to only one decision table.");
        boundRules.add(k);
      }
      return {
        key: key(t.key),
        label: label(t.label, "label", 100),
        hit_policy: choice(t.hit_policy, "hit_policy", [
          "UNIQUE",
          "PRIORITY",
        ] as const),
        required: t.required as boolean,
        columns,
        rows,
      };
    }),
    "decision_tables",
  );
  const p = object(d.pricing, ["mode", "percent", "allow_override"]);
  const mode = choice(p.mode, "mode", ["Catalog", "Margin", "Markup"] as const);
  if (typeof p.allow_override !== "boolean")
    invalid(
      "allow_override",
      "Declare whether configuration pricing may be adjusted.",
    );
  const rate = percent(p.percent, mode === "Margin");
  if (mode === "Catalog" && rate !== "0")
    invalid("percent", "Catalog pricing has no percentage adjustment.");
  return {
    option_sets,
    structure,
    shared_capacity,
    decision_tables,
    milestones,
    pricing: {
      mode,
      percent: rate,
      allow_override: p.allow_override as boolean,
    },
  };
}
