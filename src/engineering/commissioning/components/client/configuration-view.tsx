"use client";
import Link from "next/link";
import { Fragment, useState } from "react";
import { associationKinds, comparisonKinds, redlineClasses, requiredStages, reconciliationPresentation, type Presentation } from "../../model";
import type { readOptions } from "../../reads";
import { useCommissioning } from "./commissioning-shell";
import { CommandNotice, Dialog, Field, Tag, fieldError, longDate, newId, siteTime, text, useCommissioningCommand, useRead } from "./commissioning-ui";
import { DetailHead, Page, useView, type Detail } from "./view-common";

export type Options = Awaited<ReturnType<typeof readOptions>>;
type Difference = Detail["differences"][number];
type Redline = Detail["redlines"][number];
type Association = Detail["associations"][number];
type Backup = Detail["backups"][number];
type Source = Options["sources"][number];
type Change = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

const tag = (label: string, tone: Presentation["tone"], icon: Presentation["icon"]): Presentation => ({ label, tone, icon });
const notEvidenced = tag("Not evidenced", "neutral", "unsent");
const snapshotView = (state: string): Presentation => (state === "Reconciled" ? reconciliationPresentation.Reconciled : state === "UnderReview" ? reconciliationPresentation.UnderReview : state === "Superseded" ? tag("Superseded", "neutral", "document") : tag("Working", "neutral", "document"));
const sourceLabel = (s: Source) => `${s.reference} · Rev ${s.revision}${s.use !== "Current" ? ` (${text(s.use).toLowerCase()})` : ""}`;
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
// A time is entered in this browser's zone and sent as the UTC instant it names. It is shown back in the site's zone.
const nowLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const utc = (local: string) => (local && !Number.isNaN(Date.parse(local)) ? new Date(local).toISOString() : null);
const archivedReason = "This commissioning package is archived. Its history is retained and nothing more is recorded on it.";
const authorReason = "You recorded this redline, so you cannot review or verify it.";
const associationAuthorReason = "You recorded this association, so you cannot confirm it.";

export function ConfigurationView() {
  const view = useView("configuration");
  return (
    <Page view={view} label="Installed configuration & redlines" columns={["Installed record", "Differences", "Redlines"]}
      empty="What was intended, what was observed on site and what is proposed as built, with field redlines, sensor, valve and area associations and configuration backup references. Nothing here edits a drawing, contacts a controller or issues an as-built.">
      {(d) => <Configuration key={d.record.id} d={d} view={view} />}
    </Page>
  );
}

// ---------------------------------------------------------------------------------------------
// The four tables are read-only by themselves. The destination passes row actions; the full record passes none.
export function ComparisonTable({ d, tz, changesHref, actions }: { d: Detail; tz: string | null; changesHref: string | null; actions?: (item: Difference) => React.ReactNode }) {
  return (
    <div className="em-table-scroll">
      <table className="em-table cm-table cm-compare">
        <caption className="mw-sr">Compared items of {d.configuration?.label ?? "the installed configuration"}: intended, observed and proposed as-built. An empty observation is unknown, never “no difference”.</caption>
        <thead><tr>{["Component", "Intended value / source", "Observed value / evidence", "Proposed as-built", "Disposition", ...(actions ? ["Actions"] : [])].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
        <tbody>
          {d.differences.map((i) => {
            const redline = i.redline_id ? d.redlines.find((r) => r.id === i.redline_id) : null;
            return (
              <tr key={i.id}>
                <td><span className="em-row-title">{i.component}</span><span className="em-cell-sub">{text(i.kind)}{i.critical && " · Critical"}{i.scope_key && ` · ${d.scope.items.find((s) => s.key === i.scope_key)?.title ?? i.scope_key}`}</span></td>
                <td data-label="Intended value / source">{i.intended_value ?? "Not stated"}<span className="em-cell-sub">{i.intended_source ?? "Source not stated"}</span></td>
                <td data-label="Observed value / evidence">
                  {i.observed_value ?? "Unknown"}
                  {i.observed_value ? <><span className="em-cell-sub">{i.observed_evidence ?? "No evidence recorded"}</span><span className="em-cell-sub">{i.observation_verified ? "Verified observation" : "Unverified report"}{i.observed_by_name && ` by ${i.observed_by_name}, ${siteTime(i.observed_at, tz)}`}</span></>
                    : <span className="em-cell-sub">Not observed. Unknown is not “no difference”.</span>}
                </td>
                <td data-label="Proposed as-built">{i.proposed_as_built ?? "Not proposed"}{redline && <span className="em-cell-sub">Redline {redline.reference}</span>}</td>
                <td data-label="Disposition">
                  <Tag view={i.disposition_view} />
                  {i.disposition === "ReferredToChange" && <span className="em-cell-sub">{i.change ? `${i.change.reference} · ${text(i.change.stage)}` : "Engineering change"}: a request for review, not a resolution.{changesHref && <> <Link href={changesHref}>Open change review (EN-07)</Link></>}</span>}
                  {i.disposition_by_name && <span className="em-cell-sub">{i.disposition_by_name}, {siteTime(i.disposition_at, tz)}</span>}
                  {i.disposition_reason && <span className="em-cell-sub">{i.disposition_reason}</span>}
                </td>
                {actions && <td data-label="Actions"><div className="em-actions">{actions(i)}</div></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!d.differences.length && <div className="em-empty"><strong>{d.configuration ? "Nothing is compared yet" : "No installed configuration is recorded"}</strong><p>{d.configuration ? "Each compared item states what was intended, what was observed and what is proposed as built." : "Reconciliation is unassessed. That is not the same as no difference."}</p></div>}
    </div>
  );
}

export function RedlineTable({ d, tz, sources, changesHref, actions }: { d: Detail; tz: string | null; sources: Source[]; changesHref: string | null; actions?: (redline: Redline) => React.ReactNode }) {
  return (
    <div className="em-table-scroll">
      <table className="em-table cm-table cm-redlines">
        <caption className="mw-sr">Field redlines of {d.record.reference}. Accepted for incorporation is not incorporated.</caption>
        <thead><tr>{["Redline", "Against", "Location / component", "Description and proposed correction", "Classification", "State", "Owner / due", "Decision", "Change link", "Successor", ...(actions ? ["Actions"] : [])].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
        <tbody>
          {d.redlines.map((r) => {
            const successor = sources.find((s) => s.id === r.successor_source_id), before = r.predecessor_id ? d.redlines.find((x) => x.id === r.predecessor_id) : null;
            return (
              <tr key={r.id}>
                <td><span className="em-row-title">{r.reference}</span><span className="em-cell-sub">Recorded by {r.author_name}, {siteTime(r.recorded_at, tz)}</span>{before && <span className="em-cell-sub">Corrects {before.reference}, which stays as recorded</span>}</td>
                <td data-label="Against">{r.source}<span className="em-cell-sub">The exact issue marked up</span></td>
                <td data-label="Location / component">{r.location}<span className="em-cell-sub">{r.component}</span></td>
                <td data-label="Description and proposed correction" className="cm-col-wide">{r.description}<span className="em-cell-sub">Proposed correction: {r.proposed_correction}</span>{r.evidence && <span className="em-cell-sub">Evidence: {r.evidence}</span>}</td>
                <td data-label="Classification">{r.classification ? text(r.classification) : "Unclassified"}</td>
                <td data-label="State"><Tag view={r.state_view} />{r.state === "AcceptedForIncorporation" && <span className="em-cell-sub">Accepted for incorporation. Not incorporated.</span>}</td>
                <td data-label="Owner / due">{r.owner_name ?? "Unassigned"}<span className="em-cell-sub">{longDate(r.due)}</span></td>
                <td data-label="Decision" className="cm-col-wide">{r.decided_by_name ? <>{r.decided_by_name}<span className="em-cell-sub">{siteTime(r.decided_at, tz)}</span><span className="em-cell-sub">{r.decision_reason}</span></> : "No decision recorded"}</td>
                <td data-label="Change link">{r.change ? <>{r.change.reference} · {text(r.change.stage)}<span className="em-cell-sub">A request for review, not a resolution.{changesHref && <> <Link href={changesHref}>Open EN-07</Link></>}</span></> : "None linked"}</td>
                <td data-label="Successor">
                  {r.state === "IncorporatedVerified" ? <>{successor ? `${successor.reference} · Rev ${successor.revision}` : "Verified successor issue"}<span className="em-cell-sub">Verified by {r.verified_by_name}, {siteTime(r.verified_at, tz)}</span><span className="em-cell-sub">{r.verification_note}</span></>
                    : r.state === "AcceptedForIncorporation" ? "Not yet incorporated" : r.state === "Rejected" ? "Not applicable" : "None yet"}
                </td>
                {actions && <td data-label="Actions"><div className="em-actions">{actions(r)}</div></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!d.redlines.length && <div className="em-empty"><p>No field redline is recorded against a drawing issue of this package.</p></div>}
    </div>
  );
}

export function AssociationTable({ d, tz, actions }: { d: Detail; tz: string | null; actions?: (association: Association) => React.ReactNode }) {
  // Current associations first; a superseded one stays on the record, greyed and labelled.
  const rows = [...d.associations].sort((a, b) => Number(a.state === "Superseded") - Number(b.state === "Superseded"));
  const names = (keys: string[]) => keys.map((k) => d.definitions.find((c) => c.key === k)?.name ?? k);
  return (
    <div className="em-table-scroll">
      <table className="em-table cm-table cm-assoc">
        <caption className="mw-sr">Sensor, valve and area associations of {d.record.reference}. A physical connection, a logical assignment and a served area are separate facts.</caption>
        <thead><tr>{["Kind", "From → To", "Source", "Confirmation method", "Effective from", "State", "Concern and sourced constraint", "Affected checks", "Reviewed by", ...(actions ? ["Actions"] : [])].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
        <tbody>
          {rows.map((a) => {
            const after = d.associations.find((x) => x.predecessor_id === a.id), before = a.predecessor_id ? d.associations.find((x) => x.id === a.predecessor_id) : null;
            return (
              <tr key={a.id} data-superseded={a.state === "Superseded" || undefined}>
                <td><span className="em-row-title">{a.kind_label}</span><span className="em-cell-sub">Recorded by {a.created_by_name}</span></td>
                <td data-label="From → To">{a.from_reference} → {a.to_reference}{before && <span className="em-cell-sub">Changed from {before.from_reference} → {before.to_reference}</span>}{after && <span className="em-cell-sub">Superseded by {after.from_reference} → {after.to_reference}</span>}</td>
                <td data-label="Source">{a.source}</td>
                <td data-label="Confirmation method">{a.confirmation_method ?? "Not stated"}</td>
                <td data-label="Effective from">{siteTime(a.effective_from, tz)}</td>
                <td data-label="State"><Tag view={a.state_view} /></td>
                <td data-label="Concern and sourced constraint" className="cm-col-wide">{a.concern ? <>{a.concern}<span className="em-cell-sub">Constraint: {a.constraint_source}</span></> : "No concern recorded"}</td>
                <td data-label="Affected checks">{a.affected_checks.length ? <ul className="cm-plain-list">{names(a.affected_checks).map((n) => <li key={n}>{n}</li>)}</ul> : "None named"}</td>
                <td data-label="Reviewed by">{a.reviewer_name ? <>{a.reviewer_name}<span className="em-cell-sub">{siteTime(a.reviewed_at, tz)}</span>{a.review_note && <span className="em-cell-sub">{a.review_note}</span>}</> : "Not reviewed"}</td>
                {actions && <td data-label="Actions"><div className="em-actions">{a.state === "Superseded" ? <span className="cm-note">Kept as history</span> : actions(a)}</div></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!d.associations.length && <div className="em-empty"><p>No sensor, valve or area association is recorded for this package.</p></div>}
    </div>
  );
}

export function BackupBlocks({ d, tz, actions }: { d: Detail; tz: string | null; actions?: (backup: Backup, fact: Backup["facts"][number]) => React.ReactNode }) {
  if (!d.backups.length) return <div className="em-empty"><p>No configuration backup reference is recorded for this package.</p></div>;
  return (
    <>
      {d.backups.map((k) => (
        <Fragment key={k.id}>
          <div className="cm-panel-body cm-backup">
            <strong>{k.asset_reference} · {k.configuration_version}</strong>
            <div className="cm-grid">
              <div className="cm-row"><span>Asset</span><span>{k.asset_reference}</span></div>
              <div className="cm-row"><span>Purpose</span><span>{k.purpose}</span></div>
              <div className="cm-row"><span>Configuration version</span><span>{k.configuration_version}</span></div>
              <div className="cm-row"><span>Native format</span><span>{k.native_format}</span></div>
              <div className="cm-row"><span>Stored reference</span><span>{k.stored_reference}<small>A reference only. No backup content or credential is stored here.</small></span></div>
              <div className="cm-row"><span>Content hash</span><span className={k.content_hash ? "cm-hash" : undefined}>{k.content_hash ?? "Not recorded"}</span></div>
              <div className="cm-row"><span>Captured</span><span>{siteTime(k.captured_at, tz)}<small>Recorded by {k.author_name}</small></span></div>
              <div className="cm-row"><span>Access class</span><span>{k.access_class}</span></div>
              <div className="cm-row"><span>Compatibility</span><span>{k.compatibility ?? "Not stated"}</span></div>
              <div className="cm-row"><span>Required</span><span>{text(k.required_stage)}</span></div>
            </div>
          </div>
          <div className="em-table-scroll">
            <table className="em-table cm-table cm-backup-facts">
              <caption className="mw-sr">Three separately evidenced facts of the backup reference for {k.asset_reference}. None is inferred from another.</caption>
              <thead><tr>{["Fact", "State", "Evidence", "Recorded by / when", ...(actions ? ["Actions"] : [])].map((h) => <th key={h} scope="col"><span>{h}</span></th>)}</tr></thead>
              <tbody>
                {k.facts.map((f) => (
                  <tr key={f.key}>
                    <th scope="row">{f.label}</th>
                    <td data-label="State"><Tag view={f.at ? tag(f.label, "positive", "tick") : notEvidenced} /></td>
                    <td data-label="Evidence">{f.at ? f.evidence : "None recorded"}</td>
                    <td data-label="Recorded by / when">{f.at ? <>{f.by}<span className="em-cell-sub">{siteTime(f.at, tz)}</span></> : "Not recorded"}</td>
                    {actions && <td data-label="Actions"><div className="em-actions">{f.at ? <span className="cm-note">Evidenced</span> : actions(k, f)}</div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Fragment>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
type Drawer =
  | { kind: "snapshot" | "reconcile" | "backup" } | { kind: "item"; id: string | null } | { kind: "dispose"; id: string } | { kind: "redline"; predecessor: string | null } | { kind: "redline_decide" | "redline_verify"; id: string }
  | { kind: "association"; predecessor: string | null } | { kind: "association_review"; id: string; decision: "Confirmed" | "ReviewRequired" } | { kind: "backup_verify"; id: string; fact: "available" | "identity" | "restore" };
type Ctx = { d: Detail; options: Options | null; tz: string | null; path: string; done: (message: string) => void; close: () => void };

function Configuration({ d, view }: { d: Detail; view: ReturnType<typeof useView> }) {
  const { packageId, announce } = useCommissioning(), options = useRead<Options>(`engineering/${packageId}/commissioning/options`), submit = useCommissioningCommand();
  const [drawer, setDrawer] = useState<Drawer | null>(null), [saved, setSaved] = useState<string | null>(null);
  const can = view.data?.can, tz = view.data?.package.site_timezone ?? null, k = d.configuration, archived = !!d.record.archived_at, path = `engineering/${packageId}/commissioning/configuration`;
  // Preparing is the preparer's; an observation, redline or association may also come from the assigned performer; every
  // judgement is the independent reviewer's. Each reason travels with the record and is shown beside what it stops.
  const prepare = archived ? archivedReason : can?.edit ? null : d.refusals.edit, record = archived ? archivedReason : can?.edit || can?.capture ? null : d.refusals.edit, review = archived ? archivedReason : d.refusals.reconcile,
    restore = archived ? archivedReason : can?.review ? null : d.refusals.reconcile, frozen = k?.state === "Reconciled" ? "This configuration snapshot is reconciled and frozen. A later difference belongs to a successor snapshot." : null;
  const open = (next: Drawer) => { setSaved(null); submit.clear(); setDrawer(next); };
  // Only after the server's receipt: the drawer closes, the package and the shell's counts are read again, and the result is announced.
  const done = (message: string) => { setDrawer(null); setSaved(message); announce(message); view.reload(); };
  const c: Ctx = { d, options: options.data, tz, path, done, close: () => setDrawer(null) }, changesHref = options.data?.changes_href ?? null, sources = options.data?.sources ?? [];
  const item = drawer?.kind === "item" || drawer?.kind === "dispose" ? d.differences.find((x) => x.id === drawer.id) ?? null : null, redline = drawer?.kind === "redline_decide" || drawer?.kind === "redline_verify" ? d.redlines.find((x) => x.id === drawer.id) ?? null : null,
    association = drawer?.kind === "association_review" ? d.associations.find((x) => x.id === drawer.id) ?? null : null, backup = drawer?.kind === "backup_verify" ? d.backups.find((x) => x.id === drawer.id) ?? null : null;
  const sendSubmit = async () => { if (k && (await submit.send(path, { action: "submit", record_id: d.record.id, configuration_id: k.id, expected_version: k.version, reason: "Comparison of intended and observed configuration submitted for independent review" }))) done("Comparison submitted for review. Saved on the server."); };
  const reconcileReason = review ?? (k?.state === "Working" ? "A configuration snapshot is reconciled after it is submitted for review." : null);
  return (
    <>
      <DetailHead d={d} />
      {saved && <p className="em-saved">{saved}</p>}

      <section className="cm-panel" id="cm-panel-comparison" tabIndex={-1} aria-label="Intended, observed and as-built">
        <header>
          <div>
            <h3>Intended, observed and as-built</h3>
            {k ? (
              <>
                <div className="cm-facts cm-config-facts"><strong>{k.label}</strong><Tag view={k.view} />{k.submitted_at && <span>Submitted by {k.submitted_by_name}, {siteTime(k.submitted_at, tz)}</span>}{k.reconciled_at && <span>Reconciled by {k.reconciled_by_name}, {siteTime(k.reconciled_at, tz)}</span>}</div>
                <p>{k.content_hash ? <>Reconciled content hash <span className="cm-hash">{k.content_hash}</span></> : "No content hash yet: it is fixed when the snapshot is reconciled."}{k.reconcile_reason && ` ${k.reconcile_reason}`}</p>
              </>
            ) : <p>No installed configuration is recorded. Reconciliation is unassessed, which is not the same as no difference.</p>}
          </div>
          <div className="em-actions">
            {(!k || k.state === "Reconciled") && <button type="button" className="mw-button mw-button-primary" disabled={!!prepare} aria-describedby={prepare ? "cm-why-prepare" : undefined} onClick={() => open({ kind: "snapshot" })}>{k ? "Record successor snapshot" : "Record installed configuration"}</button>}
            {k && k.state !== "Reconciled" && <button type="button" className="mw-button" disabled={!!record} aria-describedby={record ? "cm-why-prepare" : undefined} onClick={() => open({ kind: "item", id: null })}>Add compared item</button>}
            {k?.state === "Working" && <button type="button" className="mw-button mw-button-primary" disabled={!!prepare || submit.busy || !d.differences.length} aria-describedby={prepare ? "cm-why-prepare" : !d.differences.length ? "cm-why-submit" : undefined} onClick={() => void sendSubmit()}>{submit.busy ? "Saving…" : "Submit for review"}</button>}
            {k && k.state !== "Reconciled" && <button type="button" className="mw-button mw-button-primary" disabled={!!reconcileReason} aria-describedby={reconcileReason ? "cm-why-reconcile" : undefined} onClick={() => open({ kind: "reconcile" })}>Reconcile snapshot</button>}
          </div>
          <div className="cm-config-reasons">
            {(prepare || record) && <p className="cm-note" role="note" id="cm-why-prepare">Recording and submitting: {prepare ?? record}</p>}
            {k?.state === "Working" && !prepare && !d.differences.length && <p className="cm-note" role="note" id="cm-why-submit">Submit for review: compare at least one item, intended against observed, first.</p>}
            {k && k.state !== "Reconciled" && reconcileReason && <p className="cm-note" role="note" id="cm-why-reconcile">Disposition and reconciliation: {reconcileReason}</p>}
            {frozen && <p className="cm-note" role="note">{frozen} A successor supersedes it; the reconciled snapshot stays as history for every release that bound it.</p>}
            {submit.state !== "saved" && <CommandNotice command={submit} />}
          </div>
        </header>
        <ComparisonTable d={d} tz={tz} changesHref={changesHref} actions={k && k.state !== "Reconciled" ? (i) => (
          <>
            <button type="button" className="mw-button mw-button-quiet" disabled={!!record} aria-describedby={record ? "cm-why-prepare" : undefined} aria-label={`Edit ${i.component}`} onClick={() => open({ kind: "item", id: i.id })}>Edit</button>
            <button type="button" className="mw-button mw-button-quiet" disabled={!!review} aria-describedby={review ? "cm-why-reconcile" : undefined} aria-label={`Disposition of ${i.component}`} onClick={() => open({ kind: "dispose", id: i.id })}>Disposition</button>
          </>
        ) : undefined} />
        {d.configurations.length > 1 && (
          <div className="cm-panel-body">
            <p className="cm-note">Snapshots of this package. An earlier snapshot stays exactly as it was reconciled.</p>
            <ul className="cm-snapshots">{d.configurations.map((s) => <li key={s.id}><span>Snapshot {s.number} · {s.label}{s.id === k?.id && " · shown above"}</span><Tag view={snapshotView(s.state)} /></li>)}</ul>
          </div>
        )}
      </section>

      <section className="cm-panel" id="cm-panel-redlines" tabIndex={-1} aria-label="Field redlines">
        <header>
          <div><h3>Field redlines</h3><p>A redline marks up one exact drawing issue. Accepted for incorporation is not incorporated: it stays pending until its owner publishes a successor issue and a reviewer verifies it.</p></div>
          <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={!!record} aria-describedby={record ? "cm-why-redline" : undefined} onClick={() => open({ kind: "redline", predecessor: null })}>Record redline</button></div>
          <div className="cm-config-reasons">
            {record && <p className="cm-note" role="note" id="cm-why-redline">Record redline: {record}</p>}
            {review && d.redlines.length > 0 && <p className="cm-note" role="note" id="cm-why-redline-review">Review and verification: {review}</p>}
            {!review && d.redlines.some((r) => r.mine) && <p className="cm-note" role="note" id="cm-why-redline-author">{authorReason}</p>}
          </div>
        </header>
        <RedlineTable d={d} tz={tz} sources={sources} changesHref={changesHref} actions={(r) => {
          const why = review ? "cm-why-redline-review" : r.mine ? "cm-why-redline-author" : undefined;
          return (
            <>
              {["Recorded", "UnderReview", "ClarificationRequired"].includes(r.state) && <button type="button" className="mw-button mw-button-quiet" disabled={!!why} aria-describedby={why} aria-label={`Review redline ${r.reference}`} onClick={() => open({ kind: "redline_decide", id: r.id })}>Review redline</button>}
              {r.state === "AcceptedForIncorporation" && <button type="button" className="mw-button mw-button-quiet" disabled={!!why} aria-describedby={why} aria-label={`Verify incorporation of ${r.reference}`} onClick={() => open({ kind: "redline_verify", id: r.id })}>Verify incorporation</button>}
              {["ClarificationRequired", "Rejected"].includes(r.state) && !d.redlines.some((x) => x.predecessor_id === r.id) && <button type="button" className="mw-button mw-button-quiet" disabled={!!record} aria-describedby={record ? "cm-why-redline" : undefined} aria-label={`Record a corrected redline for ${r.reference}`} onClick={() => open({ kind: "redline", predecessor: r.id })}>Record corrected redline</button>}
              {r.state === "IncorporatedVerified" && <span className="cm-note">Closed</span>}
            </>
          );
        }} />
      </section>

      <section className="cm-panel" id="cm-panel-associations" tabIndex={-1} aria-label="Sensor, valve and area associations">
        <header>
          <div><h3>Sensor, valve and area associations</h3><p>A physical connection, a logical assignment and a served area are different facts, and one never proves another. No universal one-sensor-one-area rule is applied: a concern is recorded only with the sourced constraint it rests on.</p></div>
          <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={!!record} aria-describedby={record ? "cm-why-association" : undefined} onClick={() => open({ kind: "association", predecessor: null })}>Record association</button></div>
          <div className="cm-config-reasons">
            {record && <p className="cm-note" role="note" id="cm-why-association">Record association: {record}</p>}
            {review && d.associations.some((a) => a.state !== "Superseded") && <p className="cm-note" role="note" id="cm-why-association-review">Confirm and flag for review: {review}</p>}
            {!review && d.associations.some((a) => a.mine && a.state !== "Superseded") && <p className="cm-note" role="note" id="cm-why-association-author">{associationAuthorReason}</p>}
          </div>
        </header>
        <AssociationTable d={d} tz={tz} actions={(a) => {
          const why = review ? "cm-why-association-review" : a.mine ? "cm-why-association-author" : undefined;
          return (
            <>
              <button type="button" className="mw-button mw-button-quiet" disabled={!!record} aria-describedby={record ? "cm-why-association" : undefined} aria-label={`Record changed association for ${a.from_reference} to ${a.to_reference}`} onClick={() => open({ kind: "association", predecessor: a.id })}>Record changed association</button>
              {a.state !== "Confirmed" && <button type="button" className="mw-button mw-button-quiet" disabled={!!why} aria-describedby={why} aria-label={`Confirm ${a.from_reference} to ${a.to_reference}`} onClick={() => open({ kind: "association_review", id: a.id, decision: "Confirmed" })}>Confirm</button>}
              {a.state !== "ReviewRequired" && <button type="button" className="mw-button mw-button-quiet" disabled={!!why} aria-describedby={why} aria-label={`Flag ${a.from_reference} to ${a.to_reference} for review`} onClick={() => open({ kind: "association_review", id: a.id, decision: "ReviewRequired" })}>Flag for review</button>}
            </>
          );
        }} />
      </section>

      <section className="cm-panel" id="cm-panel-backups" tabIndex={-1} aria-label="Configuration backup references">
        <header>
          <div><h3>Configuration backup references</h3><p>A backup that exists, or that downloaded, proves nothing about recoverability. Available, identity verified and restore verified are three facts with three pieces of evidence. No controller is contacted and no backup content or credential is stored here.</p></div>
          <div className="em-actions"><button type="button" className="mw-button mw-button-primary" disabled={!!prepare} aria-describedby={prepare ? "cm-why-backup" : undefined} onClick={() => open({ kind: "backup" })}>Record backup reference</button></div>
          <div className="cm-config-reasons">
            {prepare && <p className="cm-note" role="note" id="cm-why-backup">Record backup reference: {prepare}</p>}
            {record && d.backups.length > 0 && <p className="cm-note" role="note" id="cm-why-backup-fact">Evidence of availability and identity: {record}</p>}
            {restore && d.backups.length > 0 && <p className="cm-note" role="note" id="cm-why-backup-restore">Evidence of a verified restore: {restore}</p>}
          </div>
        </header>
        <BackupBlocks d={d} tz={tz} actions={(b, f) => {
          const why = f.key === "restore" ? (restore ? "cm-why-backup-restore" : undefined) : record ? "cm-why-backup-fact" : undefined;
          return <button type="button" className="mw-button mw-button-quiet" disabled={!!why} aria-describedby={why} aria-label={`Record evidence: ${f.label.toLowerCase()}, ${b.asset_reference}`} onClick={() => open({ kind: "backup_verify", id: b.id, fact: f.key })}>Record evidence</button>;
        }} />
      </section>

      {drawer?.kind === "snapshot" && <SnapshotDrawer c={c} />}
      {drawer?.kind === "item" && k && (drawer.id === null || item) && <ItemDrawer c={c} item={item} />}
      {drawer?.kind === "dispose" && item && <DisposeDrawer c={c} item={item} />}
      {drawer?.kind === "reconcile" && k && <ReconcileDrawer c={c} />}
      {drawer?.kind === "redline" && <RedlineDrawer c={c} predecessor={drawer.predecessor} />}
      {drawer?.kind === "redline_decide" && redline && <RedlineDecideDrawer c={c} redline={redline} />}
      {drawer?.kind === "redline_verify" && redline && <RedlineVerifyDrawer c={c} redline={redline} />}
      {drawer?.kind === "association" && <AssociationDrawer c={c} predecessor={drawer.predecessor} />}
      {drawer?.kind === "association_review" && association && <AssociationReviewDrawer c={c} association={association} decision={drawer.decision} />}
      {drawer?.kind === "backup" && <BackupDrawer c={c} />}
      {drawer?.kind === "backup_verify" && backup && <BackupVerifyDrawer c={c} backup={backup} fact={drawer.fact} />}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Every drawer sends one command under the shared hook: "Saving…" while it runs, the refusal with every reason when
// the server gives one, outcome-unknown recovery by the original operation, and nothing called saved before the receipt.
function useFields<K extends string>(initial: Record<K, string>) {
  const [form, setForm] = useState(initial), [dirty, setDirty] = useState(false);
  const set = (key: K, value: string) => { setForm((f) => ({ ...f, [key]: value }) as Record<K, string>); setDirty(true); };
  return { form, set, dirty, touch: () => setDirty(true), bind: (key: K) => ({ value: form[key], onChange: (e: Change) => set(key, e.target.value) }) };
}
function useDrawer(c: Ctx, saved: string) {
  const command = useCommissioningCommand();
  const send = async (body: Record<string, unknown>) => { if (await command.send(c.path, { record_id: c.d.record.id, ...body })) c.done(saved); };
  const foot = (label: string, body: () => Record<string, unknown>, disabled = false) => (
    <><button type="button" className="mw-button" onClick={c.close} disabled={command.busy}>Cancel</button><button type="button" className="mw-button mw-button-primary" onClick={() => void send(body())} disabled={command.busy || disabled}>{command.busy ? "Saving…" : label}</button></>
  );
  return { command, e: command.error, foot };
}
function ChangeField({ c, value, onChange, error, required }: { c: Ctx; value: string; onChange: (e: Change) => void; error?: string; required: boolean }) {
  const changes = c.options?.changes ?? [], href = c.options?.changes_href;
  // A referral names a real engineering change. Where none exists there is nothing to choose, and none is invented here.
  if (c.options && !changes.length) return <p className="cm-note" role="note">No engineering change exists in this Engineering package. A referral names a real change: record it in change review first{href ? <>, then return here. <Link href={href}>Open change review (EN-07)</Link></> : "."}</p>;
  return (
    <Field label={required ? "Engineering change (EN-07)" : "Engineering change (EN-07), if any"} hint="A link is a request for review, not a resolution. Its outcome is recorded here as a new disposition or decision." error={error}>
      <select value={value} onChange={onChange}><option value="">{required ? "Choose a change…" : "None"}</option>{changes.map((x) => <option key={x.id} value={x.id}>{x.reference} · {x.title} · {text(x.stage)}</option>)}</select>
    </Field>
  );
}

function SnapshotDrawer({ c }: { c: Ctx }) {
  const { command, e, foot } = useDrawer(c, "Installed configuration recorded. Saved on the server."), [id] = useState(newId), successor = !!c.d.configuration;
  const bound = (role: string) => c.d.source_condition.bound.find((b) => b.role === role)?.snapshot?.source_id ?? "", sources = c.options?.sources.filter((s) => s.readable) ?? [];
  const f = useFields({ installed_reference: "", installed_revision: "", intended_source_id: bound("IntendedDrawing"), installed_source_id: "" });
  return (
    <Dialog drawer title={successor ? "Record successor snapshot" : "Record installed configuration"} subtitle={successor ? `${c.d.configuration!.label} stays exactly as it was reconciled, as history. The successor needs its own comparison and reconciliation.` : "The installed record that intended and observed values are compared against. It starts as working and reconciles nothing."}
      busy={command.busy} dirty={f.dirty} onClose={c.close}
      footer={foot(successor ? "Record successor snapshot" : "Record installed configuration", () => ({ action: "snapshot", id, expected_version: c.d.record.version, installed_reference: f.form.installed_reference, installed_revision: f.form.installed_revision, intended_source_id: f.form.intended_source_id || null, installed_source_id: f.form.installed_source_id || null, reason: successor ? "Successor configuration snapshot recorded" : "Installed configuration snapshot recorded" }), !f.form.installed_reference.trim() || !f.form.installed_revision.trim())}>
      <div className="cm-stack">
        <div className="cm-inline">
          <Field label="Installed record reference" error={fieldError(e, "installed_reference")}><input data-autofocus {...f.bind("installed_reference")} maxLength={80} placeholder="CFG-003" /></Field>
          <Field label="Revision" hint="Up to twelve letters, digits or full stops" error={fieldError(e, "installed_revision")}><input {...f.bind("installed_revision")} maxLength={12} placeholder="C" /></Field>
        </div>
        <Field label="Intended source" hint="The drawing issue or design basis that states what was intended" error={fieldError(e, "intended_source_id")}>
          <select {...f.bind("intended_source_id")}><option value="">Not bound</option>{sources.filter((s) => s.kind === "DrawingIssue" || s.kind === "DesignBasis").map((s) => <option key={s.id} value={s.id}>{sourceLabel(s)} · {s.title}</option>)}</select>
        </Field>
        <Field label="Installed-configuration source" hint="The retained installed-configuration record, where one exists" error={fieldError(e, "installed_source_id")}>
          <select {...f.bind("installed_source_id")}><option value="">Not bound</option>{sources.filter((s) => s.kind === "InstalledConfiguration").map((s) => <option key={s.id} value={s.id}>{sourceLabel(s)} · {s.title}</option>)}</select>
        </Field>
        <p className="cm-note">Sources are the retained snapshots of the local synthetic upstream adapter. None is created or changed here.</p>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function ItemDrawer({ c, item }: { c: Ctx; item: Difference | null }) {
  const { command, e, foot } = useDrawer(c, item ? "Compared item updated. Saved on the server." : "Compared item recorded. Saved on the server."), [id] = useState(() => item?.id ?? newId()), k = c.d.configuration!;
  const f = useFields({ item_key: item?.item_key ?? "", kind: item?.kind ?? "Identity", component: item?.component ?? "", scope_key: item?.scope_key ?? "", intended_value: item?.intended_value ?? "", intended_source: item?.intended_source ?? "", observed_value: item?.observed_value ?? "",
    observed_evidence: item?.observed_evidence ?? "", proposed_as_built: item?.proposed_as_built ?? "", redline_id: item?.redline_id ?? "" });
  const [critical, setCritical] = useState(item?.critical ?? false), [verified, setVerified] = useState(item?.observation_verified ?? false), key = item?.item_key ?? (f.form.item_key.trim() || slug(f.form.component)), observed = !!f.form.observed_value.trim();
  const body = () => ({ action: "item", id, configuration_id: k.id, expected_version: item?.version ?? null, item_key: key, kind: f.form.kind, component: f.form.component, scope_key: f.form.scope_key || null, critical, intended_value: f.form.intended_value || null, intended_source: f.form.intended_source || null,
    observed_value: f.form.observed_value || null, observed_evidence: f.form.observed_evidence || null, observation_verified: observed && verified, proposed_as_built: f.form.proposed_as_built || null, redline_id: f.form.redline_id || null, reason: item ? "Compared item updated" : "Compared item recorded" });
  return (
    <Dialog drawer title={item ? `Edit ${item.component}` : "Add compared item"} subtitle={`${k.label}. One component: what was intended, what was observed and what is proposed as built.`} busy={command.busy} dirty={f.dirty} onClose={c.close} footer={foot(item ? "Save compared item" : "Add compared item", body, !f.form.component.trim() || !key)}>
      <div className="cm-stack">
        {item && <p className="cm-note" role="note">Changing the observed value, or whether it is verified, re-opens this item&rsquo;s disposition: a disposition never outlives the fact it judged.</p>}
        <Field label="Component" error={fieldError(e, "component")}><input data-autofocus {...f.bind("component")} maxLength={160} /></Field>
        <div className="cm-inline">
          <Field label="What is compared" error={fieldError(e, "kind")}><select {...f.bind("kind")}>{comparisonKinds.map((x) => <option key={x} value={x}>{text(x)}</option>)}</select></Field>
          <Field label="Scope item" error={fieldError(e, "scope_key")}><select {...f.bind("scope_key")}><option value="">Whole scope</option>{c.d.scope.items.map((s) => <option key={s.key} value={s.key}>{s.reference} · {s.title}</option>)}</select></Field>
        </div>
        {!item && <Field label="Item key" hint="Lower-case letters, digits, hyphens and colons. Left empty, it is taken from the component." error={fieldError(e, "item_key")}><input {...f.bind("item_key")} maxLength={80} placeholder={slug(f.form.component) || "valve-v07"} /></Field>}
        <label className="mw-choice"><input type="checkbox" checked={critical} onChange={(ev) => { setCritical(ev.target.checked); f.touch(); }} /><span>Critical item</span></label>
        <div className="cm-inline">
          <Field label="Intended value" error={fieldError(e, "intended_value")}><input {...f.bind("intended_value")} maxLength={400} /></Field>
          <Field label="Intended source" hint="The drawing issue, basis or schedule that states it" error={fieldError(e, "intended_source")}><input {...f.bind("intended_source")} maxLength={200} /></Field>
        </div>
        <Field label="Observed value" hint="Leave empty when it has not been observed. It is then shown as Unknown, never as “no difference”." error={fieldError(e, "observed_value")}><input {...f.bind("observed_value")} maxLength={400} /></Field>
        <Field label="Observation evidence" error={fieldError(e, "observed_evidence")}><input {...f.bind("observed_evidence")} maxLength={400} disabled={!observed} placeholder="Walk-down record, photograph reference…" /></Field>
        <label className="mw-choice"><input type="checkbox" checked={observed && verified} disabled={!observed} onChange={(ev) => { setVerified(ev.target.checked); f.touch(); }} /><span>Verified observation: I observed this myself, on site. Unticked, it is an unverified report.</span></label>
        <Field label="Proposed as-built" error={fieldError(e, "proposed_as_built")}><input {...f.bind("proposed_as_built")} maxLength={400} /></Field>
        <Field label="Related redline, if any" error={fieldError(e, "redline_id")}><select {...f.bind("redline_id")}><option value="">None</option>{c.d.redlines.map((r) => <option key={r.id} value={r.id}>{r.reference} · {r.component}</option>)}</select></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function DisposeDrawer({ c, item }: { c: Ctx; item: Difference }) {
  const { command, e, foot } = useDrawer(c, "Disposition recorded. Saved on the server."), known = !!item.observed_value && item.observation_verified;
  const f = useFields({ disposition: known ? "Matches" : "ReferredToChange", disposition_reason: "", change_id: item.change_id ?? "" }), referring = f.form.disposition === "ReferredToChange";
  return (
    <Dialog drawer title={`Disposition of ${item.component}`} subtitle="The independent reviewer's judgement of one compared item. It reconciles nothing else." busy={command.busy} dirty={f.dirty} onClose={c.close}
      footer={foot("Record disposition", () => ({ action: "dispose", item_id: item.id, expected_version: item.version, disposition: f.form.disposition, disposition_reason: f.form.disposition_reason, change_id: referring ? f.form.change_id || null : null, reason: `Difference disposition recorded: ${text(f.form.disposition)}` }),
        !f.form.disposition_reason.trim() || (referring && !f.form.change_id))}>
      <div className="cm-stack">
        <div className="cm-section-plain">
          <div className="cm-row"><span>Intended</span><span>{item.intended_value ?? "Not stated"}<small>{item.intended_source ?? "Source not stated"}</small></span></div>
          <div className="cm-row"><span>Observed</span><span>{item.observed_value ?? "Unknown"}<small>{item.observed_value ? (item.observation_verified ? `Verified observation by ${item.observed_by_name ?? "the observer"}` : "Unverified report") : "Not observed"}</small></span></div>
          <div className="cm-row"><span>Proposed as-built</span><span>{item.proposed_as_built ?? "Not proposed"}</span></div>
        </div>
        <Field label="Disposition" hint={known ? undefined : "“Matches” and “Accepted as built” rest on a verified observation of a known value. An empty or unverified observation is unknown, not “no difference”."} error={fieldError(e, "disposition")}>
          <select data-autofocus {...f.bind("disposition")}>
            <option value="Matches" disabled={!known}>{text("Matches")}</option><option value="AcceptedAsBuilt" disabled={!known}>{text("AcceptedAsBuilt")}</option><option value="ReferredToChange">{text("ReferredToChange")}</option><option value="RejectedCorrectionRequired">{text("RejectedCorrectionRequired")}</option>
          </select>
        </Field>
        {referring && <ChangeField c={c} required {...f.bind("change_id")} error={fieldError(e, "change_id")} />}
        <Field label="Reason" error={fieldError(e, "disposition_reason")}><textarea {...f.bind("disposition_reason")} maxLength={1000} /></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function ReconcileDrawer({ c }: { c: Ctx }) {
  const { command, e, foot } = useDrawer(c, "Configuration snapshot reconciled. Saved on the server."), k = c.d.configuration!, f = useFields({ decision_reason: "" });
  return (
    <Dialog drawer title="Reconcile snapshot" subtitle={`${k.label}. Reconciling freezes this snapshot under a content hash. It issues no as-built and releases nothing.`} busy={command.busy} dirty={f.dirty} onClose={c.close}
      footer={foot("Reconcile snapshot", () => ({ action: "reconcile", configuration_id: k.id, expected_version: k.version, decision_reason: f.form.decision_reason, reason: "Configuration snapshot reconciled by the independent reviewer" }), !f.form.decision_reason.trim())}>
      <div className="cm-stack">
        <p className="cm-note">The server checks every compared item, redline and association of this package. Anything still open is listed here and nothing is reconciled.</p>
        <Field label="Basis of this reconciliation" error={fieldError(e, "decision_reason")}><textarea data-autofocus {...f.bind("decision_reason")} maxLength={2000} /></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function RedlineDrawer({ c, predecessor }: { c: Ctx; predecessor: string | null }) {
  const { command, e, foot } = useDrawer(c, "Redline recorded. Saved on the server."), [id] = useState(newId), before = c.d.redlines.find((r) => r.id === predecessor) ?? null;
  const drawings = c.options?.sources.filter((s) => s.kind === "DrawingIssue" && s.readable) ?? [], correctable = c.d.redlines.filter((r) => ["ClarificationRequired", "Rejected"].includes(r.state));
  const f = useFields({ source_id: before?.source_id ?? c.d.source_condition.bound.find((b) => b.role === "IntendedDrawing")?.snapshot?.source_id ?? "", location: before?.location ?? c.d.record.area, component: before?.component ?? "", description: "", evidence: "", proposed_correction: "", predecessor_id: predecessor ?? "" });
  return (
    <Dialog drawer title={before ? `Record corrected redline for ${before.reference}` : "Record redline"} subtitle="A field markup against one exact drawing issue. It changes no drawing: incorporation is its owner's act, in a successor issue." busy={command.busy} dirty={f.dirty} onClose={c.close}
      footer={foot("Record redline", () => ({ action: "redline", id, expected_version: c.d.record.version, source_id: f.form.source_id, location: f.form.location, component: f.form.component, description: f.form.description, evidence: f.form.evidence || null, proposed_correction: f.form.proposed_correction, predecessor_id: f.form.predecessor_id || null, reason: f.form.predecessor_id ? "Corrected field redline recorded" : "Field redline recorded" }),
        !f.form.source_id || !f.form.location.trim() || !f.form.component.trim() || !f.form.description.trim() || !f.form.proposed_correction.trim())}>
      <div className="cm-stack">
        <Field label="Against drawing issue" hint="The exact reference and revision that is marked up" error={fieldError(e, "source_id")}><select data-autofocus {...f.bind("source_id")}><option value="">Choose a drawing issue…</option>{drawings.map((s) => <option key={s.id} value={s.id}>{sourceLabel(s)} · {s.title}</option>)}</select></Field>
        <div className="cm-inline">
          <Field label="Location" error={fieldError(e, "location")}><input {...f.bind("location")} maxLength={120} /></Field>
          <Field label="Component" error={fieldError(e, "component")}><input {...f.bind("component")} maxLength={120} /></Field>
        </div>
        <Field label="What differs" error={fieldError(e, "description")}><textarea {...f.bind("description")} maxLength={2000} /></Field>
        <Field label="Evidence" hint="Photograph reference, walk-down record…" error={fieldError(e, "evidence")}><input {...f.bind("evidence")} maxLength={600} /></Field>
        <Field label="Proposed correction" error={fieldError(e, "proposed_correction")}><textarea {...f.bind("proposed_correction")} maxLength={1000} /></Field>
        {correctable.length > 0 && (
          <Field label="Corrects an earlier redline" hint="Only one that was returned for clarification or rejected. The original stays as it was recorded." error={fieldError(e, "predecessor_id")}>
            <select {...f.bind("predecessor_id")}><option value="">No: this is a new redline</option>{correctable.map((r) => <option key={r.id} value={r.id}>{r.reference} · {r.state_label} · {r.component}</option>)}</select>
          </Field>
        )}
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

const redlineMoves: Record<string, string[]> = { UnderReview: ["Recorded"], ClarificationRequired: ["Recorded", "UnderReview"], AcceptedForIncorporation: ["Recorded", "UnderReview"], Rejected: ["Recorded", "UnderReview", "ClarificationRequired"] };
function RedlineDecideDrawer({ c, redline }: { c: Ctx; redline: Redline }) {
  const { command, e, foot } = useDrawer(c, "Redline decision recorded. Saved on the server."), allowed = Object.keys(redlineMoves).filter((k) => redlineMoves[k].includes(redline.state)), owners = c.options?.people.filter((p) => p.preparer) ?? [];
  const f = useFields({ decision: allowed[0] ?? "Rejected", decision_reason: "", classification: redline.classification ?? "", owner_id: owners.some((p) => p.id === c.d.record.owner_id) ? c.d.record.owner_id! : "", due: "", change_id: redline.change_id ?? "" });
  const accepting = f.form.decision === "AcceptedForIncorporation", owned = accepting || f.form.decision === "ClarificationRequired", material = f.form.classification === "Material";
  return (
    <Dialog drawer title={`Review redline ${redline.reference}`} subtitle={`${redline.source} · ${redline.component}. Accepting asks the drawing's owner to incorporate it. It is not incorporated until a successor issue is verified.`} busy={command.busy} dirty={f.dirty} onClose={c.close}
      footer={foot("Record decision", () => ({ action: "redline_decide", redline_id: redline.id, expected_version: redline.version, decision: f.form.decision, decision_reason: f.form.decision_reason, classification: f.form.classification || null, ...(owned ? { owner_id: f.form.owner_id, due: f.form.due } : {}), change_id: f.form.change_id || null, reason: `Redline decision recorded: ${text(f.form.decision)}` }),
        !f.form.decision_reason.trim() || (owned && (!f.form.owner_id || !f.form.due)) || (accepting && (!f.form.classification || (material && !f.form.change_id))))}>
      <div className="cm-stack">
        <div className="cm-section-plain">
          <div className="cm-row"><span>Description</span><span>{redline.description}</span></div>
          <div className="cm-row"><span>Proposed correction</span><span>{redline.proposed_correction}</span></div>
          <div className="cm-row"><span>Recorded by</span><span>{redline.author_name}<small>Its author cannot review it.</small></span></div>
        </div>
        <Field label="Decision" error={fieldError(e, "decision")}><select data-autofocus {...f.bind("decision")}>{allowed.map((k) => <option key={k} value={k}>{k === "UnderReview" ? "Take under review" : k === "ClarificationRequired" ? "Return for clarification" : k === "AcceptedForIncorporation" ? "Accept for incorporation (not yet incorporated)" : "Reject"}</option>)}</select></Field>
        <Field label="Classification" hint={accepting ? "Required to accept. A material technical difference is referred to an engineering change before it is drawn." : "Clerical correction, or material technical difference"} error={fieldError(e, "classification")}>
          <select {...f.bind("classification")}><option value="">Unclassified</option>{redlineClasses.map((k) => <option key={k} value={k}>{k === "Clerical" ? "Clerical correction" : "Material technical difference"}</option>)}</select>
        </Field>
        {(material || f.form.change_id) && <ChangeField c={c} required={accepting && material} {...f.bind("change_id")} error={fieldError(e, "change_id")} />}
        {owned && (
          <div className="cm-inline">
            <Field label={accepting ? "Incorporation owned by" : "Clarification owned by"} error={fieldError(e, "owner_id")}><select {...f.bind("owner_id")}><option value="">Choose a preparer…</option>{owners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Due" error={fieldError(e, "due")}><input type="date" {...f.bind("due")} /></Field>
          </div>
        )}
        <Field label="Reason for this decision" error={fieldError(e, "decision_reason")}><textarea {...f.bind("decision_reason")} maxLength={2000} /></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function RedlineVerifyDrawer({ c, redline }: { c: Ctx; redline: Redline }) {
  const { command, e, foot } = useDrawer(c, "Incorporation verified. Saved on the server."), original = c.options?.sources.find((s) => s.id === redline.source_id && s.readable), [reference, revision] = original ? [original.reference, original.revision] : redline.source.split(" · Rev ");
  // Only a current issue of the same drawing at another revision can be its successor. It is published upstream, never here.
  const successors = c.options?.sources.filter((s) => s.kind === "DrawingIssue" && s.readable && s.use === "Current" && s.reference === reference && s.revision !== revision) ?? [], f = useFields({ successor_source_id: successors[0]?.id ?? "", verification_note: "" });
  return (
    <Dialog drawer title={`Verify incorporation of ${redline.reference}`} subtitle={`Marked up against ${redline.source}. Verifying says the successor issue carries this correction, as its owner published it.`} busy={command.busy} dirty={f.dirty} onClose={c.close}
      footer={foot("Verify incorporation", () => ({ action: "redline_verify", redline_id: redline.id, expected_version: redline.version, successor_source_id: f.form.successor_source_id, verification_note: f.form.verification_note, reason: "Redline incorporation verified against the successor issue" }), !f.form.successor_source_id || !f.form.verification_note.trim())}>
      <div className="cm-stack">
        <div className="cm-section-plain"><div className="cm-row"><span>Proposed correction</span><span>{redline.proposed_correction}</span></div></div>
        {c.options && !successors.length ? <p className="cm-note" role="note">The successor issue of {reference} is published by its owner through the upstream adapter (Released materials → Sources). It is never created here.</p> : (
          <Field label={`Successor issue of ${reference}`} hint={`Current issues of ${reference} at a revision other than ${revision}`} error={fieldError(e, "successor_source_id")}><select data-autofocus {...f.bind("successor_source_id")}>{successors.map((s) => <option key={s.id} value={s.id}>{sourceLabel(s)} · {s.title}</option>)}</select></Field>
        )}
        <Field label="What was checked in the successor" error={fieldError(e, "verification_note")}><textarea {...f.bind("verification_note")} maxLength={2000} /></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function AffectedChecks({ d, value, onChange }: { d: Detail; value: string[]; onChange: (keys: string[]) => void }) {
  if (!d.definitions.length) return <p className="cm-note">No check is defined in the current test basis, so none can be named as affected.</p>;
  return (
    <fieldset className="cm-checklist">
      <legend className="em-label">Affected checks</legend>
      <small>The functional checks that rested on this association. Naming them asks for reassessment and invalidates nothing else.</small>
      <div>{d.definitions.map((k) => <label key={k.key} className="mw-choice"><input type="checkbox" checked={value.includes(k.key)} onChange={(ev) => onChange(ev.target.checked ? [...value, k.key] : value.filter((x) => x !== k.key))} /><span>{k.name}</span></label>)}</div>
    </fieldset>
  );
}

function AssociationDrawer({ c, predecessor }: { c: Ctx; predecessor: string | null }) {
  const before = c.d.associations.find((a) => a.id === predecessor) ?? null, { command, e, foot } = useDrawer(c, before ? "Changed association recorded. Saved on the server." : "Association recorded. Saved on the server."), [id] = useState(newId), assets = c.options?.assets ?? [];
  const f = useFields({ kind: before?.kind ?? "PhysicalConnection", from_reference: before?.from_reference ?? "", from_asset_id: "", to_reference: before?.to_reference ?? "", to_asset_id: "", source: "", confirmation_method: "", effective_from: nowLocal(), concern: "", constraint_source: "" });
  const [affected, setAffected] = useState<string[]>([]), effective = utc(f.form.effective_from), paired = !!f.form.concern.trim() === !!f.form.constraint_source.trim(), needsConcern = !!before && affected.length > 0 && !f.form.concern.trim();
  const asset = (field: "from_asset_id" | "to_asset_id", label: string) => <Field label={label} error={fieldError(e, field)}><select {...f.bind(field)}><option value="">Not a registered asset</option>{assets.map((a) => <option key={a.id} value={a.id}>{a.display_number} · {a.description}</option>)}</select></Field>;
  return (
    <Dialog drawer title={before ? "Record changed association" : "Record association"} subtitle={before ? `${before.from_reference} → ${before.to_reference} is superseded and kept as history. The changed association asks for review.` : "One fact: a physical connection, a logical assignment or a served area. One never proves another."} busy={command.busy} dirty={f.dirty} onClose={c.close}
      footer={foot(before ? "Record changed association" : "Record association", () => ({ action: "association", id, expected_version: c.d.record.version, kind: f.form.kind, from_reference: f.form.from_reference, from_asset_id: f.form.from_asset_id || null, to_reference: f.form.to_reference, to_asset_id: f.form.to_asset_id || null, source: f.form.source,
        confirmation_method: f.form.confirmation_method || null, effective_from: effective, predecessor_id: predecessor, concern: f.form.concern || null, constraint_source: f.form.constraint_source || null, affected_checks: affected, reason: before ? "Changed sensor, valve or area association recorded" : "Sensor, valve or area association recorded" }),
        !f.form.from_reference.trim() || !f.form.to_reference.trim() || !f.form.source.trim() || !effective || !paired || needsConcern)}>
      <div className="cm-stack">
        <Field label="Kind of association" error={fieldError(e, "kind")}><select data-autofocus {...f.bind("kind")}>{associationKinds.map((k) => <option key={k} value={k}>{text(k)}</option>)}</select></Field>
        <div className="cm-inline"><Field label="From" hint="Sensor, valve or controller channel" error={fieldError(e, "from_reference")}><input {...f.bind("from_reference")} maxLength={120} /></Field>{asset("from_asset_id", "From: registered asset")}</div>
        <div className="cm-inline"><Field label="To" hint="Channel, valve, zone or area" error={fieldError(e, "to_reference")}><input {...f.bind("to_reference")} maxLength={120} /></Field>{asset("to_asset_id", "To: registered asset")}</div>
        <Field label="Source of this association" hint="Where it is stated: drawing issue, I/O schedule, site observation" error={fieldError(e, "source")}><input {...f.bind("source")} maxLength={300} /></Field>
        <Field label="Confirmation method" hint="How it was, or will be, confirmed on site. A reviewer needs one to confirm it." error={fieldError(e, "confirmation_method")}><input {...f.bind("confirmation_method")} maxLength={300} /></Field>
        <Field label="Effective from" hint="Entered in this browser's time zone, kept as a UTC instant and shown in site time" error={fieldError(e, "effective_from")}><input type="datetime-local" {...f.bind("effective_from")} /></Field>
        <div className="cm-inline">
          <Field label="Concern" hint="Only with the sourced constraint it rests on" error={fieldError(e, "concern")}><textarea {...f.bind("concern")} maxLength={600} /></Field>
          <Field label="Sourced constraint" hint="No universal one-sensor-one-area rule is assumed" error={fieldError(e, "constraint_source")}><textarea {...f.bind("constraint_source")} maxLength={300} /></Field>
        </div>
        {!paired && <p className="cm-note" role="note">A concern and its sourced constraint are recorded together, or not at all.</p>}
        <AffectedChecks d={c.d} value={affected} onChange={(keys) => { setAffected(keys); f.touch(); }} />
        {needsConcern && <p className="cm-note" role="note">Say what changed and name the sourced constraint, so the affected checks can be reassessed.</p>}
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function AssociationReviewDrawer({ c, association, decision }: { c: Ctx; association: Association; decision: "Confirmed" | "ReviewRequired" }) {
  const confirming = decision === "Confirmed", { command, e, foot } = useDrawer(c, confirming ? "Association confirmed. Saved on the server." : "Association flagged for review. Saved on the server.");
  const f = useFields({ review_note: "", confirmation_method: association.confirmation_method ?? "", concern: association.concern ?? "", constraint_source: association.constraint_source ?? "" }), [affected, setAffected] = useState<string[]>(association.affected_checks);
  return (
    <Dialog drawer title={confirming ? "Confirm association" : "Flag association for review"} subtitle={`${association.kind_label}: ${association.from_reference} → ${association.to_reference}. ${confirming ? "Confirming this fact proves no other kind of association." : "A flag asks for reassessment of the named checks. It invalidates nothing else."}`} busy={command.busy} dirty={f.dirty} onClose={c.close}
      footer={foot(confirming ? "Confirm association" : "Flag for review", () => ({ action: "association_review", association_id: association.id, expected_version: association.version, decision, review_note: f.form.review_note, confirmation_method: f.form.confirmation_method || null,
        ...(confirming ? {} : { concern: f.form.concern || null, constraint_source: f.form.constraint_source || null, affected_checks: affected }), reason: confirming ? "Association confirmed by the independent reviewer" : "Association flagged for review" }),
        !f.form.review_note.trim() || (confirming ? !f.form.confirmation_method.trim() : !f.form.concern.trim() || !f.form.constraint_source.trim()))}>
      <div className="cm-stack">
        <Field label="Confirmation method" hint={confirming ? "How the association was confirmed" : undefined} error={fieldError(e, "confirmation_method")}><input data-autofocus {...f.bind("confirmation_method")} maxLength={300} /></Field>
        {!confirming && (
          <>
            <Field label="Concern" error={fieldError(e, "concern")}><textarea {...f.bind("concern")} maxLength={600} /></Field>
            <Field label="Sourced constraint it rests on" hint="No universal one-sensor-one-area rule is assumed" error={fieldError(e, "constraint_source")}><input {...f.bind("constraint_source")} maxLength={300} /></Field>
            <AffectedChecks d={c.d} value={affected} onChange={(keys) => { setAffected(keys); f.touch(); }} />
          </>
        )}
        <Field label="Review note" error={fieldError(e, "review_note")}><textarea {...f.bind("review_note")} maxLength={1000} /></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

function BackupDrawer({ c }: { c: Ctx }) {
  const { command, e, foot } = useDrawer(c, "Backup reference recorded. Saved on the server."), [id] = useState(newId), assets = c.options?.assets ?? [];
  const f = useFields({ asset_reference: "", asset_id: "", purpose: "", configuration_version: "", native_format: "", stored_reference: "", content_hash: "", captured_at: nowLocal(), access_class: "Restricted", compatibility: "", required_stage: "TechnicalIssue" });
  const captured = utc(f.form.captured_at), hash = f.form.content_hash.trim().toLowerCase(), hashValid = !hash || /^[a-f0-9]{64}$/.test(hash);
  return (
    <Dialog drawer title="Record backup reference" subtitle="Where a configuration backup is kept, and what it is a backup of. No controller is contacted and no backup content or credential is stored here." busy={command.busy} dirty={f.dirty} onClose={c.close}
      footer={foot("Record backup reference", () => ({ action: "backup", id, expected_version: c.d.record.version, asset_reference: f.form.asset_reference, asset_id: f.form.asset_id || null, purpose: f.form.purpose, configuration_version: f.form.configuration_version, native_format: f.form.native_format, stored_reference: f.form.stored_reference,
        content_hash: hash || null, captured_at: captured, access_class: f.form.access_class, compatibility: f.form.compatibility || null, required_stage: f.form.required_stage, reason: "Configuration backup reference recorded" }),
        !f.form.asset_reference.trim() || !f.form.purpose.trim() || !f.form.configuration_version.trim() || !f.form.native_format.trim() || !f.form.stored_reference.trim() || !captured || !hashValid)}>
      <div className="cm-stack">
        <div className="cm-inline">
          <Field label="Asset or controller" error={fieldError(e, "asset_reference")}><input data-autofocus {...f.bind("asset_reference")} maxLength={120} /></Field>
          <Field label="Registered asset, if any" error={fieldError(e, "asset_id")}><select {...f.bind("asset_id")}><option value="">Not a registered asset</option>{assets.map((a) => <option key={a.id} value={a.id}>{a.display_number} · {a.description}</option>)}</select></Field>
        </div>
        <Field label="Purpose" error={fieldError(e, "purpose")}><input {...f.bind("purpose")} maxLength={300} /></Field>
        <div className="cm-inline">
          <Field label="Configuration version" error={fieldError(e, "configuration_version")}><input {...f.bind("configuration_version")} maxLength={80} /></Field>
          <Field label="Native format" error={fieldError(e, "native_format")}><input {...f.bind("native_format")} maxLength={60} /></Field>
        </div>
        <Field label="Stored reference" hint="Where the backup is kept. A reference only: never a credential, and never the content." error={fieldError(e, "stored_reference")}><input {...f.bind("stored_reference")} maxLength={300} /></Field>
        <Field label="Content hash (SHA-256)" hint="64 lower-case hexadecimal characters. Without it, identity can never be verified." error={fieldError(e, "content_hash") ?? (hashValid ? undefined : "A content hash is a SHA-256 in lower-case hexadecimal.")}><input {...f.bind("content_hash")} maxLength={64} spellCheck={false} /></Field>
        <Field label="Captured" hint="Entered in this browser's time zone, kept as a UTC instant and shown in site time" error={fieldError(e, "captured_at")}><input type="datetime-local" {...f.bind("captured_at")} /></Field>
        <div className="cm-inline">
          <Field label="Access class" error={fieldError(e, "access_class")}><select {...f.bind("access_class")}><option value="Restricted">Restricted</option><option value="Internal">Internal</option></select></Field>
          <Field label="Required" error={fieldError(e, "required_stage")}><select {...f.bind("required_stage")}>{requiredStages.map((s) => <option key={s} value={s}>{text(s)}</option>)}</select></Field>
        </div>
        <Field label="Compatibility" hint="Firmware, tool or hardware the backup needs to be restored" error={fieldError(e, "compatibility")}><input {...f.bind("compatibility")} maxLength={300} /></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}

const factHelp = { available: "That the backup exists where the reference says, and could be read. It proves nothing about what it contains or whether it restores.", identity: "That the backup is the one described: checked against its recorded content hash. It needs the backup evidenced as available first.",
  restore: "That a restore from this backup was carried out and verified. It needs the backup's identity verified first, and it is the independent reviewer's to record." } as const;
function BackupVerifyDrawer({ c, backup, fact }: { c: Ctx; backup: Backup; fact: "available" | "identity" | "restore" }) {
  const label = backup.facts.find((x) => x.key === fact)!.label, { command, e, foot } = useDrawer(c, `${label}: evidence recorded. Saved on the server.`), f = useFields({ evidence: "" });
  return (
    <Dialog drawer title={`Record evidence: ${label.toLowerCase()}`} subtitle={`${backup.asset_reference} · ${backup.configuration_version}. One fact with its own evidence. No other fact is inferred from it.`} busy={command.busy} dirty={f.dirty} onClose={c.close}
      footer={foot("Record evidence", () => ({ action: "backup_verify", backup_id: backup.id, expected_version: backup.version, fact, evidence: f.form.evidence, reason: `Backup evidence recorded: ${label.toLowerCase()}` }), !f.form.evidence.trim())}>
      <div className="cm-stack">
        <p className="cm-note">{factHelp[fact]}</p>
        <Field label="Evidence" hint="What was checked, how, and where the record of it is kept" error={fieldError(e, "evidence")}><textarea data-autofocus {...f.bind("evidence")} maxLength={600} /></Field>
        <CommandNotice command={command} />
      </div>
    </Dialog>
  );
}
