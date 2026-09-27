// Browser/server types and validation, no clock or persistence side effects.
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
  instant,
  optionalId,
  optionalNarrative,
  narrative,
  invalid,
} from "../shared/validation";

export const timerActions = [
  "Start",
  "Pause",
  "Resume",
  "Stop",
  "Undo",
] as const;
export type TimerAction = (typeof timerActions)[number];
export const pauseReasons = [
  "Break",
  "Travel",
  "WaitingForParts",
  "WaitingForAccessOrCustomer",
  "WaitingForApproval",
  "UnsafeToContinue",
  "Other",
] as const;
export type PauseReason = (typeof pauseReasons)[number];
export const pauseLabels: Record<PauseReason, string> = {
  Break: "Break",
  Travel: "Travel · collecting parts",
  WaitingForParts: "Waiting for parts",
  WaitingForAccessOrCustomer: "Waiting for access or the customer",
  WaitingForApproval: "Waiting for approval",
  UnsafeToContinue: "Unsafe to continue",
  Other: "Something else",
};
export const pauseKind = (reason: PauseReason) =>
  reason === "Break"
    ? "Break"
    : reason === "Travel"
      ? "Travel"
      : reason === "Other"
        ? "Other"
        : "Waiting";
export const pauseNeedsNote = (reason: PauseReason) =>
  !["Break", "Travel"].includes(reason);
export type TimerState = "Running" | "Paused" | "Stopped";
export type TimerDto = {
  attendance_id: string;
  appointment_id: string;
  version: number;
  state: TimerState;
  open_since: string | null;
  time_kind: string | null;
  scope_item_id: string;
  asset_id: string | null;
  pause_reason: PauseReason | null;
  note: string | null;
  updated_at: string;
  last_occurred_at: string;
};
export type TimerEventDto = {
  id: string;
  version: number;
  action: TimerAction;
  state_before: TimerState | "Idle";
  state_after: TimerState;
  occurred_at: string;
  received_at: string;
  reason: string;
  note: string | null;
  pause_reason: PauseReason | null;
  entry_root_id: string | null;
  undo_event_id: string | null;
  operation_id: string;
  authority_state: string;
};
export type TimerView = {
  appointment_id: string;
  timer: TimerDto | null;
  events: TimerEventDto[];
  server_now: string;
  currentness: "Current" | "ReviewRequired" | "NotStarted";
  capture_closed: boolean;
  undo: { event_id: string; expires_at: string } | null;
};
export function timerCommand(appointmentId: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "attendance_id",
    "expected_version",
    "action",
    "occurred_at",
    "scope_item_id",
    "asset_id",
    "pause_reason",
    "note",
    "undo_event_id",
  ]);
  const action = choice(r.action, "action", timerActions),
    occurred_at = instant(r.occurred_at, "occurred_at");
  if (Date.parse(occurred_at) % 1000)
    invalid("occurred_at", "Record time in whole seconds.");
  const pause_reason =
    r.pause_reason == null
      ? null
      : choice(r.pause_reason, "pause_reason", pauseReasons);
  if ((action === "Pause") !== (pause_reason !== null))
    invalid("pause_reason", "Choose a pause reason only when pausing.");
  const undo_event_id = optionalId(r.undo_event_id, "undo_event_id");
  if ((action === "Undo") !== (undo_event_id !== null))
    invalid("undo_event_id", "Undo must name the exact last pause or stop.");
  const note =
    pause_reason && pauseNeedsNote(pause_reason)
      ? narrative(r.note, "note", 2000)
      : optionalNarrative(r.note, "note", 2000);
  const scope_item_id = optionalId(r.scope_item_id, "scope_item_id"),
    asset_id = optionalId(r.asset_id, "asset_id");
  if (["Start", "Resume"].includes(action) && !scope_item_id)
    invalid(
      "scope_item_id",
      "Choose the original authorised task for this work.",
    );
  if (!["Start", "Resume"].includes(action) && (scope_item_id || asset_id))
    invalid(
      "scope_item_id",
      "This transition retains its original task and asset.",
    );
  return {
    ...common(r),
    appointment_id: uuid(appointmentId, "appointment_id"),
    attendance_id: uuid(r.attendance_id, "attendance_id"),
    expected_version:
      r.expected_version === 0 ? 0 : version(r.expected_version),
    action,
    occurred_at,
    scope_item_id,
    asset_id,
    pause_reason,
    note,
    undo_event_id,
  };
}

export const wholeSecond = (now = Date.now()) =>
  new Date(Math.floor(now / 1000) * 1000).toISOString();
// Arrival has millisecond precision. The first timer second must not precede it;
// rapid subsequent clicks must also retain the last original's ordering.
export const timerInstant = (earliest: string | undefined, now = Date.now()) =>
  wholeSecond(
    Math.max(now, earliest ? Math.ceil(Date.parse(earliest) / 1000) * 1000 : 0),
  );
export function elapsedLabel(seconds: number) {
  const n = Math.max(0, Math.floor(seconds)),
    hours = Math.floor(n / 3600),
    minutes = Math.floor(n / 60) % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
