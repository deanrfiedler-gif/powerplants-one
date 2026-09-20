"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { dueMeanings, releaseStages, workflowPresentation, workflows } from "../../model";
import type { readOptions, readRegister } from "../../reads";
import { useCommissioning } from "./commissioning-shell";
import { CommandNotice, Dialog, Field, Icon, Menu, ReadNotice, Reason, Tag, fieldError, longDate, newId, siteTime, text, useCommissioningCommand, useRead, type MenuItem } from "./commissioning-ui";

type Register = Awaited<ReturnType<typeof readRegister>>;
type Row = Register["items"][number];
type Selected = NonNullable<Register["selected"]>;
type Options = Awaited<ReturnType<typeof readOptions>>;

// Six default columns, always shown in this order. The optional ones are a personal presentation choice kept by the shell.
const columns = [["package", "Package"], ["area", "Area / system"], ["evidence", "Test evidence"], ["as_built", "As-built"], ["next", "Next requirement"], ["owner", "Owner / due"]] as const;
type ColumnId = (typeof columns)[number][0];
const optional = [["basis", "Test basis"], ["configuration", "Installed configuration"], ["last_test", "Last test date"], ["release", "Release reference"], ["service", "Service receiving"], ["workflow", "Workflow"]] as const;
type OptionalId = (typeof optional)[number][0];
const sortFor: Partial<Record<ColumnId | OptionalId, string>> = { package: "title", area: "area", owner: "due", workflow: "workflow" };
const sortLabels: Record<string, string> = { due: "Due date", reference: "Reference", title: "Package", area: "Area / system", owner: "Owner", workflow: "Workflow", updated: "Latest update" };
const viewLabels: Record<string, string> = { all: "All packages", mine: "My reviews", retests: "Retests required", ready: "Ready for release", handover: "Handover outstanding", archived: "Archived" };
const dueLabels: Record<string, string> = { overdue: "Overdue", needed: "Date needed" };
const criteriaKeys = ["view", "q", "workflow", "owner_id", "area", "blocker", "due", "sort", "dir", "page"] as const;
const adapterLabels: Record<string, string> = { SyntheticUpstreamFixture: "the synthetic upstream adapter", ManualAssessment: "manual assessment" };
const packages = (n: number) => `${n} package${n === 1 ? "" : "s"}`;
// The calendar date an instant fell on at the site, written like every other date here: "19 Sep 2026".
const siteDate = (value: string, timezone: string | null) => longDate(new Intl.DateTimeFormat("en-CA", { timeZone: timezone ?? "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)));

export function RegisterView() {
  const { packageId, reloadFrame, announce, optionalColumns, setOptionalColumns, href } = useCommissioning();
  const router = useRouter(), path = usePathname(), search = useSearchParams();
  const criteria = useMemo(() => Object.fromEntries(criteriaKeys.flatMap((k) => (search.get(k) ? [[k, search.get(k)!]] : []))), [search]);
  const inspected = search.get("record"), creating = search.get("new") === "1";
  const query = useMemo(() => new URLSearchParams({ ...criteria, ...(inspected ? { record: inspected } : {}) }).toString(), [criteria, inspected]);
  const register = useRead<Register>(`engineering/${packageId}/commissioning${query ? `?${query}` : ""}`);
  const q = criteria.q ?? "", [draft, setDraft] = useState(q), [sent, setSent] = useState(q), [seen, setSeen] = useState(q), [filters, setFilters] = useState(true);
  const data = register.data, items = data?.items ?? [];
  // Back, Forward or a pasted link may change the search in the address: the field follows it, but never over typing in progress.
  if (q !== seen) {
    setSeen(q);
    if (q !== sent) { setSent(q); setDraft(q); }
  }

  // Every criterion lives in the URL, so Back, Forward, reload and a pasted link restore the same results. The
  // Engineering package always stays in the address. Typing replaces the entry; a deliberate choice adds one.
  const go = (changes: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(changes)) if (v === null || v === "") next.delete(k); else next.set(k, v);
    if (!("page" in changes) && !("record" in changes) && !("new" in changes)) next.delete("page");
    next.set("package", packageId);
    const to = `${path}?${next}`;
    if (replace) router.replace(to, { scroll: false }); else router.push(to, { scroll: false });
  };
  useEffect(() => {
    const timer = setTimeout(() => { if (draft !== q) { setSent(draft); go({ q: draft || null }, true); } }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);
  // Result changes are announced politely, with the scope the numbers belong to.
  useEffect(() => {
    if (data) announce(`${packages(data.total)} shown of ${data.counts.package_total} in this Engineering package.`);
  }, [data, announce]);

  const extra = optional.filter(([id]) => optionalColumns.includes(id));
  const conditions: [string, string][] = [
    ...(criteria.workflow ? [["workflow", `Workflow: ${workflowPresentation[criteria.workflow as keyof typeof workflowPresentation]?.label ?? criteria.workflow}`] as [string, string]] : []),
    ...(criteria.owner_id ? [["owner_id", `Owner: ${data?.options.owners.find((o) => o.id === criteria.owner_id)?.name ?? "selected person"}`] as [string, string]] : []),
    ...(criteria.blocker ? [["blocker", `Next requirement: ${data?.options.blockers.find((b) => b.code === criteria.blocker)?.label ?? text(criteria.blocker)}`] as [string, string]] : []),
    ...(criteria.due ? [["due", `Due: ${dueLabels[criteria.due] ?? criteria.due}`] as [string, string]] : []),
  ];
  const addCondition: MenuItem[] = [
    // Archived packages have their own saved view; the workflow condition covers the rest.
    ...workflows.filter((w) => w !== "Archived").map((w) => ({ id: `w-${w}`, label: `Workflow: ${workflowPresentation[w].label}`, checked: criteria.workflow === w, onSelect: () => go({ workflow: criteria.workflow === w ? null : w }) })),
    { id: "sep1", separator: true as const },
    ...(data?.options.owners ?? []).map((o) => ({ id: `o-${o.id}`, label: `Owner: ${o.name}`, checked: criteria.owner_id === o.id, onSelect: () => go({ owner_id: criteria.owner_id === o.id ? null : o.id }) })),
    { id: "sep2", separator: true as const },
    ...(data?.options.blockers ?? []).map((b) => ({ id: `b-${b.code}`, label: `Next requirement: ${b.label}`, checked: criteria.blocker === b.code, onSelect: () => go({ blocker: criteria.blocker === b.code ? null : b.code }) })),
    { id: "sep3", separator: true as const },
    ...Object.entries(dueLabels).map(([id, label]) => ({ id: `d-${id}`, label: `Due: ${label}`, checked: criteria.due === id, onSelect: () => go({ due: criteria.due === id ? null : id }) })),
  ];
  const sort = criteria.sort ?? "due", dir = criteria.dir ?? "asc", view = criteria.view ?? "all", active = conditions.length + (criteria.area ? 1 : 0);
  const from = data && data.total ? (data.page - 1) * data.page_size + 1 : 0, to = data ? Math.min(data.page * data.page_size, data.total) : 0;
  const clear = () => { setDraft(""); setSent(""); go({ q: null, area: null, workflow: null, owner_id: null, blocker: null, due: null }); };
  const exportHref = () => {
    const { page: _page, ...kept } = criteria; void _page;
    return `/api/v1/engineering/${packageId}/commissioning/files?${new URLSearchParams({ kind: "export", ...kept })}`;
  };
  const toggleColumn = (id: string) => setOptionalColumns(optionalColumns.includes(id) ? optionalColumns.filter((c) => c !== id) : [...optionalColumns, id]);
  const today = data?.observed_at.slice(0, 10) ?? "", timezone = data?.package.site_timezone ?? null;
  // The inspector shows the record the address names and nothing else: while the next one loads it shows no earlier record.
  const selected = data?.selected?.id === inspected ? data.selected : null;

  return (
    <div className="em-split" data-inspector={inspected ? "open" : "closed"}>
      <section className="em-register" aria-label="Commissioning register" aria-busy={register.loading}>
        <div className="em-toolbar">
          <label className="cm-view"><span className="mw-sr">Saved view</span>
            <select value={view} onChange={(e) => go({ view: e.target.value === "all" ? null : e.target.value })}>
              {/* A view is a filter over the same records. An unavailable count stays blank; it is never shown as zero. */}
              {Object.entries(viewLabels).map(([id, label]) => <option key={id} value={id}>{label}{typeof data?.counts.views[id] === "number" ? ` (${data.counts.views[id]})` : ""}</option>)}
            </select>
          </label>
          <label className="em-search"><Icon name="search" /><span className="mw-sr">Search packages</span>
            <input type="search" placeholder="Search packages" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={200} />
          </label>
          <span className="mw-spacer" />
          <button type="button" className="mw-button" aria-expanded={filters} aria-controls={filters ? "cm-filters" : undefined} onClick={() => setFilters((v) => !v)}><Icon name="filter" /><span>Filters</span>{active > 0 && <span className="mw-count" aria-label={`${active} active`}>{active}</span>}</button>
          <Menu name="Columns" icon="columns" label="Columns" align="end" keepOpen items={[
            ...optional.map(([id, label]) => ({ id, label, checked: optionalColumns.includes(id), onSelect: () => toggleColumn(id) })),
            { id: "sep", separator: true as const },
            { id: "reset", label: "Reset columns", hint: "Back to the six standard columns", disabled: !extra.length, onSelect: () => setOptionalColumns([]) },
          ]} />
          <Menu name="More actions" icon="dots" label="More" iconOnly align="end" items={[
            { id: "csv", label: "Export this view (CSV)", hint: "Follows your access; issues and distributes nothing", onSelect: () => { window.location.href = exportHref(); } },
            { id: "history", label: "Open handover & history", onSelect: () => router.push(href("handovers")) },
          ]} />
        </div>
        {filters && (
          <div className="em-toolbar em-toolbar-second" id="cm-filters">
            <label className="em-select"><span className="mw-sr">Area</span>
              <select value={criteria.area ?? ""} onChange={(e) => go({ area: e.target.value || null })}>
                <option value="">All areas</option>
                {criteria.area && !data?.options.areas.includes(criteria.area) && <option>{criteria.area}</option>}
                {(data?.options.areas ?? []).map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
            <Menu name="Add condition" icon="plus" label="Add condition" items={addCondition} />
            {conditions.map(([key, label]) => (
              <span key={key} className="em-condition">{label}<button type="button" aria-label={`Remove condition ${label}`} onClick={() => go({ [key]: null })}><Icon name="close" /></button></span>
            ))}
            {(active > 0 || q) && <button type="button" className="mw-link" onClick={clear}>Clear filters</button>}
            <span className="mw-spacer" />
            {/* The count says what it covers: this filtered view, of the whole permitted Engineering package. */}
            <span className="mw-muted cm-count">{data ? `${packages(data.total)}${data.counts.conditioned || view !== "all" ? ` of ${data.counts.package_total} in this Engineering package` : ""}` : "…"}</span>
            <Menu name="Sort" label={`Sort: ${sortLabels[sort] ?? sort}${dir === "desc" ? " (descending)" : ""}`} align="end" items={[
              ...Object.entries(sortLabels).map(([id, label]) => ({ id, label, checked: sort === id, onSelect: () => go({ sort: id === "due" ? null : id }) })),
              { id: "sep", separator: true as const },
              { id: "dir", label: dir === "asc" ? "Descending" : "Ascending", hint: "Unknown values stay last either way", onSelect: () => go({ dir: dir === "asc" ? "desc" : null }) },
            ]} />
          </div>
        )}
        <ReadNotice error={register.error} what="The commissioning register" />
        <div className="em-table-scroll" data-stale={register.stale || undefined}>
          <table className="em-table cm-register-table" style={{ "--cm-extra": extra.length } as React.CSSProperties}>
            <caption className="mw-sr">Commissioning packages of this Engineering package. Opening a package inspects it; it approves, issues and completes nothing.</caption>
            <thead>
              <tr>
                {[...columns, ...extra].map(([id, label]) => {
                  const key = sortFor[id];
                  return (
                    <th key={id} scope="col" className={`cm-col-${id}`} aria-sort={key && sort === key ? (dir === "asc" ? "ascending" : "descending") : undefined}>
                      {key ? <button type="button" onClick={() => go(sort === key ? { dir: dir === "asc" ? "desc" : null } : { sort: key === "due" ? null : key, dir: null })}>{label}</button> : <span>{label}</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} data-inspected={r.id === inspected || undefined}
                  onClick={(e) => { if (!(e.target as HTMLElement).closest("input,button,a,label")) go({ record: r.id }); }}>
                  {columns.map(([id]) => <Cell key={id} id={id} row={r} today={today} open={href("register", { ...criteria, record: r.id })} />)}
                  {extra.map(([id, label]) => <ExtraCell key={id} id={id} label={label} row={r} timezone={timezone} />)}
                </tr>
              ))}
            </tbody>
          </table>
          {data && !items.length && (
            <div className="em-empty">
              {data.total > 0 ? <><strong>No packages on this page</strong><p>{packages(data.total)} match{data.total === 1 ? "es" : ""}, and page {data.page} is past the last.</p><button type="button" className="mw-button" onClick={() => go({ page: null })}>Show the first page</button></>
                : data.counts.package_total === 0 ? <><strong>No commissioning packages yet</strong><p>{data.can.edit ? "Create the first commissioning package with “Commissioning package” in the context row above." : "Nothing has been prepared for this Engineering package."}</p></>
                : <><strong>No packages match</strong><p>{packages(data.counts.package_total)} exist{data.counts.package_total === 1 ? "s" : ""} in this Engineering package. {view !== "all" ? `“${viewLabels[view] ?? view}” and the active` : "The active"} filters hide {data.counts.package_total === 1 ? "it" : "them"}.</p>
                  <button type="button" className="mw-button" onClick={() => { setDraft(""); setSent(""); go({ view: null, q: null, area: null, workflow: null, owner_id: null, blocker: null, due: null }); }}>Clear filters</button></>}
            </div>
          )}
          {!data && register.loading && <div className="em-empty"><p>Loading the commissioning register…</p></div>}
        </div>
        <footer className="em-table-foot">
          <span>{data ? packages(data.total) : "…"}</span>
          <span className="mw-spacer" />
          <span>{from}–{to} of {data?.total ?? "…"}</span>
          <button type="button" className="mw-icon-button" aria-label="Previous page" disabled={!data || data.page <= 1} onClick={() => go({ page: String((data?.page ?? 2) - 1) })}><Icon name="chevron-left" /></button>
          <button type="button" className="mw-icon-button" aria-label="Next page" disabled={!data || to >= data.total} onClick={() => go({ page: String((data?.page ?? 1) + 1) })}><Icon name="chevron-right" /></button>
        </footer>
        <footer className="em-page-foot"><span>Synthetic preview · {data ? longDate(today) : "…"}</span><span>A technical release is not Project completion.</span></footer>
      </section>
      {inspected && data && <Inspector key={inspected} selected={selected} unavailable={!register.stale && data.selection === "Unavailable"} timezone={timezone} stale={register.stale} onClose={() => go({ record: null })} />}
      {creating && data && <NewPackage refusal={data.can.edit ? null : "This identity may read this commissioning work but cannot prepare it."} onClose={() => go({ new: null }, true)} onCreated={(id) => { register.reload(); reloadFrame(); router.push(href("basis", { record: id })); }} />}
    </div>
  );
}

function Cell({ id, row: r, today, open }: { id: ColumnId; row: Row; today: string; open: string }) {
  if (id === "package")
    return (
      <td className="cm-col-package">
        {/* A real link: Enter opens the inspector, and the address names the package. */}
        <Link className="em-row-title" href={open} scroll={false} aria-label={`Inspect ${r.reference}, ${r.title}`}>{r.title}</Link>
        <span className="em-cell-sub">{r.reference}</span>
      </td>
    );
  if (id === "area") return <td data-label="Area / system">{r.area}<span className="em-cell-sub">{r.system_name}</span></td>;
  if (id === "evidence") return <td data-label="Test evidence"><Tag view={r.evidence_view} /></td>;
  if (id === "as_built") return <td data-label="As-built"><Tag view={r.as_built_view} /></td>;
  // A blocker is a condition and is shown as one. An ordinary next step is plain words: it is not a status.
  if (id === "next")
    return (
      <td data-label="Next requirement">
        {r.next.kind === "condition" ? <Tag view={{ label: r.next.label, tone: r.next.tone, icon: "alert" }} />
          : <span className="cm-step"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3.5h7.5L19 8v12.5H7Z" /><path d="M14.5 3.5V8H19M10 12.5h6M10 16h6" /></svg>{r.next.label}</span>}
      </td>
    );
  // A missing date is "Date needed" with nothing invented beside it; a future date is plain; overdue says so in words.
  return (
    <td data-label="Owner / due">
      {r.owner_name ?? "Unassigned"}
      <span className="em-cell-sub">{longDate(r.due)}{r.due && r.due < today && !r.archived && <> · <span className="cm-due-overdue">Overdue</span></>}</span>
    </td>
  );
}
function ExtraCell({ id, label, row: r, timezone }: { id: OptionalId; label: string; row: Row; timezone: string | null }) {
  // Each optional column reads its own retained record. What does not exist is said in words, never left blank.
  return (
    <td data-label={label}>
      {id === "basis" ? (r.basis ?? "No test basis") : id === "configuration" ? (r.configuration ?? "None recorded") : id === "last_test" ? (r.last_test ? siteTime(r.last_test, timezone) : "Not tested")
        : id === "release" ? (r.release_reference ?? "None issued") : id === "service" ? <Tag view={r.service_view} /> : <Tag view={r.workflow_view} />}
    </td>
  );
}

function Inspector({ selected: s, unavailable, timezone, stale, onClose }: { selected: Selected | null; unavailable: boolean; timezone: string | null; stale: boolean; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  // A docked inspector is modeless: it takes focus once when opened and never traps it.
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector("dialog[open]")) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const basis = s?.basis_section, design = s?.design_section, handover = s?.handover_section, check = basis?.source_check ?? null, attempt = basis?.latest_attempt ?? null;
  // The present condition is shown beside the recorded check only where the two differ; with no check, only where it is a concern.
  const present = basis && (check ? check.now !== check.result : !["Current", "NotCaptured"].includes(basis.source_now.condition)) ? basis.source_now : null;
  return (
    <aside className="em-inspector" aria-label={s ? `Inspector: ${s.reference}` : "Commissioning package inspector"} data-stale={(s && stale) || undefined}>
      <div className="em-inspector-head">
        <div>
          {s && <span className="cm-ref">{s.reference}</span>}
          <h2 ref={heading} tabIndex={-1}>{s ? s.title : unavailable ? "Commissioning package unavailable" : "Loading…"}</h2>
          {s && <span className="cm-sub">{s.area} · {s.system_name}</span>}
        </div>
        <button type="button" className="mw-icon-button" onClick={onClose} aria-label="Close inspector"><Icon name="close" /></button>
      </div>
      {/* Nothing from an earlier selection is left on screen under this address. */}
      {!s && unavailable && <div className="em-inspector-body"><p className="mw-muted">This commissioning package does not exist in this Engineering package, or this identity cannot read it. Nothing is shown in its place.</p></div>}
      {s && basis && design && handover && (
        <>
          <div className="em-inspector-body">
            {/* Test acceptance and as-built issue are different facts, shown apart. */}
            <div className="cm-tags">{s.tags.map((t) => <Tag key={t.label} view={t} />)}</div>
            {s.archived && <p className="cm-note">Archived{s.archived_reason ? `: ${s.archived_reason}` : "."}</p>}
            <div className="cm-section">
              <h3>Commissioning basis</h3>
              <div className="cm-row"><span>Procedure</span><span>{basis.procedure?.text ?? "No test basis"}</span></div>
              <div className="cm-row"><span>Tested configuration</span><span>{basis.tested_configuration ?? "None recorded"}</span></div>
              <div className="cm-row"><span>Latest attempt</span><span>{attempt ? `${attempt.number} · ${attempt.review.label}${attempt.occurred_at ? ` · tested ${siteDate(attempt.occurred_at, attempt.timezone ?? timezone)}` : ""}` : "No submitted attempt"}</span></div>
              <div className="cm-row"><span>Source check</span>
                <div>
                  {/* The result and time of the last recorded check. It is never the moment this panel happened to open. */}
                  {check ? <><Tag view={check.view} /><small>{siteTime(check.checked_at, timezone)} · by {adapterLabels[check.adapter] ?? text(check.adapter)}</small></> : "No source check is recorded yet"}
                  {present && <div className="cm-present"><small>Present condition</small><Tag view={present.view} wrap />{present.reasons.length > 0 && <ul>{present.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}</div>}
                </div>
              </div>
              <div className="cm-link-row">
                <Link className="mw-link" href={basis.history_href}>View test &amp; retest history <Icon name="arrow-right" /></Link>
                {basis.failures_retained > 0 && <span className="mw-muted">{basis.failures_retained} earlier failure{basis.failures_retained === 1 ? "" : "s"} retained</span>}
              </div>
            </div>
            <div className="cm-section">
              <h3>Design &amp; installation</h3>
              <div className="cm-row"><span>Intended drawing</span><span>{design.intended_drawing ?? "None recorded"}</span></div>
              <div className="cm-row"><span>Installed record</span><span>{design.installed_record ?? "None recorded"}</span></div>
              {/* Accepted for incorporation is not incorporated: the redline's own state is given in words. */}
              <div className="cm-row"><span>Field redline</span><span>{design.redline ? `${design.redline.reference} · ${design.redline.state_label}` : "None recorded"}</span></div>
              {design.outstanding && (
                <>
                  <div className="cm-callout" role="note">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.6 2.6 20h18.8Z" /><path d="M12 10v4.6M12 17.3h.01" /></svg>
                    <div><strong>{design.outstanding.title}</strong><p>{design.outstanding.text}</p></div>
                  </div>
                  <span className="cm-sub">{design.outstanding.owner_name ?? "Unassigned"} · {design.outstanding.due ? `Due ${longDate(design.outstanding.due)}` : "Date needed"}</span>
                </>
              )}
            </div>
            <div className="cm-section">
              <h3>Handover readiness</h3>
              <div className="cm-row cm-row-tag"><span>Manuals &amp; backup references</span><span>{handover.manuals_backups ? <Tag view={handover.manuals_backups} /> : "None recorded"}</span></div>
              <div className="cm-row cm-row-tag"><span>Operator training</span><span>{handover.training ? <Tag view={handover.training} /> : "None recorded"}</span></div>
              <div className="cm-row cm-row-tag"><span>Service acceptance</span><span>{handover.service ? <Tag view={handover.service} /> : "None recorded"}</span></div>
            </div>
            {s.blockers.length > 1 && (
              <div className="cm-section">
                <h3>Also outstanding</h3>
                {/* One action never implies the rest: every blocker is listed with whose it is. */}
                <ul className="cm-blockers">{s.blockers.map((b, i) => <li key={i}>{b.text}<small>{b.owner_name ?? "Unassigned"} · {b.due ? `Due ${longDate(b.due)}` : "Date needed"}</small></li>)}</ul>
              </div>
            )}
          </div>
          <div className="cm-inspector-foot">
            {/* Navigation only: opening a destination approves, issues and completes nothing. */}
            <Link className="mw-button mw-button-primary" href={s.actions.primary.href}>{s.actions.primary.label}</Link>
            <div className="cm-inspector-links"><Link className="mw-link" href={s.actions.record_href}>Open full record</Link><Link className="mw-link" href={s.actions.history_href}>View history <Icon name="arrow-right" /></Link></div>
          </div>
        </>
      )}
    </aside>
  );
}

const blank = { title: "", system_name: "", area: "", owner_id: "", due: "", due_meaning: "", release_stage: "WholeScope", reason: "" };
function NewPackage({ refusal, onClose, onCreated }: { refusal: string | null; onClose: () => void; onCreated: (id: string) => void }) {
  const { packageId } = useCommissioning(), options = useRead<Options>(`engineering/${packageId}/commissioning/options`), command = useCommissioningCommand();
  const [form, setForm] = useState(blank), [ids] = useState(() => ({ id: newId(), scope_id: newId() }));
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  const dirty = (Object.keys(blank) as (keyof typeof blank)[]).some((k) => form[k] !== blank[k]);
  const submit = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning`, { action: "create", ...ids, title: form.title, system_name: form.system_name, area: form.area, owner_id: form.owner_id || null,
      due: form.due || null, due_meaning: form.due ? form.due_meaning || null : null, release_stage: form.release_stage, reason: form.reason });
    if (receipt) onCreated(ids.id);
  };
  const e = command.error;
  return (
    <Dialog title="New commissioning package" subtitle="A draft is saved as it is. Its scope, test basis and criteria follow in Test basis & criteria. Creating it tests, approves and releases nothing." drawer busy={command.busy} dirty={dirty && command.state !== "saved"} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void submit()} disabled={command.busy || !!refusal}>{command.busy ? "Saving…" : "Create commissioning package"}</button></>}>
      <div className="cm-stack">
        <Field label="Title" error={fieldError(e, "title")}><input data-autofocus value={form.title} onChange={set("title")} maxLength={200} /></Field>
        <div className="cm-inline">
          <Field label="System" error={fieldError(e, "system_name")}><input value={form.system_name} onChange={set("system_name")} maxLength={120} /></Field>
          <Field label="Area / installed location" hint="Where it physically is, not the areas it serves" error={fieldError(e, "area")}><input value={form.area} onChange={set("area")} maxLength={120} /></Field>
        </div>
        <Field label="Owner" hint="Leave empty for Unassigned" error={fieldError(e, "owner_id")}><select value={form.owner_id} onChange={set("owner_id")}><option value="">Unassigned</option>{options.data?.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <div className="cm-inline">
          <Field label="Due" hint="Leave empty to show Date needed" error={fieldError(e, "due")}><input type="date" value={form.due} onChange={set("due")} /></Field>
          {/* A date says what it is a date of. It is asked for only when a date is given. */}
          <Field label="What this date means" hint={form.due ? "A due date never doubles as a test, training or handover date" : "Needed only when a date is given"} error={fieldError(e, "due_meaning")}>
            <select value={form.due ? form.due_meaning : ""} onChange={set("due_meaning")} disabled={!form.due} required={!!form.due}><option value="">{form.due ? "Choose what it means…" : "No date given"}</option>{dueMeanings.map((m) => <option key={m} value={m}>{text(m)}</option>)}</select>
          </Field>
        </div>
        <Field label="Release stage" hint="A staged release still satisfies its own complete rule set" error={fieldError(e, "release_stage")}><select value={form.release_stage} onChange={set("release_stage")}>{releaseStages.map((r) => <option key={r} value={r}>{text(r)}</option>)}</select></Field>
        <Field label="Why is this package being created?" hint="Kept with the record's history" error={fieldError(e, "reason")}><textarea value={form.reason} onChange={set("reason")} maxLength={1000} /></Field>
        <ReadNotice error={options.error} what="The people who can own a package" />
        <Reason>{refusal}</Reason>
        <CommandNotice command={command} saved="Commissioning package created on the server." />
      </div>
    </Dialog>
  );
}
