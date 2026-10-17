import assert from "node:assert/strict";
import { test } from "node:test";
import {
  partsOutcome,
  partsSummary,
  partsReason,
  PARTS_READY,
  type PartsLine,
} from "../../src/service/parts-readiness";
import {
  returnReasonCodes,
  returnReasonLabels,
  returnReasonsText,
  statusPresentation,
  unansweredReturns,
} from "../../src/documents/pack-view";
import { matchesPackView, type PackRegisterRow } from "../../src/documents/pack-register";

// Field readiness gate (PPO-SVC-FIELD-READINESS-GATE-PROP): the P1 outcome mapping and the
// presentation of a technician Return (A1-D3, A1-D5). Presentation only; the server decides.
const line = (state: string, extra: Partial<PartsLine> = {}): PartsLine => ({
  id: "d1",
  reference: "SYN-PPO-SC-1",
  title: "SYN SD-450B drive motor",
  item: "SYN-SD-450B",
  quantity: "1",
  unit: "EA",
  state,
  shortage: state === PARTS_READY ? "0" : "1",
  required_on: "2031-12-05",
  promised_on: null,
  ...extra,
});

test("P1 maps Supply Chain readiness of linked demands to the criterion outcome", () => {
  assert.equal(partsOutcome([line(PARTS_READY), line(PARTS_READY)], 0, null), "Pass");
  assert.equal(partsOutcome([line(PARTS_READY), line("Blocked")], 0, null), "Blocked");
  assert.equal(partsOutcome([line("At risk")], 0, null), "Blocked");
  assert.equal(partsOutcome([line(PARTS_READY), line("Evidence needed")], 0, null), "Unknown");
  assert.equal(partsOutcome([line("Not assessed")], 0, null), "Unknown");
  // Nothing linked: Unknown, unless the preparer recorded "No parts needed" (R1, never inferred).
  assert.equal(partsOutcome([], 0, null), "Unknown");
  assert.equal(partsOutcome([], 0, "NotApplicable"), "NotApplicable");
  // A statement never outranks a linked demand.
  assert.equal(partsOutcome([line("Blocked")], 0, "NotApplicable"), "Blocked");
  // Q7: a demand on the work order but not on this visit keeps Parts Unknown.
  assert.equal(partsOutcome([line(PARTS_READY)], 1, null), "Unknown");
  assert.equal(partsOutcome([], 1, "NotApplicable"), "Unknown");
  // Q1: a permitted exception holds whatever the lines say.
  assert.equal(partsOutcome([line("Blocked")], 1, "PermittedException"), "PermittedException");
});

test("P1 says in words what is short, promised or unlinked", () => {
  const ready = [line(PARTS_READY), line(PARTS_READY), line(PARTS_READY)];
  assert.equal(
    partsSummary({ outcome: "Pass", lines: ready, unlinked: [], statement: null }),
    "3 of 3 lines ready for the stated scope",
  );
  const atRisk = [
    line("At risk", { promised_on: "2031-12-05" }),
    line(PARTS_READY),
    line(PARTS_READY),
  ];
  assert.equal(
    partsSummary({ outcome: "Blocked", lines: atRisk, unlinked: [], statement: null }),
    "SYN SD-450B drive motor: At risk · promised 2031-12-05 · 1 EA short · 2 of 3 lines ready for the stated scope",
  );
  assert.equal(
    partsSummary({ outcome: "NotApplicable", lines: [], unlinked: [], statement: "NotApplicable" }),
    "No parts needed for this visit, recorded by the preparer",
  );
  const unlinked = { outcome: "Unknown" as const, lines: [], unlinked: [{ id: "x", reference: "r", title: "SYN tester" }], statement: null };
  assert.equal(
    partsSummary(unlinked),
    "1 demand is on the work order but not linked to this visit: SYN tester",
  );
  assert.equal(
    partsReason({ ...unlinked, summary: partsSummary(unlinked) }),
    "Parts ready for the stated material scope: Unknown. 1 demand is on the work order but not linked to this visit: SYN tester.",
  );
});

test("P2 return reasons keep the accepted design's six words", () => {
  assert.deepEqual(
    returnReasonCodes.map((c) => returnReasonLabels[c]),
    [
      "Parts missing",
      "Parts incorrect",
      "Scope unclear",
      "Site not confirmed",
      "Safety or isolation information missing",
      "Other",
    ],
  );
  assert.equal(
    returnReasonsText(["PartsIncorrect", "SafetyInformationMissing"]),
    "parts incorrect, safety or isolation information missing",
  );
});

test("A1-D3 an issued pack with an unanswered technician return reads Returned by technician", () => {
  const pack = { status: "Issued", needs_review: false, current_issue_id: "i" };
  assert.deepEqual(statusPresentation({ ...pack, returned: 1 }), {
    label: "Returned by technician",
    tone: "warning",
  });
  assert.equal(statusPresentation({ ...pack, returned: 0 }).label, "Issued");
  // A review requirement still outranks a return, and a checker's return keeps its own label.
  assert.equal(
    statusPresentation({ ...pack, needs_review: true, returned: 1 }).label,
    "Review required",
  );
  assert.equal(
    statusPresentation({ ...pack, status: "Returned", returned: 0 }).label,
    "Returned for preparation",
  );
  const recipients = [
    { return_id: "r1", return_answered_at: null },
    { return_id: "r2", return_answered_at: "2031-12-04T00:00:00Z" },
    { return_id: null, return_answered_at: null },
  ];
  assert.equal(unansweredReturns(recipients).length, 1);
  const row = { status: "Issued", returned: 1 } as PackRegisterRow;
  assert.equal(matchesPackView(row, "returned", "a", "2031-12-01T00:00:00Z"), true);
  assert.equal(
    matchesPackView({ ...row, returned: 0 }, "returned", "a", "2031-12-01T00:00:00Z"),
    false,
  );
});
