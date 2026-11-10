import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
  invalid,
} from "../shared/validation";
import { basis } from "./validation";
export function projectFinanceCommand(id: string | null, input: unknown) {
  const v = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "source_kind",
    "project_id",
    "basis_id",
    "completion_versions",
    "account_id",
    "mode",
    "definition_id",
    "definition_version",
    "policy_version",
    "treatment_basis",
  ]);
  if (v.source_kind !== "ProjectClaim")
    invalid("source_kind", "Use ProjectClaim.");
  if (id ? v.id !== undefined : v.expected_version !== undefined)
    invalid("id", "Use the existing route ID and version only for a revision.");
  if (
    !Array.isArray(v.completion_versions) ||
    !v.completion_versions.length ||
    v.completion_versions.length > 50
  )
    invalid("completion_versions", "Select 1–50 whole reached entitlements.");
  const versions = (v.completion_versions as unknown[])
    .map((x) => version(x))
    .sort((a, b) => a - b);
  if (new Set(versions).size !== versions.length)
    invalid("completion_versions", "Do not repeat completion evidence.");
  return {
    ...common(v),
    id: uuid(id ?? v.id, "id"),
    expected_version: id ? version(v.expected_version) : null,
    source_kind: "ProjectClaim" as const,
    project_id: uuid(v.project_id, "project_id"),
    basis_id: uuid(v.basis_id, "basis_id"),
    completion_versions: versions,
    account_id: uuid(v.account_id, "account_id"),
    mode: choice(v.mode, "mode", ["SyntheticManual", "SyntheticApi"] as const),
    definition_id: uuid(v.definition_id, "definition_id"),
    definition_version: version(v.definition_version),
    policy_version: version(v.policy_version),
    treatment_basis: basis(v.treatment_basis, "treatment_basis"),
  };
}
