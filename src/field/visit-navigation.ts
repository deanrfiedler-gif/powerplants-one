import type { Principal } from "../platform/identity";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { scheduleSummaries, type Appointment } from "../scheduling/planner";
import type { WorkOrder } from "../service/work-orders";

// Same-order navigation, explicitly NOT a return/predecessor relationship.
// Reuse the receiving reader's complete scope predicates; project no staff data.
export async function visitNavigation(
  c: QueryClient,
  p: Principal,
  a: Appointment,
  w: WorkOrder,
) {
  const ids = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.appointments WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND work_order_id=$4 AND id<>$5 ORDER BY start_at DESC,id LIMIT 20",
      [p.workspace_id, a.company_id, a.site_id, w.id, a.id],
    )
  ).rows.map((x) => x.id);
  const visits = await scheduleSummaries(c, p, ids);
  const canReadOwn = await hasPermission(
    c,
    p,
    "field.read.own",
    a.company_id,
    a.site_id,
  );
  const assigned =
    canReadOwn && visits.length
      ? (
          await c.query<{ appointment_id: string }>(
            "SELECT x.appointment_id FROM ppo.assignments x JOIN ppo.resources r ON (r.workspace_id,r.id)=(x.workspace_id,x.resource_id) JOIN ppo.appointments a ON (a.workspace_id,a.id)=(x.workspace_id,x.appointment_id) WHERE x.workspace_id=$1 AND r.user_id=$2 AND r.active AND x.active AND x.assignment_version=a.assignment_version AND a.id=ANY($3::uuid[])",
            [p.workspace_id, p.actor_id, visits.map((v) => v.id)],
          )
        ).rows.map((x) => x.appointment_id)
      : [];
  return {
    work_order_href: `/service/work-orders/${w.id}#planned-visits`,
    can_propose: await hasPermission(
      c,
      p,
      "service.work_order.edit",
      w.company_id,
      w.site_id,
    ),
    visits: visits.map((v) => ({
      id: v.id,
      reference: v.display_number,
      status: v.status,
      start_at: v.start_at,
      end_at: v.end_at,
      site_timezone: v.site_timezone,
      preparation_status: v.preparation_status,
      customer_commitment: v.customer_commitment,
      scope_review_required: v.scope_review_required,
      appointment_href: `/service/appointments/${v.id}`,
      field_href: assigned.includes(v.id) ? `/my-jobs/${v.id}` : null,
    })),
  };
}
