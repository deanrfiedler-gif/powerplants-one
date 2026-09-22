"use client";
import { useEffect, useRef, useState } from "react";
import { api, ErrorNotice } from "./business-ui";
import { denied } from "./crm-state";
import { human } from "./fertigation-fields";
import type {
  Calculation,
  Scope,
  Result,
} from "../estimating/fertigation/types";
import type { OutputBasis } from "../estimating/fertigation/output";
import type { ReceivedFertigation } from "../estimating/fertigation/receiving-reads";
export type PreparedFertigationHandover = {
  id: string;
  revision_id: string;
  receiving_revision_id: string | null;
  content_hash: string;
  snapshot: {
    basis: OutputBasis;
    scenario_id: string | null;
    production_context: Scope["production_context"];
    quantities: {
      represented_area: Result;
      connected_flow: Result;
      operating_peak: Result;
    };
    open_findings: Calculation["findings"];
    actions: Scope["actions"];
    limits: string[];
  };
};
export type HandoverAcceptance = {
  expected_version: number;
  prepared_id: string;
  expected_workspace_version: number;
  receiving_revision_id: string;
};
type Current = {
  scope: { version: number; current_revision_id: string };
  source: {
    workspace_version: number;
    current_revision_id: string;
    selected: boolean;
    scope_readiness: string;
    changed: boolean;
    current_context_hash: string;
  };
  can_edit: boolean;
  edit_blocker: string | null;
};
const display = (value: Result) =>
  value.state === "known" && value.value !== null
    ? `${value.value.toLocaleString("en-AU")} ${value.unit}`
    : `${human(value.state)} — ${value.reason}`;
export function FertigationHandoverPreview({
  scopeId,
  workspaceId,
  prepared,
  blocked,
  accepted,
  onAccept,
}: {
  scopeId: string;
  workspaceId: string;
  prepared: PreparedFertigationHandover | undefined;
  blocked: boolean;
  accepted: boolean;
  onAccept: (value: HandoverAcceptance) => void;
}) {
  const [preview, setPreview] = useState<{
      preparedId: string;
      current: Current;
      received: ReceivedFertigation[];
    } | null>(null),
    [loadingKey, setLoadingKey] = useState<string | null>(null),
    [error, setError] = useState<unknown>(null);
  const generation = useRef({ value: 0 }),
    currentKey = useRef("");
  const key = `${scopeId}:${workspaceId}:${prepared?.id ?? ""}`;
  const busy = loadingKey === key;
  useEffect(() => {
    currentKey.current = key;
    const guard = generation.current;
    return () => {
      guard.value++;
    };
  }, [key]);
  const current = preview?.preparedId === prepared?.id ? preview : null;
  const eligible =
    !!current &&
    !!prepared &&
    current.current.can_edit &&
    current.current.scope.current_revision_id === prepared.revision_id &&
    current.current.source.current_revision_id ===
      prepared.snapshot.basis.source_revision_id &&
    current.current.source.selected &&
    current.current.source.scope_readiness === "Complete" &&
    !current.current.source.changed &&
    current.current.source.current_context_hash ===
      prepared.snapshot.basis.source_context_hash;
  const previous = current?.received.find((row) => row.scope_id === scopeId);
  if (denied(error)) return <ErrorNotice error={error} />;
  return (
    <section aria-label="Receiving effect preview">
      <h4>Review the receiving effect</h4>
      <p>
        Acceptance adds an immutable scoping-note association to the exact
        Discovery revision. Existing notes remain readable. Discovery answers,
        estimate lines, SKU mappings, totals and commercial approval are not
        changed.
      </p>
      <ErrorNotice error={error} />
      <button
        type="button"
        disabled={blocked || busy || !prepared}
        onClick={async () => {
          if (!prepared) return;
          const turn = ++generation.current.value;
          setLoadingKey(key);
          setError(null);
          setPreview(null);
          try {
            const detail = await api<Current>(
              `estimating/fertigation/${scopeId}`,
            );
            const received = await api<{ items: ReceivedFertigation[] }>(
              `estimating/workspaces/${workspaceId}/fertigation?revision_id=${detail.source.current_revision_id}`,
            );
            if (turn === generation.current.value && currentKey.current === key)
              setPreview({
                preparedId: prepared.id,
                current: detail,
                received: received.items,
              });
          } catch (e) {
            if (turn === generation.current.value && currentKey.current === key)
              setError(e);
          } finally {
            if (turn === generation.current.value) setLoadingKey(null);
          }
        }}
      >
        {busy ? "Loading receiving effect…" : "Review receiving effect"}
      </button>
      {prepared && (
        <p>
          Prepared scope revision {prepared.snapshot.basis.revision_number} ·{" "}
          <code>{prepared.revision_id}</code>. Exact handover hash{" "}
          <code>{prepared.content_hash}</code>.
        </p>
      )}
      {current && prepared && (
        <>
          <p>
            <strong>
              {eligible
                ? "Exact target matches the prepared source."
                : "Acceptance held: the current target, source readiness or editable scope does not match the prepared handover."}
            </strong>
          </p>
          <dl>
            <dt>Prepared Discovery source</dt>
            <dd>
              <code>{prepared.snapshot.basis.source_revision_id}</code>
            </dd>
            <dt>Current receiving Discovery revision</dt>
            <dd>
              <code>{current.current.source.current_revision_id}</code> ·
              workspace version {current.current.source.workspace_version} ·{" "}
              {current.current.source.scope_readiness} ·{" "}
              {current.current.source.selected
                ? "Selected alternative"
                : "Not selected"}
            </dd>
            <dt>Receiving effect</dt>
            <dd>
              Add notes from native scope revision{" "}
              {prepared.snapshot.basis.revision_number}; retain the exact scope
              hash <code>{prepared.snapshot.basis.content_hash}</code> and
              calculation edition {prepared.snapshot.basis.calculation_edition}.
            </dd>
            <dt>Captured source-context fingerprint</dt>
            <dd>
              <code>{prepared.snapshot.basis.source_context_hash}</code>
            </dd>
            <dt>Current source-context fingerprint</dt>
            <dd>
              <code>{current.current.source.current_context_hash}</code> ·{" "}
              {current.current.source.changed
                ? "Source observations changed; refresh and review again"
                : "Captured source observations still match"}
            </dd>
            <dt>Prepared production context / scenario</dt>
            <dd>
              {prepared.snapshot.production_context.tags.map(human).join(", ")}{" "}
              ·{" "}
              {human(
                prepared.snapshot.production_context.hydraulic_arrangement,
              )}{" "}
              ·{" "}
              <code>
                {prepared.snapshot.scenario_id ?? "No scenario selected"}
              </code>
            </dd>
            <dt>Existing visible notes</dt>
            <dd>
              {current.received.length} authorised associations returned
              (maximum 50).{" "}
              {previous
                ? `Most recent notes from this scope use revision ${previous.revision}.`
                : "No previous notes from this scope were returned for this exact target."}
            </dd>
          </dl>
          <div className="fn-table-scroll">
            <table aria-label="Prepared and receiving quantities">
              <thead>
                <tr>
                  <th>Scoping quantity</th>
                  <th>Previous accepted notes from this scope</th>
                  <th>Prepared notes</th>
                  <th>Difference in notes</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    "represented_area",
                    "connected_flow",
                    "operating_peak",
                  ] as const
                ).map((key) => {
                  const before = previous?.quantities[key],
                    after = prepared.snapshot.quantities[key];
                  const delta =
                    before?.state === "known" &&
                    after.state === "known" &&
                    before.value !== null &&
                    after.value !== null &&
                    before.unit === after.unit
                      ? `${(after.value - before.value).toLocaleString("en-AU")} ${after.unit}`
                      : "Not calculated — no comparable known values";
                  return (
                    <tr key={key}>
                      <th scope="row">{human(key)}</th>
                      <td>{before ? display(before) : "No prior notes"}</td>
                      <td>{display(after)}</td>
                      <td>{delta}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p>
            These are differences between recorded scoping quantities, not
            additional plant capacity or billable quantities. Manual costing
            requires its own explicit adoption and review. No estimate is
            repriced.
          </p>
          <details>
            <summary>
              {prepared.snapshot.open_findings.length} prepared findings and{" "}
              {prepared.snapshot.actions.length} responsibilities
            </summary>
            <ul>
              {prepared.snapshot.open_findings.map((f) => (
                <li key={f.id}>
                  {human(f.severity)} · {human(f.field)}: {f.message}
                </li>
              ))}
              {prepared.snapshot.actions.map((a) => (
                <li key={a.id}>
                  {a.label} · {a.owner || "Owner unknown"} · {human(a.status)}
                </li>
              ))}
            </ul>
          </details>
          <ul>
            {prepared.snapshot.limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </>
      )}
      <button
        type="button"
        disabled={blocked || busy || accepted || !eligible}
        onClick={() => {
          if (current && prepared && eligible)
            onAccept({
              expected_version: current.current.scope.version,
              prepared_id: prepared.id,
              expected_workspace_version:
                current.current.source.workspace_version,
              receiving_revision_id: current.current.source.current_revision_id,
            });
        }}
      >
        Accept prepared notes in Discovery
      </button>
      {!current && (
        <p>
          Review the current receiving effect before acceptance. The server
          checks the captured versions again when accepting.
        </p>
      )}
    </section>
  );
}
