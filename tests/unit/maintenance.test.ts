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
  completionRequirementEntries,
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
test("M-R1 six-monthly and yearly steps stay month-end safe and inside the 12-month window", () => {
  const plan = { ...planFields(planContent(CRM.company)), window_months: 12 };
  for (const interval of ["Monthly", "Quarterly", "SixMonthly", "Yearly"])
    assert.equal(planFields({ ...plan, interval }).interval, interval);
  for (const interval of ["Fortnightly", "Biannual", "sixmonthly", ""])
    assert.throws(() => planFields({ ...plan, interval }));
  const six = { ...plan, interval: "SixMonthly" as const, anchor: "2026-08-31" };
  assert.deepEqual(occurrenceDates(six, "2026-01-01", "2027-01-01"), ["2026-08-31"]);
  assert.deepEqual(occurrenceDates(six, "2026-09-01", "2027-09-01"), [
    "2027-02-28",
    "2027-08-31",
  ]);
  // The anchor never drifts: after a short February the next date returns to the month end.
  assert.deepEqual(occurrenceDates(six, "2027-02-01", "2028-02-01"), [
    "2027-02-28",
    "2027-08-31",
  ]);
  const yearly = { ...plan, interval: "Yearly" as const, anchor: "2028-02-29" };
  assert.deepEqual(occurrenceDates(yearly, "2028-01-01", "2029-01-01"), ["2028-02-29"]);
  assert.deepEqual(occurrenceDates(yearly, "2028-02-29", "2029-02-28"), [
    "2028-02-29",
    "2029-02-28",
  ]);
  assert.deepEqual(occurrenceDates(yearly, "2029-03-01", "2030-03-01"), ["2030-02-28"]);
  // A run never exceeds the plan's window, even for a Yearly plan.
  assert.throws(() => occurrenceDates(yearly, "2028-01-01", "2029-01-02"));
  assert.throws(() =>
    occurrenceDates({ ...yearly, window_months: 6 }, "2028-01-01", "2028-07-02"),
  );
  // Dates before the revision's effective date are not generated.
  assert.deepEqual(
    occurrenceDates({ ...yearly, effective_from: "2028-03-01" }, "2028-01-01", "2029-01-01"),
    [],
  );
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

// M1 review (PR #770): prepared Service scope entries take at most 1,000 characters each, but a
// retained plan requirement may hold 4,000. Every character outside whitespace survives, in order.
test("plan completion requirements become ordered scope entries without losing text", () => {
  const visible = (v: string) => v.replace(/\s/g, "");
  const check = (requirement: string, count: number) => {
    const entries = completionRequirementEntries(requirement);
    assert.equal(entries.length, count, `${requirement.length} characters`);
    for (const e of entries) {
      assert.ok(e.length >= 1 && e.length <= 1000, `${e.length}`);
      assert.equal(e, e.trim());
    }
    assert.equal(visible(entries.join("")), visible(requirement));
    return entries;
  };
  const words = (n: number) => "SYN reviewed outcome evidence ".repeat(Math.ceil(n / 30)).slice(0, n).trim();
  // Within the limit the requirement stays one unchanged entry.
  assert.deepEqual(check("x".repeat(1000), 1), ["x".repeat(1000)]);
  assert.deepEqual(check(words(1000), 1), [words(1000)]);
  // Unbroken text is cut exactly at 1,000; worded text breaks between words.
  assert.deepEqual(check("x".repeat(1001), 2), ["x".repeat(1000), "x"]);
  assert.equal(check("x".repeat(4000), 4).join(""), "x".repeat(4000));
  const worded = check(words(4000), 5);
  for (const e of worded.slice(0, -1)) assert.ok(!/\S$/.test(e) || /(SYN|reviewed|outcome|evidence)$/.test(e), e.slice(-20));
  assert.equal(worded.join(" "), words(4000));
  // Line breaks inside an entry are retained; an early lone space does not force a tiny entry.
  const lines = check(`${"a".repeat(600)}\n${"b".repeat(600)}`, 2);
  assert.deepEqual(lines, ["a".repeat(600), "b".repeat(600)]);
  assert.deepEqual(check(`a ${"x".repeat(1200)}`, 2).map((e) => e.length), [1000, 202]);
  // The worst case stays within the 20-entry scope limit.
  assert.ok(completionRequirementEntries(` ${"x".repeat(499)}`.repeat(8)).length <= 20);
});
