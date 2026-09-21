"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { disciplines } from "../../../model";
import { attentionPresentation, changeCategories, decisionChip, priorities, sourcePresentation, stagePresentation, stages, duePresentation, isOpen } from "../../model";
import type { readPeople, readRegister } from "../../reads";
import { useChanges } from "./changes-shell";
import { CommandNotice, Dialog, Field, Icon, Menu, ReadNotice, Tone, dateText, fieldError, newId, stampText, text, useChangeCommand, useRead, type MenuItem } from "./changes-ui";

type Register = Awaited<ReturnType<typeof readRegister>>;
type Row = Register["items"][number];
type Selected = NonNullable<Register["selected"]>;
type People = Awaited<ReturnType<typeof readPeople>>;

const columns = [["change", "Change"], ["scope", "Affected scope"], ["basis", "Basis → proposal"], ["stage", "Review state"], ["owner", "Next action owner"], ["due", "Due"], ["attention", "Attention"]] as const;
type ColumnId = (typeof columns)[number][0];
const optional = [["discipline", "Discipline"], ["decision", "Technical decision"], ["progress", "Implementation"], ["source", "Source currentness"], ["retests", "Required retests"], ["updated", "Latest update"]] as const;
type OptionalId = (typeof optional)[number][0];
const sortFor: Partial<Record<ColumnId, string>> = { change: "reference", scope: "scope", stage: "stage", owner: "owner", due: "due", attention: "attention" };
const sortLabels: Record<string, string> = { due: "Due date", reference: "Reference", title: "Change", scope: "Affected scope", stage: "Review state", owner: "Next action owner", attention: "Attention", updated: "Latest update" };
const viewLabels: Record<string, string> = { open: "Open changes", mine: "My actions", review: "Awaiting review", source: "Source changed", receiving: "Awaiting receiving outcome", closed: "Closed" };
const criteriaKeys = ["view", "q", "stage", "discipline", "owner_id", "location", "attention", "source", "receiving", "sort", "dir", "page"] as const;

export function RegisterView() {
  const { packageId, frame, reloadFrame, announce, selection, setSelection, hiddenColumns, setHiddenColumns, href } = useChanges();
  const router = useRouter(), path = usePathname(), search = useSearchParams();
  const criteria = useMemo(() => Object.fromEntries(criteriaKeys.flatMap((k) => (search.get(k) ? [[k, search.get(k)!]] : []))), [search]);
  const inspected = search.get("change"), creating = search.get("new") === "1";
  const query = useMemo(() => new URLSearchParams({ ...criteria, ...(inspected ? { change: inspected } : {}) }).toString(), [criteria, inspected]);
  const register = useRead<Register>(`engineering/${packageId}/changes${query ? `?${query}` : ""}`);
  const [draft, setDraft] = useState(criteria.q ?? ""), [filters, setFilters] = useState(false);
  const data = register.data, items = data?.items ?? [];

  // Every criterion lives in the URL, so Back, Forward, reload and a pasted link restore the same results.
  const go = (changes: Record<string, string | null>, replace = true) => {
    const q = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(changes)) if (v === null || v === "") q.delete(k); else q.set(k, v);
    if (!("page" in changes) && !("change" in changes) && !("new" in changes)) q.delete("page");
    const next = `${path}${q.toString() ? `?${q}` : ""}`;
    if (replace) router.replace(next, { scroll: false }); else router.push(next, { scroll: false });
  };
  useEffect(() => {
    const timer = setTimeout(() => { if (draft !== (criteria.q ?? "")) go({ q: draft || null }); }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);
  // Result changes are announced politely, with the scope the numbers belong to.
  useEffect(() => {
    if (data) announce(`${data.total} change${data.total === 1 ? "" : "s"} shown of ${data.counts.package_total} in this package.`);
  }, [data, announce]);

  const shown = columns.filter(([id]) => id === "change" || !hiddenColumns.includes(id)), extra = optional.filter(([id]) => hiddenColumns.includes(`+${id}`));
  const pageIds = items.map((r) => r.id), chosenHere = pageIds.filter((id) => selection.includes(id)), hiddenChosen = selection.length - chosenHere.length;
  const header = useRef<HTMLInputElement>(null);
  useEffect(() => { if (header.current) header.current.indeterminate = chosenHere.length > 0 && chosenHere.length < pageIds.length; }, [chosenHere.length, pageIds.length]);
  const toggle = (id: string) => setSelection(selection.includes(id) ? selection.filter((x) => x !== id) : [...selection, id]);
  const togglePage = () => setSelection(chosenHere.length === pageIds.length ? selection.filter((id) => !pageIds.includes(id)) : [...new Set([...selection, ...pageIds])]);
  const conditions: [string, string][] = [
    ...(criteria.stage ? [["stage", `Review state: ${stagePresentation[criteria.stage as keyof typeof stagePresentation]?.label ?? criteria.stage}`] as [string, string]] : []),
    ...(criteria.owner_id ? [["owner_id", `Owner: ${data?.options.owners.find((o) => o.id === criteria.owner_id)?.name ?? "selected person"}`] as [string, string]] : []),
    ...(criteria.location ? [["location", `Area: ${criteria.location}`] as [string, string]] : []),
    ...(criteria.attention ? [["attention", `Attention: ${attentionPresentation[criteria.attention as keyof typeof attentionPresentation]?.label ?? criteria.attention}`] as [string, string]] : []),
    ...(criteria.source ? [["source", `Sources: ${sourcePresentation[criteria.source as keyof typeof sourcePresentation]?.label ?? criteria.source}`] as [string, string]] : []),
    ...(criteria.receiving ? [["receiving", `Receiving: ${text(criteria.receiving)}`] as [string, string]] : []),
  ];
  const addCondition: MenuItem[] = [
    ...stages.map((s) => ({ id: `s-${s}`, label: `Review state: ${stagePresentation[s].label}`, onSelect: () => go({ stage: s }) })),
    { id: "sep1", separator: true as const },
    ...(data?.options.owners ?? []).map((o) => ({ id: `o-${o.id}`, label: `Owner: ${o.name}`, onSelect: () => go({ owner_id: o.id }) })),
    { id: "sep2", separator: true as const },
    ...(data?.options.locations ?? []).map((l) => ({ id: `l-${l}`, label: `Area: ${l}`, onSelect: () => go({ location: l }) })),
    { id: "sep3", separator: true as const },
    ...(data?.options.attention ?? []).map((a) => ({ id: `a-${a.code}`, label: `Attention: ${a.label}`, onSelect: () => go({ attention: a.code }) })),
    { id: "sep4", separator: true as const },
    ...(["Changed", "Withdrawn", "Unavailable", "Current"] as const).map((c) => ({ id: `c-${c}`, label: `Sources: ${sourcePresentation[c].label}`, onSelect: () => go({ source: c }) })),
    { id: "sep5", separator: true as const },
    ...(["Pending", "Returned", "Accepted", "Declined"] as const).map((r) => ({ id: `r-${r}`, label: `Receiving: ${r}`, onSelect: () => go({ receiving: r }) })),
  ];
  const sort = criteria.sort ?? "due", dir = criteria.dir ?? "asc", view = criteria.view ?? "open";
  const from = data && data.total ? (data.page - 1) * data.page_size + 1 : 0, to = data ? Math.min(data.page * data.page_size, data.total) : 0;
  const exportHref = (ids?: string[]) => {
    const { page: _page, ...filters } = criteria as Record<string, string>; void _page;
    return `/api/v1/engineering/${packageId}/changes/export?${new URLSearchParams({ kind: "register", ...filters, ...(ids?.length ? { ids: ids.join(",") } : {}) })}`;
  };
  const today = data?.observed_at.slice(0, 10) ?? "";

  return (
    <div className="em-split" data-inspector={inspected ? "open" : "closed"}>
      <section className="em-register" aria-label="Change register" aria-busy={register.loading}>
        <div className="em-toolbar">
          <label className="ec-view"><span className="mw-sr">Saved view</span>
            <select value={view} onChange={(e) => go({ view: e.target.value === "open" ? null : e.target.value })}>
              {/* A view is a filter over the same records. An unavailable count stays blank; it is never shown as zero. */}
              {Object.entries(viewLabels).map(([id, label]) => <option key={id} value={id}>{label}{typeof data?.counts.views[id] === "number" ? ` (${data.counts.views[id]})` : ""}</option>)}
            </select>
          </label>
          <label className="em-search"><Icon name="search" /><span className="mw-sr">Search changes</span>
            <input type="search" placeholder="Search changes" value={draft} onChange={(e) => setDraft(e.target.value)} />
          </label>
          <span className="mw-spacer" />
          <button type="button" className="mw-button" aria-expanded={filters} aria-controls="ec-filters" onClick={() => setFilters((v) => !v)}><Icon name="filter" /><span>Filters</span>{conditions.length > 0 && <span className="mw-count">{conditions.length}</span>}</button>
          <Menu name="Columns" icon="columns" label="Columns" align="end" keepOpen items={[
            ...columns.filter(([id]) => id !== "change").map(([id, label]) => ({ id, label, checked: !hiddenColumns.includes(id), onSelect: () => setHiddenColumns(hiddenColumns.includes(id) ? hiddenColumns.filter((c) => c !== id) : [...hiddenColumns, id]) })),
            { id: "sep", separator: true as const },
            ...optional.map(([id, label]) => ({ id: `+${id}`, label, checked: hiddenColumns.includes(`+${id}`), onSelect: () => setHiddenColumns(hiddenColumns.includes(`+${id}`) ? hiddenColumns.filter((c) => c !== `+${id}`) : [...hiddenColumns, `+${id}`]) })),
            { id: "sep2", separator: true as const },
            { id: "reset", label: "Reset columns", onSelect: () => setHiddenColumns([]) },
          ]} />
          <Menu name="More actions" icon="dots" label="More" iconOnly align="end" items={[
            { id: "csv", label: "Export this view (CSV)", hint: "Follows your access; issues and distributes nothing", onSelect: () => { window.location.href = exportHref(); } },
            { id: "sources", label: "Open changes & history", onSelect: () => router.push(href("history")) },
          ]} />
        </div>
        <div className="em-toolbar em-toolbar-second" id="ec-filters">
          <label className="em-select"><span className="mw-sr">Discipline</span>
            <select value={criteria.discipline ?? ""} onChange={(e) => go({ discipline: e.target.value || null })}>
              <option value="">All disciplines</option>
              {(data?.options.disciplines ?? []).map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <Menu name="Add condition" icon="plus" label="Add condition" items={addCondition} />
          {conditions.map(([key, label]) => (
            <span key={key} className="em-condition">{label}<button type="button" aria-label={`Remove condition ${label}`} onClick={() => go({ [key]: null })}><Icon name="close" /></button></span>
          ))}
          {(conditions.length > 0 || criteria.discipline || criteria.q) && <button type="button" className="mw-link" onClick={() => { setDraft(""); go({ q: null, discipline: null, stage: null, owner_id: null, location: null, attention: null, source: null, receiving: null }); }}>Clear filters</button>}
          <span className="mw-spacer" />
          {/* The count says what it covers: this filtered view, of the whole permitted package. */}
          <span className="mw-muted">{data ? `${data.total} change${data.total === 1 ? "" : "s"}${data.counts.conditioned || view !== "open" ? ` of ${data.counts.package_total} in this package` : ""}` : "…"}</span>
          <Menu name="Sort" label={`Sort: ${sortLabels[sort]}${dir === "desc" ? " (descending)" : ""}`} align="end" items={[
            ...Object.entries(sortLabels).map(([id, label]) => ({ id, label, checked: sort === id, onSelect: () => go({ sort: id === "due" ? null : id }) })),
            { id: "sep", separator: true as const },
            { id: "dir", label: dir === "asc" ? "Descending" : "Ascending", hint: "Unknown values stay last either way", onSelect: () => go({ dir: dir === "asc" ? "desc" : null }) },
          ]} />
        </div>
        {selection.length > 0 && (
          <div className="em-bulk" role="region" aria-label="Selected changes">
            <strong>{selection.length} selected</strong>
            {/* Selecting never decides anything: there is no bulk acceptance, bulk receiving or bulk closure. */}
            <span className="mw-muted">Selection is for export only. Each technical decision, receiving outcome and closure is made on its own record.</span>
            {hiddenChosen > 0 && <span className="ec-hidden-selection">{hiddenChosen} selected {hiddenChosen === 1 ? "change is" : "changes are"} not shown by the current filters.</span>}
            <span className="mw-spacer" />
            <a className="mw-button" href={exportHref(selection)}><Icon name="download" /><span>Export {selection.length} selected (CSV)</span></a>
            <button type="button" className="mw-button" onClick={() => setSelection([])}>Clear selection</button>
          </div>
        )}
        <ReadNotice error={register.error} what="The change register" />
        <div className="em-table-scroll" data-stale={register.stale || undefined}>
          <table className="em-table ec-register-table">
            <caption className="mw-sr">Engineering changes of this package. Opening a change inspects it; ticking a change selects it for export. The two are independent.</caption>
            <thead>
              <tr>
                <th scope="col" className="em-col-check"><input ref={header} type="checkbox" aria-label={`Select the ${pageIds.length} changes on this page`} checked={pageIds.length > 0 && chosenHere.length === pageIds.length} onChange={togglePage} disabled={!pageIds.length} /></th>
                {shown.map(([id, label]) => {
                  const key = sortFor[id];
                  return (
                    <th key={id} scope="col" className={`ec-col-${id}`} aria-sort={key && sort === key ? (dir === "asc" ? "ascending" : "descending") : undefined}>
                      {key ? <button type="button" onClick={() => go(sort === key ? { dir: dir === "asc" ? "desc" : null } : { sort: key === "due" ? null : key, dir: null })}>{label}</button> : <span style={{ padding: "0 14px" }}>{label}</span>}
                    </th>
                  );
                })}
                {extra.map(([id, label]) => <th key={id} scope="col"><span style={{ padding: "0 14px" }}>{label}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} data-inspected={r.id === inspected || undefined} data-selected={selection.includes(r.id) || undefined}
                  onClick={(e) => { if (!(e.target as HTMLElement).closest("input,button,a,label")) go({ change: r.id }, false); }}>
                  <td className="em-col-check"><input type="checkbox" aria-label={`Select ${r.reference}, ${r.title}`} checked={selection.includes(r.id)} onChange={() => toggle(r.id)} /></td>
                  {shown.map(([id]) => <Cell key={id} id={id} row={r} today={today} open={href("register", { ...criteria, change: r.id })} />)}
                  {extra.map(([id]) => <ExtraCell key={id} id={id} row={r} />)}
                </tr>
              ))}
            </tbody>
          </table>
          {data && !items.length && (
            <div className="em-empty">
              {data.counts.package_total === 0 ? <><strong>No engineering changes yet</strong><p>{data.can.edit ? "Record the first proposed change against its exact released baseline." : "Nothing has been proposed against this package."}</p></>
                : <><strong>No changes match</strong><p>{data.counts.package_total} change{data.counts.package_total === 1 ? "" : "s"} exist in this package. {view !== "open" ? `“${viewLabels[view]}” and the active` : "The active"} filters hide them.</p>
                  <button type="button" className="mw-button" onClick={() => { setDraft(""); router.replace(path, { scroll: false }); }}>Clear filters</button></>}
            </div>
          )}
          {!data && register.loading && <div className="em-empty"><p>Loading the change register…</p></div>}
        </div>
        <footer className="em-table-foot">
          <span>{data ? `${data.total} change${data.total === 1 ? "" : "s"}` : "…"} · {selection.length} selected</span>
          <span className="mw-spacer" />
          <span>{from}–{to} of {data?.total ?? "…"}</span>
          <button type="button" className="mw-icon-button" aria-label="Previous page" disabled={!data || data.page <= 1} onClick={() => go({ page: String((data?.page ?? 2) - 1) })}><Icon name="chevron-left" /></button>
          <button type="button" className="mw-icon-button" aria-label="Next page" disabled={!data || to >= data.total} onClick={() => go({ page: String((data?.page ?? 1) + 1) })}><Icon name="chevron-right" /></button>
        </footer>
        <footer className="em-page-foot"><span>Synthetic preview · {dateText(data?.observed_at.slice(0, 10) ?? null, "")}</span></footer>
      </section>
      {inspected && data && <Inspector key={inspected} selected={data.selected} unavailable={data.selection === "Unavailable"} stale={register.stale} onClose={() => go({ change: null })} />}
      {creating && frame && <NewChange onClose={() => go({ new: null })} onCreated={(id) => { register.reload(); reloadFrame(); router.push(href("impact", { change: id })); }} />}
    </div>
  );
}

function Cell({ id, row: r, today, open }: { id: ColumnId; row: Row; today: string; open: string }) {
  if (id === "change")
    return (
      <td className="ec-col-change">
        {/* A real link: Enter opens the inspector, and the address names the change. */}
        <Link className="em-row-title" href={open} scroll={false} aria-label={`Inspect ${r.reference}, ${r.title}`}>{r.title}</Link>
        <span className="em-cell-sub">{r.reference}{r.priority && r.priority !== "Normal" ? ` · ${r.priority} priority declared` : ""}</span>
      </td>
    );
  if (id === "scope") return <td data-label="Affected scope" className="ec-scope">{r.location}<span className="ec-count" title={`${r.object_count} distinct linked object${r.object_count === 1 ? "" : "s"} included`} aria-label={`${r.object_count} linked objects`}>{r.object_count}</span></td>;
  // A mixed revision set is named in words where there is room for it: the inspector's exact sources.
  if (id === "basis") return <td data-label="Basis → proposal" className="ec-basis" title={r.mixed_sources ? "The baseline of a source set of several records. View exact sources in the inspector." : undefined}>{r.basis}</td>;
  if (id === "stage") return <td data-label="Review state"><Tone view={r.stage_view} /></td>;
  if (id === "owner") return <td data-label="Next action owner">{r.next_owner_name ?? "Unassigned"}</td>;
  if (id === "due") {
    const due = duePresentation(r.due, today, isOpen(r.stage));
    // A missing date is "Date needed" with nothing invented beside it; a future date is plain; overdue says so in words.
    return <td data-label="Due" className="ec-col-due">{r.due ? dateText(r.due) : "Date needed"}{due.label === "Overdue" && <span className="em-cell-sub"><Tone view={due} /></span>}</td>;
  }
  return <td data-label="Attention">{r.attention === "None" ? <span className="mw-muted">—</span> : <Tone view={r.attention_view} />}</td>;
}
function ExtraCell({ id, row: r }: { id: OptionalId; row: Row }) {
  return <td data-label={optional.find(([k]) => k === id)![1]}>{id === "discipline" ? r.discipline : id === "decision" ? (r.decision === "None" ? "Not decided" : r.decision) : id === "progress" ? text(r.progress) : id === "source" ? sourcePresentation[r.source].label : id === "retests" ? r.retests_required : stampText(r.updated_at)}</td>;
}

function Inspector({ selected: s, unavailable, stale, onClose }: { selected: Selected | null; unavailable: boolean; stale: boolean; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null), { href } = useChanges();
  // A docked inspector is modeless: it takes focus once when opened and never traps it.
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector("dialog[open]")) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (unavailable || !s)
    return (
      <aside className="em-inspector" aria-label="Change inspector">
        <div className="em-inspector-head"><h2 ref={heading} tabIndex={-1}>{unavailable ? "Change unavailable" : "Loading…"}</h2><button type="button" className="mw-icon-button" onClick={onClose} aria-label="Close inspector"><Icon name="close" /></button></div>
        {/* Nothing from an earlier selection is left on screen under this address. */}
        {unavailable && <div className="em-inspector-body"><p className="mw-muted">This change does not exist in this package, or this identity cannot read it. Nothing is shown in its place.</p></div>}
      </aside>
    );
  const chip = decisionChip(s.decision), [button, ...links] = s.actions.secondary;
  return (
    <aside className="em-inspector" aria-label={`Inspector: ${s.reference}`} data-stale={stale || undefined}>
      <div className="em-inspector-head">
        <div>
          <span className="ec-inspector-ref">{s.reference}</span>
          <h2 ref={heading} tabIndex={-1}>{s.title}</h2>
          <span className="ec-inspector-sub">{s.location} · {s.system_name}</span>
        </div>
        <button type="button" className="mw-icon-button" onClick={onClose} aria-label="Close inspector"><Icon name="close" /></button>
      </div>
      <div className="em-inspector-body">
        {/* Where the change stands, then the one technical fact. The decision is green only when it is an acceptance. */}
        <div className="ec-chips" role="group" aria-label="Review state and technical decision"><Tone view={s.stage_view} />{chip && <Tone view={chip} />}
          {/* The blocking strip below says why implementation is not authorised; any other implementation state is named here. */}
          {s.decision === "Accepted" && !s.blocking && <Tone view={{ ...s.implementation.view, label: `Implementation: ${s.implementation.view.label.toLowerCase()}` }} />}</div>
        <div className="ec-section">
          <h3>Technical basis</h3>
          {s.applicability !== "Current" && s.decision !== "None" && <p className="ec-note">{text(s.applicability)}: the recorded decision is retained as history and cannot support a new handover until the change is reassessed.</p>}
          {s.baseline ? (
            <div className="ec-revisions">
              <div><span>As released</span><strong>{s.baseline.reference} · Rev {s.baseline.revision}</strong><small>Purpose: {s.baseline.purpose_label}</small></div>
              <div><span>Proposed</span><strong>{s.proposed.reference ?? s.baseline.reference} · Rev {s.proposed.revision ?? "?"}</strong><small>{s.proposed.issued ? `Issued · ${s.proposed.issued.purpose_label}` : "Not issued"}</small></div>
            </div>
          ) : <p className="ec-note">No exact baseline is captured yet.</p>}
          <div className="ec-sources">
            <Tone view={s.sources.view} plain />
            {/* The time is the last recorded check. It is never the moment this panel happened to open. */}
            <small>{s.sources.checked_at ? `Checked ${stampText(s.sources.checked_at, " · ")}${s.sources.check_result && s.sources.check_result !== s.sources.condition ? ` · then ${sourcePresentation[s.sources.check_result as keyof typeof sourcePresentation]?.label.toLowerCase() ?? s.sources.check_result}` : ""}` : "No source check is recorded yet"}</small>
            {s.sources.reasons.length > 0 && <ul>{s.sources.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
            <Link className="mw-link" href={href("impact", { change: s.id, panel: "sources" })}>View exact sources <Icon name="arrow-right" /></Link>
          </div>
        </div>
        <div className="ec-section">
          <h3>Impact summary</h3>
          <div className="ec-row"><span>Installed assets</span><strong>{s.summary.installed_assets} affected</strong></div>
          <div className="ec-row"><span>Material lines</span><strong>{s.summary.material_lines} affected</strong></div>
          <div className="ec-row"><span>Retest</span><strong>{s.summary.retest}</strong></div>
          <div className="ec-row"><span>Cost decision</span><strong className={`ec-tone-${s.summary.cost_tone}`} data-tone={s.summary.cost_tone}>{s.summary.cost_decision}</strong></div>
          {/* Who acts next, and by when. A missing owner or date is said in words and nothing is invented beside it. */}
          <p className="ec-owner"><span className="mw-sr">Next action owner: </span>{s.next_owner_name ?? "Unassigned"} · {s.due ? `Due ${dateText(s.due)}` : "Date needed"}</p>
        </div>
        {s.follow_through.length > 0 && (
          <div className="ec-section">
            <h3>Required follow-through</h3>
            {/* One line per obligation, each projecting its own retained record. Opening one completes nothing. */}
            <ul className="ec-follow">
              {s.follow_through.map((f) => (
                <li key={f.key}><Link href={href(f.href_view, { change: s.id, record: f.record_id })}><span>{f.label}</span><Tone view={f.state} bare /><Icon name="chevron-right" /></Link></li>
              ))}
            </ul>
          </div>
        )}
        {s.blocking && (
          <div className="ec-blocking" role="note">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.2 3.2 19.4h17.6Z" /><path d="M12 10v4.4M12 16.8h.01" /></svg>
            <div><strong>{s.blocking.title}</strong><p>{s.blocking.text}</p></div>
          </div>
        )}
        {/* Someone who cannot resolve it is told whose it is; the review itself stays readable to them. */}
        {s.blocking?.permitted && <p className="ec-note">{s.blocking.permitted}</p>}
        {s.overlaps > 0 && <p className="ec-note">{s.overlaps} other open change{s.overlaps === 1 ? " shares" : "s share"} an object or baseline with this one. See the impact assessment.</p>}
        {s.closure && <p className="ec-note">Closed as {text(s.closure.meaning).toLowerCase()} by {s.closure.closed_by_name} on {stampText(s.closure.closed_at)}.</p>}
      </div>
      <div className="ec-inspector-foot">
        {/* Navigation only: opening a review approves, issues and completes nothing. */}
        <Link className="mw-button mw-button-primary" href={s.actions.primary.href}>{s.actions.primary.label}</Link>
        {button && <Link className="mw-button" href={button.href}>{button.label}</Link>}
        {links.length > 0 && <div className="ec-inspector-links">{links.map((a) => <Link key={a.label} href={a.href}>{a.label} <Icon name="arrow-right" /></Link>)}</div>}
      </div>
    </aside>
  );
}

function NewChange({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { packageId } = useChanges(), people = useRead<People>(`engineering/${packageId}/changes/people`), command = useChangeCommand();
  const [form, setForm] = useState({ title: "", category: "DesignCorrection", discipline: "Controls", location: "", system_name: "", next_owner_id: "", due: "", priority: "", priority_reason: "", reason: "" });
  const [ids] = useState(() => ({ id: newId(), revision_id: newId() }));
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  const dirty = Object.values(form).some((v, i) => v !== ["", "DesignCorrection", "Controls", "", "", "", "", "", "", ""][i]);
  const submit = async () => {
    const receipt = await command.send(`engineering/${packageId}/changes`, { action: "create", ...ids, reason: form.reason, title: form.title, category: form.category, discipline: form.discipline, location: form.location, system_name: form.system_name,
      next_owner_id: form.next_owner_id || null, due: form.due || null, priority: form.priority || null, priority_reason: form.priority_reason || null });
    if (receipt) onCreated(ids.id);
  };
  const e = command.error;
  return (
    <Dialog title="New change" subtitle="A draft is saved as it is. The exact baseline, proposal and assessment follow in Impact assessment." drawer busy={command.busy} dirty={dirty && command.state !== "saved"} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void submit()} disabled={command.busy}>{command.busy ? "Saving…" : "Create draft change"}</button></>}>
      <div className="ec-stack">
        <Field label="Change title" error={fieldError(e, "title")}><input data-autofocus value={form.title} onChange={set("title")} maxLength={200} /></Field>
        <div className="ec-inline">
          <Field label="Reason category" hint="A local choice of this prototype, not company policy" error={fieldError(e, "category")}><select value={form.category} onChange={set("category")}>{changeCategories.map((c) => <option key={c} value={c}>{text(c)}</option>)}</select></Field>
          <Field label="Discipline" error={fieldError(e, "discipline")}><select value={form.discipline} onChange={set("discipline")}>{disciplines.map((d) => <option key={d}>{d}</option>)}</select></Field>
        </div>
        <div className="ec-inline">
          <Field label="Affected area" hint="Where it physically is, not the areas it serves" error={fieldError(e, "location")}><input value={form.location} onChange={set("location")} maxLength={120} /></Field>
          <Field label="System" error={fieldError(e, "system_name")}><input value={form.system_name} onChange={set("system_name")} maxLength={120} /></Field>
        </div>
        <div className="ec-inline">
          <Field label="Next action owner" hint="Leave empty for Unassigned" error={fieldError(e, "next_owner_id")}><select value={form.next_owner_id} onChange={set("next_owner_id")}><option value="">Unassigned</option>{people.data?.items.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Due" hint="Leave empty to show Date needed" error={fieldError(e, "due")}><input type="date" value={form.due} onChange={set("due")} /></Field>
        </div>
        <div className="ec-inline">
          <Field label="Declared priority (optional)" hint="Urgency grants no authority and bypasses no review"><select value={form.priority} onChange={set("priority")}><option value="">None declared</option>{priorities.map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Reason for that priority" error={fieldError(e, "priority_reason")}><input value={form.priority_reason} onChange={set("priority_reason")} maxLength={600} disabled={!form.priority} /></Field>
        </div>
        <Field label="Why is this change being recorded?" hint="Kept with the record's history" error={fieldError(e, "reason")}><textarea value={form.reason} onChange={set("reason")} maxLength={1000} /></Field>
        <CommandNotice command={command} saved="Draft change created on the server." />
      </div>
    </Dialog>
  );
}
