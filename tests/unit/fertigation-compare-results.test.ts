import assert from "node:assert/strict";
import { test } from "node:test";
import { calculate } from "../../src/estimating/fertigation/engine";
import {
  candidateStatusChanges,
  findingChanges,
  resultChanges,
} from "../../src/estimating/fertigation/compare-results";
import { scenarioComparisonScope } from "../helpers/fertigation-scenarios";

test("FN-T102 result changes report value and state changes from the two engine outputs", () => {
  const before = scenarioComparisonScope();
  const after = structuredClone(before);
  after.valves[0].design_flow_m3h = 4;
  const a = calculate(before),
    b = calculate(after);
  const changes = resultChanges(a, b);
  const connected = changes.find((c) => c.key === "connected_flow")!;
  assert.equal(connected.before, a.connected_flow_m3h);
  assert.equal(connected.after, b.connected_flow_m3h);
  assert.equal(
    connected.difference,
    b.connected_flow_m3h.value! - a.connected_flow_m3h.value!,
  );
  assert.equal(connected.changed, true);
  const same = resultChanges(a, a);
  assert.ok(same.every((c) => !c.changed && !c.stateChanged));
  const unknown = structuredClone(after);
  unknown.valves[0].design_flow_m3h = null;
  const u = resultChanges(a, calculate(unknown)).find(
    (c) => c.key === "connected_flow",
  )!;
  assert.equal(u.difference, null);
  assert.equal(u.stateChanged, true);
});

test("FN-T103 finding changes match findings by stable id: code, record and field", () => {
  const before = scenarioComparisonScope();
  const after = structuredClone(before);
  after.selected_scenario_id = null;
  const a = calculate(before),
    b = calculate(after);
  const delta = findingChanges(a, b);
  assert.ok(delta.added.some((f) => f.id.startsWith("scenario_missing:")));
  assert.equal(delta.unchanged + delta.added.length, b.findings.length);
  assert.equal(delta.unchanged + delta.resolved.length, a.findings.length);
  assert.deepEqual(findingChanges(a, a), {
    resolved: [],
    added: [],
    unchanged: a.findings.length,
  });
  assert.deepEqual(candidateStatusChanges(a, a), []);
});
