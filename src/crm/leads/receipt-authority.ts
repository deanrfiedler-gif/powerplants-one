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
import { leadAuthority } from "./context";
export async function leadReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  command: string,
) {
  const cap =
    command === "CreateLead"
      ? "crm.lead.create"
      : command === "ConvertLeadToOpportunity"
        ? "crm.lead.convert"
        : "crm.lead.edit";
  const lead = await leadAuthority(c, p, id, cap, command !== "CreateLead");
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
