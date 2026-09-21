"use client";
import { useEffect, useRef, useState } from "react";
import { api, type Failure } from "../../components/business-ui";
import type { Command } from "./validation";
import type { OperationReceipt } from "../../platform/operations";
export function RecoveryDialog({
  id,
  onClose,
  onSaved,
}: {
  id: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [result, setResult] = useState<{
      command: Command;
      receipt: OperationReceipt | null;
    } | null>(null),
    [error, setError] = useState<Failure | null>(null),
    [busy, setBusy] = useState(false),
    [reviewed, setReviewed] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    let live = true;
    api<{ command: Command; receipt: OperationReceipt | null }>(
      `projects/acceptance/intents/${id}`,
    ).then(
      (r) => {
        if (live) setResult(r);
      },
      (e) => {
        if (live) setError(e);
      },
    );
    return () => {
      live = false;
      if (previous?.isConnected) previous.focus();
    };
  }, [id]);
  async function act(disposition: "Seen" | "Discard uncommitted" | "Retry") {
    setBusy(true);
    setError(null);
    try {
      if (disposition === "Retry") {
        if (!result || !reviewed) return;
        const receipt = await api<OperationReceipt>(
          "projects/acceptance",
          result.command,
        );
        setResult({ ...result, receipt });
        setReviewed(false);
      } else {
        await api(`projects/acceptance/intents/${id}`, { disposition });
        onSaved();
      }
    } catch (e) {
      const f = e as Failure;
      setError(f);
      if ([401, 403, 404].includes(f.status ?? 0)) setResult(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="ac-dialog ac-recovery-dialog"
      aria-labelledby="ac-recovery-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2 id="ac-recovery-title">Original command outcome</h2>
      </header>
      <div className="ac-dialog-body">
        <p>This server-held original survives page and application restarts.</p>
        {error && (
          <p role="alert" className="ac-notice">
            {error.message}
          </p>
        )}
        {result && (
          <>
            <p>
              {result.command.action} · {result.command.reason}
            </p>
            <small>Original operation {id}</small>
            {result.receipt ? (
              <>
                <p>
                  <strong>Accepted once</strong> · {result.receipt.state} ·
                  version {result.receipt.record_version}
                </p>
                <p>
                  The original result is retained. No new decision is made when
                  you acknowledge it.
                </p>
              </>
            ) : (
              <>
                <p>
                  No committed receipt exists. Retry this original unchanged, or
                  discard the uncommitted proposal.
                </p>
                <label>
                  <input
                    type="checkbox"
                    checked={reviewed}
                    onChange={(e) => setReviewed(e.target.checked)}
                  />
                  I reviewed this original scope, evidence and operation.
                </label>
              </>
            )}
            <details>
              <summary>Inspect retained original proposal</summary>
              <pre>{JSON.stringify(result.command, null, 2)}</pre>
            </details>
          </>
        )}
      </div>
      <footer>
        <button className="ac-button" onClick={onClose} disabled={busy}>
          Close
        </button>
        {result?.receipt ? (
          <button
            className="ac-button ac-primary"
            disabled={busy}
            onClick={() => act("Seen")}
          >
            Confirm original result
          </button>
        ) : (
          result && (
            <>
              <button
                className="ac-button"
                disabled={busy}
                onClick={() => act("Discard uncommitted")}
              >
                Discard uncommitted proposal
              </button>
              <button
                className="ac-button ac-primary"
                disabled={busy || !reviewed}
                onClick={() => act("Retry")}
              >
                Retry unchanged original
              </button>
            </>
          )
        )}
      </footer>
    </dialog>
  );
}
