import { randomUUID } from "node:crypto";
import { createSession, type Principal } from "../../src/platform/identity";
import { database } from "../../src/platform/database";
import {
  createAgreement,
  agreementCommand,
} from "../../src/maintenance/agreements";
import { createPlan, planCommand } from "../../src/maintenance/plans";
import { createCase, warrantyCommand } from "../../src/maintenance/warranty";
import { createAssessment } from "../../src/maintenance/assessments";
import { workspace } from "../../src/maintenance/reads";
import { CRM, crmBase } from "./crm";
export { CRM };
export const base = crmBase;
export const asset = "80000000-0000-4000-8000-000000000001";
export const financeOwner = "30000000-0000-4000-8000-000000000012";
export const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
export const rows = async (sql: string, args: unknown[] = []) =>
  (await database().query(sql, args)).rows;
export const source = () => ({
  reference: "SYN-MA-SOURCE",
  revision: "1",
  availability: "Available",
  source_date: "2026-01-01",
  content:
    "Synthetic exact source for verification only; no business contract or interval policy.",
  access_class: "RestrictedService",
});
export const agreementContent = () => ({
  title: "SYN maintenance agreement",
  effective_from: "2026-01-01",
  effective_to: "2028-12-31",
  service_scope: "Synthetic visual observations",
  exclusions: "No invasive intervention",
  response_terms: null,
  charging_basis: "Separate Finance review; no invoice implied",
  billing_owner_id: financeOwner,
  responsibilities: "Owned synthetic Service review",
  source: source(),
  sites: [
    {
      site_id: CRM.site,
      mode: "WholeSite",
      facility_ids: [],
      asset_ids: [asset],
      excluded_facility_ids: [],
      excluded_asset_ids: [],
    },
  ],
});
export const planContent = (agreement_revision_id: string) => ({
  title: "SYN month-end plan",
  agreement_revision_id,
  task_set_reference: "SYN-TASKS",
  task_set_revision: "1",
  interval: "Monthly",
  interval_source: source(),
  anchor: "2026-01-31",
  timezone: "Australia/Sydney",
  window_months: 6,
  tolerance: null,
  effective_from: "2026-01-01",
  tasks: [
    {
      id: randomUUID(),
      description: "SYN exact visual observation",
      expected_outcome: "Retain observed condition",
      completion_requirements: "Reviewed task outcome with factual evidence",
      kind: "Inspection",
    },
  ],
});
export async function agreement(
  p = undefined as Principal | undefined,
  assetId = asset,
) {
  p ??= await principal();
  const id = randomUUID(),
    content = agreementContent();
  content.sites[0].asset_ids = [assetId];
  const cmd = {
    ...base(),
    id,
    company_id: CRM.company,
    customer_id: CRM.org,
    owner_id: CRM.owner,
    content,
  };
  const receipt = await createAgreement(p, cmd);
  await agreementCommand(await principal("finance-reviewer"), id, {
    ...base(),
    expected_version: receipt.receipt.record_version,
    action: "Approve",
    authority_reference: "SYN separate commercial approval",
  });
  const detail = await workspace(p, "agreements", id);
  return {
    p,
    id,
    cmd,
    content,
    detail,
    revision: (
      detail.row as typeof detail.row & { current_revision_id: string }
    ).current_revision_id,
  };
}
export async function plan(assetId = asset) {
  const a = await agreement(undefined, assetId),
    id = randomUUID(),
    content = planContent(a.revision);
  await createPlan(a.p, {
    ...base(),
    id,
    company_id: CRM.company,
    site_id: CRM.site,
    customer_id: CRM.org,
    owner_id: CRM.owner,
    asset_id: assetId,
    content,
  });
  await planCommand(a.p, id, {
    ...base(),
    expected_version: 1,
    action: "Review",
  });
  return { ...a, agreement_id: a.id, id, content };
}
export async function assessment(
  p: Principal,
  agreement_revision_id: string | null,
  event_date = "2026-01-31",
  warranty_case_id: string | null = null,
  expected_case_version?: number,
  status = "Covered",
  assetId = asset,
) {
  const id = randomUUID();
  await createAssessment(p, {
    ...base(),
    id,
    company_id: CRM.company,
    site_id: CRM.site,
    customer_id: CRM.org,
    asset_id: assetId,
    warranty_case_id,
    expected_case_version,
    assessment: {
      status,
      basis: "SYN explicit source and event review",
      cause: "Cause separately assessed; synthetic observation only",
      owner_id: CRM.owner,
      review_due: "2026-10-01",
      next_action: "Owned source review",
      event_date,
      agreement_revision_id,
      facility_id: null,
    },
  });
  return id;
}
export async function warranty(assetId = asset) {
  const p = await principal(),
    id = randomUUID();
  await createCase(p, {
    ...base(),
    id,
    company_id: CRM.company,
    site_id: CRM.site,
    customer_id: CRM.org,
    owner_id: CRM.owner,
    asset_id: assetId,
    event_date: "2026-09-01",
    symptoms: "SYN intermittent indication",
    source: source(),
    next_review: "2026-10-01",
    next_action: "Review exact failure evidence",
  });
  await warrantyCommand(p, id, {
    ...base(),
    expected_version: 1,
    action: "ReviewEvidence",
    data: { basis: "SYN evidence set reviewed" },
  });
  const entitlement = await assessment(
    p,
    null,
    "2026-09-01",
    id,
    2,
    "Covered",
    assetId,
  );
  return { p, id, entitlement, version: 3 };
}
