import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { hasPermission, scopeSql, type Capability, type QueryClient } from "../platform/permissions";
import { companyContext, scopedOwner } from "../shared/authority";
import { visibility, visible } from "../shared/reads";
import { uuid } from "../shared/validation";

export const PIPELINE_ID = "c1000000-0000-4000-8000-000000000001";
export type OpportunityContext = {
  company_id: string; organisation_id: string; site_id: string | null;
  primary_person_id: string | null; owner_id: string; pipeline_definition_id: string;
};
export type Opportunity = OpportunityContext & {
  id: string; display_number: string; version: number; synthetic: true;
  created_at: Date; created_by: string; updated_at: Date; updated_by: string;
  title: string; need_summary: string; source_channel: string; source_basis: string;
  site_unknown_reason: string | null; contact_unknown_reason: string | null;
  stage_id: "Enquiry" | "Qualified"; close_outcome: "Open"; stage_entered_at: Date;
  next_activity_id: string; qualification_note: string | null; identification_activity_id: string | null;
};
// Upgrade tests intentionally exercise accepted pre-CRM schemas. Missing CRM never grants access.
export async function crmAvailable(c: QueryClient) {
  return !!(await c.query("SELECT to_regclass('ppo.opportunities') AS relation")).rows[0].relation;
}
export function opportunityVisibility(alias = "o") {
  return `${scopeSql(`${alias}.company_id`, `${alias}.site_id`, "crm.opportunity.read")}
    AND ${scopeSql(`${alias}.company_id`, `${alias}.site_id`)}
    AND ${scopeSql(`${alias}.company_id`, `${alias}.site_id`, "shared.internal.read")}
    AND EXISTS(SELECT 1 FROM ppo.organisations co WHERE co.workspace_id=${alias}.workspace_id AND co.id=${alias}.organisation_id AND ${visibility("Organisation", "co")})
    AND (${alias}.site_id IS NULL OR EXISTS(SELECT 1 FROM ppo.sites cs WHERE cs.workspace_id=${alias}.workspace_id AND cs.id=${alias}.site_id AND ${visibility("Site", "cs")}))
    AND (${alias}.primary_person_id IS NULL OR EXISTS(SELECT 1 FROM ppo.people cp WHERE cp.workspace_id=${alias}.workspace_id AND cp.id=${alias}.primary_person_id AND ${visibility("Person", "cp")}))`;
}
export async function visibleOpportunity(c: QueryClient, p: Principal, id: string) {
  const row = (await c.query<Opportunity>(`SELECT o.* FROM ppo.opportunities o WHERE o.workspace_id=$1 AND o.id=$3 AND ${opportunityVisibility()}`, [p.workspace_id, p.actor_id, uuid(id, "id")])).rows[0];
  if (!row) throw unavailable();
  return row;
}
export async function relationshipContext(c: QueryClient, p: Principal, input: OpportunityContext, cap: Capability) {
  await companyContext(c,p,input.company_id,input.site_id,cap);
  if (!(await hasPermission(c,p,"crm.opportunity.read",input.company_id,input.site_id ?? undefined)) || !(await hasPermission(c,p,"shared.internal.read",input.company_id,input.site_id ?? undefined))) throw unavailable();
  const org = await visible(c,p,"Organisation",input.organisation_id);
  if (org.company_id !== input.company_id) throw unavailable();
  if (input.site_id && !(await c.query("SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND organisation_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",[p.workspace_id,input.company_id,input.site_id,input.organisation_id])).rowCount) throw unavailable();
  if (input.primary_person_id) {
    const person = await visible(c,p,"Person",input.primary_person_id);
    if (!person.active || !(await c.query("SELECT 1 FROM ppo.relationships WHERE workspace_id=$1 AND company_id=$2 AND organisation_id=$3 AND person_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",[p.workspace_id,input.company_id,input.organisation_id,input.primary_person_id])).rowCount) throw unavailable();
  }
  if (!(await c.query("SELECT 1 FROM ppo.crm_pipeline_definitions d WHERE d.workspace_id=$1 AND d.id=$2 AND d.definition_key='SyntheticEnquiryI1' AND d.version=1 AND (SELECT count(*) FROM ppo.crm_stage_definitions s WHERE s.workspace_id=d.workspace_id AND s.pipeline_definition_id=d.id)=2",[p.workspace_id,input.pipeline_definition_id])).rowCount) throw unavailable();
}
export async function eligibleOpportunityOwner(c: QueryClient,p: Principal,input: OpportunityContext,ownerId=input.owner_id) {
  const owner=await scopedOwner(c,p,ownerId,input.company_id,input.site_id ?? undefined,"crm.opportunity.edit");
  await relationshipContext(c,owner,input,"crm.opportunity.edit");
  for (const cap of ["activity.read","activity.edit"] as const)
    if (!(await hasPermission(c,owner,cap,input.company_id,input.site_id ?? undefined))) throw unavailable();
  return owner;
}
export async function opportunityAuthority(c: QueryClient,p: Principal,id: string,cap: "crm.opportunity.create" | "crm.opportunity.edit",owned=true) {
  const o=await visibleOpportunity(c,p,id);
  // Shared operation already locks workspace; explicit row lock documents aggregate ownership.
  await c.query("SELECT id FROM ppo.opportunities WHERE workspace_id=$1 AND id=$2 FOR UPDATE",[p.workspace_id,id]);
  await relationshipContext(c,p,o,cap);
  await eligibleOpportunityOwner(c,p,o);
  if (owned && o.owner_id!==p.actor_id) throw new AppError(403,"CRM_OWNER_REQUIRED","Only the current opportunity owner can record qualification or plan its next action.");
  return o;
}
