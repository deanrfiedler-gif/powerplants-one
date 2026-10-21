import type { ProductIconName } from "../components/product-icons";

export type IncidentRow = {
  id: string;
  reference: string;
  summary: string;
  state: string;
  classification: string;
  assessment: string;
  priority: string;
  hold: boolean;
  due_at: string | null;
  appointment_id: string;
  reporter_id: string;
  reporter: string;
  site_id: string;
  site: string;
  reported_at: string;
  timezone: string;
  actions: number;
  actions_open: number;
  source_current: boolean;
};
export const incidentViews: {
  id: string;
  label: string;
  icon: ProductIconName;
  group?: string;
}[] = [
  { id: "all", label: "All incidents", icon: "warning" },
  { id: "triage", label: "Awaiting triage", icon: "clock", group: "Triage" },
  { id: "review", label: "In review", icon: "list" },
  { id: "returned", label: "Clarification or returned", icon: "help" },
  { id: "on-hold", label: "On hold", icon: "warning" },
  {
    id: "holding",
    label: "Holding work",
    icon: "warning",
    group: "Follow-through",
  },
  { id: "actions", label: "Actions open", icon: "clock" },
  { id: "close", label: "Ready to close", icon: "check" },
  { id: "closed", label: "Closed", icon: "documents" },
];
// Counts describe only the permission-checked candidate window, never a closure authorisation.
export function inIncidentView(row: IncidentRow, view: string) {
  switch (view) {
    case "triage":
      return row.state === "Submitted";
    case "review":
      return row.state === "InReview";
    case "returned":
      return ["Returned", "ClarificationRequired"].includes(row.state);
    case "on-hold":
      return row.state === "OnHold";
    case "holding":
      return row.hold;
    case "actions":
      return row.state !== "Closed" && row.actions_open > 0;
    case "close":
      return (
        row.state === "Accepted" &&
        row.source_current &&
        row.actions > 0 &&
        row.actions_open === 0
      );
    case "closed":
      return row.state === "Closed";
    default:
      return true;
  }
}
export const incidentLabel = (value: string) =>
  ({
    NearMiss: "Near miss",
    InReview: "In review",
    ClarificationRequired: "Clarification required",
    OnHold: "On hold",
    Unassessed: "Not yet assessed",
  })[value] ?? value;
export function incidentTime(
  value: string | Date | null,
  timezone = "Australia/Brisbane",
) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
    timeZoneName: "short",
  }).format(new Date(value));
}
