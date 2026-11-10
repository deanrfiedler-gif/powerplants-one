import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { basis } from "./validation";
import {
  projectWorkLinked,
  projectWorkReason,
} from "./project-work-billability";

// Call only after Finance authorises the WorkOrder. Draft defaults are advisory;
// B4 independently rechecks the current project link at each effect boundary.
export async function workAllocationDefaults(
  c: PoolClient,
  p: Principal,
  workOrderId: string,
) {
  let reason: string;
  if (await projectWorkLinked(c, p, workOrderId)) reason = projectWorkReason;
  else {
    const coverage = (
      await c.query(
        `SELECT a.status,a.agreement_reference FROM ppo.work_orders w
         JOIN ppo.scope_revisions s ON (s.workspace_id,s.id)=(w.workspace_id,w.scope_revision_id)
         JOIN ppo.coverage_assessments a ON (a.workspace_id,a.id)=(s.workspace_id,s.coverage_assessment_id)
         WHERE w.workspace_id=$1 AND w.id=$2`,
        [p.workspace_id, workOrderId],
      )
    ).rows[0];
    if (coverage?.status !== "Covered" || !coverage.agreement_reference?.trim())
      return null;
    reason = `Covered by agreement ${coverage.agreement_reference}`;
  }
  return { disposition: "NonBillable", reason, target_group: null } as const;
}

export function workAllocationReason(
  defaults: Awaited<ReturnType<typeof workAllocationDefaults>>,
  disposition: string,
  reason: string | null,
) {
  return (
    reason ??
    (defaults && disposition === "NonBillable"
      ? defaults.reason
      : basis(undefined, "line reason"))
  );
}
