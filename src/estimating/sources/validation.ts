import {
  choice,
  common,
  commonKeys,
  dateOnly,
  invalid,
  label,
  narrative,
  object,
  optionalText,
  uuid,
  version,
} from "../../shared/validation";
import { amount } from "../validation";
import { scaled } from "../math";

export function sourceContent(value: unknown) {
  const r = object(value, [
    "title",
    "supplier_label",
    "supplier_entity_key",
    "item_reference",
    "unit",
    "currency",
    "tax_basis",
    "data_mode",
    "source_date",
    "effective_from",
    "valid_until",
    "evidence_reference",
    "evidence_excerpt",
    "tiers",
  ]);
  const effective_from = dateOnly(r.effective_from, "effective_from");
  const valid_until =
    r.valid_until === null ? null : dateOnly(r.valid_until, "valid_until");
  if (valid_until && valid_until < effective_from)
    invalid("valid_until", "Validity cannot end before the effective date.");
  if (!Array.isArray(r.tiers) || !r.tiers.length || r.tiers.length > 20)
    invalid("tiers", "Record between one and twenty explicit quantity tiers.");
  let previous = 0n;
  const tiers = r.tiers.map((value, i) => {
    const tier = object(value, ["minimum_quantity", "unit_cost"]);
    const minimum_quantity = amount(
      tier.minimum_quantity,
      `tiers.${i}.minimum_quantity`,
      true,
    );
    const n = scaled(minimum_quantity, 3);
    if (n <= previous)
      invalid(
        "tiers",
        "Tier minimum quantities must be unique and strictly increasing.",
      );
    previous = n;
    return {
      minimum_quantity,
      unit_cost: amount(tier.unit_cost, `tiers.${i}.unit_cost`),
    };
  });
  return {
    title: label(r.title, "title", 200),
    supplier_label: label(r.supplier_label, "supplier_label", 200),
    supplier_entity_key: optionalText(
      r.supplier_entity_key,
      "supplier_entity_key",
    ),
    item_reference: label(r.item_reference, "item_reference", 200),
    unit: label(r.unit, "unit", 40),
    currency: choice(r.currency, "currency", ["AUD"] as const),
    tax_basis: choice(r.tax_basis, "tax_basis", ["ExcludingTax"] as const),
    data_mode: choice(r.data_mode, "data_mode", ["Synthetic"] as const),
    source_date: dateOnly(r.source_date, "source_date"),
    effective_from,
    valid_until,
    evidence_reference: label(r.evidence_reference, "evidence_reference", 300),
    evidence_excerpt: narrative(r.evidence_excerpt, "evidence_excerpt", 6000),
    tiers,
  };
}
export type SourceContent = ReturnType<typeof sourceContent>;

export function sourceCreate(value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "id",
    "company_id",
    "reference",
    "content",
  ]);
  const reference = label(r.reference, "reference", 100);
  if (!/^SYN-[A-Za-z0-9-]+$/.test(reference))
    invalid(
      "reference",
      "Use an explicit local synthetic reference beginning SYN-.",
    );
  return {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    reference,
    content: sourceContent(r.content),
  };
}
export function sourceRevise(id: string, value: unknown) {
  const r = object(value, [...commonKeys, "expected_version", "content"]);
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    content: sourceContent(r.content),
  };
}
export function sourceDecision(id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "action",
  ]);
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    action: choice(r.action, "action", [
      "Submit",
      "Reviewed",
      "Returned",
      "Rejected",
    ] as const),
  };
}
export function refreshProposal(value: unknown) {
  const r = object(value, [
    "estimate_version_id",
    "pricing_date",
    "selections",
  ]);
  if (
    !Array.isArray(r.selections) ||
    !r.selections.length ||
    r.selections.length > 100
  )
    invalid(
      "selections",
      "Select between one and one hundred exact estimate lines.",
    );
  const selections = r.selections.map((value) => {
    const row = object(value, [
      "line_id",
      "source_id",
      "revision_id",
      "expected_source_version",
    ]);
    return {
      line_id: uuid(row.line_id, "line_id"),
      source_id: uuid(row.source_id, "source_id"),
      revision_id: uuid(row.revision_id, "revision_id"),
      expected_source_version: version(row.expected_source_version),
    };
  });
  if (new Set(selections.map((s) => s.line_id)).size !== selections.length)
    invalid("selections", "Each estimate line may be selected only once.");
  selections.sort((a, b) => a.line_id.localeCompare(b.line_id));
  return {
    estimate_version_id: uuid(r.estimate_version_id, "estimate_version_id"),
    pricing_date: dateOnly(r.pricing_date, "pricing_date"),
    selections,
  };
}
export function refreshCommand(id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "proposal",
    "comparison_hash",
    "reviewed",
  ]);
  if (r.reviewed !== true)
    invalid(
      "reviewed",
      "Review the exact line differences and validity warnings before saving a successor.",
    );
  const comparison_hash = label(r.comparison_hash, "comparison_hash", 64);
  if (!/^[a-f0-9]{64}$/.test(comparison_hash))
    invalid("comparison_hash", "Use the exact server comparison.");
  return {
    ...common(r),
    id: uuid(id, "estimate_id"),
    expected_version: version(r.expected_version),
    proposal: refreshProposal(r.proposal),
    comparison_hash,
    reviewed: true,
  };
}
