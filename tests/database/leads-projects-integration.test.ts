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
import { recoverSchema } from "../helpers/recover-schema";

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
    await recoverSchema(c);
    await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  });
  await migrate(version);
  await seed(version);
}
const ledger = () =>
  rows("SELECT * FROM public.ppo_migrations ORDER BY version");

test("fresh combined installation retains both registries and both domains through repeat migration and seed", async () => {
  await atVersion(113);
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
  sameLead(await readLead(p, input.id), before);
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
    [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 113],
  );
  assert.deepEqual(
    (
      await rows(
        // Migrations 0022/0023 deliberately add no seed receipts.
        "SELECT version FROM ppo.seed_receipts WHERE version>=18 ORDER BY version",
      )
    ).map((r) => r.version),
    [18, 19, 20, 21, 24, 29, 30, 31, 32, 40, 41, 44, 47, 48, 49, 51, 52, 53, 54, 55, 56, 58, 59, 78, 79, 80, 83, 84, 107, 108, 110],
  );
  await migrate();
  await seed();
  await migrate();
  await seed();
  await closeDatabase();
  assert.deepEqual(await ledger(), hashes);
  sameLead(await readLead(p, lead.id), beforeLead);
  sameSchedule(await readSchedule(p, project.id), beforeProject);
  assert.deepEqual(await readOperation(p, lead.operation_id), captured.receipt);
  assert.deepEqual(
    await readOperation(p, project.operation_id),
    created.receipt,
  );
  const result = await shellSearch(p, { q: lead.title });
  for (const [id, path] of [
    [lead.id, "/sales/leads"],
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
          r.href === `/sales/leads/${lead.id}` ||
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

// Preserve every original detail field across historical schemas. Readiness is
// a current-schema/access projection; observation time and age are not stored.
// The focused LREC tests independently verify these new derived semantics.
function sameLead(actual: Awaited<ReturnType<typeof readLead>>, before: Awaited<ReturnType<typeof readLead>>) {
  const { record_summary: currentSummary, conversion_readiness: currentReadiness, ...currentSaved } = actual;
  const { record_summary: originalSummary, conversion_readiness: originalReadiness, ...originalSaved } = before;
  assert.deepEqual(currentSaved, originalSaved);
  assert.deepEqual({ ...currentSummary, observed_at: originalSummary.observed_at, age_days: originalSummary.age_days }, originalSummary);
  assert(Date.parse(currentSummary.observed_at) >= Date.parse(originalSummary.observed_at));
  assert.equal(currentSummary.age_days, Math.max(0, Math.floor((Date.parse(currentSummary.observed_at) - Date.parse(actual.created_at)) / 86_400_000)));
  // 0018 predates the active five-stage pipeline. Only its pipeline/context
  // eligibility should change on upgrade; do not discard other readiness facts.
  if (currentReadiness.state !== originalReadiness.state) {
    assert.equal(originalReadiness.state, "Unavailable");
    assert.equal(currentReadiness.state, "NeedsAttention");
    assert.equal(originalReadiness.checks.find(c => c.key === "customer_context")?.state, "Unavailable");
    assert.equal(currentReadiness.checks.find(c => c.key === "customer_context")?.state, "Complete");
    assert.deepEqual(currentReadiness.checks.filter(c => c.key !== "customer_context"), originalReadiness.checks.filter(c => c.key !== "customer_context"));
    assert.equal(currentReadiness.authority, originalReadiness.authority);
    assert.equal(currentReadiness.lifecycle, originalReadiness.lifecycle);
    assert.equal(currentReadiness.context_source, originalReadiness.context_source);
  } else assert.deepEqual(currentReadiness, originalReadiness);
}
