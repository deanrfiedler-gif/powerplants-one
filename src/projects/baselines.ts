import { randomUUID } from "node:crypto";
import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import {
  common,
  commonKeys,
  invalid,
  label,
  object,
  uuid,
  version,
} from "../shared/validation";
import { hasPermission } from "../platform/permissions";
import {
  currentCalendar,
  baselineCalendar,
  programmeFor,
} from "./programme-reads";
import { projectRow, tasksFor } from "./service";
import {
  type Baseline,
  type BaselineRead,
  type BaselineSummary,
} from "./baseline-model";

function revision(value: unknown, field: string, zero = false) {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < (zero ? 0 : 1) ||
    Number(value) > 2147483647
  )
    invalid(field, "A valid baseline revision is required.");
  return Number(value);
}
export async function recordBaseline(p: Principal, id: string, value: unknown) {
  id = uuid(id, "project_id");
  const b = object(value, [
    ...commonKeys,
    "expected_version",
    "expected_baseline_revision",
    "label",
    "reviewed",
  ]);
  if (b.reviewed !== true)
    invalid(
      "reviewed",
      "Review the dated schedule and its warnings before recording a baseline.",
    );
  const command = {
    ...common(b),
    project_id: uuid(id, "project_id"),
    expected_version: version(b.expected_version),
    expected_baseline_revision: revision(
      b.expected_baseline_revision,
      "expected_baseline_revision",
      true,
    ),
    label: label(b.label, "label", 120),
    reviewed: true,
  };
  return sharedOperation(
    p,
    command,
    "RecordProjectBaseline",
    async (c) => {
      const project = await projectRow(c, p, command.project_id, true);
      if (project.coordinator_id !== p.actor_id) throw unavailable();
      const { materialNativeAuthority } =
        await import("../estimating/supply-followup/material-context");
      await materialNativeAuthority(c, p, id, command.operation_id);
      return project;
    },
    async (c, project) => {
      if (project.lifecycle === "Closed")
        throw new AppError(
          409,
          "ProjectClosed",
          "Closed projects cannot record a new baseline.",
        );
      const latest = (
        await c.query<{ n: number }>(
          "SELECT coalesce(max(revision),0) AS n FROM ppo.project_schedule_baselines WHERE workspace_id=$1 AND project_id=$2",
          [p.workspace_id, id],
        )
      ).rows[0].n;
      if (
        project.version !== command.expected_version ||
        latest !== command.expected_baseline_revision
      )
        throw new AppError(
          409,
          "VersionConflict",
          "The schedule or baseline history changed. Reload and review before recording a new baseline.",
        );
      const tasks = await tasksFor(c, p, id);
      if (!tasks.length || tasks.some((t) => !t.start_date || !t.finish_date))
        throw new AppError(
          422,
          "UndatedSchedule",
          "Add at least one task and date every task before recording a baseline.",
        );
      const baselineId = randomUUID();
      const calendar = await currentCalendar(c, p, id, project.timezone);
      const row = (
        await c.query<{ created_at: Date }>(
          `INSERT INTO ppo.project_schedule_baselines(id,workspace_id,company_id,project_id,revision,project_version,label,reason,calendar_key,snapshot,created_by,operation_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,ppo.project_baseline_snapshot($2,$4),$10,$11) RETURNING created_at`,
          [
            baselineId,
            p.workspace_id,
            project.company_id,
            id,
            latest + 1,
            project.version,
            command.label,
            command.reason,
            calendar.key,
            p.actor_id,
            command.operation_id,
          ],
        )
      ).rows[0];
      if ("id" in calendar)
        await c.query(
          "INSERT INTO ppo.project_baseline_calendars(baseline_id,calendar_id) VALUES($1,$2)",
          [baselineId, calendar.id],
        );
      return {
        id,
        version: project.version,
        state: "BaselineRecorded",
        updated_at: row.created_at,
        audit_details: {
          baseline_id: baselineId,
          baseline_revision: latest + 1,
        },
      };
    },
    "Project",
    "SharedRecordUpdated",
  );
}
export async function readBaselines(
  p: Principal,
  id: string,
  input: unknown = {},
): Promise<BaselineRead> {
  const q = object(input, ["before", "revision"]);
  const before =
    q.before === undefined ? null : revision(Number(q.before), "before");
  const selectedRevision =
    q.revision === undefined ? null : revision(Number(q.revision), "revision");
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const project = await projectRow(c, p, id);
    const canEdit =
      project.lifecycle !== "Closed" &&
      (await hasPermission(
        c,
        p,
        "project.edit",
        project.company_id,
        project.site_id,
      ));
    const select = `SELECT b.id,b.revision,b.project_version,b.label,b.reason,b.created_at::text,b.calendar_key,u.display_name AS actor_name
      FROM ppo.project_schedule_baselines b JOIN ppo.users u ON (u.workspace_id,u.id)=(b.workspace_id,b.created_by)`;
    const rows = (
      await c.query<BaselineSummary>(
        select +
          " WHERE b.workspace_id=$1 AND b.project_id=$2 AND ($3::integer IS NULL OR b.revision<$3) ORDER BY b.revision DESC LIMIT 21",
        [p.workspace_id, id, before],
      )
    ).rows;
    const latest = (
      await c.query<{ n: number }>(
        "SELECT coalesce(max(revision),0) AS n FROM ppo.project_schedule_baselines WHERE workspace_id=$1 AND project_id=$2",
        [p.workspace_id, id],
      )
    ).rows[0].n;
    const chosen = selectedRevision ?? rows[0]?.revision ?? null;
    const selected =
      chosen === null
        ? null
        : (
            await c.query<Baseline>(
              select.replace("b.id,b.revision", "b.snapshot,b.id,b.revision") +
                " WHERE b.workspace_id=$1 AND b.project_id=$2 AND b.revision=$3",
              [p.workspace_id, id, chosen],
            )
          ).rows[0];
    const tasks = await tasksFor(c, p, id);
    if (chosen !== null && !selected) throw unavailable();
    if (selected)
      selected.calendar = await baselineCalendar(
        c,
        p,
        id,
        selected,
        project.timezone,
      );
    return {
      items: rows.slice(0, 20),
      selected: selected ?? null,
      next_cursor: rows.length > 20 ? rows[19].revision : null,
      latest_revision: latest,
      can_record: canEdit && project.coordinator_id === p.actor_id,
      schedule: {
        project: {
          ...project,
          updated_at: project.updated_at.toISOString(),
          can_edit: canEdit,
        },
        tasks,
        programme: await programmeFor(
          c,
          p,
          id,
          project.timezone,
          tasks,
          selected ?? null,
        ),
        observed_at: new Date().toISOString(),
      },
    };
  });
}
