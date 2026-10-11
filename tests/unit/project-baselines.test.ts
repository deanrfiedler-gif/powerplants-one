import assert from "node:assert/strict";
import { test } from "node:test";
import {
  affectedSuccessors,
  compareBaseline,
} from "../../src/projects/baseline-model";
import { scheduleIssues, type Task } from "../../src/projects/model";
const task = (
  id: string,
  start = "2028-02-28",
  finish: string | null = start,
): Task => ({
  id,
  version: 1,
  title: id,
  phase: "Planning",
  status: "Planned",
  milestone: false,
  start_date: finish ? start : null,
  finish_date: finish,
  progress: 0,
  note: null,
  owner_id: null,
  external_owner_id: null,
  owner_name: null,
  dependencies: [],
});
test("calendar-day deltas cover leap days, weekends, early dates and unscheduled/new tasks", () => {
  const baseline = [
    task("leap"),
    task("weekend", "2026-10-09"),
    task("early"),
    task("undated"),
  ];
  const current = [
    task("leap", "2028-03-01"),
    task("weekend", "2026-10-12"),
    task("early", "2028-02-27"),
    task("undated", "", null),
    task("new"),
  ];
  const rows = compareBaseline(baseline, current);
  assert.deepEqual(
    rows.map((r) => r.finish_days),
    [2, 3, -1, null, null],
  );
  assert.equal(rows[4].original, null);
  assert.equal(compareBaseline(baseline, baseline)[0].changed, false);
});
test("diamond impact follows both old and new links once without predicting automatic shifts", () => {
  const a = task("a"),
    b = { ...task("b"), dependencies: [{ task_id: "a", kind: "FS" as const }] };
  const c = {
    ...task("c"),
    dependencies: [{ task_id: "a", kind: "SS" as const }],
  };
  const d = {
    ...task("d"),
    dependencies: [
      { task_id: "b", kind: "FS" as const },
      { task_id: "c", kind: "FS" as const },
    ],
  };
  const old = [a, b, c, d],
    now = [
      { ...a, finish_date: "2028-03-01" },
      b,
      { ...c, dependencies: [] },
      d,
    ];
  assert.deepEqual([...affectedSuccessors(["a"], old, now)].sort(), [
    "b",
    "c",
    "d",
  ]);
  const rows = compareBaseline(old, now);
  assert.equal(rows[2].dependencies_changed, true);
  assert.equal(rows[3].affected, true);
  assert.equal(rows[3].finish_days, 0);
  assert.deepEqual(now[3], d);
  assert.equal(scheduleIssues(b, now).length, 1);
});
test("dependency order is immaterial and malformed cyclic review graphs terminate", () => {
  const a = task("a"),
    b = task("b"),
    c = {
      ...task("c"),
      dependencies: [
        { task_id: "a", kind: "FS" as const },
        { task_id: "b", kind: "SS" as const },
      ],
    };
  assert.equal(
    compareBaseline(
      [c],
      [{ ...c, dependencies: [...c.dependencies].reverse() }],
    )[0].changed,
    false,
  );
  a.dependencies = [{ task_id: "b", kind: "FS" }];
  b.dependencies = [{ task_id: "a", kind: "FS" }];
  assert.deepEqual([...affectedSuccessors(["a"], [a, b])], ["b"]);
});
