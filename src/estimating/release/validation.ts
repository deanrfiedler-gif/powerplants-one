import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
  choice,
  optionalId,
} from "../../shared/validation";
export function hashInput(value: unknown, field: string) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    invalid(field, "Use the exact observed SHA-256 fingerprint.");
  return value;
}
function eventSequence(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    invalid(
      "expected_release_sequence",
      "Use the current release event sequence.",
    );
  return Number(value);
}
function envelope(id: string, r: Record<string, unknown>) {
  if (r.synthetic_only !== true)
    invalid(
      "synthetic_only",
      "Acknowledge the non-operative synthetic policy.",
    );
  return {
    ...common(r),
    revision_id: uuid(id, "revision_id"),
    synthetic_only: true as const,
    expected_quote_version: version(r.expected_quote_version),
    expected_release_sequence: eventSequence(r.expected_release_sequence),
  };
}
const keys = [
  ...commonKeys,
  "synthetic_only",
  "expected_quote_version",
  "expected_release_sequence",
];
export function prepareInput(id: string, value: unknown) {
  const r = object(value, [
    ...keys,
    "id",
    "basis_hash",
    "predecessor_issue_id",
  ]);
  return {
    ...envelope(id, r),
    id: uuid(r.id, "id"),
    basis_hash: hashInput(r.basis_hash, "basis_hash"),
    predecessor_issue_id: optionalId(
      r.predecessor_issue_id,
      "predecessor_issue_id",
    ),
  };
}
export function approvalInput(id: string, value: unknown) {
  const r = object(value, [...keys, "outcome", "output_hash"]);
  return {
    ...envelope(id, r),
    outcome: choice(r.outcome, "outcome", ["Approved", "Returned"] as const),
    output_hash: hashInput(r.output_hash, "output_hash"),
  };
}
export function issueInput(id: string, value: unknown) {
  const r = object(value, [...keys, "approval_id", "output_hash"]);
  return {
    ...envelope(id, r),
    approval_id: uuid(r.approval_id, "approval_id"),
    output_hash: hashInput(r.output_hash, "output_hash"),
  };
}
export function distributionInput(id: string, value: unknown) {
  const r = object(value, [
    ...keys,
    "issue_id",
    "attempt_id",
    "resolves_event_id",
    "outcome",
  ]);
  return {
    ...envelope(id, r),
    issue_id: uuid(r.issue_id, "issue_id"),
    attempt_id: uuid(r.attempt_id, "attempt_id"),
    resolves_event_id: optionalId(r.resolves_event_id, "resolves_event_id"),
    outcome: choice(r.outcome, "outcome", [
      "Unknown",
      "SimulatedDelivered",
      "SimulatedFailed",
    ] as const),
  };
}
