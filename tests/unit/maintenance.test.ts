import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agreementCurrentness,
  agreementFields,
  scopeIncludes,
  monthDate,
  occurrenceDates,
  planFields,
  supplierApproval,
  minorUnits,
  assessmentFields,
} from "../../src/maintenance/model";
import {
  agreementContent,
  planContent,
  CRM,
  asset,
} from "../helpers/maintenance";
test("month-end anchor survives short months, leap years, quarterly steps and year boundaries", () => {
  assert.equal(monthDate("2024-01-31", 1), "2024-02-29");
  assert.equal(monthDate("2024-01-31", 2), "2024-03-31");
  assert.equal(monthDate("2026-11-30", 3), "2027-02-28");
  assert.equal(monthDate("0099-01-31", 1), "0099-02-28");
  const plan = planFields(planContent(CRM.company));
  assert.deepEqual(occurrenceDates(plan, "2026-01-01", "2026-04-30"), [
    "2026-01-31",
    "2026-02-28",
    "2026-03-31",
    "2026-04-30",
  ]);
  assert.deepEqual(
    occurrenceDates(
      { ...plan, interval: "Quarterly" },
      "2026-02-01",
      "2026-08-01",
    ),
    ["2026-04-30", "2026-07-31"],
  );
  assert.throws(() => occurrenceDates(plan, "2026-01-01", "2028-01-01"));
  assert.throws(() => planFields({ ...plan, timezone: "Made/Up" }));
  assert.throws(() => planFields({ ...plan, interval: "Daily" }));
});
test("agreement currentness, selected areas and explicit exclusions never imply broad coverage", () => {
  const a = agreementFields(agreementContent());
  assert.equal(agreementCurrentness("Proposed", a, "2026-02-01"), "Proposed");
  assert.equal(agreementCurrentness("Active", a, "2029-01-01"), "Expired");
  assert.equal(scopeIncludes(a, CRM.site, asset, null), true);
  assert.equal(scopeIncludes(a, CRM.site, CRM.org, null), false);
  a.sites[0].excluded_asset_ids = [asset];
  assert.equal(scopeIncludes(a, CRM.site, asset, null), false);
  a.sites[0].excluded_asset_ids = [];
  a.sites[0].mode = "SelectedFacilities";
  a.sites[0].facility_ids = [CRM.company];
  assert.equal(scopeIncludes(a, CRM.site, asset, null), false);
  assert.equal(scopeIncludes(a, CRM.site, asset, CRM.company), true);
});
test("unresolved assessment ownership and exact integer supplier amounts", () => {
  assert.throws(() =>
    assessmentFields({ status: "Unknown", review_due: null }),
  );
  assert.throws(() => minorUnits(1.25, "amount"));
  assert.throws(() => minorUnits(Number.MAX_SAFE_INTEGER, "amount"));
  assert.throws(() => supplierApproval("PartiallyApproved", 1000, 1000, 0));
  assert.throws(() => supplierApproval("Rejected", 0, 1000, 1));
  assert.doesNotThrow(() =>
    supplierApproval("PartiallyApproved", 500, 1000, 250),
  );
});
