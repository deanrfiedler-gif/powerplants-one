import { crmBase } from "./crm";
import {
  plannedFixture,
  conversion,
  receiving,
  type ConversionDetail,
} from "./quotation-conversion";
import {
  executeConversion,
  receiveQuotation,
} from "../../src/estimating/conversion/service";
import { readConversion } from "../../src/estimating/conversion/reads";
export type Target = ConversionDetail["dispositions"][number];
export const dispositionCommand = (t: Target) => ({
  ...crmBase(),
  synthetic_only: true,
  target_id: t.target_id,
  execution_id: t.basis.execution_id,
  expected_sequence: t.sequence,
  evidence: "SYN exact completed source and downstream evidence reviewed",
});
export const dispositionReview = (
  t: Target,
  decision = "Retain",
  quantity: string | null = null,
) => ({
  ...dispositionCommand(t),
  predecessor_id: t.review?.id ?? null,
  basis_hash: t.basis_hash,
  decision,
  quantity,
  owner_id: t.basis.target.owner_id,
  due_date: "2026-10-12",
  next_action:
    "SYN review operational follow-up with Supply owner; no work authority",
});
export const dispositionApply = (t: Target) => ({
  ...dispositionCommand(t),
  review_id: t.review!.id,
  review_hash: t.review!.review_hash,
});
export function nativeRevision(t: Target, changes: object = {}) {
  const r = t.basis.target;
  return {
    ...crmBase(),
    id: r.id,
    expected_version: r.version,
    kind: r.kind,
    company_id: r.company_id,
    site_id: r.site_id,
    reference: r.reference,
    title: r.title,
    item: r.item,
    unit: r.unit,
    quantity: r.quantity,
    owner_id: r.owner_id,
    next_action: r.next_action,
    completeness: r.completeness,
    observed_at: new Date(r.observed_at).toISOString(),
    source_reference: r.source_reference,
    external_key: r.external_key,
    data: r.data,
    ...changes,
  };
}
export async function completedFixture(extra = 0, change = true) {
  const f = await plannedFixture(extra),
    originalCommand = conversion(f.d),
    original = await executeConversion(f.owner, f.id, originalCommand);
  let d = await readConversion(f.owner, f.id);
  if (change) {
    await receiveQuotation(f.owner, f.id, {
      ...receiving(d, f.owner.actor_id),
      decision: "Held",
      reason: "SYN corrected receiving evidence after completed conversion",
    });
    d = await readConversion(f.owner, f.id);
  }
  return { ...f, d, originalCommand, original };
}
