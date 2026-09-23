import { createHash } from "node:crypto";
import { canonical } from "../../platform/operations";
import type { ReadinessContent, PreparationBasis, WorkWindow } from "./model";

function localParts(instant: string, timezone: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(instant))
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:${values.second}`,
  };
}
const nextDate = (date: string) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + 86400000)
    .toISOString()
    .slice(0, 10);
const previousDate = (date: string) =>
  new Date(Date.parse(`${date}T00:00:00Z`) - 86400000)
    .toISOString()
    .slice(0, 10);
export function withinWindow(
  window: WorkWindow,
  startsAt: string,
  endsAt: string,
  timezone: string,
) {
  const start = localParts(startsAt, timezone),
    end = localParts(endsAt, timezone);
  const season = (date: string) => {
    const day = date.slice(5);
    return window.season_from <= window.season_to
      ? day >= window.season_from && day <= window.season_to
      : day >= window.season_from || day <= window.season_to;
  };
  const from = `${window.start_time}:00`,
    to = `${window.end_time}:00`;
  const duration = Date.parse(endsAt) - Date.parse(startsAt);
  if (duration <= 0 || duration > 26 * 3600000) return false;
  // A morning portion of an overnight window belongs to the previous evening.
  const anchor =
    from > to && start.time <= to ? previousDate(start.date) : start.date;
  if (
    anchor < window.from_date ||
    end.date > window.to_date ||
    !season(anchor) ||
    !season(end.date)
  )
    return false;
  const fits = (point: ReturnType<typeof localParts>) =>
    from < to
      ? point.date === anchor && point.time >= from && point.time <= to
      : (point.date === anchor && point.time >= from) ||
        (point.date === nextDate(anchor) && point.time <= to);
  if (!fits(start) || !fits(end)) return false;
  const offset = (point: ReturnType<typeof localParts>, instant: string) =>
    Date.parse(`${point.date}T${point.time}Z`) - Date.parse(instant);
  if (offset(start, startsAt) !== offset(end, endsAt)) {
    // During a clock change, matching endpoints alone can conceal a repeated
    // hour outside the window. Check the interior in absolute time as well.
    for (
      let t = Date.parse(startsAt) + 60000;
      t < Date.parse(endsAt);
      t += 60000
    )
      if (!fits(localParts(new Date(t).toISOString(), timezone))) return false;
  }
  return true;
}
export function assessPreparation(
  content: ReadinessContent,
  basis: PreparationBasis,
  timezone: string,
  reviewedHashes: string[],
) {
  const blockers: string[] = [];
  const starts = localParts(basis.starts_at, timezone),
    ends = localParts(basis.ends_at, timezone);
  const requirements = content.requirements.filter(
    (r) =>
      (!r.facility_id || basis.facility_ids.includes(r.facility_id)) &&
      (r.activity === "*" || r.activity === basis.activity),
  );
  const targets = basis.facility_ids.length ? basis.facility_ids : [null];
  for (const facility of targets)
    if (!requirements.some((r) => r.facility_id === null || r.facility_id === facility))
      blockers.push(
        `${facility ? `Facility ${facility}` : "Site"}: no applicable requirements recorded; readiness is unknown.`,
      );
  for (const requirement of requirements) {
    const people = requirement.kind === "Induction" ? basis.person_ids : [null];
    if (!people.length)
      blockers.push(
        `${requirement.title}: select every individual visitor for induction checking.`,
      );
    for (const person of people) {
      const matching = content.evidence.filter(
        (e) =>
          e.requirement_id === requirement.id &&
          e.requirement_revision === requirement.revision &&
          e.facility_id === requirement.facility_id &&
          (e.activity === "*" || e.activity === basis.activity) &&
          (requirement.kind !== "Induction" || e.person_id === person) &&
          e.captured_on <= starts.date &&
          e.expires_on >= ends.date,
      );
      if (
        !matching.some((e) =>
          reviewedHashes.includes(
            createHash("sha256").update(canonical(e)).digest("hex"),
          ),
        )
      )
        blockers.push(
          `${requirement.title}${person ? ` · visitor ${person}` : ""}: current, exact reviewed evidence is missing. Captured, expired or superseded evidence does not clear this requirement.`,
        );
    }
  }
  for (const facility of targets)
    if (
      !content.windows.some(
        (w) =>
          (w.facility_id === null || w.facility_id === facility) &&
          (w.activity === "*" || w.activity === basis.activity) &&
          withinWindow(w, basis.starts_at, basis.ends_at, timezone),
      )
    )
      blockers.push(
        `${facility ? `Facility ${facility}` : "Site"}: no recorded work window covers the whole attendance interval. Missing windows do not mean unrestricted access.`,
      );
  return {
    status: blockers.length
      ? "Recheck required"
      : "Recorded preparation checks satisfied",
    blockers,
    work_authority: "Not granted",
    booking: "Not confirmed",
    resource_reservation: "Not made",
    pack_issue: "Not issued",
    dispatch: "Not cleared",
    timezone,
  };
}
