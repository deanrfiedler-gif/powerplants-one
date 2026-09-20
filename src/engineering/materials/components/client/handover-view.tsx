"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { quantityText } from "../../model";
import type { readHandovers, readPeople } from "../../reads";
import { useMaterials } from "./materials-shell";
import { CommandNotice, Dialog, Field, fieldError, ReadNotice, Reason, Status, dateText, stampText, text, toneFor, useMaterialsCommand, useRead } from "./materials-ui";

type Data = Awaited<ReturnType<typeof readHandovers>>;
type Handover = Data["items"][number];
type People = Awaited<ReturnType<typeof readPeople>>;
const actions: Record<string, string> = { ProcurementReady: "Procurement-ready receiving", ForecastOnly: "Forecast demand only" };

// One receiving package for one exact release and one receiving context. It is not a requisition or a purchase order,
// and receiving acceptance proves no stock, reservation, supplier confirmation, purchase, receipt or installation.
export function HandoverView() {
  const { packageId, setId, reloadFrame } = useMaterials(), router = useRouter(), path = usePathname(), search = useSearchParams();
  const read = useRead<Data>(`engineering/${packageId}/materials/handover${setId ? `?set=${setId}` : ""}`), data = read.data;
  const go = (changes: Record<string, string | null>) => { const q = new URLSearchParams(search.toString()); for (const [k, v] of Object.entries(changes)) if (v) q.set(k, v); else q.delete(k); router.replace(`${path}${q.toString() ? `?${q}` : ""}`, { scroll: false }); };
  const preparing = search.get("prepare"), chosen = search.get("handover"), selected = data?.items.find((h) => h.id === chosen) ?? data?.items[0] ?? null;
  const changed = () => { read.reload(); reloadFrame(); };
  return (
    <div className="em-page" aria-busy={read.loading}>
      <div className="em-page-head">
        <h2>Supply handover</h2>
        <span className="mw-spacer" />
        {data?.can.edit && <button type="button" className="mw-button mw-button-primary" disabled={!data.releases.some((r) => r.current_use === "EligibleForPurpose")} onClick={() => go({ prepare: "new" })}>Prepare handover</button>}
        <p>Supply Chain accepts or returns the whole exact payload. A returned payload is kept unchanged and corrected through a new revision. Approved demand is separate evidence: a technical release never turns forecast demand into approved demand.</p>
      </div>
      <ReadNotice error={read.error} what="Supply handover" />
      {data?.procurement_context && <p className="mw-notice">{data.procurement_context}</p>}
      {data && !data.releases.length && <div className="em-empty"><strong>No issued release exists yet</strong><p>A handover carries one exact issued technical release.</p></div>}
      {data && !!data.releases.length && !data.items.length && <div className="em-empty"><strong>No handover has been prepared</strong><p>{data.can.edit ? "Prepare one from an issued release that is still eligible for its purpose." : "An Engineering author prepares the handover."}</p></div>}
      {data && !!data.items.length && (
        <div className="em-two">
          <section className="em-panel" aria-label="Handovers">
            <ul className="em-list">
              {data.items.map((h) => (
                <li key={h.id} data-current={h.id === selected?.id || undefined}>
                  <div><button type="button" className="em-list-open" onClick={() => go({ handover: h.id })} aria-current={h.id === selected?.id}><strong>Release {h.release_number} · handover revision {h.revision}</strong><p>{actions[h.requested_action]} · {h.demand_basis} demand · to {h.receiver_name}</p></button></div>
                  <Status tone={toneFor(h.state)}>{text(h.state)}</Status>
                </li>
              ))}
            </ul>
          </section>
          {selected && <HandoverDetail key={`${selected.id}:${selected.version}`} h={selected} data={data} changed={changed} revise={() => go({ prepare: selected.release_id, predecessor: selected.id })} />}
        </div>
      )}
      {preparing && data && <PrepareHandover data={data} releaseId={preparing === "new" ? null : preparing} predecessor={search.get("predecessor")} onClose={() => go({ prepare: null, predecessor: null })} onSaved={(id) => { changed(); go({ prepare: null, predecessor: null, handover: id }); }} />}
    </div>
  );
}

function PrepareHandover({ data, releaseId, predecessor, onClose, onSaved }: { data: Data; releaseId: string | null; predecessor: string | null; onClose: () => void; onSaved: (id: string) => void }) {
  const { packageId } = useMaterials(), [id] = useState(() => crypto.randomUUID()), command = useMaterialsCommand(() => onSaved(id)), people = useRead<People>(`engineering/${packageId}/materials/people`);
  const eligible = data.releases.filter((r) => r.current_use === "EligibleForPurpose");
  const [f, setF] = useState({ release_id: eligible.find((r) => r.id === releaseId)?.id ?? eligible[0]?.id ?? "", action: data.procurement_context ? "ForecastOnly" : "ProcurementReady", basis: data.procurement_context ? "Forecast" : "Approved", source: data.demand_sources[0]?.id ?? "", receiver: "", required_by: "" });
  const err = (n: string) => fieldError(command.error, n), receivers = people.data?.items.filter((u) => u.receiver) ?? [];
  return (
    <Dialog title={predecessor ? "Prepare a corrected handover" : "Prepare supply handover"} subtitle="The payload is built on the server from the exact issued release. It is frozen when prepared." busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "unknown" || !f.release_id || !f.receiver} onClick={() => void command.send(`engineering/${packageId}/materials/handover`, { action: "prepare", reason: predecessor ? "Corrected handover prepared after return" : "Supply handover prepared from the exact release", id, release_id: f.release_id, requested_action: f.action, demand_basis: f.basis, demand_source_id: f.basis === "Approved" ? f.source || null : null, receiver_id: f.receiver, required_by: f.required_by || null, predecessor_id: predecessor })}>Prepare payload</button></>}>
      <CommandNotice command={command} />
      <Field label="Issued release" error={err("release_id")}><select data-autofocus value={f.release_id} onChange={(e) => setF({ ...f, release_id: e.target.value })}>{!eligible.length && <option value="">No eligible release</option>}{eligible.map((r) => <option key={r.id} value={r.id}>Release {r.release_number} · {text(r.purpose)} · {r.line_count} lines</option>)}</select></Field>
      <div className="mw-field-row">
        <Field label="Requested receiving action" error={err("requested_action")}><select value={f.action} onChange={(e) => setF({ ...f, action: e.target.value, basis: e.target.value === "ProcurementReady" ? "Approved" : f.basis })}><option value="ProcurementReady" disabled={!!data.procurement_context}>Procurement-ready receiving</option><option value="ForecastOnly">Forecast demand only</option></select></Field>
        <Field label="Demand basis" error={err("demand_basis")}><select value={f.basis} onChange={(e) => setF({ ...f, basis: e.target.value })} disabled={f.action === "ProcurementReady"}><option value="Forecast">Forecast</option><option value="Approved">Approved</option></select></Field>
      </div>
      {f.basis === "Approved" && <Field label="Approved demand authority" hint="Named evidence from the demand owner. A technical release is not demand authority." error={err("demand_source_id")}><select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>{!data.demand_sources.length && <option value="">No current demand authority is retained for this package</option>}{data.demand_sources.map((s) => s && <option key={s.id} value={s.id}>{s.reference} · {s.revision} · {s.title}</option>)}</select></Field>}
      <div className="mw-field-row">
        <Field label="Receiver" hint={receivers.length ? undefined : "No policy names a Supply Chain receiver for this company."} error={err("receiver_id")}><select value={f.receiver} onChange={(e) => setF({ ...f, receiver: e.target.value })}><option value="">Choose the Supply Chain coordinator</option>{receivers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Material required by" hint={`Local date at the site${data.site_timezone ? ` (${data.site_timezone})` : ""}. Leave empty when unknown; no customer deadline is inferred.`} error={err("required_by")}><input type="date" value={f.required_by} onChange={(e) => setF({ ...f, required_by: e.target.value })} /></Field>
      </div>
    </Dialog>
  );
}

function HandoverDetail({ h, data, changed, revise }: { h: Handover; data: Data; changed: () => void; revise: () => void }) {
  const { packageId } = useMaterials(), base = `engineering/${packageId}/materials/handover`, command = useMaterialsCommand(changed), [deciding, setDeciding] = useState(false);
  const lines = (h.payload?.lines ?? []) as { line_id: string; line_number: string; description: string; quantity: string; unit: string; mapping: { item_key: string | null }; procurement: { quantity: string; unit: string } | null }[];
  return (
    <section className="em-panel" aria-label={`Handover revision ${h.revision}`}>
      <div className="em-panel-head"><h3>Release {h.release_number} · handover revision {h.revision}</h3><Status tone={toneFor(h.state)}>{text(h.state)}</Status></div>
      <div className="em-panel-body">
        <dl className="em-facts">
          <div><dt>Requested action</dt><dd>{actions[h.requested_action]}</dd></div>
          <div><dt>Demand basis</dt><dd>{h.demand_basis}{h.demand_source ? ` · ${h.demand_source.reference} ${h.demand_source.revision}` : " · no demand authority named"}</dd></div>
          <div><dt>Receiver</dt><dd>{h.receiver_name}</dd></div>
          <div><dt>Coordinator</dt><dd>{h.coordinator_name}</dd></div>
          <div><dt>Material required by</dt><dd>{h.required_by ? `${dateText(h.required_by)} (${h.required_by_timezone})` : "Date needed"}</dd></div>
          <div><dt>Release current use</dt><dd><Status tone={toneFor(h.release_current_use ?? "")}>{text(h.release_current_use ?? "Unknown")}</Status></dd></div>
        </dl>
        {h.release_current_use_reasons.length > 0 && <ul className="em-blockers">{h.release_current_use_reasons.map((x) => <li key={x}>{x}</li>)}</ul>}
        {h.state === "Accepted" && h.release_current_use !== "EligibleForPurpose" && <p className="mw-notice mw-notice-attention">This acceptance stays on record as it was decided. The release it received is no longer eligible, so an owned follow-up is listed in Changes &amp; history. Nothing has been recalled, cancelled or reversed.</p>}
        {h.payload ? <><h3>Exact payload</h3><ul className="em-reasons">{lines.map((l) => <li key={l.line_id}>Line {l.line_number} · {l.description} · {quantityText(l.quantity, l.unit)} · item {l.mapping.item_key ?? "none"}{l.procurement ? ` · procure ${quantityText(l.procurement.quantity, l.procurement.unit)}` : " · procurement quantity unresolved"}</li>)}</ul></> : <Reason>The payload and recipient details are withheld for this identity. Its state and hash are shown.</Reason>}
        <p className="em-hash">Payload hash {h.payload_hash}</p>
        {h.differences && <><h3>Changes from the returned revision</h3>{h.differences.length ? <ul className="em-reasons">{h.differences.map((d) => <li key={d}>{d}</li>)}</ul> : <p className="mw-muted">The lines are unchanged; demand, receiver or date may differ.</p>}</>}
        <ol className="em-timeline" style={{ marginTop: 10 }}>
          <li><strong>Prepared</strong><p>{h.coordinator_name} · {stampText(h.prepared_at)}</p></li>
          {h.sent_at && <li><strong>Sent to receiver</strong><p>{stampText(h.sent_at)}</p></li>}
          {h.decided_at && <li><strong>{text(h.state)}</strong><p>{h.decided_by_name} · {stampText(h.decided_at)} · original operation {h.outcome_operation_id}</p>{h.decision_reasons.map((r, i) => <p key={i}>{r.line_id ? `Line ${lines.find((l) => l.line_id === r.line_id)?.line_number ?? "?"}: ` : ""}{r.reason}</p>)}{h.return_owner_name && <p>Correction: {h.return_owner_name}, due {dateText(h.return_due)}</p>}</li>}
        </ol>
        <CommandNotice command={command} />
        <div className="em-actions" style={{ marginTop: 12 }}>
          {h.state === "Prepared" && data.can.edit && <button type="button" className="mw-button mw-button-primary" disabled={command.busy} onClick={() => void command.send(base, { action: "send", reason: "Payload sent to its receiver", handover_id: h.id, expected_version: h.version })}>Send to receiver</button>}
          {h.state === "AwaitingReceiver" && <button type="button" className="mw-button mw-button-primary" disabled={!!h.decision_refusal} onClick={() => setDeciding(true)}>Record receiving decision</button>}
          {h.state === "Returned" && data.can.edit && !data.items.some((x) => x.predecessor_id === h.id) && <button type="button" className="mw-button mw-button-primary" onClick={revise}>Prepare corrected revision</button>}
        </div>
        {h.state === "AwaitingReceiver" && <Reason>{h.decision_refusal}</Reason>}
      </div>
      {deciding && <DecideDialog h={h} lines={lines} onClose={() => setDeciding(false)} changed={changed} />}
    </section>
  );
}

function DecideDialog({ h, lines, onClose, changed }: { h: Handover; lines: { line_id: string; line_number: string; description: string }[]; onClose: () => void; changed: () => void }) {
  const { packageId } = useMaterials(), command = useMaterialsCommand(changed), people = useRead<People>(`engineering/${packageId}/materials/people`);
  const [f, setF] = useState({ result: "Accepted", line_id: "", reason: "", owner_id: "", due: "" }), [fault, setFault] = useState(false), returning = f.result === "Returned";
  return (
    <Dialog title={`Receiving decision · release ${h.release_number}, revision ${h.revision}`} subtitle="You accept or return the whole exact payload. Acceptance records that it was received as stated; it creates no order, reservation, receipt or booking." busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "saved" || command.state === "unknown" || (returning && (!f.reason.trim() || !f.owner_id || !f.due))}
          onClick={() => void command.send(`engineering/${packageId}/materials/handover`, { action: "decide", reason: returning ? "Payload returned to Engineering" : "Exact payload accepted by Supply Chain", handover_id: h.id, expected_version: h.version, result: f.result, reasons: returning ? [{ line_id: f.line_id || null, reason: f.reason }] : [], owner_id: returning ? f.owner_id : null, due: returning ? f.due : null }, { discardReply: fault })}>Record decision</button></>}>
      <CommandNotice command={command} saved="Receiving outcome recorded on the server." />
      <Field label="Decision"><select data-autofocus value={f.result} onChange={(e) => setF({ ...f, result: e.target.value })}><option value="Accepted">Accept the exact payload</option><option value="Returned">Return it to Engineering</option></select></Field>
      {returning && <>
        <div className="mw-field-row">
          <Field label="Line concerned"><select value={f.line_id} onChange={(e) => setF({ ...f, line_id: e.target.value })}><option value="">Whole payload</option>{lines.map((l) => <option key={l.line_id} value={l.line_id}>{l.line_number} · {l.description}</option>)}</select></Field>
          <Field label="Who corrects it" error={fieldError(command.error, "owner_id")}><select value={f.owner_id} onChange={(e) => setF({ ...f, owner_id: e.target.value })}><option value="">Choose an Engineering author</option>{people.data?.items.filter((u) => u.author).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
          <Field label="By when"><input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
        </div>
        <Field label="Reason for return" hint="For example an item, unit or date mismatch."><textarea value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
      </>}
      <label className="mw-choice"><input type="checkbox" checked={fault} onChange={(e) => setFault(e.target.checked)} disabled={command.state !== "idle" && command.state !== "failed"} /><span>Exercise recovery: discard the server&rsquo;s reply (synthetic fault)</span></label>
    </Dialog>
  );
}
