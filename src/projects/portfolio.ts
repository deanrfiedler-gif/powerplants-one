import { activityVisibility } from "../activities/activities";
import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { requireCapability } from "../platform/permissions";
import { workingCompanyFor } from "../platform/working-company";
import { page, visibility } from "../shared/reads";
import { choice, object, optionalId } from "../shared/validation";
import { dayNumber } from "./model";
import { projectVisibility } from "./visibility";

export const attentionStates = [
  "NeedsAttention",
  "InformationNeeded",
  "NoCurrentFlags",
  "Closed",
] as const;
export type ProjectFacts = {
  id: string;
  version: number;
  acceptance_version: number;
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
  lifecycle: "Active" | "Closed";
  updated_at: Date | string;
  target_date: string | null;
  today: string;
  task_count: number;
  completed_tasks: number;
  undated_tasks: number;
  unassigned_tasks: number;
  unavailable_owners: number;
  at_risk_tasks: number;
  overdue_milestones: number;
  start_date: string | null;
  forecast_finish: string | null;
  baseline_revision: number | null;
  baseline_finish: string | null;
  next_milestone: { id: string; title: string; finish_date: string } | null;
  open_actions: number;
  overdue_actions: number;
  undated_actions: number;
  actions_partial: boolean;
  open_raid: number;
  high_priority_raid: number;
  overdue_raid: number;
  attention_state: (typeof attentionStates)[number];
};

// The same source and classification power both rows and all-match counts.
// $1 workspace, $2 actor, $3 observation instant, $4 optional exact Project.
export function projectFactsSql() {
  return `WITH facts AS (
    SELECT p.id,p.version,p.acceptance_version,p.display_number,p.title,p.company_id,p.organisation_id,p.site_id,p.coordinator_id,
      p.lifecycle,p.updated_at,p.target_date::text,o.display_name AS customer_name,s.display_name AS site_name,
      u.display_name AS coordinator_name,s.timezone,($3::timestamptz AT TIME ZONE s.timezone)::date::text AS today,
      t.*,b.revision AS baseline_revision,b.finish AS baseline_finish,
      (SELECT jsonb_build_object('id',m.id,'title',m.title,'finish_date',m.finish_date::text) FROM ppo.project_tasks m
        WHERE m.workspace_id=p.workspace_id AND m.project_id=p.id AND m.milestone AND m.status<>'Complete' AND m.finish_date IS NOT NULL
        ORDER BY m.finish_date,m.id LIMIT 1) AS next_milestone,
      a.open_actions,a.overdue_actions,a.undated_actions,a.actions_partial,r.*
    FROM ppo.projects p
    JOIN ppo.organisations o ON (o.workspace_id,o.id)=(p.workspace_id,p.organisation_id)
    JOIN ppo.sites s ON (s.workspace_id,s.id)=(p.workspace_id,p.site_id)
    JOIN ppo.users u ON (u.workspace_id,u.id)=(p.workspace_id,p.coordinator_id)
    CROSS JOIN LATERAL (
      SELECT count(*)::int AS task_count,count(*) FILTER(WHERE status='Complete')::int AS completed_tasks,
        count(*) FILTER(WHERE start_date IS NULL OR finish_date IS NULL)::int AS undated_tasks,
        count(*) FILTER(WHERE status<>'Complete' AND owner_id IS NULL AND external_owner_id IS NULL)::int AS unassigned_tasks,
        count(*) FILTER(WHERE external_owner_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.people pe WHERE pe.workspace_id=p.workspace_id AND pe.id=external_owner_id AND ${visibility("Person", "pe")}))::int AS unavailable_owners,
        count(*) FILTER(WHERE status='AtRisk')::int AS at_risk_tasks,
        count(*) FILTER(WHERE milestone AND status<>'Complete' AND finish_date<($3::timestamptz AT TIME ZONE s.timezone)::date)::int AS overdue_milestones,
        CASE WHEN count(*) FILTER(WHERE start_date IS NULL OR finish_date IS NULL)=0 THEN min(start_date)::text END AS start_date,
        CASE WHEN count(*) FILTER(WHERE start_date IS NULL OR finish_date IS NULL)=0 THEN max(finish_date)::text END AS forecast_finish
      FROM ppo.project_tasks WHERE workspace_id=p.workspace_id AND project_id=p.id
    ) t
    LEFT JOIN LATERAL (
      SELECT revision,(SELECT max(x->>'finish_date') FROM jsonb_array_elements(snapshot) x) AS finish
      FROM ppo.project_schedule_baselines WHERE workspace_id=p.workspace_id AND project_id=p.id ORDER BY revision DESC LIMIT 1
    ) b ON true
    CROSS JOIN LATERAL (
      SELECT count(*) FILTER(WHERE permitted AND status IN ('Open','InProgress'))::int AS open_actions,
        count(*) FILTER(WHERE permitted AND status IN ('Open','InProgress') AND due_at<$3::timestamptz)::int AS overdue_actions,
        count(*) FILTER(WHERE permitted AND status IN ('Open','InProgress') AND due_needed)::int AS undated_actions,
        coalesce(bool_or(NOT permitted),false) AS actions_partial
      FROM (SELECT a.status,a.due_at,a.due_needed,${activityVisibility("a", true, true, true)} AS permitted
        FROM ppo.activities a WHERE a.workspace_id=p.workspace_id AND EXISTS(SELECT 1 FROM ppo.activity_links l
          WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.project_id=p.id)) actions
    ) a
    CROSS JOIN LATERAL (
      SELECT count(*) FILTER(WHERE r.state<>'Closed')::int AS open_raid,
        count(*) FILTER(WHERE r.state<>'Closed' AND r.priority='High')::int AS high_priority_raid,
        count(*) FILTER(WHERE r.state<>'Closed' AND r.due_at<$3::timestamptz)::int AS overdue_raid
      FROM ppo.project_raid_entries e JOIN LATERAL (SELECT state,priority,due_at FROM ppo.project_raid_revisions
        WHERE workspace_id=e.workspace_id AND entry_id=e.id ORDER BY version DESC LIMIT 1) r ON true
      WHERE e.workspace_id=p.workspace_id AND e.project_id=p.id
    ) r
    WHERE p.workspace_id=$1 AND ($4::uuid IS NULL OR p.id=$4) AND ${projectVisibility("p")}
  ), classified AS (
    SELECT *,CASE WHEN lifecycle='Closed' THEN 'Closed'
      WHEN overdue_milestones+at_risk_tasks+overdue_actions+high_priority_raid+overdue_raid>0 THEN 'NeedsAttention'
      WHEN task_count=0 OR undated_tasks+unassigned_tasks+unavailable_owners+undated_actions>0 OR actions_partial THEN 'InformationNeeded'
      ELSE 'NoCurrentFlags' END AS attention_state FROM facts
  )`;
}
export function projectFactProjection(r: ProjectFacts) {
  const reasons = [
    ["OverdueMilestones", r.overdue_milestones],
    ["AtRiskTasks", r.at_risk_tasks],
    ["OverdueActions", r.overdue_actions],
    ["HighPriorityRaid", r.high_priority_raid],
    ["OverdueRaid", r.overdue_raid],
    ["UndatedTasks", r.undated_tasks],
    ["UnassignedTasks", r.unassigned_tasks],
    ["ActionDatesNeeded", r.undated_actions],
  ].flatMap(([code, count]) =>
    Number(count) > 0 ? [{ code: String(code), count: Number(count) }] : [],
  );
  if (!r.task_count) reasons.push({ code: "ScheduleNeeded", count: 1 });
  return {
    id: r.id,
    version: r.version,
    acceptance_version: r.acceptance_version,
    display_number: r.display_number,
    title: r.title,
    company_id: r.company_id,
    organisation_id: r.organisation_id,
    site_id: r.site_id,
    coordinator_id: r.coordinator_id,
    customer_name: r.customer_name,
    site_name: r.site_name,
    coordinator_name: r.coordinator_name,
    timezone: r.timezone,
    lifecycle: r.lifecycle,
    updated_at: new Date(r.updated_at).toISOString(),
    dates: {
      today: r.today,
      start: r.start_date,
      forecast_finish: r.forecast_finish,
      target_handover: r.target_date,
      baseline_finish: r.baseline_finish,
      baseline_revision: r.baseline_revision,
      forecast_minus_baseline_days:
        r.forecast_finish && r.baseline_finish
          ? dayNumber(r.forecast_finish) - dayNumber(r.baseline_finish)
          : null,
      target_minus_forecast_days:
        r.forecast_finish && r.target_date
          ? dayNumber(r.target_date) - dayNumber(r.forecast_finish)
          : null,
    },
    tasks: {
      total: r.task_count,
      complete: r.completed_tasks,
      undated: r.undated_tasks,
      unassigned: r.unassigned_tasks,
      unavailable_owners: r.unavailable_owners,
    },
    next_milestone: r.next_milestone,
    actions: {
      open: r.open_actions,
      overdue: r.overdue_actions,
      date_needed: r.undated_actions,
      completeness: r.actions_partial ? "Partial" : "Complete",
    },
    raid: {
      open: r.open_raid,
      high_priority: r.high_priority_raid,
      overdue: r.overdue_raid,
    },
    attention: {
      state: r.attention_state,
      reasons,
      completeness:
        r.actions_partial || r.unavailable_owners > 0 ? "Partial" : "Complete",
      basis: "SavedCoordinationRecords",
    },
  };
}
export async function readPortfolio(p: Principal, input: unknown = {}) {
  const q = object(input, [
    "q",
    "limit",
    "cursor",
    "lifecycle",
    "coordinator_id",
    "site_id",
    "attention",
  ]);
  const lifecycle =
    q.lifecycle === undefined
      ? null
      : choice(q.lifecycle, "lifecycle", ["Active", "Closed"]);
  const coordinator = optionalId(q.coordinator_id, "coordinator_id"),
    site = optionalId(q.site_id, "site_id");
  const attention =
    q.attention === undefined
      ? null
      : choice(q.attention, "attention", attentionStates);
  const pg = page(
    { q: q.q, limit: q.limit, cursor: q.cursor },
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      company: workingCompanyFor(p.actor_id),
      kind: "ProjectPortfolio",
      lifecycle,
      coordinator,
      site,
      attention,
    },
  );
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireCapability(c, p, "project.read");
    const observed_at = new Date().toISOString();
    const source =
      projectFactsSql() +
      `, matching AS MATERIALIZED (SELECT * FROM classified WHERE ($5::text IS NULL OR lifecycle=$5)
      AND ($6::uuid IS NULL OR coordinator_id=$6) AND ($7::uuid IS NULL OR site_id=$7)
      AND ($8::text IS NULL OR attention_state=$8)
      AND position(lower($9) IN lower(concat_ws(' ',title,display_number,id::text,customer_name,site_name)))>0)`;
    const values = [
      p.workspace_id,
      p.actor_id,
      observed_at,
      null,
      lifecycle,
      coordinator,
      site,
      attention,
      pg.q,
    ];
    const result = (
      await c.query<{
        items: ProjectFacts[];
        counts: {
          total: number;
          needs_attention: number;
          information_needed: number;
          no_current_flags: number;
          closed: number;
          partial_actions: number;
        };
      }>(
        source +
          ` SELECT jsonb_build_object(
      'total',count(*)::int,
      'needs_attention',count(*) FILTER(WHERE attention_state='NeedsAttention')::int,
      'information_needed',count(*) FILTER(WHERE attention_state='InformationNeeded')::int,
      'no_current_flags',count(*) FILTER(WHERE attention_state='NoCurrentFlags')::int,
      'closed',count(*) FILTER(WHERE attention_state='Closed')::int,
      'partial_actions',count(*) FILTER(WHERE actions_partial)::int) AS counts,
      coalesce((SELECT jsonb_agg(to_jsonb(selected) ORDER BY selected.id) FROM
        (SELECT * FROM matching WHERE ($10::uuid IS NULL OR id>$10) ORDER BY id LIMIT $11) selected),'[]'::jsonb) AS items
      FROM matching`,
        [...values, pg.after, pg.limit + 1],
      )
    ).rows[0];
    const { items: rows, counts } = result;
    const selected = rows.slice(0, pg.limit);
    return {
      items: selected.map(projectFactProjection),
      counts,
      next_cursor:
        rows.length > pg.limit ? pg.cursor(selected.at(-1)!.id) : null,
      observed_at,
      completeness: "Page",
      count_scope: "AllAuthorisedMatches",
      source: "Synthetic",
      filters: {
        q: pg.q,
        lifecycle,
        coordinator_id: coordinator,
        site_id: site,
        attention,
      },
    };
  });
}
