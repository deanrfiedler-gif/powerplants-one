import assert from "node:assert/strict";
import { test } from "node:test";
import { overviewSchedule } from "../../src/projects/overview-model";
import { todayInZone, type Task } from "../../src/projects/model";
import {
  projectCalendar,
  type Baseline,
} from "../../src/projects/baseline-model";
const task = (id: string, extra: Partial<Task> = {}): Task => ({
  id,
  version: 1,
  title: id,
  phase: "Planning",
  status: "Planned",
  milestone: false,
  start_date: "2026-10-12",
  finish_date: "2026-10-13",
  progress: 0,
  note: null,
  owner_id: null,
  external_owner_id: null,
  owner_name: null,
  dependencies: [],
  ...extra,
});
const baseline = (snapshot: Task[]): Baseline => ({
  id: "baseline",
  revision: 1,
  project_version: 2,
  label: "Original",
  reason: "Review",
  created_at: "2026-10-10T00:00:00Z",
  actor_name: "SYN coordinator",
  calendar_key: projectCalendar,
  snapshot,
});
test("PJ02 dates use the site day, preserve calendar-day signs and keep incomplete forecasts unknown", () => {
  const now = new Date("2026-10-12T14:30:00Z");
  assert.equal(todayInZone("Australia/Brisbane", now), "2026-10-13");
  assert.equal(todayInZone("America/Los_Angeles", now), "2026-10-12");
  const saved = baseline([task("a", { finish_date: "2026-10-11" })]);
  const summary = overviewSchedule(
    [task("a")],
    saved,
    "2026-10-13",
    "2026-10-16",
  );
  assert.equal(summary.dates.forecast_minus_baseline_days, 2);
  assert.equal(summary.dates.target_minus_forecast_days, 3);
  const unknown = overviewSchedule(
    [task("a"), task("b", { start_date: null, finish_date: null })],
    saved,
    "2026-10-13",
    "2026-10-16",
  );
  assert.equal(unknown.dates.forecast_finish, null);
  assert.equal(unknown.dates.start, null);
  assert.equal(unknown.dates.forecast_minus_baseline_days, null);
  assert.equal(unknown.dates.undated_tasks, 1);
  assert.equal(
    overviewSchedule([], null, "2026-10-13", null).dates.completeness,
    "Incomplete",
  );
});
test("PJ02 attention retains independent causes and transitive successors without classifying complete or due-today milestones overdue", () => {
  const tasks = [
    task("a", { milestone: true, status: "AtRisk", finish_date: "2026-10-12" }),
    task("b", { dependencies: [{ task_id: "a", kind: "FS" }] }),
    task("c", { dependencies: [{ task_id: "b", kind: "SS" }] }),
    task("d", {
      milestone: true,
      status: "Complete",
      progress: 100,
      finish_date: "2026-10-01",
    }),
    task("e", { milestone: true }),
  ];
  const original = structuredClone(tasks),
    read = overviewSchedule(tasks, baseline(tasks), "2026-10-13", null);
  assert.deepEqual(
    read.attention.map((x) => [x.task.id, x.reasons]),
    [
      ["a", ["OverdueMilestone", "AtRiskTask"]],
      ["b", ["SuccessorReview"]],
      ["c", ["SuccessorReview"]],
    ],
  );
  assert.equal(read.phases[0].total, 5);
  assert.equal(read.phases[0].complete, 1);
  assert.deepEqual(tasks, original);
});
