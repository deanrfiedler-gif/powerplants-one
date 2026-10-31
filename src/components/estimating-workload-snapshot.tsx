"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "./ui/button";
import { RegisterChip } from "./ui/register-table";
import { RecordTabs, RecordPanel } from "./record-ui";
import { ShellIcon } from "./shell-icon";
import { WorklistMenu } from "./crm-worklist-tools";
import { workloadLabels } from "../estimating/workload-query";
import { discoverySummary, savedEstimateHref, shortDate, type WorkloadItem } from "./estimating-workload-model";

const nextStep = {
  unstarted: "Review the brief and establish discovery ownership.",
  clarification: "Resolve owned scope questions in the selected alternative.",
  ready: "Review the exact discovery basis before adopting manual costs.",
  legacy: "Review the saved manual basis or start explicit structured discovery.",
};
export function WorkloadSnapshot({item,stale,onClose,previous,next}:{
  item:WorkloadItem;stale:boolean;onClose:()=>void;previous?:()=>void;next?:()=>void;
}) {
  const ref=useRef<HTMLDialogElement>(null),[tab,setTab]=useState("alternatives");
  useEffect(()=>{
    const dialog=ref.current!,opener=document.activeElement;
    const size=()=>{
      const content=document.getElementById("estimating-content");
      const top=content?.getBoundingClientRect().top??64;
      dialog.style.setProperty("--ew-top", Math.max(0,top)+"px");
    };
    size();dialog.showModal();window.addEventListener("resize",size);
    return ()=>{window.removeEventListener("resize",size);dialog.close();if(opener instanceof HTMLElement&&opener.isConnected)opener.focus({preventScroll:true});};
  },[]);
  const w=item.workspace,selected=w?.options.find(o=>o.id===w.selected_option_id);
  const discoveryHref=w?`/estimating/discovery/${w.id}?option=${w.selected_option_id}`:`/estimating/discovery/new?opportunity=${item.opportunity.id}`;
  const brief=item.sales_brief;
  const facts=[["Customer",item.customer],["Site",item.site??"Site unknown or not required"],["Estimating owner",item.estimating_owner??"Not allocated"],["Sales owner",item.sales_owner],["Required response","Unknown"],["Last changed",shortDate(item.updated_at)]];
  return <dialog ref={ref} className="ew-snapshot" aria-labelledby="ew-snapshot-title" onCancel={e=>{e.preventDefault();onClose();}}>
    <div className="ew-record-controls">
      <Button variant="quiet" aria-label="Close snapshot" onClick={onClose}><ShellIcon name="close"/></Button>
      <Button variant="quiet" aria-label="Previous opportunity" disabled={!previous||stale} onClick={previous}><ShellIcon name="chevron-up"/></Button>
      <Button variant="quiet" aria-label="Next opportunity" disabled={!next||stale} onClick={next}><ShellIcon name="chevron-down"/></Button>
    </div>
    <header className="ew-phone-snapshot-header">
      <Button variant="quiet" aria-label="Close snapshot" onClick={onClose}><ShellIcon name="chevron-left"/></Button>
      <strong>{item.opportunity.display_number}</strong>
      <div className="ew-phone-traversal">
        <Button variant="quiet" aria-label="Previous opportunity" disabled={!previous||stale} onClick={previous}><ShellIcon name="chevron-up"/></Button>
        <Button variant="quiet" aria-label="Next opportunity" disabled={!next||stale} onClick={next}><ShellIcon name="chevron-down"/></Button>
      </div>
      <WorklistMenu label="Snapshot actions" icon="more">
        <Button data-menu-close disabled={!previous||stale} onClick={previous}>Previous opportunity</Button>
        <Button data-menu-close disabled={!next||stale} onClick={next}>Next opportunity</Button>
        <Button data-menu-close onClick={onClose}>Close snapshot</Button>
      </WorklistMenu>
    </header>
    <div className="ew-snapshot-inner" aria-busy={stale}>
      <div className="ew-record">
        <div className="ew-record-scroll">
          <header><h2 id="ew-snapshot-title">{item.opportunity.title}</h2><p className="ew-muted">{item.opportunity.display_number} v{item.opportunity.version} · Sales {item.opportunity.close_outcome}</p></header>
          {stale&&<p role="status" className="ew-rule">Refreshing — this earlier snapshot is unconfirmed. Actions resume after the current read.</p>}
          <div className="ew-readiness"><RegisterChip tone={item.state==="ready"?"positive":item.state==="clarification"?"attention":"neutral"}>{workloadLabels[item.state]}</RegisterChip><small>{discoverySummary(item)}</small></div>
          <section><h3>Brief from Sales</h3><p>{item.opportunity.need_summary||"No brief recorded."}</p></section>
          <section><h3>Next estimating step</h3><p>{nextStep[item.state]}</p>
            {!w&&!item.can_start&&<p className="ew-rule">Discovery creation is unavailable under current permissions or receiving-source checks. Review the Sales brief and your estimating access.</p>}
          </section>
          <section><h3>Ownership and dates</h3><dl className="ew-facts">{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
          {(item.readiness_reasons.length>0||item.readiness_findings.some(f=>f.category==="Readiness"))&&<section><h3>Scope readiness reasons</h3><ul className="ew-evidence">
            {item.readiness_reasons.map((r,i)=><li key={r.key+"-"+i}><strong>{r.key}</strong><p>{r.follow_up.reason}</p><small>{r.blocks_scope?"Blocks scope completion":"Follow-up; does not block scope"} · owner {r.follow_up.owner_id}</small></li>)}
            {item.readiness_findings.filter(f=>f.category==="Readiness").map((f,i)=><li key={i}>{f.message}</li>)}
          </ul></section>}
          <p className="ew-rule">Intake acceptance, estimator allocation, return and priority rules are not configured. Discovery complete is scope evidence only; it approves no price and issues no quotation.</p>
        </div>
        <footer>{!stale&&<ButtonLink href={`/sales/opportunities/${item.opportunity.id}`}>Open Sales opportunity</ButtonLink>}
          {!stale&&(w||item.can_start)&&<ButtonLink variant="primary" href={discoveryHref}>{w?"Open discovery":"Start discovery"}</ButtonLink>}
        </footer>
      </div>
      <div className="ew-related">
        <div className="ew-tabs-card">
          <RecordTabs id="ew-snapshot" label="Estimating evidence" value={tab} onChange={setTab} tabs={[{id:"alternatives",label:`Alternatives (${w?.options.length??0})`},{id:"estimates",label:`Saved estimates (${item.estimates.length})`}]}/>
          <RecordPanel id="ew-snapshot" tab="alternatives" value={tab}>
            {w?w.options.map(o=><div className="ew-related-row" key={o.id}><strong>{o.id===w.selected_option_id?"Selected · ":""}Option {o.label}</strong><small>Discovery r{o.revision} · {o.readiness==="Complete"?"Scope complete":o.readiness==="Incomplete"?"Scope incomplete":"Readiness not recorded"} · {o.state}</small>
              {!stale&&<Link href={`/estimating/discovery/${w.id}?option=${o.id}`}>Open alternative</Link>}
            </div>):<p>No discovery workspace.</p>}
            {selected&&<p className="ew-muted">Selected saved basis: r{selected.revision}. Alternatives are separate scopes; their amounts are never summed.</p>}
          </RecordPanel>
          <RecordPanel id="ew-snapshot" tab="estimates" value={tab}>
            {item.estimates.length?item.estimates.map(e=><div className="ew-related-row" key={e.id}><strong>{stale?e.display_number:<Link href={savedEstimateHref(e)}>{e.display_number} · Saved estimate v{e.version}</Link>}</strong><small>{e.discovery_revision===null?"Legacy manual basis":`Costed discovery r${e.discovery_revision}`} · Draft</small></div>):<p>No readable saved estimate. Unpriced scope is not zero.</p>}
          </RecordPanel>
        </div>
        <section className="ew-sales-context"><h3>Sales context</h3>
          {brief==="Unavailable"?<p>Sales brief unavailable under current access.</p>:brief?<><p><strong>Estimating brief · {brief.state} · revision {brief.revision}</strong></p><p>Receiving owner: {brief.receiver}</p>{brief.source_changed&&<p className="ew-rule">Sales sources changed since this brief. Review the current source before linking.</p>}{!stale&&<Link href={`/sales/handoffs/estimating/${brief.handover_id}`}>Open Sales brief</Link>}</>:<p>No Sales estimating brief recorded. This opportunity remains a candidate brief.</p>}
          <p>Opening or starting Discovery does not accept a Sales brief. Receiving acceptance and linking remain explicit, permission-checked steps in their native workflows.</p>
          {item.sales_handover_due&&<p className="ew-rule">Sales delivery handover due · opportunity v{item.sales_handover_due.opportunity_version} · {item.sales_handover_due.status}. This is separate from an estimating brief.</p>}
          {item.sales_action?<div className="ew-sales-action"><strong>Next action: {item.sales_action.summary}</strong><small>{item.sales_action.owner} · {item.sales_action.status} · {item.sales_action.due_at?"Due "+shortDate(item.sales_action.due_at):"Due date unknown"}</small></div>:<p>Sales next action unavailable under current access.</p>}
          <p className="ew-muted">A Sales action date is not a quotation deadline.</p>
        </section>
      </div>
    </div>
  </dialog>;
}
