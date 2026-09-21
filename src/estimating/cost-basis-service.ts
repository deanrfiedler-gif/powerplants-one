import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { transaction } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import { workspaceAuthority, optionContext, revisionAuthority, requireActiveOption, requireDraftGroup } from "./discovery-workspace-context";
import { prepareDiscoveryTargets, expectDiscoveryContext } from "./discovery-context";
import { acceptedEstimateContext, estimateContext, versionContext, type Estimate } from "./context";
import { costingInput, costingProposal } from "./cost-basis-validation";
import { expected, insertVersion } from "./service";

import { writeLineage } from "./specialist/lineage";
async function selectedBasis(c:QueryClient,p:Principal,id:string,optionId:string,revisionId:string) {
  const g=await workspaceAuthority(c,p,id,true);
  await requireDraftGroup(c,p,g);
  const option=await optionContext(c,g,optionId);
  requireActiveOption(option);
  if(g.selected_option_id!==option.id||option.current_revision_id!==revisionId)
    throw new AppError(409,"DiscoveryRevisionChanged","Review the current selected option and its saved scope before costing.");
  const r=await revisionAuthority(c,p,g,revisionId,true);
  if(r.kind!=="Discovery"||r.scope_readiness!=="Complete")
    throw new AppError(409,"DiscoveryScopeIncomplete","Complete and confirm this option's scope before adopting it for costing.");
  const targets=await prepareDiscoveryTargets(c,p,g.opportunity_id,r.input);
  if(targets.compiled.scope_readiness!=="Complete")throw unavailable();
  const existing=(await c.query<{id:string}>("SELECT id FROM ppo.estimates WHERE workspace_id=$1 AND option_id=$2",[p.workspace_id,option.id])).rows[0];
  const e=existing?await estimateContext(c,p,existing.id,"estimating.edit"):null;
  if(e&&!e.discovery_basis)throw new AppError(409,"LegacyEstimateRetained","This option retains its original E1 estimate. Branch a fresh discovery option for separately bound costing.");
  return {g,option,r,targets,e};
}
export async function previewDiscoveryCosting(p:Principal,id:string,value:unknown) {
  const input=costingProposal(value);
  return transaction(async c=>{
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE",[p.workspace_id]);
    const {g,option,r,targets,e}=await selectedBasis(c,p,id,input.option_id,input.revision_id);
    const saved=e?await versionContext(c,p,e,e.current_version_id):null;
    return {workspace_id:g.id,option_id:option.id,option_label:option.label,revision_id:r.id,revision:r.version,
      scope_snapshot_id:r.scope_snapshot_id,answer_snapshot_id:r.answer_snapshot_id,content_hash:r.content_hash,saved_context_hash:r.context_hash,context_hash:targets.context_hash,
      expected_workspace_version:g.version,expected_estimate_version:e?.version??0,estimate_id:e?.id??null,
      selected_scope:targets.compiled,recorded_context:r.observed_context,current_saved:saved,synthetic:true};
  });
}
export async function adoptDiscoveryCosting(p:Principal,id:string,value:unknown) {
  const input=costingInput(id,value);
  return sharedOperation(p,input,"AdoptDiscoveryCosting",async c=>{
    const accepted=await acceptedEstimateContext(c,p,input.estimate_id,input.operation_id);
    const g=await workspaceAuthority(c,p,input.id,true);
    await revisionAuthority(c,p,g,input.revision_id,true);
    return accepted;
  },async c=>{
    const {g,r,targets,e}=await selectedBasis(c,p,input.id,input.option_id,input.revision_id);
    expected(g.version,input.expected_workspace_version);
    expected(e?.version??0,input.expected_estimate_version);
    if(e&&e.id!==input.estimate_id)throw unavailable();
    expectDiscoveryContext(input.context_hash,targets);
    const next=randomUUID();
    let updated:Estimate;
    if(e) {
      updated=(await c.query<Estimate>("UPDATE ppo.estimates SET version=version+1,current_version_id=$3,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",[p.workspace_id,e.id,next,p.actor_id])).rows[0];
    } else {
      await c.query(`INSERT INTO ppo.estimate_discovery_roots(workspace_id,company_id,estimate_id,estimating_workspace_id,option_id,initial_revision_id) VALUES($1,$2,$3,$4,$5,$6)`,[p.workspace_id,g.company_id,input.estimate_id,g.id,r.option_id,r.id]);
      updated=(await c.query<Estimate>(`INSERT INTO ppo.estimates(id,workspace_id,company_id,created_by,updated_by,opportunity_id,site_id,owner_id,option_id,estimation_revision_id,current_version_id)
        VALUES($1,$2,$3,$4,$4,$5,$6,$4,$7,$8,$9) RETURNING *`,[input.estimate_id,p.workspace_id,g.company_id,p.actor_id,g.opportunity_id,r.site_id,r.option_id,r.id,next])).rows[0];
    }
    await insertVersion(c,p,updated,{...input,schema_version:2},next,e?.current_version_id??null);
    await c.query(`INSERT INTO ppo.estimate_discovery_bases(workspace_id,company_id,estimate_id,estimate_version_id,revision_id) VALUES($1,$2,$3,$4,$5)`,[p.workspace_id,g.company_id,updated.id,next,r.id]);
    await writeLineage(c,p,next,e?.current_version_id??null);
    return {...updated,audit_details:{saved_version_id:next,predecessor_id:e?.current_version_id??null,estimating_workspace_id:g.id,option_id:r.option_id,revision_id:r.id,
      scope_snapshot_id:r.scope_snapshot_id,answer_snapshot_id:r.answer_snapshot_id,scope_content_hash:r.content_hash,scope_context_hash:r.context_hash,reviewed_context_hash:targets.context_hash,arithmetic_policy:input.policy}};
  },"Estimate",input.expected_estimate_version===0?"EstimateCreated":"EstimateVersionSaved");
}
