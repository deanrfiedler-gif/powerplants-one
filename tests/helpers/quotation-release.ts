import {randomUUID} from "node:crypto";
import {createSession} from "../../src/platform/identity";
import {createOpportunity} from "../../src/crm/opportunities";
import {createEstimate,prepareQuote} from "../../src/estimating/service";
import {readEstimate} from "../../src/estimating/reads";
import {readEstimateReview} from "../../src/estimating/review/reads";
import {submitEstimateReview,decideEstimateReview} from "../../src/estimating/review/service";
import {readRelease} from "../../src/estimating/release/reads";
import {prepareRelease,approveRelease,issueRelease} from "../../src/estimating/release/service";
import {retryQuote} from "../../src/estimating/worker";
import {crmCreate,crmBase} from "./crm";
import {estimateInput,quoteCommand} from "./estimating";
import type {Principal} from "../../src/platform/identity";

export type ReleaseDetail=Awaited<ReturnType<typeof readRelease>>;
export const releaseCommand=(d:ReleaseDetail)=>({...crmBase(),synthetic_only:true,expected_quote_version:d.quote_version,expected_release_sequence:d.sequence});
export const preparation=(d:ReleaseDetail)=>({...releaseCommand(d),id:randomUUID(),basis_hash:d.preview.basis_hash,predecessor_issue_id:d.preview.predecessor_issue_id});
export const approval=(d:ReleaseDetail)=>({...releaseCommand(d),outcome:"Approved",output_hash:d.job.output_hash});
export const issue=(d:ReleaseDetail)=>({...releaseCommand(d),approval_id:d.approval!.id,output_hash:d.job.output_hash});
export async function reviewed(p:Principal,r:Principal,id:string) {
  let d=await readEstimateReview(p,id);
  await submitEstimateReview(p,id,{...crmBase(),estimate_version_id:d.saved.id,basis_hash:d.basis_hash,expected_version:d.estimate.version,expected_review_version:d.sequence,responses:[]});
  for(const kind of ["Completeness","SourcePrice","Technical"]){
    d=await readEstimateReview(r,id);
    await decideEstimateReview(r,id,{...crmBase(),submission_id:d.submissions.at(-1)!.id,expected_version:d.estimate.version,expected_review_version:d.sequence,kind,outcome:"Reviewed",findings:[]});
  }
}
export async function releaseFixture() {
  const owner=(await createSession("coordinator")).principal,reviewer=(await createSession("estimating-source-reviewer")).principal,
    approver=(await createSession("quotation-approver")).principal,issuer=(await createSession("quotation-issuer")).principal,o=crmCreate();
  await createOpportunity(owner,o);const input=estimateInput(o.id);await createEstimate(owner,input);
  await reviewed(owner,reviewer,input.id);
  const estimate=await readEstimate(owner,input.id),draft=quoteCommand(estimate.saved);
  await prepareQuote(owner,input.id,draft);
  return {owner,reviewer,approver,issuer,o,input,estimate,draft};
}
export async function prepared(f:Awaited<ReturnType<typeof releaseFixture>>) {
  const input=preparation(await readRelease(f.owner,f.draft.id)),result=await prepareRelease(f.owner,f.draft.id,input);
  await retryQuote(f.owner,input.id);
  return {input,result,id:input.id};
}
export async function approved(f:Awaited<ReturnType<typeof releaseFixture>>,id:string) {
  const input=approval(await readRelease(f.approver,id)),result=await approveRelease(f.approver,id,input);
  return {input,result};
}
export async function issued(f:Awaited<ReturnType<typeof releaseFixture>>,id:string) {
  await approved(f,id);
  const input=issue(await readRelease(f.issuer,id)),result=await issueRelease(f.issuer,id,input);
  return {input,result};
}
