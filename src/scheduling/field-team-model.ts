import type { Schedule, ScheduleAppointment } from "./index";
import { competenceState, type ResourceEvidence } from "./workspace-model";
import { addDays, localDateTime, utcFromLocal } from "./time";
import { dayMinute, hoursText, laneDay } from "./day-timeline";
import { plannerContext } from "./navigation";
import { currentCrew, preparationReasons } from "./field-technicians-view";

// scheduleLanes already publishes this evidence in one permission-scoped snapshot.
export type FieldTeamSchedule = Omit<Schedule, "resources"> & {
  resources: ResourceEvidence[];
};
export const peopleViews = [
  "active",
  "away",
  "inactive",
  "competence",
] as const;
export function fieldTeamCriteria(q: URLSearchParams) {
  const one = (key: string) => (q.getAll(key).length === 1 ? q.get(key)! : "");
  return {
    ...plannerContext(q),
    view: ["visits", "attention"].includes(one("view"))
      ? (one("view") as "visits" | "attention")
      : ("team" as const),
    people: peopleViews.includes(one("people") as (typeof peopleViews)[number])
      ? one("people")
      : "",
    search: one("search").slice(0, 200),
  };
}
export function fieldTeamHref(
  day: string,
  zone: string,
  site = "",
  resource = "",
  record = false,
) {
  return (
    `/service/technicians${record && resource ? "/" + resource : ""}?` +
    new URLSearchParams({
      day,
      timezone: zone,
      ...(site ? { site_id: site } : {}),
      ...(!record && resource ? { view: "visits", resource_id: resource } : {}),
    })
  );
}
export function reviewWindow(day: string, zone: string) {
  return {
    from: utcFromLocal(day + "T00:00", zone),
    to: utcFromLocal(addDays(day, 7) + "T00:00", zone),
  };
}
export function skillsSummary(
  resource: ResourceEvidence,
  from: string,
  to: string,
) {
  const counts = {
    verified: 0,
    expiring: 0,
    expired: 0,
    unknown: 0,
    future: 0,
    inactive: 0,
  };
  for (const skill of resource.skills) {
    const state = competenceState(skill, from, to);
    if (state === "Verified for selected period") counts.verified++;
    else if (state === "Expires within selected period") counts.expiring++;
    else if (state === "Expired") counts.expired++;
    else if (state === "Not yet valid") counts.future++;
    else if (state === "Inactive") counts.inactive++;
    else counts.unknown++;
  }
  const review =
    counts.expiring +
    counts.expired +
    counts.unknown +
    counts.future +
    counts.inactive;
  const text =
    [
      counts.expired && `${counts.expired} expired`,
      counts.expiring && `${counts.expiring} expiring`,
      counts.unknown && `${counts.unknown} unknown`,
      counts.future && `${counts.future} not yet valid`,
      counts.inactive && `${counts.inactive} inactive`,
    ]
      .filter(Boolean)
      .join(" · ") ||
    (counts.verified
      ? `${counts.verified} verified`
      : "No competence evidence · Unknown");
  return { ...counts, review, text };
}
export function personDay(
  resource: ResourceEvidence,
  day: string,
  zone: string,
  now?: string,
) {
  return laneDay({
    calendar: resource.calendar,
    blocks: resource.blocks ?? [],
    exceptions: resource.exceptions ?? [],
    busy: resource.busy ?? [],
    day,
    zone,
    now,
  });
}
export function hoursLabel(
  resource: ResourceEvidence,
  day: string,
  zone: string,
) {
  const lane = personDay(resource, day, zone);
  if (!resource.active) return "Inactive · cannot book";
  if (lane.away)
    return `${lane.unavailable[0]?.label ?? "Unavailable"} · all day`;
  if (!lane.working.length) return "No published hours";
  return `${hoursText(lane.bookedMinutes)} of ${hoursText(lane.capacityMinutes)} h booked`;
}
export function personVisits(
  items: ScheduleAppointment[],
  id: string,
  day?: string,
  zone = "Australia/Brisbane",
) {
  return items
    .filter(
      (a) =>
        currentCrew(a).some((x) => x.resource_id === id) &&
        (!day ||
          (dayMinute(a.start_at, zone, day) < 1440 &&
            dayMinute(a.end_at, zone, day) > 0)),
    )
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}
export function teamRows(
  data: FieldTeamSchedule,
  criteria: ReturnType<typeof fieldTeamCriteria>,
) {
  const { from, to } = reviewWindow(criteria.day, criteria.zone);
  return data.resources
    .map((resource) => ({
      resource,
      lane: personDay(resource, criteria.day, criteria.zone),
      skills: skillsSummary(resource, from, to),
      visits: personVisits(
        data.items,
        resource.id,
        criteria.day,
        criteria.zone,
      ),
    }))
    .filter(
      ({ resource: r, lane, skills }) =>
        (!criteria.resource || r.id === criteria.resource) &&
        (!criteria.people ||
          (criteria.people === "active"
            ? r.active
            : criteria.people === "inactive"
              ? !r.active
              : criteria.people === "away"
                ? lane.away && r.active
                : skills.review > 0 || !r.skills.length)) &&
        [
          r.name,
          r.resource_type,
          r.base_timezone,
          ...r.skills.map((s) => s.skill_code),
        ]
          .join(" ")
          .toLowerCase()
          .includes(criteria.search.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(!a.resource.active || a.lane.away) -
          Number(!b.resource.active || b.lane.away) ||
        a.resource.name.localeCompare(b.resource.name) ||
        a.resource.id.localeCompare(b.resource.id),
    );
}
export function phoneStatus(
  resource: ResourceEvidence,
  skills: ReturnType<typeof skillsSummary>,
  visits: ScheduleAppointment[],
) {
  const needs = visits.filter((v) => preparationReasons(v).length).length;
  return (
    [
      needs && `${needs} visit${needs === 1 ? "" : "s"} needs preparation`,
      skills.review && skills.text,
    ]
      .filter(Boolean)
      .join(" · ") ||
    (!resource.skills.length
      ? "Competence evidence Unknown"
      : "No preparation flags")
  );
}
export const shortDay = (day: string) =>
  new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(day + "T12:00:00Z"));
export const timeText = (iso: string, zone: string) =>
  localDateTime(iso, zone).slice(11, 16);
export const resourceReadComplete = (value: string) =>
  value === "Complete" ||
  value ===
    "Permitted sites and bounded period; other bookings are anonymous busy intervals";
