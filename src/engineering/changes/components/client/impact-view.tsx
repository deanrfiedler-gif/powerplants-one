"use client";
import { useEffect, useMemo, useState } from "react";
import { disciplines } from "../../../model";
import {
  assessmentCategories, attentionPresentation, categoryStatuses, changeCategories, costKinds, dispositions, objectTypes, optionKinds, sourcePresentation, sourceRoles, stagePresentation, supplyStates, taxBases,
  type CategoryFinding,
} from "../../model";
import type { ImpactQueueRow, readCandidates, readPeople } from "../../reads";
import { useChanges } from "./changes-shell";
import { Coordination } from "./coordination";
import { CommandNotice, Field, Icon, Reason, Tone, ToneMark, dateText, fieldError, newId, stampText, text, useChangeCommand, useRead } from "./changes-ui";
import { DetailHead, Page, lines, usePanelFocus, useSelect, useView, type Detail, type View } from "./view-common";

type People = Awaited<ReturnType<typeof readPeople>>;
type Candidates = Awaited<ReturnType<typeof readCandidates>>;
type QueueRow = ImpactQueueRow;

export function ImpactView() {
  const view = useView("impact"), select = useSelect(), rows = (view.data?.queue ?? []) as unknown as QueueRow[];
  return (
    <Page view={view} label="Impact assessment" empty="These changes are being captured, assessed or corrected, or rest on a source that has moved. Choose one to compare its exact baseline and proposal."
      queue={
        <div className="em-table-scroll">
          <table className="em-table ec-queue">
            <caption className="mw-sr">Changes being assessed or corrected in this package</caption>
            <thead><tr>{["Change", "Basis → proposal", "Review state", "Next action owner", "Due", "Attention"].map((h) => <th key={h} scope="col"><span style={{ padding: "0 14px" }}>{h}</span></th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-current={r.id === view.changeId || undefined} onClick={() => select(r.id)}>
                  <td><button type="button" className="em-row-title" onClick={() => select(r.id)}>{r.title}</button><span className="em-cell-sub">{r.reference}</span></td>
                  <td className="ec-basis">{r.basis}</td><td><Tone view={stagePresentation[r.stage]} /></td><td>{r.next_owner_name ?? "Unassigned"}</td><td>{dateText(r.due)}</td><td><Tone view={attentionPresentation[r.attention]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {view.data && !rows.length && <div className="em-empty"><p>No change in this package is waiting on assessment or correction.</p></div>}
        </div>
      }>
      {(d) => <Assessment key={`${d.change.id}:${d.revision.id}`} d={d} view={view.data!} reload={view.reload} />}
    </Page>
  );
}

function Assessment({ d, view, reload }: { d: Detail; view: View; reload: () => void }) {
  const { packageId } = useChanges(), command = useChangeCommand(reload), [editing, setEditing] = useState(false);
  usePanelFocus(true);
  const path = `engineering/${packageId}/changes/impact`, changed = d.source_condition.condition !== "Current" && d.source_condition.condition !== "NotCaptured";
  const revisable = d.revision.state === "Returned" || (d.revision.state === "Decided" && d.decision?.result === "Accepted");
  return (
    <>
      <DetailHead d={d}>
        <button type="button" className="mw-button" onClick={() => void command.send(path, { action: "check", change_id: d.change.id, reason: "Source currentness checked through the upstream adapter" })} disabled={command.busy}>Check sources now</button>
        {d.revision.editable && !editing && <button type="button" className="mw-button mw-button-primary" onClick={() => setEditing(true)}>{d.change.stage === "Draft" ? "Continue capture" : "Edit assessment"}</button>}
      </DetailHead>
      <CommandNotice command={command} saved="Recorded on the server." />
      {d.revision.state === "Returned" && (
        <div className="ec-banner" role="note"><ToneMark icon="warning" />
          <div><strong>Returned: {text(d.revision.return_kind ?? "Correction")}</strong><p>{d.revision.return_reason}</p>
            <p>Returned by {d.revision.returned_by_name} on {stampText(d.revision.returned_at)}. Correction is owned by {d.revision.return_owner_name}, due {dateText(d.revision.return_due)}. This revision and every response to it stay exactly as they were.</p></div>
        </div>
      )}
      {changed && (
        <div className="ec-banner" role="note" id="ec-panel-sources" tabIndex={-1}><ToneMark icon="warning" />
          <div><strong>{d.source_condition.view.label} — review the updated comparison</strong>
            <ul className="em-reasons">{d.source_condition.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            <p>“As reviewed” below is retained exactly as it was observed. {d.revision.state === "Working" ? "Edit the assessment to capture the current source, then save." : "Reviews and decisions on this revision stay as history; a successor revision is assessed against the current source."}</p></div>
        </div>
      )}
      {revisable && d.refusals.edit === null && (
        <div className="em-actions">
          <button type="button" className="mw-button" disabled={command.busy} onClick={() => void command.send(path, { action: "revise", change_id: d.change.id, expected_version: d.change.version, id: newId(), reason: d.revision.state === "Returned" ? "Corrected successor of the returned proposal" : "Amended successor of the accepted proposal" })}>
            {d.revision.state === "Returned" ? "Create corrected revision" : "Create amended revision"}</button>
          <span className="ec-note">The successor starts as an exact copy. Relevant reviews are renewed; nothing already recorded is rewritten.</span>
        </div>
      )}
      {editing && d.revision.editable ? <Editor d={d} view={view} onDone={() => { setEditing(false); reload(); }} onCancel={() => setEditing(false)} /> : <ReadOnly d={d} changed={changed} />}
      {!editing && d.refusals.edit === null && !["Closed", "Withdrawn"].includes(d.change.stage) && <Coordination key={d.change.version} d={d} reload={reload} />}
    </>
  );
}

function ReadOnly({ d, changed }: { d: Detail; changed: boolean }) {
  const doc = d.document;
  return (
    <>
      <section className="em-panel" aria-label="Exact basis and proposal">
        <div className="em-panel-head"><h3>Current and proposed</h3><span className="ec-note">Entered structured attributes and controlled references. Native CAD stays linked evidence; no geometry is compared.</span></div>
        <div className="em-panel-body ec-stack">
          <dl className="em-facts">
            <div><dt>Reason category</dt><dd>{text(d.change.category)}</dd></div>
            <div><dt>Proposed revision</dt><dd>{doc.proposed_reference ?? "Not named"} · {doc.proposed_revision ?? "?"} {d.inspector.proposed.issued ? "(issued)" : "(not issued)"}</dd></div>
            <div><dt>Revised technical release</dt><dd>{doc.requires_revised_release ? "Required before implementation" : "Not required"}</dd></div>
            <div><dt>Declared priority</dt><dd>{d.change.priority ? `${d.change.priority} — ${d.change.priority_reason}` : "None declared"}</dd></div>
          </dl>
          <p><strong>Reason.</strong> {doc.rationale ?? <span className="mw-muted">Not yet given. It is required before review.</span>}</p>
          {doc.scope_statement && <p><strong>Scope.</strong> {doc.scope_statement}</p>}
        </div>
        <div className="em-table-scroll">
          <table className="em-table ec-compare-table"><caption className="mw-sr">Compared attributes</caption>
            <thead><tr>{["Attribute", "Current (as released)", "Proposed", "Note"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{doc.comparison.map((r, i) => <tr key={i}><td>{r.attribute}{r.unit && <span className="em-cell-sub">{r.unit}</span>}</td><td>{r.current ?? "—"}</td><td className={r.current !== r.proposed ? "ec-changed" : undefined}>{r.proposed ?? "—"}</td><td>{r.note}</td></tr>)}</tbody>
          </table>
          {!doc.comparison.length && <div className="em-empty"><p>No compared attribute is recorded yet.</p></div>}
        </div>
      </section>

      <section className="em-panel" aria-label="Exact sources" id={changed ? undefined : "ec-panel-sources"} tabIndex={-1}>
        <div className="em-panel-head"><h3>Exact sources</h3><Tone view={sourcePresentation[d.source_condition.condition]} /><span className="ec-note">Engineering revision, file version, hash, issue purpose and observation time are separate facts. A newer file is not an approved successor.</span></div>
        <div className="em-table-scroll">
          <table className="em-table"><caption className="mw-sr">Source set of this revision: as reviewed against the current upstream answer</caption>
            <thead><tr>{["Role", "Source", "As reviewed", "Purpose", "Observed", "Current source"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{d.sources.map((s) => (
              <tr key={s.source_id}><td>{text(s.role)}{!s.required && <span className="em-cell-sub">Optional</span>}</td>
                <td>{s.snapshot.reference}<span className="em-cell-sub">{s.source?.title}</span></td>
                <td>Revision {s.snapshot.revision} · file {s.snapshot.file_version}<span className="em-cell-sub em-hash">{s.snapshot.content_hash?.slice(0, 16) ?? "no retrievable content"}…</span></td>
                <td>{text(s.snapshot.permitted_purpose)}</td><td>{stampText(s.snapshot.observed_at)}</td>
                <td>{!s.source ? <Tone view={sourcePresentation.Unavailable} /> : !s.source.readable ? <Tone view={sourcePresentation.Restricted} /> : s.source.use === "Current" ? "Unchanged" : <Tone view={sourcePresentation[s.source.use === "Withdrawn" ? "Withdrawn" : s.source.use === "Superseded" ? "Changed" : "Unavailable"]} wrap />}
                  {s.source?.change_reason && <span className="em-cell-sub">{s.source.change_reason} · {stampText(s.source.changed_at)}</span>}</td></tr>
            ))}</tbody>
          </table>
          {!d.sources.length && <div className="em-empty"><p>No source is captured yet. A proposal is measured against one exact baseline.</p></div>}
        </div>
        {d.checks.length > 0 && <div className="em-panel-body"><p className="ec-note">Recorded checks: {d.checks.slice(0, 4).map((k) => `${text(k.result)} · ${stampText(k.checked_at)} · ${k.checked_by_name}`).join("  |  ")}. Adapter: {d.checks[0].adapter} (local retained snapshots; no live provider is connected).</p></div>}
      </section>

      <section className="em-panel" aria-label="Affected items">
        <div className="em-panel-head"><h3>Affected items</h3><span className="ec-note">{d.objects.filter((o) => o.disposition === "Included").length} included · {d.objects.filter((o) => o.disposition === "Excluded").length} excluded with a reason · {d.objects.filter((o) => o.disposition === "Candidate").length} suggested and undecided</span></div>
        <div className="em-table-scroll">
          <table className="em-table"><caption className="mw-sr">Objects this change may affect</caption>
            <thead><tr>{["Object", "Type", "Current state", "Proposed effect", "Location · areas served", "Why linked", "Owner · next action", "Disposition"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{d.objects.map((o) => (
              <tr key={o.id}><td>{o.reference}<span className="em-cell-sub">{o.title}</span></td><td>{text(o.object_type)}{o.supply_state && <span className="em-cell-sub">{o.supply_state}</span>}</td><td>{o.current_state ?? "—"}</td><td>{o.proposed_effect ?? "—"}{o.finding && <span className="em-cell-sub">{o.finding}</span>}</td>
                {/* Physical location and areas served are different facts: one asset serving three areas is one row. */}
                <td>{o.location ?? "—"}{o.served_areas.length > 0 && <span className="em-cell-sub">Serves {o.served_areas.join(", ")}</span>}</td><td>{o.relation}{o.evidence && <span className="em-cell-sub">{o.evidence}</span>}</td>
                <td>{o.owner_name ?? "—"}{o.next_action && <span className="em-cell-sub">{o.next_action}</span>}</td><td>{o.disposition}{o.exclusion_reason && <span className="em-cell-sub">{o.exclusion_reason}</span>}</td></tr>
            ))}</tbody>
          </table>
          {!d.objects.length && <div className="em-empty"><p>No affected object is listed. An empty list is not evidence of no impact.</p></div>}
        </div>
      </section>

      <div className="em-two">
        <section className="em-panel" aria-label="Category assessment">
          <div className="em-panel-head"><h3>Scope completeness</h3>{d.completeness.complete ? <Tone view={{ label: "Every category answered", tone: "positive", icon: "check" }} /> : <Tone view={{ label: "Not complete", tone: "caution", icon: "warning" }} />}</div>
          <ul className="em-list">
            {assessmentCategories.map(([key, name]) => {
              const k = doc.categories.find((c) => c.key === key);
              return <li key={key}><div><strong>{name}</strong><p>{k ? `${text(k.status)}${k.impact ? ` · ${text(k.impact)}` : ""}` : "Not yet assessed"}</p>{k?.finding && <p>{k.finding}</p>}{k?.reason && <p>Reason: {k.reason}</p>}{k?.evidence && <p>Evidence: {k.evidence}</p>}</div></li>;
            })}
          </ul>
          {!d.completeness.complete && <div className="em-panel-body"><ul className="em-blockers">{d.completeness.reasons.map((r) => <li key={r}>{r}</li>)}</ul></div>}
        </section>
        <div className="ec-stack">
          <section className="em-panel" aria-label="Options"><div className="em-panel-head"><h3>Options considered</h3></div>
            <ul className="em-list">{doc.options.map((o) => <li key={o.key} data-current={o.key === doc.selected_option || undefined}><div><strong>{o.label}{o.key === doc.selected_option && " — put forward"}</strong><p>{text(o.kind)}</p>{o.assumptions && <p>Assumes: {o.assumptions}</p>}{o.impacts && <p>Impacts: {o.impacts}</p>}</div></li>)}</ul>
            {!doc.options.length && <div className="em-empty"><p>No option is documented yet.</p></div>}
          </section>
          <section className="em-panel" aria-label="Cost impact"><div className="em-panel-head"><h3>Cost impact</h3></div>
            <div className="em-panel-body">
              {d.costs.withheld ? <Reason>{d.costs.note}</Reason> : !d.costs.groups.length && !d.costs.unknown.length ? <p className="ec-note">No cost component is recorded.</p> : (
                <>
                  {/* A partial sum is labelled as partial. Unlike currencies, tax bases and kinds are never added together. */}
                  {d.costs.groups.map((g) => <p key={`${g.kind}${g.currency}${g.tax_basis}`}><strong>Known {g.kind.toLowerCase()} impact: {g.currency} {g.known}</strong> ({g.tax_basis === "ExTax" ? "excluding" : "including"} tax, {g.components} component{g.components === 1 ? "" : "s"})</p>)}
                  {d.costs.unknown.length > 0 && <p>Unknown and not counted as zero: {d.costs.unknown.join(", ")}.</p>}
                  <p className="ec-note">An estimate is not an approved variation. Commercial authority is a separate prerequisite with its own owner.</p>
                </>
              )}
            </div>
          </section>
          {d.overlaps.length > 0 && (
            <section className="em-panel" aria-label="Overlapping changes" id="ec-panel-overlaps" tabIndex={-1}><div className="em-panel-head"><h3>Overlapping changes</h3></div>
              <ul className="em-list">{d.overlaps.map((o) => <li key={o.change_id}><div><strong>{o.reference} · {o.title}</strong><p>{o.restricted ? "Outside your access: resolution belongs to someone who can read both." : `${stagePresentation[o.stage].label} · technical decision ${o.decision.toLowerCase()} · shares ${o.shared.map((x) => x.reference).join(", ")}`}</p>
                <p>{o.decided ? "A compatibility or sequence decision is recorded." : o.blocks_handover ? "Blocks implementation handover until a compatibility or sequence decision is recorded. Nothing is merged or rebased." : "Concurrent work is allowed. It is rechecked when a handover is confirmed."}</p></div></li>)}</ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
type Doc = Detail["document"];
type Draft = { title: string; category: string; discipline: string; location: string; system_name: string } & Doc;
const blankCategory = (key: CategoryFinding["key"]): CategoryFinding => ({ key, status: "NotAssessed", impact: null, finding: null, reason: null, evidence: null, owner_id: null });

function Editor({ d, view, onDone, onCancel }: { d: Detail; view: View; onDone: () => void; onCancel: () => void }) {
  const { packageId } = useChanges(), people = useRead<People>(`engineering/${packageId}/changes/people`), command = useChangeCommand(), path = `engineering/${packageId}/changes/impact`;
  const initial = useMemo<Draft>(() => ({ title: d.change.title, category: d.change.category, discipline: d.change.discipline, location: d.change.location, system_name: d.change.system_name, ...d.document,
    categories: assessmentCategories.map(([key]) => d.document.categories.find((c) => c.key === key) ?? blankCategory(key)) }), [d]);
  const [draft, setDraft] = useState<Draft>(initial), [version, setVersion] = useState(d.revision.version), [saved, setSaved] = useState(JSON.stringify(initial));
  const [reviewer, setReviewer] = useState(""), [suggest, setSuggest] = useState(false), [conflict, setConflict] = useState(false);
  const candidates = useRead<Candidates>(suggest ? `engineering/${packageId}/changes/candidates?change=${d.change.id}` : null);
  const dirty = JSON.stringify(draft) !== saved, set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((old) => ({ ...old, [k]: v }));
  // An unsaved assessment is never lost to a stray navigation.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const e = command.error, sources = view.sources, baselineId = draft.sources.find((s) => s.role === "Baseline")?.source_id ?? "";
  const reviewers = people.data?.items.filter((p) => p.reviewer_for.includes(draft.discipline) && p.id !== d.change.author_id) ?? [];
  const payload = () => ({ ...draft, categories: draft.categories.filter((c) => c.status !== "NotAssessed" || c.owner_id), costs: view.costs_visible ? draft.costs : d.document.costs });
  const save = async (expected = version) => {
    const receipt = await command.send(path, { action: "save", change_id: d.change.id, revision_id: d.revision.id, expected_version: expected, reason: "Proposal and assessment saved", ...payload() });
    if (receipt) { setVersion(expected + 1); setSaved(JSON.stringify(draft)); setConflict(false); return true; }
    return false;
  };
  useEffect(() => { if (command.error?.code === "VersionConflict") setConflict(true); }, [command.error]);
  const begin = async () => { if ((!dirty || (await save())) && (await command.send(path, { action: "begin", change_id: d.change.id, expected_version: d.change.version + (dirty ? 1 : 0), reason: "Assessment started" }))) onDone(); };
  const submit = async () => {
    if (dirty && !(await save())) return;
    if (await command.send(path, { action: "submit", change_id: d.change.id, revision_id: d.revision.id, expected_version: dirty ? version + 1 : version, reason: "Submitted for independent review", reviewers: [{ id: newId(), discipline: draft.discipline, reviewer_id: reviewer, required: true }] })) onDone();
  };
  const row = <T,>(list: T[], i: number, patch: Partial<T>) => list.map((x, n) => (n === i ? { ...x, ...patch } : x));
  const input = (value: string | null, onChange: (v: string | null) => void, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <input value={value ?? ""} onChange={(ev) => onChange(ev.target.value || null)} {...props} />;

  return (
    <form className="ec-stack" aria-label="Edit proposal and assessment" onSubmit={(ev) => { ev.preventDefault(); void save(); }}>
      <div className="ec-banner ec-banner-info" role="note"><ToneMark icon="info" /><div><strong>Working revision {d.revision.number}</strong><p>Saved drafts stay on the server. Submitting freezes this exact content for review; correction after that is a successor revision.</p></div></div>
      <section className="em-panel"><div className="em-panel-head"><h3>What is changing</h3></div>
        <div className="em-panel-body ec-grid">
          <Field label="Change title" error={fieldError(e, "title")}><input value={draft.title} onChange={(ev) => set("title", ev.target.value)} maxLength={200} /></Field>
          <Field label="Reason category"><select value={draft.category} onChange={(ev) => set("category", ev.target.value)}>{changeCategories.map((c) => <option key={c} value={c}>{text(c)}</option>)}</select></Field>
          <Field label="Discipline"><select value={draft.discipline} onChange={(ev) => set("discipline", ev.target.value)}>{disciplines.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Affected area (physical location)" error={fieldError(e, "location")}><input value={draft.location} onChange={(ev) => set("location", ev.target.value)} /></Field>
          <Field label="System" error={fieldError(e, "system_name")}><input value={draft.system_name} onChange={(ev) => set("system_name", ev.target.value)} /></Field>
          <div className="ec-grid-wide"><Field label="Reason for the change" hint="Required in words before review" error={fieldError(e, "rationale")}><textarea value={draft.rationale ?? ""} onChange={(ev) => set("rationale", ev.target.value || null)} maxLength={4000} /></Field></div>
          <Field label="Exact baseline" hint="The approved or released source revision this change is measured against" error={fieldError(e, "sources")}>
            <select value={baselineId} onChange={(ev) => set("sources", [...draft.sources.filter((s) => s.role !== "Baseline"), ...(ev.target.value ? [{ source_id: ev.target.value, role: "Baseline" as const, required: true }] : [])])}>
              <option value="">Choose a retained source…</option>
              {sources.filter((s) => ["DrawingIssue", "DesignBasis"].includes(s.kind)).map((s) => <option key={s.id} value={s.id}>{s.reference} · revision {s.revision} · {s.purpose_label}{s.use !== "Current" ? ` · ${s.use.toLowerCase()}` : ""}</option>)}
            </select>
          </Field>
          <Field label="Proposed reference">{input(draft.proposed_reference, (v) => set("proposed_reference", v))}</Field>
          <Field label="Proposed revision" error={fieldError(e, "proposed_revision")}>{input(draft.proposed_revision, (v) => set("proposed_revision", v), { maxLength: 12 })}</Field>
          <label className="mw-field mw-field-inline"><input type="checkbox" checked={draft.requires_revised_release} onChange={(ev) => set("requires_revised_release", ev.target.checked)} /><span>A revised technical release must be issued by its owner before implementation</span></label>
          <div className="ec-grid-wide"><Field label="Scope statement">{input(draft.scope_statement, (v) => set("scope_statement", v))}</Field></div>
        </div>
      </section>

      <section className="em-panel"><div className="em-panel-head"><h3>Other required sources</h3><button type="button" className="mw-button" onClick={() => { const next = sources.find((s) => !draft.sources.some((x) => x.source_id === s.id)); if (next) set("sources", [...draft.sources, { source_id: next.id, role: "Evidence", required: true }]); }}><Icon name="plus" /><span>Add source</span></button></div>
        <div className="em-panel-body ec-stack">
          {draft.sources.filter((s) => s.role !== "Baseline").map((s) => {
            const i = draft.sources.indexOf(s);
            return (
              <div key={s.source_id} className="ec-inline">
                <Field label="Source"><select value={s.source_id} onChange={(ev) => set("sources", row(draft.sources, i, { source_id: ev.target.value }))}>{sources.filter((x) => x.id === s.source_id || !draft.sources.some((y) => y.source_id === x.id)).map((x) => <option key={x.id} value={x.id}>{x.kind} · {x.reference} · {x.revision}</option>)}</select></Field>
                <Field label="Role"><select value={s.role} onChange={(ev) => set("sources", row(draft.sources, i, { role: ev.target.value as typeof s.role }))}>{sourceRoles.filter((r) => r !== "Baseline").map((r) => <option key={r} value={r}>{text(r)}</option>)}</select></Field>
                <label className="mw-field mw-field-inline"><input type="checkbox" checked={s.required} onChange={(ev) => set("sources", row(draft.sources, i, { required: ev.target.checked }))} /><span>Required for currentness</span></label>
                <button type="button" className="mw-button mw-button-quiet" onClick={() => set("sources", draft.sources.filter((_, n) => n !== i))}>Remove</button>
              </div>
            );
          })}
          {draft.sources.filter((s) => s.role !== "Baseline").length === 0 && <p className="ec-note">Only the baseline is in the source set.</p>}
        </div>
      </section>

      <section className="em-panel"><div className="em-panel-head"><h3>Current and proposed</h3><button type="button" className="mw-button" onClick={() => set("comparison", [...draft.comparison, { attribute: "", unit: null, current: null, proposed: null, note: null }])}><Icon name="plus" /><span>Add attribute</span></button></div>
        <div className="em-panel-body ec-stack">
          {draft.comparison.map((r, i) => (
            <div key={i} className="ec-inline">
              <Field label="Attribute" error={fieldError(e, `comparison-${i}`)}><input value={r.attribute} onChange={(ev) => set("comparison", row(draft.comparison, i, { attribute: ev.target.value }))} /></Field>
              <Field label="Unit">{input(r.unit, (v) => set("comparison", row(draft.comparison, i, { unit: v })))}</Field>
              <Field label="Current">{input(r.current, (v) => set("comparison", row(draft.comparison, i, { current: v })))}</Field>
              <Field label="Proposed">{input(r.proposed, (v) => set("comparison", row(draft.comparison, i, { proposed: v })))}</Field>
              <button type="button" className="mw-button mw-button-quiet" onClick={() => set("comparison", draft.comparison.filter((_, n) => n !== i))}>Remove</button>
            </div>
          ))}
        </div>
      </section>

      <section className="em-panel"><div className="em-panel-head"><h3>Options considered</h3><button type="button" className="mw-button" onClick={() => set("options", [...draft.options, { key: `option-${draft.options.length + 1}`, kind: "AdoptProposed", label: "", assumptions: null, impacts: null, evidence: null }])}><Icon name="plus" /><span>Add option</span></button></div>
        <div className="em-panel-body ec-stack">
          {draft.options.map((o, i) => (
            <div key={o.key} className="ec-item">
              <div className="ec-inline">
                <label className="mw-field mw-field-inline"><input type="radio" name="selected-option" checked={draft.selected_option === o.key} onChange={() => set("selected_option", o.key)} /><span>Put forward</span></label>
                <Field label="Kind"><select value={o.kind} onChange={(ev) => set("options", row(draft.options, i, { kind: ev.target.value as typeof o.kind }))}>{optionKinds.map((k) => <option key={k} value={k}>{text(k)}</option>)}</select></Field>
                <Field label="Option" error={fieldError(e, `options-${i}`)}><input value={o.label} onChange={(ev) => set("options", row(draft.options, i, { label: ev.target.value }))} /></Field>
                <button type="button" className="mw-button mw-button-quiet" onClick={() => setDraft({ ...draft, options: draft.options.filter((_, n) => n !== i), selected_option: draft.selected_option === o.key ? null : draft.selected_option })}>Remove</button>
              </div>
              <div className="ec-inline"><Field label="Assumptions">{input(o.assumptions, (v) => set("options", row(draft.options, i, { assumptions: v })))}</Field><Field label="Impacts">{input(o.impacts, (v) => set("options", row(draft.options, i, { impacts: v })))}</Field></div>
            </div>
          ))}
        </div>
      </section>

      <section className="em-panel"><div className="em-panel-head"><h3>Affected items</h3>
        <button type="button" className="mw-button" onClick={() => setSuggest(true)} disabled={!baselineId || dirty} title={dirty ? "Save first, so suggestions follow the saved source set" : undefined}>Suggest related records</button>
        <button type="button" className="mw-button" onClick={() => set("objects", [...draft.objects, { id: newId(), object_type: "Requirement", object_id: null, object_key: "", reference: "", title: "", current_state: null, proposed_effect: null, relation: "", disposition: "Included", exclusion_reason: null, finding: null, evidence: null, owner_id: null, next_action: null, location: draft.location, served_areas: [], supply_state: null, owner_name: null } as Draft["objects"][number]])}><Icon name="plus" /><span>Add by exact reference</span></button></div>
        <div className="em-panel-body ec-stack">
          {suggest && candidates.data && (
            <div className="ec-item">
              <strong>Suggested from saved sources</strong>
              {candidates.data.items.filter((c) => !c.already_listed && !draft.objects.some((o) => o.object_id === c.object_id)).map((c) => (
                <div key={c.object_id} className="ec-item-head"><strong>{c.reference} · {c.title}</strong><span className="ec-note">{c.relation}</span>
                  <button type="button" className="mw-button" onClick={() => set("objects", [...draft.objects, { id: newId(), object_type: c.object_type, object_id: c.object_id, object_key: "", reference: c.reference, title: c.title, current_state: null, proposed_effect: null, relation: c.relation, disposition: "Candidate", exclusion_reason: null, finding: null, evidence: null, owner_id: null, next_action: null, location: c.location, served_areas: c.served_areas, supply_state: null, owner_name: null } as Draft["objects"][number]])}>Add as candidate</button></div>
              ))}
              <ul className="em-reasons">{candidates.data.limits.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          )}
          {draft.objects.map((o, i) => (
            <div key={o.id} className="ec-item">
              <div className="ec-inline">
                <Field label="Type"><select value={o.object_type} disabled={!!o.object_id} onChange={(ev) => set("objects", row(draft.objects, i, { object_type: ev.target.value as typeof o.object_type }))}>{objectTypes.map((t) => <option key={t} value={t}>{text(t)}</option>)}</select></Field>
                <Field label="Exact reference" error={fieldError(e, `objects-${i}`)}><input value={o.reference} disabled={!!o.object_id} onChange={(ev) => set("objects", row(draft.objects, i, { reference: ev.target.value }))} /></Field>
                <Field label="Title"><input value={o.title} onChange={(ev) => set("objects", row(draft.objects, i, { title: ev.target.value }))} /></Field>
                <Field label="Disposition"><select value={o.disposition} onChange={(ev) => set("objects", row(draft.objects, i, { disposition: ev.target.value as typeof o.disposition }))}>{dispositions.map((x) => <option key={x}>{x}</option>)}</select></Field>
                <button type="button" className="mw-button mw-button-quiet" onClick={() => set("objects", draft.objects.filter((_, n) => n !== i))}>Remove</button>
              </div>
              <div className="ec-inline">
                <Field label="Why it is linked"><input value={o.relation} onChange={(ev) => set("objects", row(draft.objects, i, { relation: ev.target.value }))} /></Field>
                <Field label="Proposed effect">{input(o.proposed_effect, (v) => set("objects", row(draft.objects, i, { proposed_effect: v })))}</Field>
                {o.disposition === "Excluded" && <Field label="Reason for exclusion">{input(o.exclusion_reason, (v) => set("objects", row(draft.objects, i, { exclusion_reason: v })))}</Field>}
              </div>
              <div className="ec-inline">
                <Field label="Physical location">{input(o.location, (v) => set("objects", row(draft.objects, i, { location: v })))}</Field>
                <Field label="Areas served" hint="Comma separated. One asset serving three areas is one row."><input value={o.served_areas.join(", ")} onChange={(ev) => set("objects", row(draft.objects, i, { served_areas: lines(ev.target.value) }))} /></Field>
                {o.object_type === "SupplyObservation" && <Field label="Observed supply state"><select value={o.supply_state ?? ""} onChange={(ev) => set("objects", row(draft.objects, i, { supply_state: (ev.target.value || null) as typeof o.supply_state }))}><option value="">Not stated</option>{supplyStates.map((x) => <option key={x}>{x}</option>)}</select></Field>}
              </div>
            </div>
          ))}
          {!draft.objects.length && <p className="ec-note">An empty list is not evidence of no impact.</p>}
        </div>
      </section>

      <section className="em-panel"><div className="em-panel-head"><h3>Assessment by category</h3><span className="ec-note">Every category is answered in words. “Not applicable” and “no impact” each need their reason.</span></div>
        <div className="em-panel-body ec-stack">
          {draft.categories.map((k, i) => {
            const commercial = k.key === "cost" || k.key === "dates", hidden = k.key === "cost" && !view.costs_visible;
            return (
              <div key={k.key} className="ec-item">
                <div className="ec-inline">
                  <strong style={{ flex: "1 1 220px" }}>{assessmentCategories.find(([x]) => x === k.key)![1]}</strong>
                  <Field label="Status" error={fieldError(e, `categories-${i}`)}><select value={k.status} onChange={(ev) => set("categories", row(draft.categories, i, { status: ev.target.value as typeof k.status, impact: ev.target.value === "Assessed" ? k.impact ?? "Impact" : null }))}>{categoryStatuses.map((s) => <option key={s} value={s}>{text(s)}</option>)}</select></Field>
                  {k.status === "Assessed" && <Field label="Result"><select value={k.impact ?? "Impact"} onChange={(ev) => set("categories", row(draft.categories, i, { impact: ev.target.value as "Impact" | "NoImpact" }))}><option value="Impact">Impact</option><option value="NoImpact">No impact</option></select></Field>}
                  {(commercial || k.status === "EvidenceNeeded") && <Field label={commercial ? "Decision owner" : "Evidence owner"}><select value={k.owner_id ?? ""} onChange={(ev) => set("categories", row(draft.categories, i, { owner_id: ev.target.value || null }))}><option value="">Nobody yet</option>{people.data?.items.filter((p) => !commercial || p.commercial).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>}
                </div>
                {hidden ? <Reason>Cost detail is limited to the people who author, decide or commercially review this change.</Reason> : (
                  <div className="ec-inline">
                    <Field label="Finding">{input(k.finding, (v) => set("categories", row(draft.categories, i, { finding: v })))}</Field>
                    <Field label={k.status === "NotApplicable" ? "Reason it does not apply" : "Rationale"}>{input(k.reason, (v) => set("categories", row(draft.categories, i, { reason: v })))}</Field>
                    <Field label="Evidence">{input(k.evidence, (v) => set("categories", row(draft.categories, i, { evidence: v })))}</Field>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {view.costs_visible && (
        <section className="em-panel"><div className="em-panel-head"><h3>Cost components</h3><button type="button" className="mw-button" onClick={() => set("costs", [...draft.costs, { key: `cost-${draft.costs.length + 1}`, label: "", kind: "Cost", amount: null, currency: "AUD", tax_basis: "ExTax", observed_on: null, source: null, confidence: null }])}><Icon name="plus" /><span>Add component</span></button></div>
          <div className="em-panel-body ec-stack">
            {draft.costs.map((c, i) => (
              <div key={c.key} className="ec-inline">
                <Field label="Component" error={fieldError(e, `costs-${i}`)}><input value={c.label} onChange={(ev) => set("costs", row(draft.costs, i, { label: ev.target.value }))} /></Field>
                <Field label="Kind"><select value={c.kind} onChange={(ev) => set("costs", row(draft.costs, i, { kind: ev.target.value as typeof c.kind }))}>{costKinds.map((x) => <option key={x}>{x}</option>)}</select></Field>
                <Field label="Amount" hint="Leave empty if unknown. Unknown is never zero.">{input(c.amount, (v) => set("costs", row(draft.costs, i, { amount: v })), { inputMode: "decimal" })}</Field>
                <Field label="Currency"><input value={c.currency} onChange={(ev) => set("costs", row(draft.costs, i, { currency: ev.target.value.toUpperCase() }))} maxLength={3} /></Field>
                <Field label="Tax basis"><select value={c.tax_basis} onChange={(ev) => set("costs", row(draft.costs, i, { tax_basis: ev.target.value as typeof c.tax_basis }))}>{taxBases.map((x) => <option key={x} value={x}>{x === "ExTax" ? "Excluding tax" : "Including tax"}</option>)}</select></Field>
                <Field label="Source">{input(c.source, (v) => set("costs", row(draft.costs, i, { source: v })))}</Field>
                <button type="button" className="mw-button mw-button-quiet" onClick={() => set("costs", draft.costs.filter((_, n) => n !== i))}>Remove</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="em-panel"><div className="em-panel-head"><h3>Retest obligations</h3><button type="button" className="mw-button" onClick={() => set("retests", [...draft.retests, { id: newId(), criterion: "", requirement_ref: null, asset_or_system: "", configuration: "", procedure_source_id: null, reason: "", verifier_id: null, due: null }])}><Icon name="plus" /><span>Add obligation</span></button></div>
        <div className="em-panel-body ec-stack">
          <p className="ec-note">Criteria and limits come from the approved technical basis. This screen supplies none, and a missing procedure is “Test basis needed”.</p>
          {draft.retests.map((r, i) => (
            <div key={r.id} className="ec-item">
              <div className="ec-inline">
                <Field label="Asset or system" error={fieldError(e, `retests-${i}`)}><input value={r.asset_or_system} onChange={(ev) => set("retests", row(draft.retests, i, { asset_or_system: ev.target.value }))} /></Field>
                <Field label="Criterion"><input value={r.criterion} onChange={(ev) => set("retests", row(draft.retests, i, { criterion: ev.target.value }))} /></Field>
                <Field label="Exact configuration under test"><input value={r.configuration} onChange={(ev) => set("retests", row(draft.retests, i, { configuration: ev.target.value }))} /></Field>
              </div>
              <div className="ec-inline">
                <Field label="Approved test procedure"><select value={r.procedure_source_id ?? ""} onChange={(ev) => set("retests", row(draft.retests, i, { procedure_source_id: ev.target.value || null }))}><option value="">None linked — test basis needed</option>{sources.filter((s) => s.kind === "TestProcedure").map((s) => <option key={s.id} value={s.id}>{s.reference} · {s.revision}</option>)}</select></Field>
                <Field label="Why it must be tested"><input value={r.reason} onChange={(ev) => set("retests", row(draft.retests, i, { reason: ev.target.value }))} /></Field>
                <Field label="Responsible verifier"><select value={r.verifier_id ?? ""} onChange={(ev) => set("retests", row(draft.retests, i, { verifier_id: ev.target.value || null }))}><option value="">Not assigned</option>{people.data?.items.filter((p) => p.verifier).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
                <Field label="Due"><input type="date" value={r.due ?? ""} onChange={(ev) => set("retests", row(draft.retests, i, { due: ev.target.value || null }))} /></Field>
                <button type="button" className="mw-button mw-button-quiet" onClick={() => set("retests", draft.retests.filter((_, n) => n !== i))}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {conflict && (
        <div className="ec-banner" role="alert"><ToneMark icon="warning" />
          <div><strong>Someone else saved this revision while you were working</strong><p>Your entries are still in this form and nothing of yours was lost or applied. Cancel to read the latest saved version, or save yours over it once you have compared them. Version {version} was yours; the server now holds a later one.</p>
            <div className="em-actions"><button type="button" className="mw-button" onClick={() => { command.clear(); void save(version + 1); }}>Save my entries over the latest version</button></div></div>
        </div>
      )}
      <CommandNotice command={command} saved="Saved to the server." />
      {d.change.stage !== "Draft" && d.refusals.submit_blockers.length > 0 && !dirty && <ul className="em-blockers" aria-label="What stops submission">{d.refusals.submit_blockers.map((b) => <li key={b}>{b}</li>)}</ul>}
      <div className="em-actions">
        <button type="submit" className="mw-button mw-button-primary" disabled={command.busy || !dirty}>{command.busy ? "Saving…" : dirty ? "Save draft" : "Saved"}</button>
        {d.change.stage === "Draft" && <button type="button" className="mw-button" disabled={command.busy} onClick={() => void begin()}>Save and start assessment</button>}
        {d.change.stage === "Assessing" && (
          <>
            <label className="em-select"><span className="mw-sr">Independent reviewer</span><select value={reviewer} onChange={(ev) => setReviewer(ev.target.value)}><option value="">Choose the independent {draft.discipline} reviewer…</option>{reviewers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <button type="button" className="mw-button" disabled={command.busy || !reviewer} onClick={() => void submit()}>Submit for review</button>
            {!reviewers.length && people.data && <Reason>{people.data.policy_configured ? `The policy names no independent ${draft.discipline} reviewer.` : "Authority not configured: no change-review policy covers this company."}</Reason>}
          </>
        )}
        <button type="button" className="mw-button mw-button-quiet" onClick={() => { if (!dirty || window.confirm("Leave without saving? Your unsaved entries will be discarded.")) (saved === JSON.stringify(initial) ? onCancel : onDone)(); }}>Close editor</button>
      </div>
    </form>
  );
}
