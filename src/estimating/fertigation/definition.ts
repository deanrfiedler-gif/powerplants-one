import type {
  Scope,
  ProductionContext,
  RecordBase,
  Control,
  Emitter,
  Area,
  CropGroup,
  Valve,
  Master,
  Source,
  Group,
  Scenario,
  Candidate,
  Family,
} from "./types";
export const schemaVersion = 1;
export const nativeSchemaId = "PPO-FERT-NATIVE-SCOPE-r01";
export const calculationEdition = "PPO-FERT-NATIVE-CALC-r01";
export const sourceHash =
  "b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9";
export const views = [
  "overview",
  "growing",
  "water",
  "recipes",
  "controls",
  "operating",
  "configurator",
  "evidence",
  "review",
] as const;
export const viewLabels = [
  "Overview",
  "Growing areas & irrigation",
  "Water & hydraulics",
  "Recipes & dosing",
  "Controls & I/O",
  "Operating plan",
  "Unit configurator",
  "Evidence & delivery",
  "Scope review",
];
export const families: readonly Family[] = [
  "NutriOne",
  "NutriFit",
  "NutriJet Inline",
  "NutriJet Bypass",
  "NutriFlex",
];
export const blankContext = (): ProductionContext => ({
  tags: ["unknown"],
  crop_description: "",
  growing_system: "unknown",
  application_method: "unknown",
  hydraulic_arrangement: "unknown",
  source_note: "",
});
export const baseRecord = (id: string, label = ""): RecordBase => ({
  id,
  label,
  phase: "unknown",
  evidence_ids: [],
  notes: "",
});
export const blankControl = (): Control => ({
  owner: "unknown",
  controller_id: null,
  bank_id: null,
  channel: "",
  signal: "unknown",
  voltage: "",
  additional_channels: null,
  basis: "",
});
export const blankEmitter = (): Emitter => ({
  method: "unknown",
  count: null,
  flow_lph: null,
  containers_per_emitter: null,
  outlets_per_hub: null,
  verified_container_lph: null,
});
export const blankArea = (id: string): Area => ({
  ...baseRecord(id),
  facility_id: null,
  facility_version: null,
  area_m2: null,
  entered_area_unit: "m2",
  area_basis: "unknown",
  context: blankContext(),
});
export const blankCropGroup = (id: string): CropGroup => ({
  ...baseRecord(id),
  area_id: null,
  crop_description: "",
  represented_area_m2: null,
  container_count: null,
  containers_per_ha: null,
  plants_per_container: null,
  plant_count: null,
  missing_plants: null,
  daily_l_per_container: null,
  demand_basis: "unknown",
  drain_fraction: null,
  drain_definition_confirmed: false,
  agronomic_author: "",
});
export const blankValve = (id: string): Valve => ({
  ...baseRecord(id),
  master_id: null,
  source_id: null,
  asset_id: null,
  intent: "unknown",
  location: "",
  model: "",
  pressure_bar: null,
  flow_basis: "unknown",
  measured_flow_m3h: null,
  design_flow_m3h: null,
  flow_evidence_id: null,
  emitter: blankEmitter(),
  allocations: [],
  control: blankControl(),
  inrush_va: null,
  holding_va: null,
  feedback: "",
});
export const blankMaster = (id: string): Master => ({
  ...baseRecord(id),
  source_id: null,
  circuit: "",
  location: "",
  model: "",
  pressure_bar: null,
  intent: "unknown",
  control: blankControl(),
});
export const blankSource = (id: string): Source => ({
  ...baseRecord(id),
  type: "",
  reliable_flow_m3h: null,
  pressure_bar: null,
  nominal_storage_m3: null,
  usable_storage_m3: null,
  conditions: "",
});
export const blankGroup = (id: string): Group => ({
  ...baseRecord(id),
  valve_ids: [],
  recipe_id: null,
  delivery_seconds: null,
  prepare_seconds: null,
  flush_seconds: null,
  flush_to_crop: "unknown",
  other_pump_flow_m3h: null,
  other_unit_flow_m3h: null,
  other_path: "unknown",
  maximum_dry_min: null,
  minimum_rest_min: null,
  maximum_start_interval_min: null,
});
export const blankScenario = (id: string): Scenario => ({
  ...baseRecord(id),
  group_ids: [],
  include_future: false,
  cycles: null,
  start_minute: null,
  end_minute: null,
  spacing_min: null,
  spacing_basis: "unknown",
  source_id: null,
  initial_storage_m3: null,
  refill_m3h: null,
  reserve_m3: null,
});
export const blankCandidate = (id: string, family: Family): Candidate => ({
  ...baseRecord(id, family),
  family,
  variant: "",
  controller_id: null,
  minimum_m3h: null,
  maximum_m3h: null,
  minimum_pressure_bar: null,
  maximum_pressure_bar: null,
  proposed_pressure_bar: null,
  pressure_boundary: "unknown",
  source_revision: "",
  arrangement: "",
  capability_evidence_id: null,
  shortlisted: false,
});
export function blankScope(): Scope {
  return {
    schema_version: 1,
    name: "Untitled fertigation scope",
    production_context: blankContext(),
    areas: [],
    crop_groups: [],
    valves: [],
    masters: [],
    sources: [],
    groups: [],
    scenarios: [],
    selected_scenario_id: null,
    hydraulics: {
      pump_model: "",
      curve_evidence_id: null,
      speed_rpm: null,
      outlet_pressure_bar: null,
      static_head_m: null,
      pipe_loss_m: null,
      filter_loss_m: null,
      unit_loss_m: null,
      other_loss_m: null,
      head_basis_flow_m3h: null,
      curve_points: [],
      notes: "",
    },
    pipes: [],
    filters: [],
    water_samples: [],
    recipes: [],
    stocks: [],
    channels: [],
    controllers: [],
    banks: [],
    sensors: [],
    strategies: [],
    candidates: [],
    evidence: [],
    actions: [],
    services: { shed: "", power: "", communications: "", access: "" },
    resilience: { alarms: "", fallback: "", responsibilities: "" },
    groscales: {
      required: "unknown",
      mode: "unknown",
      controller_id: null,
      ancillary_hardware: "",
      evidence_id: null,
    },
  };
}
export function areaToM2(value: number, unit: "m2" | "ha"): number {
  return unit === "ha" ? value * 10000 : value;
}
export function areaFromM2(value: number, unit: "m2" | "ha"): number {
  return unit === "ha" ? value / 10000 : value;
}
