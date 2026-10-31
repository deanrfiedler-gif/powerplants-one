import { addDays, localDateTime, utcFromLocal } from "./time";

export type PreparationCalendar = {
  timezone: string;
  effective_from: string;
  effective_to: string;
  intervals: { weekday: number; start_minute: number; end_minute: number }[];
  exceptions: { start_at: string; end_at: string }[];
};

function minuteInstant(day: string, minute: number, zone: string) {
  if (minute === 1440) return utcFromLocal(`${addDays(day, 1)}T00:00`, zone);
  return utcFromLocal(
    `${day}T${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
    zone,
  );
}

// A working day has some published working time left after closures. Calendar
// time belongs to the lead; the day and the noon deadline belong to the site.
// No implicit Monday-Friday rule, local-machine timezone or wall clock.
export function preparationDeadline(
  start: string,
  siteZone: string,
  minute: number,
  calendar: PreparationCalendar,
): string | null {
  const visitDay = localDateTime(start, siteZone).slice(0, 10);
  for (let back = 1; back <= 366; back++) {
    const day = addDays(visitDay, -back);
    const from = Date.parse(minuteInstant(day, 0, siteZone));
    const to = Date.parse(minuteInstant(day, 1440, siteZone));
    // Reaching the start of the published source means earlier days lack authority.
    if (from < Date.parse(calendar.effective_from)) return null;
    if (to > Date.parse(calendar.effective_to)) continue;
    const first = localDateTime(
      new Date(from).toISOString(),
      calendar.timezone,
    ).slice(0, 10);
    const last = localDateTime(
      new Date(to - 1).toISOString(),
      calendar.timezone,
    ).slice(0, 10);
    for (
      let localDay = first;
      localDay <= last;
      localDay = addDays(localDay, 1)
    ) {
      const weekday = new Date(`${localDay}T12:00:00Z`).getUTCDay();
      for (const interval of calendar.intervals.filter(
        (i) => i.weekday === weekday,
      )) {
        const left = Math.max(
          from,
          Date.parse(
            minuteInstant(localDay, interval.start_minute, calendar.timezone),
          ),
        );
        const right = Math.min(
          to,
          Date.parse(
            minuteInstant(localDay, interval.end_minute, calendar.timezone),
          ),
        );
        if (left >= right) continue;
        let fragments = [[left, right]];
        for (const closed of calendar.exceptions) {
          const a = Date.parse(closed.start_at),
            b = Date.parse(closed.end_at);
          fragments = fragments.flatMap(([l, r]) =>
            a >= r || b <= l
              ? [[l, r]]
              : [...(a > l ? [[l, a]] : []), ...(b < r ? [[b, r]] : [])],
          );
        }
        if (fragments.length) return minuteInstant(day, minute, siteZone);
      }
    }
  }
  return null;
}
