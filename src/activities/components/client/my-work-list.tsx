"use client";
import { useState } from "react";
import type { WorkRow } from "../../work-overview";
import { activityTypeLabels, timing } from "../../work-view";
import {
  ActivityDrawer,
  ActivityFormDialog,
  contextLine,
  OutcomeDialog,
  RescheduleDialog,
  typeIcons,
  type ParentPreset,
} from "./my-work-dialogs";
import { Icon, Tag } from "./my-work-ui";

// One place decides which dialog is open, so a list, the schedule and a notice all open the same
// activity in the same way, and closing any of them returns to the same place in the page.
export type DialogRequest =
  | { kind: "detail" | "outcome" | "reschedule" | "date" | "owner"; row: WorkRow }
  | { kind: "followup"; activityId: string }
  | { kind: "create"; preset?: ParentPreset };
export function useWorkDialogs(now: string, onChanged: (message: string) => void) {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const close = () => setRequest(null);
  const element = !request ? null : request.kind === "detail" ? (
    <ActivityDrawer
      key={request.row.id}
      row={request.row}
      now={now}
      onClose={close}
      onComplete={() => setRequest({ kind: "outcome", row: request.row })}
      onReschedule={() => setRequest({ kind: "reschedule", row: request.row })}
    />
  ) : request.kind === "outcome" ? (
    <OutcomeDialog row={request.row} now={now} onClose={close} onChanged={onChanged} />
  ) : request.kind === "followup" ? (
    <RescheduleDialog activityId={request.activityId} now={now} purpose="followup" onClose={close} onChanged={onChanged} />
  ) : request.kind === "create" ? (
    <ActivityFormDialog preset={request.preset} now={now} onClose={close} onChanged={onChanged} />
  ) : (
    <RescheduleDialog activityId={request.row.id} now={now} purpose={request.kind} onClose={close} onChanged={onChanged} />
  );
  return { open: setRequest, element };
}

// A row has three separate controls: the title opens details, Complete records an outcome and
// Reschedule changes the timing. None is nested in another, so each works alone by keyboard.
export function ActivityRow({
  row,
  now,
  open,
  showOwner = false,
  ownerAction = false,
}: {
  row: WorkRow;
  now: string;
  open: (request: DialogRequest) => void;
  showOwner?: boolean;
  ownerAction?: boolean;
}) {
  const t = timing(row, now);
  const context = contextLine(row);
  const tag = row.linked.type === "Organisation" ? "Customer" : row.linked.type === "Ticket" ? "Service request" : row.linked.type;
  return (
    <li className="mw-row" data-group={row.group} data-activity={row.id}>
      <span className="mw-row-icon" title={activityTypeLabels[row.activity_type]}>
        <Icon name={typeIcons[row.activity_type]} />
        <span className="mw-sr">{activityTypeLabels[row.activity_type]}</span>
      </span>
      <div className="mw-row-main">
        <button type="button" className="mw-row-title" onClick={() => open({ kind: "detail", row })}>
          <span>
            {row.summary}
            <Icon name="chevron-right" />
          </span>
        </button>
        <p className="mw-row-context">
          <Tag>{tag}</Tag>
          <span>{[...context, showOwner ? `Owner: ${row.owner_name}` : null].filter(Boolean).join(" · ")}</span>
        </p>
        {/* A finished activity keeps its recorded outcome in view; history is not hidden behind a click. */}
        {row.outcome && <p className="mw-row-outcome">Outcome: {row.outcome}</p>}
      </div>
      <div className={`mw-row-when mw-when-${t.tone}`}>
        {t.caption && <span>{t.caption}</span>}
        <strong>{t.value}</strong>
      </div>
      <div className="mw-row-actions">
        {row.group === "Closed" ? (
          <span className="mw-muted">{row.status}</span>
        ) : (
          <>
            {row.can_complete ? (
              <button type="button" className="mw-button" onClick={() => open({ kind: "outcome", row })} aria-label={`Complete: ${row.summary}`}>
                <Icon name="check" />
                <span>Complete</span>
              </button>
            ) : (
              <span className="mw-muted mw-row-note">{row.can_edit ? "Owner completes" : "View only"}</span>
            )}
            {row.can_edit && (
              <button
                type="button"
                className="mw-button mw-button-quiet"
                onClick={() => open({ kind: ownerAction ? "owner" : row.due_needed ? "date" : "reschedule", row })}
                aria-label={`${ownerAction ? "Change owner or date" : row.due_needed ? "Set a date" : "Reschedule"}: ${row.summary}`}
              >
                <Icon name="calendar" />
                <span>{ownerAction ? "Owner / date" : row.due_needed ? "Set date" : "Reschedule"}</span>
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

export function PanelState({
  status,
  what,
  retry,
}: {
  status: "not_permitted" | "unavailable";
  what: string;
  retry: () => void;
}) {
  return status === "not_permitted" ? (
    <p className="mw-panel-note">{what} is outside your current access.</p>
  ) : (
    <p className="mw-panel-note mw-panel-note-attention" role="status">
      {what} could not be loaded just now. This is not a count of zero.{" "}
      <button type="button" className="mw-link" onClick={retry}>
        Try again
      </button>
    </p>
  );
}
