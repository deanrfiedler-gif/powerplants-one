import assert from "node:assert/strict";
import { test } from "node:test";
import { plannerHeld, plannerHoldReasons } from "../../src/scheduling/planner-attention";
const held = { id: "synthetic", status: "Confirmed", dispatch_hold: true };
test("a bare dispatch hold never invents a cause or release date", () => {
  assert.equal(plannerHeld(held), true);
  assert.deepEqual(plannerHoldReasons(held), ["On hold — a reason is not available in this read."]);
});
test("gate reasons are retained verbatim and a fresh cleared gate removes the row", () => {
  const reasons = ["Parts: Unknown", "Customer site readiness: Blocked", "A current applicable issued pack is required."];
  assert.deepEqual(plannerHoldReasons({ ...held, dispatch_readiness: { dispatch_hold: true, reasons } }), reasons);
  assert.equal(plannerHeld({ ...held, dispatch_readiness: { dispatch_hold: false, reasons: [] } }), false);
});
test("closed or started work is never presented as waiting for dispatch", () => {
  for (const status of ["InProgress", "CompletedPendingReview", "Completed", "Cancelled"])
    assert.equal(plannerHeld({ ...held, status }), false);
  assert.equal(plannerHeld({ ...held, actual_start_at: "2031-09-22T00:00:00Z" }), false);
});
test("a policy hold remains visible even when the stored boolean is false", () => {
  assert.equal(plannerHeld({ ...held, dispatch_hold: false, policy_impacts: [{ held: true }] }), true);
  assert.deepEqual(plannerHoldReasons({ ...held, dispatch_hold: false }), []);
});
