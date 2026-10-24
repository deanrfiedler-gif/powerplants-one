// Turns untrusted JSON into a checked, frozen rule set, or refuses it with every problem found.
import { Fraction } from "../expression";
import { compile, FormulaError, type Compiled, type Scope } from "./language";
import {
  DECIMAL,
  KEY,
  LIMITS,
  PART_KEY,
  RESERVED,
  RuleSetInvalid,
  type Issue,
  type Ordering,
  type ReferenceCase,
  type RuleSetDefinition,
  type RuleSetDerived,
  type RuleSetInput,
  type RuleSetPart,
  type RuleSetRule,
  type RuleSetTable,
  type ValueType,
} from "./model";

export type CompiledRule = Readonly<{
  when: Compiled;
  choose: Compiled | null;
  quantity: Compiled;
}>;

export type CheckedRuleSet = Readonly<{
  definition: RuleSetDefinition;
  derived: ReadonlyMap<string, Compiled>;
  asked: ReadonlyMap<string, Compiled>;
  rules: ReadonlyMap<string, CompiledRule>;
  passes: ReadonlyMap<string, Compiled>;
  types: ReadonlyMap<string, ValueType>;
}>;

type Raw = Record<string, unknown>;
const isObject = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);

export const inputValueType = (i: Pick<RuleSetInput, "type">): ValueType =>
  i.type === "YesNo" ? "YesNo" : i.type === "Choice" ? "Text" : "Number";

const compareDecimal = (a: string, b: string) => {
  const x = Fraction.fromDecimal(a);
  const y = Fraction.fromDecimal(b);
  const l = x.numerator * y.denominator;
  const r = y.numerator * x.denominator;
  return l < r ? -1 : l > r ? 1 : 0;
};

/** Checks a value an engineer typed for an input; returns a reason or null. */
export function inputValueProblem(input: RuleSetInput, value: string): string | null {
  if (input.type === "YesNo") return value === "Yes" || value === "No" ? null : "must be Yes or No";
  if (input.type === "Choice") return input.choices.includes(value) ? null : `“${value}” is not one of its options`;
  if (!DECIMAL.test(value)) return "must be a number";
  if (input.type === "WholeNumber" && value.includes(".") && !/\.0+$/.test(value)) return "must be a whole number";
  if (input.minimum !== null && compareDecimal(value, input.minimum) < 0) return `is below its minimum of ${input.minimum}`;
  if (input.maximum !== null && compareDecimal(value, input.maximum) > 0) return `is above its maximum of ${input.maximum}`;
  return null;
}

export function validateRuleSet(raw: unknown): CheckedRuleSet {
  const issues: Issue[] = [];
  const add = (path: string, code: string, message: string) => issues.push({ path, code, message });

  let json = "";
  try {
    json = JSON.stringify(raw) ?? "";
  } catch {
    throw new RuleSetInvalid([{ path: "", code: "SHAPE", message: "The rule set is not plain data" }]);
  }
  // PostgreSQL text cannot hold a NUL character, so it is refused here rather than failing on save.
  // JSON escapes NUL as \u0000; an even run of backslashes before it is typed text, not a NUL.
  if (/(?<!\\)(?:\\\\)*\\u0000/.test(json))
    throw new RuleSetInvalid([{ path: "", code: "SHAPE", message: "Text cannot contain a NUL character" }]);
  const size = Buffer.byteLength(json, "utf8");
  if (size > LIMITS.bytes)
    throw new RuleSetInvalid([{ path: "", code: "LIMIT", message: `The rule set is ${size} bytes; the limit is ${LIMITS.bytes}` }]);
  if (!isObject(raw)) throw new RuleSetInvalid([{ path: "", code: "SHAPE", message: "Expected a rule set object" }]);

  const text = (v: unknown, path: string, opts: { empty?: boolean; max?: number } = {}): string => {
    if (typeof v !== "string") {
      add(path, "SHAPE", "Expected text");
      return "";
    }
    if (!opts.empty && v.trim() === "") add(path, "REQUIRED", "Must not be empty");
    if (v.length > (opts.max ?? LIMITS.text)) add(path, "LIMIT", `At most ${opts.max ?? LIMITS.text} characters`);
    return v;
  };
  const list = (v: unknown, path: string, max: number): unknown[] => {
    if (!Array.isArray(v)) {
      add(path, "SHAPE", "Expected a list");
      return [];
    }
    if (v.length > max) add(path, "LIMIT", `At most ${max} entries`);
    return v.slice(0, max);
  };
  const decimal = (v: unknown, path: string, opts: { positive?: boolean; nonNegative?: boolean } = {}): string | null => {
    if (typeof v !== "string" || !DECIMAL.test(v)) {
      add(path, "DECIMAL", "Expected a number written as text, such as \"6.1\"");
      return null;
    }
    if (opts.positive && compareDecimal(v, "0") <= 0) add(path, "DECIMAL", "Must be more than zero");
    if (opts.nonNegative && compareDecimal(v, "0") < 0) add(path, "DECIMAL", "Must not be negative");
    return v;
  };
  const keyed = <T>(items: unknown[], path: string, pattern: RegExp, seen: Map<string, string>, build: (o: Raw, p: string, key: string) => T): T[] =>
    items.flatMap((item, idx) => {
      const p = `${path}[${idx}]`;
      if (!isObject(item)) {
        add(p, "SHAPE", "Expected an object");
        return [];
      }
      const key = typeof item.key === "string" ? item.key : "";
      if (!pattern.test(key)) add(`${p}.key`, "KEY", `“${key}” is not a valid key`);
      else if (seen.has(key)) add(`${p}.key`, "DUPLICATE", `“${key}” is already used by ${seen.get(key)}`);
      else seen.set(key, p);
      return [build(item, p, key)];
    });

  if (raw.schema_version !== 5) add("schema_version", "SCHEMA", "Rule sets use definition schema 5");
  if (raw.kind !== "RuleSet") add("kind", "SCHEMA", "Expected kind “RuleSet”");
  const key = text(raw.key, "key");
  if (!KEY.test(key)) add("key", "KEY", `“${key}” is not a valid key`);
  const label = text(raw.label, "label");
  const family = text(raw.family, "family");

  // Inputs, derived values and tables share one namespace.
  const names = new Map<string, string>();

  const inputs: RuleSetInput[] = keyed(list(raw.inputs, "inputs", LIMITS.inputs), "inputs", KEY, names, (o, p, k) => {
    const type = o.type as RuleSetInput["type"];
    if (!["Number", "WholeNumber", "YesNo", "Choice"].includes(type))
      add(`${p}.type`, "TYPE", "Use Number, WholeNumber, YesNo or Choice");
    const choices = list(o.choices, `${p}.choices`, LIMITS.choices).map((c, i) => text(c, `${p}.choices[${i}]`));
    if (type === "Choice") {
      if (choices.length < 2) add(`${p}.choices`, "CHOICES", "A choice needs at least two options");
      if (new Set(choices).size !== choices.length) add(`${p}.choices`, "DUPLICATE", "Options must be different");
    } else if (choices.length) add(`${p}.choices`, "CHOICES", "Only Choice inputs have options");
    const numeric = type === "Number" || type === "WholeNumber";
    const bound = (v: unknown, at: string) => {
      if (v === null || v === undefined) return null;
      if (!numeric) {
        add(at, "BOUND", "Only number inputs have a minimum or maximum");
        return null;
      }
      return decimal(v, at);
    };
    const minimum = bound(o.minimum, `${p}.minimum`);
    const maximum = bound(o.maximum, `${p}.maximum`);
    if (minimum !== null && maximum !== null && compareDecimal(minimum, maximum) > 0)
      add(`${p}.maximum`, "BOUND", "The maximum is below the minimum");
    const input: RuleSetInput = {
      key: k,
      label: text(o.label, `${p}.label`),
      question: text(o.question, `${p}.question`),
      unit: text(o.unit ?? "", `${p}.unit`, { empty: true, max: 40 }),
      type,
      choices,
      minimum,
      maximum,
      default: o.default === null || o.default === undefined ? null : text(o.default, `${p}.default`),
      required: o.required === true,
      asked_when: o.asked_when === null || o.asked_when === undefined ? null : text(o.asked_when, `${p}.asked_when`, { max: LIMITS.formulaCharacters }),
    };
    if (typeof o.required !== "boolean") add(`${p}.required`, "SHAPE", "Expected true or false");
    if (input.default !== null && ["Number", "WholeNumber", "YesNo", "Choice"].includes(type)) {
      const problem = inputValueProblem(input, input.default);
      if (problem) add(`${p}.default`, "DEFAULT", `The default ${problem}`);
    }
    if (input.asked_when !== null && input.default === null)
      add(`${p}.default`, "DEFAULT", "An input that is only sometimes asked needs a default for when it is not asked");
    else if (!input.required && input.default === null)
      add(`${p}.default`, "DEFAULT", "An optional input needs a default for when no value is given");
    return input;
  });

  const derivedRaw: RuleSetDerived[] = keyed(list(raw.derived, "derived", LIMITS.derived), "derived", KEY, names, (o, p, k) => ({
    key: k,
    label: text(o.label, `${p}.label`),
    unit: text(o.unit ?? "", `${p}.unit`, { empty: true, max: 40 }),
    formula: text(o.formula, `${p}.formula`, { max: LIMITS.formulaCharacters }),
  }));

  const brokenTables = new Set<string>();
  const tables: RuleSetTable[] = keyed(list(raw.tables, "tables", LIMITS.tables), "tables", KEY, names, (o, p, k) => {
    const before = issues.length;
    const colSeen = new Map<string, string>();
    const columns = keyed(list(o.columns, `${p}.columns`, LIMITS.columns), `${p}.columns`, KEY, colSeen, (c, cp, ck) => {
      if (c.type !== "Number" && c.type !== "Text") add(`${cp}.type`, "TYPE", "Use Number or Text");
      return { key: ck, type: c.type as "Number" | "Text" };
    });
    if (!columns.length) add(`${p}.columns`, "REQUIRED", "A table needs at least one column");
    const keyCols = new Set<string>();
    const keys = list(o.keys, `${p}.keys`, LIMITS.columns).flatMap((kk, i) => {
      const kp = `${p}.keys[${i}]`;
      if (!isObject(kk)) {
        add(kp, "SHAPE", "Expected an object");
        return [];
      }
      const column = typeof kk.column === "string" ? kk.column : "";
      const col = columns.find((c) => c.key === column);
      if (!col) add(`${kp}.column`, "TABLE", `There is no column “${column}”`);
      if (keyCols.has(column)) add(`${kp}.column`, "DUPLICATE", `“${column}” is already a key`);
      keyCols.add(column);
      const match = kk.match as "Exact" | "AtLeast" | "AtMost";
      if (!["Exact", "AtLeast", "AtMost"].includes(match)) add(`${kp}.match`, "TABLE", "Use Exact, AtLeast or AtMost");
      else if (match !== "Exact" && col?.type !== "Number") add(`${kp}.match`, "TABLE", "Only number columns can match a range");
      return [{ column, match }];
    });
    if (!keys.length) add(`${p}.keys`, "REQUIRED", "A table needs at least one key column");
    if (keys.filter((x) => x.match !== "Exact").length > 1)
      add(`${p}.keys`, "TABLE", "A table can have only one range key; split a grid into one table per exact value");
    if (keys.length >= columns.length && columns.length) add(`${p}.keys`, "TABLE", "A table needs a value column as well as its keys");
    const rows = list(o.rows, `${p}.rows`, LIMITS.rows).flatMap((r, i) => {
      const rp = `${p}.rows[${i}]`;
      if (!isObject(r)) {
        add(rp, "SHAPE", "Expected an object");
        return [];
      }
      // Rows have no prototype, so a column named like an Object property ("constructor") reads only its own value.
      const row = Object.create(null) as Record<string, string>;
      for (const c of columns) {
        const v = Object.hasOwn(r, c.key) ? r[c.key] : undefined;
        if (typeof v !== "string") add(`${rp}.${c.key}`, "TABLE", `Row ${i + 1} has no value for “${c.key}”`);
        else if (c.type === "Number" && !DECIMAL.test(v)) add(`${rp}.${c.key}`, "DECIMAL", `“${v}” is not a number`);
        else row[c.key] = v;
      }
      for (const extra of Object.keys(r)) if (!colSeen.has(extra)) add(`${rp}.${extra}`, "TABLE", `“${extra}” is not a column`);
      return [row];
    });
    if (!rows.length) add(`${p}.rows`, "REQUIRED", "A table needs at least one row");
    // Range keys are checked from the top, so they must run in order within each group of equal exact keys.
    for (const rk of keys.filter((x) => x.match !== "Exact")) {
      const exactCols = keys.filter((x) => x.match === "Exact").map((x) => x.column);
      const last = new Map<string, { value: string; row: number }>();
      rows.forEach((row, i) => {
        if (exactCols.some((c) => row[c] === undefined) || row[rk.column] === undefined) return;
        const group = JSON.stringify(exactCols.map((c) => row[c]));
        const prev = last.get(group);
        if (prev) {
          const cmp = compareDecimal(row[rk.column], prev.value);
          if ((rk.match === "AtLeast" && cmp <= 0) || (rk.match === "AtMost" && cmp >= 0))
            add(`${p}.rows[${i}].${rk.column}`, "TABLE_ORDER", `Rows must run ${rk.match === "AtLeast" ? "upwards" : "downwards"} in “${rk.column}”: row ${i + 1} is out of order after row ${prev.row + 1}`);
        }
        last.set(group, { value: row[rk.column], row: i });
      });
    }
    const table = { key: k, label: text(o.label, `${p}.label`), source: text(o.source, `${p}.source`), columns, keys, rows };
    if (issues.length !== before) brokenTables.add(k);
    return table;
  });

  for (const [name, path] of names)
    if (RESERVED.has(name)) add(`${path}.key`, "RESERVED", `“${name}” is a word the formula language uses; choose another key`);

  const partSeen = new Map<string, string>();
  const parts: RuleSetPart[] = keyed(list(raw.parts, "parts", LIMITS.parts), "parts", PART_KEY, partSeen, (o, p, k) => {
    const ord = isObject(o.ordering) ? o.ordering : {};
    let ordering: Ordering = { kind: "AsCalculated" };
    if (ord.kind === "AsCalculated" || ord.kind === "Whole") ordering = { kind: ord.kind };
    else if (ord.kind === "StockLength") ordering = { kind: "StockLength", length: decimal(ord.length, `${p}.ordering.length`, { positive: true }) ?? "1" };
    else if (ord.kind === "Pack") ordering = { kind: "Pack", size: decimal(ord.size, `${p}.ordering.size`, { positive: true }) ?? "1" };
    else add(`${p}.ordering.kind`, "ORDERING", "Use AsCalculated, Whole, StockLength or Pack");
    const group = typeof o.group === "string" ? o.group : "";
    if (!KEY.test(group)) add(`${p}.group`, "KEY", `“${group}” is not a valid group`);
    return {
      key: k,
      description: text(o.description, `${p}.description`),
      unit: text(o.unit, `${p}.unit`, { max: 40 }),
      group,
      ordering,
      install_minutes: decimal(o.install_minutes, `${p}.install_minutes`, { nonNegative: true }) ?? "0",
    };
  });

  const ruleSeen = new Map<string, string>();
  const rulesRaw: RuleSetRule[] = keyed(list(raw.rules, "rules", LIMITS.rules), "rules", KEY, ruleSeen, (o, p, k) => {
    const phase = o.phase as "Materials" | "Labour";
    if (phase !== "Materials" && phase !== "Labour") add(`${p}.phase`, "PHASE", "Use Materials or Labour");
    const part = o.part === null || o.part === undefined ? null : text(o.part, `${p}.part`);
    const choose = o.choose === null || o.choose === undefined ? null : text(o.choose, `${p}.choose`, { max: LIMITS.formulaCharacters });
    if ((part === null) === (choose === null)) add(p, "RULE_PART", "A rule has either a fixed part or a formula that chooses its part");
    if (part !== null && !partSeen.has(part)) add(`${p}.part`, "RULE_PART", `“${part}” is not a part of this rule set`);
    return {
      key: k,
      description: text(o.description, `${p}.description`),
      phase,
      when: text(o.when ?? "true", `${p}.when`, { max: LIMITS.formulaCharacters }),
      part,
      choose,
      quantity: text(o.quantity, `${p}.quantity`, { max: LIMITS.formulaCharacters }),
      unit: o.unit === null || o.unit === undefined ? null : text(o.unit, `${p}.unit`, { max: 40 }),
    };
  });

  // Compile every formula in the scope where it is written.
  const types = new Map<string, ValueType>();
  const choices = new Map<string, ReadonlySet<string>>();
  for (const i of inputs) if (i.type === "Choice") choices.set(i.key, new Set(i.choices));
  // A table with problems is reported above and left out, so formulas never read a half-checked table.
  const tableMap = new Map(tables.filter((t) => !brokenTables.has(t.key)).map((t) => [t.key, t]));
  const groups = new Set(parts.map((p) => p.group));
  const partKeys = new Set(parts.map((p) => p.key));
  const scope = (visible: Map<string, ValueType>, later: Iterable<string>, labour = false): Scope => ({
    names: visible,
    later: new Set(later),
    choices,
    tables: tableMap,
    parts: partKeys,
    groups,
    labour,
  });
  const tryCompile = (source: string, sc: Scope, path: string, expected?: Parameters<typeof compile>[2]): Compiled | null => {
    try {
      return compile(source, sc, expected);
    } catch (e) {
      if (e instanceof FormulaError) {
        add(path, e.code, e.message);
        return null;
      }
      throw e;
    }
  };

  const asked = new Map<string, Compiled>();
  const earlierInputs = new Map<string, ValueType>();
  inputs.forEach((input, idx) => {
    if (input.asked_when !== null) {
      const later = [...inputs.slice(idx).map((x) => x.key), ...derivedRaw.map((d) => d.key)];
      const c = tryCompile(input.asked_when, scope(new Map(earlierInputs), later), `inputs[${idx}].asked_when`, "YesNo");
      if (c) asked.set(input.key, c);
    }
    earlierInputs.set(input.key, inputValueType(input));
    types.set(input.key, inputValueType(input));
  });

  const derived = new Map<string, Compiled>();
  derivedRaw.forEach((d, idx) => {
    const later = derivedRaw.slice(idx).map((x) => x.key);
    const c = tryCompile(d.formula, scope(new Map(types), later), `derived[${idx}].formula`);
    if (c) {
      derived.set(d.key, c);
      types.set(d.key, c.type);
    }
  });

  const rules = new Map<string, CompiledRule>();
  rulesRaw.forEach((r, idx) => {
    const sc = scope(new Map(types), [], r.phase === "Labour");
    const when = tryCompile(r.when, sc, `rules[${idx}].when`, "YesNo");
    const choose = r.choose === null ? null : tryCompile(r.choose, sc, `rules[${idx}].choose`, "Text");
    const quantity = tryCompile(r.quantity, sc, `rules[${idx}].quantity`, "Number");
    if (when && quantity && (r.choose === null || choose)) rules.set(r.key, Object.freeze({ when, choose, quantity }));
  });

  const passSeen = new Map<string, string>();
  const passes = new Map<string, Compiled>();
  const passList = keyed(list(raw.passes ?? [], "passes", LIMITS.passes), "passes", KEY, passSeen, (o, p, k) => {
    const value = text(o.value, `${p}.value`, { max: LIMITS.formulaCharacters });
    const c = tryCompile(value, scope(new Map(types), []), `${p}.value`);
    if (c) passes.set(k, c);
    return { key: k, value };
  });

  const caseSeen = new Map<string, string>();
  const derivedKeys = new Set(derivedRaw.map((d) => d.key));
  const inputMap = new Map(inputs.map((i) => [i.key, i]));
  const cases: ReferenceCase[] = keyed(list(raw.reference_cases, "reference_cases", LIMITS.cases), "reference_cases", KEY, caseSeen, (o, p, k) => {
    const caseInputs = Object.create(null) as Record<string, string>;
    if (!isObject(o.inputs)) add(`${p}.inputs`, "SHAPE", "Expected an object of input values");
    else
      for (const [ik, iv] of Object.entries(o.inputs)) {
        const input = inputMap.get(ik);
        if (!input) add(`${p}.inputs.${ik}`, "CASE_INPUT", `“${ik}” is not an input`);
        else if (typeof iv !== "string") add(`${p}.inputs.${ik}`, "SHAPE", "Expected text");
        else {
          const problem = inputValueProblem(input, iv);
          if (problem) add(`${p}.inputs.${ik}`, "CASE_INPUT", `The value ${problem}`);
          caseInputs[ik] = iv;
        }
      }
    const exp = isObject(o.expected) ? o.expected : {};
    let expected: ReferenceCase["expected"];
    if (typeof exp.stop === "string") expected = { stop: exp.stop };
    else {
      const lineParts = new Set<string>();
      const lines = list(exp.lines, `${p}.expected.lines`, LIMITS.parts).flatMap((l, i) => {
        const lp = `${p}.expected.lines[${i}]`;
        if (!isObject(l)) {
          add(lp, "SHAPE", "Expected an object");
          return [];
        }
        const part = typeof l.part === "string" ? l.part : "";
        if (!partSeen.has(part)) add(`${lp}.part`, "CASE_LINE", `“${part}” is not a part of this rule set`);
        if (lineParts.has(part)) add(`${lp}.part`, "DUPLICATE", `“${part}” is listed twice`);
        lineParts.add(part);
        return [{ part, quantity: decimal(l.quantity, `${lp}.quantity`, { nonNegative: true }) ?? "0" }];
      });
      const values = Object.create(null) as Record<string, string>;
      if (exp.values !== undefined && !isObject(exp.values)) add(`${p}.expected.values`, "SHAPE", "Expected an object");
      else
        for (const [vk, vv] of Object.entries(exp.values ?? {})) {
          if (!derivedKeys.has(vk)) add(`${p}.expected.values.${vk}`, "CASE_VALUE", `“${vk}” is not a derived value`);
          else if (typeof vv !== "string") add(`${p}.expected.values.${vk}`, "SHAPE", "Expected text");
          else if (vv.length > LIMITS.text) add(`${p}.expected.values.${vk}`, "LIMIT", `At most ${LIMITS.text} characters`);
          else values[vk] = vv;
        }
      expected = { lines, values };
    }
    return { key: k, label: text(o.label, `${p}.label`), source: text(o.source, `${p}.source`), inputs: caseInputs, expected };
  });

  if (issues.length) throw new RuleSetInvalid(issues);

  const definition = deepFreeze<RuleSetDefinition>({
    schema_version: 5,
    kind: "RuleSet",
    key,
    label,
    family,
    inputs,
    derived: derivedRaw,
    tables,
    parts,
    rules: rulesRaw,
    reference_cases: cases,
    passes: passList,
  });
  return Object.freeze({ definition, derived, asked, rules, passes, types });
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null) {
    for (const v of Object.values(value)) deepFreeze(v);
    Object.freeze(value);
  }
  return value;
}
