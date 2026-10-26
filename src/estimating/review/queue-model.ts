import { choice, invalid, object } from "../../shared/validation";

export const queueViews = [
  "all",
  "awaiting_me",
  "my_submissions",
  "returned",
  "completed",
  "changed",
] as const;
export type QueueView = (typeof queueViews)[number];
export type QueueState =
  | "Pending"
  | "Reviewed"
  | "Returned"
  | "Changed basis"
  | "Output pending"
  | "Approved"
  | "Issued";
export type QueueRow = {
  id: string;
  source: "EstimateReview" | "QuotationApproval";
  record_id: string;
  estimate_id: string;
  estimate_version_id: string;
  submission_id: string;
  reference: string;
  revision: number;
  title: string;
  customer: string;
  owner: string;
  submitted_by: string;
  site: { id: string; name: string } | null;
  kind: "Completeness" | "SourcePrice" | "Technical" | "QuotationApproval";
  sequence: number;
  submitted_at: string;
  submitted_by_me: boolean;
  own_work: boolean;
  state: QueueState;
  basis_current: boolean;
  can_decide: boolean;
  carried_forward: boolean;
  decision_id: string | null;
  decision_outcome: string | null;
  finding_count: number;
  sell_total: string | null;
  currency: "AUD";
  tax_basis: string;
  href: string;
};

export type ReviewQueueData = {
  items: QueueRow[];
  counts: Record<QueueView, number>;
  quotation_count: number;
  sites: { id: string; name: string }[];
  counts_scope: "CurrentCandidateWindow";
  completeness: "PartialWindow" | "CompleteWindow";
  quotation_source: "NotRequested" | "Available" | "Denied";
  offset: number;
  candidate_limit: number;
  next_offset: number | null;
  as_of: string;
  waiting_policy: "NotConfigured";
  synthetic: boolean;
};

function integer(
  value: unknown,
  field: string,
  fallback: number,
  min: number,
  max: number,
) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value))
    invalid(field, "Use a whole-number window.");
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max)
    invalid(field, `Use a value from ${min} to ${max}.`);
  return number;
}

export function queueQuery(value: unknown) {
  const input = object(value, ["q", "source", "view", "offset", "limit"]);
  const q = input.q ?? "";
  if (
    typeof q !== "string" ||
    q.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(q)
  )
    invalid(
      "q",
      "Use at most 100 search characters without control characters.",
    );
  return {
    q: q.trim(),
    source: choice(input.source ?? "all", "source", [
      "all",
      "estimates",
      "quotations",
    ] as const),
    view: choice(input.view ?? "all", "view", queueViews),
    offset: integer(input.offset, "offset", 0, 0, 1000000),
    limit: integer(input.limit, "limit", 25, 1, 25),
  };
}

export function inQueueView(row: QueueRow, view: QueueView) {
  switch (view) {
    case "all":
      return true;
    case "awaiting_me":
      return row.can_decide;
    case "my_submissions":
      return row.submitted_by_me;
    case "returned":
      return row.state === "Returned";
    case "completed":
      return ["Reviewed", "Approved", "Issued"].includes(row.state);
    case "changed":
      return !row.basis_current;
  }
}

export function queueCounts(rows: QueueRow[]) {
  return Object.fromEntries(
    queueViews.map((view) => [
      view,
      rows.filter((row) => inQueueView(row, view)).length,
    ]),
  ) as Record<QueueView, number>;
}
