import { statusPresentation } from "./pack-view";

// Allowlisted register projection. Null readiness/preparer means withheld or unavailable, never zero.
export type PackRegisterRow = {
  id: string;
  display_number: string;
  status: string;
  needs_review: boolean;
  appointment_id: string;
  appointment_reference: string;
  current_revision_id: string | null;
  current_issue_id: string | null;
  revision: number | null;
  title: string;
  visit_at: string;
  timezone: string;
  customer: string;
  site: string;
  site_id: string;
  technicians: { id: string; name: string }[];
  prepared_by: string | null;
  prepared_by_name: string | null;
  updated_at: string;
  job_state: string | null;
  readiness: { satisfied: number; total: number } | null;
  acknowledged: number | null;
  recipients: number | null;
  // Current-issue returns still waiting for a revision or an answer (field readiness gate P2).
  returned?: number | null;
  dispatch_hold: boolean;
  can_prepare: boolean;
};
export type PackVisit = {
  id: string;
  display_number: string;
  work_order_reference: string;
  start_at: string;
  site_timezone: string;
  site_name: string;
};
export const packViews = [
  ["all", "All job packs", ""],
  ["mine", "Prepared by me", ""],
  ["draft", "Drafts", "State"],
  ["returned", "Returned", "State"],
  ["checked", "Checked", "State"],
  ["issued", "Issued", "State"],
  ["withdrawn", "Withdrawn", "State"],
  ["readiness", "Readiness not satisfied", "Needs attention"],
  ["review", "Review required", "Needs attention"],
  ["acknowledgement", "Not yet acknowledged", "Needs attention"],
  ["recovery", "Output recovery needed", "Needs attention"],
  ["visits", "Visits without a pack", "Next 7 days"],
  ["held", "Dispatch held", "Next 7 days"],
] as const;
export type PackView = (typeof packViews)[number][0];
export const registerStatus = (row: PackRegisterRow) =>
  statusPresentation(row, row.job_state ?? undefined);
export function withinSevenDays(at: string, now: string) {
  const diff = Date.parse(at) - Date.parse(now);
  return diff >= 0 && diff < 7 * 86400000;
}
export function matchesPackView(
  row: PackRegisterRow,
  view: string,
  actor: string,
  now: string,
) {
  switch (view) {
    case "mine":
      return row.prepared_by === actor;
    case "draft":
      return row.status === "Draft";
    case "returned":
      return row.status === "Returned" || !!row.returned;
    case "checked":
      return row.status === "Checked";
    case "issued":
      return row.status === "Issued";
    case "withdrawn":
      return row.status === "Withdrawn";
    case "readiness":
      return !!row.readiness && row.readiness.satisfied < row.readiness.total;
    case "review":
      return row.needs_review;
    case "acknowledgement":
      return (
        row.status === "Issued" &&
        !row.needs_review &&
        row.recipients !== null &&
        row.acknowledged !== null &&
        row.acknowledged < row.recipients
      );
    case "recovery":
      return row.job_state === "Failed";
    case "held":
      return row.dispatch_hold && withinSevenDays(row.visit_at, now);
    default:
      return true;
  }
}
function localDay(at: string, zone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(at));
  const get = (key: string) => Number(parts.find((p) => p.type === key)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"));
}
export function visitGroup(at: string, now: string, zone: string) {
  const day = localDay(at, zone),
    today = localDay(now, zone),
    delta = (day - today) / 86400000;
  const daysToMonday = 7 - ((new Date(today).getUTCDay() + 6) % 7);
  return delta < 0
    ? "Earlier"
    : delta === 0
      ? "Today"
      : delta === 1
        ? "Tomorrow"
        : delta < daysToMonday
          ? "Later this week"
          : delta < daysToMonday + 7
            ? "Next week"
            : "Later";
}
// Spreadsheet exports must not turn user-supplied names into formulas.
export function packListCsv(rows: PackRegisterRow[]) {
  const cell = (value: unknown) =>
    `"${String(value ?? "")
      .replace(/^(?=\s*[=+@\-]|[\t\r\n])/, "'")
      .replaceAll('"', '""')}"`;
  return [
    [
      "Job pack",
      "Revision",
      "Visit",
      "Time zone",
      "Job",
      "State",
      "Readiness",
      "Crew acknowledged",
      "Dispatch",
      "Customer",
      "Site",
      "Technicians",
      "Prepared by",
      "Updated",
    ],
    ...rows.map((r) => [
      r.display_number,
      r.revision,
      r.visit_at,
      r.timezone,
      r.title,
      registerStatus(r).label,
      r.readiness
        ? `${r.readiness.satisfied} of ${r.readiness.total} satisfied`
        : "Not available",
      r.needs_review
        ? "Fresh issue needed"
        : r.recipients === null
          ? "Not requested"
          : `${r.acknowledged} of ${r.recipients}`,
      r.dispatch_hold ? "Held" : "Clear",
      r.customer,
      r.site,
      r.technicians.map((t) => t.name).join(", "),
      r.prepared_by_name ?? "Not available",
      r.updated_at,
    ]),
  ]
    .map((r) => r.map(cell).join(","))
    .join("\r\n");
}
