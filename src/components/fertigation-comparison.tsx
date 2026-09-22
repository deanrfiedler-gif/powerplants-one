"use client";
import { useState } from "react";
import { api, ErrorNotice } from "./business-ui";
import type { Scope } from "../estimating/fertigation/types";
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
    [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false);
  async function compare() {
    setBusy(true);
    setComparison(null);
    setError(null);
    try {
      const [a, b] = await Promise.all(
        [before, after].map((id) =>
          api<{ revision: { proposal: Scope } }>(
            `estimating/fertigation/${scopeId}?revision_id=${id}`,
          ),
        ),
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
