"use client";
import { useState } from "react";
import { compareOperatingScenarios } from "../estimating/fertigation/scenario-comparison";
import type { Result, Scope } from "../estimating/fertigation/types";
import { human } from "./fertigation-fields";

function quantity(value: number | null, unit: string) {
  return value === null
    ? "Unknown"
    : `${value.toLocaleString("en-AU")} ${unit}`;
}
function ComparisonResult({ result }: { result: Result }) {
  return (
    <>
      <strong>
        {result.state === "known"
          ? quantity(result.value, result.unit)
          : human(result.state)}
      </strong>
      <small className="fn-result-reason">{result.reason}</small>
    </>
  );
}
export function FertigationScenarios({
  proposal,
  dirty,
  revision,
  blocked,
}: {
  proposal: Scope;
  dirty: boolean;
  revision: number;
  blocked: boolean;
}) {
  const [left, setLeft] = useState(proposal.scenarios[0]?.id ?? ""),
    [right, setRight] = useState(proposal.scenarios[1]?.id ?? ""),
    [snapshot, setSnapshot] = useState<{
      proposal: Scope;
      ids: string[];
      rows: ReturnType<typeof compareOperatingScenarios>;
    } | null>(null),
    [error, setError] = useState("");
  const ids = [left, right],
    valid =
      left !== right &&
      ids.every((id) => proposal.scenarios.some((s) => s.id === id)),
    current =
      snapshot?.proposal === proposal && snapshot.ids.join() === ids.join()
        ? snapshot
        : null;
  return (
    <section className="fn-section" aria-label="Operating scenario comparison">
      <h2>Compare operating scenarios</h2>
      <p>
        Compare two alternative plans over this same physical scope. Sources,
        valves, groups, recipes and equipment are shared. The plans are
        evaluated separately; their duties are not added or treated as
        independent parallel circuits.
      </p>
      <p className="fn-note">
        {dirty
          ? "Unsaved draft comparison"
          : `Saved revision ${revision} comparison`}{" "}
        · View-only selection. Comparing does not change the scenario selected
        for review or save a revision. Manufacturer confirmation remains
        pending.
      </p>
      {proposal.scenarios.length < 2 && (
        <p>
          Add at least two scenarios in the Scenarios register above. Incomplete
          scenarios may be compared with explicit unknown outcomes.
        </p>
      )}
      <div className="fn-toolbar">
        {(["A", "B"] as const).map((label, i) => (
          <label key={label}>
            Compare scenario {label}
            <select
              value={ids[i]}
              disabled={blocked}
              onChange={(e) => {
                (i === 0 ? setLeft : setRight)(e.target.value);
                setError("");
              }}
            >
              <option value="">Choose scenario</option>
              {proposal.scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          disabled={blocked || !valid}
          onClick={() => {
            try {
              setSnapshot({
                proposal,
                ids,
                rows: compareOperatingScenarios(proposal, ids),
              });
              setError("");
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Comparison could not be calculated.",
              );
            }
          }}
        >
          Compare scenario outcomes
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {snapshot && !current && (
        <p role="status">
          Comparison inputs changed. Compare again to see current outcomes.
        </p>
      )}
      {current && (
        <>
          <p>
            Calculation edition {current.rows[0].calculation.edition}. Unknown
            values remain unknown; a known result alone is not a suitability
            decision.
          </p>
          <div className="fn-table-scroll">
            <table aria-label="Scenario outcomes">
              <thead>
                <tr>
                  <th>Outcome</th>
                  {current.rows.map((r) => (
                    <th key={r.scenario.id}>{r.scenario.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Connected flow", (c) => c.connected_flow_m3h],
                    ["Operating unit peak", (c) => c.operating_peak_m3h],
                    ["Pump peak", (c) => c.pump_peak_m3h],
                    ["Daily crop demand", (c) => c.daily_demand_m3],
                    ["Sequential cycle", (c) => c.schedule.cycle_seconds],
                    ["Final source storage", (c) => c.storage.final_m3],
                    ["Minimum source storage", (c) => c.storage.minimum_m3],
                    ["Storage overflow", (c) => c.storage.overflow_m3],
                    [
                      "Required hydraulic head",
                      (c) => c.hydraulic.required_head_m,
                    ],
                  ] satisfies [
                    string,
                    (
                      c: ReturnType<
                        typeof compareOperatingScenarios
                      >[number]["calculation"],
                    ) => Result,
                  ][]
                ).map(([label, result]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {current.rows.map((r) => (
                      <td key={r.scenario.id}>
                        <ComparisonResult result={result(r.calculation)} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Plan findings</th>
                  {current.rows.map((r) => (
                    <td key={r.scenario.id}>
                      {
                        r.calculation.findings.filter(
                          (f) => f.severity === "conflict",
                        ).length
                      }{" "}
                      conflicts;{" "}
                      {
                        r.calculation.findings.filter(
                          (f) => f.severity === "incomplete",
                        ).length
                      }{" "}
                      incomplete findings across this plan. See exact findings
                      below.
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="fn-scenario-cards">
            {current.rows.map(({ scenario, calculation }) => (
              <article
                key={scenario.id}
                aria-label={`${scenario.label} assumptions and findings`}
              >
                <h3>{scenario.label}: assumptions and findings</h3>
                <p>
                  {human(scenario.phase)} ·{" "}
                  {scenario.include_future
                    ? "Future records included"
                    : "Future records excluded"}
                </p>
                <dl>
                  <dt>Declared window / cycles</dt>
                  <dd>
                    {quantity(scenario.start_minute, "min")} to{" "}
                    {quantity(scenario.end_minute, "min")} ·{" "}
                    {quantity(scenario.cycles, "cycles")}
                  </dd>
                  <dt>Spacing</dt>
                  <dd>
                    {quantity(scenario.spacing_min, "min")} ·{" "}
                    {human(scenario.spacing_basis)}
                  </dd>
                  <dt>Supplying source</dt>
                  <dd>
                    {proposal.sources.find((s) => s.id === scenario.source_id)
                      ?.label ?? "Unknown"}
                  </dd>
                  <dt>Initial storage / refill / reserve</dt>
                  <dd>
                    {quantity(scenario.initial_storage_m3, "m³")} /{" "}
                    {quantity(scenario.refill_m3h, "m³/h")} /{" "}
                    {quantity(scenario.reserve_m3, "m³")}
                  </dd>
                  <dt>Group execution order</dt>
                  <dd>
                    {proposal.groups
                      .filter(
                        (g) =>
                          scenario.group_ids.includes(g.id) &&
                          g.phase !== "excluded" &&
                          (g.phase !== "future" || scenario.include_future),
                      )
                      .map((g) => g.label)
                      .join(" → ") || "No active group"}
                  </dd>
                  <dt>Notes</dt>
                  <dd>{scenario.notes || "None recorded"}</dd>
                  <dt>Evidence</dt>
                  <dd>
                    {scenario.evidence_ids
                      .map(
                        (id) =>
                          proposal.evidence.find((e) => e.id === id)?.label ??
                          "Unresolved reference",
                      )
                      .join("; ") || "None recorded"}
                  </dd>
                </dl>
                <details>
                  <summary>Group timing and per-allocation delivery</summary>
                  <p>
                    Group register order defines one sequential circuit; member
                    valves run together. Preparation and flush phases are
                    retained.
                  </p>
                  {proposal.groups
                    .filter((g) => scenario.group_ids.includes(g.id))
                    .map((g) => (
                      <p key={g.id}>
                        <strong>{g.label}</strong>: preparation{" "}
                        {quantity(g.prepare_seconds, "s")}, delivery{" "}
                        {quantity(g.delivery_seconds, "s")}, flush{" "}
                        {quantity(g.flush_seconds, "s")}; flush to crop{" "}
                        {human(g.flush_to_crop)}; other consumer path{" "}
                        {human(g.other_path)}.
                      </p>
                    ))}
                  <p>
                    {calculation.schedule.events.length} calculated events;{" "}
                    {calculation.coverage.length} service allocations.
                  </p>
                  {calculation.coverage.slice(0, 100).map((row) => (
                    <p key={row.allocation_id}>
                      Valve{" "}
                      {proposal.valves.find((v) => v.id === row.valve_id)
                        ?.label ?? row.valve_id}
                      : delivered <ComparisonResult result={row.delivered_m3} />
                      ; required <ComparisonResult result={row.required_m3} />
                    </p>
                  ))}
                  {calculation.coverage.length > 100 && (
                    <p>
                      First 100 allocations shown. The complete scope remains in
                      the register.
                    </p>
                  )}
                </details>
                <details>
                  <summary>
                    {calculation.findings.length} exact findings, including
                    conflicts and unknowns
                  </summary>
                  <ul>
                    {calculation.findings.map((f) => (
                      <li key={f.id}>
                        <strong>
                          {human(f.severity)} · {human(f.field)}
                        </strong>
                        : {f.message}
                      </li>
                    ))}
                  </ul>
                </details>
                <details>
                  <summary>Configured candidate outcomes</summary>
                  {calculation.candidates.length ? (
                    calculation.candidates.map((c) => (
                      <div key={c.id}>
                        <p>
                          <strong>
                            {
                              proposal.candidates.find((x) => x.id === c.id)
                                ?.label
                            }
                          </strong>
                          : {human(c.status)}
                        </p>
                        <ul>
                          {c.failures.map((f) => (
                            <li key={f}>Failed check: {f}</li>
                          ))}
                          {c.unknowns.map((u) => (
                            <li key={u}>Unresolved: {u}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <p>
                      No configured candidates; suitability is not assessed.
                    </p>
                  )}
                </details>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
