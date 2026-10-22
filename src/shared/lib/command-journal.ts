// A single active online operation, never an offline queue. No credentials.
export type CommandScope = { actor_id: string; workspace_id: string };
export type JournalEntry = {
  version: 1;
  scope: CommandScope;
  path: string;
  body: Record<string, unknown> & { operation_id: string; schema_version: number };
  target: string;
  label: string;
  record_id: string;
  phase: "pending" | "accepted";
};
export type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const sameScope = (a: CommandScope, b: CommandScope) => a.actor_id === b.actor_id && a.workspace_id === b.workspace_id;
export function readJournal(storage: StoragePort, key: string, scope: CommandScope, accepts: (entry: JournalEntry) => boolean, limit = 32768): JournalEntry | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    if (raw.length > limit) throw Error();
    const e = JSON.parse(raw) as JournalEntry;
    if (e.version !== 1 || !uuid.test(e.scope?.actor_id) || !uuid.test(e.scope?.workspace_id)) throw Error();
    // An identity mismatch exposes none of the previous actor's content.
    if (!sameScope(e.scope, scope)) { storage.removeItem(key); return null; }
    if (!e.body || !uuid.test(e.body.operation_id) || e.body.schema_version !== 1 || !uuid.test(e.record_id) ||
      !["pending", "accepted"].includes(e.phase) ||
      typeof e.label !== "string" || e.label.length > 80 || !accepts(e)) throw Error();
    return e;
  } catch {
    throw Error("The same-tab recovery record is unreadable. No new command has been sent. Inspect the saved record before clearing recovery data.");
  }
}
export function writeJournal(storage: StoragePort, key: string, entry: JournalEntry, accepts: (entry: JournalEntry) => boolean, limit = 32768, expected?: JournalEntry) {
  const raw = JSON.stringify(entry);
  if (raw.length > limit || !accepts(entry)) throw Error("The recovery record exceeds its supported bounds. No command was sent.");
  if (expected && !sameScope(expected.scope, entry.scope)) throw Error("The original pending operation changed. No reviewed retry was sent.");
  const previous = readJournal(storage, key, entry.scope, accepts, limit);
  if (expected) {
    // Explicit compare-and-replace for reviewed metadata only. The caller must
    // establish a command-specific refusal; this never changes operation identity.
    if (!previous || JSON.stringify(previous) !== JSON.stringify(expected) ||
      previous.phase !== "pending" || entry.phase !== "pending" ||
      !sameScope(previous.scope, entry.scope) || previous.path !== entry.path ||
      previous.target !== entry.target || previous.label !== entry.label || previous.record_id !== entry.record_id ||
      previous.body.operation_id !== entry.body.operation_id || previous.body.schema_version !== entry.body.schema_version)
      throw Error("The original pending operation changed. No reviewed retry was sent.");
  } else if (previous && JSON.stringify(previous) !== raw) throw Error("Resolve the original pending operation before starting another saved action.");
  storage.setItem(key, raw);
  if (storage.getItem(key) !== raw) throw Error("Same-tab recovery storage could not be verified. No command was sent.");
  // JSON copy freezes caller-owned arrays/objects as well as generated IDs.
  return JSON.parse(raw) as JournalEntry;
}
