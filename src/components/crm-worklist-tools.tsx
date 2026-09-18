"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ProductIcon, type ProductIconName } from "./product-icons";
import { Stamp } from "./business-ui";
import { dealAmount, dealClose } from "./crm-deal-controls";
import type { WorklistItem } from "../crm/worklist";
import { initialWorklistFilters, type WorklistFilters } from "../crm/worklist-location";
import { forecastGroups, needsAttention, actionLabels } from "../crm/worklist-presentation";
import { valueSummary } from "../crm/value-summary";

export function WorklistMenu({ label, icon, children, className = "", text, disabled = false, choices = false }: { label: string; icon?: ProductIconName; children: ReactNode; className?: string; text?: ReactNode; disabled?: boolean; choices?: boolean }) {
  const id = useId(), ref = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), typed = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const position = () => {
    const menu = ref.current, anchor = trigger.current;
    if (!menu || !anchor) return;
    const bounds = anchor.getBoundingClientRect();
    menu.style.maxHeight = `${Math.max(80, window.innerHeight - 16)}px`;
    const width = menu.offsetWidth || Math.min(320, window.innerWidth - 16), height = menu.offsetHeight;
    menu.style.left = `${Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(bounds.bottom + 6, window.innerHeight - height - 8))}px`;
  };
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [open]);
  return <><button ref={trigger} type="button" className={`secondary crm-r38-menu-trigger ${className}`} aria-label={label} aria-haspopup={choices ? "menu" : "dialog"} aria-expanded={open} aria-controls={id} popoverTarget={id} disabled={disabled} onClick={position} onKeyDown={e => {
    if (["ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); ref.current?.showPopover(); }
  }}>{icon && <ProductIcon name={icon}/>} {text}</button><div id={id} ref={ref} popover="auto" role={choices ? "menu" : "dialog"} aria-label={label} className="crm-r38-popover" onToggle={e => {
    const shown = e.newState === "open"; setOpen(shown);
    if (shown) { position(); if (choices) ref.current?.querySelector<HTMLElement>('[aria-checked="true"],button:not(:disabled),a[href]')?.focus(); }
  }} onKeyDown={e => {
    if (e.key === "Escape") { e.preventDefault(); ref.current?.hidePopover(); trigger.current?.focus(); return; }
    if ((e.target as HTMLElement).matches("input,textarea,select")) return;
    const items = [...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]') ?? [])], current = items.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    if (e.key === "Home") next = items[0];
    else if (e.key === "End") next = items.at(-1);
    else if (e.key === "ArrowDown") next = items[(current + 1) % items.length];
    else if (e.key === "ArrowUp") next = items[(current - 1 + items.length) % items.length];
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && e.key !== " ") {
      typed.current = { text: (Date.now() - typed.current.at < 600 ? typed.current.text : "") + e.key.toLowerCase(), at: Date.now() };
      next = items.find(item => item.textContent?.trim().toLowerCase().startsWith(typed.current.text));
    }
    if (next) { e.preventDefault(); next.focus(); }
  }} onClick={e => { if ((e.target as HTMLElement).closest("[data-menu-close]")) { ref.current?.hidePopover(); trigger.current?.focus(); } }}><h2>{label}</h2>{children}</div></>;
}

export function WorklistChoice({ label, value, options, onChange, icon, prefix = "", className = "", disabled = false }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (value: string) => void; icon?: ProductIconName; prefix?: string; className?: string; disabled?: boolean }) {
  return <WorklistMenu label={label} choices icon={icon} disabled={disabled} className={className} text={<><span>{prefix}{options.find(option => option.id === value)?.label ?? "Choose…"}</span><ProductIcon name="chevron"/></>}>
    {options.map(option => <button key={option.id} type="button" className="secondary crm-menu-choice" role="menuitemradio" aria-checked={option.id === value} data-menu-close onClick={() => onChange(option.id)}>{option.label}{option.id === value && <ProductIcon name="check"/>}</button>)}
  </WorklistMenu>;
}

export function WorklistPanel({ title, children, onClose, drawer = false }: { title: string; children: ReactNode; onClose: () => void; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  useEffect(() => { const dialog = ref.current, previous = document.activeElement as HTMLElement | null; dialog?.showModal(); return () => { dialog?.close(); previous?.focus({ preventScroll: true }); }; }, []);
  return <dialog ref={ref} className={`crm-r38-panel ${drawer ? "crm-r38-drawer" : ""}`} aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }}><header><h2 id={id}>{title}</h2><button className="secondary" aria-label={`Close ${title}`} onClick={onClose}><ProductIcon name="close"/></button></header><div className="crm-r38-panel-body">{children}</div><footer><button className="secondary" onClick={onClose}>Done</button></footer></dialog>;
}

const viewBasis = (filters: WorklistFilters) => JSON.stringify({ ...filters, cursor: "" });
export function WorklistViews({ filters, actor, setFilters }: { filters: WorklistFilters; actor: string; setFilters: (filters: WorklistFilters) => void }) {
  const [saved, setSaved] = useState<{ name: string; filters: WorklistFilters }[]>([]), [current, setCurrent] = useState(filters.outcome === "Open" ? "All open" : "All closed"), [name, setName] = useState("");
  const defaults = { ...initialWorklistFilters, pipeline_definition_id: filters.pipeline_definition_id, outcome: filters.outcome };
  const views = [{ name: filters.outcome === "Open" ? "All open" : "All closed", filters: defaults }, { name: "Owned by me", filters: { ...defaults, owner_id: actor } }, { name: "Overdue activities", filters: { ...defaults, next_action: "Overdue" } }, { name: "No next activity", filters: { ...defaults, next_action: "Needed" } }, ...saved];
  const basis = views.find(view => view.name === current)?.filters;
  const modified = basis && viewBasis(basis) !== viewBasis(filters);
  return <WorklistMenu label="Views" icon="search" text={<><span className="crm-saved-name">{current}</span>{modified && <small>Modified</small>}<ProductIcon name="chevron"/></>}>
    {views.map(view => <button className="secondary crm-menu-choice" key={view.name} aria-pressed={current === view.name} data-menu-close onClick={() => { setCurrent(view.name); setFilters({ ...view.filters, cursor: "" }); }}>{view.name}{current === view.name && <ProductIcon name="check"/>}</button>)}
    <form className="crm-save-view" onSubmit={e => { e.preventDefault(); const clean = name.trim(); if (!clean || views.some(view => view.name === clean)) return; setSaved(old => [...old, { name: clean, filters: { ...filters, cursor: "" } }]); setCurrent(clean); setName(""); }}>
      <label>New view name<input value={name} maxLength={60} required onChange={e => setName(e.target.value)} /></label><button disabled={!name.trim() || views.some(view => view.name === name.trim())}>Save as new view</button>
    </form><p>Named views keep filters and sorting for this visit. The address bar retains your current view on reload.</p>
  </WorklistMenu>;
}

export function ForecastWorklist({ items, asOf, onEdit }: { items: WorklistItem[]; asOf: string; onEdit: (id: string) => void }) {
  const [months, setMonths] = useState(3);
  return <section className="crm-forecast-workspace" aria-label="Opportunity forecast"><header className="crm-view-intro"><div><h2>Forecast</h2><p>Expected close dates · {valueSummary(items).formatted} known · AUD excl. GST</p></div><label>Show<select aria-label="Forecast period" value={months} onChange={e => setMonths(Number(e.target.value))}>{[3, 6, 12].map(n => <option key={n} value={n}>{n} months</option>)}</select></label></header><div className="crm-forecast-scroll"><div className="crm-forecast-grid">{forecastGroups(items, asOf, months).map(group => <section className="crm-forecast-month" key={group.id} aria-label={group.label}><header><h3>{group.label}</h3><strong>{valueSummary(group.items).formatted}</strong><span>{group.items.length} deals · {valueSummary(group.items).unknown} not estimated</span></header><div>{group.items.map(item => <article key={item.id} className="crm-forecast-card"><Link href={`/sales/opportunities/${item.id}`}>{item.title}</Link><p>{item.organisation_name}</p><div><span>{item.stage_id}</span><strong>{dealAmount(item.value_amount)}</strong></div><p>{item.owner_name}</p><button className="secondary" disabled={!item.can_edit || item.close_outcome !== "Open"} aria-label={`Change expected close date for ${item.title}`} onClick={() => onEdit(item.id)}><ProductIcon name="calendar"/>{dealClose(item.expected_close_date)}</button></article>)}{!group.items.length && <p className="crm-stage-empty">No matching opportunities</p>}</div></section>)}</div></div><p className="crm-view-footnote">Totals cover this result page. Stage probabilities are not configured; values are unweighted and are not committed revenue.</p></section>;
}

export function WorklistReview({ kind, items, asOf, onOpen, onClose }: { kind: "triage" | "changes" | "help"; items: WorklistItem[]; asOf: string; onOpen: (id: string) => void; onClose: () => void }) {
  const records = kind === "triage" ? items.filter(needsAttention).sort((a, b) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999")) : items.toSorted((a, b) => b.updated_at.localeCompare(a.updated_at));
  return <WorklistPanel title={kind === "triage" ? "Triage" : kind === "changes" ? "What changed" : "Deal board guide"} onClose={onClose}>
    {kind === "help" ? <div className="crm-help-copy"><h3>Review and progress deals</h3><p>Board, List and Forecast share the same permitted records, filters and sort. Archive shows saved Won and Lost outcomes. The count and totals always state whether they cover all matching results or one page.</p><p>Open a deal using its title. The eye opens a snapshot; the calendar opens its next activity; the pencil edits the saved deal. Use Change stage in the card footer as the keyboard and touch alternative to dragging. A stage change is saved only when the server confirms it.</p><h3>Find your working view</h3><p>Views, Add condition and Filters share the same criteria. Named views are kept for this visit; current criteria and presentation survive reloads in the URL. Use the search field for opportunity titles, references and organisations.</p><h3>Forecast and review</h3><p>Forecast groups expected close dates into months, with overdue, later and undated groups. Amounts remain unweighted because stage probabilities are not configured. Triage shows overdue or missing activity details. What changed lists last-updated records; open the deal for its retained event history.</p><h3>Available app services</h3><p>Creation, editing, stage changes, owned activities and Won/Lost use existing saved workflows. Won still requires the final stage and records a handover obligation. It does not create an ERP order or authorise delivery.</p><p>Pipeline editing, probability/rotting configuration, separate internal Tasks, bulk import/cleanup, manual archiving, deletion/restore and outbound email remain design-only. The current app retains its configured stage identities and permissions.</p></div> : <><p>{kind === "triage" ? "Open deals with overdue activities, no next activity or missing activity dates." : "Most recently updated records on this result page. Updated time alone does not establish a stage movement; open the deal to review the saved history."}</p><p className="crm-view-footnote">Current result page · As at <Stamp value={asOf}/></p><div className="crm-review-list">{records.map(item => <article key={item.id}><div><strong>{item.title}</strong><p>{item.organisation_name} · {item.owner_name}</p><span>{kind === "triage" ? actionLabels[item.next_action_state] : <Stamp value={item.updated_at}/>}</span></div><button className="secondary" onClick={() => { onClose(); onOpen(item.id); }}>Review</button></article>)}{!records.length && <p>No matching records on this page.</p>}</div></>}
  </WorklistPanel>;
}
