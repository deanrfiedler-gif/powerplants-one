import assert from "node:assert/strict";
import { test } from "node:test";
import { maintenanceTestDates } from "../helpers/maintenance-dates";
import { occurrenceDates, planFields } from "../../src/maintenance/model";
import { planContent } from "../helpers/maintenance";

test("C1 fixture terms stay current beyond both former expiry dates with one six-monthly occurrence", () => {
  for (const instant of [
    "2026-11-12T14:00:00Z",
    "2027-03-12T00:00:00Z",
    "2028-02-29T00:00:00Z",
    "2028-12-31T14:00:00Z",
    "2035-12-31T14:00:00Z",
  ]) {
    const {
      today,
      agreement,
      connected: d,
    } = maintenanceTestDates(new Date(instant));
    assert.ok(agreement.effective_from <= "2026-01-01");
    assert.ok(agreement.effective_to >= today);
    assert.ok(d.due_date <= today);
    const plan = planFields({
      ...planContent("00000000-0000-4000-8000-000000000001"),
      interval: "SixMonthly",
      anchor: d.effective_from,
      effective_from: d.effective_from,
      timezone: "Australia/Brisbane",
      window_months: 12,
    });
    assert.deepEqual(occurrenceDates(plan, d.generation_from, d.effective_to), [
      d.occurrence,
    ]);
  }
});
test("C1 fixture dates use Brisbane's calendar across the UTC year boundary", () => {
  const before = maintenanceTestDates(new Date("2028-12-31T13:59:59Z"));
  const after = maintenanceTestDates(new Date("2028-12-31T14:00:00Z"));
  assert.equal(before.today, "2028-12-31");
  assert.equal(after.today, "2029-01-01");
  assert.equal(after.agreement.effective_to, "2031-12-31");
  assert.equal(after.connected.occurrence, "2029-07-01");
});
