import { test } from "node:test";
import assert from "node:assert/strict";
import type {
  Resource,
  Schedule,
  ScheduleAppointment,
} from "../../src/scheduling";
import { travelSequences } from "../../src/scheduling/workspace-model";
import {
  startingTravelResource,
  travelPartConflicts,
  compareTravelOrder,
  moveTravelComparison,
} from "../../src/scheduling/travel-review-model";
const resource = (id: string, user_id = "") =>
  ({
    id,
    name: id,
    user_id,
    blocks: [],
    exceptions: [],
  }) as unknown as Resource;
const appointment = (id: string, resourceId: string, hour = 9) =>
  ({
    id,
    status: "Confirmed",
    start_at: `2031-09-22T${String(hour).padStart(2, "0")}:00:00Z`,
    end_at: `2031-09-22T${String(hour + 1).padStart(2, "0")}:00:00Z`,
    assignment_version: 1,
    assignments: [
      {
        resource_id: resourceId,
        name: resourceId,
        active: true,
        assignment_version: 1,
        travel_before_minutes: 30,
        travel_after_minutes: 30,
        travel_reason: "SYN reviewed allowance",
      },
    ],
  }) as ScheduleAppointment;
const block = (id: string, start: string, end: string) => ({
  id,
  kind: "OtherWork",
  start_at: `2031-09-22T${start}:00Z`,
  end_at: `2031-09-22T${end}:00Z`,
});
test("Travel starts with an explicit permitted person, otherwise conflict, signed-in technician, then first permitted person", () => {
  const first = resource("r1"),
    own = resource("r2", "actor"),
    conflict = { ...resource("r3"), blocks: [block("b", "08:30", "09:00")] };
  const data = {
    resources: [first, own, conflict],
    items: [appointment("a", "r3")],
  };
  assert.equal(startingTravelResource(data, "", "actor"), "r3");
  assert.equal(startingTravelResource(data, "r1", "actor"), "r1");
  assert.equal(startingTravelResource(data, "not-permitted", "actor"), "");
  assert.equal(
    startingTravelResource({ ...data, items: [] }, "", "actor"),
    "r2",
  );
  assert.equal(
    startingTravelResource({ ...data, items: [] }, "", "coordinator"),
    "r1",
  );
  assert.equal(
    startingTravelResource({ resources: [], items: data.items }, "", "actor"),
    "",
  );
});
test("Travel conflict choice includes reservation overlaps but ignores assignments to non-permitted people", () => {
  const data = {
    resources: [resource("r1"), resource("r2")],
    items: [
      appointment("a", "r2"),
      appointment("b", "r2"),
      appointment("secret", "r0"),
    ],
  };
  assert.equal(startingTravelResource(data, "", ""), "r2");
});
test("Travel names only conflicts on each actual half-open leg or visit, including spanning closures and zero allowances", () => {
  const visit = travelSequences([appointment("a", "r1")])[0];
  const r = {
    ...resource("r1"),
    blocks: [
      block("before", "08:45", "09:00"),
      block("visit", "09:00", "10:00"),
      block("after", "10:00", "10:15"),
      block("adjacent", "10:30", "11:00"),
    ],
    exceptions: [
      { ...block("closure", "08:50", "10:05"), reason: "SYN closure" },
    ],
  };
  assert.deepEqual(
    travelPartConflicts(visit, r, "before").blocks.map((b) => b.id),
    ["before"],
  );
  assert.deepEqual(
    travelPartConflicts(visit, r, "visit").blocks.map((b) => b.id),
    ["visit"],
  );
  assert.deepEqual(
    travelPartConflicts(visit, r, "after").blocks.map((b) => b.id),
    ["after"],
  );
  for (const part of ["before", "visit", "after"] as const)
    assert.deepEqual(
      travelPartConflicts(visit, r, part).closures.map((b) => b.id),
      ["closure"],
    );
  assert.equal(
    travelPartConflicts(
      { ...visit, reserved_start: visit.appointment.start_at },
      r,
      "before",
    ).closures.length,
    0,
  );
  assert.equal(
    travelPartConflicts(
      { ...visit, reserved_end: visit.appointment.end_at },
      r,
      "after",
    ).closures.length,
    0,
  );
});
test("Comparison is immutable, keeps original gaps, marks reversals, resets and rejects stale or duplicate keys", () => {
  const data = {
    items: [appointment("a", "r1"), appointment("b", "r1", 12)],
  } as Schedule;
  const visits = travelSequences(data.items, "r1"),
    before = JSON.stringify({ data, visits });
  const keys = visits.map((v) => v.key),
    moved = moveTravelComparison(keys, 1, -1);
  const compared = compareTravelOrder(visits, moved);
  assert.equal(compared.comparing, true);
  assert.deepEqual(compared.reversals, [visits[0].key]);
  assert.equal(compared.ordered[0].gap_minutes, 60);
  assert.equal(JSON.stringify({ data, visits }), before);
  assert.deepEqual(compareTravelOrder(visits, []).ordered, visits);
  assert.equal(
    compareTravelOrder(visits, moveTravelComparison(moved, 0, 1)).comparing,
    false,
  );
  assert.equal(compareTravelOrder(visits, ["stale", keys[1]]).comparing, false);
  assert.equal(compareTravelOrder(visits, [keys[0], keys[0]]).comparing, false);
  assert.deepEqual(moveTravelComparison(keys, 0, -1), keys);
});

test("Comparison flags every visit booked before an earlier displayed visit, not only adjacent inversions", () => {
  const visits = travelSequences([
    appointment("a", "r1"),
    appointment("b", "r1", 12),
    appointment("c", "r1", 15),
  ]);
  const compared = compareTravelOrder(visits, [
    visits[2].key,
    visits[0].key,
    visits[1].key,
  ]);
  assert.deepEqual(compared.reversals, [visits[0].key, visits[1].key]);
});

test("The original buffered order is not labelled a proposed booking-time reversal", () => {
  const early = appointment("a", "r1", 9);
  const later = appointment("b", "r1", 12);
  later.assignments[0].travel_before_minutes = 240;
  const visits = travelSequences([early, later]);
  assert.equal(visits[0].appointment.id, "b");
  assert.equal(compareTravelOrder(visits, []).comparing, false);
  assert.deepEqual(compareTravelOrder(visits, []).reversals, []);
});
