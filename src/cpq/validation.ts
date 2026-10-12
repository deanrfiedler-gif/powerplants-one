import { object, label, invalid, choice, uuid } from "../shared/validation";
import { amount } from "../estimating/validation";
import { compileFormula, Fraction } from "./expression";
import type {
  CalculationInput,
  Condition,
  Definition,
  Fact,
  Scalar,
} from "./types";

export function bounded(
  value: unknown,
  field: string,
  maximum: number,
  minimum = 0,
): unknown[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum)
    invalid(field, `Use ${minimum} to ${maximum} entries.`);
  return value as unknown[];
}
export function key(value: unknown, field = "key") {
  if (
    typeof value !== "string" ||
    !/^[a-z][a-z0-9_]{0,47}$/.test(value) ||
    value.startsWith("bom_") ||
    ["constructor", "prototype", "__proto__"].includes(value)
  )
    invalid(
      field,
      "Use a stable lowercase key (letters, digits and underscores). Reserved keys are unavailable.",
    );
  return value as string;
}
export function date(value: unknown, field: string) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    invalid(field, "Use a valid YYYY-MM-DD date.");
  return value as string;
}
export function digest(value: unknown, field: string) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    invalid(field, "Use the exact saved content hash.");
  return value as string;
}
function distinct<T extends { key: string }>(items: T[], field: string) {
  if (new Set(items.map((i) => i.key)).size !== items.length)
    invalid(field, "Each entry needs its own stable key.");
  return items;
}
function scalar(value: unknown, fact: Fact): Scalar {
  if (value === null) return null;
  if (fact.type === "Boolean" && typeof value === "boolean") return value;
  if (
    fact.type === "Choice" &&
    typeof value === "string" &&
    fact.choices.includes(value)
  )
    return value;
  if (fact.type === "Decimal" && typeof value === "string") {
    try {
      return Fraction.fromDecimal(value).exactDecimal()!;
    } catch {
      /* give field context */
    }
  }
  return invalid(
    fact.key,
    `Enter a ${fact.type.toLowerCase()} value, or leave it explicitly unknown.`,
  );
}
export function condition(
  value: unknown,
  facts: Fact[],
  depth = 0,
  budget = { count: 0 },
): Condition {
  if (depth > 8 || ++budget.count > 100)
    invalid(
      "condition",
      "A condition may contain at most 100 nodes and 8 levels.",
    );
  const r = object(value, ["op", "items", "item", "fact", "value"]);
  const op = choice(r.op, "op", [
    "ALL",
    "ANY",
    "NOT",
    "EQ",
    "NE",
    "GT",
    "GTE",
    "LT",
    "LTE",
  ] as const);
  if (op === "ALL" || op === "ANY") {
    object(r, ["op", "items"]);
    return {
      op,
      items: bounded(r.items, "items", 20, 1).map((x) =>
        condition(x, facts, depth + 1, budget),
      ),
    };
  }
  if (op === "NOT") {
    object(r, ["op", "item"]);
    return { op, item: condition(r.item, facts, depth + 1, budget) };
  }
  object(r, ["op", "fact", "value"]);
  const f = facts.find((f) => f.key === r.fact);
  if (!f) return invalid("fact", "Choose a registered fact.");
  const v = scalar(r.value, f);
  if (v === null || (f.type !== "Decimal" && !["EQ", "NE"].includes(op)))
    invalid("condition", "Use typed comparisons with a known literal.");
  return { op, fact: f.key, value: v! };
}
export function calculationInput(
  value: unknown,
  facts: Fact[],
): CalculationInput {
  const r = object(value, ["pricing_date", "instances", "overrides"]);
  const instances = bounded(r.instances, "instances", 20, 1).map((v) => {
    const i = object(v, ["id", "label", "facts"]),
      values = object(
        i.facts,
        facts.map((f) => f.key),
      );
    return {
      id: uuid(i.id, "instance_id"),
      label: label(i.label, "instance_label", 100),
      facts: Object.fromEntries(
        facts.map((f) => [f.key, scalar(values[f.key] ?? null, f)]),
      ),
    };
  });
  if (new Set(instances.map((i) => i.id)).size !== instances.length)
    invalid("instances", "Each instance needs its own identity.");
  const overrides = bounded(r.overrides, "overrides", 100).map((v) => {
    const o = object(v, ["target", "basis_hash", "kind", "value", "reason"]),
      kind = choice(o.kind, "kind", [
        "Quantity",
        "SellPrice",
        "Suppress",
      ] as const);
    if (kind === "Suppress" && o.value !== null)
      invalid("value", "A suppression has no numeric value.");
    return {
      target: label(o.target, "target", 200),
      basis_hash: digest(o.basis_hash, "basis_hash"),
      kind,
      value:
        kind === "Suppress"
          ? null
          : amount(o.value, "value", kind === "Quantity"),
      reason: label(o.reason, "override_reason", 500),
    };
  });
  if (
    new Set(overrides.map((o) => `${o.target}:${o.kind}`)).size !==
    overrides.length
  )
    invalid("overrides", "Use each override type once per target.");
  return {
    pricing_date: date(r.pricing_date, "pricing_date"),
    instances,
    overrides,
  };
}
export function definition(value: unknown): Definition {
  if (Buffer.byteLength(JSON.stringify(value) ?? "") > 60000)
    invalid("definition", "Keep a release within 60 KB.");
  const r = object(value, [
    "schema_version",
    "label",
    "currency",
    "facts",
    "parts",
    "rules",
    "constraints",
    "fixtures",
  ]);
  if (r.schema_version !== 1)
    invalid("schema_version", "Use CPQ definition schema 1.");
  const facts = distinct(
    bounded(r.facts, "facts", 40, 1).map((v) => {
      const f = object(v, [
        "key",
        "label",
        "type",
        "unit",
        "required",
        "choices",
      ]);
      if (typeof f.required !== "boolean")
        invalid("required", "Required must be explicit.");
      const type = choice(f.type, "type", [
        "Decimal",
        "Boolean",
        "Choice",
      ] as const);
      const choices = bounded(
        f.choices,
        "choices",
        30,
        type === "Choice" ? 1 : 0,
      ).map((c) => label(c, "choice", 100));
      if (
        (type !== "Choice" && choices.length) ||
        new Set(choices).size !== choices.length
      )
        invalid("choices", "Only choice facts have unique choice values.");
      return {
        key: key(f.key),
        label: label(f.label, "label", 100),
        type,
        unit: label(f.unit, "unit", 40),
        required: f.required as boolean,
        choices,
      };
    }),
    "facts",
  );
  const parts = distinct(
    bounded(r.parts, "parts", 100, 1).map((v) => {
      const p = object(v, [
        "key",
        "description",
        "category",
        "unit",
        "resolver",
        "source",
        "effective_from",
        "effective_to",
        "tiers",
      ]);
      const from = date(p.effective_from, "effective_from"),
        to = date(p.effective_to, "effective_to");
      if (from > to)
        invalid(
          "effective_to",
          "Price validity must end on or after its start.",
        );
      const tiers = bounded(p.tiers, "tiers", 10, 1).map((t) => {
        const x = object(t, ["minimum", "unit_cost", "unit_sell"]);
        const cost = amount(x.unit_cost, "unit_cost"),
          sell = amount(x.unit_sell, "unit_sell");
        if (
          Fraction.fromDecimal(sell).subtract(Fraction.fromDecimal(cost))
            .numerator < 0n
        )
          invalid(
            "unit_sell",
            "Sell cannot be below cost under the native synthetic policy.",
          );
        return {
          minimum: amount(x.minimum, "minimum", true),
          unit_cost: cost,
          unit_sell: sell,
        };
      });
      if (
        tiers.some(
          (t, i) =>
            i > 0 &&
            Fraction.fromDecimal(t.minimum).subtract(
              Fraction.fromDecimal(tiers[i - 1].minimum),
            ).numerator <= 0n,
        )
      )
        invalid("tiers", "Price breaks must increase strictly.");
      return {
        key: key(p.key),
        description: label(p.description, "description", 300),
        category: choice(p.category, "category", [
          "Product",
          "Labour",
          "Freight",
          "Engineering",
          "Subcontract",
        ] as const),
        unit: label(p.unit, "unit", 40),
        resolver: choice(p.resolver, "resolver", [
          "SUM",
          "MAX",
          "UNIQUE",
          "PRIORITY",
        ] as const),
        source: label(p.source, "source", 500),
        effective_from: from,
        effective_to: to,
        tiers,
      };
    }),
    "parts",
  );
  const rules = distinct(
    bounded(r.rules, "rules", 100, 1).map((v) => {
      const x = object(v, [
          "key",
          "description",
          "phase",
          "when",
          "part",
          "quantity",
          "priority",
        ]),
        phase = choice(x.phase, "phase", ["Materials", "Labour"] as const),
        part = parts.find((p) => p.key === x.part);
      if (!part || (phase === "Labour") !== (part.category === "Labour"))
        invalid("part", "Choose a part in the same calculation phase.");
      if (
        !Number.isSafeInteger(x.priority) ||
        Number(x.priority) < 0 ||
        Number(x.priority) > 1000
      )
        invalid("priority", "Priority must be an integer from 0 to 1000.");
      const quantity = label(x.quantity, "quantity", 2048),
        symbols = new Set(
          facts.filter((f) => f.type === "Decimal").map((f) => f.key),
        );
      if (phase === "Labour")
        for (const p of parts.filter((p) => p.category !== "Labour"))
          symbols.add(`bom_${p.key}`);
      try {
        compileFormula(quantity, symbols);
      } catch (e) {
        invalid("quantity", (e as Error).message);
      }
      return {
        key: key(x.key),
        description: label(x.description, "description", 200),
        phase,
        when: condition(x.when, facts),
        part: part!.key,
        quantity,
        priority: Number(x.priority),
      };
    }),
    "rules",
  );
  const constraints = distinct(
    bounded(r.constraints, "constraints", 100).map((v) => {
      const x = object(v, ["key", "when", "require", "message"]);
      return {
        key: key(x.key),
        when: condition(x.when, facts),
        require: condition(x.require, facts),
        message: label(x.message, "message", 500),
      };
    }),
    "constraints",
  );
  const fixtures = bounded(r.fixtures, "fixtures", 12, 1).map((v) => {
    const x = object(v, ["name", "input", "expected"]),
      e = object(x.expected, ["ready", "cost", "sell", "diagnostic_codes"]);
    if (typeof e.ready !== "boolean")
      invalid("ready", "Use an explicit expected result.");
    return {
      name: label(x.name, "name", 100),
      input: calculationInput(x.input, facts),
      expected: {
        ready: e.ready as boolean,
        cost: e.cost === null ? null : amount(e.cost, "cost"),
        sell: e.sell === null ? null : amount(e.sell, "sell"),
        diagnostic_codes: bounded(
          e.diagnostic_codes,
          "diagnostic_codes",
          100,
        ).map((c) => label(c, "code", 100)),
      },
    };
  });
  return {
    schema_version: 1,
    label: label(r.label, "label", 200),
    currency: choice(r.currency, "currency", ["AUD"] as const),
    facts,
    parts,
    rules,
    constraints,
    fixtures,
  };
}
