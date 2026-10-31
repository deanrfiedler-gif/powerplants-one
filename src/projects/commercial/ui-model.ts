import type { readCommercial, readCommercialFinance } from "./reads";
import type { Kind, Content } from "./model";
import type { Source } from "./validation";
export type Read = Awaited<ReturnType<typeof readCommercial>>;
export type ListRead = Extract<Read, { items: unknown }>;
export type DetailRead = Extract<Read, { current: unknown }>;
export type Row = NonNullable<Read["current"]>;
export type Context = Read["context"];
export type Finance = Awaited<ReturnType<typeof readCommercialFinance>>;
export type Intent = {
  action:
    | "Create"
    | "Revise"
    | "Submit"
    | "Decide"
    | "Withdraw"
    | "Satisfy"
    | "Reopen";
  kind: Kind;
  row?: Row;
  basis?: string;
  predecessor?: string;
};
export type Pending = {
  title: string;
  body: Record<string, unknown>;
  id: string;
};
export const kindLabel = (kind: Kind) =>
  kind === "Basis" ? "Commercial basis" : kind;
export const recordHref = (project: string, id: string) =>
  `/projects/${project}/commercial/${id}`;
export function moneyLabel(
  value: string | null | undefined,
  unknown = "Unknown",
) {
  if (value == null) return unknown;
  const negative = value.startsWith("-"),
    [whole, fraction = "00"] = (negative ? value.slice(1) : value).split(".");
  return `${negative ? "−" : ""}$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0")}`;
}
export function group(
  row: Pick<Row, "kind" | "state" | "disputed"> &
    Partial<Pick<Row, "content" | "correction_status">>,
  timezone?: string,
  observedAt?: string,
) {
  if (row.kind === "Notice")
    return row.correction_status === "Unavailable"
      ? "Correction status unavailable"
      : row.correction_status === "Corrected"
        ? "Corrected"
        : "Latest";
  if (
    row.kind === "Obligation" &&
    row.content &&
    timezone &&
    observedAt &&
    obligationOverdue(
      { ...row, content: row.content },
      timezone,
      new Date(observedAt),
    )
  )
    return "Overdue";
  if (row.kind === "Obligation" && row.state === "Submitted")
    return "Waiting for a waiver decision";
  if (row.disputed) return "Disputed";
  if (row.state === "Submitted") return "Waiting for decision";
  if (
    ["Requested", "Assessed", "Open", "Draft", "Returned"].includes(row.state)
  )
    return "Open";
  if (row.state === "Approved") return "Approved";
  return "Closed";
}
export const groupOrder = [
  "Overdue",
  "Waiting for a waiver decision",
  "Waiting for decision",
  "Open",
  "Disputed",
  "Approved",
  "Closed",
  "Latest",
  "Corrected",
  "Correction status unavailable",
];
export function editableContent(
  content: Content,
  kind: Kind,
): Record<string, unknown> {
  const { title, detail, clause, owner_id, action_ids } = content;
  return {
    title,
    detail,
    clause,
    owner_id,
    action_ids,
    ...(kind === "Obligation"
      ? {
          due_date: content.due_date,
          date_needed: content.date_needed,
          evidence: content.evidence,
        }
      : {}),
    ...(kind === "Notice"
      ? { occurred_at: content.occurred_at, evidence: content.evidence }
      : {}),
    ...(kind === "Variation"
      ? {
          requested_amount: content.requested_amount,
          priced_amount: content.priced_amount,
          date_impact: content.date_impact,
        }
      : {}),
  };
}
export function commandFields(
  intent: Intent,
  content: Content,
  source: Source | null,
  id: string,
  reason: string,
  note: string,
  outcome: string,
) {
  return {
    id,
    expected_version: intent.action === "Create" ? 0 : intent.row!.version,
    action: intent.action,
    reason,
    note,
    ...(["Create", "Revise"].includes(intent.action)
      ? { kind: intent.kind, content: editableContent(content, intent.kind) }
      : {}),
    ...(intent.action === "Create"
      ? intent.kind === "Basis"
        ? { source }
        : { basis_id: intent.basis, predecessor_id: intent.predecessor ?? null }
      : {}),
    ...(intent.action === "Decide" ? { outcome } : {}),
  };
}
export const blankContent = (owner_id: string): Content => ({
  title: "",
  detail: "",
  clause: "",
  owner_id,
  action_ids: [],
  due_date: null,
  date_needed: true,
  evidence: null,
  occurred_at: null,
  requested_amount: null,
  priced_amount: null,
  date_impact: null,
});

/** R7 display rule only; compare calendar dates in the project's site zone. */
export function obligationOverdue(
  row: Pick<Row, "kind" | "state" | "content">,
  timezone: string,
  now: Date,
) {
  if (
    row.kind !== "Obligation" ||
    row.state !== "Open" ||
    !row.content.due_date
  )
    return false;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (part: string) => parts.find((p) => p.type === part)!.value;
  return (
    row.content.due_date < `${value("year")}-${value("month")}-${value("day")}`
  );
}

export const noticeRelation = (
  row: Pick<Row, "correction_status" | "predecessor_id">,
) =>
  row.correction_status === "Unavailable"
    ? "Correction status unavailable"
    : row.correction_status === "Corrected"
      ? "Corrected by a later record"
      : row.predecessor_id
        ? "Corrects an earlier record"
        : "Original";
