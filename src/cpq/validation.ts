import {
  object,
  label,
  invalid,
  choice,
  uuid,
  instant,
} from "../shared/validation";
import { amount } from "../estimating/validation";
import { compileFormula, Fraction } from "./expression";
import {
  designContract,
  factMetadata,
  parameters,
  pricingInput,
} from "./design-validation";
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
  if (fact.type === "Text" && typeof value === "string" && value.length <= 500)
    return value;
  if (fact.type === "Boolean" && typeof value === "boolean") return value;
  if (
    fact.type === "Choice" &&
    typeof value === "string" &&
    fact.choices.includes(value)
  )
    return value;
  if (["Decimal", "Integer"].includes(fact.type) && typeof value === "string") {
    try {
      const n = Fraction.fromDecimal(value);
      if (fact.type !== "Integer" || n.denominator === 1n)
        return n.exactDecimal()!;
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
  const r = object(value, ["op", "items", "item", "fact", "value", "values"]);
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
    "KNOWN",
    "NOT_APPLICABLE",
    "IN",
    "ALWAYS",
  ] as const);
  if (op === "ALWAYS") {
    object(r, ["op"]);
    if (!facts.some((f) => f.scope !== undefined))
      invalid("op", "Always applies requires a schema-3 dictionary.");
    return { op };
  }
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
  const f = facts.find((f) => f.key === r.fact);
  if (!f) return invalid("fact", "Choose a registered fact.");
  if (op === "IN") {
    object(r, ["op", "fact", "values"]);
    if (
      f.scope === undefined ||
      !["Choice", "Text", "Boolean"].includes(f.type)
    )
      invalid(
        "op",
        "Membership requires a schema-3 choice, text or Boolean fact.",
      );
    const values = bounded(r.values, "values", 30, 1).map((v) => scalar(v, f));
    if (values.includes(null) || new Set(values).size !== values.length)
      invalid("values", "Choose distinct known values.");
    return { op, fact: f.key, values: values as (string | boolean)[] };
  }
  if (op === "KNOWN" || op === "NOT_APPLICABLE") {
    object(r, ["op", "fact"]);
    if (f.scope === undefined)
      invalid("op", "Fact state tests require a schema-3 dictionary.");
    return { op, fact: f.key };
  }
  object(r, ["op", "fact", "value"]);
  const v = scalar(r.value, f);
  if (
    v === null ||
    (!["Decimal", "Integer"].includes(f.type) && !["EQ", "NE"].includes(op))
  )
    invalid("condition", "Use typed comparisons with a known literal.");
  return { op, fact: f.key, value: v! };
}
export function calculationInput(
  value: unknown,
  facts: Fact[],
  design = false,
): CalculationInput {
  const r = object(value, [
    "pricing_date",
    "instances",
    "overrides",
    ...(design ? ["pricing"] : []),
  ]);
  const instances = bounded(r.instances, "instances", 20, 1).map((v) => {
    const i = object(v, [
        "id",
        "label",
        "facts",
        ...(design ? ["not_applicable"] : []),
      ]),
      values = object(
        i.facts,
        facts.map((f) => f.key),
      );
    const not_applicable = design
      ? bounded(i.not_applicable ?? [], "not_applicable", 40).map((v) => key(v))
      : [];
    if (
      new Set(not_applicable).size !== not_applicable.length ||
      not_applicable.some(
        (k) => !facts.some((f) => f.key === k) || values[k] != null,
      )
    )
      invalid(
        "not_applicable",
        "Not-applicable facts must be registered, unique and have no scalar value.",
      );
    return {
      id: uuid(i.id, "instance_id"),
      label: label(i.label, "instance_label", 100),
      facts: Object.fromEntries(
        facts.map((f) => [f.key, scalar(values[f.key] ?? null, f)]),
      ),
      ...(design ? { not_applicable } : {}),
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
    ...(design ? { pricing: pricingInput(r.pricing ?? null) } : {}),
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
    ...(typeof value === "object" &&
    value !== null &&
    "schema_version" in value &&
    value.schema_version === 3
      ? ["design"]
      : []),
  ]);
  if (
    r.schema_version !== 1 &&
    r.schema_version !== 2 &&
    r.schema_version !== 3
  )
    invalid("schema_version", "Use CPQ definition schema 1, 2 or 3.");
  const design = r.schema_version === 3;
  const facts = distinct(
    bounded(r.facts, "facts", 40, 1).map((v) => {
      const f = object(v, [
        "key",
        "label",
        "type",
        "unit",
        "required",
        "choices",
        ...(design
          ? ["description", "scope", "source", "minimum", "maximum", "binding"]
          : []),
      ]);
      if (typeof f.required !== "boolean")
        invalid("required", "Required must be explicit.");
      const type = choice(f.type, "type", [
        "Decimal",
        "Boolean",
        "Choice",
        ...(design ? ["Text" as const, "Integer" as const] : []),
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
        ...(design ? factMetadata(f, type) : {}),
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
        ...(r.schema_version === 2 ? ["product"] : []),
        ...(design ? ["price_context"] : []),
        ...(design ? ["scope"] : []),
      ]);
      let product: import("./types").ProductReference | undefined;
      if ("product" in p) {
        if (p.category !== "Product")
          invalid("product", "Only Product parts can bind catalogue variants.");
        const ref = object(p.product, [
          "product_id",
          "revision_id",
          "content_hash",
          "relationships",
        ]);
        const relationships = bounded(
          ref.relationships ?? [],
          "relationships",
          10,
        ).map((value) => {
          const item = object(value, ["id", "content_hash", "review_id"]);
          return {
            id: uuid(item.id, "relationship_id"),
            content_hash: digest(
              item.content_hash,
              "relationship_content_hash",
            ),
            review_id: uuid(item.review_id, "relationship_review_id"),
          };
        });
        if (
          new Set(relationships.map((x) => x.id)).size !== relationships.length
        )
          invalid(
            "relationships",
            "Use each exact relationship once per part.",
          );
        product = {
          product_id: uuid(ref.product_id, "product_id"),
          revision_id: uuid(ref.revision_id, "product_revision_id"),
          content_hash: digest(ref.content_hash, "product_content_hash"),
          relationships,
        };
      }
      const from = date(p.effective_from, "effective_from"),
        to = date(p.effective_to, "effective_to");
      if (from > to)
        invalid(
          "effective_to",
          "Price validity must end on or after its start.",
        );
      const scoped = design
        ? object(p.scope ?? { kind: "System", group_fact: null }, [
            "kind",
            "group_fact",
          ])
        : null;
      const scope = scoped
        ? {
            kind: choice(scoped.kind, "scope.kind", [
              "System",
              "Shared",
              "Configuration",
            ] as const),
            group_fact:
              scoped.group_fact === null
                ? null
                : key(scoped.group_fact, "group_fact"),
          }
        : undefined;
      if (
        scope &&
        (scope.kind === "Shared"
          ? !facts.some(
              (f) =>
                f.key === scope.group_fact &&
                ["Choice", "Text"].includes(f.type),
            )
          : scope.group_fact !== null)
      )
        invalid(
          "scope",
          "Shared outputs need a registered grouping fact; system and configuration outputs have no group fact.",
        );
      let price_context: import("./types").Part["price_context"];
      if (design && p.price_context) {
        const pc = object(p.price_context, [
          "book",
          "policy",
          "source_currency",
          "currency_per_aud",
          "recorded_at",
        ]);
        const currency = label(pc.source_currency, "source_currency", 3),
          rate = label(pc.currency_per_aud, "currency_per_aud", 32);
        if (!/^[A-Z]{3}$/.test(currency))
          invalid(
            "source_currency",
            "Use a three-letter uppercase currency code.",
          );
        try {
          if (Fraction.fromDecimal(rate).numerator <= 0n)
            invalid("currency_per_aud", "Use a positive exact exchange rate.");
        } catch {
          invalid("currency_per_aud", "Use a positive exact decimal rate.");
        }
        if (
          currency === "AUD" &&
          Fraction.fromDecimal(rate).subtract(new Fraction(1n)).numerator !== 0n
        )
          invalid("currency_per_aud", "AUD source prices use a rate of one.");
        price_context = {
          book: label(pc.book, "book", 200),
          policy: label(pc.policy, "policy", 200),
          source_currency: currency,
          currency_per_aud: rate,
          recorded_at: instant(pc.recorded_at, "recorded_at"),
        };
      }
      const tiers = bounded(p.tiers, "tiers", 10, 1).map((t) => {
        const x = object(t, [
          "minimum",
          "unit_cost",
          "unit_sell",
          ...(design ? ["source_unit_cost"] : []),
        ]);
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
        let source_unit_cost: string | undefined;
        if (price_context) {
          source_unit_cost = label(x.source_unit_cost, "source_unit_cost", 32);
          let converted;
          try {
            const source = Fraction.fromDecimal(source_unit_cost);
            if (source.numerator < 0n) throw Error("negative");
            converted = source.divide(
              Fraction.fromDecimal(price_context.currency_per_aud),
            );
          } catch {
            invalid(
              "source_unit_cost",
              "Use a non-negative exact source cost.",
            );
          }
          // Compare at the native cent scale, half-up, before any quantity extension.
          const cents =
            (converted!.numerator * 100n) / converted!.denominator +
            (((converted!.numerator * 100n) % converted!.denominator) * 2n >=
            converted!.denominator
              ? 1n
              : 0n);
          if (
            Fraction.fromDecimal(cost).subtract(new Fraction(cents, 100n))
              .numerator !== 0n
          )
            invalid(
              "unit_cost",
              "AUD cost must equal source cost divided by currency-per-AUD, rounded half-up to cents.",
            );
        } else if (x.source_unit_cost !== undefined)
          invalid(
            "source_unit_cost",
            "Record the frozen price context for a source-currency cost.",
          );
        return {
          minimum: amount(x.minimum, "minimum", true),
          unit_cost: cost,
          unit_sell: sell,
          ...(source_unit_cost !== undefined ? { source_unit_cost } : {}),
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
        ...(product ? { product } : {}),
        ...(price_context ? { price_context } : {}),
        ...(scope ? { scope } : {}),
      };
    }),
    "parts",
  );
  if (r.schema_version === 2 && !parts.some((p) => p.product))
    invalid(
      "parts",
      "Schema 2 requires at least one explicit published Product binding.",
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
          ...(design ? ["parameters"] : []),
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
      const params = design ? parameters(x.parameters ?? [], facts) : [];
      const quantity = label(x.quantity, "quantity", 2048),
        symbols = new Set(
          facts
            .filter((f) => ["Decimal", "Integer"].includes(f.type))
            .map((f) => f.key),
        );
      for (const parameter of params) symbols.add(parameter.key);
      if (phase === "Labour")
        for (const p of parts.filter(
          (p) =>
            p.category !== "Labour" &&
            (!design ||
              (p.scope?.kind === part!.scope?.kind &&
                p.scope?.group_fact === part!.scope?.group_fact)),
        ))
          symbols.add(`bom_${p.key}`);
      try {
        compileFormula(quantity, symbols, design);
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
        ...(design ? { parameters: params } : {}),
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
      input: calculationInput(x.input, facts, design),
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
    schema_version: r.schema_version as 1 | 2 | 3,
    label: label(r.label, "label", 200),
    currency: choice(r.currency, "currency", ["AUD"] as const),
    facts,
    parts,
    rules,
    constraints,
    fixtures,
    ...(design
      ? { design: designContract(r.design, facts, rules, parts) }
      : {}),
  };
}
