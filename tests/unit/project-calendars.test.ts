import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  calendarIssues,
  defaultCalendar,
  isWorkingDate,
  nextWorkingDate,
  workingDuration,
  workingVariance,
} from "../../src/projects/calendar-model";
import {
  parseCalendar,
  parseActuals,
} from "../../src/projects/programme-validation";
import { addDays, type Task } from "../../src/projects/model";
const calendar = defaultCalendar("Australia/Brisbane");
test("inclusive working duration and signed variance preserve unknowns, leap days and date-only DST boundaries", () => {
  assert.equal(workingDuration("2024-02-28", "2024-03-01", calendar), 3);
  assert.equal(
    workingDuration("2026-10-02", "2026-10-05", {
      ...calendar,
      timezone: "Australia/Sydney",
    }),
    2,
  );
  assert.equal(workingDuration(null, "2026-10-05", calendar), null);
  assert.equal(workingDuration("2026-10-06", "2026-10-05", calendar), null);
  assert.equal(workingDuration("2026-10-03", "2026-10-04", calendar), 0);
  assert.equal(workingVariance("2026-10-02", "2026-10-05", calendar), 1);
  assert.equal(workingVariance("2026-10-05", "2026-10-02", calendar), -1);
  assert.equal(workingVariance("2026-10-02", "2026-10-02", calendar), 0);
  assert.equal(workingVariance(null, "2026-10-02", calendar), null);
});
test("explicit holiday and working Saturday override the normal week without mutating it", () => {
  const custom = {
    ...calendar,
    exceptions: [
      { date: "2026-10-05", working: false, reason: "SYN holiday" },
      { date: "2026-10-03", working: true, reason: "SYN Saturday" },
    ],
  };
  assert.equal(nextWorkingDate("2026-10-02", custom), "2026-10-03");
  assert.equal(nextWorkingDate("2026-10-03", custom), "2026-10-06");
  assert.equal(workingDuration("2026-10-02", "2026-10-06", custom), 3);
  assert.equal(isWorkingDate("2026-10-05", custom), false);
  assert.equal(isWorkingDate("2026-10-05", calendar), true);
});
test("sparse calendar survives 366 blocked weekly working dates and upper date boundary", () => {
  const custom = {
    ...calendar,
    weekdays: [1],
    exceptions: Array.from({ length: 366 }, (_, i) => ({
      date: addDays("2026-10-05", i * 7),
      working: false,
      reason: "SYN closure",
    })),
  };
  assert.equal(
    nextWorkingDate("2026-10-04", custom),
    addDays("2026-10-05", 366 * 7),
  );
  assert.equal(nextWorkingDate("9998-12-31", calendar), null);
  assert.ok(workingDuration("0001-01-01", "9998-12-31", calendar)! > 2_000_000);
});
test("FS uses successor working date; SS retains predecessor start; warnings never move dates", () => {
  const prior = {
    id: "prior",
    start_date: "2026-10-02",
    finish_date: "2026-10-02",
    dependencies: [],
  } as unknown as Task;
  const task = {
    id: "next",
    start_date: "2026-10-05",
    finish_date: "2026-10-06",
    dependencies: [{ task_id: "prior", kind: "FS" }],
  } as Task;
  const custom = {
    ...calendar,
    exceptions: [{ date: "2026-10-05", working: false, reason: "SYN holiday" }],
  };
  assert.deepEqual(
    calendarIssues(task, [prior, task], custom).map((i) => i.code),
    ["NonworkingEndpoint", "DependencyStartBeforeRequired"],
  );
  assert.equal(
    calendarIssues(task, [prior, task], custom)[1].earliest_start,
    "2026-10-06",
  );
  assert.equal(task.start_date, "2026-10-05");
  assert.equal(
    calendarIssues(
      { ...task, dependencies: [{ task_id: "prior", kind: "SS" }] },
      [prior],
      custom,
    ).length,
    1,
  );
});
test("strict calendar and actual input rejects ambiguous dates, duplicates, unsupported fields and missing review", () => {
  const base = {
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "SYN reviewed",
    expected_version: 2,
    expected_revision: 0,
  };
  const input = {
    ...base,
    name: "SYN calendar",
    weekdays: [5, 1],
    exceptions: [],
    reviewed: true,
  };
  assert.deepEqual(parseCalendar(randomUUID(), input).weekdays, [1, 5]);
  for (const patch of [
    { weekdays: [] },
    { weekdays: [1, 1] },
    { weekdays: [8] },
    { reviewed: false },
    { hours: 8 },
    {
      exceptions: [
        { date: "2026-02-29", working: false, reason: "SYN invalid" },
      ],
    },
  ])
    assert.throws(() => parseCalendar(randomUUID(), { ...input, ...patch }));
  const actual = {
    ...base,
    expected_task_version: 1,
    actual_start: null,
    actual_finish: null,
  };
  assert.equal(
    parseActuals(randomUUID(), randomUUID(), actual).actual_start,
    null,
  );
  for (const patch of [
    { actual_finish: "2026-10-01" },
    { actual_start: "2026-10-02", actual_finish: "2026-10-01" },
    { actual_start: undefined },
    { actual_start: "0000-01-01" },
  ])
    assert.throws(() =>
      parseActuals(randomUUID(), randomUUID(), { ...actual, ...patch }),
    );
});
