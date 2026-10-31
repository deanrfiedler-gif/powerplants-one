// Works out one case of a checked rule set with exact arithmetic.
import { CceError, Fraction } from "../expression";
import type { Node } from "./language";
import { brief, LIMITS, RuleSetStop, type Ordering, type RuleSetTable, type Trace } from "./model";
import { inputValueProblem, type CheckedRuleSet } from "./validate";

type Value = Fraction | string | boolean;

/** A value given for an input: text an engineer typed, or an exact number received from an earlier rule set. */
export type Given = string | Fraction;

export type RunLine = {
  part: string;
  description: string;
  unit: string;
  phase: "Materials" | "Labour";
  quantity: string;
  order_quantity: string;
  rules: string[];
};

export type RunResult = {
  status: "Done";
  values: Record<string, string>;
  passes: Record<string, string>;
  lines: RunLine[];
} & Trace;

/** A stopped case keeps what it had used, so coverage counts it; a job-level stop has no trace. */
export type RunStopped = { status: "Stopped"; code: string; message: string; trace?: Trace };

/** Steps left for every case in one test or job. */
export type Budget = { remaining: number };
export const newBudget = (): Budget => ({ remaining: LIMITS.totalSteps });

const ZERO = new Fraction(0n);

/** An exact decimal where one exists to 12 places, otherwise a fraction such as "1/3". */
export function show(v: Value): string {
  if (v instanceof Fraction) return v.exactDecimal(12) ?? `${v.numerator}/${v.denominator}`;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return v;
}

const cmp = (a: Fraction, b: Fraction) => {
  const l = a.numerator * b.denominator;
  const r = b.numerator * a.denominator;
  return l < r ? -1 : l > r ? 1 : 0;
};

const ceilFraction = (v: Fraction) => {
  const q = v.numerator / v.denominator;
  const r = v.numerator % v.denominator;
  return new Fraction(q + (r > 0n ? 1n : 0n));
};

export function orderQuantity(q: Fraction, ordering: Ordering): Fraction {
  if (ordering.kind === "AsCalculated") return q;
  if (ordering.kind === "Whole") return ceilFraction(q);
  const size = Fraction.fromDecimal(ordering.kind === "StockLength" ? ordering.length : ordering.size);
  return ceilFraction(q.divide(size)).multiply(size);
}

/** Runs one case; stops with a reason instead of guessing when something is missing. */
export function runRuleSet(checked: CheckedRuleSet, given: Record<string, Given>, budget: Budget = newBudget()): RunResult {
  const def = checked.definition;
  const values = new Map<string, Value>();
  const rowsRead = new Set<string>();
  const inputs: Trace["inputs"] = [];
  const applied: string[] = [];
  const chosen: Trace["chosen"] = [];
  const trace = (): Trace => ({
    inputs,
    applied,
    rows_read: [...rowsRead]
      .map((r) => {
        const [table, row] = r.split("\u0000");
        return { table, row: Number(row) };
      })
      .sort((a, b) => (a.table === b.table ? a.row - b.row : a.table < b.table ? -1 : 1)),
    chosen,
  });
  const tables = new Map<string, RuleSetTable>(def.tables.map((t) => [t.key, t]));
  const partMap = new Map(def.parts.map((p) => [p.key, p]));
  let steps = 0;
  let phase: "Materials" | "Labour" = "Materials";
  const materials = new Map<string, Fraction>();

  const stop = (code: string, message: string): never => {
    throw new RuleSetStop(code, message);
  };

  const step = () => {
    if (++steps > LIMITS.evaluationSteps) stop("COMPUTATION_LIMIT", "The case needs too many steps to work out");
    if (--budget.remaining < 0) stop("COMPUTATION_LIMIT", "The cases together need too many steps to work out");
  };

  const evaluate = (n: Node): Value => {
    step();
    switch (n.k) {
      case "number":
        return Fraction.fromDecimal(n.value);
      case "text":
        return n.value;
      case "yesno":
        return n.value;
      case "name":
        return values.has(n.name) ? values.get(n.name)! : stop("VALUE_MISSING", `“${n.name}” has no value`);
      case "negate":
        return (evaluate(n.a) as Fraction).negate();
      case "arith": {
        const a = evaluate(n.a) as Fraction;
        const b = evaluate(n.b) as Fraction;
        if (n.op === "/" && b.numerator === 0n) stop("DIVIDE_BY_ZERO", "A formula divides by zero");
        return n.op === "+" ? a.add(b) : n.op === "-" ? a.subtract(b) : n.op === "*" ? a.multiply(b) : a.divide(b);
      }
      case "compare": {
        const a = evaluate(n.a);
        const b = evaluate(n.b);
        if (a instanceof Fraction && b instanceof Fraction) {
          const c = cmp(a, b);
          return { "=": c === 0, "<>": c !== 0, "<": c < 0, "<=": c <= 0, ">": c > 0, ">=": c >= 0 }[n.op];
        }
        return n.op === "=" ? a === b : a !== b;
      }
      case "and":
        return (evaluate(n.a) as boolean) && (evaluate(n.b) as boolean);
      case "or":
        return (evaluate(n.a) as boolean) || (evaluate(n.b) as boolean);
      case "not":
        return !(evaluate(n.a) as boolean);
      case "call":
        return call(n);
    }
  };

  const call = (n: Extract<Node, { k: "call" }>): Value => {
    const args = n.args;
    switch (n.fn) {
      case "if":
        return evaluate(args[0]) ? evaluate(args[1]) : evaluate(args[2]);
      case "ceil":
      case "floor":
      case "round": {
        const v = evaluate(args[0]) as Fraction;
        let places = 0n;
        if (n.fn === "round" && args[1]) {
          const p = evaluate(args[1]) as Fraction;
          if (p.denominator !== 1n || p.numerator < 0n || p.numerator > 12n)
            stop("ROUND_PLACES", "round() places must be a whole number from 0 to 12");
          places = p.numerator;
        }
        const factor = 10n ** places;
        const num = v.numerator * factor;
        const den = v.denominator;
        const q = num / den;
        const r = num % den;
        const result =
          n.fn === "ceil"
            ? q + (r > 0n ? 1n : 0n)
            : n.fn === "floor"
              ? q - (r < 0n ? 1n : 0n)
              : q + ((r < 0n ? -r : r) * 2n >= den ? (num < 0n ? -1n : 1n) : 0n);
        return new Fraction(result, factor);
      }
      case "min":
      case "max": {
        const vals = args.map((a) => evaluate(a) as Fraction);
        return vals.reduce((best, v) => ((n.fn === "min" ? cmp(v, best) < 0 : cmp(v, best) > 0) ? v : best));
      }
      case "lookup": {
        const table = tables.get((args[0] as { value: string }).value)!;
        const column = (args[1] as { value: string }).value;
        const keys = args.slice(2).map(evaluate);
        const types = new Map(table.columns.map((c) => [c.key, c.type]));
        for (let i = 0; i < table.rows.length; i++) {
          step();
          const row = table.rows[i];
          const hit = table.keys.every((k, idx) => {
            const want = keys[idx];
            if (types.get(k.column) === "Text") return row[k.column] === want;
            const c = cmp(Fraction.fromDecimal(row[k.column]), want as Fraction);
            return k.match === "Exact" ? c === 0 : k.match === "AtLeast" ? c >= 0 : c <= 0;
          });
          if (hit) {
            rowsRead.add(`${table.key}\u0000${i}`);
            return types.get(column) === "Number" ? Fraction.fromDecimal(row[column]) : row[column];
          }
        }
        return stop(
          "LOOKUP_NO_ROW",
          `${table.label} has no row for ${table.keys.map((k, i) => `${k.column} ${k.match === "AtLeast" ? "at or above " : k.match === "AtMost" ? "at or below " : ""}${show(keys[i])}`).join(", ")}`,
        );
      }
      case "qty":
        return materials.get((args[0] as { value: string }).value) ?? ZERO;
      case "minutes": {
        const group = args[0] ? (args[0] as { value: string }).value : null;
        let total = ZERO;
        for (const [part, q] of materials) {
          const p = partMap.get(part)!;
          if (group === null || p.group === group) total = total.add(q.multiply(Fraction.fromDecimal(p.install_minutes)));
        }
        return total;
      }
    }
  };

  try {
    // 1. Inputs, in order, so that asked_when can read earlier inputs.
    const known = new Set(def.inputs.map((i) => i.key));
    for (const k of Object.keys(given)) if (!known.has(k)) stop("INPUT_UNKNOWN", `“${brief(k)}” is not an input of this rule set`);
    for (const input of def.inputs) {
      const askedWhen = checked.asked.get(input.key);
      const asked = askedWhen ? (evaluate(askedWhen.tree) as boolean) : true;
      let raw: Given;
      let from: "Given" | "Default";
      // Only a missing value falls back to the default; a value of the wrong kind stops the case.
      if (asked && Object.hasOwn(given, input.key) && given[input.key] !== undefined) {
        raw = given[input.key];
        from = "Given";
        if (typeof raw !== "string" && !(raw instanceof Fraction)) stop("INPUT_INVALID", `${input.label} must be given as text`);
      } else if ((!asked || !input.required) && input.default !== null) {
        raw = input.default;
        from = "Default";
      } else {
        return stop("INPUT_MISSING", `${input.label} is required`);
      }
      const problem = inputValueProblem(input, raw);
      if (problem) stop("INPUT_INVALID", `${input.label} ${problem}`);
      const value = raw instanceof Fraction ? raw : input.type === "YesNo" ? raw === "Yes" : input.type === "Choice" ? raw : Fraction.fromDecimal(raw);
      values.set(input.key, value);
      inputs.push({ key: input.key, value: typeof raw === "string" ? raw : show(raw), asked, from });
    }

    // 2. Derived values in list order.
    const derivedOut = Object.create(null) as Record<string, string>;
    for (const d of def.derived) {
      const v = evaluate(checked.derived.get(d.key)!.tree);
      values.set(d.key, v);
      derivedOut[d.key] = show(v);
    }
    const passes = Object.create(null) as Record<string, string>;
    for (const p of def.passes) passes[p.key] = show(evaluate(checked.passes.get(p.key)!.tree));

    // 3. Materials rules, then Labour rules, each in list order.
    const lineQty = new Map<string, Fraction>();
    const lineRules = new Map<string, string[]>();
    const linePhase = new Map<string, "Materials" | "Labour">();
    for (const current of ["Materials", "Labour"] as const) {
      phase = current;
      for (const rule of def.rules.filter((r) => r.phase === current)) {
        const c = checked.rules.get(rule.key)!;
        if (!(evaluate(c.when.tree) as boolean)) continue;
        applied.push(rule.key);
        const part = rule.part ?? (evaluate(c.choose!.tree) as string);
        if (!partMap.has(part)) stop("CHOSEN_PART_UNKNOWN", `Rule ${rule.key} chose “${brief(part)}”, which is not a part of this rule set`);
        chosen.push({ rule: rule.key, part });
        const q = evaluate(c.quantity.tree) as Fraction;
        if (q.numerator < 0n) stop("QUANTITY_NEGATIVE", `Rule ${rule.key} gave a negative quantity (${show(q)})`);
        if (q.numerator === 0n) continue;
        lineQty.set(part, (lineQty.get(part) ?? ZERO).add(q));
        lineRules.set(part, [...(lineRules.get(part) ?? []), rule.key]);
        if (!linePhase.has(part)) linePhase.set(part, phase);
        if (phase === "Materials") materials.set(part, (materials.get(part) ?? ZERO).add(q));
      }
    }

    const lines: RunLine[] = def.parts
      .filter((p) => lineQty.has(p.key))
      .map((p) => ({
        part: p.key,
        description: p.description,
        unit: p.unit,
        phase: linePhase.get(p.key)!,
        quantity: show(lineQty.get(p.key)!),
        order_quantity: show(orderQuantity(lineQty.get(p.key)!, p.ordering)),
        rules: lineRules.get(p.key)!,
      }));
    return { status: "Done", values: derivedOut, passes, lines, ...trace() };
  } catch (e) {
    const stopped = e instanceof CceError ? new RuleSetStop(e.code, e.message) : e;
    if (stopped instanceof RuleSetStop) {
      stopped.trace = trace();
      throw stopped;
    }
    throw e;
  }
}

/** Runs one case and reports a stop as a result rather than an error. */
export function tryRunRuleSet(
  checked: CheckedRuleSet,
  given: Record<string, Given>,
  budget: Budget = newBudget(),
): RunResult | RunStopped {
  try {
    return runRuleSet(checked, given, budget);
  } catch (e) {
    if (e instanceof RuleSetStop) return { status: "Stopped", code: e.code, message: e.message, ...(e.trace ? { trace: e.trace } : {}) };
    throw e;
  }
}
