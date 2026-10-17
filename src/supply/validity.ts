import type { QueryClient } from "../platform/permissions";
import { decimal, type SupplyRecord } from "./model";

// Whether a supply source can back its usable allocations: complete, no incomplete receipt, and
// evidenced usable at least what is allocated against it. Shared by the coordinator's material basis
// and the service's parts projection, which reads it without supply permissions.
export async function sourceValidity(
  c: QueryClient,
  workspace_id: string,
  s: Pick<SupplyRecord, "id" | "completeness">,
) {
  const incompleteReceipt = (
    await c.query(
      "SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=$1 AND record_id=$2 AND kind='Receipt' AND completeness<>'Complete'",
      [workspace_id, s.id],
    )
  ).rowCount;
  const available = (
    await c.query(
      "SELECT ppo.supply_usable($1,$2)::text AS usable,(SELECT COALESCE(sum(quantity),0)::text FROM ppo.supply_allocations WHERE workspace_id=$1 AND supply_id=$2 AND basis='Usable') AS allocated",
      [workspace_id, s.id],
    )
  ).rows[0];
  return {
    usable: available.usable as string | null,
    valid:
      available.usable !== null &&
      decimal(available.usable) >= decimal(available.allocated) &&
      s.completeness === "Complete" &&
      !incompleteReceipt,
  };
}
