// The rule set work the isolated CPQ worker runs. Rule content arrives as data and is checked here,
// inside the worker's memory and time limits, before anything is worked out.
import { testRuleSet, type RuleSetTest } from "./cases";
import { tryRunRuleSet, type RunResult, type RunStopped } from "./evaluate";
import { RuleSetInvalid, RuleSetStop, type Issue } from "./model";
import { runTogether, type JobResult } from "./together";
import { validateRuleSet } from "./validate";

export type RuleSetWork =
  | { kind: "rule-set-test"; definition: unknown }
  | { kind: "rule-set-run"; definition: unknown; inputs: Record<string, string> }
  | {
      kind: "rule-set-job";
      steps: { name: string; definition: unknown; inputs: Record<string, string>; receive: Record<string, { step: string; value: string }> }[];
    };

export type RuleSetWorkResult =
  | RuleSetTest
  | { valid: true; result: RunResult | RunStopped }
  | { valid: true; job: JobResult | RunStopped }
  | { valid: false; issues: Issue[]; step?: string };

const strings = (v: unknown): Record<string, string> => {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return {};
  return Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === "string")) as Record<string, string>;
};

export function ruleSetWork(work: RuleSetWork): RuleSetWorkResult {
  if (work.kind === "rule-set-test") return testRuleSet(work.definition);
  try {
    if (work.kind === "rule-set-run") return { valid: true, result: tryRunRuleSet(validateRuleSet(work.definition), strings(work.inputs)) };
    const steps = work.steps.map((s) => {
      try {
        return { name: s.name, rule_set: validateRuleSet(s.definition), inputs: strings(s.inputs), receive: s.receive ?? {} };
      } catch (e) {
        if (e instanceof RuleSetInvalid) throw Object.assign(e, { step: s.name });
        throw e;
      }
    });
    return { valid: true, job: runTogether(steps) };
  } catch (e) {
    if (e instanceof RuleSetInvalid) return { valid: false, issues: e.issues, step: (e as RuleSetInvalid & { step?: string }).step };
    if (e instanceof RuleSetStop) return { valid: true, job: { status: "Stopped", code: e.code, message: e.message } };
    throw e;
  }
}
