import assert from "node:assert/strict";
import { test } from "node:test";
import {
  money,
  cents,
  decimal,
  total,
  transition,
  type Content,
} from "../../src/projects/commercial/model";
import { contentInput } from "../../src/projects/commercial/validation";
const content: Content = {
  title: "SYN",
  detail: "SYN",
  clause: "SYN",
  owner_id: "30000000-0000-4000-8000-000000000001",
  action_ids: [],
  due_date: null,
  date_needed: false,
  evidence: null,
  occurred_at: null,
  requested_amount: null,
  priced_amount: null,
  date_impact: null,
};
test("PJ05 exact cents, signs, explicit unknown and bounded input", () => {
  assert.equal(
    decimal(cents("10.01") + cents("0.10") + cents("-0.03")),
    "10.08",
  );
  assert.equal(money("-0", "amount"), "0.00");
  assert.equal(money("999999999999.99", "amount"), "999999999999.99");
  for (const v of [
    1.2,
    "1.001",
    "1e3",
    "+2",
    "01.00",
    "1000000000000",
    "NaN",
    undefined,
  ])
    assert.throws(() => money(v, "amount"));
  assert.deepEqual(total([null, "0.00"]), {
    value: null,
    known_subtotal: "0.00",
    completeness: "Incomplete",
  });
  assert.deepEqual(total([]), {
    value: "0.00",
    known_subtotal: "0.00",
    completeness: "Complete",
  });
  assert.equal(total(["12000.00", "-2000.00"]).value, "10000.00");
});
test("PJ05 exact state transitions and decision immutability", () => {
  assert.equal(
    transition("Variation", undefined, "Create", null, content),
    "Requested",
  );
  assert.equal(
    transition("Variation", undefined, "Create", null, {
      ...content,
      priced_amount: "0.00",
    }),
    "Assessed",
  );
  for (const kind of ["Basis", "Variation"] as const)
    for (const action of ["Revise", "Submit", "Decide", "Withdraw"])
      assert.throws(() =>
        transition(kind, "Approved", action, "Approved", content),
      );
  assert.throws(() =>
    transition("Notice", "RecordedEvidence", "Revise", null, content),
  );
  assert.throws(() =>
    transition("Variation", "Requested", "Submit", null, content),
  );
  assert.equal(
    transition("Obligation", "Submitted", "Decide", "Waived", content),
    "Waived",
  );
  assert.equal(
    transition("Obligation", "Waived", "Reopen", null, content),
    "Open",
  );
});
test("PJ05 separate content contracts refuse surplus amounts and inferred dates", () => {
  const base = {
    title: "SYN",
    detail: "SYN",
    clause: "SYN clause",
    owner_id: content.owner_id,
    action_ids: [],
  };
  assert.throws(() => contentInput({ ...base, amount: "10.00" }, "Basis"));
  assert.throws(() =>
    contentInput(
      { ...base, due_date: "2026-02-30", date_needed: false },
      "Obligation",
    ),
  );
  assert.throws(() =>
    contentInput({ ...base, due_date: null, date_needed: false }, "Obligation"),
  );
  assert.equal(
    contentInput({ ...base, due_date: null, date_needed: true }, "Obligation")
      .date_needed,
    true,
  );
  assert.throws(() =>
    contentInput(
      { ...base, requested_amount: 0, priced_amount: null },
      "Variation",
    ),
  );
});
