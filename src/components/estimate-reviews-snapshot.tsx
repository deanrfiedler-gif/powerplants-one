"use client";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "./ui/button";
import { denied, useCrmResource } from "./crm-state";
import { RegisterChip } from "./ui/register-table";
import { formatDateTime } from "../shell/date-format";
import {
  reviewLabels,
  reviewValue,
  waitingTime,
} from "../estimating/review/queue-presentation";
import type { QueueRow } from "../estimating/review/queue-model";
import type { ReviewSnapshot } from "../estimating/review/queue-snapshot";

export function ReviewQueueSnapshot({
  row,
  rows,
  asOf,
  onSelect,
  onClose,
}: {
  row: QueueRow;
  rows: QueueRow[];
  asOf: string;
  onSelect: (row: QueueRow) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null),
    [tab, setTab] = useState("findings");
  const query = new URLSearchParams({
    source: row.source,
    id: row.record_id,
    submission_id: row.submission_id,
    kind: row.kind,
  });
  const resource = useCrmResource<ReviewSnapshot>(
      `estimating/reviews/snapshot?${query}`,
      true,
    ),
    d = resource.error ? null : resource.data;
  const index = rows.findIndex((r) => r.id === row.id);
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div
      className="er-snapshot"
      role="region"
      aria-label="Exact review snapshot"
      ref={panel}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="er-snapshot-controls">
        <Button variant="quiet" aria-label="Close snapshot" onClick={onClose}>
          ×
        </Button>
        <Button
          variant="quiet"
          aria-label="Previous review"
          disabled={index <= 0}
          onClick={() => onSelect(rows[index - 1])}
        >
          ↑
        </Button>
        <Button
          variant="quiet"
          aria-label="Next review"
          disabled={index < 0 || index >= rows.length - 1}
          onClick={() => onSelect(rows[index + 1])}
        >
          ↓
        </Button>
      </div>
      {resource.error ? (
        <div className="er-notice" role="alert">
          <h2>
            {denied(resource.error)
              ? "This review is no longer readable"
              : "Review evidence is unavailable"}
          </h2>
          <p>
            This review could not be confirmed. Retry to check your current
            access and the saved evidence.
          </p>
          <Button onClick={resource.reload}>Retry snapshot</Button>
          <Button onClick={onClose}>Close snapshot</Button>
        </div>
      ) : !d ? (
        <p className="er-notice" role="status">
          Loading exact review evidence…
        </p>
      ) : (
        <>
          <div className="er-snapshot-record">
            <div className="er-snapshot-scroll">
              <header>
                <h2>{d.title}</h2>
                <p className="er-small">
                  {d.reference} ·{" "}
                  {row.source === "EstimateReview"
                    ? "saved version v"
                    : "quotation revision r"}
                  {d.revision}
                </p>
                <RegisterChip tone="neutral">
                  {reviewLabels[row.kind]}
                </RegisterChip>{" "}
                <span>
                  {d.superseded
                    ? "Superseded submission"
                    : (d.reviews.find((r) => r.kind === row.kind)?.state ??
                      "Not recorded")}
                  {!d.source_current && " · Changed basis"}
                </span>
              </header>
              {d.superseded && (
                <p className="er-rule" role="status">
                  This submission has a successor. These are the selected
                  historical facts; no decision is available on the superseded
                  submission.
                </p>
              )}
              <section>
                <h3>Summary</h3>
                <dl>
                  <dt>Sell value</dt>
                  <dd>
                    {reviewValue(row)} <small>AUD · {row.tax_basis}</small>
                  </dd>
                  <dt>Site</dt>
                  <dd>{d.site ?? "Not recorded"}</dd>
                  <dt>Submitted by</dt>
                  <dd>{d.submitted_by}</dd>
                  <dt>Submitted for review</dt>
                  <dd>{formatDateTime(d.submitted_at)}</dd>
                  <dt>Elapsed since submission</dt>
                  <dd>
                    {d.superseded
                      ? "—"
                      : waitingTime(
                          {
                            ...row,
                            submitted_at: d.submitted_at,
                            state: d.reviews.some(
                              (r) =>
                                r.kind === row.kind &&
                                ["Reviewed", "Approved", "Issued"].includes(
                                  r.state,
                                ),
                            )
                              ? "Reviewed"
                              : row.state,
                          },
                          asOf,
                        )}{" "}
                    <small>As at the queue read; no due date or SLA.</small>
                  </dd>
                </dl>
              </section>
              <section>
                <h3>
                  Review of {row.source === "EstimateReview" ? "v" : "r"}
                  {d.revision}
                </h3>
                {d.reviews.map((r) => (
                  <p key={r.kind}>
                    <strong>
                      {reviewLabels[r.kind as keyof typeof reviewLabels] ??
                        r.kind}
                      : {r.state}
                    </strong>
                    {r.carried_forward && (
                      <small>
                        Earlier decision remains applicable; no new decision
                        recorded.
                      </small>
                    )}
                  </p>
                ))}
              </section>
              <section>
                <h3>Source changes</h3>
                <p>{d.source_message}</p>
              </section>
              <p className="er-rule">
                {d.can_decide
                  ? "Your current independent duty permits this review. The review workflow checks your authority and the saved evidence again."
                  : "Read access does not grant decision authority. Own-work exclusions, source changes and existing decisions are checked again in the review workflow."}
              </p>
            </div>
            <footer>
              <ButtonLink href={d.estimate_href}>Open estimate</ButtonLink>
              <ButtonLink href={d.href}>
                {row.source === "EstimateReview"
                  ? "Open review"
                  : "Open approval"}
              </ButtonLink>
            </footer>
          </div>
          <div className="er-snapshot-evidence">
            <div
              className="er-tabs"
              role="tablist"
              aria-label="Review evidence"
            >
              {["findings", "files"].map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  id={`er-${t}-tab`}
                  aria-controls={`er-${t}-panel`}
                  tabIndex={tab === t ? 0 : -1}
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                      e.preventDefault();
                      setTab(t === "findings" ? "files" : "findings");
                      const next =
                        e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                          "button",
                        );
                      next?.[t === "findings" ? 1 : 0]?.focus();
                    }
                  }}
                >
                  {t === "findings" ? "Findings" : "Files"}
                </button>
              ))}
            </div>
            <section
              role="tabpanel"
              id={`er-${tab}-panel`}
              aria-labelledby={`er-${tab}-tab`}
              aria-label={tab === "findings" ? "Findings" : "Files"}
            >
              {tab === "findings" ? (
                d.findings.length ? (
                  d.findings.map((f) => (
                    <article key={f.id}>
                      <strong>
                        {f.prior
                          ? "Prior returned finding"
                          : "Returned finding"}
                      </strong>
                      <p>{f.detail}</p>
                      {f.response && <p>Submitted response: {f.response}</p>}
                    </article>
                  ))
                ) : (
                  <p>
                    No returned findings for this review kind on the selected
                    submission.
                  </p>
                )
              ) : d.files.length ? (
                d.files.map((f) => (
                  <p key={f.href}>
                    <ButtonLink href={f.href}>{f.label}</ButtonLink>
                  </p>
                ))
              ) : (
                <p>
                  Open the review to inspect its saved evidence. No separate
                  files are available here.
                </p>
              )}
            </section>
            <h3>History</h3>
            <p className="er-small">Recorded review and release events.</p>
            <ol className="er-history">
              {d.history.map((h) => (
                <li key={h.id}>
                  <strong>{h.label}</strong>
                  <small>
                    {formatDateTime(h.at)} · {h.actor}
                  </small>
                  <p>{h.reason}</p>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
