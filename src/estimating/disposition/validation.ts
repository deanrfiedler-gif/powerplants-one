import {
  common,
  commonKeys,
  object,
  uuid,
  optionalId,
  choice,
  narrative,
  label,
  dateOnly,
  invalid,
} from "../../shared/validation";
import { hashInput } from "../release/validation";
import { exactQuantity } from "../../supply/validation";
const keys = [
  ...commonKeys,
  "synthetic_only",
  "target_id",
  "execution_id",
  "expected_sequence",
  "evidence",
];
function envelope(id: string, r: Record<string, unknown>) {
  if (r.synthetic_only !== true)
    invalid("synthetic_only", "Acknowledge synthetic disposition only.");
  if (
    !Number.isSafeInteger(r.expected_sequence) ||
    Number(r.expected_sequence) < 0
  )
    invalid(
      "expected_sequence",
      "Use the observed target disposition sequence.",
    );
  return {
    ...common(r),
    revision_id: uuid(id, "revision_id"),
    target_id: uuid(r.target_id, "target_id"),
    execution_id: uuid(r.execution_id, "execution_id"),
    expected_sequence: Number(r.expected_sequence),
    evidence: narrative(r.evidence, "evidence", 4000),
    synthetic_only: true as const,
  };
}
export function dispositionReviewInput(id: string, value: unknown) {
  const r = object(value, [
    ...keys,
    "predecessor_id",
    "basis_hash",
    "decision",
    "quantity",
    "owner_id",
    "due_date",
    "next_action",
  ]);
  const decision = choice(r.decision, "decision", [
    "Retain",
    "ReviseQuantity",
    "Hold",
  ]);
  if (decision !== "ReviseQuantity" && r.quantity !== null)
    invalid(
      "quantity",
      "Only a quantity revision may propose a quantity; otherwise use null.",
    );
  return {
    ...envelope(id, r),
    action: "Review" as const,
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    basis_hash: hashInput(r.basis_hash, "basis_hash"),
    decision,
    quantity:
      decision === "ReviseQuantity"
        ? exactQuantity(r.quantity, "quantity", true)
        : null,
    owner_id: uuid(r.owner_id, "owner_id"),
    due_date: dateOnly(r.due_date, "due_date"),
    next_action: label(r.next_action, "next_action", 1000),
  };
}
export function dispositionApplyInput(id: string, value: unknown) {
  const r = object(value, [...keys, "review_id", "review_hash"]);
  return {
    ...envelope(id, r),
    action: "Apply" as const,
    review_id: uuid(r.review_id, "review_id"),
    review_hash: hashInput(r.review_hash, "review_hash"),
  };
}
