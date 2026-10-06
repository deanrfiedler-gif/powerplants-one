export const policy = "incident-policy-1";
export const classifications = [
  "Unknown",
  "Observation",
  "NearMiss",
  "Incident",
] as const;
export const priorities = ["Unknown", "Routine", "Urgent"] as const;
export const states = [
  "Draft",
  "Submitted",
  "InReview",
  "Returned",
  "ClarificationRequired",
  "OnHold",
  "Accepted",
  "Closed",
] as const;
export type Facts = {
  classification: (typeof classifications)[number];
  occurred_at: string;
  summary: string;
  observations: string;
  immediate_response: string;
  source_reference: string;
  restricted_details: string | null;
};
export type Incident = {
  id: string;
  workspace_id: string;
  company_id: string;
  site_id: string;
  appointment_id: string;
  work_order_id: string;
  reporter_id: string;
  version: number;
  state: (typeof states)[number];
  facts: Facts;
  assessment: "Unassessed" | "Assessed";
  priority: (typeof priorities)[number];
  owner_id: string | null;
  due_at: Date | null;
  hold: boolean;
  repeated_report_id: string | null;
  defect_id: string | null;
  accepted_hash: string | null;
  accepted_by: string | null;
  reported_at: Date;
  updated_at: Date;
};
export type Binding = {
  id: string;
  incident_id: string;
  scope_item_id: string;
  asset_id: string;
  snapshot: Record<string, unknown>;
  source_hash: string;
  recorded_at: Date;
};
export type Action = {
  id: string;
  incident_id: string;
  activity_id: string;
  instruction: string;
  accepted_evidence_id: string | null;
  accepted_by: string | null;
};
export type Evidence = {
  id: string;
  incident_id: string;
  action_id: string | null;
  audience: "Operational" | "Restricted";
  label: string;
  media_type: "image/png" | "text/plain";
  byte_count: number;
  content_hash: string;
  added_by: string;
  added_at: Date;
};
