import type { JournalEntry } from "../shared/lib/command-journal";
import { safeBookingTarget } from "./navigation";
export const bookingJournalKey = "ppo-pl01-command-v1";
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
// Storage is untrusted. Only these four exact command paths and safe internal
// destinations can be restored. Server validation/authority still applies.
export function acceptsBookingEntry(entry: JournalEntry) {
  if (typeof entry.path !== "string" || safeBookingTarget(entry.target) !== entry.target) return false;
  const match = new RegExp(`^(?:service/work-orders|appointments)/(${uuid})/(visits|readiness|confirm|contacts)$`, "i").exec(entry.path);
  if (!match || !entry.body || typeof entry.body !== "object") return false;
  const [, parent, action] = match;
  if (entry.path.startsWith("service/") !== ["visits", "readiness"].includes(action)) return false;
  if (entry.phase === "accepted") return Object.keys(entry.body).every(k => ["operation_id", "schema_version"].includes(k));
  const b = entry.body;
  const common = ["operation_id", "schema_version", "expected_version", "reason"];
  const fields: Record<string, string[]> = {
    visits: ["id", "scope_revision_id", "scope_version", "start_at", "end_at", "requested_window_start", "requested_window_end", "customer_commitment", "preparation_status"],
    readiness: ["assessment"],
    contacts: ["id", "recipient_id", "channel", "outcome", "occurred_at", "notes"],
    confirm: ["expected_work_order_version", "expected_assignment_version", "scope_revision_id", "scope_version", "policy_version_id", "scheduling_policy_id", "scheduling_policy_version", "crew"],
  };
  if (!Object.keys(b).every(k => [...common, ...fields[action]].includes(k)) || !Number.isSafeInteger(b.expected_version) || Number(b.expected_version) < 1) return false;
  const targetId = entry.target.split("?")[0].split("/").pop();
  if (action === "visits") return b.id === entry.record_id && b.id === targetId;
  if (action === "contacts") return b.id === entry.record_id && parent === targetId;
  if (action === "confirm") return parent === entry.record_id && parent === targetId;
  return parent === entry.record_id && (b.assessment as { appointment_id?: string })?.appointment_id === targetId;
}
