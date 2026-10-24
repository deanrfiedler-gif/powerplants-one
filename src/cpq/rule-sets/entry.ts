// The rule set work the isolated CPQ worker runs. Rule content arrives as data and is checked here,
// inside the worker's memory and time limits, before anything is worked out.
import { testRuleSet, type RuleSetTest } from "./cases";
import { tryRunRuleSet, type RunResult, type RunStopped } from "./evaluate";
import { KEY, LIMITS, RuleSetInvalid, RuleSetStop, type Issue } from "./model";
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

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Checks the shape of a job before any rule set in it is read. */
function jobIssues(steps: unknown): Issue[] {
  if (!Array.isArray(steps)) return [{ path: "steps", code: "SHAPE", message: "Expected a list of steps" }];
  const issues: Issue[] = [];
  if (!steps.length) issues.push({ path: "steps", code: "REQUIRED", message: "A job needs at least one step" });
  if (steps.length > LIMITS.jobSteps) issues.push({ path: "steps", code: "LIMIT", message: `A job can have at most ${LIMITS.jobSteps} steps` });
  steps.slice(0, LIMITS.jobSteps).forEach((s, i) => {
    const p = `steps[${i}]`;
    if (!isObject(s)) {
      issues.push({ path: p, code: "SHAPE", message: "Expected an object" });
      return;
    }
    if (typeof s.name !== "string" || !KEY.test(s.name)) issues.push({ path: `${p}.name`, code: "KEY", message: "Each step needs a valid name" });
    if (s.receive !== undefined && !isObject(s.receive)) issues.push({ path: `${p}.receive`, code: "SHAPE", message: "Expected an object" });
    else
      for (const [k, v] of Object.entries(s.receive ?? {}))
        if (!isObject(v) || typeof v.step !== "string" || typeof v.value !== "string")
          issues.push({ path: `${p}.receive.${k}`, code: "SHAPE", message: "Expected the step and the passed value it comes from" });
  });
  return issues;
}

const strings = (v: unknown): Record<string, string> => {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return {};
  return Object.assign(Object.create(null), Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === "string"))) as Record<string, string>;
};

export function ruleSetWork(work: RuleSetWork): RuleSetWorkResult {
  if (work.kind === "rule-set-test") return testRuleSet(work.definition);
  try {
    if (work.kind === "rule-set-run") return { valid: true, result: tryRunRuleSet(validateRuleSet(work.definition), strings(work.inputs)) };
    const shape = jobIssues(work.steps);
    if (shape.length) return { valid: false, issues: shape };
    const steps = work.steps.map((s) => {
      try {
        const receive = Object.assign(Object.create(null), s.receive ?? {}) as typeof s.receive;
        return { name: s.name, rule_set: validateRuleSet(s.definition), inputs: strings(s.inputs), receive };
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
