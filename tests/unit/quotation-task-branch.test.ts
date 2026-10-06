import { createHash } from "node:crypto";
import { canonical } from "../../src/platform/operations";
import { materialInput } from "../../src/estimating/supply-followup/material-input";
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
test("explicit three-task branch direction supports all native FS/SS combinations and refuses every extra edge", () => {
  for (const first of ["FS", "SS"] as const)
    for (const second of ["FS", "SS"] as const) {
      const a = task("A"),
        b = { ...task("B"), dependencies: [{ task_id: "A", kind: first }] },
        c = { ...task("C"), dependencies: [{ task_id: "A", kind: second }] };
      const p = {
        project: { lifecycle: "Active" },
        task: a,
        successor: b,
        branchSuccessor: c,
        dependencies: [
          { task_id: "B", predecessor_id: "A", kind: first },
          { task_id: "C", predecessor_id: "A", kind: second },
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
        [...p.dependencies, { task_id: "C", predecessor_id: "B", kind: "SS" }],
      ])
        assert.ok(forecastHolds({ ...p, dependencies }).length);
      for (const key of ["successor", "branchSuccessor"] as const)
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
      assert.ok(forecastHolds({ ...p, branchSuccessor: a }).length);
      assert.ok(
        forecastHolds({ ...p, engineering: [{ id: "technical", version: 1 }] })
          .length,
      );
    }
});

test("0069 chain hash remains exact; branch payload is distinct and cannot select both topologies", () => {
  const id = "10000000-0000-4000-8000-000000000001";
  const value = {
    operation_id: id,
    schema_version: 1,
    reason: "SYN retained original",
    evidence: "SYN exact native evidence",
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

  const prior = {
    ...value,
    successor_task_id: "10000000-0000-4000-8000-000000000002",
    chain_end_task_id: "10000000-0000-4000-8000-000000000003",
  };
  const input = materialInput(id, "MaterialPropose", prior);
  assert.equal(Object.hasOwn(input, "branch_successor_task_id"), false);
  // Executed against unchanged #352 checked source 3a2e1c0 (same parser as merge 1ffcf653).
  assert.equal(
    createHash("sha256")
      .update(canonical({ command: "QuoteSupply:MaterialPropose", ...input }))
      .digest("hex"),
    "c2c009d53699bdc8499b7fe51068bcefa570060086e625549cc25d508b7c209e",
  );
  assert.throws(() =>
    materialInput(id, "MaterialPropose", {
      ...prior,
      branch_successor_task_id: prior.chain_end_task_id,
    }),
  );
  assert.throws(() =>
    materialInput(id, "MaterialPropose", {
      ...value,
      branch_successor_task_id: prior.chain_end_task_id,
    }),
  );
  const { chain_end_task_id, ...base } = prior;
  const branch = materialInput(id, "MaterialPropose", {
    ...base,
    branch_successor_task_id: chain_end_task_id,
  });
  assert.equal(Object.hasOwn(branch, "chain_end_task_id"), false);
  assert.notEqual(canonical(branch), canonical(input));
});
