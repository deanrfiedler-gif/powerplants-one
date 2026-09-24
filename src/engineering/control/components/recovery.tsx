"use client";
import { useEffect, useRef, useState } from "react";
import {
  api,
  ErrorNotice,
  type Failure,
} from "../../../components/business-ui";
import { Button } from "../../../components/ui/button";
export function useControlCommand(saved: () => void) {
  const [status, setStatus] = useState<
      "idle" | "saving" | "saved" | "failed" | "unknown"
    >("idle"),
    [error, setError] = useState<Failure | null>(null);
  const original = useRef<{
    path: string;
    body: Record<string, unknown>;
  } | null>(null);
  const uncertain = useRef(false),
    inFlight = useRef(false);
  const [operationId, setOperationId] = useState<string | null>(null);
  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (original.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, []);
  async function run() {
    if (!original.current || inFlight.current) return false;
    inFlight.current = true;
    setStatus("saving");
    setError(null);
    try {
      await api(original.current.path, original.current.body);
      original.current = null;
      setStatus("saved");
      saved();
      return true;
    } catch (e) {
      const failure = e as Failure;
      setError(failure);
      if (
        uncertain.current ||
        failure.retryable ||
        failure.status === undefined ||
        failure.status >= 500
      ) {
        uncertain.current = true;
        setStatus("unknown");
      } else {
        original.current = null;
        setStatus("failed");
      }
      return false;
    } finally {
      inFlight.current = false;
    }
  }
  async function send(path: string, fields: Record<string, unknown>) {
    if (original.current) return false;
    original.current = {
      path,
      body: { ...fields, schema_version: 1, operation_id: crypto.randomUUID() },
    };
    uncertain.current = false;
    setOperationId(String(original.current.body.operation_id));
    return run();
  }
  async function recover() {
    if (!original.current) return;
    setStatus("saving");
    setError(null);
    try {
      await api(`operations/${original.current.body.operation_id}`);
      original.current = null;
      setStatus("saved");
      saved();
    } catch (e) {
      setError({
        ...(e as Failure),
        message:
          "The original outcome cannot currently be recovered. Access may have changed. Retain the original operation; retry it unchanged after resolving access or connectivity.",
      });
      setStatus("unknown");
    }
  }
  return {
    send,
    recover,
    retry: run,
    status,
    error,
    locked: status === "saving" || status === "unknown",
    operation_id: operationId,
  };
}
export type ControlCommand = ReturnType<typeof useControlCommand>;
export function CommandResult({ command }: { command: ControlCommand }) {
  return (
    <div aria-live="polite">
      {command.status === "saving" && (
        <p role="status">Saving the exact operation…</p>
      )}
      {command.status === "saved" && <p role="status">Saved to the server.</p>}
      <ErrorNotice error={command.error} />
      {command.status === "unknown" && (
        <div role="alert">
          <strong>Outcome unknown</strong>
          <p>
            Original operation: {String(command.operation_id)}. Keep this page
            open while resolving the result.
          </p>
          <Button onClick={() => void command.recover()}>
            Recover original result
          </Button>
          <Button onClick={() => void command.retry()}>
            Retry unchanged operation
          </Button>
        </div>
      )}
    </div>
  );
}
