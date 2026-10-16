import {
  common,
  commonKeys,
  object,
  choice,
  uuid,
  optionalId,
  narrative,
  invalid,
} from "../../../shared/validation";
export const actions = ["Submit", "Accept", "Return", "Withdraw"] as const;
export function commandInput(project: string, value: unknown) {
  const fields = [
    "handover_id",
    "document_id",
    "revision_id",
    "reviewer_id",
    "scope",
    "limitations",
    "predecessor_id",
  ];
  const r = object(value, [
    ...commonKeys,
    "id",
    "expected_version",
    "action",
    "note",
    ...fields,
  ]);
  const action = choice(r.action, "action", actions),
    submit = action === "Submit";
  if (r.expected_version !== (submit ? 0 : 1))
    invalid(
      "expected_version",
      "Submit requires zero; decisions require exact version one.",
    );
  if (!submit && fields.some((k) => k in r))
    invalid("action", "Decisions retain the exact submitted evidence.");
  return {
    ...common(r),
    project_id: uuid(project, "project_id"),
    id: uuid(r.id, "id"),
    action,
    expected_version: submit ? 0 : 1,
    note: narrative(r.note, "note", 2000),
    submission: submit
      ? {
          handover_id: uuid(r.handover_id, "handover_id"),
          document_id: uuid(r.document_id, "document_id"),
          revision_id: uuid(r.revision_id, "revision_id"),
          reviewer_id: uuid(r.reviewer_id, "reviewer_id"),
          scope: narrative(r.scope, "scope", 4000),
          limitations: narrative(r.limitations, "limitations", 4000),
          predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
        }
      : null,
  };
}
export type Submission = NonNullable<
  ReturnType<typeof commandInput>["submission"]
>;
