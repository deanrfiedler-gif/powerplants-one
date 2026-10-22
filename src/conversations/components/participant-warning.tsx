import { useEffect, useId, useRef } from "react";
import { Button } from "../../components/ui/button";
import { agentName } from "../../assistant/model";
import type { Person } from "../picker-options";

export function ParticipantWarning({
  people,
  onCancel,
  onConfirm,
  onNewThread,
  returnFocus,
  originalMessage,
}: {
  people: Person[];
  onCancel: () => void;
  onConfirm: () => void;
  onNewThread: () => void;
  returnFocus: HTMLElement | null;
  originalMessage?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    heading = useId();
  useEffect(() => {
    const element = dialog.current,
      opener = returnFocus;
    element?.showModal();
    return () => {
      element?.close();
      opener?.focus({ preventScroll: true });
    };
  }, [returnFocus]);
  return (
    <dialog
      ref={dialog}
      className="cv-participant-warning"
      aria-labelledby={heading}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id={heading}>
        {originalMessage !== undefined
          ? "Review original message"
          : "Some earlier sources are unavailable"}
      </h2>
      {originalMessage !== undefined && (
        <p className="cv-warning-original">{originalMessage}</p>
      )}
      <p>
        {people.length ? (
          <>
            Earlier {agentName} answers cite records these people cannot open:
          </>
        ) : (
          "No earlier cited sources are currently unavailable to the tagged people."
        )}
      </p>
      <ul>
        {people.map((p) => (
          <li key={p.id}>
            {p.display_name}: {p.history_warning!.count}{" "}
            {p.history_warning!.count === 1 ? "source" : "sources"}
          </li>
        ))}
      </ul>
      <p>
        {people.length > 0 && (
          <>
            They will see withheld statements and sources. Adding them does not
            grant access.{" "}
          </>
        )}
        You can start a new thread on the same record without the earlier
        answers.
      </p>
      <div className="cv-warning-actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onNewThread}>Start a new thread</Button>
        <Button variant="primary" onClick={onConfirm}>
          {originalMessage !== undefined
            ? "Send original message"
            : "Add and send"}
        </Button>
      </div>
    </dialog>
  );
}
