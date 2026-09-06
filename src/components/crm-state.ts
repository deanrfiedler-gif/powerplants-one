"use client";
import { useEffect, useRef, useState } from "react";
import { api, type Failure } from "./business-ui";
import type { OperationReceipt } from "../platform/operations";
export function denied(error: unknown) {
  return [401, 403, 404].includes((error as Failure)?.status ?? 0);
}
// Online memory only. A denied/current-identity refresh unmounts sensitive forms.
export function useCrmResource<T>(path: string | null) {
  const [revision, setRevision] = useState(0),
    [state, setState] = useState<{
      path: string | null;
      data: T | null;
      error: unknown;
    }>({ path: null, data: null, error: null });
  useEffect(() => {
    let live = true;
    const load = () => {
      if (path)
        void api<T>(path).then(
          (data) => {
            if (live) setState({ path, data, error: null });
          },
          (error) => {
            if (live)
              setState((old) => ({
                path,
                data: !denied(error) && old.path === path ? old.data : null,
                error,
              }));
          },
        );
    };
    load();
    const timer = setInterval(load, 15000);
    window.addEventListener("focus", load);
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [path, revision]);
  return {
    data: state.path === path ? state.data : null,
    error: state.path === path ? state.error : null,
    loading: !!path && (state.path !== path || (!state.data && !state.error)),
    reload: () => setRevision((x) => x + 1),
  };
}
export function useCrmCommand(
  onAccepted: (r: OperationReceipt) => void,
  initialStatus = "Unsaved",
) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [status, setStatus] = useState(initialStatus),
    [uncertain, setUncertain] = useState(false);
  const pending = useRef<{
    path: string;
    body: Record<string, unknown>;
  } | null>(null);
  async function execute(
    intent: { path: string; body: Record<string, unknown> },
    lookup: boolean,
  ) {
    setBusy(true);
    setError(null);
    try {
      let receipt: OperationReceipt | null = null;
      if (lookup)
        try {
          receipt = await api<OperationReceipt>(
            `operations/${intent.body.operation_id}`,
          );
        } catch (e) {
          if ((e as Failure).status !== 404) throw e;
        }
      // An absent/hidden lookup cannot create a new intent: only the original may be retried.
      receipt ??= await api<OperationReceipt>(intent.path, intent.body);
      pending.current = null;
      setUncertain(false);
      setStatus("Saved to the server");
      onAccepted(receipt);
    } catch (e) {
      setError(e);
      const unknown =
        !!(e as Failure).retryable ||
        !(e as Failure).status ||
        ((e as Failure).status ?? 0) >= 500;
      setUncertain(unknown);
      setStatus(
        unknown
          ? "Save outcome uncertain — confirm the original action"
          : "Unsaved — review the error",
      );
      if (!unknown) pending.current = null;
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    error,
    status,
    uncertain,
    dirty: () => {
      if (!busy && !uncertain) setStatus("Unsaved");
    },
    send: async (path: string, fields: Record<string, unknown>) => {
      if (pending.current) return;
      const intent = {
        path,
        body: {
          operation_id: crypto.randomUUID(),
          schema_version: 1,
          ...fields,
        },
      };
      pending.current = intent;
      await execute(intent, false);
    },
    reconcile: async () => {
      if (pending.current) await execute(pending.current, true);
    },
    clearError: () => setError(null),
  };
}
