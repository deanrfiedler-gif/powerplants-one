import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
  instant,
  label,
  narrative,
  optionalId,
  optionalNarrative,
  invalid,
} from "../shared/validation";
import { classifications, priorities, type Facts } from "./model";
export const actions = [
  "create",
  "save",
  "submit",
  "triage",
  "review",
  "action",
  "accept_action",
  "evidence",
  "accept",
  "close",
  "reopen",
  "rebind",
  "link",
  "adopt_assignment",
] as const;
export function facts(value: unknown): Facts {
  const r = object(value, [
    "classification",
    "occurred_at",
    "summary",
    "observations",
    "immediate_response",
    "source_reference",
    "restricted_details",
  ]);
  const occurred_at = instant(r.occurred_at, "occurred_at");
  if (Date.parse(occurred_at) > Date.now() + 300000)
    invalid(
      "occurred_at",
      "Record the actual occurrence time, not a future event.",
    );
  return {
    classification: choice(r.classification, "classification", classifications),
    occurred_at,
    summary: label(r.summary, "summary", 160),
    observations: narrative(r.observations, "observations", 4000),
    immediate_response: narrative(
      r.immediate_response,
      "immediate_response",
      2000,
    ),
    source_reference: label(r.source_reference, "source_reference", 600),
    restricted_details: optionalNarrative(
      r.restricted_details,
      "restricted_details",
      4000,
    ),
  };
}
export function parse(value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "action",
    "id",
    "appointment_id",
    "scope_item_id",
    "asset_id",
    "source_hash",
    "facts",
    "expected_version",
    "owner_id",
    "due_at",
    "priority",
    "assessment",
    "hold",
    "decision",
    "action_id",
    "evidence_id",
    "instruction",
    "audience",
    "label",
    "media_type",
    "byte_count",
    "sha256",
    "content_base64",
    "repeated_report_id",
    "defect_id",
    "activity_version",
  ]);
  const action = choice(r.action, "action", actions),
    head = { ...common(r), action, id: uuid(r.id, "id") };
  if (action === "create")
    return {
      ...head,
      action,
      appointment_id: uuid(r.appointment_id, "appointment_id"),
      scope_item_id: uuid(r.scope_item_id, "scope_item_id"),
      asset_id: uuid(r.asset_id, "asset_id"),
      source_hash: label(r.source_hash, "source_hash", 64),
      facts: facts(r.facts),
    };
  const on = { ...head, expected_version: version(r.expected_version) };
  if (action === "save") return { ...on, action, facts: facts(r.facts) };
  if (action === "triage") {
    if (typeof r.hold !== "boolean")
      invalid("hold", "Choose an explicit scope hold.");
    return {
      ...on,
      action,
      owner_id: uuid(r.owner_id, "owner_id"),
      due_at: instant(r.due_at, "due_at"),
      priority: choice(r.priority, "priority", priorities),
      assessment: choice(r.assessment, "assessment", [
        "Unassessed",
        "Assessed",
      ] as const),
      hold: r.hold,
    };
  }
  if (action === "review")
    return {
      ...on,
      action,
      decision: choice(r.decision, "decision", [
        "Returned",
        "ClarificationRequired",
        "OnHold",
        "InReview",
      ] as const),
    };
  if (action === "rebind")
    return {
      ...on,
      action,
      scope_item_id: uuid(r.scope_item_id, "scope_item_id"),
      asset_id: uuid(r.asset_id, "asset_id"),
      source_hash: label(r.source_hash, "source_hash", 64),
    };
  if (action === "link")
    return {
      ...on,
      action,
      repeated_report_id: optionalId(
        r.repeated_report_id,
        "repeated_report_id",
      ),
      defect_id: optionalId(r.defect_id, "defect_id"),
    };
  if (action === "action")
    return {
      ...on,
      action,
      action_id: uuid(r.action_id, "action_id"),
      owner_id: uuid(r.owner_id, "owner_id"),
      due_at: instant(r.due_at, "due_at"),
      instruction: narrative(r.instruction, "instruction", 2000),
    };
  if (action === "adopt_assignment")
    return {
      ...on,
      action,
      action_id: uuid(r.action_id, "action_id"),
      activity_version: version(r.activity_version),
    };
  if (action === "accept_action")
    return {
      ...on,
      action,
      action_id: uuid(r.action_id, "action_id"),
      evidence_id: uuid(r.evidence_id, "evidence_id"),
    };
  if (action === "evidence") {
    const byte_count = Number(r.byte_count);
    if (
      !Number.isSafeInteger(byte_count) ||
      byte_count < 1 ||
      byte_count > 2 * 1024 * 1024
    )
      invalid("byte_count", "Use 1 byte to 2 MiB.");
    if (
      typeof r.content_base64 !== "string" ||
      r.content_base64.length > 2800000 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(r.content_base64)
    )
      invalid("content_base64", "Supply original file bytes.");
    return {
      ...on,
      action,
      evidence_id: uuid(r.evidence_id, "evidence_id"),
      action_id: optionalId(r.action_id, "action_id"),
      audience: choice(r.audience, "audience", [
        "Operational",
        "Restricted",
      ] as const),
      label: label(r.label, "label", 200),
      media_type: choice(r.media_type, "media_type", [
        "image/png",
        "text/plain",
      ] as const),
      byte_count,
      sha256: label(r.sha256, "sha256", 64),
      content_base64: r.content_base64,
    };
  }
  return { ...on, action };
}
