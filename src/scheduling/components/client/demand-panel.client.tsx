"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ErrorNotice, Field, ReadState, SelectField, Stamp, useResource, type Envelope } from "../../../components/business-ui";
import { ScopeView, type Order } from "../../../service";
import { utcFromLocal } from "../../time";
import { appointmentHref } from "../../navigation";
import { BookingRecovery, useBookingCommand } from "./booking-recovery.client";

export function DemandPanel({ id, returnTo, onClose, onSaved }: { id: string; returnTo: string; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const detail = useResource<Envelope<Order>>(`service/work-orders/${id}`);
  const w = detail.data?.items[0];
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = dialog.current;
    panel?.showModal();
    return () => { panel?.close(); if (opener?.isConnected) opener.focus(); else document.getElementById("unassigned-demand-heading")?.focus(); };
  }, []);
  return <dialog ref={dialog} className="pl01-panel" aria-labelledby="plan-visit-heading" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><p className="eyebrow">Unassigned demand</p><h2 id="plan-visit-heading">Plan visit</h2></div><button className="secondary" autoFocus onClick={onClose}>Close plan visit</button></header>
    <div className="pl01-panel-body">
      <ReadState {...detail} retained={!!w} retry={detail.reload} />
      {!w && !detail.loading && <p>Current work context is unavailable. Saving is disabled. <Link href={`/service/work-orders/${id}`}>Open owning work order</Link>.</p>}
      {w && <ProposalForm w={w} usable={!detail.loading && !detail.error} returnTo={returnTo} refresh={detail.reload} onSaved={onSaved} />}
    </div>
    <footer><p>Proposal → readiness and contact → crew confirmation. A proposal reserves no crew.</p></footer>
  </dialog>;
}
function ProposalForm({ w, usable, returnTo, refresh, onSaved }: { w: Order; usable: boolean; returnTo: string; refresh: () => void; onSaved: () => void }) {
  const [basis, setBasis] = useState(w);
  const [start, setStart] = useState(""), [end, setEnd] = useState("");
  const [windowStart, setWindowStart] = useState(""), [windowEnd, setWindowEnd] = useState("");
  const [preparation, setPreparation] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [appointmentId] = useState(() => crypto.randomUUID());
  const command = useBookingCommand();
  const notified = useRef("");
  const callbacks = useRef({ refresh, onSaved });
  useEffect(() => { callbacks.current = { refresh, onSaved }; }, [refresh, onSaved]);
  useEffect(() => {
    if (command.accepted?.receipt.record_id === appointmentId && notified.current !== command.accepted.receipt.operation_id) {
      notified.current = command.accepted.receipt.operation_id;
      callbacks.current.onSaved();
    }
  }, [command.accepted, appointmentId]);
  useEffect(() => { if ((command.error as { status?: number })?.status === 409) callbacks.current.refresh(); }, [command.error]);
  const scope = basis.scopes.find(s => s.id === basis.authorised_scope_revision_id);
  const current = w.scopes.find(s => s.id === w.scope_revision_id);
  const otherVisits = w.visits.filter(v => v.status !== "Cancelled");
  const eligible = w.status === "Authorised" && w.scope_revision_id === w.authorised_scope_revision_id && !!scope?.approved_at && !otherVisits.length;
  const saved = command.accepted?.receipt.record_id === appointmentId ? command.accepted : null;
  const changed = basis.version !== w.version || basis.scope_revision_id !== w.scope_revision_id || basis.site_id !== w.site_id || basis.site_timezone !== w.site_timezone;
  const blocked = !usable || !eligible || !w.actions.can_edit || command.busy || !!command.pending || !command.ready || !!saved || changed;
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (blocked || !scope) return;
    setError(null);
    try {
      if (preparation !== "Preparing") throw Error("Explicitly select Preparing before saving this guided proposal.");
      const start_at = utcFromLocal(start, basis.site_timezone), end_at = utcFromLocal(end, basis.site_timezone);
      if (end_at <= start_at) throw Error("Finish must follow start.");
      if (!!windowStart !== !!windowEnd) throw Error("Supply both customer window dates, or leave both blank.");
      const ws = windowStart ? utcFromLocal(windowStart, basis.site_timezone) : null;
      const we = windowEnd ? utcFromLocal(windowEnd, basis.site_timezone) : null;
      if (ws && we && (we <= ws || start_at < ws || end_at > we)) throw Error("The paired customer window must contain the whole visit.");
      await command.send(`service/work-orders/${basis.id}/visits`, {
        id: appointmentId, expected_version: basis.version, scope_revision_id: scope.id, scope_version: scope.version,
        start_at, end_at, requested_window_start: ws, requested_window_end: we,
        customer_commitment: "Proposed", preparation_status: preparation, reason: "Plan attendance from reviewed unassigned demand",
      }, appointmentHref(appointmentId, returnTo), "Proposal", appointmentId);
    } catch (e) { setError({ message: e instanceof Error ? e.message : "Review the visit dates." }); }
  }
  return <>
    <section aria-label="Work to schedule">
      <h3><Link href={`/service/work-orders/${basis.id}`}>{basis.display_number}</Link></h3>
      <p>{basis.customer_name} · {basis.site_name}</p><p>Service owner: {basis.owner_name}</p>
      <p><strong>Site timezone: {basis.site_timezone}</strong></p>
      <p>Authorised scope {scope ? `r${String(scope.revision).padStart(2, "0")} · content v${scope.version}` : "unavailable"} · Work order v{basis.version}</p>
      {w.scope_revision_id !== w.authorised_scope_revision_id ? <div className="planner-warning"><strong>Current scope differs from authorised scope.</strong><p>Current r{current?.revision ?? "unknown"}: {current?.summary ?? "Unavailable"}. This successor requires review on the work order before planning here.</p></div> : <p>Current scope matches the authorised revision. Booking still requires current site, equipment, readiness, contact and crew checks.</p>}
      {scope && <details className="pl01-scope" open><summary>Review exact authorised work and limits</summary><ScopeView r={scope} /></details>}
      {!w.actions.can_edit && <p className="planner-warning">Your current permissions allow viewing this work, but not proposing a visit.</p>}
      {!eligible && !saved && <p className="planner-warning">This order is no longer eligible for the guided shortcut. Review the owning work order and any saved appointments.</p>}
      {otherVisits.map(v => <p key={v.id}><Link href={appointmentHref(v.id, returnTo)}>View appointment {v.display_number}</Link> · {v.status}</p>)}
      {changed && !saved && <div className="planner-warning"><p>Saved work context changed. Your reviewed basis remains v{basis.version}; the current order is v{w.version}. No versions have been adopted automatically.</p>{eligible && <button className="secondary" disabled={!!command.pending || command.busy || !usable} onClick={() => { setBasis(w); command.clear(); }}>Use reviewed current work context</button>}</div>}
      <button className="secondary" disabled={command.busy} onClick={refresh}>Refresh work context</button>
    </section>
    <BookingRecovery command={command} />
    {saved ? <p>Proposal accepted. No crew is reserved. <Stamp value={String(saved.receipt.accepted_at ?? "")} timezone={basis.site_timezone} /></p> : <form id="pl01-proposal-form" onSubmit={save}>
      <h3>Visit proposal</h3><p>Enter every date in {basis.site_timezone}. These dates remain proposed until separately confirmed with the crew.</p>
      <ErrorNotice error={error} />
      <fieldset disabled={blocked}><legend>Attendance · {basis.site_timezone}</legend>
        <div className="form-grid">
          <Field name="pl01-start" label="Start (site time)" type="datetime-local" required value={start} onChange={setStart} />
          <Field name="pl01-end" label="Finish (site time)" type="datetime-local" required value={end} onChange={setEnd} />
          <Field name="pl01-window-start" label="Customer window start (site time, optional)" type="datetime-local" value={windowStart} onChange={setWindowStart} />
          <Field name="pl01-window-end" label="Customer window finish (site time, optional)" type="datetime-local" value={windowEnd} onChange={setWindowEnd} />
        </div>
        <SelectField name="pl01-preparation" label="Preparation state" required value={preparation} onChange={setPreparation} options={[{ id: "Preparing", display_name: "Preparing — explicitly record preparation in progress" }]} />
        <p>Service owner {basis.owner_name} retains preparation follow-through. This selection does not pass readiness checks or release dispatch.</p>
        <button type="submit">{command.busy ? "Saving proposal…" : "Save proposal"}</button>
      </fieldset>
    </form>}
  </>;
}
