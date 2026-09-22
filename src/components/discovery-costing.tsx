"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { previewDiscoveryCosting } from "../estimating/cost-basis-service";
import type { readDiscoveryWorkspace } from "../estimating/discovery-workspaces";
import { arithmeticPolicy } from "../estimating/math";
import { api, ErrorNotice, Field, PageHeader, ValidationFields } from "./business-ui";
import { useCrmResource, useCrmCommand, denied } from "./crm-state";
import { DraftFields, ProposalTotals, CommandState, type Draft } from "./estimating-screens";
import { ScopeView } from "./discovery-screens";
import { FertigationReceivedNotes } from "./fertigation-received-notes";
type Review=Awaited<ReturnType<typeof previewDiscoveryCosting>>;
type Detail=Awaited<ReturnType<typeof readDiscoveryWorkspace>>;
export function DiscoveryCosting({id}:{id:string}) {
  const data=useCrmResource<Detail>(`estimating/workspaces/${id}`),params=useSearchParams();
  return <div className="est-screen"><PageHeader eyebrow="Estimating · Synthetic" title="Cost a saved discovery option"/>
    {data.loading&&<p role="status">Loading the saved scope…</p>}<ErrorNotice error={data.error}/>
    {data.error!=null&&<button className="secondary" onClick={data.reload}>Reload current scope</button>}
    {data.data&&<CostingEditor detail={data.data} optionId={params.get("option")??data.data.workspace.selected_option_id}/>}
  </div>;
}
function CostingEditor({detail,optionId}:{detail:Detail;optionId:string}) {
  const router=useRouter(),[review,setReview]=useState<Review|null>(null),[draft,setDraft]=useState<Draft|null>(null),[reason,setReason]=useState(""),[confirmed,setConfirmed]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState<unknown>(null);
  const command=useCrmCommand(r=>router.push(`/estimating/estimates/${r.record_id}`));
  const option=detail.options.find(x=>x.option.id===optionId),frozen=loading||command.busy||command.uncertain;
  const stale=!!review&&(review.expected_workspace_version!==detail.workspace.version||review.revision_id!==option?.revision.id||detail.workspace.selected_option_id!==optionId);
  async function compare(){
    if(!option)return;
    setLoading(true);setError(null);setConfirmed(false);command.clearError();
    try{
      const next=await api<Review>(`estimating/workspaces/${detail.workspace.id}/costing/preview`,{option_id:optionId,revision_id:option.revision.id});
      setReview(next);
      if(!draft)setDraft(next.current_saved?{schema_version:2,title:next.current_saved.title,scope:next.current_saved.scope,lines:next.current_saved.lines}:{schema_version:2,title:"",scope:{included:"",excluded:"",assumptions:""},lines:[]});
    }catch(e){setError(e);}finally{setLoading(false);}
  }
  if(denied(error)||denied(command.error))return <ErrorNotice error={error??command.error}/>;
  const eligible=detail.can_edit&&option?.option.state==="Active"&&detail.workspace.selected_option_id===optionId&&option.revision.kind==="Discovery"&&option.revision.scope_readiness==="Complete";
  return <>
    {!frozen&&<Link href={`/estimating/discovery/${detail.workspace.id}`}>Return to discovery workspace</Link>}
    <p>Review the exact saved scope, then enter manual costs and customer wording. Discovery does not generate prices.</p>
    <p>Option {option?.option.label??"unavailable"} · Saved discovery revision {option?.revision.version} · {option?.revision.scope_readiness}</p>
    {!eligible&&<p role="alert">Select an Active option with Complete discovery before creating or adopting its cost basis. Existing saved estimates remain unchanged.</p>}
    {stale&&<p role="alert">Discovery changed. Your manual proposal is retained; review the current selected scope before saving.</p>}
    <button disabled={frozen||!eligible} onClick={()=>void compare()}>{loading?"Reviewing scope…":review?"Review latest scope and keep manual proposal":"Review selected scope for costing"}</button>
    <ErrorNotice error={error}/>
    {review&&draft&&<section className="est-panel" aria-label="Reviewed discovery cost basis">
      <h2>Option {review.option_label} · Discovery revision {review.revision}</h2>
      <ScopeView input={review.selected_scope.input} context={review.recorded_context!}/>
      <FertigationReceivedNotes items={review.fertigation_handovers}/>
      <details className="est-panel"><summary>Exact saved source</summary><dl className="est-hashes"><dt>Scope snapshot</dt><dd>{review.scope_snapshot_id}</dd><dt>Answer snapshot</dt><dd>{review.answer_snapshot_id}</dd><dt>Scope content hash</dt><dd>{review.content_hash}</dd></dl></details>
      {review.current_saved&&<p>Saved cost version {review.current_saved.version} currently uses discovery revision {review.current_saved.discovery_basis?.revision}. Saving below creates a new cost version; previous versions and drafts retain their originals.</p>}
      <form onSubmit={e=>{e.preventDefault();if(!confirmed||stale)return;void command.send(`estimating/workspaces/${detail.workspace.id}/costing`,{
        estimate_id:review.estimate_id??crypto.randomUUID(),option_id:review.option_id,revision_id:review.revision_id,
        expected_workspace_version:review.expected_workspace_version,expected_estimate_version:review.expected_estimate_version,context_hash:review.context_hash,
        title:draft.title,scope:draft.scope,lines:draft.lines,policy:arithmeticPolicy,reason,
      });}}><ValidationFields error={command.error}><fieldset className="est-form" disabled={frozen||!eligible||stale}>
        <DraftFields value={draft} onChange={value=>{setDraft(value);setConfirmed(false);command.dirty();}}/>
        <ProposalTotals draft={draft}/>
        <Field label="Reason for adopting this cost basis" name="reason" value={reason} onChange={v=>{setReason(v);command.dirty();}} maxLength={1000} required/>
        <label className="e2-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I reviewed this exact discovery basis and the manual scope and costs</label>
        <button type="submit" disabled={!confirmed}>{command.busy?"Saving…":review.estimate_id?"Adopt scope in a new cost version":"Save option estimate"}</button>
      </fieldset></ValidationFields><CommandState command={command}/></form>
    </section>}
    <p className="est-note">Unsaved entries remain in this page only. Ordinary workbook saves retain their accepted discovery basis; adopting a newer scope requires this separate review.</p>
  </>;
}
