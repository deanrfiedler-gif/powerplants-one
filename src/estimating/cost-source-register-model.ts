import type { listCostSourceRegister } from "./sources/register";
import type { readCostSource } from "./sources/reads";

export type CostSourceRegisterData = Awaited<ReturnType<typeof listCostSourceRegister>>;
export type CostSourceRow = CostSourceRegisterData["items"][number];
export type CostSourceDetailData = Awaited<ReturnType<typeof readCostSource>>;
export const sourceStates = ["Draft", "Submitted", "Reviewed", "Returned", "Rejected"] as const;
export const sourceViews = [
  { id: "all", label: "All sources", icon: "inbox" },
  { id: "awaiting_my_review", label: "Awaiting my review", icon: "list-check" },
  { id: "mine", label: "My sources", icon: "user" },
] as const;
export function sourceStateLabel(row: Pick<CostSourceRow, "state" | "your_submission">) {
  return row.state === "Submitted" ? row.your_submission ? "Your submission" : "Awaiting review"
    : row.state === "Returned" ? "Returned for changes" : row.state;
}
export function exactSourceHref(id: string, revision: string) {
  return `/estimating/cost-sources/${encodeURIComponent(id)}?revision_id=${encodeURIComponent(revision)}`;
}
export function sourceMoney(decimal: string) {
  // Retain the exact saved decimal; formatting must not introduce a floating-point price calculation.
  const [whole, fraction = ""] = decimal.split(".");
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0")}`;
}
export function sourceDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Brisbane" }).format(new Date(`${value}T00:00:00+10:00`)) : "Unknown";
}
export function sourceSelectionCurrent(selected: CostSourceRow[], current: CostSourceRow[]) {
  return selected.length > 0 && selected.every(s => current.some(r => r.id === s.id && r.version === s.version && r.revision_id === s.revision_id && r.content_hash === s.content_hash));
}
export function sourceCsv(rows: CostSourceRow[]) {
  const cell = (value: unknown) => {
    const text = String(value ?? "Unknown");
    return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + [
    ["Source", "Revision", "Revision ID", "Title", "Supplier", "Item", "Minimum quantity", "Unit", "Tier 1 unit cost", "Currency", "Tax basis", "State", "Effective", "Supplier expiry", "Updated"],
    ...rows.map(r => [r.reference, r.revision, r.revision_id, r.title, r.supplier, r.item, r.tier_1.minimum_quantity, r.unit, r.tier_1.unit_cost, r.currency, r.tax_basis, r.state, r.effective_from, r.valid_until, String(r.updated_at)]),
  ].map(row => row.map(cell).join(",")).join("\r\n");
}
export function sourceChanges(detail: CostSourceDetailData) {
  const before = detail.previous_revision?.content, after = detail.revision.content;
  if (!before) return [];
  const fields = ["title", "source_date", "effective_from", "valid_until", "evidence_reference", "evidence_text", "tiers", "fx"] as const;
  const label = { title: "Title", source_date: "Source date", effective_from: "Effective from", valid_until: "Supplier expiry", evidence_reference: "Evidence reference", evidence_text: "Evidence text", tiers: "Quantity tiers", fx: "FX evidence" };
  const display = (value: unknown) => value == null ? "Unknown" : typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return fields.filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(key => ({ field: label[key], before: display(before[key]), after: display(after[key]) }));
}
