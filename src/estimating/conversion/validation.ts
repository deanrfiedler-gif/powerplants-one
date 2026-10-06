import {
  common,
  commonKeys,
  object,
  uuid,
  optionalId,
  choice,
  label,
  narrative,
  dateOnly,
  invalid,
} from "../../shared/validation";
import { hashInput } from "../release/validation";
export const resolutionStates = [
  "Missing",
  "Ambiguous",
  "Obsolete",
  "Incompatible",
  "OneOff",
] as const;
const keys = [
  ...commonKeys,
  "synthetic_only",
  "issue_id",
  "output_hash",
  "preparation_id",
  "response_id",
  "expected_sequence",
  "evidence",
];
function envelope(id: string, r: Record<string, unknown>) {
  if (r.synthetic_only !== true)
    invalid(
      "synthetic_only",
      "Acknowledge synthetic receiving and coordination only.",
    );
  if (
    !Number.isSafeInteger(r.expected_sequence) ||
    Number(r.expected_sequence) < 0
  )
    invalid("expected_sequence", "Use the observed receiving sequence.");
  return {
    ...common(r),
    revision_id: uuid(id, "revision_id"),
    synthetic_only: true as const,
    issue_id: uuid(r.issue_id, "issue_id"),
    output_hash: hashInput(r.output_hash, "output_hash"),
    preparation_id: uuid(r.preparation_id, "preparation_id"),
    response_id: uuid(r.response_id, "response_id"),
    expected_sequence: Number(r.expected_sequence),
    evidence: narrative(r.evidence, "evidence", 4000),
  };
}
export function receivingInput(id: string, value: unknown) {
  const r = object(value, [
    ...keys,
    "predecessor_id",
    "decision",
    "owner_id",
    "due_date",
    "next_action",
  ]);
  return {
    ...envelope(id, r),
    action: "Receive" as const,
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    decision: choice(r.decision, "decision", [
      "Received",
      "Held",
      "Returned",
    ] as const),
    owner_id: uuid(r.owner_id, "owner_id"),
    due_date: dateOnly(r.due_date, "due_date"),
    next_action: narrative(r.next_action, "next_action", 1000),
  };
}
export function resolutionInput(id: string, value: unknown) {
  const r = object(value, [
    ...keys,
    "predecessor_id",
    "line_id",
    "state",
    "label",
    "unit",
    "company_id",
    "entity",
  ]);
  return {
    ...envelope(id, r),
    action: "Resolve" as const,
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    line_id: uuid(r.line_id, "line_id"),
    state: choice(r.state, "state", resolutionStates),
    label: label(r.label, "label", 200),
    unit: label(r.unit, "unit", 40),
    company_id: uuid(r.company_id, "company_id"),
    entity: choice(r.entity, "entity", ["SupplyDemand"] as const),
  };
}
export function planInput(id: string, value: unknown) {
  const r = object(value, [
    ...keys,
    "predecessor_id",
    "basis_hash",
    "decision",
  ]);
  return {
    ...envelope(id, r),
    action: "Plan" as const,
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    basis_hash: hashInput(r.basis_hash, "basis_hash"),
    decision: choice(r.decision, "decision", ["Reviewed"] as const),
  };
}
export function executionInput(id: string, value: unknown) {
  const r = object(value, [...keys, "plan_id", "plan_hash"]);
  return {
    ...envelope(id, r),
    action: "Execute" as const,
    plan_id: uuid(r.plan_id, "plan_id"),
    plan_hash: hashInput(r.plan_hash, "plan_hash"),
  };
}
export type ConversionInput =
  | ReturnType<typeof receivingInput>
  | ReturnType<typeof resolutionInput>
  | ReturnType<typeof planInput>
  | ReturnType<typeof executionInput>;
