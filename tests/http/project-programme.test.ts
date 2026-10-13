import assert from "node:assert/strict";
import { after, test } from "node:test";
import { localConfig } from "../../src/platform/config";
import { closeDatabase } from "../../src/platform/database";
import { httpAcceptance } from "../helpers/acceptance-http";
import { projectInput, taskInput } from "../helpers/projects";
import { calendarInput, actualInput } from "../helpers/project-programme";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
const h = httpAcceptance(localConfig().origin);
test("PJ03-HTTP01 compiled calendar and actual commands, exact recovery, programme read and scoped denial", async () => {
  const project = projectInput(),
    task = taskInput(),
    calendar = calendarInput(),
    actual = actualInput(),
    root = `projects/${project.id}`,
    actualRoute = `${root}/tasks/${task.id}/actuals`;
  assert.equal((await h.call("coordinator", "projects", project)).status, 201);
  assert.equal(
    (await h.call("coordinator", `${root}/tasks`, task)).status,
    200,
  );
  const saved = await h.call("coordinator", `${root}/calendar`, calendar);
  assert.equal(saved.status, 201);
  const replay = await h.call("coordinator", `${root}/calendar`, calendar);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, saved.body);
  const done = await h.call("coordinator", actualRoute, actual);
  assert.equal(done.status, 201);
  const retried = await h.call("coordinator", actualRoute, actual);
  assert.equal(retried.status, 200);
  assert.deepEqual(retried.body, done.body);
  const read = await h.call("coordinator", `${root}/overview`);
  assert.equal(read.status, 200);
  assert.equal(read.body.programme.calendar.revision, 1);
  assert.equal(
    read.body.programme.tasks[0].actual.actual_finish,
    actual.actual_finish,
  );
  assert.equal(read.body.programme.tasks[0].actual_working_days, 4);
  assert.equal(
    (await h.call("coordinator", actualRoute)).body.task.progress,
    40,
  );
  for (const route of [`${root}/calendar`, actualRoute]) {
    assert.equal((await h.call("second-company", route)).status, 404);
    assert.equal(
      (await h.call("coordinator", route + "?before=0")).status,
      422,
    );
    assert.equal(
      (await h.call("coordinator", route + "?unknown=1")).status,
      422,
    );
  }
  assert.equal(
    (await h.call("coordinator", `${root}/calendar`, calendarInput(3, 1)))
      .status,
    409,
  );
  assert.equal(
    (
      await h.call("coordinator", actualRoute, {
        ...actualInput(4, 1),
        actual_finish: "9998-01-01",
      })
    ).status,
    422,
  );
});
