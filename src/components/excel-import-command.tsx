"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { api, ErrorNotice } from "./business-ui";
import { useIdentity } from "./business-session";
import {
  useRecoverableCommand,
  type Receipt,
} from "../shared/ui/use-recoverable-command";
import type { JournalEntry } from "../shared/lib/command-journal";
import { Button } from "./ui/button";
const uuid = "[a-f0-9-]{36}";
const accepts = (e: JournalEntry) =>
  new RegExp(
    `^estimating/(workspaces/${uuid}/excel-import/(commit|reimport)|estimates/${uuid}/(excel-source-pricing|excel-quote))$`,
  ).test(e.path) && e.target === "/estimating/import";
// Excel gateways return the native receipt envelope; operation lookup returns the receipt itself.
async function transport<T>(path: string, body?: unknown): Promise<T> {
  const result = await api<T | { receipt: T }>(path, body);
  return result && typeof result === "object" && "receipt" in result
    ? result.receipt
    : (result as T);
}
export function useExcelCommand(key: string) {
  return useRecoverableCommand({
    key: `ppo:excel:${key}`,
    scope: useIdentity(),
    accepts,
    transport,
    journalLimit: 8 * 1024 * 1024,
    acceptsReceipt: (entry, receipt) => {
      if (!/^[a-f0-9-]{36}$/.test(receipt.record_id)) return false;
      return (
        entry.path.includes("/workspaces/") ||
        entry.path.endsWith("/excel-quote") ||
        receipt.record_id === entry.record_id
      );
    },
  });
}
export type ExcelCommand = ReturnType<typeof useExcelCommand>;
export function CommandOutcome({
  command,
  onSaved,
}: {
  command: ExcelCommand;
  onSaved: (receipt: Receipt) => void;
}) {
  const outcome = useRef<HTMLDivElement>(null);
  const settled = !!command.accepted || (!!command.pending && !command.busy);
  useEffect(() => {
    if (settled) {
      const heading = outcome.current?.querySelector<HTMLElement>("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }
  }, [settled]);
  return (
    <div ref={outcome}>
      <ErrorNotice error={command.error} />
      {!command.ready && (
        <p role="status">Checking same-tab recovery before another save…</p>
      )}
      {command.pending && (
        <section className="es02-card" aria-label="Original operation recovery">
          <h2>
            {command.busy
              ? "Saving or checking original operation…"
              : "Save outcome uncertain"}
          </h2>
          <p>
            Check the original operation before making another change. An
            unavailable receipt does not prove the save failed.
          </p>
          <p className="xi-hash">
            Operation {command.pending.body.operation_id}
          </p>
          <Button
            disabled={command.busy}
            onClick={() => void command.recover()}
          >
            Check original outcome
          </Button>{" "}
          <Button disabled={command.busy} onClick={() => void command.retry()}>
            Retry exact original
          </Button>
        </section>
      )}
      {command.accepted && (
        <section className="es02-card" role="status">
          <h2>
            {command.accepted.entry.path.endsWith("/excel-quote")
              ? "Draft saved"
              : "Estimate saved"}
          </h2>
          <p>
            Version {command.accepted.receipt.record_version} ·{" "}
            {command.accepted.receipt.state}
          </p>
          <p className="xi-hash">
            Receipt {command.accepted.receipt.receipt_id}
          </p>
          <Button
            variant="primary"
            onClick={() => onSaved(command.accepted!.receipt)}
          >
            Open saved result
          </Button>
        </section>
      )}
    </div>
  );
}

export const ExcelActionHost = createContext<HTMLElement | null>(null);
export function ExcelFooterActions({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled: boolean;
}) {
  const host = useContext(ExcelActionHost);
  return host
    ? createPortal(
        <fieldset className="xi-workflow xi-actions" disabled={disabled}>
          {children}
        </fieldset>,
        host,
      )
    : null;
}
