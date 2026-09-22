import type { Scope, Calculation } from "./types";
import type { DiscoveryRevision } from "../discovery-workspace-context";

export type Coverage = {
  system_id: string | null;
  area_ids: string[];
  facility_ids: string[];
};
export type SourceBinding = Coverage & {
  schema_version: 1;
  estimating_workspace_id: string;
  option_id: string;
  revision_id: string;
  scope_snapshot_id: string;
  answer_snapshot_id: string;
  content_hash: string;
  context_hash: string;
  site_id: string | null;
  upstream_context_hash: string;
  captured_discovery: DiscoveryRevision["observed_context"];
  facility_observations: {
    id: string;
    version: number;
    details: Record<string, unknown>;
  }[];
};
export type FertigationRecord = {
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
  current_revision_id: string;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
};
export type ScopeRevision = {
  id: string;
  workspace_id: string;
  company_id: string;
  scope_id: string;
  option_id: string;
  source_revision_id: string;
  version: number;
  predecessor_id: string | null;
  proposal: Scope;
  binding: SourceBinding;
  content_hash: string;
  calculation_input_hash: string;
  calculation: Calculation;
  calculation_edition: string;
  source_hash: string;
  created_at: Date;
  created_by: string;
  reason: string;
};
