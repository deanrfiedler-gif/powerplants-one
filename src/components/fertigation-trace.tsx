"use client";
import { useEffect, useRef, useState } from "react";
import { interpolateCurve } from "../estimating/fertigation/engine";
import { buildTrace, type TraceKey } from "../estimating/fertigation/trace";
import type {
  Calculation,
  Result,
  Scope,
} from "../estimating/fertigation/types";
import { FertigationDialog } from "./fertigation-fields";
import type { FertigationView } from "./fertigation-frame";

const known = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);
const fmt = (v: number, digits = 1) =>
  v.toLocaleString("en-AU", {
    minimumFractionDigits: Number.isInteger(v) ? 0 : digits,
    maximumFractionDigits: digits,
  });
const showResult = (r: Result) =>
  r.state === "known" && known(r.value)
    ? `${fmt(r.value)} ${r.unit}`
    : r.state.replaceAll("_", " ");

const related: Partial<Record<TraceKey, TraceKey[]>> = {
  required_head: ["margin", "curve_head"],
  curve_head: ["margin", "required_head"],
  margin: ["required_head", "curve_head"],
  operating_peak: ["connected_flow"],
  connected_flow: ["operating_peak"],
};

export function TraceDrawer({
  scope,
  calculation,
  traceKey,
  onTrace,
  onView,
  close,
}: {
  scope: Scope;
  calculation: Calculation;
  traceKey: TraceKey;
  onTrace: (key: TraceKey) => void;
  onView: (view: FertigationView) => void;
  close: () => void;
}) {
  const trace = buildTrace(scope, calculation, traceKey);
  const state = trace.result.state;
  return (
    <FertigationDialog
      title={`How this is calculated: ${trace.title}`}
      close={close}
    >
      <div className="fn-dialog-body fn-trace">
        <p className="fn-trace-result">
          <strong>{showResult(trace.result)}</strong>
          <span
            className={`fn-chip fn-chip-${state === "known" ? "success" : "neutral"}`}
          >
            {state === "known" ? "Known" : state.replaceAll("_", " ")}
          </span>
        </p>
        <div className="fn-trace-rule">
          {trace.rule.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <h3>Inputs</h3>
        <table>
          <tbody>
            {trace.inputs.map((input) => (
              <tr key={input.label}>
                <th scope="row">{input.label}</th>
                <td className="fn-number">
                  {input.missing ? (
                    <span className="fn-chip fn-chip-incomplete">
                      {input.value}
                    </span>
                  ) : (
                    input.value
                  )}
                </td>
                <td>
                  <small>{input.basis}</small>
                </td>
              </tr>
            ))}
          </tbody>
          {trace.total && (
            <tfoot>
              <tr>
                <th scope="row">{trace.total.label}</th>
                <td className="fn-number">{trace.total.value}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
        {trace.notes.filter(Boolean).map((note) => (
          <p key={note} className="fn-subtle">
            {note}
          </p>
        ))}
        <h3>Evidence</h3>
        <p>{trace.evidence}</p>
        <h3>Where this result is used</h3>
        <ul className="fn-trace-used">
          {trace.usedBy.map((u) => (
            <li key={u.label}>{u.label}</li>
          ))}
        </ul>
        {related[traceKey] && (
          <p className="fn-actions">
            {related[traceKey]!.map((k) => (
              <button key={k} type="button" onClick={() => onTrace(k)}>
                Trace {buildTrace(scope, calculation, k).title.toLowerCase()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                close();
                onView(trace.inputs[0]?.view ?? "water");
              }}
            >
              Open the inputs
            </button>
          </p>
        )}
        <p className="fn-subtle">
          {calculation.edition}. The value is the engine&rsquo;s own; this trace
          restates how it was formed and never recalculates it.
        </p>
      </div>
    </FertigationDialog>
  );
}

function niceStep(max: number, target = 5) {
  const raw = max / target,
    power = 10 ** Math.floor(Math.log10(raw)),
    unit = raw / power;
  return (
    (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10) *
    power
  );
}

/** Entered curve, required duty and each group's duty flow, drawn at the
 * container's real pixel width so chart text keeps its size (matrix UI-27). */
export function PumpDutyChart({
  scope,
  calculation,
}: {
  scope: Scope;
  calculation: Calculation;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(280, Math.round(entry.contentRect.width))),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const points = scope.hydraulics.curve_points.filter(
    (p) => known(p.flow_m3h) && known(p.head_m),
  );
  if (points.length < 2)
    return (
      <p className="fn-note">
        Enter at least two curve points to draw the pump curve.
      </p>
    );
  const peak = calculation.pump_peak_m3h.value,
    required = calculation.hydraulic.required_head_m.value,
    curveAtPeak = calculation.hydraulic.curve_head_m.value;
  const duties = calculation.group_flows
    .map((g) => ({
      label: scope.groups.find((x) => x.id === g.id)?.label ?? "Group",
      flow: g.pump.value,
    }))
    .filter((d): d is { label: string; flow: number } => known(d.flow));
  const xMaxRaw = Math.max(
    points.at(-1)!.flow_m3h,
    ...(known(peak) ? [peak] : []),
  );
  const yMaxRaw = Math.max(
    ...points.map((p) => p.head_m),
    ...(known(required) ? [required] : []),
  );
  const xStep = niceStep(xMaxRaw),
    yStep = niceStep(yMaxRaw);
  const xMax = Math.ceil(xMaxRaw / xStep) * xStep,
    yMax = Math.ceil(yMaxRaw / yStep) * yStep;
  const height = 296,
    left = 44,
    right = 16,
    top = 30,
    bottom = 40;
  const plotW = width - left - right,
    plotH = height - top - bottom;
  const x = (v: number) => left + (v / xMax) * plotW;
  const y = (v: number) => top + plotH - (v / yMax) * plotH;
  const xTicks = Array.from(
    { length: Math.round(xMax / xStep) + 1 },
    (_, i) => i * xStep,
  );
  const yTicks = Array.from(
    { length: Math.round(yMax / yStep) + 1 },
    (_, i) => i * yStep,
  );
  const summary = `Entered pump curve from ${fmt(points[0].flow_m3h)} to ${fmt(points.at(-1)!.flow_m3h)} m³/h.${
    known(peak) && known(required)
      ? ` Required duty ${fmt(required)} m at ${fmt(peak)} m³/h.`
      : ""
  }${known(curveAtPeak) ? ` Curve head at that flow ${fmt(curveAtPeak)} m.` : ""}`;
  return (
    <figure className="fn-chart" ref={wrap}>
      <svg width={width} height={height} role="img" aria-label={summary}>
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line
              x1={left}
              x2={width - right}
              y1={y(t)}
              y2={y(t)}
              className="fn-grid"
            />
            <text x={left - 8} y={y(t) + 4} textAnchor="end">
              {fmt(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text
            key={`x${t}`}
            x={x(t)}
            y={height - bottom + 18}
            textAnchor="middle"
          >
            {fmt(t)}
          </text>
        ))}
        <text x={left} y={height - 6} className="fn-axis-title">
          Flow (m³/h)
        </text>
        <text x={4} y={12} className="fn-axis-title">
          Head (m)
        </text>
        {duties.map((d) => (
          <g key={d.label}>
            <line
              x1={x(d.flow)}
              x2={x(d.flow)}
              y1={top}
              y2={top + plotH}
              className="fn-duty-line"
            />
            <text
              x={x(d.flow) + 4}
              y={top + plotH - 6}
              className="fn-duty-label"
            >
              {fmt(d.flow)}
            </text>
          </g>
        ))}
        {known(required) && known(peak) && (
          <line
            x1={left}
            x2={x(peak)}
            y1={y(required)}
            y2={y(required)}
            className="fn-required-line"
          />
        )}
        <polyline
          className="fn-curve"
          points={points
            .map((p) => `${x(p.flow_m3h)},${y(p.head_m)}`)
            .join(" ")}
        />
        {points.map((p) => (
          <circle
            key={p.flow_m3h}
            cx={x(p.flow_m3h)}
            cy={y(p.head_m)}
            r={3.5}
            className="fn-curve-point"
          />
        ))}
        {known(curveAtPeak) && known(peak) && (
          <circle
            cx={x(peak)}
            cy={y(curveAtPeak)}
            r={5}
            className="fn-curve-at-peak"
          />
        )}
        {known(required) && known(peak) && (
          <circle
            cx={x(peak)}
            cy={y(required)}
            r={5}
            className="fn-required-point"
          />
        )}
      </svg>
      <figcaption>
        <span>
          <span className="fn-key fn-key-curve" aria-hidden="true" />
          Entered pump curve
        </span>
        <span>
          <span className="fn-key fn-key-required" aria-hidden="true" />
          Required duty
        </span>
        <span>
          <span className="fn-key fn-key-peak" aria-hidden="true" />
          Curve head at pump peak
        </span>
        <span>
          <span className="fn-key fn-key-duty" aria-hidden="true" />
          Group duty flows
        </span>
      </figcaption>
      <table className="fn-duty-table">
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col" className="fn-number">
              Pump-path flow
            </th>
            <th scope="col" className="fn-number">
              Curve head at this flow
            </th>
            <th scope="col">Required head</th>
          </tr>
        </thead>
        <tbody>
          {duties.map((d) => {
            const curve = interpolateCurve(
              scope.hydraulics.curve_points,
              d.flow,
            );
            const basis = scope.hydraulics.head_basis_flow_m3h;
            return (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td className="fn-number">{fmt(d.flow)} m³/h</td>
                <td className="fn-number">
                  {known(curve)
                    ? `${fmt(curve)} m`
                    : "Outside the entered curve"}
                </td>
                <td>
                  {known(required) && basis === d.flow
                    ? `${fmt(required)} m`
                    : `Losses not entered at ${fmt(d.flow)} m³/h`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="fn-subtle">
        Curve heads use the engine&rsquo;s linear interpolation between entered
        points. The required duty is a requirement, not an operating point; no
        system curve is drawn.
      </p>
    </figure>
  );
}
