import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculate,
  interpolateCurve,
} from "../../src/estimating/fertigation/engine";
import {
  buildTrace,
  PRESSURE_HEAD_M_PER_BAR,
  traceKeys,
} from "../../src/estimating/fertigation/trace";
import { scenarioComparisonScope } from "../helpers/fertigation-scenarios";

function hydraulicScope(matchBasis: boolean) {
  const scope = scenarioComparisonScope();
  const peak = calculate(scope).pump_peak_m3h.value!;
  scope.hydraulics = {
    ...scope.hydraulics,
    outlet_pressure_bar: 2,
    static_head_m: 6,
    pipe_loss_m: 5,
    filter_loss_m: 4,
    unit_loss_m: 4,
    other_loss_m: 0,
    head_basis_flow_m3h: matchBasis ? peak : peak + 1,
    curve_points: [0, 1, 2, 4, 8].map((flow, i) => ({
      flow_m3h: flow,
      head_m: 58 - i * 4,
      efficiency_percent: null,
      power_kw: null,
    })),
  };
  return scope;
}

test("FN-T89 each trace restates the engine's own result and never recomputes it", () => {
  const scope = hydraulicScope(true),
    calc = calculate(scope);
  for (const key of traceKeys) {
    const trace = buildTrace(scope, calc, key);
    const engine =
      key === "required_head"
        ? calc.hydraulic.required_head_m
        : key === "curve_head"
          ? calc.hydraulic.curve_head_m
          : key === "margin"
            ? calc.hydraulic.margin_m
            : key === "operating_peak"
              ? calc.operating_peak_m3h
              : calc.connected_flow_m3h;
    assert.equal(trace.result, engine, key);
    assert.ok(trace.rule.length > 0 && trace.inputs.length > 0, key);
  }
});

test("FN-T90 required-head inputs add up to the engine value using its pressure conversion", () => {
  const scope = hydraulicScope(true),
    calc = calculate(scope),
    h = scope.hydraulics;
  const sum =
    h.static_head_m! +
    h.pipe_loss_m! +
    h.filter_loss_m! +
    h.unit_loss_m! +
    h.other_loss_m! +
    h.outlet_pressure_bar! * PRESSURE_HEAD_M_PER_BAR;
  assert.ok(
    Math.abs(sum - calc.hydraulic.required_head_m.value!) < 1e-9,
    `${sum} vs ${calc.hydraulic.required_head_m.value}`,
  );
  const trace = buildTrace(scope, calc, "required_head");
  assert.equal(trace.inputs.length, 6);
  assert.match(trace.total!.value, /^39\.4 m$/);
});

test("FN-T91 the curve trace brackets the pump peak with the points the engine interpolates", () => {
  const scope = hydraulicScope(true),
    calc = calculate(scope);
  const peak = calc.pump_peak_m3h.value!;
  const trace = buildTrace(scope, calc, "curve_head");
  const below = trace.inputs.find((i) => i.label === "Curve point below");
  const above = trace.inputs.find((i) => i.label === "Curve point above");
  assert.ok(below && above, "bracketing points shown");
  assert.equal(
    calc.hydraulic.curve_head_m.value,
    interpolateCurve(scope.hydraulics.curve_points, peak),
  );
});

test("FN-T92 the margin trace says why a margin is withheld when the loss basis differs from the peak", () => {
  const matched = hydraulicScope(true);
  const shown = buildTrace(matched, calculate(matched), "margin");
  assert.equal(shown.result.state, "known");
  assert.match(shown.inputs.at(-1)!.basis, /Equal, so the margin is compared/);
  const differing = hydraulicScope(false);
  const withheld = buildTrace(differing, calculate(differing), "margin");
  assert.notEqual(withheld.result.state, "known");
  assert.equal(withheld.inputs.at(-1)!.missing, true);
  assert.match(withheld.inputs.at(-1)!.basis, /withheld/);
});

test("FN-T93 flow traces list every group or valve the engine summed", () => {
  const scope = hydraulicScope(true),
    calc = calculate(scope);
  assert.equal(
    buildTrace(scope, calc, "operating_peak").inputs.length,
    calc.group_flows.length,
  );
  assert.equal(
    buildTrace(scope, calc, "connected_flow").inputs.length,
    calc.valve_flows.length,
  );
});
