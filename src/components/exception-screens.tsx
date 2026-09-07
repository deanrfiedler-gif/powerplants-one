"use client";
import Link from "next/link";
import { useState } from "react";
import { EnumField, ErrorNotice, Field, isDenied, PageHeader, ReadState, Stamp, Status, useCommand, useResource, ValidationFields } from "./business-ui";

type Recovery = {
  case_id: string;
  operation_id: string;
  payload_hash: string;
  received_at: string;
  activity_id: string;
  envelope: Record<string, unknown>;
  byte_count: number | null;
  dispositions: { disposition: string; reason: string; received_at: string }[];
};

export function ExceptionsScreen() {
  const recovery = useResource<{ items: Recovery[] }>("sync/recovery-review");
  return <>
    <PageHeader eyebrow="Service coordination" title="Exceptions and recovery" description="Review retained evidence and continue each issue in its responsible workflow." />
    <div className="record-grid">
      <section className="record-card"><h2>Document preparation</h2><p>Inspect the original attempt, current source and available recovery action.</p><div className="related-links"><Link href="/service/packs">Job packs</Link><Link href="/service/reports">Service reports</Link></div></section>
      <section className="record-card"><h2>Finance follow-up</h2><p>Review returns, uncertain processing and reconciliation with current Finance access.</p><Link href="/finance/handoffs">Finance handoffs</Link></section>
      <section className="record-card"><h2>Personal saved work</h2><p>Open your saved offline originals and check each local save or synchronisation result.</p><a href="/offline/index.html">Offline field workspace</a></section>
    </div>
    <section aria-labelledby="recovery-heading">
      <h2 id="recovery-heading">Retained field evidence</h2>
      <p>Only cases assigned to you and permitted by your current access appear here. These originals require review before any separate business action.</p>
      <ReadState loading={recovery.loading} error={recovery.error} retry={recovery.reload} />
      {recovery.data && !recovery.loading && !recovery.error && <>
        <p className="read-meta">{recovery.data.items.length} cases in this permitted window. The source examines up to 100 recent owned cases; this is not a complete backlog total.</p>
        {!recovery.data.items.length ? <p className="empty-state">No permitted recovery cases in this window.</p> : <div className="record-grid">
          {recovery.data.items.map((item) => <article className="record-card" key={item.case_id}>
            <h3><Link href={`/admin/recovery/${item.case_id}`}>Review retained evidence</Link></h3>
            <Status value={item.dispositions.at(-1)?.disposition ?? "RetainedForReview"} />
            <p>Received <Stamp value={item.received_at} /></p>
            <p>Original operation: <span className="narrative">{item.operation_id}</span></p>
          </article>)}
        </div>}
        <button className="secondary" onClick={recovery.reload}>Refresh recovery cases</button>
      </>}
    </section>
  </>;
}

export function RecoveryScreen({ id }: { id: string }) {
  const r = useResource<Recovery>(`sync/recovery-review/${id}`);
  const [saved, setSaved] = useState("");
  return <>
    <Link href="/admin">← Exceptions and recovery</Link>
    <PageHeader eyebrow="Retained field evidence" title="Review original evidence" />
    {saved && <p role="status">{saved}</p>}
    <ReadState loading={r.loading} error={r.error} retry={r.reload} />
    {r.data && !r.loading && !r.error && <RecoveryDetail key={id} item={r.data} reload={r.reload} saved={() => { setSaved("Review position saved to the server."); r.reload(); }} />}
  </>;
}

function RecoveryDetail({ item, reload, saved }: { item: Recovery; reload: () => void; saved: () => void }) {
  const command = useCommand();
  const [disposition, setDisposition] = useState("RetainedForReview");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  if (isDenied(command.error)) return <ReadState loading={false} error={command.error} retry={reload} />;
  return <ValidationFields error={command.error}>
    <p className="callout">This is retained original evidence. A review note does not approve work, restore normal access, or add these quantities to a report or Finance handoff.</p>
    <dl className="record-summary"><div><dt>Received</dt><dd><Stamp value={item.received_at} /></dd></div><div><dt>Current review position</dt><dd><Status value={item.dispositions.at(-1)?.disposition ?? "RetainedForReview"} /></dd></div></dl>
    <p><Link href={`/work/${item.activity_id}`}>Open owned follow-up</Link></p>
    <details><summary>Original evidence and source identity</summary>
      <p className="narrative">Original operation: {item.operation_id}</p><p className="narrative">Original hash: {item.payload_hash}</p>
      <pre className="recovery-original" tabIndex={0} aria-label="Original retained evidence">{JSON.stringify(item.envelope, null, 2)}</pre>
      {(item.byte_count ?? 0) > 0 && <a href={`/api/v1/sync/recovery-review/${item.case_id}/bytes`} target="_blank" rel="noreferrer">Open exact retained image ({item.byte_count} bytes)</a>}
    </details>
    <h2>Record review position</h2>
    <form onSubmit={(event) => { event.preventDefault(); void command.send(`sync/recovery-review/${item.case_id}/disposition`, { disposition, note, reason }).then((result) => { if (result) saved(); }); }}>
      <EnumField name="disposition" label="Review position" value={disposition} onChange={setDisposition} values={["RetainedForReview", "ClarificationRequired"]} />
      <Field name="note" label="Review note" value={note} onChange={setNote} required multiline maxLength={2000} />
      <Field name="reason" label="Reason for review" value={reason} onChange={setReason} required maxLength={1000} />
      <ErrorNotice error={command.error} />
      <button disabled={command.busy}>{command.busy ? "Saving…" : "Save review position"}</button>
    </form>
    <h2>Review history</h2>
    {item.dispositions.length ? <ol>{item.dispositions.map((d, index) => <li key={index}><Status value={d.disposition} /> <Stamp value={d.received_at} /><p className="narrative">{d.reason}</p></li>)}</ol> : <p>No review position has been recorded.</p>}
  </ValidationFields>;
}
