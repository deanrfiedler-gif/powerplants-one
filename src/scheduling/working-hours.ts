import { localDateTime } from "./time";

// Dean, 10 October 2026: standard hours are 08:00 to 17:00; technicians sometimes work
// 07:00 to 18:00, which is avoided where possible. Published calendars allow 07:00 to 18:00
// and fitsWorkingInterval still decides what can be booked. This rule only warns.
// Recorded in docs/decisions/ui-build-sequence.md ("Planner working hours").
export const STANDARD_START_MINUTE = 8 * 60;
export const STANDARD_END_MINUTE = 17 * 60;
const STANDARD_TEXT = "08:00 to 17:00";

export type CrewTravel = {
  timezone: string;
  travel_before_minutes: number;
  travel_after_minutes: number;
};

const minuteOfDay = (local: string) =>
  Number(local.slice(11, 13)) * 60 + Number(local.slice(14, 16));

// The person's whole reservation (visit plus travel) in their calendar's local time, when
// any of it falls outside standard hours. Uses the same buffered interval as the calendar guard.
export function extendedHours(
  start_at: string,
  end_at: string,
  member: CrewTravel,
): { from: string; to: string } | null {
  const from = localDateTime(
    new Date(
      Date.parse(start_at) - member.travel_before_minutes * 60000,
    ).toISOString(),
    member.timezone,
  );
  const to = localDateTime(
    new Date(
      Date.parse(end_at) + member.travel_after_minutes * 60000,
    ).toISOString(),
    member.timezone,
  );
  const outside =
    from.slice(0, 10) !== to.slice(0, 10) ||
    minuteOfDay(from) < STANDARD_START_MINUTE ||
    minuteOfDay(to) > STANDARD_END_MINUTE;
  return outside ? { from: from.slice(11), to: to.slice(11) } : null;
}

// One plain sentence per person, naming them and the times.
export function extendedHoursNotice(
  name: string,
  span: { from: string; to: string },
  withTravel: boolean,
) {
  return `${name}: ${span.from} to ${span.to}${withTravel ? " including travel" : ""}, outside the ${STANDARD_TEXT} standard hours.`;
}

export const EXTENDED_HOURS_ADVICE = `Standard hours are ${STANDARD_TEXT}. The calendar allows this booking, but try to avoid work outside standard hours.`;
