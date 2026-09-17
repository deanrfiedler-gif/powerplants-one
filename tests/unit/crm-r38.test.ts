import assert from "node:assert/strict";
import { test } from "node:test";
import type { WorklistItem } from "../../src/crm/worklist";
import { forecastGroups, needsAttention, worklistCsv } from "../../src/crm/worklist-presentation";
import { readWorklistLocation, worklistSearch } from "../../src/crm/worklist-location";

test("Forecast allocates every record once, with Brisbane date boundaries and explicit unknowns", () => {
  const items = ["2026-09-30", "2026-10-01", "2026-12-31", "2027-01-01", null].map((date, i) => ({ id: String(i), expected_close_date: date } as WorklistItem));
  const groups = forecastGroups(items, "2026-09-30T15:00:00Z", 3); // 1 October in Brisbane
  assert.deepEqual(groups.map(group => [group.label, group.items.map(item => item.id)]), [["Overdue", ["0"]], ["October 2026", ["1"]], ["November 2026", []], ["December 2026", ["2"]], ["Later", ["3"]], ["No close date", ["4"]]]);
  assert.equal(new Set(groups.flatMap(group => group.items.map(item => item.id))).size, items.length);
});
test("Forecast and Archive URLs restore their proper record populations without page credentials", () => {
  for (const view of ["Forecast", "Archive"]) {
    const location = readWorklistLocation(new URLSearchParams(`view=${view}&outcome=All&q=irrigation&sort=Title&cursor=private`));
    assert.equal(location.filters.outcome, view === "Forecast" ? "Open" : "Closed");
    assert.equal(location.filters.cursor, "");
    assert.deepEqual(readWorklistLocation(new URLSearchParams(worklistSearch(location))), location);
  }
  assert.equal(readWorklistLocation(new URLSearchParams("view=Archive&outcome=Won")).filters.outcome, "Won");
});
test("Triage excludes closed outcomes and distinguishes unavailable activity from missing follow-up", () => {
  assert.equal(needsAttention({ close_outcome: "Open", next_action_state: "Overdue" } as WorklistItem), true);
  assert.equal(needsAttention({ close_outcome: "Won", next_action_state: "Overdue" } as WorklistItem), false);
  assert.equal(needsAttention({ close_outcome: "Open", next_action_state: "Unavailable" } as WorklistItem), false);
});
test("CSV preserves exact cents and blank unknowns and neutralises spreadsheet formula text", () => {
  const csv = worklistCsv([{ display_number: "SYN-1", title: '=HYPERLINK("example")', organisation_name: "Growers, nursery", contact_name: null, owner_name: " +formula", stage_id: "Discovery", close_outcome: "Open", value_amount: "127500.50", expected_close_date: null, next_action_summary: "Line 1\nLine 2", action_owner_name: "Owner", due_at: null, version: 2 } as WorklistItem]);
  assert.ok(csv.includes('"\'=HYPERLINK(""example"")"'));
  assert.ok(csv.includes('"\' +formula"'));
  assert.ok(csv.includes('"127500.50",""'));
  assert.ok(csv.includes('"Growers, nursery"'));
});
