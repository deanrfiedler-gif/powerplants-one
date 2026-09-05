import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { database } from "../platform/database";
import { unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import { uuid, invalid, object, optionalId } from "./validation";
const cursorKey = randomBytes(32);
export type SharedKind =
  "Organisation" | "Site" | "Asset" | "Person" | "Facility";
export const tables = {
  Organisation: "organisations",
  Site: "sites",
  Asset: "assets",
  Person: "people",
  Facility: "facilities",
} as const;
export function visibility(kind: SharedKind, alias = "r") {
  if (kind === "Organisation")
    return `(${scopeSql(`${alias}.company_id`)} OR EXISTS(SELECT 1 FROM ppo.site_parties sp WHERE sp.workspace_id=${alias}.workspace_id AND sp.organisation_id=${alias}.id AND ${scopeSql("sp.company_id", "sp.site_id")}))`;
  if (kind === "Person")
    return `(EXISTS(SELECT 1 FROM ppo.person_company_contexts pc WHERE pc.workspace_id=${alias}.workspace_id AND pc.person_id=${alias}.id AND ${scopeSql("pc.company_id")}) OR EXISTS(SELECT 1 FROM ppo.sites ps WHERE ps.workspace_id=${alias}.workspace_id AND ps.primary_contact_id=${alias}.id AND ${scopeSql("ps.company_id", "ps.id")}))`;
  return scopeSql(
    `${alias}.company_id`,
    kind === "Site" ? `${alias}.id` : `${alias}.site_id`,
  );
}
export async function visible(
  client: QueryClient,
  p: Principal,
  kind: SharedKind,
  id: string,
) {
  await requireCapability(client, p, "shared.read");
  const result = await client.query(
    `SELECT r.* FROM ppo.${tables[kind]} r WHERE r.workspace_id=$1 AND r.id=$3 AND ${visibility(kind)}`,
    [p.workspace_id, p.actor_id, uuid(id, "record_id")],
  );
  if (!result.rows[0]) throw unavailable();
  return result.rows[0];
}
type Row = Record<string, unknown> & {
  id: string;
  company_id: string;
  site_id?: string;
  version: number;
  updated_at: Date;
};
async function project(
  client: QueryClient,
  p: Principal,
  kind: SharedKind,
  row: Row,
) {
  const base = {
    id: row.id,
    version: row.version,
    synthetic: true,
    updated_at: row.updated_at.toISOString(),
  };
  if (kind === "Person")
    return {
      ...base,
      display_name: row.display_name,
      email: row.email,
      phone: row.phone,
      active: row.active,
      contact_preference: row.contact_preference,
    };
  const site = kind === "Site" ? row.id : row.site_id;
  const internal = await hasPermission(
    client,
    p,
    "shared.internal.read",
    row.company_id,
    site,
  );
  const finance = await hasPermission(
    client,
    p,
    "shared.finance.read",
    row.company_id,
    site,
  );
  const can_edit = await hasPermission(
    client,
    p,
    "shared.edit",
    row.company_id,
    site,
  );
  if (kind === "Organisation") {
    const parent = row.parent_organisation_id
      ? ((
          await client.query(
            `SELECT r.id FROM ppo.organisations r WHERE r.workspace_id=$1 AND r.id=$3 AND ${visibility("Organisation")}`,
            [p.workspace_id, p.actor_id, row.parent_organisation_id],
          )
        ).rows[0]?.id ?? null)
      : null;
    return {
      ...base,
      company_id: row.company_id,
      display_number: row.display_number,
      display_name: row.display_name,
      legal_name: row.legal_name,
      relationship_status: row.relationship_status,
      owner_id: row.owner_id,
      owner_name:
        (
          await client.query(
            "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, row.owner_id],
          )
        ).rows[0]?.display_name ?? null,
      sector: row.sector,
      parent_organisation_id: parent,
      can_edit,
      ...((row.access_class === "RestrictedFinance" ? finance : internal)
        ? { notes: row.notes }
        : {}),
    };
  }
  if (kind === "Site")
    return {
      ...base,
      company_id: row.company_id,
      display_number: row.display_number,
      display_name: row.display_name,
      location_description: row.location_description,
      timezone: row.timezone,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      access_instructions: row.access_instructions,
      biosecurity_notes: row.biosecurity_notes,
      controls_reviewed_at: row.controls_reviewed_at,
      primary_contact_id: row.primary_contact_id,
      can_edit,
    };
  if (kind === "Facility")
    return {
      ...base,
      site_id: row.site_id,
      name: row.name,
      parent_facility_id: row.parent_facility_id,
    };
  // A predecessor may belong to another site. Check it independently before exposing its ID.
  const predecessor = row.predecessor_asset_id
    ? ((
        await client.query(
          `SELECT r.id FROM ppo.assets r WHERE r.workspace_id=$1 AND r.id=$3 AND ${visibility("Asset")}`,
          [p.workspace_id, p.actor_id, row.predecessor_asset_id],
        )
      ).rows[0]?.id ?? null)
    : null;
  return {
    ...base,
    company_id: row.company_id,
    display_number: row.display_number,
    description: row.description,
    identity_status: row.identity_status,
    site_id: row.site_id,
    facility_id: row.facility_id,
    parent_asset_id: row.parent_asset_id,
    manufacturer: row.manufacturer,
    model: row.model,
    serial: row.serial,
    external_equipment_ref: row.external_equipment_ref,
    lifecycle_status: row.lifecycle_status,
    predecessor_asset_id: predecessor,
    installed_on: row.installed_on,
    commissioned_on: row.commissioned_on,
    warranty_start: row.warranty_start,
    warranty_end: row.warranty_end,
    can_edit,
  };
}
export const envelope = <T>(items: T[], next_cursor: string | null = null) => ({
  items,
  next_cursor,
  observed_at: new Date().toISOString(),
  completeness: next_cursor ? "Partial" : "Complete",
  source: "Synthetic",
});
export async function readShared(p: Principal, kind: SharedKind, id: string) {
  const client = database();
  const row = await visible(client, p, kind, id);
  return project(client, p, kind, row);
}
function sign(text: string) {
  return createHmac("sha256", cursorKey).update(text).digest("base64url");
}
export function page(input: unknown, binding: unknown) {
  const p = object(input, ["limit", "cursor", "company_id", "site_id", "q"]);
  const limit = p.limit === undefined ? 50 : Number(p.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200)
    invalid("limit", "Choose a page size from 1 to 200.");
  if (
    p.q !== undefined &&
    (typeof p.q !== "string" || p.q.length > 200 || /[\u0000-\u001f]/.test(p.q))
  )
    invalid("q", "Use at most 200 characters.");
  const filters = {
    company_id: optionalId(p.company_id, "company_id"),
    site_id: optionalId(p.site_id, "site_id"),
    q: (p.q as string | undefined) ?? "",
    limit,
  };
  const fingerprint = JSON.stringify({ binding, ...filters });
  let after: string | null = null;
  if (p.cursor !== undefined) {
    try {
      if (typeof p.cursor !== "string" || p.cursor.length > 2000) throw Error();
      const [body, sig, ...extra] = p.cursor.split(".");
      if (
        extra.length ||
        !sig ||
        Buffer.byteLength(sig) !== Buffer.byteLength(sign(body)) ||
        !timingSafeEqual(Buffer.from(sig), Buffer.from(sign(body)))
      )
        throw Error();
      const decoded = JSON.parse(Buffer.from(body, "base64url").toString());
      if (decoded.fingerprint !== fingerprint) throw Error();
      after = uuid(decoded.after, "cursor");
    } catch {
      invalid(
        "cursor",
        "This page token is invalid or its filters changed. Start a fresh read.",
      );
    }
  }
  return {
    ...filters,
    after,
    cursor: (last: string) => {
      const body = Buffer.from(
        JSON.stringify({ fingerprint, after: last }),
      ).toString("base64url");
      return `${body}.${sign(body)}`;
    },
  };
}
export async function listShared(
  p: Principal,
  kind: SharedKind,
  input: unknown = {},
) {
  const client = database();
  await requireCapability(client, p, "shared.read");
  const pg = page(input, {
    workspace: p.workspace_id,
    actor: p.actor_id,
    kind,
  });
  if (kind === "Person" && (pg.company_id || pg.site_id))
    invalid(
      "filters",
      "Person scope is derived from authorised affiliations and primary contacts.",
    );
  if ((kind === "Organisation" || kind === "Person") && pg.site_id)
    invalid("site_id", "This list does not accept a site filter.");
  const label =
    kind === "Asset"
      ? "description"
      : kind === "Facility"
        ? "name"
        : "display_name";
  const company = kind === "Person" ? "NULL::uuid" : "r.company_id",
    site =
      kind === "Site"
        ? "r.id"
        : kind === "Asset" || kind === "Facility"
          ? "r.site_id"
          : "NULL::uuid";
  const rows = (
    await client.query(
      `SELECT r.* FROM ppo.${tables[kind]} r WHERE r.workspace_id=$1 AND ${visibility(kind)}
    AND ($3::uuid IS NULL OR ${company}=$3) AND ($4::uuid IS NULL OR ${site}=$4)
    AND ($5::uuid IS NULL OR r.id>$5) AND position(lower($6) in lower(r.${label}${kind === "Person" || kind === "Facility" ? "" : "||' '||r.display_number"}${kind === "Asset" ? "||' '||coalesce(r.serial,'')||' '||coalesce(r.model,'')" : ""}))>0 ORDER BY r.id LIMIT $7`,
      [
        p.workspace_id,
        p.actor_id,
        pg.company_id,
        pg.site_id,
        pg.after,
        pg.q,
        pg.limit + 1,
      ],
    )
  ).rows;
  const more = rows.length > pg.limit;
  const selected = rows.slice(0, pg.limit);
  return envelope(
    await Promise.all(selected.map((row) => project(client, p, kind, row))),
    more ? pg.cursor(selected.at(-1)!.id) : null,
  );
}
export async function customerContext(p: Principal, id: string) {
  const client = database(),
    org = await visible(client, p, "Organisation", id);
  const companyRead = await hasPermission(
    client,
    p,
    "shared.read",
    org.company_id,
  );
  const contacts = companyRead
    ? (
        await client.query(
          `SELECT r.id,r.version,r.display_name,r.email,r.phone,rel.id AS relationship_id,rel.role_label,rel.valid_from,rel.valid_to FROM ppo.relationships rel JOIN ppo.people r ON (r.workspace_id,r.id)=(rel.workspace_id,rel.person_id) WHERE rel.workspace_id=$1 AND rel.organisation_id=$3 AND ${visibility("Person")} ORDER BY rel.valid_from,rel.id`,
          [p.workspace_id, p.actor_id, id],
        )
      ).rows
    : [];
  const sites = (
    await client.query(
      `SELECT DISTINCT r.* FROM ppo.site_parties sp JOIN ppo.sites r ON (r.workspace_id,r.id)=(sp.workspace_id,sp.site_id) WHERE sp.workspace_id=$1 AND sp.organisation_id=$3 AND ${visibility("Site")} ORDER BY r.id`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  const mappings = companyRead ? await mappingViews(p, id) : [];
  return {
    ...(await project(client, p, "Organisation", org)),
    contacts,
    sites: await Promise.all(sites.map((s) => project(client, p, "Site", s))),
    mappings: mappings.map((m) => ({
      id: m.id,
      version: m.version,
      mapping_status: m.mapping_status,
      valid_from: m.valid_from,
      valid_to: m.valid_to,
      is_current: m.is_current,
    })),
  };
}
export async function mappingViews(p: Principal, organisation_id: string) {
  const client = database(),
    org = await visible(client, p, "Organisation", organisation_id);
  if (!(await hasPermission(client, p, "shared.read", org.company_id)))
    return [];
  const keys =
    (await hasPermission(client, p, "shared.internal.read", org.company_id)) ||
    (await hasPermission(client, p, "shared.finance.read", org.company_id));
  return (
    await client.query(
      `SELECT m.id,m.version,m.mapping_status,m.valid_from,m.valid_to,m.company_id,(m.valid_from<=clock_timestamp() AND (m.valid_to IS NULL OR m.valid_to>clock_timestamp())) AS is_current${keys ? ",m.erp_connection_id,c.provider,c.external_connection_key,m.erp_company_id,m.entity_type,m.customer_id" : ""} FROM ppo.erp_account_mappings m JOIN ppo.erp_connections c ON (c.workspace_id,c.id)=(m.workspace_id,m.erp_connection_id) WHERE m.workspace_id=$1 AND m.organisation_id=$2 ORDER BY m.id`,
      [p.workspace_id, organisation_id],
    )
  ).rows;
}
export async function siteContext(p: Principal, id: string) {
  const client = database(),
    site = await visible(client, p, "Site", id);
  const parties = (
    await client.query(
      `SELECT sp.id,sp.version,sp.role,sp.organisation_id,r.display_name,sp.valid_from,sp.valid_to,(sp.valid_from<=clock_timestamp() AND (sp.valid_to IS NULL OR sp.valid_to>clock_timestamp())) AS is_current FROM ppo.site_parties sp JOIN ppo.organisations r ON (r.workspace_id,r.id)=(sp.workspace_id,sp.organisation_id) WHERE sp.workspace_id=$1 AND sp.site_id=$3 AND ${visibility("Organisation")} ORDER BY sp.valid_from,sp.id`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  const assets = await listShared(p, "Asset", { site_id: id, limit: 200 });
  const facilities = await listShared(p, "Facility", {
    site_id: id,
    limit: 200,
  });
  return {
    ...(await project(client, p, "Site", site)),
    parties,
    primary_contact: site.primary_contact_id
      ? await readShared(p, "Person", site.primary_contact_id)
      : null,
    assets,
    facilities,
  };
}
export async function assetHistory(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  const client = database();
  await visible(client, p, "Asset", id);
  const pg = page(input, {
    workspace: p.workspace_id,
    actor: p.actor_id,
    asset: id,
  });
  if (pg.company_id || pg.site_id || pg.q)
    invalid("filters", "Use pagination only for asset history.");
  const rows = (
    await client.query(
      `SELECT h.id,h.version,h.site_id,h.asset_id,h.occurred_at,h.author_label,h.kind,h.summary,h.confidence,h.source_system,h.source_id,h.verification_status,h.site_label,h.operator_organisation_id,h.operator_label,h.asset_identity_status
    FROM ppo.history_records h WHERE h.workspace_id=$1 AND h.asset_id=$3 AND ${scopeSql("h.company_id", "h.site_id")}
    AND (h.access_class IN ('RestrictedService','CustomerApproved') OR (h.access_class='Internal' AND ${scopeSql("h.company_id", "h.site_id", "shared.internal.read")}) OR (h.access_class='RestrictedFinance' AND ${scopeSql("h.company_id", "h.site_id", "shared.finance.read")}))
    AND ($4::uuid IS NULL OR h.id>$4) ORDER BY h.id LIMIT $5`,
      [p.workspace_id, p.actor_id, id, pg.after, pg.limit + 1],
    )
  ).rows;
  return envelope(
    rows.slice(0, pg.limit),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}
export async function assetContext(p: Principal, id: string) {
  const client = database(),
    asset = await visible(client, p, "Asset", id);
  const configurations = (
    await client.query(
      `SELECT id,revision,description,verification_status,valid_from,valid_to,(valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp())) AS is_current FROM ppo.asset_configurations WHERE workspace_id=$1 AND asset_id=$2 ORDER BY revision`,
      [p.workspace_id, id],
    )
  ).rows;
  const locations = (
    await client.query(
      `SELECT e.id,e.from_site_id,e.to_site_id,e.effective_at,e.reason FROM ppo.asset_location_events e WHERE e.workspace_id=$1 AND e.asset_id=$3 AND ${scopeSql("e.company_id", "e.to_site_id")} AND (e.from_site_id IS NULL OR ${scopeSql("e.company_id", "e.from_site_id")}) ORDER BY e.effective_at`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  return {
    ...(await project(client, p, "Asset", asset)),
    configurations,
    locations,
  };
}
