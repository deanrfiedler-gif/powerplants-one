import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  acknowledged,
  started,
  base,
  principal,
  rows,
  startInput,
} from "../../tests/helpers/field";
import { readFieldJob } from "../../src/field/reads";
import { readFieldReadiness } from "../../src/field/readiness";
import { createCs, readCs, saveCs } from "../../src/shared/cs/service";
import { syncBatch, digest } from "../../src/offline/server";
import { downloadContext, preserveRecovery } from "../../src/offline/recovery";
import { readTimer } from "../../src/field/timer";
import type { Command, WireOperation } from "../../src/offline/protocol";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable test database");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
type Download = Awaited<ReturnType<typeof downloadContext>>;
function wire(
  d: Download,
  command: Command,
  payload: Record<string, unknown>,
  depends_on: string[] = [],
): WireOperation {
  const o = {
    schema_version: 1,
    operation_id: String(payload.operation_id),
    actor_id: d.owner.actor_id,
    workspace_id: d.owner.workspace_id,
    appointment_id: d.job.id,
    command,
    target_id: null,
    authority: d.authority,
    depends_on,
    supersedes_operation_id: null,
    payload,
  };
  return { ...o, payload_hash: digest(o) };
}
test("FI02 timer originals retain sequence, deduplicate lost responses and preserve revoked evidence in restricted recovery", async () => {
  const f = await started(),
    d = await downloadContext(f.p, f.job.id, {}),
    start =
      Math.ceil(Date.parse(f.job.attendance!.captured_at) / 1000) * 1000 + 1000;
  const make = (
    action: string,
    version: number,
    at: number,
    extra: Record<string, unknown> = {},
    deps: string[] = [],
  ) =>
    wire(
      d,
      "Timer",
      {
        ...base(),
        attendance_id: f.job.attendance!.id,
        expected_version: version,
        action,
        occurred_at: new Date(start + at * 1000).toISOString(),
        scope_item_id: ["Start", "Resume"].includes(action)
          ? f.job.scope.items[0].id
          : null,
        asset_id: ["Start", "Resume"].includes(action)
          ? (f.job.scope.items[0].assets[0]?.id ?? null)
          : null,
        pause_reason: null,
        note: null,
        undo_event_id: null,
        ...extra,
      },
      deps,
    );
  const a = make("Start", 0, 0),
    b = make("Pause", 1, 30, { pause_reason: "Break" }, [a.operation_id]),
    c = make("Resume", 2, 60, {}, [b.operation_id]);
  const result = await syncBatch(f.p, { operations: [c, b, a] });
  assert.deepEqual(
    result.outcomes.map((x) => x.state),
    ["ServerSaved", "ServerSaved", "ServerSaved"],
  );
  assert.deepEqual(
    (await syncBatch(f.p, { operations: [a, b, c] })).outcomes.map(
      (x) => x.receipt,
    ),
    result.outcomes
      .slice()
      .reverse()
      .map((x) => x.receipt),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_timer_events"))[0].n,
    3,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.field_entries WHERE kind='Time'",
      )
    )[0].n,
    2,
  );
  const stopped = make("Stop", 3, 90, {}, [c.operation_id]);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='field.capture.own'",
    [f.p.actor_id],
  );
  const denied = await syncBatch(f.p, { operations: [stopped] });
  assert.equal(denied.outcomes[0].state, "ReviewRequired");
  assert.equal(denied.outcomes[0].receipt, undefined);
  const retained = await preserveRecovery(f.p, {
    grant_id: d.recovery.id,
    token: d.recovery.token,
    operation: stopped,
  });
  assert.equal(retained.normal_acceptance, false);
  assert.equal((await readTimer(f.p, f.job.id)).timer!.state, "Running");
  const original = (
    await rows(
      "SELECT envelope FROM ppo.offline_recovery_cases WHERE operation_id=$1",
      [stopped.operation_id],
    )
  )[0].envelope;
  assert.equal(original.operation_id, stopped.operation_id);
  assert.equal(original.payload.occurred_at, stopped.payload.occurred_at);
  await assert.rejects(
    preserveRecovery(f.p, {
      grant_id: d.recovery.id,
      token: d.recovery.token,
      operation: a,
    }),
    (e) => (e as { code: string }).code === "AlreadyAccepted",
  );
});
test("FI02 exact readiness review precedes provisional attendance and rejects changed cached sources without granting permission", async () => {
  const f = await acknowledged(),
    p = await principal("assigned-technician"),
    job = (await readFieldJob(p, f.pack.appointment_id)).items[0];
  const id = randomUUID();
  await createCs(f.p, "Readiness", {
    ...base(),
    id,
    context_id: job.site.id,
    name: "SYN cached field readiness",
    owner_id: f.p.actor_id,
  });
  const d = await downloadContext(p, job.id, {}),
    v = await readFieldReadiness(p, job.id, {
      record_id: id,
      activity: "Inspection",
    });
  const ack = wire(d, "FieldReadiness", {
    ...base(),
    record_id: id,
    expected_version: v.source!.version,
    presented_hash: v.source!.presented_hash,
    facility_ids: [],
    activity: "Inspection",
  });
  const result = await syncBatch(p, { operations: [ack] });
  assert.equal(result.outcomes[0].state, "ServerSaved");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_attendances"))[0].n,
    0,
  );
  assert.deepEqual(
    (await syncBatch(p, { operations: [ack] })).outcomes[0].receipt,
    result.outcomes[0].receipt,
  );
  const changed = wire(d, "FieldReadiness", { ...ack.payload, ...base() });
  const cs = await readCs(f.p, "Readiness", id);
  await saveCs(f.p, "Readiness", id, {
    ...base(),
    expected_version: cs.record.version,
    name: cs.record.name,
    owner_id: cs.record.owner_id,
    content: {
      ...cs.record.content,
      requirements: [
        {
          id: randomUUID(),
          revision: 1,
          title: "SYN new instruction",
          kind: "Clean-down",
          facility_id: null,
          activity: "Inspection",
          source: "SYN changed recorded requirement",
        },
      ],
    },
  });
  const stale = await syncBatch(p, { operations: [changed] });
  assert.equal(stale.outcomes[0].state, "ReviewRequired");
  assert.equal(stale.outcomes[0].code, "SourceChanged");
  const start = wire(d, "Start", startInput(job), [ack.operation_id]);
  const task = job.scope.items[0],
    timer = wire(
      d,
      "Timer",
      {
        ...base(),
        attendance_id: { operation_id: start.operation_id },
        expected_version: 0,
        action: "Start",
        occurred_at: new Date(
          Math.ceil(Date.parse(String(start.payload.captured_at)) / 1000) *
            1000 +
            1000,
        ).toISOString(),
        scope_item_id: task.id,
        asset_id: task.assets[0]?.id ?? null,
        pause_reason: null,
        note: null,
        undo_event_id: null,
      },
      [start.operation_id],
    );
  const started = await syncBatch(p, { operations: [timer, start] });
  assert.deepEqual(
    started.outcomes.map((x) => x.state),
    ["ServerSaved", "ServerSaved"],
  );
  assert.equal((await readTimer(p, job.id)).timer!.state, "Running");
  const oldViewAgain = wire(d, "FieldReadiness", { ...ack.payload, ...base() });
  const old = (await syncBatch(p, { operations: [oldViewAgain] })).outcomes[0];
  assert.equal(old.state, "ReviewRequired");
  assert.equal(old.receipt, undefined);
});
