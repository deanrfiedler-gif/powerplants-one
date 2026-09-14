import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { costingInput, costingProposal } from "../../src/estimating/cost-basis-validation";
import { crmBase } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";
test("E2 cost receiving namespace requires exact expectations and explicit expanded manual lines",()=>{
  const m=estimateInput(randomUUID()),g=randomUUID(),input={...crmBase(),estimate_id:randomUUID(),option_id:randomUUID(),revision_id:randomUUID(),expected_workspace_version:1,expected_estimate_version:0,context_hash:"a".repeat(64),title:m.title,scope:m.scope,lines:m.lines.map(l=>({...l,allowance:false})),policy:m.policy};
  const parsed=costingInput(g,input);assert.equal(parsed.expected_estimate_version,0);assert.equal(parsed.lines[0].unit_cost,"120.00");assert.equal(parsed.id,g);
  for(const patch of [{schema_version:2},{expected_estimate_version:-1},{expected_estimate_version:"0"},{expected_workspace_version:0},{revision_id:null},{context_hash:"unknown"},{policy:"Automatic"},{state:"Issued"},{lines:m.lines},{lines:input.lines.map(l=>({...l,allowance:"false"}))}])assert.throws(()=>costingInput(g,{...input,...patch}));
  assert.throws(()=>costingProposal({option_id:input.option_id,revision_id:input.revision_id,confirmed:true}));
  assert.throws(()=>costingInput(g,{...input,title:"x".repeat(65537)}));
});
