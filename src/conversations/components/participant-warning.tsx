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
}: {
  people: Person[];
  onCancel: () => void;
  onConfirm: () => void;
  onNewThread: () => void;
  returnFocus: HTMLElement | null;
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
      <h2 id={heading}>Some earlier sources are unavailable</h2>
      <p>Earlier {agentName} answers cite records these people cannot open:</p>
      <ul>
        {people.map((p) => (
          <li key={p.id}>
            {p.display_name}: {p.history_warning!.count}{" "}
            {p.history_warning!.count === 1 ? "source" : "sources"}
          </li>
        ))}
      </ul>
      <p>
        They will see withheld statements and sources. Adding them does not
        grant access. You can start a new thread on the same record without the
        earlier answers.
      </p>
      <div className="cv-warning-actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onNewThread}>Start a new thread</Button>
        <Button variant="primary" onClick={onConfirm}>
          Add and send
        </Button>
      </div>
    </dialog>
  );
}
