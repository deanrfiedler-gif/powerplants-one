"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  useResource,
  ReadState,
  Stamp,
  friendly,
  type Envelope,
} from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { RegisterChip } from "./ui/register-table";
import { ProductIcon } from "./product-icons";
import { RecordTabs } from "./record-ui";
import { RecordIdentity } from "../shell/record-identity";
import { usePhoneHeader } from "../shell/phone-header";
import { ReportPhoto } from "./report-photo";
import type { readReport } from "../reports/service";

export type ServiceReport = Awaited<
  ReturnType<typeof readReport>
>["items"][number];
export type SubmittedEntry = {
  id: string;
  version: number;
  kind: string;
  payload: Record<string, unknown>;
};
const subscribePhone = (changed: () => void) => {
  const media = window.matchMedia("(max-width: 780px)");
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
export const reportTabs = [
  { id: "details", label: "Details" },
  { id: "evidence", label: "Evidence" },
  { id: "outcome", label: "Work outcome" },
  { id: "report", label: "Customer report" },
  { id: "response", label: "Customer response" },
  { id: "history", label: "History" },
];
export function ReportState({ status }: { status: string }) {
  return (
    <RegisterChip
      tone={
        status === "Issued"
          ? "positive"
          : status === "Returned"
            ? "attention"
            : "neutral"
      }
    >
      {friendly(status)}
    </RegisterChip>
  );
}
export function entryDescription(entry: SubmittedEntry) {
  return Object.entries(entry.payload)
    .filter(
      ([key, value]) => value !== null && value !== "" && !key.endsWith("_id"),
    )
    .map(
      ([key, value]) =>
        `${friendly(key)}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`,
    )
    .join(" · ");
}
export function ReportDetails({ report }: { report: ServiceReport }) {
  const snapshot = report.revisions[0].snapshot;
  return (
    <div className="sv06-details">
      <section>
        <h2>Summary</h2>
        <dl>
          <dt>State</dt>
          <dd>{friendly(report.status)}</dd>
          <dt>Outcome</dt>
          <dd>{friendly(snapshot.completion.scope_outcome)}</dd>
          <dt>Technician</dt>
          <dd>{snapshot.attendance.name}</dd>
          <dt>Attended</dt>
          <dd>
            <Stamp value={snapshot.attendance.start_at} /> –{" "}
            <Stamp value={snapshot.attendance.end_at} />
          </dd>
          <dt>Submitted</dt>
          <dd>
            <Stamp value={report.revisions[0].submitted_at} />
          </dd>
          <dt>Revision</dt>
          <dd>r{String(report.revision).padStart(2, "0")}</dd>
          <dt>Finance</dt>
          <dd>{report.finance_state}</dd>
        </dl>
      </section>
      <section>
        <h2>Customer, site and equipment</h2>
        <dl>
          <dt>Customer</dt>
          <dd>{snapshot.customer.name}</dd>
          <dt>Site</dt>
          <dd>{snapshot.site.name}</dd>
          <dt>Equipment</dt>
          <dd>
            {snapshot.assets
              .map((asset: { display_name: string }) => asset.display_name)
              .join(", ") || "Not recorded"}
          </dd>
        </dl>
        <p>Customer, site and scope are fixed by the attendance.</p>
      </section>
      <section>
        <h2>Work order and request</h2>
        <Link href={`/service/work-orders/${report.work_order.id}`}>
          {snapshot.work.reference}
        </Link>
        <p>
          {report.work_order.status} · {snapshot.scope.summary}
        </p>
        <Link href={`/my-jobs/${report.appointment.id}`}>
          Technician evidence and correction
        </Link>
      </section>
    </div>
  );
}
export function ReportReadiness({ report }: { report: ServiceReport }) {
  const revision = report.revisions[0],
    review = report.reviews.find(
      (item) =>
        item.revision_id === revision.id && item.decision === "Approved",
    );
  const entries = revision.snapshot.entries as SubmittedEntry[];
  const approved =
    review?.entry_decisions.filter(
      (item: { decision: string }) => item.decision === "Approved",
    ).length ?? 0;
  const bits = [
    [`Entries approved · ${approved} of ${entries.length}`, !!review],
    ["Outcome declared", !!revision.snapshot.completion.scope_outcome],
    [
      revision.snapshot.completion.scope_outcome === "Complete"
        ? "No remaining work declared"
        : "Remaining work recorded",
      revision.snapshot.completion.scope_outcome === "Complete" ||
        !!revision.snapshot.completion.remaining_work,
    ],
    ["Site contact", !!review],
    [
      report.status === "Issued" ? "Customer report issued" : "Customer report",
      report.status === "Issued",
    ],
    [
      "Customer response",
      report.responses.some(
        (item) =>
          item.subject === "ReportContent" &&
          report.presentations.some(
            (presentation) =>
              presentation.id === item.presentation_id &&
              presentation.revision_id === revision.id &&
              presentation.kind === "IssuedReport",
          ),
      ),
    ],
  ] as const;
  return (
    <div className="sv06-readiness" aria-label="Before issue">
      <strong>{report.status === "Issued" ? "Issued" : "Before issue"}</strong>
      {bits.map(([label, done]) => (
        <span key={label} data-complete={done}>
          <ProductIcon name={done ? "converted" : "info"} />
          {label}
        </span>
      ))}
    </div>
  );
}
export function ReportEvidence({
  report,
  available,
  onReview,
}: {
  report: ServiceReport;
  available: boolean;
  onReview?: (entry?: string) => void;
}) {
  const revision = report.revisions[0],
    entries = revision.snapshot.entries as SubmittedEntry[];
  const latest = report.reviews.find(
    (review) => review.revision_id === revision.id,
  );
  return (
    <>
      <section className="sv06-notice">
        <header>
          <ProductIcon
            name={report.status === "Returned" ? "warning" : "info"}
          />
          <h2>
            {report.status === "Submitted"
              ? "Submitted for review"
              : friendly(report.status)}
          </h2>
          <ReportState status={report.status} />
        </header>
        <p>
          Approve or return each entry, then the submission. You cannot change
          the technician’s facts. Approval covers the technical evidence only;
          Finance treatment is decided separately.
        </p>
        {!latest && (
          <div className="sv06-notice-row">
            <span>Site contact not selected</span>
            {onReview && (
              <Button
                variant="quiet"
                disabled={!available}
                onClick={() => onReview()}
              >
                Choose contact
              </Button>
            )}
          </div>
        )}
        <footer>
          Nothing is approved until you save the review. A newer submission
          refuses the save and keeps your entries.
        </footer>
      </section>
      <h2 className="sv06-section-title">
        Entries{" "}
        <small>
          {entries.length} submitted ·{" "}
          {latest?.decision === "Approved" ? "reviewed" : "not approved"}
        </small>
      </h2>
      <div className="sv06-entries">
        {entries.map((entry) => (
          <article key={entry.id}>
            <div className="sv06-entry-row">
              <ProductIcon
                name={entry.kind === "Finding" ? "search" : "clock"}
              />
              <div>
                <strong>{entry.kind}</strong>
                <p>{entryDescription(entry)}</p>
              </div>
              {onReview && (
                <Button
                  variant="quiet"
                  disabled={!available}
                  onClick={() => onReview(entry.id)}
                >
                  Review entry
                </Button>
              )}
            </div>
            {entry.kind === "Photo" &&
              report.can_review &&
              (() => {
                const attachment = revision.snapshot.attachments.find(
                  (item: { id: string }) =>
                    item.id === entry.payload.attachment_id,
                );
                return attachment ? (
                  <ReportPhoto
                    available={available}
                    reportId={report.id}
                    revisionId={revision.id}
                    revision={revision.revision}
                    attachment={attachment}
                    caption={String(entry.payload.caption ?? "")}
                  />
                ) : (
                  <p>The submitted photo reference is unavailable.</p>
                );
              })()}
          </article>
        ))}
      </div>
      <p className="sv06-muted">
        Approving issues nothing. The customer report is prepared and issued
        separately.
      </p>
    </>
  );
}
export function ReportRecordFrame({
  report,
  tab,
  onTab,
  editing,
  onReview,
  onIssue,
  onRespond,
  onRefresh,
  children,
}: {
  report: ServiceReport;
  tab: string;
  onTab: (tab: string) => void;
  editing: boolean;
  onReview: () => void;
  onIssue: () => void;
  onRespond: () => void;
  onRefresh: () => void;
  children: ReactNode;
}) {
  const title = report.revisions[0].snapshot.scope.summary ?? "Service report";
  const phone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia("(max-width: 780px)").matches,
    () => false,
  );
  useEffect(() => {
    if (!phone && tab === "details") onTab("evidence");
  }, [phone, tab, onTab]);
  usePhoneHeader({
    title,
    record: {
      more: [
        { label: "Refresh exact report", onSelect: onRefresh },
        { label: "Customer response", onSelect: () => onTab("response") },
        { label: "History", onSelect: () => onTab("history") },
      ],
    },
  });
  const action =
    report.status === "Submitted" && report.can_review ? (
      <Button variant="primary" onClick={onReview}>
        Review submission
      </Button>
    ) : report.status === "Reviewed" && report.can_issue ? (
      <Button variant="primary" onClick={onIssue}>
        Issue report
      </Button>
    ) : report.status === "Issued" && report.can_respond ? (
      <Button variant="primary" onClick={onRespond}>
        Record response
      </Button>
    ) : null;
  return (
    <div
      id="ppo-reports"
      className="sv06-record report-screen"
      data-module-layout="full-bleed"
    >
      <RecordIdentity
        reference={`${report.reference} r${String(report.revision).padStart(2, "0")}`}
        title={title}
      />
      <header className="sv06-record-header">
        <div>
          <h1>
            {title} <ReportState status={report.status} />
          </h1>
          <p>
            {report.reference} r{String(report.revision).padStart(2, "0")} ·{" "}
            {report.revisions[0].snapshot.attendance.name} · Attended{" "}
            <Stamp value={report.revisions[0].snapshot.attendance.start_at} />
          </p>
        </div>
        <div className="sv06-header-actions">
          {!editing && (
            <>
              <ButtonLink href={`/service/work-orders/${report.work_order.id}`}>
                Open work order
              </ButtonLink>
              {action}
            </>
          )}
          <Button
            variant="quiet"
            aria-label="Refresh exact report"
            onClick={onRefresh}
          >
            <ProductIcon name="changes" />
          </Button>
          <ButtonLink href="/service/reports">All reports</ButtonLink>
        </div>
      </header>
      <div className="sv06-phone-status">
        <h1 className="sr-only">{title}</h1>
        <ReportState status={report.status} />
      </div>
      <ReportReadiness report={report} />
      <div className="sv06-record-body">
        <aside className="sv06-record-aside">
          <ReportDetails report={report} />
        </aside>
        <div className="sv06-tab-workspace">
          <RecordTabs
            id="sv06"
            label="Report views"
            tabs={
              phone
                ? reportTabs
                : reportTabs.filter((item) => item.id !== "details")
            }
            value={tab}
            onChange={onTab}
          />
          <div className="sv06-tab-scroll">{children}</div>
        </div>
      </div>
      {!editing && (
        <footer className="sv06-phone-actions">
          {action ? (
            <>
              <ButtonLink href={`/service/work-orders/${report.work_order.id}`}>
                Open work order
              </ButtonLink>
              {action}
            </>
          ) : (
            <p>
              View only. Report actions need the current service owner and the
              relevant permission.
            </p>
          )}
        </footer>
      )}
    </div>
  );
}
function SnapshotSummary({ report }: { report: ServiceReport }) {
  const snapshot = report.revisions[0].snapshot;
  return (
    <div className="sv06-snapshot-summary">
      <h3>Summary</h3>
      <ul>
        <li>
          <ProductIcon name="person" />
          <div>
            {snapshot.customer.name}
            <small>Customer</small>
          </div>
        </li>
        <li>
          <ProductIcon name="sites" />
          <div>
            {snapshot.site.name}
            <small>Site</small>
          </div>
        </li>
        <li>
          <ProductIcon name="work" />
          <div>
            <Link href={`/service/work-orders/${report.work_order.id}`}>
              {snapshot.work.reference}
            </Link>
            <small>Work order · {report.work_order.status}</small>
          </div>
        </li>
        <li>
          <ProductIcon name="person" />
          <div>
            {snapshot.attendance.name}
            <small>
              Technician · <Stamp value={snapshot.attendance.start_at} />
            </small>
          </div>
        </li>
        <li>
          <ProductIcon name="list" />
          <div>
            {friendly(snapshot.completion.scope_outcome)}
            <small>Declared outcome</small>
          </div>
        </li>
      </ul>
      <h3>Submitted entries</h3>
      <ul>
        {(snapshot.entries as SubmittedEntry[]).map((entry) => (
          <li key={entry.id}>
            <ProductIcon name={entry.kind === "Finding" ? "search" : "clock"} />
            <div>
              {entry.kind === "Reading"
                ? `${entry.payload.label ?? "Reading"}: ${entry.payload.value ?? "Not recorded"} ${entry.payload.unit ?? ""}`
                : entry.kind}
              <small>
                {entry.kind === "Reading"
                  ? String(entry.payload.context ?? "Technician original")
                  : entryDescription(entry)}
              </small>
            </div>
          </li>
        ))}
      </ul>
      <p className="sv06-snapshot-note">
        Approving covers only this exact technical evidence. You cannot change
        the technician’s facts: return an entry with a reason for correction.
      </p>
    </div>
  );
}
export function ReportSnapshot({
  id,
  position,
  total,
  onMove,
  onClose,
}: {
  id: string;
  position: number;
  total: number;
  onMove: (offset: number) => void;
  onClose: () => void;
}) {
  const resource = useResource<Envelope<ServiceReport>>(`reports/${id}`),
    report = resource.data?.items[0];
  const panel = useRef<HTMLDivElement>(null),
    [tab, setTab] = useState("review");
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div
      className="sv06-snapshot"
      role="region"
      aria-label="Report snapshot"
      ref={panel}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="sv06-snapshot-controls">
        <Button aria-label="Close snapshot" onClick={onClose}>
          <ProductIcon name="close" />
        </Button>
        <Button
          aria-label="Previous report"
          disabled={position === 0}
          onClick={() => onMove(-1)}
        >
          <ProductIcon name="arrow-up" />
        </Button>
        <Button
          aria-label="Next report"
          disabled={position >= total - 1}
          onClick={() => onMove(1)}
        >
          <ProductIcon name="arrow-down" />
        </Button>
      </div>
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {report && !resource.error && !resource.loading && (
        <>
          <div className="sv06-snapshot-main">
            <header>
              <h2>
                {report.revisions[0].snapshot.scope.summary ?? report.reference}
              </h2>
              <p>
                {report.reference} r{report.revision} ·{" "}
                {report.revisions[0].snapshot.attendance.name}
              </p>
              <ReportState status={report.status} />
            </header>
            <SnapshotSummary report={report} />
            <footer>
              <ButtonLink href={`/service/reports/${id}`}>
                Open report
              </ButtonLink>
              {report.can_review && report.status === "Submitted" && (
                <ButtonLink
                  variant="primary"
                  href={`/service/reports/${id}?review=1`}
                >
                  Review submission
                </ButtonLink>
              )}
            </footer>
          </div>
          <div className="sv06-snapshot-side">
            <div className="sv06-snapshot-review">
              <RecordTabs
                id="sv06-snapshot"
                label="Snapshot views"
                tabs={[
                  { id: "review", label: "Review" },
                  { id: "report", label: "Customer report" },
                ]}
                value={tab}
                onChange={setTab}
              />
              <section
                role="tabpanel"
                id={`sv06-snapshot-panel-${tab}`}
                aria-labelledby={`sv06-snapshot-tab-${tab}`}
              >
                {tab === "review" ? (
                  <>
                    <h3>
                      {report.status === "Submitted"
                        ? "Before review · nothing approved yet"
                        : friendly(report.status)}
                    </h3>
                    <p>
                      <ProductIcon name="converted" /> Outcome declared:{" "}
                      {friendly(
                        report.revisions[0].snapshot.completion.scope_outcome,
                      )}
                    </p>
                    <p>
                      <ProductIcon name="work" />{" "}
                      {report.revisions[0].snapshot.completion.remaining_work
                        ? "Remaining work recorded"
                        : "No remaining work declared"}
                    </p>
                    <small>
                      {report.revisions[0].snapshot.completion.remaining_work ||
                        "No remaining work declared"}
                    </small>
                    <p>
                      <ProductIcon name="info" />{" "}
                      {report.reviews.some(
                        (review) =>
                          review.revision_id === report.revisions[0].id &&
                          review.decision === "Approved",
                      )
                        ? "Site contact selected in approved review"
                        : "Choose the site contact before approving"}
                    </p>
                    <p>
                      <ProductIcon name="list" /> Customer report:{" "}
                      {report.presentations.length
                        ? "Presentation available"
                        : "Prepared after review"}
                    </p>
                  </>
                ) : (
                  <>
                    <h3>Customer report</h3>
                    <p>
                      Open the report to inspect its exact protected
                      presentation. Issuing sends nothing.
                    </p>
                    <ButtonLink href={`/service/reports/${id}?tab=report`}>
                      Inspect customer report
                    </ButtonLink>
                  </>
                )}
              </section>
            </div>
            <div className="sv06-snapshot-history">
              <h3>History</h3>
              {report.revisions.map((revision) => (
                <p key={revision.id}>
                  <ProductIcon name="clock" />
                  <span>
                    Revision {revision.revision} submitted
                    <small>
                      <Stamp value={revision.submitted_at} />
                    </small>
                  </span>
                </p>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
