import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { unavailable } from "../platform/errors";
import { hasPermission } from "../platform/permissions";
import { activityVisibility } from "../activities/activities";
import { deliverySalesSourcesInSnapshot } from "../sales/delivery-binding";
import { invalid, object, uuid } from "../shared/validation";
import { projectRow, tasksFor } from "./service";
import type { Baseline } from "./baseline-model";
import { programmeFor } from "./programme-reads";
import { overviewSchedule } from "./overview-model";
import {
  projectFactProjection,
  projectFactsSql,
  type ProjectFacts,
} from "./portfolio";

export async function readProjectOverview(
  p: Principal,
  projectId: string,
  input: unknown = {},
) {
  const id = uuid(projectId, "project_id"),
    q = object(input, ["baseline_revision"]);
  const revision =
    q.baseline_revision === undefined ? null : Number(q.baseline_revision);
  if (
    revision !== null &&
    (!Number.isSafeInteger(revision) || revision < 1 || revision > 2147483647)
  )
    invalid("baseline_revision", "Choose a saved baseline revision.");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const project = await projectRow(c, p, id),
      observed_at = new Date().toISOString();
    const facts = (
      await c.query<ProjectFacts>(
        projectFactsSql() + " SELECT * FROM classified",
        [p.workspace_id, p.actor_id, observed_at, id],
      )
    ).rows[0];
    if (!facts) throw unavailable();
    const tasks = await tasksFor(c, p, id);
    const baseline =
      (
        await c.query<Baseline>(
          `SELECT b.id,b.revision,b.project_version,b.label,b.reason,b.created_at::text,b.calendar_key,b.snapshot,u.display_name AS actor_name
      FROM ppo.project_schedule_baselines b JOIN ppo.users u ON (u.workspace_id,u.id)=(b.workspace_id,b.created_by)
      WHERE b.workspace_id=$1 AND b.project_id=$2 AND ($3::int IS NULL OR b.revision=$3) ORDER BY b.revision DESC LIMIT 1`,
          [p.workspace_id, id, revision],
        )
      ).rows[0] ?? null;
    if (revision !== null && !baseline) throw unavailable();
    const schedule = overviewSchedule(
      tasks,
      baseline,
      facts.today,
      project.target_date,
    );
    const reasons = (
      await c.query<{
        task_id: string;
        reason: string;
        project_version: number;
      }>(
        `SELECT DISTINCT ON (task_snapshot->>'id') task_snapshot->>'id' AS task_id,reason,project_version
      FROM ppo.project_schedule_events WHERE workspace_id=$1 AND project_id=$2 AND event_type='ProjectTaskSaved'
      ORDER BY task_snapshot->>'id',project_version DESC`,
        [p.workspace_id, id],
      )
    ).rows;
    const team = new Map<
      string,
      {
        id: string;
        name: string;
        external: boolean;
        coordinator: boolean;
        task_ids: string[];
      }
    >();
    team.set(`User:${project.coordinator_id}`, {
      id: project.coordinator_id,
      name: project.coordinator_name,
      external: false,
      coordinator: true,
      task_ids: [],
    });
    for (const task of tasks) {
      const owner = task.owner_id ?? task.external_owner_id;
      if (!owner || task.owner_unavailable) continue;
      const key = `${task.external_owner_id ? "Person" : "User"}:${owner}`;
      const member = team.get(key) ?? {
        id: owner,
        name: task.owner_name ?? "Owner unavailable",
        external: !!task.external_owner_id,
        coordinator: false,
        task_ids: [],
      };
      member.task_ids.push(task.id);
      team.set(key, member);
    }
    const sales = await deliverySalesSourcesInSnapshot(c, p, "Projects", id);
    const salesPartial = sales.items.some(
      (item) => item.access !== "Available",
    );
    const actions = (
      await c.query<{
        id: string;
        version: number;
        summary: string;
        state: string;
        owner_id: string;
        owner_name: string;
        due_at: Date | null;
        due_needed: boolean;
      }>(
        `SELECT a.id,a.version,a.summary,a.status AS state,a.owner_id,u.display_name AS owner_name,a.due_at,a.due_needed
      FROM ppo.activities a JOIN ppo.users u ON (u.workspace_id,u.id)=(a.workspace_id,a.owner_id)
      WHERE a.workspace_id=$1 AND a.status IN ('Open','InProgress') AND ${activityVisibility("a", true, true, true)}
      AND EXISTS(SELECT 1 FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.project_id=$3)
      ORDER BY a.due_at NULLS FIRST,a.id LIMIT 21`,
        [p.workspace_id, p.actor_id, id],
      )
    ).rows;
    const raid = (
      await c.query<{
        id: string;
        kind: string;
        version: number;
        title: string;
        owner_id: string;
        owner_name: string;
        priority: string;
        state: string;
        due_at: Date | null;
        due_needed: boolean;
      }>(
        `SELECT e.id,e.kind,r.version,r.title,r.owner_id,u.display_name AS owner_name,r.priority,r.state,r.due_at,r.due_needed
      FROM ppo.project_raid_entries e JOIN LATERAL (SELECT * FROM ppo.project_raid_revisions WHERE workspace_id=e.workspace_id AND entry_id=e.id ORDER BY version DESC LIMIT 1) r ON true
      JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,r.owner_id)
      WHERE e.workspace_id=$1 AND e.project_id=$2 AND r.state<>'Closed' ORDER BY (r.priority='High') DESC,r.due_at NULLS FIRST,e.id LIMIT 21`,
        [p.workspace_id, id],
      )
    ).rows;
    const history = (
      await c.query<{
        id: string;
        kind: string;
        version: number;
        reason: string;
        recorded_at: Date;
        actor_name: string;
      }>(
        `SELECT * FROM (
      SELECT e.id,e.event_type AS kind,e.project_version AS version,e.reason,e.created_at AS recorded_at,u.display_name AS actor_name
        FROM ppo.project_schedule_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.created_by) WHERE e.workspace_id=$1 AND e.project_id=$2
      UNION ALL SELECT b.id,'BaselineRecorded',b.revision,b.reason,b.created_at,u.display_name
        FROM ppo.project_schedule_baselines b JOIN ppo.users u ON (u.workspace_id,u.id)=(b.workspace_id,b.created_by) WHERE b.workspace_id=$1 AND b.project_id=$2
      ) events ORDER BY recorded_at DESC,id DESC LIMIT 21`,
        [p.workspace_id, id],
      )
    ).rows;
    const canEdit =
      project.lifecycle !== "Closed" &&
      (await hasPermission(
        c,
        p,
        "project.edit",
        project.company_id,
        project.site_id,
      ));
    return {
      project: projectFactProjection(facts),
      programme: await programmeFor(
        c,
        p,
        id,
        project.timezone,
        tasks,
        baseline,
      ),
      schedule: {
        ...schedule,
        attention: schedule.attention.map((item) => ({
          ...item,
          latest_save: reasons.find((r) => r.task_id === item.task.id) ?? null,
        })),
        baseline: baseline
          ? {
              id: baseline.id,
              revision: baseline.revision,
              project_version: baseline.project_version,
              label: baseline.label,
              reason: baseline.reason,
              created_at: baseline.created_at,
              actor_name: baseline.actor_name,
              calendar_key: baseline.calendar_key,
            }
          : null,
        latest_baseline_revision: facts.baseline_revision,
      },
      team: {
        items: [...team.values()],
        completeness: tasks.some((t) => t.owner_unavailable)
          ? "Partial"
          : "Complete",
      },
      receiving: {
        items: sales.items,
        completeness: salesPartial ? "Partial" : "Complete",
        basis: salesPartial
          ? "PartlyUnavailable"
          : sales.items.length
            ? "AcceptedSalesLinks"
            : "NoLinkedSalesHandover",
      },
      actions: {
        items: actions
          .slice(0, 20)
          .map((a) => ({ ...a, due_at: a.due_at?.toISOString() ?? null })),
        has_more: actions.length > 20,
        completeness: facts.actions_partial ? "Partial" : "Complete",
      },
      raid: {
        items: raid
          .slice(0, 20)
          .map((r) => ({ ...r, due_at: r.due_at?.toISOString() ?? null })),
        has_more: raid.length > 20,
      },
      recent_history: {
        items: history
          .slice(0, 20)
          .map((e) => ({ ...e, recorded_at: e.recorded_at.toISOString() })),
        has_more: history.length > 20,
        sources: ["Schedule", "Baselines"],
      },
      can: {
        edit_schedule: canEdit,
        record_baseline: canEdit && project.coordinator_id === p.actor_id,
      },
      observed_at,
      source: "Synthetic",
      completeness:
        salesPartial ||
        facts.actions_partial ||
        tasks.some((t) => t.owner_unavailable)
          ? "Partial"
          : "Complete",
    };
  });
}
