import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptyQueueMessage,
  reviewStatus,
  reviewsCsv,
  selectionKey,
  waitingTime,
} from "../../src/estimating/review/queue-presentation";
import type {
  QueueRow,
  ReviewQueueData,
} from "../../src/estimating/review/queue-model";
const row: QueueRow = {
  id: "e:1:Completeness",
  source: "EstimateReview",
  record_id: "e",
  estimate_id: "e",
  estimate_version_id: "v",
  submission_id: "s",
  reference: "SYN-EST-1",
  revision: 1,
  title: "=untrusted title",
  customer: "Synthetic",
  owner: "Owner",
  submitted_by: "Submitter",
  site: null,
  kind: "Completeness",
  sequence: 1,
  submitted_at: "2026-10-01T00:00:00Z",
  submitted_by_me: false,
  own_work: false,
  state: "Pending",
  basis_current: true,
  can_decide: false,
  carried_forward: false,
  decision_id: null,
  decision_outcome: null,
  finding_count: 0,
  sell_total: null,
  currency: "AUD",
  tax_basis: "Tax not calculated",
  href: "/estimating/estimates/e/review?submission_id=s&kind=Completeness",
};
test("elapsed waiting uses recorded observations without deadline or overdue classifications", () => {
  assert.equal(waitingTime(row, "2026-10-03T01:00:00Z"), "2 days");
  assert.equal(
    waitingTime({ ...row, state: "Reviewed" }, "2026-10-03T01:00:00Z"),
    "—",
  );
  assert.equal(waitingTime(row, "2026-09-01T00:00:00Z"), "Not available");
  assert.equal(reviewStatus(row), "Awaiting review");
  assert.equal(
    reviewStatus({ ...row, can_decide: true }),
    "Awaiting your review",
  );
  assert.equal(reviewStatus({ ...row, own_work: true }), "Your estimate");
});
test("empty window language preserves continuation and partial authority", () => {
  const d = {
    completeness: "CompleteWindow",
    counts: { all: 0 },
    offset: 0,
    next_offset: null,
  } as ReviewQueueData;
  assert.equal(emptyQueueMessage(d, false), "No reviews submitted yet");
  assert.equal(
    emptyQueueMessage({ ...d, next_offset: 25 }, false),
    "No matching reviews in this window",
  );
  assert.match(
    emptyQueueMessage({ ...d, completeness: "PartialWindow" }, false),
    /partial/,
  );
});
test("selection identifies exact evidence and exports unknown amounts safely", () => {
  assert.notEqual(
    selectionKey(row),
    selectionKey({ ...row, submission_id: "successor" }),
  );
  assert.notEqual(
    selectionKey(row),
    selectionKey({ ...row, can_decide: true }),
  );
  const csv = reviewsCsv([row], "2026-10-03T00:00:00Z");
  assert.ok(csv.includes("Selected reviews only"));
  assert.ok(csv.includes("'=untrusted title"));
  assert.ok(csv.includes("Not recorded"));
  assert.ok(csv.includes(row.href));
});
