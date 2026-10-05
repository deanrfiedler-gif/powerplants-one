import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  referralInput,
  reviewInput,
  receivingInput,
} from "../../src/estimating/supply-followup/validation";
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN test",
  evidence: "SYN exact evidence",
  synthetic_only: true,
  target_id: randomUUID(),
  execution_id: randomUUID(),
  expected_sequence: 0,
  basis_hash: "a".repeat(64),
});
test("Reservation reconciliation has closed evidence fields while original review canonical payload stays unchanged", () => {
  const id = randomUUID(),
    r = {
      ...base(),
      referral_id: randomUUID(),
      receiving_id: randomUUID(),
      predecessor_id: null,
      decision: "Retain",
      allocation_id: null,
      quantity: null,
    };
  assert.deepEqual(reviewInput(id, r), {
    ...r,
    revision_id: id,
    action: "Review",
  });
  const dependency = {
    ...r,
    decision: "ReconcileReservationOutcome",
    dependency_id: randomUUID(),
    outcome_state: "Confirmed",
    observed_at: "2026-10-04T00:00:00.000Z",
    lookup_evidence: "SYN exact complete original-operation lookup",
  };
  assert.equal(
    reviewInput(id, dependency).dependency_id,
    dependency.dependency_id,
  );
  assert.equal(
    reviewInput(id, { ...dependency, lookup_evidence: "x".repeat(1000) })
      .lookup_evidence?.length,
    1000,
  );
  assert.throws(() =>
    reviewInput(id, { ...dependency, lookup_evidence: "x".repeat(1001) }),
  );
  for (const extra of [
    { outcome_state: "Unknown" },
    { dependency_id: null },
    { source_operation: "new" },
    { observed_at: "today" },
    { lookup_evidence: "" },
    { lookup_evidence: "First line\nSecond line" },
    { quantity: "0" },
    { completeness: "Partial" },
    { decision: "Retain" },
  ])
    assert.throws(() => reviewInput(id, { ...dependency, ...extra }));
});
test("Supply referral has exact scope, explicit due state and closed fields", () => {
  const id = randomUUID(),
    r = {
      ...base(),
      predecessor_id: null,
      owner_id: randomUUID(),
      due_date: null,
      date_needed: true,
      next_action: "SYN review",
    };
  assert.equal(referralInput(id, r).date_needed, true);
  for (const extra of [
    { date_needed: false },
    { due_date: "2026-10-12" },
    { synthetic_only: false },
    { expected_sequence: -1 },
    { state: "Approved" },
  ])
    assert.throws(() => referralInput(id, { ...r, ...extra }));
  assert.equal(
    referralInput(id, { ...r, date_needed: false, due_date: "2026-10-12" })
      .due_date,
    "2026-10-12",
  );
});
test("Supply review permits native exact zero without cancellation semantics and refuses unsupported scope", () => {
  const id = randomUUID(),
    r = {
      ...base(),
      referral_id: randomUUID(),
      receiving_id: randomUUID(),
      predecessor_id: null,
      decision: "AdjustAllocation",
      allocation_id: randomUUID(),
      quantity: "0",
    };
  assert.equal(reviewInput(id, r).quantity, "0");
  assert.equal(
    reviewInput(id, { ...r, quantity: "999999999999.999999" }).quantity,
    "999999999999.999999",
  );
  for (const extra of [
    { quantity: 0 },
    { quantity: "0.0000001" },
    { quantity: "-1" },
    { decision: "Cancel" },
    { decision: "Retain" },
    { unit: "kg" },
  ])
    assert.throws(() => reviewInput(id, { ...r, ...extra }));
  assert.equal(
    reviewInput(id, {
      ...r,
      decision: "Hold",
      allocation_id: null,
      quantity: null,
    }).decision,
    "Hold",
  );
  assert.throws(() =>
    receivingInput(id, {
      ...base(),
      referral_id: randomUUID(),
      predecessor_id: null,
      decision: "Approved",
    }),
  );
});
