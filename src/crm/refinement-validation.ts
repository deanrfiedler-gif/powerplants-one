import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  label,
  narrative,
  optionalNarrative,
  optionalId,
  dateOnly,
  choice,
  invalid,
} from "../shared/validation";

export function opportunityAmount(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (
    typeof value !== "string" ||
    !/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value.trim())
  )
    invalid(
      "value_amount",
      "Enter a non-negative amount with up to two decimal places, or leave it blank.",
    );
  const amount = Number(value.trim().replaceAll(",", ""));
  if (!Number.isFinite(amount) || amount > 999999999.99)
    invalid("value_amount", "Enter an amount below 1 billion.");
  return amount.toFixed(2);
}
export function parseDealInformation(id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "title",
    "primary_person_id",
    "contact_unknown_reason",
    "value_amount",
    "expected_close_date",
  ]);
  const primary_person_id = optionalId(
    r.primary_person_id,
    "primary_person_id",
  );
  const contact_unknown_reason = optionalNarrative(
    r.contact_unknown_reason,
    "contact_unknown_reason",
    1000,
  );
  if ((primary_person_id === null) !== (contact_unknown_reason !== null))
    invalid(
      "contact_unknown_reason",
      "Select a contact or explain why the contact is unknown.",
    );
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    title: label(r.title, "title", 200),
    primary_person_id,
    contact_unknown_reason,
    value_amount: opportunityAmount(r.value_amount),
    expected_close_date:
      r.expected_close_date === null || r.expected_close_date === ""
        ? null
        : dateOnly(r.expected_close_date, "expected_close_date"),
  };
}
export const scopeKeys = [
  "inclusions",
  "exclusions",
  "assumptions",
  "constraints",
  "acceptance",
  "timing",
  "delivery",
] as const;
export function parseDealScope(id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "need_summary",
    "scope_details",
  ]);
  const detail = object(r.scope_details, [...scopeKeys]);
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    need_summary: narrative(r.need_summary, "need_summary", 2000),
    scope_details: Object.fromEntries(
      scopeKeys.map((k) => [k, optionalNarrative(detail[k], k, 5000)]),
    ),
  };
}
export function parseDealStage(id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "stage_id",
    "qualification_note",
    "identification_activity_id",
  ]);
  const stage_id = choice(r.stage_id, "stage_id", [
    "Enquiry",
    "Qualified",
  ] as const);
  if (
    stage_id === "Enquiry" &&
    (r.qualification_note != null || r.identification_activity_id != null)
  )
    invalid(
      "qualification_note",
      "Enquiry keeps previous qualification in history; do not submit current qualification fields.",
    );
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    stage_id,
    qualification_note:
      stage_id === "Qualified"
        ? narrative(r.qualification_note, "qualification_note", 2000)
        : null,
    identification_activity_id:
      stage_id === "Qualified"
        ? optionalId(r.identification_activity_id, "identification_activity_id")
        : null,
  };
}
