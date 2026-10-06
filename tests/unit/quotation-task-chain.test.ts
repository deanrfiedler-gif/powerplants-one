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
test("exact three-task direction supports all native FS/SS combinations and refuses every extra edge", () => {
  for (const first of ["FS", "SS"] as const)
    for (const second of ["FS", "SS"] as const) {
      const a = task("A"),
        b = { ...task("B"), dependencies: [{ task_id: "A", kind: first }] },
        c = { ...task("C"), dependencies: [{ task_id: "B", kind: second }] };
      const p = {
        project: { lifecycle: "Active" },
        task: a,
        successor: b,
        chainEnd: c,
        dependencies: [
          { task_id: "B", predecessor_id: "A", kind: first },
          { task_id: "C", predecessor_id: "B", kind: second },
        ],
        engineering: [],
        stages: [],
      } as unknown as Awaited<ReturnType<typeof forecastPosition>>;
      assert.deepEqual(forecastHolds(p), []);
      for (const t of [b, c])
        assert.ok(
          scheduleIssues({ ...t, start_date: null, finish_date: null }, [
            a,
            b,
            c,
          ]).some((x) => x.includes("Set dates")),
        );
      for (const id of ["A", "B", "C"])
        for (const outgoing of [false, true]) {
          const edge = {
            task_id: outgoing ? "D" : id,
            predecessor_id: outgoing ? id : "D",
            kind: "FS",
          };
          assert.ok(
            forecastHolds({ ...p, dependencies: [...p.dependencies, edge] })
              .length,
          );
        }
      for (const dependencies of [
        p.dependencies.slice(0, 1),
        p.dependencies.slice(1),
        p.dependencies.map((d) => ({
          ...d,
          task_id: d.predecessor_id,
          predecessor_id: d.task_id,
        })),
        [...p.dependencies, { task_id: "C", predecessor_id: "A", kind: "SS" }],
      ])
        assert.ok(forecastHolds({ ...p, dependencies }).length);
      for (const key of ["successor", "chainEnd"] as const)
        for (const changed of [
          { status: "InProgress" as const, progress: 1 },
          { milestone: true },
          { owner_id: null },
          { start_date: null },
          { external_owner_id: "external" },
        ])
          assert.ok(
            forecastHolds({ ...p, [key]: { ...p[key]!, ...changed } }).length,
          );
      assert.ok(forecastHolds({ ...p, chainEnd: a }).length);
      assert.ok(
        forecastHolds({ ...p, engineering: [{ id: "technical", version: 1 }] })
          .length,
      );
    }
});
