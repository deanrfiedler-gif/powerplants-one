import assert from "node:assert/strict";
import { test } from "node:test";
import {
  blankContent,
  commandFields,
  group,
  moneyLabel,
  obligationOverdue,
  noticeRelation,
} from "../../src/projects/commercial/ui-model";
import { cents, decimal, total } from "../../src/projects/commercial/model";

test("PJ05 UI keeps exact decimal money, credits, unknown and zero distinct", () => {
  assert.equal(moneyLabel(null), "Unknown");
  assert.equal(moneyLabel("0.00"), "$0.00");
  assert.equal(moneyLabel("-1150.00"), "−$1,150.00");
  assert.equal(moneyLabel("1999999999999.99"), "$1,999,999,999,999.99");
  // Independent fixed Finance-contract examples, including exact cents and unknowns.
  assert.equal(
    decimal(cents("10.01") + cents("0.10") - cents("0.03")),
    "10.08",
  );
  assert.deepEqual(total([null, "0.00"]), {
    value: null,
    known_subtotal: "0.00",
    completeness: "Incomplete",
  });
});
test("PJ05 displayed groups retain a dispute across a resubmission", () => {
  assert.equal(
    group({ kind: "Variation", state: "Submitted", disputed: true }),
    "Disputed",
  );
  assert.equal(
    group({ kind: "Variation", state: "Submitted", disputed: false }),
    "Waiting for decision",
  );
  assert.equal(
    group({ kind: "Variation", state: "Withdrawn", disputed: false }),
    "Closed",
  );
});
test("PJ05 commands preserve exact versions and send only kind-specific content", () => {
  const content = {
    ...blankContent("owner"),
    title: "SYN change",
    detail: "SYN scope",
    clause: "4.2",
    requested_amount: null,
    priced_amount: "0.00",
  };
  const body = commandFields(
    { action: "Create", kind: "Variation", basis: "basis" },
    content,
    null,
    "entry",
    "SYN reason",
    "SYN note",
    "",
  );
  assert.equal(body.expected_version, 0);
  assert.equal(body.content?.priced_amount, "0.00");
  assert.equal(body.content?.requested_amount, null);
  assert.equal(Object.hasOwn(body.content!, "occurred_at"), false);
  assert.equal(Object.hasOwn(body, "outcome"), false);
});

test("PJ05 overdue is an open-obligation site calendar date, not an instant or state change", () => {
  const row = {
    kind: "Obligation" as const,
    state: "Open" as const,
    content: { ...blankContent("owner"), due_date: "2026-10-30" },
  };
  const instant = new Date("2026-10-30T14:30:00Z");
  assert.equal(obligationOverdue(row, "Australia/Brisbane", instant), true);
  assert.equal(obligationOverdue(row, "UTC", instant), false);
  assert.equal(
    obligationOverdue(
      { ...row, state: "Satisfied" },
      "Australia/Brisbane",
      instant,
    ),
    false,
  );
  assert.equal(
    obligationOverdue(
      { ...row, content: { ...row.content, due_date: null } },
      "Australia/Brisbane",
      instant,
    ),
    false,
  );
});

test("PJ05 notice correction and waiver groups describe retained evidence", () => {
  assert.equal(
    group({
      kind: "Notice",
      state: "RecordedEvidence",
      correction_status: "Corrected",
      disputed: false,
    }),
    "Corrected",
  );
  assert.equal(
    group({ kind: "Notice", state: "RecordedEvidence", disputed: false }),
    "Latest",
  );
  assert.equal(
    noticeRelation({ correction_status: "Latest", predecessor_id: "earlier" }),
    "Corrects an earlier record",
  );
  assert.equal(
    group({ kind: "Obligation", state: "Submitted", disputed: false }),
    "Waiting for a waiver decision",
  );
});
