// Fixed application entry point; rule content is data, never executable JavaScript.
import { workerData, parentPort } from "node:worker_threads";
import { register } from "tsx/esm/api";
register();
const { evaluate, testDefinition } = await import("../src/cpq/engine.ts");
try {
  parentPort.postMessage({
    value:
      typeof workerData.kind === "string" && workerData.kind.startsWith("rule-set-")
        ? (await import("../src/cpq/rule-sets/entry.ts")).ruleSetWork(workerData)
        : workerData.kind === "package"
        ? (await import("../src/cpq/package-model.ts")).measurePackage(workerData.content)
        : workerData.kind === "quality"
        ? (await import("../src/cpq/quality-model.ts")).qualityResults(workerData.work)
        : workerData.kind === "rebase"
        ? (await import("../src/cpq/rebase-model.ts")).evaluateRebase(
            workerData.definition,
            workerData.input,
            workerData.parentDefinition,
            workerData.prior,
            workerData.decisions,
          )
        : workerData.kind === "fixtures"
          ? testDefinition(workerData.definition)
          : evaluate(workerData.definition, workerData.input),
  });
} catch {
  parentPort.postMessage({ error: "CalculationFailed" });
}
