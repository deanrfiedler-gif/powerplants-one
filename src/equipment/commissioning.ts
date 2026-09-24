import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { visible } from "../shared/reads";
import { equipmentInspectionHost } from "./inspection-context";
import { commissioningHref } from "../shell/navigation";
import { object, optionalId } from "../shared/validation";
import type { BackupRow } from "../engineering/commissioning/context";

// EN-08 keeps ownership of its configuration/backup evidence and staged release obligations.
export async function equipmentCommissioningBackups(
  p: Principal,
  input: unknown = {},
) {
  const q = object(input, ["asset_id"]),
    asset = optionalId(q.asset_id, "asset_id"),
    c = database();
  if (asset) await visible(c, p, "Asset", asset);
  const rows = (
    await c.query<BackupRow & { package_id: string }>(
      `SELECT b.*,k.package_id FROM ppo.commissioning_backups b JOIN ppo.commissioning_packages k ON (k.workspace_id,k.id)=(b.workspace_id,b.commissioning_id) WHERE b.workspace_id=$1 AND b.asset_id IS NOT NULL AND ($2::uuid IS NULL OR b.asset_id=$2) ORDER BY b.captured_at DESC,b.id LIMIT 201`,
      [p.workspace_id, asset],
    )
  ).rows;
  const items = [];
  for (const b of rows.slice(0, 200)) {
    const host = await equipmentInspectionHost(c, p, {
      host_type: "ProjectCommissioningScope",
      host_id: b.commissioning_id,
    });
    if (!host) continue;
    try {
      await visible(c, p, "Asset", b.asset_id!);
    } catch (e) {
      if (e instanceof AppError && [403, 404].includes(e.status)) continue;
      throw e;
    }
    items.push({
      id: b.id,
      asset_id: b.asset_id,
      asset_reference: b.asset_reference,
      configuration: b.configuration_version,
      captured_at: b.captured_at,
      reference: b.stored_reference,
      format: b.native_format,
      compatibility: b.compatibility,
      available: !!b.available_at,
      identity_checked: !!b.identity_at,
      recovery_evidence: !!b.restore_at,
      href: commissioningHref("configuration", {
        package: b.package_id,
        record: b.commissioning_id,
        panel: "backups",
      }),
    });
  }
  return { items, partial: rows.length > 200 };
}
