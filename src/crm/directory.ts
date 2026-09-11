import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { requireCapability, scopeSql } from "../platform/permissions";
import { AppError } from "../platform/errors";
import { object, invalid } from "../shared/validation";
import { visibility } from "../shared/reads";
import { opportunityVisibility } from "./context";

export type DirectoryKind = "organisations" | "people";
export type DirectoryRow = {
  id: string;
  display_name: string;
  display_number: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  contact_preference: string | null;
  sector: string | null;
  owner_name: string | null;
  organisations: { id: string; name: string; role: string }[];
  sites: number;
  facilities: number;
  deals: number;
  updated_at: string;
};
export const directoryColumns = {
  organisations: [
    "name",
    "reference",
    "status",
    "sector",
    "owner",
    "sites",
    "facilities",
    "deals",
  ],
  people: [
    "name",
    "organisations",
    "email",
    "phone",
    "preference",
    "status",
    "deals",
  ],
};
const sortSql: Record<string, string> = {
  name: "lower(display_name)",
  reference: "lower(coalesce(display_number,''))",
  status: "status",
  sector: "lower(coalesce(sector,''))",
  owner: "lower(coalesce(owner_name,''))",
  email: "lower(coalesce(email,''))",
  phone: "coalesce(phone,'')",
  sites: "sites",
  facilities: "facilities",
  deals: "deals",
};
export function parseDirectory(input: unknown) {
  const raw = object(input, [
    "kind",
    "q",
    "status",
    "mine",
    "sort",
    "direction",
    "page",
    "limit",
  ]);
  const kind = raw.kind;
  if (kind !== "organisations" && kind !== "people")
    invalid("kind", "Choose organisations or people.");
  const q = raw.q ?? "";
  if (typeof q !== "string" || q.length > 200 || /[\u0000-\u001f]/.test(q))
    invalid("q", "Use at most 200 characters.");
  const status = raw.status ?? "";
  if (
    typeof status !== "string" ||
    !(
      kind === "people"
        ? ["", "Active", "Inactive"]
        : ["", "Active", "Inactive", "Prospect"]
    ).includes(status)
  )
    invalid("status", "Choose an available status.");
  const sort = raw.sort ?? "name";
  if (
    typeof sort !== "string" ||
    !directoryColumns[kind].includes(sort) ||
    !sortSql[sort]
  )
    invalid("sort", "Choose a sortable column.");
  const direction = raw.direction ?? "asc";
  if (direction !== "asc" && direction !== "desc")
    invalid("direction", "Choose ascending or descending.");
  const page = Number(raw.page ?? 1),
    limit = Number(raw.limit ?? 25);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000)
    invalid("page", "Choose a valid page.");
  if (![25, 50, 100].includes(limit))
    invalid("limit", "Choose 25, 50 or 100 rows.");
  const mine = raw.mine ?? "false";
  if (
    typeof mine !== "string" ||
    !["true", "false"].includes(mine) ||
    (kind === "people" && mine === "true")
  )
    invalid("mine", "Owner filtering applies to organisations.");
  return {
    kind,
    q,
    status,
    sort,
    direction,
    page,
    limit,
    mine: mine === "true",
  };
}
export async function readDirectory(p: Principal, input: unknown) {
  const f = parseDirectory(input),
    c = database();
  await requireCapability(c, p, "shared.read");
  const org = f.kind === "organisations";
  const current =
    "rel.valid_from<=CURRENT_DATE AND (rel.valid_to IS NULL OR rel.valid_to>CURRENT_DATE)";
  const sites = `SELECT DISTINCT s.id FROM ppo.sites s JOIN ppo.site_parties sp ON (sp.workspace_id,sp.site_id)=(s.workspace_id,s.id) WHERE sp.organisation_id=r.id AND s.workspace_id=$1 AND sp.valid_from<=CURRENT_DATE AND (sp.valid_to IS NULL OR sp.valid_to>CURRENT_DATE) AND ${visibility("Site", "s")}`;
  const projection = org
    ? `r.display_number,r.relationship_status AS status,r.sector,r.owner_id,u.display_name AS owner_name,NULL::text AS email,NULL::text AS phone,NULL::text AS contact_preference,'[]'::jsonb AS organisations,
 (SELECT count(*)::int FROM (${sites}) s) AS sites,
 (SELECT count(*)::int FROM ppo.facilities fa WHERE fa.workspace_id=$1 AND fa.site_id IN (${sites}) AND ${visibility("Facility", "fa")}) AS facilities`
    : `NULL::text AS display_number,CASE WHEN r.active THEN 'Active' ELSE 'Inactive' END AS status,NULL::text AS sector,NULL::uuid AS owner_id,NULL::text AS owner_name,r.email,r.phone,r.contact_preference,
 coalesce((SELECT jsonb_agg(jsonb_build_object('id',org.id,'name',org.display_name,'role',rel.role_label) ORDER BY org.display_name,rel.role_label) FROM ppo.relationships rel JOIN ppo.organisations org ON (org.workspace_id,org.id)=(rel.workspace_id,rel.organisation_id) WHERE rel.workspace_id=$1 AND rel.person_id=r.id AND ${current} AND ${scopeSql("rel.company_id")} AND ${visibility("Organisation", "org")}), '[]'::jsonb) AS organisations,0 AS sites,0 AS facilities`;
  const { rows } = await c.query<{ total: number; items: DirectoryRow[] }>(
    `WITH permitted AS MATERIALIZED (
 SELECT r.id,r.display_name,r.updated_at,${projection},(SELECT count(*)::int FROM ppo.opportunities o WHERE o.workspace_id=$1 AND o.${org ? "organisation_id" : "primary_person_id"}=r.id AND ${opportunityVisibility()}) AS deals
 FROM ppo.${org ? "organisations" : "people"} r ${org ? "LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.owner_id)" : ""}
 WHERE r.workspace_id=$1 AND ${visibility(org ? "Organisation" : "Person")}), filtered AS MATERIALIZED (
 SELECT * FROM permitted WHERE ($3='' OR position(lower($3) in lower(concat_ws(' ',display_name,display_number,email,phone,sector,owner_name,organisations::text)))>0) AND ($4='' OR status=$4) AND (NOT $5 OR owner_id=$2))
 SELECT (SELECT count(*)::int FROM filtered) AS total,coalesce((SELECT jsonb_agg(page_rows) FROM (SELECT id,display_name,display_number,status,email,phone,contact_preference,sector,owner_name,organisations,sites,facilities,deals,updated_at FROM filtered ORDER BY ${sortSql[f.sort]} ${f.direction},id ${f.direction} LIMIT $6 OFFSET $7) page_rows),'[]'::jsonb) AS items`,
    [
      p.workspace_id,
      p.actor_id,
      f.q,
      f.status,
      f.mine,
      f.limit,
      (f.page - 1) * f.limit,
    ],
  );
  return {
    ...rows[0],
    page: f.page,
    limit: f.limit,
    observed_at: new Date().toISOString(),
    kind: f.kind,
  };
}
export type DirectoryView = {
  name: string;
  q: string;
  status: string;
  mine: string;
  sort: string;
  direction: string;
  limit: string;
  columns: string[];
};
export async function readDirectoryViews(p: Principal, kind: unknown) {
  if (kind !== "organisations" && kind !== "people")
    invalid("kind", "Choose organisations or people.");
  const c = database();
  await requireCapability(c, p, "shared.read");
  return (
    (
      await c.query<{ version: number; views: DirectoryView[] }>(
        "SELECT version,views FROM ppo.crm_directory_preferences WHERE workspace_id=$1 AND user_id=$2 AND kind=$3",
        [p.workspace_id, p.actor_id, kind],
      )
    ).rows[0] ?? { version: 0, views: [] }
  );
}
export async function saveDirectoryViews(p: Principal, input: unknown) {
  const b = object(input, ["kind", "expected_version", "views"]),
    kind = b.kind;
  if (kind !== "organisations" && kind !== "people")
    invalid("kind", "Choose organisations or people.");
  if (
    !Number.isSafeInteger(b.expected_version) ||
    Number(b.expected_version) < 0
  )
    invalid("expected_version", "Use the current saved version.");
  if (!Array.isArray(b.views) || b.views.length > 12)
    invalid("views", "Save up to twelve views.");
  const names = new Set<string>();
  const views = b.views.map((value: unknown) => {
    const v = object(value, [
      "name",
      "q",
      "status",
      "mine",
      "sort",
      "direction",
      "limit",
      "columns",
    ]);
    if (
      typeof v.name !== "string" ||
      !v.name.trim() ||
      v.name.length > 60 ||
      names.has(v.name.toLowerCase())
    )
      invalid("name", "Use unique view names of up to 60 characters.");
    names.add(v.name.toLowerCase());
    const { columns, name, ...filters } = v;
    parseDirectory({ kind, ...filters });
    if (
      !Array.isArray(columns) ||
      !columns.includes("name") ||
      columns.some(
        (x) => typeof x !== "string" || !directoryColumns[kind].includes(x),
      ) ||
      new Set(columns).size !== columns.length
    )
      invalid("columns", "Choose available columns, including name.");
    return { ...filters, name, columns };
  });
  const c = database();
  await requireCapability(c, p, "shared.read");
  const result = await c.query(
    "INSERT INTO ppo.crm_directory_preferences(workspace_id,user_id,kind,views,version) SELECT $1,$2,$3,$4,1 WHERE $5=0 ON CONFLICT(workspace_id,user_id,kind) DO NOTHING RETURNING version,views",
    [
      p.workspace_id,
      p.actor_id,
      kind,
      JSON.stringify(views),
      b.expected_version,
    ],
  );
  if (result.rows[0]) return result.rows[0];
  const update = await c.query(
    "UPDATE ppo.crm_directory_preferences SET views=$4,version=version+1,updated_at=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND kind=$3 AND version=$5 RETURNING version,views",
    [
      p.workspace_id,
      p.actor_id,
      kind,
      JSON.stringify(views),
      b.expected_version,
    ],
  );
  if (!update.rows[0])
    throw new AppError(
      409,
      "VersionConflict",
      "Your saved views changed. Reload them before saving again.",
    );
  return update.rows[0];
}
