"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { closureMeanings } from "../../model";
import type { VerificationQueueRow, readPeople } from "../../reads";
import { useChanges } from "./changes-shell";
import { CommandNotice, Field, Reason, Tone, ToneMark, dateText, fieldError, newId, stampText, text, useChangeCommand, useRead } from "./changes-ui";
import { DetailHead, Page, usePanelFocus, useSelect, useView, type Detail } from "./view-common";

type People = Awaited<ReturnType<typeof readPeople>>;
type QueueRow = VerificationQueueRow;
type Obligation = Detail["verification"][number];

export function VerificationView() {
  const view = useView("verification"), select = useSelect(), rows = (view.data?.queue ?? []) as unknown as QueueRow[];
  return (
    <Page view={view} label="Retest & verification" empty="Every retest obligation in this package. This is a register of obligations and their evidence, not a test engine: criteria and limits come from the approved technical basis."
      queue={
        <div className="em-table-scroll">
          <table className="em-table ec-queue">
            <caption className="mw-sr">Retest obligations of this package</caption>
            <thead><tr>{["Change", "Asset or system", "Criterion", "Configuration under test", "Verifier", "Due", "Attempts", "Result"].map((h) => <th key={h} scope="col"><span style={{ padding: "0 14px" }}>{h}</span></th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} data-current={r.change_id === view.changeId || undefined} onClick={() => select(r.change_id, { record: r.key })}>
                  <td><button type="button" className="em-row-title" onClick={() => select(r.change_id, { record: r.key })}>{r.title}</button><span className="em-cell-sub">{r.reference}</span></td>
                  <td>{r.asset_or_system}</td><td>{r.criterion}</td><td>{r.configuration}</td><td>{r.verifier_name ?? "Not assigned"}{r.mine && <span className="em-cell-sub">Yours to verify</span>}</td><td>{dateText(r.due)}</td><td>{r.attempts}</td><td><Tone view={r.state_view} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {view.data && !rows.length && <div className="em-empty"><p>No retest obligation is defined in this package.</p></div>}
        </div>
      }>
      {(d) => <Verification key={d.change.id} d={d} reload={view.reload} />}
    </Page>
  );
}

function Verification({ d, reload }: { d: Detail; reload: () => void }) {
  const record = useSearchParams().get("record"), { packageId } = useChanges(), people = useRead<People>(`engineering/${packageId}/changes/people`);
  usePanelFocus(true);
  return (
    <>
      <DetailHead d={d} />
      <section className="em-panel" aria-label="Retest obligations">
        <div className="em-panel-head"><h3>Retest obligations</h3><span className="ec-note">A finished task, a photograph or an acknowledgement is not a pass. Evidence names what was tested, in which configuration, when, and who was competent to say.</span></div>
        <div className="em-panel-body ec-stack">
          {d.verification.map((v) => <ObligationCard key={v.id} d={d} v={v} open={v.id === record} authors={people.data?.items.filter((p) => p.author) ?? []} reload={reload} />)}
          {!d.verification.length && <p className="ec-note">{d.document.categories.find((k) => k.key === "retest")?.status === "NotApplicable" ? `Not required: ${d.document.categories.find((k) => k.key === "retest")?.reason}` : "No retest obligation is defined for this change."}</p>}
        </div>
      </section>
      <AsBuilt d={d} reload={reload} />
      <Closure d={d} reload={reload} />
    </>
  );
}

function ObligationCard({ d, v, open, authors, reload }: { d: Detail; v: Obligation; open: boolean; authors: People["items"]; reload: () => void }) {
  const { packageId } = useChanges(), command = useChangeCommand(reload), failed = v.attempts.filter((a) => a.result === "Failed");
  const [result, setResult] = useState("Passed"), [testedAt, setTestedAt] = useState(""), [configuration, setConfiguration] = useState(v.configuration), [evidence, setEvidence] = useState(""), [note, setNote] = useState(""),
    [corrective, setCorrective] = useState(""), [owner, setOwner] = useState(d.change.author_id), [due, setDue] = useState("");
  const send = () => command.send(`engineering/${packageId}/changes/verification`, {
    action: "attempt", id: newId(), change_id: d.change.id, expected_version: d.change.version, retest_id: v.id, result, tested_at: new Date(testedAt).toISOString(), configuration_present: configuration, evidence_reference: evidence, note: note || null,
    ...(result === "Failed" ? { corrective_action: corrective, corrective_owner_id: owner, corrective_due: due } : {}), reason: `Retest ${result.toLowerCase()} recorded from the synthetic inspection fixture`,
  });
  return (
    <div className="ec-item" data-current={open || undefined}>
      <div className="ec-item-head"><strong>{v.asset_or_system}</strong><Tone view={v.state_view} /></div>
      <dl className="em-facts">
        <div><dt>Criterion</dt><dd>{v.criterion}</dd></div><div><dt>Exact configuration under test</dt><dd>{v.configuration}</dd></div>
        <div><dt>Approved procedure</dt><dd>{v.procedure ? `${v.procedure.reference} · ${v.procedure.revision}${v.procedure.use !== "Current" ? ` (${v.procedure.use.toLowerCase()})` : ""}` : "None linked — test basis needed"}</dd></div>
        <div><dt>Why</dt><dd>{v.reason}</dd></div><div><dt>Verifier</dt><dd>{v.verifier_name ?? "Not assigned"}</dd></div><div><dt>Due</dt><dd>{dateText(v.due)}</dd></div>
      </dl>
      {v.attempts.length > 0 && (
        // Every attempt is retained. A later pass is its own record and never edits an earlier fail.
        <ul className="em-timeline">
          {v.attempts.map((a) => (
            <li key={a.id}><strong>Attempt {a.number}</strong> · <Tone view={{ label: a.result, tone: a.result === "Passed" ? "positive" : "failure", icon: a.result === "Passed" ? "check" : "error" }} /> · tested {stampText(a.tested_at)} · recorded by {a.recorded_by_name}
              <p>Configuration present: {a.configuration_present} · evidence: {a.evidence_reference} · source: {text(a.result_source)}</p>{a.note && <p>{a.note}</p>}
              {a.corrective_action && <p>Corrective work: {a.corrective_action} — {a.corrective_owner_name}, due {dateText(a.corrective_due)}</p>}</li>
          ))}
        </ul>
      )}
      {v.state === "Failed" && <div className="ec-banner ec-banner-failure" role="note"><ToneMark icon="error" /><div><strong>Retest failed</strong><p>Closure is blocked until a later attempt passes for the exact corrected configuration. The failed attempt{failed.length > 1 ? "s stay" : " stays"} on the record.</p></div></div>}
      {v.state !== "Passed" && d.decision?.result === "Accepted" && (v.record_refusal ? <Reason>{v.record_refusal}</Reason> : (
        <div className="ec-stack">
          <div className="ec-inline">
            <Field label="Result"><select value={result} onChange={(e) => setResult(e.target.value)}><option value="Passed">Passed</option><option value="Failed">Failed</option></select></Field>
            <Field label="Tested at" error={fieldError(command.error, "tested_at")}><input type="datetime-local" value={testedAt} onChange={(e) => setTestedAt(e.target.value)} /></Field>
            <Field label="Configuration present at the test" hint="A pass binds to the exact configuration the obligation names" error={fieldError(command.error, "configuration_present")}><input value={configuration} onChange={(e) => setConfiguration(e.target.value)} /></Field>
            <Field label="Evidence reference" error={fieldError(command.error, "evidence_reference")}><input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Inspection sheet or record reference" /></Field>
          </div>
          {result === "Failed" && (
            <div className="ec-inline">
              <Field label="Corrective work" error={fieldError(command.error, "corrective_action")}><input value={corrective} onChange={(e) => setCorrective(e.target.value)} /></Field>
              <Field label="Owned by"><select value={owner} onChange={(e) => setOwner(e.target.value)}>{authors.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
              <Field label="Due"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
            </div>
          )}
          <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <CommandNotice command={command} saved="Attempt recorded on the server." />
          <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={command.busy || !testedAt || !evidence.trim() || (result === "Failed" && (!corrective.trim() || !due))} onClick={() => void send()}>Record test attempt</button></div>
        </div>
      ))}
    </div>
  );
}

function AsBuilt({ d, reload }: { d: Detail; reload: () => void }) {
  const { packageId, frame } = useChanges(), command = useChangeCommand(reload), [required, setRequired] = useState(d.change.as_built_required), [reference, setReference] = useState(d.change.as_built_reference ?? "");
  const may = frame?.can.edit || frame?.can.verify;
  if (d.change.stage === "Closed") return null;
  return (
    <section className="em-panel" aria-label="Installed and as-built evidence"><div className="em-panel-head"><h3>Installed and as-built evidence</h3><span className="ec-note">EN-08 owns commissioning and as-built release. This records only whether its receiving reference is required, and what it is.</span></div>
      <div className="em-panel-body ec-stack">
        {!may ? <Reason>Recording the as-built reference belongs to an Engineering author or the verifier.</Reason> : (
          <>
            <div className="ec-inline">
              <label className="mw-field mw-field-inline"><input type="checkbox" checked={required} onChange={(e) => { setRequired(e.target.checked); if (!e.target.checked) setReference(""); }} /><span>Installed or as-built evidence is required before closure</span></label>
              <Field label="EN-08 receiving reference" error={fieldError(command.error, "as_built_reference")}><input value={reference} onChange={(e) => setReference(e.target.value)} disabled={!required} /></Field>
            </div>
            <CommandNotice command={command} saved="Recorded on the server." />
            <div className="em-actions"><button type="button" className="mw-button" disabled={command.busy || (required === d.change.as_built_required && reference === (d.change.as_built_reference ?? ""))} onClick={() => void command.send(`engineering/${packageId}/changes/verification`, { action: "as_built", change_id: d.change.id, expected_version: d.change.version, as_built_required: required, as_built_reference: reference || null, reason: "As-built evidence requirement recorded" })}>Save</button></div>
          </>
        )}
      </div>
    </section>
  );
}

function Closure({ d, reload }: { d: Detail; reload: () => void }) {
  const { packageId } = useChanges(), command = useChangeCommand(reload), [meaning, setMeaning] = useState<(typeof closureMeanings)[number]>(d.decision?.result === "Accepted" && d.change.stage !== "Withdrawn" ? "Implemented" : "NoImplementation"), [reason, setReason] = useState("");
  const stops = d.closure_readiness[meaning];
  if (d.closure)
    return (
      <section className="em-panel" aria-label="Closure" id="ec-panel-closure" tabIndex={-1}><div className="em-panel-head"><h3>Closed: {text(d.closure.meaning).toLowerCase()}</h3></div>
        <div className="em-panel-body ec-stack"><p>{d.closure.reason}</p><p className="ec-note">Closed by {d.closure.closed_by_name} on {stampText(d.closure.closed_at)} under policy version {d.closure.policy_version}. The closure basis is retained under hash <span className="em-hash">{d.closure.basis_hash}</span>. Later evidence is handled through a linked successor change; this record is never reopened.</p></div>
      </section>
    );
  return (
    <section className="em-panel" aria-label="Closure readiness" id="ec-panel-closure" tabIndex={-1}><div className="em-panel-head"><h3>Closure readiness</h3><span className="ec-note">Checked against the whole declared change: every request, release, retest and acknowledgement, whatever a list happens to show.</span></div>
      <div className="em-panel-body ec-stack">
        <Field label="Close as"><select value={meaning} onChange={(e) => setMeaning(e.target.value as typeof meaning)}>{closureMeanings.map((m) => <option key={m} value={m}>{m === "Implemented" ? "Implemented: the accepted change is in place and verified" : "No implementation: rejected or withdrawn"}</option>)}</select></Field>
        {stops.length > 0 ? <ul className="em-blockers" aria-label="What stops closure">{stops.map((s) => <li key={s}>{s}</li>)}</ul> : <p><Tone view={{ label: "Nothing stops this closure", tone: "positive", icon: "check" }} /></p>}
        {d.closure_readiness.refusal ? <Reason>{d.closure_readiness.refusal}</Reason> : (
          <>
            <Field label="Closure basis and reason" error={fieldError(command.error, "reason")}><textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} /></Field>
            <CommandNotice command={command} saved="Change closed on the server." />
            <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={command.busy || stops.length > 0 || !reason.trim()} onClick={() => void command.send(`engineering/${packageId}/changes/verification`, { action: "close", id: newId(), change_id: d.change.id, expected_version: d.change.version, meaning, reason })}>{meaning === "Implemented" ? "Close as implemented" : "Close with no implementation"}</button></div>
          </>
        )}
      </div>
    </section>
  );
}
