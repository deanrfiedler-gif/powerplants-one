import assert from "node:assert/strict";
import { after, afterEach, test } from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  database,
  transaction,
  closeDatabase,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { migrate, seed, reset } from "../../scripts/database";
import { createLead, convertLead } from "../../src/crm/leads/service";
import { readLead } from "../../src/crm/leads/reads";
import {
  createProject,
  saveTask,
  readSchedule,
} from "../../src/projects/service";
import { shellContext, shellSearch } from "../../src/shell/reads";
import { readOperation } from "../../src/shared/receipts";
import { leadCreate, leadConvert } from "../helpers/leads";
import { projectInput, taskInput } from "../helpers/projects";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
afterEach(reset);
after(closeDatabase);
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
const read = (file: string) =>
  readFile(new URL(`../../db/${file}`, import.meta.url), "utf8");
async function atVersion(version: number) {
  await transaction(async (c) => {
    await c.query(await read("migrations/0001-recover.sql"));
    await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  });
  await migrate(version);
  await seed(version);
}
const ledger = () =>
  rows("SELECT * FROM public.ppo_migrations ORDER BY version");

test("fresh combined installation retains both registries and both domains through repeat migration and seed", async () => {
  await atVersion(20);
  await exerciseBoth();
});

test("main 0017 upgrades through Leads 0018 then Projects 0019 without replacing prior migration receipts", async () => {
  await atVersion(17);
  const before = await ledger();
  await migrate();
  await seed();
  assert.deepEqual(
    (await ledger()).filter((r) => r.version <= 17),
    before,
  );
  await exerciseBoth();
});

test("an existing Leads 0018 record and receipt survive the Projects upgrade exactly", async () => {
  await atVersion(18);
  const p = (await createSession("coordinator")).principal,
    input = leadCreate();
  const accepted = await createLead(p, input),
    before = await readLead(p, input.id),
    hashes = await ledger();
  const seedReceipts = await rows(
    "SELECT * FROM ppo.seed_receipts ORDER BY version",
  );
  await migrate();
  await seed();
  assert.deepEqual(await readLead(p, input.id), before);
  assert.deepEqual(
    await readOperation(p, input.operation_id),
    accepted.receipt,
  );
  assert.deepEqual(
    (await ledger()).filter((r) => r.version <= 18),
    hashes,
  );
  assert.deepEqual(
    (await rows("SELECT * FROM ppo.seed_receipts ORDER BY version")).filter(
      (r) => r.version <= 18,
    ),
    seedReceipts,
  );
  await exerciseBoth();
});

test("a database carrying the original Gantt 0018 checksum is preserved and refused, never relabelled or replayed", async () => {
  await atVersion(17);
  // The Gantt SQL and seed bytes are unchanged from PR #90; reproduce its old registration.
  await transaction(async (c) => {
    const sql = await read("migrations/0019-projects-gantt.sql");
    await c.query(sql);
    await c.query(
      "INSERT INTO public.ppo_migrations(version,sha256) VALUES(18,$1)",
      [createHash("sha256").update(sql).digest("hex")],
    );
    await c.query(await read("seed-projects-gantt.sql"));
    await c.query("INSERT INTO ppo.seed_receipts(version) VALUES(18)");
  });
  const p = (await createSession("coordinator")).principal,
    project = projectInput();
  await createProject(p, project);
  await saveTask(p, project.id, taskInput());
  const before = await readSchedule(p, project.id),
    hashes = await ledger();
  await assert.rejects(migrate(), /Migration checksum mismatch/);
  assert.deepEqual(await ledger(), hashes);
  sameSchedule(await readSchedule(p, project.id), before);
  assert.equal(
    (await rows("SELECT to_regclass('ppo.lead_candidates') AS value"))[0].value,
    null,
  );
});

async function exerciseBoth() {
  const p = (await createSession("coordinator")).principal;
  const lead = leadCreate(),
    project = projectInput();
  lead.title = project.title = "SYN Combined integration search";
  const captured = await createLead(p, lead),
    created = await createProject(p, project);
  const task = taskInput();
  await saveTask(p, project.id, task);
  const beforeLead = await readLead(p, lead.id),
    beforeProject = await readSchedule(p, project.id);
  const hashes = await ledger();
  assert.deepEqual(
    hashes.filter((r) => r.version >= 18).map((r) => r.version),
    [18, 19, 20],
  );
  assert.deepEqual(
    (
      await rows(
        "SELECT version FROM ppo.seed_receipts WHERE version>=18 ORDER BY version",
      )
    ).map((r) => r.version),
    [18, 19, 20],
  );
  await migrate();
  await seed();
  await migrate();
  await seed();
  await closeDatabase();
  assert.deepEqual(await ledger(), hashes);
  assert.deepEqual(await readLead(p, lead.id), beforeLead);
  sameSchedule(await readSchedule(p, project.id), beforeProject);
  assert.deepEqual(await readOperation(p, lead.operation_id), captured.receipt);
  assert.deepEqual(
    await readOperation(p, project.operation_id),
    created.receipt,
  );
  const result = await shellSearch(p, { q: lead.title });
  for (const [id, path] of [
    [lead.id, "/crm/leads"],
    [project.id, "/projects"],
  ])
    assert.ok(result.items.some((r) => r.href === `${path}/${id}`));
  const actions = (await shellContext(p, {})).actions;
  assert.ok(actions.some((a) => a.id === "lead"));
  assert.ok(actions.some((a) => a.id === "project"));
  for (const profile of ["second-company", "other-workspace", "systems"]) {
    const hidden = await shellSearch((await createSession(profile)).principal, {
      q: lead.title,
    });
    assert.ok(
      !hidden.items.some(
        (r) =>
          r.href === `/crm/leads/${lead.id}` ||
          r.href === `/projects/${project.id}`,
      ),
    );
  }
  // Conversion exercises shared identity, activity, audit and outbox unions after Gantt extends them.
  const command = leadConvert(1);
  await convertLead(p, lead.id, command);
  assert.equal((await readLead(p, lead.id)).status, "Converted");
  sameSchedule(await readSchedule(p, project.id), beforeProject);
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.lead.read'",
    [p.actor_id],
  );
  await migrate();
  await seed();
  const remaining = (await shellContext(p, {})).actions;
  assert.ok(!remaining.some((a) => a.id === "lead"));
  assert.ok(remaining.some((a) => a.id === "project"));
  assert.deepEqual(
    await readOperation(p, project.operation_id),
    created.receipt,
  );
  await assert.rejects(readOperation(p, lead.operation_id));
}

function sameSchedule(
  actual: Awaited<ReturnType<typeof readSchedule>>,
  before: Awaited<ReturnType<typeof readSchedule>>,
) {
  // observed_at is the read time, not persisted project/task evidence.
  assert.ok(Date.parse(actual.observed_at) >= Date.parse(before.observed_at));
  assert.deepEqual({ ...actual, observed_at: before.observed_at }, before);
}
