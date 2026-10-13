import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { requireCapability } from "../platform/permissions";
import { page } from "../shared/reads";
import { choice, invalid, object, optionalId } from "../shared/validation";
import { projectVisibility } from "./service";
import {
  projectSorts,
  projectViews,
  type ProjectRegisterData,
  type ProjectRegisterRow,
} from "./register-model";

export async function projectRegister(
  p: Principal,
  input: unknown = {},
): Promise<ProjectRegisterData> {
  const r = object(input, [
    "q",
    "view",
    "coordinator",
    "customer",
    "sort",
    "direction",
    "cursor",
    "limit",
  ]);
  const view = choice(r.view ?? "Active", "view", projectViews);
  const sort = choice(r.sort ?? "target", "sort", projectSorts);
  const direction = choice(r.direction ?? "asc", "direction", [
    "asc",
    "desc",
  ] as const);
  const coordinator = optionalId(r.coordinator, "coordinator"),
    customer = optionalId(r.customer, "customer");
  const pg = page(
    { q: r.q, limit: r.limit, cursor: r.cursor },
    `ProjectRegister:${p.workspace_id}:${p.actor_id}:${view}:${sort}:${direction}:${coordinator}:${customer}`,
  );
  const c = database();
  await requireCapability(c, p, "project.read");
  const observed_at = new Date().toISOString();
  const predicates = {
    Active: "lifecycle='Active'",
    Mine: "lifecycle='Active' AND coordinator_id=$2",
    Closed: "lifecycle='Closed'",
    All: "true",
    Overdue: "lifecycle='Active' AND milestone_overdue",
    AtRisk: "lifecycle='Active' AND at_risk>0",
    NoTarget: "lifecycle='Active' AND target_date IS NULL",
  };
  const sortColumn = {
    target: "target_date",
    title: "lower(title)",
    milestone: "milestone_date",
    risk: "at_risk",
    customer: "lower(customer_name)",
    coordinator: "lower(coordinator_name)",
    status: "lifecycle",
    reference: "display_number",
  }[sort];
  // One database snapshot for permission-scoped options, all-match counts, derived schedule facts and paging.
  const result = (
    await c.query<{
      items: ProjectRegisterRow[];
      counts: ProjectRegisterData["counts"];
      active_count: number;
      total: number;
      options: ProjectRegisterData["options"];
      cursor_found: boolean;
    }>(
      `WITH authorised AS MATERIALIZED (
    SELECT p.id,p.version,p.display_number,p.title,p.company_id,p.organisation_id,p.site_id,p.coordinator_id,
      p.lifecycle,p.acceptance_version,p.target_date,p.updated_at,p.created_at,
      o.display_name AS customer_name,s.display_name AS site_name,s.timezone,u.display_name AS coordinator_name,
      false AS can_edit,
      CASE WHEN m.id IS NULL THEN NULL ELSE jsonb_build_object('id',m.id,'title',m.title,'finish_date',m.finish_date) END AS next_milestone,
      m.finish_date AS milestone_date,
      coalesce(m.finish_date<($6::timestamptz AT TIME ZONE s.timezone)::date,false) AS milestone_overdue,
      (SELECT count(*)::int FROM ppo.project_tasks t WHERE t.workspace_id=p.workspace_id AND t.project_id=p.id AND NOT t.milestone AND t.status='AtRisk') AS at_risk
    FROM ppo.projects p
    JOIN ppo.organisations o ON (o.workspace_id,o.id)=(p.workspace_id,p.organisation_id)
    JOIN ppo.sites s ON (s.workspace_id,s.id)=(p.workspace_id,p.site_id)
    JOIN ppo.users u ON (u.workspace_id,u.id)=(p.workspace_id,p.coordinator_id)
    LEFT JOIN LATERAL (SELECT t.id,t.title,t.finish_date FROM ppo.project_tasks t WHERE t.workspace_id=p.workspace_id AND t.project_id=p.id AND t.milestone AND t.status<>'Complete' ORDER BY t.finish_date ASC NULLS LAST,t.id LIMIT 1) m ON true
    WHERE p.workspace_id=$1 AND ${projectVisibility()}
  ), filtered AS MATERIALIZED (
    SELECT * FROM authorised WHERE ($3='' OR position(lower($3) in lower(concat_ws(' ',title,display_number,id::text,customer_name,site_name)))>0)
      AND ($4::uuid IS NULL OR coordinator_id=$4) AND ($5::uuid IS NULL OR organisation_id=$5)
  ), ordered AS (
    SELECT *,row_number() OVER(ORDER BY ${sortColumn} ${direction} NULLS LAST,id) AS ordinal FROM filtered WHERE ${predicates[view]}
  ), selected AS (
    SELECT * FROM ordered WHERE ordinal>coalesce((SELECT ordinal FROM ordered WHERE id=$7::uuid),0) ORDER BY ordinal LIMIT $8
   ) SELECT
    ($7::uuid IS NULL OR EXISTS(SELECT 1 FROM ordered WHERE id=$7::uuid)) AS cursor_found,
    coalesce((SELECT jsonb_agg(to_jsonb(x)-'ordinal'-'milestone_date' ORDER BY ordinal) FROM selected x),'[]'::jsonb) AS items,
    (SELECT jsonb_build_object(${Object.entries(predicates)
      .map(
        ([key, predicate]) => `'${key}',count(*) FILTER (WHERE ${predicate})`,
      )
      .join(",")}) FROM filtered) AS counts,
    (SELECT count(*)::int FROM authorised WHERE lifecycle='Active') AS active_count,
    (SELECT count(*)::int FROM ordered) AS total,
    jsonb_build_object('customers',coalesce((SELECT jsonb_agg(x ORDER BY name,id) FROM (SELECT DISTINCT organisation_id AS id,customer_name AS name FROM authorised) x),'[]'::jsonb),
      'coordinators',coalesce((SELECT jsonb_agg(x ORDER BY name,id) FROM (SELECT DISTINCT coordinator_id AS id,coordinator_name AS name FROM authorised) x),'[]'::jsonb)) AS options`,
      [
        p.workspace_id,
        p.actor_id,
        pg.q,
        coordinator,
        customer,
        observed_at,
        pg.after,
        pg.limit + 1,
      ],
    )
  ).rows[0];
  if (!result.cursor_found)
    throw invalid(
      "cursor",
      "The result changed. Refresh the register to continue.",
    );
  const more = result.items.length > pg.limit;
  const items = result.items.slice(0, pg.limit);
  return {
    counts: result.counts,
    active_count: result.active_count,
    total: result.total,
    options: result.options,
    items,
    next_cursor: more ? pg.cursor(items.at(-1)!.id) : null,
    observed_at,
    completeness: "Page",
  };
}
