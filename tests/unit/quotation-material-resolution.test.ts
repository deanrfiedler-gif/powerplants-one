import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  materialInput,
  materialRoles,
} from "../../src/estimating/supply-followup/material-input";
import { forecastHolds } from "../../src/projects/material-resolution";
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN exact consequence",
  evidence: "SYN current native evidence",
  synthetic_only: true,
  target_id: randomUUID(),
  execution_id: randomUUID(),
  expected_sequence: 4,
  basis_hash: "a".repeat(64),
  referral_id: randomUUID(),
  expected_material_sequence: 0,
  predecessor_id: null,
});
test("material proposal retains exact target/outcome/Impact and refuses invented authority or direct native fields", () => {
  const id = randomUUID(),
    cmd = {
      ...base(),
      allocation_outcome_id: randomUUID(),
      demand_id: randomUUID(),
      impact_id: randomUUID(),
      task_id: randomUUID(),
    };
  assert.equal(
    materialInput(id, "MaterialPropose", cmd).impact_id,
    cmd.impact_id,
  );
  for (const change of [
    { impact_id: null },
    { demand_id: null },
    { task_id: null },
    { allocation_outcome_id: null },
    { synthetic_only: false },
    { expected_material_sequence: -1 },
    { expected_material_sequence: 0.5 },
    { start_date: null },
    { authority: "Approved" },
    { receiving_id: randomUUID() },
  ])
    assert.throws(() =>
      materialInput(id, "MaterialPropose", { ...cmd, ...change }),
    );
});
test("each downstream role receives separately; neither Receipt acceptance nor Activity completion is a decision", () => {
  const id = randomUUID(),
    cmd = {
      ...base(),
      proposal_id: randomUUID(),
      proposal_hash: "b".repeat(64),
      role: "Demand",
      decision: "Accepted",
    };
  for (const role of materialRoles)
    for (const decision of ["Accepted", "Returned", "Held"])
      assert.equal(
        materialInput(id, "MaterialReceive", { ...cmd, role, decision })
          .decision,
        decision,
      );
  for (const change of [
    { role: "All" },
    { decision: "ReceiptAccepted" },
    { decision: "Completed" },
    { decision: "Reviewed" },
    { proposal_hash: "" },
    { owner_id: randomUUID() },
  ])
    assert.throws(() =>
      materialInput(id, "MaterialReceive", { ...cmd, ...change }),
    );
});
test("native forecast lower bound and consequential dependencies cannot be bypassed with review labels", () => {
  const position = {
    project: { lifecycle: "Active" },
    task: {
      id: randomUUID(),
      status: "Planned",
      progress: 0,
      milestone: false,
      owner_id: randomUUID(),
      external_owner_id: null,
      start_date: "2026-10-07",
      finish_date: "2026-10-08",
    },
    dependencies: [],
    engineering: [],
    stages: [],
  } as unknown as Parameters<typeof forecastHolds>[0];
  assert.deepEqual(forecastHolds(position), []);
  const changes: Partial<typeof position.task>[] = [
    { status: "InProgress" },
    { status: "Complete" },
    { progress: 1 },
    { milestone: true },
    { owner_id: null },
    { start_date: null },
    { finish_date: null },
    { external_owner_id: randomUUID() },
  ];
  for (const task of changes)
    assert.ok(
      forecastHolds({ ...position, task: { ...position.task, ...task } })
        .length,
    );
  for (const positionChange of [
    { project: { ...position.project, lifecycle: "Closed" as const } },
    {
      dependencies: [
        { task_id: position.task.id, predecessor_id: randomUUID(), kind: "FS" },
      ],
    },
    {
      dependencies: [
        { task_id: randomUUID(), predecessor_id: position.task.id, kind: "FS" },
      ],
    },
    { engineering: [{ id: randomUUID(), version: 1 }] },
    { stages: [{ id: randomUUID(), version: 1, owner_id: randomUUID() }] },
  ])
    assert.ok(forecastHolds({ ...position, ...positionChange }).length);
});
