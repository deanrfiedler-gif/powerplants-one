"use client";
import Link from "next/link";
import {
  formatStamp,
  initials,
  outcomeLabels,
  readinessSummary,
  readinessGroups,
  outputStateLabel,
  outputErrorMessage,
  distributionLabel,
  readableValue,
  statusPresentation,
  revisionLabel,
  type PackCriterion,
} from "../../pack-view";
import type {
  Pack,
  PackIssue,
  PackRecipient,
  PackRevision,
} from "./job-pack-types";
import { Badge, Icon, KeyRow, type IconName } from "./job-pack-ui";

const zoneOf = (revision?: PackRevision) =>
  revision?.snapshot.appointment.timezone ?? "Australia/Brisbane";

function CriterionRow({ c, zone }: { c: PackCriterion; zone: string }) {
  const tone =
      c.outcome === "PermittedException"
        ? "exception"
        : c.outcome === "NotApplicable"
          ? "na"
          : c.outcome === "Pass"
            ? ""
            : "blocked",
    icon: IconName =
      tone === "blocked"
        ? "warning"
        : tone === "exception"
          ? "info"
          : tone === "na"
            ? "minus"
            : "circle";
  return (
    <div className={`jp-readiness-row ${tone}`}>
      <Icon name={icon} />
      <div>
        {c.label}
        <span className="jp-outcome">{outcomeLabels[c.outcome]}</span>
        <small>
          {c.stale
            ? `Recorded ${outcomeLabels[c.recorded_outcome]}; the scope changed — assess again`
            : c.expired
              ? `Recorded ${outcomeLabels[c.recorded_outcome]}; the evidence has expired`
              : (c.reason ?? "No assessment recorded")}
        </small>
        <small>
          {c.blocking_stage} stage ·{" "}
          {c.exception_allowed
            ? "exception permitted"
            : "no exception permitted"}
          {c.assessed_by_name && c.assessed_at
            ? ` · ${c.assessed_by_name}, ${formatStamp(c.assessed_at, zone)}`
            : ""}
        </small>
        {c.valid_until && (
          <small>Valid until {formatStamp(c.valid_until, zone)}</small>
        )}
      </div>
    </div>
  );
}

// Readiness is read from the policy registry and the server's dispatch result. Nothing here evaluates it.
export function ReadinessCard({
  pack,
  revision,
  children,
}: {
  pack: Pack;
  revision?: PackRevision;
  children?: React.ReactNode;
}) {
  const zone = zoneOf(revision),
    summary = pack.criteria ? readinessSummary(pack.criteria) : null,
    held = pack.readiness.dispatch_hold;
  return (
    <section className="jp-side-card">
      <div className="jp-side-heading">
        <h2>Pack readiness</h2>
        <span className="jp-muted jp-small">
          {summary ? summary.text : "Dispatch status for this visit"}
        </span>
      </div>
      <div className="jp-side-body">
        {pack.basis && (
          <div className="jp-readiness-context">
            <div>
              <strong>Scope and visit linked</strong>
              <br />
              Work order v{pack.basis.work_version} · scope v
              {pack.basis.scope_version} · appointment v
              {pack.basis.appointment_version} · site record v
              {pack.basis.site_version}
              {(pack.basis_drift ?? []).map((d) => (
                <span key={d.field}>
                  <br />
                  <span className="changed">
                    {d.source} {d.label}: {d.from} →{" "}
                    {d.to ?? "current record unavailable"}
                  </span>
                </span>
              ))}
            </div>
            {pack.readiness_policy && (
              <div>
                Criteria and outcomes follow {pack.readiness_policy.key} v
                {pack.readiness_policy.version}.
              </div>
            )}
          </div>
        )}
        {pack.criteria &&
          readinessGroups(pack.criteria).map((group) => (
            <section
              className="jp-readiness-group"
              key={group.stage}
              aria-label={`${group.stage} readiness`}
            >
              <h3>
                {group.stage} · {group.satisfied.length} of {group.total}{" "}
                satisfied
              </h3>
              {group.attention.map((c) => (
                <CriterionRow key={c.criterion_code} c={c} zone={zone} />
              ))}
              {!!group.satisfied.length && (
                <details>
                  <summary>{group.satisfied.length} satisfied — show</summary>
                  {group.satisfied.map((c) => (
                    <CriterionRow key={c.criterion_code} c={c} zone={zone} />
                  ))}
                </details>
              )}
            </section>
          ))}
        {pack.actions.can_prepare && pack.criteria && (
          <p className="jp-side-foot">
            <Link href={`/service/appointments/${pack.appointment_id}`}>
              Assess readiness at the appointment
            </Link>
          </p>
        )}
        <div className={`jp-dispatch ${held ? "held" : "ready"}`}>
          <strong>
            {held ? "Dispatch held" : "Pack dispatch checks complete"}
          </strong>
          {pack.readiness.reasons.length > 0 && (
            <ul>
              {pack.readiness.reasons.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
        </div>
        {children}
        <p className="jp-side-foot">
          Readiness is checked before issue. Dispatch remains held until issue,
          every crew acknowledgement and the other work controls are complete.
        </p>
      </div>
    </section>
  );
}

export function CrewCard({
  pack,
  revision,
  issue,
  children,
}: {
  pack: Pack;
  revision?: PackRevision;
  issue?: PackIssue;
  children?: React.ReactNode;
}) {
  const zone = zoneOf(revision),
    recipients: PackRecipient[] = pack.readiness.recipients,
    responded = recipients.filter((r) => r.acknowledged_at).length,
    crewRevision =
      pack.revisions.find((r) => r.id === issue?.revision_id) ?? revision;
  return (
    <section className="jp-side-card">
      <div className="jp-side-heading">
        <h2>Crew acknowledgement</h2>
        {recipients.length ? (
          <Badge tone={responded === recipients.length ? "green" : "warning"}>
            {responded} of {recipients.length} acknowledged
          </Badge>
        ) : (
          <Badge>Not yet requested</Badge>
        )}
      </div>
      <div className="jp-side-body">
        {recipients.length
          ? recipients.map((r) => (
              <div className="jp-crew-row" key={r.id}>
                <span className="jp-avatar" aria-hidden="true">
                  {initials(r.display_name)}
                </span>
                <div>
                  <strong>{r.display_name}</strong>
                  <small>
                    {crewRevision?.snapshot.recipients.find(
                      (member) => member.assignment_id === r.assignment_id,
                    )?.role ?? "Role not recorded"}
                  </small>
                  {pack.distribution
                    .filter(
                      (f) =>
                        f.recipient_id === r.id &&
                        ["TaskCreated", "Opened", "Downloaded"].includes(
                          f.kind,
                        ),
                    )
                    .sort(
                      (a, b) =>
                        Date.parse(a.occurred_at) - Date.parse(b.occurred_at),
                    )
                    .map((f) => (
                      <small key={f.id}>
                        {distributionLabel(f.kind)} ·{" "}
                        {formatStamp(f.occurred_at, zone)}
                      </small>
                    ))}
                  <small>
                    {r.acknowledged_at
                      ? `Acknowledged ${formatStamp(r.acknowledged_at, zone)}`
                      : "Awaiting explicit response"}
                  </small>
                </div>
              </div>
            ))
          : revision?.snapshot.recipients.map((r) => (
              <div className="jp-crew-row" key={r.assignment_id}>
                <span className="jp-avatar" aria-hidden="true">
                  {initials(r.name)}
                </span>
                <div>
                  <strong>{r.name}</strong>
                  <small>{r.role}</small>
                </div>
              </div>
            ))}
        <p>
          {issue
            ? "Each response applies only to this exact issue and the responder's own assignment. It does not record attendance."
            : "Acknowledgement is requested against the issued pack revision. Recipient tasks are created only after a durable issue."}
        </p>
        {children}
      </div>
    </section>
  );
}

export function RecordCard({
  pack,
  revision,
  issue,
}: {
  pack: Pack;
  revision?: PackRevision;
  issue?: PackIssue;
}) {
  const summary = pack.criteria ? readinessSummary(pack.criteria) : null;
  return (
    <section className="jp-side-card jp-pack-record">
      <div className="jp-side-heading">
        <h2>Pack record</h2>
      </div>
      <div className="jp-side-body">
        <dl>
          <KeyRow label="Revision">
            {revision ? revisionLabel(revision.revision) : "Not visible"}
          </KeyRow>
          <KeyRow label="State">{statusPresentation(pack).label}</KeyRow>
          {pack.basis && (
            <>
              <KeyRow label="Work-order scope">
                v{pack.basis.scope_version}
              </KeyRow>
              <KeyRow label="Appointment version">
                v{pack.basis.appointment_version}
              </KeyRow>
            </>
          )}
          <KeyRow label="Current issue">
            {issue ? (
              <Link href={`/documents/${issue.id}`}>
                {revisionLabel(issue.revision)}
              </Link>
            ) : (
              "Not issued"
            )}
          </KeyRow>
          {summary && (
            <KeyRow label="Readiness">
              {summary.satisfied} of {summary.total}
            </KeyRow>
          )}
          <KeyRow label="Dispatch" held={pack.readiness.dispatch_hold}>
            {pack.readiness.dispatch_hold ? "Held" : "Clear"}
          </KeyRow>
          <KeyRow label="Record version">{pack.version}</KeyRow>
        </dl>
      </div>
    </section>
  );
}

// Issue, recovery and distribution sit outside the r03 preview. The workbench keeps them.
export function OutputCard({
  pack,
  revision,
  issue,
  busy,
  working,
  onRecover,
  onSend,
}: {
  pack: Pack;
  revision?: PackRevision;
  issue?: PackIssue;
  busy: boolean;
  working: boolean;
  onRecover: (jobId: string) => void;
  onSend: (recipient: PackRecipient) => void;
}) {
  const zone = zoneOf(revision);
  if (!pack.jobs.length && !issue && !pack.follow_ups.length) return null;
  return (
    <section className="jp-side-card">
      <div className="jp-side-heading">
        <h2>Output and distribution</h2>
        <span className="jp-muted jp-small">
          A queued or generated output is not an issue
        </span>
      </div>
      <div className="jp-side-body">
        {pack.jobs.map((j) => (
          <div className="jp-job" key={j.id}>
            <strong>
              Output for{" "}
              {pack.revisions.find((r) => r.id === j.revision_id)
                ? revisionLabel(
                    pack.revisions.find((r) => r.id === j.revision_id)!
                      .revision,
                  )
                : "a saved revision"}
            </strong>
            <p>
              {outputStateLabel(j.state)} · {j.attempts} attempt
              {j.attempts === 1 ? "" : "s"}
            </p>
            {j.error_code && (
              <p>
                {outputErrorMessage(j.error_code)}{" "}
                <small>Reference: {j.error_code}</small>
              </p>
            )}
            <p>Recovery owner {j.recovery_owner_name ?? "Not recorded"}</p>
            {pack.actions.can_issue &&
              !["Issued", "StaleSource"].includes(j.state) && (
                <button
                  type="button"
                  className="jp-side-action"
                  disabled={busy}
                  onClick={() => onRecover(j.id)}
                >
                  {working
                    ? "Processing original output…"
                    : "Process or recover original output"}
                </button>
              )}
            {pack.actions.can_issue && j.attempts > 0 && (
              <p className="jp-gap-top">
                <a
                  href={`/api/v1/render-jobs/${j.id}/html`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Inspect retained generated attempt
                </a>{" "}
                ·{" "}
                <a href={`/api/v1/render-jobs/${j.id}/pdf`}>
                  Download retained attempt
                </a>{" "}
                (availability verified on retrieval)
              </p>
            )}
            {j.state === "StaleSource" && (
              <p className="jp-gap-top">
                Original attempt retained. Prepare and check a new revision with
                current sources.
              </p>
            )}
          </div>
        ))}
        {pack.follow_ups.map((f) => (
          <p key={f.activity_id} className="jp-gap-top">
            <Link href={`/work/${f.activity_id}`}>{f.summary}</Link> ·{" "}
            {readableValue(f.status)} · Owner {f.owner_name ?? "Not recorded"}
          </p>
        ))}
        {pack.distribution.map((d) => (
          <p key={d.id} className="jp-gap-top">
            {d.display_name}: {distributionLabel(d.kind)} ·{" "}
            {formatStamp(d.occurred_at, zone)}
          </p>
        ))}
        {issue && (
          <p className="jp-gap-top">
            In-app tasks, simulated sending and retrieval are separate from
            explicit acknowledgement. No message is sent.
          </p>
        )}
        {pack.actions.can_issue && issue && (
          <h3 className="jp-subheading">
            Simulated sending — no message is sent
          </h3>
        )}
        {pack.actions.can_issue &&
          issue &&
          pack.readiness.recipients.map((r) => (
            <button
              type="button"
              className="jp-side-action"
              key={r.id}
              disabled={busy}
              onClick={() => onSend(r)}
            >
              Record simulated sending to {r.display_name}
            </button>
          ))}
      </div>
    </section>
  );
}
