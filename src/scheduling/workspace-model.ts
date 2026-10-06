import type { Appointment, Resource, ScheduleAppointment } from "./index";
import { intervalsOverlap } from "./time";

export type ResourceEvidence = Omit<Resource, "calendar" | "skills"> & {
  effective_from: string;
  effective_to: string;
  calendar: Resource["calendar"] & {
    status: string;
    effective_from: string;
    effective_to: string;
    source_as_at: string;
  };
  skills: (Resource["skills"][number] & {
    id: string;
    version: number;
    active: boolean;
    valid_from: string;
    source_as_at: string;
    evidence_ref: string | null;
    content_hash: string | null;
    reviewer_id: string | null;
    reviewed_at: string | null;
  })[];
};
export type ResourceWorkspace = {
  resource: ResourceEvidence;
  observed_at: string;
  completeness: string;
  from: string;
  to: string;
  sites: { id: string; display_name: string; timezone: string }[];
  appointments: ScheduleAppointment[];
};
export type ChangesWorkspace = {
  items: Appointment[];
  observed_at: string;
  completeness: string;
  from: string;
  to: string;
  focused: boolean;
};
export function hasOpenSchedulingFollowup(a: Pick<Appointment, "followups">) {
  return a.followups.some((f) => ["Open", "InProgress"].includes(f.status));
}

export function travelAvailabilityConflicts(
  visit: TravelVisit,
  resource?: Resource,
) {
  const overlaps = (b: { start_at: string; end_at: string }) =>
    intervalsOverlap(
      b.start_at,
      b.end_at,
      visit.reserved_start,
      visit.reserved_end,
    );
  return {
    blocks: resource?.blocks?.filter(overlaps) ?? [],
    closures: resource?.exceptions?.filter(overlaps) ?? [],
  };
}
export type DemandContribution = {
  key: string;
  domain: "Service" | "Projects" | "Engineering";
  source_id: string;
  source_version: number;
  source_as_at: string;
  reference: string;
  title: string;
  href: string;
  customer: string;
  site: string | null;
  site_id: string | null;
  owner: string | null;
  owner_id: string | null;
  resource_ids: string[];
  skills: string[];
  window_start: string | null;
  window_end: string | null;
  time_basis: string;
  effort_minutes: null;
  reserved_minutes: number | null;
  commitment:
    | "Operational booking"
    | "Authorised demand"
    | "Proposed visit"
    | "Source plan";
  source_state: string;
  completeness: string;
  next_action: string;
};
export type CapacityWorkspace = {
  items: DemandContribution[];
  resources: ResourceEvidence[];
  observed_at: string;
  from: string;
  to: string;
  sources: { domain: string; state: string; basis: string }[];
};
export function competenceState(
  skill: ResourceEvidence["skills"][number],
  from: string,
  to: string,
) {
  if (!skill.active) return "Inactive";
  if (
    skill.status === "Expired" ||
    Date.parse(skill.valid_to) <= Date.parse(from)
  )
    return "Expired";
  if (skill.status !== "Verified" || !skill.evidence_ref || !skill.reviewed_at)
    return "Unknown / unverified evidence";
  if (Date.parse(skill.valid_from) > Date.parse(from)) return "Not yet valid";
  if (Date.parse(skill.valid_to) < Date.parse(to))
    return "Expires within selected period";
  return "Verified for selected period";
}
export type TravelVisit = {
  key: string;
  resource_id: string;
  resource_name: string;
  appointment: ScheduleAppointment;
  before: number;
  after: number;
  reason: string;
  reserved_start: string;
  reserved_end: string;
  gap_minutes: number | null;
  overlap: boolean;
  unknown_basis: boolean;
};
// One sequence per resource, never a guessed vehicle/crew route. Half-open
// buffered intervals match the scheduling reservation semantics.
export function travelSequences(
  items: ScheduleAppointment[],
  resourceId = "",
): TravelVisit[] {
  const visits = items
    .filter(
      (a) =>
        !["Cancelled", "Completed", "CompletedPendingReview"].includes(
          a.status,
        ),
    )
    .flatMap((a) =>
      a.assignments
        .filter(
          (x) =>
            x.active &&
            x.assignment_version === a.assignment_version &&
            (!resourceId || x.resource_id === resourceId),
        )
        .map((x) => ({
          key: a.id + ":" + x.resource_id,
          resource_id: x.resource_id,
          resource_name: x.name,
          appointment: a,
          before: x.travel_before_minutes,
          after: x.travel_after_minutes,
          reason: x.travel_reason,
          reserved_start: new Date(
            Date.parse(a.start_at) - x.travel_before_minutes * 60000,
          ).toISOString(),
          reserved_end: new Date(
            Date.parse(a.end_at) + x.travel_after_minutes * 60000,
          ).toISOString(),
          gap_minutes: null as number | null,
          overlap: false,
          unknown_basis: !x.travel_reason?.trim(),
        })),
    );
  visits.sort(
    (a, b) =>
      a.resource_id.localeCompare(b.resource_id) ||
      a.reserved_start.localeCompare(b.reserved_start) ||
      a.key.localeCompare(b.key),
  );
  const latestEnd = new Map<string, number>();
  for (const visit of visits) {
    const end = latestEnd.get(visit.resource_id);
    if (end !== undefined) {
      visit.gap_minutes = (Date.parse(visit.reserved_start) - end) / 60000;
      visit.overlap = visit.gap_minutes < 0;
    }
    latestEnd.set(
      visit.resource_id,
      Math.max(end ?? 0, Date.parse(visit.reserved_end)),
    );
  }
  return visits;
}
export function uniqueContributions(items: DemandContribution[]) {
  return [...new Map(items.map((item) => [item.key, item])).values()];
}
export function scenarioSummary(
  items: DemandContribution[],
  excluded: readonly string[],
) {
  const included = uniqueContributions(items).filter(
    (item) => !excluded.includes(item.key),
  );
  return {
    contributions: included.length,
    unknown_effort: included.filter((item) => item.effort_minutes === null)
      .length,
    reserved_minutes: included.reduce(
      (total, item) => total + (item.reserved_minutes ?? 0),
      0,
    ),
  };
}
