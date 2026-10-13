import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { AppError } from "../../src/platform/errors";
import { withWorkingCompany } from "../../src/platform/working-company";
import { reset, migrate, seed } from "../../scripts/database";
import {
  createProject,
  readSchedule,
  saveTask,
} from "../../src/projects/service";
import { recordBaseline, readBaselines } from "../../src/projects/baselines";
import {
  recordCalendar,
  readCalendar,
  recordActuals,
  readActuals,
} from "../../src/projects/programme";
import { readProjectOverview } from "../../src/projects/overview";
import { readOperation } from "../../src/shared/receipts";
import { projectInput, taskInput } from "../helpers/projects";
import { calendarInput, actualInput } from "../helpers/project-programme";
import { CRM, crmBase } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  e instanceof AppError && e.code === name;
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
async function setup() {
  const p = (await createSession("coordinator")).principal,
    project = projectInput(),
    task = taskInput();
  await createProject(p, project);
  await saveTask(p, project.id, task);
  return { p, project, task };
}
const baseline = (
  expected_version: number,
  expected_baseline_revision: number,
) => ({
  ...crmBase(),
  expected_version,
  expected_baseline_revision,
  label: "SYN reviewed baseline",
  reviewed: true,
});

test("PJ03-C01 calendar and actual revisions retain forecasts, exact receipts, warnings and baseline calendar history", async () => {
  const { p, project, task } = await setup(),
    calendar = calendarInput(),
    actual = actualInput();
  const original = await readSchedule(p, project.id);
  await recordBaseline(p, project.id, baseline(2, 0));
  const old = (await readBaselines(p, project.id)).selected;
  const saved = await recordCalendar(p, project.id, calendar);
  assert.equal(saved.receipt.record_version, 3);
  assert.deepEqual(
    (await recordCalendar(p, project.id, calendar)).receipt,
    saved.receipt,
  );
  assert.deepEqual(
    await readOperation(p, calendar.operation_id),
    saved.receipt,
  );
  await recordBaseline(p, project.id, baseline(3, 1));
  const recorded = (await readBaselines(p, project.id)).selected!;
  assert.equal(recorded.calendar!.revision, 1);
  const accepted = await recordActuals(p, project.id, task.id, actual);
  assert.deepEqual(
    (await recordActuals(p, project.id, task.id, actual)).receipt,
    accepted.receipt,
  );
  assert.deepEqual(
    await readOperation(p, actual.operation_id),
    accepted.receipt,
  );
  await recordCalendar(p, project.id, {
    ...calendarInput(4, 1),
    exceptions: [],
  });
  const schedule = await readSchedule(p, project.id);
  assert.equal(schedule.project.version, 5);
  assert.deepEqual(schedule.tasks, original.tasks);
  assert.equal(schedule.programme!.tasks[0].actual!.revision, 1);
  assert.equal(schedule.programme!.tasks[0].actual_working_days, 5);
  assert.ok(
    schedule.programme!.tasks[0].warnings.includes(
      "ActualFinishWithoutCompleteStatus",
    ),
  );
  assert.deepEqual(
    (await readBaselines(p, project.id, { revision: "1" })).selected,
    old,
  );
  assert.deepEqual(
    (await readBaselines(p, project.id, { revision: "2" })).selected,
    recorded,
  );
  const overview = await readProjectOverview(p, project.id);
  assert.equal(overview.programme.calendar.revision, 2);
  assert.equal(overview.programme.comparison_calendar!.revision, 1);
  assert.deepEqual(
    (await readActuals(p, project.id, task.id)).current!.forecast_finish,
    task.finish_date,
  );
  await closeDatabase();
  await migrate();
  await seed();
  assert.deepEqual(
    (await readBaselines(p, project.id, { revision: "2" })).selected,
    recorded,
  );
  assert.deepEqual(
    await readOperation(p, actual.operation_id),
    accepted.receipt,
  );
});
test("PJ03-C02 optimistic Project, task and revision guards, concurrent writes and altered retries", async () => {
  const { p, project, task } = await setup(),
    calendar = calendarInput();
  for (const patch of [{ expected_version: 1 }, { expected_revision: 1 }])
    await assert.rejects(
      recordCalendar(p, project.id, { ...calendar, ...patch }),
      code("VersionConflict"),
    );
  const concurrent = await Promise.allSettled([
    recordCalendar(p, project.id, calendar),
    recordActuals(p, project.id, task.id, actualInput(2)),
  ]);
  assert.equal(concurrent.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    concurrent.filter(
      (x) => x.status === "rejected" && x.reason.code === "VersionConflict",
    ).length,
    1,
  );
  assert.equal((await readSchedule(p, project.id)).project.version, 3);
  const revision = (await readActuals(p, project.id, task.id)).latest_revision;
  await assert.rejects(
    recordActuals(p, project.id, task.id, {
      ...actualInput(3, revision),
      expected_task_version: 99,
    }),
    code("VersionConflict"),
  );
  const command = actualInput(3, revision);
  await recordActuals(p, project.id, task.id, command);
  await assert.rejects(
    recordActuals(p, project.id, task.id, {
      ...command,
      reason: "SYN changed content",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    saveTask(p, project.id, { ...task, ...crmBase(), expected_version: 3 }),
    code("VersionConflict"),
  );
  await assert.rejects(
    recordBaseline(p, project.id, baseline(3, 0)),
    code("VersionConflict"),
  );
});
test("PJ03-C03 actual correction and explicit withdrawal preserve all revisions; future and cross-project dates refuse writes", async () => {
  const { p, project, task } = await setup();
  await assert.rejects(
    recordActuals(p, project.id, task.id, {
      ...actualInput(2),
      actual_finish: "9998-12-31",
    }),
    code("InvalidData"),
  );
  const other = projectInput();
  await createProject(p, other);
  await assert.rejects(
    recordActuals(p, other.id, task.id, actualInput(1)),
    code("RecordUnavailable"),
  );
  await recordActuals(p, project.id, task.id, actualInput(2));
  await recordActuals(p, project.id, task.id, {
    ...actualInput(3, 1),
    actual_finish: "2026-09-19",
  });
  await recordActuals(p, project.id, task.id, {
    ...actualInput(4, 2),
    actual_start: null,
    actual_finish: null,
  });
  const read = await readActuals(p, project.id, task.id);
  assert.equal(read.latest_revision, 3);
  assert.equal(read.current!.actual_start, null);
  assert.deepEqual(
    read.items.map((r) => r.actual_finish),
    [null, "2026-09-19", "2026-09-18"],
  );
  assert.equal(
    (await readActuals(p, project.id, task.id, { before: "2" })).items[0]
      .revision,
    1,
  );
  assert.equal((await readSchedule(p, project.id)).tasks[0].progress, 40);
  for (const table of [
    "project_calendar_revisions",
    "project_task_actual_revisions",
  ]) {
    if (table === "project_calendar_revisions")
      await recordCalendar(p, project.id, calendarInput(5));
    for (const sql of [
      `UPDATE ppo.${table} SET reason='SYN tampered'`,
      `DELETE FROM ppo.${table}`,
    ])
      await assert.rejects(
        database().query(sql),
        (e: unknown) => (e as { code: string }).code === "55000",
      );
  }
});
test("PJ03-C04 current scope and edit authority precede new writes, history and original recovery", async () => {
  const { p, project, task } = await setup(),
    calendar = calendarInput(),
    actual = actualInput();
  await recordCalendar(p, project.id, calendar);
  await recordActuals(p, project.id, task.id, actual);
  for (const profile of [
    "second-company",
    "other-workspace",
    "systems",
    "observer",
  ]) {
    const other = (await createSession(profile)).principal;
    for (const work of [
      () => readCalendar(other, project.id),
      () => readActuals(other, project.id, task.id),
      () => recordCalendar(other, project.id, calendarInput(4, 1)),
      () => recordActuals(other, project.id, task.id, actualInput(4, 1)),
    ])
      await assert.rejects(work, code("RecordUnavailable"));
  }
  await assert.rejects(
    withWorkingCompany(p.actor_id, CRM.companyB, () =>
      readCalendar(p, project.id),
    ),
    code("RecordUnavailable"),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.edit'",
    [p.workspace_id, p.actor_id],
  );
  assert.equal((await readCalendar(p, project.id)).can_record, false);
  assert.equal((await readActuals(p, project.id, task.id)).can_record, false);
  for (const op of [calendar, actual])
    await assert.rejects(
      readOperation(p, op.operation_id),
      code("RecordUnavailable"),
    );
  await assert.rejects(
    recordCalendar(p, project.id, calendar),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    recordActuals(p, project.id, task.id, actual),
    code("RecordUnavailable"),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(readCalendar(p, project.id), code("RecordUnavailable"));
});
test("PJ03-C05 missing evidence rolls back Project and revision; forged baseline calendar and invalid calendar refuse commits", async () => {
  const { p, project } = await setup();
  await recordCalendar(p, project.id, calendarInput());
  const original = (
    await rows("SELECT to_jsonb(p) snapshot FROM ppo.projects p WHERE id=$1", [
      project.id,
    ])
  )[0];
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "UPDATE ppo.projects SET version=version+1,updated_by=$2 WHERE id=$1",
        [project.id, p.actor_id],
      );
      await c.query(
        "INSERT INTO ppo.project_calendar_revisions SELECT $1,workspace_id,company_id,project_id,2,4,name,timezone,weekdays,exceptions,reason,reviewed,created_by,clock_timestamp(),$2,synthetic FROM ppo.project_calendar_revisions WHERE project_id=$3",
        [randomUUID(), randomUUID(), project.id],
      );
      await c.query("SET CONSTRAINTS ppo.programme_evidence IMMEDIATE");
    }),
    (e: unknown) => (e as { code: string }).code === "23514" && /Exact programme revision/.test((e as Error).message),
  );
  assert.deepEqual(
    (
      await rows(
        "SELECT to_jsonb(p) snapshot FROM ppo.projects p WHERE id=$1",
        [project.id],
      )
    )[0],
    original,
  );
  assert.equal((await readCalendar(p, project.id)).current.revision, 1);
  assert.equal(
    (await rows("SELECT ppo.valid_project_calendar(ARRAY[1,1], '[]') ok"))[0]
      .ok,
    false,
  );
  assert.equal((await rows("SELECT ppo.valid_project_calendar(ARRAY[[1,2],[3,4]], '[]') ok"))[0].ok, false);
  assert.equal(
    (
      await rows(
        `SELECT ppo.valid_project_calendar(ARRAY[1], '[{"date":"2026-02-30","working":false,"reason":"SYN invalid"}]') ok`,
      )
    )[0].ok,
    false,
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        `INSERT INTO ppo.project_schedule_baselines(id,workspace_id,company_id,project_id,revision,project_version,label,reason,calendar_key,snapshot,created_by,operation_id) VALUES($1,$2,$3,$4,1,3,'SYN forged','SYN missing calendar','PPO-PJ-CALENDAR-01',ppo.project_baseline_snapshot($2,$4),$5,$6)`,
        [
          randomUUID(),
          p.workspace_id,
          CRM.company,
          project.id,
          p.actor_id,
          randomUUID(),
        ],
      );
      await c.query("SET CONSTRAINTS ppo.baseline_calendar_evidence IMMEDIATE");
    }),
    (e: unknown) => (e as { code: string }).code === "23514" && /Baseline requires its exact current calendar/.test((e as Error).message),
  );
  assert.equal((await readBaselines(p, project.id)).latest_revision, 0);
});
test("PJ03-C06 populated 0087 upgrade retains exact original rows and ledger; reseeding and reapplying are inert", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(87);
  await seed(87);
  const { p, project } = await setup();
  await recordBaseline(p, project.id, baseline(2, 0));
  const tables = [
    "projects",
    "project_tasks",
    "project_dependencies",
    "project_schedule_events",
    "project_schedule_baselines",
    "business_identities",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "permission_grants",
    "users",
    "seed_receipts",
  ];
  const snapshot = () =>
    Promise.all(
      tables.map((t) =>
        rows(
          `SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
        ),
      ),
    );
  const before = await snapshot(),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    schedule = await readSchedule(p, project.id);
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  const after = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(
    after.filter((r) => r.version <= 87),
    ledger,
  );
  assert.deepEqual(
    after.filter((r) => r.version > 87).map((r) => r.version),
    [88],
  );
  assert.deepEqual(
    {
      ...(await readSchedule(p, project.id)),
      observed_at: schedule.observed_at,
    },
    schedule,
  );
  await recordCalendar(p, project.id, calendarInput());
  await recordBaseline(p, project.id, baseline(3, 1));
  const settled = await snapshot(),
    saved = await readCalendar(p, project.id);
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), settled);
  assert.deepEqual(await readCalendar(p, project.id), saved);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    after,
  );
});

test("PJ03-C07 calendar history has bounded pages and a permitted editor cannot assume coordinator duty", async () => {
  const { p, project, task } = await setup();
  const editor = (await createSession("systems")).principal;
  await database().query(
    `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
 SELECT workspace_id,$2,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability IN ('project.read','project.edit','shared.read','shared.internal.read') ON CONFLICT DO NOTHING`,
    [p.actor_id, editor.actor_id],
  );
  assert.equal((await readCalendar(editor, project.id)).can_record, false);
  await assert.rejects(
    recordCalendar(editor, project.id, calendarInput()),
    code("RecordUnavailable"),
  );
  await recordActuals(editor, project.id, task.id, actualInput(2));
  for (let n = 0; n < 21; n++)
    await recordCalendar(p, project.id, calendarInput(3 + n, n));
  const first = await readCalendar(p, project.id);
  assert.equal(first.items.length, 20);
  assert.equal(first.next_cursor, 2);
  const second = await readCalendar(p, project.id, {
    before: String(first.next_cursor),
  });
  assert.deepEqual(
    second.items.map((r) => r.revision),
    [1],
  );
  assert.equal(second.next_cursor, null);
  assert.equal(second.current.revision, 21);
});
