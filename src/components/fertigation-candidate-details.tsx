"use client";
import { useState } from "react";
import type { Scope, Calculation } from "../estimating/fertigation/types";
import { candidateConstraints } from "../estimating/fertigation/candidate-constraints";
const human = (v: string) => v.replaceAll("_", " ");
export function FertigationCandidateDetails({
  scope,
  calculation,
}: {
  scope: Scope;
  calculation: Calculation;
}) {
  const [selected, setSelected] = useState(scope.candidates[0]?.id ?? ""),
    [offset, setOffset] = useState(0);
  const candidateId = scope.candidates.some((c) => c.id === selected)
    ? selected
    : scope.candidates[0]?.id;
  const requested = candidateId
    ? candidateConstraints(
        scope,
        calculation,
        candidateId,
        candidateId === selected ? offset : 0,
        25,
      )
    : null;
  const page =
    requested && requested.offset > 0 && requested.offset >= requested.total
      ? candidateConstraints(scope, calculation, requested.candidate_id, 0, 25)
      : requested;
  if (!page)
    return (
      <p>
        Add an exact configured candidate to inspect constraint sources and next
        actions.
      </p>
    );
  return (
    <section className="fn-section" aria-label="Candidate constraint details">
      <h3>Constraint details</h3>
      <p>
        Each limit is user-entered and unverified. Source attribution preserves
        what was recorded; it does not authenticate supplier confirmation or
        technical approval.
      </p>
      <label>
        Configured candidate
        <select
          value={candidateId}
          onChange={(e) => {
            setSelected(e.target.value);
            setOffset(0);
          }}
        >
          {scope.candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label || c.family}
            </option>
          ))}
        </select>
      </label>
      <p>
        Saved/working engine summary: {human(page.summary)}.{" "}
        {page.shortlisted ? "Shortlisted as a proposal." : "Not shortlisted."}{" "}
        Manufacturer confirmation pending; technical approval not configured.
      </p>
      <p>
        Constraints {Math.min(page.offset + 1, page.total)}–
        {Math.min(page.offset + page.rows.length, page.total)} of {page.total}
      </p>
      {page.rows.map((row) => (
        <details key={row.id}>
          <summary>
            {row.constraint}: {human(row.status)}
          </summary>
          <dl>
            <dt>Required value</dt>
            <dd>
              {row.required.value === null
                ? human(row.required.state)
                : `${row.required.value} ${row.required.unit}`}{" "}
              · {row.required.basis}
            </dd>
            <dt>Entered capability</dt>
            <dd>
              {row.capability.value ??
                `${row.capability.minimum ?? "Unknown minimum"} to ${row.capability.maximum ?? "unknown maximum"} ${row.capability.unit}`}{" "}
              · {row.capability.claim}
            </dd>
            <dt>Applicability and conditions</dt>
            <dd>
              {row.applicability}. {row.capability.conditions}
            </dd>
            <dt>Next action</dt>
            <dd>{row.next_action}</dd>
          </dl>
          {row.sources.length ? (
            <ul>
              {row.sources.map((source) => (
                <li key={source.id}>
                  {source.label}: {source.reference || "reference missing"} ·
                  revision {source.source_revision || "unknown"} ·{" "}
                  {source.attribution || "attribution missing"} ·{" "}
                  {source.applicability || "applicability missing"} · SHA-256{" "}
                  {source.sha256 ?? "unknown"} · captured{" "}
                  {source.captured_date ?? "unknown"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Applicable capability source is missing.</p>
          )}
        </details>
      ))}
      <div className="fn-actions">
        <button
          type="button"
          disabled={page.offset === 0}
          onClick={() => {
            setSelected(page.candidate_id);
            setOffset(Math.max(0, page.offset - 25));
          }}
        >
          Previous constraints
        </button>
        <button
          type="button"
          disabled={page.offset + page.rows.length >= page.total}
          onClick={() => {
            setSelected(page.candidate_id);
            setOffset(page.offset + 25);
          }}
        >
          Next constraints
        </button>
      </div>
    </section>
  );
}
