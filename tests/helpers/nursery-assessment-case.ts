import { randomUUID } from "node:crypto";
import {
  blankStudy,
  blankScenario,
  blankFact,
  type Fact,
} from "../../src/estimating/nursery-automation/model";
import {
  blankAssessment,
  blankStage,
  blankStageCase,
  blankConnection,
  type Check,
} from "../../src/estimating/nursery-automation/assessment-model";
import { catalogue } from "../../src/estimating/nursery-automation/catalogue";
export const documented = (value: string): Fact => ({
  ...blankFact(),
  knowledge: "SupplierDocumented",
  value,
  source: "SYN independent trial record",
});
export const na = (): Fact => ({
  ...blankFact(),
  knowledge: "NotApplicable",
  source: "SYN no applicable boundary",
});
export const reviewed = () => ({
  state: "Reviewed" as const,
  reviewer: "SYN engineer",
});
export const compatible = (c: Check): Check => ({
  ...c,
  state: "Compatible",
  source: "SYN exact configuration trial",
  review: reviewed(),
});
export function assessmentCase() {
  const source = blankStudy(),
    scenario = blankScenario(randomUUID());
  source.candidate_ids = [catalogue.entries[0].id];
  source.scenarios = [scenario];
  for (const key of ["crop", "container", "media", "quality"] as const)
    scenario.facts[key] = documented("SYN requirement");
  for (const [key, value] of Object.entries({
    diameter_mm: "100",
    height_mm: "120",
    filled_mass_kg: "2",
    target_good_pots: "13680",
    shift_minutes: "480",
    stops_minutes: "60",
    changeovers: "2",
    changeover_minutes: "30",
    staffing: "3",
  }))
    scenario.facts[key as keyof typeof scenario.facts] = documented(value);
  const input = blankAssessment(source);
  input.stages = (
    ["MediaSupply", "Dispensing", "Potting", "Planting", "TakeOff"] as const
  ).map((role) => ({
    ...blankStage(randomUUID()),
    name: "SYN " + role,
    role,
    candidate_id: role === "Potting" ? source.candidate_ids[0] : null,
    configuration: "SYN regional options A",
    configuration_evidence: compatible({
      aspect: "ExactConfiguration",
      state: "Unknown",
      source: null,
      review: { state: "Pending", reviewer: null },
      owner: null,
      action: null,
    }),
    technical_count: documented("1"),
    installation_count: documented("1"),
    spare_count: documented("0"),
    waste_count: documented("0"),
    pack_size: documented("1"),
    quantity_review: reviewed(),
  }));
  input.scenarios[0].good_fraction = documented("0.95");
  input.scenarios[0].stages = input.stages.map((s, i) => ({
    ...blankStageCase(s.id),
    rate: documented(["4000", "4000", "3200", "2400", "2800"][i]),
    operators: documented("1"),
    rate_review: reviewed(),
    checks: blankStageCase(s.id).checks.map(compatible),
    limits: blankStageCase(s.id).limits.map((l) => ({
      ...l,
      minimum: documented("0"),
      maximum: documented(l.dimension === "filled_mass_kg" ? "10" : "200"),
      review: reviewed(),
    })),
  }));
  input.connections = input.stages.slice(1).map((s, i) => {
    const c = blankConnection(randomUUID(), input.stages[i].id, s.id, [
      scenario.id,
    ]);
    return {
      ...c,
      checks: c.checks.map(compatible),
      buffer_positions: documented("240"),
      downstream_demand_per_minute: documented("40"),
    };
  });
  return { source, input, scenario };
}
