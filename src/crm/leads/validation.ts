import {
  choice,
  common,
  commonKeys,
  label,
  narrative,
  object,
  optionalId,
  optionalNarrative,
  uuid,
  version,
  invalid,
} from "../../shared/validation";
import { parseAction } from "../validation";
export const leadStates = ["New", "Contacting", "Nurturing"] as const;
export const sources = [
  "Phone",
  "Email",
  "Meeting",
  "Referral",
  "Other",
] as const;
const fields = [
  "title",
  "need_summary",
  "organisation_text",
  "contact_text",
  "source_channel",
  "source_basis",
];
function details(r: Record<string, unknown>) {
  return {
    title: label(r.title, "title", 200),
    need_summary: optionalNarrative(r.need_summary, "need_summary", 2000),
    organisation_text: optionalNarrative(
      r.organisation_text,
      "organisation_text",
      200,
    ),
    contact_text: optionalNarrative(r.contact_text, "contact_text", 200),
    source_channel: choice(r.source_channel, "source_channel", sources),
    source_basis: narrative(r.source_basis, "source_basis", 1000),
  };
}
export function parseLeadCreate(value: unknown) {
  const r = object(value, [
    ...commonKeys,
    ...fields,
    "id",
    "company_id",
    "owner_id",
    "organisation_id",
    "site_id",
    "primary_person_id",
  ]);
  const result = {
    ...common(r),
    ...details(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    owner_id: uuid(r.owner_id, "owner_id"),
    organisation_id: optionalId(r.organisation_id, "organisation_id"),
    site_id: optionalId(r.site_id, "site_id"),
    primary_person_id: optionalId(r.primary_person_id, "primary_person_id"),
  };
  if ((result.site_id || result.primary_person_id) && !result.organisation_id)
    invalid(
      "organisation_id",
      "Select an organisation before a linked site or contact.",
    );
  return result;
}
export function parseLeadChange(id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    ...fields,
    "expected_version",
    "action",
    "note",
    "status",
  ]);
  const action = choice(r.action, "action", [
    "update",
    "note",
    "archive",
    "unarchive",
    "disqualify",
    "reopen",
  ] as const);
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    action,
    ...(action === "update"
      ? { details: details(r), status: choice(r.status, "status", leadStates) }
      : {}),
    note: action === "note" ? narrative(r.note, "note", 10000) : null,
  };
}
export function parseLeadPlan(id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "activity_id",
    "new_action",
  ]);
  const activity_id = optionalId(r.activity_id, "activity_id");
  if ((activity_id !== null) === (r.new_action != null))
    invalid(
      "activity_id",
      "Choose an existing action or create one new action.",
    );
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    activity_id,
    new_action: r.new_action == null ? null : parseAction(r.new_action),
  };
}
export function parseLeadConversion(id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "opportunity_id",
    "organisation_id",
    "site_id",
    "primary_person_id",
    "site_unknown_reason",
    "contact_unknown_reason",
    "title",
    "need_summary",
    "qualification_note",
    "activity_id",
    "new_action",
    "identification_activity_id",
  ]);
  const plan = parseLeadPlan(id, {
    ...Object.fromEntries(commonKeys.map((k) => [k, r[k]])),
    expected_version: r.expected_version,
    activity_id: r.activity_id,
    new_action: r.new_action,
  });
  const site_id = optionalId(r.site_id, "site_id"),
    primary_person_id = optionalId(r.primary_person_id, "primary_person_id"),
    site_unknown_reason = optionalNarrative(
      r.site_unknown_reason,
      "site_unknown_reason",
      1000,
    ),
    contact_unknown_reason = optionalNarrative(
      r.contact_unknown_reason,
      "contact_unknown_reason",
      1000,
    );
  if ((site_id === null) !== (site_unknown_reason !== null))
    invalid(
      "site_unknown_reason",
      "Select a site or explain why it is unknown.",
    );
  if ((primary_person_id === null) !== (contact_unknown_reason !== null))
    invalid(
      "contact_unknown_reason",
      "Select a contact or explain why it is unknown.",
    );
  return {
    ...plan,
    opportunity_id: uuid(r.opportunity_id, "opportunity_id"),
    organisation_id: uuid(r.organisation_id, "organisation_id"),
    site_id,
    primary_person_id,
    site_unknown_reason,
    contact_unknown_reason,
    title: label(r.title, "title", 200),
    need_summary: narrative(r.need_summary, "need_summary", 2000),
    qualification_note: narrative(
      r.qualification_note,
      "qualification_note",
      2000,
    ),
    identification_activity_id: optionalId(
      r.identification_activity_id,
      "identification_activity_id",
    ),
  };
}
