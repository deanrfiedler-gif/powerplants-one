import type { ScheduleAppointment } from "../components/planner-screens";
import { addDays, utcFromLocal } from "./time";

export const visitStatuses = [
  "Proposed",
  "Confirmed",
  "InProgress",
  "CompletedPendingReview",
  "Completed",
  "Cancelled",
] as const;
const closed = new Set(["CompletedPendingReview", "Completed", "Cancelled"]);
export function label(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
}
type CrewRecord = Pick<
  ScheduleAppointment,
  "assignments" | "assignment_version"
>;
type PreparationRecord = CrewRecord &
  Pick<
    ScheduleAppointment,
    "status" | "scope_review_required" | "dispatch_hold" | "pack_requirement"
  >;
export function currentCrew(visit: CrewRecord) {
  return visit.assignments.filter(
    (a) => a.active && a.assignment_version === visit.assignment_version,
  );
}
// These are persisted preparation signals, never a substitute for dispatch authorisation.
export function preparationReasons(visit: PreparationRecord) {
  if (closed.has(visit.status)) return [];
  return [
    visit.scope_review_required ? "Scope review required" : null,
    visit.dispatch_hold ? "Dispatch held" : null,
    visit.pack_requirement !== "Acknowledged"
      ? `Pack: ${label(visit.pack_requirement)}`
      : null,
    currentCrew(visit).length === 0 ? "Crew assignment needed" : null,
  ].filter((s): s is string => !!s);
}
export function nextAction(visit: ScheduleAppointment) {
  if (visit.status === "Cancelled") return "Review cancellation";
  if (visit.status === "CompletedPendingReview")
    return "Review field submission";
  if (visit.status === "Completed") return "View completed visit";
  if (preparationReasons(visit).length) return "Review preparation";
  if (visit.status === "InProgress") return "Continue field work";
  return visit.status === "Proposed"
    ? "Review booking"
    : "Check dispatch readiness";
}
export type VisitFilters = {
  search: string;
  person: string;
  status: string;
  sort: string;
};
export function filterVisits(
  visits: ScheduleAppointment[],
  filters: VisitFilters,
  preparationOnly = false,
) {
  const query = filters.search.trim().toLocaleLowerCase("en-AU");
  return visits
    .filter((v) => {
      const crew = currentCrew(v);
      return (
        (!preparationOnly || preparationReasons(v).length > 0) &&
        (!filters.person ||
          crew.some((c) => c.resource_id === filters.person)) &&
        (!filters.status || v.status === filters.status) &&
        [
          v.display_number,
          v.work_order_display_number,
          v.scope_summary,
          v.site_name,
          ...crew.map((c) => c.name),
        ]
          .join(" ")
          .toLocaleLowerCase("en-AU")
          .includes(query)
      );
    })
    .sort(
      (a, b) =>
        (filters.sort === "name"
          ? (a.scope_summary || a.display_number).localeCompare(
              b.scope_summary || b.display_number,
            )
          : a.start_at.localeCompare(b.start_at)) || a.id.localeCompare(b.id),
    );
}
export function dayWindow(day: string, zone: string) {
  const from = utcFromLocal(day + "T00:00", zone);
  return { from, to: utcFromLocal(addDays(day, 1) + "T00:00", zone) };
}
