import { Worker } from "node:worker_threads";
import { resolve } from "node:path";
import { AppError } from "../platform/errors";
import type { Calculation, CalculationInput, Definition } from "./types";
import type { testDefinition } from "./engine";
import { LIMITS as RULE_SET_LIMITS } from "./rule-sets/model";

function run<T>(data: unknown): Promise<T> {
  return new Promise((resolveResult, reject) => {
    const worker = new Worker(resolve("scripts/cpq-worker.mjs"), {
      workerData: data,
      resourceLimits: {
        maxOldGenerationSizeMb: 64,
        maxYoungGenerationSizeMb: 16,
        stackSizeMb: 4,
      },
    });
    let settled = false;
    const finish = (value?: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      if (value !== undefined) resolveResult(value);
      else
        reject(
          new AppError(
            422,
            "CalculationLimit",
            "The calculation failed or exceeded its execution budget. Simplify the release and retry.",
          ),
        );
    };
    const timer = setTimeout(() => finish(), 5000);
    worker.once("message", (m: { value?: T; error?: string }) =>
      finish(m.value),
    );
    worker.once("error", () => finish());
    worker.once("exit", () => finish());
  });
}
export const calculateIsolated = (
  definition: Definition,
  input: CalculationInput,
) => run<Calculation>({ kind: "calculate", definition, input });
export const testIsolated = (definition: Definition) =>
  run<ReturnType<typeof testDefinition>>({ kind: "fixtures", definition });
export const packageIsolated = (content: import("./package-model").PackageContent) =>
  run<ReturnType<typeof import("./package-model").measurePackage>>({kind:"package",content});
// Configuration rule sets (ADR-0066): definitions arrive as untrusted data and are checked in the worker.
type RuleSetWork = import("./rule-sets/entry").RuleSetWork;
type RuleSetWorkResult = import("./rule-sets/entry").RuleSetWorkResult;
// The worker's memory limit does not cover copying a request into it: an 80 MB input value aborted the
// whole process in a probe for the PR #688 review (F9). So a request is measured here first.
const ruleSetRun = (work: RuleSetWork) => {
  let size: number;
  try {
    size = JSON.stringify(work)?.length ?? 0;
  } catch {
    size = Infinity;
  }
  if (size > RULE_SET_LIMITS.requestCharacters)
    return Promise.reject(
      new AppError(422, "PayloadTooLarge", "The rule set request is too large or is not plain data. Reduce its size and retry."),
    );
  return run<RuleSetWorkResult>(work);
};
export const ruleSetTestIsolated = (definition: unknown) => ruleSetRun({ kind: "rule-set-test", definition });
export const ruleSetRunIsolated = (definition: unknown, inputs: Record<string, string>) =>
  ruleSetRun({ kind: "rule-set-run", definition, inputs });
export const ruleSetJobIsolated = (steps: Extract<RuleSetWork, { kind: "rule-set-job" }>["steps"]) =>
  ruleSetRun({ kind: "rule-set-job", steps });
export const qualityIsolated = (work: import("./quality-model").QualityWork) =>
  run<ReturnType<typeof import("./quality-model").qualityResults>>({ kind: "quality", work });
export const rebaseIsolated = (
  definition: Definition,
  input: CalculationInput,
  parentDefinition: Definition,
  prior: import("./types").Override[],
  decisions: import("./rebase-model").RebaseDecision[],
) =>
  run<ReturnType<typeof import("./rebase-model").evaluateRebase>>({
    kind: "rebase",
    definition,
    input,
    parentDefinition,
    prior,
    decisions,
  });
