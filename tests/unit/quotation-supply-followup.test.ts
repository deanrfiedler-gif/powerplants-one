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
