"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { attentionPresentation, decisionPresentation, stagePresentation } from "../../model";
import type { readHistory } from "../../reads";
import { useChanges } from "./changes-shell";
import { Icon, ReadNotice, Tone, stampText, text, useRead, dateText } from "./changes-ui";

type History = Awaited<ReturnType<typeof readHistory>>;
const subjects = ["Change", "Revision", "Review", "Decision", "Prerequisite", "Handover", "Submission", "RetestAttempt", "SourceCheck", "OverlapDecision", "Closure"] as const;

// Retained revisions, sources, reviews, decisions, operations, receiving outcomes and closure evidence. Nothing here
// can be edited: history is append-only in the database, and closed, rejected and withdrawn changes stay readable.
export function HistoryView() {
  const { packageId, changeId } = useChanges(), router = useRouter(), path = usePathname(), search = useSearchParams(), subject = search.get("subject") ?? "";
  const history = useRead<History>(`engineering/${packageId}/changes/history?${new URLSearchParams({ ...(changeId ? { change: changeId } : {}), ...(subject ? { subject } : {}) })}`);
  const go = (changes: Record<string, string | null>) => {
    const q = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(changes)) if (v) q.set(k, v); else q.delete(k);
    router.push(`${path}${q.toString() ? `?${q}` : ""}`, { scroll: false });
  };
  const data = history.data, s = data?.selected, download = (kind: string) => `/api/v1/engineering/${packageId}/changes/export?kind=${kind}&change=${changeId}`;
  return (
    <div className="ec-page" aria-busy={history.loading} aria-label="Changes and history">
      <ReadNotice error={history.error} what="Changes and history" />
      <section className="ec-flush" aria-label="All changes of this package">
        <div className="em-table-scroll">
          <table className="em-table ec-queue">
            <caption className="mw-sr">Every change of this package, open and closed</caption>
            <thead><tr>{["Change", "Basis → proposal", "Review state", "Technical decision", "Revisions", "Due", "Attention"].map((h) => <th key={h} scope="col"><span style={{ padding: "0 14px" }}>{h}</span></th>)}</tr></thead>
            <tbody>
              {data?.changes.map((r) => (
                <tr key={r.id} data-current={r.id === changeId || undefined} onClick={() => go({ change: r.id })}>
                  <td><button type="button" className="em-row-title" onClick={() => go({ change: r.id })}>{r.title}</button><span className="em-cell-sub">{r.reference}</span></td>
                  <td className="ec-basis">{r.basis}</td><td><Tone view={stagePresentation[r.stage]} />{r.closure && <span className="em-cell-sub">{text(r.closure.meaning)} · {stampText(r.closure.closed_at)}</span>}</td>
                  <td><Tone view={decisionPresentation(r.decision)} /></td><td>{r.revisions}</td><td>{dateText(r.due)}</td><td>{r.attention === "None" ? "—" : <Tone view={attentionPresentation[r.attention]} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.changes.length && <div className="em-empty"><p>No change exists in this package yet.</p></div>}
        </div>
      </section>
      <div className="ec-detail">
        {data?.selection === "Unavailable" && <div className="mw-notice" role="alert"><strong>Change unavailable</strong><p>This change does not exist in this package, or this identity cannot read it. Nothing is shown in its place.</p></div>}
        {s && (
          <>
            <header className="ec-detail-head">
              <div><span className="ec-inspector-ref">{s.reference}</span><h2>{s.title}</h2></div>
              <div className="em-actions">
                {/* Exports follow this reader's access and carry their own generated time. Exporting issues and distributes nothing. */}
                <a className="mw-button" href={download("assessment")}><Icon name="download" /><span>Assessment summary</span></a>
                <a className="mw-button" href={download("handover")}><Icon name="download" /><span>Handover manifest</span></a>
                <a className="mw-button" href={download("verification")}><Icon name="download" /><span>Verification report</span></a>
                <button type="button" className="mw-button mw-button-quiet" onClick={() => window.print()}>Print</button>
                <button type="button" className="mw-button mw-button-quiet" onClick={() => go({ change: null })}>Show the whole package</button>
              </div>
            </header>
            <div className="em-two">
              <section className="em-panel" aria-label="Proposal revisions"><div className="em-panel-head"><h3>Proposal revisions</h3></div>
                <ul className="em-list">{s.revisions.map((r) => <li key={r.id}><div><strong>Revision {r.number} · {text(r.state)}</strong><p className="em-hash">{r.content_hash}</p>
                  {r.submitted_at && <p>Submitted by {r.submitted_by_name}, {stampText(r.submitted_at)}</p>}{r.return_reason && <p>Returned ({text(r.return_kind ?? "")}) by {r.returned_by_name}, {stampText(r.returned_at)}: {r.return_reason}</p>}</div></li>)}</ul>
              </section>
              <section className="em-panel" aria-label="Decisions, checks and closure"><div className="em-panel-head"><h3>Decisions, source checks and closure</h3></div>
                <ul className="em-list">
                  {s.decisions.map((x) => <li key={x.id}><div><strong>Technical decision: {x.result} for {text(x.purpose)}</strong><p>{x.decided_by_name}, {stampText(x.decided_at)} · policy version {x.policy_version}</p><p>{x.reason}</p><p className="em-hash">Original operation {x.operation_id}</p></div></li>)}
                  {s.checks.map((k) => <li key={k.id}><div><strong>Source check: {text(k.result)}</strong><p>{k.checked_by_name}, {stampText(k.checked_at)}</p></div></li>)}
                  {s.closure && <li><div><strong>Closed: {text(s.closure.meaning)}</strong><p>{s.closure.closed_by_name}, {stampText(s.closure.closed_at)}</p><p>{s.closure.reason}</p><p className="em-hash">{s.closure.basis_hash}</p></div></li>}
                  {!s.decisions.length && !s.checks.length && !s.closure && <li><div><p>No decision, source check or closure is recorded yet.</p></div></li>}
                </ul>
              </section>
            </div>
          </>
        )}
        <section className="em-panel" aria-label="Events">
          <div className="em-panel-head"><h3>{s ? "Events of this change" : "Events of this package"}</h3>
            <label className="em-select"><span className="mw-sr">Subject</span><select value={subject} onChange={(e) => go({ subject: e.target.value || null })}><option value="">All subjects</option>{subjects.map((x) => <option key={x} value={x}>{text(x)}</option>)}</select></label></div>
          <div className="em-panel-body">
            <ul className="em-timeline">
              {data?.events.map((e) => <li key={e.id}><strong>{e.event_label}</strong> · {e.actor_name} · {stampText(e.created_at)}{!s && <> · <button type="button" className="mw-link" onClick={() => go({ change: e.change_id })}>{e.change_name}</button></>}
                <p>{e.reason}</p>{e.note && <p>{e.note}</p>}<p className="em-hash">Change version {e.change_version} · operation {e.operation_id}</p></li>)}
            </ul>
            {data && !data.events.length && <p className="ec-note">No event is recorded{subject ? " for that subject" : ""}.</p>}
            {data?.has_more && <p className="ec-note">Older events exist. Choose a change or a subject to narrow the list.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
