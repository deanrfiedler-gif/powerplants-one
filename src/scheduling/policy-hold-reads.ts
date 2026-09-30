import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { requireCapability } from "../platform/permissions";
import { visibleActivity } from "../activities/activities";
import { envelope } from "../shared/reads";
import { object } from "../shared/validation";
import { visibleAppointment } from "./planner";
import { policyStorageAvailable } from "./policy-persistence";
import { policyImpactHolds } from "./policy-holds";

export async function readPolicyHolds(
  p: Principal,
  activityId: string | null = null,
  query: unknown = {},
) {
  object(query, []);
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    if (activityId) await visibleActivity(c, p, activityId);
    else await requireCapability(c, p, "schedule.read");
    if (!(await policyStorageAvailable(c))) return envelope([]);
    const rows = (
      await c.query(
        `SELECT DISTINCT i.appointment_id FROM ppo.scheduling_policy_impacts i
      LEFT JOIN ppo.scheduling_policy_impact_activities x ON (x.workspace_id,x.impact_id)=(i.workspace_id,i.id)
      WHERE i.workspace_id=$1 AND ($2::uuid IS NULL OR x.activity_id=$2) ORDER BY i.appointment_id`,
        [p.workspace_id, activityId],
      )
    ).rows;
    // Ordinary My Work activities have no scheduling companion and need no scheduling capability.
    if (!rows.length) return envelope([]);
    if (activityId) await requireCapability(c, p, "schedule.read");
    const items = [];
    for (const row of rows) {
      try {
        const { a } = await visibleAppointment(c, p, row.appointment_id);
        items.push({
          appointment_id: a.id,
          reference: a.display_number,
          impacts: await policyImpactHolds(c, p, a.id),
        });
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    }
    return envelope(items);
  });
}
