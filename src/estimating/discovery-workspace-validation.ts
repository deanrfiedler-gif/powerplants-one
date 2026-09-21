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
export type ConfigurationConfirmation = { fact_id: string; fingerprint: string };
function extendedConfirmations(value: unknown): ConfigurationConfirmation[] {
  if (!Array.isArray(value) || value.length > 260) invalid("configuration_confirmations", "Use a bounded list of exact configuration acknowledgments.");
  const result = value.map(v => { const r = object(v, ["fact_id", "fingerprint"]); return { fact_id: uuid(r.fact_id, "fact_id"), fingerprint: hash(r.fingerprint, "fingerprint") }; }).sort((a, b) => a.fact_id.localeCompare(b.fact_id));
  if (new Set(result.map(r => r.fact_id)).size !== result.length) invalid("configuration_confirmations", "Confirm each entity once.");
  return result;
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
    "configuration_confirmations",
    "option_label",
  ]);
  return {
    ...common(r),
    ...discoveryCreateProposal({
      opportunity_id: r.opportunity_id,
      discovery: r.discovery,
    }),
    id: uuid(r.id, "id"),
    option_id: uuid(r.option_id, "option_id"),
    ...(Object.hasOwn(r, "option_label") ? { option_label: label(r.option_label, "option_label", 100) } : {}),
    revision_id: uuid(r.revision_id, "revision_id"),
    expected_opportunity_version: version(r.expected_opportunity_version),
    context_hash: hash(r.context_hash, "context_hash"),
    confirmed_question_ids: confirmations(r.confirmed_question_ids),
    ...(Object.hasOwn(r, "configuration_confirmations") ? { configuration_confirmations: extendedConfirmations(r.configuration_confirmations) } : {}),
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
  "copy_allocation_id",
  "historical_source_id",
];
export type DiscoveryChange = {
  kind: "Save" | "Branch";
  option_id: string;
  expected_version: number;
  expected_revision_id: string;
  discovery: DiscoveryInput | null;
  branch_mode: "Fresh" | "CopyDiscovery" | null;
  copy_follow_up: FollowUp | null;
  copy_allocation_id?: string;
  historical_source_id?: string;
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
  if (r.copy_allocation_id !== undefined && branch_mode !== "CopyDiscovery") invalid("copy_allocation_id", "Allocation applies only to exact-source copying.");
  if (r.historical_source_id !== undefined && kind !== "Save") invalid("historical_source_id", "A historical starting point creates a successor of the current alternative.");
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
    ...(r.copy_allocation_id === undefined ? {} : { copy_allocation_id: uuid(r.copy_allocation_id, "copy_allocation_id") }),
    ...(r.historical_source_id === undefined ? {} : { historical_source_id: uuid(r.historical_source_id, "historical_source_id") }),
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
    "configuration_confirmations",
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
    ...(Object.hasOwn(r, "configuration_confirmations") ? { configuration_confirmations: extendedConfirmations(r.configuration_confirmations) } : {}),
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
