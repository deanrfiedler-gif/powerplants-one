import assert from "node:assert/strict";
import { test } from "node:test";
import {
  forecastHolds,
  forecastPosition,
} from "../../src/projects/material-resolution";
import { scheduleIssues, type Task } from "../../src/projects/model";
const task = (id: string): Task => ({
  id,
  version: 1,
  title: id,
  phase: "Procurement",
  status: "Planned",
  milestone: false,
  start_date: "2026-10-05",
  finish_date: "2026-10-09",
  progress: 0,
  note: null,
  owner_id: "owner",
  external_owner_id: null,
  owner_name: "Owner",
  dependencies: [],
});
test("native dependency direction, weekday bound and missing dates remain explicit for a received pair", () => {
  const a = task("A"),
    b = { ...task("B"), dependencies: [{ task_id: "A", kind: "FS" as const }] };
  const p = {
    project: { lifecycle: "Active" },
    task: a,
    successor: b,
    dependencies: [{ task_id: "B", predecessor_id: "A", kind: "FS" }],
    engineering: [],
    stages: [],
  } as unknown as Awaited<ReturnType<typeof forecastPosition>>;
  assert.deepEqual(forecastHolds(p), []);
  assert.ok(scheduleIssues(b, [a, b])[0].includes("12 Oct 2026"));
  assert.ok(
    scheduleIssues({ ...b, start_date: null, finish_date: null }, [
      { ...a, start_date: null, finish_date: null },
      b,
    ])[0].includes("Set dates"),
  );
  assert.ok(
    forecastHolds({
      ...p,
      dependencies: [{ task_id: "A", predecessor_id: "B", kind: "FS" }],
    }).some((x) => x.includes("reversed")),
  );
  assert.ok(
    forecastHolds({
      ...p,
      dependencies: [
        ...p.dependencies,
        { task_id: "C", predecessor_id: "B", kind: "SS" },
      ],
    }).some((x) => x.includes("additional")),
  );
  for (const changed of [
    { status: "InProgress" as const, progress: 1 },
    { milestone: true },
    { owner_id: null },
    { start_date: null },
    { external_owner_id: "external" },
  ])
    assert.ok(
      forecastHolds({ ...p, successor: { ...b, ...changed } }).some((x) =>
        x.includes("successor must"),
      ),
    );
  assert.deepEqual(
    forecastHolds({
      ...p,
      dependencies: [{ task_id: "B", predecessor_id: "A", kind: "SS" }],
    }),
    [],
  );
});
