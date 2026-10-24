// Several rule sets on one job (ADR-0066 Q11): values pass from earlier rule sets to later ones,
// and a part produced by more than one is flagged. How a flagged part is counted is each family's
// policy, so the engine never merges it.
import { tryRunRuleSet, type RunResult, type RunStopped } from "./evaluate";
import { RuleSetStop } from "./model";
import type { CheckedRuleSet } from "./validate";

export type JobStep = {
  /** Unique within the job, for example "control_house_2" when a rule set runs once per controller. */
  name: string;
  rule_set: CheckedRuleSet;
  inputs: Record<string, string>;
  /** Inputs taken from an earlier step's passed values. */
  receive: Record<string, { step: string; value: string }>;
};

export type JobResult = {
  steps: { name: string; rule_set: string; result: RunResult | RunStopped }[];
  shared_parts: { part: string; steps: string[] }[];
};

export function runTogether(steps: JobStep[]): JobResult {
  const names = new Set<string>();
  const done = new Map<string, RunResult | RunStopped>();
  const out: JobResult["steps"] = [];
  for (const step of steps) {
    if (names.has(step.name)) throw new RuleSetStop("STEP_DUPLICATE", `Step “${step.name}” appears twice in the job`);
    names.add(step.name);
    const inputs = { ...step.inputs };
    let result: RunResult | RunStopped | null = null;
    for (const [input, from] of Object.entries(step.receive)) {
      const source = done.get(from.step);
      if (!source) {
        result = { status: "Stopped", code: "STEP_ORDER", message: `${step.name} receives ${input} from ${from.step}, which has not run before it` };
        break;
      }
      if (source.status === "Stopped") {
        result = { status: "Stopped", code: "UPSTREAM_STOPPED", message: `${step.name} needs ${from.step}, which stopped: ${source.message}` };
        break;
      }
      if (!(from.value in source.passes)) {
        result = { status: "Stopped", code: "PASS_MISSING", message: `${from.step} does not pass a value called ${from.value}` };
        break;
      }
      inputs[input] = source.passes[from.value];
    }
    result ??= tryRunRuleSet(step.rule_set, inputs);
    done.set(step.name, result);
    out.push({ name: step.name, rule_set: step.rule_set.definition.key, result });
  }
  const producers = new Map<string, string[]>();
  for (const s of out)
    if (s.result.status === "Done")
      for (const line of s.result.lines) producers.set(line.part, [...(producers.get(line.part) ?? []), s.name]);
  const shared_parts = [...producers]
    .filter(([, by]) => by.length > 1)
    .map(([part, by]) => ({ part, steps: by }))
    .sort((a, b) => (a.part < b.part ? -1 : 1));
  return { steps: out, shared_parts };
}
