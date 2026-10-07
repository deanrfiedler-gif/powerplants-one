import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { reportContext } from "../reports/context";
import { visibleTicket } from "../service/tickets";
import { conflict } from "./context";

export async function reviewedResult(c: QueryClient, p: Principal, id: string) {
  const result = (
    await c.query(
      `SELECT r.*,v.report_id,q.ticket_id,q.resolution_plan_id FROM ppo.maintenance_service_results r JOIN ppo.report_revisions v ON (v.workspace_id,v.id)=(r.workspace_id,r.report_revision_id) JOIN ppo.maintenance_work_requests q ON (q.workspace_id,q.id)=(r.workspace_id,r.request_id) WHERE r.workspace_id=$1 AND r.id=$2`,
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!result) conflict("The exact Service receiving evidence is unavailable.");
  await visibleTicket(c, p, result.ticket_id);
  const ctx = await reportContext(c, p, result.report_id);
  if (
    !["Reviewed", "Issued"].includes(ctx.report.status) ||
    ctx.report.current_revision_id !== result.report_revision_id ||
    result.outcome !== "Completed"
  )
    conflict(
      "Review the current completed Service result before customer outcome decisions.",
    );
  return { ...result, work_order_id: ctx.w.id };
}
