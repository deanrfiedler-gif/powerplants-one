import assert from "node:assert/strict";
import { test } from "node:test";
import { calculate } from "../../src/estimating/fertigation/engine";
import {
  candidateFailures,
  capacityRows,
  withLabels,
} from "../../src/estimating/fertigation/guidance";
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
  assert.deepEqual(
    (["conflict", "incomplete", "review"] as const).map(
      (s) => calc.findings.filter((f) => f.severity === s).length,
    ),
    [2, 0, 6],
  );
  // The headroom row says so; finding-backed rows keep "Conflict".
  assert.deepEqual(
    injection.map((r) => r.candidate),
    [true, true],
  );
  assert.ok(
    capacityRows(scope, calc)
      .filter((r) => !/^(candidate|injection):/.test(r.key))
      .every((r) => !r.candidate),
  );
  // The engine names the channel by identity; labelled, it reads once.
  const channel = scope.channels[0];
  assert.deepEqual(
    candidateFailures(scope, calc).flatMap((c) => c.failures),
    [
      "Channel A · Nutrient is outside entered injection limits; unconfirmed evidence does not cancel the failure.",
    ],
  );
  assert.ok(
    calc.candidates.some((c) =>
      c.failures.includes(
        `Channel ${channel.id} is outside entered injection limits; unconfirmed evidence does not cancel the failure.`,
      ),
    ),
    "the engine's own PPO-FERT-NATIVE-CALC-r01 text is unchanged",
  );
});

test("FN-T117 labelled engine text drops a kind word only where the label already names it", () => {
  const scope = boardReferenceScope();
  const channel = scope.channels[0],
    stock = scope.stocks[0],
    group = scope.groups.find((g) => g.label.startsWith("G1"))!;
  assert.equal(
    withLabels(scope, `Channel ${channel.id} is outside entered injection limits.`),
    "Channel A · Nutrient is outside entered injection limits.",
  );
  assert.equal(
    withLabels(scope, `Group ${group.id} is outside entered flow limits.`),
    `Group ${group.label} is outside entered flow limits.`,
  );
  assert.equal(stock.label, "Channel A · Nutrient stock");
  assert.equal(
    withLabels(scope, `required for stock ${stock.id}.`),
    "required for Channel A · Nutrient stock.",
  );
  assert.equal(
    withLabels(scope, "Channel 00000000-0000-4000-8000-000000000000 is unknown."),
    "Channel record is unknown.",
  );
});
