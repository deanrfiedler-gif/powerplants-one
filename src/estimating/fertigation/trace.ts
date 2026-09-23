import type { Calculation, Result, Scope } from "./types";

/**
 * Calculation traces for the native workbench (matrix UI-09).
 *
 * A trace restates, from the scope and the calculation already on screen, how
 * one PPO-FERT-NATIVE-CALC-r01 result was formed. It never recomputes the
 * result: the value shown is the engine's own, and the rule text mirrors the
 * engine's inequality or formula. The unit tests hold each trace to the
 * engine's value.
 */

export type TraceKey =
  | "required_head"
  | "curve_head"
  | "margin"
  | "operating_peak"
  | "connected_flow";

export interface TraceInput {
  label: string;
  value: string;
  basis: string;
  view: "water" | "growing" | "operating";
  missing?: boolean;
}

export interface Trace {
  key: TraceKey;
  title: string;
  result: Result;
  rule: string[];
  inputs: TraceInput[];
  total?: { label: string; value: string };
  notes: string[];
  evidence: string;
  usedBy: { label: string; view: string }[];
}

export const traceKeys: TraceKey[] = [
  "required_head",
  "curve_head",
  "margin",
  "operating_peak",
  "connected_flow",
];

/** Water density and gravity exactly as the engine converts pressure to head. */
export const PRESSURE_HEAD_M_PER_BAR = 100000 / (998.2 * 9.80665);

const known = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);
const n = (v: number | null | undefined, unit: string, digits = 1) =>
  known(v)
    ? `${v.toLocaleString("en-AU", {
        minimumFractionDigits: Number.isInteger(v) ? 0 : digits,
        maximumFractionDigits: digits,
      })} ${unit}`
    : "Not recorded";

const showResult = (r: Result) =>
  r.state === "known" && known(r.value)
    ? n(r.value, r.unit)
    : r.state.replaceAll("_", " ");

function curveBracket(scope: Scope, flow: number | null) {
  const points = scope.hydraulics.curve_points;
  if (!known(flow) || !points.length) return null;
  const exact = points.find((p) => p.flow_m3h === flow);
  if (exact) return { low: exact, high: exact };
  for (let i = 1; i < points.length; i++)
    if (flow < points[i].flow_m3h && flow > points[i - 1].flow_m3h)
      return { low: points[i - 1], high: points[i] };
  return null;
}

export function buildTrace(
  scope: Scope,
  calc: Calculation,
  key: TraceKey,
): Trace {
  const h = scope.hydraulics;
  const hydraulicEvidence = h.curve_evidence_id
    ? `Curve evidence: ${scope.evidence.find((e) => e.id === h.curve_evidence_id)?.label ?? "linked reference"}. Loss and pressure inputs carry no separate evidence field.`
    : "No curve evidence is linked. Loss and pressure inputs carry no separate evidence field, so this result is no stronger than an assumption.";
  const pumpPeak = calc.pump_peak_m3h.value;
  const scenario = scope.scenarios.find(
    (s) => s.id === scope.selected_scenario_id,
  );
  const groupRows = calc.group_flows.map((g) => {
    const group = scope.groups.find((x) => x.id === g.id);
    return { group, flows: g };
  });

  if (key === "required_head") {
    const pressureHead = known(h.outlet_pressure_bar)
      ? h.outlet_pressure_bar * PRESSURE_HEAD_M_PER_BAR
      : null;
    const basis = known(h.head_basis_flow_m3h)
      ? `Entered at ${n(h.head_basis_flow_m3h, "m³/h")}`
      : "Flow basis not recorded";
    return {
      key,
      title: "Required head at pump duty",
      result: calc.hydraulic.required_head_m,
      rule: [
        "Required head = static lift + pipe + filter + unit + other losses + outlet pressure head",
        "Outlet pressure head = pressure (bar) × 100,000 ÷ (998.2 kg/m³ × 9.80665 m/s²)",
      ],
      inputs: [
        {
          label: "Static lift",
          value: n(h.static_head_m, "m"),
          basis: "Shed to limiting outlet",
          view: "water",
          missing: !known(h.static_head_m),
        },
        {
          label: "Pipe losses",
          value: n(h.pipe_loss_m, "m"),
          basis,
          view: "water",
          missing: !known(h.pipe_loss_m),
        },
        {
          label: "Filter losses",
          value: n(h.filter_loss_m, "m"),
          basis,
          view: "water",
          missing: !known(h.filter_loss_m),
        },
        {
          label: "Fertigation unit losses",
          value: n(h.unit_loss_m, "m"),
          basis,
          view: "water",
          missing: !known(h.unit_loss_m),
        },
        {
          label: "Other losses",
          value: n(h.other_loss_m, "m"),
          basis,
          view: "water",
          missing: !known(h.other_loss_m),
        },
        {
          label: `Outlet pressure ${n(h.outlet_pressure_bar, "bar")}`,
          value: n(pressureHead, "m"),
          basis: "Limiting outlet",
          view: "water",
          missing: !known(h.outlet_pressure_bar),
        },
      ],
      total: {
        label: "Required head",
        value: showResult(calc.hydraulic.required_head_m),
      },
      notes: [calc.hydraulic.required_head_m.reason],
      evidence: hydraulicEvidence,
      usedBy: [
        { label: "Pump margin at duty", view: "water" },
        { label: "Capacity headroom · pump head", view: "overview" },
      ],
    };
  }

  if (key === "curve_head") {
    const bracket = curveBracket(scope, pumpPeak);
    return {
      key,
      title: "Pump curve head at peak duty",
      result: calc.hydraulic.curve_head_m,
      rule: [
        "Curve head = linear interpolation between the two entered curve points either side of the pump peak",
        "No value is extrapolated beyond the first or last entered point",
      ],
      inputs: [
        {
          label: "Pump peak flow",
          value: showResult(calc.pump_peak_m3h),
          basis: "Largest pump-path group flow in the scenario",
          view: "operating",
          missing: calc.pump_peak_m3h.state !== "known",
        },
        ...(bracket
          ? [
              {
                label: "Curve point below",
                value: `${n(bracket.low.head_m, "m")} at ${n(bracket.low.flow_m3h, "m³/h")}`,
                basis: h.pump_model || "Pump not recorded",
                view: "water" as const,
              },
              {
                label: "Curve point above",
                value: `${n(bracket.high.head_m, "m")} at ${n(bracket.high.flow_m3h, "m³/h")}`,
                basis: `${h.curve_points.length} entered points`,
                view: "water" as const,
              },
            ]
          : [
              {
                label: "Entered curve",
                value: `${h.curve_points.length} points`,
                basis: "Peak outside the entered range, or peak not known",
                view: "water" as const,
                missing: true,
              },
            ]),
      ],
      total: {
        label: "Curve head",
        value: showResult(calc.hydraulic.curve_head_m),
      },
      notes: [calc.hydraulic.curve_head_m.reason],
      evidence: hydraulicEvidence,
      usedBy: [{ label: "Pump margin at duty", view: "water" }],
    };
  }

  if (key === "margin") {
    const matching = known(pumpPeak) && h.head_basis_flow_m3h === pumpPeak;
    return {
      key,
      title: "Pump margin at duty",
      result: calc.hydraulic.margin_m,
      rule: [
        "Margin = curve head at pump peak − required head",
        "Compared only when the flow at which losses were entered equals the pump peak exactly",
      ],
      inputs: [
        {
          label: "Curve head",
          value: showResult(calc.hydraulic.curve_head_m),
          basis: "At the pump peak",
          view: "water",
          missing: calc.hydraulic.curve_head_m.state !== "known",
        },
        {
          label: "Required head",
          value: showResult(calc.hydraulic.required_head_m),
          basis: "From entered losses and pressure",
          view: "water",
          missing: calc.hydraulic.required_head_m.state !== "known",
        },
        {
          label: "Loss-flow basis against pump peak",
          value: `${n(h.head_basis_flow_m3h, "m³/h")} · ${showResult(calc.pump_peak_m3h)}`,
          basis: matching
            ? "Equal, so the margin is compared"
            : "Not equal, so the margin is withheld",
          view: "water",
          missing: !matching,
        },
      ],
      total: { label: "Margin", value: showResult(calc.hydraulic.margin_m) },
      notes: [calc.hydraulic.margin_m.reason],
      evidence: hydraulicEvidence,
      usedBy: [{ label: "Capacity headroom · pump head", view: "overview" }],
    };
  }

  if (key === "operating_peak") {
    return {
      key,
      title: "Operating peak",
      result: calc.operating_peak_m3h,
      rule: [
        "Operating peak = the largest dosing-unit flow of any group in the selected scenario",
        "Group unit flow = sum of its distinct physical valve flows, plus other flow declared through the unit",
      ],
      inputs: groupRows.map(({ group, flows }) => ({
        label: group?.label ?? "Group",
        value: showResult(flows.unit),
        basis: `Crop ${showResult(flows.crop)} · pump path ${showResult(flows.pump)}`,
        view: "operating" as const,
        missing: flows.unit.state !== "known",
      })),
      total: {
        label: "Operating peak",
        value: showResult(calc.operating_peak_m3h),
      },
      notes: [
        scenario ? `Scenario: ${scenario.label}` : "No scenario is selected.",
        calc.operating_peak_m3h.reason,
      ].filter(Boolean),
      evidence:
        "Valve flows carry their own basis: emitter inventory, measured or design allowance.",
      usedBy: [
        { label: "Customer report · recorded scope results", view: "review" },
        { label: "Scoping handover quantities", view: "review" },
        { label: "Capacity headroom", view: "overview" },
      ],
    };
  }

  const valves = calc.valve_flows.map((v) => {
    const valve = scope.valves.find((x) => x.id === v.id);
    return {
      label: valve?.label ?? "Valve",
      value: showResult(v.flow),
      basis: valve ? valve.flow_basis.replaceAll("_", " ") : "",
      view: "growing" as const,
      missing: v.flow.state !== "known",
    };
  });
  return {
    key: "connected_flow",
    title: "Connected flow",
    result: calc.connected_flow_m3h,
    rule: [
      "Connected flow = sum of every active physical valve flow, as if all were open at once",
    ],
    inputs: valves,
    total: {
      label: "Connected flow",
      value: showResult(calc.connected_flow_m3h),
    },
    notes: [calc.connected_flow_m3h.reason],
    evidence:
      "Valve flows carry their own basis: emitter inventory, measured or design allowance.",
    usedBy: [
      { label: "Customer report · recorded scope results", view: "review" },
      { label: "Scoping handover quantities", view: "review" },
    ],
  };
}
