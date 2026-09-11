import assert from "node:assert/strict";
import { test } from "node:test";
import { parseProject, parseTask } from "../../src/projects/validation";
import {
  addDays,
  columnBounds,
  defaultWidths,
  hasCycle,
  paneMaximum,
  scheduleIssues,
  sheetWidth,
  timelineRange,
  todayInZone,
  type Task,
} from "../../src/projects/model";
import { projectInput, taskInput } from "../helpers/projects";
const task = (input = taskInput()): Task => ({
  ...parseTask(projectInput().id, input),
  version: 1,
  owner_name: "SYN Coordinator",
});
test("r10 widths are independent of pane clipping, and the edge clearance remains reachable", () => {
  assert.equal(sheetWidth(defaultWidths.gantt), 632);
  const widths = { ...defaultWidths.gantt, owner: 150 };
  for (const pane of [240, 400, 632, 960]) {
    const hidden = Math.max(0, sheetWidth(widths) - pane);
    assert.equal(widths.owner, 150);
    assert.equal(
      hidden + Math.min(pane, sheetWidth(widths)),
      sheetWidth(widths),
    );
  }
  assert.equal(paneMaximum(1200), 840);
  assert.equal(paneMaximum(1920), 960);
  assert.deepEqual(columnBounds.start, [84, 220]);
  assert.equal(defaultWidths.list.owner, 168);
});
test("dates, milestones, progress and owner types are validated without the prototype's 2026–27 restriction", () => {
  const p = projectInput(),
    t = taskInput();
  assert.equal(parseProject(p).target_date, "2028-03-31");
  assert.equal(
    parseTask(p.id, { ...t, finish_date: "2030-12-31" }).finish_date,
    "2030-12-31",
  );
  for (const change of [
    { finish_date: "2026-02-30" },
    { start_date: null },
    { progress: 101 },
    { progress: 100 },
    { status: "Planned" },
    { milestone: true },
    { external_owner_id: p.id },
    { dependencies: [{ task_id: t.id, kind: "FS" }] },
    { finish_date: "9999-01-01" },
  ])
    assert.throws(() => parseTask(p.id, { ...t, ...change }));
  assert.equal(
    parseTask(p.id, {
      ...t,
      milestone: true,
      finish_date: t.start_date,
      progress: 100,
      status: "Complete",
    }).progress,
    100,
  );
  assert.equal(
    parseTask(p.id, { ...t, start_date: null, finish_date: null }).start_date,
    null,
  );
  assert.equal(
    parseTask(p.id, { ...t, note: "SYN first line\nSecond line" }).note,
    "SYN first line\nSecond line",
  );
});
test("FS uses the next weekday, SS permits the same date, and warnings never mutate dates", () => {
  const prior = task({ ...taskInput(), finish_date: "2026-09-18" }),
    next = task({
      ...taskInput(),
      start_date: "2026-09-18",
      finish_date: "2026-09-21",
      dependencies: [{ task_id: prior.id, kind: "FS" }],
    });
  const before = JSON.stringify(next);
  assert.match(scheduleIssues(next, [prior, next])[0], /21 Sept? 2026/);
  assert.equal(JSON.stringify(next), before);
  next.start_date = "2026-09-21";
  assert.deepEqual(scheduleIssues(next, [prior, next]), []);
  next.dependencies[0].kind = "SS";
  next.start_date = prior.start_date;
  assert.deepEqual(scheduleIssues(next, [prior, next]), []);
  prior.start_date = prior.finish_date = null;
  assert.match(scheduleIssues(next, [prior, next])[0], /Set dates/);
});
test("cycles across phases and duplicate predecessors are rejected", () => {
  const a = task(),
    b = task(),
    c = task();
  b.dependencies = [{ task_id: a.id, kind: "FS" }];
  c.dependencies = [{ task_id: b.id, kind: "SS" }];
  assert.equal(hasCycle([a, b, c]), false);
  a.dependencies = [{ task_id: c.id, kind: "FS" }];
  assert.equal(hasCycle([a, b, c]), true);
  const input = taskInput();
  input.dependencies = [
    { task_id: a.id, kind: "FS" },
    { task_id: a.id, kind: "SS" },
  ];
  assert.throws(() => parseTask(projectInput().id, input));
});
test("multi-year ranges, leap days and Today use calendar dates and the project's timezone", () => {
  const t = task();
  const range = timelineRange([t], "2026-09-10", "2028-03-31");
  assert.ok(range.days > 365);
  assert.equal(new Date(range.start).getUTCDay(), 1);
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(
    todayInZone("Australia/Brisbane", new Date("2026-09-10T15:00:00Z")),
    "2026-09-11",
  );
});
