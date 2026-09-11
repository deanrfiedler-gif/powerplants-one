export const disciplines = [
  "Mechanical",
  "Layout",
  "Hydraulics",
  "Electrical",
  "Automation",
  "Controls",
] as const;
export const coordinationStates = [
  "Queued",
  "In design",
  "Awaiting information",
] as const;
export type EngineeringState = (typeof coordinationStates)[number];
export type LinkKind = "Project" | "Opportunity";
export type EngineeringPackage = {
  id: string;
  display_number: string;
  version: number;
  title: string;
  brief: string;
  company_id: string;
  organisation_id: string;
  site_id: string | null;
  context_kind: LinkKind;
  context_id: string;
  context_title: string;
  context_reference: string;
  customer_name: string;
  owner_id: string;
  owner_name: string;
  discipline: string;
  state: EngineeringState;
  required_date: string | null;
  next_action: string;
  action_due: string | null;
  blocker: string | null;
  updated_at: string;
  can_edit: boolean;
};
export type EngineeringEvent = {
  package_version: number;
  event_type: string;
  reason: string;
  note: string | null;
  created_at: string;
  actor_name: string;
};
export type EngineeringDetail = {
  package: EngineeringPackage;
  events: EngineeringEvent[];
  has_more_history: boolean;
};
export function engineeringDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value + "T00:00:00Z"))
    : "Date needed";
}
export function requiresAttention(
  p: Pick<EngineeringPackage, "blocker" | "required_date" | "action_due">,
  today: string,
) {
  return (
    !!p.blocker ||
    (!!p.required_date && p.required_date < today) ||
    (!!p.action_due && p.action_due < today)
  );
}
