import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { hasPermission, scopeSql, type QueryClient } from "../platform/permissions";
import { visibleOpportunity, relationshipContext, opportunityVisibility } from "../crm/context";
import { scopedOwner } from "../shared/authority";
import { uuid } from "../shared/validation";
import type { CostLine, QuoteChoice } from "./math";
import type { SafeQuote } from "./template";
import { sourceBindings, type SourceBinding } from "./sources/bindings";
import { costBasisContext, estimateSite, type CostBasis } from "./cost-basis-context";
export type Estimate = {
  id:string; workspace_id:string; company_id:string; site_id:string|null; opportunity_id:string; owner_id:string;
  display_number:string; version:number; current_version_id:string; option_id:string; estimation_revision_id:string;
  state:"Draft"; synthetic:true; created_at:Date; updated_at:Date; created_by:string; updated_by:string;
  discovery_basis?: CostBasis;
};
export type EstimateVersion = {
  id:string; workspace_id:string; company_id:string; estimate_id:string; version:number; predecessor_id:string|null;
  scope_revision_id:string; title:string; scope:{included:string;excluded:string;assumptions:string}; lines:CostLine[];
  policy:string; content_hash:string; reason:string; cost_total:string|null; sell_total:string|null; created_at:Date; created_by:string;
  cost_schema_version?: 1 | 2;
  source_bindings?: SourceBinding[];
  discovery_basis?: CostBasis;
};
export type QuoteRevision = {
  id:string; workspace_id:string; company_id:string; quote_id:string; estimate_id:string; estimate_version_id:string;
  version:number; choices:QuoteChoice[]; safe_snapshot:SafeQuote; template_version:string; template_hash:string; template_definition:string;
  input_html:string; input_hash:string; reason:string; state:"Draft"; updated_at:Date; created_at:Date;
};
export type EstimateCap = "estimating.read"|"estimating.edit"|"estimating.quote.read"|"estimating.quote.prepare";
export function estimateVisibility(alias="e",cap:EstimateCap="estimating.read", bound=false) {
  const site=bound?`CASE WHEN EXISTS(SELECT 1 FROM ppo.estimate_discovery_roots dr WHERE dr.workspace_id=${alias}.workspace_id AND dr.estimate_id=${alias}.id) THEN (SELECT r.site_id FROM ppo.estimate_discovery_bases b JOIN ppo.estimation_revisions r ON (r.workspace_id,r.id)=(b.workspace_id,b.revision_id) WHERE b.workspace_id=${alias}.workspace_id AND b.estimate_version_id=${alias}.current_version_id) ELSE ${alias}.site_id END`:`${alias}.site_id`;
  return `${scopeSql(`${alias}.company_id`,site,cap)} AND EXISTS(SELECT 1 FROM ppo.opportunities o WHERE (o.workspace_id,o.id) = (${alias}.workspace_id,${alias}.opportunity_id) AND ${opportunityVisibility()})`;
}
export async function estimateContext(c:QueryClient,p:Principal,id:string,cap:EstimateCap="estimating.read",versionId?:string) {
  const e=(await c.query<Estimate>("SELECT * FROM ppo.estimates WHERE workspace_id=$1 AND id=$2",[p.workspace_id,uuid(id,"id")])).rows[0];
  if(!e) throw unavailable();
  const basis=await costBasisContext(c,p,e,versionId??e.current_version_id,cap);
  if(basis)e.discovery_basis=basis;
  const site=estimateSite(e);
  if(!(await hasPermission(c,p,cap,e.company_id,site??undefined))) throw unavailable();
  const o=await visibleOpportunity(c,p,e.opportunity_id);
  if(o.company_id!==e.company_id || (!basis && o.site_id!==e.site_id)) throw unavailable();
  // Reads recheck live customer/contact relationships, not just cached scope grants.
  await relationshipContext(c,p,o,cap);
  if(cap==="estimating.edit" || cap==="estimating.quote.prepare") {
    if(e.owner_id!==p.actor_id) throw new AppError(403,"EstimateOwnerRequired","Only the current estimate owner can save or prepare this estimate.");
    if(!(await hasPermission(c,p,"estimating.read",e.company_id,site??undefined))) throw unavailable();
    if(basis) await costBasisContext(c,p,e,versionId??e.current_version_id,"estimating.read");
    const owner=await scopedOwner(c,p,e.owner_id,e.company_id,site??undefined,"estimating.edit");
    await relationshipContext(c,owner,o,"estimating.edit");
    if(basis) await relationshipContext(c,owner,{...o,site_id:site},"estimating.edit");
  }
  if(cap!=="estimating.quote.read") await sourceBindings(c,p,versionId??e.current_version_id);
  return e;
}
export async function versionContext(c:QueryClient,p:Principal,e:Estimate,id:string,cap:EstimateCap="estimating.read") {
  const v=(await c.query<EstimateVersion>("SELECT * FROM ppo.estimate_versions WHERE workspace_id=$1 AND estimate_id=$2 AND id=$3",[p.workspace_id,e.id,uuid(id,"version_id")])).rows[0];
  if(!v) throw unavailable();
  const basis=await costBasisContext(c,p,e,v.id,cap);
  if(basis)v.discovery_basis=basis;
  // Keep every original schema-1 DTO field and value, including its absence of this new discriminator.
  if(v.cost_schema_version === 1) delete v.cost_schema_version;
  if(cap!=="estimating.quote.read") {
    const bindings=await sourceBindings(c,p,v.id);
    if(bindings.length)v.source_bindings=bindings;
  }
  return v;
}
export async function quoteContext(c:QueryClient,p:Principal,id:string,cap:EstimateCap="estimating.quote.read") {
  const q=(await c.query<QuoteRevision>("SELECT * FROM ppo.draft_quote_revisions WHERE workspace_id=$1 AND id=$2",[p.workspace_id,uuid(id,"revision_id")])).rows[0];
  if(!q) throw unavailable();
  const e=await estimateContext(c,p,q.estimate_id,cap,q.estimate_version_id);
  return {q,e};
}
// Both GET recovery and command replay must authorise the accepted version,
// before a later selected scope can conceal revoked historical access.
export async function acceptedEstimateContext(c:QueryClient,p:Principal,id:string,operationId:string) {
  const a=(await c.query<{details:{saved_version_id?:string}}>(`SELECT a.details FROM ppo.audit_events a
    JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
    WHERE a.workspace_id=$1 AND a.actor_id=$2 AND a.operation_id=$3 AND a.object_type='Estimate' AND a.object_id=$4`,
    [p.workspace_id,p.actor_id,operationId,id])).rows[0];
  if(!a)return null;
  if(!a.details.saved_version_id)throw unavailable();
  return estimateContext(c,p,id,"estimating.edit",a.details.saved_version_id);
}
