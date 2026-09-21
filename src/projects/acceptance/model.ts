export const views = [
  {
    id: "register",
    segment: "",
    label: "Acceptance register",
    icon: "register",
  },
  {
    id: "readiness",
    segment: "readiness",
    label: "Scope & readiness",
    icon: "list",
  },
  {
    id: "outstanding",
    segment: "outstanding",
    label: "Defects & outstanding work",
    icon: "warning",
  },
  {
    id: "handover",
    segment: "handover",
    label: "Training & handover",
    icon: "users",
  },
  {
    id: "closeout",
    segment: "closeout",
    label: "Acceptance & closeout",
    icon: "review",
  },
  { id: "history", segment: "history", label: "History", icon: "history" },
] as const;
export type View = (typeof views)[number]["id"];
export type Outcome =
  "Satisfied" | "Outstanding" | "Blocked" | "Cannot assess" | "Not required";
export type SourceState =
  "Current" | "Changed" | "Unavailable" | "Restricted" | "Not checked";
export type Unit = {
  id: string;
  reference: string;
  title: string;
  system_name: string;
  function_name: string;
  installed_at: string;
  served_areas: string[];
  configuration_version: string;
  required: boolean;
  facility_id: string | null;
  asset_id: string | null;
  removal_reference: string | null;
  removal_reason: string | null;
  disposition?: "Included" | "Excluded";
  reason?: string;
  relationship?: string | null;
};
export type SourceFacts = {
  handover_requirements?: string[];
  id: string;
  version: number;
  title: string;
  kind: string;
  adapter: "EN08" | "SyntheticAcceptanceSource";
  availability: SourceState;
  outcome: Outcome;
  reference: string;
  source_version: string;
  fingerprint: string;
  href: string | null;
  explanation: string;
  tests_accepted: number | null;
  tests_required: number | null;
  release_id: string | null;
  release_hash: string | null;
  details: SourceDetails;
};
export type SourceDetails = {
  evidence?: string;
  tests_accepted?: number;
  tests_required?: number;
  release?: string;
  planned_on?: string | null;
  delivered_on?: string | null;
  attendance?: string;
  competence?: string;
  backup_available?: boolean;
  identity_verified?: boolean;
  restore_verified?: boolean;
  completion_required?: string;
  as_at?: string;
  currency?: string;
  completeness?: string;
  private_note?: string;
  source_reference?: string;
  authority_reference?: string;
  availability_evidence?: string;
};
export type Requirement = {
  id: string;
  unit_id: string;
  source_id: string;
  title: string;
  gate: "Technical" | "Handover" | "Closeout" | "Commercial";
  mandatory: boolean;
  owner_id: string;
  owner_name: string;
  due: string | null;
  due_basis: string | null;
  applicability_reference: string | null;
  source: SourceFacts;
  outcome: Outcome;
};
export type Obligation = {
  id: string;
  version: number;
  unit_id: string;
  source_id: string | null;
  title: string;
  owner_id: string;
  owner_name: string;
  recipient_id: string;
  recipient_name: string;
  due: string | null;
  due_basis: string;
  required_evidence: string;
  control_reference: string;
  eligible: boolean;
  conditions: string;
  review_rule: string;
  state: string;
  completion_evidence: string | null;
  activity_id: string;
  transfer_accepted: boolean;
  created_by: string;
};
export type Decision = {
  id: string;
  kind: string;
  outcome: string;
  subject_id: string | null;
  revision: number | null;
  facts_hash: string;
  snapshot: Record<string, unknown>;
  reason: string;
  actor_id: string;
  actor_name: string;
  created_at: string;
};
export type Manifest = {
  id: string;
  stage_id: string;
  revision: number;
  audience: "Customer" | "Service";
  recipient_id: string;
  purpose: string;
  manifest: Record<string, unknown>;
  content_hash: string;
  facts_hash: string;
  template_version: string;
  prepared_at: string;
  prepared_by: string;
  issue_id: string | null;
  issued_at: string | null;
  request_id: string | null;
  sender_id: string | null;
  transport: string | null;
  prepared: {
    id: string;
    bundle_sha256: string;
    bundle_bytes: number;
    html_sha256: string;
    pdf_sha256: string;
    pdf_bytes: number;
  };
};
export type ResponseRecord = {
  id: string;
  request_id: string;
  respondent_id: string;
  respondent_name: string;
  authority_basis: string;
  method: string;
  evidence: string;
  outcome: string;
  conditions: string;
  response_time: string | null;
  time_precision: string;
  recorded_by: string;
  recorded_at: string;
  units: string[];
  audience: string;
  manifest_id: string;
  revision: number;
  validated: boolean;
};
export type Stage = {
  id: string;
  project_id: string;
  version: number;
  reference: string;
  title: string;
  owner_id: string;
  owner_name: string;
  revision: number;
  state: string;
  closeout: string;
  reassessment: boolean;
  due: string | null;
  due_basis: string | null;
  updated_at: string;
};
export type Outcomes = {
  technical: string;
  customer: string;
  service: string;
  commercial: string;
};
export type HistoryItem = {
  id: string;
  kind: string;
  reason: string;
  actor_name: string;
  created_at: string;
  snapshot: Record<string, unknown>;
};
export type Detail = {
  revisions: {
    id: string;
    revision: number;
    predecessor_id: string | null;
    content_hash: string;
    submitted_at: string;
    snapshot: Record<string, unknown>;
  }[];
  source_history: {
    source_id: string;
    version: number;
    reference: string;
    recorded_at: string;
    outcome: string;
    availability: string;
  }[];
  stage: Stage;
  units: Unit[];
  requirements: Requirement[];
  obligations: Obligation[];
  decisions: Decision[];
  manifests: Manifest[];
  responses: ResponseRecord[];
  outcomes: Outcomes;
  facts_hash: string;
  source_state: SourceState;
  checked_at: string | null;
  technical_gates: string[];
  handover_gates: string[];
  closeout_gates: string[];
  next: {
    label: string;
    explanation: string;
    href: string | null;
    owner: string;
    due: string | null;
  };
  history: {
    id: string;
    kind: string;
    reason: string;
    actor_name: string;
    created_at: string;
    snapshot: Record<string, unknown>;
  }[];
};
export const capabilities = {
  scope: "acceptance.scope",
  submit: "acceptance.submit",
  technical: "acceptance.technical",
  prepare: "acceptance.prepare",
  issue: "acceptance.issue",
  record: "acceptance.response.record",
  validate: "acceptance.response.validate",
  receive: "acceptance.receive",
  commercial: "acceptance.commercial",
  closeStage: "acceptance.close.stage",
  closeProject: "acceptance.close.project",
  reopen: "acceptance.reopen",
  source: "acceptance.source",
} as const;
export type Duty = keyof typeof capabilities;
export type ProjectContext = {
  id: string;
  version: number;
  acceptance_version: number;
  display_number: string;
  title: string;
  customer_name: string;
  site_name: string;
  site_id: string;
  organisation_id: string;
  company_id: string;
  coordinator_id: string;
  lifecycle: "Active" | "Closed";
  timezone: string;
};
export type Workspace = {
  project_history: HistoryItem[];
  project_decisions: Decision[];
  recoveries: {
    operation_id: string;
    action: string;
    stage_id: string | null;
    registered_at: string;
    accepted: boolean;
  }[];
  project: ProjectContext;
  can: Record<Duty, boolean>;
  items: Detail[];
  selected: Detail | null;
  total: number;
  offset: number;
  limit: number;
  ledger: Unit[];
  project_gates: string[];
  projects: { id: string; title: string; display_number: string }[];
  people: { id: string; name: string; duties: Duty[] }[];
  customers: { id: string; name: string }[];
  sources: SourceFacts[];
  observed_at: string;
};
export const labelTone = (label: string) =>
  (/^(Accepted|Satisfied|Complete|Closed|Released|Validated)(\b|$)/.test(
    label,
  ) ||
    /^([0-9]+) \/ \1 accepted$/.test(label)) &&
  !/conditions|remaining|reassessment/i.test(label)
    ? "success"
    : /Blocked|Declined|Disputed|Overdue/.test(label)
      ? "failure"
      : /pending|conditions|Outstanding|Cannot assess|needed|required|Returned|Unavailable|Changed|Reservations/i.test(
            label,
          )
        ? "caution"
        : /Requested|Awaiting|Received|In review/.test(label)
          ? "info"
          : "neutral";
export function href(view: View, query: URLSearchParams) {
  const segment = views.find((v) => v.id === view)!.segment;
  return `/projects/acceptance${segment ? "/" + segment : ""}${query.size ? "?" + query : ""}`;
}
