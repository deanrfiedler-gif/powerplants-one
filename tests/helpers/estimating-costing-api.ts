import { randomUUID } from "node:crypto";
import type { previewDiscoveryCreate, previewDiscoveryChange } from "../../src/estimating/discovery-workspaces";
import type { previewDiscoveryCosting } from "../../src/estimating/cost-basis-service";
import { crmBase, crmCreate } from "./crm";
import { discoveryInput } from "./estimating-discovery";
import { estimateInput } from "./estimating";
export type CostingCall=(path:string,body?:unknown)=>Promise<unknown>;
export async function createCostingWorkspace(call:CostingCall) {
  const o=crmCreate();await call("crm/opportunities",o);
  const discovery=discoveryInput(),preview=await call("estimating/workspaces/preview",{opportunity_id:o.id,discovery}) as Awaited<ReturnType<typeof previewDiscoveryCreate>>;
  const input={...crmBase(),id:randomUUID(),option_id:randomUUID(),revision_id:randomUUID(),opportunity_id:o.id,discovery,
    expected_opportunity_version:preview.expected_opportunity_version,context_hash:preview.context_hash,confirmed_question_ids:preview.required_confirmation_ids};
  const receipt=await call("estimating/workspaces",input);
  return {o,input,receipt,path:`estimating/workspaces/${input.id}`};
}
export async function costingApiCommand(call:CostingCall,s:Awaited<ReturnType<typeof createCostingWorkspace>>,revisionId=s.input.revision_id) {
  const preview=await call(s.path+"/costing/preview",{option_id:s.input.option_id,revision_id:revisionId}) as Awaited<ReturnType<typeof previewDiscoveryCosting>>;
  const manual=estimateInput(s.o.id);
  return {...crmBase(),estimate_id:preview.estimate_id??randomUUID(),option_id:s.input.option_id,revision_id:revisionId,
    expected_workspace_version:preview.expected_workspace_version,expected_estimate_version:preview.expected_estimate_version,context_hash:preview.context_hash,
    title:manual.title,scope:manual.scope,lines:manual.lines.map(l=>({...l,allowance:false})),policy:manual.policy};
}
export async function costingScopeSuccessor(call:CostingCall,s:Awaited<ReturnType<typeof createCostingWorkspace>>) {
  const discovery=discoveryInput();discovery.answers[0]={...discovery.answers[0],value:"SYN exact revised discovery for costing"};
  const proposal={kind:"Save",option_id:s.input.option_id,expected_version:1,expected_revision_id:s.input.revision_id,discovery};
  const preview=await call(s.path+"/preview",proposal) as Awaited<ReturnType<typeof previewDiscoveryChange>>;
  const body={...crmBase(),...proposal,revision_id:randomUUID(),context_hash:preview.context_hash,comparison_hash:preview.comparison_hash,confirmed_question_ids:preview.required_confirmation_ids};
  const receipt=await call(s.path,body);return {body,receipt};
}
