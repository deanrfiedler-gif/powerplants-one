import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import {
  activityLinks,
  authoriseActivityInput,
  visibleActivity,
} from "../../activities/activities";
import {
  eligibleOpportunityOwner,
  relationshipContext,
  visibleOpportunity,
} from "../context";
import { leadAuthority, leadContext, visibleLead } from "./context";
import {
  currentResolution,
  visibleCustomerContext,
} from "./resolution-context";
export async function leadReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  command: string,
  operation?: string,
) {
  const cap =
    command === "CreateLead"
      ? "crm.lead.create"
      : command === "ConvertLeadToOpportunity"
        ? "crm.lead.convert"
        : "crm.lead.edit";
  const original =
    operation &&
    (
      await c.query(
        `SELECT 1 FROM ppo.operation_receipts r
     JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
     JOIN ppo.lead_events e ON (e.workspace_id,e.created_by,e.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
     WHERE r.workspace_id=$1 AND r.actor_id=$2 AND r.operation_id=$3 AND r.record_id=$4
       AND a.object_type='Lead' AND a.object_id=$4 AND a.outcome='Accepted' AND a.details->>'command'=$5
       AND e.lead_id=$4 AND e.event_type=$5 AND a.reason=e.reason
       AND r.result->>'record_id'=e.lead_id::text AND r.result->>'operation_id'=e.operation_id::text
       AND (r.result->>'record_version')::integer=e.lead_version AND (a.details->>'record_version')::integer=e.lead_version`,
        [p.workspace_id, p.actor_id, operation, id, command],
      )
    ).rowCount;
  const resolution = await currentResolution(c, p, id);
  if (
    original &&
    (
      await c.query(
        "SELECT to_regprocedure('ppo.lock_crm_transfer_authority(uuid)') AS available",
      )
    ).rows[0].available
  )
    await c.query("SELECT ppo.lock_crm_transfer_authority($1)", [
      p.workspace_id,
    ]);
  const lead = original
    ? await visibleLead(c, p, id)
    : await leadAuthority(c, p, id, cap, command !== "CreateLead");
  if (original)
    await leadContext(
      c,
      p,
      {
        ...lead,
        owner_id: command === "CreateLead" ? lead.owner_id : p.actor_id,
      },
      cap,
    );
  if (resolution) {
    await visibleCustomerContext(c, p, resolution);
    await leadContext(
      c,
      p,
      {
        ...resolution,
        owner_id:
          original && command !== "CreateLead" ? p.actor_id : lead.owner_id,
      },
      cap,
    );
  }
  const conversion = (
    await c.query(
      "SELECT opportunity_id FROM ppo.lead_conversions WHERE workspace_id=$1 AND lead_id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (conversion) {
    const o = await visibleOpportunity(c, p, conversion.opportunity_id);
    if (command === "ConvertLeadToOpportunity") {
      await relationshipContext(c, p, o, "crm.opportunity.create");
      await eligibleOpportunityOwner(c, p, o);
      const targets = (
        await c.query(
          "SELECT activity_id FROM ppo.activity_links WHERE workspace_id=$1 AND opportunity_id=$2",
          [p.workspace_id, o.id],
        )
      ).rows;
      for (const { activity_id } of targets) {
        const a = await visibleActivity(c, p, activity_id);
        await authoriseActivityInput(c, p, {
          ...a,
          links: await activityLinks(c, p, activity_id),
        });
      }
    }
  }
  // Current permissions precede original receipt lookup. Hidden links deny; they never disappear from a replay check.
  const links = (
    await c.query(
      "SELECT activity_id FROM ppo.activity_links WHERE workspace_id=$1 AND lead_id=$2",
      [p.workspace_id, id],
    )
  ).rows;
  for (const { activity_id } of links) {
    const a = await visibleActivity(c, p, activity_id);
    if (command === "ConvertLeadToOpportunity" || command === "PlanLeadAction")
      await authoriseActivityInput(c, p, {
        ...a,
        links: await activityLinks(c, p, activity_id),
      });
  }
  return lead;
}
