import { randomUUID } from "node:crypto";
import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import { hasPermission } from "../platform/permissions";
import { object, uuid } from "../shared/validation";
import { projectRow, tasksFor } from "./service";
import { todayInZone } from "./model";
import { parseActuals, parseCalendar, revision } from "./programme-validation";
import {
  actualSelect,
  calendarSelect,
  currentCalendar,
  type ActualRevision,
  type CalendarRevision,
} from "./programme-reads";

export async function recordCalendar(p: Principal, id: string, value: unknown) {
  return record(p, parseCalendar(id, value));
}
export async function recordActuals(
  p: Principal,
  id: string,
  taskId: string,
  value: unknown,
) {
  return record(p, parseActuals(id, taskId, value));
}
async function record(
  p: Principal,
  command: ReturnType<typeof parseCalendar> | ReturnType<typeof parseActuals>,
) {
  const calendar = "weekdays" in command,
    name = calendar ? "RecordProjectCalendar" : "RecordProjectActuals",
    table = calendar
      ? "project_calendar_revisions"
      : "project_task_actual_revisions";
  return sharedOperation(
    p,
    command,
    name,
    async (c) => {
      const project = await projectRow(c, p, command.project_id, true);
      if (calendar && project.coordinator_id !== p.actor_id)
        throw unavailable();
      return project;
    },
    async (c, project) => {
      if (project.lifecycle === "Closed")
        throw new AppError(
          409,
          "ProjectClosed",
          "Closed projects cannot record programme changes.",
        );
      const latest = (
        await c.query<{ n: number }>(
          `SELECT coalesce(max(revision),0) n FROM ppo.${table} WHERE workspace_id=$1 AND project_id=$2${!calendar ? " AND task_id=$3" : ""}`,
          [p.workspace_id, project.id, ...(!calendar ? [command.task_id] : [])],
        )
      ).rows[0].n;
      if (
        project.version !== command.expected_version ||
        latest !== command.expected_revision
      )
        throw new AppError(
          409,
          "VersionConflict",
          "The Project or revision history changed. Reload and review.",
        );
      const task = !calendar
        ? (await tasksFor(c, p, project.id)).find(
            (t) => t.id === command.task_id,
          )
        : null;
      if (!calendar) {
        if (!task) throw unavailable();
        if (task.version !== command.expected_task_version)
          throw new AppError(
            409,
            "VersionConflict",
            "The task forecast changed. Reload and review.",
          );
        const today = todayInZone(project.timezone);
        if (
          (command.actual_start && command.actual_start > today) ||
          (command.actual_finish && command.actual_finish > today)
        )
          throw new AppError(
            422,
            "InvalidData",
            "Actual dates cannot be in the future in the Project site timezone.",
          );
      }
      const updated = (
        await c.query<{ version: number; updated_at: Date }>(
          "UPDATE ppo.projects SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING version,updated_at",
          [p.workspace_id, project.id, p.actor_id],
        )
      ).rows[0];
      const recordId = randomUUID(),
        base = [
          recordId,
          p.workspace_id,
          project.company_id,
          project.id,
          latest + 1,
          updated.version,
          project.timezone,
          command.reason,
          p.actor_id,
          command.operation_id,
        ];
      if (calendar)
        await c.query(
          `INSERT INTO ppo.project_calendar_revisions(id,workspace_id,company_id,project_id,revision,project_version,timezone,reason,created_by,operation_id,name,weekdays,exceptions,reviewed) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true)`,
          [
            ...base,
            command.name,
            command.weekdays,
            JSON.stringify(command.exceptions),
          ],
        );
      else
        await c.query(
          `INSERT INTO ppo.project_task_actual_revisions(id,workspace_id,company_id,project_id,revision,project_version,timezone,reason,created_by,operation_id,task_id,task_version,forecast_start,forecast_finish,actual_start,actual_finish) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [
            ...base,
            command.task_id,
            task!.version,
            task!.start_date,
            task!.finish_date,
            command.actual_start,
            command.actual_finish,
          ],
        );
      await c.query(
        `INSERT INTO ppo.project_schedule_events(id,workspace_id,company_id,project_id,created_by,updated_by,operation_id,project_version,event_type,reason,project_snapshot)
      SELECT $1,p.workspace_id,p.company_id,p.id,$2,$2,$3,p.version,$4,$5,to_jsonb(p) FROM ppo.projects p WHERE p.workspace_id=$6 AND p.id=$7`,
        [
          randomUUID(),
          p.actor_id,
          command.operation_id,
          calendar ? "ProjectCalendarRecorded" : "ProjectActualsRecorded",
          command.reason,
          p.workspace_id,
          project.id,
        ],
      );
      const snapshot = (
        await c.query<{ snapshot: Record<string, unknown> }>(
          `SELECT to_jsonb(r) snapshot FROM ppo.${table} r WHERE id=$1`,
          [recordId],
        )
      ).rows[0].snapshot;
      return {
        id: project.id,
        ...updated,
        state: calendar ? "CalendarRecorded" : "ActualsRecorded",
        audit_details: { programme_snapshot: snapshot },
      };
    },
    "Project",
    "SharedRecordUpdated",
  );
}
function historyInput(input: unknown) {
  const q = object(input, ["before"]);
  return q.before === undefined
    ? null
    : revision(Number(q.before), "before", false);
}
export async function readCalendar(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  id = uuid(id, "project_id");
  const before = historyInput(input);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const project = await projectRow(c, p, id),
      current = await currentCalendar(c, p, id, project.timezone);
    const rows = (
      await c.query<CalendarRevision>(
        calendarSelect +
          " WHERE r.workspace_id=$1 AND r.project_id=$2 AND ($3::int IS NULL OR r.revision<$3) ORDER BY r.revision DESC LIMIT 21",
        [p.workspace_id, id, before],
      )
    ).rows;
    return {
      project_version: project.version,
      current,
      items: rows.slice(0, 20),
      next_cursor: rows.length > 20 ? rows[19].revision : null,
      can_record:
        project.lifecycle !== "Closed" &&
        project.coordinator_id === p.actor_id &&
        (await hasPermission(
          c,
          p,
          "project.edit",
          project.company_id,
          project.site_id,
        )),
    };
  });
}
export async function readActuals(
  p: Principal,
  id: string,
  taskId: string,
  input: unknown = {},
) {
  id = uuid(id, "project_id");
  taskId = uuid(taskId, "task_id");
  const before = historyInput(input);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const project = await projectRow(c, p, id),
      task = (await tasksFor(c, p, id)).find((t) => t.id === taskId);
    if (!task) throw unavailable();
    const select =
      actualSelect +
      " WHERE r.workspace_id=$1 AND r.project_id=$2 AND r.task_id=$3";
    const current =
      (
        await c.query<ActualRevision>(
          select + " ORDER BY r.revision DESC LIMIT 1",
          [p.workspace_id, id, taskId],
        )
      ).rows[0] ?? null;
    const rows = (
      await c.query<ActualRevision>(
        select +
          " AND ($4::int IS NULL OR r.revision<$4) ORDER BY r.revision DESC LIMIT 21",
        [p.workspace_id, id, taskId, before],
      )
    ).rows;
    return {
      project_version: project.version,
      task,
      current,
      latest_revision: current?.revision ?? 0,
      items: rows.slice(0, 20),
      next_cursor: rows.length > 20 ? rows[19].revision : null,
      can_record:
        project.lifecycle !== "Closed" &&
        (await hasPermission(
          c,
          p,
          "project.edit",
          project.company_id,
          project.site_id,
        )),
    };
  });
}
