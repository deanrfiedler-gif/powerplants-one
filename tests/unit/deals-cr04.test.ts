import assert from "node:assert/strict";
import { test } from "node:test";
import {
  selectedDeals,
  selectedWorklistCsv,
  selectionBasis,
} from "../../src/crm/worklist-columns";
import {
  forecastGroups,
  activityDueLabel,
  needsAttention,
} from "../../src/crm/worklist-presentation";
import { valueSummary } from "../../src/crm/value-summary";
import {
  dealsDesignRecords,
  dealsDesignAsOf,
} from "../helpers/deals-accepted-fixture";

test("CR-04 selected CSV uses current permitted page order, chosen columns, exact cents and blank unknowns", () => {
  const rows = dealsDesignRecords.slice(0, 4).map((r) => ({ ...r }));
  rows[0].title = '=HYPERLINK("synthetic")';
  rows[1].value_amount = "0.00";
  const ids = [rows[3].id, rows[0].id, "missing", rows[1].id, rows[0].id];
  assert.deepEqual(
    selectedDeals(rows, ids).map((r) => r.id),
    [rows[0].id, rows[1].id, rows[3].id],
  );
  const csv = selectedWorklistCsv(rows, ids, ["title", "value"]);
  assert.ok(csv.startsWith('\ufeff"Deal","Value AUD excl. GST"'));
  assert.ok(csv.includes('"\'=HYPERLINK(""synthetic"")","125000.00"'));
  assert.ok(csv.includes('"0.00"'));
  assert.ok(csv.endsWith(',""'));
  assert.ok(!csv.includes("Organisation"));
  const basis = selectionBasis(rows);
  assert.notEqual(selectionBasis(rows.slice(1)), basis);
  assert.notEqual(
    selectionBasis(rows.map((r, i) => (i ? r : { ...r, can_edit: false }))),
    basis,
  );
  assert.notEqual(
    selectionBasis(
      rows.map((r, i) => (i ? r : { ...r, version: r.version + 1 })),
    ),
    basis,
  );
});
test("CR-04 accepted fixture continuity and forecast denominators include every deal exactly once", () => {
  assert.equal(dealsDesignRecords.length, 18);
  assert.deepEqual(valueSummary(dealsDesignRecords), {
    formatted: "$1,189,150.50",
    unknown: 2,
  });
  assert.equal(dealsDesignRecords.filter(needsAttention).length, 3);
  const potting = dealsDesignRecords.find(
    (r) => r.display_number === "SYN-PPO-OPP-000326",
  )!;
  assert.equal(potting.owner_name, "Sasha Clarke");
  assert.equal(potting.organisation_name, "SYN Woodhaven Nursery, NSW");
  assert.equal(potting.next_action_state, "Upcoming");
  assert.equal(potting.due_at, "2026-10-15T23:00:00.000Z");
  const groups = forecastGroups(dealsDesignRecords, dealsDesignAsOf);
  assert.deepEqual(
    groups.map((g) => [g.label, g.items.length]),
    [
      ["Overdue", 2],
      ["October 2026", 5],
      ["November 2026", 7],
      ["December 2026", 4],
    ],
  );
  assert.equal(
    new Set(groups.flatMap((g) => g.items.map((r) => r.id))).size,
    18,
  );
  for (const group of groups) {
    const stages = [...new Set(group.items.map((r) => r.stage_id))];
    assert.equal(
      stages.reduce(
        (n, s) => n + group.items.filter((r) => r.stage_id === s).length,
        0,
      ),
      group.items.length,
    );
  }
});

test("CR-04 activity wording follows the observed Brisbane date, including midnight and unknown dates", () => {
  const row = {
    ...dealsDesignRecords[0],
    next_action_state: "Upcoming" as const,
    due_at: "2026-10-15T14:00:00.000Z",
  };
  assert.equal(
    activityDueLabel(row, "2026-10-15T13:59:59.000Z"),
    "Due in 1 day",
  );
  assert.equal(activityDueLabel(row, "2026-10-15T14:00:00.000Z"), "Due today");
  assert.equal(
    activityDueLabel(
      { ...row, next_action_state: "Overdue" },
      "2026-10-16T14:00:00.000Z",
    ),
    "Overdue by 1 day",
  );
  assert.equal(
    activityDueLabel({ ...row, due_at: null }, dealsDesignAsOf),
    "Due date needed",
  );
});
