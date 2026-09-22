/** Browser-safe native proposal. Authority, source bindings and reviews are server owned. */
export type Phase = "existing" | "proposed" | "future" | "excluded" | "unknown";
export type EvidenceStatus =
  "unknown" | "observation" | "assumption" | "documented";
export type ResultState =
  "known" | "unknown" | "not_applicable" | "unsupported";
export interface Result<T = number> {
  value: T | null;
  unit: string;
  state: ResultState;
  reason: string;
  dependencies: string[];
}
export interface Finding {
  id: string;
  severity: "incomplete" | "conflict" | "review";
  record_id: string | null;
  field: string;
  message: string;
}
export interface ProductionContext {
  tags: (
    | "commercial_berries"
    | "commercial_nursery"
    | "medicinal_cannabis"
    | "other"
    | "unknown"
  )[];
  crop_description: string;
  growing_system: "unknown" | "hydroponic_soilless" | "soil" | "other";
  application_method:
    "unknown" | "drip" | "overhead" | "ebb_and_flow" | "other";
  hydraulic_arrangement:
    "unknown" | "single_pass" | "collected_return" | "recirculating" | "mixed";
  source_note: string;
}
export interface RecordBase {
  id: string;
  label: string;
  phase: Phase;
  evidence_ids: string[];
  notes: string;
}
export interface Area extends RecordBase {
  facility_id: string | null;
  facility_version: number | null;
  area_m2: number | null;
  entered_area_unit: "m2" | "ha";
  area_basis: "unknown" | "footprint" | "planted" | "effective";
  context: ProductionContext;
}
export interface CropGroup extends RecordBase {
  area_id: string | null;
  crop_description: string;
  represented_area_m2: number | null;
  container_count: number | null;
  containers_per_ha: number | null;
  plants_per_container: number | null;
  plant_count: number | null;
  missing_plants: number | null;
  daily_l_per_container: number | null;
  demand_basis: "unknown" | "gross" | "net";
  drain_fraction: number | null;
  drain_definition_confirmed: boolean;
  agronomic_author: string;
}
export interface Allocation {
  id: string;
  area_id: string | null;
  crop_group_id: string | null;
  container_count: number | null;
  served_area_m2: number | null;
  flow_share_fraction: number | null;
}
export interface Control {
  owner: "unknown" | "ppo_controller" | "manual" | "external";
  controller_id: string | null;
  bank_id: string | null;
  channel: string;
  signal:
    | "unknown"
    | "digital_output"
    | "digital_input"
    | "analogue_input"
    | "analogue_output"
    | "pulse"
    | "bus";
  voltage: string;
  additional_channels: number | null;
  basis: string;
}
export interface Emitter {
  method: "unknown" | "independent" | "verified_per_container";
  count: number | null;
  flow_lph: number | null;
  containers_per_emitter: number | null;
  outlets_per_hub: number | null;
  verified_container_lph: number | null;
}
export interface Valve extends RecordBase {
  master_id: string | null;
  source_id: string | null;
  asset_id: string | null;
  intent: "unknown" | "retain" | "replace" | "new" | "inspect";
  location: string;
  model: string;
  pressure_bar: number | null;
  flow_basis: "unknown" | "emitter_inventory" | "measured" | "design_allowance";
  measured_flow_m3h: number | null;
  design_flow_m3h: number | null;
  flow_evidence_id: string | null;
  emitter: Emitter;
  allocations: Allocation[];
  control: Control;
  inrush_va: number | null;
  holding_va: number | null;
  feedback: string;
}
export interface Master extends RecordBase {
  source_id: string | null;
  circuit: string;
  location: string;
  model: string;
  pressure_bar: number | null;
  intent: Valve["intent"];
  control: Control;
}
export interface Source extends RecordBase {
  type: string;
  reliable_flow_m3h: number | null;
  pressure_bar: number | null;
  nominal_storage_m3: number | null;
  usable_storage_m3: number | null;
  conditions: string;
}
export interface Group extends RecordBase {
  valve_ids: string[];
  recipe_id: string | null;
  delivery_seconds: number | null;
  prepare_seconds: number | null;
  flush_seconds: number | null;
  flush_to_crop: "unknown" | "yes" | "no";
  other_pump_flow_m3h: number | null;
  other_unit_flow_m3h: number | null;
  other_path: "unknown" | "none" | "pump_only" | "through_unit";
  maximum_dry_min: number | null;
  minimum_rest_min: number | null;
  maximum_start_interval_min: number | null;
}
export interface Scenario extends RecordBase {
  group_ids: string[];
  include_future: boolean;
  cycles: number | null;
  start_minute: number | null;
  end_minute: number | null;
  spacing_min: number | null;
  spacing_basis: "start_to_start" | "end_to_start" | "unknown";
  source_id: string | null;
  initial_storage_m3: number | null;
  refill_m3h: number | null;
  reserve_m3: number | null;
}
export interface CurvePoint {
  flow_m3h: number;
  head_m: number;
  efficiency_percent: number | null;
  power_kw: number | null;
}
export interface Hydraulics {
  pump_model: string;
  curve_evidence_id: string | null;
  speed_rpm: number | null;
  outlet_pressure_bar: number | null;
  static_head_m: number | null;
  pipe_loss_m: number | null;
  filter_loss_m: number | null;
  unit_loss_m: number | null;
  other_loss_m: number | null;
  head_basis_flow_m3h: number | null;
  curve_points: CurvePoint[];
  notes: string;
}
export interface Pipe extends RecordBase {
  from: string;
  to: string;
  length_m: number | null;
  internal_diameter_mm: number | null;
  design_flow_m3h: number | null;
  loss_basis: string;
}
export interface Filter extends RecordBase {
  process: string;
  path: "unknown" | "pump" | "unit" | "crop";
  capacity_m3h: number | null;
  dirty_loss_m: number | null;
  backwash_m3h: number | null;
  discharge: string;
}
export interface WaterSample extends RecordBase {
  source_id: string | null;
  sample_date: string | null;
  laboratory: string;
  ph: number | null;
  ec_mscm: number | null;
  alkalinity: string;
  analytical_units: string;
}
export interface Recipe extends RecordBase {
  author: string;
  revision: string;
  ec_target_mscm: number | null;
  ph_target: number | null;
  ec_basis: "unknown" | "final" | "increment";
  composition: string;
  changeover: string;
}
export interface Stock extends RecordBase {
  recipe_id: string | null;
  function: "nutrient" | "acid" | "alkali" | "treatment" | "spare";
  dose_l_m3: number | null;
  usable_l: number | null;
  concentration: string;
  conditions: string;
}
export interface Channel extends RecordBase {
  candidate_id: string | null;
  stock_id: string | null;
  minimum_lph: number | null;
  maximum_lph: number | null;
  conditions: string;
}
export interface Controller extends RecordBase {
  family: "unknown" | "Compass" | "Compact CC" | "Connext" | "other";
  asset_id: string | null;
  model: string;
  serial: string;
  software: string;
  licences: string;
}
export interface Bank extends RecordBase {
  controller_id: string | null;
  physical_bank: string;
  signal: Control["signal"];
  voltage: string;
  installed: number | null;
  used: number | null;
  reserved: number | null;
  faulty: number | null;
  manual_required: number | null;
}
export interface Sensor extends RecordBase {
  measurement: string;
  crop_group_id: string | null;
  control: Control;
  representative_basis: string;
}
export interface Strategy extends RecordBase {
  trigger: string;
  sensor_id: string | null;
  group_ids: string[];
  reset_basis: string;
  fallback: string;
  capability_evidence_id: string | null;
}
export type Family =
  "NutriOne" | "NutriFit" | "NutriJet Inline" | "NutriJet Bypass" | "NutriFlex";
export interface Candidate extends RecordBase {
  family: Family;
  variant: string;
  controller_id: string | null;
  minimum_m3h: number | null;
  maximum_m3h: number | null;
  minimum_pressure_bar: number | null;
  maximum_pressure_bar: number | null;
  proposed_pressure_bar: number | null;
  pressure_boundary: "unknown" | "unit_inlet" | "unit_outlet";
  source_revision: string;
  arrangement: string;
  capability_evidence_id: string | null;
  shortlisted: boolean;
}
export interface Evidence {
  id: string;
  label: string;
  kind: "observation" | "assumption" | "document_reference";
  reference: string;
  source_revision: string;
  sha256: string | null;
  captured_date: string | null;
  attribution: string;
  applicability: string;
  notes: string;
}
export interface Action extends RecordBase {
  owner: string;
  due_date: string | null;
  purpose: "question" | "responsibility" | "commissioning_criterion" | "review";
  status: "open" | "recorded";
}
export interface Scope {
  schema_version: 1;
  name: string;
  production_context: ProductionContext;
  areas: Area[];
  crop_groups: CropGroup[];
  valves: Valve[];
  masters: Master[];
  sources: Source[];
  groups: Group[];
  scenarios: Scenario[];
  selected_scenario_id: string | null;
  hydraulics: Hydraulics;
  pipes: Pipe[];
  filters: Filter[];
  water_samples: WaterSample[];
  recipes: Recipe[];
  stocks: Stock[];
  channels: Channel[];
  controllers: Controller[];
  banks: Bank[];
  sensors: Sensor[];
  strategies: Strategy[];
  candidates: Candidate[];
  evidence: Evidence[];
  actions: Action[];
  services: {
    shed: string;
    power: string;
    communications: string;
    access: string;
  };
  resilience: { alarms: string; fallback: string; responsibilities: string };
  groscales: {
    required: "unknown" | "yes" | "no";
    mode: "unknown" | "wired" | "wireless";
    controller_id: string | null;
    ancillary_hardware: string;
    evidence_id: string | null;
  };
}
export interface Calculation {
  edition: string;
  scenario_id: string | null;
  findings: Finding[];
  area_m2: Result;
  containers: Result;
  plants: Result;
  daily_demand_m3: Result;
  connected_flow_m3h: Result;
  operating_peak_m3h: Result;
  pump_peak_m3h: Result;
  valve_flows: { id: string; flow: Result }[];
  group_flows: { id: string; crop: Result; unit: Result; pump: Result }[];
  coverage: {
    allocation_id: string;
    valve_id: string;
    crop_group_id: string | null;
    required_m3: Result;
    delivered_m3: Result;
  }[];
  schedule: {
    cycle_seconds: Result;
    events: { group_id: string; start: number; end: number; finish: number }[];
    intervals: {
      valve_id: string;
      maximum_dry_min: number | null;
      maximum_start_min: number | null;
      minimum_rest_min: number | null;
    }[];
  };
  storage: { final_m3: Result; minimum_m3: Result; overflow_m3: Result };
  hydraulic: {
    required_head_m: Result;
    curve_head_m: Result;
    margin_m: Result;
  };
  pipes: { id: string; volume_l: Result; transit_seconds: Result }[];
  injection: { group_id: string; stock_id: string; required_lph: Result }[];
  io: { bank_id: string; required: Result; available: Result; spare: Result }[];
  candidates: {
    id: string;
    status:
      | "not_assessable"
      | "outside_entered_limits"
      | "within_entered_checks_confirmation_pending";
    failures: string[];
    unknowns: string[];
  }[];
}
