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
export function agreementFinanceCommand(id: string | null, input: unknown) {
  const v = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "source_kind",
    "agreement_id",
    "agreement_revision_id",
    "charge_ids",
    "account_id",
    "mode",
    "definition_id",
    "definition_version",
    "policy_version",
    "treatment_basis",
  ]);
  if (v.source_kind !== "AgreementCharge")
    invalid("source_kind", "Use AgreementCharge.");
  if (id ? v.id !== undefined : v.expected_version !== undefined)
    invalid("id", "Use the existing route ID and version only for a revision.");
  if (
    !Array.isArray(v.charge_ids) ||
    !v.charge_ids.length ||
    v.charge_ids.length > 50
  )
    invalid("charge_ids", "Select 1–50 whole scheduled charges.");
  const versions = (v.charge_ids as unknown[])
    .map((x) => uuid(x, "charge_id"))
    .sort();
  if (new Set(versions).size !== versions.length)
    invalid("charge_ids", "Do not repeat completion evidence.");
  return {
    ...common(v),
    id: uuid(id ?? v.id, "id"),
    expected_version: id ? version(v.expected_version) : null,
    source_kind: "AgreementCharge" as const,
    agreement_id: uuid(v.agreement_id, "agreement_id"),
    agreement_revision_id: uuid(
      v.agreement_revision_id,
      "agreement_revision_id",
    ),
    charge_ids: versions,
    account_id: uuid(v.account_id, "account_id"),
    mode: choice(v.mode, "mode", ["SyntheticManual", "SyntheticApi"] as const),
    definition_id: uuid(v.definition_id, "definition_id"),
    definition_version: version(v.definition_version),
    policy_version: version(v.policy_version),
    treatment_basis: basis(v.treatment_basis, "treatment_basis"),
  };
}
