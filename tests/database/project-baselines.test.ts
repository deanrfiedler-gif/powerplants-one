import { assertAccessInspectionSnapshot } from "../helpers/access-inspection-upgrade";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { beforeEach, after, test } from "node:test";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { AppError } from "../../src/platform/errors";
import { reset, migrate, seed } from "../../scripts/database";
import {
  createProject,
  saveTask,
  readSchedule,
} from "../../src/projects/service";
import { recordBaseline, readBaselines } from "../../src/projects/baselines";
import { readOperation } from "../../src/shared/receipts";
import { projectInput, taskInput } from "../helpers/projects";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (expected: string) => (e: unknown) =>
  e instanceof AppError && e.code === expected;
const input = (expected_version = 2, expected_baseline_revision = 0) => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN Coordinator reviewed the dates and dependency warnings",
  label: "SYN Agreed schedule",
  reviewed: true,
  expected_version,
  expected_baseline_revision,
});
async function setup() {
  const p = (await createSession("coordinator")).principal,
    project = projectInput(),
    task = taskInput();
  await createProject(p, project);
  await saveTask(p, project.id, task);
  return { p, project, task };
}
test("immutable baseline survives forecast changes, exact retry, pool restart and migration/seed reruns", async () => {
  const { p, project, task } = await setup(),
    command = input();
  const before = await readSchedule(p, project.id),
    accepted = await recordBaseline(p, project.id.toUpperCase(), command);
  assert.deepEqual(
    await readSchedule(p, project.id).then((s) => ({
      ...s,
      observed_at: before.observed_at,
    })),
    before,
  );
  const first = (await readBaselines(p, project.id)).selected!;
  assert.equal(first.revision, 1);
  assert.equal(first.snapshot[0].finish_date, task.finish_date);
  assert.ok(
    !("note" in first.snapshot[0]) &&
      !("external_owner_id" in first.snapshot[0]),
  );
  assert.deepEqual(
    (await recordBaseline(p, project.id, command)).receipt,
    accepted.receipt,
  );
  assert.deepEqual(
    await readOperation(p, command.operation_id),
    accepted.receipt,
  );
  await assert.rejects(
    recordBaseline(p, project.id, { ...command, label: "SYN altered retry" }),
    code("OperationConflict"),
  );
  await saveTask(p, project.id, {
    ...task,
    operation_id: randomUUID(),
    expected_version: 2,
    finish_date: "2027-12-03",
    reason: "SYN Later supplier forecast",
  });
  assert.deepEqual((await readBaselines(p, project.id)).selected, first);
  await recordBaseline(p, project.id, input(3, 1));
  await closeDatabase();
  await migrate();
  await seed();
  const current = await readBaselines(p, project.id);
  assert.equal(current.latest_revision, 2);
  assert.equal(current.selected!.snapshot[0].finish_date, "2027-12-03");
  assert.deepEqual(
    (await readBaselines(p, project.id, { revision: "1" })).selected,
    first,
  );
  assert.equal(current.schedule.project.version, 3);
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.project_schedule_events WHERE project_id=$1",
        [project.id],
      )
    ).rows[0].n,
    3,
  );
  for (const sql of [
    "UPDATE ppo.project_schedule_baselines SET label='changed' WHERE id=$1",
    "DELETE FROM ppo.project_schedule_baselines WHERE id=$1",
  ])
    await assert.rejects(
      database().query(sql, [first.id]),
      (e: unknown) => (e as { code: string }).code === "55000",
    );
});
test("stale and concurrent baselines, undated schedule, missing review and detached evidence fail", async () => {
  const { p, project } = await setup();
  await assert.rejects(
    recordBaseline(p, project.id, input(1)),
    code("VersionConflict"),
  );
  await assert.rejects(
    recordBaseline(p, project.id, { ...input(), reviewed: false }),
    code("InvalidData"),
  );
  const winners = await Promise.allSettled([
    recordBaseline(p, project.id, input()),
    recordBaseline(p, project.id, input()),
  ]);
  assert.equal(winners.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    winners.filter(
      (x) => x.status === "rejected" && x.reason.code === "VersionConflict",
    ).length,
    1,
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        `INSERT INTO ppo.project_schedule_baselines(id,workspace_id,company_id,project_id,revision,project_version,label,reason,calendar_key,snapshot,created_by,operation_id)
      SELECT $1,workspace_id,company_id,project_id,2,project_version,label,reason,calendar_key,snapshot,created_by,$2 FROM ppo.project_schedule_baselines WHERE project_id=$3`,
        [randomUUID(), randomUUID(), project.id],
      );
    }),
    (e: unknown) => (e as { code: string }).code === "23514",
  );
  const empty = projectInput();
  await createProject(p, empty);
  await assert.rejects(
    recordBaseline(p, empty.id, input(1)),
    code("UndatedSchedule"),
  );
  await saveTask(p, empty.id, {
    ...taskInput(),
    start_date: null,
    finish_date: null,
  });
  await assert.rejects(
    recordBaseline(p, empty.id, input()),
    code("UndatedSchedule"),
  );
});
test("current scope and coordinator authority precede baseline and receipt disclosure including replay", async () => {
  const { p, project } = await setup(),
    command = input();
  await recordBaseline(p, project.id, command);
  for (const profile of [
    "second-company",
    "other-workspace",
    "systems",
    "observer",
  ]) {
    const other = (await createSession(profile)).principal;
    for (const action of [
      () => readBaselines(other, project.id),
      () => recordBaseline(other, project.id, input(2, 1)),
    ])
      await assert.rejects(
        action,
        (e: unknown) => e instanceof AppError && [403, 404].includes(e.status),
      );
  }
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.edit'",
    [p.workspace_id, p.actor_id],
  );
  assert.equal((await readBaselines(p, project.id)).can_record, false);
  await assert.rejects(
    recordBaseline(p, project.id, command),
    (e: unknown) => e instanceof AppError && [403, 404].includes(e.status),
  );
  await assert.rejects(
    readOperation(p, command.operation_id),
    (e: unknown) => e instanceof AppError && [403, 404].includes(e.status),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(
    readBaselines(p, project.id),
    (e: unknown) => e instanceof AppError && [403, 404].includes(e.status),
  );
});
test("baseline history pages are bounded, independently selectable and retain all revisions", async () => {
  const { p, project } = await setup();
  for (let n = 0; n < 21; n++)
    await recordBaseline(p, project.id, {
      ...input(2, n),
      label: `SYN Review ${n + 1}`,
    });
  const page = await readBaselines(p, project.id);
  assert.equal(page.items.length, 20);
  assert.equal(page.next_cursor, 2);
  const older = await readBaselines(p, project.id, {
    before: String(page.next_cursor),
  });
  assert.deepEqual(
    older.items.map((x) => x.revision),
    [1],
  );
  assert.equal(older.next_cursor, null);
  assert.equal(older.latest_revision, 21);
  assert.equal(older.selected?.revision, 1);
});
test("populated 0077 upgrade retains every original schedule, receipt, ledger, user and grant", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(77);
  await seed(77);
  const { p, project } = await setup();
  const tables = [
    "projects",
    "project_tasks",
    "project_dependencies",
    "project_schedule_events",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "permission_grants",
    "users",
    "seed_receipts",
  ];
  const snapshot = async () =>
    Promise.all(
      tables.map((t) =>
        database()
          .query(
            `SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
          )
          .then((r) => r.rows),
      ),
    );
  const before = await snapshot(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  await migrate();
  await seed();
  assertAccessInspectionSnapshot(await snapshot(), before, tables);
  const after = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(
    after.filter((r) => r.version <= 77),
    ledger,
  );
  assert.deepEqual(
    after.filter((r) => r.version > 77).map((r) => r.version),
    [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105],
  );
  assert.equal((await readBaselines(p, project.id)).latest_revision, 0);
  await recordBaseline(p, project.id, input());
  const recorded = await readBaselines(p, project.id);
  const settled = await snapshot();
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), settled);
  assert.deepEqual(
    (await readBaselines(p, project.id)).selected,
    recorded.selected,
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
    after,
  );
});
