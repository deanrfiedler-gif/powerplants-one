import assert from "node:assert/strict";
import test from "node:test";
import type { ScheduleAppointment } from "../../src/components/planner-screens";
import {
  currentCrew,
  dayWindow,
  filterVisits,
  nextAction,
  preparationReasons,
} from "../../src/scheduling/field-technicians-view";

function visit(
  overrides: Partial<ScheduleAppointment> = {},
): ScheduleAppointment {
  return {
    id: "SYN-visit",
    display_number: "SYN-APPT-001",
    work_order_display_number: "SYN-WO-001",
    scope_summary: "SYN control inspection",
    site_name: "SYN nursery",
    status: "Confirmed",
    start_at: "2026-09-21T00:00:00Z",
    end_at: "2026-09-21T02:00:00Z",
    assignment_version: 2,
    dispatch_hold: false,
    scope_review_required: false,
    pack_requirement: "Acknowledged",
    assignments: [
      {
        id: "SYN-assignment",
        resource_id: "SYN-resource",
        name: "SYN Riley",
        active: true,
        assignment_version: 2,
      },
    ],
    ...overrides,
  } as ScheduleAppointment;
}
const filters = { search: "", person: "", status: "", sort: "time" };
test("retired crew never count as current assignments or match a technician search", () => {
  const row = visit({
    assignments: [
      { ...visit().assignments[0], active: false },
      { ...visit().assignments[0], assignment_version: 1 },
    ],
  });
  assert.equal(currentCrew(row).length, 0);
  assert.deepEqual(
    filterVisits([row], { ...filters, person: "SYN-resource" }),
    [],
  );
  assert.deepEqual(filterVisits([row], { ...filters, search: "Riley" }), []);
  assert.ok(preparationReasons(row).includes("Crew assignment needed"));
});
test("pack acknowledgement does not override a scope review or dispatch hold", () => {
  const row = visit({ scope_review_required: true, dispatch_hold: true });
  assert.deepEqual(preparationReasons(row), [
    "Scope review required",
    "Dispatch held",
  ]);
  assert.equal(nextAction(row), "Review preparation");
  assert.equal(nextAction(visit()), "Check dispatch readiness");
});
test("completed, submitted and cancelled visits retain their lifecycle instead of stale preparation flags", () => {
  for (const status of ["Completed", "CompletedPendingReview", "Cancelled"]) {
    const row = visit({
      status,
      dispatch_hold: true,
      pack_requirement: "ReviewRequired",
    });
    assert.deepEqual(preparationReasons(row), []);
    assert.deepEqual(filterVisits([row], filters, true), []);
    assert.equal(filterVisits([row], filters).length, 1);
  }
  assert.equal(
    nextAction(visit({ status: "CompletedPendingReview" })),
    "Review field submission",
  );
});
test("search and status combine, and chronological sorting keeps the input unchanged", () => {
  const rows = [
    visit({ id: "later", start_at: "2026-09-21T03:00:00Z" }),
    visit({ id: "earlier" }),
    visit({ status: "Cancelled" }),
  ];
  assert.deepEqual(
    filterVisits(rows, {
      ...filters,
      search: " nursery ",
      status: "Confirmed",
    }).map((v) => v.id),
    ["earlier", "later"],
  );
  assert.equal(rows[0].id, "later");
});
test("day windows respect local midnight including daylight saving changes and reject invalid dates", () => {
  const brisbane = dayWindow("2026-09-21", "Australia/Brisbane");
  assert.equal(brisbane.from, "2026-09-20T14:00:00.000Z");
  const spring = dayWindow("2026-10-04", "Australia/Sydney");
  assert.equal(Date.parse(spring.to) - Date.parse(spring.from), 23 * 3600000);
  assert.throws(() => dayWindow("2026-02-30", "Australia/Brisbane"));
  assert.throws(() => dayWindow("", "Australia/Brisbane"));
});
