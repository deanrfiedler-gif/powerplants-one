import { createHash } from "node:crypto";
import { canonical } from "../../platform/operations";
import {
  choice,
  common,
  commonKeys,
  instant,
  invalid,
  narrative,
  object,
  uuid,
  version,
} from "../../shared/validation";
import { safeEvidence } from "../../equipment/changes";

import { caseActions, type CaseAction } from "./states";
export {
  caseStates,
  caseActions,
  stateLabels,
  allowedAction,
  type CaseAction,
  type CaseState,
} from "./states";
export const hashBytes = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export const hashValue = (value: unknown) =>
  hashBytes(canonical(JSON.parse(JSON.stringify(value))));
export function technicalText(value: unknown, field: string, max = 4000) {
  const text = safeEvidence(value, field, max);
  if (
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:[$£€]|\b(?:AUD|USD|GBP|EUR)\s*\d)|(?:\+\d[\d ()-]{7,}\d)/i.test(
      text,
    )
  )
    invalid(
      field,
      "Leave customer contact details and prices out of technical evidence.",
    );
  return text;
}
export function createCaseInput(input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "finding_key",
    "asset_id",
    "owner_id",
    "fault",
    "fault_type",
  ]);
  return {
    ...common(r),
    id: uuid(r.id, "id"),
    finding_key: narrative(r.finding_key, "finding_key", 80),
    asset_id: uuid(r.asset_id, "asset_id"),
    owner_id: uuid(r.owner_id, "owner_id"),
    fault: technicalText(r.fault, "fault", 200),
    fault_type: technicalText(r.fault_type, "fault_type", 100),
  };
}
const fields: Record<CaseAction, string[]> = {
  photo: ["media_type", "content_base64", "sha256", "confirmed_exclusions"],
  diagnose: ["attempted_at", "diagnostic", "result", "source_reference"],
  capture_configuration: [],
  prepare_pack: [],
  review_pack: ["pack_id", "html_sha256", "pdf_sha256", "confirmed_exclusions"],
  record_sent: [
    "pack_id",
    "sent_at",
    "sent_by",
    "method",
    "recipient",
    "manufacturer_reference",
    "reply_expected_at",
  ],
  record_reply: [
    "received_at",
    "reply",
    "advice",
    "settings_change",
    "attachments",
  ],
  next_action: [
    "source_token",
    "expected_finding_version",
    "owner_id",
    "due_at",
    "instruction",
    "required_evidence",
    "grower_approval_required",
  ],
  follow_up: ["question"],
  close: ["outcome"],
  withdraw: ["outcome"],
};
export function actionInput(
  input: unknown,
): Record<string, unknown> &
  ReturnType<typeof common> & { action: CaseAction; expected_version: number } {
  const raw = object(input, [
    ...commonKeys,
    "action",
    "expected_version",
    ...Object.values(fields).flat(),
  ]);
  const action = choice(raw.action, "action", caseActions);
  const r = object(input, [
    ...commonKeys,
    "action",
    "expected_version",
    ...fields[action],
  ]);
  return {
    ...r,
    ...common(r),
    action,
    expected_version: version(r.expected_version),
  };
}
export function sha(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    invalid(field, "Use the exact retained SHA-256.");
  return value as string;
}
export function pastInstant(value: unknown, field: string, now: Date) {
  const at = instant(value, field);
  if (Date.parse(at) > now.getTime())
    invalid(field, "Record a fact that has already occurred.");
  return at;
}
