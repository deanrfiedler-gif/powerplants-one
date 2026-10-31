"use client";
import Link from "next/link";
import { PipelineInsights } from "./crm-insights";
import { AddDealDialog } from "./crm-add-deal";
import { DealSelection } from "./crm-worklist-selection";
import { defaultDealColumns, selectedDeals, selectedWorklistCsv, selectionBasis, type DealColumnId } from "../crm/worklist-columns";
import { usePhoneHeader } from "../shell/phone-header";
import { initialWorklistFilters as initial } from "../crm/worklist-location";
import { useWorklistLocation } from "./crm-worklist-location";
import { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from "react";
import { DealDialog, stageRequiresEvidence, type DealRecord, type StageUndo } from "./crm-deal-controls";
import type { OperationReceipt } from "../platform/operations";
import { ProductIcon } from "./product-icons";
import { Board, Grid } from "./crm-worklist-board";
import { ForecastWorklist, WorklistChoice, WorklistMenu, WorklistPanel, WorklistReview, WorklistViews } from "./crm-worklist-tools";
import { needsAttention, worklistCsv } from "../crm/worklist-presentation";
import { valueSummary } from "../crm/value-summary";
import type { listOpportunities, worklistOptions, WorklistItem } from "../crm/worklist";
import { useIdentity } from "./business-session";
import { api, ErrorNotice, Field, SelectField, Stamp } from "./business-ui";
import { denied, useCrmCommand, useCrmResource } from "./crm-state";

type Results = Awaited<ReturnType<typeof listOpportunities>>;
const labels = { Needed: "Next action needed", DueNeeded: "Due date needed", Overdue: "Overdue", Upcoming: "Upcoming", Unavailable: "Next action unavailable" };
const query = (fields: Record<string, string>) => new URLSearchParams(Object.entries(fields).filter(([, value]) => value)).toString();

function FilterPicker({ kind, value, company, set, enabled }: { kind: "Company" | "Site" | "Owner"; value: string; company: string; set: (value: string) => void; enabled: boolean }) {
  const [q, setQ] = useState("");
  const data = useCrmResource<Awaited<ReturnType<typeof worklistOptions>>>(enabled ? `crm/worklist-options?${query({ kind, company_id: kind === "Company" ? "" : company, q, limit: "50" })}` : null, true);
  return <div className="crm-filter-picker">
    <Field name={`filter-${kind}-search`} label={`Find ${kind.toLowerCase()} filter`} value={q} onChange={setQ} />
    <SelectField name={`filter-${kind}`} label={kind === "Owner" ? "Deal owner" : kind} value={value} onChange={set} options={data.data?.items ?? []} empty={data.loading ? "Loading permitted options…" : `All permitted ${kind === "Company" ? "companies" : kind === "Site" ? "sites" : "owners"}`} />
    <ErrorNotice error={data.error} />
    {data.data?.next_cursor && <small>More options exist. Refine this filter search.</small>}
  </div>;
}
function ActivitySnapshot({ item, onClose }: { item: WorklistItem; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const active = ["Upcoming", "Overdue", "DueNeeded"].includes(item.next_action_state);
  return <dialog ref={ref} className="crm-dialog" aria-labelledby="crm-activity-title" onClose={onClose} onCancel={onClose}>
    <header className="crm-dialog-head"><h2 id="crm-activity-title">{active ? item.next_action_summary : labels[item.next_action_state]}</h2></header>
    <div className="crm-dialog-scroll">
      <p className="crm-snapshot-caption">Next activity for {item.title}</p>
      <dl className="crm-snapshot-grid">
        <div><dt>Status</dt><dd>{labels[item.next_action_state]}</dd></div>
        <div><dt>Activity owner</dt><dd>{item.action_owner_name ?? "Not assigned"}</dd></div>
        <div><dt>Due</dt><dd>{item.due_at ? <Stamp value={item.due_at} /> : "Not set"}</dd></div>
        <div><dt>Organisation</dt><dd>{item.organisation_name}</dd></div>
      </dl>
    </div>
    <footer className="crm-dialog-footer">
      <button className="secondary" onClick={() => ref.current?.close()}>Close</button>
      <Link className="primary-link" href={active && item.next_action_id ? `/work/${item.next_action_id}` : `/sales/opportunities/${item.id}?section=timeline&activity=new`}>
        {active ? "Open full activity" : "Plan an activity"}
      </Link>
    </footer>
  </dialog>;
}
function useScrollMemory() {
  const position = useRef({ top: 0, left: 0 });
  const read = useCallback(() => position.current, []);
  const save = useCallback((top: number, left: number) => { position.current = { top, left }; }, []);
  // Restore only when the scroll surface mounts, not after every parent render:
  // that would race the scroll event from keyboard focus return after a save.
  return useMemo(() => ({ read, save }), [read, save]);
}
export function SalesWorklist() {
  const p = useIdentity();
  const [dialog,setDialog]=useState<{id:string;mode:"snapshot"|"stage"|"information"|"outcome";stage?:string;outcome?:"Won"|"Lost";undo?:StageUndo}|null>(null),[feedback,setFeedback]=useState("");
  const [moved,setMoved]=useState<Record<string,string>>({});
  // One undo for both save paths. `record` is present only when the dialog saved
  // the move, because only the dialog reads the qualification fields the worklist
  // does not return; without it an undo has to reopen the dialog.
  const [undoMove,setUndoMove]=useState<{id:string;to:string;record?:StageUndo}|null>(null);
  const [focusAfterSave, setFocusAfterSave] = useState<{id:string;version:number}|null>(null);
  const [activity,setActivity]=useState<WorklistItem|null>(null);

  const { filters, setFilters, view, setView, selected, setSelected, clear: clearLocation } = useWorklistLocation();
  const boardScroll = useScrollMemory(), gridScroll = useScrollMemory();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [review, setReview] = useState<"triage" | "changes" | "help" | null>(null);
  const [density, setDensity] = useState("comfortable");
  const [insights,setInsights] = useState(false);
  const data = useCrmResource<Results>(`crm/opportunities?${query(filters)}`, true);
  const [columns, setColumns] = useState<DealColumnId[]>([...defaultDealColumns]);
  const [selection, setSelection] = useState<{basis:string;ids:string[]}>({basis:"",ids:[]});
  const [selecting,setSelecting] = useState(false), [sequence,setSequence] = useState<number|null>(null);
  const [adding,setAdding] = useState(false), [phoneViews,setPhoneViews] = useState(false);
  const [exporting,setExporting] = useState(false), [exportError,setExportError] = useState<unknown>(null);
  const [won,setWon] = useState<{id:string;title:string}|null>(null);
  const requestPath = `crm/opportunities?${query(filters)}`;
  const resultBasis = p.actor_id + requestPath + (data.data && !data.error ? selectionBasis(data.data.items) : "");
  const currentBasis = useRef(resultBasis);
  useLayoutEffect(() => { currentBasis.current = resultBasis; },[resultBasis]);
  const selectedIds = selection.basis === resultBasis ? selection.ids : [];
  const selectedItems = selectedDeals(data.data?.items ?? [],selectedIds);
  const setSelectedIds = (ids:string[]) => {setSelection({basis:resultBasis,ids}); setSequence(null);};
  useEffect(() => {
    if (selection.basis === resultBasis || !selection.ids.length) return;
    queueMicrotask(() => {setSelection({basis:"",ids:[]});setSequence(null);setDialog(null);});
  },[resultBasis,selection.basis,selection.ids.length]);
  // On acceptance drop the optimistic override and let the server be the truth.
  // The undo target is kept: it is what the actor reverses after a move lands.
  const stageCommand = useCrmCommand((receipt) => { setFeedback(`Stage saved: ${receipt.state}.`); setMoved({}); setFilters(o => ({ ...o, cursor: "" })); data.reload(); }, "No unsaved changes");

  // Clear query text, selected IDs and option-search components after current access is denied.
  const isDenied = denied(data.error);
  useEffect(() => {
    if (!isDenied) return;
    let live = true;
    queueMicrotask(() => { if (live) { clearLocation();setFeedback("");setUndoMove(null);setMoved({});setDialog(null);setActivity(null);setFiltersOpen(false);setReview(null);setAdding(false);setWon(null);setSelectedIds([]);setSelecting(false);setExportError(null); } });
    return () => { live = false; };
  }, [isDenied, clearLocation]);
  useEffect(() => {
    if (!focusAfterSave || dialog || !data.data?.items.some(i => i.id === focusAfterSave.id && i.version >= focusAfterSave.version)) return;
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLButtonElement>(`[data-opportunity-id="${focusAfterSave.id}"] .crm-card-stage`);
      target?.scrollIntoView({ block: "center", inline: "nearest" });
      target?.focus({ preventScroll: true });
      setFocusAfterSave(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusAfterSave, dialog, data.data]);
  const change = (key: keyof typeof initial, value: string) => setFilters((old) => ({ ...old, [key]: value, cursor: "", ...(key === "company_id" ? { site_id: "" } : {}) }));
  // Past tense here, unlike the board: the dialog has the receipt in hand, and it
  // holds the saved record, so its undo can restore the exact previous stage and
  // qualification rather than asking for them again.
  const saved=(receipt:OperationReceipt,old:DealRecord,stage:boolean)=>{setDialog(null);setMoved({});if(stage){stageCommand.clearError();setSelected(receipt.state);setFocusAfterSave({id:old.id,version:receipt.record_version});setUndoMove({id:old.id,to:old.stage_id,record:{id:old.id,version:receipt.record_version,stage_id:old.stage_id,qualification_note:old.qualification_note,identification_activity_id:old.identification_activity_id}});setFeedback(`${old.title} moved to ${receipt.state}.`);}else if(receipt.state === "Won"){setWon({id:old.id,title:old.title});setFeedback("");}else{setFeedback(`${old.title}: ${receipt.state} saved.`);}setFilters(old=>({...old,cursor:""}));data.reload();};
  const refresh = () => { setFilters((old) => ({ ...old, cursor: "" })); data.reload(); };
  const scopedSearch = !isDenied && <label className="crm-header-search"><ProductIcon name="search"/><span className="sr-only">Search deals</span><input name="sales-search" type="search" placeholder="Search deals" value={filters.q} onChange={e => change("q", e.target.value)}/></label>;
  const stageIds: string[] = data.data?.stages.map(s => s.stage_id) ?? [];
  // Never assume a stage name: fall back to the first stage the server returns.
  const activeStage = stageIds.includes(selected) ? selected : (stageIds[0] ?? "");
  // Apply the pending drag move so the card appears in its new column at once —
  // but a refused or uncertain save must not leave a card sitting in a column the
  // server never confirmed, so the placement is dropped as soon as the command
  // reports an error. The status line and the error then carry the outcome.
  const pendingMove: Record<string, string> = stageCommand.error ? {} : moved;
  const boardData = data.data && Object.keys(pendingMove).length
    ? (() => {
        const items = data.data.items.map(i => pendingMove[i.id] ? { ...i, stage_id: pendingMove[i.id] as typeof i.stage_id } : i);
        return { ...data.data, items, stages: data.data.stages.map(st => ({ ...st, count: items.filter(i => i.stage_id === st.stage_id).length })) };
      })()
    : data.data;
  // A drop into a stage the server requires evidence for is an instruction to
  // begin that transition, not to complete it: the dialog opens on the target
  // stage so the qualification outcome is still captured. Every other drop is
  // the whole instruction and saves directly, on the same endpoint, operation id
  // and version check the dialog uses. Its status is shown rather than assumed,
  // so nothing claims to be saved before the server says so.
  const move = (id: string, stage: string) => {
    const old = boardData?.items.find(x => x.id === id);
    if (stageCommand.busy || stageCommand.uncertain || !old || old.stage_id === stage || !old.can_edit || old.close_outcome !== "Open") return;
    if (stageRequiresEvidence(stage)) { setDialog({ id, mode: "stage", stage }); return; }
    setMoved({ [id]: stage });
    setFeedback(`${old.title}: moving to ${stage}.`);
    setUndoMove({ id, to: old.stage_id });
    void stageCommand.send(`crm/opportunities/${id}/stage`, {
      expected_version: old.version,
      stage_id: stage,
      qualification_note: null,
      identification_activity_id: null,
      reason: "Move on the board",
    });
  };
  // Reopen the dialog when the dialog saved the original — it holds the exact
  // qualification to restore — and when the reverse move itself needs evidence
  // the board cannot reproduce. Otherwise reverse it directly.
  const undoLastMove = () => {
    if (!undoMove || stageCommand.busy || stageCommand.uncertain) return;
    // A definite refusal created no movement. Do this before reopening a
    // qualification dialog: undo must not manufacture a replacement command.
    if (stageCommand.error) { setUndoMove(null); setMoved({}); return; }
    const { id, to, record } = undoMove;
    if (record) { setDialog({ id, mode: "stage", undo: record }); return; }
    if (stageRequiresEvidence(to)) { setDialog({ id, mode: "stage", stage: to }); return; }
    const old = data.data?.items.find(x => x.id === id);
    if (!old) return;
    // A refused move never left the original stage; there is nothing to reverse.
    if (old.stage_id === to) { setUndoMove(null); return; }
    setMoved({ [id]: to });
    setFeedback(`${old.title}: moving back to ${to}.`);
    setUndoMove(null);
    stageCommand.clearError();
    void stageCommand.send(`crm/opportunities/${id}/stage`, {
      expected_version: old.version,
      stage_id: to,
      qualification_note: null,
      identification_activity_id: null,
      reason: "Undo the previous stage move",
    });
  };
  const totals = data.data ? valueSummary(data.data.items) : null;
  const ready = !data.error && !!data.data;
  const activeFilters = (["q", "company_id", "site_id", "owner_id", "stage_id", "next_action"] as const).filter(key => filters[key]);
  const filterLabel = (key: typeof activeFilters[number]) => ({ q: "Search", company_id: "Company", site_id: "Site", owner_id: "Owner", stage_id: "Stage", next_action: "Activity" })[key];
  const choosePipeline = (value:string) => {
    setFilters(old => ({...old,pipeline_definition_id:value,stage_id:"",cursor:""}),"push");
    setSelected("");setMoved({});setUndoMove(null);setFeedback("");
  };
  const exportDeals = async (onlySelected:boolean) => {
    if (!ready || !data.data || exporting || (onlySelected && !selectedIds.length)) return;
    const basis = resultBasis, ids = onlySelected ? [...selectedIds] : data.data.items.map(item => item.id);
    const visibleColumns = [...columns];
    setExporting(true);setExportError(null);
    try {
      const fresh = await api<Results>(requestPath);
      if (currentBasis.current !== basis || p.actor_id + requestPath + selectionBasis(fresh.items) !== basis) {
        setSelectedIds([]); data.reload();
        setExportError({message:"The permitted result page changed. Review the refreshed page and select again before exporting."});
        return;
      }
      const url = URL.createObjectURL(new Blob([onlySelected ? selectedWorklistCsv(fresh.items,ids,visibleColumns) : worklistCsv(fresh.items)],{type:"text/csv;charset=utf-8"}));
      const link = document.createElement("a"); link.href=url;link.download=onlySelected ? "PPO-Deals-selected-list.csv" : "PPO-Deals-current-page.csv";link.click();
      setTimeout(() => URL.revokeObjectURL(url),1000);
    } catch(error) {setExportError(error);setSelectedIds([]);data.reload();}
    finally {setExporting(false);}
  };
  const openSequence = () => {if(selectedItems.length){setSequence(0);setDialog({id:selectedItems[0].id,mode:"snapshot"});}};
  usePhoneHeader(isDenied ? null : {
    title:view === "Grid" ? "Deals" : `Deals · ${view}`,
    count:ready ? `${data.data!.items.length}${data.data!.completeness === "Complete" ? "" : " on page"}` : "—",
    chooseView:{open:()=>setPhoneViews(true),expanded:phoneViews},
    pageAction:{label:"Search deals",icon:"search",search:true,onSelect:()=>setFiltersOpen(true)},
    filter:{open:()=>setFiltersOpen(true),applied:!!activeFilters.length,searchAndFilter:()=>setFiltersOpen(true)}
  });
  return <section id="ppo-deals" data-module-layout="full-bleed" className="crm-workspace crm-r38 crm-accepted" aria-label="Sales worklist" data-density={density}>
    <h1 className="sr-only">Sales worklist</h1>
    <div className="crm-toolbar crm-toolbar-accepted">
      <div className="crm-view-controls" role="group" aria-label="Deal presentation">
        {(["Board", "Grid", "Forecast"] as const).map(value => <button key={value} className="secondary" aria-pressed={view === value} onClick={() => setView(value)}><ProductIcon name={value === "Board" ? "board" : value === "Grid" ? "list" : "insights"}/><span>{value === "Grid" ? "List" : value}</span></button>)}
      </div>
      <button className="secondary crm-archive-button" aria-pressed={view === "Archive"} onClick={() => setView("Archive")}><ProductIcon name="archive"/><span>Archive</span></button>
      {ready && data.data?.can_create && <button className="crm-new-opportunity" onClick={() => setAdding(true)} aria-label="Add deal"><ProductIcon name="plus"/>Deal</button>}
      {!isDenied && <>
        <WorklistMenu label="Deal actions" icon="more" className="crm-icon-button">
          <button className="secondary crm-menu-choice" data-menu-close disabled={!ready || exporting} onClick={() => void exportDeals(false)}><ProductIcon name="download"/>Export current page as CSV</button>
          <button className="secondary crm-menu-choice" data-menu-close onClick={refresh}>Refresh from start</button>
          <button className="secondary crm-menu-choice" data-menu-close onClick={() => setReview("changes")}>What changed</button>
          <button className="secondary crm-menu-choice" data-menu-close onClick={() => setReview("help")}>Help</button>
          <label className="field">Pipeline<select value={filters.pipeline_definition_id} disabled={stageCommand.busy || stageCommand.uncertain} onChange={e => choosePipeline(e.target.value)}>{data.data?.pipelines.map(pipeline => <option key={pipeline.id} value={pipeline.id}>{pipeline.display_name}</option>)}</select></label>
          <Link href="/sales/opportunities/new" className="crm-menu-choice">Open Add deal page</Link>
          <p>Pipeline settings and rotting rules remain proposals. Import, bulk cleanup and restoration are unavailable.</p>
        </WorklistMenu>
        <WorklistViews key={filters.pipeline_definition_id + (view === "Archive" ? "archive" : "open")} filters={filters} actor={p.actor_id} setFilters={value => setFilters(value, "push")}/>
        <WorklistMenu label="View options" icon="settings" className="crm-icon-button">
          <button className="secondary crm-menu-choice" onClick={() => setDensity(old => old === "comfortable" ? "compact" : "comfortable")}>Density: {density}</button>
          <label className="field">Sort<select value={filters.sort} onChange={e => change("sort", e.target.value)}><option value="Reference">Default order</option><option value="Title">Title A–Z</option><option value="Newest">Newest first</option></select></label>
          <Link className="crm-menu-choice" href="/work">My activities</Link><Link className="crm-menu-choice" href="/sales/leads">Leads</Link>
          <p>Collapse a Board stage through its header menu. Resize List columns using a divider or its arrow keys.</p>
        </WorklistMenu>
        <button className="secondary crm-icon-button crm-desktop-review" aria-label="What changed" disabled={!ready} onClick={() => setReview("changes")}><ProductIcon name="changes"/></button>
        <button className="secondary crm-triage-button" disabled={!ready || view === "Archive"} onClick={() => setReview("triage")}><ProductIcon name="pulse"/>Triage{data.data?.items.filter(needsAttention).length ? <small>{data.data.items.filter(needsAttention).length}</small> : null}</button>
        <div className="crm-toolbar-spacer"/>
        <WorklistChoice label="Pipeline" icon="sales" className="crm-pipeline-picker" disabled={stageCommand.busy || stageCommand.uncertain} value={filters.pipeline_definition_id} onChange={choosePipeline} options={data.data?.pipelines.map(pipeline => ({id:pipeline.id,label:pipeline.display_name})) ?? []}/>
        <button className="secondary crm-icon-button crm-desktop-help" aria-label="Help" onClick={() => setReview("help")}><ProductIcon name="help"/></button>
        <button className="secondary crm-filter-toggle" aria-label="Filters and sort" aria-expanded={filtersOpen} aria-controls="crm-filter-panel" onClick={() => setFiltersOpen(true)}><ProductIcon name="filter"/><span>Filters{activeFilters.length ? ` ${activeFilters.length}` : ""}</span></button>
      </>}
    </div>
    {!isDenied && activeFilters.length > 0 && <div className="crm-condition-chips" aria-label="Active filter conditions">{activeFilters.map(key => <button className="secondary" key={key} title={filters[key]} aria-label={`Remove ${filterLabel(key)} condition`} onClick={() => change(key, "")}><span>{filterLabel(key)}{["q", "stage_id", "next_action"].includes(key) ? `: ${filters[key]}` : ""}</span><ProductIcon name="close"/></button>)}</div>}
    {filtersOpen && !isDenied && <WorklistPanel title="Filter deals" drawer onClose={() => setFiltersOpen(false)}><section id="crm-filter-panel" className="crm-secondary-filters" aria-label="Deal filters"><div className="crm-filter-grid">
      {scopedSearch}
      {(["Company", "Site", "Owner"] as const).map(kind => <FilterPicker key={kind} kind={kind} value={filters[kind === "Company" ? "company_id" : kind === "Site" ? "site_id" : "owner_id"]} company={filters.company_id} enabled={!data.error} set={v => change(kind === "Company" ? "company_id" : kind === "Site" ? "site_id" : "owner_id", v)}/>)}
      <label className="field">Sales outcome<select aria-label="Sales outcome" value={filters.outcome} onChange={e => change("outcome", e.target.value)}>{(view === "Archive" ? ["Closed", "Won", "Lost"] : ["Open", "Won", "Lost", "All"]).map(value => <option key={value} value={value}>{value === "Closed" ? "Won and Lost" : value}</option>)}</select></label>
      <SelectField name="next-state" label="Next action" value={filters.next_action} onChange={v => change("next_action", v)} options={Object.entries(labels).map(([id, display_name]) => ({ id, display_name }))} empty="All action states"/>
      <SelectField name="stage" label="Stage" value={filters.stage_id} onChange={v => { change("stage_id", v); if (v) setSelected(v); }} options={(data.data?.stages ?? []).map(stage => ({ id: stage.stage_id, display_name: stage.stage_id }))} empty="All stages"/>
      <label className="field">Sort<select aria-label="Sort" value={filters.sort} onChange={e => change("sort", e.target.value)}><option value="Reference">Default order</option><option value="Title">Title A–Z</option><option value="Newest">Newest first</option></select></label><label className="field">Page size<select aria-label="Page size" value={filters.limit} onChange={e => change("limit", e.target.value)}><option value="10">10 records</option><option value="25">25 records</option><option value="50">50 records</option></select></label><label className="crm-check"><input type="checkbox" checked={filters.owner_id === p.actor_id} onChange={e => change("owner_id", e.target.checked ? p.actor_id : "")}/>Owned by me</label>
    </div><button className="secondary" onClick={() => setFilters(old => ({ ...initial, pipeline_definition_id: old.pipeline_definition_id, outcome: view === "Archive" ? "Closed" : "Open" }))}>Clear filters</button></section></WorklistPanel>}
    {phoneViews && !isDenied && <WorklistPanel title="Choose Deals view" onClose={()=>setPhoneViews(false)}>
      <div className="crm-phone-view-choices">{(["Board","Grid","Forecast","Archive"] as const).map(value=><button className="secondary" key={value} aria-pressed={view===value} onClick={()=>{setView(value);setPhoneViews(false);}}>{value==="Grid"?"List":value}</button>)}
      <button className="secondary" onClick={()=>{setView("Grid");setSelecting(true);setPhoneViews(false);}}>Select deals in List</button><button className="secondary" onClick={()=>{setReview("triage");setPhoneViews(false);}}>Triage</button><button className="secondary" onClick={()=>{setReview("changes");setPhoneViews(false);}}>What changed</button><button className="secondary" onClick={()=>{setReview("help");setPhoneViews(false);}}>Help</button>
      <label className="field">Pipeline<select value={filters.pipeline_definition_id} disabled={stageCommand.busy||stageCommand.uncertain} onChange={e=>choosePipeline(e.target.value)}>{data.data?.pipelines.map(pipeline=><option key={pipeline.id} value={pipeline.id}>{pipeline.display_name}</option>)}</select></label></div>
    </WorklistPanel>}
    {adding && !isDenied && <AddDealDialog onClose={()=>setAdding(false)} onSaved={receipt=>{setAdding(false);refresh();setDialog({id:receipt.record_id,mode:"snapshot"});setFeedback("Deal and initial activity saved.");}}/>}
    {selectedItems.length>0 && sequence===null && !dialog && !isDenied && <DealSelection items={selectedItems} busy={exporting} onClose={()=>{setSelectedIds([]);setSelecting(false);}} onOpen={openSequence} onExport={()=>void exportDeals(true)}/>}
    {selecting && !selectedItems.length && <div className="crm-selection-hint">Select deals on this page.<button className="secondary" onClick={()=>setSelecting(false)}>Cancel selection</button></div>}
    <ErrorNotice error={exportError}/>
    {exporting && <p role="status">Checking current access and saved values before export…</p>}
    {won && !isDenied && <div className="crm-won-feedback" role="status"><ProductIcon name="check"/><div><strong>Won recorded · {won.title}</strong><p>Prepare the receiving handover. The receiving owner must explicitly accept it before delivery work is authorised.</p></div><Link className="primary-link" href={`/sales/handoffs/won?opportunity_id=${won.id}`}>Open receiving handover</Link><button className="secondary" onClick={()=>{setView("Archive");setWon(null);}}>Open Archive</button><button className="secondary" aria-label="Dismiss Won confirmation" onClick={()=>setWon(null)}><ProductIcon name="close"/></button></div>}
    {insights && !isDenied && data.data && <WorklistPanel title="Pipeline insights" onClose={()=>setInsights(false)}><PipelineInsights data={data.data}/></WorklistPanel>}
    {review && !isDenied && <WorklistReview kind={review} items={data.data?.items ?? []} asOf={data.data?.window.as_of ?? new Date().toISOString()} onClose={() => setReview(null)} onOpen={id => setDialog({ id, mode: "snapshot" })}/>}
    {feedback&&!isDenied&&<div className="crm-change-feedback" data-refused={!!stageCommand.error} role="status"><span>{feedback}</span><span className="crm-save-status">{undoMove?.record ? "Saved to the server" : stageCommand.status}</span><ErrorNotice error={stageCommand.error} />{stageCommand.uncertain&&<button disabled={stageCommand.busy} onClick={()=>void stageCommand.reconcile()}>Confirm original save outcome</button>}{!!stageCommand.error&&!stageCommand.uncertain&&<button className="secondary" onClick={()=>{setMoved({});refresh();}}>Load current saved version for comparison</button>}{undoMove&&!stageCommand.error&&<button className="secondary" disabled={stageCommand.busy||stageCommand.uncertain} onClick={undoLastMove}>Undo stage move</button>}<button className="secondary" disabled={stageCommand.busy||stageCommand.uncertain} onClick={()=>{setFeedback("");setUndoMove(null);}}>Dismiss</button></div>}
    {activity&&!isDenied&&<ActivitySnapshot item={activity} onClose={()=>setActivity(null)}/>}
    {dialog&&!isDenied&&<DealDialog key={dialog.id + dialog.mode} id={dialog.id} mode={dialog.mode} targetStage={dialog.stage} targetOutcome={dialog.outcome} undo={dialog.undo} onClose={()=>{setDialog(null);setSequence(null);}} sequence={sequence!==null && selectedItems.length ? {position:sequence+1,total:selectedItems.length,onPrevious:sequence>0?()=>{setSequence(sequence-1);setDialog({id:selectedItems[sequence-1].id,mode:"snapshot"});}:undefined,onNext:sequence<selectedItems.length-1?()=>{setSequence(sequence+1);setDialog({id:selectedItems[sequence+1].id,mode:"snapshot"});}:undefined}:undefined} onSaved={saved}/>}
    <ErrorNotice error={data.error} />
    {data.loading && <p role="status">Loading permitted sales records…</p>}
    {data.error != null && <button className="secondary" onClick={refresh}>Try loading again</button>}
    {!data.error && data.data && <>
      <div className="crm-workspace-status"><span><strong>{filters.outcome === "Open" ? "Open value" : "Known value"} {totals?.formatted}</strong>{totals?.unknown ? ` · ${totals.unknown} not estimated` : ""}</span><button className="crm-attention-link" disabled={!data.data.items.some(needsAttention)} onClick={()=>setReview("triage")}>{data.data.items.filter(needsAttention).length} need attention</button><span className="crm-status-spacer"/><span>{data.data.items.length} deals · {data.data.completeness === "Complete" ? "all matching" : "this page"} · AUD excl. GST</span><button className="crm-insights-link" onClick={()=>setInsights(true)}>Pipeline insights <ProductIcon name="insights"/></button></div>
      {!data.data.items.length && <div className="crm-workspace-empty"><h2>{activeFilters.length ? "No deals match these filters" : view === "Archive" ? "No closed deals" : "No deals yet"}</h2><p>{activeFilters.length ? "Adjust your search or clear filters to see other permitted deals." : "Start with a qualified lead or add a deal and its initial activity."}</p>{!activeFilters.length&&view!=="Archive"&&<p><Link href="/sales/leads">Open Leads</Link>{data.data.can_create&&<button onClick={()=>setAdding(true)}>Add deal</button>}</p>{activeFilters.length>0 && <button className="secondary" onClick={()=>setFilters(old=>({...initial,pipeline_definition_id:old.pipeline_definition_id,outcome:view==="Archive"?"Closed":"Open"}))}>Clear filters</button>}</div>}
      {view === "Board" ? <>
        <div className="crm-stage-navigation" role="group" aria-label="Choose Board stage">{data.data.stages.map((stage) => <button key={stage.stage_id} aria-pressed={activeStage === stage.stage_id} className={activeStage === stage.stage_id ? "" : "secondary"} onClick={() => setSelected(stage.stage_id, "push")}>{stage.stage_id} ({stage.count})</button>)}</div>
        <Board data={boardData!} selected={activeStage} scroll={boardScroll} onOpen={id=>{if(!stageCommand.busy&&!stageCommand.uncertain)setDialog({id,mode:"snapshot"});}} onStage={id=>setDialog({id,mode:"stage"})} blocked={stageCommand.busy||stageCommand.uncertain} onMove={move} onActivity={setActivity} onEdit={id => setDialog({id, mode:"information"})} onOutcome={(id, outcome) => setDialog({id, mode:"outcome", outcome})} />
      </> : view === "Forecast" ? <ForecastWorklist items={data.data.items} asOf={data.data.window.as_of} stages={data.data.stages.map(stage=>stage.stage_id)} complete={data.data.completeness === "Complete"} onEdit={id => setDialog({ id, mode: "information" })}/> : <>{view === "Archive" && <div className="crm-archive-intro"><h2>Archive</h2><div role="group" aria-label="Archive status">{["Closed", "Won", "Lost"].map(value => <button className="secondary" key={value} aria-pressed={filters.outcome === value} onClick={() => change("outcome", value)}>{value === "Closed" ? "All closed" : value}</button>)}</div><p>Saved sales outcomes. Manual archiving and restoration are not yet available.</p></div>}<Grid data={data.data} scroll={gridScroll} columns={columns} onColumnsChange={setColumns} selection={selectedIds} onSelectionChange={setSelectedIds} archive={view==="Archive"} selecting={selecting} onOpen={id => setDialog({id, mode:"snapshot"})}/></>}
      <div className="crm-actions"><span className="crm-page-context">{data.data.completeness === "Complete" ? "All matching results" : data.data.window.has_more ? "Page counts and values · more pages" : "Page counts and values · final page"} · As at <Stamp value={data.data.window.as_of} /></span><button className="secondary" onClick={refresh}>Refresh from start</button>{data.data.next_cursor && <button onClick={() => setFilters((old) => ({ ...old, cursor: data.data!.next_cursor! }))}>Next page</button>}</div>

    </>}
    {ready && data.data?.can_create && <button className="crm-phone-add" aria-label="Add deal" onClick={()=>setAdding(true)}><ProductIcon name="plus"/></button>}
  </section>;
}
