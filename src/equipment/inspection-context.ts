import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError } from "../platform/errors";
import { commissioningAccess } from "../engineering/commissioning/context";
import { commissioningHref } from "../shell/navigation";
import { resolveHost } from "../inspections/service";
import type { Host } from "../inspections/model";

// Reuse the owning consumer's authority, including internal/receiver and live assignment limits.
export async function equipmentInspectionHost(
  c: QueryClient,
  p: Principal,
  host: Host,
) {
  try {
    if (host.host_type === "ServiceAppointment") {
      await resolveHost(c, p, host);
      return {
        href: `/my-jobs/${host.host_id}`,
        label: "Assigned Service inspection",
      };
    }
    const row = (
      await c.query<{ package_id: string }>(
        "SELECT package_id FROM ppo.commissioning_packages WHERE workspace_id=$1 AND id=$2 AND archived_at IS NULL",
        [p.workspace_id, host.host_id],
      )
    ).rows[0];
    if (!row) return null;
    const access = await commissioningAccess(c, p, row.package_id);
    if (!access.internal) return null;
    return {
      href: commissioningHref("results", {
        package: row.package_id,
        record: host.host_id,
        panel: "attempts",
      }),
      label: "Commissioning inspection",
    };
  } catch (e) {
    if (e instanceof AppError && [403, 404].includes(e.status)) return null;
    throw e;
  }
}
