import {
  choice,
  dateOnly,
  invalid,
  narrative,
  object,
  optionalId,
  uuid,
} from "../shared/validation";
import { array, boundedText, ids } from "./handover-model";
export type ReviewDraft = {
  due_date: string | null;
  due_basis: "UserChoice" | "RecordedCommitment" | "SourcedRule";
  due_detail: string;
  rule_reference: string;
  rule_revision: string;
  review_date: string | null;
  method: string;
  participants: { person_id: string; role: string }[];
  feedback: {
    person_id: string;
    basis: "Quoted" | "Paraphrased" | "InternalInterpretation";
    statement: string;
  }[];
  benefits: string;
  concerns: string;
  next_steps: string;
  activity_ids: string[];
  commitments: {
    id: string;
    summary: string;
    disposition:
      "Open" | "Fulfilled" | "NotApplicable" | "CarriedAsOwnedAction";
    note: string;
    activity_id: string | null;
  }[];
};
export const emptyReview = (): ReviewDraft => ({
  due_date: null,
  due_basis: "UserChoice",
  due_detail: "",
  rule_reference: "",
  rule_revision: "",
  review_date: null,
  method: "",
  participants: [],
  feedback: [],
  benefits: "",
  concerns: "",
  next_steps: "",
  activity_ids: [],
  commitments: [],
});
export type Referral = {
  revision: number;
  state: "Prepared" | "Submitted" | "Returned" | "Accepted" | "Unknown";
  summary: string;
  context: string;
  impact: string;
  next_activity_id: string;
  receiving_owner_id: string;
  duplicate_check: boolean;
  submitted_at: string | null;
  receiving_id: string | null;
  note: string;
};
export type Training = {
  need: string;
  asset_id: string;
  configuration: string;
  material_basis: string;
  arranged_on: string | null;
  arrangement_note: string;
  attendance: string;
  delivery: string;
  activity_id: string | null;
  assessment: "Not assessed" | "Assessed";
  method: string;
  limits: string;
};
export const emptyTraining = (): Training => ({
  need: "",
  asset_id: "",
  configuration: "",
  material_basis: "",
  arranged_on: null,
  arrangement_note: "",
  attendance: "",
  delivery: "",
  activity_id: null,
  assessment: "Not assessed",
  method: "",
  limits: "",
});
export type AftercareContent = {
  review: ReviewDraft;
  preparation: Record<string, unknown> | null;
  source_hash: string | null;
  service_referral: Referral | null;
  crm_handover: Referral | null;
  case_ids: string[];
  opportunity_id: string | null;
  commercial: {
    observation: string;
    need: string;
    assumptions: string;
    existing_checked: boolean;
  } | null;
  training: Training[];
};
export const emptyAftercare = (): AftercareContent => ({
  review: emptyReview(),
  preparation: null,
  source_hash: null,
  service_referral: null,
  crm_handover: null,
  case_ids: [],
  opportunity_id: null,
  commercial: null,
  training: [],
});
export function parseReview(value: unknown): ReviewDraft {
  const r = object(value, Object.keys(emptyReview()));
  const result: ReviewDraft = {
    due_date: r.due_date === null ? null : dateOnly(r.due_date, "due_date"),
    due_basis: choice(r.due_basis, "due_basis", [
      "UserChoice",
      "RecordedCommitment",
      "SourcedRule",
    ]),
    due_detail: boundedText(r.due_detail, "due_detail"),
    rule_reference: boundedText(r.rule_reference, "rule_reference"),
    rule_revision: boundedText(r.rule_revision, "rule_revision"),
    review_date:
      r.review_date === null ? null : dateOnly(r.review_date, "review_date"),
    method: boundedText(r.method, "method"),
    participants: array(r.participants, "participants", (v) => {
      const x = object(v, ["person_id", "role"]);
      return {
        person_id: uuid(x.person_id, "person_id"),
        role: narrative(x.role, "role", 200),
      };
    }),
    feedback: array(r.feedback, "feedback", (v) => {
      const x = object(v, ["person_id", "basis", "statement"]);
      return {
        person_id: uuid(x.person_id, "person_id"),
        basis: choice(x.basis, "basis", [
          "Quoted",
          "Paraphrased",
          "InternalInterpretation",
        ]),
        statement: narrative(x.statement, "statement", 4000),
      };
    }),
    benefits: boundedText(r.benefits, "benefits"),
    concerns: boundedText(r.concerns, "concerns"),
    next_steps: boundedText(r.next_steps, "next_steps"),
    activity_ids: ids(r.activity_ids, "activity_ids"),
    commitments: array(r.commitments, "commitments", (v) => {
      const x = object(v, [
        "id",
        "summary",
        "disposition",
        "note",
        "activity_id",
      ]);
      return {
        id: uuid(x.id, "commitment.id"),
        summary: narrative(x.summary, "summary", 2000),
        disposition: choice(x.disposition, "disposition", [
          "Open",
          "Fulfilled",
          "NotApplicable",
          "CarriedAsOwnedAction",
        ]),
        note: boundedText(x.note, "note"),
        activity_id: optionalId(x.activity_id, "activity_id"),
      };
    }),
  };
  if (!result.due_detail.trim())
    invalid(
      "due_detail",
      "Record your explicit date choice, commitment or reason the date is needed.",
    );
  if (
    result.due_basis === "SourcedRule" &&
    (!result.rule_reference.trim() || !result.rule_revision.trim())
  )
    invalid(
      "rule_reference",
      "A sourced rule needs its exact reference and revision.",
    );
  if (
    new Set(result.commitments.map((x) => x.id)).size !==
    result.commitments.length
  )
    invalid("commitments", "Commitment identities must be unique.");
  return result;
}
export function reviewBlockers(r: ReviewDraft) {
  const gaps: string[] = [];
  if (!r.review_date || !r.method.trim() || !r.participants.length)
    gaps.push("review date, method and participants with recorded roles");
  if (!r.next_steps.trim()) gaps.push("next steps (or explicitly None)");
  for (const x of r.commitments) {
    if (
      x.disposition === "Open" ||
      !x.note.trim() ||
      (x.disposition === "CarriedAsOwnedAction" && !x.activity_id)
    )
      gaps.push(`commitment: ${x.summary}`);
  }
  return gaps;
}
