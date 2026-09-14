import type { Principal } from "../platform/identity";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { unavailable } from "../platform/errors";
import { visibleActivity } from "../activities/activities";
import {
  visibleOpportunity,
  relationshipContext,
  eligibleOpportunityOwner,
  opportunityAuthority,
} from "./context";
import type { OperationReceipt } from "../platform/operations";
import type { PoolClient } from "pg";

const originalKinds: Record<string, string> = {
  CreateOpportunity: "OpportunityCreated",
  RecordQualificationAndProgress: "OpportunityQualified",
  PlanOpportunityAction: "OpportunityActionPlanned",
  EditOpportunityInformation: "OpportunityInformationEdited",
  EditOpportunityScope: "OpportunityScopeEdited",
  ChangeOpportunityStage: "OpportunityStageChanged",
  RecordOpportunityOutcome: "OpportunityOutcomeRecorded",
  TransferOpportunityOwner: "OpportunityOwnerTransferred",
};
// H-03: an internal candidate lookup is not permission to disclose a receipt.
// The exact actor/command/event/audit proof precedes this narrow owner exception.
export async function acceptedOpportunityOriginal(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
  command: string,
) {
  const kind = originalKinds[command];
  if (!kind) return null;
  const original = (
    await c.query<{ result: OperationReceipt }>(
      `SELECT r.result FROM ppo.operation_receipts r
    JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
    JOIN ppo.opportunity_events e ON (e.workspace_id,e.created_by,e.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
    WHERE r.workspace_id=$1 AND r.actor_id=$2 AND r.operation_id=$3 AND r.record_id=$4
      AND a.object_type='Opportunity' AND a.object_id=$4 AND a.outcome='Accepted' AND a.details->>'command'=$5
      AND e.opportunity_id=$4 AND e.event_type=$6 AND a.reason=e.reason AND r.result->>'record_id'=e.opportunity_id::text AND r.result->>'operation_id'=e.operation_id::text AND (r.result->>'record_version')::integer=e.opportunity_version
      AND (a.details->>'record_version')::integer=e.opportunity_version`,
      [p.workspace_id, p.actor_id, operation, id, command, kind],
    )
  ).rows[0];
  if (!original) return null;
  if (
    (await c.query("SELECT to_regclass('ppo.opportunity_origins') AS relation"))
      .rows[0].relation
  )
    await c.query("SELECT ppo.lock_crm_transfer_authority($1)", [
      p.workspace_id,
    ]);
  const o = await visibleOpportunity(c, p, id);
  await relationshipContext(
    c,
    p,
    o,
    command === "CreateOpportunity"
      ? "crm.opportunity.create"
      : "crm.opportunity.edit",
  );
  // Check the recovering actor, never the later recipient's current eligibility.
  if (command !== "CreateOpportunity")
    await eligibleOpportunityOwner(c, p, o, p.actor_id);
  if (
    command === "TransferOpportunityOwner" &&
    !(await hasPermission(
      c,
      p,
      "crm.opportunity.transfer.own",
      o.company_id,
      o.site_id ?? undefined,
    ))
  )
    throw unavailable();
  await opportunityReceiptActions(c, p, id, operation);
  return { opportunity: o, receipt: original.result };
}
export async function opportunityCommandAuthority(
  c: PoolClient,
  p: Principal,
  id: string,
  operation: string,
  command: string,
) {
  const accepted = await acceptedOpportunityOriginal(
    c,
    p,
    id,
    operation,
    command,
  );
  if (accepted) return accepted.opportunity;
  const o = await opportunityAuthority(c, p, id, "crm.opportunity.edit");
  await opportunityReceiptActions(c, p, id, operation);
  return o;
}
// Receipt metadata grants no bypass around any original Activity target. Terminal
// action history remains replayable; this deliberately does not rerun state guards.
export async function opportunityReceiptActions(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const event = (
    await c.query(
      "SELECT event_type,next_activity_id,identification_activity_id FROM ppo.opportunity_events WHERE workspace_id=$1 AND opportunity_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!event) return;
  for (const actionId of new Set<string>(
    [event.next_activity_id, event.identification_activity_id].filter(Boolean),
  )) {
    const a = await visibleActivity(c, p, actionId);
    if (
      event.event_type !== "OpportunityQualified" &&
      !(await hasPermission(
        c,
        p,
        "activity.edit",
        a.company_id,
        a.site_id ?? undefined,
      ))
    )
      throw unavailable();
  }
}
