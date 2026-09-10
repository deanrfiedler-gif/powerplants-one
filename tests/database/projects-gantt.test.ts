import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, afterEach, after, test } from "node:test";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import {
  createProject,
  saveTask,
  readSchedule,
  listProjects,
  projectHistory,
  projectOptions,
  projectOwners,
} from "../../src/projects/service";
import { shellSearch, shellContext } from "../../src/shell/reads";
import { AppError } from "../../src/platform/errors";
import { CRM } from "../helpers/crm";
import { projectInput, taskInput } from "../helpers/projects";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
afterEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code = (value: string) => (e: unknown) =>
  e instanceof AppError && e.code === value;
test("project and 18-month schedule persist with exact history, original-operation replay and safe seed reruns", async () => {
  const p = await principal(),
    input = projectInput();
  const created = await createProject(p, input),
    replay = await createProject(p, input);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.receipt, created.receipt);
  const first = taskInput();
  await saveTask(p, input.id, first);
  const second = taskInput(2);
  second.title = "SYN External commissioning";
  second.owner_id = null;
  second.external_owner_id = CRM.person;
  second.dependencies = [{ task_id: first.id, kind: "FS" }];
  second.start_date = "2027-12-01";
  second.finish_date = "2028-03-31";
  const saved = await saveTask(p, input.id, second);
  assert.deepEqual(
    (await saveTask(p, input.id, second)).receipt,
    saved.receipt,
  );
  await closeDatabase(); // New pool must read accepted state rather than a component cache.
  const schedule = await readSchedule(p, input.id);
  assert.equal(schedule.project.version, 3);
  assert.equal(schedule.tasks.length, 2);
  assert.equal(schedule.tasks[1].external_owner_id, CRM.person);
  assert.equal(schedule.tasks[1].finish_date, "2028-03-31");
  assert.equal((await projectHistory(p, input.id, {})).items.length, 3);
  assert.equal(
    (await shellSearch(p, { q: input.id })).items[0].href,
    `/projects/${input.id}`,
  );
  await migrate();
  await seed();
  assert.equal((await readSchedule(p, input.id)).tasks.length, 2);
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int AS n FROM ppo.project_schedule_events WHERE project_id=$1",
        [input.id],
      )
    ).rows[0].n,
    3,
  );
});
test("unknown outcomes replay once, changed payloads conflict, and stale concurrent edits retain one winner", async () => {
  const p = await principal(),
    input = projectInput();
  await createProject(p, input);
  const t = taskInput(),
    first = await saveTask(p, input.id, t);
  assert.deepEqual((await saveTask(p, input.id, t)).receipt, first.receipt);
  await assert.rejects(
    saveTask(p, input.id, { ...t, title: "SYN changed retry" }),
    code("OperationConflict"),
  );
  const a = {
      ...t,
      operation_id: randomUUID(),
      expected_version: 2,
      title: "SYN A",
    },
    b = { ...a, operation_id: randomUUID(), title: "SYN B" };
  const results = await Promise.allSettled([
    saveTask(p, input.id, a),
    saveTask(p, input.id, b),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const rejected = results.find((r) => r.status === "rejected");
  assert.ok(
    rejected?.status === "rejected" &&
      rejected.reason.code === "VersionConflict",
  );
  const current = await readSchedule(p, input.id);
  assert.equal(current.project.version, 3);
  assert.equal(current.tasks[0].version, 2);
  assert.equal((await projectHistory(p, input.id, {})).items.length, 3);
});
test("tenant, company, read-only and revoked permissions apply to schedule, selectors, history, search and replay", async () => {
  const p = await principal(),
    input = projectInput();
  await createProject(p, input);
  const t = taskInput();
  await saveTask(p, input.id, t);
  for (const profile of [
    "second-company",
    "other-workspace",
    "systems",
    "observer",
  ]) {
    const other = await principal(profile);
    for (const read of [
      () => readSchedule(other, input.id),
      () => projectHistory(other, input.id, {}),
      () => projectOwners(other, input.id, {}),
      () => saveTask(other, input.id, { ...t, operation_id: randomUUID() }),
    ])
      await assert.rejects(
        read,
        (e: unknown) => e instanceof AppError && [403, 404].includes(e.status),
      );
    assert.ok(
      !(await shellSearch(other, { q: input.id })).items.some(
        (i) => i.kind === "Project",
      ),
    );
  }
  assert.ok(
    (await shellContext(p, {})).actions.some((a) => a.id === "project"),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability IN ('project.create','project.edit')",
    [p.workspace_id, p.actor_id],
  );
  assert.equal((await readSchedule(p, input.id)).project.can_edit, false);
  await assert.rejects(
    saveTask(p, input.id, t),
    (e: unknown) => e instanceof AppError && e.status === 404,
  );
  assert.ok(
    !(await shellContext(p, {})).actions.some((a) => a.id === "project"),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(readSchedule(p, input.id));
  await assert.rejects(projectHistory(p, input.id, {}));
  assert.deepEqual((await shellSearch(p, { q: input.id })).items, []);
});
test("cycle and cross-project predecessors roll back all changes; conflicts remain manual warnings", async () => {
  const p = await principal(),
    input = projectInput();
  await createProject(p, input);
  const a = taskInput();
  await saveTask(p, input.id, a);
  const b = taskInput(2);
  b.dependencies = [{ task_id: a.id, kind: "FS" }];
  await saveTask(p, input.id, b); // Earlier dates are retained, not silently moved.
  assert.equal(
    (await readSchedule(p, input.id)).tasks[1].start_date,
    b.start_date,
  );
  await assert.rejects(
    saveTask(p, input.id, {
      ...a,
      operation_id: randomUUID(),
      expected_version: 3,
      dependencies: [{ task_id: b.id, kind: "SS" }],
    }),
    code("DependencyCycle"),
  );
  const other = projectInput();
  await createProject(p, other);
  const foreign = taskInput();
  await saveTask(p, other.id, foreign);
  await assert.rejects(
    saveTask(p, input.id, {
      ...a,
      operation_id: randomUUID(),
      expected_version: 3,
      dependencies: [{ task_id: foreign.id, kind: "FS" }],
    }),
  );
  assert.equal((await readSchedule(p, input.id)).project.version, 3);
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "INSERT INTO ppo.project_dependencies(workspace_id,project_id,task_id,predecessor_id,kind) VALUES($1,$2,$3,$4,'SS')",
        [p.workspace_id, input.id, a.id, b.id],
      );
    }),
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "UPDATE ppo.project_tasks SET title='SYN unattested',version=version+1 WHERE id=$1",
        [a.id],
      );
    }),
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "DELETE FROM ppo.project_schedule_events WHERE project_id=$1",
        [input.id],
      );
    }),
  );
  assert.equal((await readSchedule(p, input.id)).tasks[0].title, a.title);
});
test("creation selectors require the existing current customer/site context and never grant external access", async () => {
  const p = await principal();
  const customers = await projectOptions(p, { kind: "customer" });
  assert.ok(customers.items.some((c) => c.id === CRM.org));
  assert.ok(!customers.items.some((c) => c.id === CRM.orgB));
  const sites = await projectOptions(p, {
    kind: "site",
    organisation_id: CRM.org,
  });
  assert.ok(sites.items.some((s) => s.id === CRM.site));
  const before = (
    await database().query(
      "SELECT count(*)::int AS n FROM ppo.permission_grants",
    )
  ).rows[0].n;
  const input = projectInput();
  await createProject(p, input);
  const t = taskInput();
  t.owner_id = null;
  t.external_owner_id = CRM.person;
  await saveTask(p, input.id, t);
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int AS n FROM ppo.permission_grants",
      )
    ).rows[0].n,
    before,
  );
  assert.ok(
    (await projectOwners(p, input.id, {})).items.some(
      (o) => o.external && o.id === CRM.person,
    ),
  );
  await assert.rejects(
    createProject(p, { ...projectInput(), organisation_id: CRM.orgB }),
  );
  const page = await listProjects(p, { q: input.id, limit: "1" });
  assert.equal(page.items.length, 1);
  assert.equal(page.next_cursor, null);
});
