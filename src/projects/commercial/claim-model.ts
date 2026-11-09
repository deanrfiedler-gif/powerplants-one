import {
  common,
  commonKeys,
  choice,
  instant,
  invalid,
  label,
  narrative,
  object,
  uuid,
  version,
} from "../../shared/validation";
import { cents, decimal, money } from "./model";

export type Milestone = {
  id: string;
  title: string;
  trigger: string;
  amount: string;
};
export type Completion = {
  kind: "Milestone" | "Variation";
  target_id: string;
  target_version: number;
  document_id: string;
  revision_id: string;
  review_id: string;
  document_version: number;
  occurred_at: string;
  explanation: string;
};
export type ClaimEvent = {
  basis_id: string;
  version: number;
  command: "Save" | "Submit" | "Approve" | "Return" | "RecordEvidence";
  state: "Draft" | "Submitted" | "Approved" | "Returned";
  schedule_version: number;
  milestones: Milestone[];
  completion: (Completion & { content_hash: string; amount: string }) | null;
  created_by: string;
  created_at: Date;
  operation_id: string;
};
export function milestonesInput(value: unknown): Milestone[] {
  if (!Array.isArray(value) || !value.length || value.length > 50)
    invalid("milestones", "Supply between 1 and 50 ordered milestones.");
  const rows = (value as unknown[]).map((item) => {
    const r = object(item, ["id", "title", "trigger", "amount"]);
    const amount = money(r.amount, "amount", false)!;
    if (cents(amount) <= 0n)
      invalid("amount", "A milestone must have a positive exact amount.");
    return {
      id: uuid(r.id, "id"),
      title: label(r.title, "title", 200),
      trigger: narrative(r.trigger, "trigger", 2000),
      amount,
    };
  });
  if (new Set(rows.map((r) => r.id)).size !== rows.length)
    invalid("milestones", "Each milestone needs a distinct identity.");
  return rows;
}
export function scheduleTotal(rows: Milestone[]) {
  return decimal(rows.reduce((sum, row) => sum + cents(row.amount), 0n));
}
export function claimCommand(project: string, value: unknown) {
  const all = object(value, [
    ...commonKeys,
    "basis_id",
    "expected_version",
    "action",
    "milestones",
    "completion",
  ]);
  const action = choice(all.action, "action", [
    "Save",
    "Submit",
    "Approve",
    "Return",
    "RecordEvidence",
  ] as const);
  const r = object(value, [
    ...commonKeys,
    "basis_id",
    "expected_version",
    "action",
    ...(action === "Save"
      ? ["milestones"]
      : action === "RecordEvidence"
        ? ["completion"]
        : []),
  ]);
  if (
    !Number.isSafeInteger(r.expected_version) ||
    Number(r.expected_version) < 0 ||
    Number(r.expected_version) >= 2147483647
  )
    invalid(
      "expected_version",
      "Use zero for the first schedule, otherwise its current version.",
    );
  let completion: Completion | null = null;
  if (action === "RecordEvidence") {
    const e = object(r.completion, [
      "kind",
      "target_id",
      "target_version",
      "document_id",
      "revision_id",
      "review_id",
      "document_version",
      "occurred_at",
      "explanation",
    ]);
    completion = {
      kind: choice(e.kind, "kind", ["Milestone", "Variation"] as const),
      target_id: uuid(e.target_id, "target_id"),
      target_version: version(e.target_version),
      document_id: uuid(e.document_id, "document_id"),
      revision_id: uuid(e.revision_id, "revision_id"),
      review_id: uuid(e.review_id, "review_id"),
      document_version: version(e.document_version),
      occurred_at: instant(e.occurred_at, "occurred_at"),
      explanation: narrative(e.explanation, "explanation", 2000),
    };
  }
  return {
    ...common(r),
    project_id: uuid(project, "project_id"),
    basis_id: uuid(r.basis_id, "basis_id"),
    expected_version: Number(r.expected_version),
    action,
    milestones: action === "Save" ? milestonesInput(r.milestones) : null,
    completion,
  };
}
