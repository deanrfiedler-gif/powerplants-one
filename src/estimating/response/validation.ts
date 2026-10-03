import {
  common,
  commonKeys,
  object,
  uuid,
  optionalId,
  choice,
  label,
  narrative,
  optionalNarrative,
  instant,
  dateOnly,
  invalid,
} from "../../shared/validation";
import { hashInput } from "../release/validation";
import { responseOutcomes } from "./model";
const keys = [
  ...commonKeys,
  "synthetic_only",
  "issue_id",
  "output_hash",
  "expected_response_sequence",
  "response_id",
  "evidence",
];
function envelope(id: string, r: Record<string, unknown>) {
  if (r.synthetic_only !== true)
    invalid(
      "synthetic_only",
      "Acknowledge staff-recorded synthetic evidence only.",
    );
  if (
    !Number.isSafeInteger(r.expected_response_sequence) ||
    Number(r.expected_response_sequence) < 0
  )
    invalid(
      "expected_response_sequence",
      "Use the observed response sequence.",
    );
  return {
    ...common(r),
    revision_id: uuid(id, "revision_id"),
    synthetic_only: true as const,
    issue_id: uuid(r.issue_id, "issue_id"),
    output_hash: hashInput(r.output_hash, "output_hash"),
    expected_response_sequence: Number(r.expected_response_sequence),
    response_id: optionalId(r.response_id, "response_id"),
    evidence: narrative(r.evidence, "evidence", 4000),
  };
}
export function responseInput(id: string, value: unknown) {
  const r = object(value, [...keys, "action", "report"]);
  const report = object(r.report, [
    "outcome",
    "respondent",
    "claimed_role",
    "responded_at",
    "conditions",
  ]);
  return {
    ...envelope(id, r),
    action: choice(r.action, "action", ["Record", "Correct"] as const),
    report: {
      outcome: choice(report.outcome, "outcome", responseOutcomes),
      respondent: label(report.respondent, "respondent", 200),
      claimed_role: label(report.claimed_role, "claimed_role", 200),
      responded_at: instant(report.responded_at, "responded_at"),
      conditions: optionalNarrative(report.conditions, "conditions", 2000),
    },
  };
}
export function clarificationInput(id: string, value: unknown) {
  const r = object(value, [...keys, "action", "detail"]);
  const action = choice(r.action, "action", ["Answer", "Confirm"] as const);
  const d = object(
    r.detail,
    action === "Answer"
      ? ["answer"]
      : ["respondent", "claimed_role", "responded_at"],
  );
  return {
    ...envelope(id, r),
    response_id: uuid(r.response_id, "response_id"),
    action,
    detail:
      action === "Answer"
        ? { answer: narrative(d.answer, "answer", 4000) }
        : {
            respondent: label(d.respondent, "respondent", 200),
            claimed_role: label(d.claimed_role, "claimed_role", 200),
            responded_at: instant(d.responded_at, "responded_at"),
          },
  };
}
export function handoverInput(id: string, value: unknown) {
  const r = object(value, [...keys, "owner_id", "due_date", "note"]);
  return {
    ...envelope(id, r),
    response_id: uuid(r.response_id, "response_id"),
    action: "Prepare" as const,
    detail: {
      owner_id: uuid(r.owner_id, "owner_id"),
      due_date: dateOnly(r.due_date, "due_date"),
      note: narrative(r.note, "note", 4000),
    },
  };
}
