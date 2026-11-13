import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { blocked } from "./context";

export const projectWorkReason = "Included in project contract";

// Call only after Finance has authorised the WorkOrder. Read no project details:
// the link alone applies, including Closed projects and historical schemas.
export async function projectWorkLinked(
  c: PoolClient,
  p: Principal,
  workOrderId: string,
) {
  const result = await c.query(
    "SELECT (to_jsonb(w)->>'project_id') IS NOT NULL AS linked FROM ppo.work_orders w WHERE w.workspace_id=$1 AND w.id=$2",
    [p.workspace_id, workOrderId],
  );
  return result.rows[0]?.linked === true;
}

// Each caller holds the shared workspace command lock, as do B1 link commands.
// Keep this out of currentRevision: dispatch and recovery retain their contract.
export async function requireProjectWorkNonBillable(
  c: PoolClient,
  p: Principal,
  handoff: {
    source_kind?: string;
    work_order_id: string;
    current_revision_id: string;
  },
) {
  if (handoff.source_kind && handoff.source_kind !== "WorkOrder") return;
  if (!(await projectWorkLinked(c, p, handoff.work_order_id))) return;
  const invalid = await c.query(
    "SELECT 1 FROM ppo.finance_lines WHERE workspace_id=$1 AND revision_id=$2 AND disposition<>'NonBillable' LIMIT 1",
    [p.workspace_id, handoff.current_revision_id],
  );
  if (invalid.rowCount)
    blocked(
      "ProjectWorkNotBillable",
      "This work order is included in a project contract. Charge additional work through an approved variation claim.",
    );
}
