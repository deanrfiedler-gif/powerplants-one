"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { quantityText, releasePurposes, type ReleasePurpose } from "../../model";
import type { readPeople, readReleases } from "../../reads";
import { useMaterials } from "./materials-shell";
import { CommandNotice, Dialog, Field, fieldError, Icon, ReadNotice, Reason, Status, dateText, revisionText, stampText, text, toneFor, useMaterialsCommand, useRead } from "./materials-ui";

type Data = Awaited<ReturnType<typeof readReleases>>;
type Release = Data["items"][number];
type People = Awaited<ReturnType<typeof readPeople>>;

// Review, authorisation and issue are three operations by different people on one frozen manifest. A technical release
// confirms an Engineering material basis for a stated scope. It never approves spending, places an order or authorises installation.
export function ReleasesView() {
  const { packageId, setId, reloadFrame, selection, setSelection, href } = useMaterials(), router = useRouter(), path = usePathname(), search = useSearchParams();
  const base = `engineering/${packageId}/materials/releases`, chosen = search.get("release"), preparing = search.get("prepare") === "1";
  const read = useRead<Data>(`${base}${setId ? `?set=${setId}` : ""}`), data = read.data;
  const go = (changes: Record<string, string | null>) => { const q = new URLSearchParams(search.toString()); for (const [k, v] of Object.entries(changes)) if (v) q.set(k, v); else q.delete(k); router.replace(`${path}${q.toString() ? `?${q}` : ""}`, { scroll: false }); };
  const changed = () => { read.reload(); reloadFrame(); };
  const selected = data?.items.find((r) => r.id === chosen) ?? data?.items[0] ?? null;
  return (
    <div className="em-page" aria-busy={read.loading}>
      <div className="em-page-head">
        <h2>Review &amp; release</h2>
        <span className="mw-spacer" />
        {data?.can.edit && data.set && <button type="button" className="mw-button mw-button-primary" onClick={() => go({ prepare: "1" })}>Prepare release set</button>}
        <p>A release freezes the exact lines, quantities, sources and exclusions it covers. It is reviewed by someone independent, then authorised and issued by the material release authority. A partial release is allowed only for a scope that works on its own; what is left out is listed with its reason and owner.</p>
      </div>
      <ReadNotice error={read.error} what="Review and release" />
      {data && !data.policy.configured && <p className="mw-notice mw-notice-attention"><strong>Authority not configured.</strong> No review and release policy covers this company and site, so nothing can be reviewed, authorised or issued here. Preparing and inspecting a set still works.</p>}
      {data && !data.items.length && <div className="em-empty"><strong>No release set has been prepared</strong><p>Tick lines in the materials register, or prepare a set here.</p></div>}
      {data && !!data.items.length && (
        <div className="em-two">
          <section className="em-panel" aria-label="Release sets">
            <ul className="em-list">
              {data.items.map((r) => (
                <li key={r.id} data-current={r.id === selected?.id || undefined}>
                  <div>
                    <button type="button" className="em-list-open" onClick={() => go({ release: r.id })} aria-current={r.id === selected?.id}>
                      <strong>Release {r.release_number} · set {data.set?.code} {revisionText(r.set_revision)}</strong>
                      <p>{text(r.purpose)} · {r.manifest.lines.length} line{r.manifest.lines.length === 1 ? "" : "s"} · prepared by {r.prepared_by_name}</p>
                    </button>
                  </div>
                  <Status tone={toneFor(r.issue_state === "Prepared" ? r.review_state : r.current_use === "EligibleForPurpose" ? "Issued" : r.current_use)}>{r.issue_state === "Issued" ? text(r.current_use === "EligibleForPurpose" ? "Issued" : r.current_use) : r.issue_state === "Authorised" && r.review_state !== "Cancelled" ? "Authorised" : text(r.review_state)}</Status>
                </li>
              ))}
            </ul>
          </section>
          {selected && <ReleaseDetail key={`${selected.id}:${selected.version}`} r={selected} data={data} changed={changed} handoverHref={href("handover", { prepare: selected.id })} successor={() => go({ prepare: "1", predecessor: selected.id })} />}
        </div>
      )}
      {preparing && data?.set && <PrepareDialog data={data} setId={data.set.id} base={base} initial={selection} predecessor={search.get("predecessor")} onClose={() => go({ prepare: null, predecessor: null })} onSaved={(id) => { setSelection({}); changed(); go({ prepare: null, predecessor: null, release: id }); }} />}
    </div>
  );
}

function PrepareDialog({ data, setId, base, initial, predecessor, onClose, onSaved }: { data: Data; setId: string; base: string; initial: Record<string, string>; predecessor: string | null; onClose: () => void; onSaved: (id: string) => void }) {
  const [id] = useState(() => crypto.randomUUID()), command = useMaterialsCommand(() => onSaved(id));
  const [picked, setPicked] = useState<Record<string, string>>(initial), [purpose, setPurpose] = useState<ReleasePurpose>("TechnicalReleaseForProcurement"), [audience, setAudience] = useState("Supply Chain coordination");
  const chosen = useMemo(() => Object.entries(picked).filter(([, q]) => q.trim()).map(([line_id, quantity]) => ({ line_id, quantity: quantity.trim() })), [picked]);
  // The preview is the server's own rule, asked again whenever the scope settles. Nothing is decided in the browser.
  const [settled, setSettled] = useState(chosen);
  useEffect(() => { const t = setTimeout(() => setSettled(chosen), 350); return () => clearTimeout(t); }, [chosen]);
  const valid = settled.every((s) => /^\d{1,12}(\.\d{1,6})?$/.test(s.quantity) && Number(s.quantity) > 0);
  const preview = useRead<Data>(settled.length && valid ? `${base}?set=${setId}&purpose=${purpose}&selection=${encodeURIComponent(JSON.stringify(settled))}` : null).data?.preview;
  const structural = preview?.blockers.filter((b) => ["EmptyScope", "UnknownLine", "DuplicateLine", "InvalidQuantity", "OverAllocation", "KitContent", "DependencySplit"].includes(b.code)) ?? [];
  return (
    <Dialog title={predecessor ? "Prepare a successor release set" : "Prepare release set"} subtitle="Selecting a line is not releasing it. The set is frozen when prepared and has no effect until it is reviewed, authorised and issued." wide busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "unknown" || !chosen.length || !valid || structural.length > 0 || !audience.trim()} onClick={() => void command.send(base, { action: "prepare", reason: "Release set prepared and frozen", id, set_id: setId, purpose, audience, selection: chosen, predecessor_id: predecessor })}>Prepare and freeze this set</button></>}>
      <CommandNotice command={command} />
      <div className="mw-field-row">
        <Field label="Output purpose"><select value={purpose} onChange={(e) => setPurpose(e.target.value as ReleasePurpose)}>{releasePurposes.map((p) => <option key={p} value={p}>{text(p)}</option>)}</select></Field>
        <Field label="Intended receiving audience" error={fieldError(command.error, "audience")}><input value={audience} onChange={(e) => setAudience(e.target.value)} /></Field>
      </div>
      <div className="em-panel">
        <div className="em-table-scroll">
          <table className="em-table">
            <caption className="mw-sr">Lines of this material set and the quantity of each to include</caption>
            <thead><tr><th scope="col" className="em-col-check"><span className="mw-sr">Include</span></th><th scope="col">Line</th><th scope="col">Material requirement</th><th scope="col">Remaining</th><th scope="col">Release qty</th><th scope="col">Readiness</th><th scope="col">Group</th></tr></thead>
            <tbody>
              {data.lines.map((l) => {
                const on = l.id in picked, none = l.remaining === "0";
                return (
                  <tr key={l.id} data-selected={on || undefined}>
                    <td className="em-col-check"><input type="checkbox" aria-label={`Include line ${l.line_number}, ${l.description}`} checked={on} disabled={none || l.locked} onChange={() => setPicked((old) => { const next = { ...old }; if (on) delete next[l.id]; else next[l.id] = l.remaining; return next; })} /></td>
                    <td>{l.line_number}</td>
                    <td><strong>{l.description}</strong><span className="em-cell-sub">{l.location}{l.locked ? " · in a set under review" : ""}</span></td>
                    <td className="em-col-quantity">{quantityText(l.remaining, l.unit)}</td>
                    <td>{on ? <input className="em-quantity-input" aria-label={`Release quantity for line ${l.line_number} in ${l.unit}`} inputMode="decimal" value={picked[l.id]} onChange={(e) => setPicked({ ...picked, [l.id]: e.target.value })} /> : <span className="mw-muted">–</span>}</td>
                    <td><Status tone={l.readiness.tone}>{l.readiness.label}</Status></td>
                    <td>{l.dependency_group ?? <span className="mw-muted">Independent</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {preview && preview.blockers.length > 0 && <><h3>What stops this scope now</h3><ul className="em-blockers">{preview.blockers.map((b, i) => <li key={i}>{b.message}</li>)}</ul>
        {!structural.length && <Reason>The set can be prepared and inspected with these open. It cannot be submitted, reviewed positively, authorised or issued until they are cleared.</Reason>}</>}
      {preview && !preview.blockers.length && <p className="em-saved">Nothing blocks this exact scope at the moment. It still needs independent review and release authority.</p>}
      {preview && preview.exclusions.length > 0 && <><h3>Left out of this release</h3><ul className="em-reasons">{preview.exclusions.map((x) => <li key={x.line_id}>Line {x.line_number} · {quantityText(x.remaining_quantity, x.unit)} · {x.reason} Owner: {x.owner}.</li>)}</ul></>}
    </Dialog>
  );
}

function ReleaseDetail({ r, data, changed, handoverHref, successor }: { r: Release; data: Data; changed: () => void; handoverHref: string; successor: () => void }) {
  const { packageId, setId } = useMaterials(), base = `engineering/${packageId}/materials/releases`, command = useMaterialsCommand(changed);
  const [dialog, setDialog] = useState<"review" | "issue" | "withdraw" | null>(null), authority = data.authority.find((a) => a.release_id === r.id);
  const send = (action: string, reason: string, extra: Record<string, unknown> = {}, options = {}) => command.send(base, { action, reason, release_id: r.id, expected_version: r.version, ...extra }, options);
  const live = r.issue_state !== "Issued" && !["Cancelled", "Returned"].includes(r.review_state), blocked = r.blockers.length > 0;
  return (
    <section className="em-panel" aria-label={`Release ${r.release_number}`}>
      <div className="em-panel-head">
        <h3>Release {r.release_number} · {text(r.purpose)}</h3>
        <span className="mw-spacer" />
        <a className="mw-link" href={`/api/v1/${base}`.replace("/releases", "/export") + `?kind=release&release_id=${r.id}${setId ? `&set=${setId}` : ""}`}><Icon name="download" /> Manifest (CSV)</a>
      </div>
      <div className="em-panel-body">
        {/* Separate families, shown separately: review, the issue operation, and whether it may still be relied on today. */}
        <dl className="em-facts">
          <div><dt>Technical review</dt><dd><Status tone={toneFor(r.review_state)}>{text(r.review_state)}</Status></dd></div>
          <div><dt>Release operation</dt><dd><Status tone={toneFor(r.issue_state)}>{text(r.issue_state)}</Status></dd></div>
          <div><dt>Current use</dt><dd><Status tone={toneFor(r.current_use)}>{text(r.current_use)}</Status></dd></div>
          <div><dt>Audience</dt><dd>{r.audience}</dd></div>
        </dl>
        {r.current_use_reasons.length > 0 && <ul className="em-blockers">{r.current_use_reasons.map((x) => <li key={x}>{x}</li>)}</ul>}
        <h3>Included</h3>
        <ul className="em-reasons">{r.manifest.lines.map((l) => <li key={l.line_id}>Line {l.line_number} · {l.description} · <strong>{quantityText(l.quantity, l.unit)}</strong> of {quantityText(l.requirement_quantity, l.unit)} · content revision {l.content_revision}{l.procurement ? ` · procure ${quantityText(l.procurement.quantity, l.procurement.unit)}` : ""}{l.substitution ? ` · adopted alternate ${l.substitution.candidate_code}` : ""}</li>)}</ul>
        {r.manifest.exclusions.length > 0 && <><h3>Excluded and held</h3><ul className="em-reasons">{r.manifest.exclusions.map((x) => <li key={x.line_id}>Line {x.line_number} · {quantityText(x.remaining_quantity, x.unit)} · {x.reason} Owner: {x.owner}.</li>)}</ul></>}
        <h3>Exact sources</h3>
        <ul className="em-reasons">{r.manifest.sources.map((s) => <li key={s.id}>{s.reference} revision {s.revision} · file {s.file_version} · {text(s.permitted_purpose)} · observed {dateText(s.observed_at)}</li>)}</ul>
        <p className="em-hash">Content hash {r.content_hash}</p>
        <ol className="em-timeline" style={{ marginTop: 10 }}>
          <li><strong>Prepared</strong><p>{r.prepared_by_name} · {stampText(r.prepared_at)}</p></li>
          {r.submitted_at && <li><strong>Submitted for review</strong><p>{stampText(r.submitted_at)}</p></li>}
          {r.reviewed_at && <li><strong>{text(r.review_state === "Cancelled" ? "TechnicallyReviewed" : r.review_state)}</strong><p>{r.reviewed_by_name} · {stampText(r.reviewed_at)} · policy v{r.policy_version}. {r.review_rationale}{r.review_owner_name ? ` Next: ${r.review_owner_name}, due ${dateText(r.review_due)}.` : ""}</p></li>}
          {r.authorised_at && <li><strong>Authorised</strong><p>{r.authorised_by_name} · {stampText(r.authorised_at)}</p></li>}
          {r.issued_at && <li><strong>Issued</strong><p>{r.issued_by_name} · {stampText(r.issued_at)} · original operation {r.issue_operation_id}</p></li>}
          {r.withdrawn_at && <li><strong>Current use withdrawn</strong><p>{r.withdrawn_by_name} · {stampText(r.withdrawn_at)}. {r.withdrawn_reason}</p></li>}
        </ol>
        {live && blocked && <><h3>What stops this set now</h3><ul className="em-blockers">{r.blockers.map((b, i) => <li key={i}>{b.message}</li>)}</ul></>}
        <CommandNotice command={command} />
        <div className="em-actions" style={{ marginTop: 12 }}>
          {r.review_state === "Draft" && r.issue_state === "Prepared" && data.can.edit && <button type="button" className="mw-button mw-button-primary" disabled={command.busy || blocked} onClick={() => void send("submit", "Release set submitted for independent review")}>Submit for review</button>}
          {["Submitted", "Held"].includes(r.review_state) && r.issue_state === "Prepared" && <button type="button" className="mw-button mw-button-primary" disabled={!!authority?.review_refusal} onClick={() => setDialog("review")}>Review this set</button>}
          {r.review_state === "TechnicallyReviewed" && r.issue_state === "Prepared" && <button type="button" className="mw-button mw-button-primary" disabled={command.busy || blocked || !!authority?.release_refusal} onClick={() => void send("authorise", "Exact reviewed set authorised for issue")}>Authorise this exact set</button>}
          {r.issue_state === "Authorised" && r.review_state !== "Cancelled" && <button type="button" className="mw-button mw-button-primary" disabled={blocked || !!authority?.release_refusal} onClick={() => setDialog("issue")}>Issue technical release</button>}
          {r.issue_state === "Issued" && r.current_use === "EligibleForPurpose" && data.can.edit && <Link className="mw-button" href={handoverHref}>Prepare supply handover</Link>}
          {r.issue_state === "Issued" && !r.withdrawn_at && !r.superseded_by && <button type="button" className="mw-button" disabled={!!authority?.release_refusal} onClick={() => setDialog("withdraw")}>Withdraw current use</button>}
          {(["Returned", "Cancelled"].includes(r.review_state) || (r.issue_state === "Issued" && !r.withdrawn_at && !r.superseded_by)) && data.can.edit && <button type="button" className="mw-button" onClick={successor}>Prepare successor</button>}
          {live && (data.can.edit || data.can.release) && <button type="button" className="mw-button mw-button-quiet" disabled={command.busy} onClick={() => void send("cancel", "Release set cancelled before issue")}>Cancel this set</button>}
        </div>
        {["Submitted", "Held"].includes(r.review_state) && r.issue_state === "Prepared" && <Reason>{authority?.review_refusal}</Reason>}
        {((r.review_state === "TechnicallyReviewed" && r.issue_state !== "Issued") || (r.issue_state === "Issued" && !r.withdrawn_at)) && <Reason>{authority?.release_refusal}</Reason>}
        {r.review_state === "Draft" && blocked && <Reason>The set cannot be submitted while something stops it. Clear the items above, or cancel it and prepare a different scope.</Reason>}
      </div>
      {dialog === "review" && <ReviewDialog r={r} blocked={blocked} onClose={() => setDialog(null)} changed={changed} />}
      {dialog === "issue" && <IssueDialog r={r} onClose={() => setDialog(null)} changed={changed} />}
      {dialog === "withdraw" && <WithdrawDialog r={r} onClose={() => setDialog(null)} changed={changed} />}
    </section>
  );
}

function ReviewDialog({ r, blocked, onClose, changed }: { r: Release; blocked: boolean; onClose: () => void; changed: () => void }) {
  const { packageId } = useMaterials(), command = useMaterialsCommand(changed), people = useRead<People>(`engineering/${packageId}/materials/people`);
  const [f, setF] = useState({ result: blocked ? "Returned" : "Accepted", rationale: "", owner_id: "", due: "" });
  return (
    <Dialog title={`Review release ${r.release_number}`} subtitle="You are reviewing this exact frozen manifest. Accepting it records technical suitability only." busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "saved" || !f.rationale.trim() || (f.result === "Accepted" && blocked) || (f.result !== "Accepted" && (!f.owner_id || !f.due))}
          onClick={() => void command.send(`engineering/${packageId}/materials/releases`, { action: "review", reason: "Independent technical review recorded", release_id: r.id, expected_version: r.version, result: f.result, rationale: f.rationale, owner_id: f.result === "Accepted" ? null : f.owner_id, due: f.result === "Accepted" ? null : f.due })}>Record review</button></>}>
      <CommandNotice command={command} saved="Review recorded on the server." />
      <Field label="Result"><select data-autofocus value={f.result} onChange={(e) => setF({ ...f, result: e.target.value })}><option value="Accepted" disabled={blocked}>Accept technical content{blocked ? " (blocked)" : ""}</option><option value="Returned">Return for correction</option><option value="Held">Hold on a named dependency</option></select></Field>
      {blocked && <Reason>This set cannot be accepted while something stops it. It can be returned or held.</Reason>}
      <Field label="Rationale"><textarea value={f.rationale} onChange={(e) => setF({ ...f, rationale: e.target.value })} /></Field>
      {f.result !== "Accepted" && <div className="mw-field-row">
        <Field label="Who acts next" error={fieldError(command.error, "owner_id")}><select value={f.owner_id} onChange={(e) => setF({ ...f, owner_id: e.target.value })}><option value="">Choose a person</option>{people.data?.items.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="By when"><input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
      </div>}
    </Dialog>
  );
}

// Issue is the one step whose lost reply matters most, so its three outcomes are told apart on screen: issued, failed
// with no effect, and unknown. Unknown can only be resolved through the original operation; a second issue is never offered.
function IssueDialog({ r, onClose, changed }: { r: Release; onClose: () => void; changed: () => void }) {
  const { packageId } = useMaterials(), command = useMaterialsCommand(changed), [fault, setFault] = useState(false);
  return (
    <Dialog title={`Issue technical release ${r.release_number}`} subtitle="This creates one immutable local technical issue. It does not distribute it, approve spending, place an order or authorise installation." busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "saved" || command.state === "unknown"} onClick={() => void command.send(`engineering/${packageId}/materials/releases`, { action: "issue", reason: "Technical release issued for the stated purpose", release_id: r.id, expected_version: r.version }, { discardReply: fault })}>Issue this exact release</button></>}>
      <CommandNotice command={command} saved={`Issued. Release ${r.release_number} is now immutable; its original operation is ${command.receipt?.operation_id ?? ""}.`} />
      <dl className="em-facts"><div><dt>Purpose</dt><dd>{text(r.purpose)}</dd></div><div><dt>Lines</dt><dd>{r.manifest.lines.length}</dd></div><div><dt>Audience</dt><dd>{r.audience}</dd></div></dl>
      <p className="em-hash">Content hash {r.content_hash}</p>
      <label className="mw-choice" style={{ marginTop: 12 }}><input type="checkbox" checked={fault} onChange={(e) => setFault(e.target.checked)} disabled={command.state !== "idle" && command.state !== "failed"} /><span>Exercise recovery: discard the server&rsquo;s reply (synthetic fault)</span></label>
      <p className="mw-hint">With this ticked the command really runs and its reply is thrown away, as a dropped connection would. The screen then shows Outcome unknown, and the original result is recovered by its operation ID without a second issue.</p>
    </Dialog>
  );
}

function WithdrawDialog({ r, onClose, changed }: { r: Release; onClose: () => void; changed: () => void }) {
  const { packageId } = useMaterials(), command = useMaterialsCommand(changed), [reason, setReason] = useState("");
  return (
    <Dialog title={`Withdraw current use of release ${r.release_number}`} subtitle="The issue and everything that relied on it stay on record. Withdrawal stops new reliance and raises an owned follow-up; it recalls, cancels and reverses nothing." busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "saved" || !reason.trim()} onClick={() => void command.send(`engineering/${packageId}/materials/releases`, { action: "withdraw", reason, release_id: r.id, expected_version: r.version })}>Withdraw current use</button></>}>
      <CommandNotice command={command} saved="Current use withdrawn. A follow-up was raised for anything that relied on this release." />
      <Field label="Why is current use withdrawn?"><textarea data-autofocus value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
    </Dialog>
  );
}
