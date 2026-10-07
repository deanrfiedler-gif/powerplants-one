import assert from "node:assert/strict";
import { test } from "node:test";
import { materialInput } from "../../src/estimating/supply-followup/material-input";
import {
  forecastHolds,
  type forecastPosition,
} from "../../src/projects/material-resolution";
import { scheduleIssues, type Task } from "../../src/projects/model";
const task = (
  id: string,
  start_date = "2026-10-05",
  finish_date = "2026-10-09",
): Task => ({
  id,
  version: 1,
  title: id,
  phase: "Procurement",
  status: "Planned",
  milestone: false,
  start_date,
  finish_date,
  progress: 0,
  note: null,
  owner_id: "owner",
  external_owner_id: null,
  owner_name: "Owner",
  dependencies: [],
});
test("all sixteen FS/SS diamonds preserve both path constraints, and D needs one withdrawal", () => {
  for (let n = 0; n < 16; n++) {
    const kinds = Array.from(
      { length: 4 },
      (_, i) => (n & (1 << i) ? "SS" : "FS") as "FS" | "SS",
    );
    const a = task("A"),
      b = {
        ...task("B", "2026-10-12", "2026-10-16"),
        dependencies: [{ task_id: "A", kind: kinds[0] }],
      },
      c = {
        ...task("C", "2026-10-12", "2026-10-16"),
        dependencies: [{ task_id: "A", kind: kinds[1] }],
      },
      d = {
        ...task("D", "2026-10-19", "2026-10-23"),
        dependencies: [
          { task_id: "B", kind: kinds[2] },
          { task_id: "C", kind: kinds[3] },
        ],
      };
    const tasks = [a, b, c, d],
      dependencies = tasks.flatMap((t) =>
        t.dependencies.map((e) => ({
          task_id: t.id,
          predecessor_id: e.task_id,
          kind: e.kind,
        })),
      );
    const p = {
      project: { lifecycle: "Active" },
      task: a,
      diamond: { b, c, d },
      dependencies,
      engineering: [],
      stages: [],
    } as unknown as Awaited<ReturnType<typeof forecastPosition>>;
    assert.deepEqual(forecastHolds(p), []);
    for (const t of tasks) assert.deepEqual(scheduleIssues(t, tasks), []);
    // Native validation is immediate-edge and warning-based, not a scheduler.
    // Receiving propagates the unsupported forecast consequence over both paths.
    const aOnly = tasks.map((t) =>
      t.id === "A" ? { ...t, start_date: null, finish_date: null } : t,
    );
    assert.equal(scheduleIssues(aOnly[1], aOnly).length, 1);
    assert.equal(scheduleIssues(aOnly[2], aOnly).length, 1);
    assert.equal(scheduleIssues(aOnly[3], aOnly).length, 0);
    for (const key of ["B", "C"]) {
      const onePath = aOnly.map((t) =>
        t.id === key ? { ...t, start_date: null, finish_date: null } : t,
      );
      assert.equal(scheduleIssues(onePath[3], onePath).length, 1);
    }
    const withdrawn = tasks.map((t) => ({
      ...t,
      start_date: null,
      finish_date: null,
    }));
    assert.equal(scheduleIssues(withdrawn[1], withdrawn).length, 1);
    assert.equal(scheduleIssues(withdrawn[2], withdrawn).length, 1);
    assert.equal(scheduleIssues(withdrawn[3], withdrawn).length, 2);
    for (const id of ["A", "B", "C", "D"])
      for (const outgoing of [false, true])
        assert.ok(
          forecastHolds({
            ...p,
            dependencies: [
              ...dependencies,
              {
                task_id: outgoing ? "X" : id,
                predecessor_id: outgoing ? id : "X",
                kind: "FS",
              },
            ],
          }).length,
        );
    for (let i = 0; i < 4; i++) {
      assert.ok(
        forecastHolds({
          ...p,
          dependencies: dependencies.filter((_, j) => i !== j),
        }).length,
      );
      assert.ok(
        forecastHolds({
          ...p,
          dependencies: dependencies.map((e, j) =>
            i === j
              ? { ...e, task_id: e.predecessor_id, predecessor_id: e.task_id }
              : e,
          ),
        }).length,
      );
    }
    for (const [prior, next] of [
      ["B", "C"],
      ["C", "B"],
      ["A", "D"],
    ])
      assert.ok(
        forecastHolds({
          ...p,
          dependencies: [
            ...dependencies,
            { predecessor_id: prior, task_id: next, kind: "SS" },
          ],
        }).length,
      );
    for (const key of ["b", "c", "d"] as const)
      for (const change of [
        { start_date: null },
        { status: "InProgress", progress: 1 },
        { milestone: true },
        { owner_id: null },
        { external_owner_id: "external" },
      ])
        assert.ok(
          forecastHolds({
            ...p,
            diamond: {
              ...p.diamond!,
              [key]: { ...p.diamond![key], ...change },
            },
          }).length,
        );
  }
});
test("diamond fields are complete and exclusive; every earlier normalized input remains free of diamond meaning", () => {
  const id = "10000000-0000-4000-8000-000000000001",
    b = "10000000-0000-4000-8000-000000000002",
    c = "10000000-0000-4000-8000-000000000003",
    d = "10000000-0000-4000-8000-000000000004";
  const input = {
    operation_id: id,
    schema_version: 1,
    reason: "SYN exact",
    evidence: "SYN evidence",
    synthetic_only: true,
    target_id: id,
    execution_id: id,
    expected_sequence: 4,
    basis_hash: "a".repeat(64),
    referral_id: id,
    expected_material_sequence: 0,
    predecessor_id: null,
    allocation_outcome_id: id,
    demand_id: id,
    impact_id: id,
    task_id: id,
  };
  const fields = {
    diamond_b_task_id: b,
    diamond_c_task_id: c,
    diamond_d_task_id: d,
  };
  const parsed = materialInput(id, "MaterialPropose", { ...input, ...fields });
  assert.equal(parsed.diamond_d_task_id, d);
  for (const key of Object.keys(fields)) {
    const partial = { ...fields };
    delete partial[key as keyof typeof fields];
    assert.throws(() =>
      materialInput(id, "MaterialPropose", { ...input, ...partial }),
    );
  }
  for (const old of [
    {},
    { successor_task_id: b },
    { successor_task_id: b, chain_end_task_id: c },
    { successor_task_id: b, branch_successor_task_id: c },
    { merge_predecessor_task_id: b, merge_successor_task_id: c },
  ]) {
    const p = materialInput(id, "MaterialPropose", { ...input, ...old });
    for (const key of Object.keys(fields))
      assert.equal(Object.hasOwn(p, key), false);
    if (Object.keys(old).length)
      assert.throws(() =>
        materialInput(id, "MaterialPropose", { ...input, ...old, ...fields }),
      );
  }
});
