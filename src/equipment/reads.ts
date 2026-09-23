import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { hasPermission, requireCapability } from "../platform/permissions";
import {
  assetContext,
  assetHistory,
  visibility,
  visible,
} from "../shared/reads";
import {
  choice,
  invalid,
  object,
  optionalId,
  uuid,
} from "../shared/validation";
import {
  equipmentViews,
  identityStates,
  lifecycleStates,
  lookupIdentifier,
  type EquipmentRow,
} from "./model";

// Every relationship is independently scoped; counts are over the same permitted set as rows.
const projection = `SELECT a.id,a.version,a.company_id,a.display_number,a.description,a.manufacturer,a.model,a.serial,a.identity_status,a.lifecycle_status,
 a.site_id,s.display_name AS site_name,s.address,a.facility_id,f.name AS installed_name,
 coalesce((SELECT jsonb_agg(jsonb_build_object('id',o.id,'name',o.display_name,'role',sp.role) ORDER BY o.display_name)
 FROM ppo.site_parties sp JOIN ppo.organisations o ON (o.workspace_id,o.id)=(sp.workspace_id,sp.organisation_id)
 WHERE sp.workspace_id=a.workspace_id AND sp.site_id=a.site_id AND sp.valid_from<=clock_timestamp() AND (sp.valid_to IS NULL OR sp.valid_to>clock_timestamp()) AND ${visibility("Organisation", "o")}), '[]') AS customers,
 coalesce((SELECT jsonb_agg(jsonb_build_object('id',sf.id,'name',sf.name,'source_id',l.source_id) ORDER BY sf.name)
 FROM ppo.asset_served_facilities l JOIN ppo.facilities sf ON (sf.workspace_id,sf.id)=(l.workspace_id,l.facility_id)
 WHERE l.workspace_id=a.workspace_id AND l.asset_id=a.id AND l.ended_at IS NULL AND ${visibility("Facility", "sf")}), '[]') AS served,
 EXISTS(SELECT 1 FROM ppo.asset_location_events e WHERE e.workspace_id=a.workspace_id AND e.asset_id=a.id AND e.from_site_id IS NOT NULL) AS moved
 FROM ppo.assets a JOIN ppo.sites s ON (s.workspace_id,s.id)=(a.workspace_id,a.site_id)
 LEFT JOIN ppo.facilities f ON (f.workspace_id,f.id)=(a.workspace_id,a.facility_id)
 WHERE a.workspace_id=$1 AND ${visibility("Asset", "a")} AND ${visibility("Site", "s")}`;

export async function equipmentRegister(p: Principal, input: unknown = {}) {
  const q = object(input, [
    "q",
    "site_id",
    "installed_id",
    "served_id",
    "identity",
    "lifecycle",
    "page",
  ]);
  await requireCapability(database(), p, "shared.read");
  const search = String(q.q ?? "").trim(),
    page = Number(q.page ?? 1);
  if (
    search.length > 200 ||
    /[\u0000-\u001f]/.test(search) ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 10000
  )
    invalid("filters", "Use a valid search and page.");
  const args = [
    p.workspace_id,
    p.actor_id,
    search.toLowerCase(),
    optionalId(q.site_id || null, "site_id"),
    optionalId(q.installed_id || null, "installed_id"),
    optionalId(q.served_id || null, "served_id"),
    q.identity ? choice(q.identity, "identity", identityStates) : null,
    q.lifecycle ? choice(q.lifecycle, "lifecycle", lifecycleStates) : null,
  ];
  const filter = `($3='' OR position($3 in lower(concat_ws(' ',display_number,description,serial,manufacturer,model,site_name,installed_name,customers::text,served::text)))>0)
    AND ($4::uuid IS NULL OR site_id=$4) AND ($5::uuid IS NULL OR facility_id=$5)
    AND ($6::uuid IS NULL OR EXISTS(SELECT 1 FROM jsonb_array_elements(served) x WHERE x->>'id'=$6::text))
    AND ($7::text IS NULL OR identity_status=$7) AND ($8::text IS NULL OR lifecycle_status=$8)`;
  const result = await database().query<{
    items: EquipmentRow[];
    total: number;
    permitted_total: number;
  }>(
    `WITH permitted AS (${projection}), filtered AS (SELECT * FROM permitted WHERE ${filter})
    SELECT (SELECT count(*)::int FROM permitted) AS permitted_total,(SELECT count(*)::int FROM filtered) AS total,
    coalesce((SELECT jsonb_agg(t) FROM (SELECT * FROM filtered ORDER BY display_number,id LIMIT 30 OFFSET $9) t),'[]') AS items`,
    [...args, (page - 1) * 30],
  );
  return {
    ...result.rows[0],
    page,
    page_size: 30,
    observed_at: new Date().toISOString(),
    source: "Synthetic" as const,
  };
}
export async function equipmentLookup(p: Principal, input: unknown) {
  const q = object(input, ["q"]),
    parsed = lookupIdentifier(String(q.q ?? ""));
  await requireCapability(database(), p, "shared.read");
  if (!parsed)
    return {
      outcome: "Malformed",
      items: [] as EquipmentRow[],
      message: "Use an Asset reference, UUID, serial or a PPO equipment link.",
    };
  const column = {
    id: "a.id::text",
    reference: "a.display_number",
    serial: "a.serial",
  }[parsed.kind];
  const rows = (
    await database().query<EquipmentRow>(
      `${projection} AND ${column}=$3 ORDER BY a.display_number LIMIT 21`,
      [p.workspace_id, p.actor_id, parsed.value],
    )
  ).rows;
  // Do not enumerate inaccessible identities. Absence and hidden scope share one truthful outcome.
  const outcome = !rows.length
    ? "UnknownOrInaccessible"
    : rows.length > 1
      ? "Ambiguous"
      : rows[0].lifecycle_status !== "Active"
        ? "Removed"
        : rows[0].moved
          ? "Moved"
          : "Exact";
  return {
    outcome,
    items: rows.slice(0, 20),
    message:
      rows.length > 20
        ? "More matches exist; use the exact Asset reference."
        : null,
  };
}
export async function equipmentWorkspace(p: Principal, id: string) {
  id = uuid(id, "id");
  const c = database(),
    a = await visible(c, p, "Asset", id);
  const context = (
    await c.query<EquipmentRow>(`${projection} AND a.id=$3`, [
      p.workspace_id,
      p.actor_id,
      id,
    ])
  ).rows[0];
  const savedAsset = await assetContext(p, id);
  const asset = {
    ...savedAsset,
    parent_asset_id: a.parent_asset_id as string | null,
    predecessor_asset_id: ("predecessor_asset_id" in savedAsset
      ? savedAsset.predecessor_asset_id
      : null) as string | null,
    installed_on: a.installed_on as string | null,
    commissioned_on: a.commissioned_on as string | null,
    warranty_start: a.warranty_start as string | null,
    warranty_end: a.warranty_end as string | null,
  };
  return {
    context,
    asset,
    history: await assetHistory(p, id, { limit: 200 }),
    can_edit: await hasPermission(c, p, "shared.edit", a.company_id, a.site_id),
    views: equipmentViews,
  };
}
