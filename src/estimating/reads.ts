import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import { hasPermission, requireCapability, scopeSql } from "../platform/permissions";
import { opportunityVisibility, relationshipContext, visibleOpportunity } from "../crm/context";
import { object, optionalId } from "../shared/validation";
import { estimateContext, estimateVisibility, versionContext, quoteContext } from "./context";
import { calculate } from "./math";
import { readQuoteJob } from "./worker";
export async function estimatingOptions(p:Principal) {
  const c=database(); await requireCapability(c,p,"estimating.edit");
  const rows=(await c.query(`SELECT o.id,o.display_number,o.title,o.company_id,o.site_id,r.display_name AS customer,s.display_name AS site FROM ppo.opportunities o JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id) LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(o.workspace_id,o.site_id) WHERE o.workspace_id=$1 AND ${opportunityVisibility()} AND ${scopeSql("o.company_id","o.site_id","estimating.edit")} AND ${scopeSql("o.company_id","o.site_id","estimating.read")} AND NOT EXISTS(SELECT 1 FROM ppo.estimates e WHERE e.workspace_id=o.workspace_id AND e.opportunity_id=o.id) ORDER BY o.created_at DESC,o.id LIMIT 100`,[p.workspace_id,p.actor_id])).rows;
  const items=[];
  for(const row of rows) try {await relationshipContext(c,p,await visibleOpportunity(c,p,row.id),"estimating.edit");items.push(row);} catch(e) {if(!(e instanceof AppError)||e.status!==404)throw e;}
  return {items,owner_id:p.actor_id,owner_name:p.display_name,synthetic:true,limit:100};
}
export async function listEstimates(p:Principal,query:Record<string,string>) {
  object(query,[]);const c=database(); await requireCapability(c,p,"estimating.read");
  const rows=(await c.query(`SELECT e.id,e.display_number,e.version,e.state,e.updated_at,v.title,v.cost_total,v.sell_total,r.display_name AS customer FROM ppo.estimates e JOIN ppo.estimate_versions v ON (v.workspace_id,v.id)=(e.workspace_id,e.current_version_id) JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(e.workspace_id,e.opportunity_id) JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id) WHERE e.workspace_id=$1 AND ${estimateVisibility()} ORDER BY e.updated_at DESC,e.id LIMIT 100`,[p.workspace_id,p.actor_id])).rows;
  const items=[];
  for(const row of rows) try {await estimateContext(c,p,row.id);items.push(row);} catch(e) {if(!(e instanceof AppError)||e.status!==404)throw e;}
  return {items,synthetic:true,limit:100,can_create:await hasPermission(c,p,"estimating.edit")};
}
export async function readEstimate(p:Principal,id:string,query:Record<string,string>={}) {
  const input=object(query,["version_id"]),c=database(),e=await estimateContext(c,p,id),v=await versionContext(c,p,e,optionalId(input.version_id,"version_id")??e.current_version_id),o=await visibleOpportunity(c,p,e.opportunity_id);
  const context=(await c.query("SELECT r.display_name AS customer,s.display_name AS site,u.display_name AS owner FROM ppo.organisations r JOIN ppo.users u ON u.workspace_id=r.workspace_id AND u.id=$3 LEFT JOIN ppo.sites s ON s.workspace_id=r.workspace_id AND s.id=$4 WHERE r.workspace_id=$1 AND r.id=$2",[p.workspace_id,o.organisation_id,e.owner_id,e.site_id])).rows[0];
  let can_edit=false,can_prepare=false;
  try {await estimateContext(c,p,id,"estimating.edit");can_edit=true;} catch(error) {if(!(error instanceof AppError)||![403,404].includes(error.status))throw error;}
  try {await estimateContext(c,p,id,"estimating.quote.prepare");can_prepare=await hasPermission(c,p,"estimating.quote.read",e.company_id,e.site_id??undefined);} catch(error) {if(!(error instanceof AppError)||![403,404].includes(error.status))throw error;}
  const versions=(await c.query("SELECT id,version,predecessor_id,scope_revision_id,reason,created_at,created_by,content_hash FROM ppo.estimate_versions WHERE workspace_id=$1 AND estimate_id=$2 ORDER BY version DESC",[p.workspace_id,id])).rows;
  const quotes=(await hasPermission(c,p,"estimating.quote.read",e.company_id,e.site_id??undefined))?(await c.query("SELECT q.id,q.version,q.estimate_version_id,q.created_at,j.state AS render_state,h.display_number FROM ppo.draft_quote_revisions q JOIN ppo.draft_quotes h ON (h.workspace_id,h.id)=(q.workspace_id,q.quote_id) JOIN ppo.estimate_quote_jobs j ON j.revision_id=q.id WHERE q.workspace_id=$1 AND q.estimate_id=$2 ORDER BY q.version DESC",[p.workspace_id,id])).rows:[];
  return {...e,context,opportunity:{id:o.id,display_number:o.display_number,title:o.title},saved:v,current_saved:await versionContext(c,p,e,e.current_version_id),totals:calculate(v.lines),versions,quotes,can_edit,can_prepare};
}
export async function readQuote(p:Principal,id:string) {
  const c=database(),{q,e}=await quoteContext(c,p,id),{j}=await readQuoteJob(p,id);
  let can_prepare=false;
  try {await quoteContext(c,p,id,"estimating.quote.prepare");can_prepare=true;} catch(error) {if(!(error instanceof AppError)||![403,404].includes(error.status))throw error;}
  const internal=await hasPermission(c,p,"estimating.read",e.company_id,e.site_id??undefined);
  return {id:q.id,quote_id:q.quote_id,snapshot:q.safe_snapshot,created_at:q.created_at,can_prepare,
    ...(internal?{estimate_id:e.id,estimate_version_id:q.estimate_version_id}:{}),
    job:{state:j.state,attempts:j.attempts,error_code:j.error_code,output_available:j.state==="Ready",hashes:j.manifest?{html:j.manifest.html_hash,pdf:j.manifest.pdf_hash}:null},
    attempt_history:(await c.query("SELECT attempt,outcome,code,happened_at FROM ppo.estimate_quote_attempts WHERE job_id=$1 ORDER BY id",[j.id])).rows};
}
