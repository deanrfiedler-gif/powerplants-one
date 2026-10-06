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
  instant,
} from "../../shared/validation";
import { hashInput } from "../release/validation";
import { exactQuantity } from "../../supply/validation";
export const followupKeys = [
  ...commonKeys,
  "synthetic_only",
  "target_id",
  "execution_id",
  "expected_sequence",
  "evidence",
  "basis_hash",
];
const keys = followupKeys;
export function envelope(id: string, r: Record<string, unknown>) {
  if (r.synthetic_only !== true)
    invalid("synthetic_only", "Acknowledge synthetic Supply follow-up only.");
  if (
    !Number.isSafeInteger(r.expected_sequence) ||
    Number(r.expected_sequence) < 0
  )
    invalid("expected_sequence", "Use the observed follow-up sequence.");
  return {
    ...common(r),
    revision_id: uuid(id, "revision_id"),
    target_id: uuid(r.target_id, "target_id"),
    execution_id: uuid(r.execution_id, "execution_id"),
    expected_sequence: Number(r.expected_sequence),
    evidence: narrative(r.evidence, "evidence", 4000),
    basis_hash: hashInput(r.basis_hash, "basis_hash"),
    synthetic_only: true as const,
  };
}
export function referralInput(id: string, value: unknown) {
  const r = object(value, [
    ...keys,
    "predecessor_id",
    "owner_id",
    "due_date",
    "date_needed",
    "next_action",
  ]);
  if (
    typeof r.date_needed !== "boolean" ||
    (r.date_needed ? r.due_date !== null : r.due_date === null)
  )
    invalid("due_date", "Provide a due date or explicitly select date needed.");
  return {
    ...envelope(id, r),
    action: "Refer" as const,
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    owner_id: uuid(r.owner_id, "owner_id"),
    due_date: r.date_needed ? null : dateOnly(r.due_date, "due_date"),
    date_needed: r.date_needed,
    next_action: label(r.next_action, "next_action", 1000),
  };
}
export function receivingInput(id: string, value: unknown) {
  const r = object(value, [
    ...keys,
    "referral_id",
    "predecessor_id",
    "decision",
  ]);
  return {
    ...envelope(id, r),
    action: "Receive" as const,
    referral_id: uuid(r.referral_id, "referral_id"),
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    decision: choice(r.decision, "decision", ["Accepted", "Returned", "Held"]),
  };
}
export function reviewInput(id: string, value: unknown) {
  const r = object(value, [
    ...keys,
    "referral_id",
    "receiving_id",
    "predecessor_id",
    "decision",
    "allocation_id",
    "quantity",
    "dependency_id",
    "outcome_state",
    "observed_at",
    "lookup_evidence",
    "receipt_proposal_id",
    "allocation_proposal_id",
  ]);
  const decision = choice(r.decision, "decision", [
    "Retain",
    "Hold",
    "AdjustAllocation",
    "ReconcileReservationOutcome",
    "CorrectReceipt",
    "ReduceAllocations",
  ]);
  if (decision !== "ReduceAllocations" && r.allocation_proposal_id != null)
    invalid(
      "allocation_proposal_id",
      "Only shortfall reduction uses allocation receiving.",
    );
  if (decision !== "CorrectReceipt" && r.receipt_proposal_id != null)
    invalid(
      "receipt_proposal_id",
      "Only Receipt correction uses an affected-demand proposal.",
    );
  if (
    decision !== "ReconcileReservationOutcome" &&
    [r.dependency_id, r.outcome_state, r.observed_at, r.lookup_evidence].some(
      (v) => v !== undefined && v !== null,
    )
  )
    invalid(
      "dependency_id",
      "Only reservation outcome reconciliation proposes dependency evidence.",
    );
  if (
    decision !== "AdjustAllocation" &&
    (r.allocation_id !== null || r.quantity !== null)
  )
    invalid(
      "allocation_id",
      "Only an allocation adjustment proposes a changed quantity.",
    );
  return {
    ...envelope(id, r),
    action: "Review" as const,
    referral_id: uuid(r.referral_id, "referral_id"),
    receiving_id: uuid(r.receiving_id, "receiving_id"),
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    decision,
    ...(decision === "ReduceAllocations"
      ? {
          allocation_proposal_id: uuid(
            r.allocation_proposal_id,
            "allocation_proposal_id",
          ),
        }
      : {}),
    ...(decision === "CorrectReceipt"
      ? {
          receipt_proposal_id: uuid(
            r.receipt_proposal_id,
            "receipt_proposal_id",
          ),
        }
      : {}),
    ...(decision === "ReconcileReservationOutcome"
      ? {
          dependency_id: uuid(r.dependency_id, "dependency_id"),
          outcome_state: choice(r.outcome_state, "outcome_state", [
            "Confirmed",
            "Failed",
            "Absent",
          ]),
          observed_at: instant(r.observed_at, "observed_at"),
          lookup_evidence: label(r.lookup_evidence, "lookup_evidence", 1000),
        }
      : {}),
    allocation_id:
      decision === "AdjustAllocation"
        ? uuid(r.allocation_id, "allocation_id")
        : null,
    quantity:
      decision === "AdjustAllocation"
        ? exactQuantity(r.quantity, "quantity")
        : null,
  };
}
export function applyInput(id: string, value: unknown) {
  const r = object(value, [...keys, "referral_id", "review_id", "review_hash"]);
  return {
    ...envelope(id, r),
    action: "Apply" as const,
    referral_id: uuid(r.referral_id, "referral_id"),
    review_id: uuid(r.review_id, "review_id"),
    review_hash: hashInput(r.review_hash, "review_hash"),
  };
}
