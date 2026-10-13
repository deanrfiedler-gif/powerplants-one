import type { QueryClient } from "../platform/permissions";
import type { Principal } from "../platform/identity";
import type { Task } from "./model";
import type { Baseline } from "./baseline-model";
import {
  calendarIssues,
  defaultCalendar,
  workingDuration,
  workingVariance,
  type WorkingCalendar,
} from "./calendar-model";

// Historical upgrade proofs read their original schema before installing 0088.
export async function hasProgramme(c: QueryClient) {
  return (
    await c.query<{ present: boolean }>(
      "SELECT to_regclass('ppo.project_calendar_revisions') IS NOT NULL AS present",
    )
  ).rows[0].present;
}
export type CalendarRevision = WorkingCalendar & {
  id: string;
  project_version: number;
  reason: string;
  created_at: string;
  actor_name: string;
};
export const calendarSelect = `SELECT r.id,'PPO-PJ-CALENDAR-02' AS key,r.revision,r.project_version,r.name,r.timezone,r.weekdays,r.exceptions,r.reason,r.created_at::text,u.display_name AS actor_name
 FROM ppo.project_calendar_revisions r JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.created_by)`;
export async function currentCalendar(
  c: QueryClient,
  p: Principal,
  id: string,
  zone: string,
): Promise<WorkingCalendar | CalendarRevision> {
  if (!(await hasProgramme(c))) return defaultCalendar(zone);
  return (
    (
      await c.query<CalendarRevision>(
        calendarSelect +
          " WHERE r.workspace_id=$1 AND r.project_id=$2 ORDER BY r.revision DESC LIMIT 1",
        [p.workspace_id, id],
      )
    ).rows[0] ?? defaultCalendar(zone)
  );
}
export async function baselineCalendar(
  c: QueryClient,
  p: Principal,
  id: string,
  baseline: Baseline,
  zone: string,
): Promise<WorkingCalendar> {
  if (baseline.calendar_key === "PPO-PJ-CALENDAR-01")
    return defaultCalendar(zone);
  const row = (
    await c.query<CalendarRevision>(
      calendarSelect +
        " JOIN ppo.project_baseline_calendars b ON b.calendar_id=r.id WHERE r.workspace_id=$1 AND r.project_id=$2 AND b.baseline_id=$3",
      [p.workspace_id, id, baseline.id],
    )
  ).rows[0];
  if (!row) throw Error("Missing accepted baseline calendar evidence");
  return row;
}
export type ActualRevision = {
  id: string;
  task_id: string;
  revision: number;
  project_version: number;
  task_version: number;
  forecast_start: string | null;
  forecast_finish: string | null;
  actual_start: string | null;
  actual_finish: string | null;
  timezone: string;
  reason: string;
  created_at: string;
  actor_name: string;
};
export const actualSelect = `SELECT r.id,r.task_id,r.revision,r.project_version,r.task_version,r.forecast_start::text,r.forecast_finish::text,r.actual_start::text,r.actual_finish::text,r.timezone,r.reason,r.created_at::text,u.display_name AS actor_name
 FROM ppo.project_task_actual_revisions r JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.created_by)`;
export async function programmeFor(
  c: QueryClient,
  p: Principal,
  id: string,
  zone: string,
  tasks: Task[],
  baseline: Baseline | null = null,
) {
  const calendar = await currentCalendar(c, p, id, zone);
  const actuals = (await hasProgramme(c))
    ? (
        await c.query<ActualRevision>(
          actualSelect.replace("SELECT ", "SELECT DISTINCT ON (r.task_id) ") +
            " WHERE r.workspace_id=$1 AND r.project_id=$2 ORDER BY r.task_id,r.revision DESC",
          [p.workspace_id, id],
        )
      ).rows
    : [];
  const comparison = baseline
    ? await baselineCalendar(c, p, id, baseline, zone)
    : null;
  return {
    calendar,
    comparison_calendar: comparison,
    baseline_revision: baseline?.revision ?? null,
    tasks: tasks.map((t) => {
      const actual = actuals.find((a) => a.task_id === t.id) ?? null,
        original = baseline?.snapshot.find((b) => b.id === t.id);
      return {
        task_id: t.id,
        actual,
        forecast_working_days: workingDuration(
          t.start_date,
          t.finish_date,
          calendar,
        ),
        actual_working_days: actual
          ? workingDuration(actual.actual_start, actual.actual_finish, calendar)
          : null,
        actual_start_variance_working_days: workingVariance(
          t.start_date,
          actual?.actual_start ?? null,
          calendar,
        ),
        actual_finish_variance_working_days: workingVariance(
          t.finish_date,
          actual?.actual_finish ?? null,
          calendar,
        ),
        baseline_actual_start_variance_working_days: comparison
          ? workingVariance(
              original?.start_date ?? null,
              actual?.actual_start ?? null,
              comparison,
            )
          : null,
        baseline_actual_finish_variance_working_days: comparison
          ? workingVariance(
              original?.finish_date ?? null,
              actual?.actual_finish ?? null,
              comparison,
            )
          : null,
        baseline_start_variance_working_days: comparison
          ? workingVariance(
              original?.start_date ?? null,
              t.start_date,
              comparison,
            )
          : null,
        baseline_finish_variance_working_days: comparison
          ? workingVariance(
              original?.finish_date ?? null,
              t.finish_date,
              comparison,
            )
          : null,
        warnings: [
          ...calendarIssues(t, tasks, calendar).map((i) => i.code),
          ...(actual?.actual_finish && t.status !== "Complete"
            ? ["ActualFinishWithoutCompleteStatus"]
            : []),
          ...(t.status === "Complete" && !actual?.actual_finish
            ? ["CompleteStatusWithoutActualFinish"]
            : []),
        ],
      };
    }),
  };
}
