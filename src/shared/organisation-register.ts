import { database } from "../platform/database";
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
  const data = (
    await c.query<OrganisationRegisterData & { cursor_found: boolean }>(
      `
    WITH permitted AS MATERIALIZED (
      SELECT r.id,r.company_id,r.display_name,r.display_number,r.relationship_status AS status,r.sector,r.owner_id,u.display_name AS owner_name
      FROM ppo.organisations r LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.owner_id)
      WHERE r.workspace_id=$1 AND ${visibility("Organisation")}
    ), current_sites AS MATERIALIZED (
      SELECT DISTINCT sp.organisation_id,s.id FROM ppo.site_parties sp
      JOIN ppo.sites s ON (s.workspace_id,s.id)=(sp.workspace_id,sp.site_id)
      JOIN permitted p ON p.id=sp.organisation_id
      WHERE sp.workspace_id=$1 AND sp.valid_from<=$6::timestamptz AND (sp.valid_to IS NULL OR sp.valid_to>$6::timestamptz)
        AND ${visibility("Site", "s")}
    ), facts AS MATERIALIZED (
      SELECT r.*,
        (SELECT count(*)::int FROM current_sites s WHERE s.organisation_id=r.id) AS sites,
        (SELECT count(*)::int FROM ppo.facilities f WHERE f.workspace_id=$1
          AND f.site_id IN (SELECT id FROM current_sites WHERE organisation_id=r.id) AND ${visibility("Facility", "f")}) AS areas,
        CASE WHEN ${scopeSql("r.company_id", "NULL::uuid", "crm.opportunity.read")} AND ${scopeSql("r.company_id", "NULL::uuid", "shared.internal.read")}
          THEN (SELECT count(*)::int FROM ppo.opportunities o WHERE o.workspace_id=$1 AND o.organisation_id=r.id AND o.close_outcome='Open' AND ${opportunityVisibility()}) ELSE NULL END AS deals,
        EXISTS(SELECT 1 FROM permitted d WHERE d.id<>r.id AND position(lower(r.display_name) IN lower(d.display_name))>0) AS possible_duplicate,
        CASE WHEN ${scopeSql("r.company_id", "NULL::uuid", "activity.read")} THEN 'Available' ELSE 'Restricted' END AS follow_up_state,
        CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object('id',a.id,'summary',a.summary,'due_at',a.due_at,'due_needed',a.due_needed) END AS next_follow_up,
        a.due_at AS follow_up_due
      FROM permitted r
      LEFT JOIN LATERAL (
        SELECT a.id,a.summary,a.due_at,a.due_needed FROM ppo.activities a
        WHERE a.workspace_id=$1 AND a.status NOT IN ('Completed','Cancelled')
          AND ${scopeSql("r.company_id", "NULL::uuid", "activity.read")}
          AND EXISTS(SELECT 1 FROM ppo.activity_links al WHERE al.workspace_id=a.workspace_id AND al.activity_id=a.id AND al.object_type='Organisation' AND al.object_id=r.id)
          AND ${activityVisibility("a", true, true, true)}
        ORDER BY a.due_at ASC NULLS LAST,a.id LIMIT 1
      ) a ON true
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
