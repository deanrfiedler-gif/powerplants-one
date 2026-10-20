import { transaction, database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { requireCapability, scopeSql } from "../platform/permissions";
import { workingCompanyFor } from "../platform/working-company";
import { AppError, unavailable } from "../platform/errors";
import { orderVisibility, listWorkOrders } from "../service/work-orders";
import { listActivities } from "../activities/activities";
import { listCs } from "./cs/service";
import { visible, visibility, page } from "./reads";
import { object, choice, optionalId, invalid } from "./validation";
import { siteReference, siteReferenceSearch } from "./site-reference";
import {
  siteViews,
  siteSorts,
  type SiteRow,
  type SitesData,
  type SiteWorkSource,
} from "./sites-model";

/** Same permitted population for rows, counts and filters. P4 is deliberately not inferred. */
export async function sitesRegister(
  p: Principal,
  input: unknown = {},
): Promise<SitesData> {
  const q = object(input, [
    "q",
    "view",
    "customer_id",
    "readiness",
    "sort",
    "direction",
    "cursor",
    "limit",
    "site_id",
  ]);
  const view = choice(
    q.view ?? "All",
    "view",
    Object.keys(siteViews) as (keyof typeof siteViews)[],
  );
  const sort = choice(q.sort ?? "name", "sort", siteSorts);
  const direction = choice(q.direction ?? "asc", "direction", [
    "asc",
    "desc",
  ] as const);
  const readiness = choice(q.readiness ?? "", "readiness", [
    "",
    "Upcoming",
    "None",
    "Restricted",
  ] as const);
  const customer = optionalId(q.customer_id || null, "customer_id"),
    site = optionalId(q.site_id || null, "site_id");
  const pg = page(
    { q: q.q, limit: q.limit ?? 50, cursor: q.cursor },
    {
      kind: "SitesRegister",
      workspace: p.workspace_id,
      actor: p.actor_id,
      company: workingCompanyFor(p.actor_id),
      view,
      sort,
      direction,
      readiness,
      customer,
      site,
    },
  );
  await requireCapability(database(), p, "shared.read");
  const observed_at = new Date().toISOString();
  const viewSql = {
    All: "true",
    Readiness: "next_visit IS NOT NULL",
    Biosecurity: "NOT biosecurity_recorded",
    Address: "NOT address_recorded",
  };
  const sortSql = {
    name: "lower(display_name)",
    location: "lower(location_description)",
    areas: "areas",
    equipment: "equipment",
    next_visit: "next_visit->>'start_at'",
    reference: "display_number",
  };
  const result = await transaction(async (c) => {
    await c.query("SET LOCAL jit = off");
    return (
      await c.query<SitesData & { cursor_found: boolean }>(
        `
      WITH permitted AS MATERIALIZED (
        SELECT r.* FROM ppo.sites r WHERE r.workspace_id=$1 AND ${visibility("Site")}
          AND ($5::uuid IS NULL OR r.id=$5)
      ), visits AS MATERIALIZED (
        SELECT a.id,a.site_id,a.display_number,a.start_at,a.end_at,a.status
        FROM ppo.appointments a JOIN permitted r ON r.id=a.site_id
        JOIN ppo.work_orders w ON (w.workspace_id,w.id)=(a.workspace_id,a.work_order_id)
        WHERE a.workspace_id=$1 AND ${scopeSql("a.company_id", "a.site_id", "schedule.read")} AND ${orderVisibility("w")}
      ), facts AS MATERIALIZED (
        SELECT r.id,r.company_id,r.version,r.display_name,r.display_number,r.location_description,nullif(concat_ws(', ',nullif(r.address->>'street',''),nullif(r.address->>'suburb',''),nullif(r.address->>'state',''),nullif(r.address->>'postcode',''),nullif(r.address->>'country','')),'') AS address,r.timezone,
          r.access_instructions,r.biosecurity_notes,
          nullif(trim(r.address->>'street'),'') IS NOT NULL AS address_recorded,
          nullif(trim(r.biosecurity_notes),'') IS NOT NULL AS biosecurity_recorded,
          coalesce((SELECT jsonb_agg(jsonb_build_object('id',o.id,'name',o.display_name,'role',sp.role) ORDER BY CASE WHEN sp.role='Operator' THEN 0 ELSE 1 END,sp.role,o.display_name,o.id)
            FROM ppo.site_parties sp JOIN ppo.organisations o ON (o.workspace_id,o.id)=(sp.workspace_id,sp.organisation_id)
            WHERE sp.workspace_id=$1 AND sp.site_id=r.id AND sp.valid_from<=$6::timestamptz AND (sp.valid_to IS NULL OR sp.valid_to>$6::timestamptz)
              AND ${visibility("Organisation", "o")}), '[]'::jsonb) AS customers,
          (SELECT jsonb_build_object('id',site_contact.id,'name',site_contact.display_name,'phone',site_contact.phone,'email',site_contact.email)
            FROM ppo.people site_contact WHERE site_contact.workspace_id=$1 AND site_contact.id=r.primary_contact_id AND ${visibility("Person", "site_contact")}) AS primary_contact,
          (SELECT count(*)::int FROM ppo.facilities f WHERE f.workspace_id=$1 AND f.site_id=r.id AND ${visibility("Facility", "f")}) AS areas,
          (SELECT count(*)::int FROM ppo.assets a WHERE a.workspace_id=$1 AND a.site_id=r.id AND ${visibility("Asset", "a")}) AS equipment,
          (SELECT to_jsonb(v)-'site_id' FROM visits v WHERE v.site_id=r.id AND v.end_at>$6::timestamptz AND v.status IN ('Proposed','Confirmed','InProgress') ORDER BY v.start_at,v.id LIMIT 1) AS next_visit,
          (SELECT to_jsonb(v)-'site_id' FROM visits v WHERE v.site_id=r.id AND v.end_at<=$6::timestamptz AND v.status IN ('Completed','CompletedPendingReview') ORDER BY v.end_at DESC,v.id LIMIT 1) AS last_visit,
          CASE WHEN ${scopeSql("r.company_id", "r.id", "schedule.read")} AND ${scopeSql("r.company_id", "r.id", "service.work_order.read")} THEN 'Available' ELSE 'Restricted' END AS visits_state,
          ${scopeSql("r.company_id", "r.id", "shared.edit")} AS can_edit,
          ${scopeSql("r.company_id", "r.id", "service.ticket.edit")} AS can_request,
          ${scopeSql("r.company_id", "r.id", "activity.edit")} AS can_follow_up
        FROM permitted r
      ), filtered AS MATERIALIZED (
        SELECT * FROM facts WHERE ($3='' OR position(lower($3) IN lower(concat_ws(' ',display_name,display_number,location_description,customers::text)))>0)
          AND ($4::uuid IS NULL OR EXISTS(SELECT 1 FROM jsonb_array_elements(customers) c WHERE c->>'id'=$4::text))
          AND ($7='' OR ($7='Upcoming' AND next_visit IS NOT NULL) OR ($7='None' AND next_visit IS NULL AND visits_state='Available') OR ($7='Restricted' AND visits_state='Restricted'))
      ), ordered AS (
        SELECT *,row_number() OVER(ORDER BY ${sortSql[sort]} ${direction} NULLS LAST,id) AS ordinal FROM filtered WHERE ${viewSql[view]}
      ), selected AS (SELECT * FROM ordered WHERE ordinal>coalesce((SELECT ordinal FROM ordered WHERE id=$8::uuid),0) ORDER BY ordinal LIMIT $9)
      SELECT ($8::uuid IS NULL OR EXISTS(SELECT 1 FROM ordered WHERE id=$8::uuid)) AS cursor_found,
        coalesce((SELECT jsonb_agg(to_jsonb(s)-'ordinal' ORDER BY ordinal) FROM selected s),'[]'::jsonb) AS items,
        (SELECT count(*)::int FROM ordered) AS total,
        (SELECT jsonb_build_object(${Object.entries(viewSql)
          .map(
            ([key, predicate]) =>
              `'${key}',count(*) FILTER(WHERE ${predicate})`,
          )
          .join(",")}) FROM filtered) AS counts,
        coalesce((SELECT jsonb_agg(x ORDER BY label,id) FROM (SELECT DISTINCT c->>'id' AS id,c->>'name' AS label FROM facts CROSS JOIN LATERAL jsonb_array_elements(customers) c) x),'[]'::jsonb) AS customers
    `,
        [
          p.workspace_id,
          p.actor_id,
          siteReferenceSearch(pg.q),
          customer,
          site,
          observed_at,
          readiness,
          pg.after,
          pg.limit + 1,
        ],
      )
    ).rows[0];
  });
  if (!result.cursor_found)
    invalid(
      "cursor",
      "The Sites results changed. Refresh the register to continue.",
    );
  const items = result.items
    .slice(0, pg.limit)
    .map((row) => ({
      ...row,
      legacy_display_number: row.display_number,
      display_number: siteReference(row.display_number),
      readiness:
        row.visits_state === "Restricted"
          ? ("Visit access restricted" as const)
          : row.next_visit
            ? ("Check in CS-06" as const)
            : ("No upcoming permitted visit" as const),
    }));
  return {
    items,
    total: result.total,
    counts: result.counts,
    customers: result.customers,
    observed_at,
    next_cursor:
      result.items.length > pg.limit ? pg.cursor(items.at(-1)!.id) : null,
  };
}

export async function siteOverview(
  p: Principal,
  id: string,
): Promise<{ site: SiteRow; sources: SiteWorkSource[]; observed_at: string }> {
  await visible(database(), p, "Site", id);
  const data = await sitesRegister(p, { site_id: id });
  const site = data.items[0];
  if (!site) throw unavailable();
  async function source(
    name: string,
    read: () => Promise<Pick<SiteWorkSource, "items" | "state">>,
  ): Promise<SiteWorkSource> {
    try {
      return { name, ...(await read()) };
    } catch (error) {
      return {
        name,
        items: [],
        state:
          error instanceof AppError && [401, 403, 404].includes(error.status)
            ? "Restricted"
            : "Unavailable",
      };
    }
  }
  const sources = await Promise.all([
    source("Work orders", async () => {
      const result = await listWorkOrders(p, { site_id: id, limit: 10 });
      return {
        state: result.next_cursor ? "Partial" : "Available",
        items: result.items.map((r) => ({
          id: r.id,
          reference: r.display_number,
          title: r.summary ?? r.display_number,
          detail: r.status,
          href: `/service/work-orders/${r.id}`,
          kind: "Work order" as const,
        })),
      };
    }),
    source("Follow-ups", async () => {
      const result = await listActivities(p, {
        object_type: "Site",
        object_id: id,
        status: "Active",
        limit: 10,
      });
      return {
        state: result.next_cursor ? "Partial" : "Available",
        items: result.items.map((r) => ({
          id: r.id,
          reference: "",
          title: r.summary,
          detail: r.status,
          href: `/work/${r.id}`,
          kind: "Follow-up" as const,
        })),
      };
    }),
    source("Surveys", async () => {
      const result = await listCs(p, "Survey", { context_id: id, limit: "10" });
      return {
        state: result.next_cursor ? "Partial" : "Available",
        items: result.items.map((r) => ({
          id: r.id,
          reference: r.display_number ?? "",
          title: r.name,
          detail: r.state,
          href: `/surveys/${r.id}`,
          kind: "Survey" as const,
        })),
      };
    }),
  ]);
  sources.unshift({
    name: "Next visit",
    state: site.visits_state,
    items: site.next_visit
      ? [
          {
            id: site.next_visit.id,
            reference: site.next_visit.display_number,
            title: "Next permitted visit",
            detail: site.next_visit.status,
            href: `/service/appointments/${site.next_visit.id}`,
            kind: "Visit",
          },
        ]
      : [],
  });
  return { site, sources, observed_at: data.observed_at };
}
