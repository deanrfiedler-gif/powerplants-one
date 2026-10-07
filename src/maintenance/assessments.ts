import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import type { QueryClient } from "../platform/permissions";
import { visible } from "../shared/reads";
import {
  common,
  commonKeys,
  object,
  uuid,
  optionalId,
  invalid,
  version,
} from "../shared/validation";
import { assessmentFields, scopeIncludes } from "./model";
import {
  agreementRevision,
  bump,
  assetSnapshot,
  contextAuthority,
  event,
  expected,
  hash,
  history,
  insert,
  meta,
  owner,
  record,
  reference,
  conflict,
  type Assessment,
  type WarrantyCase,
} from "./context";

export async function assessmentContext(
  c: QueryClient,
  p: Principal,
  row: Pick<
    Assessment,
    | "company_id"
    | "site_id"
    | "customer_id"
    | "asset_id"
    | "facility_id"
    | "warranty_case_id"
    | "agreement_revision_id"
    | "event_date"
  >,
) {
  const asset = row.asset_id ? await assetSnapshot(c, p, row.asset_id) : null;
  if (asset && asset.site_id !== row.site_id)
    conflict(
      "The asset has moved. Review the original event context before a successor assessment.",
    );
  const agreement = row.agreement_revision_id
    ? await agreementRevision(c, p, row.agreement_revision_id)
    : null;
  if (
    agreement &&
    (agreement.row.company_id !== row.company_id ||
      agreement.row.customer_id !== row.customer_id)
  )
    invalid(
      "agreement_revision_id",
      "Use the exact agreement for this customer/company.",
    );
  if (row.facility_id) {
    const f = await visible(c, p, "Facility", row.facility_id);
    if (f.site_id !== row.site_id || f.company_id !== row.company_id)
      invalid("facility_id", "Choose the event's site context.");
    if (
      asset &&
      asset.facility_id !== row.facility_id &&
      !asset.served_facilities.some(
        (link) => link.facility_id === row.facility_id,
      )
    )
      invalid(
        "facility_id",
        "Use the equipment's physical facility or a current sourced served-area relationship.",
      );
  }
  let warranty = null;
  if (row.warranty_case_id) {
    const w = await record<WarrantyCase>(c, p, "cases", row.warranty_case_id);
    if (
      w.asset_id !== row.asset_id ||
      w.site_id !== row.site_id ||
      w.customer_id !== row.customer_id ||
      w.event_date !== row.event_date
    )
      invalid(
        "warranty_case_id",
        "Use the case's exact asset, customer, site and failure date.",
      );
    warranty = {
      id: w.id,
      evidence_revision: w.evidence_revision,
      source: w.source,
    };
  }
  return {
    asset,
    agreement: agreement
      ? {
          id: agreement.row.id,
          version: agreement.row.version,
          current_revision_id: agreement.row.current_revision_id,
          state: agreement.row.state,
          revision: agreement.revision,
        }
      : null,
    warranty,
    event_date: row.event_date,
    facility_id: row.facility_id,
  };
}
export async function currentAssessment(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  const a = await record<Assessment>(c, p, "coverage", id);
  await latestAssessment(c, p, a);
  const current = await assessmentContext(c, p, a);
  if (hash(current) !== a.context_hash)
    conflict(
      "New evidence, equipment or agreement context makes this assessment historical. Record a new assessment.",
    );
  return a;
}
export async function latestAssessment(
  c: QueryClient,
  p: Principal,
  a: Assessment,
) {
  const latest = (
    await c.query<{ id: string }>(
      `SELECT id FROM ppo.entitlement_assessments WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND customer_id=$4 AND asset_id IS NOT DISTINCT FROM $5::uuid AND event_date=$6 AND warranty_case_id IS NOT DISTINCT FROM $7::uuid AND facility_id IS NOT DISTINCT FROM $8::uuid ORDER BY created_at DESC,id DESC LIMIT 1`,
      [
        p.workspace_id,
        a.company_id,
        a.site_id,
        a.customer_id,
        a.asset_id,
        a.event_date,
        a.warranty_case_id,
        a.facility_id,
      ],
    )
  ).rows[0];
  if (latest?.id !== a.id)
    conflict(
      "A newer entitlement decision supersedes this assessment. Review the current decision.",
    );
}
export async function createAssessment(p: Principal, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "company_id",
    "site_id",
    "customer_id",
    "asset_id",
    "warranty_case_id",
    "expected_case_version",
    "assessment",
  ]);
  const warranty_case_id = optionalId(r.warranty_case_id, "warranty_case_id");
  const cmd = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    site_id: uuid(r.site_id, "site_id"),
    customer_id: uuid(r.customer_id, "customer_id"),
    asset_id: optionalId(r.asset_id, "asset_id"),
    warranty_case_id,
    expected_case_version: warranty_case_id
      ? version(r.expected_case_version)
      : null,
    ...assessmentFields(r.assessment),
  };
  return sharedOperation(
    p,
    cmd,
    "Maintenance:Assess",
    async (c) => {
      await contextAuthority(
        c,
        p,
        cmd.company_id,
        cmd.site_id,
        cmd.customer_id,
        warranty_case_id ? "warranty.assess" : "maintenance.assess",
      );
      await owner(
        c,
        p,
        cmd,
        cmd.owner_id,
        warranty_case_id ? "warranty.assess" : "maintenance.assess",
      );
      return assessmentContext(c, p, cmd);
    },
    async (c, context) => {
      if (warranty_case_id) {
        const w = await record<WarrantyCase>(c, p, "cases", warranty_case_id);
        expected(w.version, cmd.expected_case_version!);
        const review = (await history(c, p, w.id))
          .filter((e) => e.action === "ReviewEvidence")
          .at(-1);
        if (
          !review ||
          review.content.evidence_revision !== w.evidence_revision ||
          review.content.source_hash !== hash(w.source)
        )
          conflict(
            "Review the current evidence set before assessing warranty.",
          );
      }
      if (cmd.status === "Covered") {
        if (!context.asset || context.asset.identity_status !== "Verified")
          invalid(
            "status",
            "Covered needs a verified asset and a reasoned source assessment.",
          );
        if (context.agreement) {
          const a = context.agreement,
            x = a.revision.content;
          if (
            a.state !== "Active" ||
            a.current_revision_id !== a.revision.id ||
            x.source.availability !== "Available" ||
            cmd.event_date < x.effective_from ||
            cmd.event_date > x.effective_to ||
            !scopeIncludes(
              x,
              cmd.site_id,
              cmd.asset_id,
              cmd.facility_id ?? context.asset.facility_id,
            ) ||
            x.sites.some(
              (site) =>
                site.site_id === cmd.site_id &&
                context.asset!.facility_id &&
                site.excluded_facility_ids.includes(context.asset!.facility_id),
            )
          )
            invalid(
              "status",
              "The exact current source must include this asset/area/event. Retain Unknown or Disputed where the source is unresolved.",
            );
        } else if (
          !context.warranty ||
          context.warranty.source.availability !== "Available"
        )
          invalid(
            "status",
            "An exact available agreement or warranty source is required.",
          );
      }
      const {
        operation_id: _o,
        schema_version: _s,
        reason,
        expected_case_version: _v,
        ...fields
      } = cmd;
      void _o;
      void _s;
      void _v;
      const row = await insert<Assessment>(c, "entitlement_assessments", {
        ...meta(p),
        ...fields,
        reference: reference("ENT", cmd.id),
        context_hash: hash(context),
        context,
      });
      await event(
        c,
        p,
        row,
        "Assessed",
        {
          status: cmd.status,
          context_hash: row.context_hash,
          finance_review_required: true,
        },
        reason,
      );
      if (warranty_case_id) {
        const w = await record<WarrantyCase>(c, p, "cases", warranty_case_id);
        await bump(
          c,
          p,
          "cases",
          w,
          "EntitlementAssessed",
          { assessment_id: row.id, status: row.status },
          reason,
          { state: "Open" },
        );
      }
      return { ...row, state: row.status };
    },
    "EntitlementAssessment",
    "MaintenanceChanged",
  );
}
