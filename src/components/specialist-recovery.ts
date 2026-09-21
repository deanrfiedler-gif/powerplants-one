"use client";
import { useEffect, useRef, useState } from "react";
import { api, type Failure } from "./business-ui";
import type { OperationReceipt } from "../platform/operations";
type Pointer = {
  operation_id: string;
  actor_id: string;
  workspace_id: string;
  configuration_id: string;
  command: string;
  origin: string;
  resolution_operation_id?: string;
  estimating_workspace_id?: string;
  revision_id?: string;
};
export function useSpecialistCommand(
  scope: { actor_id: string; workspace_id: string },
  configurationId: string,
  onAccepted: () => Promise<void>,
) {
  const key = `ppo:es08:pending:${scope.workspace_id}:${scope.actor_id}:${configurationId}`;
  const [pointer, setPointer] = useState<Pointer | null>(null),
    [busy, setBusy] = useState(false),
    [canRetry, setCanRetry] = useState(false),
    [error, setError] = useState<unknown>(null),
    [status, setStatus] = useState("Draft saved"),
    original = useRef<{ path: string; body: Record<string, unknown> } | null>(
      null,
    ),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    try {
      const text = sessionStorage.getItem(key);
      if (text) {
        const p = JSON.parse(text) as Pointer;
        if (
          p.actor_id === scope.actor_id &&
          p.workspace_id === scope.workspace_id &&
          p.configuration_id === configurationId
        )
          queueMicrotask(() => {
            if (alive.current) {
              setPointer(p);
              setStatus("Original outcome must be resolved");
            }
          });
      }
    } catch {
      /* Storage unavailable: in-memory intent remains. */
    }
    return () => {
      alive.current = false;
      original.current = null;
    };
  }, [key, scope.actor_id, scope.workspace_id, configurationId]);
  const store = (p: Pointer | null) => {
    setPointer(p);
    try {
      if (p) sessionStorage.setItem(key, JSON.stringify(p));
      else sessionStorage.removeItem(key);
    } catch {
      /* The online server original is still authoritative. */
    }
  };
  async function accepted() {
    if (!alive.current) return;
    await onAccepted();
    store(null);
    original.current = null;
    setCanRetry(false);
    setStatus("Saved to the server");
  }
  async function send(
    path: string,
    command: string,
    body: Record<string, unknown>,
  ) {
    if (pointer || busy) return false;
    const operation_id = crypto.randomUUID(),
      intent = { path, body: { ...body, operation_id, schema_version: 1 } };
    original.current = intent;
    setCanRetry(true);
    const p = {
      operation_id,
      actor_id: scope.actor_id,
      workspace_id: scope.workspace_id,
      configuration_id: configurationId,
      command,
      ...(command === "CreateSpecialistConfiguration"
        ? {
            estimating_workspace_id: String(body.estimating_workspace_id),
            revision_id: String(body.revision_id),
          }
        : {}),
      origin: `/estimating/configurations/${configurationId}/configure`,
    };
    store(p);
    setBusy(true);
    setError(null);
    try {
      await api<OperationReceipt>(path, intent.body);
      await accepted();
      return true;
    } catch (e) {
      if (!alive.current) return false;
      setError(e);
      const f = e as Failure;
      if (f.retryable || !f.status || f.status >= 500) {
        setStatus(
          "Outcome unknown — resolve the original before another write",
        );
      } else {
        store(null);
        original.current = null;
        setCanRetry(false);
        setStatus("Not saved — review the highlighted issue");
      }
      return false;
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function recover(retry = false) {
    if (!pointer || busy) return;
    setBusy(true);
    setError(null);
    try {
      try {
        await api<OperationReceipt>(`operations/${pointer.operation_id}`);
        await accepted();
        return;
      } catch (e) {
        if ((e as Failure).status !== 404) throw e;
      }
      if (retry && original.current) {
        await api(original.current.path, original.current.body);
        await accepted();
        return;
      }
      setStatus(
        "No permitted receipt was found. This does not prove non-acceptance; resolve the original outcome.",
      );
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function resolve() {
    if (!pointer || busy) return;
    const p = {
      ...pointer,
      resolution_operation_id:
        pointer.resolution_operation_id ?? crypto.randomUUID(),
    };
    store(p);
    setBusy(true);
    setError(null);
    try {
      await api(
        `estimating/configurations/${configurationId}/resolve-operation`,
        {
          operation_id: p.resolution_operation_id,
          schema_version: 1,
          reason:
            "Explicitly resolve the retained original after uncertain response or reload",
          original_operation_id: p.operation_id,
          command: p.command,
          ...(p.command === "CreateSpecialistConfiguration"
            ? {
                estimating_workspace_id: p.estimating_workspace_id,
                revision_id: p.revision_id,
              }
            : {}),
        },
      );
      const outcome = await api<{ outcome: string }>(
        `estimating/configurations/${configurationId}/recovery-result?operation_id=${p.resolution_operation_id}`,
      );
      if (outcome.outcome === "Original accepted") await accepted();
      else {
        store(null);
        original.current = null;
        setCanRetry(false);
      }
      setStatus(outcome.outcome);
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return {
    busy,
    pending: !!pointer,
    error,
    status,
    send,
    recover,
    resolve,
    canRetry,
  };
}
