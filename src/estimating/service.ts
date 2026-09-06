import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { sharedOperation, canonical } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import { digest } from "../documents/store";
import { visibleOpportunity, relationshipContext } from "../crm/context";
import { hasPermission } from "../platform/permissions";
import { createInput, saveInput, quoteInput } from "./validation";
import { estimateContext, versionContext, type Estimate, type EstimateVersion } from "./context";
import { calculate, quoteAmounts } from "./math";
import { quoteTemplate, type SafeQuote } from "./template";
export function versionHash(v:Pick<EstimateVersion,"title"|"scope"|"lines"|"policy">) {
  return digest(canonical({title:v.title,scope:v.scope,lines:v.lines,policy:v.policy}));
}
export function expected(actual:number,wanted:number) {
  if(actual!==wanted) throw new AppError(409,"VersionConflict","The saved record changed. Keep your proposal and compare the current version before saving again.");
}
async function insertVersion(c:PoolClient,p:Principal,e:Estimate,input:ReturnType<typeof saveInput>|ReturnType<typeof createInput>,id:string,predecessor:string|null) {
  const totals=calculate(input.lines);
  await c.query(`INSERT INTO ppo.estimate_versions(id,workspace_id,company_id,estimate_id,version,created_by,updated_by,predecessor_id,scope_revision_id,title,scope,lines,policy,content_hash,reason,cost_total,sell_total)
    VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [id,p.workspace_id,e.company_id,e.id,e.version,p.actor_id,predecessor,randomUUID(),input.title,input.scope,JSON.stringify(input.lines),input.policy,versionHash(input),input.reason,totals.cost,totals.sell]);
}
export async function createEstimate(p:Principal,value:unknown) {
  const input=createInput(value);
  return sharedOperation(p,input,"CreateEstimate",async c=>{
    const o=await visibleOpportunity(c,p,input.opportunity_id);
    await relationshipContext(c,p,o,"estimating.edit");
    if(input.owner_id!==p.actor_id || !(await hasPermission(c,p,"estimating.read",o.company_id,o.site_id??undefined))) throw unavailable();
    if((await c.query("SELECT 1 FROM ppo.estimates WHERE workspace_id=$1 AND id=$2",[p.workspace_id,input.id])).rowCount)
      await estimateContext(c,p,input.id,"estimating.edit");
    return o;
  },async(c,o)=>{
    const id=randomUUID();
    const e=(await c.query<Estimate>(`INSERT INTO ppo.estimates(id,workspace_id,company_id,created_by,updated_by,opportunity_id,site_id,owner_id,option_id,estimation_revision_id,current_version_id)
      VALUES($1,$2,$3,$4,$4,$5,$6,$4,$7,$8,$9) RETURNING *`,[input.id,p.workspace_id,o.company_id,p.actor_id,o.id,o.site_id,randomUUID(),randomUUID(),id])).rows[0];
    await insertVersion(c,p,e,input,id,null);
    return {...e,audit_details:{saved_version_id:id,scope_revision:"r01",arithmetic_policy:input.policy}};
  },"Estimate","EstimateCreated");
}
export async function saveEstimate(p:Principal,id:string,value:unknown) {
  const input=saveInput(id,value);
  return sharedOperation(p,input,"SaveEstimate",c=>estimateContext(c,p,input.id,"estimating.edit"),async(c,e)=>{
    expected(e.version,input.expected_version);
    const next=randomUUID(),old=e.current_version_id;
    const updated=(await c.query<Estimate>("UPDATE ppo.estimates SET version=version+1,current_version_id=$3,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",[p.workspace_id,id,next,p.actor_id])).rows[0];
    await insertVersion(c,p,updated,input,next,old);
    return {...updated,audit_details:{saved_version_id:next,predecessor_id:old,arithmetic_policy:input.policy}};
  },"Estimate","EstimateVersionSaved");
}
export async function prepareQuote(p:Principal,id:string,value:unknown) {
  const input=quoteInput(id,value);
  return sharedOperation(p,input,"PrepareDraftQuote",async c=>{
    const e=await estimateContext(c,p,input.estimate_id,"estimating.quote.prepare");
    if(!(await hasPermission(c,p,"estimating.quote.read",e.company_id,e.site_id??undefined))) throw unavailable();
    return {e,v:await versionContext(c,p,e,input.estimate_version_id)};
  },async(c,{e,v})=>{
    expected(e.version,input.expected_version);
    if(versionHash(v)!==v.content_hash) throw new AppError(409,"EstimateEvidenceMismatch","The saved estimate evidence must be reviewed before preparation.");
    if(!v.lines.length || input.choices.length!==v.lines.length || input.choices.some(choice=>!v.lines.some(line=>line.id===choice.line_id)))
      throw new AppError(422,"QuoteSelectionInvalid","Choose include and print for every line of the exact saved estimate version.");
    const prior=(await c.query("SELECT * FROM ppo.draft_quotes WHERE workspace_id=$1 AND estimate_id=$2",[p.workspace_id,e.id])).rows[0];
    expected(prior?.version??0,input.expected_quote_version);
    const q=prior?(await c.query("UPDATE ppo.draft_quotes SET version=version+1,current_revision_id=$3,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",[p.workspace_id,prior.id,input.id,p.actor_id])).rows[0]:
      (await c.query("INSERT INTO ppo.draft_quotes(id,workspace_id,company_id,estimate_id,created_by,updated_by,current_revision_id) VALUES($1,$2,$3,$4,$5,$5,$6) RETURNING *",[randomUUID(),p.workspace_id,e.company_id,e.id,p.actor_id,input.id])).rows[0];
    const names=(await c.query("SELECT r.display_name AS customer,s.display_name AS site,pe.display_name AS contact FROM ppo.opportunities o JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id) LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(o.workspace_id,o.site_id) LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(o.workspace_id,o.primary_person_id) WHERE o.workspace_id=$1 AND o.id=$2",[p.workspace_id,e.opportunity_id])).rows[0];
    const snapshot:SafeQuote={synthetic:true,state:"Draft",display_number:q.display_number,revision:q.version,title:v.title,customer:names.customer,site:names.site,contact:names.contact,scope:v.scope,...quoteAmounts(v.lines,input.choices),tax_calculated:false};
    const template=await quoteTemplate(snapshot);
    const revision=(await c.query(`INSERT INTO ppo.draft_quote_revisions(id,workspace_id,company_id,quote_id,estimate_id,estimate_version_id,version,created_by,updated_by,choices,safe_snapshot,template_version,template_hash,input_html,input_hash,reason,template_definition)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id,version,state,updated_at`,
      [input.id,p.workspace_id,e.company_id,q.id,e.id,v.id,q.version,p.actor_id,JSON.stringify(input.choices),snapshot,template.template_version,template.template_hash,template.html,template.input_hash,input.reason,template.template_definition])).rows[0];
    const job=randomUUID();
    await c.query("INSERT INTO ppo.estimate_quote_jobs(id,workspace_id,revision_id,actor_id) VALUES($1,$2,$3,$4)",[job,p.workspace_id,input.id,p.actor_id]);
    return {...revision,audit_details:{estimate_id:e.id,estimate_version_id:v.id,quote_id:q.id,render_job_id:job,input_hash:template.input_hash}};
  },"DraftQuoteRevision","DraftQuotePrepared");
}
