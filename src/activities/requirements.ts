import type { QueryClient } from "../platform/permissions";
import type { Principal } from "../platform/identity";

// Keep native source-bound next actions on their guarded editing route, including
// tasks which predate their first R2 save. Owner execution remains native My Work.
export async function isFindingActivity(
  c: QueryClient,
  p: Principal,
  id: string,
): Promise<boolean> {
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.service_finding_activity_bindings') AS relation",
      )
    ).rows[0].relation
  )
    return false;
  return (
    await c.query<{ governed: boolean }>(
      `SELECT (
    EXISTS(SELECT 1 FROM ppo.service_finding_activity_bindings WHERE workspace_id=$1 AND activity_id=$2) OR
    EXISTS(SELECT 1 FROM ppo.inspection_defects WHERE workspace_id=$1 AND activity_id=$2 AND host_type='ServiceAppointment') OR
    EXISTS(SELECT 1 FROM ppo.incident_actions WHERE workspace_id=$1 AND activity_id=$2) OR
    EXISTS(SELECT 1 FROM ppo.report_revisions WHERE workspace_id=$1 AND snapshot#>>'{completion,follow_up_activity_id}'=$2::text AND snapshot#>>'{completion,scope_outcome}' IN ('Partial','UnableToProceed')) OR
    EXISTS(SELECT 1 FROM ppo.customer_responses WHERE workspace_id=$1 AND follow_up_activity_id=$2 AND response<>'Accepted') OR
    EXISTS(SELECT 1 FROM ppo.schedule_follow_ups WHERE workspace_id=$1 AND activity_id=$2)
    ) AS governed`,
      [p.workspace_id, id],
    )
  ).rows[0].governed;
}

// Activity detail also runs against historical schemas during populated upgrades.
export async function activityRequirements(
  c: QueryClient,
  p: Principal,
  id: string,
): Promise<string | null> {
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.service_finding_action_details') AS relation",
      )
    ).rows[0].relation
  )
    return null;
  return (
    (
      await c.query<{ required_evidence: string | null }>(
        "SELECT required_evidence FROM ppo.service_finding_action_details WHERE workspace_id=$1 AND activity_id=$2",
        [p.workspace_id, id],
      )
    ).rows[0]?.required_evidence ?? null
  );
}
