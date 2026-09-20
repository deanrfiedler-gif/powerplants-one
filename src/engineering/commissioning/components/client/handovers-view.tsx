"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { destinations, obligationKinds, obligationPresentation, obligationStates, receivingPresentation, requiredStages, type Destination, type ReceivingOutcome } from "../../model";
import type { readHistory } from "../../reads";
import { useCommissioning } from "./commissioning-shell";
import { CommandNotice, Dialog, Field, Icon, ReadNotice, Tag, fieldError, longDate, newId, siteTime, text, useCommissioningCommand, useRead } from "./commissioning-ui";
import { OutputLinks, Row, archivedRefusal, revisionName, type Options, type Person } from "./releases-view";
import { DetailHead, Page, Refusal, useAct, useSelect, useView, type Detail, type View } from "./view-common";

type History = Awaited<ReturnType<typeof readHistory>>;
type Obligation = Detail["obligations"][number];
type Request = Detail["requests"][number];
type Submission = Request["submissions"][number];
type Manifest = NonNullable<Submission["manifest"]>;
type Delivery = "Delivered" | "Unknown" | "Unavailable";

const notRecorded = "Not recorded";
const deliveryText: Record<Submission["delivery"], string> = {
  Delivered: "The synthetic receiver holds this request", Pending: "Not yet offered to the synthetic receiver",
  Unknown: "The synthetic receiver answered “unknown”: whether it holds this request is not known", Unavailable: "The synthetic receiver was unavailable: whether it holds this request is not known",
};
const outcomeVerb: Record<ReceivingOutcome, string> = { Accepted: "Accept", Returned: "Return", ClarificationRequired: "Ask for clarification" };

export function HandoversView() {
  const view = useView("handovers"), zone = view.data?.package.site_timezone ?? null;
  return (
    // One scroll surface for the queue, the selected package and, where none is selected, the package-wide history.
    <div className="cm-handover-surface">
      <Page view={view} label="Handover & history" empty="Training, manuals and support obligations, each recipient's own receiving decision and the retained history. Choose a package, or read the history of the whole Engineering package below." columns={["Issued release", "Obligations", "Receiving"]}>
        {(d) => <Handovers key={d.record.id} d={d} zone={zone} can={view.data!.can} reload={view.reload} />}
      </Page>
      {view.data?.selection === "None" && <div className="cm-detail"><HistoryPanel recordId={null} version={0} zone={zone} /></div>}
    </div>
  );
}

function Handovers({ d, zone, can, reload }: { d: Detail; zone: string | null; can: View["can"]; reload: () => void }) {
  const { packageId } = useCommissioning(), options = useRead<Options>(`engineering/${packageId}/commissioning/options`), people = options.data?.people ?? [];
  const archived = d.record.archived_at ? archivedRefusal : null;
  return (
    <>
      <DetailHead d={d} />
      {archived && <p className="cm-note" role="note">Archived {siteTime(d.record.archived_at, zone)}. {d.record.archived_reason} {archived}</p>}
      <ObligationsPanel d={d} can={can} people={people} archived={archived} reload={reload} />
      <ReceivingPanel d={d} zone={zone} people={people} archived={archived} reload={reload} />
      <HistoryPanel recordId={d.record.id} version={d.record.version} zone={zone} />
      <ArchivePanel d={d} archived={archived} reload={reload} />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
function ObligationsPanel({ d, can, people, archived, reload }: { d: Detail; can: View["can"]; people: Person[]; archived: string | null; reload: () => void }) {
  const [dialog, setDialog] = useState<{ kind: "edit"; id: string | null } | { kind: "progress"; id: string } | null>(null), editRefusal = archived ?? d.refusals.edit;
  // A hold is released or dispositioned under the review duty. Any other obligation is progressed by whoever prepares or reviews.
  const progressRefusal = (o: Obligation) => archived ?? (o.kind === "Hold" ? (can.review ? null : "A hold is released or dispositioned under the review duty, which this identity does not hold for this company and site.") : can.edit || can.review ? null : d.refusals.edit);
  const target = dialog?.id ? d.obligations.find((o) => o.id === dialog.id) ?? null : null;
  return (
    <section className="cm-panel" id="cm-panel-obligations" tabIndex={-1} aria-label="Training, manuals and support obligations">
      <header>
        <div>
          <h3>Training, manuals and support obligations</h3>
          <p>Planned, delivered, evidenced and competence confirmed are four separate facts, each with its own record. An obligation bites at the stage it declares and no other.</p>
        </div>
        <div className="cm-act">
          <button type="button" className="mw-button" disabled={!!editRefusal} onClick={() => setDialog({ kind: "edit", id: null })}><Icon name="plus" /><span>Add obligation</span></button>
          <Refusal reason={editRefusal} />
        </div>
      </header>
      {d.obligations.length ? (
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-rel-table cm-table-wide">
            <caption className="mw-sr">Obligations of this commissioning package, with each separate fact of their progress</caption>
            <thead><tr>{["Obligation", "Kind", "Required", "State", "Planned on", "Delivered on", "Evidence", "Competence", "Owner / due", "Actions"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
            <tbody>
              {d.obligations.map((o) => (
                <tr key={o.id}>
                  <td className="cm-rowhead">{o.title}{(o.subject || o.content_revision) && <span className="em-cell-sub">{[o.subject, o.content_revision && `content ${o.content_revision}`].filter(Boolean).join(" · ")}</span>}
                    {o.source_reference && <span className="em-cell-sub">Source: {o.source_reference}</span>}
                    {o.kind === "WarrantyMaintenance" && <span className="em-cell-sub">Context only. No warranty start and no maintenance schedule is set or implied.</span>}
                    {o.state === "Dispositioned" && <span className="em-cell-sub">Decision: {o.disposition_reason ?? notRecorded} · authority: {o.disposition_authority ?? notRecorded}</span>}</td>
                  <td data-label="Kind">{o.kind_label}</td>
                  <td data-label="Required">{o.stage_label}</td>
                  <td data-label="State"><Tag view={o.state_view} /></td>
                  <td data-label="Planned on">{o.planned_on ? longDate(o.planned_on) : notRecorded}</td>
                  <td data-label="Delivered on">{o.delivered_on ? longDate(o.delivered_on) : notRecorded}</td>
                  <td data-label="Evidence">{o.evidence ?? notRecorded}</td>
                  <td data-label="Competence">{o.competence_note ?? notRecorded}</td>
                  <td data-label="Owner / due">{o.owner_name}<span className="em-cell-sub">{o.due ? <>{longDate(o.due)}{o.due_view.label === "Overdue" && <> · <Tag view={o.due_view} /></>}</> : "Date needed"}</span></td>
                  <td data-label="Actions">
                    <span className="cm-cell-actions">
                      <button type="button" className="mw-button mw-button-quiet" disabled={!!editRefusal} onClick={() => setDialog({ kind: "edit", id: o.id })} aria-label={`Edit ${o.title}`}>Edit</button>
                      <button type="button" className="mw-button mw-button-quiet" disabled={!!progressRefusal(o)} onClick={() => setDialog({ kind: "progress", id: o.id })} aria-label={`Record progress on ${o.title}`}>Record progress</button>
                    </span>
                    {progressRefusal(o) && progressRefusal(o) !== editRefusal && <span className="em-cell-sub">{progressRefusal(o)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="cm-panel-body"><p className="cm-note">No obligation is recorded for this package. An empty list is not evidence that nothing is owed.</p></div>}
      {dialog?.kind === "edit" && (dialog.id === null || target) && <ObligationDrawer d={d} o={target} people={people} onClose={() => setDialog(null)} reload={reload} />}
      {dialog?.kind === "progress" && target && <ProgressDrawer d={d} o={target} onClose={() => setDialog(null)} reload={reload} />}
    </section>
  );
}

function ObligationDrawer({ d, o, people, onClose, reload }: { d: Detail; o: Obligation | null; people: Person[]; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), command = useCommissioningCommand(() => { announce(o ? "Obligation updated." : "Obligation recorded."); reload(); }), [id] = useState(() => o?.id ?? newId()), [dirty, setDirty] = useState(false);
  const [f, setF] = useState({ kind: o?.kind ?? "Training", title: o?.title ?? "", required_stage: o?.required_stage ?? "ServiceAcceptance", subject: o?.subject ?? "", content_revision: o?.content_revision ?? "", source_reference: o?.source_reference ?? "", owner_id: o?.owner_id ?? d.record.owner_id ?? "", due: o?.due ?? "" });
  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setDirty(true); setF((old) => ({ ...old, [key]: e.target.value })); };
  const e = command.error;
  return (
    <Dialog title={o ? `Edit obligation · ${o.title}` : "Add obligation"} subtitle="An obligation declares the stage it is required for. It blocks that stage and no other." drawer busy={command.busy} dirty={dirty && command.state !== "saved"} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "saved" || !f.title.trim() || !f.owner_id}
          onClick={() => void command.send(`engineering/${packageId}/commissioning/handovers`, { action: "obligation", id, record_id: d.record.id, ...(o ? { expected_version: o.version } : {}), kind: f.kind, title: f.title, required_stage: f.required_stage, subject: f.subject || null, content_revision: f.content_revision || null, source_reference: f.source_reference || null, owner_id: f.owner_id, due: f.due || null, reason: o ? "Obligation updated" : "Obligation recorded" })}>{command.busy ? "Saving…" : o ? "Save obligation" : "Add obligation"}</button></>}>
      <CommandNotice command={command} saved={o ? "Obligation updated on the server." : "Obligation recorded on the server."} />
      <div className="mw-field-row">
        <Field label="Kind" hint={o ? "Fixed once recorded" : undefined} error={fieldError(e, "kind")}><select data-autofocus={!o || undefined} value={f.kind} onChange={set("kind")} disabled={!!o}>{obligationKinds.map((k) => <option key={k} value={k}>{text(k)}</option>)}</select></Field>
        <Field label="Required" hint={o ? "Fixed once recorded" : "The one stage this obligation can block"} error={fieldError(e, "required_stage")}><select value={f.required_stage} onChange={set("required_stage")} disabled={!!o}>{requiredStages.map((k) => <option key={k} value={k}>{text(k)}</option>)}</select></Field>
      </div>
      {f.kind === "WarrantyMaintenance" && <p className="mw-hint">Context only. No warranty start and no maintenance schedule is set or implied by recording this.</p>}
      {f.kind === "Hold" && <p className="mw-hint">A hold is released by evidence from its source, or dispositioned by a named authority with a reason, under the review duty. There is no general &ldquo;proceed&rdquo;.</p>}
      <Field label="Title" error={fieldError(e, "title")}><input data-autofocus={!!o || undefined} value={f.title} onChange={set("title")} maxLength={200} /></Field>
      <div className="mw-field-row">
        <Field label="Subject (optional)" error={fieldError(e, "subject")}><input value={f.subject} onChange={set("subject")} maxLength={300} /></Field>
        <Field label="Content revision (optional)" error={fieldError(e, "content_revision")}><input value={f.content_revision} onChange={set("content_revision")} maxLength={40} /></Field>
      </div>
      <Field label="Source reference (optional)" hint="Where this obligation comes from: a contract schedule, a procedure, a hold notice" error={fieldError(e, "source_reference")}><input value={f.source_reference} onChange={set("source_reference")} maxLength={300} /></Field>
      <div className="mw-field-row">
        <Field label="Owner" error={fieldError(e, "owner_id")}><select value={f.owner_id} onChange={set("owner_id")}><option value="">Choose a person</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Due" hint="Leave empty to show Date needed" error={fieldError(e, "due")}><input type="date" value={f.due} onChange={set("due")} /></Field>
      </div>
    </Dialog>
  );
}

function ProgressDrawer({ d, o, onClose, reload }: { d: Detail; o: Obligation; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), command = useCommissioningCommand(() => { announce("Obligation progress recorded."); reload(); }), [dirty, setDirty] = useState(false);
  const [f, setF] = useState({ state: o.state, planned_on: o.planned_on ?? "", delivered_on: o.delivered_on ?? "", evidence: o.evidence ?? "", competence_note: o.competence_note ?? "", disposition_reason: o.disposition_reason ?? "", disposition_authority: o.disposition_authority ?? "" });
  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setDirty(true); setF((old) => ({ ...old, [key]: e.target.value })); };
  const e = command.error;
  return (
    <Dialog title={`Record progress · ${o.title}`} subtitle={`${o.kind_label} · ${o.stage_label.toLowerCase()}`} drawer busy={command.busy} dirty={dirty && command.state !== "saved"} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy}
          onClick={() => void command.send(`engineering/${packageId}/commissioning/handovers`, { action: "obligation_state", record_id: d.record.id, obligation_id: o.id, expected_version: o.version, state: f.state, planned_on: f.planned_on || null, delivered_on: f.delivered_on || null, evidence: f.evidence || null, competence_note: f.competence_note || null,
            disposition_reason: f.disposition_reason || null, disposition_authority: f.disposition_authority || null, reason: `Obligation progress recorded: ${obligationPresentation[f.state].label.toLowerCase()}` })}>{command.busy ? "Saving…" : "Record progress"}</button></>}>
      <CommandNotice command={command} saved="Progress recorded on the server." />
      <p className="mw-hint">Planned is not delivered, delivered is not evidenced, and evidence of attendance is not confirmed competence. Each is recorded as its own fact, and a state that rests on a fact is refused until that fact is recorded.</p>
      {o.kind === "Hold" && <p className="mw-hint">A hold is released by evidence from its source, or dispositioned by a named authority with a reason, under the review duty. There is no general &ldquo;proceed&rdquo;.</p>}
      {o.kind === "WarrantyMaintenance" && <p className="mw-hint">Context only. No warranty start and no maintenance schedule is set or implied.</p>}
      <Field label="State" error={fieldError(e, "state")}><select data-autofocus value={f.state} onChange={set("state")}>{obligationStates.map((s) => <option key={s} value={s}>{obligationPresentation[s].label}</option>)}</select></Field>
      <div className="mw-field-row">
        <Field label="Planned on" hint="A plan, not a delivery" error={fieldError(e, "planned_on")}><input type="date" value={f.planned_on} onChange={set("planned_on")} /></Field>
        <Field label="Delivered on" hint="The date it actually happened" error={fieldError(e, "delivered_on")}><input type="date" value={f.delivered_on} onChange={set("delivered_on")} /></Field>
      </div>
      <Field label="Evidence" hint="What shows it happened: a signed attendance record, a manual pack revision, a source release notice" error={fieldError(e, "evidence")}><textarea value={f.evidence} onChange={set("evidence")} maxLength={600} /></Field>
      <Field label="How competence was confirmed" hint="Attendance alone does not establish competence" error={fieldError(e, "competence_note")}><textarea value={f.competence_note} onChange={set("competence_note")} maxLength={600} /></Field>
      {(f.state === "Dispositioned" || o.kind === "Hold") && (
        <>
          <Field label="Disposition reason" error={fieldError(e, "disposition_reason")}><textarea value={f.disposition_reason} onChange={set("disposition_reason")} maxLength={1000} /></Field>
          <Field label="Authority for the disposition" hint="The named source authority that permits this exception" error={fieldError(e, "disposition_authority")}><input value={f.disposition_authority} onChange={set("disposition_authority")} maxLength={300} /></Field>
        </>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
const freshRequest = () => ({ id: newId(), submission_id: newId(), output_id: newId() });
function ReceivingPanel({ d, zone, people, archived, reload }: { d: Detail; zone: string | null; people: Person[]; archived: string | null; reload: () => void }) {
  const issued = [...d.releases].reverse().find((r) => r.state === "Issued") ?? null, [open, setOpen] = useState(false);
  // The identities of a request, its first manifest and its pack are made once and kept until a receipt arrives, so a
  // retry after a failed or lost preparation recovers the original operation and never makes a second request.
  const [ids, setIds] = useState(freshRequest);
  const refusal = archived ?? d.refusals.edit ?? (issued ? null : "No release of this package is issued. A handover is prepared against an issued release.");
  const unrequested = destinations.filter((x) => !d.requests.some((q) => q.destination === x && (!issued || q.release_id === issued.id)));
  const who = (id: string) => people.find((p) => p.id === id)?.name ?? "A named person";
  return (
    <section className="cm-panel" id="cm-panel-receiving" tabIndex={-1} aria-label="Receiving by recipient">
      <header>
        <div>
          <h3>Receiving by recipient</h3>
          <p>Each recipient answers for themselves, on one exact manifest. An acceptance is one recipient&rsquo;s decision on one manifest: it is not Project completion, customer acceptance, a warranty start or commercial closure.</p>
        </div>
        <div className="cm-act">
          <button type="button" className="mw-button mw-button-primary" disabled={!!refusal} onClick={() => setOpen(true)}>Request receiving</button>
          <Refusal reason={refusal} />
        </div>
      </header>
      {d.requests.map((r) => <RequestBlock key={r.id} d={d} r={r} zone={zone} people={people} archived={archived} reload={reload} />)}
      {unrequested.map((x) => {
        const named = issued?.recipients.filter((k) => k.destination === x) ?? [];
        return (
          <div key={x} className="cm-request">
            <div className="cm-request-head"><strong>{text(x)}</strong><Tag view={receivingPresentation.NotRequested} /></div>
            <p className="cm-note">{!issued ? "No release is issued, so nothing can be handed over yet." : named.length ? `${revisionName(issued)} names ${named.map((k) => `${who(k.recipient_id)} (${k.purpose})`).join("; ")}. Nothing has been asked of them: naming a recipient sends nothing.` : `${revisionName(issued)} names no recipient for this destination.`}</p>
          </div>
        );
      })}
      {open && issued && <RequestDrawer d={d} release={issued} ids={ids} renew={() => setIds(freshRequest())} people={people} taken={d.requests.filter((q) => q.release_id === issued.id)} onClose={() => setOpen(false)} reload={reload} />}
    </section>
  );
}

function SyntheticBehaviour({ value, onChange }: { value: Delivery; onChange: (v: Delivery) => void }) {
  return (
    <Field label="Synthetic receiver behaviour (demonstration only)" hint="The local synthetic receiver can be told to answer as unreachable, so that an unknown outcome and its recovery can be shown. No message is sent to anyone in any case.">
      <select value={value} onChange={(e) => onChange(e.target.value as Delivery)}><option value="Delivered">Delivered: the receiver holds the request</option><option value="Unknown">Unknown: no readable answer</option><option value="Unavailable">Unavailable: the receiver cannot be reached</option></select>
    </Field>
  );
}
// Preparing a pack renders a real PDF on the server. A failure there records nothing; the same identities are offered again.
function PackFailure({ code, outputId, renew }: { code: string | undefined; outputId: string; renew: () => void }) {
  if (code === "OutputIdentityInUse") return <div className="cm-act"><button type="button" className="mw-button" onClick={renew}>Use a new output identity</button><p className="cm-note">The earlier bytes are retained under their own identity. Changed content is prepared under a new one.</p></div>;
  return code === "RenderOrStorageFailure" ? <p className="cm-note" role="note">Nothing was requested and nothing was sent. A retry reuses output identity <span className="cm-hash">{outputId}</span>, so the original preparation is recovered and never duplicated.</p> : null;
}

function RequestDrawer({ d, release, ids, renew, people, taken, onClose, reload }: { d: Detail; release: Detail["releases"][number]; ids: ReturnType<typeof freshRequest>; renew: () => void; people: Person[]; taken: Request[]; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), command = useCommissioningCommand(() => { renew(); announce("Receiving request recorded. No message was sent to anyone."); reload(); }), [dirty, setDirty] = useState(false);
  const receivers = (x: Destination) => people.filter((p) => p.receiver_for.includes(x)), named = (x: Destination) => release.recipients.find((k) => k.destination === x && !taken.some((q) => q.destination === x && q.recipient_id === k.recipient_id));
  const first = destinations.find((x) => named(x)) ?? destinations.find((x) => !taken.some((q) => q.destination === x)) ?? "Service";
  const [f, setF] = useState<{ destination: Destination; recipient_id: string; purpose: string; support_owner_id: string; due: string; simulate: Delivery }>({ destination: first, recipient_id: "", purpose: named(first)?.purpose ?? "", support_owner_id: "", due: "", simulate: "Delivered" });
  const patch = (p: Partial<typeof f>) => { setDirty(true); setF((old) => ({ ...old, ...p })); };
  // Until a person is chosen, the recipient the release names for this destination is offered, then the first the policy allows.
  const recipientId = f.recipient_id || named(f.destination)?.recipient_id || receivers(f.destination)[0]?.id || "", duplicate = taken.find((q) => q.destination === f.destination && q.recipient_id === recipientId);
  const refusal = !recipientId ? "The policy names no receiver for this destination." : duplicate ? `${duplicate.recipient_name} already has a request for ${duplicate.destination_label} on this release (${duplicate.state_view.label.toLowerCase()}). A second request would be a duplicate.` : !f.purpose.trim() ? "Say what this handover is for." : null;
  const e = command.error, sent = command.state === "saved";
  return (
    <Dialog title={`Request receiving · ${revisionName(release)}`} subtitle="The server builds the exact pack from the issued release, renders it once and records the request. No message is sent to anyone." drawer busy={command.busy} dirty={dirty && !sent} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{sent ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || sent || !!refusal}
          onClick={() => void command.send(`engineering/${packageId}/commissioning/handovers`, { action: "request", ...ids, record_id: d.record.id, release_id: release.id, expected_version: d.record.version, destination: f.destination, recipient_id: recipientId, purpose: f.purpose, support_owner_id: f.support_owner_id || null, due: f.due || null, simulate_delivery: f.simulate, reason: `Receiving requested from ${text(f.destination)}` })}>
          {command.busy ? "Preparing… the server is rendering the exact pack" : e?.code === "RenderOrStorageFailure" ? "Retry with the same identities" : "Request receiving"}</button></>}>
      <CommandNotice command={command} saved="Recorded on the server. The synthetic receiver's answer is shown on the request; no message was sent to anyone." />
      <PackFailure code={e?.code} outputId={ids.output_id} renew={() => { renew(); command.clear(); }} />
      {command.busy && <p className="cm-note" role="status">The exact handover pack is being rendered and stored. This takes several seconds; nothing is recorded until it succeeds.</p>}
      <div className="mw-field-row">
        <Field label="Destination" error={fieldError(e, "destination")}><select data-autofocus value={f.destination} onChange={(x) => { const next = x.target.value as Destination; patch({ destination: next, recipient_id: "", purpose: named(next)?.purpose ?? f.purpose }); }}>{destinations.map((x) => <option key={x} value={x}>{text(x)}</option>)}</select></Field>
        <Field label="Recipient" hint="Only a person the policy names as receiver for this destination" error={fieldError(e, "recipient_id")}><select value={recipientId} onChange={(x) => patch({ recipient_id: x.target.value })}>{!receivers(f.destination).length && <option value="">The policy names no receiver here</option>}{receivers(f.destination).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      </div>
      <Field label="Purpose" error={fieldError(e, "purpose")}><input value={f.purpose} onChange={(x) => patch({ purpose: x.target.value })} maxLength={300} /></Field>
      <div className="mw-field-row">
        <Field label="Support owner (optional)" error={fieldError(e, "support_owner_id")}><select value={f.support_owner_id} onChange={(x) => patch({ support_owner_id: x.target.value })}><option value="">Not named</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Decision due (optional)" hint="Leave empty to show Date needed" error={fieldError(e, "due")}><input type="date" value={f.due} onChange={(x) => patch({ due: x.target.value })} /></Field>
      </div>
      <SyntheticBehaviour value={f.simulate} onChange={(simulate) => patch({ simulate })} />
      <Refusal reason={refusal} />
    </Dialog>
  );
}

function RequestBlock({ d, r, zone, people, archived, reload }: { d: Detail; r: Request; zone: string | null; people: Person[]; archived: string | null; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), path = `engineering/${packageId}/commissioning/handovers`;
  const { command, notice } = useAct(() => { announce("Recorded on the server. The request was read again."); reload(); });
  const [dialog, setDialog] = useState<ReceivingOutcome | "resubmit" | "cancel" | null>(null), release = d.releases.find((x) => x.id === r.release_id) ?? null, last = r.submissions.at(-1) ?? null;
  const editRefusal = archived ?? d.refusals.edit, unknown = r.state === "OutcomeUnknown" || r.state === "Unavailable", returned = r.state === "Returned" || r.state === "ClarificationRequired";
  return (
    <div className="cm-request" id={`cm-request-${r.id}`}>
      <div className="cm-request-head"><strong>{r.destination_label} · {r.recipient_name}</strong><Tag view={r.state_view} /></div>
      <div className="cm-grid">
        <Row label="Purpose">{r.purpose}</Row>
        <Row label="Support owner">{r.support_owner_name ?? "Not named"}</Row>
        <Row label="Decision due">{longDate(r.due)}</Row>
        <Row label="Release handed over">{release ? <>{revisionName(release)}{release.state !== "Issued" && <small>Now {release.state_view.label.toLowerCase()}</small>}</> : "Unavailable"}</Row>
        <Row label="Requested">{r.created_by_name}<small>{siteTime(r.created_at, zone)}</small></Row>
        <Row label="Receiver">Synthetic receiver fixture — no message was sent to anyone</Row>
      </div>
      <ol className="cm-timeline cm-submissions" aria-label={`Manifests submitted to ${r.recipient_name}`}>
        {r.submissions.map((s) => (
          <li key={s.id}>
            <div><strong>Manifest {s.number}</strong><time dateTime={s.submitted_at}>{siteTime(s.submitted_at, zone)}</time></div>
            <div className="cm-submission">
              <span className="cm-hash">{s.manifest_hash}</span>
              <span>Submitted by {s.submitted_by_name}<small className="cm-hash">Operation {s.operation_id}</small></span>
              {s.correction_note && <span>Correction: {s.correction_note}</span>}
              <span>{deliveryText[s.delivery]}{s.delivery_checked_at && <small>Checked {siteTime(s.delivery_checked_at, zone)} · synthetic receiver fixture</small>}</span>
              {s.outcome ? (
                <span><Tag view={receivingPresentation[s.outcome]} /> by {s.outcome_by_name}, {siteTime(s.outcome_at, zone)}
                  <small>Reason: {s.outcome_reason}</small>
                  {s.return_owner_name && <small>Correction owned by {s.return_owner_name}, due {longDate(s.return_due)}</small>}
                  {s.outcome_operation_id && <small className="cm-hash">Operation {s.outcome_operation_id}</small>}</span>
              ) : <span>No outcome is recorded on this manifest.</span>}
              {s.output_id && <span>OUT-13 Handover pack, exactly as submitted: <OutputLinks outputId={s.output_id} what={`the handover pack, manifest ${s.number}, to ${r.recipient_name}`} /></span>}
              {s.manifest ? <ManifestSummary m={s.manifest} open={s.id === last?.id} /> : <small>The exact manifest is for the people who prepared it and the receiver it names.</small>}
            </div>
          </li>
        ))}
      </ol>
      <div className="cm-request-actions" aria-busy={command.busy}>
        {unknown && (
          <>
            <div className="cm-act">
              <button type="button" className="mw-button mw-button-primary" disabled={command.busy || !!editRefusal} onClick={() => void command.send(path, { action: "reconcile", record_id: d.record.id, handover_id: r.id, expected_version: r.version, reason: "Original receiving request recovered with the synthetic receiver" })}>{command.busy ? "Saving…" : "Recover original request"}</button>
              <Refusal reason={editRefusal} />
            </div>
            <p className="cm-note">The original operation is looked up again with the synthetic receiver. It is never resent: one request, one identity, one manifest.</p>
          </>
        )}
        {returned && (
          <>
            <div className="cm-act">
              <button type="button" className="mw-button mw-button-primary" disabled={!!editRefusal} onClick={() => setDialog("resubmit")}>Correct and resubmit</button>
              <Refusal reason={editRefusal} />
            </div>
            <p className="cm-note">The returned manifest stays exactly as it was judged. The request keeps its identity, and the earlier decision does not carry over to the corrected manifest.</p>
          </>
        )}
        {r.state === "Requested" && (
          <div className="cm-act">
            {(["Accepted", "Returned", "ClarificationRequired"] as const).map((o) => <button key={o} type="button" className={`mw-button${o === "Accepted" ? " mw-button-primary" : ""}`} disabled={!!(archived ?? r.decide_refusal)} onClick={() => setDialog(o)}>{outcomeVerb[o]}</button>)}
            <Refusal reason={archived ?? r.decide_refusal} />
          </div>
        )}
        {r.state !== "Accepted" && (
          <div className="cm-act">
            <button type="button" className="mw-button mw-button-quiet" disabled={!!editRefusal} onClick={() => setDialog("cancel")}>Cancel request</button>
            {!unknown && !returned && <Refusal reason={editRefusal} />}
          </div>
        )}
        {r.state === "Accepted" && <p className="cm-note">Accepted by {r.recipient_name} on this exact manifest. It completes no Project, is not customer acceptance, starts no warranty and closes nothing commercial. A later change is a successor release and its own request.</p>}
        {notice}
      </div>
      {dialog === "resubmit" && <ResubmitDrawer d={d} r={r} onClose={() => setDialog(null)} reload={reload} />}
      {dialog === "cancel" && <CancelDialog d={d} r={r} onClose={() => setDialog(null)} reload={reload} />}
      {dialog && dialog !== "resubmit" && dialog !== "cancel" && <DecideDrawer d={d} r={r} first={dialog} people={people} onClose={() => setDialog(null)} reload={reload} />}
    </div>
  );
}

// What one exact manifest said when it was made. A later change is a corrected manifest, never an edit of this one.
function ManifestSummary({ m, open }: { m: Manifest; open: boolean }) {
  const yes = (v: boolean, no = "No") => (v ? "Yes" : no);
  return (
    <details className="cm-manifest" open={open || undefined}>
      <summary>Manifest summary</summary>
      <div className="cm-grid">
        <Row label="Released scope"><ul className="cm-list">{m.scope.included.map((i) => <li key={i.key}>{i.reference} — {i.title}</li>)}</ul></Row>
        <Row label="Held back">{m.scope.excluded.length ? <ul className="cm-list">{m.scope.excluded.map((x) => <li key={x.key}>{x.title}<small>{x.reason}</small></li>)}</ul> : "Nothing is held back"}</Row>
        <Row label="Tests">{m.tests.accepted} of {m.tests.checks} required checks accepted<small>{m.tests.retained_failures} earlier failed result{m.tests.retained_failures === 1 ? "" : "s"} retained in the test record</small></Row>
        <Row label="Manuals and support">{m.manuals.length ? <ul className="cm-list">{m.manuals.map((x) => <li key={x.title}>{x.title}{x.revision ? ` · ${x.revision}` : ""} <Tag view={obligationPresentation[x.state]} /></li>)}</ul> : "None recorded"}</Row>
        <Row label="Configuration backups">{m.backups.length ? <ul className="cm-list">{m.backups.map((k) => <li key={`${k.asset}:${k.configuration_version}`}>{k.asset} · {k.configuration_version}<small>Backup available: {yes(k.available)} · identity verified: {yes(k.identity_verified)} · restore verified: {yes(k.restore_verified, "Not evidenced")}</small></li>)}</ul> : "No backup reference recorded"}</Row>
        <Row label="Training">{m.training.length ? <ul className="cm-list">{m.training.map((t) => <li key={t.title}>{t.title} <Tag view={obligationPresentation[t.state]} /><small>Planned {t.planned_on ? longDate(t.planned_on) : notRecorded.toLowerCase()} · delivered {t.delivered_on ? longDate(t.delivered_on) : notRecorded.toLowerCase()} · evidence {t.evidence ?? notRecorded.toLowerCase()} · competence {t.competence ?? "not confirmed"}</small></li>)}</ul> : "No training obligation recorded"}</Row>
        <Row label="Open obligations">{m.open_obligations.length ? <ul className="cm-list">{m.open_obligations.map((x) => <li key={x.title}>{x.title} <Tag view={obligationPresentation[x.state]} /><small>{text(x.stage)} · {x.owner_name} · {x.due ? longDate(x.due) : "Date needed"}</small></li>)}</ul> : "None open when this manifest was made"}</Row>
        {m.warranty_maintenance.length > 0 && <Row label="Warranty and maintenance"><ul className="cm-list">{m.warranty_maintenance.map((w) => <li key={w.title}>{w.title}<small>{w.note}</small></li>)}</ul></Row>}
        {m.correction && <Row label="Correction">{m.correction.note}<small>Replaces manifest <span className="cm-hash">{m.correction.previous_hash}</span>, which is retained exactly as it was judged</small></Row>}
      </div>
    </details>
  );
}

function ResubmitDrawer({ d, r, onClose, reload }: { d: Detail; r: Request; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), [ids, setIds] = useState(() => ({ id: newId(), output_id: newId() })), [note, setNote] = useState(""), [simulate, setSimulate] = useState<Delivery>("Delivered");
  const command = useCommissioningCommand(() => { announce("Corrected manifest submitted. No message was sent to anyone."); reload(); }), last = r.submissions.at(-1), sent = command.state === "saved";
  return (
    <Dialog title={`Correct and resubmit · ${r.destination_label}`} subtitle="The request keeps its identity. The returned manifest stays exactly as it was judged, and the earlier decision does not carry over to the corrected one." drawer busy={command.busy} dirty={!!note && !sent} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{sent ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || sent || !note.trim()}
          onClick={() => void command.send(`engineering/${packageId}/commissioning/handovers`, { action: "resubmit", ...ids, record_id: d.record.id, handover_id: r.id, expected_version: r.version, correction_note: note, simulate_delivery: simulate, reason: `Corrected manifest submitted to ${r.destination_label}` })}>
          {command.busy ? "Preparing… the server is rendering the exact pack" : command.error?.code === "RenderOrStorageFailure" ? "Retry with the same identities" : "Submit corrected manifest"}</button></>}>
      <CommandNotice command={command} saved="Corrected manifest recorded on the server. The receiver decides it afresh; no message was sent to anyone." />
      <PackFailure code={command.error?.code} outputId={ids.output_id} renew={() => { setIds({ id: newId(), output_id: newId() }); command.clear(); }} />
      {command.busy && <p className="cm-note" role="status">The corrected pack is being rendered and stored. This takes several seconds; nothing is recorded until it succeeds.</p>}
      {last?.outcome && <p className="mw-hint">Manifest {last.number} was {receivingPresentation[last.outcome].label.toLowerCase()} by {last.outcome_by_name}: {last.outcome_reason}</p>}
      <p className="mw-hint">The corrected manifest is built on the server from the records as they stand now. Correct the records first (a manual, a backup fact, a training record); this note says what was corrected.</p>
      <Field label="What was corrected" error={fieldError(command.error, "correction_note")}><textarea data-autofocus value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} /></Field>
      <SyntheticBehaviour value={simulate} onChange={setSimulate} />
    </Dialog>
  );
}

function CancelDialog({ d, r, onClose, reload }: { d: Detail; r: Request; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), command = useCommissioningCommand(() => { announce("Receiving request cancelled."); reload(); }), [reason, setReason] = useState("");
  return (
    <Dialog title={`Cancel request · ${r.destination_label}`} subtitle={`The request to ${r.recipient_name} and every manifest submitted under it stay in history. Cancelling recalls nothing and notifies nobody.`} busy={command.busy} dirty={!!reason && command.state !== "saved"} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Keep request"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "saved" || !reason.trim()} onClick={() => void command.send(`engineering/${packageId}/commissioning/handovers`, { action: "cancel", record_id: d.record.id, handover_id: r.id, expected_version: r.version, reason })}>{command.busy ? "Saving…" : "Cancel request"}</button></>}>
      <CommandNotice command={command} saved="Cancelled on the server. The request stays in history." />
      <Field label="Why is this request no longer needed?" error={fieldError(command.error, "reason")}><textarea data-autofocus value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} /></Field>
    </Dialog>
  );
}

function DecideDrawer({ d, r, first, people, onClose, reload }: { d: Detail; r: Request; first: ReceivingOutcome; people: Person[]; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), command = useCommissioningCommand(() => { announce("Receiving outcome recorded."); reload(); }), preparers = people.filter((p) => p.preparer), last = r.submissions.at(-1);
  const [f, setF] = useState({ outcome: first, reason: "", owner_id: "", due: "" }), owned = f.outcome !== "Accepted", e = command.error, sent = command.state === "saved";
  return (
    <Dialog title={`${outcomeVerb[f.outcome]} · manifest ${last?.number ?? ""}`} subtitle="Your own decision, as the receiver this request names, on this one exact manifest." drawer busy={command.busy} dirty={!!f.reason && !sent} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{sent ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || sent || !f.reason.trim() || (owned && (!f.owner_id || !f.due))}
          onClick={() => void command.send(`engineering/${packageId}/commissioning/handovers`, { action: "decide", record_id: d.record.id, handover_id: r.id, submission_id: r.latest_submission_id, expected_version: r.latest_submission_version, outcome: f.outcome, outcome_reason: f.reason, owner_id: owned ? f.owner_id : null, due: owned ? f.due : null, reason: `Receiving outcome: ${receivingPresentation[f.outcome].label.toLowerCase()}` })}>{command.busy ? "Saving…" : "Record receiving outcome"}</button></>}>
      <CommandNotice command={command} saved="Outcome recorded on the server." />
      <p className="cm-hash">Manifest {last?.manifest_hash}</p>
      <Field label="Your outcome for this exact manifest" error={fieldError(e, "outcome")}><select value={f.outcome} onChange={(x) => setF({ ...f, outcome: x.target.value as ReceivingOutcome })}>{(["Accepted", "Returned", "ClarificationRequired"] as const).map((o) => <option key={o} value={o}>{outcomeVerb[o]}</option>)}</select></Field>
      <p className="mw-hint">{f.outcome === "Accepted" ? "Accepting records that you, for this destination, accept this exact manifest. It is not Project completion, customer acceptance, a warranty start or commercial closure, and it changes no installed-base, booking or order record. An obligation required for this stage that is still open is refused by the server, with its reason." : "A return or a request for clarification names who corrects it and by when. The manifest you judged stays exactly as it is; a corrected one is decided afresh."}</p>
      <Field label="Reason" error={fieldError(e, "outcome_reason")}><textarea data-autofocus value={f.reason} onChange={(x) => setF({ ...f, reason: x.target.value })} maxLength={2000} /></Field>
      {owned && (
        <div className="mw-field-row">
          <Field label="Who corrects it" error={fieldError(e, "owner_id")}><select value={f.owner_id} onChange={(x) => setF({ ...f, owner_id: x.target.value })}><option value="">Choose a preparer</option>{preparers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="By when" error={fieldError(e, "due")}><input type="date" value={f.due} onChange={(x) => setF({ ...f, due: x.target.value })} /></Field>
        </div>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
// Retained events, newest first. Nothing here can be edited: history is append-only, and an archived package stays readable.
function HistoryPanel({ recordId, version, zone }: { recordId: string | null; version: number; zone: string | null }) {
  const { packageId } = useCommissioning(), select = useSelect(), subject = useSearchParams().get("subject") ?? "", [limit, setLimit] = useState(100);
  const history = useRead<History>(`engineering/${packageId}/commissioning/history?${new URLSearchParams({ ...(recordId ? { record: recordId } : {}), limit: String(limit), ...(subject ? { subject } : {}) })}`);
  // Every accepted command advances the package version; the history is then read again, never patched on screen.
  const seen = useRef(version), reloadHistory = history.reload;
  useEffect(() => { if (seen.current !== version) { seen.current = version; reloadHistory(); } }, [version, reloadHistory]);
  const data = history.data, site = zone ?? data?.package.site_timezone ?? null;
  return (
    <section className="cm-panel" id="cm-panel-history" tabIndex={-1} aria-label="History" aria-busy={history.loading}>
      <header>
        <div><h3>History</h3><p>{recordId ? "Every retained event of this commissioning package" : "Every retained event of this Engineering package's commissioning work"}, newest first. History is append-only: nothing here can be edited or removed.</p></div>
        <label className="cm-history-filter"><span>Subject</span><select value={subject} onChange={(e) => select(recordId, { subject: e.target.value || null })}><option value="">All subjects</option>{data?.subjects.map((s) => <option key={s} value={s}>{text(s)}</option>)}</select></label>
      </header>
      <ReadNotice error={history.error} what="History" />
      {data && data.events.length > 0 && (
        <ol className="cm-timeline cm-history" data-stale={history.stale || undefined}>
          {data.events.map((e) => (
            <li key={e.id}>
              <time dateTime={e.created_at}>{siteTime(e.created_at, site)}</time>
              <div className="cm-submission">
                <span><strong>{e.event_label}</strong> · {text(e.subject_type)} · {e.actor_name}{!recordId && <small>{e.record_name}</small>}</span>
                <span>{e.reason}</span>
                {e.note && <span>{e.note}</span>}
                <small className="cm-hash">Operation {e.operation_id}</small>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="cm-panel-body cm-panel-foot">
        {data && !data.events.length && <p className="cm-note">No event is recorded{subject ? " for that subject" : ""}.</p>}
        {!data && history.loading && <p className="cm-note">Loading…</p>}
        {data?.has_more && (limit < 300
          ? <div className="cm-act"><button type="button" className="mw-button" disabled={history.loading} onClick={() => setLimit(Math.min(300, limit + 100))}>Show more</button><p className="cm-note">Showing the newest {data.events.length} events. Older events exist.</p></div>
          : <p className="cm-note">Showing the newest 300 events. Older events exist: choose a subject{recordId ? "" : " or a package"} to narrow the list.</p>)}
        {data && !data.has_more && data.events.length > 0 && <p className="cm-note">{data.events.length} event{data.events.length === 1 ? "" : "s"}. No older event exists{subject ? " for that subject" : ""}.</p>}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
function ArchivePanel({ d, archived, reload }: { d: Detail; archived: string | null; reload: () => void }) {
  const [open, setOpen] = useState(false), refusal = archived ?? d.refusals.edit;
  return (
    <section className="cm-panel" id="cm-panel-archive" tabIndex={-1} aria-label="Archive">
      <header><div><h3>Archive</h3><p>Archive deletes nothing and is not Project completion. The package, its outputs, its decisions and its history stay readable; nothing more is recorded on it.</p></div></header>
      <div className="cm-panel-body">
        <div className="cm-act">
          <button type="button" className="mw-button" disabled={!!refusal} onClick={() => setOpen(true)}>Archive commissioning package</button>
          <Refusal reason={refusal} />
        </div>
        <p className="cm-note">The server refuses an archive while a test attempt is a draft or in review, a defect is open, a release candidate awaits a decision or issue, or a receiving request has no accepted outcome.</p>
      </div>
      {open && <ArchiveDialog d={d} onClose={() => setOpen(false)} reload={reload} />}
    </section>
  );
}
function ArchiveDialog({ d, onClose, reload }: { d: Detail; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), command = useCommissioningCommand(() => { announce(`${d.record.reference} archived. Nothing was deleted.`); reload(); }), [reason, setReason] = useState("");
  return (
    <Dialog title={`Archive ${d.record.reference}`} subtitle="Archive deletes nothing and is not Project completion. It completes no handover, starts no warranty and closes nothing commercial." busy={command.busy} dirty={!!reason && command.state !== "saved"} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "saved" || !reason.trim()} onClick={() => void command.send(`engineering/${packageId}/commissioning`, { action: "archive", record_id: d.record.id, expected_version: d.record.version, reason })}>{command.busy ? "Saving…" : "Archive package"}</button></>}>
      <CommandNotice command={command} saved="Archived on the server. Nothing was deleted; the package stays readable under Archived in the register." />
      <Field label="Why is this commissioning package archived?" error={fieldError(command.error, "reason")}><textarea data-autofocus value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} /></Field>
    </Dialog>
  );
}
