import { readLineage } from "./specialist/lineage";
import { configuration as specialistConfiguration, run as specialistRun } from "./specialist/context";
import type { Principal } from "../platform/identity";
import { database, transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import { hasPermission, requireCapability, scopeSql } from "../platform/permissions";
import { opportunityVisibility, relationshipContext, visibleOpportunity } from "../crm/context";
import { object, optionalId } from "../shared/validation";
import { estimateContext, estimateVisibility, versionContext, quoteContext } from "./context";
import { calculate } from "./math";
import { readQuoteJob } from "./worker";
import { discoveryAvailable, guardExistingEstimateMutation } from "./discovery-workspace-context";
import { costBasisAvailable, costBasisContext, estimateSite, latestCostingScope } from "./cost-basis-context";
export async function estimatingOptions(p:Principal) {
  const c=database(); await requireCapability(c,p,"estimating.edit");
  const discoveryExclusion=await discoveryAvailable(c)?"AND NOT EXISTS(SELECT 1 FROM ppo.estimating_workspaces g WHERE g.workspace_id=o.workspace_id AND g.opportunity_id=o.id)":"";
  const rows=(await c.query(`SELECT o.id,o.display_number,o.title,o.company_id,o.site_id,r.display_name AS customer,s.display_name AS site FROM ppo.opportunities o JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id) LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(o.workspace_id,o.site_id) WHERE o.workspace_id=$1 AND ${opportunityVisibility()} AND ${scopeSql("o.company_id","o.site_id","estimating.edit")} AND ${scopeSql("o.company_id","o.site_id","estimating.read")} AND NOT EXISTS(SELECT 1 FROM ppo.estimates e WHERE e.workspace_id=o.workspace_id AND e.opportunity_id=o.id) ${discoveryExclusion} ORDER BY o.created_at DESC,o.id LIMIT 100`,[p.workspace_id,p.actor_id])).rows;
  const items=[];
  for(const row of rows) try {await relationshipContext(c,p,await visibleOpportunity(c,p,row.id),"estimating.edit");items.push(row);} catch(e) {if(!(e instanceof AppError)||e.status!==404)throw e;}
  return {items,owner_id:p.actor_id,owner_name:p.display_name,synthetic:true,limit:100};
}
export async function listEstimates(p:Principal,query:Record<string,string>) {
  object(query,[]);const c=database(); await requireCapability(c,p,"estimating.read");
  const rows=(await c.query(`SELECT e.id,e.display_number,e.version,e.state,e.updated_at,v.title,v.cost_total,v.sell_total,r.display_name AS customer FROM ppo.estimates e JOIN ppo.estimate_versions v ON (v.workspace_id,v.id)=(e.workspace_id,e.current_version_id) JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(e.workspace_id,e.opportunity_id) JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id) WHERE e.workspace_id=$1 AND ${estimateVisibility("e","estimating.read",await costBasisAvailable(c))} ORDER BY e.updated_at DESC,e.id LIMIT 100`,[p.workspace_id,p.actor_id])).rows;
  const items=[];
  for(const row of rows) try {await estimateContext(c,p,row.id);items.push(row);} catch(e) {if(!(e instanceof AppError)||e.status!==404)throw e;}
  return {items,synthetic:true,limit:100,can_create:await hasPermission(c,p,"estimating.edit")};
}
export async function readEstimate(p:Principal,id:string,query:Record<string,string>={}) {
  const input=object(query,["version_id"]),c=database(),e=await estimateContext(c,p,id),v=await versionContext(c,p,e,optionalId(input.version_id,"version_id")??e.current_version_id),o=await visibleOpportunity(c,p,e.opportunity_id);
  const site=v.discovery_basis?v.discovery_basis.site_id:e.site_id;
  const context=(await c.query("SELECT r.display_name AS customer,s.display_name AS site,u.display_name AS owner FROM ppo.organisations r JOIN ppo.users u ON u.workspace_id=r.workspace_id AND u.id=$3 LEFT JOIN ppo.sites s ON s.workspace_id=r.workspace_id AND s.id=$4 WHERE r.workspace_id=$1 AND r.id=$2",[p.workspace_id,o.organisation_id,e.owner_id,site])).rows[0];
  if(v.discovery_basis)context.site=v.discovery_basis.site_name;
  let can_edit=false,can_prepare=false;
  try {await estimateContext(c,p,id,"estimating.edit");can_edit=true;} catch(error) {if(!(error instanceof AppError)||![403,404].includes(error.status))throw error;}
  try {await estimateContext(c,p,id,"estimating.quote.prepare",v.id);await estimateContext(c,p,id,"estimating.quote.read",v.id);can_prepare=true;} catch(error) {if(!(error instanceof AppError)||![403,404].includes(error.status))throw error;}
  if(can_edit || can_prepare) {
    try { await transaction(c=>guardExistingEstimateMutation(c,p,e)); }
    catch(error) { if(!(error instanceof AppError)||![403,404,409].includes(error.status))throw error;can_edit=false;can_prepare=false; }
  }
  const versionRows=(await c.query("SELECT id,version,predecessor_id,scope_revision_id,reason,created_at,created_by,content_hash FROM ppo.estimate_versions WHERE workspace_id=$1 AND estimate_id=$2 ORDER BY version DESC",[p.workspace_id,id])).rows;
  const versions=[];
  for(const row of versionRows)try { if(e.discovery_basis)await costBasisContext(c,p,e,row.id,"estimating.read");versions.push(row); }catch(error){if(!(error instanceof AppError)||error.status!==404)throw error;}
  const quoteRows=(await hasPermission(c,p,"estimating.quote.read",e.company_id,estimateSite(e)??undefined))?(await c.query("SELECT q.id,q.version,q.estimate_version_id,q.created_at,j.state AS render_state,h.display_number FROM ppo.draft_quote_revisions q JOIN ppo.draft_quotes h ON (h.workspace_id,h.id)=(q.workspace_id,q.quote_id) JOIN ppo.estimate_quote_jobs j ON j.revision_id=q.id WHERE q.workspace_id=$1 AND q.estimate_id=$2 ORDER BY q.version DESC",[p.workspace_id,id])).rows:[];
  const quotes=[];
  for(const row of quoteRows)try {if(e.discovery_basis)await quoteContext(c,p,row.id);quotes.push(row);}catch(error){if(!(error instanceof AppError)||error.status!==404)throw error;}
  let latest=null;
  if(e.discovery_basis)try{latest=await latestCostingScope(c,p,e);}catch(error){if(!(error instanceof AppError)||error.status!==404)throw error;}
  const lineage=await readLineage(c,p,v), specialist_contributions=[];
  const permittedRuns=new Map<string,string|null>();
  for(const contribution of lineage?.snapshot.contributions??[]) {
    const key=`${contribution.configuration_id}:${contribution.run_id}`;
    if(!permittedRuns.has(key)) try {
      const cfg=await specialistConfiguration(c,p,contribution.configuration_id);
      await specialistRun(c,p,cfg,contribution.run_id);
      permittedRuns.set(key,cfg.name);
    } catch(error) {
      if(!(error instanceof AppError)||![403,404].includes(error.status))throw error;
      permittedRuns.set(key,null);
    }
    const name=permittedRuns.get(key);
    if(name!==null)specialist_contributions.push({...contribution,configuration_name:name!});
  }
  return {...e,specialist_lineage_status:lineage?"Available":"Legacy; no specialist lineage",specialist_contributions,...(e.discovery_basis?{site_id:estimateSite(e),latest_discovery:latest}:{}),context,opportunity:{id:o.id,display_number:o.display_number,title:o.title},saved:v,current_saved:await versionContext(c,p,e,e.current_version_id),totals:calculate(v.lines),versions,quotes,can_edit,can_prepare};
}
export async function readQuote(p:Principal,id:string) {
  const c=database(),{q,e}=await quoteContext(c,p,id),{j}=await readQuoteJob(p,id);
  let can_prepare=false;
  try {await quoteContext(c,p,id,"estimating.quote.prepare");can_prepare=true;} catch(error) {if(!(error instanceof AppError)||![403,404].includes(error.status))throw error;}
  let internal=await hasPermission(c,p,"estimating.read",e.company_id,estimateSite(e)??undefined);
  if(internal&&e.discovery_basis)try{await estimateContext(c,p,e.id,"estimating.read",q.estimate_version_id);}catch(error){if(!(error instanceof AppError)||error.status!==404)throw error;internal=false;}
  return {id:q.id,quote_id:q.quote_id,snapshot:q.safe_snapshot,created_at:q.created_at,can_prepare,
    ...(internal?{estimate_id:e.id,estimate_version_id:q.estimate_version_id}:{}),
    job:{state:j.state,attempts:j.attempts,error_code:j.error_code,output_available:j.state==="Ready",hashes:j.manifest?{html:j.manifest.html_hash,pdf:j.manifest.pdf_hash}:null},
    attempt_history:(await c.query("SELECT attempt,outcome,code,happened_at FROM ppo.estimate_quote_attempts WHERE job_id=$1 ORDER BY id",[j.id])).rows};
}

// Small, permission-checked projection for the CRM Commercial tab.
export async function opportunityCommercial(p: Principal, id: string, query: Record<string,string> = {}) {
  object(query, []);
  const c = database();
  await requireCapability(c, p, "estimating.read");
  const o = await visibleOpportunity(c, p, id);
  await relationshipContext(c, p, o, "estimating.read");
  const bound=await costBasisAvailable(c);
  const rows = (await c.query<{id:string}>(`SELECT e.id FROM ppo.estimates e WHERE e.workspace_id=$1 AND e.opportunity_id=$2 ORDER BY ${bound?"EXISTS(SELECT 1 FROM ppo.estimating_workspaces g WHERE g.workspace_id=e.workspace_id AND g.legacy_estimate_id=e.id) DESC,":""}e.created_at,e.id`, [p.workspace_id,id])).rows;
  const items=[];
  for(const row of rows)try{items.push(await readEstimate(p,row.id));}catch(error){if(!(error instanceof AppError)||error.status!==404)throw error;}
  const d=items[0]??null;
  let can_create = false;
  if (!rows.length && await hasPermission(c,p,"estimating.edit",o.company_id,o.site_id??undefined)) {
    try { await relationshipContext(c,p,o,"estimating.edit"); can_create=true; }
    catch(e) { if (!(e instanceof AppError) || ![403,404].includes(e.status)) throw e; }
  }
  if(can_create && await discoveryAvailable(c) && (await c.query("SELECT 1 FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND opportunity_id=$2",[p.workspace_id,id])).rowCount) can_create=false;
  return {
    estimate: d ? {id:d.id,display_number:d.display_number,state:d.state,title:d.saved.title,version:d.saved.version,sell_total:d.saved.sell_total} : null,
    site_name: d?.context.site ?? null,
    quotes: d?.quotes.map(q=>({id:String(q.id),display_number:String(q.display_number),version:Number(q.version)})) ?? [],
    can_create,
    ...(bound&&items.some(i=>i.discovery_basis)?{estimates:items.map(i=>({id:i.id,display_number:i.display_number,state:i.state,title:i.saved.title,version:i.saved.version,sell_total:i.saved.sell_total,option_id:i.option_id,discovery_basis:i.discovery_basis??null}))}:{}),
  };
}
