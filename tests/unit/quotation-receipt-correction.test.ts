import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  receiptProposalInput,
  receiptReceivingInput,
} from "../../src/estimating/supply-followup/receipt-input";
import { reviewInput } from "../../src/estimating/supply-followup/validation";
import { supplyFact } from "../helpers/supply";
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN test",
  evidence: "SYN exact evidence",
  synthetic_only: true,
  target_id: randomUUID(),
  execution_id: randomUUID(),
  expected_sequence: 2,
  basis_hash: "a".repeat(64),
  referral_id: randomUUID(),
  predecessor_id: null,
});
test("Receipt proposal permits only native evidence fields, exact decimal quantities and retained dependency identity", () => {
  const id = randomUUID(),
    r = {
      ...base(),
      receiving_id: randomUUID(),
      dependency_id: randomUUID(),
      data: supplyFact("Receipt", 1).data,
      completeness: "Complete",
      observed_at: "2026-10-05T00:00:00.000Z",
      fact_evidence: "SYN corrected evidence",
    };
  assert.equal(receiptProposalInput(id, r).dependency_id, r.dependency_id);
  for (const changes of [
    { dependency_id: null },
    { record_id: randomUUID() },
    { attachment_id: randomUUID() },
    { data: { ...r.data, usable: "1.0000001" } },
    { data: { ...r.data, stock: "100" } },
    { observed_at: "today" },
    { synthetic_only: false },
  ])
    assert.throws(() => receiptProposalInput(id, { ...r, ...changes }));
});
test("Affected receiving and final Receipt review bind exact immutable proposal and closed decisions", () => {
  const id = randomUUID(),
    r = {
      ...base(),
      proposal_id: randomUUID(),
      proposal_hash: "b".repeat(64),
      demand_id: randomUUID(),
      decision: "Accepted",
    };
  for (const decision of ["Accepted", "Returned", "Held"])
    assert.equal(
      receiptReceivingInput(id, { ...r, decision }).decision,
      decision,
    );
  for (const changes of [
    { decision: "Approved" },
    { proposal_hash: "" },
    { demand_id: null },
    { owner_id: randomUUID() },
  ])
    assert.throws(() => receiptReceivingInput(id, { ...r, ...changes }));
  const review = {
    ...base(),
    receiving_id: randomUUID(),
    decision: "CorrectReceipt",
    receipt_proposal_id: r.proposal_id,
    quantity: null,
    allocation_id: null,
  };
  assert.equal(reviewInput(id, review).receipt_proposal_id, r.proposal_id);
  for (const changes of [
    { receipt_proposal_id: null },
    { quantity: "1" },
    { outcome_state: "Confirmed" },
    { decision: "Retain" },
  ])
    assert.throws(() => reviewInput(id, { ...review, ...changes }));
});
