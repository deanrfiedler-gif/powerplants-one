"use client";
import Link from "next/link";
import { useState } from "react";
import type { opportunityCommercial } from "../estimating/reads";
import type { readRelease } from "../estimating/release/reads";
import type { readResponse } from "../estimating/response/reads";
import type { readConversion } from "../estimating/conversion/reads";
import { ErrorNotice, Stamp } from "./business-ui";
import { useCrmResource, denied } from "./crm-state";
import { Button } from "./ui/button";

type Quote = Awaited<
  ReturnType<typeof opportunityCommercial>
>["quotes"][number];
function ReadState({
  resource,
  label,
}: {
  resource: { loading: boolean; error: unknown; reload: () => void };
  label: string;
}) {
  return (
    <>
      {resource.loading && <p role="status">Loading {label}…</p>}
      {denied(resource.error) ? (
        <p>{label} is restricted or unavailable with current access.</p>
      ) : (
        <ErrorNotice error={resource.error} />
      )}
      {!!resource.error && (
        <Button onClick={resource.reload}>Retry {label}</Button>
      )}
    </>
  );
}

export function CommercialQuotation({ quote }: { quote: Quote }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="crm-panel">
      <h4>
        <Link href={`/estimating/quotes/${quote.id}`}>
          {quote.display_number} · {quote.release ? "Release" : "Draft"}{" "}
          revision {quote.version}
        </Link>
      </h4>
      <p>
        {quote.option_label
          ? `Option ${quote.option_label}`
          : "Manual estimate"}{" "}
        ·{" "}
        <Link href={`/estimating/estimates/${quote.estimate_id}`}>
          {quote.estimate_display_number}
        </Link>{" "}
        · Output {quote.render_state}
      </p>
      {quote.release ? (
        <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
          <summary>Issue, reported response and conversion evidence</summary>
          {open && <ReleaseEvidence id={quote.id} />}
        </details>
      ) : (
        <p>Draft output has no recorded issue or customer response.</p>
      )}
    </article>
  );
}
function ReleaseEvidence({ id }: { id: string }) {
  const r = useCrmResource<Awaited<ReturnType<typeof readRelease>>>(
    `estimating/quotes/${id}/release`,
    true,
  );
  const d = r.data;
  return (
    <section aria-label="Exact quotation release evidence">
      <ReadState resource={r} label="Release evidence" />
      {d && (
        <>
          <p>
            Independent approval: {d.approval?.outcome ?? "Not recorded"}.
            Issue: {d.issue ? "Recorded" : "Not recorded"}.
          </p>
          {!d.current && (
            <p role="status">
              Current source check:{" "}
              {d.hold ?? "A source or current revision changed."}
            </p>
          )}
          <Link href={`/estimating/quotes/${id}/release`}>
            Open exact release history
          </Link>
          {d.issue && (
            <>
              <p>
                Issued <Stamp value={String(d.issue.created_at)} />. This exact
                issued output remains retained.
              </p>
              <ResponseEvidence id={id} />
              <details>
                <summary>Native conversion evidence</summary>
                <ConversionEvidence id={id} />
              </details>
            </>
          )}
          {!d.issue && (
            <p>
              No response or conversion is inferred for this unissued revision.
            </p>
          )}
        </>
      )}
    </section>
  );
}
function ResponseEvidence({ id }: { id: string }) {
  const r = useCrmResource<Awaited<ReturnType<typeof readResponse>>>(
    `estimating/quotes/${id}/response`,
    true,
  );
  const d = r.data;
  return (
    <section aria-label="Exact reported response evidence">
      <ReadState resource={r} label="Response evidence" />
      {d && (
        <>
          <p>
            Staff-recorded response:{" "}
            {d.state.response?.report?.outcome ?? "Not recorded"}
            {!d.current ? " · Historical issue" : ""}.
          </p>
          {d.state.response?.report && (
            <p>
              Respondent: {d.state.response.report.respondent} · Reported{" "}
              <Stamp value={d.state.response.report.responded_at} />.
            </p>
          )}
          <p>
            Receiving preparation:{" "}
            {d.state.preparedApplicable
              ? "Current"
              : d.state.preparation
                ? "Retained; renewed review required"
                : "Not recorded"}
            .
          </p>
          {!!d.state.holds.length && (
            <ul aria-label="Response holds">
              {d.state.holds.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          <Link href={`/estimating/quotes/${id}/response`}>
            Open exact response history
          </Link>
          <p className="scope-note">
            Reported acceptance does not verify respondent authority or
            authorise delivery. Synthetic commercial policy remains
            unconfigured.
          </p>
        </>
      )}
    </section>
  );
}
function ConversionEvidence({ id }: { id: string }) {
  const r = useCrmResource<Awaited<ReturnType<typeof readConversion>>>(
    `estimating/quotes/${id}/conversion`,
    true,
  );
  const d = r.data;
  return (
    <section aria-label="Exact native conversion evidence">
      <ReadState resource={r} label="Conversion evidence" />
      {d && (
        <>
          <p>
            Native Supply conversion:{" "}
            {d.executions.length ? "Recorded" : "Not recorded"} ·{" "}
            {d.targets.length} permitted destination records.
          </p>
          {!!d.holds.length && (
            <ul aria-label="Conversion holds">
              {d.holds.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          <Link href={`/estimating/quotes/${id}/conversion`}>
            Open native receiving, targets and follow-up
          </Link>
          <p className="scope-note">
            A recorded conversion retains its original targets; later holds and
            follow-up do not erase that event. Deal Won and Project/Service
            receiving remain separate.
          </p>
        </>
      )}
    </section>
  );
}
