import type { JournalEntry } from "../shared/lib/command-journal";
import type { Receipt } from "../shared/ui/use-recoverable-command";
export const policyJournalKey = "ppo-pl04-command-v1";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields = {
  proposal: [
    "id",
    "source",
    "expected_head_version",
    "predecessor_proposal",
    "max_visit_minutes",
    "effective_from",
  ],
  review: ["id", "proposal"],
  publication: [
    "proposal",
    "review",
    "source",
    "expected_head_version",
    "selected_policy",
  ],
};
export function policyCommandKind(path: string) {
  return (Object.keys(fields) as (keyof typeof fields)[]).find(
    (k) => path === `schedule/policy-${k}s`,
  );
}
export function policyRecordHref(kind: keyof typeof fields, id: string) {
  return `/schedule/policy-impact?${kind}=${encodeURIComponent(id)}`;
}
export function acceptsPolicyEntry(entry: JournalEntry) {
  const kind = policyCommandKind(entry.path);
  if (!kind || !entry.body || typeof entry.target !== "string") return false;
  const targetKind = kind === "publication" ? "review" : kind;
  if (entry.target !== policyRecordHref(targetKind, entry.record_id))
    return false;
  if (entry.phase === "accepted")
    return Object.keys(entry.body).every((k) =>
      ["operation_id", "schema_version"].includes(k),
    );
  if (
    !Object.keys(entry.body).every((k) =>
      ["operation_id", "schema_version", "reason", ...fields[kind]].includes(k),
    )
  )
    return false;
  if (typeof entry.body.reason !== "string" || !entry.body.reason.trim())
    return false;
  return kind === "publication"
    ? (entry.body.review as { id?: string })?.id === entry.record_id
    : entry.body.id === entry.record_id;
}
export function acceptsPolicyReceipt(entry: JournalEntry, receipt: Receipt) {
  const kind = policyCommandKind(entry.path);
  return (
    !!kind &&
    uuid.test(receipt.record_id) &&
    receipt.state ===
      { proposal: "Proposed", review: "Reviewed", publication: "Published" }[
        kind
      ] &&
    (kind === "publication" || receipt.record_id === entry.record_id)
  );
}
