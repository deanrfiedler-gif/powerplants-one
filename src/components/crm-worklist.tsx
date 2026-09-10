"use client";
import Link from "next/link";
import { useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import { DealDialog, dealAmount, dealClose, useDesktopCRM, type DealRecord, type StageUndo } from "./crm-deal-controls";
import type { OperationReceipt } from "../platform/operations";
import { ProductIcon } from "./product-icons";
import { HeaderContent } from "./header-content";
import { valueSummary } from "../crm/value-summary";
import type { listOpportunities, worklistOptions, WorklistItem } from "../crm/worklist";
import { useIdentity } from "./business-session";
import { ErrorNotice, Field, SelectField, Stamp, Status } from "./business-ui";
import { denied, useCrmResource } from "./crm-state";

type Results = Awaited<ReturnType<typeof listOpportunities>>;
const labels = { Needed: "Next action needed", DueNeeded: "Due date needed", Overdue: "Overdue", Upcoming: "Upcoming", Unavailable: "Next action unavailable" };
const query = (fields: Record<string, string>) => new URLSearchParams(Object.entries(fields).filter(([, value]) => value)).toString();
const initial = { q: "", company_id: "", site_id: "", owner_id: "", stage_id: "", next_action: "", sort: "Reference", limit: "50", cursor: "" };

function FilterPicker({ kind, value, company, set, enabled }: { kind: "Company" | "Site" | "Owner"; value: string; company: string; set: (value: string) => void; enabled: boolean }) {
  const [q, setQ] = useState("");
  const data = useCrmResource<Awaited<ReturnType<typeof worklistOptions>>>(enabled ? `crm/worklist-options?${query({ kind, company_id: kind === "Company" ? "" : company, q, limit: "50" })}` : null, true);
  return <div className="crm-filter-picker">
    <Field name={`filter-${kind}-search`} label={`Find ${kind.toLowerCase()} filter`} value={q} onChange={setQ} />
    <SelectField name={`filter-${kind}`} label={kind === "Owner" ? "Opportunity owner" : kind} value={value} onChange={set} options={data.data?.items ?? []} empty={data.loading ? "Loading permitted options…" : `All permitted ${kind === "Company" ? "companies" : kind === "Site" ? "sites" : "owners"}`} />
    <ErrorNotice error={data.error} />
    {data.data?.next_cursor && <small>More options exist. Refine this filter search.</small>}
  </div>;
}
function Action({ item }: { item: WorklistItem }) {
  const active = ["Upcoming", "Overdue", "DueNeeded"].includes(item.next_action_state);
  return <div className={`crm-next-action state-${item.next_action_state}`}>
    <strong>{labels[item.next_action_state]}</strong>
    {active && <>
      <p className="crm-action-text">{item.next_action_summary}</p>
      <p>Action owner: {item.action_owner_name}</p>
      {item.due_at && <p>Due <Stamp value={item.due_at} /> (Brisbane)</p>}
    </>}
    {item.next_action_state === "Needed" && <p>Open the opportunity to plan the next action.</p>}
    {item.next_action_state === "Unavailable" && <p>Open the opportunity to check current access.</p>}
  </div>;
}
function Identity({ item }: { item: WorklistItem }) {
  return <>
    <small>{item.display_number}</small>
    <Link className="crm-opportunity-title" href={`/crm/opportunities/${item.id}`}>{item.title}</Link>
    <p>{item.organisation_name}<br />{item.contact_name ?? "Contact not yet identified"}<br />{item.site_name ?? "Site not yet identified"}</p>
  </>;
}
const dueDate = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Brisbane" });
function CardAction({ item }: { item: WorklistItem }) {
  const [dismissed, setDismissed] = useState(false);
  const ownerDescription = `Activity owner: ${item.action_owner_name ?? "Not assigned"}`;
  const active = ["Upcoming", "Overdue", "DueNeeded"].includes(item.next_action_state);
  const status = item.due_at && active ? `${item.next_action_state === "Overdue" ? "Overdue" : "Due"} · ${dueDate.format(new Date(item.due_at))}` : labels[item.next_action_state];
  return <Link className={`crm-next-action crm-card-activity state-${item.next_action_state}`} draggable={false} aria-describedby={`crm-owner-${item.id}`} onFocus={() => setDismissed(false)} onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); setDismissed(true); } }} href={active&&item.next_action_id?`/work/${item.next_action_id}`:`/crm/opportunities/${item.id}?section=timeline&activity=new`}>
    <strong><ProductIcon name="clock"/><span>{status}</span></strong>
    <span className="crm-action-text">{active?item.next_action_summary:item.next_action_state==="Needed"?"Plan the next activity":"Check current activity access"}</span>
    <span id={`crm-owner-${item.id}`} className="crm-owner-label crm-help-trigger" aria-label={ownerDescription} data-tooltip={ownerDescription} data-dismissed={dismissed} onMouseEnter={() => setDismissed(false)}><ProductIcon name="person"/><span>{item.action_owner_name??"Not assigned"}</span></span>
  </Link>;
}
function useScrollMemory() {
  const position = useRef({ top: 0, left: 0 });
  const read = useCallback(() => position.current, []);
  const save = useCallback((top: number, left: number) => { position.current = { top, left }; }, []);
  return { read, save };
}
function Board({ data, selected, scroll, onOpen, onMove }: { data: Results; selected: string; scroll: ReturnType<typeof useScrollMemory>; onOpen:(id:string)=>void; onMove:(id:string,stage:string)=>void }) {
  const desktop=useDesktopCRM(),drag=useRef<string|null>(null),suppress=useRef(0),[destination,setDestination]=useState<string|null>(null);
  const endDrag=()=>{drag.current=null;setDestination(null);suppress.current=Date.now()+400;};
  useEffect(()=>{const cancel=(e:KeyboardEvent)=>{if(e.key==="Escape"&&drag.current)endDrag();};document.addEventListener("keydown",cancel);return()=>document.removeEventListener("keydown",cancel);},[]);

  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (ref.current) { const saved = scroll.read(); ref.current.scrollTop = saved.top; ref.current.scrollLeft = saved.left; } }, [scroll]);
  return <div ref={ref} className="crm-board-scroll" role="region" aria-label="Opportunity Board — stage sequence" tabIndex={0} onScroll={e => { scroll.save(e.currentTarget.scrollTop, e.currentTarget.scrollLeft); }}>
    <div className="crm-board" style={{ "--crm-stage-count": data.stages.length } as CSSProperties}>
      <div className="crm-board-headers">{data.stages.map(stage => <header key={stage.stage_id} className="crm-stage-heading" data-selected={stage.stage_id === selected}>
        <h2 id={`board-${stage.stage_id}`}>{stage.stage_id}</h2><div className="crm-stage-total"><span>{valueSummary(data.items.filter(item => item.stage_id === stage.stage_id)).formatted} known</span><span>{stage.count} {stage.count === 1 ? "deal" : "deals"}</span></div>
      </header>)}</div>
      <div className="crm-board-columns">{data.stages.map((stage) => <section key={stage.stage_id} className="crm-stage" data-selected={stage.stage_id === selected} data-drop-stage={stage.stage_id} data-drop-active={destination===stage.stage_id}
        onDragOver={e=>{if(!desktop||!drag.current)return;e.preventDefault();e.dataTransfer.dropEffect="move";setDestination(stage.stage_id);const node=ref.current,bounds=node?.getBoundingClientRect();if(node&&bounds){if(e.clientY<bounds.top+75)node.scrollTop-=12;else if(e.clientY>bounds.bottom-40)node.scrollTop+=12;if(e.clientX<bounds.left+40)node.scrollLeft-=12;else if(e.clientX>bounds.right-40)node.scrollLeft+=12;}}}
        onDrop={e=>{if(!desktop||!drag.current)return;e.preventDefault();const id=drag.current,old=data.items.find(x=>x.id===id);endDrag();if(old?.can_edit&&old.stage_id!==stage.stage_id)onMove(id,stage.stage_id);}} aria-labelledby={`board-${stage.stage_id}`}>
        <ul className="crm-worklist">
          {data.items.filter((item) => item.stage_id === stage.stage_id).map((item) => <li key={item.id} data-opportunity-id={item.id} className="crm-card" draggable={desktop&&item.can_edit}
            onDragStart={e=>{if(!desktop||!item.can_edit||(e.target as HTMLElement).closest(".crm-card-activity")){e.preventDefault();return;}drag.current=item.id;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/x-ppo-opportunity",item.id);}} onDragEnd={endDrag}>
            <Link className="crm-card-body crm-opportunity-title" href={`/crm/opportunities/${item.id}`} aria-label={item.title} draggable={false}
              onClick={e=>{if(Date.now()<suppress.current){e.preventDefault();return;}if(desktop&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey){e.preventDefault();onOpen(item.id);}}}>
              <span className="crm-card-heading"><span className="crm-card-title">{item.title}</span>{["Needed", "DueNeeded"].includes(item.next_action_state) && <span className="crm-card-warning" title={labels[item.next_action_state]} aria-label={labels[item.next_action_state]}><ProductIcon name="warning"/></span>}</span>
              <span className="crm-card-company" title={item.organisation_name}>{item.organisation_name}</span>
              <span className="crm-card-value"><strong>{dealAmount(item.value_amount)}</strong><span className="crm-card-close"><ProductIcon name="service"/>{dealClose(item.expected_close_date)}</span></span>
              <span className="crm-card-contact" title={`Customer contact: ${item.contact_name??"Not yet identified"}`}><ProductIcon name="person"/><span>{item.contact_name??"Contact not yet identified"}</span></span>
            </Link>
            <CardAction item={item} />
          </li>)}
        </ul>
        {stage.count === 0 && <p className="crm-stage-empty">No {stage.stage_id.toLowerCase()} opportunities on this page.</p>}
      </section>)}</div>
    </div>
  </div>;
}
function Grid({ data, scroll }: { data: Results; scroll: ReturnType<typeof useScrollMemory> }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (ref.current) { const saved = scroll.read(); ref.current.scrollTop = saved.top; ref.current.scrollLeft = saved.left; } }, [scroll]);
  return <div ref={ref} className="crm-grid-scroll" role="region" aria-label="Opportunity List — scroll for all columns" tabIndex={0} onScroll={e => { scroll.save(e.currentTarget.scrollTop, e.currentTarget.scrollLeft); }}>
    <table className="crm-grid">
      <caption>Permitted opportunities on this page · {data.items.length} rows · {data.sort} order</caption>
      <thead><tr><th scope="col">Opportunity</th><th scope="col">Opportunity owner</th><th scope="col">Stage / outcome</th><th scope="col">Next action / action owner</th><th scope="col">Saved record</th></tr></thead>
      <tbody>{data.items.map((item) => <tr key={item.id} data-opportunity-id={item.id}>
        <th scope="row"><Identity item={item} /></th>
        <td>{item.owner_name}<p className="crm-grid-secondary">{item.company_name}</p></td>
        <td><Status value={item.stage_id} /><p>Outcome: {item.close_outcome}</p><small>Stage entered <Stamp value={item.stage_entered_at} /></small></td>
        <td><Action item={item} /></td>
        <td>Saved · version {item.version}<p><Stamp value={item.updated_at} /></p></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function SalesWorklist() {
  const p = useIdentity();
  const [dialog,setDialog]=useState<{id:string;mode:"snapshot"|"stage";stage?:string;undo?:StageUndo}|null>(null),[undo,setUndo]=useState<StageUndo|null>(null),[feedback,setFeedback]=useState("");

  const [filters, setFilters] = useState(initial);
  const boardScroll = useScrollMemory(), gridScroll = useScrollMemory();
  const [view, setView] = useState<"Board" | "Grid">("Board");
  const [selected, setSelected] = useState("Enquiry");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const data = useCrmResource<Results>(`crm/opportunities?${query(filters)}`, true);
  // Clear query text, selected IDs and option-search components after current access is denied.
  const isDenied = denied(data.error);
  useEffect(() => {
    if (!isDenied) return;
    let live = true;
    queueMicrotask(() => { if (live) { setFilters(initial);setFeedback("");setUndo(null);setDialog(null); } });
    return () => { live = false; };
  }, [isDenied]);
  const change = (key: keyof typeof initial, value: string) => setFilters((old) => ({ ...old, [key]: value, cursor: "", ...(key === "company_id" ? { site_id: "" } : {}) }));
  const saved=(receipt:OperationReceipt,old:DealRecord,stage:boolean)=>{setDialog(null);if(stage){setUndo({id:old.id,version:receipt.record_version,stage_id:old.stage_id,qualification_note:old.qualification_note,identification_activity_id:old.identification_activity_id});setFeedback(`${old.title} moved to ${receipt.state}.`);}setFilters(old=>({...old,cursor:""}));data.reload();};
  const refresh = () => { setFilters((old) => ({ ...old, cursor: "" })); data.reload(); };
  const totals = data.data ? valueSummary(data.data.items) : null;
  return <section className="crm-workspace" aria-label="Sales worklist">
    <h1 className="sr-only">Sales worklist</h1>
    <HeaderContent slot="search">{!isDenied && <label className="crm-header-search"><ProductIcon name="search"/><span className="sr-only">Search opportunities</span><input name="sales-search" type="search" placeholder="Search opportunities" value={filters.q} onChange={e => change("q", e.target.value)}/></label>}</HeaderContent>
    <div className="crm-toolbar"><div className="crm-view-controls" role="group" aria-label="Opportunity presentation">
      {(["Board", "Grid"] as const).map((value) => <button key={value} className={view === value ? "" : "secondary"} aria-pressed={view === value} onClick={() => setView(value)}><ProductIcon name={value === "Board" ? "board" : "list"} />{value === "Grid" ? "List" : value}</button>)}
    </div>
    {!data.error && data.data?.can_create && <Link className="primary-link crm-new-opportunity" href="/crm/opportunities/new" aria-label="New opportunity"><ProductIcon name="plus" />Opportunity</Link>}
    {!isDenied && <>
      <span className="crm-pipeline-label"><ProductIcon name="sales"/>Sales pipeline</span>
      <button className="secondary crm-filter-toggle" aria-expanded={filtersOpen} aria-controls="crm-filter-panel" onClick={() => setFiltersOpen(!filtersOpen)}><ProductIcon name="filter" /><span>Filters<span className="sr-only"> and sort</span></span></button>
      <label className="crm-sort"><span className="sr-only">Sort</span><select aria-label="Sort" value={filters.sort} onChange={e => change("sort", e.target.value)}><option value="Reference">Reference order</option><option value="Title">Title A–Z</option><option value="Newest">Newest first</option></select></label>
    </>}
    </div>
    {!isDenied && <>
      <section id="crm-filter-panel" className="crm-secondary-filters" aria-label="Opportunity filters" hidden={!filtersOpen}>
        <div className="crm-filter-grid">
          {(["Company", "Site", "Owner"] as const).map((kind) => <FilterPicker key={kind} kind={kind} value={filters[kind === "Company" ? "company_id" : kind === "Site" ? "site_id" : "owner_id"]} company={filters.company_id} enabled={!data.error} set={(v) => change(kind === "Company" ? "company_id" : kind === "Site" ? "site_id" : "owner_id", v)} />)}
          <SelectField name="next-state" label="Next action" value={filters.next_action} onChange={(v) => change("next_action", v)} options={Object.entries(labels).map(([id, display_name]) => ({ id, display_name }))} empty="All action states" />
          <SelectField name="stage" label="Stage" value={filters.stage_id} onChange={(v) => { change("stage_id", v); if (v) setSelected(v); }} options={(data.data?.stages ?? []).map((s) => ({ id: s.stage_id, display_name: s.stage_id }))} empty="All stages" />
          <label className="field">Page size<select aria-label="Page size" value={filters.limit} onChange={(e) => change("limit", e.target.value)}><option value="10">10 records</option><option value="25">25 records</option><option value="50">50 records</option></select></label>
          <label className="crm-check"><input type="checkbox" checked={filters.owner_id === p.actor_id} onChange={(e) => change("owner_id", e.target.checked ? p.actor_id : "")} />Owned by me</label>
        </div>
        <button className="secondary" onClick={() => setFilters(initial)}>Clear filters</button>
      </section>
    </>}
    {feedback&&!isDenied&&<div className="crm-change-feedback" role="status"><span>{feedback}</span>{undo&&<button className="secondary" onClick={()=>setDialog({id:undo.id,mode:"stage",undo})}>Undo stage move</button>}<button className="secondary" onClick={()=>{setFeedback("");setUndo(null);}}>Dismiss</button></div>}
    {dialog&&!isDenied&&<DealDialog id={dialog.id} mode={dialog.mode} targetStage={dialog.stage} undo={dialog.undo} onClose={()=>setDialog(null)} onSaved={saved}/>}
    <ErrorNotice error={data.error} />
    {data.loading && <p role="status">Loading permitted sales records…</p>}
    {data.error != null && <button className="secondary" onClick={refresh}>Try loading again</button>}
    {!data.error && data.data && <>
      <div className="source-stamp crm-worklist-stamp"><strong>{data.data.items.length} {data.data.items.length === 1 ? "opportunity" : "opportunities"}{data.data.completeness === "Complete" ? "" : " on this page"}</strong><span>{totals?.formatted} known{totals?.unknown ? ` · ${totals.unknown} not estimated` : ""}</span><span className="crm-summary-basis">Open · AUD, excl. GST</span></div>
      {view === "Board" ? <>
        <div className="crm-stage-navigation" role="group" aria-label="Choose Board stage">{data.data.stages.map((stage) => <button key={stage.stage_id} aria-pressed={selected === stage.stage_id} className={selected === stage.stage_id ? "" : "secondary"} onClick={() => setSelected(stage.stage_id)}>{stage.stage_id} ({stage.count})</button>)}</div>
        <Board data={data.data} selected={selected} scroll={boardScroll} onOpen={id=>setDialog({id,mode:"snapshot"})} onMove={(id,stage)=>setDialog({id,mode:"stage",stage})} />
      </> : <Grid data={data.data} scroll={gridScroll} />}
      <div className="crm-actions"><span className="crm-page-context">{data.data.completeness === "Complete" ? "All matching results" : data.data.window.has_more ? "Page counts and values · more pages" : "Page counts and values · final page"} · As at <Stamp value={data.data.window.as_of} /></span><button className="secondary" onClick={refresh}>Refresh from start</button>{data.data.next_cursor && <button onClick={() => setFilters((old) => ({ ...old, cursor: data.data!.next_cursor! }))}>Next page</button>}</div>

    </>}
  </section>;
}
