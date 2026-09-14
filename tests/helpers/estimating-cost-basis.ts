import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createDiscoveryWorkspace, previewDiscoveryCreate, readDiscoveryWorkspace, previewDiscoveryChange, changeDiscoveryWorkspace, changeDiscoveryOption } from "../../src/estimating/discovery-workspaces";
import { previewDiscoveryCosting, adoptDiscoveryCosting } from "../../src/estimating/cost-basis-service";
import { readEstimate } from "../../src/estimating/reads";
import { discoveryInput } from "./estimating-discovery";
import { crmBase, crmCreate } from "./crm";
import { estimateInput } from "./estimating";
import type { DiscoveryInput } from "../../src/estimating/discovery";
export async function discoveryCostSetup(discovery:DiscoveryInput=discoveryInput()) {
  const p=(await createSession("coordinator")).principal,o=crmCreate();
  await createOpportunity(p,o);
  const preview=await previewDiscoveryCreate(p,{opportunity_id:o.id,discovery});
  const input={...crmBase(),id:randomUUID(),option_id:randomUUID(),revision_id:randomUUID(),opportunity_id:o.id,discovery,
    expected_opportunity_version:preview.expected_opportunity_version,context_hash:preview.context_hash,confirmed_question_ids:preview.required_confirmation_ids};
  await createDiscoveryWorkspace(p,input);
  return {p,o,input};
}
export type CostSetup=Awaited<ReturnType<typeof discoveryCostSetup>>;
export async function manualCostCommand(s:CostSetup) {
  const d=await readDiscoveryWorkspace(s.p,s.input.id),selected=d.options.find(o=>o.option.id===d.workspace.selected_option_id)!;
  const review=await previewDiscoveryCosting(s.p,s.input.id,{option_id:selected.option.id,revision_id:selected.revision.id}),manual=estimateInput(s.o.id);
  return {...crmBase(),estimate_id:review.estimate_id??randomUUID(),option_id:review.option_id,revision_id:review.revision_id,
    expected_workspace_version:review.expected_workspace_version,expected_estimate_version:review.expected_estimate_version,context_hash:review.context_hash,
    title:manual.title,scope:manual.scope,lines:manual.lines.map(l=>({...l,allowance:false})),policy:manual.policy};
}
export async function costed(s:CostSetup) {
  const command=await manualCostCommand(s),accepted=await adoptDiscoveryCosting(s.p,s.input.id,command),estimate=await readEstimate(s.p,command.estimate_id);
  return {...s,command,accepted,estimate};
}
export async function reviseCostDiscovery(s:CostSetup,discovery:DiscoveryInput=discoveryInput(),branch=false) {
  const d=await readDiscoveryWorkspace(s.p,s.input.id),option=d.options.find(o=>o.option.id===d.workspace.selected_option_id)!;
  const proposal={kind:branch?"Branch":"Save",option_id:option.option.id,expected_version:d.workspace.version,expected_revision_id:option.revision.id,
    discovery,...(branch?{branch_mode:"Fresh"}:{})};
  const preview=await previewDiscoveryChange(s.p,s.input.id,proposal);
  const input={...crmBase(),...proposal,revision_id:randomUUID(),...(branch?{new_option_id:randomUUID(),label:"B"}:{}),
    context_hash:preview.context_hash,comparison_hash:preview.comparison_hash,confirmed_question_ids:preview.required_confirmation_ids};
  await changeDiscoveryWorkspace(s.p,s.input.id,input);
  return input;
}
export async function selectCostOption(s:CostSetup,optionId:string,action:"Select"|"Archive"|"Reopen"="Select") {
  const d=await readDiscoveryWorkspace(s.p,s.input.id),o=d.options.find(o=>o.option.id===optionId)!;
  return changeDiscoveryOption(s.p,s.input.id,{...crmBase(),action,option_id:optionId,expected_version:d.workspace.version,
    expected_revision_id:o.revision.id,expected_selected_option_id:d.workspace.selected_option_id});
}
