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
import { raidInput, raidAction } from "../tests/helpers/project-raid";
import { saveRaid, readRaid } from "../src/projects/raid";
import { createActivity } from "../src/activities/activities";
import { readProjectOverview } from "../src/projects/overview";
import { readPortfolio } from "../src/projects/portfolio";
import { readOperation } from "../src/shared/receipts";
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
    const action = raidAction(project.id),
      raid = raidInput();
    await createActivity(p, action);
    raid.action_ids = [action.id];
    const raidResult = await saveRaid(p, project.id, raid);
    const raidRead = await readRaid(p, project.id, { id: raid.id });
    const overview = await readProjectOverview(p, project.id);
    await mkdir(path, { recursive: true });
    await writeFile(
      path + "/synthetic-original.json",
      JSON.stringify({
        project,
        task,
        overview,
        receipt: result.receipt,
        raid,
        raid_receipt: raidResult.receipt,
        raid_current: raidRead.current,
        raid_history: raidRead.history,
      }),
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
    const raid = await readRaid(p, proof.project.id, { id: proof.raid.id });
    assert.deepEqual(raid.current, proof.raid_current);
    assert.deepEqual(raid.history, proof.raid_history);
    assert.deepEqual(
      (await saveRaid(p, proof.project.id, proof.raid)).receipt,
      proof.raid_receipt,
    );
    assert.deepEqual(
      await readOperation(p, proof.raid.operation_id),
      proof.raid_receipt,
    );
    const overview = await readProjectOverview(p, proof.project.id);
    assert.deepEqual(
      { ...overview, observed_at: proof.overview.observed_at },
      proof.overview,
    );
    const portfolio = await readPortfolio(p, { q: proof.project.id });
    assert.deepEqual(portfolio.items[0], overview.project);
    await writeFile(
      path + "/result.json",
      JSON.stringify({
        passed: true,
        project_version: 2,
        tasks: 1,
        original_receipt_retained: true,
        raid_history_and_original_retained: true,
        overview_and_portfolio_retained: true,
      }),
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
