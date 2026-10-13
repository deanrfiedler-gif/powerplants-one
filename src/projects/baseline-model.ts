import { dayNumber, type Schedule, type Task } from "./model";

export const projectCalendar = "PPO-PJ-CALENDAR-01" as const;
export type BaselineTask = Pick<
  Task,
  | "id"
  | "version"
  | "title"
  | "phase"
  | "status"
  | "milestone"
  | "start_date"
  | "finish_date"
  | "progress"
  | "dependencies"
>;
export type BaselineSummary = {
  id: string;
  revision: number;
  project_version: number;
  label: string;
  reason: string;
  created_at: string;
  actor_name: string;
  calendar_key: typeof projectCalendar | "PPO-PJ-CALENDAR-02";
};
export type Baseline = BaselineSummary & {
  snapshot: BaselineTask[];
  calendar?: import("./calendar-model").WorkingCalendar;
};
export type BaselineRead = {
  items: BaselineSummary[];
  selected: Baseline | null;
  next_cursor: number | null;
  latest_revision: number;
  can_record: boolean;
  schedule: Schedule;
};
export function dependenciesEqual(a: BaselineTask, b: BaselineTask) {
  const links = (t: BaselineTask) =>
    t.dependencies
      .map((d) => d.task_id + ":" + d.kind)
      .sort()
      .join("|");
  return links(a) === links(b);
}
export function scheduleChanged(a: BaselineTask, b: BaselineTask) {
  return (
    a.start_date !== b.start_date ||
    a.finish_date !== b.finish_date ||
    !dependenciesEqual(a, b)
  );
}
// Union of old and new links: removing an edge must not hide a formerly affected successor.
export function affectedSuccessors(
  ids: readonly string[],
  ...graphs: readonly (readonly BaselineTask[])[]
) {
  const successors = new Map<string, Set<string>>();
  for (const tasks of graphs)
    for (const t of tasks)
      for (const d of t.dependencies) {
        if (!successors.has(d.task_id)) successors.set(d.task_id, new Set());
        successors.get(d.task_id)!.add(t.id);
      }
  const roots = new Set(ids),
    seen = new Set(ids),
    queue = [...ids],
    affected = new Set<string>();
  for (let i = 0; i < queue.length; i++)
    for (const id of successors.get(queue[i]) ?? []) {
      if (!roots.has(id)) affected.add(id);
      if (!seen.has(id)) {
        seen.add(id);
        queue.push(id);
      }
    }
  return affected;
}
export function compareBaseline(
  baseline: readonly BaselineTask[],
  current: readonly Task[],
) {
  const old = new Map(baseline.map((t) => [t.id, t]));
  const rows = current.map((task) => {
    const original = old.get(task.id) ?? null;
    const delta = (a: string | null | undefined, b: string | null) =>
      a && b ? dayNumber(b) - dayNumber(a) : null;
    return {
      task,
      original,
      start_days: delta(original?.start_date, task.start_date),
      finish_days: delta(original?.finish_date, task.finish_date),
      dependencies_changed: !!original && !dependenciesEqual(original, task),
      changed: !original || scheduleChanged(original, task),
    };
  });
  const affected = affectedSuccessors(
    rows.filter((r) => r.changed).map((r) => r.task.id),
    baseline,
    current,
  );
  return rows.map((r) => ({ ...r, affected: affected.has(r.task.id) }));
}
