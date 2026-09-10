// Shared, dependency-free schedule contract. All dates are calendar dates, never instants.
export const phases = [
  "Planning",
  "Procurement",
  "Delivery",
  "Handover",
] as const;
export const statuses = [
  "Planned",
  "InProgress",
  "AtRisk",
  "Complete",
] as const;
export type Dependency = { task_id: string; kind: "FS" | "SS" };
export type Task = {
  id: string;
  version: number;
  title: string;
  phase: (typeof phases)[number];
  status: (typeof statuses)[number];
  milestone: boolean;
  start_date: string | null;
  finish_date: string | null;
  progress: number;
  note: string | null;
  owner_id: string | null;
  external_owner_id: string | null;
  owner_name: string | null;
  owner_unavailable?: boolean;
  dependencies: Dependency[];
};
export type Project = {
  id: string;
  version: number;
  display_number: string;
  title: string;
  company_id: string;
  organisation_id: string;
  site_id: string;
  coordinator_id: string;
  customer_name: string;
  site_name: string;
  coordinator_name: string;
  timezone: string;
  target_date: string | null;
  updated_at: string;
  can_edit: boolean;
};
export type Schedule = { project: Project; tasks: Task[]; observed_at: string };
export type Owner = { id: string; display_name: string; external: boolean };
export type ProjectHistory = {
  items: {
    project_version: number;
    event_type: string;
    reason: string;
    created_at: string;
    actor_name: string;
  }[];
  next_cursor: string | null;
};
export const DAY = 86400000;
export const dayNumber = (date: string) =>
  Date.parse(date + "T00:00:00Z") / DAY;
export const addDays = (date: string, days: number) =>
  new Date((dayNumber(date) + days) * DAY).toISOString().slice(0, 10);
export const formatDate = (date: string | null, year = true) =>
  date
    ? new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        ...(year ? ({ year: "numeric" } as const) : {}),
        timeZone: "UTC",
      }).format(new Date(date + "T00:00:00Z"))
    : "Unscheduled";
export function todayInZone(timezone: string, now = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => p.find((v) => v.type === type)!.value)
    .join("-");
}
export function nextWeekday(date: string) {
  let next = addDays(date, 1);
  while ([0, 6].includes(new Date(next + "T00:00:00Z").getUTCDay()))
    next = addDays(next, 1);
  return next;
}
export function scheduleIssues(task: Task, tasks: readonly Task[]) {
  const issues: string[] = [];
  if (
    task.start_date &&
    task.finish_date &&
    [task.start_date, task.finish_date].some((d) =>
      [0, 6].includes(new Date(d + "T00:00:00Z").getUTCDay()),
    )
  )
    issues.push(
      "A date falls on a weekend; review against the project calendar.",
    );
  for (const dep of task.dependencies) {
    const prior = tasks.find((t) => t.id === dep.task_id);
    if (!prior) {
      issues.push("A predecessor is unavailable.");
      continue;
    }
    const date = dep.kind === "FS" ? prior.finish_date : prior.start_date;
    if (!task.start_date || !date) {
      issues.push(`Set dates to check the link from ${prior.title}.`);
      continue;
    }
    const earliest = dep.kind === "FS" ? nextWeekday(date) : date;
    if (task.start_date < earliest)
      issues.push(
        `${prior.title}: ${dep.kind === "FS" ? "finish-to-start" : "start-to-start"} requires a start on or after ${formatDate(earliest)}.`,
      );
  }
  return issues;
}
export function hasCycle(tasks: readonly Pick<Task, "id" | "dependencies">[]) {
  const graph = new Map(tasks.map((t) => [t.id, t.dependencies])),
    visiting = new Set<string>(),
    done = new Set<string>();
  function walk(id: string): boolean {
    if (visiting.has(id)) return true;
    if (done.has(id)) return false;
    visiting.add(id);
    if ((graph.get(id) ?? []).some((d) => walk(d.task_id))) return true;
    visiting.delete(id);
    done.add(id);
    return false;
  }
  return tasks.some((t) => walk(t.id));
}
export const columns = [
  "task",
  "owner",
  "start",
  "finish",
  "progress",
] as const;
export type Column = (typeof columns)[number];
export type Widths = Record<Column, number>;
export const defaultWidths: Record<"gantt" | "list", Widths> = {
  gantt: { task: 264, owner: 84, start: 90, finish: 90, progress: 60 },
  list: { task: 480, owner: 168, start: 104, finish: 104, progress: 64 },
};
export const columnBounds: Record<Column, readonly [number, number]> = {
  task: [160, 720],
  owner: [76, 320],
  start: [84, 220],
  finish: [84, 220],
  progress: [56, 180],
};
export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export const sheetWidth = (widths: Widths) =>
  32 + columns.reduce((n, c) => n + widths[c], 0) + 12;
export const paneMaximum = (available: number) =>
  Math.max(240, Math.min(960, available - 360));
export function timelineRange(
  tasks: readonly Task[],
  today: string,
  target: string | null,
) {
  const dates = tasks.flatMap((t) =>
    t.start_date && t.finish_date ? [t.start_date, t.finish_date] : [],
  );
  if (target) dates.push(target);
  if (!dates.length) dates.push(today);
  const first = dates.reduce((a, b) => (a < b ? a : b)),
    last = dates.reduce((a, b) => (a > b ? a : b));
  const weekday = new Date(first + "T00:00:00Z").getUTCDay();
  const start = addDays(first, -((weekday + 6) % 7) - 7),
    end = addDays(last, 21);
  return { start, end, days: dayNumber(end) - dayNumber(start) + 1 };
}
