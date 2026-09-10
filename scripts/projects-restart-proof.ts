import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { closeDatabase } from "../src/platform/database";
import { createSession } from "../src/platform/identity";
import {
  createProject,
  saveTask,
  readSchedule,
  projectHistory,
} from "../src/projects/service";
import { projectInput, taskInput } from "../tests/helpers/projects";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const path = "verification-evidence/projects-restart";
try {
  const p = (await createSession("coordinator")).principal;
  if (process.argv[2] === "write") {
    const project = projectInput(),
      task = taskInput();
    await createProject(p, project);
    const result = await saveTask(p, project.id, task);
    await mkdir(path, { recursive: true });
    await writeFile(
      path + "/synthetic-original.json",
      JSON.stringify({ project, task, receipt: result.receipt }),
    );
  } else if (process.argv[2] === "verify") {
    const proof = JSON.parse(
      await readFile(path + "/synthetic-original.json", "utf8"),
    );
    const schedule = await readSchedule(p, proof.project.id);
    assert.equal(schedule.project.version, 2);
    assert.equal(schedule.tasks.length, 1);
    assert.equal(schedule.tasks[0].finish_date, proof.task.finish_date);
    assert.deepEqual(
      (await saveTask(p, proof.project.id, proof.task)).receipt,
      proof.receipt,
    );
    assert.equal(
      (await projectHistory(p, proof.project.id, {})).items.length,
      2,
    );
    await writeFile(
      path + "/result.json",
      JSON.stringify({
        passed: true,
        project_version: 2,
        tasks: 1,
        original_receipt_retained: true,
      }),
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
