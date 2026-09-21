import type { CostLine } from "../math";
export type Attribution = {
  kind: "entered" | "inherited" | "recovered-default" | "assumption";
  note: string;
  source_field: string | null;
};
export type DraftValue = { raw: string; attribution: Attribution };
export type ParameterProposal = { raw: string; reason: string };
export type ExtraScreen = {
  id: string;
  count: string;
  length: string;
  overhang: string;
  width: string;
  material: string;
  reason: string;
};
export type ManualReview = {
  value: string | null;
  reason: string;
  basis_hash: string | null;
};
export type Gate = { include: boolean; reason: string };
export type Price = {
  cost: string;
  sell: string;
  currency: "AUD" | "EUR";
  no_purchase: boolean;
  reason: string;
  effective_date: string | null;
};
export type Decision = {
  key: string;
  choice: "keep" | "generated" | "remove" | "restore" | "omit" | "retain";
  reason: string;
};
export type DraftProposal = {
  schema_version: 1;
  definition_bundle_id: string;
  definition_bundle_hash: string;
  inputs: Record<string, DraftValue>;
  extra_screens: ExtraScreen[];
  parameters: Record<string, ParameterProposal>;
  manual_quantities: Record<string, ManualReview>;
  gates: Record<string, Gate>;
  exclusions: { key: string; excluded: boolean; reason: string }[];
  illustrative_prices: { key: string; price: Price }[];
};
export type Binding = {
  kind: "StructuredSystem" | "FacilityScope";
  estimating_workspace_id: string;
  option_id: string;
  revision_id: string;
  scope_snapshot_id: string;
  answer_snapshot_id: string;
  content_hash: string;
  context_hash: string;
  site_id: string | null;
  system_id: string | null;
  area_ids: string[];
  facility_ids: string[];
};
export type Diagnostic = {
  code: string;
  severity: "Error" | "Warning" | "Information";
  field: string | null;
  key: string | null;
  message: string;
  source: string;
  action: string;
};
export type ExactValue = {
  numerator: string;
  denominator: string;
  display: string;
};
export type Position = {
  key: string;
  row: number;
  label: string;
  section: string;
  source: string;
  formula: string | null;
  rule: string;
  manual: boolean;
  quantity: ExactValue | null;
  effective_quantity: ExactValue | null;
  unit: string;
  part_id: string | null;
  part_state:
    | "Mapped"
    | "No part selected"
    | "Not in catalogue"
    | "Unresolved"
    | "Conflict";
  description: string;
  part_basis: string;
  part_note: string;
  part_candidates: string[];
  excluded: boolean;
  gate_included: boolean | null;
  price: Price;
  status: "Unresolved" | "Excluded" | "Zero" | "Manual" | "Calculated";
  origin: "generated" | "manual" | "retained manual";
  edit_reason?: string;
};
export type Fact = {
  key: string;
  label: string;
  value: ExactValue;
  unit: string;
  source: string;
  expression: string;
};
export type Commercial = {
  policy: "SYN-PRICE-02";
  complete: boolean;
  missing: string[];
  materials: ExactValue | null;
  discount: ExactValue | null;
  freight: ExactValue | null;
  before: ExactValue | null;
  total: ExactValue | null;
  cost: ExactValue | null;
  rounding_adjustment: ExactValue | null;
  currency: "AUD";
  tax: "Not calculated";
};
export type Calculation = {
  state: "Invalid" | "Current";
  normalized_inputs: {
    key: string;
    state: "Missing" | "Invalid" | "Value";
    value: string | null;
    unit: string;
  }[];
  facts: Fact[];
  positions: Position[];
  diagnostics: Diagnostic[];
  manual_review_required: string[];
  manual_basis_hash: string;
  calculation_input_hash: string;
  torque: ExactValue | null;
  commercial: Commercial;
};
export type Comparison<T> = {
  key: string;
  baseline: T | null;
  current: T | null;
  candidate: T | null;
  kind:
    | "Added"
    | "Unchanged"
    | "Changed"
    | "Manual edit"
    | "Removed"
    | "Deleted"
    | "Incompatible";
  required: boolean;
  decision: Decision | null;
  resolved: T | null;
};
export type Configuration = {
  id: string;
  workspace_id: string;
  company_id: string;
  estimating_workspace_id: string;
  option_id: string;
  name: string;
  display_number: string;
  owner_id: string;
  state: "Active" | "Archived";
  version: number;
  current_draft_id: string;
  current_run_id: string | null;
  current_resolved_id: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
};
export type SavedDraft = {
  id: string;
  configuration_id: string;
  version: number;
  binding: Binding;
  proposal: DraftProposal;
  content_hash: string;
  created_by: string;
  created_at: Date;
  reason: string;
  predecessor_id: string | null;
};
export type RunSnapshot = {
  schema_version: 1;
  configuration_id: string;
  draft_id: string;
  binding: Binding;
  proposal: DraftProposal;
  calculation: Calculation;
  manual_reviews: Record<
    string,
    ManualReview & { reviewed_by: string; reviewed_at: string }
  >;
  decisions: Decision[];
  predecessor_id: string | null;
  created_by: string;
  created_at: string;
  reason: string;
  definition_bundle_hash: string;
};
export type SavedRun = {
  id: string;
  configuration_id: string;
  sequence: number;
  draft_id: string;
  snapshot: RunSnapshot;
  evidence_hash: string;
  created_at: Date;
  created_by: string;
};
export type ResolvedSnapshot = {
  schema_version: 1;
  run_id: string;
  baseline: Position[];
  lines: Position[];
  decisions: Decision[];
  commercial: Commercial;
  predecessor_id: string | null;
  reason: string;
  created_by: string;
  created_at: string;
};
export type SavedResolved = {
  id: string;
  configuration_id: string;
  run_id: string;
  snapshot: ResolvedSnapshot;
  content_hash: string;
  created_at: Date;
};
export type NativePriceProposal = {
  key: string;
  unit_cost: string;
  unit_sell: string;
  effective_date: string;
  reason: string;
};
export type Contribution = {
  configuration_id: string;
  key: string;
  run_id: string;
  resolved_set_id: string;
  resolved_set_hash: string;
  line_id: string;
  part_id: string;
  unit: string;
  generated: CostLine;
  adopted: CostLine;
  current: CostLine | null;
  disposition: "Owned" | "Omitted" | "RetainedManual";
  source_revision_id: string;
  source_basis_changed: boolean;
  mapping_policy: string;
  price_policy: string;
};
export type LineageSnapshot = {
  schema_version: 1;
  estimate_id: string;
  estimate_version_id: string;
  estimate_content_hash: string;
  basis_revision_id: string | null;
  predecessor_id: string | null;
  contributions: Contribution[];
};
export type AdoptionRequest = {
  run_id: string;
  resolved_set_id: string;
  resolved_set_hash: string;
  estimate_id: string;
  estimate_version_id: string;
  expected_configuration_version: number;
  expected_workspace_version: number;
  expected_estimate_version: number;
  discovery_revision_id: string;
  source_context_hash: string;
  receiving_policy_id: string;
  receiving_policy_hash: string;
  decisions: Decision[];
  price_and_unit_proposals: NativePriceProposal[];
};
