"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { mappingConditions, quantityText, parseQuantity, formatQuantity } from "../../model";
import type { readLine, readRegister } from "../../reads";
import { LineForm } from "./line-form";
import { useMaterials } from "./materials-shell";
import { Chip, CommandNotice, Dialog, Field, Icon, Menu, ReadNotice, Reason, dateText, stampText, text, toneFor, useMaterialsCommand, useRead, type MenuItem } from "./materials-ui";

type Register = Awaited<ReturnType<typeof readRegister>>;
type Detail = Awaited<ReturnType<typeof readLine>>;
type Line = Register["items"][number];

const columns = [
  ["line", "Line"], ["requirement", "Material requirement"], ["quantity", "Design qty"], ["drawing", "Drawing / rev"], ["mapping", "Item mapping"], ["readiness", "Line readiness"], ["owner", "Next action owner"],
] as const;
type ColumnId = (typeof columns)[number][0];
const sortFor: Record<ColumnId, string> = { line: "line", requirement: "description", quantity: "quantity", drawing: "drawing", mapping: "mapping", readiness: "readiness", owner: "owner" };
const sortLabels: Record<string, string> = { line: "Line number", description: "Material requirement", quantity: "Design quantity", drawing: "Drawing", mapping: "Item mapping", readiness: "Line readiness", owner: "Next action owner", required_by: "Required-by date" };
// What a row says about its alternate, in the words of the refined register: only a live proposal is mentioned.
const substitutionWords: Record<string, string> = { Draft: "Substitution drafted", Submitted: "Substitution proposed", Returned: "Substitution returned", Held: "Substitution on hold", Accepted: "Substitution accepted" };
const criteriaKeys = ["view", "q", "discipline", "owner_id", "mapping", "substitution", "readiness", "removed", "sort", "dir", "page"] as const;

export function RegisterView() {
  const { packageId, setId, frame, reloadFrame, announce, selection, setSelection, hiddenColumns, setHiddenColumns, href } = useMaterials();
  const router = useRouter(), path = usePathname(), search = useSearchParams();
  const criteria = useMemo(() => Object.fromEntries(criteriaKeys.flatMap((k) => (search.get(k) ? [[k, search.get(k)!]] : []))), [search]);
  const query = useMemo(() => new URLSearchParams({ ...criteria, ...(setId ? { set: setId } : {}) }).toString(), [criteria, setId]);
  const register = useRead<Register>(`engineering/${packageId}/materials${query ? `?${query}` : ""}`);
  const inspected = search.get("line"), creating = search.get("new") === "1";
  const [editing, setEditing] = useState<Line | null>(null), [draft, setDraft] = useState(criteria.q ?? ""), [filters, setFilters] = useState(false);
  const data = register.data, items = data?.items ?? [];

  // Every criterion lives in the URL, so Back, Forward, reload and a pasted link restore the same results.
  const go = (changes: Record<string, string | null>, replace = true) => {
    const q = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(changes)) if (v === null || v === "") q.delete(k); else q.set(k, v);
    if (!("page" in changes) && !("line" in changes) && !("new" in changes)) q.delete("page");
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
    if (data) announce(`${data.total} material line${data.total === 1 ? "" : "s"} shown of ${data.counts.set_total} in this material set.`);
  }, [data, announce]);

  const shown = columns.filter(([id]) => !hiddenColumns.includes(id));
  const pageIds = items.filter((l) => !l.removed).map((l) => l.id), chosenHere = pageIds.filter((id) => id in selection);
  const header = useRef<HTMLInputElement>(null);
  useEffect(() => { if (header.current) header.current.indeterminate = chosenHere.length > 0 && chosenHere.length < pageIds.length; }, [chosenHere.length, pageIds.length]);
  const remaining = (l: Line) => formatQuantity((parseQuantity(l.quantity) ?? 0n) - (parseQuantity(l.released_quantity) ?? 0n));
  const toggle = (l: Line) => { const next = { ...selection }; if (l.id in next) delete next[l.id]; else next[l.id] = remaining(l); setSelection(next); };
  const togglePage = () => {
    const next = { ...selection };
    if (chosenHere.length === pageIds.length) pageIds.forEach((id) => delete next[id]); else items.filter((l) => !l.removed).forEach((l) => { next[l.id] ??= remaining(l); });
    setSelection(next);
  };
  const selectedCount = Object.keys(selection).length;
  const conditions: [string, string][] = [
    ...(criteria.owner_id ? [["owner_id", `Owner: ${data?.options.owners.find((o) => o.id === criteria.owner_id)?.name ?? "selected person"}`] as [string, string]] : []),
    ...(criteria.mapping ? [["mapping", `Item mapping: ${text(criteria.mapping)}`] as [string, string]] : []),
    ...(criteria.readiness ? [["readiness", `Readiness: ${data?.options.readiness.find((r) => r.code === criteria.readiness)?.label ?? text(criteria.readiness)}`] as [string, string]] : []),
    ...(criteria.substitution ? [["substitution", criteria.substitution === "proposed" ? "Alternate proposed" : "No alternate proposed"] as [string, string]] : []),
    ...(criteria.removed ? [["removed", "Including removed lines"] as [string, string]] : []),
  ];
  const addCondition: MenuItem[] = [
    ...(data?.options.owners ?? []).map((o) => ({ id: `o-${o.id}`, label: `Owner: ${o.name}`, onSelect: () => go({ owner_id: o.id }) })),
    { id: "s1", separator: true as const },
    ...mappingConditions.map((m) => ({ id: `m-${m}`, label: `Item mapping: ${text(m)}`, onSelect: () => go({ mapping: m }) })),
    { id: "s2", separator: true as const },
    ...(data?.options.readiness ?? []).map((r) => ({ id: `r-${r.code}`, label: `Readiness: ${r.label}`, onSelect: () => go({ readiness: r.code }) })),
    { id: "s3", separator: true as const },
    { id: "sub-yes", label: "Alternate proposed", onSelect: () => go({ substitution: "proposed" }) },
    { id: "sub-no", label: "No alternate proposed", onSelect: () => go({ substitution: "none" }) },
  ];
  const sort = criteria.sort ?? "line", dir = criteria.dir ?? "asc";
  const from = data && data.total ? (data.page - 1) * data.page_size + 1 : 0, to = data ? Math.min(data.page * data.page_size, data.total) : 0;
  const outside = !!inspected && !!data && !items.some((l) => l.id === inspected);
  const tabs = [["all", "All materials", data?.counts.all], ["ready", "Ready for review", data?.counts.ready], ["attention", "Needs attention", data?.counts.attention]] as const;
  const nextNumber = String(Math.min(9990, (Math.max(0, ...items.map((l) => Number(l.line_number))) || 0) + 10)).padStart(3, "0");

  if (frame && !frame.set) return <NoSet />;
  return (
    <div className="em-split" data-inspector={inspected ? "open" : "closed"}>
      <section className="em-register" aria-label="Materials register" aria-busy={register.loading}>
        <div className="em-toolbar">
          <div className="em-tabs" role="group" aria-label="Show">
            {tabs.map(([id, label, count]) => (
              <button key={id} type="button" aria-pressed={(criteria.view ?? "all") === id} onClick={() => go({ view: id === "all" ? null : id })}>
                <span>{label}</span>
                {/* An unavailable count stays blank; it is never shown as zero. */}
                <span className="em-tab-count" aria-label={typeof count === "number" ? `${count} lines` : "count unavailable"}>{typeof count === "number" ? count : "–"}</span>
              </button>
            ))}
          </div>
          <span className="mw-spacer" />
          <label className="em-search"><Icon name="search" /><span className="mw-sr">Search materials</span>
            <input type="search" placeholder="Search materials" value={draft} onChange={(e) => setDraft(e.target.value)} />
          </label>
          <button type="button" className="mw-button" aria-expanded={filters} aria-controls="em-filters" onClick={() => setFilters((v) => !v)}><Icon name="filter" /><span>Filters</span>{conditions.length > 0 && <span className="mw-count">{conditions.length}</span>}</button>
          <Menu name="Columns" icon="columns" label="Columns" align="end" keepOpen items={[
            ...columns.filter(([id]) => id !== "line" && id !== "requirement").map(([id, label]) => ({ id, label, checked: !hiddenColumns.includes(id), onSelect: () => setHiddenColumns(hiddenColumns.includes(id) ? hiddenColumns.filter((c) => c !== id) : [...hiddenColumns, id]) })),
            { id: "sep", separator: true as const },
            { id: "wide", label: "Wider requirement column", checked: hiddenColumns.includes("~wide"), onSelect: () => setHiddenColumns(hiddenColumns.includes("~wide") ? hiddenColumns.filter((c) => c !== "~wide") : [...hiddenColumns, "~wide"]) },
            { id: "reset", label: "Reset columns", onSelect: () => setHiddenColumns([]) },
          ]} />
          <Menu name="More actions" icon="dots" label="More" iconOnly align="end" items={[
            { id: "csv", label: "Export this material set (CSV)", hint: "Follows your access; not an order or approval", onSelect: () => { window.location.href = `/api/v1/engineering/${packageId}/materials/export?kind=register${setId ? `&set=${setId}` : ""}`; } },
            { id: "removed", label: criteria.removed ? "Hide removed lines" : "Show removed lines", onSelect: () => go({ removed: criteria.removed ? null : "true" }) },
            { id: "sources", label: "View exact sources", onSelect: () => router.push(href("history", { tab: "sources" })) },
          ]} />
        </div>
        <div className="em-toolbar em-toolbar-second" id="em-filters">
          <label className="em-select"><span className="mw-sr">Discipline</span>
            <select value={criteria.discipline ?? ""} onChange={(e) => go({ discipline: e.target.value || null })}>
              <option value="">All disciplines</option>
              {(data?.options.disciplines ?? []).map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <Menu name="Add condition" label={<><Icon name="plus" /> Add condition</>} items={addCondition} />
          {(filters || conditions.length > 0) && conditions.map(([key, label]) => (
            <span key={key} className="em-condition">{label}<button type="button" aria-label={`Remove condition ${label}`} onClick={() => go({ [key]: null })}><Icon name="close" /></button></span>
          ))}
          {(conditions.length > 0 || criteria.discipline || criteria.q) && <button type="button" className="mw-link" onClick={() => { setDraft(""); go({ q: null, discipline: null, owner_id: null, mapping: null, readiness: null, substitution: null, removed: null }); }}>Clear all</button>}
          <span className="mw-spacer" />
          <Menu name="Sort" label={`Sort: ${sortLabels[sort]}${dir === "desc" ? " (descending)" : ""}`} align="end" items={[
            ...Object.entries(sortLabels).map(([id, label]) => ({ id, label, checked: sort === id, onSelect: () => go({ sort: id === "line" ? null : id }) })),
            { id: "sep", separator: true as const },
            { id: "dir", label: dir === "asc" ? "Descending" : "Ascending", onSelect: () => go({ dir: dir === "asc" ? "desc" : null }) },
          ]} />
        </div>
        {selectedCount > 0 && (
          <div className="em-bulk" role="region" aria-label="Selected lines">
            <strong>{selectedCount} selected</strong>
            <span className="mw-muted">Selection is what you ticked. It is rechecked on the server before anything is prepared.</span>
            <span className="mw-spacer" />
            <Link className="mw-button mw-button-primary" href={href("releases", { prepare: "1" })}>Prepare release set from {selectedCount} line{selectedCount === 1 ? "" : "s"}</Link>
            <button type="button" className="mw-button" onClick={() => setSelection({})}>Clear selection</button>
          </div>
        )}
        {!!data?.counts.set_attention && (
          <div className="em-attention" role="note">
            <Icon name="info" />
            <p><strong>{data.counts.set_attention} material line{data.counts.set_attention === 1 ? "" : "s"} need{data.counts.set_attention === 1 ? "s" : ""} attention</strong><span className="mw-sr"> Review evidence, mapping and scope before selecting a release set.</span></p>
            <Link className="em-attention-link" href={href("register", { view: "attention" })}>Review issues <Icon name="arrow-right" /></Link>
          </div>
        )}
        <ReadNotice error={register.error} what="The materials register" />
        <div className="em-table-scroll" data-stale={register.stale || undefined}>
          <table className="em-table" data-wide={hiddenColumns.includes("~wide") || undefined}>
            <caption className="mw-sr">Material requirements of this set. Opening a line inspects it; ticking a line selects it for a release set. The two are independent.</caption>
            <thead>
              <tr>
                <th scope="col" className="em-col-check"><input ref={header} type="checkbox" aria-label={`Select the ${pageIds.length} lines on this page`} checked={pageIds.length > 0 && chosenHere.length === pageIds.length} onChange={togglePage} disabled={!pageIds.length} /></th>
                {shown.map(([id, label]) => (
                  <th key={id} scope="col" className={`em-col-${id}`} aria-sort={sort === sortFor[id] ? (dir === "asc" ? "ascending" : "descending") : undefined}>
                    <button type="button" onClick={() => go(sort === sortFor[id] ? { dir: dir === "asc" ? "desc" : null } : { sort: sortFor[id] === "line" ? null : sortFor[id], dir: null })}>{label}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} data-inspected={l.id === inspected || undefined} data-selected={l.id in selection || undefined} data-removed={l.removed || undefined}
                  onClick={(e) => { if (!(e.target as HTMLElement).closest("input,button,a,label")) go({ line: l.id }, false); }}>
                  <td className="em-col-check"><input type="checkbox" aria-label={`Select line ${l.line_number}, ${l.description}`} checked={l.id in selection} onChange={() => toggle(l)} disabled={l.removed} /></td>
                  {shown.map(([id]) => <Cell key={id} id={id} line={l} open={() => go({ line: l.id }, false)} />)}
                </tr>
              ))}
            </tbody>
          </table>
          {data && !items.length && (
            <div className="em-empty">
              {data.counts.set_total === 0 ? <><strong>No material requirements yet</strong><p>Add the first requirement from an exact drawing issue.</p></>
                : <><strong>No lines match</strong><p>{data.counts.set_total} line{data.counts.set_total === 1 ? "" : "s"} exist in this set. Clear a condition or the search to see them.</p></>}
            </div>
          )}
          {!data && register.loading && <div className="em-empty"><p>Loading the materials register…</p></div>}
        </div>
        <footer className="em-table-foot">
          <span>{data ? `${data.total} material${data.total === 1 ? "" : "s"}${data.counts.conditioned ? ` of ${data.counts.set_total} in this set` : ""}` : "…"} · {selectedCount} selected</span>
          <span className="mw-spacer" />
          <span>{from}–{to} of {data?.total ?? "…"}</span>
          <button type="button" className="mw-icon-button" aria-label="Previous page" disabled={!data || data.page <= 1} onClick={() => go({ page: String((data?.page ?? 2) - 1) })}><Icon name="chevron-left" /></button>
          <button type="button" className="mw-icon-button" aria-label="Next page" disabled={!data || to >= data.total} onClick={() => go({ page: String((data?.page ?? 1) + 1) })}><Icon name="chevron-right" /></button>
        </footer>
        <footer className="em-page-foot"><span>Synthetic preview · {dateText(data?.observed_at ?? null, "")}</span><span>Technical release does not authorise purchasing.</span></footer>
      </section>
      {inspected && <Inspector key={inspected} lineId={inspected} outside={outside} onClose={() => go({ line: null })} onEdit={setEditing} changed={() => { register.reload(); reloadFrame(); }} />}
      {(creating || editing) && data?.set && (
        <LineForm line={editing} setId={data.set.id} nextNumber={nextNumber}
          onClose={() => { setEditing(null); if (creating) go({ new: null }); }}
          onSaved={() => { register.reload(); reloadFrame(); }} />
      )}
    </div>
  );
}

function Cell({ id, line: l, open }: { id: ColumnId; line: Line; open: () => void }) {
  if (id === "line") return <td className="em-col-line">{l.line_number}</td>;
  if (id === "requirement")
    return (
      <td className="em-col-requirement">
        <button type="button" className="em-row-title" onClick={open} aria-label={`Inspect line ${l.line_number}, ${l.description}`}>{l.description}</button>
        {(l.substitution || l.removed) && <span className="em-cell-sub">{[l.substitution && (substitutionWords[l.substitution.state] ?? "Substitution proposed"), l.removed && "Removed"].filter(Boolean).join(" · ")}</span>}
      </td>
    );
  if (id === "quantity") return <td className="em-col-quantity">{quantityText(l.quantity, l.unit)}</td>;
  if (id === "drawing") return <td>{l.drawing ? `${l.drawing.reference} · Rev ${l.drawing.revision}` : <span className="mw-muted">No drawing</span>}</td>;
  if (id === "mapping") return <td><Chip tone={toneFor(l.mapping)}>{text(l.mapping)}</Chip></td>;
  if (id === "readiness") return <td><Chip tone={l.readiness.tone}>{l.readiness.label}</Chip></td>;
  return <td>{l.next_owner_name}</td>;
}

function NoSet() {
  const { packageId, frame, reloadFrame } = useMaterials(), command = useMaterialsCommand(reloadFrame), [title, setTitle] = useState("Released materials");
  return (
    <div className="em-empty em-empty-page">
      <strong>No material set exists for this package</strong>
      {frame?.can.edit ? (
        <>
          <p>Start set A to record material requirements against this package&rsquo;s exact sources.</p>
          <Field label="Set title"><input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <CommandNotice command={command} />
          <button type="button" className="mw-button mw-button-primary" disabled={command.busy} onClick={() => void command.send(`engineering/${packageId}/materials`, { action: "create", reason: "Material set started", id: crypto.randomUUID(), set_code: "A", revision: 1, title })}>Start material set A</button>
        </>
      ) : <Reason>This identity may read this package but cannot start a material set.</Reason>}
    </div>
  );
}

// The closable right inspector. It never changes checkbox selection, and it says so when its line is
// outside the current results rather than acting on a record nobody can see.
function Inspector({ lineId, outside, onClose, onEdit, changed }: { lineId: string; outside: boolean; onClose: () => void; onEdit: (line: Line) => void; changed: () => void }) {
  const { packageId, setId, href } = useMaterials();
  const detail = useRead<Detail>(`engineering/${packageId}/materials/lines?line_id=${lineId}${setId ? `&set=${setId}` : ""}`);
  const [removing, setRemoving] = useState(false), heading = useRef<HTMLHeadingElement>(null);
  // Focus moves to the inspector's heading, as it does for a dialog, so a keyboard or screen-reader user lands on what opened.
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const d = detail.data, l = d?.line, s = d?.substitution, source = l?.drawing;
  return (
    <aside className="em-inspector" aria-label="Line inspector" onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <header className="em-inspector-head">
        <div>
          <p className="em-eyebrow">{l ? `Line ${l.line_number}` : "Line"}</p>
          <h2 ref={heading} tabIndex={-1}>{l?.description ?? (detail.error ? "Line unavailable" : "Loading…")}</h2>
          {l && <p className="mw-muted">{l.location} · {l.system_name}</p>}
        </div>
        <button type="button" className="mw-icon-button" onClick={onClose} aria-label="Close inspector"><Icon name="close" /></button>
      </header>
      <div className="em-inspector-body">
        <ReadNotice error={detail.error} what="This line" />
        {outside && <p className="mw-notice mw-notice-attention">This line is outside the current results. <Link className="mw-link" href={href("register", { line: lineId })}>Show all materials</Link></p>}
        {l && d && (
          <>
            <div><Chip tone={s ? "neutral" : l.readiness.tone}>{s ? (substitutionWords[s.state] ?? "Substitution proposed") : l.readiness.label}</Chip></div>
            {s && (
              <>
                <section className="em-inspector-section">
                  <h3>Specified <Icon name="arrow-right" /> proposed</h3>
                  <div className="em-compare">
                    <div><span>Specified</span><strong>{s.original_code}</strong></div>
                    <div><span>Proposed</span><strong>{s.candidate_code}</strong></div>
                  </div>
                  <p className="em-note">{s.candidate_description} · {s.candidate_revision}</p>
                </section>
                <section className="em-inspector-section">
                  <h3>Compatibility evidence</h3>
                  <dl className="em-criteria">
                    {s.criteria.map((k) => (
                      <div key={k.key}><dt>{k.label}</dt><dd><Chip tone={toneFor(k.result)}>{text(k.result)}</Chip>{k.result === "NotApplicable" && k.note && <small>{k.note}</small>}</dd></div>
                    ))}
                  </dl>
                </section>
              </>
            )}
            <section className="em-inspector-section">
              <h3>Next action</h3>
              <p className="em-next">{l.next_action}</p>
              <p className="mw-muted">{l.next_owner_name} · {l.action_due ? `Review due ${dateText(l.action_due)}` : "Review date needed"}</p>
              {/* Two different dates. An unknown required-by date is said plainly; none is invented. */}
              <div className="em-pair"><span>Material required-by</span><strong className={l.required_by ? "" : "em-needed"}>{dateText(l.required_by)}</strong></div>
            </section>
            <section className="em-inspector-section">
              <h3>Source basis</h3>
              {source ? (
                <div className="em-source">
                  <strong>{source.reference} · Rev {source.revision}</strong>
                  <p>Purpose: {text(source.permitted_purpose)}</p>
                  {/* Currentness of the source only. It says nothing about technical acceptance, which is shown separately below. */}
                  <p className={`em-source-use em-source-use-${toneFor(source.use)}`}><Icon name={source.use === "Current" ? "review" : "warning"} /><span>{source.use === "Current" ? "Selected sources current" : text(source.use)}</span></p>
                  <p className="em-source-checked">Checked {stampText(source.observed_at)} AEST</p>
                </div>
              ) : <p className="mw-muted">No exact drawing source is linked.</p>}
              <Link className="mw-link em-source-link" href={href("history", { tab: "sources", source: source?.id ?? null })}>View exact sources <Icon name="arrow-right" /></Link>
            </section>
            <section className="em-inspector-section">
              <h3>Release &amp; handover</h3>
              <div className="em-pair"><span>Technical acceptance</span><strong>{d.technical_acceptance}</strong></div>
              <div className="em-pair"><span>Material release</span><strong>{l.released_quantity !== "0" ? `Issued · ${quantityText(l.released_quantity, l.unit)}` : "Not issued"}</strong></div>
              <div className="em-pair"><span>Supply handover</span><strong>{d.supply_handover}</strong></div>
            </section>
            <div className="em-inspector-actions">
              {s ? <Link className="mw-button mw-button-primary" href={href("substitutions", { substitution: s.id })}>Open substitution review</Link>
                : <Link className="mw-button mw-button-primary" href={href("mapping", { line: l.id })}>Open item &amp; unit mapping</Link>}
              {/* Everything else about the line is one step away, so the inspector's first view stays the refined summary. */}
              <details className="em-details">
                <summary className="mw-link">View material details <Icon name="arrow-right" /></summary>
                <div className="em-pair"><span>Line readiness</span><strong>{l.readiness.label}</strong></div>
                {l.readiness.reasons.length > 0 && <ul className="em-reasons">{l.readiness.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
                <div className="em-pair"><span>Design quantity</span><strong>{quantityText(l.quantity, l.unit)}</strong></div>
                <div className="em-pair"><span>Areas served</span><strong>{l.served_areas.length ? l.served_areas.join(", ") : "Not recorded"}</strong></div>
                {d.group.length > 0 && <div className="em-pair"><span>Released only with</span><strong>{d.group.map((g) => `line ${g.line_number}`).join(", ")} ({l.dependency_group})</strong></div>}
                <div className="em-pair"><span>Design basis</span><strong>{l.basis ? `${l.basis.reference} · ${l.basis.revision}` : "None linked"}</strong></div>
                {s && s.criteria.some((k) => k.mandatory) && <div className="em-pair"><span>Mandatory criteria</span><strong>{s.criteria.filter((k) => k.mandatory).map((k) => k.label).join(", ")}</strong></div>}
                {d.can.edit && !l.removed && <button type="button" className="mw-button" onClick={() => onEdit(l)} disabled={d.locked}>Correct requirement</button>}
                {d.can.edit && !l.removed && <button type="button" className="mw-button mw-button-quiet" onClick={() => setRemoving(true)} disabled={d.locked}>Remove from draft</button>}
                {d.locked && <Reason>This line is inside a release set under review or authorised, so its content cannot move underneath that decision.</Reason>}
                <Link className="mw-link" href={href("history", { subject_id: l.id })}>View change history</Link>
                <small className="mw-muted">Content revision {l.content_revision} · saved {stampText(l.updated_at)}</small>
              </details>
            </div>
          </>
        )}
      </div>
      {removing && l && <RemoveLine line={l} onClose={() => setRemoving(false)} onDone={() => { changed(); detail.reload(); }} />}
    </aside>
  );
}

function RemoveLine({ line, onClose, onDone }: { line: Line; onClose: () => void; onDone: () => void }) {
  const { packageId } = useMaterials(), command = useMaterialsCommand(onDone), [reason, setReason] = useState("");
  return (
    <Dialog title={`Remove line ${line.line_number} from the draft`} subtitle="The line and its history are retained. It leaves the working set and every count." busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || !reason.trim() || command.state === "saved"} onClick={() => void command.send(`engineering/${packageId}/materials/lines`, { action: "remove", reason: "Material requirement removed from the draft", line_id: line.id, expected_version: line.version, removed_reason: reason })}>Remove line</button></>}>
      <CommandNotice command={command} saved="Removed. The line remains in Changes & history." />
      <Field label="Why is this requirement no longer needed?"><textarea data-autofocus value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
    </Dialog>
  );
}
