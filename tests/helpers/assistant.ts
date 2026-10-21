import { AdapterError, type AdapterRequest, type AdapterResult, type AssistantAdapter } from "../../src/assistant/model";

// A deterministic local test double. It records only in test memory and never calls a provider.
export function scripted(steps: (AdapterResult | AdapterError | "hang")[]): AssistantAdapter & { calls: AdapterRequest[] } {
  const calls: AdapterRequest[] = [];
  return {
    label: "Simulated", model: "simulated-1", calls,
    async answer(request, signal) {
      calls.push(structuredClone(request));
      const step = steps[calls.length - 1];
      if (step === "hang") return new Promise<AdapterResult>((_, reject) => {
        const abort = () => reject(new AdapterError("Timeout", null, true));
        if (signal.aborted) abort();
        else signal.addEventListener("abort", abort, { once: true });
      });
      if (!step) throw new Error("SYN scripted adapter exhausted");
      if (step instanceof AdapterError) throw step;
      return structuredClone(step);
    },
  };
}
