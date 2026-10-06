import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  receivingInput,
  resolutionInput,
  planInput,
  executionInput,
} from "../../src/estimating/conversion/validation";
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN reason",
  evidence: "SYN evidence",
  synthetic_only: true,
  issue_id: randomUUID(),
  output_hash: "a".repeat(64),
  preparation_id: randomUUID(),
  response_id: randomUUID(),
  expected_sequence: 0,
});
test("ES07 rejects invented authority, unknown fields, omitted exact binding and stale sequence shapes", () => {
  const r = {
      ...base(),
      predecessor_id: null,
      decision: "Received",
      owner_id: randomUUID(),
      due_date: "2026-10-12",
      next_action: "SYN follow-up",
    },
    id = randomUUID();
  assert.equal(receivingInput(id, r).decision, "Received");
  for (const changed of [
    { signature: "verified" },
    { synthetic_only: false },
    { expected_sequence: -1 },
    { preparation_id: null },
    { evidence: "" },
    { owner_id: null },
    { due_date: "2026-02-30" },
  ])
    assert.throws(() => receivingInput(id, { ...r, ...changed }));
});
test("ES07 explicit unresolved and one-off mappings preserve separate company entity unit and display label", () => {
  const r = {
      ...base(),
      predecessor_id: null,
      line_id: randomUUID(),
      state: "Missing",
      label: "SYN one-off",
      unit: "each",
      company_id: randomUUID(),
      entity: "SupplyDemand",
    },
    id = randomUUID();
  for (const state of [
    "Missing",
    "Ambiguous",
    "Obsolete",
    "Incompatible",
    "OneOff",
  ])
    assert.equal(resolutionInput(id, { ...r, state }).state, state);
  assert.throws(() => resolutionInput(id, { ...r, entity: "MYOB-SalesOrder" }));
  assert.throws(() => resolutionInput(id, { ...r, external_key: "guessed" }));
});
test("ES07 plan review and execution require exact reviewed hashes and explicit review decision", () => {
  const id = randomUUID(),
    b = base();
  assert.equal(
    planInput(id, {
      ...b,
      predecessor_id: null,
      basis_hash: "b".repeat(64),
      decision: "Reviewed",
    }).action,
    "Plan",
  );
  assert.throws(() =>
    planInput(id, {
      ...b,
      predecessor_id: null,
      basis_hash: "b".repeat(64),
      decision: "Approved",
    }),
  );
  assert.throws(() =>
    executionInput(id, { ...b, plan_id: randomUUID(), plan_hash: "latest" }),
  );
});
