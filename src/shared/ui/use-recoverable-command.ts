"use client";
import { useEffect, useRef, useState } from "react";
import { readJournal, writeJournal, type CommandScope, type JournalEntry } from "../lib/command-journal";

type Failure = { status?: number; code?: string; message?: string; retryable?: boolean };
export type Receipt = { operation_id: string; record_id: string; record_version: number; state: string; receipt_id: string; accepted_at: string };
type Options = {
  key: string; scope: CommandScope; accepts: (entry: JournalEntry) => boolean;
  transport: <T>(path: string, body?: unknown) => Promise<T>; enabled?: boolean;
};
const changed = "ppo-command-journal-changed";

// Opt-in, one unresolved operation per key and tab. Only explicit retry sends
// a retained body. Every restoration first reads the actor-bound server receipt.
export function useRecoverableCommand({ key, scope, accepts, transport, enabled = true }: Options) {
  const [pending, setPending] = useState<JournalEntry | null>(null);
  const [accepted, setAccepted] = useState<{ entry: JournalEntry; receipt: Receipt } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false), [ready, setReady] = useState(false);
  const live = useRef(false), running = useRef(false), generation = useRef(0);
  const scopeKey = `${scope.workspace_id}:${scope.actor_id}`;
  const options = useRef({ scope, accepts, transport });
  useEffect(() => { options.current = { scope, accepts, transport }; }, [scope, accepts, transport]);
  const lastLookup = useRef("");
  const publish = () => window.dispatchEvent(new Event(changed));

  async function execute(entry: JournalEntry, recover = false, firstSend = false): Promise<Receipt | null> {
    if (running.current || !live.current || !enabled || (!recover && entry.phase !== "pending")) return null;
    running.current = true; setBusy(true); setError(null);
    const token = generation.current;
    try {
      const result = await options.current.transport<Receipt>(recover ? `operations/${entry.body.operation_id}` : entry.path, recover ? undefined : entry.body);
      if (!live.current || token !== generation.current) return null;
      if (result.operation_id !== entry.body.operation_id || result.record_id !== entry.record_id || !result.receipt_id || !result.accepted_at)
        throw Error("The original receipt could not be verified. No replacement command was sent.");
      setAccepted({ entry, receipt: result }); setPending(null);
      const minimal: JournalEntry = { ...entry, phase: "accepted", body: { operation_id: entry.body.operation_id, schema_version: 1 } };
      try {
        const active = readJournal(sessionStorage, key, options.current.scope, options.current.accepts);
        if (!active || active.body.operation_id === entry.body.operation_id) {
          const raw = JSON.stringify(minimal);
          const previous = sessionStorage.getItem(key + ":accepted");
          sessionStorage.setItem(key + ":accepted", raw);
          if (active) sessionStorage.removeItem(key);
          lastLookup.current = `accepted:${entry.body.operation_id}`;
          if (active || previous !== raw) publish();
        }
      } catch { setError({ message: "Saved to the server. Same-tab continuation storage could not be updated; retain the appointment link shown here." }); }
      return result;
    } catch (e) {
      if (!live.current || token !== generation.current) return null;
      const failure = e as Failure;
      // A later denial after a lost response cannot prove the original never ran.
      if (firstSend && failure.status && failure.status < 500 && !failure.retryable && failure.code !== "OperationConflict") {
        try { sessionStorage.removeItem(key); setPending(null); publish(); }
        catch { /* Retain the exact original if storage becomes unavailable. */ }
      }
      setError(recover ? { message: "The original outcome is still unknown or unavailable under current authority. An unavailable receipt does not prove saving failed." } :
        e instanceof Error ? { message: e.message } : e);
      return null;
    } finally {
      running.current = false;
      if (live.current && token === generation.current) setBusy(false);
    }
  }
  const executeRef = useRef(execute);
  useEffect(() => { executeRef.current = execute; });
  useEffect(() => {
    live.current = true; lastLookup.current = "";
    const load = (event?: Event) => {
      if (!enabled || !live.current) return;
      try {
        const original = readJournal(sessionStorage, key, options.current.scope, options.current.accepts);
        const saved = original ? null : readJournal(sessionStorage, key + ":accepted", options.current.scope, options.current.accepts);
        if ((original && original.phase !== "pending") || (saved && saved.phase !== "accepted")) throw Error("Recovery data has an invalid state. No new command was sent.");
        setPending(original); setReady(true);
        const entry = original ?? saved;
        if (original) setAccepted(null);
        const lookup = entry ? `${entry.phase}:${entry.body.operation_id}` : "";
        if (entry && !(event && original) && lookup !== lastLookup.current && !running.current) {
          lastLookup.current = lookup;
          void executeRef.current(entry, true);
        }
      } catch (e) {
        setError({ message: e instanceof Error ? e.message : "Same-tab recovery storage is unavailable. No command was sent." });
        setReady(false); setPending(null); setAccepted(null);
      }
    };
    if (enabled) load();
    // A counter, not a rendered node: bumping it on lock/unmount voids any in-flight response.
    const liveRef = live, generationRef = generation;
    const lock = () => { liveRef.current = false; generationRef.current++; setPending(null); setAccepted(null); setReady(false); };
    window.addEventListener(changed, load);
    window.addEventListener("ppo-session-lock", lock);
    return () => { liveRef.current = false; generationRef.current++; window.removeEventListener(changed, load); window.removeEventListener("ppo-session-lock", lock); };
  }, [key, scopeKey, enabled]);

  async function send(path: string, fields: Record<string, unknown>, target: string, label: string, recordId: string): Promise<Receipt | null> {
    if (!enabled || !ready || running.current || !live.current) return null;
    try {
      if (readJournal(sessionStorage, key, scope, accepts)) throw Error("Resolve the original pending operation before starting another saved action.");
      const entry = writeJournal(sessionStorage, key, {
        version: 1, scope: { actor_id: scope.actor_id, workspace_id: scope.workspace_id }, path, target, label, record_id: recordId, phase: "pending",
        body: { ...fields, operation_id: crypto.randomUUID(), schema_version: 1 },
      }, accepts);
      sessionStorage.removeItem(key + ":accepted");
      setAccepted(null); setPending(entry);
      lastLookup.current = `pending:${entry.body.operation_id}`;
      const promise = execute(entry, false, true);
      publish();
      return await promise;
    } catch (e) {
      setError({ message: e instanceof Error ? e.message : "Same-tab recovery storage is unavailable. No command was sent." });
      return null;
    }
  }
  return { send, pending, accepted, error, busy, ready, saved: accepted ? `${accepted.entry.label} saved.` : "",
    retry: () => pending ? execute(pending) : Promise.resolve(null),
    recover: () => pending ? execute(pending, true) : Promise.resolve(null),
    clear: () => { if (!pending && !running.current) setError(null); },
  };
}
