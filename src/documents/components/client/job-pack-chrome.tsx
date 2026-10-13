"use client";
import Link from "next/link";
import type { KeyboardEvent } from "react";
import { WorklistMenu } from "../../../components/crm-worklist-tools";
import { RecordIdentity } from "../../../shell/record-identity";
import {
  packSectionShortTitles,
  formatStamp,
  revisionLabel,
  readinessSummary,
  statusPresentation,
} from "../../pack-view";
import { sectionKeys, type PackInput } from "../../validation";
import type {
  Pack,
  PackRevision,
  PackIssue,
  PackRecipient,
} from "./job-pack-types";
import { Badge, Icon, Person } from "./job-pack-ui";
import { sectionSources } from "./job-pack-sections";

// One Tab stop per list, with directional and boundary keys.
export function packTabKey(event: KeyboardEvent<HTMLElement>) {
  if (
    ![
      "ArrowDown",
      "ArrowUp",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ].includes(event.key)
  )
    return;
  const tabs = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  );
  const index = tabs.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (index +
            (["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1) +
            tabs.length) %
          tabs.length;
  tabs[next].focus();
  tabs[next].click();
}
export type PackView = "pack" | "prepare" | "revisions";
export function JobPackMenu({
  pack,
  revision,
  view,
  show,
  jump,
  current,
  draft,
  staff,
  first = false,
}: {
  pack?: Pack;
  revision?: PackRevision;
  view: PackView;
  show: (v: PackView) => void;
  jump: (id: string) => void;
  current: string;
  draft: PackInput | null;
  staff: boolean;
  first?: boolean;
}) {
  return (
    <nav className="jp-view-menu" aria-label="Job pack navigation">
      <h2>View</h2>
      <div
        role="tablist"
        aria-label="Job pack view"
        aria-orientation="vertical"
        onKeyDown={packTabKey}
      >
        {(first
          ? ([["prepare", "Preparation"]] as [PackView, string][])
          : ([
              ["pack", "Job pack"],
              ...(staff
                ? [
                    ["prepare", "Preparation"],
                    ["revisions", "Revision history"],
                  ]
                : []),
            ] as [PackView, string][])
        ).map(([key, label]) => (
          <button
            type="button"
            key={key}
            id={`jp-tab-${key}`}
            role="tab"
            data-pack-view
            aria-selected={view === key}
            tabIndex={view === key ? 0 : -1}
            aria-controls={`jp-panel-${key}`}
            onClick={() => show(key)}
          >
            <Icon
              name={
                key === "prepare"
                  ? "edit"
                  : key === "revisions"
                    ? "refresh"
                    : "document"
              }
            />
            <span>{label}</span>
            {key === "pack" && <small aria-hidden="true">9</small>}
          </button>
        ))}
      </div>
      <h2>Pack contents</h2>
      {sectionKeys.map((key, i) => (
        <button
          type="button"
          key={key}
          data-pack-view
          aria-current={
            current === `${view === "prepare" ? "p" : "s"}-${i + 1}`
              ? "location"
              : undefined
          }
          onClick={() => {
            if (view === "revisions") show("pack");
            requestAnimationFrame(() =>
              jump(`${view === "prepare" ? "p" : "s"}-${i + 1}`),
            );
          }}
        >
          <span>
            {String(i + 1).padStart(2, "0")} {packSectionShortTitles[key]}
          </span>
          {draft && draft.sections[key] !== revision?.input.sections[key] && (
            <small className="jp-edited-dot" aria-label="Unsaved change">
              ●
            </small>
          )}
          {pack?.basis_drift?.some((d) =>
            sectionSources[key].includes(d.source),
          ) && (
            <small className="jp-source-dot" aria-label="Source changed">
              ●
            </small>
          )}
        </button>
      ))}
      {revision && (
        <p className="jp-menu-foot">
          Prepared against work order v{revision.snapshot.work.version} ·
          appointment v{revision.snapshot.appointment.version}
          <br />
          Visit ·{" "}
          {formatStamp(
            revision.snapshot.appointment.start_at,
            revision.snapshot.appointment.timezone,
          )}
        </p>
      )}
    </nav>
  );
}
export function JobPackHeader({
  pack: p,
  revision,
  issue,
  title,
  staff,
  busy,
  dirty,
  sourceChanged,
  jobState,
  onPrepare,
  onCheck,
  onReturn,
  onIssue,
  onWithdraw,
  onRecover,
  onPrint,
  onSend,
}: {
  pack?: Pack;
  revision?: PackRevision;
  issue?: PackIssue;
  title: string;
  staff: boolean;
  busy: boolean;
  dirty: boolean;
  sourceChanged: boolean;
  jobState?: string;
  onPrepare: () => void;
  onCheck: () => void;
  onReturn: () => void;
  onIssue: () => void;
  onWithdraw: () => void;
  onRecover: () => void;
  onPrint: () => void;
  onSend: (r: PackRecipient) => void;
}) {
  const status = p ? statusPresentation(p, jobState) : null;
  const primary = !p ? null : sourceChanged &&
    (p.status !== "Issued" || !p.needs_review) &&
    !["Withdrawn", "Returned"].includes(p.status) &&
    p.actions.can_prepare ? (
    <button className="jp-primary" disabled={busy} onClick={onPrepare}>
      Review changed sources
    </button>
  ) : p.status === "Issued" && issue && !p.needs_review ? (
    <Link className="jp-button jp-primary" href={`/documents/${issue.id}`}>
      Open exact issued document
    </Link>
  ) : p.status === "Draft" && p.actions.can_check ? (
    <button className="jp-primary" disabled={busy || dirty} onClick={onCheck}>
      Check this revision
    </button>
  ) : (p.status === "Returned" || p.needs_review) && p.actions.can_prepare ? (
    <button className="jp-primary" disabled={busy} onClick={onPrepare}>
      Prepare successor revision
    </button>
  ) : jobState === "Failed" && p.actions.can_issue ? (
    <button className="jp-primary" disabled={busy} onClick={onRecover}>
      Process or recover original output
    </button>
  ) : p.status === "Checked" &&
    p.actions.can_issue &&
    !["Queued", "Running", "Durable", "StaleSource"].includes(
      jobState ?? "",
    ) ? (
    <button className="jp-primary" disabled={busy || dirty} onClick={onIssue}>
      Queue exact output for issue
    </button>
  ) : null;
  return (
    <>
      <RecordIdentity reference={p?.display_number ?? ""} title={title} />
      <header className="jp-heading jp-figma-heading">
        <div className="jp-title-row">
          <h1 id="jp-page-title">{title}</h1>
          {status && <Badge tone={status.tone}>{status.label}</Badge>}
          {p && (
            <div className="jp-heading-actions">
              {revision && staff && (
                <button
                  type="button"
                  className="jp-print-action"
                  disabled={busy}
                  aria-label="Print preview"
                  title="Print preview"
                  onClick={onPrint}
                >
                  <Icon name="print" />
                </button>
              )}
              {primary}
              <WorklistMenu
                label="Job pack actions"
                icon="more"
                disabled={busy}
              >
                {p.actions.can_prepare && (
                  <button data-menu-close onClick={onPrepare}>
                    Prepare successor revision
                  </button>
                )}
                {p.actions.can_check &&
                  ["Draft", "Returned"].includes(p.status) && (
                    <button data-menu-close onClick={onReturn}>
                      Return preparation
                    </button>
                  )}
                {p.actions.can_check && p.status === "Returned" && (
                  <button data-menu-close onClick={onCheck}>
                    Check this revision
                  </button>
                )}
                {p.actions.can_issue && issue && p.status !== "Withdrawn" && (
                  <button data-menu-close onClick={onWithdraw}>
                    Withdraw current issue
                  </button>
                )}
                {p.actions.can_issue &&
                  issue &&
                  p.readiness.recipients.map((r) => (
                    <button
                      key={r.id}
                      data-menu-close
                      onClick={() => onSend(r)}
                    >
                      Record simulated sending · {r.display_name}
                    </button>
                  ))}
                {staff && (
                  <Link href={`/service/appointments/${p.appointment_id}`}>
                    Open appointment
                  </Link>
                )}
                {staff && revision && (
                  <Link
                    href={`/service/work-orders/${revision.snapshot.work.id}`}
                  >
                    Open work order
                  </Link>
                )}
                <Link href="/service/packs">Back to job packs</Link>
              </WorklistMenu>
            </div>
          )}
        </div>
        <div className="jp-record-meta jp-reference-line">
          <span>
            {p?.display_number} ·{" "}
            {revision
              ? revisionLabel(revision.revision)
              : "No visible revision"}
          </span>
          {staff && revision?.created_by_name && (
            <Person name={revision.created_by_name} />
          )}
          <span>
            {revision &&
              `Saved ${formatStamp(revision.created_at, revision.snapshot.appointment.timezone)}`}
          </span>
          {dirty && <span>Unsaved changes</span>}
        </div>
      </header>
    </>
  );
}
export function DispatchBar({
  pack: p,
  revision,
}: {
  pack: Pack;
  revision?: PackRevision;
}) {
  const summary = p.criteria ? readinessSummary(p.criteria) : null;
  return (
    <div className="jp-dispatch-bar" aria-label="Dispatch requirements">
      <strong>
        {p.readiness.dispatch_hold
          ? "Dispatch held until"
          : "Ready for dispatch"}
      </strong>
      <span>
        <Icon
          name={p.status === "Issued" && !p.needs_review ? "circle" : "info"}
        />
        Pack issued
      </span>
      <span>
        <Icon
          name={
            p.readiness.recipients.length > 0 &&
            p.readiness.recipients.every((r) => r.acknowledged_at) &&
            !p.needs_review
              ? "circle"
              : "info"
          }
        />
        Crew acknowledged ·{" "}
        {p.readiness.recipients.filter((r) => r.acknowledged_at).length} of{" "}
        {p.readiness.recipients.length ||
          revision?.snapshot.recipients.length ||
          0}
      </span>
      <span className={summary?.blocked.length ? "jp-attention" : ""}>
        <Icon
          name={
            summary?.blocked.length ? "warning" : summary ? "circle" : "info"
          }
        />
        Readiness ·{" "}
        {summary
          ? `${summary.satisfied} of ${summary.total} satisfied`
          : "Not available"}
      </span>
      {p.readiness.dispatch_hold && (
        <details>
          <summary>Hold details</summary>
          <ul>
            {p.readiness.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
