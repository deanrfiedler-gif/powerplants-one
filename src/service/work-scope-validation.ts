import {
  choice,
  common,
  commonKeys,
  dateOnly,
  instant,
  invalid,
  label,
  narrative,
  object,
  optionalId,
  optionalNarrative,
  optionalText,
  uuid,
  version,
} from "../shared/validation";
export const coverageStates = [
  "Unknown",
  "Covered",
  "NotCovered",
  "Disputed",
  "NotApplicable",
] as const;
export const readinessStates = [
  "Unknown",
  "Pass",
  "Blocked",
  "PermittedException",
  "NotApplicable",
] as const;
export const taskKinds = [
  "Inspection",
  "Identification",
  "Intervention",
] as const;
export function list<T>(
  value: unknown,
  field: string,
  read: (v: unknown, index: number) => T,
  min = 0,
  max = 20,
): T[] {
  if (!Array.isArray(value) || value.length < min || value.length > max)
    invalid(field, `Provide ${min}–${max} entries.`);
  return value.map(read);
}
export function evidenceFields(value: unknown) {
  const r = object(value, [
    "title",
    "content_text",
    "source_reference",
    "source_version",
  ]);
  return {
    title: label(r.title, "title", 200),
    content_text: narrative(r.content_text, "content_text"),
    source_reference: label(r.source_reference, "source_reference", 200),
    source_version: label(r.source_version, "source_version", 200),
  };
}
export function coverageFields(value: unknown) {
  const r = object(value, [
    "status",
    "agreement_reference",
    "source_version",
    "effective_from",
    "effective_to",
    "assessment",
    "reason",
    "charging_route",
  ]);
  const status = choice(r.status, "status", coverageStates),
    agreement_reference = optionalText(
      r.agreement_reference,
      "agreement_reference",
    ),
    source_version = optionalText(r.source_version, "source_version");
  const effective_from =
      r.effective_from == null
        ? null
        : dateOnly(r.effective_from, "effective_from"),
    effective_to =
      r.effective_to == null ? null : dateOnly(r.effective_to, "effective_to");
  if (effective_to && (!effective_from || effective_to < effective_from))
    invalid("effective_to", "Coverage end must be on or after its start.");
  const charging_route = choice(r.charging_route, "charging_route", [
    "FinanceReview",
    "ContractReference",
  ]);
  if (
    charging_route === "ContractReference" &&
    (!agreement_reference || !source_version)
  )
    invalid(
      "charging_route",
      "An exact agreement reference and version are required.",
    );
  if (
    ["Unknown", "Disputed"].includes(status) &&
    charging_route !== "FinanceReview"
  )
    invalid(
      "charging_route",
      "Unknown or disputed coverage requires separate Finance review.",
    );
  return {
    status,
    agreement_reference,
    source_version,
    effective_from,
    effective_to,
    assessment: narrative(r.assessment, "assessment", 4000),
    reason: narrative(r.reason, "coverage_reason", 2000),
    charging_route,
  };
}
export function scopeFields(value: unknown) {
  const r = object(value, [
    "summary",
    "exclusions",
    "diagnostic_limit",
    "pending_account_plan",
    "authority_evidence",
    "coverage",
    "items",
  ]);
  const items = list(r.items, "items", (v, i) => {
    const x = object(v, [
      "task_kind",
      "task_description",
      "expected_outcome",
      "completion_requirements",
      "required_skill_codes",
      "shutdown_condition",
      "access_condition",
      "assets",
    ]);
    const assets = list(x.assets, "assets", (v) => {
      const a = object(v, [
        "asset_id",
        "configuration_id",
        "identification_plan",
      ]);
      let plan = null;
      if (a.identification_plan != null) {
        const q = object(a.identification_plan, ["method", "limits"]);
        plan = {
          method: narrative(q.method, "method", 4000),
          limits: narrative(q.limits, "limits", 4000),
        };
      }
      return {
        asset_id: uuid(a.asset_id, "asset_id"),
        configuration_id: optionalId(a.configuration_id, "configuration_id"),
        identification_plan: plan,
      };
    });
    if (new Set(assets.map((a) => a.asset_id)).size !== assets.length)
      invalid("assets", "Each equipment record may occur once per task.");
    return {
      sequence: i + 1,
      task_kind: choice(x.task_kind, "task_kind", taskKinds),
      task_description: narrative(x.task_description, "task_description", 4000),
      expected_outcome: narrative(x.expected_outcome, "expected_outcome", 4000),
      completion_requirements: list(
        x.completion_requirements,
        "completion_requirements",
        (v) => narrative(v, "completion_requirements", 1000),
        1,
      ),
      required_skill_codes: list(
        x.required_skill_codes ?? [],
        "required_skill_codes",
        (v) => label(v, "required_skill_codes", 100),
      ),
      shutdown_condition: optionalNarrative(
        x.shutdown_condition,
        "shutdown_condition",
        2000,
      ),
      access_condition: optionalNarrative(
        x.access_condition,
        "access_condition",
        2000,
      ),
      assets,
    };
  });
  return {
    summary: optionalNarrative(r.summary, "summary", 4000),
    exclusions: optionalNarrative(r.exclusions, "exclusions", 4000),
    diagnostic_limit: optionalNarrative(
      r.diagnostic_limit,
      "diagnostic_limit",
      4000,
    ),
    pending_account_plan: optionalNarrative(
      r.pending_account_plan,
      "pending_account_plan",
      2000,
    ),
    authority_evidence:
      r.authority_evidence == null
        ? null
        : evidenceFields(r.authority_evidence),
    coverage: r.coverage == null ? null : coverageFields(r.coverage),
    items,
  };
}
export type ScopeInput = ReturnType<typeof scopeFields>;
export function commandFields(id: string, value: unknown, keys: string[]) {
  const r = object(value, [...commonKeys, "expected_version", ...keys]);
  return {
    raw: r,
    base: {
      ...common(r),
      work_order_id: uuid(id, "work_order_id"),
      expected_version: version(r.expected_version),
    },
  };
}
export function assessmentFields(value: unknown) {
  const r = object(value, [
    "scope_revision_id",
    "scope_version",
    "appointment_id",
    "criterion_code",
    "outcome",
    "reason",
    "evidence",
    "source_as_at",
    "valid_until",
  ]);
  const source_as_at = instant(r.source_as_at, "source_as_at"),
    valid_until =
      r.valid_until == null ? null : instant(r.valid_until, "valid_until");
  if (Date.parse(source_as_at) > Date.now())
    invalid("source_as_at", "Evidence cannot be from the future.");
  if (valid_until && valid_until <= source_as_at)
    invalid("valid_until", "Evidence expiry must follow its source time.");
  return {
    scope_revision_id: uuid(r.scope_revision_id, "scope_revision_id"),
    scope_version: version(r.scope_version),
    appointment_id: optionalId(r.appointment_id, "appointment_id"),
    criterion_code: label(r.criterion_code, "criterion_code", 100),
    outcome: choice(r.outcome, "outcome", readinessStates),
    reason: narrative(r.reason, "assessment_reason", 2000),
    evidence: r.evidence == null ? null : evidenceFields(r.evidence),
    source_as_at,
    valid_until,
  };
}
