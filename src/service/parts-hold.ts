import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { partsCriterion } from "./parts-readiness";

const satisfied = (outcome: string) =>
  ["Pass", "PermittedException", "NotApplicable"].includes(outcome);

// The appointments a change to a parts demand can affect: the visit it is linked to, the visit it
// was linked to before, and, for a demand on the work order with no visit (Q7), the work order's visits.
export async function demandAppointments(
  c: QueryClient,
  workspace_id: string,
  ...demands: ({ kind: string; data: Record<string, string | null | undefined> } | null | undefined)[]
) {
  const ids = new Set<string>();
  for (const d of demands) {
    if (!d || d.kind !== "Demand") continue;
    if (d.data.appointment_id) ids.add(d.data.appointment_id);
    else if (d.data.origin_kind === "WorkOrder" && d.data.origin_id)
      for (const row of (
        await c.query(
          "SELECT id FROM ppo.appointments WHERE workspace_id=$1 AND work_order_id::text=$2 AND status='Confirmed' AND actual_start_at IS NULL",
          [workspace_id, d.data.origin_id],
        )
      ).rows)
        ids.add(row.id);
  }
  return [...ids];
}

// R2 (SCM-08). A supply change after dispatch was cleared raises the hold again and gives the work
// order's service owner an owned Activity. The booking never moves. A system consequence of the
// supply command, like the pack follow-up triggers, so the supply actor needs no schedule authority.
export async function reholdForParts(
  c: QueryClient,
  p: Principal,
  appointmentIds: string[],
  cause: string,
) {
  const tasks: string[] = [];
  for (const id of appointmentIds) {
    const a = (
      await c.query(
        "SELECT a.*,w.service_owner_id FROM ppo.appointments a JOIN ppo.work_orders w ON (w.workspace_id,w.id)=(a.workspace_id,a.work_order_id) WHERE a.workspace_id=$1 AND a.id::text=$2 FOR UPDATE OF a",
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!a || a.dispatch_hold || a.status !== "Confirmed" || a.actual_start_at)
      continue;
    const parts = await partsCriterion(c, p.workspace_id, a);
    if (!parts || satisfied(parts.outcome)) continue;
    await c.query(
      "UPDATE ppo.appointments SET version=version+1,updated_by=$3,updated_at=clock_timestamp(),dispatch_hold=true WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, a.id, p.actor_id],
    );
    const task = randomUUID();
    await c.query(
      `INSERT INTO ppo.activities(id,workspace_id,company_id,site_id,created_by,updated_by,kind,owner_id,summary,due_at,due_needed,access_class)
      VALUES($1,$2,$3,$4,$5,$5,'CustomerContact',$6,$7,least(((($8::timestamptz) AT TIME ZONE $9)::date+time '09:00') AT TIME ZONE $9,$8::timestamptz-interval '2 hours'),false,'RestrictedService')`,
      [
        task,
        p.workspace_id,
        a.company_id,
        a.site_id,
        p.actor_id,
        a.service_owner_id,
        `${a.display_number}: parts readiness changed after dispatch was cleared (${cause}). ${parts.summary}. Dispatch is held again; the booking is unchanged and no message has been sent.`.slice(
          0,
          2000,
        ),
        a.start_at,
        a.site_timezone,
      ],
    );
    await c.query(
      "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,'Site',$4)",
      [p.workspace_id, a.company_id, task, a.site_id],
    );
    tasks.push(task);
  }
  return tasks;
}
