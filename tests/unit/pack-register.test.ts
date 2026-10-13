import { test } from "node:test";
import assert from "node:assert/strict";
import {
  matchesPackView,
  packListCsv,
  registerStatus,
  visitGroup,
  withinSevenDays,
  type PackRegisterRow,
} from "../../src/documents/pack-register";

const row: PackRegisterRow = {
  id: "pack",
  display_number: "JP-001",
  status: "Issued",
  needs_review: false,
  appointment_id: "visit",
  appointment_reference: "AP-001",
  current_revision_id: "revision",
  current_issue_id: "issue",
  revision: 2,
  title: "SYN Check controller",
  visit_at: "2026-10-14T00:00:00Z",
  timezone: "Australia/Brisbane",
  customer: "SYN Customer",
  site: "SYN Site",
  site_id: "site",
  technicians: [{ id: "technician", name: "SYN Technician" }],
  prepared_by: "owner",
  prepared_by_name: "SYN Coordinator",
  updated_at: "2026-10-13T00:00:00Z",
  job_state: "Succeeded",
  readiness: { satisfied: 5, total: 6 },
  acknowledged: 1,
  recipients: 2,
  dispatch_hold: true,
  can_prepare: true,
};
const now = "2026-10-13T00:00:00Z";
test("pack attention views distinguish unavailable readiness, issue review and output recovery", () => {
  assert(matchesPackView(row, "readiness", "owner", now));
  assert(
    !matchesPackView({ ...row, readiness: null }, "readiness", "owner", now),
  );
  assert(matchesPackView(row, "acknowledgement", "owner", now));
  assert(
    !matchesPackView(
      { ...row, needs_review: true },
      "acknowledgement",
      "owner",
      now,
    ),
  );
  assert(!matchesPackView({ ...row, prepared_by: null }, "mine", "owner", now));
  assert(
    matchesPackView({ ...row, job_state: "Failed" }, "recovery", "owner", now),
  );
  assert(matchesPackView(row, "held", "owner", now));
  assert(
    !matchesPackView(
      { ...row, visit_at: "2026-10-21T00:00:00Z" },
      "held",
      "owner",
      now,
    ),
  );
  assert.equal(
    registerStatus({ ...row, needs_review: true }).label,
    "Review required",
  );
});
test("visit buckets use the site calendar across local midnight and daylight saving", () => {
  assert.equal(
    visitGroup(
      "2026-10-13T14:30:00Z",
      "2026-10-13T13:30:00Z",
      "Australia/Brisbane",
    ),
    "Tomorrow",
  );
  assert.equal(
    visitGroup(
      "2026-10-04T13:30:00Z",
      "2026-10-03T15:30:00Z",
      "Australia/Sydney",
    ),
    "Tomorrow",
  );
  assert.equal(
    visitGroup("2026-10-12T02:00:00Z", now, "Australia/Brisbane"),
    "Earlier",
  );
  assert.equal(
    visitGroup("2026-10-19T00:00:00Z", now, "Australia/Brisbane"),
    "Next week",
  );
  assert(withinSevenDays(now, now));
  assert(!withinSevenDays("2026-10-20T00:00:00Z", now));
  assert(!withinSevenDays("2026-10-12T23:59:59Z", now));
});
test("export escapes quotes/newlines and neutralises spreadsheet formulas, including leading whitespace", () => {
  const csv = packListCsv([
    {
      ...row,
      title: '  =HYPERLINK("x")',
      customer: 'SYN "Quoted", name',
      site: "\n+formula",
    },
  ]);
  assert(csv.includes('"\'  =HYPERLINK(""x"")"'));
  assert(csv.includes('"SYN ""Quoted"", name"'));
  assert(csv.includes('"\'\n+formula"'));
  assert(!csv.includes("owner"));
});
