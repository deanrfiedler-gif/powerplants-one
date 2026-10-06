"use client";
import { useEffect, useRef, useState } from "react";
import { api, ErrorNotice, type Failure } from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { useShell } from "../../components/shell-provider";
type Pending = { path: string; body: Record<string, unknown> };
export function useSupplyCommand(
  onSaved: () => void,
  suffix = "",
  onReceipt?: (
    body: Record<string, unknown>,
    receipt: { record_version: number },
  ) => void,
) {
  const { context } = useShell();
  const key = `ppo.supply.pending.${context?.preference_scope}${suffix}`;
  const [pending, setPending] = useState<Pending | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<Failure | null>(null),
    [saved, setSaved] = useState("");
  const original = useRef<Pending | null>(null);
  useEffect(() => {
    // The browser journal is external state; restore after hydration, scoped to this identity.
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const value = sessionStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value) as Pending;
          if (
            parsed.path?.startsWith("supply/") &&
            typeof parsed.body?.operation_id === "string"
          ) {
            original.current = parsed;
            setPending(parsed);
          }
        }
      } catch {
        setError({
          message:
            "Local recovery storage is unavailable. Keep this page open until the save result is confirmed.",
        });
      }
    });
    return () => {
      active = false;
    };
  }, [key]);
  function clear() {
    original.current = null;
    setPending(null);
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* Server receipt remains authoritative. */
    }
  }
  async function run(op: Pending) {
    setBusy(true);
    setError(null);
    setSaved("");
    try {
      const receipt = await api<{ record_version: number }>(op.path, op.body);
      onReceipt?.(op.body, receipt);
      clear();
      setSaved("Saved to the server. Original evidence is retained.");
      onSaved();
      return true;
    } catch (e) {
      const failure = e as Failure;
      setError(failure);
      if (failure.status && failure.status < 500) clear();
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function send(path: string, body: Record<string, unknown>) {
    if (original.current) {
      setError({
        message:
          "Resolve the original pending save before changing its content.",
      });
      return;
    }
    const op = {
      path,
      body: { ...body, operation_id: crypto.randomUUID(), schema_version: 1 },
    };
    original.current = op;
    setPending(op);
    try {
      sessionStorage.setItem(key, JSON.stringify(op));
    } catch {
      setError({
        message:
          "Cannot retain recovery information in this browser. Save has not been sent.",
      });
      original.current = null;
      setPending(null);
      return;
    }
    return await run(op);
  }
  async function recover() {
    if (!original.current) return;
    setBusy(true);
    try {
      const receipt = await api<{ record_version: number }>(
        `supply/operations/${original.current.body.operation_id}`,
      );
      onReceipt?.(original.current.body, receipt);
      clear();
      setError(null);
      setSaved("Original save recovered. No second effect was created.");
      onSaved();
    } catch (e) {
      setError({
        ...(e as Failure),
        message:
          "The original receipt is not currently available. Retry the original PPO save, or restore access; do not create another external operation.",
      });
    } finally {
      setBusy(false);
    }
  }
  return {
    send,
    busy,
    pending,
    saved,
    error,
    retry: () => original.current && run(original.current),
    recover,
  };
}
export function Recovery({
  command,
}: {
  command: ReturnType<typeof useSupplyCommand>;
}) {
  return (
    <>
      <ErrorNotice error={command.error} />
      {command.saved && <p role="status">{command.saved}</p>}
      {command.pending && !command.busy && (
        <section className="supply-notice" aria-label="Uncertain save recovery">
          <strong>Uncertain result — original operation retained</strong>
          <p>
            Check its receipt or retry the exact original PPO coordination save.
          </p>
          <Button onClick={() => void command.recover()}>
            Check original receipt
          </Button>{" "}
          <Button onClick={() => void command.retry()}>
            Retry original save
          </Button>
        </section>
      )}
    </>
  );
}
