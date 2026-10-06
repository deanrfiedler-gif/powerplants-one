import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  started,
  base,
  entry,
  principal,
  rows,
} from "../../tests/helpers/field";
import { captureEntry } from "../../src/field/entries";
import { withdrawPack, readPack } from "../../src/documents/packs";
import {
  commandTimer,
  readTimer,
  activeTimer,
  assertTimerFinished,
} from "../../src/field/timer";
import { timerCommand } from "../../src/field/timer-model";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
async function fixture() {
  const f = await started(),
    start =
      Math.ceil(Date.parse(f.job.attendance!.captured_at) / 1000) * 1000 + 1000;
  const task = f.job.scope.items[0];
  const cmd = (
    action: string,
    version: number,
    seconds: number,
    extra: Record<string, unknown> = {},
  ) => ({
    ...base(),
    attendance_id: f.job.attendance!.id,
    expected_version: version,
    action,
    occurred_at: new Date(start + seconds * 1000).toISOString(),
    scope_item_id: ["Start", "Resume"].includes(action) ? task.id : null,
    asset_id: ["Start", "Resume"].includes(action)
      ? (task.assets[0]?.id ?? null)
      : null,
    pause_reason: null,
    note: null,
    undo_event_id: null,
    ...extra,
  });
  return { ...f, start, cmd };
}
test("FI01 durable transitions, pause notes, competing tabs, idempotent retry, correction lineage and separate arrival", async () => {
  const f = await fixture(),
    a0 = (
      await rows("SELECT * FROM ppo.field_attendances WHERE id=$1", [
        f.job.attendance!.id,
      ])
    )[0];
  const original = f.cmd("Start", 0, 0);
  const both = await Promise.all([
    commandTimer(f.p, f.job.id, original),
    commandTimer(f.p, f.job.id, original),
  ]);
  assert.deepEqual(both[0].receipt, both[1].receipt);
  assert.equal(both.filter((x) => x.replayed).length, 1);
  await assert.rejects(
    commandTimer(f.p, f.job.id, { ...original, reason: "Different intention" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    commandTimer(
      f.p,
      f.job.id,
      f.cmd("Pause", 1, 30, { pause_reason: "UnsafeToContinue" }),
    ),
    code("InvalidData"),
  );
  await commandTimer(
    f.p,
    f.job.id,
    f.cmd("Pause", 1, 30, {
      pause_reason: "UnsafeToContinue",
      note: "SYN isolation must be reviewed",
    }),
  );
  const [left, right] = await Promise.allSettled([
    commandTimer(f.p, f.job.id, f.cmd("Resume", 2, 60)),
    commandTimer(f.p, f.job.id, f.cmd("Resume", 2, 60)),
  ]);
  assert.equal([left, right].filter((x) => x.status === "fulfilled").length, 1);
  assert.equal([left, right].filter((x) => x.status === "rejected").length, 1);
  await commandTimer(f.p, f.job.id, f.cmd("Stop", 3, 90));
  const times = await rows(
    "SELECT * FROM ppo.field_entries WHERE appointment_id=$1 AND kind='Time' ORDER BY captured_at",
    [f.job.id],
  );
  assert.deepEqual(
    times.map((t) => t.payload.time_kind),
    ["Labour", "Waiting", "Labour"],
  );
  assert.deepEqual(
    times.map((t) => t.payload.elapsed_seconds),
    [30, 30, 30],
  );
  assert.match(times[1].payload.note, /Unsafe to continue.*SYN isolation/);
  assert.equal((await readTimer(f.p, f.job.id)).timer!.state, "Stopped");
  assert.equal((await activeTimer(f.p)).timer, null);
  const correction = {
    ...entry(f.job, "Time", {
      time_kind: "Labour",
      start_at: times[0].payload.start_at,
      end_at: new Date(f.start + 29000).toISOString(),
      note: "SYN corrected actual finish",
    }),
    expected_version: 1,
  };
  await captureEntry(f.p, correction, times[0].id);
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.field_entries WHERE root_id=$1",
        [times[0].id],
      )
    )[0].n,
    2,
  );
  assert.equal(
    (
      await rows("SELECT payload FROM ppo.field_entries WHERE id=$1", [
        times[0].id,
      ])
    )[0].payload.elapsed_seconds,
    30,
  );
  assert.deepEqual(
    (
      await rows("SELECT * FROM ppo.field_attendances WHERE id=$1", [
        f.job.attendance!.id,
      ])
    )[0],
    a0,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.attendance_acceptances"))[0].n,
    0,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.service_reports"))[0].n,
    0,
  );
});
test("FI01 Undo keeps originals and reopens the exact stretch without duplicates", async () => {
  const f = await fixture();
  await commandTimer(f.p, f.job.id, f.cmd("Start", 0, 0));
  await commandTimer(
    f.p,
    f.job.id,
    f.cmd("Pause", 1, 30, { pause_reason: "Break" }),
  );
  const paused = await readTimer(f.p, f.job.id),
    original = paused.events[1];
  assert.ok(paused.undo);
  const undo = f.cmd("Undo", 2, 31, { undo_event_id: original.id });
  await commandTimer(f.p, f.job.id, undo);
  await commandTimer(f.p, f.job.id, undo);
  await commandTimer(f.p, f.job.id, f.cmd("Stop", 3, 60));
  const v = await readTimer(f.p, f.job.id);
  assert.equal(v.events.length, 4);
  assert.equal(v.events[2].undo_event_id, original.id);
  const times = await rows(
    "SELECT payload FROM ppo.field_entries WHERE appointment_id=$1 AND kind='Time' ORDER BY captured_at",
    [f.job.id],
  );
  assert.deepEqual(
    times.map((t) => [t.payload.time_kind, t.payload.elapsed_seconds]),
    [
      ["Labour", 30],
      ["Labour", 30],
    ],
  );
  await assert.rejects(
    commandTimer(
      f.p,
      f.job.id,
      f.cmd("Undo", 4, 61, { undo_event_id: original.id }),
    ),
    code("UndoExpired"),
  );
});
test("FI01 source drift retains review-required time and revocation refuses commands", async () => {
  const f = await fixture();
  await commandTimer(f.p, f.job.id, f.cmd("Start", 0, 0));
  await assert.rejects(
    transaction((c) => assertTimerFinished(c, f.p, f.job.attendance!.id)),
    code("TimerStillOpen"),
  );
  const coordinator = await principal(),
    pack = (await readPack(coordinator, f.pack.id)).items[0];
  await withdrawPack(coordinator, pack.id, {
    ...base(),
    expected_version: pack.version,
    reason: "SYN source drift during work",
  });
  await commandTimer(
    f.p,
    f.job.id,
    f.cmd("Pause", 1, 30, {
      pause_reason: "WaitingForApproval",
      note: "SYN changed pack awaiting Service review",
    }),
  );
  await assert.rejects(
    commandTimer(f.p, f.job.id, f.cmd("Resume", 2, 60)),
    code("AuthorityChanged"),
  );
  assert.equal(
    (
      await rows(
        "SELECT authority_state FROM ppo.field_entries WHERE appointment_id=$1",
        [f.job.id],
      )
    )[0].authority_state,
    "ReviewRequired",
  );
  const original = f.cmd("Stop", 2, 60);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='field.capture.own'",
    [f.p.actor_id],
  );
  await assert.rejects(commandTimer(f.p, f.job.id, original));
  assert.equal((await readTimer(f.p, f.job.id)).timer!.state, "Paused");
  await assert.rejects(readTimer(await principal("technician"), f.job.id));
});
test("FI01 invalid temporal input, one active timer index and event retention cannot be bypassed", async () => {
  const f = await fixture();
  assert.throws(() =>
    timerCommand(
      f.job.id,
      f.cmd("Start", 0, 0, {
        occurred_at: new Date(f.start + 1).toISOString(),
      }),
    ),
  );
  await commandTimer(f.p, f.job.id, f.cmd("Start", 0, 0));
  await assert.rejects(
    commandTimer(
      f.p,
      f.job.id,
      f.cmd("Pause", 1, -1, { pause_reason: "Break" }),
    ),
    code("TimerTimeInvalid"),
  );
  await assert.rejects(
    database().query(
      "DELETE FROM ppo.field_timer_events WHERE attendance_id=$1",
      [f.job.attendance!.id],
    ),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.field_timers SET version=version+1,state='Stopped',open_since=null,time_kind=null WHERE attendance_id=$1",
      [f.job.attendance!.id],
    ),
  );
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.field_timer_events SELECT gen_random_uuid(),workspace_id,appointment_id,actor_id,attendance_id,version+2,action,state_before,state_after,occurred_at,received_at,reason,note,pause_reason,open_since,time_kind,scope_item_id,asset_id,entry_root_id,undo_event_id,$2 FROM ppo.field_timer_events WHERE attendance_id=$1",
      [f.job.attendance!.id, randomUUID()],
    ),
  );
});
