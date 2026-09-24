import { test } from "node:test";
import assert from "node:assert/strict";
import {
  competenceState,
  travelSequences,
  scenarioSummary,
  type DemandContribution,
  type ResourceEvidence,
} from "../../src/scheduling/workspace-model";
import {
  safePlannerReturn,
  safeBookingTarget,
  appointmentHref,
} from "../../src/scheduling/navigation";
import type { ScheduleAppointment } from "../../src/scheduling";

const skill = {
  id: "skill",
  version: 1,
  skill_code: "SYN-VISUAL",
  status: "Verified",
  active: true,
  valid_from: "2031-01-01T00:00:00Z",
  valid_to: "2032-01-01T00:00:00Z",
  source_as_at: "2030-01-01T00:00:00Z",
  evidence_ref: "evidence",
  content_hash: "hash",
  reviewer_id: "reviewer",
  reviewed_at: "2030-01-02T00:00:00Z",
} satisfies ResourceEvidence["skills"][number];
test("competence distinguishes verified, expired, future, period expiry and unknown evidence", () => {
  const start = "2031-09-22T00:00:00Z",
    end = "2031-09-29T00:00:00Z";
  assert.equal(
    competenceState(skill, start, end),
    "Verified for selected period",
  );
  assert.equal(
    competenceState({ ...skill, valid_to: start }, start, end),
    "Expired",
  );
  assert.equal(
    competenceState({ ...skill, valid_from: end }, start, end),
    "Not yet valid",
  );
  assert.equal(
    competenceState({ ...skill, valid_to: "2031-09-25T00:00:00Z" }, start, end),
    "Expires within selected period",
  );
  assert.equal(
    competenceState({ ...skill, reviewed_at: null }, start, end),
    "Unknown / unverified evidence",
  );
  assert.equal(
    competenceState({ ...skill, active: false }, start, end),
    "Inactive",
  );
});
const visit = (
  id: string,
  start: string,
  end: string,
  before = 0,
  after = 0,
  resource = "r1",
  reason = "SYN explicit zero allowance",
) =>
  ({
    id,
    status: "Confirmed",
    start_at: "2031-09-22T" + start + ":00Z",
    end_at: "2031-09-22T" + end + ":00Z",
    assignment_version: 2,
    assignments: [
      {
        id: id + "old",
        resource_id: "r2",
        name: "Old crew",
        active: false,
        assignment_version: 1,
      },
      {
        id: id + "crew",
        resource_id: resource,
        name: "SYN resource",
        active: true,
        assignment_version: 2,
        travel_before_minutes: before,
        travel_after_minutes: after,
        travel_reason: reason,
      },
    ],
  }) as ScheduleAppointment;
test("travel sorts buffered intervals, preserves explicit zero and half-open adjacent reservations", () => {
  const source = [
    visit("b", "11:00", "12:00", 30),
    visit("a", "09:00", "10:00", 0, 30),
  ];
  const before = JSON.stringify(source),
    rows = travelSequences(source);
  assert.deepEqual(
    rows.map((r) => r.appointment.id),
    ["a", "b"],
  );
  assert.equal(rows[1].gap_minutes, 0);
  assert.equal(rows[1].overlap, false);
  assert.equal(rows[0].before, 0);
  assert.equal(rows[0].unknown_basis, false);
  assert.equal(JSON.stringify(source), before);
});
test("travel detects nested and buffered overlaps without mixing resources or inactive assignments", () => {
  const rows = travelSequences([
    visit("long", "08:00", "13:00"),
    visit("short", "09:00", "10:00"),
    visit("nested", "11:00", "12:00"),
    visit("other", "09:00", "10:00", 0, 0, "r3"),
  ]);
  assert.equal(
    rows.find((r) => r.appointment.id === "nested")?.gap_minutes,
    -120,
  );
  assert.equal(rows.find((r) => r.appointment.id === "other")?.overlap, false);
  assert.equal(
    travelSequences(
      rows.map((r) => r.appointment),
      "r2",
    ).length,
    0,
  );
});
test("travel exposes missing basis, excludes cancelled visits and retains unreserved proposals as proposals", () => {
  const proposal = {
    ...visit("proposal", "08:00", "09:00", 0, 0, "r1", ""),
    status: "Proposed",
  };
  const rows = travelSequences([
    proposal,
    { ...visit("cancel", "08:00", "09:00"), status: "Cancelled" },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].unknown_basis, true);
  assert.equal(rows[0].appointment.status, "Proposed");
});
test("capacity scenarios deduplicate exact sources, keep effort unknown and never mutate contributions", () => {
  const item = {
    key: "Appointment:a",
    effort_minutes: null,
    reserved_minutes: 180,
  } as DemandContribution;
  const other = { ...item, key: "ProjectTask:a", reserved_minutes: null };
  const source = [item, item, other],
    original = JSON.stringify(source);
  assert.deepEqual(scenarioSummary(source, []), {
    contributions: 2,
    unknown_effort: 2,
    reserved_minutes: 180,
  });
  assert.deepEqual(scenarioSummary(source, ["Appointment:a"]), {
    contributions: 1,
    unknown_effort: 1,
    reserved_minutes: 0,
  });
  assert.equal(JSON.stringify(source), original);
});
test("exact changes handover survives appointment recovery without arbitrary return destinations", () => {
  const id = "a8000000-0000-4000-8000-000000000001";
  const target =
    "/schedule/changes?appointment_id=" +
    id +
    "&day=2031-09-22&timezone=Australia%2FBrisbane";
  const safe = safePlannerReturn(target),
    href = appointmentHref(id, safe);
  assert.match(safe, /appointment_id=a800/);
  assert.equal(safeBookingTarget(href), href);
  for (const value of [
    "//evil.test",
    "/schedule/changes/evil",
    "/schedule/travel#bad",
    "https://evil.test/schedule",
    "/schedule/%2f%2fevil",
  ])
    assert.equal(safePlannerReturn(value), "/schedule");
  assert.doesNotMatch(
    safePlannerReturn(target + "&appointment_id=" + id),
    /appointment_id/,
  );
});
