"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { conditionOutcomes, witnessKinds, type CheckDefinition, type Prerequisite } from "../../../../inspections/model";
import { scopeKinds, type Presentation, type ScopeItem, type SharedInterface } from "../../model";
import type { readOptions } from "../../reads";
import { useCommissioning } from "./commissioning-shell";
import { CommandNotice, Dialog, Field, ReadNotice, Tag, fieldError, longDate, newId, siteTime, text, useRead } from "./commissioning-ui";
import { DetailHead, Page, Refusal, useAct, useSelect, useView, type Detail } from "./view-common";

type Options = Awaited<ReturnType<typeof readOptions>>;
type Basis = Detail["bases"][number];
type Command = ReturnType<typeof useAct>["command"];
type Shared = { d: Detail; options: Options | null; zone: string | null; reload: () => void };

const tag = (label: string, tone: Presentation["tone"], icon: Presentation["icon"]): Presentation => ({ label, tone, icon });
// Identity is read from the canonical asset record. Nothing here can type an asset into being verified.
const identityView: Record<ScopeItem["identity"], Presentation> = { Verified: tag("Verified", "neutral", "tick"), Unverified: tag("Unverified", "caution", "alert"), Unknown: tag("Unknown", "neutral", "document") };
const interfaceView: Record<SharedInterface["assessment"], Presentation> = { Unassessed: tag("Unassessed", "neutral", "document"), Independent: tag("Independent", "positive", "tick"), Blocking: tag("Blocking", "caution", "alert") };
const sourceUseView: Record<string, Presentation> = { Current: tag("Current", "positive", "tick"), Superseded: tag("Superseded", "caution", "alert"), Withdrawn: tag("Withdrawn", "caution", "alert"), Unavailable: tag("Unavailable", "caution", "alert") };
const adapters: Record<string, string> = { SyntheticUpstreamFixture: "Synthetic upstream adapter", ManualAssessment: "Manual assessment" };
const roles: Record<string, string> = { Procedure: "Procedure", IntendedDrawing: "Intended drawing", IntendedConfiguration: "Intended configuration" };
const prerequisiteKinds = ["Access", "Isolation", "Competency", "Biosecurity", "Crop", "Instrument", "Witness", "Hold"] as const;
const pad = (n: number) => String(n).padStart(2, "0");
const orNull = (value: string) => value.trim() || null;
const split = (value: string) => value.split(",").map((x) => x.trim()).filter(Boolean);
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const rowError = (command: Command, prefix: string, i: number) => command.error?.field_errors?.find((f) => f.field === `${prefix}-${i}`)?.message;

export function BasisView() {
  const view = useView("basis");
  return (
    <Page view={view} label="Test basis & criteria" empty="Choose a package to read its scope, the exact test basis it is tested against, every check with its criterion, and whether the sources it binds are still current." columns={["Test basis", "Required checks", "Criteria"]}>
      {(d) => <BasisDetail key={d.record.id} d={d} reload={view.reload} />}
    </Page>
  );
}

function BasisDetail({ d, reload }: { d: Detail; reload: () => void }) {
  const { packageId, frame } = useCommissioning(), options = useRead<Options>(`engineering/${packageId}/commissioning/options`), shownId = useSearchParams().get("basis");
  // The address may name an earlier basis, which stays readable. Otherwise the basis every test is bound to is shown.
  const shown = d.bases.find((b) => b.id === shownId) ?? d.bases.find((b) => b.current) ?? d.bases.at(-1) ?? null;
  const shared: Shared = { d, options: options.data, zone: frame?.package.site_timezone ?? options.data?.site_timezone ?? null, reload };
  return (
    <>
      <DetailHead d={d} />
      <ReadNotice error={options.error} what="Form choices" />
      {d.record.archived_at && <p className="cm-note" role="note">This package is archived: {d.record.archived_reason}. Its history is retained and nothing more is recorded on it.</p>}
      <ScopePanel {...shared} />
      <BasisPanel {...shared} b={shown} />
      <CriteriaPanel d={d} b={shown} />
      <PrerequisitesPanel b={shown} />
      <SourcesPanel {...shared} />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
function ScopePanel({ d, options, zone, reload }: Shared) {
  const { packageId } = useCommissioning(), act = useAct(reload), [editing, setEditing] = useState(false), s = d.scope, title = (key: string) => s.items.find((i) => i.key === key)?.title ?? key;
  const rescope = () => act.command.send(`engineering/${packageId}/commissioning`, { action: "rescope", record_id: d.record.id, expected_version: d.record.version, id: newId(), reason: `Successor scope opened after scope ${pad(s.number)} was frozen` });
  return (
    <section className="cm-panel" id="cm-panel-scope" tabIndex={-1} aria-labelledby="cm-scope-title">
      <header>
        <div>
          <h3 id="cm-scope-title">Scope</h3>
          <p>Scope {pad(s.number)} · {s.state === "Frozen" ? `frozen ${siteTime(s.frozen_at, zone)} when a test basis that binds it was submitted` : "working draft"}{s.versions.length > 1 && ` · versions: ${s.versions.map((v) => `${pad(v.number)} ${v.state.toLowerCase()}`).join(", ")}`}</p>
        </div>
        <div className="em-actions">
          {s.editable && <button type="button" className="mw-button" onClick={() => { act.command.clear(); setEditing(true); }}>Edit scope</button>}
          {s.state === "Frozen" && !d.record.archived_at && <button type="button" className="mw-button" disabled={!!d.refusals.edit || act.command.busy} onClick={() => void rescope()}>{act.command.busy ? "Saving…" : "Create successor scope"}</button>}
        </div>
      </header>
      {s.statement && <div className="cm-panel-body"><p className="cm-statement">{s.statement}</p></div>}
      <div className="em-table-scroll">
        <table className="em-table cm-table">
          <caption className="mw-sr">Systems, areas and assets of scope {pad(s.number)}</caption>
          <thead><tr>{["Item", "Kind", "Installed at", "Areas served", "Identity", "Critical", "In this scope"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
          <tbody>
            {s.items.map((i) => (
              <tr key={i.key}>
                <td><span className="em-row-title">{i.title}</span><span className="em-cell-sub">{i.reference}</span></td>
                <td data-label="Kind">{i.kind}</td>
                <td data-label="Installed at">{i.installed_location ?? "Unknown"}</td>
                <td data-label="Areas served">{i.served_areas.length ? i.served_areas.join(", ") : "None recorded"}</td>
                <td data-label="Identity"><Tag view={identityView[i.identity]} />{!i.asset_id && <span className="em-cell-sub">No asset record linked</span>}</td>
                <td data-label="Critical">{i.critical ? "Critical" : "No"}</td>
                <td data-label="In this scope">{i.disposition}{i.exclusion_reason && <span className="em-cell-sub">{i.exclusion_reason}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!s.items.length && <div className="em-empty"><strong>Nothing is in this scope yet</strong><p>{s.editable ? "Add the systems, areas and assets this package commissions." : "No system, area or asset has been declared."}</p></div>}
      </div>
      <div className="cm-panel-body cm-after-table">
        <h4 className="cm-subhead">Shared interfaces</h4>
        {s.interfaces.map((f) => (
          <div className="cm-row" key={f.key}>
            <span>{f.label}<small>{f.items.map(title).join(" · ")}</small></span>
            <span><Tag view={interfaceView[f.assessment]} />{f.note && <small>{f.note}</small>}</span>
          </div>
        ))}
        {!s.interfaces.length && <p className="cm-note">No shared interface is declared. Where items share one, it is assessed before any of them is released on its own.</p>}
        {s.state === "Frozen" && !d.record.archived_at && <p className="cm-note" role="note">A successor scope starts as a copy with its own number. The approved test basis keeps binding scope {pad(s.number)} exactly as it was frozen, and every test already recorded stays against it, until a successor basis is approved.</p>}
        {s.state === "Frozen" && !d.record.archived_at && <Refusal reason={d.refusals.edit} />}
        {!editing && act.notice}
      </div>
      {editing && <ScopeEditor d={d} options={options} command={act.command} onClose={() => setEditing(false)} />}
    </section>
  );
}

type ItemForm = Omit<ScopeItem, "identity" | "served_areas" | "installed_location" | "exclusion_reason" | "asset_id"> & { asset_id: string; installed_location: string; served_areas: string; exclusion_reason: string };
type FaceForm = Omit<SharedInterface, "note"> & { note: string };
function ScopeEditor({ d, options, command, onClose }: { d: Detail; options: Options | null; command: Command; onClose: () => void }) {
  const { packageId } = useCommissioning(), s = d.scope, [dirty, setDirty] = useState(false), [statement, setStatement] = useState(s.statement ?? "");
  const [items, setItems] = useState<ItemForm[]>(() => s.items.map((i) => ({ key: i.key, kind: i.kind, reference: i.reference, title: i.title, disposition: i.disposition, critical: i.critical, asset_id: i.asset_id ?? "", installed_location: i.installed_location ?? "", served_areas: i.served_areas.join(", "), exclusion_reason: i.exclusion_reason ?? "" })));
  const [faces, setFaces] = useState<FaceForm[]>(() => s.interfaces.map((f) => ({ ...f, note: f.note ?? "" })));
  const item = (n: number, patch: Partial<ItemForm>) => { setDirty(true); setItems((all) => all.map((x, i) => (i === n ? { ...x, ...patch } : x))); };
  const face = (n: number, patch: Partial<FaceForm>) => { setDirty(true); setFaces((all) => all.map((x, i) => (i === n ? { ...x, ...patch } : x))); };
  const save = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning`, {
      action: "scope", record_id: d.record.id, scope_id: s.id, expected_version: s.version, statement: orNull(statement), reason: `Working scope ${pad(s.number)} saved`,
      // Identity is never sent: the server reads it from the canonical asset record.
      items: items.map((i) => ({ key: i.key.trim(), kind: i.kind, asset_id: i.asset_id || null, reference: i.reference, title: i.title, installed_location: orNull(i.installed_location), served_areas: split(i.served_areas), disposition: i.disposition, exclusion_reason: i.disposition === "Excluded" ? orNull(i.exclusion_reason) : null, critical: i.critical })),
      interfaces: faces.map((f) => ({ key: f.key.trim(), label: f.label, items: f.items.filter((k) => items.some((i) => i.key.trim() === k)), assessment: f.assessment, note: orNull(f.note) })),
    });
    if (receipt) onClose();
  };
  return (
    <Dialog title={`Edit scope ${pad(s.number)}`} subtitle="The whole working scope is saved together. It is frozen when a test basis that binds it is submitted; after that a change is a successor scope." drawer wide busy={command.busy} dirty={dirty} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void save()} disabled={command.busy}>{command.busy ? "Saving…" : "Save scope"}</button></>}>
      <div className="cm-stack">
        <Field label="Scope statement" hint="What this package commissions, in words" error={fieldError(command.error, "statement")}><textarea data-autofocus value={statement} maxLength={2000} onChange={(e) => { setDirty(true); setStatement(e.target.value); }} /></Field>
        <h3 className="cm-subhead">Systems, areas and assets</h3>
        {items.map((i, n) => (
          <fieldset className="cm-edit-block" key={n}>
            <legend>Item {n + 1}{i.title && `: ${i.title}`}</legend>
            {rowError(command, "items", n) && <p className="mw-inline-error" role="alert">{rowError(command, "items", n)}</p>}
            <div className="cm-inline">
              <Field label="Title"><input value={i.title} maxLength={200} onChange={(e) => item(n, { title: e.target.value })} onBlur={() => { if (!i.key) item(n, { key: slug(i.title) }); }} /></Field>
              <Field label="Reference"><input value={i.reference} maxLength={120} onChange={(e) => item(n, { reference: e.target.value })} /></Field>
              <Field label="Key" hint="Lower-case letters, digits, hyphens. Checks and interfaces name it"><input value={i.key} maxLength={80} onChange={(e) => item(n, { key: e.target.value })} /></Field>
            </div>
            <div className="cm-inline">
              <Field label="Kind"><select value={i.kind} onChange={(e) => item(n, { kind: e.target.value as ItemForm["kind"] })}>{scopeKinds.map((k) => <option key={k}>{k}</option>)}</select></Field>
              <Field label="Installed at" hint="Where it physically is"><input value={i.installed_location} maxLength={120} onChange={(e) => item(n, { installed_location: e.target.value })} /></Field>
              <Field label="Areas served" hint="Separate with commas. One physical asset is one item, however many areas it serves"><input value={i.served_areas} onChange={(e) => item(n, { served_areas: e.target.value })} /></Field>
            </div>
            <div className="cm-inline">
              <Field label="Asset record (optional)" hint="Identity is read from this record; it is never typed here">
                <select value={i.asset_id} onChange={(e) => { const a = options?.assets.find((x) => x.id === e.target.value); item(n, { asset_id: e.target.value, ...(a && !i.reference ? { reference: a.display_number } : {}), ...(a && !i.title ? { title: a.description, key: i.key || slug(a.description) } : {}) }); }}>
                  <option value="">No asset record: identity unknown</option>
                  {options?.assets.map((a) => <option key={a.id} value={a.id}>{a.display_number} · {a.description} ({a.identity_status.toLowerCase()})</option>)}
                </select>
              </Field>
              <Field label="In this scope"><select value={i.disposition} onChange={(e) => item(n, { disposition: e.target.value as ItemForm["disposition"] })}><option>Included</option><option>Excluded</option></select></Field>
              {i.disposition === "Excluded" && <Field label="Reason for excluding it"><input value={i.exclusion_reason} maxLength={600} onChange={(e) => item(n, { exclusion_reason: e.target.value })} /></Field>}
            </div>
            <div className="em-actions">
              <label className="cm-check"><input type="checkbox" checked={i.critical} onChange={(e) => item(n, { critical: e.target.checked })} /><span>Critical: its identity must be verified before release</span></label>
              <button type="button" className="mw-button mw-button-quiet" onClick={() => { setDirty(true); setItems((all) => all.filter((_, x) => x !== n)); }}>Remove item</button>
            </div>
          </fieldset>
        ))}
        <div className="em-actions"><button type="button" className="mw-button" onClick={() => { setDirty(true); setItems((all) => [...all, { key: "", kind: "System", asset_id: "", reference: "", title: "", installed_location: "", served_areas: "", disposition: "Included", exclusion_reason: "", critical: false }]); }}>Add item</button></div>
        <h3 className="cm-subhead">Shared interfaces</h3>
        <p className="cm-note">An interface shared by two or more items is assessed before any of them is released alone.</p>
        {faces.map((f, n) => (
          <fieldset className="cm-edit-block" key={n}>
            <legend>Interface {n + 1}{f.label && `: ${f.label}`}</legend>
            {rowError(command, "interfaces", n) && <p className="mw-inline-error" role="alert">{rowError(command, "interfaces", n)}</p>}
            <div className="cm-inline">
              <Field label="Interface"><input value={f.label} maxLength={200} onChange={(e) => face(n, { label: e.target.value })} onBlur={() => { if (!f.key) face(n, { key: slug(f.label) }); }} /></Field>
              <Field label="Key"><input value={f.key} maxLength={80} onChange={(e) => face(n, { key: e.target.value })} /></Field>
              <Field label="Assessment"><select value={f.assessment} onChange={(e) => face(n, { assessment: e.target.value as FaceForm["assessment"] })}><option>Unassessed</option><option>Independent</option><option>Blocking</option></select></Field>
            </div>
            <fieldset className="cm-checks"><legend>Items it joins (two or more)</legend>
              {items.filter((i) => i.key.trim()).map((i) => <label className="cm-check" key={i.key}><input type="checkbox" checked={f.items.includes(i.key.trim())} onChange={(e) => face(n, { items: e.target.checked ? [...f.items, i.key.trim()] : f.items.filter((k) => k !== i.key.trim()) })} /><span>{i.title || i.key}</span></label>)}
            </fieldset>
            <Field label="Reasoning" hint="Required once the interface is assessed"><input value={f.note} maxLength={600} onChange={(e) => face(n, { note: e.target.value })} /></Field>
            <div className="em-actions"><button type="button" className="mw-button mw-button-quiet" onClick={() => { setDirty(true); setFaces((all) => all.filter((_, x) => x !== n)); }}>Remove interface</button></div>
          </fieldset>
        ))}
        <div className="em-actions"><button type="button" className="mw-button" onClick={() => { setDirty(true); setFaces((all) => [...all, { key: "", label: "", items: [], assessment: "Unassessed", note: "" }]); }}>Add shared interface</button></div>
        <CommandNotice command={command} saved="Scope saved on the server." />
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
function BasisPanel({ d, b, options, zone, reload }: Shared & { b: Basis | null }) {
  const { packageId } = useCommissioning(), act = useAct(reload), select = useSelect(), [dialog, setDialog] = useState<null | "create" | "edit" | "approve" | "return">(null);
  const path = `engineering/${packageId}/commissioning/basis`, last = d.bases.at(-1) ?? null, archived = !!d.record.archived_at, open = (which: NonNullable<typeof dialog>) => { act.command.clear(); setDialog(which); };
  const createRefusal = archived ? "This package is archived." : d.refusals.edit ?? (last && (last.state === "Draft" || last.state === "InReview") ? `Test basis ${last.reference} ${last.revision} is ${last.state_view.label.toLowerCase()}. Finish it before starting another.` : null);
  // The same stops the server names. It stays the authority: whatever else it refuses is shown as it says it.
  const submitStops = b?.editable ? [!b.procedure_source_id && "Bind the exact approved procedure.", !b.checks.length && "Define at least one check.", !d.scope.items.some((i) => i.disposition === "Included") && "Include at least one system, area or asset in the scope.",
    b.checks.some((k) => k.condition?.outcome === "Unknown" && !k.required) && "A check whose condition is unknown stays required until the condition is known."].filter((x): x is string => !!x) : [];
  const waiting = d.bases.find((x) => (x.state === "Draft" || x.state === "InReview") && x.id !== b?.id), role = (id: string) => (id === b?.procedure_source_id ? "Procedure" : id === b?.drawing_source_id ? "Intended drawing" : id === b?.configuration_source_id ? "Intended configuration" : "Criterion source");
  return (
    <section className="cm-panel" id="cm-panel-basis" tabIndex={-1} aria-labelledby="cm-basis-title">
      <header>
        <div><h3 id="cm-basis-title">Test basis</h3><p>The exact procedure, drawing and configuration a test is recorded against. A submitted basis is frozen; a material edit is a successor, reviewed again.</p></div>
        <div className="em-actions"><button type="button" className="mw-button" disabled={!!createRefusal} onClick={() => open("create")}>{last ? "Create successor basis" : "New test basis"}</button></div>
      </header>
      <div className="cm-panel-body">
        <Refusal reason={createRefusal} />
        {waiting && <p className="cm-note" role="note">Basis {pad(waiting.number)} ({waiting.reference} {waiting.revision}) is {waiting.state_view.label.toLowerCase()}. Until it is approved, every test stays bound to the basis shown here. <button type="button" className="mw-link" onClick={() => select(d.record.id, { basis: waiting.id })}>Open basis {pad(waiting.number)}</button></p>}
        {!b && <p className="cm-note">No test basis exists yet. A result is captured against an exact approved basis; nothing is tested against a draft.</p>}
        {b && (
          <>
            <div className="cm-grid">
              <div className="cm-row"><span>Test basis</span><strong>{b.reference} · {b.revision}<small>Basis {pad(b.number)}{b.current ? " · the basis tests are bound to" : ""}</small></strong></div>
              <div className="cm-row"><span>State</span><span><Tag view={b.state_view} /></span></div>
              <div className="cm-row"><span>Approval purpose</span><span>{text(b.approval_purpose)}<small>Approval for test is not approval for issue</small></span></div>
              <div className="cm-row"><span>Row version</span><span>{b.identifiers.row_version}<small>Counts saves of this record; it is not a revision</small></span></div>
              <div className="cm-row"><span>Procedure revision</span><span>{b.identifiers.procedure_revision}</span></div>
              <div className="cm-row"><span>Engineering issue revisions</span><span>{b.identifiers.issue_revisions.length ? b.identifiers.issue_revisions.map((r) => <span key={r} className="cm-line">{r}</span>) : "No source bound"}</span></div>
              <div className="cm-row"><span>Prepared by</span><span>{b.created_by_name}</span></div>
              <div className="cm-row"><span>Submitted</span><span>{b.submitted_at ? <>{b.submitted_by_name}<small>{siteTime(b.submitted_at, zone)}</small></> : "Not submitted"}</span></div>
              {b.decided_at && <div className="cm-row"><span>{b.state === "Returned" ? "Returned by" : "Decided by"}</span><span>{b.decided_by_name}<small>{siteTime(b.decided_at, zone)} · policy version {b.policy_version ?? "unknown"} · independence {b.independence_required ? "required" : "not required"}</small></span></div>}
              {b.decision_reason && <div className="cm-row"><span>{b.state === "Returned" ? "Return reason" : "Decision reason"}</span><span>{b.decision_reason}</span></div>}
              {b.state === "Returned" && <div className="cm-row"><span>Correction owned by</span><span>{b.return_owner_name ?? "Unassigned"}<small>Due {longDate(b.return_due)}</small></span></div>}
              <div className="cm-row"><span>{b.submitted_hash ? "Submitted content hash" : "Content hash"}</span><span className="cm-hash">{b.submitted_hash ?? b.content_hash}</span></div>
            </div>
            {b.state === "Returned" && <p className="cm-note" role="note">A returned basis stays exactly as it was submitted. The correction is a successor basis, which is reviewed again.</p>}
          </>
        )}
      </div>
      {b && (
        <div className="em-table-scroll cm-after-body">
          <table className="em-table cm-table">
            <caption className="mw-sr">Sources bound by basis {pad(b.number)}, as they were observed when it was saved</caption>
            <thead><tr>{["Role", "Source", "Revision", "File version", "Content hash", "Observed"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
            <tbody>
              {b.sources.map((s) => (
                <tr key={s.source_id}>
                  <td><span className="em-row-title">{role(s.source_id)}</span><span className="em-cell-sub">{text(s.kind)}</span></td>
                  <td data-label="Source">{s.reference}</td><td data-label="Revision">{s.revision || "—"}</td><td data-label="File version">{s.file_version || "—"}</td>
                  <td data-label="Content hash"><span className="cm-hash">{s.content_hash ?? "Unavailable"}</span></td><td data-label="Observed">{siteTime(s.observed_at, zone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!b.sources.length && <div className="em-empty"><p>No source is bound yet. Bind the exact approved procedure before submitting.</p></div>}
        </div>
      )}
      <div className="cm-panel-body cm-after-table">
        {b?.editable && (
          <>
            <div className="em-actions">
              <button type="button" className="mw-button" onClick={() => open("edit")}>Edit basis</button>
              <button type="button" className="mw-button mw-button-primary" disabled={act.command.busy || submitStops.length > 0} onClick={() => void act.command.send(path, { action: "submit", record_id: d.record.id, basis_id: b.id, expected_version: b.version, reason: `Test basis ${b.reference} ${b.revision} submitted for approval` })}>{act.command.busy ? "Saving…" : "Submit for approval"}</button>
            </div>
            {submitStops.map((s) => <Refusal key={s} reason={s} />)}
            <p className="cm-note">Submitting freezes this basis and the scope it binds, and records a source check. It approves nothing.</p>
          </>
        )}
        {b?.state === "InReview" && (
          <>
            <div className="em-actions">
              <button type="button" className="mw-button mw-button-primary" disabled={!!d.refusals.approve_basis || archived} onClick={() => open("approve")}>Approve for test</button>
              <button type="button" className="mw-button" disabled={!!d.refusals.approve_basis || archived} onClick={() => open("return")}>Return</button>
            </div>
            <Refusal reason={d.refusals.approve_basis} />
          </>
        )}
        {!dialog && act.notice}
        {d.bases.length > 1 && (
          <>
            <h4 className="cm-subhead">Every basis of this package</h4>
            <ul className="cm-history">
              {d.bases.map((x) => (
                <li key={x.id} aria-current={x.id === b?.id || undefined}>
                  <span>Basis {pad(x.number)} · {x.reference} {x.revision}</span><Tag view={x.state_view} />
                  {x.id === b?.id ? <span className="cm-note">Shown above</span> : <button type="button" className="mw-link" onClick={() => select(d.record.id, { basis: x.id })}>Read basis {pad(x.number)}</button>}
                </li>
              ))}
            </ul>
            <p className="cm-note">A superseded basis stays readable exactly as it was approved, for every test that was bound to it.</p>
          </>
        )}
      </div>
      {dialog === "create" && <CreateBasis d={d} last={last} command={act.command} onClose={() => setDialog(null)} onCreated={(id) => { setDialog(null); select(d.record.id, { basis: id }); }} />}
      {dialog === "edit" && b && <BasisEditor d={d} b={b} options={options} command={act.command} onClose={() => setDialog(null)} />}
      {(dialog === "approve" || dialog === "return") && b && <DecideBasis d={d} b={b} decision={dialog} options={options} command={act.command} onClose={() => setDialog(null)} />}
    </section>
  );
}

function CreateBasis({ d, last, command, onClose, onCreated }: { d: Detail; last: Basis | null; command: Command; onClose: () => void; onCreated: (id: string) => void }) {
  const { packageId } = useCommissioning(), [id] = useState(newId), [reference, setReference] = useState(last?.reference ?? ""), [revision, setRevision] = useState("");
  const create = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning/basis`, { action: "create", id, record_id: d.record.id, expected_version: d.record.version, reference, revision, reason: last ? `Successor of test basis ${last.reference} ${last.revision}` : "First test basis of this package" });
    if (receipt) onCreated(id);
  };
  return (
    <Dialog title={last ? "Create successor basis" : "New test basis"} subtitle={last ? `Starts as an exact copy of basis ${pad(last.number)} with an identity of its own. The earlier basis stays as it was decided.` : "A draft. Nothing is tested against it until it is submitted and independently approved for test."} busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void create()} disabled={command.busy || !reference.trim() || !revision.trim()}>{command.busy ? "Saving…" : "Create draft basis"}</button></>}>
      <div className="cm-stack">
        <div className="cm-inline">
          <Field label="Basis reference" error={fieldError(command.error, "reference")}><input data-autofocus value={reference} maxLength={40} onChange={(e) => setReference(e.target.value)} /></Field>
          <Field label="Procedure revision" hint="Up to twelve letters, digits or full stops" error={fieldError(command.error, "revision")}><input value={revision} maxLength={12} onChange={(e) => setRevision(e.target.value)} /></Field>
        </div>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function DecideBasis({ d, b, decision, options, command, onClose }: { d: Detail; b: Basis; decision: "approve" | "return"; options: Options | null; command: Command; onClose: () => void }) {
  const { packageId } = useCommissioning(), [why, setWhy] = useState(""), [owner, setOwner] = useState(""), [due, setDue] = useState(""), missing = b.checks.filter((k) => k.is_required && !k.has_criterion).length;
  const decide = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning/basis`, { action: decision, record_id: d.record.id, basis_id: b.id, expected_version: b.version, decision_reason: why, reason: decision === "approve" ? `Test basis ${b.reference} ${b.revision} approved for test` : `Test basis ${b.reference} ${b.revision} returned for correction`, ...(decision === "return" ? { owner_id: owner, due } : {}) });
    if (receipt) onClose();
  };
  return (
    <Dialog title={decision === "approve" ? `Approve ${b.reference} ${b.revision} for test` : `Return ${b.reference} ${b.revision}`} drawer busy={command.busy} dirty={!!why} onClose={onClose}
      subtitle={decision === "approve" ? "You approve this exact submitted basis for commissioning tests. It approves no result, no as-built and no issue." : "The basis stays as submitted. Its correction is a successor basis with a named owner and date."}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void decide()} disabled={command.busy || !why.trim() || (decision === "return" && (!owner || !due))}>{command.busy ? "Saving…" : decision === "approve" ? "Approve for test" : "Return basis"}</button></>}>
      <div className="cm-stack">
        <p className="cm-note">Submitted content hash <span className="cm-hash">{b.submitted_hash}</span></p>
        {decision === "approve" && missing > 0 && <p className="cm-note" role="note">{missing} required check{missing === 1 ? " has" : "s have"} no acceptance criterion. Readings may be captured, but none can be assessed or released until a successor basis defines the criterion.</p>}
        <Field label={decision === "approve" ? "Basis of this approval" : "Why it is returned"} error={fieldError(command.error, "decision_reason")}><textarea data-autofocus value={why} maxLength={2000} onChange={(e) => setWhy(e.target.value)} /></Field>
        {decision === "return" && (
          <div className="cm-inline">
            <Field label="Correction owned by" error={fieldError(command.error, "owner_id")}><select value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Choose a preparer…</option>{options?.people.filter((p) => p.preparer).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Due" error={fieldError(command.error, "due")}><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          </div>
        )}
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
type CheckForm = {
  key: string; name: string; check_type: CheckDefinition["check_type"]; required: boolean; scope_key: string; undefined_criterion: boolean; unit: string; precision: string; lower: string; lower_inclusive: boolean; upper: string; upper_inclusive: boolean;
  conversions: { from_unit: string; multiply: string; add: string }[]; choices: string; accepted: string[]; conditional: boolean; statement: string; outcome: NonNullable<CheckDefinition["condition"]>["outcome"];
  evidence_min: string; instrument_required: boolean; witness: CheckDefinition["witness"]; criterion_source_id: string | null;
};
type PrerequisiteForm = { key: string; label: string; kind: Prerequisite["kind"]; mandatory: boolean; source: string };
const blankCheck: CheckForm = { key: "", name: "", check_type: "Numeric", required: true, scope_key: "", undefined_criterion: false, unit: "", precision: "0", lower: "", lower_inclusive: true, upper: "", upper_inclusive: true, conversions: [], choices: "", accepted: [],
  conditional: false, statement: "", outcome: "Unknown", evidence_min: "0", instrument_required: false, witness: "None", criterion_source_id: null };
const toCheckForm = (k: CheckDefinition): CheckForm => ({
  ...blankCheck, key: k.key, name: k.name, check_type: k.check_type, required: k.required, scope_key: k.scope_key ?? "", undefined_criterion: k.check_type === "Numeric" && !k.numeric, unit: k.numeric?.unit ?? "", precision: String(k.numeric?.precision ?? 0),
  lower: k.numeric?.lower ?? "", lower_inclusive: k.numeric?.lower_inclusive ?? true, upper: k.numeric?.upper ?? "", upper_inclusive: k.numeric?.upper_inclusive ?? true, conversions: k.numeric?.conversions ?? [], choices: k.qualitative?.choices.join(", ") ?? "",
  accepted: k.qualitative?.accepted ?? [], conditional: !!k.condition, statement: k.condition?.statement ?? "", outcome: k.condition?.outcome ?? "Unknown", evidence_min: String(k.evidence_min), instrument_required: k.instrument_required, witness: k.witness, criterion_source_id: k.criterion_source_id,
});
// A numeric check with no criterion is sent as numeric:null. It shows as "Criteria missing" and borrows no limit from anywhere.
const fromCheckForm = (f: CheckForm) => ({
  key: f.key.trim(), name: f.name, check_type: f.check_type, required: f.required, scope_key: f.scope_key || null, evidence_min: Number(f.evidence_min || 0), instrument_required: f.instrument_required, witness: f.witness, criterion_source_id: f.criterion_source_id,
  numeric: f.check_type === "Numeric" && !f.undefined_criterion ? { unit: f.unit, precision: Number(f.precision || 0), lower: orNull(f.lower), lower_inclusive: f.lower_inclusive, upper: orNull(f.upper), upper_inclusive: f.upper_inclusive, conversions: f.conversions.map((c) => ({ from_unit: c.from_unit, multiply: c.multiply.trim(), add: c.add.trim() || "0" })) } : null,
  qualitative: f.check_type === "Qualitative" ? { choices: split(f.choices), accepted: f.accepted.filter((a) => split(f.choices).includes(a)) } : null,
  condition: f.conditional ? { statement: f.statement, outcome: f.outcome } : null,
});

function BasisEditor({ d, b, options, command, onClose }: { d: Detail; b: Basis; options: Options | null; command: Command; onClose: () => void }) {
  const { packageId } = useCommissioning(), [dirty, setDirty] = useState(false), [head, setHead] = useState({ reference: b.reference, revision: b.revision, procedure: b.procedure_source_id ?? "", drawing: b.drawing_source_id ?? "", configuration: b.configuration_source_id ?? "" });
  const [checks, setChecks] = useState<CheckForm[]>(() => b.checks.map(toCheckForm)), [needs, setNeeds] = useState<PrerequisiteForm[]>(() => b.prerequisites.map((x) => ({ key: x.key, label: x.label, kind: x.kind, mandatory: x.mandatory, source: x.source ?? "" })));
  const set = (k: keyof typeof head) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setDirty(true); setHead({ ...head, [k]: e.target.value }); };
  const check = (n: number, patch: Partial<CheckForm>) => { setDirty(true); setChecks((all) => all.map((x, i) => (i === n ? { ...x, ...patch } : x))); };
  const need = (n: number, patch: Partial<PrerequisiteForm>) => { setDirty(true); setNeeds((all) => all.map((x, i) => (i === n ? { ...x, ...patch } : x))); };
  const sources = (kinds: string[]) => options?.sources.filter((s) => kinds.includes(s.kind) && s.readable) ?? [];
  const pick = (label: string, k: "procedure" | "drawing" | "configuration", kinds: string[], field: string, hint: string) => (
    <Field label={label} hint={hint} error={fieldError(command.error, field)}>
      <select value={head[k]} onChange={set(k)}><option value="">None bound</option>{sources(kinds).map((s) => <option key={s.id} value={s.id}>{s.reference} · Rev {s.revision} (file {s.file_version}){s.use !== "Current" ? ` — ${s.use.toLowerCase()}` : ""}</option>)}</select>
    </Field>
  );
  const save = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning/basis`, {
      action: "save", record_id: d.record.id, basis_id: b.id, expected_version: b.version, reference: head.reference, revision: head.revision, procedure_source_id: head.procedure || null, drawing_source_id: head.drawing || null, configuration_source_id: head.configuration || null,
      checks: checks.map(fromCheckForm), prerequisites: needs.map((x) => ({ key: x.key.trim(), label: x.label, kind: x.kind, mandatory: x.mandatory, source: orNull(x.source) })), reason: `Draft test basis ${head.reference} ${head.revision} saved`,
    });
    if (receipt) onClose();
  };
  return (
    <Dialog title={`Edit basis ${pad(b.number)}`} subtitle="A draft, saved whole. The bound sources are snapshotted as they are observed now: a matching title or a newer file is not the approved content." drawer wide busy={command.busy} dirty={dirty} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void save()} disabled={command.busy}>{command.busy ? "Saving…" : "Save draft basis"}</button></>}>
      <div className="cm-stack">
        <div className="cm-inline">
          <Field label="Basis reference" error={fieldError(command.error, "reference")}><input data-autofocus value={head.reference} maxLength={40} onChange={set("reference")} /></Field>
          <Field label="Procedure revision" error={fieldError(command.error, "revision")}><input value={head.revision} maxLength={12} onChange={set("revision")} /></Field>
        </div>
        <div className="cm-inline">
          {pick("Approved test procedure", "procedure", ["TestProcedure"], "procedure_source_id", "Required before submitting")}
          {pick("Intended drawing or design basis", "drawing", ["DrawingIssue", "DesignBasis"], "drawing_source_id", "The exact issue, not the latest by name")}
          {pick("Intended configuration", "configuration", ["InstalledConfiguration"], "configuration_source_id", "The configuration record the tests assume")}
        </div>
        <p className="cm-note">{options?.limits[0] ?? "Sources are the retained snapshots of the local synthetic upstream adapter."}</p>

        <h3 className="cm-subhead">Checks</h3>
        {checks.map((k, n) => <CheckEditor key={n} d={d} k={k} n={n} error={rowError(command, "checks", n)} change={(patch) => check(n, patch)} remove={() => { setDirty(true); setChecks((all) => all.filter((_, x) => x !== n)); }} />)}
        <div className="em-actions"><button type="button" className="mw-button" onClick={() => { setDirty(true); setChecks((all) => [...all, blankCheck]); }}>Add check</button></div>

        <h3 className="cm-subhead">Readiness prerequisites</h3>
        <p className="cm-note">What must be true before a test is performed. A mandatory hold or witness point has no general override.</p>
        {needs.map((x, n) => (
          <fieldset className="cm-edit-block" key={n}>
            <legend>Prerequisite {n + 1}{x.label && `: ${x.label}`}</legend>
            {rowError(command, "prerequisites", n) && <p className="mw-inline-error" role="alert">{rowError(command, "prerequisites", n)}</p>}
            <div className="cm-inline">
              <Field label="Prerequisite"><input value={x.label} maxLength={200} onChange={(e) => need(n, { label: e.target.value })} onBlur={() => { if (!x.key) need(n, { key: slug(x.label) }); }} /></Field>
              <Field label="Key"><input value={x.key} maxLength={80} onChange={(e) => need(n, { key: e.target.value })} /></Field>
              <Field label="Kind"><select value={x.kind} onChange={(e) => need(n, { kind: e.target.value as Prerequisite["kind"] })}>{prerequisiteKinds.map((kind) => <option key={kind}>{kind}</option>)}</select></Field>
            </div>
            <Field label="Source of the requirement (optional)"><input value={x.source} maxLength={300} onChange={(e) => need(n, { source: e.target.value })} /></Field>
            <div className="em-actions">
              <label className="cm-check"><input type="checkbox" checked={x.mandatory} onChange={(e) => need(n, { mandatory: e.target.checked })} /><span>Mandatory: an attempt cannot be submitted while it is not met</span></label>
              <button type="button" className="mw-button mw-button-quiet" onClick={() => { setDirty(true); setNeeds((all) => all.filter((_, i) => i !== n)); }}>Remove prerequisite</button>
            </div>
          </fieldset>
        ))}
        <div className="em-actions"><button type="button" className="mw-button" onClick={() => { setDirty(true); setNeeds((all) => [...all, { key: "", label: "", kind: "Access", mandatory: true, source: "" }]); }}>Add prerequisite</button></div>
        <CommandNotice command={command} saved="Draft basis saved on the server." />
      </div>
    </Dialog>
  );
}

// A limit is entered as text and compared exactly; it is never a floating-point number. Every limit here is fictional and says so.
function Limit({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="mw-field"><span className="em-label">{label} <span className="cm-fictional">Fictional limit</span></span><input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="No limit on this side" /></label>;
}
function CheckEditor({ d, k, n, error, change, remove }: { d: Detail; k: CheckForm; n: number; error?: string; change: (patch: Partial<CheckForm>) => void; remove: () => void }) {
  const choices = split(k.choices), conversion = (i: number, patch: Partial<CheckForm["conversions"][number]>) => change({ conversions: k.conversions.map((c, x) => (x === i ? { ...c, ...patch } : c)) });
  return (
    <fieldset className="cm-edit-block">
      <legend>Check {n + 1}{k.name && `: ${k.name}`}</legend>
      {error && <p className="mw-inline-error" role="alert">{error}</p>}
      <div className="cm-inline">
        <Field label="Check name"><input value={k.name} maxLength={160} onChange={(e) => change({ name: e.target.value })} onBlur={() => { if (!k.key) change({ key: slug(k.name) }); }} /></Field>
        <Field label="Key" hint="One stable occurrence: the same check on two assets is two keys"><input value={k.key} maxLength={80} onChange={(e) => change({ key: e.target.value })} /></Field>
        <Field label="Type"><select value={k.check_type} onChange={(e) => change({ check_type: e.target.value as CheckForm["check_type"] })}><option>Numeric</option><option>Qualitative</option></select></Field>
        <Field label="Scope item"><select value={k.scope_key} onChange={(e) => change({ scope_key: e.target.value })}><option value="">Whole scope</option>{d.scope.items.map((i) => <option key={i.key} value={i.key}>{i.title}</option>)}</select></Field>
      </div>
      {k.check_type === "Numeric" ? (
        <>
          <label className="cm-check"><input type="checkbox" checked={k.undefined_criterion} onChange={(e) => change({ undefined_criterion: e.target.checked })} /><span>Criterion not defined yet. The check shows as “Criteria missing”: a reading can be captured but not assessed, and no limit is borrowed from another asset, manufacturer or template.</span></label>
          {!k.undefined_criterion && (
            <>
              <div className="cm-inline">
                <Field label="Unit"><input value={k.unit} maxLength={20} onChange={(e) => change({ unit: e.target.value })} /></Field>
                <Field label="Decimal places accepted" hint="Limits are stated to this precision"><input type="number" min={0} max={12} value={k.precision} onChange={(e) => change({ precision: e.target.value })} /></Field>
              </div>
              <div className="cm-inline">
                <div><Limit label="Lower limit" value={k.lower} onChange={(lower) => change({ lower })} /><label className="cm-check"><input type="checkbox" checked={k.lower_inclusive} onChange={(e) => change({ lower_inclusive: e.target.checked })} /><span>Inclusive: a reading equal to it passes</span></label></div>
                <div><Limit label="Upper limit" value={k.upper} onChange={(upper) => change({ upper })} /><label className="cm-check"><input type="checkbox" checked={k.upper_inclusive} onChange={(e) => change({ upper_inclusive: e.target.checked })} /><span>Inclusive: a reading equal to it passes</span></label></div>
              </div>
              {k.conversions.map((c, i) => (
                <div className="cm-inline" key={i}>
                  <Field label="Approved conversion from unit"><input value={c.from_unit} maxLength={20} onChange={(e) => conversion(i, { from_unit: e.target.value })} /></Field>
                  <Field label="Multiply by"><input inputMode="decimal" value={c.multiply} onChange={(e) => conversion(i, { multiply: e.target.value })} /></Field>
                  <Field label="Then add"><input inputMode="decimal" value={c.add} onChange={(e) => conversion(i, { add: e.target.value })} /></Field>
                  <div className="em-actions"><button type="button" className="mw-button mw-button-quiet" onClick={() => change({ conversions: k.conversions.filter((_, x) => x !== i) })}>Remove conversion</button></div>
                </div>
              ))}
              <div className="em-actions"><button type="button" className="mw-button mw-button-quiet" onClick={() => change({ conversions: [...k.conversions, { from_unit: "", multiply: "", add: "0" }] })}>Add an approved unit conversion</button><span className="cm-note">No conversion is ever assumed: a reading in another unit is unassessable without one.</span></div>
            </>
          )}
        </>
      ) : (
        <>
          <Field label="Approved choices" hint="Two or more, separated with commas"><input value={k.choices} onChange={(e) => change({ choices: e.target.value })} /></Field>
          <fieldset className="cm-checks"><legend>Accepted outcomes</legend>
            {choices.map((c) => <label className="cm-check" key={c}><input type="checkbox" checked={k.accepted.includes(c)} onChange={(e) => change({ accepted: e.target.checked ? [...k.accepted, c] : k.accepted.filter((a) => a !== c) })} /><span>{c}</span></label>)}
            {!choices.some((c) => k.accepted.includes(c)) && <p className="cm-note">With no accepted outcome the check shows as “Criteria missing”.</p>}
          </fieldset>
        </>
      )}
      <label className="cm-check"><input type="checkbox" checked={k.required} onChange={(e) => change({ required: e.target.checked })} /><span>Required</span></label>
      <label className="cm-check"><input type="checkbox" checked={k.conditional} onChange={(e) => change({ conditional: e.target.checked })} /><span>Applies only under a stated condition</span></label>
      {k.conditional && (
        <div className="cm-inline">
          <Field label="Condition"><input value={k.statement} maxLength={300} onChange={(e) => change({ statement: e.target.value })} /></Field>
          <Field label="Is the condition met?" hint="False removes the requirement, with this statement as its reason. Unknown never removes a requirement"><select value={k.outcome} onChange={(e) => change({ outcome: e.target.value as CheckForm["outcome"] })}>{conditionOutcomes.map((o) => <option key={o}>{o}</option>)}</select></Field>
        </div>
      )}
      <div className="cm-inline">
        <Field label="Evidence items required"><input type="number" min={0} max={10} value={k.evidence_min} onChange={(e) => change({ evidence_min: e.target.value })} /></Field>
        <Field label="Witness or hold point"><select value={k.witness} onChange={(e) => change({ witness: e.target.value as CheckForm["witness"] })}>{witnessKinds.map((w) => <option key={w} value={w}>{w === "None" ? "None" : `${w} point`}</option>)}</select></Field>
      </div>
      <div className="em-actions">
        <label className="cm-check"><input type="checkbox" checked={k.instrument_required} onChange={(e) => change({ instrument_required: e.target.checked })} /><span>A named instrument is required</span></label>
        <button type="button" className="mw-button mw-button-quiet" onClick={remove}>Remove check</button>
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------------------------
function CriteriaPanel({ d, b }: { d: Detail; b: Basis | null }) {
  const scope = (key: string | null) => (key ? d.scope.items.find((i) => i.key === key)?.title ?? key : "Whole scope"), owner = d.record.owner_name ?? "nobody yet (unassigned)", editable = !!b?.editable;
  return (
    <section className="cm-panel" id="cm-panel-criteria" tabIndex={-1} aria-labelledby="cm-criteria-title">
      <header><div><h3 id="cm-criteria-title">Checks &amp; criteria</h3><p>{b ? `The checks of basis ${pad(b.number)} (${b.reference} ${b.revision}). ` : ""}Every limit in this prototype is fictional. A missing criterion stays missing: nothing defaults to a pass.</p></div></header>
      <div className="em-table-scroll">
        <table className="em-table cm-table">
          <caption className="mw-sr">Checks and acceptance criteria</caption>
          <thead><tr>{["Check", "Scope", "Criterion", "Required / conditional", "Evidence required", "Instrument", "Witness / hold"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
          <tbody>
            {b?.checks.map((k) => (
              <tr key={k.key}>
                <td><span className="em-row-title">{k.name}</span><span className="em-cell-sub">{k.check_type} · {k.key}</span></td>
                <td data-label="Scope">{scope(k.scope_key)}</td>
                <td data-label="Criterion">{k.has_criterion ? <>{k.criterion_text} <span className="cm-fictional">Fictional limit</span></> : <><Tag view={tag("Criteria missing", "caution", "alert")} /><span className="em-cell-sub">Owned by {owner}; {editable ? "define it before this draft is submitted, or it stays unassessable" : "define it in a successor basis"}</span></>}</td>
                <td data-label="Required / conditional">{k.is_required ? "Required" : k.required ? "Not required: condition not met" : "Optional"}{k.condition && <span className="em-cell-sub">{k.condition.statement} — {k.condition.outcome.toLowerCase()}{k.condition.outcome === "Unknown" && "; an unknown condition never removes a requirement"}</span>}</td>
                <td data-label="Evidence required">{k.evidence_min ? `${k.evidence_min} item${k.evidence_min === 1 ? "" : "s"}` : "None required"}</td>
                <td data-label="Instrument">{k.instrument_required ? "Named instrument" : "Not required"}</td>
                <td data-label="Witness / hold">{k.witness === "None" ? "None" : `${k.witness} point`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!b?.checks.length && <div className="em-empty"><p>{b ? "No check is defined in this basis yet." : "No test basis exists yet."}</p></div>}
      </div>
    </section>
  );
}

function PrerequisitesPanel({ b }: { b: Basis | null }) {
  return (
    <section className="cm-panel" id="cm-panel-prerequisites" tabIndex={-1} aria-labelledby="cm-prerequisites-title">
      <header><div><h3 id="cm-prerequisites-title">Readiness prerequisites</h3><p>Each is confirmed on the attempt itself. A mandatory hold or witness point has no general override: an attempt cannot be submitted while one is not met.</p></div></header>
      <div className="em-table-scroll">
        <table className="em-table cm-table">
          <caption className="mw-sr">Readiness prerequisites of the test basis</caption>
          <thead><tr>{["Prerequisite", "Kind", "Mandatory", "Source"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
          <tbody>
            {b?.prerequisites.map((x) => (
              <tr key={x.key}><td><span className="em-row-title">{x.label}</span></td><td data-label="Kind">{x.kind === "Hold" || x.kind === "Witness" ? `${x.kind} point` : x.kind}</td><td data-label="Mandatory">{x.mandatory ? "Mandatory" : "Advisory"}</td><td data-label="Source">{x.source ?? "Not stated"}</td></tr>
            ))}
          </tbody>
        </table>
        {!b?.prerequisites.length && <div className="em-empty"><p>{b ? "This basis declares no readiness prerequisite." : "No test basis exists yet."}</p></div>}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
function SourcesPanel({ d, options, zone, reload }: Shared) {
  const { packageId, frame } = useCommissioning(), act = useAct(reload), [assessing, setAssessing] = useState(false), c = d.source_condition;
  // Anyone who holds a duty on this package may ask the adapter again. The answer is recorded with its own time.
  const duty = frame ? Object.values(frame.can).some(Boolean) : false, archived = !!d.record.archived_at;
  const successor = (id: string | null) => { const s = id ? options?.sources.find((x) => x.id === id) : null; return s ? `${s.reference} Rev ${s.revision}` : id ? "A newer revision" : null; };
  return (
    <section className="cm-panel" id="cm-panel-sources" tabIndex={-1} aria-labelledby="cm-sources-title">
      <header>
        <div><h3 id="cm-sources-title">Source currentness</h3><p>What was bound, against what the synthetic upstream adapter says of it now. Readiness is rechecked before every attempt and every decision.</p></div>
        <div className="em-actions">
          <button type="button" className="mw-button" disabled={!duty || archived || act.command.busy} onClick={() => void act.command.send(`engineering/${packageId}/commissioning`, { action: "check", record_id: d.record.id, reason: "Source currentness checked through the synthetic upstream adapter" })}>{act.command.busy ? "Saving…" : "Check sources now"}</button>
          <button type="button" className="mw-button" disabled={!!d.refusals.assess_source || archived} onClick={() => { act.command.clear(); setAssessing(true); }}>Record manual assessment</button>
        </div>
      </header>
      <div className="cm-panel-body">
        <div className="cm-row"><span>Condition now</span><span><Tag view={c.view} />{c.reasons.map((r) => <small key={r}>{r}</small>)}</span></div>
        {!duty && <Refusal reason="Checking sources records a fact on this package, so it needs a commissioning duty here. This identity holds none." />}
        <Refusal reason={d.refusals.assess_source} />
        {!assessing && <CommandNotice command={act.command} saved="Source check recorded on the server." />}
      </div>
      <div className="em-table-scroll cm-after-body">
        <table className="em-table cm-table">
          <caption className="mw-sr">Bound sources as bound and as they are now</caption>
          <thead><tr>{["Role", "As bound", "Now", "Changed", "Reason for the change"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
          <tbody>
            {c.bound.map((x) => (x.live && !x.live.readable ? (
              // Nothing of a restricted source is disclosed: no reference, revision, hash or change.
              <tr key={x.role}><td><span className="em-row-title">{roles[x.role]}</span></td><td data-label="As bound" colSpan={4}>Restricted source</td></tr>
            ) : (
              <tr key={x.role}>
                <td><span className="em-row-title">{roles[x.role]}</span></td>
                <td data-label="As bound">{x.snapshot ? <>{x.snapshot.reference} · Rev {x.snapshot.revision}<span className="em-cell-sub">file {x.snapshot.file_version} · <span className="cm-hash">{x.snapshot.content_hash?.slice(0, 16) ?? "no hash"}</span></span></> : "Unavailable"}</td>
                <td data-label="Now">{x.live ? <><Tag view={sourceUseView[x.live.use] ?? tag(x.live.use, "neutral", "document")} />{successor(x.live.successor_id) && <span className="em-cell-sub">Successor: {successor(x.live.successor_id)}</span>}</> : <Tag view={sourceUseView.Unavailable} />}</td>
                <td data-label="Changed">{x.live?.changed_at ? siteTime(x.live.changed_at, zone) : "No change recorded"}</td>
                <td data-label="Reason for the change">{x.live?.change_reason ?? "—"}</td>
              </tr>
            )))}
          </tbody>
        </table>
        {!c.bound.length && <div className="em-empty"><p>No source is bound yet, so there is nothing to compare.</p></div>}
      </div>
      <div className="cm-after-table">
        <div className="cm-panel-body"><h4 className="cm-subhead">Recorded checks</h4><p className="cm-note">The time beside each check is when that check was recorded. It is never the moment this page was opened, and opening this page checks nothing.</p></div>
        <ol className="cm-timeline">
          {d.checks_recorded.map((k) => (
            <li key={k.id}>
              <time dateTime={k.checked_at}>{siteTime(k.checked_at, zone)}</time>
              <div><Tag view={k.view} /> <span>by {k.checked_by_name} · {adapters[k.adapter] ?? k.adapter}</span>{k.assessment_evidence && <small>Evidence: {k.assessment_evidence}</small>}</div>
            </li>
          ))}
        </ol>
        {!d.checks_recorded.length && <div className="cm-panel-body"><p className="cm-note">No source check has been recorded for this package, so none is claimed.</p></div>}
      </div>
      {assessing && <AssessSources d={d} command={act.command} onClose={() => setAssessing(false)} />}
    </section>
  );
}

function AssessSources({ d, command, onClose }: { d: Detail; command: Command; onClose: () => void }) {
  const { packageId } = useCommissioning(), [result, setResult] = useState("Current"), [evidence, setEvidence] = useState("");
  const record = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning`, { action: "assess", record_id: d.record.id, result, evidence, reason: "Manual assessment of source currentness" });
    if (receipt) onClose();
  };
  return (
    <Dialog title="Record manual assessment" subtitle="A named assessor's evidenced statement at a recorded time, for when the adapter cannot establish currentness. It is never a ticked box, and it changes no source." busy={command.busy} dirty={!!evidence} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void record()} disabled={command.busy || !evidence.trim()}>{command.busy ? "Saving…" : "Record assessment"}</button></>}>
      <div className="cm-stack">
        <Field label="Assessed condition" error={fieldError(command.error, "result")}><select data-autofocus value={result} onChange={(e) => setResult(e.target.value)}><option value="Current">Sources current</option><option value="ReassessmentRequired">Reassessment required</option><option value="Unavailable">Currentness not established</option></select></Field>
        <Field label="Evidence" hint="What was compared, against what, and where it is retained" error={fieldError(command.error, "evidence")}><input value={evidence} maxLength={600} onChange={(e) => setEvidence(e.target.value)} /></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}
