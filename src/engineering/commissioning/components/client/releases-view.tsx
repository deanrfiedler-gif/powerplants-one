"use client";
import Link from "next/link";
import { useState } from "react";
import { destinations, type Destination, type Presentation } from "../../model";
import type { readOptions } from "../../reads";
import { useCommissioning } from "./commissioning-shell";
import { CommandNotice, Dialog, Field, Icon, Tag, fieldError, longDate, newId, siteTime, text, useCommissioningCommand, useRead } from "./commissioning-ui";
import { DetailHead, Page, Refusal, useAct, useView, type Detail } from "./view-common";

export type Options = Awaited<ReturnType<typeof readOptions>>;
export type Person = Options["people"][number];
type Release = Detail["releases"][number];
type Output = Detail["outputs"][number];

const satisfiedGate: Presentation = { label: "Satisfied", tone: "positive", icon: "tick" }, blockedGate: Presentation = { label: "Blocked", tone: "caution", icon: "alert" };
const assessmentView: Record<string, Presentation> = { Independent: { label: "Independent", tone: "positive", icon: "tick" }, Unassessed: { label: "Unassessed", tone: "neutral", icon: "target" }, Blocking: { label: "Blocking", tone: "caution", icon: "alert" } };
export const outputNames = { "OUT-12": "Commissioning/test record", "OUT-13": "Handover pack" } as const;
export const archivedRefusal = "This commissioning package is archived. Its history is retained and nothing more is recorded on it.";
export const revisionName = (r: { reference: string; revision: number }) => `${r.reference} revision ${r.revision}`;
export const fileHref = (packageId: string, query: Record<string, string>) => `/api/v1/engineering/${packageId}/commissioning/files?${new URLSearchParams(query)}`;

// Exact bytes, downloaded from the server under their recorded hash. A download issues, sends and acknowledges nothing.
export function OutputLinks({ outputId, what }: { outputId: string; what: string }) {
  const { packageId } = useCommissioning();
  return (
    <span className="cm-downloads">
      <a className="mw-link" href={fileHref(packageId, { kind: "output", output: outputId, format: "pdf" })} aria-label={`Download the PDF of ${what}`}><Icon name="download" /> PDF</a>
      <a className="mw-link" href={fileHref(packageId, { kind: "output", output: outputId, format: "html" })} target="_blank" rel="noreferrer" aria-label={`Open the HTML of ${what} in a new tab`}><Icon name="document" /> HTML</a>
    </span>
  );
}
export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="cm-row"><span>{label}</span><div>{children}</div></div>;
}
// Who and when are one retained fact; where it has not happened, that is said in words and never left blank.
function Fact({ by, at, zone, missing, children }: { by: string | null; at: string | null; zone: string | null; missing: string; children?: React.ReactNode }) {
  return at ? <>{by ?? "A permitted person"}<small>{siteTime(at, zone)}</small>{children}</> : <>{missing}</>;
}

export function ReleasesView() {
  const view = useView("releases");
  return (
    <Page view={view} label="Review & as-built release" empty="Every as-built release candidate of this Engineering package. Choose a package to see its release gates, the scope it names item by item, its exact outputs and every revision." columns={["Candidate", "Scope", "Issue"]}>
      {(d) => <Releases key={d.record.id} d={d} zone={view.data?.package.site_timezone ?? null} internal={!!view.data?.internal} reload={view.reload} />}
    </Page>
  );
}

function Releases({ d, zone, internal, reload }: { d: Detail; zone: string | null; internal: boolean; reload: () => void }) {
  const { packageId } = useCommissioning(), options = useRead<Options>(`engineering/${packageId}/commissioning/options`), people = options.data?.people ?? [];
  const current = d.releases.find((r) => r.current) ?? null, archived = d.record.archived_at ? archivedRefusal : null;
  return (
    <>
      <DetailHead d={d} />
      {archived && <p className="cm-note" role="note">Archived {siteTime(d.record.archived_at, zone)}. {d.record.archived_reason} {archived}</p>}
      <Gates d={d} current={current} archived={archived} reload={reload} />
      {current && <Candidate key={current.id} d={d} r={current} zone={zone} people={people} archived={archived} reload={reload} />}
      {current && <Preview d={d} r={current} zone={zone} internal={internal} />}
      <IssueObligations d={d} />
      <Revisions d={d} zone={zone} internal={internal} />
    </>
  );
}

// A new candidate, or the successor revision of an issued or withdrawn release. Its identity is made once and kept
// until the server's receipt arrives, so a retry recovers the original draft and never makes a second one.
function PrepareCandidate({ d, predecessor, archived, reload }: { d: Detail; predecessor: Release | null; archived: string | null; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), [id, setId] = useState(newId);
  const { command, notice } = useAct(() => { setId(newId()); announce(predecessor ? "Successor revision drafted." : "As-built release candidate drafted."); reload(); });
  const needs = [!d.bases.some((b) => b.state === "ApprovedForTest") && "No test basis is approved for test.", !d.configuration && "No installed configuration has been compared."].filter((x): x is string => !!x);
  const refusal = archived ?? d.refusals.edit ?? (needs.length ? needs.join(" ") : null);
  return (
    <>
      <div className="cm-act">
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || !!refusal}
          onClick={() => void command.send(`engineering/${packageId}/commissioning/releases`, { action: "draft", id, record_id: d.record.id, expected_version: d.record.version, predecessor_id: predecessor?.id ?? null, reason: predecessor ? `Successor revision of ${revisionName(predecessor)} drafted` : "As-built release candidate drafted" })}>
          {command.busy ? "Saving…" : predecessor ? "Prepare successor revision" : "Prepare as-built release"}
        </button>
        <Refusal reason={refusal} />
      </div>
      {predecessor && <p className="cm-note">A successor revision starts from the scope, audience and recipients of {revisionName(predecessor)} and inherits none of its decisions: it is submitted, reviewed, approved and issued again. {revisionName(predecessor)} and its issued bytes stay exactly as they are.</p>}
      {notice}
    </>
  );
}

function Gates({ d, current, archived, reload }: { d: Detail; current: Release | null; archived: string | null; reload: () => void }) {
  const decided = current && ["Issued", "Withdrawn", "Superseded"].includes(current.state);
  return (
    <section className="cm-panel" id="cm-panel-gates" tabIndex={-1} aria-label="Release gates">
      <header>
        <div>
          <h3>Release gates{current ? ` · ${revisionName(current)}` : ""}</h3>
          <p>No gate can be cleared by a general override: each one opens only when the record it names is satisfied. A partial scope satisfies its own complete rule set, over exactly the items it names.</p>
        </div>
      </header>
      {current ? (
        <>
          <ul className="cm-gates" aria-label={`The eight release gates of ${revisionName(current)}`}>
            {d.gates.map((g) => (
              <li key={g.key}>
                <Tag view={g.satisfied ? satisfiedGate : blockedGate} />
                <span>{g.label}</span>
                {g.reasons.length > 0 && <ul>{g.reasons.map((x) => <li key={x}>{x}</li>)}</ul>}
              </li>
            ))}
          </ul>
          {decided && <div className="cm-panel-body cm-panel-foot"><p className="cm-note">These gates are read as they stand now, over the scope {revisionName(current)} names. The decisions already made on it are retained exactly as they were made.</p></div>}
        </>
      ) : (
        <div className="cm-panel-body">
          <p>No release candidate exists for this package. A candidate needs a test basis that is approved for test and an installed configuration that has been compared; its eight gates are then judged over the scope it names, item by item.</p>
          <PrepareCandidate d={d} predecessor={null} archived={archived} reload={reload} />
        </div>
      )}
    </section>
  );
}

function Candidate({ d, r, zone, people, archived, reload }: { d: Detail; r: Release; zone: string | null; people: Person[]; archived: string | null; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), path = `engineering/${packageId}/commissioning/releases`;
  // The output identity is reserved once and kept until a receipt arrives: a retry after a failed or lost
  // preparation names the same identity, so the original bytes are recovered and never rendered twice.
  const [outputId, setOutputId] = useState(newId), [last, setLast] = useState<string | null>(null), [dialog, setDialog] = useState<"edit" | "approve" | "return" | "issue" | "withdraw" | null>(null);
  const { command, notice } = useAct(() => { setOutputId(newId()); announce("Saved on the server. The candidate was read again."); reload(); });
  const send = (action: string, reason: string, extra: Record<string, unknown> = {}) => { setLast(action); return command.send(path, { action, record_id: d.record.id, release_id: r.id, expected_version: r.version, reason, ...extra }); };
  const items = d.scope.items.filter((i) => i.disposition === "Included"), included = new Set(r.included), name = revisionName(r), issuedAlready = ["Issued", "Withdrawn", "Superseded"].includes(r.state);
  const prepared = d.outputs.find((o) => o.release_id === r.id && o.kind === "OUT-12" && o.state === "Prepared" && o.manifest_hash === r.manifest_hash) ?? null;
  const blockedGates = d.gates.filter((g) => !g.satisfied), gateRefusal = (gates: typeof blockedGates) => (gates.length ? `${gates.length} release gate${gates.length === 1 ? " is" : "s are"} blocked: ${gates.map((g) => g.label).join("; ")}.` : null);
  const who = (id: string | null) => (id ? people.find((p) => p.id === id)?.name ?? "A named person" : null);
  const followUp = [...new Set([...d.requests.filter((q) => q.release_id === r.id).map((q) => `${q.recipient_name} (${q.destination_label}, ${q.state_view.label.toLowerCase()})`), ...r.recipients.filter((x) => !d.requests.some((q) => q.release_id === r.id && q.recipient_id === x.recipient_id && q.destination === x.destination)).map((x) => `${who(x.recipient_id)} (${text(x.destination)}, named on the release, not requested)`)])];
  const prepareRefusal = archived ?? (d.refusals.issue && d.refusals.edit ? d.refusals.issue : null) ?? (prepared ? "The exact output of this approved candidate is already prepared. Review its bytes under Output preview, then issue." : null);
  const failedPrepare = last === "prepare" && (command.state === "failed" || command.state === "unknown");
  return (
    <section className="cm-panel" id="cm-panel-candidate" tabIndex={-1} aria-label={`Candidate ${name}`}>
      <header>
        <div><h3>Candidate {name}</h3><p>{r.kind_label} · {r.audience === "Customer" ? "Customer audience" : "Internal audience"}</p></div>
        <Tag view={r.state_view} />
      </header>
      <div className="cm-panel-body">
        <div className="cm-grid">
          <Row label="State"><Tag view={r.state_view} /></Row>
          <Row label="Kind">{r.kind_label}<small>Derived from what the candidate holds back. It is never a flag anyone sets.</small></Row>
          <Row label="Audience">{r.audience === "Customer" ? "Customer" : "Internal"}<small>{r.audience === "Customer" ? "Internal review notes, names and internal-only evidence are left out before rendering. Every failure, exclusion and open obligation stays." : "Prepared for the people who prepare, review and issue it."}</small></Row>
          <Row label="Manifest hash"><span className="cm-hash">{r.manifest_hash}</span>{r.submitted_hash && r.submitted_hash !== r.manifest_hash && <small>Submitted as <span className="cm-hash">{r.submitted_hash}</span></small>}</Row>
          <Row label="Drafted by">{r.created_by_name}</Row>
          <Row label="Submitted for review"><Fact by={r.submitted_by_name} at={r.submitted_at} zone={zone} missing="Not submitted" /></Row>
          <Row label="Approved for issue"><Fact by={r.approved_by_name} at={r.approved_at} zone={zone} missing="Not approved">{r.approval_reason && <small>{r.approval_reason}</small>}{r.policy_version !== null && <small>Policy version {r.policy_version}</small>}</Fact></Row>
          {r.returned_at && <Row label="Returned"><Fact by={r.returned_by_name} at={r.returned_at} zone={zone} missing=""><small>Reason: {r.return_reason}</small></Fact></Row>}
          <Row label="Issued"><Fact by={r.issued_by_name} at={r.issued_at} zone={zone} missing="Not issued">{r.issue_operation_id && <small className="cm-hash">Operation {r.issue_operation_id}</small>}</Fact></Row>
          {r.withdrawn_at && <Row label="Withdrawn"><Fact by={r.withdrawn_by_name} at={r.withdrawn_at} zone={zone} missing=""><small>Reason: {r.withdrawn_reason}</small></Fact></Row>}
        </div>
        <p className="cm-note">Approved for issue and issued are separate decisions by separate duties, each with its own person and time. Neither one sends anything to anyone.</p>
      </div>

      <div className="cm-subhead">
        <h4>Explicit scope manifest</h4>
        <p>Scope is what is named here, item by item. It is never what a filter, a page or a visible row showed.</p>
        {r.editable && <button type="button" className="mw-button" disabled={!!archived} onClick={() => setDialog("edit")}>Edit scope &amp; recipients</button>}
      </div>
      <div className="em-table-scroll">
        <table className="em-table cm-table cm-rel-table">
          <caption className="mw-sr">Every included scope item of this package and whether {name} releases it or holds it back</caption>
          <thead><tr>{["Item", "Kind", "Installed at", "Areas served", "Identity", "Released / Held back"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
          <tbody>
            {items.map((i) => {
              const held = r.excluded.find((x) => x.key === i.key);
              return (
                <tr key={i.key}>
                  <td className="cm-rowhead">{i.title}<span className="em-cell-sub">{i.reference}{i.critical ? " · critical" : ""}</span></td>
                  <td data-label="Kind">{i.kind}</td>
                  <td data-label="Installed at">{i.installed_location ?? "Unknown"}</td>
                  <td data-label="Areas served">{i.served_areas.join("; ") || "Unknown"}</td>
                  <td data-label="Identity">{i.identity}</td>
                  <td data-label="Released / Held back">
                    {included.has(i.key) ? <><strong>{issuedAlready ? "Released" : "To be released"}</strong><span className="em-cell-sub">{issuedAlready ? `Named in ${name}` : "Named for release; nothing is released until this candidate is issued"}</span></>
                      : held ? <><strong>Held back</strong><span className="em-cell-sub">Reason: {held.reason}</span>{held.residual && <span className="em-cell-sub">Residual obligation: {held.residual}</span>}<span className="em-cell-sub">Next owner: {who(held.owner_id) ?? "Not named"}</span></>
                        : <><strong>Not named</strong><span className="em-cell-sub">This item joined the scope after the candidate was saved. Say whether it is released or held back.</span></>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!items.length && <div className="em-empty"><p>No item is included in this package&rsquo;s declared scope.</p></div>}
      </div>

      <div className="cm-subhead">
        <h4>Shared interfaces</h4>
        <p>An interface that joins released and held-back items blocks the partial release unless it is assessed as independent. The scope gate says so.</p>
      </div>
      {d.scope.interfaces.length ? (
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-rel-table">
            <caption className="mw-sr">Shared interfaces of this scope and their assessment</caption>
            <thead><tr>{["Interface", "Joins", "Assessment", "Reasoning"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
            <tbody>
              {d.scope.interfaces.map((f) => {
                const split = f.items.some((k) => included.has(k)) && f.items.some((k) => !included.has(k));
                return (
                  <tr key={f.key}>
                    <td className="cm-rowhead">{f.label}</td>
                    <td data-label="Joins">{f.items.map((k) => d.scope.items.find((i) => i.key === k)?.title ?? k).join("; ")}{split && <span className="em-cell-sub">Joins released and held-back scope</span>}</td>
                    <td data-label="Assessment"><Tag view={assessmentView[f.assessment]} />{split && f.assessment !== "Independent" && <span className="em-cell-sub">Blocks this partial release</span>}</td>
                    <td data-label="Reasoning">{f.note ?? "No reasoning recorded"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="cm-panel-body"><p className="cm-note">No shared interface is declared for this scope.</p></div>}

      <div className="cm-subhead">
        <h4>Required recipients</h4>
        <p>Naming a recipient sends nothing. Each one is asked separately, and answers for themselves, in Handover &amp; history.</p>
      </div>
      {r.recipients.length ? (
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-rel-table">
            <caption className="mw-sr">Recipients this release names</caption>
            <thead><tr>{["Destination", "Recipient", "Purpose"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
            <tbody>{r.recipients.map((x) => <tr key={`${x.destination}:${x.recipient_id}`}><td className="cm-rowhead">{text(x.destination)}</td><td data-label="Recipient">{who(x.recipient_id)}</td><td data-label="Purpose">{x.purpose}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <div className="cm-panel-body"><p className="cm-note">No recipient is named. The manifest gate stays blocked until the required recipients are named.</p></div>}

      <div className="cm-panel-body cm-panel-foot" aria-busy={command.busy}>
        {r.state === "Draft" && (
          <div className="cm-act">
            <button type="button" className="mw-button mw-button-primary" disabled={command.busy || !!(archived ?? d.refusals.edit ?? gateRefusal(blockedGates.filter((g) => g.key !== "authority")))} onClick={() => void send("submit", "As-built release candidate submitted for independent review")}>{command.busy && last === "submit" ? "Saving…" : "Submit for review"}</button>
            <Refusal reason={archived ?? d.refusals.edit ?? gateRefusal(blockedGates.filter((g) => g.key !== "authority"))} />
          </div>
        )}
        {r.state === "InReview" && (
          <>
            <div className="cm-act">
              <button type="button" className="mw-button mw-button-primary" disabled={!!(archived ?? d.refusals.approve_release ?? gateRefusal(blockedGates))} onClick={() => setDialog("approve")}>Approve for issue</button>
              <button type="button" className="mw-button" disabled={!!(archived ?? d.refusals.approve_release)} onClick={() => setDialog("return")}>Return</button>
              <Refusal reason={archived ?? d.refusals.approve_release ?? gateRefusal(blockedGates)} />
            </div>
            <p className="cm-note">This candidate is frozen as it was submitted. Approving it for issue is not issuing it, and a material edit is a successor revision that is reviewed again.</p>
          </>
        )}
        {r.state === "ApprovedForIssue" && (
          <>
            <div className="cm-act">
              <button type="button" className="mw-button mw-button-primary" disabled={command.busy || !!prepareRefusal} onClick={() => void send("prepare", "Exact output prepared for the approved candidate", { id: outputId })}>
                {command.busy && last === "prepare" ? "Preparing… the server is rendering the exact PDF" : failedPrepare ? "Retry with the same output identity" : "Prepare exact output"}
              </button>
              <Refusal reason={prepareRefusal} />
            </div>
            {command.busy && last === "prepare" && <p className="cm-note" role="status">The server renders and stores the exact PDF before anything is recorded. This takes several seconds; nothing is issued by preparing.</p>}
            {failedPrepare && <p className="cm-note" role="note">Nothing was issued and {name} is unchanged. A retry reuses output identity <span className="cm-hash">{outputId}</span>, so the original preparation is recovered and never duplicated.</p>}
            <div className="cm-act">
              <button type="button" className="mw-button mw-button-primary" disabled={command.busy || !!(archived ?? d.refusals.issue ?? (prepared ? gateRefusal(blockedGates) : "Prepare the exact output for this approved candidate first. A release is never issued without its durable bytes."))} onClick={() => setDialog("issue")}>Issue approved release</button>
              <Refusal reason={archived ?? d.refusals.issue ?? (prepared ? gateRefusal(blockedGates) : "Prepare the exact output for this approved candidate first. A release is never issued without its durable bytes.")} />
            </div>
          </>
        )}
        {r.state === "Issued" && (
          <div className="cm-act">
            <button type="button" className="mw-button" disabled={!!(archived ?? d.refusals.issue)} onClick={() => setDialog("withdraw")}>Withdraw</button>
            <Refusal reason={archived ?? d.refusals.issue} />
          </div>
        )}
        {(r.state === "Issued" || r.state === "Withdrawn") && <PrepareCandidate d={d} predecessor={r} archived={archived} reload={reload} />}
        {r.state === "Superseded" && <p className="cm-note">{name} was superseded by a later revision. It and its issued bytes stay on record exactly as they were.</p>}
        {notice}
        {command.error?.code === "CandidateStale" && <p className="cm-note" role="note">Nothing was changed by this attempt. {name} and every decision already made on it stay on record as history; a decision is never moved onto changed content.</p>}
      </div>

      {dialog === "edit" && <EditDrawer d={d} r={r} people={people} onClose={() => setDialog(null)} reload={reload} />}
      {(dialog === "approve" || dialog === "return") && <DecisionDialog d={d} r={r} action={dialog} onClose={() => setDialog(null)} reload={reload} />}
      {dialog === "issue" && prepared && <IssueDialog d={d} r={r} output={prepared} onClose={() => setDialog(null)} reload={reload} />}
      {dialog === "withdraw" && <WithdrawDialog d={d} r={r} followUp={followUp} onClose={() => setDialog(null)} reload={reload} />}
    </section>
  );
}

type Choice = { released: boolean | null; reason: string; owner_id: string; residual: string };
function EditDrawer({ d, r, people, onClose, reload }: { d: Detail; r: Release; people: Person[]; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), command = useCommissioningCommand(() => { announce("Scope and recipients saved on the server."); reload(); }), items = d.scope.items.filter((i) => i.disposition === "Included");
  // Every item starts from what the candidate already names. One it does not name has no default: it is chosen explicitly.
  const [choices, setChoices] = useState<Record<string, Choice>>(() => Object.fromEntries(items.map((i) => { const held = r.excluded.find((x) => x.key === i.key); return [i.key, { released: held ? false : r.included.includes(i.key) ? true : null, reason: held?.reason ?? "", owner_id: held?.owner_id ?? "", residual: held?.residual ?? "" }]; })));
  const [audience, setAudience] = useState(r.audience), [recipients, setRecipients] = useState(() => r.recipients.map((x) => ({ ...x }))), [dirty, setDirty] = useState(false);
  const choose = (key: string, patch: Partial<Choice>) => { setDirty(true); setChoices((all) => ({ ...all, [key]: { ...all[key], ...patch } })); };
  const receivers = (destination: Destination) => people.filter((p) => p.receiver_for.includes(destination));
  const recipient = (i: number, patch: Partial<(typeof recipients)[number]>) => { setDirty(true); setRecipients((all) => all.map((x, n) => (n === i ? { ...x, ...patch, ...(patch.destination ? { recipient_id: receivers(patch.destination)[0]?.id ?? "" } : {}) } : x))); };
  const held = items.filter((i) => choices[i.key].released === false), unnamed = items.filter((i) => choices[i.key].released === null);
  const refusal = unnamed.length ? `Say whether each scope item is released or held back: ${unnamed.map((i) => i.title).join(", ")}.` : held.some((i) => !choices[i.key].reason.trim()) ? "Every held-back item needs its reason." : recipients.some((x) => !x.recipient_id || !x.purpose.trim()) ? "Every recipient needs a person and a purpose." : null;
  const save = () => void command.send(`engineering/${packageId}/commissioning/releases`, {
    action: "save", record_id: d.record.id, release_id: r.id, expected_version: r.version, included: items.filter((i) => choices[i.key].released === true).map((i) => i.key),
    excluded: held.map((i) => ({ key: i.key, reason: choices[i.key].reason, owner_id: choices[i.key].owner_id || null, residual: choices[i.key].residual || null })), audience, recipients, reason: "Release scope, audience and recipients saved",
  });
  return (
    <Dialog title={`Edit scope & recipients · ${revisionName(r)}`} subtitle="Scope is what is named here, item by item. It is never what a filter, a page or a visible row showed." drawer busy={command.busy} dirty={dirty && command.state !== "saved"} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button><button type="button" className="mw-button mw-button-primary" disabled={command.busy || !!refusal} onClick={save}>{command.busy ? "Saving…" : "Save scope & recipients"}</button></>}>
      <CommandNotice command={command} saved="Scope and recipients saved on the server. The gates were judged again over exactly this scope." />
      {items.map((i, n) => {
        const c = choices[i.key], at = held.indexOf(i);
        return (
          <fieldset key={i.key} className="cm-choice-set">
            <legend>{i.title}<small>{i.reference} · {i.kind} · installed at {i.installed_location ?? "unknown"} · serves {i.served_areas.join("; ") || "unknown"}</small></legend>
            <div className="mw-choice-row">
              <label className="mw-choice"><input type="radio" name={`scope-${i.key}`} data-autofocus={n === 0 || undefined} checked={c.released === true} onChange={() => choose(i.key, { released: true })} /><span>Released</span></label>
              <label className="mw-choice"><input type="radio" name={`scope-${i.key}`} checked={c.released === false} onChange={() => choose(i.key, { released: false })} /><span>Held back</span></label>
            </div>
            {c.released === false && (
              <>
                <Field label="Why it is held back" error={fieldError(command.error, `excluded-${at}`)}><textarea value={c.reason} onChange={(e) => choose(i.key, { reason: e.target.value })} maxLength={600} /></Field>
                <div className="mw-field-row">
                  <Field label="Next owner (optional)"><select value={c.owner_id} onChange={(e) => choose(i.key, { owner_id: e.target.value })}><option value="">Not named</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
                  <Field label="Residual obligation (optional)"><input value={c.residual} onChange={(e) => choose(i.key, { residual: e.target.value })} maxLength={600} /></Field>
                </div>
              </>
            )}
          </fieldset>
        );
      })}
      <p className="mw-hint">Holding any item back makes this a partial technical release. The partial scope then has to satisfy its own complete rule set, and a shared interface that joins released and held-back items blocks it unless that interface is assessed as independent.</p>
      <Field label="Audience" hint="A customer record leaves out internal review notes, people's names and internal-only evidence before it is rendered. It keeps every failure, exclusion and open obligation." error={fieldError(command.error, "audience")}>
        <select value={audience} onChange={(e) => { setDirty(true); setAudience(e.target.value as typeof audience); }}><option value="Internal">Internal</option><option value="Customer">Customer</option></select>
      </Field>
      <fieldset className="cm-choice-set">
        <legend>Required recipients<small>Only a person the policy names as receiver for a destination can be chosen for it. Naming them sends nothing.</small></legend>
        {recipients.map((x, i) => (
          <div key={i} className="cm-recipient">
            <Field label="Destination"><select value={x.destination} onChange={(e) => recipient(i, { destination: e.target.value as Destination })}>{destinations.map((k) => <option key={k} value={k}>{text(k)}</option>)}</select></Field>
            <Field label="Recipient" error={fieldError(command.error, `recipients-${i}`)}><select value={x.recipient_id} onChange={(e) => recipient(i, { recipient_id: e.target.value })}><option value="">{receivers(x.destination).length ? "Choose…" : "The policy names no receiver here"}</option>{receivers(x.destination).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Purpose"><input value={x.purpose} onChange={(e) => recipient(i, { purpose: e.target.value })} maxLength={300} /></Field>
            <button type="button" className="mw-button mw-button-quiet" onClick={() => { setDirty(true); setRecipients((all) => all.filter((_, k) => k !== i)); }} aria-label={`Remove recipient ${i + 1}`}>Remove</button>
          </div>
        ))}
        {!recipients.length && <p className="cm-note">No recipient is named yet.</p>}
        <button type="button" className="mw-button" disabled={recipients.length >= 12} onClick={() => { setDirty(true); setRecipients((all) => [...all, { destination: "Service", recipient_id: receivers("Service")[0]?.id ?? "", purpose: "" }]); }}><Icon name="plus" /><span>Add recipient</span></button>
      </fieldset>
      <Refusal reason={refusal} />
    </Dialog>
  );
}

function DecisionDialog({ d, r, action, onClose, reload }: { d: Detail; r: Release; action: "approve" | "return"; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), command = useCommissioningCommand(() => { announce(action === "approve" ? "Approved for issue. Nothing was issued." : "Candidate returned to its preparer."); reload(); }), [reason, setReason] = useState("");
  return (
    <Dialog title={`${action === "approve" ? "Approve for issue" : "Return"} · ${revisionName(r)}`} busy={command.busy} dirty={!!reason && command.state !== "saved"} onClose={onClose}
      subtitle={action === "approve" ? "You approve this exact frozen candidate for issue. Approval is not issue: nothing is issued, prepared or sent until the issue authority does so." : "The candidate goes back to its preparer as a draft, with your reason. What was submitted stays in history."}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "saved" || !reason.trim()}
          onClick={() => void command.send(`engineering/${packageId}/commissioning/releases`, { action, record_id: d.record.id, release_id: r.id, expected_version: r.version, decision_reason: reason, reason: action === "approve" ? "As-built release candidate approved for issue" : "As-built release candidate returned" })}>{command.busy ? "Saving…" : action === "approve" ? "Approve for issue" : "Return candidate"}</button></>}>
      <CommandNotice command={command} saved={action === "approve" ? "Approved for issue on the server. Nothing was issued." : "Returned on the server."} />
      {command.error?.code === "CandidateStale" && <p className="cm-note" role="note">Nothing was changed by this attempt. The submission stays on record as history; a decision is never moved onto changed content.</p>}
      <p className="cm-hash">Manifest {r.submitted_hash ?? r.manifest_hash}</p>
      <Field label={action === "approve" ? "Why this exact candidate may be issued" : "Why it is returned, and what has to change"} error={fieldError(command.error, "decision_reason")}><textarea data-autofocus value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} /></Field>
    </Dialog>
  );
}

// Issue is the step whose lost reply matters most. Its outcome is recovered through the original operation; a second issue is never offered.
function IssueDialog({ d, r, output, onClose, reload }: { d: Detail; r: Release; output: Output; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), command = useCommissioningCommand(() => { announce(`${revisionName(r)} issued. Nothing was sent to anyone.`); reload(); });
  return (
    <Dialog title={`Issue ${revisionName(r)}`} subtitle={`${r.kind_label}. Issuing is its own decision, by the issue authority, with its own time.`} busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "saved" || command.state === "unknown"}
          onClick={() => void command.send(`engineering/${packageId}/commissioning/releases`, { action: "issue", record_id: d.record.id, release_id: r.id, expected_version: r.version, output_id: output.id, reason: `${revisionName(r)} issued with its exact prepared output` })}>{command.busy ? "Saving…" : "Issue this exact release"}</button></>}>
      <CommandNotice command={command} saved={`Issued on the server. Original operation ${command.receipt?.operation_id ?? ""}.`} />
      {command.error?.code === "CandidateStale" && <p className="cm-note" role="note">Nothing was issued. The approval stays on record as history; it is never moved onto changed content.</p>}
      <h3 className="cm-dialog-heading">What issuing does</h3>
      <ul className="em-reasons">
        <li>Records the issue of {revisionName(r)} by you, now, as its own event, separate from its approval.</li>
        <li>Marks the prepared {output.kind} bytes as the issued bytes. They are read back and verified against their recorded hashes first; nothing is rendered again.</li>
        <li>Records a source check in the same transaction{r.predecessor_id ? ", and marks the revision this one follows as superseded" : ""}.</li>
      </ul>
      <h3 className="cm-dialog-heading">What issuing does not do</h3>
      <ul className="em-reasons">
        <li>It sends nothing to anyone. Each recipient is asked separately in Handover &amp; history.</li>
        <li>It completes no Project and closes no commercial obligation.</li>
        <li>It starts no warranty, authorises no site operation and books nobody.</li>
      </ul>
      <Row label="PDF SHA-256"><span className="cm-hash">{output.pdf_sha256}</span></Row>
      <Row label="Manifest hash"><span className="cm-hash">{r.manifest_hash}</span></Row>
      <Row label="Output identity"><span className="cm-hash">{output.id}</span></Row>
    </Dialog>
  );
}

function WithdrawDialog({ d, r, followUp, onClose, reload }: { d: Detail; r: Release; followUp: string[]; onClose: () => void; reload: () => void }) {
  const { packageId, announce } = useCommissioning(), command = useCommissioningCommand(() => { announce(`${revisionName(r)} withdrawn. Nobody was notified.`); reload(); }), [reason, setReason] = useState("");
  return (
    <Dialog title={`Withdraw ${revisionName(r)}`} subtitle="Withdrawing records that this release should no longer be relied on. It recalls no file, notifies nobody and stops no site work." busy={command.busy} dirty={!!reason && command.state !== "saved"} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" disabled={command.busy || command.state === "saved" || !reason.trim()}
          onClick={() => void command.send(`engineering/${packageId}/commissioning/releases`, { action: "withdraw", record_id: d.record.id, release_id: r.id, expected_version: r.version, decision_reason: reason, reason: `${revisionName(r)} withdrawn` })}>{command.busy ? "Saving…" : "Withdraw release"}</button></>}>
      <CommandNotice command={command} saved="Withdrawn on the server. Nobody was notified: follow up the recipients below yourself." />
      <p className="mw-hint">The issued bytes, manifests, decisions and receiving outcomes stay exactly as they were, and stay downloadable.</p>
      <h3 className="cm-dialog-heading">Recipients to follow up</h3>
      {followUp.length ? <ul className="em-reasons">{followUp.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="cm-note">No recipient is named on this release and no receiving request exists for it.</p>}
      <Field label="Why is this release withdrawn?" error={fieldError(command.error, "decision_reason")}><textarea data-autofocus value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} /></Field>
    </Dialog>
  );
}

function Preview({ d, r, zone, internal }: { d: Detail; r: Release; zone: string | null; internal: boolean }) {
  const { packageId } = useCommissioning(), outputs = d.outputs.filter((o) => o.release_id === r.id);
  return (
    <section className="cm-panel" id="cm-panel-preview" tabIndex={-1} aria-label="Output preview">
      <header>
        <div>
          <h3>Output preview</h3>
          <p>The reviewed prepared bytes are the bytes issued: they are rendered once, stored once and read back under their hash. Prepared-at is when the bytes were reserved and rendered; issued-at is the actual issue event.</p>
        </div>
        {internal
          ? <a className="mw-button" href={fileHref(packageId, { kind: "preview", record: d.record.id, release: r.id })} target="_blank" rel="noreferrer"><Icon name="document" /><span>Open preparation preview</span></a>
          : <p className="cm-note">A release preview is for the people who prepare, review and issue it.</p>}
      </header>
      {outputs.length ? (
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-rel-table">
            <caption className="mw-sr">Outputs of {revisionName(r)}. Prepared is not issued.</caption>
            <thead><tr>{["Output", "Audience", "State", "Prepared", "Issued", "PDF SHA-256", "Download"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
            <tbody>
              {outputs.map((o) => {
                const to = o.handover_id ? d.requests.find((q) => q.id === o.handover_id) : null;
                return (
                  <tr key={o.id}>
                    <td className="cm-rowhead">{o.kind} {outputNames[o.kind]}<span className="em-cell-sub">{to ? `For ${to.destination_label} · ${to.recipient_name} · ` : ""}{o.template_version}</span></td>
                    <td data-label="Audience">{o.audience}</td>
                    <td data-label="State"><Tag view={o.state_view} /></td>
                    <td data-label="Prepared">{o.prepared_by_name}<span className="em-cell-sub">{siteTime(o.prepared_at, zone)}</span></td>
                    <td data-label="Issued">{o.issued_at ? siteTime(o.issued_at, zone) : "Not issued"}</td>
                    <td data-label="PDF SHA-256"><span className="cm-hash">{o.pdf_sha256}</span><span className="em-cell-sub">{o.pdf_bytes.toLocaleString("en-AU")} bytes</span></td>
                    <td data-label="Download">{o.state === "Discarded" ? "Discarded: not offered" : internal ? <OutputLinks outputId={o.id} what={`${o.kind} ${revisionName(r)}`} /> : "For its preparers and the receiver it names"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="cm-panel-body"><p className="cm-note">No output has been prepared for {revisionName(r)}. The preparation preview is HTML made on request and is not stored: it reads &ldquo;Preparation preview — not issued&rdquo; and proves nothing.</p></div>}
    </section>
  );
}

// What can stop a technical issue, and only that. An obligation bites at the stage it declares and no other.
function IssueObligations({ d }: { d: Detail }) {
  const { href } = useCommissioning(), now = d.obligations.filter((o) => o.required_stage === "TestPrerequisite" || o.required_stage === "TechnicalIssue"), later = d.obligations.filter((o) => !now.includes(o)), training = later.filter((o) => o.kind === "Training" && !o.satisfied);
  return (
    <section className="cm-panel" id="cm-panel-obligations" tabIndex={-1} aria-label="Obligations for the issue stage">
      <header>
        <div><h3>Obligations for the issue stage</h3><p>Read only here. Only an obligation required before testing or before technical issue can block a technical issue.</p></div>
        <Link className="mw-link" href={href("handovers", { panel: "obligations" })}>Manage in Handover &amp; history</Link>
      </header>
      {now.length > 0 && (
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-rel-table">
            <caption className="mw-sr">Obligations required before testing or before technical issue</caption>
            <thead><tr>{["Obligation", "Kind", "Required", "State", "Owner / due"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
            <tbody>{now.map((o) => (
              <tr key={o.id}>
                <td className="cm-rowhead">{o.title}{(o.subject || o.content_revision) && <span className="em-cell-sub">{[o.subject, o.content_revision].filter(Boolean).join(" · ")}</span>}</td>
                <td data-label="Kind">{o.kind_label}</td><td data-label="Required">{o.stage_label}</td><td data-label="State"><Tag view={o.state_view} /></td>
                <td data-label="Owner / due">{o.owner_name}<span className="em-cell-sub">{o.due ? <>{longDate(o.due)}{o.due_view.label === "Overdue" && <> · <Tag view={o.due_view} /></>}</> : "Date needed"}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <div className={`cm-panel-body${now.length ? " cm-panel-foot" : ""}`}>
        {!now.length && <p className="cm-note">No obligation is required before testing or before technical issue.</p>}
        {later.length > 0 && <p className="cm-note">{later.length} further obligation{later.length === 1 ? " is" : "s are"} required only for customer handover or Service acceptance ({later.map((o) => o.title).join("; ")}). {later.length === 1 ? "It does" : "They do"} not block a technical issue.</p>}
        {training.length > 0 && <p className="cm-note">Training that is required only for Service acceptance does not block a technical issue. It is the Service receiver&rsquo;s acceptance that waits for it.</p>}
      </div>
    </section>
  );
}

function Revisions({ d, zone, internal }: { d: Detail; zone: string | null; internal: boolean }) {
  const named = (id: string | null) => { const x = d.releases.find((r) => r.id === id); return x ? revisionName(x) : null; };
  return (
    <section className="cm-panel" id="cm-panel-releases" tabIndex={-1} aria-label="Release revisions">
      <header><div><h3>Release revisions</h3><p>Every revision stays on record. The issued bytes of an earlier revision stay downloadable after it is withdrawn or superseded.</p></div></header>
      {d.releases.length ? (
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-rel-table">
            <caption className="mw-sr">Every release revision of this package</caption>
            <thead><tr>{["Release", "Kind", "State", "Issued", "Withdrawn / superseded", "Follows / followed by", "Issued bytes"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
            <tbody>
              {[...d.releases].reverse().map((r) => {
                const bytes = d.outputs.find((o) => o.release_id === r.id && o.kind === "OUT-12" && o.state === "Issued");
                return (
                  <tr key={r.id}>
                    <td className="cm-rowhead">{revisionName(r)}{r.current && <span className="em-cell-sub">Shown above</span>}</td>
                    <td data-label="Kind">{r.kind_label}</td>
                    <td data-label="State"><Tag view={r.state_view} /></td>
                    <td data-label="Issued">{r.issued_at ? <>{r.issued_by_name}<span className="em-cell-sub">{siteTime(r.issued_at, zone)}</span></> : "Not issued"}</td>
                    <td data-label="Withdrawn / superseded">{r.withdrawn_at ? <>Withdrawn by {r.withdrawn_by_name}<span className="em-cell-sub">{siteTime(r.withdrawn_at, zone)} · {r.withdrawn_reason}</span></> : r.state === "Superseded" ? <>Superseded{named(r.successor_id) && <span className="em-cell-sub">by {named(r.successor_id)}</span>}</> : "No"}</td>
                    <td data-label="Follows / followed by">{named(r.predecessor_id) ? `Follows ${named(r.predecessor_id)}` : "First revision"}{named(r.successor_id) && <span className="em-cell-sub">Followed by {named(r.successor_id)}</span>}</td>
                    <td data-label="Issued bytes">{bytes ? (internal ? <OutputLinks outputId={bytes.id} what={`${bytes.kind} ${revisionName(r)}`} /> : "Retained") : "None issued"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="cm-panel-body"><p className="cm-note">No release revision exists for this package.</p></div>}
    </section>
  );
}
