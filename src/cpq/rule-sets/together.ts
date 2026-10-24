// Several rule sets on one job (ADR-0066 Q11): values pass from earlier rule sets to later ones,
// and a part produced by more than one is flagged. How a flagged part is counted is each family's
// policy, so the engine never merges it.
import { newBudget, tryRunRuleSet, type Given, type RunResult, type RunStopped } from "./evaluate";
import { brief, LIMITS, RuleSetStop } from "./model";
import { exactValue, inputValueType, type CheckedRuleSet } from "./validate";

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
  if (steps.length > LIMITS.jobSteps) throw new RuleSetStop("STEP_LIMIT", `A job can have at most ${LIMITS.jobSteps} steps`);
  const names = new Set<string>();
  const done = new Map<string, RunResult | RunStopped>();
  const out: JobResult["steps"] = [];
  const budget = newBudget();
  for (const step of steps) {
    if (names.has(step.name)) throw new RuleSetStop("STEP_DUPLICATE", `Step “${step.name}” appears twice in the job`);
    names.add(step.name);
    // No prototype, so a received name such as "__proto__" is an ordinary key and is refused as unknown.
    const inputs = Object.assign(Object.create(null), step.inputs) as Record<string, Given>;
    const declared = new Map(step.rule_set.definition.inputs.map((i) => [i.key, i]));
    let result: RunResult | RunStopped | null = null;
    for (const [input, from] of Object.entries(step.receive)) {
      const target = declared.get(input);
      if (!target) {
        result = { status: "Stopped", code: "INPUT_UNKNOWN", message: `${step.name} receives “${brief(input)}”, which is not an input of its rule set` };
        break;
      }
      const source = done.get(from.step);
      if (!source) {
        result = { status: "Stopped", code: "STEP_ORDER", message: `${step.name} receives ${input} from ${brief(from.step)}, which has not run before it` };
        break;
      }
      if (source.status === "Stopped") {
        result = { status: "Stopped", code: "UPSTREAM_STOPPED", message: `${step.name} needs ${from.step}, which stopped: ${source.message}` };
        break;
      }
      if (!Object.hasOwn(source.passes, from.value)) {
        result = { status: "Stopped", code: "PASS_MISSING", message: `${from.step} does not pass a value called ${brief(from.value)}` };
        break;
      }
      // A number passes exactly, so one third reaches the receiving rule set as one third, not a rounded decimal.
      const passed = source.passes[from.value];
      inputs[input] = inputValueType(target) === "Number" ? (exactValue(passed) ?? passed) : passed;
    }
    result ??= tryRunRuleSet(step.rule_set, inputs, budget);
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
