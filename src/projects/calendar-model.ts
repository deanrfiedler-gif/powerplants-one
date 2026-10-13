import type { Task } from "./model";

export type WorkingCalendar = {
  key: "PPO-PJ-CALENDAR-01" | "PPO-PJ-CALENDAR-02";
  revision: number;
  name: string;
  timezone: string;
  weekdays: number[];
  exceptions: { date: string; working: boolean; reason: string }[];
};
export const defaultCalendar = (timezone: string): WorkingCalendar => ({
  key: "PPO-PJ-CALENDAR-01",
  revision: 0,
  name: "Synthetic Monday-Friday",
  timezone,
  weekdays: [1, 2, 3, 4, 5],
  exceptions: [],
});
const day = (date: string) => Date.parse(date + "T00:00:00Z") / 86400000;
const isoDay = (n: number) => ((((n + 3) % 7) + 7) % 7) + 1;
export function isWorkingDate(date: string, calendar: WorkingCalendar) {
  return (
    calendar.exceptions.find((e) => e.date === date)?.working ??
    calendar.weekdays.includes(isoDay(day(date)))
  );
}
// Whole weeks plus at most six residual dates and 366 explicit overrides.
export function workingDuration(
  start: string | null,
  finish: string | null,
  calendar: WorkingCalendar,
): number | null {
  if (!start || !finish || finish < start) return null;
  const first = day(start),
    length = day(finish) - first + 1,
    weeks = Math.floor(length / 7);
  let total = weeks * calendar.weekdays.length;
  for (let i = weeks * 7; i < length; i++)
    if (calendar.weekdays.includes(isoDay(first + i))) total++;
  for (const e of calendar.exceptions)
    if (e.date >= start && e.date <= finish)
      total +=
        Number(e.working) -
        Number(calendar.weekdays.includes(isoDay(day(e.date))));
  return total;
}
export function workingVariance(
  original: string | null,
  current: string | null,
  calendar: WorkingCalendar,
): number | null {
  if (!original || !current) return null;
  if (original === current) return 0;
  const low = original < current ? original : current,
    high = original < current ? current : original;
  const count =
    (workingDuration(low, high, calendar) ?? 0) -
    Number(isWorkingDate(low, calendar));
  return count === 0 ? 0 : count * (original < current ? 1 : -1);
}
export function nextWorkingDate(
  date: string,
  calendar: WorkingCalendar,
): string | null {
  // Nonempty normal week and bounded exceptions guarantee a result within this bound,
  // unless the supported four-digit date range ends first.
  for (let i = 1; i <= 7 * (calendar.exceptions.length + 1); i++) {
    const next = new Date((day(date) + i) * 86400000)
      .toISOString()
      .slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next) || next > "9998-12-31") return null;
    if (isWorkingDate(next, calendar)) return next;
  }
  return null;
}
export function calendarIssues(
  task: Task,
  tasks: readonly Task[],
  calendar: WorkingCalendar,
) {
  const issues: {
    code: string;
    predecessor_id?: string;
    earliest_start?: string;
  }[] = [];
  if (
    [task.start_date, task.finish_date].some(
      (d) => d && !isWorkingDate(d, calendar),
    )
  )
    issues.push({ code: "NonworkingEndpoint" });
  for (const dep of task.dependencies) {
    const prior = tasks.find((t) => t.id === dep.task_id);
    if (!prior) {
      issues.push({
        code: "PredecessorUnavailable",
        predecessor_id: dep.task_id,
      });
      continue;
    }
    const date = dep.kind === "FS" ? prior.finish_date : prior.start_date;
    if (!date || !task.start_date) {
      issues.push({ code: "DependencyDatesNeeded", predecessor_id: prior.id });
      continue;
    }
    const earliest = dep.kind === "FS" ? nextWorkingDate(date, calendar) : date;
    if (!earliest)
      issues.push({ code: "CalendarRangeExceeded", predecessor_id: prior.id });
    else if (task.start_date < earliest)
      issues.push({
        code: "DependencyStartBeforeRequired",
        predecessor_id: prior.id,
        earliest_start: earliest,
      });
  }
  return issues;
}
