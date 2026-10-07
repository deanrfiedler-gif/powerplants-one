import assert from "node:assert/strict";
import { executeMaterial } from "../../src/estimating/supply-followup/material-service";
import { database } from "../../src/platform/database";
import { readSchedule, saveTask } from "../../src/projects/service";
import { taskInput } from "./projects";
import {
  materialApply,
  materialFixture,
  materialProposal,
  materialReview,
  receiveMaterial,
} from "./quotation-material-resolution";
import { currentFollowup } from "./quotation-supply-followup";
export const conflict = (e: unknown) =>
  (e as { code: string }).code === "SupplyFollowupConflict";
export async function fixture(
  kind: "FS" | "SS" = "FS",
  unrelated = false,
  kind2: "FS" | "SS" = "SS",
  kind3: "FS" | "SS" = "FS",
  kind4: "FS" | "SS" = "SS",
) {
  const f = await materialFixture();
  const b = {
    ...taskInput(2),
    title: "SYN diamond B",
    start_date: "2027-12-01",
    finish_date: "2027-12-10",
    owner_id: f.owner.actor_id,
    status: "Planned",
    progress: 0,
    dependencies: [{ task_id: f.task.id, kind }],
  };
  await saveTask(f.owner, f.project.id, b);
  const c = {
    ...taskInput(3),
    title: "SYN diamond C",
    start_date: "2027-12-01",
    finish_date: "2027-12-10",
    owner_id: f.owner.actor_id,
    status: "Planned",
    progress: 0,
    dependencies: [{ task_id: f.task.id, kind: kind2 }],
  };
  await saveTask(f.owner, f.project.id, c);
  const d = {
    ...taskInput(4),
    title: "SYN shared successor D",
    start_date: "2027-12-13",
    finish_date: "2027-12-17",
    owner_id: f.owner.actor_id,
    status: "Planned",
    progress: 0,
    dependencies: [
      { task_id: b.id, kind: kind3 },
      { task_id: c.id, kind: kind4 },
    ],
  };
  await saveTask(f.owner, f.project.id, d);
  if (unrelated)
    await saveTask(f.owner, f.project.id, {
      ...taskInput(5),
      title: "SYN unrelated task",
      owner_id: f.owner.actor_id,
    });
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(await currentFollowup(f), f.task.id),
    diamond_b_task_id: b.id,
    diamond_c_task_id: c.id,
    diamond_d_task_id: d.id,
  });
  return { ...f, b, c, d };
}
export const roles = [
  "Demand",
  "Project",
  "Task",
  "MaterialAction",
  "DiamondB",
  "DiamondC",
  "DiamondD",
] as const;
export const rows = async (table: string) =>
  (
    await database().query(
      `SELECT to_jsonb(t) value FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
    )
  ).rows;
// Dependency writes are native task saves: the database also requires the exact
// schedule snapshot. Separate graph-specific assertions prove fresh edge inspection.
export async function changeDependencies(
  f: Awaited<ReturnType<typeof fixture>>,
  id: string,
  dependencies: { task_id: string; kind: "FS" | "SS" }[],
) {
  const schedule = await readSchedule(f.owner, f.project.id);
  const task = schedule.tasks.find((t) => t.id === id)!;
  await saveTask(f.owner, f.project.id, {
    ...taskInput(schedule.project.version),
    id,
    title: task.title,
    phase: task.phase,
    status: task.status,
    milestone: task.milestone,
    progress: task.progress,
    start_date: task.start_date,
    finish_date: task.finish_date,
    note: task.note,
    owner_id: task.owner_id,
    external_owner_id: task.external_owner_id,
    dependencies,
  });
}
export async function freezeDiamond(f: Awaited<ReturnType<typeof fixture>>) {
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(await currentFollowup(f), f.task.id),
    diamond_b_task_id: f.b.id,
    diamond_c_task_id: f.c.id,
    diamond_d_task_id: f.d.id,
  });
  await receiveMaterial(f);
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(await currentFollowup(f)),
  );
  return materialApply(await currentFollowup(f));
}
export async function assertGraphRefusal(
  f: Awaited<ReturnType<typeof fixture>>,
  command: ReturnType<typeof materialApply>,
) {
  const before = await readSchedule(f.owner, f.project.id);
  const t = await currentFollowup(f);
  assert.ok(t.material_resolution.holds.length);
  assert.ok(
    t.material_resolution.native_holds.some((h) => h.includes("additional")),
  );
  assert.equal(t.material_resolution.can_apply, false);
  await assert.rejects(
    executeMaterial(f.owner, f.id, "MaterialApply", command),
    conflict,
  );
  const after = await readSchedule(f.owner, f.project.id);
  assert.deepEqual(after.project, before.project);
  assert.deepEqual(after.tasks, before.tasks);
  assert.equal((await currentFollowup(f)).material_resolution.applied, null);
}
