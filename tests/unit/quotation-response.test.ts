import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  responseInput,
  clarificationInput,
  handoverInput,
} from "../../src/estimating/response/validation";
import {
  responseState,
  type ResponseEvent,
} from "../../src/estimating/response/model";
const id = randomUUID(),
  base = {
    operation_id: randomUUID(),
    schema_version: 1,
    reason: "SYN reason",
    synthetic_only: true,
    issue_id: randomUUID(),
    output_hash: "a".repeat(64),
    expected_response_sequence: 0,
    response_id: null,
    evidence: "SYN exact evidence",
  };
const report = {
  outcome: "Accepted",
  respondent: "Pat",
  claimed_role: "Buyer",
  responded_at: "2026-10-03T12:00:00Z",
  conditions: null,
};
test("ES06 validation refuses unbound/ambiguous, signature, partial selection, unknown and invalid attribution inputs", () => {
  assert.equal(
    responseInput(id, { ...base, action: "Record", report }).report
      .responded_at,
    "2026-10-03T12:00:00.000Z",
  );
  for (const change of [
    { issue_id: "latest" },
    { output_hash: "wrong" },
    { synthetic_only: false },
    { expected_response_sequence: -1 },
    { signature: "Pat" },
    { selected_options: [id] },
    { evidence: "" },
    { report: { ...report, respondent: "" } },
    { report: { ...report, claimed_role: "" } },
    { report: { ...report, responded_at: "2026-02-30T12:00:00Z" } },
    { report: { ...report, outcome: "PartiallyAccepted" } },
  ])
    assert.throws(() =>
      responseInput(id, { ...base, action: "Record", report, ...change }),
    );
  assert.throws(() =>
    clarificationInput(id, {
      ...base,
      action: "Confirm",
      detail: { respondent: "Pat" },
    }),
  );
  assert.throws(() =>
    handoverInput(id, {
      ...base,
      response_id: id,
      owner_id: id,
      due_date: "2026-02-30",
      note: "SYN",
    }),
  );
});
test("ES06 selective applicability preserves exact acceptance across unrelated facts, holds corrected preparations and material history", () => {
  const accepted = {
    id,
    action: "Record",
    report,
    response_id: null,
  } as ResponseEvent;
  const prep = {
    id: randomUUID(),
    action: "Prepare",
    report: null,
    response_id: id,
  } as ResponseEvent;
  assert.equal(responseState([accepted, prep], true).preparedApplicable, true);
  assert.equal(
    responseState([accepted, prep], false).preparedApplicable,
    false,
  );
  const correction = {
    ...accepted,
    id: randomUUID(),
    action: "Correct",
    response_id: id,
    report: { ...report, outcome: "Declined" },
  } as ResponseEvent;
  assert.equal(responseState([accepted, prep, correction], true).ready, false);
  const negotiation = {
    ...accepted,
    report: { ...report, outcome: "Negotiation" },
  } as ResponseEvent;
  assert.equal(
    responseState(
      [
        negotiation,
        { ...accepted, id: randomUUID(), action: "Correct", response_id: id },
      ],
      true,
    ).ready,
    false,
  );
  const question = {
    ...accepted,
    report: { ...report, outcome: "Clarification" },
  } as ResponseEvent;
  assert.equal(
    responseState([question, { ...accepted, id: randomUUID() }], true).ready,
    false,
  );
  assert.equal(
    responseState(
      [
        question,
        { ...prep, action: "Confirm" },
        { ...accepted, id: randomUUID() },
      ],
      true,
    ).ready,
    true,
  );
});
