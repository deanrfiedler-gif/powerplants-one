"use client";
import { useState } from "react";
import { priorities } from "../../model";
import type { readPeople } from "../../reads";
import { useChanges } from "./changes-shell";
import { CommandNotice, Field, fieldError, useChangeCommand, useRead } from "./changes-ui";
import type { Detail } from "./view-common";

type People = Awaited<ReturnType<typeof readPeople>>;
// Who acts next, by when, and any declared priority. None of it is technical content, so none of it ever
// invalidates a review or a decision. Withdrawal stops the proposal and erases nothing.
export function Coordination({ d, reload }: { d: Detail; reload: () => void }) {
  const { packageId } = useChanges(), people = useRead<People>(`engineering/${packageId}/changes/people`), command = useChangeCommand(reload), path = `engineering/${packageId}/changes`;
  const [owner, setOwner] = useState(d.change.next_owner_id ?? ""), [due, setDue] = useState(d.change.due ?? ""), [priority, setPriority] = useState(d.change.priority ?? ""), [why, setWhy] = useState(d.change.priority_reason ?? ""), [reason, setReason] = useState("");
  const moved = owner !== (d.change.next_owner_id ?? "") || due !== (d.change.due ?? "") || priority !== (d.change.priority ?? "") || why !== (d.change.priority_reason ?? "");
  return (
    <details className="em-panel">
      <summary className="em-panel-head"><h3>Coordination and withdrawal</h3><span className="ec-note">Next owner, due date and declared priority. Changing them never invalidates a review or a decision.</span></summary>
      <div className="em-panel-body ec-stack">
        <div className="ec-inline">
          <Field label="Next action owner" error={fieldError(command.error, "next_owner_id")}><select value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Unassigned</option>{people.data?.items.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Due" hint="Empty shows Date needed"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          <Field label="Declared priority" hint="Grants no authority and bypasses no review"><select value={priority} onChange={(e) => { setPriority(e.target.value); if (!e.target.value) setWhy(""); }}><option value="">None declared</option>{priorities.map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Reason for that priority" error={fieldError(command.error, "priority_reason")}><input value={why} onChange={(e) => setWhy(e.target.value)} disabled={!priority} /></Field>
        </div>
        <Field label="Reason for this update, or for withdrawing" error={fieldError(command.error, "reason")}><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} /></Field>
        <CommandNotice command={command} saved="Recorded on the server." />
        <div className="em-actions">
          <button type="button" className="mw-button mw-button-primary" disabled={command.busy || !moved || !reason.trim()} onClick={() => void command.send(path, { action: "coordinate", change_id: d.change.id, expected_version: d.change.version, next_owner_id: owner || null, due: due || null, priority: priority || null, priority_reason: why || null, reason })}>Save coordination</button>
          <button type="button" className="mw-button" disabled={command.busy || !reason.trim()} onClick={() => { if (window.confirm("Withdraw this change? Issued requests still need an outcome or a cancellation, and any receiver who accepted implementation work will be asked to acknowledge.")) void command.send(path, { action: "withdraw", change_id: d.change.id, expected_version: d.change.version, reason }); }}>Withdraw change</button>
        </div>
      </div>
    </details>
  );
}
