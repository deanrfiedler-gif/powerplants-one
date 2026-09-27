import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import { requireCapability, type QueryClient } from "../platform/permissions";
import { insert } from "../documents/packs";
import { sameVersion } from "../scheduling/validation";
import { object, uuid } from "../shared/validation";
import {
  attendanceContext,
  attribution,
  currentCaptureState,
  fieldContext,
} from "./context";
import { captureEntryMutation } from "./entries";
import { entryCommand } from "./validation";
import {
  timerCommand,
  pauseKind,
  pauseLabels,
  type TimerDto,
  type TimerEventDto,
  type TimerState,
  type TimerView,
} from "./timer-model";

type TimerRow = Omit<
  TimerDto,
  "open_since" | "updated_at" | "last_occurred_at"
> & {
  workspace_id: string;
  actor_id: string;
  open_since: Date | null;
  updated_at: Date;
  last_occurred_at: Date;
};
type EventRow = Omit<TimerEventDto, "occurred_at" | "received_at"> & {
  occurred_at: Date;
  received_at: Date;
  open_since: Date | null;
  time_kind: string | null;
  scope_item_id: string;
  asset_id: string | null;
};
const iso = (d: Date | null) => d?.toISOString() ?? null;
function fail(code: string, message: string): never {
  throw new AppError(409, code, message);
}
async function timerRow(c: QueryClient, p: Principal, attendance: string) {
  return (
    (
      await c.query<TimerRow>(
        "SELECT * FROM ppo.field_timers WHERE workspace_id=$1 AND actor_id=$2 AND attendance_id=$3",
        [p.workspace_id, p.actor_id, attendance],
      )
    ).rows[0] ?? null
  );
}
async function events(c: QueryClient, p: Principal, attendance: string) {
  return (
    await c.query<EventRow>(
      "SELECT * FROM ppo.field_timer_events WHERE workspace_id=$1 AND actor_id=$2 AND attendance_id=$3 ORDER BY version",
      [p.workspace_id, p.actor_id, attendance],
    )
  ).rows;
}
async function captureClosed(c: QueryClient, p: Principal, attendance: string) {
  return !!(
    await c.query(
      "SELECT 1 FROM ppo.service_reports WHERE workspace_id=$1 AND attendance_id=$2 AND (revision>0 OR status IN ('Submitted','Reviewed','Issued')) UNION ALL SELECT 1 FROM ppo.attendance_acceptances WHERE workspace_id=$1 AND attendance_id=$2",
      [p.workspace_id, attendance],
    )
  ).rowCount;
}
export async function timerReceiptAuthority(
  c: QueryClient,
  p: Principal,
  appointmentId: string,
  operationId: string,
) {
  await fieldContext(c, p, appointmentId, "field.capture.own");
  if (
    !(
      await c.query(
        "SELECT 1 FROM ppo.field_timer_events WHERE workspace_id=$1 AND actor_id=$2 AND appointment_id=$3 AND operation_id=$4",
        [p.workspace_id, p.actor_id, appointmentId, operationId],
      )
    ).rowCount
  )
    throw unavailable();
}
export async function readTimer(
  p: Principal,
  appointmentId: string,
  query: unknown = {},
): Promise<TimerView> {
  object(query, []);
  return transaction(async (c) => {
    const ctx = await fieldContext(c, p, uuid(appointmentId, "appointment_id"));
    const a = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.field_attendances WHERE workspace_id=$1 AND actor_id=$2 AND appointment_id=$3",
        [p.workspace_id, p.actor_id, appointmentId],
      )
    ).rows[0];
    const now = (await c.query<{ now: Date }>("SELECT clock_timestamp() now"))
      .rows[0].now;
    if (!a)
      return {
        appointment_id: ctx.a.id,
        timer: null,
        events: [],
        server_now: now.toISOString(),
        currentness: "NotStarted",
        capture_closed: false,
        undo: null,
      };
    const attendance = await attendanceContext(
        c,
        p,
        appointmentId,
        a.id,
        "field.read.own",
      ),
      timer = await timerRow(c, p, a.id),
      history = await events(c, p, a.id),
      last = history.at(-1);
    const currentness = await currentCaptureState(c, p, attendance),
      closed = await captureClosed(c, p, a.id);
    const undo =
      last &&
      ["Pause", "Stop"].includes(last.action) &&
      currentness === "Current" &&
      !closed &&
      now.getTime() < last.received_at.getTime() + 8000
        ? {
            event_id: last.id,
            expires_at: new Date(
              last.received_at.getTime() + 8000,
            ).toISOString(),
          }
        : null;
    return {
      appointment_id: ctx.a.id,
      timer: timer
        ? {
            attendance_id: timer.attendance_id,
            appointment_id: timer.appointment_id,
            version: timer.version,
            state: timer.state,
            open_since: iso(timer.open_since),
            time_kind: timer.time_kind,
            scope_item_id: timer.scope_item_id,
            asset_id: timer.asset_id,
            pause_reason: timer.pause_reason,
            note: timer.note,
            updated_at: timer.updated_at.toISOString(),
            last_occurred_at: timer.last_occurred_at.toISOString(),
          }
        : null,
      events: history.map((e) => ({
        id: e.id,
        version: e.version,
        action: e.action,
        state_before: e.state_before,
        state_after: e.state_after,
        occurred_at: e.occurred_at.toISOString(),
        received_at: e.received_at.toISOString(),
        reason: e.reason,
        note: e.note,
        pause_reason: e.pause_reason,
        entry_root_id: e.entry_root_id,
        undo_event_id: e.undo_event_id,
        operation_id: e.operation_id,
        authority_state: e.authority_state,
      })),
      server_now: now.toISOString(),
      currentness,
      capture_closed: closed,
      undo,
    };
  });
}
export async function activeTimer(p: Principal, _id = "", query: unknown = {}) {
  object(query, []);
  return transaction(async (c) => {
    await requireCapability(c, p, "field.read.own");
    const t = (
      await c.query<TimerRow>(
        "SELECT * FROM ppo.field_timers WHERE workspace_id=$1 AND actor_id=$2 AND state IN ('Running','Paused')",
        [p.workspace_id, p.actor_id],
      )
    ).rows[0];
    if (!t) return { timer: null, unavailable: false };
    try {
      const ctx = await fieldContext(c, p, t.appointment_id);
      return {
        timer: {
          appointment_id: t.appointment_id,
          reference: ctx.a.display_number,
          state: t.state,
          open_since: iso(t.open_since),
          pause_reason: t.pause_reason,
        },
        unavailable: false,
      };
    } catch (e) {
      if (e instanceof AppError && [403, 404].includes(e.status))
        return { timer: null, unavailable: true };
      throw e;
    }
  });
}
export async function commandTimer(
  p: Principal,
  appointmentId: string,
  input: unknown,
) {
  const cmd = timerCommand(appointmentId, input);
  return sharedOperation(
    p,
    cmd,
    `FieldTimer:${cmd.action}`,
    (c) =>
      attendanceContext(
        c,
        p,
        cmd.appointment_id,
        cmd.attendance_id,
        "field.capture.own",
      ),
    async (c, ctx) => {
      const previous = await timerRow(c, p, cmd.attendance_id),
        before = previous?.state ?? "Idle";
      sameVersion(previous?.version ?? 0, cmd.expected_version, "work timer");
      const now = (await c.query<{ now: Date }>("SELECT clock_timestamp() now"))
        .rows[0].now;
      const occurred = new Date(cmd.occurred_at);
      if (
        occurred.getTime() > now.getTime() + 300000 ||
        occurred.getTime() < new Date(ctx.attendance.captured_at).getTime() ||
        (previous && occurred < previous.last_occurred_at)
      )
        throw new AppError(
          422,
          "TimerTimeInvalid",
          "Use an actual time after your arrival and the last timer action, no more than five minutes ahead of the server.",
        );
      if (await captureClosed(c, p, cmd.attendance_id))
        fail(
          "NewVisitRequired",
          "This visit's evidence has been submitted. Further work needs a separately authorised visit; factual corrections keep their original lineage.",
        );
      const currentness = await currentCaptureState(c, p, ctx);
      if (
        ["Start", "Resume", "Undo"].includes(cmd.action) &&
        currentness !== "Current"
      )
        fail(
          "AuthorityChanged",
          "Review the current assignment, scope and issued pack before starting or resuming work. Your timer history is retained.",
        );
      const allowed: Record<typeof cmd.action, readonly string[]> = {
        Start: ["Idle"],
        Pause: ["Running"],
        Resume: ["Paused", "Stopped"],
        Stop: ["Running", "Paused"],
        Undo: ["Paused", "Stopped"],
      };
      if (!allowed[cmd.action].includes(before))
        fail(
          "TimerStateChanged",
          "This action no longer matches the saved timer. Refresh it and review the retained history.",
        );
      if (
        ["Start", "Resume", "Undo"].includes(cmd.action) &&
        (
          await c.query(
            "SELECT 1 FROM ppo.field_timers WHERE workspace_id=$1 AND actor_id=$2 AND attendance_id<>$3 AND state IN ('Running','Paused')",
            [p.workspace_id, p.actor_id, cmd.attendance_id],
          )
        ).rowCount
      )
        fail(
          "PersonalTimerActive",
          "Finish your other personal work timer first. If that work is no longer accessible, Service must restore legitimate access so its original can be resolved.",
        );
      let state: TimerState =
        cmd.action === "Pause"
          ? "Paused"
          : cmd.action === "Stop"
            ? "Stopped"
            : "Running";
      let openSince: Date | null = state === "Stopped" ? null : occurred;
      let scopeItem = cmd.scope_item_id ?? previous?.scope_item_id ?? null,
        asset = cmd.scope_item_id ? cmd.asset_id : (previous?.asset_id ?? null);
      let kind: string | null =
        state === "Stopped"
          ? null
          : state === "Paused"
            ? pauseKind(cmd.pause_reason!)
            : "Labour";
      let pauseReason = cmd.pause_reason,
        note = cmd.note;
      let closedEntry: string | null = null;
      if (cmd.action === "Undo") {
        const history = await events(c, p, cmd.attendance_id),
          target = history.at(-1),
          prior = history.at(-2);
        if (
          !target ||
          !prior ||
          target.id !== cmd.undo_event_id ||
          !["Pause", "Stop"].includes(target.action) ||
          now.getTime() > target.received_at.getTime() + 8000
        )
          fail(
            "UndoExpired",
            "The eight-second Undo window has ended or another action was saved. Resume work or make an attributable correction instead.",
          );
        state = target.state_before as TimerState;
        openSince = target.occurred_at;
        scopeItem = prior.scope_item_id;
        asset = prior.asset_id;
        kind = prior.time_kind;
        pauseReason = prior.pause_reason;
        note = prior.note;
      } else if (previous?.open_since) {
        if (occurred.getTime() - previous.open_since.getTime() > 172800000)
          throw new AppError(
            422,
            "TimerFinishRequired",
            "Set when you actually finished, within 48 hours of this stretch's start. Do not invent an automatic finish.",
          );
        if (occurred > previous.open_since) {
          closedEntry = randomUUID();
          const entry = entryCommand({
            schema_version: 1,
            operation_id: cmd.operation_id,
            reason: cmd.reason,
            id: closedEntry,
            appointment_id: cmd.appointment_id,
            attendance_id: cmd.attendance_id,
            kind: "Time",
            scope_item_id: previous.scope_item_id,
            asset_id: previous.asset_id,
            captured_at: cmd.occurred_at,
            payload: {
              time_kind: previous.time_kind,
              start_at: previous.open_since.toISOString(),
              end_at: cmd.occurred_at,
              note: previous.pause_reason
                ? `${pauseLabels[previous.pause_reason]}${previous.note ? `: ${previous.note}` : ""}`
                : previous.note,
            },
          });
          await captureEntryMutation(c, p, entry, ctx);
        }
      }
      if (!scopeItem)
        throw new AppError(
          422,
          "AttributionRequired",
          "Choose the original authorised task.",
        );
      await attribution(c, p, ctx, scopeItem, asset, true);
      if (openSince && (!previous || before === "Stopped")) {
        if (
          (
            await c.query(
              "SELECT 1 FROM ppo.field_time_ranges WHERE workspace_id=$1 AND actor_id=$2 AND end_at>$3 AND start_at<=clock_timestamp()+interval '5 minutes'",
              [p.workspace_id, p.actor_id, openSince],
            )
          ).rowCount
        )
          fail(
            "TimeOverlap",
            "The chosen start is already covered by recorded time. Correct the existing evidence or choose a later actual start.",
          );
      }
      const nextVersion = (previous?.version ?? 0) + 1;
      const fields = {
        workspace_id: p.workspace_id,
        appointment_id: cmd.appointment_id,
        actor_id: p.actor_id,
        attendance_id: cmd.attendance_id,
        version: nextVersion,
        state,
        open_since: openSince,
        time_kind: kind,
        scope_item_id: scopeItem,
        asset_id: asset,
        pause_reason: pauseReason,
        note,
        last_occurred_at: occurred,
        updated_at: now,
      };
      if (previous)
        await c.query(
          "UPDATE ppo.field_timers SET version=$3,state=$4,open_since=$5,time_kind=$6,scope_item_id=$7,asset_id=$8,pause_reason=$9,note=$10,last_occurred_at=$11,updated_at=$12 WHERE workspace_id=$1 AND attendance_id=$2",
          [
            p.workspace_id,
            cmd.attendance_id,
            nextVersion,
            state,
            openSince,
            kind,
            scopeItem,
            asset,
            pauseReason,
            note,
            occurred,
            now,
          ],
        );
      else await insert(c, "field_timers", fields);
      const eventId = randomUUID();
      await insert(c, "field_timer_events", {
        id: eventId,
        workspace_id: p.workspace_id,
        appointment_id: cmd.appointment_id,
        actor_id: p.actor_id,
        attendance_id: cmd.attendance_id,
        version: nextVersion,
        action: cmd.action,
        state_before: before,
        state_after: state,
        occurred_at: occurred,
        received_at: now,
        reason: cmd.reason,
        note,
        pause_reason: pauseReason,
        open_since: openSince,
        time_kind: kind,
        scope_item_id: scopeItem,
        asset_id: asset,
        entry_root_id: closedEntry,
        undo_event_id: cmd.undo_event_id,
        operation_id: cmd.operation_id,
        authority_state: currentness,
      });
      return {
        id: cmd.appointment_id,
        version: nextVersion,
        state,
        updated_at: now,
        audit_details: {
          attendance_id: cmd.attendance_id,
          timer_event_id: eventId,
          entry_root_id: closedEntry,
          action: cmd.action,
          authority_state: currentness,
          job_cost_capture_only: true,
        },
      };
    },
    "Appointment",
    "FieldTimerChanged",
  );
}

export async function assertTimerFinished(
  c: PoolClient,
  p: Principal,
  attendanceId: string,
) {
  if (
    (await c.query("SELECT to_regclass('ppo.field_timers') relation")).rows[0]
      .relation &&
    (
      await c.query(
        "SELECT 1 FROM ppo.field_timers WHERE workspace_id=$1 AND attendance_id=$2 AND state IN ('Running','Paused')",
        [p.workspace_id, attendanceId],
      )
    ).rowCount
  )
    fail(
      "TimerStillOpen",
      "Finish your work timer before submitting completion. Saved intervals and timer history are retained.",
    );
}
