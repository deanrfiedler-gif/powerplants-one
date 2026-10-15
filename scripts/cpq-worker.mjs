// Fixed application entry point; rule content is data, never executable JavaScript.
import { workerData, parentPort } from "node:worker_threads";
import { register } from "tsx/esm/api";
register();
const { evaluate, testDefinition } = await import("../src/cpq/engine.ts");
try {
  parentPort.postMessage({
    value:
      workerData.kind === "rebase"
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
