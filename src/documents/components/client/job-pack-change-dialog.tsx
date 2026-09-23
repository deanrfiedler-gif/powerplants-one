"use client";
import { useState } from "react";
import { ErrorNotice, useCommand } from "../../../components/business-ui";
import type { PackChange } from "../../pack-view";
import { PackDialog } from "./job-pack-ui";

type Command = ReturnType<typeof useCommand>;

// Audit finding M1: the reason belongs to the save that carries it, not to a field standing open on the form.
// The dialog collects it and hands it back; the screen owns the command body, so an uncertain save replays
// byte-identically instead of being rebuilt here.
export function PreparationChangeDialog({
  title,
  subtitle,
  lead,
  amendment,
  changes,
  command,
  onConfirm,
  onClose,
}: {
  title: string;
  subtitle: string;
  lead: string;
  amendment?: string;
  changes: PackChange[];
  command: Command;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(""),
    [missing, setMissing] = useState(false);
  return (
    <PackDialog
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      busy={command.busy}
      actions={
        <button
          type="button"
          className="jp-primary"
          data-primary
          disabled={command.busy}
          onClick={() => {
            const text = reason.trim();
            setMissing(!text);
            if (text) onConfirm(text);
          }}
        >
          {command.busy ? "Saving preparation…" : "Save preparation"}
        </button>
      }
    >
      <p>{lead}</p>
      {amendment && (
        <div className="jp-note warning">
          <strong className="jp-ink">This pack has a current issue.</strong>{" "}
          {amendment}
        </div>
      )}
      {changes.length > 0 && (
        <ul className="jp-change-list" aria-label="Changed fields">
          {changes.map((c) => (
            <li key={c.field}>
              <strong>{c.label}</strong>
              <span>
                {c.from && c.to ? `${c.from} → ${c.to}` : c.from || c.to}
              </span>
            </li>
          ))}
        </ul>
      )}
      {/* The message is a sibling of the label, not inside it, so it never becomes part of the field's name. */}
      <div className="jp-field">
        <label htmlFor="jp-change-reason">Reason for this change</label>
        <textarea
          id="jp-change-reason"
          rows={2}
          maxLength={1000}
          data-autofocus
          value={reason}
          disabled={command.busy}
          aria-invalid={missing || undefined}
          aria-describedby={
            missing ? "jp-change-reason-error" : "jp-change-reason-help"
          }
          onChange={(e) => {
            setReason(e.target.value);
            setMissing(false);
          }}
        />
        {missing ? (
          <span
            id="jp-change-reason-error"
            className="jp-field-error"
            role="alert"
          >
            Enter the reason for this change.
          </span>
        ) : (
          <small id="jp-change-reason-help">
            Recorded once per save, alongside the changed fields, on one line of
            up to 1000 characters.
          </small>
        )}
      </div>
      <ErrorNotice error={command.error} />
    </PackDialog>
  );
}

// Discarding touches nothing the server holds. Saying so is the whole point of asking.
export function DiscardDialog({
  subtitle,
  onConfirm,
  onClose,
}: {
  subtitle: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <PackDialog
      title="Discard unsaved preparation?"
      subtitle={subtitle}
      onClose={onClose}
      actions={
        <button
          type="button"
          className="jp-primary"
          data-primary
          onClick={onConfirm}
        >
          Discard changes
        </button>
      }
    >
      <p>
        Only unsaved entries are discarded; the saved revision is unchanged.
      </p>
    </PackDialog>
  );
}
