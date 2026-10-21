import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appointmentActions,
  appointmentChecks,
  appointmentDispatch,
} from "../../src/scheduling/appointment-presentation";
import {
  appointmentFixture,
  appointmentPackFixture,
} from "../helpers/appointment-detail-fixture";

test("SV04 never treats missing, denied or stale pack reads as a dispatch pass", () => {
  const a = appointmentFixture(),
    p = appointmentPackFixture();
  a.dispatch_hold = false;
  p.readiness = {
    ...p.readiness,
    dispatch_hold: false,
    component_ready: true,
    reasons: [],
  };
  assert.equal(appointmentDispatch(a, p, true).title, "Ready to dispatch");
  assert.match(
    appointmentDispatch(a, p, true).detail,
    /site readiness is not included/,
  );
  assert.equal(
    appointmentDispatch(a, null, true).title,
    "Readiness unavailable",
  );
  assert.equal(appointmentDispatch(a, p, false).title, "Readiness unavailable");
  assert.deepEqual(appointmentActions(a, false), {
    contact: false,
    manage: false,
    request: false,
  });
  a.dispatch_hold = true;
  assert.equal(appointmentDispatch(a, p, true).title, "Dispatch held");
  a.dispatch_hold = false;
  p.readiness.component_ready = false;
  assert.equal(appointmentDispatch(a, p, true).title, "Dispatch held");
});
test("SV04 preserves derived exceptions and unknown Parts; P4 is never fabricated from date agreement", () => {
  const a = appointmentFixture();
  assert.equal(appointmentChecks(a)[1].outcome, "Not available");
  assert.equal(appointmentChecks(a)[1].gated, true);
  a.readiness[0].outcome = "PermittedException";
  assert.equal(appointmentChecks(a)[0].outcome, "PermittedException");
  a.readiness = [];
  assert.equal(appointmentChecks(a)[0].outcome, "Unavailable");
  assert.equal(appointmentChecks(a)[2].outcome, "Unknown");
});
test("SV04 proposed reserves no crew; closed visits expose no editing actions", () => {
  const a = appointmentFixture(),
    p = appointmentPackFixture();
  a.status = "Proposed";
  assert.equal(appointmentDispatch(a, p, true).title, "Not confirmed yet");
  for (const status of ["Cancelled", "Completed", "CompletedPendingReview"]) {
    a.status = status;
    assert.deepEqual(appointmentActions(a, true), {
      contact: false,
      manage: false,
      request: false,
    });
  }
  a.status = "Cancelled";
  assert(appointmentChecks(a).every((c) => c.outcome === "NotApplicable"));
  a.status = "Confirmed";
  a.actual_start_at = "2026-10-13T03:30:00Z";
  assert.equal(appointmentActions(a, true).manage, false);
  assert.equal(appointmentDispatch(a, p, true).title, "Visit started");
});
