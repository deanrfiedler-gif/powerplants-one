"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
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
    <p>{item.organisation_name}<br />{item.site_name ?? "Site not yet identified"}</p>
  </>;
}
function Board({ data, selected }: { data: Results; selected: string }) {
  return <div className="crm-board-scroll" role="region" aria-label="Opportunity Board — stage sequence" tabIndex={0}>
    <div className="crm-board">
      {data.stages.map((stage) => <section key={stage.stage_id} className="crm-stage" data-selected={stage.stage_id === selected} aria-labelledby={`board-${stage.stage_id}`}>
        <header className="crm-stage-heading"><h2 id={`board-${stage.stage_id}`}>{stage.stage_id}</h2><span>{stage.count} on this page</span></header>
        <ul className="crm-worklist">
          {data.items.filter((item) => item.stage_id === stage.stage_id).map((item) => <li key={item.id} data-opportunity-id={item.id} className="crm-card">
            <div><Identity item={item} /><p>Opportunity owner: {item.owner_name}</p></div>
            <div className="crm-card-state"><Status value={item.stage_id} /><span>Outcome: {item.close_outcome}</span><span>Saved</span></div>
            <Action item={item} />
            <small className="crm-card-source">Stage entered <Stamp value={item.stage_entered_at} /></small>
          </li>)}
        </ul>
        {stage.count === 0 && <p className="crm-stage-empty">No {stage.stage_id.toLowerCase()} opportunities on this page.</p>}
      </section>)}
    </div>
  </div>;
}
function Grid({ data }: { data: Results }) {
  return <div className="crm-grid-scroll" role="region" aria-label="Opportunity Grid — scroll for all columns" tabIndex={0}>
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
  const [filters, setFilters] = useState(initial);
  const [view, setView] = useState<"Board" | "Grid">("Board");
  const [selected, setSelected] = useState("Enquiry");
  const data = useCrmResource<Results>(`crm/opportunities?${query(filters)}`, true);
  // Clear query text, selected IDs and option-search components after current access is denied.
  const isDenied = denied(data.error);
  useEffect(() => {
    if (!isDenied) return;
    let live = true;
    queueMicrotask(() => { if (live) setFilters(initial); });
    return () => { live = false; };
  }, [isDenied]);
  const change = (key: keyof typeof initial, value: string) => setFilters((old) => ({ ...old, [key]: value, cursor: "", ...(key === "company_id" ? { site_id: "" } : {}) }));
  const refresh = () => { setFilters((old) => ({ ...old, cursor: "" })); data.reload(); };
  return <section className="crm-workspace" aria-label="Sales worklist">
    <header className="crm-worklist-heading">
      <div><p className="eyebrow">CRM · Synthetic · Online</p><h1>Sales worklist</h1></div>
      {!data.error && data.data?.can_create && <Link className="primary-link" href="/crm/opportunities/new">New opportunity</Link>}
    </header>
    <div className="crm-view-controls" role="group" aria-label="Opportunity presentation">
      {(["Board", "Grid"] as const).map((value) => <button key={value} className={view === value ? "" : "secondary"} aria-pressed={view === value} onClick={() => setView(value)}>{value}</button>)}
      <small>Same permitted results · Open outcome</small>
    </div>
    {!isDenied && <>
      <div className="crm-primary-filters">
        <Field name="sales-search" label="Search opportunities" value={filters.q} onChange={(v) => change("q", v)} />
        <SelectField name="stage" label="Stage" value={filters.stage_id} onChange={(v) => { change("stage_id", v); if (v) setSelected(v); }} options={(data.data?.stages ?? []).map((s) => ({ id: s.stage_id, display_name: s.stage_id }))} empty="All stages" />
      </div>
      <details className="crm-secondary-filters"><summary>Filters and sort{Object.entries(filters).some(([k, v]) => !["q", "cursor", "stage_id", "sort", "limit"].includes(k) && v) || filters.sort !== "Reference" ? " · Applied" : ""}</summary>
        <div className="crm-filter-grid">
          {(["Company", "Site", "Owner"] as const).map((kind) => <FilterPicker key={kind} kind={kind} value={filters[kind === "Company" ? "company_id" : kind === "Site" ? "site_id" : "owner_id"]} company={filters.company_id} enabled={!data.error} set={(v) => change(kind === "Company" ? "company_id" : kind === "Site" ? "site_id" : "owner_id", v)} />)}
          <SelectField name="next-state" label="Next action" value={filters.next_action} onChange={(v) => change("next_action", v)} options={Object.entries(labels).map(([id, display_name]) => ({ id, display_name }))} empty="All action states" />
          <label className="field">Sort<select aria-label="Sort" value={filters.sort} onChange={(e) => change("sort", e.target.value)}><option value="Reference">Stable record order</option><option value="Title">Title A–Z</option><option value="Newest">Newest first</option></select></label>
          <label className="field">Page size<select aria-label="Page size" value={filters.limit} onChange={(e) => change("limit", e.target.value)}><option value="10">10 records</option><option value="25">25 records</option><option value="50">50 records</option></select></label>
          <label className="crm-check"><input type="checkbox" checked={filters.owner_id === p.actor_id} onChange={(e) => change("owner_id", e.target.checked ? p.actor_id : "")} />Owned by me</label>
        </div>
        <button className="secondary" onClick={() => setFilters(initial)}>Clear filters</button>
      </details>
    </>}
    <ErrorNotice error={data.error} />
    {data.loading && <p role="status">Loading permitted sales records…</p>}
    {data.error != null && <button className="secondary" onClick={refresh}>Try loading again</button>}
    {!data.error && data.data && <>
      <p className="source-stamp crm-worklist-stamp">Synthetic source · As at <Stamp value={data.data.window.as_of} /> · {data.data.items.length} permitted items on this page · {data.data.completeness === "Complete" ? "All matching results" : data.data.window.has_more ? "Partial — more pages" : "Partial — final page"}</p>
      {!data.data.items.length && <p className="empty-state">No permitted opportunities match this view.</p>}
      {view === "Board" ? <>
        <div className="crm-stage-navigation" role="group" aria-label="Choose Board stage">{data.data.stages.map((stage) => <button key={stage.stage_id} aria-pressed={selected === stage.stage_id} className={selected === stage.stage_id ? "" : "secondary"} onClick={() => setSelected(stage.stage_id)}>{stage.stage_id} ({stage.count})</button>)}</div>
        <Board data={data.data} selected={selected} />
      </> : <Grid data={data.data} />}
      <div className="crm-actions"><button className="secondary" onClick={refresh}>Refresh from start</button>{data.data.next_cursor && <button onClick={() => setFilters((old) => ({ ...old, cursor: data.data!.next_cursor! }))}>Next page</button>}</div>
      <p className="crm-worklist-help">{data.data.stages[0].pipeline_label}. Open an opportunity to record qualification or plan its next Activity.</p>
    </>}
  </section>;
}
