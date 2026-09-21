import assert from "node:assert/strict";
import { test } from "node:test";
import {
  requirementOutcome,
  sourceEvidenceValid,
  residualAllowed,
  projectClosureGates,
  sameUnits,
} from "../../src/projects/acceptance/policy";
import { parseCommand } from "../../src/projects/acceptance/validation";
import {
  labelTone,
  type Requirement,
  type Obligation,
  type Unit,
} from "../../src/projects/acceptance/model";
import { randomUUID } from "node:crypto";
test("PJ09-15/16: source absence and mandatory applicability never pass", () => {
  for (const availability of [
    "Unavailable",
    "Restricted",
    "Not checked",
    "Changed",
  ])
    assert.equal(
      requirementOutcome({
        mandatory: true,
        applicability_reference: null,
        source: { availability, outcome: "Satisfied" },
      } as Requirement),
      "Cannot assess",
    );
  assert.equal(
    requirementOutcome({
      mandatory: true,
      applicability_reference: "SYN approval",
      source: { availability: "Current", outcome: "Not required" },
    } as Requirement),
    "Outstanding",
  );
  assert.equal(
    requirementOutcome({
      mandatory: false,
      applicability_reference: "SYN approval",
      source: { availability: "Current", outcome: "Not required" },
    } as Requirement),
    "Not required",
  );
});
test("PJ09-22/24: training, tests and backups remain separate named evidence", () => {
  assert.equal(
    sourceEvidenceValid("Training", {
      evidence: "SYN planned",
      planned_on: "2026-09-21",
    }),
    false,
  );
  assert.equal(
    sourceEvidenceValid("Training", {
      evidence: "SYN delivered",
      delivered_on: "2026-09-21",
      attendance: "SYN signed",
    }),
    false,
  );
  assert.equal(
    sourceEvidenceValid("Backup", {
      evidence: "SYN backup",
      backup_available: true,
      identity_verified: true,
      restore_verified: false,
    }),
    false,
  );
  assert.equal(
    sourceEvidenceValid("Technical", {
      evidence: "SYN tests pass",
      tests_accepted: 12,
      tests_required: 12,
    }),
    false,
  );
  assert.equal(
    sourceEvidenceValid("Technical", {
      evidence: "SYN tests and release",
      tests_accepted: 12,
      tests_required: 12,
      release: "SYN exact r01",
    }),
    true,
  );
});
test("PJ09-20/21: residual work needs independent accepted responsibility, conditions and evidence meaning", () => {
  const o = {
    state: "Outstanding",
    eligible: true,
    transfer_accepted: true,
    conditions: "SYN agreed",
    control_reference: "SYN CP01",
    due_basis: "Agreed date needed; weekly review",
    required_evidence: "SYN photo",
    review_rule: "Weekly escalation",
    owner_id: "a",
    recipient_id: "b",
  } as Obligation;
  assert.equal(residualAllowed(o), true);
  for (const key of [
    "eligible",
    "transfer_accepted",
    "conditions",
    "control_reference",
    "due_basis",
    "required_evidence",
    "review_rule",
  ])
    assert.equal(residualAllowed({ ...o, [key]: false }), false, key);
  assert.equal(residualAllowed({ ...o, recipient_id: "a" }), false);
});
test("PJ09-13/36: a filtered or empty stage view cannot hide unallocated scope", () => {
  assert.match(
    projectClosureGates(
      [{ id: "required", title: "Shared pump", required: true } as Unit],
      [],
      [],
    ).join(" "),
    /unallocated/,
  );
  assert.equal(sameUnits(["one"], ["one", "two"]), false);
  assert.equal(sameUnits(["two", "one"], ["one", "two"]), true);
});
test("PJ09-09/47: strict commands reject actor injection and duplicate response scope", () => {
  const body = {
    operation_id: randomUUID(),
    schema_version: 1,
    reason: "SYN test",
    action: "submit",
    project_id: randomUUID(),
    stage_id: randomUUID(),
    expected_version: 1,
    fields: {},
  };
  assert.throws(() => parseCommand({ ...body, actor_id: randomUUID() }));
  assert.throws(() => parseCommand({ ...body, fields: { approved: true } }));
});
test("PJ09-05: pending states have neutral icons; named accepted evidence has green", () => {
  for (const label of ["Not requested", "Not assessed", "Not prepared"])
    assert.equal(labelTone(label), "neutral");
  assert.equal(labelTone("12 / 12 accepted"), "success");
  assert.equal(labelTone("11 / 12 accepted"), "neutral");
  assert.equal(labelTone("Release pending"), "caution");
  assert.equal(labelTone("Blocked"), "failure");
});
