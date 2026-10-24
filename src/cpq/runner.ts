import { Worker } from "node:worker_threads";
import { resolve } from "node:path";
import { types } from "node:util";
import { AppError } from "../platform/errors";
import type { Calculation, CalculationInput, Definition } from "./types";
import type { testDefinition } from "./engine";
import { isPlainObject, LIMITS as RULE_SET_LIMITS } from "./rule-sets/model";

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
const refused = Symbol("refused");
/**
 * Copies a request as JSON-like data, counting JSON characters as it goes, and the copy is what the worker
 * receives. Measuring with JSON.stringify did not cover what structured cloning sends: a Map or buffer
 * measured as "{}" but arrived whole (follow-up review, F9-a). So anything but plain objects, arrays,
 * text, numbers, true/false and null is refused, as are accessors and proxies, which could give the copy
 * one value and the check another.
 */
function plainCopy(value: unknown): unknown {
  let size = 0;
  const count = (n: number) => {
    size += n;
    if (size > RULE_SET_LIMITS.requestCharacters) throw refused;
  };
  const field = (holder: object, key: string, depth: number) => {
    const d = Object.getOwnPropertyDescriptor(holder, key);
    if (d && !("value" in d)) throw refused;
    return copy(d?.value, depth);
  };
  const copy = (v: unknown, depth: number): unknown => {
    if (v === undefined || v === null || typeof v === "boolean") {
      count(5);
      return v;
    }
    if (typeof v === "string") {
      count(v.length + 2);
      return v;
    }
    if (typeof v === "number") {
      count(String(v).length);
      return v;
    }
    if (typeof v !== "object" || depth >= RULE_SET_LIMITS.requestDepth || types.isProxy(v)) throw refused;
    if (Array.isArray(v)) {
      if (Object.getPrototypeOf(v) !== Array.prototype) throw refused;
      count(v.length + 2);
      return Array.from({ length: v.length }, (_, i) => field(v, String(i), depth + 1));
    }
    if (!isPlainObject(v)) throw refused;
    // No prototype, so a name such as "__proto__" stays an ordinary name; the clone is an ordinary object.
    const out = Object.create(null) as Record<string, unknown>;
    count(2);
    for (const k of Object.keys(v)) {
      count(k.length + 4);
      out[k] = field(v, k, depth + 1);
    }
    return out;
  };
  return copy(value, 0);
}
const ruleSetRun = (work: RuleSetWork) => {
  let request: unknown;
  try {
    request = plainCopy(work);
  } catch {
    return Promise.reject(
      new AppError(422, "PayloadTooLarge", "The rule set request is too large or is not plain data. Reduce its size and retry."),
    );
  }
  return run<RuleSetWorkResult>(request);
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
