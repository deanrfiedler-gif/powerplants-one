import assert from "node:assert/strict";
import { test } from "node:test";
import { compareOperatingScenarios } from "../../src/estimating/fertigation/scenario-comparison";
import { scenarioComparisonScope } from "../helpers/fertigation-scenarios";
import { validateScope } from "../../src/estimating/fertigation/validation";
test("FN-T07/T18 scenario alternatives retain shared inputs, explicit conflicts and unknown storage without changing saved selection", () => {
  const p = validateScope(scenarioComparisonScope()),
    before = structuredClone(p);
  const [a, b] = compareOperatingScenarios(
    p,
    p.scenarios.map((s) => s.id),
  );
  assert.equal(a.calculation.operating_peak_m3h.value, 2);
  assert.equal(b.calculation.operating_peak_m3h.value, 3);
  assert.equal(a.calculation.schedule.cycle_seconds.value, 600);
  assert.equal(b.calculation.schedule.cycle_seconds.value, 1200);
  assert.equal(a.calculation.storage.final_m3.state, "known");
  assert.equal(b.calculation.storage.final_m3.state, "unknown");
  assert.ok(
    b.calculation.findings.some(
      (f) => f.id.startsWith("cycle_overlap:") && f.severity === "conflict",
    ),
  );
  assert.deepEqual(p, before);
  assert.throws(
    () => compareOperatingScenarios(p, [p.scenarios[0].id, p.scenarios[0].id]),
    /different/,
  );
  assert.throws(
    () => compareOperatingScenarios(p, [p.scenarios[0].id, "missing"]),
    /no longer/,
  );
});
