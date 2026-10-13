import assert from "node:assert/strict";
import { test } from "node:test";
import {
  projectCsv,
  type ProjectRegisterRow,
} from "../../src/projects/register-model";
import { todayInZone } from "../../src/projects/model";
test("CSV exports exact permitted columns, quoted content and safe spreadsheet text", () => {
  const csv = projectCsv([
    {
      title: '=HYPERLINK("https://example.invalid")',
      next_milestone: null,
      target_date: null,
      at_risk: 2,
      customer_name: "SYN, nursery",
      site_name: "SYN\nSite",
      coordinator_name: "+1",
      lifecycle: "Active",
      display_number: "SYN-PPO-PRJ-01",
    } as ProjectRegisterRow,
  ]);
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.invalid"")"'));
  assert.ok(csv.includes('"SYN, nursery"'));
  assert.ok(csv.includes('"\'+1"'));
  assert.ok(csv.includes('"Not set"'));
  assert.equal(projectCsv([]).split("\r\n").length, 1);
});
test("overdue basis distinguishes the site's local calendar day from UTC", () => {
  const now = new Date("2026-10-12T14:30:00Z");
  assert.equal(todayInZone("Australia/Brisbane", now), "2026-10-13");
  assert.equal(todayInZone("Pacific/Honolulu", now), "2026-10-12");
});
