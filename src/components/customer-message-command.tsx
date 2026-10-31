"use client";
import { useEffect, useRef, useState } from "react";
import { api, type Failure } from "./business-ui";
import { useIdentity } from "./business-session";
import { useUnsavedChanges } from "./record-ui";
export type MessageAction = "confirm" | "withdraw" | "reconcile" | "switches";
type Pending = { action: MessageAction; body: Record<string, unknown> };
export function useMessageCommand(
  target: string,
  onSaved: () => void,
  onRefused?: () => void,
) {
  const identity = useIdentity();
  const key = `ppo.customer-message:${identity.workspace_id}:${identity.actor_id}:${target}`;
  const [pending, setPending] = useState<Pending | null>(null),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState<unknown>(null),
    [saved, setSaved] = useState("");
  const inFlight = useRef(false),
    uncertain = useRef(false);
  const release = useUnsavedChanges(false, busy || !!pending);
  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => {
      if (!live) return;
      try {
        const text = sessionStorage.getItem(key);
        if (text) {
          const value = JSON.parse(text) as Pending;
          const actions = target.startsWith("company:")
            ? ["switches"]
            : ["confirm", "withdraw", "reconcile"];
          if (
            !actions.includes(value.action) ||
            typeof value.body?.operation_id !== "string" ||
            value.body.schema_version !== 1
          )
            throw Error("Invalid recovery journal");
          uncertain.current = true;
          setPending(value);
        }
        setReady(true);
      } catch {
        setError({
          message:
            "Recovery storage is unavailable or unreadable. No new action can start. Restore this tab's recovery storage before continuing.",
        });
      }
    });
    return () => {
      live = false;
    };
  }, [key, target]);
  async function send(
    action?: MessageAction,
    fields?: Record<string, unknown>,
  ) {
    if (!ready || inFlight.current) return false;
    const original =
      pending ??
      (action && fields
        ? {
            action,
            body: {
              ...fields,
              operation_id: crypto.randomUUID(),
              schema_version: 1,
            },
          }
        : null);
    if (!original) return false;
    try {
      sessionStorage.setItem(key, JSON.stringify(original));
    } catch {
      setError({
        message: "Recovery storage is unavailable. Nothing was submitted.",
      });
      return false;
    }
    setPending(original);
    setBusy(true);
    inFlight.current = true;
    setError(null);
    setSaved("");
    try {
      const path =
        original.action === "switches"
          ? "customer-communications/switches"
          : `customer-communications/${target}/${original.action}`;
      const result = await api<{ state?: string }>(path, original.body);
      sessionStorage.removeItem(key);
      setPending(null);
      uncertain.current = false;
      release();
      setSaved(
        `Original action confirmed${result.state ? `: ${result.state}` : ""}. Simulated only; delivery is not implied.`,
      );
      onSaved();
      return true;
    } catch (e) {
      const f = e as Failure;
      if (uncertain.current || f.retryable || !f.status || f.status >= 500)
        uncertain.current = true;
      else {
        sessionStorage.removeItem(key);
        setPending(null);
      }
      setError(e);
      onRefused?.();
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return { pending, busy, ready, error, saved, send };
}
