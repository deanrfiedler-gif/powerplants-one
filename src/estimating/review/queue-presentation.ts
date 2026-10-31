import type { QueueRow, ReviewQueueData } from "./queue-model";

export const reviewLabels = {
  Completeness: "Completeness",
  Technical: "Technical",
  SourcePrice: "Source & price",
  QuotationApproval: "Quotation approval",
} as const;
export const registerViews = [
  { id: "all", label: "All reviews", icon: "list" },
  { id: "awaiting_me", label: "Awaiting my review", icon: "list-check" },
  {
    id: "quotations",
    label: "Quotation approvals",
    icon: "file-invoice-dollar",
  },
  { id: "returned", label: "Returned for changes", icon: "rotate-left" },
  { id: "completed", label: "Reviewed", icon: "circle-check" },
  { id: "my_submissions", label: "Submitted by me", icon: "user" },
] as const;
export function reviewStatus(row: QueueRow) {
  if (row.state === "Pending")
    return row.own_work
      ? "Your estimate"
      : row.can_decide
        ? row.source === "QuotationApproval"
          ? "Awaiting your approval"
          : "Awaiting your review"
        : row.source === "QuotationApproval"
          ? "Awaiting approval"
          : "Awaiting review";
  if (row.state === "Returned")
    return `Returned${row.finding_count ? ` · ${row.finding_count} finding${row.finding_count === 1 ? "" : "s"}` : ""}`;
  return row.state + (row.carried_forward ? " · carried forward" : "");
}
export function waitingTime(
  row: Pick<QueueRow, "state" | "submitted_at">,
  asOf: string,
) {
  if (
    !["Pending", "Returned", "Output pending", "Changed basis"].includes(
      row.state,
    )
  )
    return "—";
  const ms = Date.parse(asOf) - Date.parse(row.submitted_at);
  if (!Number.isFinite(ms) || ms < 0) return "Not available";
  const hours = Math.floor(ms / 3600000),
    days = Math.floor(hours / 24);
  return days
    ? `${days} day${days === 1 ? "" : "s"}`
    : hours
      ? `${hours} hour${hours === 1 ? "" : "s"}`
      : "Less than 1 hour";
}
export function reviewValue(row: Pick<QueueRow, "sell_total">) {
  return row.sell_total === null
    ? "Not recorded"
    : new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 2,
      }).format(Number(row.sell_total));
}
export function selectionKey(row: QueueRow) {
  return `${row.id}:${row.submission_id}:${row.estimate_version_id}:${row.sequence}:${row.state}:${row.can_decide}`;
}
export function emptyQueueMessage(data: ReviewQueueData, filtered: boolean) {
  if (data.completeness === "PartialWindow")
    return "No matching readable reviews in this partial window";
  if (
    data.next_offset !== null ||
    data.offset > 0 ||
    filtered ||
    data.counts.all > 0
  )
    return "No matching reviews in this window";
  return "No reviews submitted yet";
}
export function reviewsCsv(rows: QueueRow[], asOf: string) {
  const cell = (value: unknown) => {
    const s = String(value ?? "");
    return `"${(/^[=+@\-\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
  };
  return [
    ["Selected reviews only", "Observed at", asOf],
    [
      "Reference",
      "Revision",
      "Title",
      "Review",
      "Status",
      "Elapsed since submission",
      "Value",
      "Currency",
      "Tax basis",
      "Submitted at",
      "Submitted by",
      "Submission or revision ID",
      "Estimate version ID",
      "Native workflow",
    ],
    ...rows.map((r) => [
      r.reference,
      r.revision,
      r.title,
      reviewLabels[r.kind],
      reviewStatus(r),
      waitingTime(r, asOf),
      r.sell_total ?? "Not recorded",
      r.currency,
      r.tax_basis,
      r.submitted_at,
      r.submitted_by,
      r.submission_id,
      r.estimate_version_id,
      r.href,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
