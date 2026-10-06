import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { executeMaterial } from "../../src/estimating/supply-followup/material-service";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import {
  createProject,
  readSchedule,
  saveTask,
} from "../../src/projects/service";
import { readOperation } from "../../src/shared/receipts";
import { taskInput } from "../helpers/projects";
import {
  materialApply,
  materialProposal,
  materialReview,
  receiveMaterial,
} from "../helpers/quotation-material-resolution";
import { currentFollowup } from "../helpers/quotation-supply-followup";
import {
  assertGraphRefusal,
  changeDependencies,
  conflict,
  fixture,
  freezeDiamond,
  rows,
} from "../helpers/quotation-task-diamond";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
for (const failure of [
  "FirstTask",
  "SecondTask",
  "ThirdTask",
  "FourthTask",
  "Impact",
  "Outcome",
] as const)
  test(`late ${failure} refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds`, async () => {
    const f = await fixture();
    await receiveMaterial(f);
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReview",
      materialReview(await currentFollowup(f)),
    );
    const t = await currentFollowup(f),
      cmd = materialApply(t),
      prop = t.material_resolution.proposal!;
    const tables = [
      "business_identities",
      "reference_counters",
      "projects",
      "project_tasks",
      "project_dependencies",
      "project_schedule_events",
      "supply_records",
      "supply_revisions",
      "supply_facts",
      "supply_allocations",
      "activities",
      "activity_links",
      "quote_material_events",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
    ];
    const before = await Promise.all(tables.map(rows));
    const failTable = [
      "FirstTask",
      "SecondTask",
      "ThirdTask",
      "FourthTask",
    ].includes(failure)
      ? "project_tasks"
      : failure === "Impact"
        ? "supply_facts"
        : "quote_material_events";
    const condition =
      failure === "FirstTask"
        ? `NEW.id='${f.task.id}'::uuid`
        : failure === "SecondTask"
          ? `NEW.id='${f.b.id}'::uuid`
          : failure === "ThirdTask"
            ? `NEW.id='${f.c.id}'::uuid`
            : failure === "FourthTask"
              ? `NEW.id='${f.d.id}'::uuid`
              : failure === "Impact"
                ? "NEW.kind='Impact'"
                : "NEW.action='MaterialApply'";
    await database().query(
      `CREATE FUNCTION ppo.diamond_injected() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF ${condition} THEN RAISE EXCEPTION 'SYN late native refusal'; END IF; RETURN NEW; END $$; CREATE TRIGGER diamond_injected AFTER ${["FirstTask", "SecondTask", "ThirdTask", "FourthTask"].includes(failure) ? "UPDATE" : "INSERT"} ON ppo.${failTable} FOR EACH ROW EXECUTE FUNCTION ppo.diamond_injected()`,
    );
    try {
      await assert.rejects(
        executeMaterial(f.owner, f.id, "MaterialApply", cmd),
      );
    } finally {
      await database().query(
        `DROP TRIGGER diamond_injected ON ppo.${failTable}; DROP FUNCTION ppo.diamond_injected()`,
      );
    }
    assert.deepEqual(await Promise.all(tables.map(rows)), before);
    for (const op of [
      cmd,
      prop.project_command,
      prop.diamond_commands!.b,
      prop.diamond_commands!.c,
      prop.diamond_commands!.d,
      prop.impact_command,
    ])
      await assert.rejects(readOperation(f.owner, op.operation_id));
    const { project_id, ...reserved } = prop.diamond_commands!.d;
    await assert.rejects(saveTask(f.owner, project_id, reserved), conflict);
    const result = await executeMaterial(f.owner, f.id, "MaterialApply", cmd);
    assert.deepEqual(
      await readOperation(f.owner, cmd.operation_id),
      result.receipt,
    );
  });
for (const outgoing of [false, true])
  for (const selectedName of ["A", "B", "C", "D"] as const)
    test(`a new ${outgoing ? "outgoing" : "incoming"} edge at diamond task ${selectedName} holds frozen review and is explicitly identified by fresh graph inspection`, async () => {
      const f = await fixture();
      const other = {
        ...taskInput(5),
        owner_id: f.owner.actor_id,
        status: "Planned",
        progress: 0,
      };
      await saveTask(f.owner, f.project.id, other);
      const command = await freezeDiamond(f);
      const selected =
        selectedName === "A"
          ? f.task.id
          : selectedName === "B"
            ? f.b.id
            : selectedName === "C"
              ? f.c.id
              : f.d.id;
      const changed = outgoing ? other.id : selected;
      const schedule = await readSchedule(f.owner, f.project.id);
      const oldDependencies = schedule.tasks.find(
        (t) => t.id === changed,
      )!.dependencies;
      await changeDependencies(f, changed, [
        ...oldDependencies,
        { task_id: outgoing ? selected : other.id, kind: "FS" },
      ]);
      await assertGraphRefusal(f, command);
      // Restoring the topology does not revive earlier consent across the native versions.
      await changeDependencies(f, changed, oldDependencies);
      const restored = await currentFollowup(f);
      assert.equal(restored.material_resolution.native_holds.length, 0);
      assert.equal(restored.material_resolution.can_apply, false);
      assert.ok(restored.material_resolution.holds.length);
    });

for (const shape of [
  "B-C",
  "C-B",
  "A-D",
  "missing A-B",
  "missing A-C",
  "missing B-D",
  "missing C-D",
  "reversed A-B",
  "reversed A-C",
  "reversed B-D",
  "reversed C-D",
] as const)
  test(`diamond refuses ${shape} introduced by native task saves`, async () => {
    const f = await fixture(),
      cmd = await freezeDiamond(f),
      ids = { A: f.task.id, B: f.b.id, C: f.c.id, D: f.d.id };
    const [from, to] = shape
      .replace("missing ", "")
      .replace("reversed ", "")
      .split("-") as (keyof typeof ids)[];
    const prior = (await readSchedule(f.owner, f.project.id)).tasks.find(
      (t) => t.id === ids[to],
    )!.dependencies;
    if (shape.startsWith("missing") || shape.startsWith("reversed"))
      await changeDependencies(
        f,
        ids[to],
        prior.filter((e) => e.task_id !== ids[from]),
      );
    else
      await changeDependencies(f, ids[to], [
        ...prior,
        { task_id: ids[from], kind: "FS" },
      ]);
    if (shape.startsWith("reversed")) {
      const current = (await readSchedule(f.owner, f.project.id)).tasks.find(
        (t) => t.id === ids[from],
      )!;
      await changeDependencies(f, ids[from], [
        ...current.dependencies,
        { task_id: ids[to], kind: "SS" },
      ]);
    }
    await assertGraphRefusal(f, cmd);
  });

test("cross-Project selected task and relationship are refused without affecting a frozen diamond", async () => {
  const f = await fixture(),
    cmd = await freezeDiamond(f),
    other = { ...f.project, id: randomUUID(), operation_id: randomUUID() };
  await createProject(f.owner, other);
  const task = { ...taskInput(), owner_id: f.owner.actor_id };
  await saveTask(f.owner, other.id, task);
  const before = await rows("project_dependencies");
  await assert.rejects(
    saveTask(f.owner, other.id, {
      ...task,
      operation_id: randomUUID(),
      expected_version: 2,
      dependencies: [{ task_id: f.task.id, kind: "FS" }],
    }),
  );
  await assert.rejects(
    executeMaterial(f.owner, f.id, "MaterialPropose", {
      ...materialProposal(await currentFollowup(f), f.task.id),
      diamond_b_task_id: f.b.id,
      diamond_c_task_id: f.c.id,
      diamond_d_task_id: task.id,
    }),
  );
  assert.deepEqual(await rows("project_dependencies"), before);
  assert.equal((await currentFollowup(f)).material_resolution.can_apply, true);
  await executeMaterial(f.owner, f.id, "MaterialApply", cmd);
});
