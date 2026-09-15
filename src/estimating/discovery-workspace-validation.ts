import { canonical } from "../platform/operations";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  label,
  invalid,
  choice,
  narrative,
} from "../shared/validation";
import {
  compileDiscovery,
  discoveryDefinition,
  type DiscoveryInput,
  type FollowUp,
} from "./discovery";

function bounded(value: unknown) {
  if (Buffer.byteLength(canonical(value) ?? "", "utf8") > 65536)
    invalid("payload", "Keep the complete discovery request within 64 KiB.");
}
function hash(value: unknown, field: string) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    invalid(field, "Compare the current proposal before saving.");
  return value;
}
function confirmations(value: unknown) {
  if (
    !Array.isArray(value) ||
    value.length > discoveryDefinition.questions.length ||
    value.some(
      (id) => !discoveryDefinition.questions.some((q) => q.id === id),
    ) ||
    new Set(value).size !== value.length
  )
    invalid(
      "confirmed_question_ids",
      "Explicitly list each question confirmed in this proposal once.",
    );
  return [...(value as string[])].sort();
}
const createKeys = ["opportunity_id", "discovery"];
export function discoveryCreateProposal(value: unknown) {
  bounded(value);
  const r = object(value, createKeys);
  return {
    opportunity_id: uuid(r.opportunity_id, "opportunity_id"),
    discovery: compileDiscovery(r.discovery).input,
  };
}
export function createWorkspaceInput(value: unknown) {
  bounded(value);
  const r = object(value, [
    ...commonKeys,
    ...createKeys,
    "id",
    "option_id",
    "revision_id",
    "expected_opportunity_version",
    "context_hash",
    "confirmed_question_ids",
  ]);
  return {
    ...common(r),
    ...discoveryCreateProposal({
      opportunity_id: r.opportunity_id,
      discovery: r.discovery,
    }),
    id: uuid(r.id, "id"),
    option_id: uuid(r.option_id, "option_id"),
    revision_id: uuid(r.revision_id, "revision_id"),
    expected_opportunity_version: version(r.expected_opportunity_version),
    context_hash: hash(r.context_hash, "context_hash"),
    confirmed_question_ids: confirmations(r.confirmed_question_ids),
  };
}
const changeKeys = [
  "kind",
  "option_id",
  "expected_version",
  "expected_revision_id",
  "discovery",
  "branch_mode",
  "copy_follow_up",
];
export type DiscoveryChange = {
  kind: "Save" | "Branch";
  option_id: string;
  expected_version: number;
  expected_revision_id: string;
  discovery: DiscoveryInput | null;
  branch_mode: "Fresh" | "CopyDiscovery" | null;
  copy_follow_up: FollowUp | null;
};
export function discoveryChangeProposal(value: unknown): DiscoveryChange {
  bounded(value);
  const r = object(value, changeKeys),
    kind = choice(r.kind, "kind", ["Save", "Branch"] as const);
  const branch_mode =
    kind === "Branch"
      ? choice(r.branch_mode, "branch_mode", [
          "Fresh",
          "CopyDiscovery",
        ] as const)
      : null;
  if (
    kind === "Save" &&
    ((r.branch_mode !== undefined && r.branch_mode !== null) ||
      (r.copy_follow_up !== undefined && r.copy_follow_up !== null))
  )
    invalid("branch_mode", "A scope successor is not a new option.");
  let discovery: DiscoveryInput | null = null,
    copy_follow_up: FollowUp | null = null;
  if (branch_mode === "CopyDiscovery") {
    if (r.discovery !== null && r.discovery !== undefined)
      invalid(
        "discovery",
        "Copy from the exact retained source; edit answers in a subsequent proposal.",
      );
    const f = object(r.copy_follow_up, ["owner_id", "reason"]);
    copy_follow_up = {
      owner_id: uuid(f.owner_id, "copy_follow_up.owner_id"),
      reason: narrative(f.reason, "copy_follow_up.reason", 1000),
    };
  } else {
    if (r.copy_follow_up !== undefined && r.copy_follow_up !== null)
      invalid("copy_follow_up", "Fresh scope does not inherit answers.");
    discovery = compileDiscovery(r.discovery).input;
  }
  return {
    kind,
    option_id: uuid(r.option_id, "option_id"),
    expected_version: version(r.expected_version),
    expected_revision_id: uuid(r.expected_revision_id, "expected_revision_id"),
    discovery,
    branch_mode,
    copy_follow_up,
  };
}
export function changeWorkspaceInput(id: string, value: unknown) {
  bounded(value);
  const r = object(value, [
    ...commonKeys,
    ...changeKeys,
    "revision_id",
    "new_option_id",
    "label",
    "context_hash",
    "comparison_hash",
    "confirmed_question_ids",
  ]);
  const proposal = discoveryChangeProposal(
    Object.fromEntries(changeKeys.map((k) => [k, r[k]])),
  );
  if (
    proposal.kind === "Save" &&
    ((r.new_option_id !== null && r.new_option_id !== undefined) ||
      (r.label !== null && r.label !== undefined))
  )
    invalid("new_option_id", "A scope successor retains its option identity.");
  return {
    ...common(r),
    ...proposal,
    id: uuid(id, "workspace_id"),
    revision_id: uuid(r.revision_id, "revision_id"),
    new_option_id:
      proposal.kind === "Branch"
        ? uuid(r.new_option_id, "new_option_id")
        : null,
    label: proposal.kind === "Branch" ? label(r.label, "label", 100) : null,
    context_hash: hash(r.context_hash, "context_hash"),
    comparison_hash: hash(r.comparison_hash, "comparison_hash"),
    confirmed_question_ids: confirmations(r.confirmed_question_ids),
  };
}
export function optionActionInput(id: string, value: unknown) {
  bounded(value);
  const r = object(value, [
    ...commonKeys,
    "action",
    "option_id",
    "expected_version",
    "expected_revision_id",
    "expected_selected_option_id",
  ]);
  return {
    ...common(r),
    id: uuid(id, "workspace_id"),
    action: choice(r.action, "action", [
      "Select",
      "Archive",
      "Reopen",
    ] as const),
    option_id: uuid(r.option_id, "option_id"),
    expected_version: version(r.expected_version),
    expected_revision_id: uuid(r.expected_revision_id, "expected_revision_id"),
    expected_selected_option_id: uuid(
      r.expected_selected_option_id,
      "expected_selected_option_id",
    ),
  };
}
