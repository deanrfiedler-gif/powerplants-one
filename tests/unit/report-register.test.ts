import test from "node:test";
import assert from "node:assert/strict";
import {
  inReportQueue,
  reportAttention,
  reportCsv,
  type ReportRegisterRow,
} from "../../src/reports/register-model";

const row: ReportRegisterRow = {
  id: "10000000-0000-4000-8000-000000000016",
  reference: "SYN-PPO-RPT-000016",
  revision: 1,
  status: "Submitted",
  appointment_reference: "SYN-PPO-APT-000016",
  updated_at: "2026-10-12T05:40:00Z",
  title: "SYN sensor inspection",
  outcome: "Partial",
  technician_id: "technician-synthetic",
  technician: "SYN Morgan",
  attendance_start: null,
  attendance_end: null,
  customer_id: "customer-synthetic",
  customer: "SYN nursery",
  site: "SYN room",
  work_order_reference: "SYN-PPO-WO-000016",
  mine: false,
  response: null,
  remaining_open: 1,
  returned_entries: 0,
};

test("SV-06 queues distinguish review, issue, current issued response and remaining work", () => {
  assert.equal(inReportQueue(row, "review"), true);
  assert.equal(inReportQueue(row, "ready"), false);
  assert.equal(inReportQueue(row, "mine"), false);
  assert.equal(inReportQueue({ ...row, mine: true }, "mine"), true);
  assert.equal(inReportQueue({ ...row, status: "Reviewed" }, "ready"), true);
  assert.equal(inReportQueue({ ...row, status: "Returned" }, "returned"), true);
  assert.equal(inReportQueue(row, "awaiting"), false);
  assert.equal(inReportQueue({ ...row, status: "Issued" }, "awaiting"), true);
  for (const response of [
    "AcceptedWithReservations",
    "Declined",
    "Unavailable",
    "Disputed",
  ])
    assert.equal(
      inReportQueue({ ...row, status: "Issued", response }, "response"),
      true,
    );
  assert.equal(
    inReportQueue(
      { ...row, status: "Issued", response: "Accepted" },
      "response",
    ),
    false,
  );
  assert.equal(inReportQueue(row, "remaining"), true);
  assert.equal(
    inReportQueue({ ...row, remaining_open: 0 }, "remaining"),
    false,
  );
});

test("SV-06 attention reports recorded state, never inferred reading validity", () => {
  assert.equal(reportAttention(row), "Waiting for review");
  assert.equal(
    reportAttention({ ...row, status: "Returned", returned_entries: 2 }),
    "2 entries returned",
  );
  assert.equal(
    reportAttention({ ...row, status: "Reviewed" }),
    "Ready to issue",
  );
  assert.equal(
    reportAttention({ ...row, status: "Issued", remaining_open: 0 }),
    "Awaiting response",
  );
});

test("SV-06 CSV exports only supplied rows, quotes content and neutralises formulas", () => {
  const csv = reportCsv([
    { ...row, title: '=HYPERLINK("unsafe")', customer: "SYN, nursery" },
  ]);
  assert.match(csv, /"'=HYPERLINK\(""unsafe""\)"/);
  assert.match(csv, /"SYN, nursery"/);
  assert.equal(csv.split("\r\n").length, 2);
  assert.equal(reportCsv([]).split("\r\n").length, 1);
  assert.doesNotMatch(csv, /technician-synthetic|customer-synthetic/);
});
