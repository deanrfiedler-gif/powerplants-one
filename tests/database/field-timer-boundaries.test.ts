import { estimateReviewSeedGrants, quotationReleaseSeedGrants } from "../helpers/engineering-materials-grants";
import { incidentSeedGrants } from "../helpers/engineering-materials-grants";
import assert from "node:assert/strict";
import { canonical } from "../../src/platform/operations";
import { schedulingPolicySeedGrants } from "../helpers/engineering-materials-grants";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  started,
  base,
  principal,
  startInput,
  draft,
  entry,
  timePayload,
} from "../helpers/field";
import { queued } from "../helpers/packs";
import { acknowledgePack, readPack } from "../../src/documents/packs";
import { processRenderJob } from "../../src/documents/worker";
import { readFieldJob } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";
import { captureEntry } from "../../src/field/entries";
import { saveCompletionDraft } from "../../src/field/completion";
import { commandTimer, readTimer, activeTimer } from "../../src/field/timer";
import { submitCompletion } from "../../src/reports/service";
import { readOperation } from "../../src/shared/receipts";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (expected: string) => (error: unknown) =>
  (error as { code: string }).code === expected;
type Job = Awaited<ReturnType<typeof readFieldJob>>["items"][number];
const at = (job: Job) =>
  Math.ceil(Date.parse(job.attendance!.captured_at) / 1000) * 1000 + 1000;
const cmd = (
  job: Job,
  action: string,
  version: number,
  when: number,
  extra: Record<string, unknown> = {},
) => ({
  ...base(),
  attendance_id: job.attendance!.id,
  action,
  expected_version: version,
  occurred_at: new Date(when).toISOString(),
  scope_item_id: ["Start", "Resume"].includes(action)
    ? job.scope.items[0].id
    : null,
  asset_id: ["Start", "Resume"].includes(action)
    ? (job.scope.items[0].assets[0]?.id ?? null)
    : null,
  pause_reason: null,
  note: null,
  undo_event_id: null,
  ...extra,
});

test("FI01 one personal timer spans appointments, preserves denied originals and checks receipt authority", async () => {
  const f = await started(),
    q = await queued(10),
    render = await processRenderJob(q.pack.jobs[0].id);
  assert.ok("issue_id" in render);
  for (const profile of ["assigned-technician", "second-technician"]) {
    const p = await principal(profile),
      pack = (await readPack(q.p, q.pack.id)).items[0];
    const recipient = pack.readiness.recipients.find(
      (x: { user_id: string }) => x.user_id === p.actor_id,
    )!;
    await acknowledgePack(p, render.issue_id!, {
      ...base(),
      assignment_id: recipient.assignment_id,
      assignment_version: recipient.assignment_version,
      presented_hash: pack.issues[0].output_hash,
      captured_at: new Date().toISOString(),
    });
  }
  let other = (await readFieldJob(f.p, q.pack.appointment_id)).items[0];
  await startAttendance(f.p, other.id, startInput(other));
  other = (await readFieldJob(f.p, other.id)).items[0];
  const a = cmd(f.job, "Start", 0, at(f.job)),
    b = cmd(other, "Start", 0, at(other));
  const results = await Promise.allSettled([
    commandTimer(f.p, f.job.id, a),
    commandTimer(f.p, other.id, b),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const refused = results.find(
    (r) => r.status === "rejected",
  ) as PromiseRejectedResult;
  assert.equal(refused.reason.code, "PersonalTimerActive");
  const chosen = results[0].status === "fulfilled" ? f.job : other,
    original = results[0].status === "fulfilled" ? a : b;
  const receipt = await readOperation(f.p, original.operation_id);
  assert.equal(receipt.record_id, chosen.id);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='field.capture.own'",
    [f.p.actor_id],
  );
  await assert.rejects(readOperation(f.p, original.operation_id));
  await assert.rejects(commandTimer(f.p, chosen.id, original));
  assert.equal((await activeTimer(f.p)).timer?.appointment_id, chosen.id);
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.field_timer_events",
      )
    ).rows[0].n,
    1,
  );
});

test("FI01 zero-second transitions, real Undo expiry and report freeze keep distinct authority", async () => {
  const f = await started(),
    start = at(f.job);
  await commandTimer(f.p, f.job.id, cmd(f.job, "Start", 0, start));
  await commandTimer(f.p, f.job.id, cmd(f.job, "Stop", 1, start));
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.field_entries WHERE attendance_id=$1",
        [f.job.attendance!.id],
      )
    ).rows[0].n,
    0,
  );
  await commandTimer(f.p, f.job.id, cmd(f.job, "Resume", 2, start));
  await commandTimer(
    f.p,
    f.job.id,
    cmd(f.job, "Pause", 3, start + 10000, { pause_reason: "Travel" }),
  );
  const paused = await readTimer(f.p, f.job.id);
  assert.ok(paused.undo);
  await setTimeout(8100);
  await assert.rejects(
    commandTimer(
      f.p,
      f.job.id,
      cmd(f.job, "Undo", 4, start + 11000, {
        undo_event_id: paused.events.at(-1)!.id,
      }),
    ),
    code("UndoExpired"),
  );
  const submit = {
    ...base(),
    id: randomUUID(),
    attendance_id: f.job.attendance!.id,
    draft_revision_id: randomUUID(),
    expected_draft_version: 1,
    expected_report_version: 0,
    expected_appointment_version: f.job.version,
    attendance_end_at: new Date(start + 31000).toISOString(),
  };
  await assert.rejects(
    submitCompletion(f.p, f.job.id, submit),
    code("TimerStillOpen"),
  );
  await commandTimer(f.p, f.job.id, cmd(f.job, "Stop", 4, start + 30000));
  let job = (await readFieldJob(f.p, f.job.id)).items[0];
  await saveCompletionDraft(f.p, job.id, draft(job));
  job = (await readFieldJob(f.p, job.id)).items[0];
  await submitCompletion(f.p, job.id, {
    ...submit,
    operation_id: randomUUID(),
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft!.version,
    expected_appointment_version: job.version,
  });
  assert.equal((await readTimer(f.p, job.id)).capture_closed, true);
  await assert.rejects(
    commandTimer(f.p, job.id, cmd(job, "Resume", 5, start + 31000)),
    code("NewVisitRequired"),
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.attendance_acceptances",
      )
    ).rows[0].n,
    0,
  );
});

test("FI01 additive 0049 upgrade retains existing time, arrivals, receipts and revoked grants", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(49);
  await seed(49);
  const f = await started();
  await captureEntry(f.p, entry(f.job, "Time", timePayload()));
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='field.capture.own'",
    [f.p.actor_id],
  );
  const tables = [
    "field_attendances",
    "field_entries",
    "field_time_ranges",
    "operation_receipts",
    "audit_events",
    "permission_grants",
    "supply_records",
  ];
  const rows = () =>
    Promise.all(
      tables.map((t) =>
        database()
          .query(
            `SELECT row_to_json(x) row FROM ppo.${t} x ORDER BY row_to_json(x)::text`,
          )
          .then((r) => r.rows),
      ),
    );
  const before = await rows();
  const migrationsBefore = (
    await database().query(
      "SELECT version,sha256,applied_at FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  await migrate();
  const migrationsAfter = (
    await database().query(
      "SELECT version,sha256,applied_at FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(
    migrationsAfter.slice(0, migrationsBefore.length),
    migrationsBefore,
  );
  assert.deepEqual(
    migrationsAfter.slice(migrationsBefore.length).map((row) => row.version),
    [50, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72],
  );
  await seed();
  await migrate();
  await seed();
  const after = await rows();
  for (let i = 0; i < tables.length; i++) {
    if (tables[i] !== "permission_grants") {
      assert.deepEqual(after[i], before[i]);
      continue;
    }
    // Preserve every earlier grant, including its ID and revocation, and require
    // exactly seed 54's twelve and seed 56's nine narrow grants; no additional grant is tolerated.
    const ids = new Set(before[i].map((x) => x.row.id));
    assert.deepEqual(
      after[i].filter((x) => ids.has(x.row.id)),
      before[i],
    );
    const additions = after[i]
      .filter((x) => !ids.has(x.row.id))
      .map((x) => x.row);
    assert.equal(additions.length, 39);
    const shape = (grants: Record<string, unknown>[]) =>
      grants
        .map(({ id: _id, ...value }) => {
          void _id;
          return canonical(value);
        })
        .sort();
    assert.deepEqual(
      shape(additions),
      shape([...schedulingPolicySeedGrants(before[i].map((x) => x.row)),...incidentSeedGrants(before[i].map((x) => x.row)),...estimateReviewSeedGrants(before[i].map((x) => x.row)),...quotationReleaseSeedGrants(before[i].map((x) => x.row))]),
    );
  }
  assert.equal(
    (await database().query("SELECT count(*)::int n FROM ppo.field_timers"))
      .rows[0].n,
    0,
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.field_timer_events",
      )
    ).rows[0].n,
    0,
  );
});
