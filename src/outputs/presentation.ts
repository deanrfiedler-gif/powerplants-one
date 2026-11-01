import type { OutputKind, OutputRecipientSummary, OutputRow } from "./model";

export type OutputListRow = Omit<
  OutputRow,
  "updated_at" | "current_issue" | "preparation"
> & {
  updated_at: string;
  current_issue:
    | (Omit<NonNullable<OutputRow["current_issue"]>, "issued_at"> & {
        issued_at: string;
      })
    | null;
  preparation:
    | (Omit<NonNullable<OutputRow["preparation"]>, "requested_at"> & {
        requested_at: string;
      })
    | null;
};
export type OutputList = {
  as_at: string;
  coverage: {
    kind: OutputKind;
    state: "Complete" | "BoundedWindow" | "NotPermitted" | "NotSelected";
  }[];
  total_matching: number | null;
  matching_in_window: number;
  window_limit_per_family: number;
  offset: number;
  limit: number;
  has_more_in_window: boolean;
  items: OutputListRow[];
  facets: Record<
    "customers" | "sites" | "owners",
    { id: string; label: string }[]
  >;
};
export type IssueHistory = {
  id: string;
  revision_id: string;
  revision_number: number;
  issued_at: string;
  output_hash: string;
};
export type Preparation = {
  id: string;
  revision_id: string;
  revision_number: number;
  state: string;
  attempts: number;
  error_code: string | null;
  issue_id: string | null;
  requested_at: string;
  prepared_at: string | null;
  has_recorded_output: boolean;
};
export type Recipient = {
  id: string;
  user_id: string;
  display_name: string | null;
  required: boolean;
  assignment_version: number;
  events: { id: string; kind: string; occurred_at: string }[];
  acknowledgements: {
    id: string;
    actor_id: string;
    presented_hash: string;
    acknowledged_at: string;
  }[];
};
export type OutputDetail = {
  as_at: string;
  output: OutputListRow;
  availability: "Available" | "ExactUnavailable" | "NotIssued" | "NotProvided";
  preparation_visibility: "Internal" | "NotProvided";
  preparations: Preparation[];
  history_coverage: "AllIssues" | "SelectedIssueOnly";
  issue_history: IssueHistory[];
  selected_issue: null | {
    id: string;
    revision: { id: string; revision: number; predecessor_id: string | null };
    issued_at: string;
    output_hash: string;
    recipient_id: string | null;
    recipient_name: string | null;
    is_current_issue: boolean;
    is_current_revision: boolean;
    pack_applicable: boolean | null;
    exact: {
      prepared_at: string;
      filename: string;
      pdf_hash: string;
      pdf_bytes: number;
      html_hash: string;
      html_bytes: number;
      source_hash: string;
      template: {
        id: string;
        version: number;
        hash: string;
        policy_version: number;
      };
    };
    files: { html: string; pdf: string; manifest: string } | null;
    events: {
      id: string;
      kind: string;
      occurred_at: string;
      reason: string | null;
      actor_id: string | null;
      actor_name: string | null;
    }[];
    distribution: {
      support: string;
      recipients: Recipient[];
      responses: {
        id: string;
        response: string;
        subject: string;
        respondent_name: string;
        respondent_role: string;
        presented_at: string;
        received_at: string;
        presented_hash: string;
        superseded: boolean;
        supersedes_response_id: string | null;
        restrictions: string | null;
        correction_reason: string | null;
      }[];
    };
  };
};
export type Attempt = {
  id: string;
  issue_id: string;
  recipient_id: string;
  output_hash: string;
  channel: "Synthetic";
  state: string;
  version: number;
  operation_id: string;
  recovery_owner_name: string | null;
  events: {
    id: string;
    version: number;
    action: string;
    state: string;
    actor_name: string | null;
    reason: string;
    evidence: string;
    occurred_at: string;
  }[];
};
export type OutputActionContext = {
  actor_id: string;
  workspace_id: string;
  as_at: string;
  version: number;
  current_revision_id: string | null;
  current_issue_id: string | null;
  actions: string[];
  request_issue: {
    available: boolean;
    reason: string;
    basis: Record<string, string | number>;
  };
  withdraw_pack: boolean;
  jobs: {
    id: string;
    revision_id: string;
    state: string;
    recoverable: boolean;
    recovery_owner_name: string | null;
    operation_id: string;
  }[];
  distribution_attempts: Attempt[];
};
export const outputViews = [
  { id: "all", label: "All outputs" },
  { id: "issued", label: "Issued" },
  { id: "unissued", label: "Not issued" },
  { id: "preparing", label: "Preparing" },
  { id: "exceptions", label: "Exceptions" },
];
export const familyLabel = (kind: OutputKind) =>
  kind === "JobPack" ? "Job pack" : "Service report";
export const revisionLabel = (value: number | null | undefined) =>
  value == null ? "Not provided" : `r${String(value).padStart(2, "0")}`;
export const outputHref = (
  kind: OutputKind,
  id: string,
  issue?: string | null,
) =>
  `/documents/issues/${kind === "JobPack" ? "job-packs" : "service-reports"}/${encodeURIComponent(id)}${issue ? `?issue=${encodeURIComponent(issue)}` : ""}`;
export function progressLabel(summary: OutputRecipientSummary) {
  if (summary.visibility === "NotProvided") return "Not provided";
  if (summary.visibility === "NotIssued") return "Not issued";
  if (summary.visibility === "FrozenReportRecipient")
    return "Report content responses in record";
  if (summary.acknowledged_count === null || summary.recipient_count === null)
    return "Not provided";
  return `${summary.acknowledged_count} of ${summary.recipient_count} acknowledged${summary.visibility === "OwnRecipient" ? " · your recipient row" : ""}`;
}
export function coverageLabel(data: OutputList) {
  const complete = data.coverage
    .filter((x) => x.state !== "NotSelected")
    .every((x) => x.state === "Complete");
  return complete && data.total_matching !== null
    ? `${data.total_matching} outputs`
    : `${data.matching_in_window} matches in permitted windows · incomplete coverage`;
}
export function canPrepare(
  detail: OutputDetail,
  context: OutputActionContext,
  recipientId: string,
) {
  const issue = detail.selected_issue;
  return (
    !!issue &&
    detail.availability === "Available" &&
    issue.is_current_issue &&
    issue.is_current_revision &&
    detail.output.source_state === "Issued" &&
    issue.pack_applicable !== false &&
    context.current_issue_id === issue.id &&
    context.version === detail.output.version &&
    !context.distribution_attempts.some(
      (a) =>
        a.issue_id === issue.id &&
        a.recipient_id === recipientId &&
        a.state !== "SimulatedNotSent",
    ) &&
    !issue.distribution.recipients
      .find((r) => r.id === recipientId)
      ?.events.some((e) => e.kind === "SimulatedSent")
  );
}
export function acknowledged(recipient: Recipient, hash: string) {
  return recipient.acknowledgements.find(
    (a) => a.actor_id === recipient.user_id && a.presented_hash === hash,
  );
}
