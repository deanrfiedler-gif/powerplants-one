"use client";
import { useState } from "react";
import { api, ErrorNotice } from "./business-ui";
import type { Calculation, Scope } from "../estimating/fertigation/types";
import {
  candidateStatusChanges,
  findingChanges,
  resultChanges,
} from "../estimating/fertigation/compare-results";
import { recordLocation, withLabels } from "../estimating/fertigation/guidance";
import { SeverityChip } from "./fertigation-cockpit";
import { human } from "./fertigation-fields";

type Change = { field: string; before: string; after: string };
function display(value: unknown): string {
  return value === null
    ? "Unknown"
    : value === undefined
      ? "Not present"
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
}
export function scopeDifferences(
  before: unknown,
  after: unknown,
  path = "Scope",
): Change[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (
    Array.isArray(before) &&
    Array.isArray(after) &&
    [...before, ...after].every((v) => v && typeof v === "object" && "id" in v)
  ) {
    const previous = new Map(before.map((v) => [v.id as string, v])),
      current = new Map(after.map((v) => [v.id as string, v]));
    return [...new Set([...previous.keys(), ...current.keys()])].flatMap((id) =>
      scopeDifferences(
        previous.get(id),
        current.get(id),
        `${path} · ${current.get(id)?.label ?? previous.get(id)?.label ?? id} [${id}]`,
      ),
    );
  }
  if (
    before &&
    after &&
    !Array.isArray(before) &&
    !Array.isArray(after) &&
    typeof before === "object" &&
    typeof after === "object"
  ) {
    const a = before as Record<string, unknown>,
      b = after as Record<string, unknown>;
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((key) =>
      scopeDifferences(a[key], b[key], `${path} / ${human(key)}`),
    );
  }
  return [{ field: path, before: display(before), after: display(after) }];
}

const resultText = (r: Calculation["area_m2"]) =>
  r.state === "known" && r.value !== null
    ? `${Number(r.value.toPrecision(8)).toLocaleString("en-AU")} ${r.unit}`
    : human(r.state);

/** Result, finding and candidate changes between two calculations (UI-24). */
export function CalculationDelta({
  beforeScope,
  before,
  afterScope,
  after,
  beforeLabel,
  afterLabel,
}: {
  beforeScope: Scope;
  before: Calculation;
  afterScope: Scope;
  after: Calculation;
  beforeLabel: string;
  afterLabel: string;
}) {
  const [all, setAll] = useState(false);
  const results = resultChanges(before, after);
  const shown = all ? results : results.filter((r) => r.changed);
  const findings = findingChanges(before, after);
  const candidates = candidateStatusChanges(before, after);
  const label = (scope: Scope, id: string | null) =>
    recordLocation(scope, id)?.label;
  return (
    <div className="fn-delta">
      {before.edition !== after.edition && (
        <p className="fn-note fn-warning">
          The two sides use different calculation editions ({before.edition} and{" "}
          {after.edition}). Differences may come from the edition as well as the
          inputs.
        </p>
      )}
      <h3>Result changes</h3>
      {shown.length ? (
        <div className="fn-table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Result</th>
                <th scope="col" className="fn-number">
                  {beforeLabel}
                </th>
                <th scope="col" className="fn-number">
                  {afterLabel}
                </th>
                <th scope="col" className="fn-number">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.key}>
                  <th scope="row">{r.label}</th>
                  <td className="fn-number">{resultText(r.before)}</td>
                  <td className="fn-number">{resultText(r.after)}</td>
                  <td className="fn-number">
                    {r.difference !== null && r.difference !== 0
                      ? `${r.difference > 0 ? "+" : "−"}${Number(Math.abs(r.difference).toPrecision(6)).toLocaleString("en-AU")} ${r.after.unit}`
                      : r.stateChanged
                        ? `${human(r.before.state)} → ${human(r.after.state)}`
                        : r.changed
                          ? "Changed"
                          : "Unchanged"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No calculated result changes.</p>
      )}
      <button type="button" className="fn-link" onClick={() => setAll(!all)}>
        {all ? "Show changed results only" : "Show all results"}
      </button>
      <h3>Finding changes</h3>
      <p>
        {findings.resolved.length} resolved · {findings.added.length} added ·{" "}
        {findings.unchanged} unchanged
      </p>
      {(findings.resolved.length > 0 || findings.added.length > 0) && (
        <ul className="fn-delta-findings">
          {findings.resolved.map((f) => (
            <li key={`r${f.id}`}>
              <span className="fn-chip fn-chip-success">Resolved</span>
              <SeverityChip severity={f.severity} />
              <s>
                {label(beforeScope, f.record_id)
                  ? `${label(beforeScope, f.record_id)}: `
                  : ""}
                {f.message}
              </s>
            </li>
          ))}
          {findings.added.map((f) => (
            <li key={`a${f.id}`}>
              <span className="fn-chip">Added</span>
              <SeverityChip severity={f.severity} />
              <span>
                {label(afterScope, f.record_id)
                  ? `${label(afterScope, f.record_id)}: `
                  : ""}
                {f.message}
              </span>
            </li>
          ))}
        </ul>
      )}
      {candidates.length > 0 && (
        <>
          <h3>Candidate changes</h3>
          <ul>
            {candidates.map((c) => (
              <li key={c.id}>
                {withLabels(afterScope, c.id)}: {human(c.before)} →{" "}
                {human(c.after)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function FertigationComparison({
  scopeId,
  revisions,
}: {
  scopeId: string;
  revisions: { id: string; version: number }[];
}) {
  const [before, setBefore] = useState(""),
    [after, setAfter] = useState(""),
    [comparison, setComparison] = useState<Change[] | null>(null),
    [sides, setSides] = useState<
      { proposal: Scope; calculation: Calculation; version: number }[] | null
    >(null),
    [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false);
  async function compare() {
    setBusy(true);
    setComparison(null);
    setSides(null);
    setError(null);
    try {
      const [a, b] = await Promise.all(
        [before, after].map((id) =>
          api<{
            revision: { proposal: Scope; version: number };
            calculation: Calculation;
          }>(`estimating/fertigation/${scopeId}?revision_id=${id}`),
        ),
      );
      setSides(
        [a, b].map((d) => ({
          proposal: d.revision.proposal,
          calculation: d.calculation,
          version: d.revision.version,
        })),
      );
      setComparison(scopeDifferences(a.revision.proposal, b.revision.proposal));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="fn-section">
      <h3>Compare exact saved content</h3>
      <p>
        Identities match by UUID. Renaming a valve retains its relationship;
        unrelated same-label records are distinct.
      </p>
      <div className="fn-fields">
        {[
          ["Before revision", before, setBefore],
          ["After revision", after, setAfter],
        ].map(([label, value, setter]) => (
          <label key={label as string}>
            {label as string}
            <select
              value={value as string}
              disabled={busy}
              onChange={(e) => {
                (setter as (value: string) => void)(e.target.value);
                setComparison(null);
              }}
            >
              <option value="">Select saved revision</option>
              {revisions.map((r) => (
                <option value={r.id} key={r.id}>
                  Revision {r.version}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        disabled={!before || !after || before === after || busy}
        onClick={() => void compare()}
      >
        {busy ? "Comparing…" : "Compare saved revisions"}
      </button>
      <ErrorNotice error={error} />
      {comparison && (
        <>
          {sides && (
            <CalculationDelta
              beforeScope={sides[0].proposal}
              before={sides[0].calculation}
              afterScope={sides[1].proposal}
              after={sides[1].calculation}
              beforeLabel={`Revision ${sides[0].version}`}
              afterLabel={`Revision ${sides[1].version}`}
            />
          )}
          <h3>Input changes</h3>
          <p>
            {comparison.length} changed fields. Earlier outputs remain
            unchanged.
          </p>
          <div className="fn-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Field / record</th>
                  <th>Before</th>
                  <th>After</th>
                </tr>
              </thead>
              <tbody>
                {comparison.slice(0, 250).map((change, i) => (
                  <tr key={i}>
                    <td>{change.field}</td>
                    <td>{change.before}</td>
                    <td>{change.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {comparison.length > 250 && (
            <p>
              Showing the first 250 differences. Exact exports retain all saved
              inputs.
            </p>
          )}
        </>
      )}
    </section>
  );
}
