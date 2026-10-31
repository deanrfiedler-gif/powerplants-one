"use client";
import Link from "next/link";
import type { readDealFollowThrough } from "../crm/worklist-followthrough";
import { useCrmResource } from "./crm-state";
import { ErrorNotice, Stamp } from "./business-ui";
export function DealFollowThrough({
  id,
  version,
  onReload,
}: {
  id: string;
  version: number;
  onReload: () => void;
}) {
  const resource = useCrmResource<
    Awaited<ReturnType<typeof readDealFollowThrough>>
  >(`crm/opportunities/${id}/follow-through`, true);
  const d = resource.data;
  return (
    <section className="crm-snapshot-followthrough">
      <h3>Deal follow-through</h3>
      {resource.loading && (
        <p role="status">Loading permitted source records…</p>
      )}
      <ErrorNotice error={resource.error} />
      {!!resource.error && (
        <button className="secondary" onClick={resource.reload}>
          Retry follow-through
        </button>
      )}
      {d && (
        <>
          {d.opportunity_version !== version && (
            <p role="status">
              The deal changed since this snapshot. Reload the deal before
              relying on these checks.{" "}
              <button className="secondary" onClick={onReload}>
                Reload deal snapshot
              </button>
            </p>
          )}
          <article>
            <strong>Issued quotations</strong>
            {d.quotations.items.map((q) => (
              <p key={q.revision_id}>
                <Link href={q.links.quotation}>
                  {q.reference} · revision {q.revision}
                </Link>
                {!q.is_current_revision ? " · newer revision exists" : ""}
                <br />
                {q.response_outcome
                  ? `Reported response: ${q.response_outcome}`
                  : "No reported response"}
                {q.response_outcome === "Accepted"
                  ? q.response_ready
                    ? " · native response readiness complete"
                    : " · native response holds remain"
                  : ""}
                {q.basis_current === false ? " · source review needed" : ""}
              </p>
            ))}
            {!d.quotations.items.length && (
              <p>
                {d.quotations.availability === "Complete"
                  ? "No issued quotation available in this window."
                  : "Issued quotation information unavailable."}
              </p>
            )}
            {(d.quotations.availability === "Partial" ||
              d.quotations.has_more) && (
              <p>
                Partial source window. Some quotation information is outside
                this read or unavailable.
              </p>
            )}
          </article>
          <article>
            <strong>Estimating and receiving handovers</strong>
            {d.handovers.items.map((h) => (
              <p key={h.id}>
                <Link href={h.href}>
                  {h.kind === "Won" ? "Receiving" : "Estimating"} handover ·{" "}
                  {h.state}
                </Link>
                <br />
                Revision {h.revision} · saved version {h.version}
                {h.source_changed ? " · renewed source review needed" : ""}
              </p>
            ))}
            {!d.handovers.items.length && (
              <p>
                {d.handovers.availability === "Complete"
                  ? "No handover available in this window."
                  : "Handover information unavailable."}
              </p>
            )}
            {(d.handovers.availability === "Partial" ||
              d.handovers.has_more) && (
              <p>
                Partial source window. Some handover information is outside this
                read or unavailable.
              </p>
            )}
          </article>
          <details>
            <summary>Saved estimating sources</summary>
            {d.estimates.items.map((e) => (
              <p key={e.id}>
                <Link href={`/estimating/estimates/${e.id}`}>
                  {e.reference}
                </Link>{" "}
                · saved version {e.version} · {e.state}
              </p>
            ))}
            {!d.estimates.items.length && (
              <p>
                {d.estimates.availability === "Complete"
                  ? "No estimate available in this window."
                  : "Estimating information unavailable."}
              </p>
            )}
            {(d.estimates.availability === "Partial" ||
              d.estimates.has_more) && <p>Partial estimating source window.</p>}
          </details>
          <section className="crm-snapshot-advisory">
            <h3>{d.advisory.stage} exit conditions</h3>
            {d.advisory.conditions.map((condition) => (
              <p key={condition}>{condition}</p>
            ))}
            <p>
              Advisory · review required. Meeting, agreement and acknowledgement
              completion are not stored assessments. These prompts do not block
              a stage move.
            </p>
          </section>
          <p>
            Exact native sources · deal version {d.opportunity_version} · as at{" "}
            <Stamp value={d.observed_at} />
          </p>
        </>
      )}
    </section>
  );
}
