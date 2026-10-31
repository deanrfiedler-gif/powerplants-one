import type { Resource, Schedule } from "./index";
import { intervalsOverlap } from "./time";
import {
  travelAvailabilityConflicts,
  travelSequences,
  type TravelVisit,
} from "./workspace-model";

// Choices come only from the permission-scoped response. Never match a person's name.
export function startingTravelResource(
  data: Pick<Schedule, "items" | "resources">,
  requested: string,
  actorId: string,
) {
  if (requested)
    return data.resources.find((r) => r.id === requested)?.id ?? "";
  const visits = travelSequences(data.items);
  const conflict = data.resources.find((resource) =>
    visits.some((visit) => {
      if (visit.resource_id !== resource.id) return false;
      const conflicts = travelAvailabilityConflicts(visit, resource);
      return (
        visit.overlap ||
        conflicts.blocks.length > 0 ||
        conflicts.closures.length > 0
      );
    }),
  );
  return (
    conflict?.id ??
    data.resources.find((r) => r.user_id === actorId)?.id ??
    data.resources[0]?.id ??
    ""
  );
}

export type TravelPart = "before" | "visit" | "after";
export function travelPartConflicts(
  visit: TravelVisit,
  resource: Resource | undefined,
  part: TravelPart,
) {
  const start =
    part === "before"
      ? visit.reserved_start
      : part === "visit"
        ? visit.appointment.start_at
        : visit.appointment.end_at;
  const end =
    part === "after"
      ? visit.reserved_end
      : part === "visit"
        ? visit.appointment.end_at
        : visit.appointment.start_at;
  const conflicts = travelAvailabilityConflicts(visit, resource);
  // A zero allowance is a fact, not a non-empty interval.
  const overlaps = (value: { start_at: string; end_at: string }) =>
    Date.parse(end) > Date.parse(start) &&
    intervalsOverlap(start, end, value.start_at, value.end_at);
  return {
    blocks: conflicts.blocks.filter(overlaps),
    closures: conflicts.closures.filter(overlaps),
  };
}

export function compareTravelOrder(
  visits: readonly TravelVisit[],
  sequence: readonly string[],
) {
  const valid =
    sequence.length === visits.length &&
    new Set(sequence).size === visits.length &&
    sequence.every((key) => visits.some((v) => v.key === key));
  const ordered = valid
    ? sequence.map((key) => visits.find((v) => v.key === key)!)
    : [...visits];
  const comparing = ordered.some((v, index) => v.key !== visits[index].key);
  const reversals = (comparing ? ordered : [])
    .filter((visit, index) =>
      ordered
        .slice(0, index)
        .some(
          (previous) =>
            Date.parse(previous.appointment.start_at) >
            Date.parse(visit.appointment.start_at),
        ),
    )
    .map((visit) => visit.key);
  return { ordered, comparing, reversals };
}

export function moveTravelComparison(
  keys: readonly string[],
  index: number,
  direction: -1 | 1,
) {
  const moved = [...keys],
    other = index + direction;
  if (index < 0 || index >= keys.length || other < 0 || other >= keys.length)
    return moved;
  [moved[index], moved[other]] = [moved[other], moved[index]];
  return moved;
}
