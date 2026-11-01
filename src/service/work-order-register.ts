import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import { requireCapability, type QueryClient } from "../platform/permissions";
import { companyContext } from "../shared/authority";
import { visible, visibility } from "../shared/reads";
import { uuid } from "../shared/validation";
import {
  blockers,
  orderVisibility,
  scopeDetail,
  visibleWorkOrder,
} from "./work-orders";
import {
  authorisationState,
  inWorkOrderView,
  visitScopeReviewRequired,
  workOrderViews,
  workOrderRecordQuery,
  workOrderRegisterQuery,
} from "./work-order-register-model";

const sorts = {
  reference_desc: "w.display_number DESC,w.id",
  updated_desc: "w.updated_at DESC,w.id",
  updated_asc: "w.updated_at,w.id",
  reference_asc: "w.display_number,w.id",
} as const;

async function beginRead(c: QueryClient, p: Principal) {
  // Same serialization boundary as native commands; no business writes.
  await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
    p.workspace_id,
  ]);
  await requireCapability(c, p, "service.work_order.read");
  await requireCapability(c, p, "shared.read");
  return (await c.query<{ now: Date }>("SELECT clock_timestamp() now")).rows[0]
    .now;
}

async function projection(c: QueryClient, p: Principal, id: string) {
  const w = await visibleWorkOrder(c, p, id);
  const current = w.scope_revision_id
    ? await scopeDetail(c, p, w, w.scope_revision_id)
    : null;
  const issues = current?.approved_at ? [] : await blockers(c, p, w, current);
  const site = await visible(c, p, "Site", w.site_id);
  const customer = await visible(c, p, "Organisation", w.customer_id);
  const owner = (
    await c.query(
      "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, w.service_owner_id],
    )
  ).rows[0];
  const linked = (
    await c.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM ppo.work_order_tickets WHERE workspace_id=$1 AND work_order_id=$2",
      [p.workspace_id, w.id],
    )
  ).rows[0].count;
  const visit = (
    await c.query<{
      id: string;
      display_number: string;
      version: number;
      status: string;
      start_at: Date;
      end_at: Date;
      site_timezone: string;
      scope_revision_id: string;
      scope_version: number;
      revision_version: number;
    }>(
      `SELECT a.id,a.display_number,a.version,a.status,a.start_at,a.end_at,a.site_timezone,
    a.scope_revision_id,a.scope_version,r.version AS revision_version
    FROM ppo.appointments a JOIN ppo.scope_revisions r ON (r.workspace_id,r.id)=(a.workspace_id,a.scope_revision_id)
    WHERE a.workspace_id=$1 AND a.work_order_id=$2 AND a.status IN ('Proposed','Confirmed','InProgress')
    ORDER BY a.start_at,a.id LIMIT 1`,
      [p.workspace_id, w.id],
    )
  ).rows[0];
  const row = {
    id: w.id,
    display_number: w.display_number,
    version: w.version,
    status: w.status,
    company_id: w.company_id,
    customer_id: w.customer_id,
    customer_name: customer.display_name as string,
    site_id: w.site_id,
    site_name: site.display_name as string,
    site_timezone: site.timezone as string,
    service_owner_id: w.service_owner_id,
    owner_name: (owner?.display_name ?? null) as string | null,
    scope_revision_id: w.scope_revision_id,
    authorised_scope_revision_id: w.authorised_scope_revision_id,
    scope_revision: (current?.revision ?? null) as number | null,
    scope_version: (current?.version ?? null) as number | null,
    summary: (current?.summary ?? null) as string | null,
    coverage_status: (current?.coverage?.status ?? null) as string | null,
    authorisation: authorisationState(
      w.status,
      w.scope_revision_id,
      w.authorised_scope_revision_id,
      issues.length,
    ),
    blocker_count: issues.length,
    linked_request_count: linked,
    next_visit: visit
      ? {
          id: visit.id,
          display_number: visit.display_number,
          version: visit.version,
          status: visit.status,
          start_at: visit.start_at.toISOString(),
          end_at: visit.end_at.toISOString(),
          site_timezone: visit.site_timezone,
          scope_revision_id: visit.scope_revision_id,
          scope_version: visit.scope_version,
          scope_review_required: visitScopeReviewRequired(
            w.scope_revision_id,
            w.authorised_scope_revision_id,
            visit.revision_version,
            visit,
          ),
        }
      : null,
    updated_at: w.updated_at.toISOString(),
    updated_basis: "WorkOrder" as const,
    href: `/service/work-orders/${w.id}`,
  };
  return { row, issues, current, w };
}

export async function readWorkOrderRegister(p: Principal, input: unknown = {}) {
  const f = workOrderRegisterQuery(input);
  return transaction(async (c) => {
    const asOf = await beginRead(c, p);
    if (f.company_id)
      await companyContext(
        c,
        p,
        f.company_id,
        f.site_id,
        "service.work_order.read",
      );
    if (f.site_id) await visible(c, p, "Site", f.site_id);
    // Include native historical-asset visibility before paging: a hidden source
    // cannot leak an identity through a continuation or an aggregate count.
    const candidates = (
      await c.query<{ id: string }>(
        `
      SELECT w.id FROM ppo.work_orders w
      JOIN ppo.sites s ON (s.workspace_id,s.id)=(w.workspace_id,w.site_id)
      JOIN ppo.organisations o ON (o.workspace_id,o.id)=(w.workspace_id,w.customer_id)
      LEFT JOIN ppo.scope_revisions r ON (r.workspace_id,r.id)=(w.workspace_id,w.scope_revision_id)
      WHERE w.workspace_id=$1 AND ${orderVisibility()}
        AND NOT EXISTS (SELECT 1 FROM ppo.scope_revisions sr JOIN ppo.scope_assets sa ON (sa.workspace_id,sa.scope_revision_id)=(sr.workspace_id,sr.id)
          JOIN ppo.assets a ON (a.workspace_id,a.id)=(sa.workspace_id,sa.asset_id)
          WHERE sr.workspace_id=w.workspace_id AND sr.work_order_id=w.id AND NOT (${visibility("Asset", "a")}))
        AND ($3::uuid IS NULL OR w.service_owner_id=$3) AND ($4::uuid IS NULL OR w.site_id=$4)
        AND ($5::uuid IS NULL OR w.company_id=$5) AND ($6::text IS NULL OR w.status=$6)
        AND strpos(lower(concat_ws(' ',w.display_number,s.display_name,o.display_name,r.summary)),lower($7))>0
      ORDER BY ${sorts[f.sort]}`,
        [
          p.workspace_id,
          p.actor_id,
          f.owner_id,
          f.site_id,
          f.company_id,
          f.status,
          f.q,
        ],
      )
    ).rows;
    const rows = new Map<
      string,
      Awaited<ReturnType<typeof projection>>["row"]
    >();
    let partial = false;
    for (const candidate of candidates) {
      try {
        rows.set(candidate.id, (await projection(c, p, candidate.id)).row);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
        partial = true;
      }
    }
    // Recheck clock-based grants at publication, including continuation.
    await requireCapability(c, p, "service.work_order.read");
    await requireCapability(c, p, "shared.read");
    for (const id of rows.keys()) {
      try {
        await visibleWorkOrder(c, p, id);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
        rows.delete(id);
        partial = true;
      }
    }
    const allowed = [...rows.values()];
    const matching = allowed.filter((row) =>
      inWorkOrderView(row, f.view, p.actor_id),
    );
    // Counts, options and pagination share the same authorised population. Never
    // filter a page of candidates after paging: sparse attention queues would
    // otherwise miss records and counts would describe only that window.
    return {
      items: matching.slice(f.offset, f.offset + f.limit),
      total: matching.length,
      options: {
        owners: [
          ...new Map(
            allowed.map((row) => [
              row.service_owner_id,
              {
                id: row.service_owner_id,
                label: row.owner_name ?? "Unassigned",
              },
            ]),
          ).values(),
        ],
        sites: [
          ...new Map(
            allowed.map((row) => [
              row.site_id,
              { id: row.site_id, label: row.site_name },
            ]),
          ).values(),
        ],
      },
      counts: Object.fromEntries(
        workOrderViews.map((view) => [
          view,
          allowed.filter((row) => inWorkOrderView(row, view, p.actor_id))
            .length,
        ]),
      ),
      count_scope: "PermissionScopedMatchingFilters" as const,
      view: f.view,
      sort: f.sort,
      offset: f.offset,
      limit: f.limit,
      next_offset:
        matching.length > f.offset + f.limit ? f.offset + f.limit : null,
      completeness: partial ? "Partial" : "Complete",
      as_of: asOf.toISOString(),
      synthetic: true,
    };
  });
}

export async function readWorkOrderRecord(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  uuid(id, "work_order_id");
  const f = workOrderRecordQuery(input);
  return transaction(async (c) => {
    const asOf = await beginRead(c, p);
    const d = await projection(c, p, id);
    // Only native authority/readiness references, not arbitrary documents linked
    // to this order, private output paths, generated packs or Finance evidence.
    const evidence = (
      await c.query(
        `
      SELECT d.id,d.title,d.source_reference,d.source_version,d.provider,d.status,d.content_hash,d.created_at
      FROM ppo.document_references d WHERE d.workspace_id=$1 AND d.work_order_id=$2
        AND (EXISTS(SELECT 1 FROM ppo.scope_revisions r WHERE r.workspace_id=d.workspace_id AND r.work_order_id=$2 AND r.authority_evidence_ref=d.id)
          OR EXISTS(SELECT 1 FROM ppo.readiness_assessments a JOIN ppo.scope_revisions r ON (r.workspace_id,r.id)=(a.workspace_id,a.scope_revision_id)
            WHERE a.workspace_id=d.workspace_id AND r.work_order_id=$2 AND a.evidence_ref=d.id))
      ORDER BY d.created_at DESC,d.id LIMIT $3 OFFSET $4`,
        [p.workspace_id, id, f.limit + 1, f.evidence_offset],
      )
    ).rows;
    // Whitelist native Service operations. Audit payloads and other domains'
    // events are not a substitute for their independent read permissions.
    const history = (
      await c.query(
        `
      SELECT e.id,e.occurred_at,e.actor_id,u.display_name AS actor_name,e.object_type,e.object_id,
        e.details->>'command' AS command,e.outcome,e.reason
      FROM ppo.audit_events e LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.actor_id)
      WHERE e.workspace_id=$1 AND ((e.object_type='WorkOrder' AND e.object_id=$2
        AND e.details->>'command' IN ('CreateWorkOrder','SaveScopeDraft','CreateScopeSuccessor','AssessWorkReadiness','AuthoriseWorkOrder'))
        OR (e.object_type='Appointment' AND e.details->>'command'='ProposeVisit'
          AND EXISTS(SELECT 1 FROM ppo.appointments a WHERE a.workspace_id=e.workspace_id AND a.id=e.object_id AND a.work_order_id=$2)))
      ORDER BY e.occurred_at DESC,e.id LIMIT $3 OFFSET $4`,
        [p.workspace_id, id, f.limit + 1, f.history_offset],
      )
    ).rows;
    const dates = (
      await c.query(
        "SELECT created_at,updated_at FROM ppo.work_orders WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, id],
      )
    ).rows[0];
    await visibleWorkOrder(c, p, id);
    await visible(c, p, "Site", d.w.site_id);
    await visible(c, p, "Organisation", d.w.customer_id);
    return {
      work_order: { ...d.row, created_at: dates.created_at.toISOString() },
      blockers: d.issues,
      evidence: {
        items: evidence.slice(0, f.limit),
        offset: f.evidence_offset,
        next_offset:
          evidence.length > f.limit ? f.evidence_offset + f.limit : null,
        scope: "NativeScopeAndReadinessReferences",
      },
      history: {
        items: history.slice(0, f.limit),
        offset: f.history_offset,
        next_offset:
          history.length > f.limit ? f.history_offset + f.limit : null,
        scope: "NativeWorkOrderCommandsAndVisitProposals",
      },
      native_detail_href: `/api/v1/service/work-orders/${id}`,
      as_of: asOf.toISOString(),
      synthetic: true,
    };
  });
}
