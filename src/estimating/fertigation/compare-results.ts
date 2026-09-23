import type { Calculation, Finding, Result } from "./types";

/**
 * Result and finding changes between two calculations (matrix UI-24).
 * Both sides are the engine's saved or previewed output; nothing is
 * recalculated here. A change of state (for example known → unknown) is
 * reported as well as a change of value.
 */

export interface ResultChange {
  key: string;
  label: string;
  before: Result;
  after: Result;
  /** after − before, only when both are known in the same unit. */
  difference: number | null;
  stateChanged: boolean;
  changed: boolean;
}

const pick: [string, string, (c: Calculation) => Result][] = [
  ["area", "Represented area", (c) => c.area_m2],
  ["containers", "Containers", (c) => c.containers],
  ["plants", "Plants", (c) => c.plants],
  ["daily_demand", "Daily crop demand", (c) => c.daily_demand_m3],
  ["connected_flow", "Connected flow", (c) => c.connected_flow_m3h],
  ["operating_peak", "Operating peak", (c) => c.operating_peak_m3h],
  ["pump_peak", "Pump peak", (c) => c.pump_peak_m3h],
  ["cycle", "Cycle length", (c) => c.schedule.cycle_seconds],
  ["required_head", "Required head", (c) => c.hydraulic.required_head_m],
  ["curve_head", "Curve head at pump peak", (c) => c.hydraulic.curve_head_m],
  ["margin", "Pump margin at duty", (c) => c.hydraulic.margin_m],
  ["storage_minimum", "Lowest stored water", (c) => c.storage.minimum_m3],
  ["storage_final", "Stored water at day end", (c) => c.storage.final_m3],
];

const same = (a: Result, b: Result) =>
  a.state === b.state && a.value === b.value && a.unit === b.unit;

export function resultChanges(
  before: Calculation,
  after: Calculation,
): ResultChange[] {
  return pick.map(([key, label, get]) => {
    const a = get(before),
      b = get(after);
    const bothKnown =
      a.state === "known" &&
      b.state === "known" &&
      a.value !== null &&
      b.value !== null &&
      a.unit === b.unit;
    return {
      key,
      label,
      before: a,
      after: b,
      difference: bothKnown ? b.value! - a.value! : null,
      stateChanged: a.state !== b.state,
      changed: !same(a, b),
    };
  });
}

export interface FindingChanges {
  resolved: Finding[];
  added: Finding[];
  unchanged: number;
}

/** Findings match by their stable id: code, record and field. */
export function findingChanges(
  before: Calculation,
  after: Calculation,
): FindingChanges {
  const a = new Map(before.findings.map((f) => [f.id, f])),
    b = new Map(after.findings.map((f) => [f.id, f]));
  return {
    resolved: [...a.values()].filter((f) => !b.has(f.id)),
    added: [...b.values()].filter((f) => !a.has(f.id)),
    unchanged: [...b.keys()].filter((id) => a.has(id)).length,
  };
}

export function candidateStatusChanges(
  before: Calculation,
  after: Calculation,
) {
  const a = new Map(before.candidates.map((c) => [c.id, c.status]));
  return after.candidates
    .filter((c) => a.has(c.id) && a.get(c.id) !== c.status)
    .map((c) => ({ id: c.id, before: a.get(c.id)!, after: c.status }));
}
