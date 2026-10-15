import assert from "node:assert/strict";
import { test } from "node:test";
import { packAppointmentApplicable } from "../../src/documents/context";

// G1/SVC-5 (audit 15 October 2026): distribution checked a "Started" state that does not exist,
// so a pack whose appointment native attendance had moved to InProgress could not be distributed
// although the DK-03 read called it applicable. One predicate now serves the pack read, the output
// read and distribution, and matches ck_appointments_state and the 0007 database guard.
test("an issued pack applies while its appointment is Confirmed or InProgress, and in no other state", () => {
  const states = ["Proposed", "Confirmed", "InProgress", "CompletedPendingReview", "Completed", "Cancelled", "Started"];
  assert.deepEqual(states.filter(packAppointmentApplicable), ["Confirmed", "InProgress"]);
});
