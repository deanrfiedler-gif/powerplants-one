"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { comparisonDimensions, criterionResults, quantityText, type Criterion, type CriterionResult } from "../../model";
import type { readPeople, readSubstitutions } from "../../reads";
import { useMaterials } from "./materials-shell";
import { CommandNotice, Dialog, Field, fieldError, Icon, ReadNotice, Reason, Status, dateText, stampText, text, toneFor, useMaterialsCommand, useRead } from "./materials-ui";

type Data = Awaited<ReturnType<typeof readSubstitutions>>;
type Proposal = Data["items"][number];
type People = Awaited<ReturnType<typeof readPeople>>;

// A substitution is a proposal against one exact requirement and one exact candidate. There is no score: a percentage
// can hide a failed mandatory criterion. Accepting it here creates no catalogue-wide compatibility.
export function SubstitutionsView() {
  const { packageId, setId, reloadFrame, href } = useMaterials(), router = useRouter(), path = usePathname(), search = useSearchParams();
  const chosen = search.get("substitution");
  const read = useRead<Data>(`engineering/${packageId}/materials/substitutions${setId ? `?set=${setId}` : ""}`);
  const [proposing, setProposing] = useState<Proposal | "new" | null>(null), data = read.data;
  const selected = data?.items.find((s) => s.id === chosen) ?? data?.items.find((s) => !s.has_successor) ?? null;
  const open = (id: string) => { const q = new URLSearchParams(search.toString()); q.set("substitution", id); router.replace(`${path}?${q}`, { scroll: false }); };
  const changed = () => { read.reload(); reloadFrame(); };
  return (
    <div className="em-page" aria-busy={read.loading}>
      <div className="em-page-head">
        <h2>Substitution review</h2>
        <span className="mw-spacer" />
        {data?.can.edit && <button type="button" className="mw-button" onClick={() => setProposing("new")} disabled={!data.lines.length}><Icon name="plus" /><span>Propose alternate</span></button>}
        <p>Each proposal compares one specified item with one candidate, criterion by criterion. A failed, unknown or set-aside mandatory criterion blocks a positive decision, and the person who proposed or authored the content never decides it.</p>
      </div>
      <ReadNotice error={read.error} what="Substitution review" />
      {data && !data.items.length && <div className="em-empty"><strong>No alternates have been proposed</strong><p>Propose one against a line when a different product is offered.</p></div>}
      {data && !!data.items.length && (
        <div className="em-two">
          <section className="em-panel" aria-label="Proposals">
            <ul className="em-list">
              {data.items.map((s) => (
                <li key={s.id} data-current={s.id === selected?.id || undefined}>
                  <div>
                    <button type="button" className="em-list-open" onClick={() => open(s.id)} aria-current={s.id === selected?.id}>
                      <strong>Line {s.line_number} · {s.original_code} → {s.candidate_code}</strong>
                      <p>{s.line_description} · proposed by {s.proposer_name}{s.predecessor_id ? " · corrected successor" : ""}{s.has_successor ? " · superseded by its successor" : ""}</p>
                    </button>
                  </div>
                  <Status tone={toneFor(s.state)}>{text(s.state)}</Status>
                </li>
              ))}
            </ul>
          </section>
          {selected && <Detail key={`${selected.id}:${selected.version}`} s={selected} data={data} changed={changed} edit={() => setProposing(selected)} registerHref={href("register", { line: selected.line_id })} />}
        </div>
      )}
      {proposing && data && <ProposalForm existing={proposing === "new" ? null : proposing} data={data} onClose={() => setProposing(null)} onSaved={(id) => { changed(); open(id); }} />}
    </div>
  );
}

function Detail({ s, data, changed, edit, registerHref }: { s: Proposal; data: Data; changed: () => void; edit: () => void; registerHref: string }) {
  const { packageId } = useMaterials(), command = useMaterialsCommand(changed), people = useRead<People>(`engineering/${packageId}/materials/people`);
  const [decision, setDecision] = useState({ result: "Accepted", rationale: "", owner_id: "", due: "" }), [commercial, setCommercial] = useState({ state: "Decided", note: "", source: "" });
  const send = (fields: Record<string, unknown>) => void command.send(`engineering/${packageId}/materials/substitutions`, { substitution_id: s.id, expected_version: s.version, ...fields });
  const decidable = ["Submitted", "Held"].includes(s.state), positiveBlocked = decision.result === "Accepted" && s.acceptance_blockers.length > 0;
  return (
    <section className="em-panel" aria-label="Comparison">
      <div className="em-panel-head">
        <h3>Line {s.line_number} · {s.line_description}</h3>
        <Status tone={toneFor(s.state)}>{text(s.state)}</Status>
        <span className="mw-spacer" />
        <Link className="mw-link" href={registerHref}>Open in register <Icon name="arrow-right" /></Link>
      </div>
      <div className="em-panel-body">
        <div className="em-compare">
          <div><span>Specified</span><strong>{s.original_code}</strong><small>{s.original_description} · line content revision {s.line_content_revision}</small></div>
          <Icon name="arrow-right" />
          <div><span>Proposed alternate</span><strong>{s.candidate_code}</strong><small>{s.candidate_description} · {s.candidate_manufacturer} · {s.candidate_revision}</small></div>
        </div>
        <dl className="em-facts" style={{ marginTop: 12 }}>
          <div><dt>Reason</dt><dd>{s.proposal_reason}</dd></div>
          <div><dt>Scope</dt><dd>{s.unit ? quantityText(s.scope_quantity, s.unit) : s.scope_quantity} · {s.location}</dd></div>
          <div><dt>Proposed by</dt><dd>{s.proposer_name}{s.submitted_at ? ` · submitted ${stampText(s.submitted_at)}` : " · not submitted"}</dd></div>
        </dl>
        <h3>Technical comparison</h3>
        <dl className="em-criteria">
          {s.criteria.map((k) => (
            <div key={k.key}>
              <dt>{k.label}{k.mandatory && <span className="em-mandatory"> · mandatory</span>}{k.evidence && <small className="em-cell-sub">Evidence: {k.evidence}</small>}{k.note && <small className="em-cell-sub">{k.note}</small>}</dt>
              <dd><Status tone={toneFor(k.result)}>{text(k.result)}</Status></dd>
            </div>
          ))}
        </dl>
        {s.impacts.length > 0 && <><h3>Impact preview</h3><ul className="em-reasons">{s.impacts.map((i, n) => <li key={n}><strong>{i.area}:</strong> {i.effect} Owner: {i.owner}.</li>)}</ul><p className="em-cell-sub">The broader technical change process remains with EN-07; this is the substitution&rsquo;s own preview.</p></>}
        <h3>Commercial and scope decision</h3>
        <div className="em-pair"><span>State</span><Status tone={toneFor(s.commercial_state)}>{text(s.commercial_state)}</Status></div>
        {s.commercial_owner_name && <div className="em-pair"><span>Owner</span><strong>{s.commercial_owner_name}</strong></div>}
        {s.commercial_note && <div className="em-pair"><span>Decision</span><strong>{s.commercial_note} ({s.commercial_decided_by_name}, {stampText(s.commercial_decided_at)})</strong></div>}
        {s.commercial_state === "DecisionNeeded" && (data.can.commercial ? (
          <div className="mw-field-row" style={{ marginTop: 8 }}>
            <Field label="Commercial decision"><select value={commercial.state} onChange={(e) => setCommercial({ ...commercial, state: e.target.value })}><option value="Decided">Decided: effect accepted by its owner</option><option value="NoEffectConfirmed">No commercial effect confirmed</option></select></Field>
            <Field label="Decision and basis"><input value={commercial.note} onChange={(e) => setCommercial({ ...commercial, note: e.target.value })} /></Field>
            <div className="em-actions"><button type="button" className="mw-button" disabled={command.busy || !commercial.note.trim()} onClick={() => send({ action: "commercial", reason: "Commercial decision recorded by its owner", commercial_state: commercial.state, commercial_note: commercial.note, commercial_source_id: commercial.source || null })}>Record commercial decision</button></div>
          </div>
        ) : <Reason>The commercial coordinator decides this. Technical acceptance does not settle it, and a technical reviewer cannot mark it not applicable on their behalf.</Reason>)}
        {s.decided_at && <><h3>Technical decision</h3><div className="em-pair"><span>{text(s.state)} by</span><strong>{s.decided_by_name} · {stampText(s.decided_at)} · policy v{s.policy_version}</strong></div><div className="em-pair"><span>Rationale</span><strong>{s.decision_rationale}</strong></div>{s.decision_owner_name && <div className="em-pair"><span>Next</span><strong>{s.decision_owner_name} · due {dateText(s.decision_due)}</strong></div>}</>}
        {s.adopted_at && <p className="em-saved">Adopted into line content revision {s.adopted_content_revision} on {stampText(s.adopted_at)}. The original requirement is retained in the earlier revision.</p>}
        {s.stale && <p className="mw-notice mw-notice-attention">The line changed after this comparison was submitted. Its decision cannot authorise the changed content.</p>}
        <CommandNotice command={command} />
        <div className="em-actions" style={{ marginTop: 12 }}>
          {s.state === "Draft" && data.can.edit && <><button type="button" className="mw-button" onClick={edit}>Edit comparison</button><button type="button" className="mw-button mw-button-primary" disabled={command.busy} onClick={() => send({ action: "submit", reason: "Comparison submitted for independent review" })}>Submit for review</button></>}
          {s.state === "Returned" && !s.has_successor && data.can.edit && <button type="button" className="mw-button mw-button-primary" disabled={command.busy} onClick={() => send({ action: "successor", reason: "Corrected successor started after return", id: crypto.randomUUID() })}>Create corrected successor</button>}
          {s.state === "Accepted" && !s.adopted_at && data.can.edit && <button type="button" className="mw-button mw-button-primary" disabled={command.busy || s.stale} onClick={() => send({ action: "adopt", reason: "Accepted alternate adopted into the requirement" })}>Adopt into the line</button>}
        </div>
        {decidable && (
          <fieldset className="mw-fieldset" style={{ marginTop: 16 }} disabled={!!s.decision_refusal || command.busy}>
            <legend>Independent technical decision</legend>
            {s.decision_refusal && <Reason>{s.decision_refusal}</Reason>}
            <div className="mw-field-row">
              <Field label="Decision"><select value={decision.result} onChange={(e) => setDecision({ ...decision, result: e.target.value })}><option value="Accepted">Accept technical comparison</option><option value="Returned">Return for correction</option><option value="Held">Hold on a named dependency</option><option value="Rejected">Reject candidate</option></select></Field>
              {["Returned", "Held"].includes(decision.result) && <>
                <Field label="Who acts next" error={fieldError(command.error, "owner_id")}><select value={decision.owner_id} onChange={(e) => setDecision({ ...decision, owner_id: e.target.value })}><option value="">Choose a person</option>{people.data?.items.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
                <Field label="By when"><input type="date" value={decision.due} onChange={(e) => setDecision({ ...decision, due: e.target.value })} /></Field>
              </>}
            </div>
            <Field label="Rationale"><textarea value={decision.rationale} onChange={(e) => setDecision({ ...decision, rationale: e.target.value })} /></Field>
            {positiveBlocked && <><Reason>This comparison cannot be accepted yet:</Reason><ul className="em-blockers">{s.acceptance_blockers.map((b) => <li key={b}>{b}</li>)}</ul></>}
            <button type="button" className="mw-button mw-button-primary" disabled={positiveBlocked || !decision.rationale.trim()} onClick={() => send({ action: "decide", reason: "Independent technical decision recorded", result: decision.result, rationale: decision.rationale, owner_id: decision.owner_id || null, due: decision.due || null })}>Record decision</button>
          </fieldset>
        )}
      </div>
    </section>
  );
}

function ProposalForm({ existing, data, onClose, onSaved }: { existing: Proposal | null; data: Data; onClose: () => void; onSaved: (id: string) => void }) {
  const { packageId } = useMaterials(), people = useRead<People>(`engineering/${packageId}/materials/people`);
  const [id] = useState(() => existing?.id ?? crypto.randomUUID()), command = useMaterialsCommand(() => onSaved(id));
  const [f, setF] = useState({
    line_id: existing?.line_id ?? data.lines[0]?.id ?? "", code: existing?.candidate_code ?? "", description: existing?.candidate_description ?? "", manufacturer: existing?.candidate_manufacturer ?? "",
    revision: existing?.candidate_revision ?? "", item_key: existing?.candidate_item_key ?? "", reason: existing?.proposal_reason ?? "", quantity: existing?.scope_quantity ?? "",
    commercial: existing?.commercial_state === "DecisionNeeded" ? "DecisionNeeded" : "NotAssessed", commercial_owner: existing?.commercial_owner_id ?? "",
  });
  const [criteria, setCriteria] = useState<Criterion[]>(() => existing?.criteria ?? comparisonDimensions.slice(0, 4).map(([key, label]) => ({ key, label, mandatory: true, result: "EvidenceNeeded" as CriterionResult, note: null, evidence: null })));
  const line = data.lines.find((l) => l.id === f.line_id), unused = comparisonDimensions.filter(([key]) => !criteria.some((c) => c.key === key));
  const patch = (i: number, change: Partial<Criterion>) => setCriteria((old) => old.map((c, n) => (n === i ? { ...c, ...change } : c)));
  const submit = () => void command.send(`engineering/${packageId}/materials/substitutions`, {
    ...(existing ? { action: "update", substitution_id: existing.id, expected_version: existing.version } : { action: "propose", id, line_id: f.line_id }),
    reason: existing ? "Draft comparison updated" : "Alternate proposed against the exact requirement", candidate_code: f.code, candidate_description: f.description, candidate_manufacturer: f.manufacturer,
    candidate_revision: f.revision, candidate_item_key: f.item_key.trim() || null, proposal_reason: f.reason, scope_quantity: (f.quantity || line?.quantity || "").trim(),
    criteria: criteria.map((c) => ({ ...c, note: c.note?.trim() || null, evidence: c.evidence?.trim() || null })), impacts: existing?.impacts ?? [], commercial_state: f.commercial, commercial_owner_id: f.commercial === "DecisionNeeded" ? f.commercial_owner || null : null,
  });
  const err = (n: string) => fieldError(command.error, n);
  return (
    <Dialog title={existing ? "Edit draft comparison" : "Propose an alternate"} subtitle="The author classes which criteria are mandatory; the independent reviewer confirms that classing and the evidence." wide busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button><button type="button" className="mw-button mw-button-primary" onClick={submit} disabled={command.busy || command.state === "unknown"}>Save draft</button></>}>
      <CommandNotice command={command} saved="Draft saved to the server. Submit it from the comparison when it is ready for review." />
      <div className="mw-field-row">
        <Field label="Line" error={err("line_id")}><select data-autofocus value={f.line_id} disabled={!!existing} onChange={(e) => setF({ ...f, line_id: e.target.value })}>{existing && <option value={existing.line_id}>{existing.line_number} · {existing.line_description}</option>}{data.lines.map((l) => <option key={l.id} value={l.id}>{l.line_number} · {l.description} ({l.product_ref ?? l.model ?? "no product identity"})</option>)}</select></Field>
        <div className="mw-field-short"><Field label={`Quantity covered${line ? ` (${line.unit})` : ""}`} error={err("scope_quantity")}><input inputMode="decimal" placeholder={line?.quantity} value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} /></Field></div>
      </div>
      <div className="mw-field-row">
        <Field label="Candidate code" error={err("candidate_code")}><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
        <Field label="Readable model description" error={err("candidate_description")}><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Manufacturer" error={err("candidate_manufacturer")}><input value={f.manufacturer} onChange={(e) => setF({ ...f, manufacturer: e.target.value })} /></Field>
        <div className="mw-field-short"><Field label="Candidate revision" error={err("candidate_revision")}><input value={f.revision} onChange={(e) => setF({ ...f, revision: e.target.value })} /></Field></div>
      </div>
      <Field label="Why is an alternate proposed?" error={err("proposal_reason")}><textarea value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
      <h3>Comparison criteria</h3>
      {criteria.map((c, i) => (
        <div className="mw-field-row" key={c.key}>
          <Field label={c.label}><select value={c.result} onChange={(e) => patch(i, { result: e.target.value as CriterionResult })}>{criterionResults.map((r) => <option key={r} value={r}>{text(r)}</option>)}</select></Field>
          <Field label="Exact evidence"><input value={c.evidence ?? ""} onChange={(e) => patch(i, { evidence: e.target.value })} /></Field>
          <Field label={c.result === "NotApplicable" ? "Reason it does not apply" : "Note"}><input value={c.note ?? ""} onChange={(e) => patch(i, { note: e.target.value })} /></Field>
          <div className="em-actions"><label className="mw-choice"><input type="checkbox" checked={c.mandatory} onChange={(e) => patch(i, { mandatory: e.target.checked })} /><span>Mandatory</span></label><button type="button" className="mw-button mw-button-quiet" onClick={() => setCriteria(criteria.filter((_, n) => n !== i))} disabled={criteria.length === 1}>Remove</button></div>
        </div>
      ))}
      {unused.length > 0 && <Field label="Add a criterion"><select value="" onChange={(e) => { const found = unused.find(([k]) => k === e.target.value); if (found) setCriteria([...criteria, { key: found[0], label: found[1], mandatory: false, result: "EvidenceNeeded", note: null, evidence: null }]); }}><option value="">Choose a dimension</option>{unused.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>}
      <div className="mw-field-row">
        <Field label="Commercial or scope effect" hint="Engineering may say it is not assessed or that a decision is needed. Only the commercial owner can say there is none."><select value={f.commercial} onChange={(e) => setF({ ...f, commercial: e.target.value })}><option value="NotAssessed">Not assessed</option><option value="DecisionNeeded">Decision needed</option></select></Field>
        {f.commercial === "DecisionNeeded" && <Field label="Commercial decision owner" error={err("commercial_owner_id")}><select value={f.commercial_owner} onChange={(e) => setF({ ...f, commercial_owner: e.target.value })}><option value="">Choose the commercial coordinator</option>{people.data?.items.filter((u) => u.commercial).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>}
      </div>
    </Dialog>
  );
}
