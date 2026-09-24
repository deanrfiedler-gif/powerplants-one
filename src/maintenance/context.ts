import { createHash, randomUUID } from "node:crypto";
import type { QueryResultRow } from "pg";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { canonical } from "../platform/operations";
import {
  hasPermission,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { companyContext, scopedOwner } from "../shared/authority";
import { visible } from "../shared/reads";
import { uuid, invalid } from "../shared/validation";
import type { AgreementContent, PlanContent, CoverageState } from "./model";

export const families = {
  agreements: {
    table: "service_agreements",
    type: "ServiceAgreement",
    read: "maintenance.read",
    edit: "maintenance.manage",
  },
  coverage: {
    table: "entitlement_assessments",
    type: "EntitlementAssessment",
    read: "maintenance.read",
    edit: "maintenance.assess",
  },
  plans: {
    table: "maintenance_plans",
    type: "MaintenancePlan",
    read: "maintenance.read",
    edit: "maintenance.manage",
  },
  due: {
    table: "maintenance_occurrences",
    type: "MaintenanceOccurrence",
    read: "maintenance.read",
    edit: "maintenance.manage",
  },
  renewals: {
    table: "renewal_reviews",
    type: "RenewalReview",
    read: "maintenance.read",
    edit: "maintenance.manage",
  },
  cases: {
    table: "warranty_cases",
    type: "WarrantyCase",
    read: "warranty.read",
    edit: "warranty.manage",
  },
  recovery: {
    table: "supplier_claims",
    type: "SupplierClaim",
    read: "warranty.read",
    edit: "warranty.recovery",
  },
} as const;
export type Family = keyof typeof families;
export type Base = {
  id: string;
  workspace_id: string;
  company_id: string;
  site_id: string | null;
  customer_id: string;
  owner_id: string;
  reference: string;
  version: number;
  state: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
};
export type Agreement = Base & {
  current_revision_id: string;
  revision: number;
};
export type Revision<T> = {
  id: string;
  revision: number;
  predecessor_id: string | null;
  content: T;
  content_hash: string;
  created_by: string;
  created_at: Date;
  reason: string;
};
export type AgreementRevision = Revision<AgreementContent> & {
  agreement_id: string;
};
export type Plan = Base & {
  asset_id: string;
  asset_version: number;
  current_revision_id: string;
  revision: number;
};
export type PlanRevision = Revision<PlanContent> & {
  plan_id: string;
  agreement_revision_id: string;
  effective_from: string;
};
export type Occurrence = Base & {
  asset_id: string;
  plan_id: string;
  plan_revision_id: string;
  original_due: string;
  target_date: string;
  timezone: string;
  asset_snapshot: AssetSnapshot;
};
export type WarrantyCase = Base & {
  asset_id: string;
  event_date: string;
  symptoms: string;
  evidence_revision: number;
  next_review: string | null;
  next_action: string;
  source: ReturnType<typeof import("./model").sourceFields>;
  asset_snapshot: AssetSnapshot;
};
export type Assessment = Base & {
  asset_id: string | null;
  facility_id: string | null;
  warranty_case_id: string | null;
  agreement_revision_id: string | null;
  event_date: string;
  status: CoverageState;
  basis: string;
  cause: string;
  review_due: string | null;
  next_action: string;
  context_hash: string;
  context: Record<string, unknown>;
};
export type Renewal = Base & {
  agreement_id: string;
  agreement_revision_id: string;
  revision: number;
  review_from: string;
  next_date: string;
  next_action: string;
  proposal: string | null;
  customer_response: string | null;
  crm_activity_id: string | null;
  service_activity_id: string | null;
};
export type Claim = Base & {
  case_id: string;
  supplier_id: string;
  scope: string;
  package: Record<string, unknown>;
  package_hash: string;
  claimed_minor: string;
  approved_minor: string;
  credited_minor: string;
  unrecovered_minor: string;
  currency: string;
  tax_basis: string;
  due_date: string;
};
export type AssetSnapshot = {
  id: string;
  version: number;
  site_id: string;
  facility_id: string | null;
  serial: string | null;
  description: string;
  identity_status: string;
  lifecycle_status: string;
  installed_on: string | null;
  commissioned_on: string | null;
  warranty_start: string | null;
  warranty_end: string | null;
  predecessor_asset_id: string | null;
  served_facilities: { id: string; facility_id: string; source_id: string }[];
};
export type Event = {
  id: string;
  record_id: string;
  version: number;
  action: string;
  content: Record<string, unknown>;
  reason: string;
  created_by: string;
  created_at: Date;
};
export type Resolution = {
  id: string;
  case_id: string;
  revision: number;
  predecessor_id: string | null;
  assessment_id: string;
  remedy: string;
  scope: string;
  access_review: string;
  target_date: string;
  owner_id: string;
  context_hash: string;
  content_hash: string;
};
export type WorkRequest = {
  id: string;
  occurrence_id: string | null;
  resolution_plan_id: string | null;
  ticket_id: string;
  assessment_id: string;
  content: {
    tasks: {
      id: string;
      description: string;
      expected_outcome: string;
      completion_requirements: string;
      kind: string;
    }[];
    target_date: string;
    source_id: string;
    source_revision_id: string;
    asset: AssetSnapshot;
  };
  content_hash: string;
};
export const hash = (v: unknown) =>
  createHash("sha256")
    .update(canonical(JSON.parse(JSON.stringify(v))))
    .digest("hex");
export function expected(actual: number, observed: number) {
  if (actual !== observed)
    throw new AppError(
      409,
      "VersionConflict",
      "This record changed. Keep your draft and compare the saved version before trying a new operation.",
    );
}
export const conflict = (message: string): never => {
  throw new AppError(409, "SourceReviewRequired", message);
};
// PostgreSQL date-only values use the host-local Date parser. Preserve the
// stored calendar date; UTC conversion would shift Australian dates backwards.
export function calendarDates<T>(row: T): T {
  if (!row) return row;
  for (const key of [
    "effective_from",
    "effective_to",
    "event_date",
    "next_review",
    "review_due",
    "original_due",
    "target_date",
    "review_from",
    "next_date",
    "due_date",
    "source_date",
    "installed_on",
    "commissioned_on",
    "warranty_start",
    "warranty_end",
  ]) {
    const values = row as Record<string, unknown>,
      v = values[key];
    if (v instanceof Date)
      values[key] =
        `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  }
  return row;
}
export async function insert<T extends QueryResultRow = Base>(
  c: QueryClient,
  table: string,
  fields: Record<string, unknown>,
): Promise<T> {
  const entries = Object.entries(fields);
  return calendarDates(
    (
      await c.query<T>(
        `INSERT INTO ppo.${table}(${entries.map(([k]) => k).join(",")}) VALUES(${entries.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
        entries.map(([, v]) => v),
      )
    ).rows[0],
  );
}
export const meta = (p: Principal) => ({
  workspace_id: p.workspace_id,
  created_by: p.actor_id,
  updated_by: p.actor_id,
});
export const reference = (kind: string, id: string) =>
  `SYN-PPO-${kind}-${id.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
export async function event(
  c: QueryClient,
  p: Principal,
  row: Base,
  action: string,
  content: Record<string, unknown>,
  reason: string,
) {
  return insert<Event>(c, "maintenance_events", {
    id: randomUUID(),
    workspace_id: p.workspace_id,
    record_id: row.id,
    version: row.version,
    action,
    content,
    reason,
    created_by: p.actor_id,
  });
}
export async function bump<T extends Base>(
  c: QueryClient,
  p: Principal,
  family: Family,
  row: T,
  action: string,
  content: Record<string, unknown>,
  reason: string,
  changes: Record<string, unknown> = {},
): Promise<T> {
  const entries = Object.entries(changes);
  const saved = (
    await c.query<T>(
      `UPDATE ppo.${families[family].table} SET version=version+1,updated_at=clock_timestamp(),updated_by=$3${entries.map(([k], i) => `,${k}=$${i + 4}`).join("")} WHERE workspace_id=$1 AND id=$2 RETURNING *`,
      [p.workspace_id, row.id, p.actor_id, ...entries.map(([, v]) => v)],
    )
  ).rows[0];
  calendarDates(saved);
  await event(c, p, saved, action, content, reason);
  return saved;
}
export async function history(c: QueryClient, p: Principal, id: string) {
  return (
    await c.query<Event>(
      "SELECT * FROM ppo.maintenance_events WHERE workspace_id=$1 AND record_id=$2 ORDER BY version",
      [p.workspace_id, id],
    )
  ).rows;
}
export async function assetSnapshot(
  c: QueryClient,
  p: Principal,
  id: string,
): Promise<AssetSnapshot> {
  const a = calendarDates(await visible(c, p, "Asset", id));
  const served = (
    await c.query<{ id: string; facility_id: string; source_id: string }>(
      "SELECT id,facility_id,source_id FROM ppo.asset_served_facilities WHERE workspace_id=$1 AND asset_id=$2 AND ended_at IS NULL ORDER BY id",
      [p.workspace_id, id],
    )
  ).rows;
  for (const link of served) await visible(c, p, "Facility", link.facility_id);
  return {
    ...Object.fromEntries(
      [
        "id",
        "version",
        "site_id",
        "facility_id",
        "serial",
        "description",
        "identity_status",
        "lifecycle_status",
        "installed_on",
        "commissioned_on",
        "warranty_start",
        "warranty_end",
        "predecessor_asset_id",
      ].map((k) => [k, a[k]]),
    ),
    served_facilities: served,
  } as AssetSnapshot;
}
export async function contextAuthority(
  c: QueryClient,
  p: Principal,
  company: string,
  site: string | null,
  customer: string,
  cap: Capability,
) {
  await companyContext(c, p, company, site, cap);
  const customerRow = await visible(c, p, "Organisation", customer);
  if (customerRow.company_id !== company) throw unavailable();
  if (
    site &&
    !(
      await c.query(
        "SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND site_id=$2 AND organisation_id=$3 AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp())",
        [p.workspace_id, site, customer],
      )
    ).rowCount
  )
    invalid(
      "customer_id",
      "Choose the customer explicitly related to this site.",
    );
}
export async function sourceAccess(
  c: QueryClient,
  p: Principal,
  company: string,
  site: string | null,
  access: string,
) {
  if (access === "RestrictedFinance")
    await companyContext(c, p, company, site, "shared.finance.read");
  if (access === "Internal")
    await companyContext(c, p, company, site, "shared.internal.read");
}
export async function agreementRevision(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Capability = "maintenance.read",
): Promise<{ row: Agreement; revision: AgreementRevision }> {
  const r = (
    await c.query<AgreementRevision>(
      "SELECT * FROM ppo.agreement_revisions WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "agreement_revision_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  const row = (
    await c.query<Agreement>(
      "SELECT * FROM ppo.service_agreements WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, r.agreement_id],
    )
  ).rows[0];
  for (const s of r.content.sites) {
    await companyContext(c, p, row.company_id, s.site_id, cap);
    await companyContext(c, p, row.company_id, s.site_id, "maintenance.read");
    await sourceAccess(
      c,
      p,
      row.company_id,
      s.site_id,
      r.content.source.access_class,
    );
    for (const id of [...s.asset_ids, ...s.excluded_asset_ids])
      await visible(c, p, "Asset", id);
    for (const id of [...s.facility_ids, ...s.excluded_facility_ids])
      await visible(c, p, "Facility", id);
  }
  await visible(c, p, "Organisation", row.customer_id);
  return { row, revision: r };
}
export async function record<T extends Base = Base>(
  c: QueryClient,
  p: Principal,
  family: Family,
  id: string,
  cap?: Capability,
): Promise<T> {
  const row = (
    await c.query<T>(
      `SELECT * FROM ppo.${families[family].table} WHERE workspace_id=$1 AND id=$2`,
      [p.workspace_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  calendarDates(row);
  if (family === "agreements") {
    const revisions = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.agreement_revisions WHERE workspace_id=$1 AND agreement_id=$2",
        [p.workspace_id, id],
      )
    ).rows;
    for (const r of revisions) await agreementRevision(c, p, r.id, cap);
  } else {
    await companyContext(
      c,
      p,
      row.company_id,
      row.site_id,
      family === "coverage" && (row as unknown as Assessment).warranty_case_id
        ? "warranty.read"
        : families[family].read,
    );
    if (cap) await companyContext(c, p, row.company_id, row.site_id, cap);
    await visible(c, p, "Organisation", row.customer_id);
  }
  const asset = (row as T & { asset_id?: string }).asset_id;
  if (asset) await visible(c, p, "Asset", asset);
  if (family === "coverage") {
    const a = row as unknown as Assessment;
    if (a.agreement_revision_id)
      await agreementRevision(c, p, a.agreement_revision_id);
    if (a.warranty_case_id) await record(c, p, "cases", a.warranty_case_id);
  }
  if (family === "plans") {
    const revisions = (
      await c.query<PlanRevision>(
        "SELECT * FROM ppo.maintenance_plan_revisions WHERE workspace_id=$1 AND plan_id=$2",
        [p.workspace_id, id],
      )
    ).rows;
    for (const rev of revisions) {
      await agreementRevision(c, p, rev.agreement_revision_id);
      await sourceAccess(
        c,
        p,
        row.company_id,
        row.site_id,
        rev.content.interval_source.access_class,
      );
    }
  }
  if (family === "due") {
    const occurrence = row as unknown as Occurrence;
    await record(c, p, "plans", occurrence.plan_id);
  }
  if (family === "renewals")
    await agreementRevision(
      c,
      p,
      (row as unknown as Renewal).agreement_revision_id,
    );
  if (family === "cases") {
    const w = row as unknown as WarrantyCase;
    await sourceAccess(
      c,
      p,
      row.company_id,
      row.site_id,
      w.source.access_class,
    );
    for (const e of await history(c, p, id))
      for (const key of ["source", "predecessor"]) {
        const source = e.content[key] as { access_class?: string } | undefined;
        if (source?.access_class)
          await sourceAccess(
            c,
            p,
            row.company_id,
            row.site_id,
            source.access_class,
          );
      }
    const evidence = (
      await c.query<{ source: { access_class: string } }>(
        "SELECT source FROM ppo.warranty_evidence WHERE workspace_id=$1 AND case_id=$2",
        [p.workspace_id, id],
      )
    ).rows;
    for (const e of evidence)
      await sourceAccess(
        c,
        p,
        row.company_id,
        row.site_id,
        e.source.access_class,
      );
  }
  if (family === "recovery") {
    const claim = row as unknown as Claim;
    await record(c, p, "cases", claim.case_id);
    await visible(c, p, "Organisation", claim.supplier_id);
    const assessment = claim.package.assessment as { id: string };
    await record(c, p, "coverage", assessment.id);
  }
  return row;
}
export async function owner(
  c: QueryClient,
  p: Principal,
  row: Pick<Base, "company_id" | "site_id">,
  id: string,
  cap: Capability,
) {
  return scopedOwner(c, p, id, row.company_id, row.site_id ?? undefined, cap);
}
export async function can(
  c: QueryClient,
  p: Principal,
  row: Base,
  cap: Capability,
) {
  if ("current_revision_id" in row && !("asset_id" in row)) {
    const sites = (
      await c.query<{ site_id: string }>(
        "SELECT DISTINCT site_id FROM ppo.agreement_scope WHERE workspace_id=$1 AND revision_id=$2",
        [p.workspace_id, row.current_revision_id],
      )
    ).rows;
    for (const s of sites)
      if (!(await hasPermission(c, p, cap, row.company_id, s.site_id)))
        return false;
    return sites.length > 0;
  }
  return hasPermission(c, p, cap, row.company_id, row.site_id ?? undefined);
}
