"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { OutcomeSource, readOutcomeBasis } from "../crm/outcome-sources";
import type { readOpportunity } from "../crm/reads";
import type { opportunityCommercial } from "../estimating/reads";
import { ErrorNotice, Field, SelectField } from "./business-ui";
import { denied, useCrmResource } from "./crm-state";
import { Button } from "./ui/button";

type Basis = Awaited<ReturnType<typeof readOutcomeBasis>>;
type Retained = Awaited<
  ReturnType<typeof readOpportunity>
>["outcome_sources"][number];

export function OpportunityOutcomeSource({
  id,
  version,
  outcome,
  onChange,
}: {
  id: string;
  version: number;
  outcome: string;
  onChange: (source: OutcomeSource | null) => void;
}) {
  const [kind, setKind] = useState(""),
    [evidence, setEvidence] = useState(""),
    [revision, setRevision] = useState(""),
    [reviewed, setReviewed] = useState<Basis | null>(null);
  const quotes = useCrmResource<
    Awaited<ReturnType<typeof opportunityCommercial>>
  >(kind === "Quotation" ? `crm/opportunities/${id}/commercial` : null, true);
  const basis = useCrmResource<Basis>(
    kind === "Quotation" && revision
      ? `crm/opportunities/${id}/outcome-basis?${new URLSearchParams({ revision_id: revision })}`
      : null,
    true,
  );
  const restricted = denied(quotes.error) || denied(basis.error);
  useEffect(() => {
    if (restricted) onChange(null);
  }, [restricted, onChange]);
  const current = basis.data;
  const eligible =
    current &&
    current.opportunity_version === version &&
    current.outcomes.some((o) => o === outcome) &&
    current.source;
  const changed =
    reviewed &&
    current &&
    JSON.stringify(reviewed.source) !== JSON.stringify(current.source);
  return (
    <section aria-label="Outcome evidence review">
      <SelectField
        name="outcome_source_kind"
        label="Outcome evidence source"
        value={kind}
        onChange={(value) => {
          setKind(value);
          setReviewed(null);
          setRevision("");
          onChange(
            value === "Independent" && evidence.trim()
              ? { kind: "Independent", evidence }
              : null,
          );
        }}
        options={[
          {
            id: "Quotation",
            display_name: "Issued quotation and reported response",
          },
          { id: "Independent", display_name: "Separate outcome evidence" },
        ]}
        required
      />
      {kind === "Independent" && (
        <Field
          name="commercial_source.evidence"
          label="Separate outcome evidence"
          value={evidence}
          onChange={(value) => {
            setEvidence(value);
            onChange(
              value.trim() ? { kind: "Independent", evidence: value } : null,
            );
          }}
          multiline
          required
          maxLength={2000}
          hint="Describe the evidence reviewed outside the native quotation response."
        />
      )}
      {kind === "Quotation" && (
        <>
          <ErrorNotice error={quotes.error} />
          <ErrorNotice error={basis.error} />
          {!denied(quotes.error) && (
            <SelectField
              name="outcome_revision"
              label="Quotation release to review"
              value={revision}
              onChange={(value) => {
                setRevision(value);
                setReviewed(null);
                onChange(null);
              }}
              options={(quotes.data?.quotes ?? [])
                .filter((q) => q.release)
                .map((q) => ({
                  id: q.id,
                  display_name: `${q.display_number} · Revision ${q.version} · ${q.option_label ? `Option ${q.option_label}` : "Manual estimate"}`,
                }))}
              required
            />
          )}
          {restricted ? (
            <p>
              Quotation evidence is restricted or unavailable with current
              access. Review it again after access is restored.
            </p>
          ) : (
            <>
              {quotes.data && !quotes.data.quotes.some((q) => q.release) && (
                <p>No permitted quotation release is available.</p>
              )}
              {(quotes.loading || basis.loading) && (
                <p role="status">Loading current quotation evidence…</p>
              )}
              {current && (
                <>
                  <p>
                    Current reported response:{" "}
                    {current.reported_outcome ?? "Not recorded"} · Revision{" "}
                    {current.revision}.
                  </p>
                  {!eligible && (
                    <p>
                      This quotation basis is not eligible for the selected{" "}
                      {outcome} outcome.
                    </p>
                  )}
                  {!!current.holds.length && (
                    <ul aria-label="Outcome evidence holds">
                      {current.holds.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  )}
                  <Link href={`/estimating/quotes/${revision}/response`}>
                    Open exact response history
                  </Link>
                  <Button
                    disabled={!eligible || !!reviewed}
                    onClick={() => {
                      if (!eligible || !current.source) return;
                      setReviewed(current);
                      onChange(current.source);
                    }}
                  >
                    Review quotation basis
                  </Button>
                </>
              )}
              {reviewed && (
                <section aria-label="Reviewed quotation basis">
                  <p>
                    {reviewed.display_number} · Revision {reviewed.revision} ·
                    Reviewed response: {reviewed.reported_outcome}.
                  </p>
                  <p>
                    This exact comparison will be submitted. Refreshing does not
                    replace it.
                  </p>
                  {changed && (
                    <p role="status">
                      The quotation response changed after review. Discard this
                      comparison and review the current evidence.
                    </p>
                  )}
                  <Button
                    onClick={() => {
                      setReviewed(null);
                      onChange(null);
                      basis.reload();
                    }}
                  >
                    Discard quotation comparison
                  </Button>
                </section>
              )}
            </>
          )}
          <Button
            onClick={() => {
              if (restricted) {
                setReviewed(null);
                onChange(null);
              }
              quotes.reload();
              basis.reload();
            }}
          >
            Refresh quotation evidence
          </Button>
          <p className="scope-note">
            A reported response is staff-recorded evidence. Recording this sales
            decision does not convert scope or authorise delivery.
          </p>
        </>
      )}
    </section>
  );
}

export function OutcomeSourceHistory({ source }: { source?: Retained }) {
  if (!source)
    return (
      <p>
        Historical narrative outcome; no native quotation link was recorded.
      </p>
    );
  if (source.kind === "Restricted")
    return (
      <p>
        Recorded quotation evidence is restricted or unavailable with current
        access.
      </p>
    );
  if (source.kind === "Independent")
    return (
      <p className="crm-narrative">
        Separate outcome evidence: {source.evidence}
      </p>
    );
  return (
    <section aria-label="Recorded outcome evidence">
      <p>
        <Link href={`/estimating/quotes/${source.revision_id}/response`}>
          {source.display_number} · Revision {source.revision}
        </Link>{" "}
        · Recorded response: {source.recorded_response}.
      </p>
      <p>
        Latest report on this revision:{" "}
        {source.current_response ?? "Not recorded"}.
      </p>
      {source.changed && (
        <p>
          The native issue or response changed. The saved sales outcome and its
          original evidence remain retained.
        </p>
      )}
    </section>
  );
}
