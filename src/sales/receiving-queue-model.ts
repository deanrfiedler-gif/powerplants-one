import type { HandoverContent } from "./handover-model";
import type { Handover, HandoverEvent } from "./handover-service";
export const receivingViews = [
  { id: "All", label: "All briefs", group: "Views", count: true },
  {
    id: "Awaiting",
    label: "Awaiting my decision",
    group: "Views",
    count: true,
  },
  { id: "Assigned", label: "Assigned to me", group: "Views", count: true },
  { id: "Submitted", label: "Submitted", group: "State", count: true },
  {
    id: "ClarificationRequested",
    label: "Clarification requested",
    group: "State",
    count: true,
  },
  {
    id: "ClarificationAnswered",
    label: "Clarification answered",
    group: "State",
    count: true,
  },
  { id: "Returned", label: "Returned", group: "State", count: false },
  { id: "Accepted", label: "Accepted", group: "State", count: false },
  {
    id: "SourceChanged",
    label: "Source changed",
    group: "Attention",
    count: true,
  },
] as const;
export type ReceivingView = (typeof receivingViews)[number]["id"];
export type ReceivingState =
  | "Submitted"
  | "ClarificationRequested"
  | "ClarificationAnswered"
  | "Returned"
  | "Accepted";
export type BriefPerson = { id: string; name: string };
export type ReceivingBrief = {
  id: string;
  revision: number;
  submission_id: string;
  token: string;
  opportunity: { id: string; reference: string; title: string };
  customer: BriefPerson;
  site: BriefPerson | null;
  receiving_owner: BriefPerson | null;
  sales_owner: BriefPerson;
  state: ReceivingState;
  source_changed: boolean;
  updated_at: string;
  submitted_at: string;
  requested_date: string | null;
  date_reason: string;
};
export type ReceivingSnapshot = {
  brief: ReceivingBrief;
  content: HandoverContent;
  next_action: {
    id: string;
    summary: string;
    due_at: string | null;
    owner: BriefPerson | null;
  } | null;
  history: {
    id: string;
    revision: number;
    action: string;
    note: string;
    question_id: string | null;
    recorded_at: string;
    actor: BriefPerson;
  }[];
  observed_at: string;
};
export type ReceivingQueue = {
  items: ReceivingBrief[];
  counts: Record<ReceivingView, number>;
  total: number;
  permitted_total: number;
  customers: BriefPerson[];
  owners: BriefPerson[];
  offset: number;
  limit: number;
  has_more: boolean;
  basis: string;
  completeness: "Complete" | "Partial";
  observed_at: string;
};
const states: Record<string, ReceivingState> = {
  Submit: "Submitted",
  Clarify: "ClarificationRequested",
  Answer: "ClarificationAnswered",
  Resolve: "Submitted",
  Return: "Returned",
  Accept: "Accepted",
};
// A successor requires Return/Accept. Its immutable terminal event identifies the
// prior receiver even when a successor draft assigns someone else.
export function submittedRevision(row: Handover, history: HandoverEvent[]) {
  const submitted = history.findLast((e) => e.action === "Submit");
  if (!submitted) return null;
  const events = history.filter((e) => e.revision === submitted.revision);
  const decision = events.findLast((e) => states[e.action])!;
  const terminal = events.findLast(
    (e) => e.action === "Accept" || e.action === "Return",
  );
  return {
    submitted,
    decision,
    events,
    state: states[decision.action],
    receiver:
      row.revision === submitted.revision
        ? row.receiving_owner_id
        : (terminal?.recorded_by ?? null),
  };
}
export function receivingStateLabel(state: ReceivingState) {
  return receivingViews.find((view) => view.id === state)!.label;
}
export function sourceAttention(row: ReceivingBrief) {
  return row.source_changed && !["Accepted", "Returned"].includes(row.state);
}
export function matchesReceivingView(
  row: ReceivingBrief,
  view: ReceivingView,
  actor: string,
) {
  if (view === "All") return true;
  if (view === "Assigned") return row.receiving_owner?.id === actor;
  if (view === "Awaiting")
    return (
      row.receiving_owner?.id === actor &&
      ["Submitted", "ClarificationAnswered"].includes(row.state)
    );
  if (view === "SourceChanged") return sourceAttention(row);
  return row.state === view;
}
export function briefHref(row: Pick<ReceivingBrief, "id" | "revision">) {
  return `/sales/handoffs/estimating/${row.id}?revision=${row.revision}`;
}
export function receivingCsv(rows: ReceivingBrief[]) {
  const cell = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+\-@]|^[\t\r\n]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [
    [
      "Opportunity",
      "Revision",
      "Title",
      "Customer",
      "State",
      "Source changed",
      "Updated",
      "Requested date",
      "Date basis",
      "Receiving owner",
      "Sales owner",
      "Brief",
    ],
    ...rows.map((r) => [
      r.opportunity.reference,
      r.revision,
      r.opportunity.title,
      r.customer.name,
      receivingStateLabel(r.state),
      r.source_changed ? "Yes" : "No",
      r.updated_at,
      r.requested_date,
      r.date_reason,
      r.receiving_owner?.name ?? "Not recorded",
      r.sales_owner.name,
      briefHref(r),
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
