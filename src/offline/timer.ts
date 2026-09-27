import type { TimerView, TimerState, PauseReason } from "../field/timer-model";
import { pauseKind } from "../field/timer-model";
import type { WireOperation } from "./protocol";
type Row = {
  original: WireOperation;
  status: { state: string; receipt?: unknown };
};
// A projection of retained local intent only. It never claims server authority or posts costing time.
export function localTimer(
  view: TimerView | undefined,
  appointmentId: string,
  rows: Row[],
) {
  const t = view?.timer;
  let version = t?.version ?? 0,
    state: TimerState | "Idle" = t?.state ?? "Idle",
    open_since = t?.open_since ?? null,
    time_kind = t?.time_kind ?? null;
  let scope_item_id = t?.scope_item_id ?? null,
    asset_id = t?.asset_id ?? null,
    note = t?.note ?? null,
    pause_reason = t?.pause_reason ?? null;
  let last_operation_id: string | null = null,
    blocked = false,
    pending = 0;
  const relevant = rows
    .filter(
      (r) =>
        r.original.appointment_id === appointmentId &&
        r.original.command === "Timer" &&
        Number(r.original.payload.expected_version) >= version,
    )
    .sort(
      (a, b) =>
        Number(a.original.payload.expected_version) -
        Number(b.original.payload.expected_version),
    );
  for (const row of relevant) {
    const p = row.original.payload;
    if (
      Number(p.expected_version) !== version ||
      ["Failed", "Conflict"].includes(row.status.state) ||
      (row.status.state === "ReviewRequired" && !row.status.receipt)
    ) {
      blocked = true;
      break;
    }
    if (p.action === "Undo") {
      blocked = true;
      break;
    }
    state =
      p.action === "Stop"
        ? "Stopped"
        : p.action === "Pause"
          ? "Paused"
          : "Running";
    open_since = state === "Stopped" ? null : String(p.occurred_at);
    pause_reason =
      p.action === "Pause" ? (p.pause_reason as PauseReason) : null;
    time_kind =
      state === "Stopped"
        ? null
        : pause_reason
          ? pauseKind(pause_reason)
          : "Labour";
    if (p.action === "Start" || p.action === "Resume") {
      scope_item_id = String(p.scope_item_id);
      asset_id = p.asset_id ? String(p.asset_id) : null;
    }
    note = p.note ? String(p.note) : null;
    version++;
    last_operation_id = row.original.operation_id;
    if (row.status.state !== "ServerSaved") pending++;
  }
  return {
    version,
    state,
    open_since,
    time_kind,
    scope_item_id,
    asset_id,
    note,
    pause_reason,
    last_operation_id,
    blocked,
    pending,
  };
}
