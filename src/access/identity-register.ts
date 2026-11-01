import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import { isHostedDemo } from "../platform/demo-config";
import type { Principal } from "../platform/identity";
import { requireAccessInspection } from "./service";
import {
  identityViews,
  type IdentityRegisterData,
} from "./identity-register-model";

// Keep the original directory read for historical upgrade clients. This richer
// projection uses the current team and applied-request tables; it writes nothing.
export async function accessIdentityRegister(
  p: Principal,
  input: Record<string, string> = {},
): Promise<IdentityRegisterData> {
  const search = (input.q ?? "").trim(),
    view = input.view ?? "all";
  const state = input.state ?? "",
    company = input.company_id || null;
  const sort = input.sort ?? "name",
    direction = input.direction ?? (sort === "changed" ? "desc" : "asc");
  const offset = Number(input.offset ?? 0);
  const sorts: Record<string, string> = {
    name: "display_name",
    changed: "last_changed_at",
    current: "current_count",
    scheduled: "scheduled_count",
    expired: "expired_count",
  };
  if (
    search.length > 100 ||
    !identityViews.some((v) => v === view) ||
    !["", "active", "inactive"].includes(state) ||
    !Object.hasOwn(sorts, sort) ||
    !["asc", "desc"].includes(direction) ||
    (company &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        company,
      ))
  )
    throw new AppError(
      422,
      "InvalidFilter",
      "Choose available identity filters and a search of up to 100 characters.",
    );
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
    throw new AppError(422, "InvalidPage", "Choose an available result page.");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await requireAccessInspection(c, p);
    if (
      company &&
      !(
        await c.query(
          "SELECT 1 FROM ppo.companies WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, company],
        )
      ).rowCount
    )
      throw new AppError(404, "NotFound", "This company is unavailable.");
    const local = !isHostedDemo();
    // One statement supplies rows, counts, company choices and a single as-at
    // instant. Inactive identities have no Current/Scheduled/Expired grants,
    // matching AD-01's existing Inactive identity precedence.
    const result = await c.query<{ data: IdentityRegisterData }>(
      `
      WITH people AS (
        SELECT u.id, CASE WHEN u.issuer='PPO-LocalSynthetic' THEN u.display_name ELSE 'Hosted identity (masked)' END AS display_name,
          u.active, u.issuer<>'PPO-LocalSynthetic' AS masked,
          g.grant_count, g.current_count, g.scheduled_count, g.expired_count,
          g.workspace_scope, g.company_keys, g.site_count, g.next_scheduled_at,
          CASE WHEN $7 THEN ARRAY(SELECT t.name FROM ppo.access_teams t
            WHERE t.workspace_id=u.workspace_id AND (t.lead_id=u.id OR EXISTS (
              SELECT 1 FROM ppo.access_team_members m WHERE (m.workspace_id,m.team_id,m.user_id)=(t.workspace_id,t.id,u.id))) ORDER BY t.name,t.id)
            ELSE ARRAY[]::text[] END AS teams,
          r.submitted_count,r.approved_count,r.last_changed_at
        FROM ppo.users u
        CROSS JOIN LATERAL (
          SELECT count(*)::int AS grant_count,
            count(*) FILTER (WHERE u.active AND g.valid_from<=statement_timestamp() AND (g.valid_to IS NULL OR g.valid_to>statement_timestamp()))::int AS current_count,
            count(*) FILTER (WHERE u.active AND g.valid_from>statement_timestamp())::int AS scheduled_count,
            count(*) FILTER (WHERE u.active AND g.valid_from<=statement_timestamp() AND g.valid_to<=statement_timestamp())::int AS expired_count,
            coalesce(bool_or(g.scope_type='Workspace'),false) AS workspace_scope,
            coalesce(array_agg(DISTINCT co.erp_company_id ORDER BY co.erp_company_id) FILTER (WHERE co.erp_company_id IS NOT NULL),ARRAY[]::text[]) AS company_keys,
            count(DISTINCT g.site_id)::int AS site_count,
            min(g.valid_from) FILTER (WHERE u.active AND g.valid_from>statement_timestamp()) AS next_scheduled_at
          FROM ppo.permission_grants g LEFT JOIN ppo.companies co ON (co.workspace_id,co.id)=(g.workspace_id,g.company_id)
          WHERE (g.workspace_id,g.user_id)=(u.workspace_id,u.id)
        ) g
        CROSS JOIN LATERAL (
          SELECT count(*) FILTER (WHERE r.state='Submitted')::int AS submitted_count,
            count(*) FILTER (WHERE r.state='Approved')::int AS approved_count,
            max(r.applied_at) FILTER (WHERE r.state='Applied') AS last_changed_at
          FROM ppo.access_change_requests r WHERE $7 AND (r.workspace_id,r.subject_id)=(u.workspace_id,u.id)
        ) r
        WHERE u.workspace_id=$1 AND ($2='' OR position(lower($2) IN lower(CASE WHEN u.issuer='PPO-LocalSynthetic' THEN u.display_name ELSE 'Hosted identity (masked)' END))>0)
          AND ($3::uuid IS NULL OR EXISTS (SELECT 1 FROM ppo.permission_grants cg WHERE (cg.workspace_id,cg.user_id)=(u.workspace_id,u.id) AND (cg.scope_type='Workspace' OR cg.company_id=$3)))
      ), filtered AS (
        SELECT * FROM people WHERE ($4='all' OR ($4='active' AND active) OR ($4='inactive' AND NOT active) OR ($4='hosted' AND masked))
          AND ($5='' OR active=($5='active'))
      ), page AS (SELECT * FROM filtered ORDER BY ${sorts[sort]} ${direction} NULLS LAST,id LIMIT 50 OFFSET $6)
      SELECT jsonb_build_object('items',coalesce((SELECT jsonb_agg(page) FROM page),'[]'::jsonb),
        'total',(SELECT count(*) FROM filtered),'offset',$6::int,'has_more',(SELECT count(*) FROM filtered)>$6+50,
        'observed_at',statement_timestamp(),'local_details_available',$7::boolean,
        'counts',(SELECT jsonb_build_object('all',count(*),'active',count(*) FILTER (WHERE active),'inactive',count(*) FILTER (WHERE NOT active),'hosted',count(*) FILTER (WHERE masked)) FROM people),
        'companies',(SELECT coalesce(jsonb_agg(co ORDER BY co.erp_company_id,co.id),'[]'::jsonb) FROM (SELECT id,display_name,erp_company_id FROM ppo.companies WHERE workspace_id=$1) co)) AS data
    `,
      [p.workspace_id, search, company, view, state, offset, local],
    );
    await requireAccessInspection(c, p);
    return result.rows[0].data;
  });
}
