import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  dispositionReviewInput,
  dispositionApplyInput,
} from "../../src/estimating/disposition/validation";
const id = randomUUID(),
  envelope = {
    operation_id: randomUUID(),
    schema_version: 1,
    reason: "SYN review",
    evidence: "SYN evidence",
    synthetic_only: true,
    target_id: randomUUID(),
    execution_id: randomUUID(),
    expected_sequence: 0,
  };
const review = {
  ...envelope,
  predecessor_id: null,
  basis_hash: "a".repeat(64),
  decision: "Retain",
  quantity: null,
  owner_id: randomUUID(),
  due_date: "2026-10-12",
  next_action: "Review owning workflow",
};
test("disposition strict actions and positive exact quantity refuse cancellation replacement and invented authority", () => {
  assert.equal(dispositionReviewInput(id, review).decision, "Retain");
  assert.equal(
    dispositionReviewInput(id, {
      ...review,
      decision: "ReviseQuantity",
      quantity: "1.250000",
    }).quantity,
    "1.25",
  );
  for (const quantity of ["0", "-1", "1.0000001", 1, "1e2", "1000000000000"])
    assert.throws(() =>
      dispositionReviewInput(id, {
        ...review,
        decision: "ReviseQuantity",
        quantity,
      }),
    );
  for (const decision of ["Delete", "Cancel", "Replace", "Approve"])
    assert.throws(() => dispositionReviewInput(id, { ...review, decision }));
  for (const extra of [
    { quantity: "1" },
    { approval: true },
    { evidence: " " },
    { owner_id: null },
    { expected_sequence: -1 },
    { synthetic_only: false },
  ])
    assert.throws(() => dispositionReviewInput(id, { ...review, ...extra }));
});
test("disposition application binds exact review identity and refuses changed action payload", () => {
  const value = {
    ...envelope,
    review_id: randomUUID(),
    review_hash: "b".repeat(64),
  };
  assert.equal(dispositionApplyInput(id, value).review_id, value.review_id);
  for (const extra of [
    { review_hash: "latest" },
    { quantity: "3" },
    { review_id: null },
    { decision: "Retain" },
  ])
    assert.throws(() => dispositionApplyInput(id, { ...value, ...extra }));
});
