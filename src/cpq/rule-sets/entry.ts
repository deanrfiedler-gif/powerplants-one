// The rule set work the isolated CPQ worker runs. Rule content arrives as data and is checked here,
// inside the worker's memory and time limits, before anything is worked out.
import { testRuleSet, type RuleSetTest } from "./cases";
import { tryRunRuleSet, type RunResult, type RunStopped } from "./evaluate";
import { brief, KEY, LIMITS, RuleSetInvalid, RuleSetStop, type Issue } from "./model";
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

/**
 * Checks supplied input values without dropping any: a value of the wrong kind is reported here, and a
 * name that is not an input reaches the case and stops it with INPUT_UNKNOWN. Paths echo at most a short
 * part of an untrusted name, so the result stays small whatever was sent.
 */
function inputIssues(v: unknown, path: string): Issue[] {
  if (v === undefined) return [];
  if (!isObject(v)) return [{ path, code: "SHAPE", message: "Expected an object of input values" }];
  const entries = Object.entries(v);
  if (entries.length > LIMITS.inputs) return [{ path, code: "LIMIT", message: `At most ${LIMITS.inputs} input values` }];
  const issues: Issue[] = [];
  for (const [k, x] of entries) {
    if (x === undefined) continue;
    if (typeof x !== "string") issues.push({ path: `${path}.${brief(k)}`, code: "SHAPE", message: "Expected text" });
    else if (x.length > LIMITS.text) issues.push({ path: `${path}.${brief(k)}`, code: "LIMIT", message: `At most ${LIMITS.text} characters` });
  }
  return issues;
}

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
    issues.push(...inputIssues(s.inputs, `${p}.inputs`));
    if (s.receive !== undefined && !isObject(s.receive)) issues.push({ path: `${p}.receive`, code: "SHAPE", message: "Expected an object" });
    else if (Object.keys(s.receive ?? {}).length > LIMITS.inputs)
      issues.push({ path: `${p}.receive`, code: "LIMIT", message: `At most ${LIMITS.inputs} received values` });
    else
      for (const [k, v] of Object.entries(s.receive ?? {}))
        if (!isObject(v) || typeof v.step !== "string" || typeof v.value !== "string" || !KEY.test(v.step) || !KEY.test(v.value))
          issues.push({ path: `${p}.receive.${brief(k)}`, code: "SHAPE", message: "Expected the step and the passed value it comes from" });
  });
  return issues;
}

/** An own copy with no prototype, so every supplied name is an ordinary key. */
const own = <T>(v: Record<string, T> | undefined): Record<string, T> => Object.assign(Object.create(null), v ?? {}) as Record<string, T>;

export function ruleSetWork(work: RuleSetWork): RuleSetWorkResult {
  try {
    switch (work.kind) {
      case "rule-set-test":
        return testRuleSet(work.definition);
      case "rule-set-run": {
        const shape = inputIssues(work.inputs, "inputs");
        if (shape.length) return { valid: false, issues: shape };
        return { valid: true, result: tryRunRuleSet(validateRuleSet(work.definition), own(work.inputs)) };
      }
      case "rule-set-job": {
        const shape = jobIssues(work.steps);
        if (shape.length) return { valid: false, issues: shape };
        const steps = work.steps.map((s) => {
          try {
            return { name: s.name, rule_set: validateRuleSet(s.definition), inputs: own(s.inputs), receive: own(s.receive) };
          } catch (e) {
            if (e instanceof RuleSetInvalid) throw Object.assign(e, { step: s.name });
            throw e;
          }
        });
        return { valid: true, job: runTogether(steps) };
      }
      default:
        // Every other request is refused, never treated as one of the three.
        return { valid: false, issues: [{ path: "kind", code: "KIND", message: "Use rule-set-test, rule-set-run or rule-set-job" }] };
    }
  } catch (e) {
    if (e instanceof RuleSetInvalid) return { valid: false, issues: e.issues, step: (e as RuleSetInvalid & { step?: string }).step };
    if (e instanceof RuleSetStop) return { valid: true, job: { status: "Stopped", code: e.code, message: e.message } };
    throw e;
  }
}
