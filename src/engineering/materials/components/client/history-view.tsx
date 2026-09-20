"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { sourcePurposes } from "../../model";
import type { readHistory, readSources } from "../../reads";
import { useMaterials } from "./materials-shell";
import { CommandNotice, Dialog, Field, fieldError, Icon, ReadNotice, Reason, Status, dateText, stampText, text, toneFor, useMaterialsCommand, useRead } from "./materials-ui";

type History = Awaited<ReturnType<typeof readHistory>>;
type Sources = Awaited<ReturnType<typeof readSources>>;
type Source = Sources["items"][number];
const subjects = [["", "Everything"], ["MaterialLine", "Lines"], ["MaterialSubstitution", "Substitutions"], ["MaterialRelease", "Releases"], ["MaterialHandover", "Handovers"], ["MaterialSource", "Sources"], ["MaterialImpact", "Follow-ups"], ["MaterialSet", "Material set"]] as const;
const eventText = (type: string) => type.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase()).replace(/^(\w+) (.*)$/, (_, a: string, b: string) => `${a} ${b.toLowerCase()}`);
const kinds = [["DrawingIssue", "Drawing issue"], ["DesignBasis", "Design basis"], ["CompatibilityEvidence", "Compatibility evidence"], ["DemandAuthority", "Demand authority"], ["CommercialDecision", "Commercial decision"]] as const;

// Every accepted command appended an event with the exact row as it then stood. Nothing here can be edited.
export function HistoryView() {
  const { packageId, setId, reloadFrame } = useMaterials(), router = useRouter(), path = usePathname(), search = useSearchParams();
  const tab = search.get("tab") ?? "changes", subject = search.get("subject") ?? "", subjectId = search.get("subject_id");
  const go = (changes: Record<string, string | null>) => { const q = new URLSearchParams(search.toString()); for (const [k, v] of Object.entries(changes)) if (v) q.set(k, v); else q.delete(k); router.replace(`${path}${q.toString() ? `?${q}` : ""}`, { scroll: false }); };
  const query = new URLSearchParams({ ...(setId ? { set: setId } : {}), ...(subject ? { subject } : {}), ...(subjectId ? { subject_id: subjectId } : {}) }).toString();
  const history = useRead<History>(`engineering/${packageId}/materials/history${query ? `?${query}` : ""}`), data = history.data;
  const openImpacts = data?.impacts.filter((i) => i.state === "Open").length ?? 0;
  return (
    <div className="em-page" aria-busy={history.loading}>
      <div className="em-page-head">
        <h2>Changes &amp; history</h2>
        <p>Retained revisions, decisions, issues, source changes, withdrawals and receiving outcomes. A changed source never rewrites what relied on it: it raises an owned follow-up and marks current use for reassessment.</p>
      </div>
      <div className="em-tabs" role="group" aria-label="Show">
        {([["changes", "Changes"], ["followups", `Follow-ups${openImpacts ? ` (${openImpacts} open)` : ""}`], ["sources", "Exact sources"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => go({ tab: id === "changes" ? null : id })}>{label}</button>)}
      </div>
      <ReadNotice error={history.error} what="History" />
      {tab === "changes" && data && (
        <section className="em-panel" aria-label="Changes">
          <div className="em-panel-head">
            <label className="em-select"><span className="mw-sr">Show changes to</span><select value={subject} onChange={(e) => go({ subject: e.target.value || null, subject_id: null })}>{subjects.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            {subjectId && <span className="em-condition">One record only<button type="button" aria-label="Show every record" onClick={() => go({ subject_id: null })}><Icon name="close" /></button></span>}
            <span className="mw-spacer" /><span className="mw-muted">{data.events.length}{data.has_more ? "+" : ""} event{data.events.length === 1 ? "" : "s"}</span>
          </div>
          <div className="em-panel-body">
            {data.events.length ? <ol className="em-timeline">{data.events.map((e) => (
              <li key={e.id}><strong>{eventText(e.event_type)} · {e.subject_name}</strong><p>{e.actor_name} · {stampText(e.created_at)} · record version {e.subject_version}{e.content_revision ? ` · content revision ${e.content_revision}` : ""}</p><p>{e.reason}{e.note ? ` — ${e.note}` : ""}</p></li>
            ))}</ol> : <div className="em-empty"><strong>No changes match</strong><p>Choose a different record type.</p></div>}
            {data.has_more && <p className="mw-muted">Older events exist beyond this page. Narrow to one record type to read them.</p>}
          </div>
        </section>
      )}
      {tab === "followups" && data && <Impacts data={data} changed={() => { history.reload(); reloadFrame(); }} />}
      {tab === "sources" && <SourcesPanel selectedId={search.get("source")} select={(id) => go({ source: id })} changed={() => { history.reload(); reloadFrame(); }} />}
    </div>
  );
}

function Impacts({ data, changed }: { data: History; changed: () => void }) {
  const { packageId } = useMaterials(), command = useMaterialsCommand(changed), [notes, setNotes] = useState<Record<string, string>>({});
  if (!data.impacts.length) return <div className="em-empty"><strong>No follow-ups</strong><p>One is raised when a source changes, or a release is withdrawn, after something already relied on it.</p></div>;
  return (
    <section className="em-panel" aria-label="Follow-ups">
      <CommandNotice command={command} />
      <ul className="em-list">
        {data.impacts.map((i) => {
          const a = i.affected as { lines?: string[]; releases?: { number: number; state: string }[]; handovers?: { revision: number; state: string }[] };
          return (
            <li key={i.id}>
              <div>
                <strong>{i.source ? `${i.source.reference} revision ${i.source.revision} ${i.change.toLowerCase()}` : "Release current use withdrawn"}</strong>
                <p>{i.required_action}</p>
                <p>Affected: {a.lines?.length ? `line ${a.lines.join(", ")}` : "no current line"}{a.releases?.length ? ` · release ${a.releases.map((r) => `${r.number} (${text(r.state).toLowerCase()})`).join(", ")}` : ""}{a.handovers?.length ? ` · handover ${a.handovers.map((h) => `revision ${h.revision} (${text(h.state).toLowerCase()})`).join(", ")}` : ""}</p>
                <p>Owner: {i.owner_name} · raised {stampText(i.created_at)}{i.resolved_at ? ` · resolved by ${i.resolved_by_name} ${stampText(i.resolved_at)}: ${i.resolution}` : ""}</p>
                {i.state === "Open" && (data.can.edit ? <div className="mw-inline-form" style={{ marginTop: 8 }}><Field label="What was found and done"><input value={notes[i.id] ?? ""} onChange={(e) => setNotes({ ...notes, [i.id]: e.target.value })} /></Field>
                  <button type="button" className="mw-button" disabled={command.busy || !(notes[i.id] ?? "").trim()} onClick={() => void command.send(`engineering/${packageId}/materials/impacts`, { action: "resolve", reason: "Follow-up resolved by its owner", impact_id: i.id, expected_version: i.version, resolution: notes[i.id] })}>Resolve</button></div> : <Reason>The owner or an Engineering author resolves this.</Reason>)}
              </div>
              <Status tone={toneFor(i.state)}>{i.state}</Status>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SourcesPanel({ selectedId, select, changed }: { selectedId: string | null; select: (id: string | null) => void; changed: () => void }) {
  const { packageId, setId } = useMaterials(), q = new URLSearchParams({ ...(setId ? { set: setId } : {}), ...(selectedId ? { source_id: selectedId } : {}) }).toString();
  const read = useRead<Sources>(`engineering/${packageId}/materials/sources${q ? `?${q}` : ""}`), data = read.data, [publishing, setPublishing] = useState<Source | "new" | null>(null);
  const command = useMaterialsCommand(() => { read.reload(); changed(); }), s = data?.selected;
  return (
    <>
      <ReadNotice error={read.error} what="Exact sources" />
      {data && (
        <div className="em-two">
          <section className="em-panel" aria-label="Retained sources">
            <div className="em-panel-head"><h3>Retained source snapshots</h3><span className="mw-spacer" />{data.can.source && <button type="button" className="mw-button" onClick={() => setPublishing("new")}><Icon name="plus" /><span>Observe a source</span></button>}</div>
            {data.items.length ? <ul className="em-list">{data.items.map((x) => (
              <li key={x.id} data-current={x.id === selectedId || undefined}>
                <div><button type="button" className="em-list-open" onClick={() => select(x.id)} aria-current={x.id === selectedId}><strong>{x.reference} · revision {x.revision}</strong><p>{x.title}</p><p>{text(x.permitted_purpose)} · used by {x.used_by.length ? `line ${x.used_by.join(", ")}` : "no line"}</p></button></div>
                <Status tone={toneFor(x.use)}>{text(x.use)}</Status>
              </li>
            ))}</ul> : <div className="em-empty"><strong>No sources are retained for this package</strong><p>Sources arrive through the synthetic upstream adapter.</p></div>}
            <div className="em-panel-body"><Reason>{data.can.source ? "You operate the synthetic upstream adapter for this company. It stands in for source owners that have no runtime here; it is not an Engineering author's permission." : "Sources are observed through the synthetic upstream adapter, which this identity does not operate. A source's permitted purpose belongs to its owner and cannot be changed from a material or release."}</Reason></div>
          </section>
          {s ? (
            <section className="em-panel" aria-label="Source detail">
              <div className="em-panel-head"><h3>{s.reference} · revision {s.revision}</h3><Status tone={toneFor(s.use)}>{text(s.use)}</Status></div>
              <div className="em-panel-body">
                <dl className="em-facts">
                  <div><dt>Title</dt><dd>{s.title}</dd></div><div><dt>Kind</dt><dd>{kinds.find(([k]) => k === s.kind)?.[1] ?? s.kind}</dd></div>
                  <div><dt>Permitted purpose</dt><dd>{text(s.permitted_purpose)}</dd></div><div><dt>File version</dt><dd>{s.file_version}</dd></div>
                  <div><dt>Observed</dt><dd>{stampText(s.observed_at)}</dd></div><div><dt>Adapter</dt><dd>Synthetic upstream fixture</dd></div>
                </dl>
                {s.change_reason && <p className="mw-notice mw-notice-attention">{text(s.use)} on {dateText(s.changed_at)}: {s.change_reason}</p>}
                <h3>Retained bytes</h3>
                {s.content_withheld ? <Reason>This source is restricted. Its identity, purpose and hash are shown; its content is withheld for this identity.</Reason> : s.content ? <pre className="em-source-bytes">{s.content}</pre> : <Reason>The document could not be retrieved when it was observed. It is recorded as unavailable, and no positive decision can rest on it.</Reason>}
                {s.content_hash && <p className="em-hash">SHA-256 {s.content_hash}</p>}
                <CommandNotice command={command} />
                {data.can.source && s.use === "Current" && <div className="em-actions" style={{ marginTop: 12 }}>
                  <button type="button" className="mw-button" onClick={() => setPublishing(s as unknown as Source)}>Observe a new revision</button>
                  <button type="button" className="mw-button mw-button-quiet" disabled={command.busy} onClick={() => { const reason = window.prompt("Why is this source withdrawn?"); if (reason?.trim()) void command.send(`engineering/${packageId}/materials/sources`, { action: "withdraw", reason: reason.trim(), source_id: s.id }); }}>Withdraw this source</button>
                </div>}
              </div>
            </section>
          ) : <div className="em-empty"><p>Choose a source to read its retained bytes.</p></div>}
        </div>
      )}
      {publishing && <PublishSource from={publishing === "new" ? null : publishing} onClose={() => setPublishing(null)} onSaved={(id) => { read.reload(); changed(); select(id); }} />}
    </>
  );
}

function PublishSource({ from, onClose, onSaved }: { from: Source | null; onClose: () => void; onSaved: (id: string) => void }) {
  const { packageId } = useMaterials(), [id] = useState(() => crypto.randomUUID()), command = useMaterialsCommand(() => onSaved(id));
  const [f, setF] = useState({ kind: from?.kind ?? "DrawingIssue", reference: from?.reference ?? "", title: from?.title ?? "", revision: "", file_version: "1.0", purpose: from?.permitted_purpose ?? "Procurement", content: "", restricted: false, unavailable: false, reason: from ? "New revision observed upstream" : "Source observed through the synthetic upstream adapter" });
  const err = (n: string) => fieldError(command.error, n);
  return (
    <Dialog title={from ? `Observe a new revision of ${from.reference}` : "Observe a source"} subtitle="Synthetic upstream adapter. The bytes are retained and hashed on the server; the earlier revision is kept and marked superseded." wide busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "unknown"} onClick={() => void command.send(`engineering/${packageId}/materials/sources`, { action: "publish", reason: f.reason, id, kind: f.kind, reference: f.reference, title: f.title, revision: f.revision, file_version: f.file_version, permitted_purpose: f.purpose, content: f.unavailable ? null : f.content, restricted: f.restricted, supersedes_id: from?.id ?? null })}>Retain this snapshot</button></>}>
      <CommandNotice command={command} saved="Snapshot retained. Anything that relied on the earlier revision now needs reassessment, and a follow-up names its owner." />
      <div className="mw-field-row">
        <Field label="Kind" error={err("kind")}><select value={f.kind} disabled={!!from} onChange={(e) => setF({ ...f, kind: e.target.value })}>{kinds.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Reference" error={err("reference")}><input data-autofocus value={f.reference} disabled={!!from} onChange={(e) => setF({ ...f, reference: e.target.value })} /></Field>
        <div className="mw-field-short"><Field label="Revision" error={err("revision")}><input value={f.revision} onChange={(e) => setF({ ...f, revision: e.target.value })} /></Field></div>
        <div className="mw-field-short"><Field label="File version" error={err("file_version")}><input value={f.file_version} onChange={(e) => setF({ ...f, file_version: e.target.value })} /></Field></div>
      </div>
      <Field label="Title" error={err("title")}><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
      <Field label="Permitted purpose of this issue" hint="Set by the source owner's issue. Relabelling a coordination issue here would be the owner's act, not Engineering's."><select value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value as typeof f.purpose })}>{sourcePurposes.map((p) => <option key={p} value={p}>{text(p)}</option>)}</select></Field>
      <label className="mw-choice"><input type="checkbox" checked={f.unavailable} onChange={(e) => setF({ ...f, unavailable: e.target.checked })} /><span>The document could not be retrieved (record it as unavailable)</span></label>
      {!f.unavailable && <Field label="Synthetic document content" error={err("content")}><textarea value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></Field>}
      <label className="mw-choice"><input type="checkbox" checked={f.restricted} onChange={(e) => setF({ ...f, restricted: e.target.checked })} /><span>Restricted: limited viewers and receivers see its identity and hash, not its content</span></label>
      <Field label="Reason" error={err("reason")}><input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
    </Dialog>
  );
}
