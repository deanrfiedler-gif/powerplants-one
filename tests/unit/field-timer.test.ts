import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { timerCommand, timerInstant } from "../../src/field/timer-model";
import { localTimer } from "../../src/offline/timer";
import type { WireOperation } from "../../src/offline/protocol";

const appointment = randomUUID();
test("FI01 rapid actions never round before millisecond arrival or the prior timer event", () => {
  const arrival = "2026-09-27T01:00:00.900Z";
  const first = timerInstant(arrival, Date.parse(arrival) + 20);
  assert.equal(first, "2026-09-27T01:00:01.000Z");
  assert.equal(timerInstant(first, Date.parse(arrival) + 40), first);
  assert.equal(
    timerInstant(first, Date.parse(first) + 2500),
    "2026-09-27T01:00:03.000Z",
  );
});
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN timer boundary",
  attendance_id: randomUUID(),
  expected_version: 0,
  action: "Start",
  occurred_at: "2026-09-27T01:00:00.000Z",
  scope_item_id: randomUUID(),
});
test("FI01 timer input refuses ambiguous precision, unowned meaning and incomplete pause context", () => {
  const start = base();
  assert.equal(timerCommand(appointment, start).action, "Start");
  for (const patch of [
    { occurred_at: "2026-09-27T01:00:00.001Z" },
    { scope_item_id: null },
    { expected_version: -1 },
    { billable: true },
    { action: "Pause", pause_reason: "Break" },
    { action: "Undo", scope_item_id: null },
  ])
    assert.throws(() => timerCommand(appointment, { ...start, ...patch }));
  const pause = {
    ...start,
    action: "Pause",
    scope_item_id: null,
    pause_reason: "WaitingForParts",
  };
  assert.throws(() => timerCommand(appointment, pause));
  assert.equal(
    timerCommand(appointment, {
      ...pause,
      note: "SYN supplier confirmation pending",
    }).note,
    "SYN supplier confirmation pending",
  );
});

function row(
  version: number,
  action: string,
  state = "Queued",
  extra: Record<string, unknown> = {},
) {
  return {
    original: {
      schema_version: 1,
      actor_id: randomUUID(),
      workspace_id: randomUUID(),
      target_id: null,
      depends_on: [],
      supersedes_operation_id: null,
      payload_hash: "synthetic-unsubmitted-projection",
      authority: {
        assignment_id: randomUUID(),
        assignment_version: 1,
        schedule_version: 1,
        scope_revision_id: randomUUID(),
        scope_version: 1,
        scope_hash: "synthetic",
        issue_id: randomUUID(),
        issue_hash: "synthetic",
      },
      operation_id: randomUUID(),
      appointment_id: appointment,
      command: "Timer",
      payload: {
        expected_version: version,
        action,
        occurred_at: `2026-09-27T01:0${version}:00.000Z`,
        scope_item_id: "original-task",
        ...extra,
      },
    } as WireOperation,
    status: { state },
  };
}
test("FI02 local timer orders retained originals without treating the preview as a server receipt", () => {
  const start = row(0, "Start"),
    pause = row(1, "Pause", "Queued", { pause_reason: "WaitingForParts" }),
    stop = row(2, "Stop");
  const projected = localTimer(undefined, appointment, [stop, start, pause]);
  assert.equal(projected.state, "Stopped");
  assert.equal(projected.version, 3);
  assert.equal(projected.pending, 3);
  assert.equal(projected.last_operation_id, stop.original.operation_id);
  assert.equal(projected.blocked, false);
  assert.equal(localTimer(undefined, randomUUID(), [start]).state, "Idle");
});
test("FI02 failed, duplicate, missing and unresolved predecessors block later local timer intent", () => {
  for (const originals of [
    [row(1, "Pause")],
    [row(0, "Start"), row(0, "Start")],
    [row(0, "Start", "Conflict"), row(1, "Pause")],
    [row(0, "Start", "ReviewRequired")],
    [row(0, "Undo")],
  ])
    assert.equal(localTimer(undefined, appointment, originals).blocked, true);
  assert.equal(
    localTimer(undefined, appointment, [row(0, "Start", "ServerSaved")])
      .pending,
    0,
  );
});
