import assert from "node:assert/strict";
import { test } from "node:test";
import { inIncidentView, incidentTime } from "../../src/incidents/presentation";
import { incidentRow } from "../helpers/incident-design-fixture";

test("FI-06 views keep hold, task completion and independent closure separate", () => {
  assert.equal(inIncidentView(incidentRow, "triage"), true);
  for (const state of [
    "Submitted",
    "InReview",
    "Returned",
    "ClarificationRequired",
    "OnHold",
    "Accepted",
  ])
    assert.equal(inIncidentView({ ...incidentRow, state }, "holding"), true);
  assert.equal(
    inIncidentView({ ...incidentRow, state: "Closed", hold: false }, "holding"),
    false,
  );
  const accepted = { ...incidentRow, state: "Accepted", actions_open: 0 };
  assert.equal(inIncidentView(accepted, "close"), true);
  for (const changed of [
    { source_current: false },
    { actions_open: 1 },
    { state: "InReview" },
    { actions: 0 },
  ])
    assert.equal(inIncidentView({ ...accepted, ...changed }, "close"), false);
  assert.equal(
    inIncidentView({ ...incidentRow, state: "Closed" }, "actions"),
    false,
  );
  assert.equal(
    inIncidentView(
      { ...incidentRow, state: "ClarificationRequired" },
      "returned",
    ),
    true,
  );
});

test("FI-06 displays the occurrence in site time, including daylight saving", () => {
  const utc = "2026-10-12T00:35:00Z";
  assert.match(incidentTime(utc, "Australia/Brisbane"), /10:35/);
  assert.match(incidentTime(utc, "Australia/Sydney"), /11:35/);
  assert.equal(incidentTime(null), "Not recorded");
  assert.equal(utc, "2026-10-12T00:35:00Z");
});
