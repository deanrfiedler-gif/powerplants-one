import { test } from "node:test";
import assert from "node:assert/strict";
import {
  visitArrivalGuidance,
  visitPreparationGuidance,
} from "../../src/field/visit-guidance";
test("CV-03 only actual active states invite a separately authorised arrival; closure and unsupported labels fail closed", () => {
  for (const state of [
    "CompletedPendingReview",
    "Completed",
    "Cancelled",
    "Proposed",
    "Superseded",
    "ReturnRequired",
    "",
  ]) {
    assert.equal(visitArrivalGuidance(state, false).startable, false, state);
    assert.doesNotMatch(
      visitArrivalGuidance(state, false).next,
      /recording your own arrival/i,
    );
  }
  for (const state of ["Confirmed", "InProgress"]) {
    assert.equal(visitArrivalGuidance(state, false).startable, true);
    assert.match(
      visitArrivalGuidance(state, false, true).personal,
      /not your attendance/,
    );
    assert.match(
      visitArrivalGuidance(state, true, true).personal,
      /retained attendance/,
    );
  }
  assert.match(
    visitPreparationGuidance("Proposed", "Preparing", false),
    /before Scheduling accepts/,
  );
  assert.match(
    visitPreparationGuidance("Proposed", "Unknown", false),
    /incomplete/,
  );
  assert.match(
    visitPreparationGuidance("Confirmed", "Preparing", true),
    /Scope review required/,
  );
});
