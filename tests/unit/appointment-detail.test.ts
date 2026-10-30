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
    /policy does not include customer site readiness/,
  );
  assert.equal(
    appointmentDispatch(a, null, true).title,
    "Readiness unavailable",
  );
  assert.equal(appointmentDispatch(a, p, false).title, "Readiness unavailable");
  assert.deepEqual(appointmentActions(a, false), {
    contact: false,
    readiness: false,
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
      readiness: false,
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

const confirmed = { status: "Confirmed" as const, note: "" };
function withPreparation(outcome: "Pass" | "Blocked" | "Unknown") {
  const a = appointmentFixture();
  a.preparation = {
    policy: {
      id: "p",
      reference: "SYN-PPO-PREP-01",
      version: 1,
      synthetic: true,
    },
    schedule_version: a.schedule_version,
    outcome,
    contact_id: outcome === "Unknown" ? null : "site-contact",
    opens_at: "2026-10-08T03:30:00Z",
    confirmation_due_at: "2026-10-12T03:30:00Z",
    late: false,
    issue_due_at: null,
    calendar_status: "Published lead calendar",
    issue_deadline_blocks_dispatch: false,
  };
  if (outcome !== "Unknown")
    a.contacts.unshift({
      ...a.contacts[0],
      id: "site-contact",
      purpose: "SiteReadiness",
      outcome: "Confirmed",
      site_checks: {
        access: confirmed,
        power_water: confirmed,
        equipment:
          outcome === "Blocked"
            ? { status: "NotReady", note: "Bench in the way" }
            : confirmed,
        isolation: { status: "NotApplicable", note: "" },
      },
    });
  return a;
}
test("P4 site readiness shows the server-derived outcome and is recordable only before the visit starts", () => {
  const unknown = withPreparation("Unknown");
  assert.deepEqual(
    [
      appointmentChecks(unknown)[1].outcome,
      appointmentChecks(unknown)[1].gated,
    ],
    ["Unknown", false],
  );
  assert.match(appointmentChecks(unknown)[1].detail, /Not recorded/);
  assert.equal(appointmentActions(unknown, true).readiness, true);
  assert.equal(appointmentActions(unknown, false).readiness, false);
  const pass = withPreparation("Pass");
  assert.equal(appointmentChecks(pass)[1].outcome, "Pass");
  assert.match(appointmentChecks(pass)[1].detail, /Confirmed by/);
  pass.preparation!.late = true;
  assert.match(appointmentChecks(pass)[1].detail, /late/);
  const blocked = withPreparation("Blocked");
  assert.equal(appointmentChecks(blocked)[1].outcome, "Blocked");
  assert.match(appointmentChecks(blocked)[1].detail, /1 check not ready/);
  blocked.actual_start_at = "2026-10-13T03:30:00Z";
  assert.equal(appointmentActions(blocked, true).readiness, false);
  const noContactDuty = withPreparation("Unknown");
  noContactDuty.actions.can_contact = false;
  assert.equal(appointmentActions(noContactDuty, true).readiness, false);
  const p = appointmentPackFixture();
  p.readiness = {
    ...p.readiness,
    dispatch_hold: false,
    component_ready: true,
    reasons: [],
  };
  const ready = withPreparation("Pass");
  ready.dispatch_hold = false;
  assert.match(
    appointmentDispatch(ready, p, true).detail,
    /including customer site readiness/,
  );
});

test("P4 explains an early confirmation as outside the window and keeps the no-answer wording", () => {
  // The server stores a Confirmed contact made before opens_at and derives Unknown.
  const early = withPreparation("Pass");
  early.preparation!.outcome = "Unknown";
  early.contacts[0].occurred_at = "2026-10-07T23:00:00Z";
  const detail = appointmentChecks(early)[1].detail;
  assert.match(detail, /^Outside the confirmation window/);
  assert.match(
    detail,
    /recorded before the window opened, so it does not count/,
  );
  assert.match(detail, /new confirmation .* within the current window/);
  assert.match(
    detail,
    /8 Oct 2026, 13:30 AEST \(UTC\+10\) to 12 Oct 2026, 13:30 AEST/,
  );
  assert.doesNotMatch(detail, /not a confirmation/);
  // A no answer is not a confirmation, inside the window or before it.
  const noAnswer = withPreparation("Pass");
  noAnswer.preparation!.outcome = "Unknown";
  noAnswer.contacts[0].outcome = "NoResponse";
  for (const occurred_at of ["2026-10-09T01:00:00Z", "2026-10-07T23:00:00Z"]) {
    noAnswer.contacts[0].occurred_at = occurred_at;
    assert.equal(
      appointmentChecks(noAnswer)[1].detail,
      "Not confirmed yet: the last contact was not a confirmation.",
    );
  }
});
