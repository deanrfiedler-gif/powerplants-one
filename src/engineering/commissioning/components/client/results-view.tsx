"use client";
import Link from "next/link";
import { useState } from "react";
import { useIdentity } from "../../../../components/business-session";
import { reviewDecisions, type ReviewDecision } from "../../../../inspections/model";
import { changesHref } from "../../../../shell/navigation";
import type { Presentation } from "../../model";
import type { readOptions } from "../../reads";
import { useCommissioning } from "./commissioning-shell";
import { CommandNotice, Dialog, Field, ReadNotice, Tag, fieldError, longDate, newId, siteTime, useCommissioningCommand, useRead } from "./commissioning-ui";
import { DetailHead, Page, Refusal, useAct, useView, type Detail } from "./view-common";

type Options = Awaited<ReturnType<typeof readOptions>>;
type Attempt = Detail["attempts"][number];
type Defect = Detail["defects"][number];
type Plan = Detail["bases"][number]["checks"][number];
type Command = ReturnType<typeof useAct>["command"];
type Shared = { d: Detail; options: Options | null; zone: string | null; reload: () => void; loading: boolean };

const tag = (label: string, tone: Presentation["tone"], icon: Presentation["icon"]): Presentation => ({ label, tone, icon });
const evidenceView: Record<string, Presentation> = { Complete: tag("Complete", "positive", "tick"), Pending: tag("Pending", "information", "clock"), Missing: tag("Missing", "failure", "error"), Unsupported: tag("Unsupported", "failure", "error"), Restricted: tag("Restricted", "neutral", "document") };
const instrumentTone: Record<string, [Presentation["tone"], Presentation["icon"]]> = { ValidAtUse: ["positive", "tick"], InvalidAtUse: ["failure", "error"], WithdrawnForUse: ["failure", "error"], Unknown: ["neutral", "document"] };
const evidenceKinds: Record<string, string> = { RetainedSource: "Retained source", FieldEntry: "Field entry", StoredFile: "Stored file" };
const decisionWords: Record<ReviewDecision, { action: string; title: string }> = { Accepted: { action: "Accept evidence", title: "Accept the evidence of" }, Returned: { action: "Return", title: "Return" }, ClarificationRequired: { action: "Ask for clarification", title: "Ask for clarification on" }, OnHold: { action: "Put on hold", title: "Put on hold" } };
const severities = ["Unclassified", "Minor", "Major", "Critical"] as const;
const orNull = (value: string) => value.trim() || null;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// The wall-clock date and time of an instant at the site, and back. The site's zone is named beside every time; the
// browser's zone is never used, and the time a form was saved is never the time of a test.
function siteParts(instant: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(instant), get = (type: string) => parts.find((x) => x.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
function siteInstant(date: string, time: string, zone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const wall = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(wall)) return null;
  let instant = wall;
  for (let i = 0; i < 2; i++) { const at = siteParts(new Date(instant), zone); instant -= Date.parse(`${at.date}T${at.time}:00Z`) - wall; }
  return new Date(instant).toISOString();
}
const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
function base64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export function ResultsView() {
  const view = useView("results");
  return (
    <Page view={view} label="Results & retests" empty="Choose a package to read its coverage in explicit counts, every attempt and retest exactly as it was captured, and its defects." columns={["Accepted / required", "Failed · not tested · unassessable", "Defects"]}>
      {(d) => <ResultsDetail key={d.record.id} d={d} reload={view.reload} loading={view.loading} />}
    </Page>
  );
}

function ResultsDetail({ d, reload, loading }: { d: Detail; reload: () => void; loading: boolean }) {
  const { packageId, frame } = useCommissioning(), options = useRead<Options>(`engineering/${packageId}/commissioning/options`);
  const shared: Shared = { d, options: options.data, zone: frame?.package.site_timezone ?? options.data?.site_timezone ?? null, reload, loading };
  return (
    <>
      <DetailHead d={d} />
      <ReadNotice error={options.error} what="Form choices" />
      {d.record.archived_at && <p className="cm-note" role="note">This package is archived: {d.record.archived_reason}. Its history is retained and nothing more is recorded on it.</p>}
      <CoveragePanel d={d} />
      <AttemptsPanel {...shared} />
      <DefectsPanel {...shared} />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
function CoveragePanel({ d }: { d: Detail }) {
  const c = d.coverage, counts: [string, number, string?][] = [["Required", c.required], ["Accepted", c.accepted, "Passed, evidence accepted and current for this scope"], ["Passed awaiting review", c.passed_unreviewed, "A pass is not accepted evidence"], ["Failed", c.failed],
    ["Not tested", c.not_tested], ["Unable to assess", c.unassessable], ["Reassessment required", c.reassessment], ["Criteria missing", c.criteria_missing, "Also counted under their own result"]];
  return (
    <section className="cm-panel" id="cm-panel-coverage" tabIndex={-1} aria-labelledby="cm-coverage-title">
      <header><div><h3 id="cm-coverage-title">Coverage</h3><p>The latest submitted result of every required check of the current basis, as counts. A single figure could hide an omission, so none is shown.</p></div></header>
      <div className="cm-panel-body">
        <div className="cm-grid cm-test-counts">{counts.map(([label, n, hint]) => <div className="cm-row" key={label}><span>{label}</span><span><strong>{n}</strong>{hint && <small>{hint}</small>}</span></div>)}</div>
      </div>
      <div className="em-table-scroll cm-test-after-body">
        <table className="em-table cm-table">
          <caption className="mw-sr">Latest effective result of every check. Evaluation, evidence review and applicability are three separate facts.</caption>
          <thead><tr>{["Check", "Scope", "Criterion", "Latest result", "Evidence review", "Applicability", "Attempt"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
          <tbody>
            {d.definitions.map((k) => (
              <tr key={k.key}>
                <td><span className="cm-test-title">{k.name}</span><span className="em-cell-sub">{k.is_required ? "Required" : "Not required"}</span></td>
                <td data-label="Scope">{k.scope_title}</td>
                <td data-label="Criterion">{k.has_criterion ? <>{k.criterion_text} <span className="cm-fictional">Fictional limit</span></> : <Tag view={tag("Criteria missing", "caution", "alert")} />}</td>
                <td data-label="Latest result"><Tag view={k.evaluation_view} /></td>
                <td data-label="Evidence review">{k.review_view ? <Tag view={k.review_view} /> : "No submitted attempt"}</td>
                <td data-label="Applicability">{k.applicability_view ? <Tag view={k.applicability_view} /> : "Nothing to apply yet"}</td>
                <td data-label="Attempt">{k.attempt_number ? `Attempt ${String(k.attempt_number).padStart(2, "0")}` : "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!d.definitions.length && <div className="em-empty"><p>No check is defined: this package has no test basis yet.</p></div>}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
type Open = { kind: "open" } | { kind: "capture"; id: string } | { kind: "review"; id: string; decision: ReviewDecision } | { kind: "clarify"; id: string };
function AttemptsPanel({ d, options, zone, reload, loading }: Shared) {
  const identity = useIdentity(), { announce } = useCommissioning(), act = useAct(reload), [dialog, setDialog] = useState<Open | null>(null), archived = !!d.record.archived_at;
  const attempts = [...d.attempts].reverse(), mine = d.attempts.find((a) => a.editable) ?? null, submitted = d.attempts.some((a) => a.state === "Submitted"), open = (next: Open) => { act.command.clear(); setDialog(next); };
  // Dialogs are looked up in the latest read, so a drawer always works on the version the server last confirmed.
  const at = (id: string) => d.attempts.find((a) => a.id === id) ?? null, capturing = dialog?.kind === "capture" ? at(dialog.id) : null, reviewing = dialog?.kind === "review" ? at(dialog.id) : null, clarifying = dialog?.kind === "clarify" ? at(dialog.id) : null;
  const clarifyRefusal = (a: Attempt) => (a.mine || d.record.owner_id === identity.actor_id ? null : "A clarification is given by the person who performed the test or the package's owner.");
  // What this identity may do with one attempt. Every positive action that cannot be taken keeps its reason beside it.
  const actions = (a: Attempt) => {
    const reviewable = a.state === "Submitted" && ["InReview", "OnHold", "ClarificationRequired"].includes(a.review);
    if (a.state !== "Draft" && !reviewable) return null;
    return (
      <>
        {a.editable && <><div className="em-actions"><button type="button" className="mw-button" disabled={archived} onClick={() => open({ kind: "capture", id: a.id })}>Continue capture</button></div><p className="cm-note">Draft saved on server — not submitted. Nothing here is evaluated or reviewed until you submit it.</p></>}
        {a.state === "Draft" && !a.editable && <p className="cm-note">Draft — not submitted. It is being captured by {a.performer_name}.</p>}
        {reviewable && (
          <>
            <div className="em-actions">{reviewDecisions.map((decision) => <button key={decision} type="button" className={decision === "Accepted" ? "mw-button mw-button-primary" : "mw-button"} disabled={!!d.refusals.review_evidence || archived} onClick={() => open({ kind: "review", id: a.id, decision })}>{decisionWords[decision].action}</button>)}</div>
            <Refusal reason={d.refusals.review_evidence} />
          </>
        )}
        {a.review === "ClarificationRequired" && (
          <>
            <div className="em-actions"><button type="button" className="mw-button" disabled={!!clarifyRefusal(a) || archived} onClick={() => open({ kind: "clarify", id: a.id })}>Provide clarification</button></div>
            <Refusal reason={clarifyRefusal(a)} />
          </>
        )}
      </>
    );
  };
  return (
    <section className="cm-panel" id="cm-panel-attempts" tabIndex={-1} aria-labelledby="cm-attempts-title">
      <header>
        <div><h3 id="cm-attempts-title">Attempts &amp; retests</h3><p>Newest first. A submitted attempt is frozen with its evidence; a correction is a successor attempt, and every earlier result, return and hold stays here.</p></div>
        <div className="em-actions">
          {mine ? <button type="button" className="mw-button mw-button-primary" disabled={archived} onClick={() => open({ kind: "capture", id: mine.id })}>Continue attempt {mine.number}</button>
            : <button type="button" className="mw-button mw-button-primary" disabled={!!d.refusals.open_attempt || archived} onClick={() => open({ kind: "open" })}>{submitted ? "Open retest" : "Record test attempt"}</button>}
        </div>
      </header>
      {((!mine && d.refusals.open_attempt) || (!dialog && (act.command.state === "saved" || act.command.error))) && <div className="cm-panel-body">{!mine && <Refusal reason={d.refusals.open_attempt} />}{!dialog && act.notice}</div>}
      {attempts.map((a) => <AttemptBlock key={a.id} d={d} a={a} zone={zone}>{actions(a)}</AttemptBlock>)}
      {!attempts.length && <div className="em-empty"><strong>No attempt recorded</strong><p>A test is recorded against the exact approved basis, by the assigned performer.</p></div>}
      {dialog?.kind === "open" && <OpenAttempt d={d} command={act.command} onClose={() => setDialog(null)} onOpened={(id) => setDialog({ kind: "capture", id })} />}
      {capturing?.editable && <Capture d={d} a={capturing} options={options} zone={zone} loading={loading} reload={reload} onClose={() => setDialog(null)} onSubmitted={() => { setDialog(null); announce(`Attempt ${capturing.number} was submitted and received by the server. It is now in evidence review.`); }} />}
      {reviewing && dialog?.kind === "review" && <Review d={d} a={reviewing} first={dialog.decision} options={options} command={act.command} onClose={() => setDialog(null)} />}
      {clarifying && <Clarify d={d} a={clarifying} command={act.command} onClose={() => setDialog(null)} />}
    </section>
  );
}

// One attempt exactly as it was captured. Evaluation, evidence review and applicability are separate; nothing here is editable.
function AttemptBlock({ d, a, zone, children }: { d: Detail; a: Attempt; zone: string | null; children: React.ReactNode }) {
  const { packageId } = useCommissioning(), at = a.timezone ?? zone, unmet = a.prerequisites.filter((x) => !x.met).length;
  const entry = (r: Attempt["results"][number]) => (r.state === "Recorded" ? (r.choice ?? (r.value !== null ? `${r.value}${r.unit ? ` ${r.unit}` : ""}` : "No value captured")) : r.state === "NotTested" ? "Not tested" : "Not applicable");
  return (
    <article className="cm-attempt" aria-labelledby={`cm-attempt-${a.id}`}>
      <div className="cm-attempt-head">
        <h4 id={`cm-attempt-${a.id}`}>Attempt {a.number}{a.predecessor_number && ` — retest of attempt ${a.predecessor_number}`}</h4>
        <Tag view={a.review_view} />
      </div>
      <div className="cm-panel-body">
        <div className="cm-grid">
          <div className="cm-row"><span>Test basis</span><span>{a.plan_source.reference}<small className="cm-hash">{a.plan_source.hash.slice(0, 16)}</small></span></div>
          <div className="cm-row"><span>Tested configuration</span><span>{a.configuration_reference ?? "Not named yet"}</span></div>
          <div className="cm-row"><span>Performer</span><span>{a.performer_name}</span></div>
          <div className="cm-row"><span>Tested</span><span>{a.occurred_at ? `Tested ${siteTime(a.occurred_at, at)}` : "Test time not recorded yet"}</span></div>
          <div className="cm-row"><span>Received</span><span>{a.received_at ? `Received by server ${siteTime(a.received_at, at)}` : "Not submitted: the server has received no attempt"}</span></div>
          <div className="cm-row"><span>Clock concern</span><span>{a.clock_concern ?? "None recorded"}</span></div>
          {a.findings && <div className="cm-row"><span>Findings</span><span>{a.findings}</span></div>}
          {a.submitted_hash && <div className="cm-row"><span>Submitted content hash</span><span className="cm-hash">{a.submitted_hash}</span></div>}
          {a.defects.length > 0 && <div className="cm-row"><span>Defects</span><span>{a.defects.map((x) => `${x.reference} ${x.relation === "Retest" ? "retested" : x.relation.toLowerCase()} here`).join(" · ")}</span></div>}
        </div>
        {a.prerequisites.length > 0 && (
          <>
            <h5 className="cm-test-subhead">Prerequisites{a.state === "Draft" && unmet > 0 && ` — ${unmet} not met`}</h5>
            <ul className="cm-test-list">{a.prerequisites.map((x) => <li key={x.key}><span>{x.label}<small>{x.kind === "Hold" || x.kind === "Witness" ? `${x.kind} point` : x.kind}{x.mandatory ? " · mandatory" : " · advisory"}</small></span><Tag view={x.met ? tag("Met", "positive", "tick") : tag("Not met", x.mandatory ? "caution" : "neutral", x.mandatory ? "alert" : "document")} /></li>)}</ul>
          </>
        )}
      </div>
      <h5 className="cm-test-subhead cm-test-subhead-flush">Instruments</h5>
      <div className="em-table-scroll">
        <table className="em-table cm-table">
          <caption className="mw-sr">Instruments used in attempt {a.number}, assessed at the time of the test</caption>
          <thead><tr>{["Reference", "Calibration", "Valid from – to", "At the time of test"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
          <tbody>
            {a.instruments.map((i) => (
              <tr key={i.instrument_id}>
                <td><span className="cm-test-title">{i.reference}</span><span className="em-cell-sub">{i.description}</span></td>
                <td data-label="Calibration">{i.calibration_reference}</td>
                <td data-label="Valid from – to">{longDate(i.valid_from)} – {longDate(i.valid_to)}</td>
                <td data-label="At the time of test"><Tag view={tag(i.assessment_label, ...(instrumentTone[i.assessment] ?? instrumentTone.Unknown))} />{i.reason && <span className="em-cell-sub">{i.reason}</span>}{i.expired_today && i.assessment === "ValidAtUse" && <span className="em-cell-sub">Expired today — the historic test stands</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!a.instruments.length && <div className="em-empty cm-test-empty"><p>No instrument is named on this attempt.</p></div>}
      </div>
      <h5 className="cm-test-subhead cm-test-subhead-flush">Results</h5>
      <div className="em-table-scroll">
        <table className="em-table cm-table">
          <caption className="mw-sr">Results of attempt {a.number} as captured, with the server&apos;s evaluation</caption>
          <thead><tr>{["Check", "Entry as captured", "Evaluation", "Reason", "Compared value", "Rule version"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
          <tbody>
            {a.results.map((r) => (
              <tr key={r.check_key}>
                <td><span className="cm-test-title">{r.name}</span>{r.note && <span className="em-cell-sub">{r.note}</span>}</td>
                <td data-label="Entry as captured">{entry(r)}{r.reason && <span className="em-cell-sub">{r.reason}</span>}</td>
                <td data-label="Evaluation">{r.evaluation_view ? <Tag view={r.evaluation_view} /> : "Not evaluated until submitted"}</td>
                <td data-label="Reason">{r.evaluation_reason ?? "—"}</td>
                <td data-label="Compared value">{r.compared ?? "—"}</td>
                <td data-label="Rule version">{r.rule_version ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!a.results.length && <div className="em-empty cm-test-empty"><p>No entry is saved for this attempt yet. It covers {plural(a.check_keys.length, "check")}.</p></div>}
      </div>
      <h5 className="cm-test-subhead cm-test-subhead-flush">Evidence</h5>
      <div className="em-table-scroll">
        <table className="em-table cm-table">
          <caption className="mw-sr">Evidence of attempt {a.number}</caption>
          <thead><tr>{["Evidence", "Kind", "State", "Content hash", "Added by", "File"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
          <tbody>
            {a.evidence.map((e) => (
              <tr key={e.id}>
                <td><span className="cm-test-title">{e.label}</span><span className="em-cell-sub">{e.purpose} · {e.check_key ? a.results.find((r) => r.check_key === e.check_key)?.name ?? d.definitions.find((k) => k.key === e.check_key)?.name ?? e.check_key : "whole attempt"}</span></td>
                <td data-label="Kind">{evidenceKinds[e.kind] ?? e.kind}{e.media_type && <span className="em-cell-sub">{e.media_type} · {e.byte_count} bytes</span>}</td>
                <td data-label="State"><Tag view={evidenceView[e.state] ?? tag(e.state, "neutral", "document")} /></td>
                <td data-label="Content hash"><span className="cm-hash">{e.content_hash ?? "Unavailable"}</span></td>
                <td data-label="Added by">{e.added_by_name}<span className="em-cell-sub">{siteTime(e.added_at, at)}</span></td>
                <td data-label="File">{e.downloadable ? <a href={`/api/v1/engineering/${packageId}/commissioning/files?kind=evidence&evidence=${e.id}`} download>Download exact file</a> : "No stored file"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!a.evidence.length && <div className="em-empty cm-test-empty"><p>{a.evidence_count ? `${plural(a.evidence_count, "item")} of evidence, withheld for this identity.` : "No evidence is attached to this attempt."}</p></div>}
      </div>
      <h5 className="cm-test-subhead cm-test-subhead-flush">Review history</h5>
      <ol className="cm-timeline">
        {a.reviews.map((v) => (
          <li key={v.id}>
            <time dateTime={v.decided_at}>{siteTime(v.decided_at, at)}</time>
            <div><strong>{v.decision_label}</strong> by {v.decided_by_name}<small>{v.reason}</small>{(v.owner_name || v.due) && <small>Owned by {v.owner_name ?? "Unassigned"} · due {longDate(v.due)}</small>}</div>
          </li>
        ))}
      </ol>
      {!a.reviews.length && <div className="cm-panel-body"><p className="cm-note">{a.state === "Draft" ? "Not submitted, so there is nothing to review." : "No review decision yet."}</p></div>}
      {children && <div className="cm-panel-body cm-attempt-actions">{children}</div>}
    </article>
  );
}

// ---------------------------------------------------------------------------------------------
function OpenAttempt({ d, command, onClose, onOpened }: { d: Detail; command: Command; onClose: () => void; onOpened: (id: string) => void }) {
  const { packageId } = useCommissioning(), [id] = useState(newId), submitted = d.attempts.filter((a) => a.state === "Submitted"), defects = d.defects.filter((x) => x.state !== "Closed");
  const [predecessor, setPredecessor] = useState(submitted.at(-1)?.id ?? ""), required = d.definitions.filter((k) => k.is_required).map((k) => k.key);
  // A retest starts on the checks of the open defects; any other check of the approved basis may be added.
  const [keys, setKeys] = useState<string[]>(() => (submitted.length && defects.length ? [...new Set(defects.map((x) => x.check_key))].filter((k) => d.definitions.some((x) => x.key === k)) : required));
  const send = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning/results`, { action: "open", id, record_id: d.record.id, expected_version: d.record.version, check_keys: keys, scope_keys: [], predecessor_id: predecessor || null, reason: predecessor ? "Retest opened against the approved test basis" : "Test attempt opened against the approved test basis" });
    if (receipt) onOpened(id);
  };
  return (
    <Dialog title={submitted.length ? "Open retest" : "Record test attempt"} subtitle="Opens a draft against the exact approved basis, with you as its performer. Sources are rechecked first. Nothing is evaluated until you submit it." drawer busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void send()} disabled={command.busy || !keys.length}>{command.busy ? "Saving…" : "Open draft attempt"}</button></>}>
      <div className="cm-stack">
        {submitted.length > 0 && (
          <Field label="This attempt is" hint="A retest never edits the attempt it follows" error={fieldError(command.error, "predecessor_id")}>
            <select data-autofocus value={predecessor} onChange={(e) => setPredecessor(e.target.value)}>{[...submitted].reverse().map((a) => <option key={a.id} value={a.id}>A retest of attempt {a.number}</option>)}<option value="">A first test of these checks</option></select>
          </Field>
        )}
        <fieldset className="cm-test-checks"><legend>Checks this attempt covers</legend>
          {d.definitions.map((k) => {
            const defect = defects.find((x) => x.check_key === k.key);
            return <label className="cm-test-check" key={k.key}><input type="checkbox" checked={keys.includes(k.key)} onChange={(e) => setKeys(e.target.checked ? [...keys, k.key] : keys.filter((x) => x !== k.key))} /><span>{k.name}<small>{k.scope_title}{defect ? ` · ${defect.reference} open` : ""}{k.is_required ? "" : " · not required"}</small></span></label>;
          })}
        </fieldset>
        <div className="em-actions"><button type="button" className="mw-button mw-button-quiet" onClick={() => setKeys(d.definitions.map((k) => k.key))}>Select all checks</button></div>
        {fieldError(command.error, "check_keys") && <p className="mw-inline-error" role="alert">{fieldError(command.error, "check_keys")}</p>}
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
type ReadingForm = { state: "Recorded" | "NotTested" | "NotApplicable"; value: string; unit: string; choice: string; reason: string; note: string };
type CaptureForm = { configuration: string; date: string; time: string; clock_concern: string; met: Record<string, boolean>; instruments: string[]; readings: Record<string, ReadingForm>; findings: string };
// What the server holds, as a form. The suggested configuration is only ever a suggestion: it is not held until it is saved.
function formOf(a: Attempt, plan: Plan[], zone: string | null, configuration: string): CaptureForm {
  const at = a.occurred_at && (a.timezone ?? zone) ? siteParts(new Date(a.occurred_at), (a.timezone ?? zone)!) : { date: "", time: "" };
  return {
    configuration: a.configuration_reference ?? configuration, ...at, clock_concern: a.clock_concern ?? "", met: Object.fromEntries(a.prerequisites.map((x) => [x.key, x.met])), instruments: a.instruments.map((i) => i.instrument_id).sort(), findings: a.findings ?? "",
    readings: Object.fromEntries(a.check_keys.map((key) => { const r = a.results.find((x) => x.check_key === key); return [key, { state: r?.state ?? "Recorded", value: r?.value ?? "", unit: r?.unit ?? plan.find((k) => k.key === key)?.numeric?.unit ?? "", choice: r?.choice ?? "", reason: r?.reason ?? "", note: r?.note ?? "" }]; })),
  };
}
const touched = (r: ReadingForm) => r.state !== "Recorded" || !!(r.value.trim() || r.choice || r.reason.trim() || r.note.trim());

function Capture({ d, a, options, zone, loading, reload, onClose, onSubmitted }: Shared & { a: Attempt; onClose: () => void; onSubmitted: () => void }) {
  const { packageId } = useCommissioning(), command = useCommissioningCommand(reload), path = `engineering/${packageId}/commissioning/results`, at = a.timezone ?? zone;
  // The attempt's own frozen plan: the checks of the exact basis it was opened against, with their units and choices.
  const plan = (d.bases.find((b) => b.id === a.plan_source.id)?.checks ?? []).filter((k) => a.check_keys.includes(k.key)), earlier = a.predecessor_id ? d.attempts.find((x) => x.id === a.predecessor_id) ?? null : null;
  const [form, setForm] = useState(() => formOf(a, plan, zone, d.configuration?.label ?? "")), [saved, setSaved] = useState("Draft saved on server — not submitted."), [submit, setSubmit] = useState({ owner: "", due: "", severity: "Unclassified" });
  const dirty = JSON.stringify(form) !== JSON.stringify(formOf(a, plan, zone, "")), busy = command.busy || loading, occurred = at ? siteInstant(form.date, form.time, at) : null;
  const patch = (next: Partial<CaptureForm>) => setForm((old) => ({ ...old, ...next })), reading = (key: string, next: Partial<ReadingForm>) => setForm((old) => ({ ...old, readings: { ...old.readings, [key]: { ...old.readings[key], ...next } } }));
  const save = () => {
    setSaved("Draft saved on server — not submitted.");
    return command.send(path, {
      action: "save", record_id: d.record.id, attempt_id: a.id, expected_version: a.version, configuration_reference: orNull(form.configuration), configuration_source_id: a.configuration_source_id, occurred_at: occurred, timezone: at, clock_concern: orNull(form.clock_concern), findings: orNull(form.findings),
      prerequisites: a.prerequisites.map((x) => ({ key: x.key, label: x.label, kind: x.kind, mandatory: x.mandatory, source: x.source, met: !!form.met[x.key] })), instrument_ids: form.instruments, reason: `Draft of attempt ${a.number} saved`,
      // An entry is sent as it was typed. The server evaluates it on submission; no evaluation is ever sent from here.
      readings: a.check_keys.filter((key) => touched(form.readings[key])).map((key) => {
        const r = form.readings[key], k = plan.find((x) => x.key === key), recorded = r.state === "Recorded";
        return { check_key: key, state: r.state, value: recorded && k?.check_type !== "Qualitative" ? orNull(r.value) : null, unit: recorded && k?.check_type !== "Qualitative" ? orNull(r.unit) : null, choice: recorded && k?.check_type === "Qualitative" ? orNull(r.choice) : null, reason: orNull(r.reason), note: orNull(r.note) };
      }),
    });
  };
  const send = async () => {
    const receipt = await command.send(path, { action: "submit", record_id: d.record.id, attempt_id: a.id, expected_version: a.version, owner_id: submit.owner || null, due: submit.due || null, severity: submit.severity, reason: `Attempt ${a.number} submitted for evidence review` });
    if (receipt) onSubmitted();
  };
  return (
    <Dialog title={`Capture attempt ${a.number}${a.predecessor_number ? ` — retest of attempt ${a.predecessor_number}` : ""}`} subtitle={`Against ${a.plan_source.reference}. Entries are kept exactly as typed; the server evaluates them when the attempt is submitted.`} drawer wide busy={busy} dirty={dirty} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Close</button><button type="button" className="mw-button" onClick={() => void save()} disabled={busy}>{command.busy ? "Saving…" : "Save draft"}</button><button type="button" className="mw-button mw-button-primary" onClick={() => void send()} disabled={busy || dirty}>Submit attempt</button></>}>
      <div className="cm-stack">
        <div className="cm-inline">
          <Field label="Tested configuration" hint="The exact configuration that was present at the test" error={fieldError(command.error, "configuration_reference")}><input data-autofocus value={form.configuration} maxLength={200} onChange={(e) => patch({ configuration: e.target.value })} /></Field>
          <Field label="Date of the test" error={fieldError(command.error, "occurred_at")}><input type="date" value={form.date} onChange={(e) => patch({ date: e.target.value })} /></Field>
          <Field label="Time of the test" hint={`Site time zone: ${at ?? "unknown"}`}><input type="time" value={form.time} onChange={(e) => patch({ time: e.target.value })} /></Field>
        </div>
        <p className="cm-note">{occurred ? `Recorded as ${siteTime(occurred, at)} (${occurred}). ` : "Enter when the test actually took place. "}The time this form is saved is never the time of the test.</p>
        <Field label="Clock concern (optional)" hint="Say so if the device clock or the recorded time is in doubt"><input value={form.clock_concern} maxLength={400} onChange={(e) => patch({ clock_concern: e.target.value })} /></Field>

        {a.prerequisites.length > 0 && (
          <fieldset className="cm-test-checks"><legend>Prerequisites met</legend>
            {a.prerequisites.map((x) => <label className="cm-test-check" key={x.key}><input type="checkbox" checked={!!form.met[x.key]} onChange={(e) => patch({ met: { ...form.met, [x.key]: e.target.checked } })} /><span>{x.label}<small>{x.kind === "Hold" || x.kind === "Witness" ? `${x.kind} point` : x.kind}{x.mandatory ? " · mandatory, with no general override" : " · advisory"}</small></span></label>)}
          </fieldset>
        )}
        <fieldset className="cm-test-checks"><legend>Instruments used</legend>
          {options?.instruments.map((i) => (
            <label className="cm-test-check" key={i.id}><input type="checkbox" checked={form.instruments.includes(i.id)} onChange={(e) => patch({ instruments: (e.target.checked ? [...form.instruments, i.id] : form.instruments.filter((x) => x !== i.id)).sort() })} />
              <span>{i.reference} · {i.description}<small>{i.calibration_reference} valid {longDate(i.valid_from)} – {longDate(i.valid_to)}{i.withdrawn_effective_from ? ` · withdrawn with effect from ${longDate(i.withdrawn_effective_from)}` : ""}</small></span></label>
          ))}
          {!options?.instruments.length && <p className="cm-note">No instrument record is available to this identity.</p>}
          <p className="cm-note">{options?.limits[1] ?? "Instruments and calibration records are fictional fixtures."} Validity is assessed for the date of the test, not for today.</p>
        </fieldset>

        <h3 className="cm-test-subhead">Readings</h3>
        {plan.map((k) => {
          const r = form.readings[k.key], before = earlier?.results.find((x) => x.check_key === k.key), units = k.numeric ? [k.numeric.unit, ...k.numeric.conversions.map((c) => c.from_unit)] : [];
          return (
            <fieldset className="cm-test-block" key={k.key}>
              <legend>{k.name}</legend>
              <p className="cm-note">{k.has_criterion ? <>Criterion: {k.criterion_text} <span className="cm-fictional">Fictional limit</span></> : "Criteria missing: the reading is kept as captured and cannot be assessed until a successor basis defines the criterion."}{k.evidence_min > 0 && ` · ${plural(k.evidence_min, "item")} of evidence required`}{k.instrument_required && " · named instrument required"}</p>
              {before && <p className="cm-note cm-test-earlier">Earlier value — not carried forward: attempt {earlier!.number} recorded {before.state === "Recorded" ? (before.choice ?? `${before.value ?? "no value"}${before.unit ? ` ${before.unit}` : ""}`) : before.state === "NotTested" ? "not tested" : "not applicable"}{before.evaluation_view && ` (${before.evaluation_view.label.toLowerCase()})`}.</p>}
              <div className="cm-inline">
                <Field label="Entry"><select value={r.state} onChange={(e) => reading(k.key, { state: e.target.value as ReadingForm["state"] })}><option value="Recorded">Recorded</option><option value="NotTested">Not tested</option><option value="NotApplicable">Not applicable</option></select></Field>
                {r.state === "Recorded" && k.check_type === "Numeric" && (
                  <>
                    <Field label="Reading" hint={k.numeric ? `As the instrument showed it, to ${plural(k.numeric.precision, "decimal place")} at most` : "As the instrument showed it"}><input inputMode="decimal" value={r.value} onChange={(e) => reading(k.key, { value: e.target.value })} /></Field>
                    <Field label="Unit">{units.length ? <select value={r.unit} onChange={(e) => reading(k.key, { unit: e.target.value })}>{units.map((u) => <option key={u}>{u}</option>)}</select> : <input value={r.unit} maxLength={20} onChange={(e) => reading(k.key, { unit: e.target.value })} />}</Field>
                  </>
                )}
                {r.state === "Recorded" && k.check_type === "Qualitative" && <Field label="Outcome"><select value={r.choice} onChange={(e) => reading(k.key, { choice: e.target.value })}><option value="">Choose…</option>{k.qualitative?.choices.map((c) => <option key={c}>{c}</option>)}</select></Field>}
                {r.state !== "Recorded" && <Field label={r.state === "NotTested" ? "Why it was not tested" : "Why it does not apply"} hint={r.state === "NotApplicable" ? "“Not applicable” needs an approved condition in the test basis. Without one the check stays required and is reported as unable to assess" : undefined}><input value={r.reason} maxLength={600} onChange={(e) => reading(k.key, { reason: e.target.value })} /></Field>}
              </div>
              <Field label="Note (optional)"><input value={r.note} maxLength={1000} onChange={(e) => reading(k.key, { note: e.target.value })} /></Field>
            </fieldset>
          );
        })}
        {plan.length < a.check_keys.length && <p className="cm-note" role="note">{plural(a.check_keys.length - plan.length, "check")} of this attempt cannot be shown because the basis it was opened against is not readable here.</p>}
        <Field label="Findings (optional)" error={fieldError(command.error, "findings")}><textarea value={form.findings} maxLength={4000} onChange={(e) => patch({ findings: e.target.value })} /></Field>

        <h3 className="cm-test-subhead">Evidence</h3>
        <EvidenceEditor d={d} a={a} plan={plan} options={options} command={command} busy={busy} onSent={setSaved} />

        <h3 className="cm-test-subhead">Submit</h3>
        <p className="cm-note">Submitting freezes this attempt with its evidence and evaluates every entry. A failed required check raises one owned defect, or lands on the one already open for that check.</p>
        <div className="cm-inline">
          <Field label="Owner of any defect raised" hint="Leave empty for the package owner" error={fieldError(command.error, "owner_id")}><select value={submit.owner} onChange={(e) => setSubmit({ ...submit, owner: e.target.value })}><option value="">Package owner{d.record.owner_name ? ` (${d.record.owner_name})` : ""}</option>{options?.people.filter((p) => p.preparer).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Due" hint="Leave empty for seven days from today"><input type="date" value={submit.due} onChange={(e) => setSubmit({ ...submit, due: e.target.value })} /></Field>
          <Field label="Severity"><select value={submit.severity} onChange={(e) => setSubmit({ ...submit, severity: e.target.value })}>{severities.map((s) => <option key={s}>{s}</option>)}</select></Field>
        </div>
        {dirty && <Refusal reason="Save the draft first: what is submitted is exactly what the server holds." />}
        <CommandNotice command={command} saved={saved} />
      </div>
    </Dialog>
  );
}

function EvidenceEditor({ d, a, plan, options, command, busy, onSent }: { d: Detail; a: Attempt; plan: Plan[]; options: Options | null; command: Command; busy: boolean; onSent: (saved: string) => void }) {
  const { packageId } = useCommissioning(), blank = { kind: "StoredFile", check_key: "", label: "", purpose: "", access_class: "Internal", source_id: "", entry_id: "", entry_revision: "" }, [id, setId] = useState(newId), [e, setE] = useState(blank), [file, setFile] = useState<File | null>(null), [problem, setProblem] = useState<string | null>(null);
  const retained = options?.sources.filter((s) => s.kind === "TestEvidence" && s.readable) ?? [], set = (k: keyof typeof blank) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setE({ ...e, [k]: event.target.value });
  const choose = (chosen: File | null) => {
    const type = chosen ? (chosen.type || (chosen.name.toLowerCase().endsWith(".png") ? "image/png" : chosen.name.toLowerCase().endsWith(".txt") ? "text/plain" : "")) : "";
    setProblem(!chosen ? null : !["image/png", "text/plain"].includes(type) ? "Evidence files are PNG images or plain text." : chosen.size < 1 || chosen.size > 4_194_304 ? "Evidence files are 1 byte to 4 MiB." : null);
    setFile(chosen);
    if (chosen && !e.label) setE({ ...e, label: chosen.name.slice(0, 200) });
  };
  const ready = !!e.label.trim() && !!e.purpose.trim() && (e.kind === "StoredFile" ? !!file && !problem : e.kind === "RetainedSource" ? !!e.source_id : !!e.entry_id.trim() && Number(e.entry_revision) >= 1);
  const add = async () => {
    const shared = { id, check_key: e.check_key || null, label: e.label, purpose: e.purpose, access_class: e.access_class, kind: e.kind };
    let evidence: Record<string, unknown> = e.kind === "RetainedSource" ? { ...shared, source_id: e.source_id } : { ...shared, field_entry_id: e.entry_id.trim(), field_entry_revision: Number(e.entry_revision) };
    if (e.kind === "StoredFile" && file) {
      // The hash is of the exact bytes that are sent. The server recomputes it and stores nothing that does not match.
      const bytes = new Uint8Array(await file.arrayBuffer());
      evidence = { ...shared, media_type: file.type || (file.name.toLowerCase().endsWith(".png") ? "image/png" : "text/plain"), byte_count: bytes.length, sha256: hex(await crypto.subtle.digest("SHA-256", bytes)), content_base64: base64(bytes) };
    }
    onSent("Evidence recorded on the server. The attempt is still a draft — not submitted.");
    const receipt = await command.send(`engineering/${packageId}/commissioning/results/evidence`, { action: "evidence", record_id: d.record.id, attempt_id: a.id, expected_version: a.version, evidence, reason: `Evidence added to draft attempt ${a.number}` });
    if (receipt) { setId(newId()); setE(blank); setFile(null); }
  };
  const remove = (evidenceId: string) => { onSent("Evidence removed on the server. The attempt is still a draft — not submitted."); return command.send(`engineering/${packageId}/commissioning/results`, { action: "remove_evidence", record_id: d.record.id, attempt_id: a.id, expected_version: a.version, evidence_id: evidenceId, reason: `Evidence removed from draft attempt ${a.number}` }); };
  return (
    <>
      <ul className="cm-test-list">
        {a.evidence.map((x) => (
          <li key={x.id}>
            <span>{x.label}<small>{evidenceKinds[x.kind] ?? x.kind} · {x.check_key ? plan.find((k) => k.key === x.check_key)?.name ?? x.check_key : "whole attempt"} · <span className="cm-hash">{x.content_hash?.slice(0, 16) ?? "no hash"}</span></small></span>
            <Tag view={evidenceView[x.state] ?? tag(x.state, "neutral", "document")} />
            <button type="button" className="mw-button mw-button-quiet" disabled={busy} onClick={() => void remove(x.id)} aria-label={`Remove evidence ${x.label}`}>Remove</button>
          </li>
        ))}
      </ul>
      {!a.evidence.length && <p className="cm-note">No evidence is attached yet.</p>}
      <fieldset className="cm-test-block">
        <legend>Add evidence</legend>
        <div className="cm-inline">
          <Field label="Kind"><select value={e.kind} onChange={set("kind")}><option value="StoredFile">File upload (PNG or TXT, up to 4 MiB)</option><option value="RetainedSource">Retained source</option><option value="FieldEntry">Field entry</option></select></Field>
          <Field label="Supports"><select value={e.check_key} onChange={set("check_key")}><option value="">The whole attempt</option>{plan.map((k) => <option key={k.key} value={k.key}>{k.name}</option>)}</select></Field>
          <Field label="Access"><select value={e.access_class} onChange={set("access_class")}><option value="Internal">Internal</option><option value="CustomerSafe">Customer safe</option></select></Field>
        </div>
        {e.kind === "StoredFile" && <Field label="File" hint="Its SHA-256 is computed here from the exact bytes and checked again by the server" error={problem ?? undefined}><input type="file" accept=".png,.txt,image/png,text/plain" onChange={(event) => choose(event.target.files?.[0] ?? null)} key={id} /></Field>}
        {e.kind === "RetainedSource" && <Field label="Retained test evidence" error={fieldError(command.error, "source_id")}><select value={e.source_id} onChange={set("source_id")}><option value="">{retained.length ? "Choose…" : "No test evidence is retained for this package"}</option>{retained.map((s) => <option key={s.id} value={s.id}>{s.reference} · Rev {s.revision} — {s.title}</option>)}</select></Field>}
        {e.kind === "FieldEntry" && (
          <div className="cm-inline">
            <Field label="Field entry id" hint="The original entry keeps its identity, revision and appointment" error={fieldError(command.error, "field_entry_id")}><input value={e.entry_id} onChange={set("entry_id")} /></Field>
            <Field label="Exact revision inspected" error={fieldError(command.error, "field_entry_revision")}><input type="number" min={1} value={e.entry_revision} onChange={set("entry_revision")} /></Field>
          </div>
        )}
        <div className="cm-inline">
          <Field label="Label" error={fieldError(command.error, "label")}><input value={e.label} maxLength={200} onChange={set("label")} /></Field>
          <Field label="What it shows" error={fieldError(command.error, "purpose")}><input value={e.purpose} maxLength={300} onChange={set("purpose")} /></Field>
        </div>
        <div className="em-actions"><button type="button" className="mw-button" disabled={busy || !ready} onClick={() => void add()}>{command.busy ? "Saving…" : "Add evidence"}</button></div>
      </fieldset>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
function Review({ d, a, first, options, command, onClose }: { d: Detail; a: Attempt; first: ReviewDecision; options: Options | null; command: Command; onClose: () => void }) {
  const { packageId } = useCommissioning(), [id] = useState(newId), [decision, setDecision] = useState(first), [why, setWhy] = useState(""), [owner, setOwner] = useState(a.performer_id), [due, setDue] = useState(""), owned = decision !== "Accepted";
  const count = (evaluation: string) => a.results.filter((r) => r.evaluation === evaluation).length, incomplete = a.evidence.filter((e) => e.state !== "Complete").length;
  const decide = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning/results`, { action: "review", id, record_id: d.record.id, attempt_id: a.id, decision, decision_reason: why, ...(owned ? { owner_id: owner, due } : {}), reason: `Evidence review of attempt ${a.number}: ${decisionWords[decision].action.toLowerCase()}` });
    if (receipt) onClose();
  };
  return (
    <Dialog title={`${decisionWords[decision].title} attempt ${a.number}`} subtitle="You are reviewing this exact frozen attempt. Accepting its evidence is not a release; it closes only the defects whose own check this attempt freshly passed." drawer busy={command.busy} dirty={!!why} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void decide()} disabled={command.busy || !why.trim() || (owned && (!owner || !due))}>{command.busy ? "Saving…" : decisionWords[decision].action}</button></>}>
      <div className="cm-stack">
        <div className="cm-row"><span>Submitted content hash</span><span className="cm-hash">{a.submitted_hash}</span></div>
        <div className="cm-row"><span>Evaluations</span><span>{count("Pass")} passed · {count("Fail")} failed · {count("NotTested")} not tested · {count("UnableToAssess") + count("NotApplicable")} unable to assess</span></div>
        <div className="cm-row"><span>Evidence</span><span>{plural(a.evidence.length, "item")}{incomplete > 0 && `, ${incomplete} not complete`}</span></div>
        <Field label="Decision" error={fieldError(command.error, "decision")}><select data-autofocus value={decision} onChange={(e) => setDecision(e.target.value as ReviewDecision)}>{reviewDecisions.map((x) => <option key={x} value={x}>{decisionWords[x].action}</option>)}</select></Field>
        <Field label="Reason" hint="Kept with the attempt. A later acceptance never removes an earlier return, clarification or hold" error={fieldError(command.error, "decision_reason")}><textarea value={why} maxLength={4000} onChange={(e) => setWhy(e.target.value)} /></Field>
        {owned && (
          <div className="cm-inline">
            <Field label="Next action owned by" error={fieldError(command.error, "owner_id")}><select value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Choose…</option>{!options?.people.some((p) => p.id === a.performer_id) && <option value={a.performer_id}>{a.performer_name}</option>}{options?.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Due" error={fieldError(command.error, "due")}><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          </div>
        )}
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function Clarify({ d, a, command, onClose }: { d: Detail; a: Attempt; command: Command; onClose: () => void }) {
  const { packageId } = useCommissioning(), [id] = useState(newId), [why, setWhy] = useState(""), asked = [...a.reviews].reverse().find((v) => v.decision === "ClarificationRequired");
  const send = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning/results`, { action: "clarify", id, record_id: d.record.id, attempt_id: a.id, decision_reason: why, reason: `Clarification provided on attempt ${a.number}` });
    if (receipt) onClose();
  };
  return (
    <Dialog title={`Provide clarification on attempt ${a.number}`} subtitle="Your answer is added to the review history and the attempt returns to review. The frozen attempt itself does not change." busy={command.busy} dirty={!!why} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void send()} disabled={command.busy || !why.trim()}>{command.busy ? "Saving…" : "Provide clarification"}</button></>}>
      <div className="cm-stack">
        {asked && <p className="cm-note">{asked.decided_by_name} asked: {asked.reason}</p>}
        <Field label="Clarification" error={fieldError(command.error, "decision_reason")}><textarea data-autofocus value={why} maxLength={4000} onChange={(e) => setWhy(e.target.value)} /></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
function DefectsPanel({ d, options, zone, reload }: Shared) {
  const { packageId, frame } = useCommissioning(), act = useAct(reload), [dialog, setDialog] = useState<{ kind: "coordinate" | "correct"; id: string } | null>(null), archived = !!d.record.archived_at, chosen = dialog ? d.defects.find((x) => x.id === dialog.id) ?? null : null;
  const correctRefusal = frame && !frame.can.capture && !frame.can.edit ? "Recording a correction belongs to the performer or a preparer of this package." : null, open = (kind: "coordinate" | "correct", id: string) => { act.command.clear(); setDialog({ kind, id }); };
  const action = (x: Defect) => (!x.activity ? "No My Work action" : x.activity.status === "Open" ? `Open — ${x.activity.owner_name} — due ${longDate(x.activity.due_at?.slice(0, 10) ?? null)}` : `${x.activity.status}: ${x.activity.outcome ?? "no outcome recorded"}`);
  return (
    <section className="cm-panel" id="cm-panel-defects" tabIndex={-1} aria-labelledby="cm-defects-title">
      <header><div><h3 id="cm-defects-title">Defects</h3><p>One defect per failed check. Recording a correction closes nothing: a defect closes only on a fresh accepted retest of its own check, and the failure that raised it stays on the record.</p></div></header>
      <div className="em-table-scroll">
        <table className="em-table cm-table cm-test-defects">
          <caption className="mw-sr">Defects of this commissioning package</caption>
          <thead><tr>{["Defect", "Check", "State", "Severity", "Owner / due", "Attempts", "Correction", "Change link", "My Work action", "Actions"].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
          <tbody>
            {d.defects.map((x) => {
              const change = x.change_id ? options?.changes.find((c) => c.id === x.change_id) : null;
              return (
                <tr key={x.id}>
                  <td><span className="cm-test-title">{x.reference}</span><span className="em-cell-sub">{x.title}</span></td>
                  <td data-label="Check">{x.check_name}</td>
                  <td data-label="State"><Tag view={x.state_view} />{x.closed_at && <span className="em-cell-sub">Closed {siteTime(x.closed_at, zone)} by an accepted retest</span>}</td>
                  <td data-label="Severity">{x.severity}</td>
                  <td data-label="Owner / due">{x.owner_name}<span className="em-cell-sub">{longDate(x.due)}</span></td>
                  <td data-label="Attempts">{x.attempts.map((t) => `${t.number} ${t.relation.toLowerCase()}`).join(" · ") || "None"}</td>
                  <td data-label="Correction">{x.correction_at ? <>{x.correction_note ?? "Correction recorded"}<span className="em-cell-sub">{x.correction_by_name} · {siteTime(x.correction_at, zone)}</span></> : x.proposed_correction ? <>{x.proposed_correction}<span className="em-cell-sub">Proposed; not yet recorded as done</span></> : "None recorded"}{x.state !== "Closed" && <span className="em-cell-sub">{x.retest_required ? "Retest required" : "Retest not required by its coordinator"}</span>}</td>
                  <td data-label="Change link">{x.change_id ? <><Link href={changesHref(packageId, "register", x.change_id)}>{change?.reference ?? "Engineering change"}</Link><span className="em-cell-sub">A referral to EN-07, not a resolution</span></> : x.changes_system ? "Changes the system: a change link is needed" : "None"}</td>
                  <td data-label="My Work action">{action(x)}</td>
                  <td data-label="Actions">{x.state === "Closed" ? "Closed" : <div className="em-actions"><button type="button" className="mw-button" disabled={!!d.refusals.edit || archived} onClick={() => open("coordinate", x.id)} aria-label={`Coordinate ${x.reference}`}>Coordinate</button><button type="button" className="mw-button" disabled={!!correctRefusal || archived} onClick={() => open("correct", x.id)} aria-label={`Record correction for ${x.reference}`}>Record correction</button></div>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!d.defects.length && <div className="em-empty"><p>No defect has been raised on this package.</p></div>}
      </div>
      <div className="cm-panel-body cm-test-after-table">
        <p className="cm-note">The My Work action is the same action My Work shows, read where it lives; it is not a copy. Completing it there does not close the defect here.</p>
        {d.defects.some((x) => x.state !== "Closed") && <><Refusal reason={d.refusals.edit && `Coordinate: ${d.refusals.edit}`} /><Refusal reason={correctRefusal && `Record correction: ${correctRefusal}`} /></>}
        {!dialog && act.notice}
      </div>
      {chosen && dialog?.kind === "coordinate" && <Coordinate d={d} x={chosen} options={options} command={act.command} onClose={() => setDialog(null)} />}
      {chosen && dialog?.kind === "correct" && <Correct d={d} x={chosen} command={act.command} onClose={() => setDialog(null)} />}
    </section>
  );
}

function Coordinate({ d, x, options, command, onClose }: { d: Detail; x: Defect; options: Options | null; command: Command; onClose: () => void }) {
  const { packageId } = useCommissioning(), [form, setForm] = useState({ owner: x.owner_id, due: x.due, severity: x.severity, correction: x.proposed_correction ?? "", retest: x.retest_required, system: x.changes_system, change: x.change_id ?? "" }), [dirty, setDirty] = useState(false);
  const set = (patch: Partial<typeof form>) => { setDirty(true); setForm({ ...form, ...patch }); };
  const save = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning/results`, { action: "defect", record_id: d.record.id, defect_id: x.id, expected_version: x.version, owner_id: form.owner, due: form.due, severity: form.severity, proposed_correction: orNull(form.correction), retest_required: form.retest, changes_system: form.system, change_id: form.change || null, reason: `${x.reference} coordinated` });
    if (receipt) onClose();
  };
  return (
    <Dialog title={`Coordinate ${x.reference}`} subtitle={x.title} drawer busy={command.busy} dirty={dirty} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void save()} disabled={command.busy || !form.owner || !form.due}>{command.busy ? "Saving…" : "Save coordination"}</button></>}>
      <div className="cm-stack">
        <div className="cm-inline">
          <Field label="Owner" error={fieldError(command.error, "owner_id")}><select data-autofocus value={form.owner} onChange={(e) => set({ owner: e.target.value })}>{!options?.people.some((p) => p.id === x.owner_id) && <option value={x.owner_id}>{x.owner_name}</option>}{options?.people.filter((p) => p.preparer).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Due" error={fieldError(command.error, "due")}><input type="date" value={form.due} onChange={(e) => set({ due: e.target.value })} /></Field>
          <Field label="Severity"><select value={form.severity} onChange={(e) => set({ severity: e.target.value })}>{severities.map((s) => <option key={s}>{s}</option>)}</select></Field>
        </div>
        <Field label="Proposed correction" hint="A proposal. It records nothing as done" error={fieldError(command.error, "proposed_correction")}><input value={form.correction} maxLength={1000} onChange={(e) => set({ correction: e.target.value })} /></Field>
        <label className="cm-test-check"><input type="checkbox" checked={form.retest} onChange={(e) => set({ retest: e.target.checked })} /><span>A retest is required after the correction</span></label>
        <label className="cm-test-check"><input type="checkbox" checked={form.system} onChange={(e) => set({ system: e.target.checked })} /><span>The correction changes the actual system<small>It is linked to its engineering change (EN-07) first. The link is a referral, never a resolution.</small></span></label>
        <Field label="Engineering change (EN-07)" error={fieldError(command.error, "change_id")}><select value={form.change} onChange={(e) => set({ change: e.target.value })}><option value="">{options?.changes.length ? "None linked" : "No engineering change exists in this package"}</option>{options?.changes.map((c) => <option key={c.id} value={c.id}>{c.reference} · {c.title}</option>)}</select></Field>
        {options && !options.changes.length && <p className="cm-note">A referral names a real change. <Link href={options.changes_href}>Record it in Change impact first</Link>.</p>}
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function Correct({ d, x, command, onClose }: { d: Detail; x: Defect; command: Command; onClose: () => void }) {
  const { packageId } = useCommissioning(), [note, setNote] = useState("");
  const save = async () => {
    const receipt = await command.send(`engineering/${packageId}/commissioning/results`, { action: "correct", record_id: d.record.id, defect_id: x.id, expected_version: x.version, note, reason: `Correction recorded for ${x.reference}` });
    if (receipt) onClose();
  };
  return (
    <Dialog title={`Record correction for ${x.reference}`} subtitle={x.title} busy={command.busy} dirty={!!note} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void save()} disabled={command.busy || !note.trim()}>{command.busy ? "Saving…" : "Record correction"}</button></>}>
      <div className="cm-stack">
        <p className="cm-note" role="note">Recording a correction closes nothing. {x.reference} closes only when a fresh retest of {x.check_name} passes and its evidence is accepted in review.</p>
        <Field label="What was corrected" error={fieldError(command.error, "note")}><textarea data-autofocus value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} /></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}
