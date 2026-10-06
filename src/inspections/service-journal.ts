import type { JournalEntry } from "../shared/lib/command-journal";
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const fields = [
  "operation_id",
  "schema_version",
  "reason",
  "action",
  "id",
  "template_id",
  "scope_item_id",
  "asset_id",
  "predecessor_id",
  "binding_hash",
  "attempt_id",
  "expected_version",
  "occurred_at",
  "findings",
  "readings",
  "instrument_ids",
  "evidence",
  "evidence_id",
  "decision",
  "decision_reason",
  "owner_id",
  "due",
  "severity",
  "defect_id",
  "proposed_correction",
  "retest_required",
  "changes_system",
  "change_id",
  "note",
];
export function acceptsServiceInspectionEntry(e: JournalEntry) {
  if (typeof e.path !== "string" || !e.body || typeof e.body !== "object")
    return false;
  const capture = new RegExp(`^my-jobs/(${uuid})/inspections$`, "i").exec(
    e.path,
  );
  const review = new RegExp(`^service/inspections/(${uuid})$`, "i").exec(
    e.path,
  );
  const id = capture?.[1] ?? review?.[1];
  if (
    !id ||
    id !== e.record_id ||
    e.target !==
      `/${capture ? "my-jobs" : "service"}/inspections?appointment_id=${id}`
  )
    return false;
  if (e.phase === "accepted")
    return Object.keys(e.body).every((k) =>
      ["operation_id", "schema_version"].includes(k),
    );
  const allowed = capture
    ? [
        "open",
        "save",
        "evidence",
        "remove_evidence",
        "submit",
        "correct",
        "clarify",
      ]
    : ["review", "defect", "release"];
  return (
    allowed.includes(String(e.body.action)) &&
    Object.keys(e.body).every((k) => fields.includes(k))
  );
}
