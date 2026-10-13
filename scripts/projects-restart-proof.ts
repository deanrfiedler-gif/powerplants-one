import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { closeDatabase } from "../src/platform/database";
import { createSession } from "../src/platform/identity";
import {
  saveTask,
  readSchedule,
  projectHistory,
} from "../src/projects/service";
import { taskInput } from "../tests/helpers/projects";
import { projectReceivingFixture } from "../tests/helpers/project-receiving";
import { bindDelivery } from "../src/sales/delivery-binding";
import { raidInput, raidAction } from "../tests/helpers/project-raid";
import { saveRaid, readRaid } from "../src/projects/raid";
import { createActivity } from "../src/activities/activities";
import { readProjectOverview } from "../src/projects/overview";
import {
  recordCalendar,
  recordActuals,
  readCalendar,
  readActuals,
} from "../src/projects/programme";
import { calendarInput, actualInput } from "../tests/helpers/project-programme";
import { readPortfolio } from "../src/projects/portfolio";
import { readOperation } from "../src/shared/receipts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const path = "verification-evidence/projects-restart";
try {
  const p = (await createSession("coordinator")).principal;
  if (process.argv[2] === "write") {
    const receiving = await projectReceivingFixture();
    const project = receiving.project,
      task = taskInput();
    const receivingResult = await bindDelivery(
      p,
      receiving.handover,
      receiving.binding,
    );
    const result = await saveTask(p, project.id, task);
    const action = raidAction(project.id),
      raid = raidInput();
    await createActivity(p, action);
    raid.action_ids = [action.id];
    const raidResult = await saveRaid(p, project.id, raid);
    const raidRead = await readRaid(p, project.id, { id: raid.id });
    const calendar = calendarInput(),
      actual = actualInput();
    const calendarSaved = await recordCalendar(p, project.id, calendar),
      actualSaved = await recordActuals(p, project.id, task.id, actual);
    const calendarRead = await readCalendar(p, project.id),
      actualRead = await readActuals(p, project.id, task.id);
    const overview = await readProjectOverview(p, project.id);
    await mkdir(path, { recursive: true });
    await writeFile(
      path + "/synthetic-original.json",
      JSON.stringify({
        receiving: {
          handover: receiving.handover,
          binding: receiving.binding,
          receipt: receivingResult.receipt,
        },
        project,
        task,
        calendar,
        actual,
        calendar_receipt: calendarSaved.receipt,
        actual_receipt: actualSaved.receipt,
        calendarRead,
        actualRead,
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
    assert.equal(schedule.project.version, 4);
    assert.deepEqual(
      await readCalendar(p, proof.project.id),
      proof.calendarRead,
    );
    assert.deepEqual(
      await readActuals(p, proof.project.id, proof.task.id),
      proof.actualRead,
    );
    assert.deepEqual(
      (await recordCalendar(p, proof.project.id, proof.calendar)).receipt,
      proof.calendar_receipt,
    );
    assert.deepEqual(
      (await recordActuals(p, proof.project.id, proof.task.id, proof.actual))
        .receipt,
      proof.actual_receipt,
    );
    assert.deepEqual(
      await readOperation(p, proof.calendar.operation_id),
      proof.calendar_receipt,
    );
    assert.deepEqual(
      await readOperation(p, proof.actual.operation_id),
      proof.actual_receipt,
    );
    assert.equal(schedule.tasks.length, 1);
    assert.equal(schedule.tasks[0].finish_date, proof.task.finish_date);
    assert.deepEqual(
      (await saveTask(p, proof.project.id, proof.task)).receipt,
      proof.receipt,
    );
    assert.equal(
      (await projectHistory(p, proof.project.id, {})).items.length,
      4,
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
      await readOperation(p, proof.receiving.binding.operation_id),
      proof.receiving.receipt,
    );
    assert.deepEqual(
      (await bindDelivery(p, proof.receiving.handover, proof.receiving.binding))
        .receipt,
      proof.receiving.receipt,
    );
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
        project_version: 4,
        calendar_actuals_and_originals_retained: true,
        tasks: 1,
        original_receipt_retained: true,
        raid_history_and_original_retained: true,
        overview_and_portfolio_retained: true,
        exact_receiving_and_original_retained: true,
      }),
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
