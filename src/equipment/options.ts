import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  requireCapability,
  scopeSql,
} from "../platform/permissions";
import { visibility, visible } from "../shared/reads";
import { object, optionalId } from "../shared/validation";
import { currentConfiguration } from "./changes";
export async function equipmentOptions(p: Principal, input: unknown = {}) {
  const q = object(input, ["asset_id"]),
    id = optionalId(q.asset_id, "asset_id"),
    c = database();
  await requireCapability(c, p, "shared.read");
  const asset = id ? await visible(c, p, "Asset", id) : null;
  const companies = (
    await c.query<{ id: string; display_name: string }>(
      `SELECT c.id,c.display_name FROM ppo.companies c WHERE c.workspace_id=$1 AND ${scopeSql("c.id", undefined, "shared.edit")} ORDER BY c.display_name`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  const assets = (
    await c.query<{
      id: string;
      version: number;
      display_number: string;
      description: string;
      site_id: string;
      company_id: string;
    }>(
      `SELECT a.id,a.version,a.display_number,a.description,a.site_id,a.company_id FROM ppo.assets a WHERE a.workspace_id=$1 AND ${visibility("Asset", "a")} ORDER BY a.display_number LIMIT 201`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  const sites = (
    await c.query<{ id: string; display_name: string; company_id: string }>(
      `SELECT s.id,s.display_name,s.company_id FROM ppo.sites s WHERE s.workspace_id=$1 AND ${visibility("Site", "s")} ORDER BY s.display_name LIMIT 201`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  const facilities = (
    await c.query<{ id: string; name: string; site_id: string }>(
      `SELECT f.id,f.name,f.site_id FROM ppo.facilities f WHERE f.workspace_id=$1 AND ${visibility("Facility", "f")} ORDER BY f.name LIMIT 201`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  const people = (
    await c.query<{ id: string; display_name: string }>(
      `SELECT DISTINCT u.id,u.display_name FROM ppo.users u JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(u.workspace_id,u.id) WHERE u.workspace_id=$1 AND u.active AND g.capability='activity.edit' AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) AND ($3::uuid IS NULL OR g.scope_type='Workspace' OR (g.company_id=$3 AND (g.scope_type='Company' OR g.site_id=$4))) AND ${scopeSql("g.company_id", "g.site_id")} ORDER BY u.display_name`,
      [
        p.workspace_id,
        p.actor_id,
        asset?.company_id ?? null,
        asset?.site_id ?? null,
      ],
    )
  ).rows;
  return {
    companies,
    assets: assets.slice(0, 200),
    sites: sites.slice(0, 200),
    facilities: facilities.slice(0, 200),
    people,
    partial:
      assets.length > 200 || sites.length > 200 || facilities.length > 200,
    configuration: asset
      ? await currentConfiguration(c, p.workspace_id, asset.id)
      : null,
    asset: asset
      ? {
          id: asset.id,
          version: asset.version,
          company_id: asset.company_id,
          site_id: asset.site_id,
        }
      : null,
    can_edit: asset
      ? await hasPermission(
          c,
          p,
          "shared.edit",
          asset.company_id,
          asset.site_id,
        )
      : await hasPermission(c, p, "shared.edit"),
  };
}
