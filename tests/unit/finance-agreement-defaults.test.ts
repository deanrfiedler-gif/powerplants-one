import assert from "node:assert/strict";
import { test } from "node:test";
import { workAllocationReason } from "../../src/finance/work-allocation-defaults";
const defaults = {
  disposition: "NonBillable",
  reason: "Covered by agreement SYN-AGR-0001",
  target_group: null,
} as const;
test("M2 covered NonBillable defaults retain source reference; deliberate exceptions require a reason", () => {
  assert.equal(
    workAllocationReason(defaults, "NonBillable", null),
    defaults.reason,
  );
  const reason = "Consumable excluded from agreement schedule 2";
  assert.equal(workAllocationReason(defaults, "Billable", reason), reason);
  assert.equal(workAllocationReason(defaults, "NonBillable", reason), reason);
  for (const disposition of [
    "Billable",
    "Pending",
    "WarrantyReview",
    "GoodwillReview",
  ])
    assert.throws(() => workAllocationReason(defaults, disposition, null));
  assert.throws(() => workAllocationReason(null, "NonBillable", null));
});
