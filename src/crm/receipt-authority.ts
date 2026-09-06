import type { Principal } from "../platform/identity";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { unavailable } from "../platform/errors";
import { visibleActivity } from "../activities/activities";
// Receipt metadata grants no bypass around any original Activity target. Terminal
// action history remains replayable; this deliberately does not rerun state guards.
export async function opportunityReceiptActions(c:QueryClient,p:Principal,id:string,operation:string) {
 const event=(await c.query("SELECT event_type,next_activity_id,identification_activity_id FROM ppo.opportunity_events WHERE workspace_id=$1 AND opportunity_id=$2 AND created_by=$3 AND operation_id=$4",[p.workspace_id,id,p.actor_id,operation])).rows[0];
 if(!event)return;
 for(const actionId of new Set<string>([event.next_activity_id,event.identification_activity_id].filter(Boolean))) {
  const a=await visibleActivity(c,p,actionId);
  if(event.event_type!=="OpportunityQualified" && !(await hasPermission(c,p,"activity.edit",a.company_id,a.site_id??undefined)))throw unavailable();
 }
}
