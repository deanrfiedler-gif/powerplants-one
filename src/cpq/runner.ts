import { Worker } from "node:worker_threads";
import { resolve } from "node:path";
import { AppError } from "../platform/errors";
import type { Calculation, CalculationInput, Definition } from "./types";
import type { testDefinition } from "./engine";

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
