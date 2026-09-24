import assert from "node:assert/strict";
import { test } from "node:test";
import { calculate } from "../../src/estimating/fertigation/engine";
import { capacityRows } from "../../src/estimating/fertigation/guidance";
import { boardReferenceScope } from "../helpers/fertigation-board-scope";

const round = (v: number | null, dp = 1) =>
  v === null ? null : Math.round(v * 10 ** dp) / 10 ** dp;

test("FN-T117 the board reference scope reproduces the retained design board's headline figures in the native engine", () => {
  const scope = boardReferenceScope();
  const calc = calculate(scope);
  // Figures as drawn on the board (retained captures r01).
  assert.equal(calc.connected_flow_m3h.value, 44);
  assert.equal(calc.operating_peak_m3h.value, 28);
  assert.equal(calc.area_m2.value, 30000);
  assert.equal(calc.containers.value, 11000);
  assert.equal(calc.daily_demand_m3.value, 33);
  assert.equal(round(calc.hydraulic.required_head_m.value), 39.4);
  assert.equal(round(calc.hydraulic.curve_head_m.value), 45.4);
  assert.equal(round(calc.hydraulic.margin_m.value), 6);
  const rows = new Map(
    capacityRows(scope, calc).map((r) => [r.key.split(":")[0], r]),
  );
  const percent = (key: string) =>
    Math.round((rows.get(key)?.ratio ?? NaN) * 100);
  assert.equal(rows.get("supply")?.state, "storage");
  assert.equal(percent("supply"), 156);
  assert.equal(percent("filter"), 80);
  assert.equal(percent("pump_head"), 87);
  const injection = capacityRows(scope, calc).filter((r) =>
    r.key.startsWith("injection:"),
  );
  assert.deepEqual(
    injection.map((r) => [r.state, Math.round(r.ratio! * 100)]),
    [
      ["over", 112],
      ["within", 64],
    ],
  );
  // Channel A over its entered range is a candidate failure, not a finding.
  assert.ok(calc.candidates.some((c) => c.status === "outside_entered_limits"));
  assert.ok(!calc.findings.some((f) => /injection/.test(f.id)));
});
