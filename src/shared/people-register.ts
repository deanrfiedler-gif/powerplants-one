import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { requireCapability, scopeSql } from "../platform/permissions";
import { workingCompanyFor } from "../platform/working-company";
import { page, visibility } from "./reads";
import { choice, invalid, object, optionalId } from "./validation";
import {
  peopleSorts,
  peopleViews,
  type PeopleRegisterData,
} from "./people-register-model";

/** One permitted population supplies rows, counts and organisation options. No operational writes. */
export async function peopleRegister(
  p: Principal,
  input: unknown = {},
): Promise<PeopleRegisterData> {
  const q = object(input, [
    "q",
    "view",
    "organisation",
    "notices",
    "sort",
    "direction",
    "cursor",
    "limit",
  ]);
  const view = choice(q.view ?? "Active", "view", peopleViews);
  const sort = choice(q.sort ?? "name", "sort", peopleSorts);
  const direction = choice(q.direction ?? "asc", "direction", [
    "asc",
    "desc",
  ] as const);
  const notices = choice(q.notices ?? "All", "notices", [
    "All",
    "DoNotNotify",
  ] as const);
  const organisation = optionalId(q.organisation, "organisation");
  const pg = page(
    { q: q.q, limit: q.limit ?? 25, cursor: q.cursor },
    {
      kind: "PeopleRegister",
      workspace: p.workspace_id,
      actor: p.actor_id,
      company: workingCompanyFor(p.actor_id),
      view,
      sort,
      direction,
      notices,
      organisation,
    },
  );
  const predicates = {
    Active: "active",
    SiteContacts: "active AND jsonb_array_length(sites)>0",
    Channels:
      "active AND (email IS NULL OR phone IS NULL OR email='' OR phone='')",
    Inactive: "NOT active",
  };
  const sorts = {
    name: "lower(display_name)",
    email: "lower(email)",
    phone: "phone",
    status: "active",
  };
  const result = await transaction(async (c) => {
    await requireCapability(c, p, "shared.read");
    const data = (
      await c.query<PeopleRegisterData & { cursor_found: boolean }>(
        `
      WITH permitted AS MATERIALIZED (
        SELECT r.id,r.workspace_id,r.display_name,r.email,r.phone,r.contact_preference,r.active,
          EXISTS(SELECT 1 FROM ppo.person_company_contexts pc WHERE pc.workspace_id=$1 AND pc.person_id=r.id)
          AND NOT EXISTS(SELECT 1 FROM ppo.person_company_contexts pc WHERE pc.workspace_id=$1 AND pc.person_id=r.id
            AND NOT (${scopeSql("pc.company_id")} AND ${scopeSql("pc.company_id", "NULL::uuid", "shared.edit")})) AS can_correct,
          NOT EXISTS(SELECT 1 FROM ppo.person_company_contexts pc WHERE pc.workspace_id=$1 AND pc.person_id=r.id AND ${scopeSql("pc.company_id")})
          OR EXISTS(SELECT 1 FROM ppo.person_company_contexts pc WHERE pc.workspace_id=$1 AND pc.person_id=r.id AND NOT ${scopeSql("pc.company_id")}) AS notices_restricted
        FROM ppo.people r WHERE r.workspace_id=$1 AND ${visibility("Person")}
      ), affiliations AS MATERIALIZED (
        SELECT rel.person_id,o.id,o.display_name AS name,rel.role_label AS role
        FROM ppo.relationships rel JOIN permitted pe ON pe.id=rel.person_id
        JOIN ppo.organisations o ON (o.workspace_id,o.id)=(rel.workspace_id,rel.organisation_id)
        WHERE rel.workspace_id=$1 AND rel.valid_from<=CURRENT_DATE AND (rel.valid_to IS NULL OR rel.valid_to>CURRENT_DATE)
          AND ${scopeSql("rel.company_id")} AND ${visibility("Organisation", "o")}
      ), primary_sites AS MATERIALIZED (
        SELECT s.primary_contact_id AS person_id,s.id,s.display_name AS name
        FROM ppo.sites s JOIN permitted pe ON pe.id=s.primary_contact_id
        WHERE s.workspace_id=$1 AND ${visibility("Site", "s")}
      ), latest_notices AS MATERIALIZED (
        SELECT DISTINCT ON (n.person_id,n.company_id,n.message_class) n.person_id,n.company_id,n.message_class,n.preference
        FROM ppo.contact_notice_preferences n JOIN permitted pe ON pe.id=n.person_id
        WHERE n.workspace_id=$1 AND ${scopeSql("n.company_id")}
          AND EXISTS(SELECT 1 FROM ppo.person_company_contexts pc WHERE pc.workspace_id=$1 AND pc.person_id=n.person_id AND pc.company_id=n.company_id)
        ORDER BY n.person_id,n.company_id,n.message_class,n.version DESC
      ), facts AS MATERIALIZED (
        SELECT pe.id,pe.display_name,pe.email,pe.phone,pe.contact_preference,pe.active,pe.notices_restricted,NOT pe.can_correct AS history_restricted,
          coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'name',a.name,'role',a.role) ORDER BY a.name,a.id,a.role) FROM affiliations a WHERE a.person_id=pe.id),'[]'::jsonb) AS organisations,
          coalesce((SELECT jsonb_agg(jsonb_build_object('id',s.id,'name',s.name) ORDER BY s.name,s.id) FROM primary_sites s WHERE s.person_id=pe.id),'[]'::jsonb) AS sites,
          (SELECT count(*)::int FROM latest_notices n WHERE n.person_id=pe.id AND n.preference='DoNotNotify') AS notice_exceptions,
          CASE WHEN pe.can_correct THEN (SELECT max(a.occurred_at) FROM ppo.audit_events a WHERE a.workspace_id=$1 AND a.object_type='Person' AND a.object_id=pe.id AND a.details->>'command'='RevisePerson') ELSE NULL END AS last_correction
        FROM permitted pe
      ), filtered AS MATERIALIZED (
        SELECT * FROM facts WHERE ($3='' OR position(lower($3) IN lower(concat_ws(' ',display_name,email,phone,organisations::text)))>0)
          AND ($4::uuid IS NULL OR EXISTS(SELECT 1 FROM affiliations a WHERE a.person_id=facts.id AND a.id=$4))
          AND ($5='All' OR notice_exceptions>0)
      ), ordered AS (
        SELECT *,row_number() OVER(ORDER BY ${sorts[sort]} ${direction} NULLS LAST,id) AS ordinal FROM filtered WHERE ${predicates[view]}
      ), selected AS (
        SELECT * FROM ordered WHERE ordinal>coalesce((SELECT ordinal FROM ordered WHERE id=$6::uuid),0) ORDER BY ordinal LIMIT $7
      ) SELECT
        ($6::uuid IS NULL OR EXISTS(SELECT 1 FROM ordered WHERE id=$6::uuid)) AS cursor_found,
        coalesce((SELECT jsonb_agg(to_jsonb(s)-'ordinal' ORDER BY ordinal) FROM selected s),'[]'::jsonb) AS items,
        (SELECT count(*)::int FROM ordered) AS total,
        (SELECT jsonb_build_object(${Object.entries(predicates)
          .map(([key, value]) => `'${key}',count(*) FILTER (WHERE ${value})`)
          .join(",")}) FROM filtered) AS counts,
        coalesce((SELECT jsonb_agg(x ORDER BY label,id) FROM (SELECT DISTINCT id,name AS label FROM affiliations) x),'[]'::jsonb) AS organisations,
        statement_timestamp()::text AS observed_at
    `,
        [
          p.workspace_id,
          p.actor_id,
          pg.q,
          organisation,
          notices,
          pg.after,
          pg.limit + 1,
        ],
      )
    ).rows[0];
    if (!data.cursor_found)
      invalid(
        "cursor",
        "The result changed. Refresh the register to continue.",
      );
    return data;
  });
  const items = result.items.slice(0, pg.limit);
  return {
    items,
    total: result.total,
    counts: result.counts,
    organisations: result.organisations,
    observed_at: result.observed_at,
    next_cursor:
      result.items.length > pg.limit ? pg.cursor(items.at(-1)!.id) : null,
  };
}
