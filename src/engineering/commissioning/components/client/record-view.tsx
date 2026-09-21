"use client";
import Link from "next/link";
import { useEffect } from "react";
import type { Failure } from "../../../../components/business-ui";
import { useIdentity } from "../../../../components/business-session";
import { commissioningHref, commissioningViews, type CommissioningViewId, type Presentation } from "../../model";
import type { readHistory, readRecord } from "../../reads";
import { CommissioningShell } from "./commissioning-shell";
import { ReadNotice, Tag, longDate, siteTime, text, useRead } from "./commissioning-ui";
import { AssociationTable, BackupBlocks, ComparisonTable, RedlineTable, type Options } from "./configuration-view";

type Data = Awaited<ReturnType<typeof readRecord>>;
type History = Awaited<ReturnType<typeof readHistory>>;
type D = Data["selected"];

const tag = (label: string, tone: Presentation["tone"], icon: Presentation["icon"]): Presentation => ({ label, tone, icon });
const pad = (n: number) => String(n).padStart(2, "0");
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
// Anchored sections of the one scrolling record. Each names the destination where that part is worked on.
const sections = [
  { id: "basis", title: "Scope, test basis and criteria", view: "basis" }, { id: "results", title: "Results, retests and defects", view: "results" }, { id: "configuration", title: "Installed configuration and redlines", view: "configuration" },
  { id: "release", title: "Review and as-built release", view: "releases" }, { id: "handover", title: "Obligations and receiving", view: "handovers" }, { id: "history", title: "History", view: "handovers" },
] as const satisfies readonly { id: string; title: string; view: CommissioningViewId }[];

// The address names the commissioning package only. Until the server has resolved its Engineering package behind the
// same access check, no shell is drawn: a header is never shown for a package this record might not belong to.
export function RecordView({ id }: { id: string }) {
  const read = useRead<Data>(`engineering/commissioning/records/${id}`);
  if (!read.data) {
    const gone = [401, 403, 404, 422].includes((read.error as Failure | null)?.status ?? 0);
    return (
      <div id="ppo-commissioning" data-view="record">
        <div className="cm-record-bare" aria-busy={read.loading}>
          {gone ? <div className="mw-notice" role="alert"><strong>Commissioning package unavailable</strong></div> : read.error ? <ReadNotice error={read.error} what="Commissioning package" /> : <div className="em-empty"><p>Loading…</p></div>}
        </div>
      </div>
    );
  }
  return <CommissioningShell packageOverride={read.data.package.id} recordOverride={id}><FullRecord data={read.data} id={id} /></CommissioningShell>;
}

function Section({ id, pkg, record, children }: { id: (typeof sections)[number]["id"]; pkg: string; record: string; children: React.ReactNode }) {
  const s = sections.find((x) => x.id === id)!, destination = commissioningViews.find((v) => v.id === s.view)!.label;
  return (
    <section className="cm-record-section" id={id} tabIndex={-1} aria-labelledby={`cm-record-${id}`}>
      <header><h2 id={`cm-record-${id}`}>{s.title}</h2><Link href={commissioningHref(s.view, { package: pkg, record, panel: id === "history" ? "history" : null })}>Work on this in {destination}</Link></header>
      {children}
    </section>
  );
}
const Panel = ({ title, note, children }: { title: string; note?: React.ReactNode; children: React.ReactNode }) => (
  <div className="cm-panel" role="group" aria-label={title}><header><div><h3>{title}</h3>{note && <p>{note}</p>}</div></header>{children}</div>
);
const Head = ({ columns }: { columns: string[] }) => <thead><tr>{columns.map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>;
const Empty = ({ children }: { children: React.ReactNode }) => <div className="em-empty"><p>{children}</p></div>;

function FullRecord({ data, id }: { data: Data; id: string }) {
  const d = data.selected, pkg = data.package.id, tz = data.package.site_timezone, me = useIdentity().actor_id;
  const options = useRead<Options>(`engineering/${pkg}/commissioning/options`), history = useRead<History>(`engineering/${pkg}/commissioning/history?record=${id}`);
  // A section named in the address (#configuration) is scrolled to and focused on load, and again when the hash changes.
  useEffect(() => {
    const go = () => { const target = document.getElementById(window.location.hash.slice(1)); if (target?.classList.contains("cm-record-section")) { target.scrollIntoView({ block: "start" }); target.focus({ preventScroll: true }); } };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);
  return (
    <div className="cm-page cm-record" aria-label={`Full record of ${d.record.reference}`}>
      <div className="cm-detail">
        <header className="cm-detail-head">
          <div>
            <span className="cm-ref">{d.record.reference} · full record, read only</span>
            <h2>{d.record.title}</h2>
            <div className="cm-facts"><span>{d.record.area} · {d.record.system_name}</span><Tag view={d.record.workflow_view} />{d.inspector.tags.map((t) => <Tag key={t.label} view={t} />)}<Tag view={d.source_condition.view} /></div>
            <div className="cm-facts"><span>Owner: {d.record.owner_name ?? "Unassigned"}</span><span>{d.record.due_meaning ? text(d.record.due_meaning) : "Due"}: {longDate(d.record.due)}</span>{d.record.due_view.label === "Overdue" && <Tag view={d.record.due_view} />}<span>Release stage: {text(d.record.release_stage)}</span>{d.record.archived_at && <span>Archived {siteTime(d.record.archived_at, tz)}: {d.record.archived_reason}</span>}</div>
          </div>
          <div className="em-actions"><Link className="mw-button mw-button-quiet" href={commissioningHref("register", { package: pkg, record: id })}>Open in register</Link></div>
        </header>
        <nav className="cm-record-nav" aria-label="Sections of this record"><span>Sections</span>{sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}</nav>
        <p className="cm-note">Everything here is read from the retained record and is synthetic. Opening this page, or any link on it, records no decision. A technical release completes no Project, starts no warranty and accepts nothing for Service.</p>

        <Section id="basis" pkg={pkg} record={id}><Basis d={d} tz={tz} /></Section>
        <Section id="results" pkg={pkg} record={id}><Results d={d} tz={tz} /></Section>
        <Section id="configuration" pkg={pkg} record={id}>
          <div className="cm-panel" role="group" aria-label="Intended, observed and as-built">
            <header><div><h3>Intended, observed and as-built</h3>
              {d.configuration ? <><div className="cm-facts cm-config-facts"><strong>{d.configuration.label}</strong><Tag view={d.configuration.view} />{d.configuration.submitted_at && <span>Submitted by {d.configuration.submitted_by_name}, {siteTime(d.configuration.submitted_at, tz)}</span>}{d.configuration.reconciled_at && <span>Reconciled by {d.configuration.reconciled_by_name}, {siteTime(d.configuration.reconciled_at, tz)}</span>}</div>
                <p>{d.configuration.content_hash ? <>Reconciled content hash <span className="cm-hash">{d.configuration.content_hash}</span></> : "No content hash yet: it is fixed when the snapshot is reconciled."}</p></> : <p>No installed configuration is recorded. Reconciliation is unassessed, which is not the same as no difference.</p>}
            </div></header>
            <ComparisonTable d={d} tz={tz} changesHref={options.data?.changes_href ?? null} />
          </div>
          <Panel title="Field redlines" note="Accepted for incorporation is not incorporated: a redline stays pending until a successor issue is verified."><RedlineTable d={d} tz={tz} sources={options.data?.sources ?? []} changesHref={options.data?.changes_href ?? null} /></Panel>
          <Panel title="Sensor, valve and area associations" note="A physical connection, a logical assignment and a served area are different facts, and one never proves another."><AssociationTable d={d} tz={tz} /></Panel>
          <Panel title="Configuration backup references" note="Available, identity verified and restore verified are three facts with three pieces of evidence. No backup content or credential is stored here."><BackupBlocks d={d} tz={tz} /></Panel>
        </Section>
        <Section id="release" pkg={pkg} record={id}><Releases d={d} tz={tz} pkg={pkg} internal={data.internal} me={me} /></Section>
        <Section id="handover" pkg={pkg} record={id}><Handover d={d} tz={tz} /></Section>
        <Section id="history" pkg={pkg} record={id}>
          <Panel title="Events of this package" note="Newest first. Each accepted command left exactly one event; nothing here is edited or removed.">
            <ReadNotice error={history.error} what="History" />
            {history.data && (history.data.events.length ? (
              <ol className="cm-timeline">
                {history.data.events.map((ev) => <li key={ev.id}><time dateTime={ev.created_at}>{siteTime(ev.created_at, tz)}</time><div><strong>{ev.event_label}</strong> · {text(ev.subject_type)} · package version {ev.record_version}<small>{ev.actor_name}</small><small>{ev.reason}</small>{ev.note && <small>{ev.note}</small>}</div></li>)}
              </ol>
            ) : <Empty>No event is recorded for this package.</Empty>)}
            {!history.data && history.loading && <Empty>Loading…</Empty>}
            {history.data?.has_more && <div className="cm-panel-body"><p className="cm-note">Earlier events are in Handover &amp; history.</p></div>}
          </Panel>
        </Section>
      </div>
    </div>
  );
}

function Basis({ d, tz }: { d: D; tz: string | null }) {
  return (
    <>
      <Panel title={`Declared scope ${d.scope.number}`} note={<>{text(d.scope.state)}{d.scope.frozen_at && `, frozen ${siteTime(d.scope.frozen_at, tz)}`}. {d.scope.statement ?? "No scope statement is recorded."}</>}>
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-record-table">
            <caption className="mw-sr">Scope items of {d.record.reference}</caption>
            <Head columns={["Scope item", "Kind", "Installed location", "Served areas", "In this scope", "Identity"]} />
            <tbody>
              {d.scope.items.map((i) => (
                <tr key={i.key}>
                  <td><span className="em-row-title">{i.title}</span><span className="em-cell-sub">{i.reference}{i.critical && " · Critical"}</span></td>
                  <td data-label="Kind">{i.kind}</td><td data-label="Installed location">{i.installed_location ?? "Not stated"}</td><td data-label="Served areas">{i.served_areas.length ? i.served_areas.join(", ") : "None stated"}</td>
                  <td data-label="In this scope">{i.disposition}{i.exclusion_reason && <span className="em-cell-sub">{i.exclusion_reason}</span>}</td>
                  <td data-label="Identity">{i.identity === "Verified" ? "Verified asset" : i.identity === "Unverified" ? "Unverified asset" : "Unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.scope.items.length && <Empty>No scope item is declared.</Empty>}
        </div>
        {d.scope.interfaces.length > 0 && <div className="cm-panel-body">{d.scope.interfaces.map((x) => <div className="cm-row" key={x.key}><span>Shared interface: {x.label}</span><span>{x.assessment}<small>{x.note ?? "No assessment note"}</small></span></div>)}</div>}
      </Panel>
      <Panel title="Test basis identifiers" note="A row version, a procedure revision and an Engineering issue revision are three identifiers. All three are shown.">
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-record-table">
            <caption className="mw-sr">Test bases of {d.record.reference}</caption>
            <Head columns={["Test basis", "State", "Row version", "Engineering issue revisions", "Submitted", "Decision", "Content hash"]} />
            <tbody>
              {d.bases.map((b) => (
                <tr key={b.id}>
                  <td><span className="em-row-title">{b.reference} · {b.revision}</span><span className="em-cell-sub">{b.current ? "Current basis" : "Earlier basis"} · {text(b.approval_purpose)}</span></td>
                  <td data-label="State"><Tag view={b.state_view} /></td><td data-label="Row version">{b.identifiers.row_version}</td>
                  <td data-label="Engineering issue revisions">{b.identifiers.issue_revisions.length ? <ul className="cm-plain-list">{b.identifiers.issue_revisions.map((x) => <li key={x}>{x}</li>)}</ul> : "No source bound"}</td>
                  <td data-label="Submitted">{b.submitted_by_name ? <>{b.submitted_by_name}<span className="em-cell-sub">{siteTime(b.submitted_at, tz)}</span></> : "Not submitted"}</td>
                  <td data-label="Decision" className="cm-col-wide">{b.decided_by_name ? <>{b.decided_by_name}<span className="em-cell-sub">{siteTime(b.decided_at, tz)}{b.policy_version && ` · policy version ${b.policy_version}`}</span><span className="em-cell-sub">{b.decision_reason}</span></> : "No decision recorded"}</td>
                  <td data-label="Content hash"><span className="cm-hash">{b.submitted_hash ?? b.content_hash ?? "Not fixed yet"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.bases.length && <Empty>No test basis is prepared.</Empty>}
        </div>
      </Panel>
      <Panel title="Acceptance criteria" note={`${plural(d.definitions.length, "check")} in the current test basis. Every limit is fictional and exists only to exercise the prototype.`}>
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-record-table">
            <caption className="mw-sr">Checks and acceptance criteria of the current test basis</caption>
            <Head columns={["Check", "Scope", "Criterion", "Required", "Evidence, instrument and witness"]} />
            <tbody>
              {d.definitions.map((k) => (
                <tr key={k.key}>
                  <td><span className="em-row-title">{k.name}</span><span className="em-cell-sub">{text(k.check_type)}</span></td><td data-label="Scope">{k.scope_title}</td>
                  <td data-label="Criterion">{k.has_criterion ? <>{k.criterion_text} <span className="cm-fictional">Fictional limit</span></> : "Criterion missing"}</td><td data-label="Required">{k.is_required ? "Required" : "Optional"}</td>
                  <td data-label="Evidence, instrument and witness">{plural(k.evidence_min, "item")} of evidence · {k.instrument_required ? "instrument required" : "no instrument required"} · {k.witness === "None" ? "no witness" : `${text(k.witness)} witness`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.definitions.length && <Empty>No check is defined.</Empty>}
        </div>
      </Panel>
      <Panel title="Bound sources" note={<><Tag view={d.source_condition.view} /> {d.source_condition.reasons.join(" ")}{d.checks_recorded[0] ? ` Last recorded check: ${d.checks_recorded[0].view.label}, ${siteTime(d.checks_recorded[0].checked_at, tz)} by ${d.checks_recorded[0].checked_by_name} (${text(d.checks_recorded[0].adapter)}, synthetic).` : " No source check is recorded, so nothing is claimed about currentness."}</>}>
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-record-table">
            <caption className="mw-sr">Sources bound by the current test basis, as retained and as they are now</caption>
            <Head columns={["Role", "Bound snapshot", "Observed", "Now"]} />
            <tbody>
              {d.source_condition.bound.map((b) => (
                <tr key={b.role}>
                  <td><span className="em-row-title">{text(b.role)}</span></td>
                  <td data-label="Bound snapshot">{b.snapshot ? <>{b.snapshot.reference} · Rev {b.snapshot.revision}<span className="em-cell-sub">File {b.snapshot.file_version}</span></> : "Restricted source"}</td>
                  <td data-label="Observed">{b.snapshot ? siteTime(b.snapshot.observed_at, tz) : "Withheld"}</td>
                  <td data-label="Now">{!b.live ? "Unavailable" : !b.live.readable ? "Restricted for this identity" : <>{text(b.live.use)}<span className="em-cell-sub">{text(b.live.adapter)}, synthetic{b.live.change_reason && ` · ${b.live.change_reason}`}</span></>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.source_condition.bound.length && <Empty>No source is bound yet.</Empty>}
        </div>
      </Panel>
    </>
  );
}

function Results({ d, tz }: { d: D; tz: string | null }) {
  const c = d.coverage;
  return (
    <>
      <Panel title="Coverage of required checks" note={<><Tag view={d.inspector.evidence_view} /> {c.accepted} accepted of {c.required} required · {c.passed_unreviewed} passed and awaiting evidence review · {c.failed} failed · {c.not_tested} not tested · {c.unassessable} unable to assess · {c.reassessment} needing reassessment · {c.criteria_missing} with no criterion. A pass is not accepted evidence, and accepted evidence is not a release.</>}>
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-record-table">
            <caption className="mw-sr">Test attempts of {d.record.reference}. A failed attempt is retained; a later pass is its own record.</caption>
            <Head columns={["Attempt", "Performed", "Configuration under test", "Results", "Evidence review", "Submitted hash"]} />
            <tbody>
              {d.attempts.map((a) => {
                const count = (e: string) => a.results.filter((r) => r.evaluation === e).length, failed = a.results.filter((r) => r.evaluation === "Fail"), review = a.reviews.at(-1);
                return (
                  <tr key={a.id}>
                    <td><span className="em-row-title">Attempt {a.number}</span><span className="em-cell-sub">{a.state === "Draft" ? "Draft, not submitted" : `${plural(a.check_keys.length, "check")}`}{a.predecessor_number && ` · retest of attempt ${a.predecessor_number}`}</span><span className="em-cell-sub">{a.plan_source.reference}</span></td>
                    <td data-label="Performed">{a.occurred_at ? siteTime(a.occurred_at, a.timezone ?? tz) : "Time not recorded"}<span className="em-cell-sub">{a.performer_name}</span>{a.clock_concern && <span className="em-cell-sub">Clock concern: {a.clock_concern}</span>}</td>
                    <td data-label="Configuration under test">{a.configuration_reference ?? "Not recorded"}</td>
                    <td data-label="Results" className="cm-col-wide">{count("Pass")} passed · {count("Fail")} failed · {count("UnableToAssess")} unable to assess · {count("NotTested")} not tested
                      {failed.map((r) => <span className="em-cell-sub" key={r.check_key}>Failed and retained: {r.name}{r.compared && ` (${r.compared})`}. {r.evaluation_reason}</span>)}
                      {a.defects.map((x) => <span className="em-cell-sub" key={x.defect_id}>{x.reference}: {text(x.relation).toLowerCase()}</span>)}</td>
                    <td data-label="Evidence review"><Tag view={a.review_view} />{review && <><span className="em-cell-sub">{review.decided_by_name}, {siteTime(review.decided_at, tz)}</span><span className="em-cell-sub">{review.reason}</span></>}<span className="em-cell-sub">{plural(a.evidence_count, "item")} of evidence</span></td>
                    <td data-label="Submitted hash"><span className="cm-hash">{a.submitted_hash ?? "Not submitted"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!d.attempts.length && <Empty>No test attempt is recorded. Not tested is not a pass and not a fail.</Empty>}
        </div>
      </Panel>
      <Panel title="Defects" note="One unresolved defect per failed check. It closes only on a fresh passing result that an independent reviewer accepted.">
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-record-table">
            <caption className="mw-sr">Defects of {d.record.reference}</caption>
            <Head columns={["Defect", "Check", "Severity", "State", "Owner / due", "Attempts", "Correction"]} />
            <tbody>
              {d.defects.map((x) => (
                <tr key={x.id}>
                  <td className="cm-col-wide"><span className="em-row-title">{x.reference}</span><span className="em-cell-sub">{x.title}</span></td><td data-label="Check">{x.check_name}</td><td data-label="Severity">{x.severity}</td><td data-label="State"><Tag view={x.state_view} /></td>
                  <td data-label="Owner / due">{x.owner_name ?? "Unassigned"}<span className="em-cell-sub">{longDate(x.due)}</span></td>
                  <td data-label="Attempts">{x.attempts.map((a) => `Attempt ${a.number}: ${text(a.relation).toLowerCase()}`).join(" · ") || "None linked"}<span className="em-cell-sub">{x.retest_required ? "Retest required" : "No retest required"}</span></td>
                  <td data-label="Correction">{x.correction_by_name ? <>{x.correction_by_name}<span className="em-cell-sub">{siteTime(x.correction_at, tz)}</span>{x.correction_note && <span className="em-cell-sub">{x.correction_note}</span>}</> : x.proposed_correction ?? "None recorded"}{x.closed_at && <span className="em-cell-sub">Closed {siteTime(x.closed_at, tz)}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.defects.length && <Empty>No defect is recorded.</Empty>}
        </div>
      </Panel>
    </>
  );
}

function Releases({ d, tz, pkg, internal, me }: { d: D; tz: string | null; pkg: string; internal: boolean; me: string }) {
  const scopeTitle = (key: string) => d.scope.items.find((i) => i.key === key)?.title ?? key, mine = d.requests.filter((r) => r.recipient_id === me);
  // Internal duties read any output. A receiver reads the pack addressed to them and the test record of the release it hands over. The server rechecks either way.
  const readable = (o: D["outputs"][number]) => o.state !== "Discarded" && (internal || mine.some((r) => r.id === o.handover_id || (o.kind === "OUT-12" && o.state === "Issued" && r.release_id === o.release_id)));
  return (
    <>
      <Panel title="Release candidates and technical releases" note="Approved for issue is not issued, and a technical release is a bounded engineering fact: it completes no Project, accepts nothing for Service and starts no warranty.">
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-record-table cm-record-releases">
            <caption className="mw-sr">Release candidates and technical releases of {d.record.reference}</caption>
            <Head columns={["Release", "State", "Included scope", "Excluded scope", "Recipients", "Review", "Issue", "Manifest hash"]} />
            <tbody>
              {d.releases.map((r) => (
                <tr key={r.id}>
                  <td><span className="em-row-title">{r.reference} r{pad(r.revision)}</span><span className="em-cell-sub">{r.kind_label} · {r.audience} audience</span><span className="em-cell-sub">Prepared by {r.created_by_name}</span></td>
                  <td data-label="State"><Tag view={r.state_view} /></td>
                  <td data-label="Included scope">{r.included.length ? <ul className="cm-plain-list">{r.included.map((k) => <li key={k}>{scopeTitle(k)}</li>)}</ul> : "Nothing selected"}</td>
                  <td data-label="Excluded scope" className="cm-col-wide">{r.excluded.length ? r.excluded.map((x) => <span key={x.key}>{scopeTitle(x.key)}<span className="em-cell-sub">{x.reason}{x.residual && ` Residual: ${x.residual}`}</span></span>) : "Nothing excluded"}</td>
                  <td data-label="Recipients">{r.recipients.length ? <ul className="cm-plain-list">{r.recipients.map((x) => <li key={`${x.destination}${x.recipient_id}`}>{text(x.destination)}<span className="em-cell-sub">{x.purpose}</span></li>)}</ul> : "None named"}</td>
                  <td data-label="Review" className="cm-col-wide">{r.submitted_by_name ? <>Submitted by {r.submitted_by_name}<span className="em-cell-sub">{siteTime(r.submitted_at, tz)}</span></> : "Not submitted"}
                    {r.approved_by_name && <span className="em-cell-sub">Approved for issue by {r.approved_by_name}, {siteTime(r.approved_at, tz)}{r.policy_version && ` · policy version ${r.policy_version}`}</span>}{r.approval_reason && <span className="em-cell-sub">{r.approval_reason}</span>}
                    {r.returned_by_name && <span className="em-cell-sub">Returned by {r.returned_by_name}, {siteTime(r.returned_at, tz)}: {r.return_reason}</span>}</td>
                  <td data-label="Issue">{r.issued_by_name ? <>{r.issued_by_name}<span className="em-cell-sub">{siteTime(r.issued_at, tz)}</span></> : "Not issued"}{r.withdrawn_by_name && <span className="em-cell-sub">Withdrawn by {r.withdrawn_by_name}, {siteTime(r.withdrawn_at, tz)}: {r.withdrawn_reason}</span>}</td>
                  <td data-label="Manifest hash"><span className="cm-hash">{r.submitted_hash ?? r.manifest_hash}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.releases.length && <Empty>No release candidate is prepared. Nothing is released.</Empty>}
        </div>
      </Panel>
      {d.gates.length > 0 && (
        <Panel title="Release gates of the current candidate" note="Eight named gates over exactly the scope the candidate names. None is cleared by a general override.">
          <ul className="cm-gates">{d.gates.map((g) => <li key={g.key}><Tag view={g.satisfied ? tag("Satisfied", "positive", "tick") : tag("Not satisfied", "caution", "alert")} /><span>{g.label}</span>{g.reasons.length > 0 && <ul>{g.reasons.map((x) => <li key={x}>{x}</li>)}</ul>}</li>)}</ul>
        </Panel>
      )}
      <Panel title="Outputs" note="Prepared is not issued. A download returns the exact retained bytes, re-verified against their recorded hashes; permission is rechecked on every download.">
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-record-table">
            <caption className="mw-sr">Outputs of {d.record.reference}</caption>
            <Head columns={["Output", "For", "State", "Prepared", "Issued", "PDF SHA-256", "Download"]} />
            <tbody>
              {d.outputs.map((o) => {
                const release = d.releases.find((r) => r.id === o.release_id), request = d.requests.find((r) => r.id === o.handover_id), file = (format: "pdf" | "html") => `/api/v1/engineering/${pkg}/commissioning/files?kind=output&output=${o.id}&format=${format}`;
                return (
                  <tr key={o.id}>
                    <td><span className="em-row-title">{o.kind === "OUT-12" ? "OUT-12 commissioning test record" : "OUT-13 handover pack"}</span><span className="em-cell-sub">{o.template_version} · {o.audience} audience</span></td>
                    <td data-label="For">{release ? `${release.reference} r${pad(release.revision)}` : "Release"}{request && <span className="em-cell-sub">{request.destination_label}: {request.recipient_name}</span>}</td>
                    <td data-label="State"><Tag view={o.state_view} /></td><td data-label="Prepared">{o.prepared_by_name}<span className="em-cell-sub">{siteTime(o.prepared_at, tz)}</span></td><td data-label="Issued">{o.issued_at ? siteTime(o.issued_at, tz) : "Not issued"}</td>
                    <td data-label="PDF SHA-256"><span className="cm-hash">{o.pdf_sha256}</span><span className="em-cell-sub">{o.pdf_bytes.toLocaleString("en-AU")} bytes</span></td>
                    <td data-label="Download">{readable(o) ? <div className="em-actions"><a className="mw-button mw-button-quiet" href={file("pdf")} aria-label={`Download ${o.kind} as PDF${o.state === "Prepared" ? ", prepared and not issued" : ""}`}>PDF</a><a className="mw-button mw-button-quiet" href={file("html")} target="_blank" rel="noreferrer" aria-label={`Open ${o.kind} as HTML${o.state === "Prepared" ? ", prepared and not issued" : ""}`}>HTML</a></div>
                      : <span className="cm-note">{o.state === "Discarded" ? "Discarded: no file is served." : "For the people who prepare and issue it, and the receiver it names."}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!d.outputs.length && <Empty>No output is prepared.</Empty>}
        </div>
      </Panel>
    </>
  );
}

function Handover({ d, tz }: { d: D; tz: string | null }) {
  return (
    <>
      <Panel title="Handover obligations" note="Planned is not delivered, delivered is not evidenced, and evidence is not confirmed competence. An obligation blocks the stage it declares and no other.">
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-record-table">
            <caption className="mw-sr">Handover obligations of {d.record.reference}</caption>
            <Head columns={["Obligation", "Required", "State", "Owner / due", "Planned and delivered", "Evidence"]} />
            <tbody>
              {d.obligations.map((o) => (
                <tr key={o.id}>
                  <td><span className="em-row-title">{o.title}</span><span className="em-cell-sub">{o.kind_label}{o.content_revision && ` · ${o.content_revision}`}{o.source_reference && ` · ${o.source_reference}`}</span></td>
                  <td data-label="Required">{o.stage_label}</td><td data-label="State"><Tag view={o.state_view} /></td>
                  <td data-label="Owner / due">{o.owner_name}<span className="em-cell-sub">{longDate(o.due)}</span>{o.due_view.label === "Overdue" && <Tag view={o.due_view} />}</td>
                  <td data-label="Planned and delivered">{o.planned_on ? `Planned ${longDate(o.planned_on)}` : "Not planned"}<span className="em-cell-sub">{o.delivered_on ? `Delivered ${longDate(o.delivered_on)}` : "Not delivered"}</span></td>
                  <td data-label="Evidence" className="cm-col-wide">{o.evidence ?? "None recorded"}{o.competence_note && <span className="em-cell-sub">Competence: {o.competence_note}</span>}{o.disposition_reason && <span className="em-cell-sub">Decision: {o.disposition_reason}{o.disposition_authority && ` (${o.disposition_authority})`}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.obligations.length && <Empty>No handover obligation is recorded.</Empty>}
        </div>
      </Panel>
      <Panel title="Receiving requests" note="Sent is not delivered and delivered is not acknowledged. Each receiver answers for their own destination through a local synthetic receiver; Service acceptance is theirs and is never implied by a technical release.">
        <div className="em-table-scroll">
          <table className="em-table cm-table cm-record-table">
            <caption className="mw-sr">Receiving requests of {d.record.reference}, per recipient</caption>
            <Head columns={["Destination", "Recipient", "State", "Requested", "Due", "Submissions and outcomes"]} />
            <tbody>
              {d.requests.map((r) => (
                <tr key={r.id}>
                  <td><span className="em-row-title">{r.destination_label}</span><span className="em-cell-sub">{r.purpose}</span><span className="em-cell-sub">{text(r.adapter)}, synthetic</span></td>
                  <td data-label="Recipient">{r.recipient_name}{r.support_owner_name && <span className="em-cell-sub">Support owner: {r.support_owner_name}</span>}</td><td data-label="State"><Tag view={r.state_view} /></td>
                  <td data-label="Requested">{r.created_by_name}<span className="em-cell-sub">{siteTime(r.created_at, tz)}</span></td><td data-label="Due">{longDate(r.due)}</td>
                  <td data-label="Submissions and outcomes" className="cm-col-wide">{r.submissions.length ? r.submissions.map((s) => (
                    <span key={s.id} className="cm-submission">Submission {s.number}: {text(s.delivery).toLowerCase()} delivery, {s.outcome_label ? s.outcome_label.toLowerCase() : "no outcome recorded"}
                      <span className="em-cell-sub">Sent by {s.submitted_by_name}, {siteTime(s.submitted_at, tz)}{s.outcome_by_name && ` · answered by ${s.outcome_by_name}, ${siteTime(s.outcome_at, tz)}`}</span>{s.outcome_reason && <span className="em-cell-sub">{s.outcome_reason}</span>}
                      {s.return_owner_name && <span className="em-cell-sub">Returned to {s.return_owner_name}, due {longDate(s.return_due)}</span>}<span className="em-cell-sub cm-hash">{s.manifest_hash}</span></span>
                  )) : "Nothing submitted"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.requests.length && <Empty>No receiving request exists. Not requested is not accepted and not refused.</Empty>}
        </div>
      </Panel>
    </>
  );
}
