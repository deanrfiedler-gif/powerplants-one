import assert from "node:assert/strict";
import { test } from "node:test";
import { policyImpactReasons } from "../../src/scheduling/policy-impact-model";
const rule = {
  effective_from: "2031-09-22T01:00:00Z",
  effective_to: "2032-01-02T00:00:00Z",
  max_visit_minutes: 60,
};
test("duration equality fits; even a one-second excess requires review", () => {
  assert.deepEqual(
    policyImpactReasons("2031-09-22T01:00:00Z", "2031-09-22T02:00:00Z", rule),
    [],
  );
  assert.deepEqual(
    policyImpactReasons("2031-09-22T01:00:00Z", "2031-09-22T02:00:01Z", rule),
    ["DurationLimitExceeded"],
  );
});
test("effective time is half-open and crossing visits retain both reasons", () => {
  assert.deepEqual(
    policyImpactReasons("2031-09-21T23:00:00Z", "2031-09-22T01:00:00Z", rule),
    [],
  );
  assert.deepEqual(
    policyImpactReasons("2031-09-22T00:30:00Z", "2031-09-22T01:30:00Z", rule),
    ["CrossesEffectiveDate"],
  );
  assert.deepEqual(
    policyImpactReasons("2031-09-22T00:00:00Z", "2031-09-22T02:00:00Z", rule),
    ["CrossesEffectiveDate", "DurationLimitExceeded"],
  );
  assert.deepEqual(
    policyImpactReasons("2032-01-02T00:00:00Z", "2032-01-02T03:00:00Z", rule),
    [],
  );
});
test("comparison uses UTC instants across offsets and does not mutate inputs", () => {
  const original = { ...rule };
  assert.deepEqual(
    policyImpactReasons(
      "2031-09-22T11:00:00+10:00",
      "2031-09-22T12:00:00+10:00",
      rule,
    ),
    [],
  );
  assert.deepEqual(rule, original);
});
