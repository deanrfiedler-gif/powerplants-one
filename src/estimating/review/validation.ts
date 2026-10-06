import {
  choice,
  common,
  commonKeys,
  invalid,
  label,
  object,
  optionalId,
  uuid,
  version,
} from "../../shared/validation";

export const reviewKinds = [
  "Completeness",
  "SourcePrice",
  "Technical",
] as const;
export type ReviewKind = (typeof reviewKinds)[number];
export const reviewCapabilities = {
  Completeness: "estimating.review.completeness",
  SourcePrice: "estimating.review.price",
  Technical: "estimating.review.technical",
} as const;

function sequence(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    invalid(
      "expected_review_version",
      "Use the current review sequence, including zero before submission.",
    );
  return Number(value);
}
export function submitInput(id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "estimate_version_id",
    "basis_hash",
    "expected_version",
    "expected_review_version",
    "responses",
  ]);
  if (typeof r.basis_hash !== "string" || !/^[a-f0-9]{64}$/.test(r.basis_hash))
    invalid("basis_hash", "Use the exact observed review basis hash.");
  if (!Array.isArray(r.responses) || r.responses.length > 60)
    invalid("responses", "Respond to each outstanding finding, up to 60.");
  const responses = r.responses
    .map((value) => {
      const x = object(value, ["finding_id", "response"]);
      return {
        finding_id: uuid(x.finding_id, "finding_id"),
        response: label(x.response, "response", 1000),
      };
    })
    .sort((a, b) => a.finding_id.localeCompare(b.finding_id));
  if (new Set(responses.map((x) => x.finding_id)).size !== responses.length)
    invalid("responses", "Respond once to each finding.");
  return {
    ...common(r),
    id: uuid(id, "id"),
    estimate_version_id: uuid(r.estimate_version_id, "estimate_version_id"),
    basis_hash: r.basis_hash,
    expected_version: version(r.expected_version),
    expected_review_version: sequence(r.expected_review_version),
    responses,
  };
}
export function decideInput(id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "submission_id",
    "kind",
    "outcome",
    "expected_version",
    "expected_review_version",
    "findings",
  ]);
  const outcome = choice(r.outcome, "outcome", [
    "Reviewed",
    "Returned",
  ] as const);
  if (
    !Array.isArray(r.findings) ||
    r.findings.length > 20 ||
    (outcome === "Returned" ? !r.findings.length : r.findings.length !== 0)
  )
    invalid(
      "findings",
      "A return requires 1–20 findings; Reviewed requires none outstanding.",
    );
  const findings = r.findings.map((value) => {
    const x = object(value, ["line_id", "detail"]);
    return {
      line_id: optionalId(x.line_id, "line_id"),
      detail: label(x.detail, "detail", 1000),
    };
  });
  return {
    ...common(r),
    id: uuid(id, "id"),
    submission_id: uuid(r.submission_id, "submission_id"),
    kind: choice(r.kind, "kind", reviewKinds),
    outcome,
    expected_version: version(r.expected_version),
    expected_review_version: sequence(r.expected_review_version),
    findings,
  };
}
