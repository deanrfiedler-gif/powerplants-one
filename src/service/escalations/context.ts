import type { QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";
import { requireCapability, hasPermission } from "../../platform/permissions";
import { unavailable } from "../../platform/errors";
import { companyContext, scopedOwner } from "../../shared/authority";
import { visible } from "../../shared/reads";
import { uuid, invalid } from "../../shared/validation";
import { sourceContext } from "../findings/next-action";
import type { EscalationCase } from "./types";
export const caseCapability = "service_escalation.record" as const;
export async function assetContext(c: QueryClient, p: Principal, id: string) {
  await requireCapability(c, p, caseCapability);
  const asset = await visible(c, p, "Asset", uuid(id, "asset_id"));
  await companyContext(c, p, asset.company_id, asset.site_id, caseCapability);
  return asset;
}
export async function findingEquipment(
  c: QueryClient,
  p: Principal,
  key: string,
  assetId: string,
) {
  const asset = await assetContext(c, p, assetId),
    finding = await sourceContext(c, p, key);
  if (
    asset.company_id !== finding.item.company_id ||
    asset.site_id !== finding.item.site.id ||
    (finding.item.equipment && finding.item.equipment.id !== asset.id)
  )
    throw unavailable();
  return { asset, finding };
}
export async function caseContext(c: QueryClient, p: Principal, id: string) {
  await requireCapability(c, p, caseCapability);
  const row = (
    await c.query<EscalationCase>(
      "SELECT * FROM ppo.service_escalation_cases WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const { asset, finding } = await findingEquipment(
    c,
    p,
    row.finding_key,
    row.asset_id,
  );
  if (row.company_id !== asset.company_id || row.site_id !== asset.site_id)
    throw unavailable();
  return { row, asset, finding };
}
export async function caseOwner(
  c: QueryClient,
  p: Principal,
  ownerId: string,
  key: string,
  assetId: string,
) {
  const asset = await assetContext(c, p, assetId);
  const owner = await scopedOwner(
    c,
    p,
    ownerId,
    asset.company_id,
    asset.site_id,
    caseCapability,
  );
  await findingEquipment(c, owner, key, assetId);
  if (
    !(await hasPermission(
      c,
      owner,
      "activity.read",
      asset.company_id,
      asset.site_id,
    )) ||
    !(await hasPermission(
      c,
      owner,
      "activity.edit",
      asset.company_id,
      asset.site_id,
    ))
  )
    throw unavailable();
  return owner;
}
export async function supportRoute(
  c: QueryClient,
  p: Principal,
  asset: Awaited<ReturnType<typeof assetContext>>,
) {
  const route = (
    await c.query<{
      version: number;
      manufacturer: string;
      method: "Email" | "Portal";
      recipient: string;
    }>(
      "SELECT version,manufacturer,method,recipient FROM ppo.equipment_support_routes WHERE workspace_id=$1 AND asset_id=$2",
      [p.workspace_id, asset.id],
    )
  ).rows[0];
  return route && route.manufacturer === asset.manufacturer ? route : null;
}
export function activeFinding(
  ctx: Awaited<ReturnType<typeof findingEquipment>>,
) {
  if (["Closed", "Superseded"].includes(ctx.finding.item.state))
    invalid("finding_key", "Open a case from an active finding.");
}
