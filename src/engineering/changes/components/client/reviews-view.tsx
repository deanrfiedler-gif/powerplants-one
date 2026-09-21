"use client";
import { useState } from "react";
import { attentionPresentation, decisionPresentation, decisionPurposes, returnKinds, stagePresentation } from "../../model";
import type { ReviewsQueueRow, readPeople } from "../../reads";
import { useChanges } from "./changes-shell";
import { CommandNotice, Field, Reason, Tone, ToneMark, fieldError, newId, stampText, text, useChangeCommand, useRead } from "./changes-ui";
import { DetailHead, Page, useSelect, useView, type Detail } from "./view-common";

type People = Awaited<ReturnType<typeof readPeople>>;
type QueueRow = ReviewsQueueRow;
const resultView = (result: string | null) => (result === null ? { label: "Awaiting response", tone: "neutral", icon: "dot" } as const : result === "NoBlockingFinding" ? { label: "No blocking finding", tone: "positive", icon: "check" } as const
  : result === "BlockingFinding" ? { label: "Blocking finding", tone: "caution", icon: "warning" } as const : { label: "Returned for clarification", tone: "caution", icon: "warning" } as const);

export function ReviewsView() {
  const view = useView("reviews"), select = useSelect(), rows = (view.data?.queue ?? []) as unknown as QueueRow[];
  return (
    <Page view={view} label="Review & decisions" empty="Changes in review, and changes whose technical decision is recorded. A discipline review and the technical decision are separate duties, held by people independent of the author."
      queue={
        <div className="em-table-scroll">
          <table className="em-table ec-queue">
            <caption className="mw-sr">Changes in review or decided in this package</caption>
            <thead><tr>{["Change", "Review state", "Discipline reviews", "Technical decision", "Attention"].map((h) => <th key={h} scope="col"><span style={{ padding: "0 14px" }}>{h}</span></th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} data-current={r.id === view.changeId || undefined} onClick={() => select(r.id)}>
                  <td><button type="button" className="em-row-title" onClick={() => select(r.id)}>{r.title}</button><span className="em-cell-sub">{r.reference} · {r.discipline}</span></td>
                  <td><Tone view={stagePresentation[r.stage]} /></td>
                  <td>{r.reviews.length ? r.reviews.map((x) => `${x.discipline}: ${x.result ? text(x.result) : `awaiting ${x.reviewer_name}`}${x.mine && !x.result ? " (yours)" : ""}`).join("; ") : "None assigned"}</td>
                  <td><Tone view={decisionPresentation(r.decision)} /></td><td><Tone view={attentionPresentation[r.attention]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {view.data && !rows.length && <div className="em-empty"><p>Nothing in this package is in review or decided.</p></div>}
        </div>
      }>
      {(d) => <Reviews key={d.change.id} d={d} reload={view.reload} />}
    </Page>
  );
}

function Reviews({ d, reload }: { d: Detail; reload: () => void }) {
  const { packageId } = useChanges(), path = `engineering/${packageId}/changes/reviews`, inReview = d.change.stage === "InReview";
  const mine = d.reviews.find((r) => r.id === d.my_review_id), waiting = d.reviews.filter((r) => r.required && r.result !== "NoBlockingFinding");
  return (
    <>
      <DetailHead d={d} />
      {d.decision && d.decision.applicability !== "Current" && (
        <div className="ec-banner" role="note"><ToneMark icon="warning" /><div><strong>{text(d.decision.applicability)}</strong><p>{d.source_condition.reasons.join(" ")} The decision below is retained exactly as it was made. It cannot support a new handover until a successor revision is assessed against the current sources.</p></div></div>
      )}
      <section className="em-panel" aria-label="Discipline reviews">
        <div className="em-panel-head"><h3>Discipline reviews of revision {d.revision.number}</h3><span className="ec-note">Each response binds the exact submitted content{d.revision.submitted_hash ? ` (${d.revision.submitted_hash.slice(0, 12)}…)` : ""} and is given once.</span></div>
        <ul className="em-list">
          {d.reviews.map((r) => (
            <li key={r.id}><div><strong>{r.discipline} · {r.reviewer_name}{r.required ? "" : " (optional)"}</strong><p><Tone view={resultView(r.result)} />{r.responded_at && ` · ${stampText(r.responded_at)} · policy version ${r.policy_version}`}</p>
              {r.findings && <p>{r.findings}</p>}{!r.on_current_content && <p>Given on different content: it does not count for this revision.</p>}</div></li>
          ))}
        </ul>
        {!d.reviews.length && <div className="em-empty"><p>{d.revision.state === "Working" ? "Reviewers are named when the proposal is submitted." : "No review is assigned to this revision."}</p></div>}
        {d.earlier_reviews.length > 0 && <div className="em-panel-body"><p className="ec-note">Retained from earlier revisions: {d.earlier_reviews.map((r) => `${r.discipline} · ${r.reviewer_name} · ${r.result ? text(r.result) : "no response"}`).join("  |  ")}</p></div>}
      </section>
      {inReview && mine && <Respond d={d} reviewId={mine.id} version={mine.version} path={path} reload={reload} />}
      {inReview && !mine && d.refusals.respond && d.reviews.some((r) => !r.result) && <Reason>{d.refusals.respond}</Reason>}

      {d.decision ? (
        <section className="em-panel" aria-label="Technical decision">
          <div className="em-panel-head"><h3>Technical decision</h3><Tone view={decisionPresentation(d.decision.result)} /></div>
          <div className="em-panel-body ec-stack">
            <dl className="em-facts">
              <div><dt>Decided by</dt><dd>{d.decision.decided_by_name}</dd></div><div><dt>When</dt><dd>{stampText(d.decision.decided_at)}</dd></div>
              <div><dt>For</dt><dd>{text(d.decision.purpose)}</dd></div><div><dt>Policy version</dt><dd>{d.decision.policy_version}</dd></div>
              <div><dt>Exact content</dt><dd className="em-hash">{d.decision.revision_hash}</dd></div><div><dt>Original operation</dt><dd className="em-hash">{d.decision.operation_id}</dd></div>
            </dl>
            <p>{d.decision.reason}</p>
            <p className="ec-note">A bounded engineering decision. It issues no drawing, releases no material, approves no cost, amends no purchase, instructs no site work, moves no booking and accepts no commissioning.</p>
          </div>
        </section>
      ) : inReview ? <Decide d={d} path={path} reload={reload} waiting={waiting.length} /> : null}
      {d.overlaps.some((o) => o.blocks_handover) && <Overlap d={d} path={path} reload={reload} />}
    </>
  );
}

function Respond({ d, reviewId, version, path, reload }: { d: Detail; reviewId: string; version: number; path: string; reload: () => void }) {
  const command = useChangeCommand(reload), [result, setResult] = useState("NoBlockingFinding"), [findings, setFindings] = useState("");
  return (
    <section className="em-panel" aria-label="Your review"><div className="em-panel-head"><h3>Your discipline review</h3></div>
      <div className="em-panel-body ec-stack">
        {d.refusals.respond ? <Reason>{d.refusals.respond}</Reason> : (
          <>
            <Field label="Result"><select value={result} onChange={(e) => setResult(e.target.value)}><option value="NoBlockingFinding">No blocking finding</option><option value="BlockingFinding">Blocking finding</option><option value="ReturnForClarification">Return for clarification</option></select></Field>
            <Field label="Findings and the evidence considered" error={fieldError(command.error, "findings")}><textarea value={findings} onChange={(e) => setFindings(e.target.value)} maxLength={4000} /></Field>
            <CommandNotice command={command} saved="Review response recorded on the server." />
            <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={command.busy || !findings.trim()} onClick={() => void command.send(path, { action: "respond", change_id: d.change.id, review_id: reviewId, expected_version: version, result, findings, reason: "Independent discipline review" })}>Record review response</button></div>
          </>
        )}
      </div>
    </section>
  );
}

function Decide({ d, path, reload, waiting }: { d: Detail; path: string; reload: () => void; waiting: number }) {
  const { packageId } = useChanges(), people = useRead<People>(`engineering/${packageId}/changes/people`), command = useChangeCommand(reload);
  const [mode, setMode] = useState<"Accepted" | "Rejected" | "Return">("Accepted"), [purpose, setPurpose] = useState("Procurement"), [reason, setReason] = useState(""), [kind, setKind] = useState("ScopeClarification"), [owner, setOwner] = useState(d.change.author_id), [due, setDue] = useState("");
  // Why a positive decision cannot be recorded yet, beside the action. The server applies the same rule again.
  const stops = [...(waiting ? [`${waiting} required review${waiting === 1 ? " has" : "s have"} no response without a blocking finding.`] : []), ...(d.source_condition.condition === "Current" ? [] : [`${d.source_condition.view.label}: a positive decision rests on current, readable required sources.`])];
  const send = () => mode === "Return"
    ? command.send(path, { action: "return", change_id: d.change.id, revision_id: d.revision.id, expected_version: d.change.version, return_kind: kind, decision_reason: reason, owner_id: owner, due, reason: "Proposal returned for correction" })
    : command.send(path, { action: "decide", change_id: d.change.id, revision_id: d.revision.id, expected_version: d.change.version, id: newId(), result: mode, purpose, decision_reason: reason, reason: `Technical decision: ${mode.toLowerCase()}` });
  return (
    <section className="em-panel" aria-label="Technical decision"><div className="em-panel-head"><h3>Record the technical decision</h3><span className="ec-note">Accept or reject the technical change, or return it for correction. A return is not a rejection.</span></div>
      <div className="em-panel-body ec-stack">
        {d.refusals.decide ? <Reason>{d.refusals.decide}</Reason> : (
          <>
            <div className="ec-inline">
              <Field label="Decision"><select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}><option value="Accepted">Accept technical change</option><option value="Rejected">Reject technical change</option><option value="Return">Return for correction</option></select></Field>
              {mode === "Return" ? (
                <>
                  <Field label="What is needed"><select value={kind} onChange={(e) => setKind(e.target.value)}>{returnKinds.map((k) => <option key={k} value={k}>{text(k)}</option>)}</select></Field>
                  <Field label="Who corrects it" error={fieldError(command.error, "owner_id")}><select value={owner} onChange={(e) => setOwner(e.target.value)}>{people.data?.items.filter((p) => p.author).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
                  <Field label="By when" error={fieldError(command.error, "due")}><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
                </>
              ) : <Field label="Accepted or rejected for" hint="Coordination only can never support procurement or installation"><select value={purpose} onChange={(e) => setPurpose(e.target.value)}>{decisionPurposes.map((p) => <option key={p} value={p}>{text(p)}</option>)}</select></Field>}
            </div>
            <Field label="Reasons and the evidence considered" error={fieldError(command.error, "decision_reason")}><textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={4000} /></Field>
            {mode === "Accepted" && stops.length > 0 && <ul className="em-blockers">{stops.map((s) => <li key={s}>{s}</li>)}</ul>}
            <CommandNotice command={command} saved="Recorded on the server." />
            <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={command.busy || !reason.trim() || (mode === "Accepted" && stops.length > 0) || (mode === "Return" && !due)} onClick={() => void send()}>
              {mode === "Accepted" ? "Accept technical change" : mode === "Rejected" ? "Reject technical change" : "Return for correction"}</button>
              {mode === "Accepted" && <span className="ec-note">Acceptance raises the commercial and scheduling prerequisites as separate owned records. Implementation is not authorised by it.</span>}</div>
          </>
        )}
      </div>
    </section>
  );
}

function Overlap({ d, path, reload }: { d: Detail; path: string; reload: () => void }) {
  const command = useChangeCommand(reload), open = d.overlaps.filter((o) => o.blocks_handover && !o.restricted), [other, setOther] = useState(open[0]?.change_id ?? ""), [decision, setDecision] = useState("");
  return (
    <section className="em-panel" aria-label="Overlapping changes"><div className="em-panel-head"><h3>Compatibility of overlapping changes</h3></div>
      <div className="em-panel-body ec-stack">
        <p className="ec-note">Another accepted change shares an object or baseline. Record whether both may proceed, and in what order. Neither proposal is merged, rebased or altered by this.</p>
        {d.overlaps.filter((o) => o.restricted).map((o) => <Reason key={o.change_id}>A change outside your access shares this scope. Someone who can read both records the decision.</Reason>)}
        {d.refusals.decide ? <Reason>{d.refusals.decide}</Reason> : open.length > 0 && (
          <>
            <Field label="With"><select value={other} onChange={(e) => setOther(e.target.value)}>{open.map((o) => <option key={o.change_id} value={o.change_id}>{o.reference} · {o.title}</option>)}</select></Field>
            <Field label="Compatibility or sequence decision"><textarea value={decision} onChange={(e) => setDecision(e.target.value)} maxLength={2000} /></Field>
            <CommandNotice command={command} saved="Recorded for both changes." />
            <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={command.busy || !decision.trim() || !other} onClick={() => void command.send(path, { action: "overlap", change_id: d.change.id, id: newId(), expected_version: d.change.version, other_change_id: other, decision, reason: "Compatibility of overlapping changes decided" })}>Record compatibility decision</button></div>
          </>
        )}
      </div>
    </section>
  );
}
