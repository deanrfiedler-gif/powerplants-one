"use client";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIdentity } from "./business-session";
import { api, ErrorNotice } from "./business-ui";
import { useCrmResource } from "./crm-state";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { Button, ButtonLink } from "./ui/button";
import { RegisterTable, RegisterEmpty, RegisterFooter } from "./ui/register-table";
import { WorklistMenu, WorklistPanel } from "./crm-worklist-tools";
import { CostSourceSnapshot } from "./cost-source-snapshot";
import { CostSourceIcon as Icon, CostSourceState, CostSourceExpiry, CostSourceReadNotice, stateIcon } from "./cost-source-register-parts";
import { sourceViews, sourceStates, sourceDate, sourceMoney, sourceCsv, sourceSelectionCurrent, exactSourceHref, type CostSourceRegisterData, type CostSourceRow } from "../estimating/cost-source-register-model";
import { formatDateTime } from "../shell/date-format";
import "./cost-source-register.css";

const initialColumns = [
  { key: "source", label: "Source", width: 136, required: true }, { key: "title", label: "Title", width: 204, required: true },
  { key: "state", label: "State", width: 184, required: true }, { key: "expiry", label: "Supplier expiry", width: 136 },
  { key: "cost", label: "Tier 1 cost", width: 104 }, { key: "updated", label: "Updated", width: 104 },
  { key: "supplier", label: "Supplier", width: 188 }, { key: "item", label: "Item", width: 120 },
  { key: "unit", label: "Unit", width: 60 }, { key: "effective", label: "Effective", width: 108 },
];
const path = "/estimating/cost-sources";
export function CostSourceRegister() {
  const params = useSearchParams(), identity = useIdentity();
  const [columns, setColumns] = useState(initialColumns), [hidden, setHidden] = useState<string[]>([]);
  return <Register key={`${params}:${JSON.stringify(identity)}`} query={params.toString()} columns={columns} setColumns={setColumns} hidden={hidden} setHidden={setHidden} />;
}
function Register({ query, columns, setColumns, hidden, setHidden }: { query: string; columns: typeof initialColumns; setColumns: (v: typeof initialColumns) => void; hidden: string[]; setHidden: (v: string[]) => void }) {
  const router = useRouter(), params = new URLSearchParams(query);
  const [menuOpen, setMenuOpen] = useState(true), menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [filters, setFilters] = useState(false), [settings, setSettings] = useState(false), [selectionMode, setSelectionMode] = useState(false), [panelOpen, setPanelOpen] = useState(true);
  const [selected, setSelected] = useState<CostSourceRow[]>([]), [snapshot, setSnapshot] = useState<CostSourceRow | null>(null), [sequence, setSequence] = useState<CostSourceRow[] | null>(null);
  const [actionError, setActionError] = useState<unknown>(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState("");
  const opener = useRef<HTMLElement | null>(null), selectAll = useRef<HTMLInputElement>(null), press = useRef<ReturnType<typeof setTimeout> | null>(null), longPressed = useRef(false);
  const request = `estimating/cost-sources/register${query ? `?${query}` : ""}`;
  const resource = useCrmResource<CostSourceRegisterData>(request, true), data = resource.error ? null : resource.data;
  const rows = data?.items ?? [], validSelection = sourceSelectionCurrent(selected, rows), chosen = rows.filter(r => selected.some(s => s.id === r.id));
  useEffect(() => { if (selectAll.current) selectAll.current.indeterminate = selected.length > 0 && selected.length < rows.length; }, [selected.length, rows.length]);
  useEffect(() => () => { if (press.current) clearTimeout(press.current); }, []);
  function href(values: Record<string, string>, paging = false) {
    const next = new URLSearchParams(params);
    if (!paging) next.delete("offset");
    for (const [key, value] of Object.entries(values)) { if (value && value !== "all") next.set(key, value); else next.delete(key); }
    return `${path}${next.size ? `?${next}` : ""}`;
  }
  function change(values: Record<string, string>, paging = false) { router.push(href(values, paging), { scroll: false }); }
  const view = params.get("view") ?? "all", state = params.get("state") ?? "all", validity = params.get("validity") ?? "all";
  const label = sourceViews.find(v => v.id === view)?.label ?? "Cost sources";
  function closeSnapshot() { setSnapshot(null); setSequence(null); requestAnimationFrame(() => opener.current?.focus({ preventScroll: true })); }
  function refresh() { closeSnapshot(); setSelected([]); setNotice(""); resource.reload(); }
  function inspect(row: CostSourceRow, source: HTMLElement) { opener.current = source; setSequence(null); setSnapshot(row); }
  function toggle(row: CostSourceRow) { setPanelOpen(true); setSelected(old => old.some(r => r.id === row.id) ? old.filter(r => r.id !== row.id) : [...old, row]); }
  async function selectionAction(exporting: boolean, source: HTMLElement) {
    if (!validSelection || busy) return;
    setBusy(true); setActionError(null);
    try {
      const current = await api<CostSourceRegisterData>(request);
      if (!sourceSelectionCurrent(selected, current.items)) { setSelected([]); resource.reload(); setNotice("Sources or access changed. Review the refreshed page and select again."); return; }
      const ordered = current.items.filter(r => selected.some(s => s.id === r.id));
      if (exporting) {
        const url = URL.createObjectURL(new Blob([sourceCsv(ordered)], { type: "text/csv;charset=utf-8" }));
        const a = document.createElement("a"); a.href = url; a.download = "cost-sources-selection.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice(`${ordered.length} selected sources exported. No evidence decision or price changed.`);
      } else { opener.current = source; setSequence(ordered); setSnapshot(ordered[0]); }
    } catch (error) { setActionError(error); setSelected([]); closeSnapshot(); resource.reload(); }
    finally { setBusy(false); }
  }
  function menuLink(key: string, text: string, icon: string, count: number | undefined, values: Record<string, string>, active: boolean) {
    return <li key={key}><Link href={href(values)} aria-current={active ? "page" : undefined} onClick={() => menu.closeOverlay()}><Icon name={icon} /><span>{text}</span><span className="mw-badge">{count ?? "—"}</span></Link></li>;
  }
  const count = data ? `${data.matching_count} source${data.matching_count === 1 ? "" : "s"}` : resource.loading ? "Loading…" : "—";
  function cell(row: CostSourceRow, key: string): ReactNode {
    switch (key) {
      case "source": return <button className="cs-row-link" onClick={e => inspect(row, e.currentTarget)}>{row.reference} <small>r{row.revision}</small></button>;
      case "title": return row.title;
      case "state": return <CostSourceState row={row} />;
      case "expiry": return <CostSourceExpiry row={row} />;
      case "cost": return <span className="cs-tier" title={`Minimum ${row.tier_1.minimum_quantity} ${row.unit}; ${sourceMoney(row.tier_1.unit_cost)} per ${row.unit}; AUD excluding tax`}><span>{sourceMoney(row.tier_1.unit_cost)}</span><small>≥ {row.tier_1.minimum_quantity} {row.unit}</small></span>;
      case "updated": return <time dateTime={String(row.updated_at)} title={formatDateTime(String(row.updated_at))}>{new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Brisbane" }).format(new Date(row.updated_at))}</time>;
      case "supplier": return row.supplier;
      case "item": return row.item;
      case "unit": return row.unit;
      case "effective": return sourceDate(row.effective_from);
    }
  }
  const visibleColumns = columns.filter(c => !hidden.includes(c.key));
  const actions = <><Button disabled={!validSelection || busy} onClick={e => void selectionAction(false, e.currentTarget)}><Icon name="arrow-right" />Open in sequence</Button><Button disabled={!validSelection || busy} onClick={e => void selectionAction(true, e.currentTarget)}><Icon name="files" />Export list</Button></>;
  const hasFilters = [...params.keys()].some(k => k !== "offset" && k !== "limit");
  return <SecondaryMenuFrame id="ppo-cost-sources" name="Cost sources" menuId="cs-menu" contentId="cs-content" state={menu} message={notice || count} phoneHeader={{ title: view === "all" ? "Cost sources" : label, count: data?.matching_count, filter: { open: () => setFilters(true), applied: hasFilters }, pageAction: data?.companies.length ? { label: "New source", icon: "plus", onSelect: () => router.push(`${path}/new`) } : undefined }} menu={<nav aria-label="Cost source views"><ul>{sourceViews.map(v => menuLink(v.id, v.label, v.icon, data?.counts[v.id], { view: v.id }, view === v.id))}</ul><h3>State</h3><ul>{sourceStates.map(s => menuLink(s, s, stateIcon(s), data?.counts.states[s], { state: state === s ? "all" : s }, state === s))}</ul><h3>Validity</h3><ul>{menuLink("unknown", "Expiry unknown", "circle-exclamation", data?.counts.validity.unknown, { validity: validity === "unknown" ? "all" : "unknown" }, validity === "unknown")}{menuLink("past", "Past expiry", "calendar-exclamation", data?.counts.validity.past, { validity: validity === "past" ? "all" : "past" }, validity === "past")}</ul><p className="cs-menu-note">Counts cover all permitted search and supplier matches, before view, state and validity filters.</p></nav>}>
    <div className="cs-workspace"><h1 className="sr-only">Cost sources</h1>
      <div className="cs-list" inert={!!snapshot && !menu.phone}>
        <div className="cs-toolbar">
          {data && selected.length ? <>{actions}<span className="cs-count">{selected.length} selected on this page</span><Button onClick={() => setSelected([])} aria-label="Clear selection"><Icon name="xmark" /></Button><Button onClick={() => setPanelOpen(!panelOpen)}>{panelOpen ? "Hide panel" : "Show panel"}</Button></> : <>
            <div className="cs-desktop">{data?.companies.length ? <ButtonLink variant="primary" href={`${path}/new`}><Icon name="plus" />New source</ButtonLink> : null}</div>
            <form className="cs-search cs-desktop" onSubmit={e => { e.preventDefault(); change({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() }); }}><Icon name="magnifying-glass" /><input type="search" name="q" aria-label="Search source, supplier or item" placeholder="Search source, supplier or item" maxLength={100} defaultValue={params.get("q") ?? ""} /><button type="submit" className="sr-only">Search sources</button></form>
            <Button className="cs-desktop cs-supplier" onClick={() => setFilters(true)}>Supplier: {params.get("supplier") || "All suppliers"}<Icon name="chevron-down" /></Button>
            <Button className="cs-phone" onClick={e => menu.toggle(e.currentTarget)}>{label}<Icon name="chevron-down" /></Button>
            <span className="cs-count">{count}<span className="cs-desktop"> · AUD, excluding tax</span></span>
            <Button className="cs-icon-button cs-desktop" aria-label="Refresh cost sources" onClick={refresh}><Icon name="rotate-left" /></Button>
            <Button className="cs-icon-button cs-phone" aria-label="Filter cost sources" onClick={() => setFilters(true)}><Icon name="bars-filter" /></Button>
            <WorklistMenu label="Cost source actions" icon="more" choices><button data-menu-close onClick={() => setSelectionMode(!selectionMode)}>{selectionMode ? "Finish selecting" : "Select sources"}</button><button data-menu-close onClick={refresh}>Refresh cost sources</button><button data-menu-close onClick={() => setSettings(true)}>Column settings</button><Link data-menu-close href={path}>Clear all filters</Link></WorklistMenu>
          </>}
        </div>
        {hasFilters && <div className="cs-filter-summary">{params.get("q") && <span>Search: {params.get("q")}</span>}{params.get("supplier") && <span>Supplier contains: {params.get("supplier")}</span>}{view !== "all" && <span>{label}</span>}{state !== "all" && <span>State: {state}</span>}{validity !== "all" && <span>Validity: {validity}</span>}{params.get("company_id") && <span>Company: {params.get("company_id")}</span>}<Link href={path}>Clear filters</Link></div>}
        <CostSourceReadNotice {...resource} /><ErrorNotice error={actionError} />{notice && <p className="cs-notice" role="status">{notice}</p>}
        {data && selected.length > 0 && !validSelection && <p className="cs-notice" role="status">Selected evidence changed. Clear the selection and choose current rows before continuing.</p>}
        {data && <div className="cs-results">
          {!rows.length ? <RegisterEmpty title={data.matching_count > 0 ? "This page is no longer in range" : data.counts.all || hasFilters ? "No sources match these filters" : "No cost sources yet"}><p>{data.matching_count > 0 ? "Sources may have moved as other people updated them." : "Create synthetic evidence where permitted, or clear filters to see other sources."}</p><Button onClick={() => change({ offset: "" }, true)}>First page</Button><Link href={path}>Clear filters</Link></RegisterEmpty> : <>
            <div className="cs-desktop cs-grid"><RegisterTable caption="Cost sources, newest update first. Open a source to inspect its exact revision; checkboxes select only this page."><thead><tr><th className="cs-fixed-select"><input ref={selectAll} type="checkbox" aria-label="Select all sources on this page" checked={selected.length === rows.length && rows.length > 0} onChange={e => { setPanelOpen(true); setSelected(e.target.checked ? rows : []); }} /></th>{visibleColumns.map(c => <th key={c.key} style={{ width: c.width, minWidth: c.width }} aria-sort={c.key === "updated" ? "descending" : undefined}><span className="ppo-register-label">{c.label}{c.key === "updated" && <Icon name="chevron-down" />}</span></th>)}<th className="cs-fixed-actions"><Button variant="quiet" aria-label="Column settings" onClick={() => setSettings(true)}><Icon name="gear" /></Button></th></tr></thead><tbody>{rows.map(row => <tr key={row.id} data-selected={selected.some(s => s.id === row.id) || undefined} data-inspected={snapshot?.id === row.id || undefined} onClick={e => { if (!(e.target as HTMLElement).closest("button,a,input,label")) inspect(row, e.currentTarget.querySelector<HTMLElement>(".cs-row-link")!); }}>{<td className="cs-fixed-select"><input type="checkbox" aria-label={`Select ${row.reference}`} checked={selected.some(s => s.id === row.id)} onChange={() => toggle(row)} /></td>}{visibleColumns.map(c => <td key={c.key} style={{ width: c.width, minWidth: c.width, maxWidth: c.width } as CSSProperties} title={typeof cell(row, c.key) === "string" ? String(cell(row, c.key)) : undefined}>{cell(row, c.key)}</td>)}<td className="cs-fixed-actions"><WorklistMenu label={`Actions for ${row.reference}`} icon="more" choices><button data-menu-close onClick={e => inspect(row, e.currentTarget)}>Source snapshot</button><Link href={exactSourceHref(row.id, row.revision_id)}>Open source r{row.revision}</Link>{row.can_review && <Link href={`${exactSourceHref(row.id, row.revision_id)}#source-review`}>Review evidence</Link>}</WorklistMenu></td></tr>)}</tbody></RegisterTable></div>
            <div className="cs-phone cs-phone-list">{rows.map(row => <div key={row.id} className="cs-phone-row" data-selected={selected.some(s => s.id === row.id) || undefined}>{(selectionMode || selected.length > 0) && <input type="checkbox" aria-label={`Select ${row.reference}`} checked={selected.some(s => s.id === row.id)} onChange={() => toggle(row)} />}<button className="cs-phone-open" onPointerDown={e => { if (e.pointerType === "touch") { longPressed.current = false; press.current = setTimeout(() => { longPressed.current = true; setSelectionMode(true); toggle(row); }, 550); } }} onPointerUp={() => { if (press.current) clearTimeout(press.current); }} onPointerCancel={() => { if (press.current) clearTimeout(press.current); }} onPointerMove={() => { if (press.current) clearTimeout(press.current); }} onClick={e => { if (longPressed.current) { longPressed.current = false; return; } if (selectionMode) toggle(row); else inspect(row, e.currentTarget); }}><span className="cs-phone-title"><strong>{row.title}</strong><span>{sourceMoney(row.tier_1.unit_cost)}</span></span><small>{row.reference} r{row.revision} · {row.supplier}</small><small className="cs-phone-tier">Minimum {row.tier_1.minimum_quantity} {row.unit} · AUD / {row.unit}, excl. tax</small><span className="cs-phone-status"><CostSourceState row={row} /><CostSourceExpiry row={row} phone /></span></button><Icon name="chevron-right" /></div>)}</div>
          </>}
          <RegisterFooter><span>{rows.length ? `${data.offset + 1}–${data.offset + rows.length} of ${data.matching_count}` : `0 shown · ${data.matching_count} matching`} · newest update first</span><Button disabled={data.offset === 0} onClick={() => change({ offset: String(Math.max(0, data.offset - data.limit)) }, true)}>Previous page</Button><Button disabled={data.next_offset === null} onClick={() => change({ offset: String(data.next_offset) }, true)}>Next page</Button><small>Expiry date basis: {data.validity_date}, Brisbane. Paging reflects current results.</small></RegisterFooter>
        </div>}
      </div>
      {data && selected.length > 0 && panelOpen && !snapshot && <aside className="cs-selection" aria-label="Selected sources"><header><h2>{selected.length} sources selected</h2></header><div>{chosen.map(r => <article key={r.id}><strong>{r.reference} r{r.revision} · {r.state}</strong><small>{r.title} · expiry {sourceDate(r.valid_until)}</small></article>)}<p className="cs-rule">Evidence decisions are made one revision at a time by an independent reviewer, with a reason. These actions open or list sources; they do not decide anything.</p><h3>For the selection</h3>{actions}<p className="cs-small">Open in sequence follows newest update first. Export lists the selected exact revisions only.</p></div><footer><Button onClick={() => setSelected([])}>Cancel</Button><Button variant="primary" disabled={!validSelection || busy} onClick={e => void selectionAction(false, e.currentTarget)}>Open first source</Button></footer></aside>}
      {data && snapshot && <CostSourceSnapshot key={`${snapshot.id}:${snapshot.revision_id}`} row={snapshot} rows={sequence ?? rows} phone={menu.phone} onSelect={setSnapshot} onClose={closeSnapshot} onRefresh={refresh} />}
    </div>
    {filters && <WorklistPanel title="Filter cost sources" onClose={() => setFilters(false)}><form className="cs-filter-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); change(Object.fromEntries(["q", "supplier", "state", "validity", "view"].map(k => [k, String(f.get(k) ?? "").trim()]))); setFilters(false); }}><label>Search source, supplier or item<input name="q" type="search" defaultValue={params.get("q") ?? ""} maxLength={100} /></label><label>Supplier label contains<input name="supplier" defaultValue={params.get("supplier") ?? ""} maxLength={100} /></label><p>Literal text search across all permitted matches. Supplier labels are not canonical supplier identities.</p><label>View<select name="view" defaultValue={view}>{sourceViews.map(v => <option value={v.id} key={v.id}>{v.label}</option>)}</select></label><label>State<select name="state" defaultValue={state}><option value="all">All states</option>{sourceStates.map(s => <option key={s}>{s}</option>)}</select></label><label>Validity<select name="validity" defaultValue={validity}><option value="all">All validity</option><option value="unknown">Expiry unknown</option><option value="past">Past expiry</option></select></label><Button type="submit" variant="primary">Apply filters</Button><Link href={path}>Clear filters</Link></form></WorklistPanel>}
    {settings && <WorklistPanel title="Cost source columns" onClose={() => setSettings(false)}><p>Show, resize and reorder columns for this visit. Source, title and state stay visible; selection and actions stay fixed. Results are ordered by newest update across all pages.</p>{columns.map((c, i) => <Fragment key={c.key}><div className="cs-column-setting"><label><input type="checkbox" checked={!hidden.includes(c.key)} disabled={c.required} onChange={e => setHidden(e.target.checked ? hidden.filter(k => k !== c.key) : [...hidden, c.key])} />{c.label}</label><label>Width<input aria-label={`${c.label} column width`} type="number" min={60} max={500} step={4} value={c.width} onChange={e => { const width = Number(e.target.value); if (width >= 60 && width <= 500) setColumns(columns.map(x => x.key === c.key ? { ...x, width } : x)); }} /></label><Button aria-label={`Move ${c.label} left`} disabled={i === 0} onClick={() => { const next = [...columns]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setColumns(next); }}>←</Button><Button aria-label={`Move ${c.label} right`} disabled={i === columns.length - 1} onClick={() => { const next = [...columns]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; setColumns(next); }}>→</Button></div></Fragment>)}<Button onClick={() => { setColumns(initialColumns); setHidden([]); }}>Reset columns</Button></WorklistPanel>}
  </SecondaryMenuFrame>;
}
