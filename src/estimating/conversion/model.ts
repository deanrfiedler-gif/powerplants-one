import type { CostLine } from "../math";
import type { recordCommand } from "../../supply/validation";
import type { resolutionStates } from "./validation";
export type Resolution = {
  line_id: string;
  state: (typeof resolutionStates)[number];
  item_id: string;
  label: string;
  unit: string;
  company_id: string;
  entity: "SupplyDemand";
  external_mapping: null;
};
export type Receiving = {
  decision: "Received" | "Held" | "Returned";
  owner_id: string;
  due_date: string;
  next_action: string;
};
export type TargetLine = {
  line_id: string;
  resolution_id: string;
  item_id: string;
  item: string;
  label: string;
  quantity: string;
  unit: string;
};
export type PlanBasis = {
  policy_id: string;
  issue_id: string;
  output_hash: string;
  response_id: string;
  preparation_id: string;
  receiving_id: string;
  estimate_version_id: string;
  estimate_hash: string;
  option_id: string;
  source_lines: CostLine[];
  commercial: unknown;
  target: {
    provider: "Synthetic";
    configuration: "PPO-Native";
    company: string;
    entity: "SupplyDemand";
    site_id: string;
    customer_id: string;
    timezone: string;
  };
  follow_up: Receiving;
  lines: TargetLine[];
};
export type FrozenPlan = {
  basis: PlanBasis;
  basis_hash: string;
  commands: ReturnType<typeof recordCommand>[];
};
export type ConversionEvent = {
  id: string;
  workspace_id: string;
  quote_id: string;
  revision_id: string;
  issue_id: string;
  response_id: string;
  preparation_id: string;
  sequence: number;
  action: "Receive" | "Resolve" | "Plan" | "Execute";
  predecessor_id: string | null;
  output_hash: string;
  receiving: Receiving | null;
  resolution: Resolution | null;
  plan: FrozenPlan | null;
  plan_hash: string | null;
  plan_id: string | null;
  evidence: string;
  reason: string;
  created_by: string;
  created_at: Date;
  operation_id: string;
};
export const conversionPolicy = {
  id: "SYN-ES07-01",
  authority: "Not configured",
  signature: "Not configured",
  validity: "Not configured",
  withdrawal: "Not configured",
  terms: "Not configured",
  external_item_mapping: "Not configured",
  target: "Native Supply Demand / Forecast",
  synthetic_only: true,
};
export function latestResolution(events: ConversionEvent[], line: string) {
  return (
    events
      .filter((e) => e.action === "Resolve" && e.resolution?.line_id === line)
      .at(-1) ?? null
  );
}
