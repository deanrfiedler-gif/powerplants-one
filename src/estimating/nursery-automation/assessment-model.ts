import { blankFact, type Fact, type Study } from "./model";
export const assessmentEdition = "PPO-NAC-TECH-1";
export const roles = [
  "MediaSupply",
  "Dispensing",
  "Potting",
  "Planting",
  "Conveying",
  "TakeOff",
  "Other",
] as const;
export const dispositions = [
  "New",
  "Retained",
  "Reused",
  "CustomerSupplied",
  "Stock",
  "Manual",
] as const;
export const topologies = [
  "Sequential",
  "Branched",
  "SharedOperators",
  "Recirculating",
  "Asynchronous",
] as const;
export const fitAspects = [
  "Geometry",
  "Nesting",
  "PlantHandling",
  "Media",
  "Operations",
] as const;
export const interfaceAspects = [
  "Mechanical",
  "Electrical",
  "Air",
  "ControlData",
  "StopRestart",
] as const;
export const dimensions = [
  "diameter_mm",
  "height_mm",
  "filled_mass_kg",
] as const;
export type Review = {
  state: "Pending" | "Reviewed" | "Rejected";
  reviewer: string | null;
};
export type Check = {
  aspect: string;
  state: "Unknown" | "Compatible" | "Incompatible" | "NotApplicable";
  source: string | null;
  review: Review;
  owner: string | null;
  action: string | null;
};
export type Limit = {
  dimension: (typeof dimensions)[number];
  minimum: Fact;
  maximum: Fact;
  minimum_inclusive: boolean;
  maximum_inclusive: boolean;
  review: Review;
};
export type Stage = {
  id: string;
  name: string;
  role: (typeof roles)[number];
  phase: "Current" | "Future" | "Both";
  disposition: (typeof dispositions)[number];
  selection: "Base" | "Selected" | "Offered" | "Excluded" | "Parked";
  candidate_id: string | null;
  configuration: string | null;
  configuration_evidence: Check;
  technical_count: Fact;
  installation_count: Fact;
  spare_count: Fact;
  waste_count: Fact;
  pack_size: Fact;
  quantity_review: Review;
};
export type StageCase = {
  stage_id: string;
  rate: Fact;
  rate_unit: "PotsPerHour" | "TraysPerHour";
  rate_basis: "Gross" | "NetGood";
  occupancy: Fact;
  operators: Fact;
  rate_review: Review;
  limits: Limit[];
  checks: Check[];
};
export type ScenarioCase = {
  scenario_id: string;
  good_fraction: Fact;
  stages: StageCase[];
};
export type Connection = {
  id: string;
  from_id: string;
  to_id: string;
  scenario_ids: string[];
  checks: Check[];
  buffer_positions: Fact;
  downstream_demand_per_minute: Fact;
};
export type Assessment = {
  schema_version: 1;
  name: string;
  topology: (typeof topologies)[number];
  owner: string | null;
  stages: Stage[];
  scenarios: ScenarioCase[];
  connections: Connection[];
};
export const pendingReview = (): Review => ({
  state: "Pending",
  reviewer: null,
});
export const blankCheck = (aspect: string): Check => ({
  aspect,
  state: "Unknown",
  source: null,
  review: pendingReview(),
  owner: null,
  action: null,
});
export const blankStage = (id: string): Stage => ({
  id,
  name: "Process stage",
  role: "Potting",
  phase: "Current",
  disposition: "New",
  selection: "Base",
  candidate_id: null,
  configuration: null,
  configuration_evidence: blankCheck("ExactConfiguration"),
  technical_count: blankFact(),
  installation_count: blankFact(),
  spare_count: blankFact(),
  waste_count: blankFact(),
  pack_size: blankFact(),
  quantity_review: pendingReview(),
});
export const blankStageCase = (stage_id: string): StageCase => ({
  stage_id,
  rate: blankFact(),
  rate_unit: "PotsPerHour",
  rate_basis: "Gross",
  occupancy: blankFact(),
  operators: blankFact(),
  rate_review: pendingReview(),
  limits: dimensions.map((dimension) => ({
    dimension,
    minimum: blankFact(),
    maximum: blankFact(),
    minimum_inclusive: true,
    maximum_inclusive: true,
    review: pendingReview(),
  })),
  checks: fitAspects.map(blankCheck),
});
export const blankConnection = (
  id: string,
  from_id: string,
  to_id: string,
  scenario_ids: string[],
): Connection => ({
  id,
  from_id,
  to_id,
  scenario_ids,
  checks: interfaceAspects.map(blankCheck),
  buffer_positions: blankFact(),
  downstream_demand_per_minute: blankFact(),
});
export const blankAssessment = (source: Study): Assessment => ({
  schema_version: 1,
  name: source.name + " technical assessment",
  topology: "Sequential",
  owner: null,
  stages: [],
  connections: [],
  scenarios: source.scenarios.map((s) => ({
    scenario_id: s.id,
    good_fraction: blankFact(),
    stages: [],
  })),
});
export const activeIn = (s: Stage, phase: "Current" | "Future") =>
  ["Base", "Selected"].includes(s.selection) &&
  (s.phase === "Both" || s.phase === phase);
export type ExactValue = {
  numerator: string;
  denominator: string;
  display: string;
  unit: string;
};
export type TechnicalFinding = {
  key: string;
  rule: string;
  subject: string;
  severity: "Blocker" | "Warning";
  gate: "TechnicalUse" | "QuantityGeneration";
  message: string;
  owner: string | null;
  action: string;
};
export type AssessmentResult = {
  edition: string;
  technical_state: "NotSuitable" | "NeedsConfirmation" | "ChecksSatisfied";
  findings: TechnicalFinding[];
  quantities: {
    stage_id: string;
    phase: Stage["phase"];
    technical: ExactValue | null;
    installation: ExactValue | null;
    spare: ExactValue | null;
    waste: ExactValue | null;
    purchase_need: ExactValue | null;
    purchase_packs: ExactValue | null;
    purchase_units: ExactValue | null;
    disposition: Stage["disposition"];
  }[];
  scenarios: {
    scenario_id: string;
    phase: "Current" | "Future";
    capacity_state: "NotAssessable" | "Indicative";
    rate_basis: StageCase["rate_basis"] | null;
    line_rate: ExactValue | null;
    running_minutes: ExactValue | null;
    good_output: ExactValue | null;
    target: ExactValue | null;
    target_state: "NotAssessable" | "Shortfall" | "MeetsTarget";
    bottleneck_stage_ids: string[];
    rates: {
      stage_id: string;
      original: Fact;
      unit: StageCase["rate_unit"];
      normalized: ExactValue | null;
    }[];
  }[];
  buffers: {
    connection_id: string;
    state: "Unknown" | "NotApplicable" | "Indicative";
    minutes: ExactValue | null;
  }[];
};
