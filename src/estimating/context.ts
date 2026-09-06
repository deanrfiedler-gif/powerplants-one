import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { hasPermission, scopeSql, type QueryClient } from "../platform/permissions";
import { visibleOpportunity, relationshipContext, opportunityVisibility } from "../crm/context";
import { scopedOwner } from "../shared/authority";
import { uuid } from "../shared/validation";
import type { CostLine, QuoteChoice } from "./math";
import type { SafeQuote } from "./template";
export type Estimate = {
  id:string; workspace_id:string; company_id:string; site_id:string|null; opportunity_id:string; owner_id:string;
  display_number:string; version:number; current_version_id:string; option_id:string; estimation_revision_id:string;
  state:"Draft"; synthetic:true; created_at:Date; updated_at:Date; created_by:string; updated_by:string;
};
export type EstimateVersion = {
  id:string; workspace_id:string; company_id:string; estimate_id:string; version:number; predecessor_id:string|null;
  scope_revision_id:string; title:string; scope:{included:string;excluded:string;assumptions:string}; lines:CostLine[];
  policy:string; content_hash:string; reason:string; cost_total:string|null; sell_total:string|null; created_at:Date; created_by:string;
};
export type QuoteRevision = {
  id:string; workspace_id:string; company_id:string; quote_id:string; estimate_id:string; estimate_version_id:string;
  version:number; choices:QuoteChoice[]; safe_snapshot:SafeQuote; template_version:string; template_hash:string;
  input_html:string; input_hash:string; reason:string; state:"Draft"; updated_at:Date; created_at:Date;
};
export type EstimateCap = "estimating.read"|"estimating.edit"|"estimating.quote.read"|"estimating.quote.prepare";
export function estimateVisibility(alias="e",cap:EstimateCap="estimating.read") {
  return `${scopeSql(`${alias}.company_id`,`${alias}.site_id`,cap)} AND EXISTS(SELECT 1 FROM ppo.opportunities o WHERE (o.workspace_id,o.id) = (${alias}.workspace_id,${alias}.opportunity_id) AND ${opportunityVisibility()})`;
}
export async function estimateContext(c:QueryClient,p:Principal,id:string,cap:EstimateCap="estimating.read") {
  const e=(await c.query<Estimate>(`SELECT e.* FROM ppo.estimates e WHERE e.workspace_id=$1 AND e.id=$3 AND ${estimateVisibility("e",cap)}`,[p.workspace_id,p.actor_id,uuid(id,"id")])).rows[0];
  if(!e) throw unavailable();
  const o=await visibleOpportunity(c,p,e.opportunity_id);
  if(o.company_id!==e.company_id || o.site_id!==e.site_id) throw unavailable();
  // Reads recheck live customer/contact relationships, not just cached scope grants.
  await relationshipContext(c,p,o,cap);
  if(cap==="estimating.edit" || cap==="estimating.quote.prepare") {
    if(e.owner_id!==p.actor_id) throw new AppError(403,"EstimateOwnerRequired","Only the current estimate owner can save or prepare this estimate.");
    if(!(await hasPermission(c,p,"estimating.read",e.company_id,e.site_id??undefined))) throw unavailable();
    const owner=await scopedOwner(c,p,e.owner_id,e.company_id,e.site_id??undefined,"estimating.edit");
    await relationshipContext(c,owner,o,"estimating.edit");
  }
  return e;
}
export async function versionContext(c:QueryClient,p:Principal,e:Estimate,id:string) {
  const v=(await c.query<EstimateVersion>("SELECT * FROM ppo.estimate_versions WHERE workspace_id=$1 AND estimate_id=$2 AND id=$3",[p.workspace_id,e.id,uuid(id,"version_id")])).rows[0];
  if(!v) throw unavailable(); return v;
}
export async function quoteContext(c:QueryClient,p:Principal,id:string,cap:EstimateCap="estimating.quote.read") {
  const q=(await c.query<QuoteRevision>("SELECT * FROM ppo.draft_quote_revisions WHERE workspace_id=$1 AND id=$2",[p.workspace_id,uuid(id,"revision_id")])).rows[0];
  if(!q) throw unavailable();
  const e=await estimateContext(c,p,q.estimate_id,cap);
  return {q,e};
}
