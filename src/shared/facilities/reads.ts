import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { database } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import {
  hasPermission,
  requireCapability,
  type QueryClient,
} from "../../platform/permissions";
import { envelope, page, visibility, visible } from "../reads";
import { invalid, object, uuid } from "../validation";
import {
  fields,
  structures,
  uses,
  type Details,
  type Facility,
  type PathEntry,
  type Source,
} from "./definition";

export type Row = Record<string, unknown> & {
  id: string;
  workspace_id: string;
  company_id: string;
  site_id: string;
  version: number;
  name: string;
  parent_facility_id: string | null;
  updated_at: Date;
  updated_by: string;
};
export function sourceProjection(row: Record<string, unknown>): Source {
  return {
    id: String(row.id),
    version: 1,
    kind: "reported_note",
    title: String(row.title),
    note: row.note as string | null,
    source_date: row.source_date as string | null,
    recorded_by: String(row.recorded_by),
    recorded_at: new Date(row.recorded_at as string).toISOString(),
    replaces_source_id: row.replaces_source_id as string | null,
  };
}
export async function sources(
  c: QueryClient,
  p: Principal,
  facilityId: string,
) {
  await visible(c, p, "Facility", facilityId);
  return (
    await c.query(
      "SELECT *,source_date::text FROM ppo.facility_sources WHERE workspace_id=$1 AND facility_id=$2 ORDER BY recorded_at,id LIMIT 200",
      [p.workspace_id, facilityId],
    )
  ).rows.map(sourceProjection);
}
export async function sourcePage(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  id = uuid(id, "id");
  const c = database();
  await visible(c, p, "Facility", id);
  const pg = page(object(input, ["cursor", "limit"]), {
    workspace: p.workspace_id,
    actor: p.actor_id,
    facility_sources: id,
  });
  const rows = (
    await c.query(
      "SELECT *,source_date::text FROM ppo.facility_sources WHERE workspace_id=$1 AND facility_id=$2 AND ($3::uuid IS NULL OR id>$3) ORDER BY id LIMIT $4",
      [p.workspace_id, id, pg.after, pg.limit + 1],
    )
  ).rows;
  return envelope(
    rows.slice(0, pg.limit).map(sourceProjection),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}
export async function pathFor(
  c: QueryClient,
  p: Principal,
  id: string | null,
): Promise<PathEntry[]> {
  if (!id) return [];
  await visible(c, p, "Facility", id);
  return (
    await c.query(
      `WITH RECURSIVE ancestors AS (
    SELECT id,name,version,parent_facility_id,parent_relationship,0 AS depth FROM ppo.facilities WHERE workspace_id=$1 AND id=$2
    UNION ALL SELECT f.id,f.name,f.version,f.parent_facility_id,f.parent_relationship,a.depth+1 FROM ppo.facilities f JOIN ancestors a ON f.id=a.parent_facility_id AND f.workspace_id=$1)
    SELECT id,name,version,CASE WHEN parent_facility_id IS NOT NULL THEN coalesce(parent_relationship,'grouping') END AS parent_relationship FROM ancestors ORDER BY depth DESC`,
      [p.workspace_id, id],
    )
  ).rows;
}
export async function projectFacility(
  c: QueryClient,
  p: Principal,
  row: Row,
): Promise<Facility> {
  const site = await visible(c, p, "Site", row.site_id);
  const refs = [
    "location_source",
    "context_source",
    "measurement_source",
    "pin_source",
  ];
  const ids = refs.map((k) => row[`${k}_id`]).filter(Boolean);
  const sourceRows = ids.length
    ? (
        await c.query(
          "SELECT *,source_date::text FROM ppo.facility_sources WHERE workspace_id=$1 AND facility_id=$2 AND id=ANY($3::uuid[])",
          [p.workspace_id, row.id, ids],
        )
      ).rows
    : [];
  const sourceMap = new Map(sourceRows.map((s) => [s.id, sourceProjection(s)]));
  const details: Details = {};
  // JSON date conversion is performed by PostgreSQL, never the machine's time zone.
  const dates = (
    await c.query(
      "SELECT context_observed_on::text,measurement_observed_on::text,pin_checked_on::text FROM ppo.facilities WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, row.id],
    )
  ).rows[0];
  for (const [key, f] of Object.entries(fields)) {
    const value =
      f.kind === "source"
        ? (sourceMap.get(row[`${key}_id`]) ?? null)
        : f.kind === "date"
          ? dates[key]
          : (row[key] ?? null);
    details[key] = value as Details[string];
  }
  if (row.parent_facility_id) details.parent_relationship ??= "grouping";
  return {
    id: row.id,
    version: row.version,
    company_id: row.company_id,
    site_id: row.site_id,
    site_name: site.display_name,
    timezone: site.timezone,
    reference:
      (
        await c.query(
          "SELECT display_number FROM ppo.business_identities WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, row.id],
        )
      ).rows[0]?.display_number ?? null,
    details,
    path: await pathFor(c, p, row.parent_facility_id),
    pin:
      row.pin_latitude === null || row.pin_latitude === undefined
        ? null
        : {
            latitude: String(row.pin_latitude),
            longitude: String(row.pin_longitude),
            state: row.pin_state as "proposed" | "confirmed",
            checked_on: dates.pin_checked_on,
            source: sourceMap.get(row.pin_source_id) ?? null,
          },
    updated_at: row.updated_at.toISOString(),
    updated_by: row.updated_by,
    can_edit: await hasPermission(
      c,
      p,
      "shared.edit",
      row.company_id,
      row.site_id,
    ),
  };
}
export async function facilityWorkspace(p: Principal, id: string) {
  const c = database();
  return projectFacility(
    c,
    p,
    (await visible(c, p, "Facility", uuid(id, "id"))) as Row,
  );
}

const key = randomBytes(32);
const sign = (body: string) =>
  createHmac("sha256", key).update(body).digest("base64url");
function cursor(binding: unknown, raw: unknown) {
  const fingerprint = JSON.stringify(binding);
  let after: string[] | null = null;
  if (raw !== undefined)
    try {
      if (typeof raw !== "string" || raw.length > 4000) throw Error();
      const [body, sig, ...extra] = raw.split(".");
      const expected = sign(body);
      if (
        extra.length ||
        !sig ||
        sig.length !== expected.length ||
        !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      )
        throw Error();
      const v = JSON.parse(Buffer.from(body, "base64url").toString());
      if (
        v.fingerprint !== fingerprint ||
        !Array.isArray(v.after) ||
        v.after.length !== 3 ||
        v.after.some((x: unknown) => typeof x !== "string")
      )
        throw Error();
      uuid(v.after[2], "cursor");
      after = v.after;
    } catch {
      invalid(
        "cursor",
        "This page token is invalid or its filters changed. Start a fresh read.",
      );
    }
  return {
    after,
    encode: (tuple: string[]) => {
      const b = Buffer.from(
        JSON.stringify({ fingerprint, after: tuple }),
      ).toString("base64url");
      return `${b}.${sign(b)}`;
    },
  };
}
export type RegisterRow = {
  id: string;
  name: string;
  site_id: string;
  company_id: string;
  site_name: string;
  reference: string | null;
  parent_facility_id: string | null;
  parent_name: string | null;
  parent_relationship: string | null;
  structure_type: string | null;
  use: string | null;
  crop: string | null;
  footprint_m2: string | null;
  on_site_position: string | null;
  updated_at: string;
  has_children: boolean;
  ancestor_path?: { id: string; name: string }[];
  organisation_roles?: string[];
};
export async function registerFacilities(p: Principal, input: unknown = {}) {
  const q = object(input, [
    "q",
    "site_id",
    "organisation_id",
    "structure_type",
    "use",
    "sort",
    "limit",
    "cursor",
    "parent_id",
    "exclude_id",
  ]);
  const limit = q.limit === undefined ? 50 : Number(q.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200)
    invalid("limit", "Choose 1–200 rows.");
  if (
    q.q !== undefined &&
    (typeof q.q !== "string" || q.q.length > 200 || /[\u0000-\u001f]/.test(q.q))
  )
    invalid("q", "Search with at most 200 characters.");
  const filters = {
    q: ((q.q as string) ?? "").trim().toLowerCase(),
    site_id: q.site_id ? uuid(q.site_id, "site_id") : null,
    organisation_id: q.organisation_id
      ? uuid(q.organisation_id, "organisation_id")
      : null,
    structure_type: q.structure_type ?? null,
    use: q.use ?? null,
    sort: q.sort ?? "name",
    limit,
    parent_id:
      q.parent_id === undefined
        ? null
        : q.parent_id === "root"
          ? "root"
          : uuid(q.parent_id, "parent_id"),
    exclude_id: q.exclude_id ? uuid(q.exclude_id, "exclude_id") : null,
  };
  for (const [field, choices] of [
    ["structure_type", structures],
    ["use", uses],
  ] as const)
    if (
      filters[field] &&
      filters[field] !== "not_recorded" &&
      !Object.hasOwn(choices, String(filters[field]))
    )
      invalid(field, "Choose a listed filter.");
  if (!["name", "site", "structure", "updated"].includes(String(filters.sort)))
    invalid("sort", "Choose name, site, structure or updated.");
  const c = database();
  await requireCapability(c, p, "shared.read");
  if (filters.site_id) await visible(c, p, "Site", filters.site_id);
  if (filters.organisation_id)
    await visible(c, p, "Organisation", filters.organisation_id);
  if (filters.exclude_id) await visible(c, p, "Facility", filters.exclude_id);
  const page = cursor(
    { actor: p.actor_id, workspace: p.workspace_id, ...filters },
    q.cursor,
  );
  const args: unknown[] = [p.workspace_id, p.actor_id];
  const bind = (v: unknown) => {
    args.push(v);
    return `$${args.length}`;
  };
  const where = ["f.workspace_id=$1", visibility("Facility", "f")];
  if (filters.site_id) where.push(`f.site_id=${bind(filters.site_id)}`);
  if (filters.organisation_id)
    where.push(
      `EXISTS(SELECT 1 FROM ppo.site_parties sp WHERE sp.workspace_id=f.workspace_id AND sp.site_id=f.site_id AND sp.organisation_id=${bind(filters.organisation_id)} AND sp.valid_from<=clock_timestamp() AND (sp.valid_to IS NULL OR sp.valid_to>clock_timestamp()))`,
    );
  if (filters.q) {
    const x = bind(filters.q);
    where.push(
      `(position(${x} in lower(f.name))>0 OR position(${x} in lower(coalesce(f.on_site_position,'')))>0 OR lower(bi.display_number)=${x} OR f.id::text=${x})`,
    );
  }
  for (const k of ["structure_type", "use"])
    if (filters[k as "use"])
      where.push(
        filters[k as "use"] === "not_recorded"
          ? `f."${k}" IS NULL`
          : `f."${k}"=${bind(filters[k as "use"])}`,
      );
  if (filters.parent_id)
    where.push(
      filters.parent_id === "root"
        ? "f.parent_facility_id IS NULL"
        : `f.parent_facility_id=${bind(filters.parent_id)}`,
    );
  if (filters.exclude_id)
    where.push(
      `f.id NOT IN (WITH RECURSIVE descendants AS (SELECT id FROM ppo.facilities WHERE workspace_id=$1 AND id=${bind(filters.exclude_id)} UNION ALL SELECT ch.id FROM ppo.facilities ch JOIN descendants d ON ch.parent_facility_id=d.id WHERE ch.workspace_id=$1) SELECT id FROM descendants)`,
    );
  const sort =
    filters.sort === "site"
      ? "lower(s.display_name)"
      : filters.sort === "structure"
        ? "coalesce(f.structure_type,chr(1114111))"
        : filters.sort === "updated"
          ? "to_char(f.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS.US')"
          : "lower(f.name)";
  const joins =
    "FROM ppo.facilities f JOIN ppo.sites s ON s.workspace_id=f.workspace_id AND s.id=f.site_id LEFT JOIN ppo.business_identities bi ON bi.workspace_id=f.workspace_id AND bi.id=f.id LEFT JOIN ppo.facilities par ON par.workspace_id=f.workspace_id AND par.id=f.parent_facility_id";
  // Counts apply to the complete permitted filter, before keyset continuation.
  const total = Number(
    (
      await c.query(
        `SELECT count(*) AS count ${joins} WHERE ${where.join(" AND ")}`,
        args,
      )
    ).rows[0].count,
  );
  if (page.after) {
    const a = bind(page.after[0]),
      b = bind(page.after[1]),
      d = bind(page.after[2]);
    where.push(
      filters.sort === "updated"
        ? `(${sort}<${a} OR (${sort}=${a} AND (lower(f.name) COLLATE "C",f.id) > (${b} COLLATE "C",${d}::uuid)))`
        : `(${sort} COLLATE "C",lower(f.name) COLLATE "C",f.id)>(${a} COLLATE "C",${b} COLLATE "C",${d}::uuid)`,
    );
  }
  const result = await c.query(
    `SELECT f.id,f.name,f.site_id,f.company_id,s.display_name AS site_name,bi.display_number AS reference,f.parent_facility_id,par.name AS parent_name,
    CASE WHEN f.parent_facility_id IS NOT NULL THEN coalesce(f.parent_relationship,'grouping') END AS parent_relationship,f.structure_type,f."use",f.crop,f.footprint_m2::text,f.on_site_position,f.updated_at,
    EXISTS(SELECT 1 FROM ppo.facilities ch WHERE ch.workspace_id=f.workspace_id AND ch.parent_facility_id=f.id) AS has_children,
    ${sort} AS sort_value,lower(f.name) AS sort_name ${joins} WHERE ${where.join(" AND ")}
    ORDER BY ${sort} COLLATE "C" ${filters.sort === "updated" ? "DESC" : "ASC"},lower(f.name) COLLATE "C",f.id LIMIT ${bind(limit + 1)}`,
    args,
  );
  const more = result.rows.length > limit,
    rows = result.rows.slice(0, limit),
    last = rows.at(-1);
  const items: RegisterRow[] = rows.map(
    ({ sort_value: _, sort_name: __, ...r }) =>
      ({ ...r, updated_at: r.updated_at.toISOString() }) as RegisterRow,
  );
  if (filters.organisation_id && items.length) {
    const relationships = (
      await c.query<{ site_id: string; role: string }>(
        `SELECT DISTINCT site_id,role FROM ppo.site_parties WHERE workspace_id=$1 AND organisation_id=$2 AND site_id=ANY($3::uuid[]) AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp()) ORDER BY site_id,role`,
        [
          p.workspace_id,
          filters.organisation_id,
          [...new Set(items.map((f) => f.site_id))],
        ],
      )
    ).rows;
    for (const f of items)
      f.organisation_roles = relationships
        .filter((r) => r.site_id === f.site_id)
        .map((r) => r.role);
  }
  const ancestors =
    filters.site_id && items.length
      ? (
          await c.query(
            `WITH RECURSIVE ancestors AS (
    SELECT f.id,f.name,f.parent_facility_id,1 AS depth FROM ppo.facilities f WHERE f.workspace_id=$1 AND f.id IN (SELECT parent_facility_id FROM ppo.facilities WHERE workspace_id=$1 AND id=ANY($2::uuid[]))
    UNION SELECT f.id,f.name,f.parent_facility_id,a.depth+1 FROM ppo.facilities f JOIN ancestors a ON a.parent_facility_id=f.id WHERE f.workspace_id=$1)
    SELECT DISTINCT id,name,parent_facility_id FROM ancestors`,
            [p.workspace_id, items.map((i) => i.id)],
          )
        ).rows
      : [];
  const ancestorMap = new Map(ancestors.map((a) => [a.id, a]));
  for (const row of items) {
    const path: { id: string; name: string }[] = [];
    let id = row.parent_facility_id;
    while (id && ancestorMap.has(id)) {
      const a = ancestorMap.get(id)!;
      path.unshift({ id: a.id, name: a.name });
      id = a.parent_facility_id;
    }
    row.ancestor_path = path;
  }
  return {
    ...envelope(
      items,
      more ? page.encode([last.sort_value, last.sort_name, last.id]) : null,
    ),
    context_ancestors: ancestors,
    total,
    can_create: filters.site_id
      ? await hasPermission(
          c,
          p,
          "shared.create",
          items[0]?.company_id ??
            (await visible(c, p, "Site", filters.site_id)).company_id,
          filters.site_id,
        )
      : await hasPermission(c, p, "shared.create"),
    filters,
  };
}
export async function facilityHistory(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  const q = object(input, ["cursor"]);
  const c = database();
  await visible(c, p, "Facility", uuid(id, "id"));
  const pg = cursor(
    { actor: p.actor_id, workspace: p.workspace_id, history: id },
    q.cursor,
  );
  const rows = (
    await c.query(
      `SELECT a.id,a.reason,a.details,a.occurred_at,u.display_name AS actor FROM ppo.audit_events a JOIN ppo.users u ON u.workspace_id=a.workspace_id AND u.id=a.actor_id
    WHERE a.workspace_id=$1 AND a.object_type='Facility' AND a.object_id=$2 AND ($3::text IS NULL OR (a.occurred_at,a.id)<($3::timestamptz,$4::uuid)) ORDER BY a.occurred_at DESC,a.id DESC LIMIT 51`,
      [p.workspace_id, id, pg.after?.[0] ?? null, pg.after?.[2] ?? null],
    )
  ).rows;
  const last = rows[49];
  return envelope(
    rows.slice(0, 50),
    rows.length > 50
      ? pg.encode([last.occurred_at.toISOString(), "", last.id])
      : null,
  );
}
export async function facilityEquipment(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  const q = object(input, ["cursor"]);
  const c = database();
  const f = await visible(c, p, "Facility", uuid(id, "id"));
  const pg = cursor(
    { actor: p.actor_id, workspace: p.workspace_id, equipment: id },
    q.cursor,
  );
  const rows = (
    await c.query(
      `SELECT a.id,a.description,a.display_number,a.version,a.facility_id,a.site_id,loc.name AS installed_name,(a.facility_id=$3) AS installed,l.id AS link_id,
    CASE WHEN s.id IS NOT NULL THEN to_jsonb(s) || jsonb_build_object('source_date',s.source_date::text) END AS source
    FROM ppo.assets a LEFT JOIN ppo.facilities loc ON loc.workspace_id=a.workspace_id AND loc.id=a.facility_id
    LEFT JOIN ppo.asset_served_facilities l ON l.workspace_id=a.workspace_id AND l.asset_id=a.id AND l.facility_id=$3 AND l.ended_at IS NULL
    LEFT JOIN ppo.facility_sources s ON s.workspace_id=l.workspace_id AND s.id=l.source_id
    WHERE a.workspace_id=$1 AND ${visibility("Asset", "a")} AND (a.facility_id=$3 OR l.id IS NOT NULL) AND ($4::uuid IS NULL OR a.id>$4) ORDER BY a.id LIMIT 51`,
      [p.workspace_id, p.actor_id, id, pg.after?.[2] ?? null],
    )
  ).rows;
  const items = rows
    .slice(0, 50)
    .map((r) => ({
      ...r,
      source: r.source ? sourceProjection(r.source) : null,
    }));
  return {
    ...envelope(
      items,
      rows.length > 50 ? pg.encode(["", "", items.at(-1).id]) : null,
    ),
    can_edit: await hasPermission(c, p, "shared.edit", f.company_id, f.site_id),
    work: {
      state: "unsupported",
      message: "Facility work links are not yet supported.",
    },
    documents: {
      state: "unsupported",
      message: "Facility document links are not yet supported.",
    },
  };
}
