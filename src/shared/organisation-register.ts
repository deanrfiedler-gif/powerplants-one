import { database, transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { requireCapability, scopeSql } from "../platform/permissions";
import { workingCompanyFor } from "../platform/working-company";
import { activityVisibility } from "../activities/activities";
import { opportunityVisibility } from "../crm/context";
import { page, visibility } from "./reads";
import { choice, invalid, object, optionalId } from "./validation";
import {
  organisationSorts,
  organisationViews,
  type OrganisationRegisterData,
} from "./organisation-register-model";

/** CS-01's bounded register. The older CRM directory contract remains unchanged. */
export async function organisationRegister(
  p: Principal,
  input: unknown = {},
): Promise<OrganisationRegisterData> {
  const raw = object(input, [
    "q",
    "view",
    "status",
    "owner",
    "mine",
    "sort",
    "direction",
    "cursor",
    "limit",
  ]);
  const view = choice(raw.view ?? "All", "view", organisationViews);
  const sort = choice(raw.sort ?? "name", "sort", organisationSorts);
  const direction = choice(raw.direction ?? "asc", "direction", [
    "asc",
    "desc",
  ] as const);
  const status = choice(raw.status ?? "", "status", [
    "",
    "Active",
    "Prospect",
    "Inactive",
  ] as const);
  const mine = choice(raw.mine ?? "false", "mine", ["true", "false"] as const);
  const owner = mine === "true" ? p.actor_id : optionalId(raw.owner, "owner");
  const pg = page(
    { q: raw.q, limit: raw.limit ?? 25, cursor: raw.cursor },
    {
      kind: "OrganisationRegister",
      workspace: p.workspace_id,
      actor: p.actor_id,
      company: workingCompanyFor(p.actor_id),
      view,
      sort,
      direction,
      status,
      owner,
    },
  );
  const c = database();
  await requireCapability(c, p, "shared.read");
  const observed = new Date().toISOString();
  const views = {
    All: "true",
    Prospects: "status='Prospect'",
    Duplicates: "possible_duplicate",
    NoSite: "sites=0",
    Inactive: "status='Inactive'",
  };
  const columns = {
    name: "lower(display_name)",
    status: "status",
    owner: "lower(owner_name)",
    sites: "sites",
    deals: "deals",
    follow_up: "follow_up_due",
    sector: "lower(sector)",
    areas: "areas",
    reference: "display_number",
  };
  // Same matching-name candidate basis as the existing DuplicateCandidates search; no identity merge
  // or fuzzy confidence is inferred. Every matching name is itself inside the permitted population.
  // Aggregate related records once within that population. Repeating the full visibility
  // queries for each organisation exceeds the statement limit at the declared load.
  const data = await transaction(async (c) => {
    // This bounded interactive read has many visibility expressions. Their
    // estimated cost can trigger JIT compilation even when almost all related
    // rows are absent. Keep that compilation out of the request deadline; SET
    // LOCAL is restored on commit/rollback before the pooled client is released.
    await c.query("SET LOCAL jit = off");
    return (
      await c.query<OrganisationRegisterData & { cursor_found: boolean }>(
        `
    WITH permitted AS MATERIALIZED (
      SELECT r.id,r.company_id,r.display_name,r.display_number,r.relationship_status AS status,r.sector,r.owner_id,u.display_name AS owner_name
      FROM ppo.organisations r LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.owner_id)
      WHERE r.workspace_id=$1 AND ${visibility("Organisation")}
    ), name_candidates AS MATERIALIZED (
      SELECT id,name,char_length(name) AS name_length,
        count(*) OVER(PARTITION BY name) AS exact_matches,
        max(char_length(name)) OVER() AS longest_name
      FROM (SELECT id,lower(display_name) AS name FROM permitted) names
    ), current_sites AS MATERIALIZED (
      SELECT DISTINCT sp.organisation_id,s.id FROM ppo.site_parties sp
      JOIN ppo.sites s ON (s.workspace_id,s.id)=(sp.workspace_id,sp.site_id)
      JOIN permitted p ON p.id=sp.organisation_id
      WHERE sp.workspace_id=$1 AND sp.valid_from<=$6::timestamptz AND (sp.valid_to IS NULL OR sp.valid_to>$6::timestamptz)
        AND ${visibility("Site", "s")}
    ), site_counts AS (
      SELECT organisation_id,count(*)::int AS sites FROM current_sites GROUP BY organisation_id
    ), area_counts AS (
      SELECT s.organisation_id,count(*)::int AS areas FROM current_sites s
      JOIN ppo.facilities f ON f.workspace_id=$1 AND f.site_id=s.id
      WHERE ${visibility("Facility", "f")} GROUP BY s.organisation_id
    ), deal_counts AS (
      SELECT o.organisation_id,count(*)::int AS deals FROM ppo.opportunities o
      JOIN permitted r ON r.id=o.organisation_id
      WHERE o.workspace_id=$1 AND o.close_outcome='Open'
        AND ${scopeSql("r.company_id", "NULL::uuid", "crm.opportunity.read")}
        AND ${scopeSql("r.company_id", "NULL::uuid", "shared.internal.read")}
        AND ${opportunityVisibility()}
      GROUP BY o.organisation_id
    ), visible_follow_ups AS MATERIALIZED (
      SELECT a.id,a.workspace_id,a.summary,a.due_at,a.due_needed FROM ppo.activities a
      WHERE a.workspace_id=$1 AND a.status NOT IN ('Completed','Cancelled')
        AND EXISTS(SELECT 1 FROM ppo.activity_links al JOIN permitted r ON r.id=al.object_id
          WHERE al.workspace_id=a.workspace_id AND al.activity_id=a.id AND al.object_type='Organisation'
            AND ${scopeSql("r.company_id", "NULL::uuid", "activity.read")})
        AND ${activityVisibility("a", true, true, true)}
    ), next_follow_ups AS (
      SELECT DISTINCT ON (r.id) r.id AS organisation_id,a.id,a.summary,a.due_at,a.due_needed
      FROM visible_follow_ups a
      JOIN ppo.activity_links al ON al.workspace_id=a.workspace_id AND al.activity_id=a.id AND al.object_type='Organisation'
      JOIN permitted r ON r.id=al.object_id
      WHERE ${scopeSql("r.company_id", "NULL::uuid", "activity.read")}
      ORDER BY r.id,a.due_at ASC NULLS LAST,a.id
    ), facts AS MATERIALIZED (
      SELECT r.*,
        coalesce(s.sites,0) AS sites,
        coalesce(f.areas,0) AS areas,
        CASE WHEN ${scopeSql("r.company_id", "NULL::uuid", "crm.opportunity.read")} AND ${scopeSql("r.company_id", "NULL::uuid", "shared.internal.read")}
          THEN coalesce(o.deals,0) ELSE NULL END AS deals,
        (n.exact_matches>1 OR (n.name_length<n.longest_name AND EXISTS(
          SELECT 1 FROM name_candidates d WHERE d.name_length>n.name_length AND position(n.name IN d.name)>0
        ))) AS possible_duplicate,
        CASE WHEN ${scopeSql("r.company_id", "NULL::uuid", "activity.read")} THEN 'Available' ELSE 'Restricted' END AS follow_up_state,
        CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object('id',a.id,'summary',a.summary,'due_at',a.due_at,'due_needed',a.due_needed) END AS next_follow_up,
        a.due_at AS follow_up_due
      FROM permitted r
      JOIN name_candidates n ON n.id=r.id
      LEFT JOIN site_counts s ON s.organisation_id=r.id
      LEFT JOIN area_counts f ON f.organisation_id=r.id
      LEFT JOIN deal_counts o ON o.organisation_id=r.id
      LEFT JOIN next_follow_ups a ON a.organisation_id=r.id
    ), filtered AS MATERIALIZED (
      SELECT * FROM facts WHERE ($3='' OR position(lower($3) IN lower(concat_ws(' ',display_name,display_number,sector,owner_name)))>0)
        AND ($4='' OR status=$4) AND ($5::uuid IS NULL OR owner_id=$5)
    ), ordered AS (
      SELECT *,row_number() OVER(ORDER BY ${columns[sort]} ${direction} NULLS LAST,id) AS ordinal FROM filtered WHERE ${views[view]}
    ), selected AS (
      SELECT * FROM ordered WHERE ordinal>coalesce((SELECT ordinal FROM ordered WHERE id=$7::uuid),0) ORDER BY ordinal LIMIT $8
    ) SELECT
      ($7::uuid IS NULL OR EXISTS(SELECT 1 FROM ordered WHERE id=$7::uuid)) AS cursor_found,
      coalesce((SELECT jsonb_agg(to_jsonb(s)-'ordinal'-'follow_up_due' ORDER BY ordinal) FROM selected s),'[]'::jsonb) AS items,
      (SELECT count(*)::int FROM ordered) AS total,
      (SELECT jsonb_build_object(${Object.entries(views)
        .map(
          ([key, condition]) => `'${key}',count(*) FILTER (WHERE ${condition})`,
        )
        .join(",")}) FROM filtered) AS counts,
      coalesce((SELECT jsonb_agg(x ORDER BY label,id) FROM (SELECT DISTINCT owner_id AS id,owner_name AS label FROM permitted WHERE owner_id IS NOT NULL) x),'[]'::jsonb) AS owners`,
        [
          p.workspace_id,
          p.actor_id,
          pg.q,
          status,
          owner,
          observed,
          pg.after,
          pg.limit + 1,
        ],
      )
    ).rows[0];
  });
  if (!data.cursor_found)
    throw invalid(
      "cursor",
      "The result changed. Refresh the register to continue.",
    );
  const items = data.items.slice(0, pg.limit);
  return {
    items,
    total: data.total,
    counts: data.counts,
    owners: data.owners,
    observed_at: observed,
    next_cursor:
      data.items.length > pg.limit ? pg.cursor(items.at(-1)!.id) : null,
  };
}
