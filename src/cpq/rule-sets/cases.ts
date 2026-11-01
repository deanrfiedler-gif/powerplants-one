// Reference cases: expected values from outside the rules (ADR-0066 Q3), compared line by line.
import { coverage, type Finding } from "./coverage";
import { newBudget, tryRunRuleSet, type Budget, type RunResult, type RunStopped } from "./evaluate";
import { RuleSetInvalid, type Issue, type ReferenceCase } from "./model";
import { exactValue, validateRuleSet, type CheckedRuleSet } from "./validate";

export type LineComparison = { part: string; expected: string; got: string; match: boolean };
export type ValueComparison = { key: string; expected: string; got: string; match: boolean };

export type CaseResult = {
  key: string;
  label: string;
  source: string;
  status: "Pass" | "Fail";
  run: RunResult | RunStopped;
  lines: LineComparison[];
  values: ValueComparison[];
  expected_stop: string | null;
};

export type RuleSetTest =
  | {
      valid: true;
      rule_set: string;
      summary: { cases: number; passed: number; failed: number; lines: number; lines_matched: number; blocking: number; warnings: number };
      cases: CaseResult[];
      coverage: Finding[];
    }
  | { valid: false; issues: Issue[] };

export { exactValue };

/** Two shown numbers are the same when they are equal exactly ("6.10" and "6.1"); anything else must match as written. */
export function sameValue(a: string, b: string): boolean {
  const x = exactValue(a);
  const y = exactValue(b);
  if (x && y) return x.numerator === y.numerator && x.denominator === y.denominator;
  return a === b;
}

export function compareCase(checked: CheckedRuleSet, c: ReferenceCase, budget: Budget = newBudget()): CaseResult {
  const run = tryRunRuleSet(checked, c.inputs, budget);
  const base = { key: c.key, label: c.label, source: c.source, run };
  if ("stop" in c.expected) {
    const match = run.status === "Stopped" && run.code === c.expected.stop;
    return { ...base, status: match ? "Pass" : "Fail", lines: [], values: [], expected_stop: c.expected.stop };
  }
  if (run.status === "Stopped") return { ...base, status: "Fail", lines: [], values: [], expected_stop: null };
  const got = new Map(run.lines.map((l) => [l.part, l.quantity]));
  const expected = new Map(c.expected.lines.map((l) => [l.part, l.quantity]));
  const parts = checked.definition.parts.map((p) => p.key).filter((k) => got.has(k) || expected.has(k));
  const lines = parts.map((part) => {
    const e = expected.get(part) ?? "0";
    const g = got.get(part) ?? "0";
    return { part, expected: e, got: g, match: sameValue(e, g) };
  });
  const values = Object.entries(c.expected.values).map(([key, e]) => {
    const g = run.values[key];
    // Only a Number compares by value: Text such as "01" and "1" are different codes, and YesNo is Yes or No.
    return { key, expected: e, got: g, match: checked.types.get(key) === "Number" ? sameValue(e, g) : e === g };
  });
  const pass = lines.every((l) => l.match) && values.every((v) => v.match);
  return { ...base, status: pass ? "Pass" : "Fail", lines, values, expected_stop: null };
}

/** Checks a rule set, runs every reference case and the coverage checks: what saving a draft shows. */
export function testRuleSet(raw: unknown): RuleSetTest {
  let checked: CheckedRuleSet;
  try {
    checked = validateRuleSet(raw);
  } catch (e) {
    if (e instanceof RuleSetInvalid) return { valid: false, issues: e.issues };
    throw e;
  }
  const budget = newBudget();
  const cases = checked.definition.reference_cases.map((c) => compareCase(checked, c, budget));
  const findings = coverage(checked, cases);
  const lines = cases.flatMap((c) => c.lines);
  return {
    valid: true,
    rule_set: checked.definition.key,
    summary: {
      cases: cases.length,
      passed: cases.filter((c) => c.status === "Pass").length,
      failed: cases.filter((c) => c.status === "Fail").length,
      lines: lines.length,
      lines_matched: lines.filter((l) => l.match).length,
      blocking: findings.filter((f) => f.severity === "Blocking").length,
      warnings: findings.filter((f) => f.severity === "Warning").length,
    },
    cases,
    coverage: findings,
  };
}
