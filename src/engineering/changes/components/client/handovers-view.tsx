"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { destinations, receivingPresentation, requestPurposes } from "../../model";
import type { HandoversQueueRow, readPeople, readPreview } from "../../reads";
import { useChanges } from "./changes-shell";
import { CommandNotice, Field, Icon, Reason, Tone, ToneMark, api, dateText, fieldError, newId, shortDate, stampText, text, useChangeCommand, useRead } from "./changes-ui";
import { DetailHead, Page, usePanelFocus, useSelect, useView, type Detail, type View } from "./view-common";

type People = Awaited<ReturnType<typeof readPeople>>;
type Preview = Awaited<ReturnType<typeof readPreview>>;
type QueueRow = HandoversQueueRow;
type Request = Detail["requests"][number];
type Proposed = { id: string; purpose: string; destination: string; owner_id: string; requested_action: string; due: string; amends_id: string | null };

export function HandoversView() {
  const view = useView("handovers"), select = useSelect(), rows = (view.data?.queue ?? []) as unknown as QueueRow[];
  return (
    <Page view={view} label="Actions & handovers" empty="Every request to a source owner in this package, and every nontechnical prerequisite. Choose one to see its exact payload and its receiver's own outcome."
      queue={
        <div className="em-table-scroll">
          <table className="em-table ec-queue">
            <caption className="mw-sr">Requests and prerequisites of this package</caption>
            <thead><tr>{["Change", "Request", "Destination", "Owner", "Due", "Outcome"].map((h) => <th key={h} scope="col"><span style={{ padding: "0 14px" }}>{h}</span></th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} data-current={r.change_id === view.changeId || undefined} onClick={() => select(r.change_id, { record: r.key })}>
                  <td><button type="button" className="em-row-title" onClick={() => select(r.change_id, { record: r.key })}>{r.title}</button><span className="em-cell-sub">{r.reference}</span></td>
                  <td>{r.what}</td><td>{r.destination}</td><td>{r.owner_name ?? "Unassigned"}{r.mine && <span className="em-cell-sub">Yours to answer</span>}</td><td>{shortDate(r.due)}</td><td><Tone view={r.state_view} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {view.data && !rows.length && <div className="em-empty"><p>No request or prerequisite exists in this package yet.</p></div>}
        </div>
      }>
      {(d) => <Handovers key={d.change.id} d={d} view={view.data!} reload={view.reload} />}
    </Page>
  );
}

function Handovers({ d, view, reload }: { d: Detail; view: View; reload: () => void }) {
  const record = useSearchParams().get("record"), { packageId } = useChanges(), people = useRead<People>(`engineering/${packageId}/changes/people`), authors = people.data?.items.filter((p) => p.author) ?? [];
  usePanelFocus(true);
  const blocked = d.request_blockers.Implementation;
  return (
    <>
      <DetailHead d={d} />
      {d.decision?.result === "Accepted" && blocked.length > 0 && !d.requests.some((r) => r.purpose === "Implementation" && r.state !== "Cancelled") && (
        <div className="ec-banner" role="note"><ToneMark icon="warning" /><div><strong>Technical decision recorded · Implementation not authorised</strong><ul className="em-reasons">{blocked.map((b) => <li key={b}>{b}</li>)}</ul>
          <p>Investigation and release-preparation requests can still be raised. Neither can be relabelled as an instruction to implement.</p></div></div>
      )}
      {d.prerequisites.length > 0 && (
        <section className="em-panel" aria-label="Commercial and scheduling prerequisites" id="ec-panel-commercial" tabIndex={-1}>
          <div className="em-panel-head"><h3>Commercial and scheduling review</h3><span className="ec-note">An in-module synthetic prerequisite. Its outcome is a fictional answer for this prototype, never an actual Project, Finance or booking approval.</span></div>
          <div className="em-panel-body ec-stack" id="ec-panel-scheduling" tabIndex={-1}>{d.prerequisites.map((x) => <Prerequisite key={x.id} d={d} x={x} view={view} reload={reload} />)}</div>
        </section>
      )}
      <section className="em-panel" aria-label="Requests">
        <div className="em-panel-head"><h3>Requests to source owners</h3><span className="ec-note">Generated, submitted, accepted, distributed and acknowledged are separate facts. Each receiver answers only for their own destination.</span></div>
        <div className="em-panel-body ec-stack">
          {d.requests.map((r) => <RequestCard key={r.id} d={d} r={r} open={r.id === record} authors={authors} reload={reload} />)}
          {!d.requests.length && <p className="ec-note">No request has been created for this change.</p>}
        </div>
      </section>
      {d.refusals.edit === null && d.change.stage !== "Closed" && d.change.stage !== "Withdrawn" && <Builder d={d} reload={reload} />}
    </>
  );
}

function Prerequisite({ d, x, view, reload }: { d: Detail; x: Detail["prerequisites"][number]; view: View; reload: () => void }) {
  const { packageId } = useChanges(), command = useChangeCommand(reload), [outcome, setOutcome] = useState("Confirmed"), [note, setNote] = useState(""), [evidence, setEvidence] = useState("");
  const evidenceSources = view.sources.filter((s) => s.kind === "CommercialDecision" && s.use === "Current");
  return (
    <div className="ec-item">
      <div className="ec-item-head"><strong>{x.kind} review</strong>
        {x.applicability === "NotApplicable" ? <Tone view={{ label: "Not applicable", tone: "neutral", icon: "dot" }} /> : x.state === "Open" ? <Tone view={{ label: x.applicability === "Unknown" ? "Applicability unknown" : "Open", tone: "caution", icon: "warning" }} /> : <Tone view={{ label: x.state, tone: x.state === "Confirmed" ? "positive" : "caution", icon: x.state === "Confirmed" ? "check" : "warning" }} />}</div>
      <p>{x.applicability_reason}</p>
      <p className="ec-note">Owner: {x.owner_name ?? "nobody named"} · due {dateText(x.due)} · authority: synthetic prerequisite fixture</p>
      {x.state !== "Open" && <p>{x.outcome_note} <span className="ec-note">— {x.resolved_by_name}, {stampText(x.resolved_at)} · operation {x.outcome_operation_id}</span></p>}
      {d.costs.withheld === false && x.kind === "Commercial" && d.costs.groups.length + d.costs.unknown.length > 0 && (
        <p className="ec-note">{d.costs.groups.map((g) => `Known ${g.kind.toLowerCase()} impact ${g.currency} ${g.known} ${g.tax_basis === "ExTax" ? "excluding" : "including"} tax`).join("; ")}{d.costs.unknown.length ? `. Unknown, not zero: ${d.costs.unknown.join(", ")}.` : "."}</p>
      )}
      {x.state === "Open" && x.applicability !== "NotApplicable" && (x.refusal ? (
        // Someone who cannot resolve it reads it, is told whose it is, and has an owned way to ask.
        <Reason>{x.refusal} An information request to Projects, below, is the owned way to ask for it.</Reason>
      ) : (
        <>
          <div className="ec-inline">
            <Field label="Outcome"><select value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="Confirmed">Confirmed: implementation may proceed on this point</option><option value="Declined">Declined: implementation may not proceed on this point</option></select></Field>
            <Field label="Commercial decision evidence (optional)"><select value={evidence} onChange={(e) => setEvidence(e.target.value)}><option value="">None retained</option>{evidenceSources.map((s) => <option key={s.id} value={s.id}>{s.reference} · {s.revision}</option>)}</select></Field>
          </div>
          <Field label="What was decided, and on what basis" error={fieldError(command.error, "note")}><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} /></Field>
          <CommandNotice command={command} saved="Outcome recorded on the server." />
          <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={command.busy || !note.trim()} onClick={() => void command.send(`engineering/${packageId}/changes/prerequisites`, { action: "resolve", change_id: d.change.id, prerequisite_id: x.id, expected_version: x.version, outcome, note, evidence_source_id: evidence || null, reason: `${x.kind} review recorded` })}>Record {x.kind.toLowerCase()} outcome</button></div>
        </>
      ))}
    </div>
  );
}

function RequestCard({ d, r, open, authors, reload }: { d: Detail; r: Request; open: boolean; authors: People["items"]; reload: () => void }) {
  const { packageId } = useChanges(), path = `engineering/${packageId}/changes/handovers`, command = useChangeCommand(reload), last = r.submissions.at(-1)!;
  const [outcome, setOutcome] = useState("Accepted"), [reason, setReason] = useState(""), [owner, setOwner] = useState(d.change.author_id), [due, setDue] = useState(""), [note, setNote] = useState(""), [cancelReason, setCancelReason] = useState(""), [show, setShow] = useState(open);
  const resubmit = async () => {
    // The corrected submission is previewed by the server first, and sent only with the hash of exactly that preview.
    const proposed = [{ id: r.id, purpose: r.purpose, destination: r.destination, owner_id: r.owner_id, requested_action: r.requested_action, due: r.due, ...(r.amends_id ? { amends_id: r.amends_id } : {}) }];
    const preview = await api<Preview>(`engineering/${packageId}/changes/handovers/preview?change=${d.change.id}&requests=${encodeURIComponent(JSON.stringify(proposed))}`);
    await command.send(path, { action: "resubmit", change_id: d.change.id, handover_id: r.id, expected_version: r.version, id: newId(), preview_hash: preview.preview_hash, correction_note: note, reason: "Corrected submission of a returned request" });
  };
  return (
    <div className="ec-item" id={`ec-request-${r.id}`} data-current={open || undefined}>
      <div className="ec-item-head"><strong>{text(r.purpose)} → {text(r.destination)}</strong><Tone view={r.state_view} /></div>
      <p>{r.requested_action}</p>
      <p className="ec-note">Owner: {r.owner_name} · due {dateText(r.due)} · created by {r.created_by_name}, {stampText(r.created_at)}{r.stale ? " · sent on an earlier revision of the proposal" : ""}{r.amends_id ? " · amends an accepted request" : ""}</p>
      {r.cancelled_reason && <p>Cancelled: {r.cancelled_reason}</p>}
      {r.acknowledgement_required && <p><Tone view={r.acknowledged_at ? { label: `Withdrawal acknowledged ${stampText(r.acknowledged_at)}`, tone: "neutral", icon: "dot" } : { label: "Acknowledgement of the withdrawal is required", tone: "caution", icon: "warning" }} wrap /></p>}
      <ul className="em-timeline">
        {r.submissions.map((s) => (
          <li key={s.id}><strong>Submission {s.number}</strong> · {s.submitted_by_name}, {stampText(s.submitted_at)} · <span className="em-hash">{s.payload_hash.slice(0, 16)}…</span>
            <p>{s.outcome ? <><Tone view={receivingPresentation[s.outcome]} /> by {s.outcome_by_name}, {stampText(s.outcome_at)}: {s.outcome_reason}{s.return_owner_name && ` Correction owned by ${s.return_owner_name}, due ${dateText(s.return_due)}.`}</> : "No outcome recorded yet."}</p>
            {s.outcome_operation_id && <p className="em-hash">Original operation {s.outcome_operation_id}</p>}</li>
        ))}
      </ul>
      <div className="em-actions"><button type="button" className="mw-button mw-button-quiet" aria-expanded={show} onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Show"} exact payload</button></div>
      {show && (last.payload ? <pre className="ec-payload" tabIndex={0} aria-label="Exact submitted payload">{JSON.stringify(last.payload, null, 2)}</pre> : <Reason>The exact payload is shown to the people who prepared it and to the receiver it names.</Reason>)}

      {r.state === "Pending" && (r.decide_refusal ? <Reason>{r.decide_refusal}</Reason> : (
        <div className="ec-stack">
          <div className="ec-inline">
            <Field label="Your outcome for this exact payload"><select value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="Accepted">Accept</option><option value="Returned">Return for correction</option><option value="Declined">Decline</option></select></Field>
            {outcome === "Returned" && <><Field label="Who corrects it" error={fieldError(command.error, "owner_id")}><select value={owner} onChange={(e) => setOwner(e.target.value)}>{authors.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="By when"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field></>}
          </div>
          <Field label="Reason and evidence" error={fieldError(command.error, "outcome_reason")}><textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} /></Field>
          <p className="ec-note">Accepting records that this exact payload was received. It proves no physical work and changes no order, stock, booking or asset record.</p>
          <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={command.busy || !reason.trim() || (outcome === "Returned" && !due)} onClick={() => void command.send(path, { action: "decide", change_id: d.change.id, handover_id: r.id, submission_id: r.latest_submission_id, expected_version: r.version, outcome, outcome_reason: reason, owner_id: outcome === "Returned" ? owner : null, due: outcome === "Returned" ? due : null, reason: `Receiving outcome: ${outcome.toLowerCase()}` })}>Record receiving outcome</button></div>
        </div>
      ))}
      {r.state === "Returned" && d.refusals.edit === null && (
        <div className="ec-stack">
          <Field label="What was corrected" hint="The request keeps its identity. The returned payload stays exactly as it was judged; the receiver assesses the new one."><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} /></Field>
          <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={command.busy || !note.trim()} onClick={() => void resubmit()}>Submit corrected payload</button></div>
        </div>
      )}
      {["Pending", "Returned"].includes(r.state) && d.refusals.edit === null && (
        <div className="ec-inline"><Field label="Cancel this request, with its reason"><input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Why it is no longer needed" /></Field>
          <button type="button" className="mw-button" disabled={command.busy || !cancelReason.trim()} onClick={() => void command.send(path, { action: "cancel", change_id: d.change.id, handover_id: r.id, expected_version: r.version, reason: cancelReason })}>Cancel request</button></div>
      )}
      {r.acknowledgement_required && !r.acknowledged_at && !r.decide_refusal && <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={command.busy} onClick={() => void command.send(path, { action: "acknowledge", change_id: d.change.id, handover_id: r.id, expected_version: r.version, reason: "Withdrawal acknowledged by the receiving owner" })}>Acknowledge the withdrawal</button></div>}
      <CommandNotice command={command} saved="Recorded on the server." />
    </div>
  );
}

function Builder({ d, reload }: { d: Detail; reload: () => void }) {
  const { packageId } = useChanges(), people = useRead<People>(`engineering/${packageId}/changes/people`);
  const [rows, setRows] = useState<Proposed[]>([]), [preview, setPreview] = useState<Preview | null>(null), [failure, setFailure] = useState<string | null>(null), [fault, setFault] = useState(false);
  const command = useChangeCommand(() => { setRows([]); setPreview(null); reload(); });
  const receivers = (destination: string) => people.data?.items.filter((p) => p.receiver_for.includes(destination as never)) ?? [];
  const add = (purpose: string, destination: string) => { setPreview(null); setRows([...rows, { id: newId(), purpose, destination, owner_id: receivers(destination)[0]?.id ?? "", requested_action: "", due: "", amends_id: null }]); };
  const patch = (i: number, p: Partial<Proposed>) => { setPreview(null); setRows(rows.map((r, n) => (n === i ? { ...r, ...p, ...(p.destination ? { owner_id: receivers(p.destination)[0]?.id ?? "" } : {}) } : r))); };
  const body = () => rows.map(({ amends_id, due, ...r }) => ({ ...r, due: due || null, ...(amends_id ? { amends_id } : {}) }));
  const make = async () => {
    setFailure(null);
    try { setPreview(await api<Preview>(`engineering/${packageId}/changes/handovers/preview?change=${d.change.id}&requests=${encodeURIComponent(JSON.stringify(body()))}`)); }
    catch (e) { setFailure((e as { message?: string }).message ?? "The preview could not be made."); }
  };
  const accepted = d.requests.filter((r) => r.state === "Accepted");
  return (
    <section className="em-panel" aria-label="Prepare requests">
      <div className="em-panel-head"><h3>Prepare requests</h3>
        <button type="button" className="mw-button" onClick={() => add("ImpactReview", "SupplyChain")}><Icon name="plus" /><span>Review request</span></button>
        <button type="button" className="mw-button" onClick={() => add("PrepareRevisedRelease", "TechnicalRelease")}><Icon name="plus" /><span>Revised release request</span></button>
        <button type="button" className="mw-button" onClick={() => add("Implementation", "Service")}><Icon name="plus" /><span>Implementation handover</span></button></div>
      <div className="em-panel-body ec-stack">
        {!rows.length && <p className="ec-note">Add the requests this change needs. The server derives each exact payload; you review that preview before anything is created.</p>}
        {rows.map((r, i) => (
          <div key={r.id} className="ec-item">
            <div className="ec-inline">
              <Field label="Purpose"><select value={r.purpose} onChange={(e) => patch(i, { purpose: e.target.value, amends_id: e.target.value === "Amendment" ? accepted[0]?.id ?? null : null })}>{requestPurposes.filter((p) => p !== "Amendment" || accepted.length > 0).map((p) => <option key={p} value={p}>{text(p)}</option>)}</select></Field>
              <Field label="Destination"><select value={r.destination} onChange={(e) => patch(i, { destination: e.target.value })}>{destinations.map((x) => <option key={x} value={x}>{text(x)}</option>)}</select></Field>
              <Field label="Receiving owner" error={fieldError(command.error, `requests-${i}`)}><select value={r.owner_id} onChange={(e) => patch(i, { owner_id: e.target.value })}><option value="">{receivers(r.destination).length ? "Choose…" : "The policy names no receiver here"}</option>{receivers(r.destination).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
              <Field label="Due"><input type="date" value={r.due} onChange={(e) => patch(i, { due: e.target.value })} /></Field>
              <button type="button" className="mw-button mw-button-quiet" onClick={() => { setPreview(null); setRows(rows.filter((_, n) => n !== i)); }}>Remove</button>
            </div>
            {r.purpose === "Amendment" && <Field label="Accepted request it amends"><select value={r.amends_id ?? ""} onChange={(e) => patch(i, { amends_id: e.target.value })}>{accepted.map((a) => <option key={a.id} value={a.id}>{text(a.purpose)} → {text(a.destination)}</option>)}</select></Field>}
            <Field label="Requested action"><input value={r.requested_action} onChange={(e) => patch(i, { requested_action: e.target.value })} maxLength={600} /></Field>
          </div>
        ))}
        {failure && <div className="mw-notice em-notice-error" role="alert"><strong>No preview</strong><p>{failure}</p></div>}
        {rows.length > 0 && !preview && <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={rows.some((r) => !r.owner_id || !r.requested_action.trim())} onClick={() => void make()}>Preview exact requests</button></div>}
        {preview && (
          <div className="ec-stack" aria-label="Exact preview">
            {preview.requests.map((r) => (
              <div key={r.id} className="ec-item">
                <div className="ec-item-head"><strong>{text(r.purpose)} → {text(r.destination)}</strong><span className="em-hash">{r.payload_hash.slice(0, 16)}…</span></div>
                <p>{r.effect}</p>
                <p className="ec-note">Bound to revision {r.payload.change.revision_number} ({r.payload.change.revision_hash.slice(0, 12)}…) · {r.payload.scope.length} included object{r.payload.scope.length === 1 ? "" : "s"} · {r.payload.exclusions.length} exclusion{r.payload.exclusions.length === 1 ? "" : "s"} · {r.payload.sources.length} exact source{r.payload.sources.length === 1 ? "" : "s"}</p>
                {r.blockers.length > 0 && <ul className="em-blockers">{r.blockers.map((b) => <li key={b}>{b}</li>)}</ul>}
              </div>
            ))}
            {preview.existing.length > 0 && <p className="ec-note">Already existing for this change: {preview.existing.map((x) => `${text(x.purpose)} → ${text(x.destination)} (${x.state.toLowerCase()})`).join("; ")}. Correct or reuse one of these and do not duplicate it.</p>}
            <div><strong>Still outstanding after this</strong><ul className="em-reasons">{preview.outstanding.map((o) => <li key={o}>{o}</li>)}</ul></div>
            <CommandNotice command={command} saved="Requests created on the server." />
            <div className="em-actions">
              {/* Named for its effect and its real count. Confirmation applies exactly this preview, or nothing. */}
              <button type="button" className="mw-button mw-button-primary" disabled={command.busy || preview.blocked} onClick={() => void command.send(`engineering/${packageId}/changes/handovers`, { action: "confirm", change_id: d.change.id, expected_version: preview.change_version, preview_hash: preview.preview_hash, requests: body(), reason: preview.confirm_label }, { discardReply: fault })}>{preview.confirm_label}</button>
              <button type="button" className="mw-button" onClick={() => void make()} disabled={command.busy}>Refresh preview</button>
              {preview.blocked && <Reason>A blocked request cannot be created. Remove it, or resolve what stops it.</Reason>}
            </div>
            <details><summary className="ec-note">Demonstration control</summary><label className="mw-field mw-field-inline"><input type="checkbox" checked={fault} onChange={(e) => setFault(e.target.checked)} /><span>Synthetic fault: the command runs on the server and its reply is discarded, to exercise recovery of the original outcome</span></label></details>
          </div>
        )}
      </div>
    </section>
  );
}
