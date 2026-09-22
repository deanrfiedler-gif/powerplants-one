"use client";
import Link from "next/link";
import { initialWorklistFilters as initial } from "../crm/worklist-location";
import { useWorklistLocation } from "./crm-worklist-location";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { DealDialog, stageRequiresEvidence, useDesktopCRM, type DealRecord, type StageUndo } from "./crm-deal-controls";
import type { OperationReceipt } from "../platform/operations";
import { ProductIcon } from "./product-icons";
import { HeaderContent } from "./header-content";
import { Board, Grid } from "./crm-worklist-board";
import { ForecastWorklist, WorklistChoice, WorklistMenu, WorklistPanel, WorklistReview, WorklistViews } from "./crm-worklist-tools";
import { needsAttention, worklistCsv } from "../crm/worklist-presentation";
import { valueSummary } from "../crm/value-summary";
import type { listOpportunities, worklistOptions, WorklistItem } from "../crm/worklist";
import { useIdentity } from "./business-session";
import { ErrorNotice, Field, SelectField, Stamp } from "./business-ui";
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
  const desktop = useDesktopCRM();
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
  const data = useCrmResource<Results>(`crm/opportunities?${query(filters)}`, true);
  // On acceptance drop the optimistic override and let the server be the truth.
  // The undo target is kept: it is what the actor reverses after a move lands.
  const stageCommand = useCrmCommand((receipt) => { setFeedback(`Stage saved: ${receipt.state}.`); setMoved({}); setFilters(o => ({ ...o, cursor: "" })); data.reload(); }, "No unsaved changes");

  // Clear query text, selected IDs and option-search components after current access is denied.
  const isDenied = denied(data.error);
  useEffect(() => {
    if (!isDenied) return;
    let live = true;
    queueMicrotask(() => { if (live) { clearLocation();setFeedback("");setUndoMove(null);setMoved({});setDialog(null);setActivity(null);setFiltersOpen(false);setReview(null); } });
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
  const saved=(receipt:OperationReceipt,old:DealRecord,stage:boolean)=>{setDialog(null);setMoved({});if(stage){stageCommand.clearError();setSelected(receipt.state);setFocusAfterSave({id:old.id,version:receipt.record_version});setUndoMove({id:old.id,to:old.stage_id,record:{id:old.id,version:receipt.record_version,stage_id:old.stage_id,qualification_note:old.qualification_note,identification_activity_id:old.identification_activity_id}});setFeedback(`${old.title} moved to ${receipt.state}.`);}setFilters(old=>({...old,cursor:""}));data.reload();};
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
  const exportPage = () => {
    if (!ready || !data.data) return;
    const url = URL.createObjectURL(new Blob([worklistCsv(data.data.items)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "PPO-Deals-current-page.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section id="ppo-deals" data-module-layout="full-bleed" className="crm-workspace crm-r38" aria-label="Sales worklist" data-density={density}>
    <h1 className="sr-only">Sales worklist</h1>
    {!desktop && <HeaderContent slot="search">{scopedSearch}</HeaderContent>}
    <div className="crm-toolbar crm-toolbar-r38">
      <div className="crm-toolbar-views"><div className="crm-view-controls" role="group" aria-label="Deal presentation">
        {(["Board", "Grid", "Forecast"] as const).map(value => <button key={value} className="secondary" aria-pressed={view === value} onClick={() => setView(value)}><ProductIcon name={value === "Board" ? "board" : value === "Grid" ? "list" : "insights"}/><span>{value === "Grid" ? "List" : value}</span></button>)}
      </div><button className="secondary crm-archive-button" aria-pressed={view === "Archive"} onClick={() => setView("Archive")}><ProductIcon name="archive"/><span>Archive</span></button>
      {ready && data.data?.can_create && <Link className="primary-link crm-new-opportunity" href="/sales/opportunities/new" aria-label="Add deal"><ProductIcon name="plus"/>Deal</Link>}</div>
      {!isDenied && <div className="crm-toolbar-context">
        <WorklistMenu label="Pipeline totals" text={<><span>{ready ? data.data!.items.length : "—"} <span className="crm-count-label">{data.data?.items.length === 1 ? "deal" : "deals"}</span></span><ProductIcon name="info"/></>} disabled={!ready}>
          <p>{data.data?.completeness === "Complete" ? "All matching results" : "Current result page only"} · {filters.outcome} · Current filters apply</p>
          <dl className="crm-total-grid"><div><dt>Total value</dt><dd>{totals?.formatted}</dd></div><div><dt>Deals</dt><dd>{data.data?.items.length}</dd></div><div><dt>Not estimated</dt><dd>{totals?.unknown}</dd></div><div><dt>Weighted value</dt><dd>Not configured</dd></div></dl><p>AUD excluding GST. Unknown values count as deals and do not contribute to monetary totals.</p>
        </WorklistMenu>
        <WorklistChoice label="Pipeline" icon="sales" className="crm-pipeline-picker" disabled={stageCommand.busy || stageCommand.uncertain} value={filters.pipeline_definition_id} onChange={value => { setFilters(old => ({ ...old, pipeline_definition_id: value, stage_id: "", cursor: "" }), "push"); setSelected(""); setMoved({}); setUndoMove(null); setFeedback(""); }} options={data.data?.pipelines.map(pipeline => ({id:pipeline.id,label:pipeline.display_name})) ?? []}/>

        <button className="secondary crm-icon-button" aria-label="Help" onClick={() => setReview("help")}><ProductIcon name="help"/></button>
        <button className="secondary crm-filter-toggle" aria-label="Filters and sort" aria-expanded={filtersOpen} aria-controls="crm-filter-panel" onClick={() => setFiltersOpen(true)}><ProductIcon name="filter"/><span>Filters{activeFilters.length ? ` ${activeFilters.length}` : ""}</span></button>
        <WorklistMenu label="Deal data options" icon="more" className="crm-icon-button"><button className="secondary crm-menu-choice" data-menu-close disabled={!ready} onClick={exportPage}><ProductIcon name="download"/>Export current page as CSV</button><button className="secondary crm-menu-choice" disabled>Import data · unavailable</button><button className="secondary crm-menu-choice" disabled>Clean up data · unavailable</button><button className="secondary crm-menu-choice" disabled>Restore deleted data · unavailable</button><p>Import, bulk cleanup and deletion recovery require app services that are not implemented. Existing saved records remain available through their current workflows.</p></WorklistMenu>
      </div>}
    </div>
    {!isDenied && <div className="crm-workbar" aria-label="Views, filters and review">
      <div className="crm-workbar-filters"><WorklistViews key={filters.pipeline_definition_id + (view === "Archive" ? "archive" : "open")} filters={filters} actor={p.actor_id} setFilters={value => setFilters(value, "push")}/><button className="secondary crm-add-condition" onClick={() => setFiltersOpen(true)}><ProductIcon name="filter"/>Add condition</button><div className="crm-condition-chips" aria-label="Active filter conditions">{activeFilters.map(key => <button className="secondary" key={key} title={filters[key]} aria-label={`Remove ${filterLabel(key)} condition`} onClick={() => change(key, "")}><span>{filterLabel(key)}{["q", "stage_id", "next_action"].includes(key) ? `: ${filters[key]}` : ""}</span><ProductIcon name="close"/></button>)}</div></div>
      <div className="crm-workbar-review"><button className="secondary" disabled={!ready} onClick={() => setReview("changes")}><ProductIcon name="changes"/><span>What changed</span></button><button className="secondary" disabled={!ready || view === "Archive"} onClick={() => setReview("triage")}><ProductIcon name="pulse"/>Triage{data.data?.items.filter(needsAttention).length ? <small>{data.data.items.filter(needsAttention).length}</small> : null}</button><WorklistChoice label="Sort" prefix="Sort by: " className="crm-sort" value={filters.sort} onChange={value => change("sort", value)} options={[{id:"Reference",label:"Default order"},{id:"Title",label:"Title A–Z"},{id:"Newest",label:"Newest first"}]}/><WorklistMenu label="View options" icon="more" className="crm-icon-button"><button className="secondary crm-menu-choice" onClick={() => setDensity(old => old === "comfortable" ? "compact" : "comfortable")}>Density: {density}</button><button className="secondary crm-menu-choice" data-menu-close disabled={!ready} onClick={exportPage}>Export current page as CSV</button><Link className="crm-menu-choice" href="/work">My activities</Link><Link className="crm-menu-choice" href="/sales/leads">Leads</Link><p>Collapse a Board stage through its header menu. Resize List columns by dragging a divider, or focus it and use the arrow keys.</p></WorklistMenu></div>
    </div>}
    {filtersOpen && !isDenied && <WorklistPanel title="Filter deals" drawer onClose={() => setFiltersOpen(false)}><section id="crm-filter-panel" className="crm-secondary-filters" aria-label="Deal filters"><div className="crm-filter-grid">
      {desktop && scopedSearch}
      {(["Company", "Site", "Owner"] as const).map(kind => <FilterPicker key={kind} kind={kind} value={filters[kind === "Company" ? "company_id" : kind === "Site" ? "site_id" : "owner_id"]} company={filters.company_id} enabled={!data.error} set={v => change(kind === "Company" ? "company_id" : kind === "Site" ? "site_id" : "owner_id", v)}/>)}
      <label className="field">Sales outcome<select aria-label="Sales outcome" value={filters.outcome} onChange={e => change("outcome", e.target.value)}>{(view === "Archive" ? ["Closed", "Won", "Lost"] : ["Open", "Won", "Lost", "All"]).map(value => <option key={value} value={value}>{value === "Closed" ? "Won and Lost" : value}</option>)}</select></label>
      <SelectField name="next-state" label="Next action" value={filters.next_action} onChange={v => change("next_action", v)} options={Object.entries(labels).map(([id, display_name]) => ({ id, display_name }))} empty="All action states"/>
      <SelectField name="stage" label="Stage" value={filters.stage_id} onChange={v => { change("stage_id", v); if (v) setSelected(v); }} options={(data.data?.stages ?? []).map(stage => ({ id: stage.stage_id, display_name: stage.stage_id }))} empty="All stages"/>
      <label className="field">Sort<select aria-label="Sort" value={filters.sort} onChange={e => change("sort", e.target.value)}><option value="Reference">Default order</option><option value="Title">Title A–Z</option><option value="Newest">Newest first</option></select></label><label className="field">Page size<select aria-label="Page size" value={filters.limit} onChange={e => change("limit", e.target.value)}><option value="10">10 records</option><option value="25">25 records</option><option value="50">50 records</option></select></label><label className="crm-check"><input type="checkbox" checked={filters.owner_id === p.actor_id} onChange={e => change("owner_id", e.target.checked ? p.actor_id : "")}/>Owned by me</label>
    </div><button className="secondary" onClick={() => setFilters(old => ({ ...initial, pipeline_definition_id: old.pipeline_definition_id, outcome: view === "Archive" ? "Closed" : "Open" }))}>Clear filters</button></section></WorklistPanel>}
    {review && !isDenied && <WorklistReview kind={review} items={data.data?.items ?? []} asOf={data.data?.window.as_of ?? new Date().toISOString()} onClose={() => setReview(null)} onOpen={id => setDialog({ id, mode: "snapshot" })}/>}
    {feedback&&!isDenied&&<div className="crm-change-feedback" role="status"><span>{feedback}</span><span className="crm-save-status">{undoMove?.record ? "Saved to the server" : stageCommand.status}</span><ErrorNotice error={stageCommand.error} />{stageCommand.uncertain&&<button disabled={stageCommand.busy} onClick={()=>void stageCommand.reconcile()}>Confirm original save outcome</button>}{!!stageCommand.error&&!stageCommand.uncertain&&<button className="secondary" onClick={()=>{setMoved({});refresh();}}>Load current saved version for comparison</button>}{undoMove&&<button className="secondary" disabled={stageCommand.busy||stageCommand.uncertain} onClick={undoLastMove}>Undo stage move</button>}<button className="secondary" disabled={stageCommand.busy||stageCommand.uncertain} onClick={()=>{setFeedback("");setUndoMove(null);}}>Dismiss</button></div>}
    {activity&&!isDenied&&<ActivitySnapshot item={activity} onClose={()=>setActivity(null)}/>}
    {dialog&&!isDenied&&<DealDialog key={dialog.id + dialog.mode} id={dialog.id} mode={dialog.mode} targetStage={dialog.stage} targetOutcome={dialog.outcome} undo={dialog.undo} onClose={()=>setDialog(null)} onSaved={saved}/>}
    <ErrorNotice error={data.error} />
    {data.loading && <p role="status">Loading permitted sales records…</p>}
    {data.error != null && <button className="secondary" onClick={refresh}>Try loading again</button>}
    {!data.error && data.data && <>
      <div className="source-stamp crm-worklist-stamp"><strong>{data.data.items.length} {data.data.items.length === 1 ? "deal" : "deals"}{data.data.completeness === "Complete" ? "" : " on this page"}</strong><span>{totals?.formatted} known{totals?.unknown ? ` · ${totals.unknown} not estimated` : ""}</span><span className="crm-summary-basis">{filters.outcome} · AUD, excl. GST</span></div>
      {view === "Board" ? <>
        <div className="crm-stage-navigation" role="group" aria-label="Choose Board stage">{data.data.stages.map((stage) => <button key={stage.stage_id} aria-pressed={activeStage === stage.stage_id} className={activeStage === stage.stage_id ? "" : "secondary"} onClick={() => setSelected(stage.stage_id, "push")}>{stage.stage_id} ({stage.count})</button>)}</div>
        <Board data={boardData!} selected={activeStage} scroll={boardScroll} onOpen={id=>{if(!stageCommand.busy&&!stageCommand.uncertain)setDialog({id,mode:"snapshot"});}} onStage={id=>setDialog({id,mode:"stage"})} blocked={stageCommand.busy||stageCommand.uncertain} onMove={move} onActivity={setActivity} onEdit={id => setDialog({id, mode:"information"})} onOutcome={(id, outcome) => setDialog({id, mode:"outcome", outcome})} />
      </> : view === "Forecast" ? <ForecastWorklist items={data.data.items} asOf={data.data.window.as_of} onEdit={id => setDialog({ id, mode: "information" })}/> : <>{view === "Archive" && <div className="crm-archive-intro"><h2>Archive</h2><div role="group" aria-label="Archive status">{["Closed", "Won", "Lost"].map(value => <button className="secondary" key={value} aria-pressed={filters.outcome === value} onClick={() => change("outcome", value)}>{value === "Closed" ? "All closed" : value}</button>)}</div><p>Saved sales outcomes. Manual archiving and restoration are not yet available.</p></div>}<Grid data={data.data} scroll={gridScroll} onOpen={id => setDialog({id, mode:"snapshot"})}/></>}
      <div className="crm-actions"><span className="crm-page-context">{data.data.completeness === "Complete" ? "All matching results" : data.data.window.has_more ? "Page counts and values · more pages" : "Page counts and values · final page"} · As at <Stamp value={data.data.window.as_of} /></span><button className="secondary" onClick={refresh}>Refresh from start</button>{data.data.next_cursor && <button onClick={() => setFilters((old) => ({ ...old, cursor: data.data!.next_cursor! }))}>Next page</button>}</div>

    </>}
  </section>;
}
