import { createHash, randomUUID } from "node:crypto";
import { database } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { companyContext, scopedOwner } from "../shared/authority";
import { envelope, page, visible, visibility } from "../shared/reads";
import {
  choice,
  common,
  commonKeys,
  instant,
  invalid,
  narrative,
  object,
  optionalId,
  optionalText,
  uuid,
  version,
} from "../shared/validation";
import { visibleTicket, ticketVisibility } from "./tickets";
import {
  assessmentFields,
  commandFields,
  evidenceFields,
  list,
  scopeFields,
  type ScopeInput,
} from "./work-scope-validation";
export const POLICY_ID = "94000000-0000-4000-8000-000000000001";
export type WorkOrder = {
  id: string;
  workspace_id: string;
  company_id: string;
  site_id: string;
  customer_id: string;
  service_owner_id: string;
  version: number;
  status: "Draft" | "Authorised";
  scope_revision_id: string | null;
  authorised_scope_revision_id: string | null;
  display_number: string;
  authority_mode: "PlatformSynthetic";
  updated_at: Date;
};
export type Blocker = { field: string; message: string; stage: string };
function checkVersion(actual: number, expected: number) {
  if (actual !== expected)
    throw new AppError(
      409,
      "VersionConflict",
      "This work order changed. Keep your proposal and compare the saved version.",
    );
}
export function orderVisibility(alias = "w") {
  return `${scopeSql(`${alias}.company_id`, `${alias}.site_id`, "service.work_order.read")} AND EXISTS(SELECT 1 FROM ppo.sites os WHERE os.workspace_id=${alias}.workspace_id AND os.id=${alias}.site_id AND ${visibility("Site", "os")}) AND EXISTS(SELECT 1 FROM ppo.organisations oc WHERE oc.workspace_id=${alias}.workspace_id AND oc.id=${alias}.customer_id AND ${visibility("Organisation", "oc")}) AND NOT EXISTS(SELECT 1 FROM ppo.work_order_tickets wl JOIN ppo.tickets wt ON (wt.workspace_id,wt.id)=(wl.workspace_id,wl.ticket_id) WHERE wl.workspace_id=${alias}.workspace_id AND wl.work_order_id=${alias}.id AND NOT (${ticketVisibility("wt")}))`;
}
export async function visibleWorkOrder(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Capability = "service.work_order.read",
): Promise<WorkOrder> {
  await requireCapability(c, p, cap);
  await requireCapability(c, p, "service.work_order.read");
  const w = (
    await c.query(
      `SELECT w.* FROM ppo.work_orders w WHERE w.workspace_id=$1 AND w.id=$3 AND ${orderVisibility()}`,
      [p.workspace_id, p.actor_id, uuid(id, "work_order_id")],
    )
  ).rows[0] as WorkOrder | undefined;
  if (!w || !(await hasPermission(c, p, cap, w.company_id, w.site_id)))
    throw unavailable();
  // A previously linked asset becoming inaccessible suppresses the complete order, including history.
  const assets = (
    await c.query(
      "SELECT DISTINCT a.asset_id FROM ppo.scope_revisions r JOIN ppo.scope_assets a ON (a.workspace_id,a.scope_revision_id)=(r.workspace_id,r.id) WHERE r.workspace_id=$1 AND r.work_order_id=$2",
      [p.workspace_id, w.id],
    )
  ).rows;
  for (const a of assets) await visible(c, p, "Asset", a.asset_id);
  return w;
}
async function insert(
  c: QueryClient,
  table: string,
  fields: Record<string, unknown>,
) {
  const e = Object.entries(fields);
  return (
    await c.query(
      `INSERT INTO ppo.${table}(${e.map(([k]) => k).join(",")}) VALUES(${e.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
      e.map(([, v]) => v),
    )
  ).rows[0];
}
const meta = (p: Principal, w: WorkOrder) => ({
  id: randomUUID(),
  workspace_id: p.workspace_id,
  company_id: w.company_id,
  site_id: w.site_id,
  created_by: p.actor_id,
  updated_by: p.actor_id,
});
async function bump(
  c: QueryClient,
  p: Principal,
  w: WorkOrder,
  details: Record<string, unknown> = {},
) {
  const r = (
    await c.query(
      "UPDATE ppo.work_orders SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
      [p.workspace_id, w.id, p.actor_id],
    )
  ).rows[0];
  return { ...r, state: r.status, audit_details: details };
}
async function evidence(
  c: QueryClient,
  p: Principal,
  w: WorkOrder,
  input: ReturnType<typeof evidenceFields> | null,
) {
  if (!input) return null;
  const id = randomUUID();
  await insert(c, "document_references", {
    ...meta(p, w),
    id,
    work_order_id: w.id,
    ...input,
    local_object_key: `SYN-PPO-EVIDENCE/${id}`,
    owner_id: p.actor_id,
    content_hash: createHash("sha256").update(input.content_text).digest("hex"),
  });
  return id;
}
async function scope(
  c: QueryClient,
  p: Principal,
  w: WorkOrder,
  id = w.scope_revision_id,
) {
  if (!id)
    throw new AppError(
      422,
      "ScopeRequired",
      "Save a work scope before continuing.",
      [{ field: "scope", message: "A current scope revision is required." }],
    );
  const r = (
    await c.query(
      "SELECT * FROM ppo.scope_revisions WHERE workspace_id=$1 AND work_order_id=$2 AND id=$3",
      [p.workspace_id, w.id, id],
    )
  ).rows[0];
  if (!r) throw unavailable();
  return r;
}
async function policy(c: QueryClient, p: Principal, id: string) {
  const r = (
    await c.query(
      "SELECT * FROM ppo.policy_versions WHERE workspace_id=$1 AND id=$2 AND status='Published' AND effective_at<=clock_timestamp()",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!r)
    throw new AppError(
      422,
      "PolicyUnavailable",
      "The applicable synthetic readiness policy is unavailable.",
    );
  return r;
}
async function validateAssets(
  c: QueryClient,
  p: Principal,
  w: WorkOrder,
  input: ScopeInput,
) {
  for (const item of input.items)
    for (const a of item.assets) {
      const asset = await visible(c, p, "Asset", a.asset_id);
      if (asset.site_id !== w.site_id || asset.company_id !== w.company_id)
        throw unavailable();
      if (
        a.configuration_id &&
        !(
          await c.query(
            "SELECT 1 FROM ppo.asset_configurations WHERE workspace_id=$1 AND asset_id=$2 AND id=$3",
            [p.workspace_id, a.asset_id, a.configuration_id],
          )
        ).rowCount
      )
        throw unavailable();
    }
}
async function writeScope(
  c: QueryClient,
  p: Principal,
  w: WorkOrder,
  r: Record<string, unknown>,
  input: ScopeInput,
) {
  await validateAssets(c, p, w, input);
  const authority = await evidence(c, p, w, input.authority_evidence);
  const coverage = input.coverage
    ? (
        await insert(c, "coverage_assessments", {
          ...meta(p, w),
          work_order_id: w.id,
          ...input.coverage,
          assessed_by: p.actor_id,
        })
      ).id
    : null;
  await c.query(
    "DELETE FROM ppo.identification_plans WHERE workspace_id=$1 AND scope_revision_id=$2",
    [p.workspace_id, r.id],
  );
  await c.query(
    "DELETE FROM ppo.scope_assets WHERE workspace_id=$1 AND scope_revision_id=$2",
    [p.workspace_id, r.id],
  );
  await c.query(
    "DELETE FROM ppo.scope_items WHERE workspace_id=$1 AND scope_revision_id=$2",
    [p.workspace_id, r.id],
  );
  for (const item of input.items) {
    const { assets, ...fields } = item;
    const i = await insert(c, "scope_items", {
      id: randomUUID(),
      workspace_id: p.workspace_id,
      company_id: w.company_id,
      site_id: w.site_id,
      scope_revision_id: r.id,
      ...fields,
    });
    for (const a of assets) {
      await insert(c, "scope_assets", {
        workspace_id: p.workspace_id,
        company_id: w.company_id,
        site_id: w.site_id,
        scope_revision_id: r.id,
        scope_item_id: i.id,
        asset_id: a.asset_id,
        configuration_id: a.configuration_id,
      });
      if (a.identification_plan)
        await insert(c, "identification_plans", {
          id: randomUUID(),
          workspace_id: p.workspace_id,
          scope_revision_id: r.id,
          scope_item_id: i.id,
          asset_id: a.asset_id,
          ...a.identification_plan,
        });
    }
  }
  await c.query(
    "UPDATE ppo.scope_revisions SET summary=$3,exclusions=$4,diagnostic_limit=$5,pending_account_plan=$6,authority_evidence_ref=$7,coverage_assessment_id=$8,version=version+1,updated_by=$9,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
    [
      p.workspace_id,
      r.id,
      input.summary,
      input.exclusions,
      input.diagnostic_limit,
      input.pending_account_plan,
      authority,
      coverage,
      p.actor_id,
    ],
  );
}
export async function createWorkOrder(p: Principal, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "company_id",
    "site_id",
    "customer_id",
    "service_owner_id",
    "tickets",
    "project_reference",
    "opportunity_reference",
  ]);
  const tickets = list(
    r.tickets,
    "tickets",
    (v) => {
      const t = object(v, ["ticket_id", "issue_disposition"]);
      return {
        ticket_id: uuid(t.ticket_id, "ticket_id"),
        issue_disposition: narrative(
          t.issue_disposition,
          "issue_disposition",
          2000,
        ),
      };
    },
    1,
  );
  if (new Set(tickets.map((t) => t.ticket_id)).size !== tickets.length)
    invalid("tickets", "Link each service request once.");
  const cmd = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    site_id: uuid(r.site_id, "site_id"),
    customer_id: uuid(r.customer_id, "customer_id"),
    service_owner_id: uuid(r.service_owner_id, "service_owner_id"),
    project_reference: optionalText(r.project_reference, "project_reference"),
    opportunity_reference: optionalText(
      r.opportunity_reference,
      "opportunity_reference",
    ),
    tickets,
  };
  return sharedOperation(
    p,
    cmd,
    "CreateWorkOrder",
    async (c) => {
      await requireCapability(c, p, "service.work_order.edit");
      await companyContext(
        c,
        p,
        cmd.company_id,
        cmd.site_id,
        "service.work_order.edit",
      );
      if (
        !(await hasPermission(
          c,
          p,
          "service.work_order.read",
          cmd.company_id,
          cmd.site_id,
        ))
      )
        throw unavailable();
      const customer = await visible(c, p, "Organisation", cmd.customer_id);
      if (customer.company_id !== cmd.company_id) throw unavailable();
      if (
        !(
          await c.query(
            "SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND site_id=$2 AND organisation_id=$3 AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp())",
            [p.workspace_id, cmd.site_id, cmd.customer_id],
          )
        ).rowCount
      )
        invalid(
          "customer_id",
          "Choose a customer with a current explicit relationship to this site.",
        );
      const owner = await scopedOwner(
        c,
        p,
        cmd.service_owner_id,
        cmd.company_id,
        cmd.site_id,
        "service.work_order.edit",
      );
      if (
        !(await hasPermission(
          c,
          owner,
          "service.work_order.read",
          cmd.company_id,
          cmd.site_id,
        ))
      )
        throw unavailable();
      for (const actor of [p, owner])
        for (const t of tickets) {
          const row = await visibleTicket(c, actor, t.ticket_id);
          if (row.site_id !== cmd.site_id || row.company_id !== cmd.company_id)
            throw unavailable();
        }
    },
    async (c) => {
      const w = await insert(c, "work_orders", {
        id: cmd.id,
        workspace_id: p.workspace_id,
        company_id: cmd.company_id,
        site_id: cmd.site_id,
        customer_id: cmd.customer_id,
        service_owner_id: cmd.service_owner_id,
        created_by: p.actor_id,
        updated_by: p.actor_id,
        project_reference: cmd.project_reference,
        opportunity_reference: cmd.opportunity_reference,
      });
      for (const t of tickets)
        await insert(c, "work_order_tickets", {
          workspace_id: p.workspace_id,
          company_id: w.company_id,
          site_id: w.site_id,
          work_order_id: w.id,
          ...t,
        });
      return { ...w, state: w.status };
    },
    "WorkOrder",
    "WorkOrderCreated",
  );
}
export async function saveWorkScope(
  p: Principal,
  id: string,
  input: unknown,
  successor = false,
) {
  const { raw, base } = commandFields(id, input, ["scope", "change_reason"]);
  const cmd = {
    ...base,
    scope: scopeFields(raw.scope),
    change_reason: successor
      ? narrative(raw.change_reason, "change_reason", 2000)
      : null,
  };
  if (!successor && raw.change_reason != null)
    invalid(
      "change_reason",
      "Use the successor action to change approved scope.",
    );
  return sharedOperation(
    p,
    cmd,
    successor ? "CreateScopeSuccessor" : "SaveScopeDraft",
    (c) => visibleWorkOrder(c, p, id, "service.work_order.edit"),
    async (c, w) => {
      checkVersion(w.version, cmd.expected_version);
      let r = w.scope_revision_id ? await scope(c, p, w) : null;
      if (
        successor &&
        (!r?.approved_at || r.id !== w.authorised_scope_revision_id)
      )
        invalid(
          "scope",
          "A successor must follow the current approved revision.",
        );
      if (!successor && r?.approved_at)
        throw new AppError(
          422,
          "ScopeImmutable",
          "The approved scope is read-only. Create a successor revision.",
        );
      if (!r || successor) {
        await policy(c, p, POLICY_ID);
        r = await insert(c, "scope_revisions", {
          ...meta(p, w),
          work_order_id: w.id,
          revision: r ? r.revision + 1 : 1,
          predecessor_id: r?.id ?? null,
          change_reason: cmd.change_reason,
          policy_version_id: POLICY_ID,
        });
        await c.query(
          "UPDATE ppo.work_orders SET scope_revision_id=$3 WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, w.id, r.id],
        );
      }
      await writeScope(c, p, w, r, cmd.scope);
      return bump(c, p, w, {
        scope_revision_id: r.id,
        revision: r.revision,
        predecessor_id: r.predecessor_id ?? null,
      });
    },
    "WorkOrder",
    successor ? "ScopeSuccessorCreated" : "ScopeDraftSaved",
  );
}
async function scopeDetail(
  c: QueryClient,
  p: Principal,
  w: WorkOrder,
  id: string,
) {
  const r = await scope(c, p, w, id);
  const coverage = r.coverage_assessment_id
    ? (
        await c.query(
          "SELECT id,status,agreement_reference,source_version,effective_from::text,effective_to::text,assessment,reason,charging_route,assessed_by,assessed_at FROM ppo.coverage_assessments WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, r.coverage_assessment_id],
        )
      ).rows[0]
    : null;
  const authority = r.authority_evidence_ref
    ? (
        await c.query(
          "SELECT id,title,content_text,content_hash,source_reference,source_version,provider,status FROM ppo.document_references WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, r.authority_evidence_ref],
        )
      ).rows[0]
    : null;
  const items = (
    await c.query(
      "SELECT * FROM ppo.scope_items WHERE workspace_id=$1 AND scope_revision_id=$2 ORDER BY sequence",
      [p.workspace_id, r.id],
    )
  ).rows;
  for (const i of items)
    i.assets = (
      await c.query(
        `SELECT sa.asset_id,sa.configuration_id,a.display_number,a.description,a.identity_status,a.version AS asset_version,a.serial,a.model,ac.description AS configuration_description,ac.verification_status AS configuration_status,ip.id AS identification_plan_id,ip.method,ip.limits,ip.approved_by,ip.approved_at FROM ppo.scope_assets sa JOIN ppo.assets a ON (a.workspace_id,a.id)=(sa.workspace_id,sa.asset_id) LEFT JOIN ppo.asset_configurations ac ON (ac.workspace_id,ac.id)=(sa.workspace_id,sa.configuration_id) LEFT JOIN ppo.identification_plans ip ON (ip.workspace_id,ip.scope_item_id,ip.asset_id)=(sa.workspace_id,sa.scope_item_id,sa.asset_id) WHERE sa.workspace_id=$1 AND sa.scope_item_id=$2 ORDER BY a.id`,
        [p.workspace_id, i.id],
      )
    ).rows;
  return {
    ...r,
    coverage,
    authority,
    items:
      r.approved_at &&
      r.approved_snapshot?.items?.every((i: { assets?: unknown }) =>
        Array.isArray(i.assets),
      )
        ? r.approved_snapshot.items
        : items,
  };
}
async function readiness(
  c: QueryClient,
  p: Principal,
  r: Awaited<ReturnType<typeof scopeDetail>>,
  appointment_id: string | null = null,
) {
  const criteria = (
    await c.query(
      `SELECT pc.*,a.id AS assessment_id,a.outcome,a.scope_version,a.reason,a.evidence_ref,a.assessed_by,a.assessed_at,a.source_as_at,a.valid_until,d.title AS evidence_title,d.content_text AS evidence_text,d.content_hash AS evidence_hash
 FROM ppo.policy_criteria pc LEFT JOIN LATERAL(SELECT * FROM ppo.readiness_assessments a WHERE a.workspace_id=pc.workspace_id AND a.policy_version_id=pc.policy_version_id AND a.criterion_code=pc.criterion_code AND a.scope_revision_id=$3 AND a.appointment_id IS NOT DISTINCT FROM $4::uuid ORDER BY assessment_version DESC LIMIT 1)a ON true LEFT JOIN ppo.document_references d ON (d.workspace_id,d.id)=(a.workspace_id,a.evidence_ref)
 WHERE pc.workspace_id=$1 AND pc.policy_version_id=$2 AND ${appointment_id ? "pc.blocking_stage<>'Authorisation'" : "pc.blocking_stage='Authorisation'"} ORDER BY pc.blocking_stage,pc.criterion_code`,
      [p.workspace_id, r.policy_version_id, r.id, appointment_id],
    )
  ).rows;
  return criteria.map((x) => {
    const stale = x.scope_version != null && x.scope_version !== r.version;
    const expired = x.valid_until && x.valid_until.getTime() <= Date.now();
    return {
      ...x,
      recorded_outcome: x.outcome ?? "Unknown",
      outcome: stale || expired ? "Unknown" : (x.outcome ?? "Unknown"),
      stale: !!stale,
      expired: !!expired,
    };
  });
}
async function blockers(
  c: QueryClient,
  p: Principal,
  w: WorkOrder,
  r: Awaited<ReturnType<typeof scopeDetail>> | null,
) {
  const b: Blocker[] = [];
  const add = (field: string, message: string) =>
    b.push({ field, message, stage: "Authorisation" });
  if (!r) {
    add("scope", "Save a current scope revision.");
    return b;
  }
  if (!r.summary) add("summary", "Describe the work scope.");
  if (!r.exclusions)
    add(
      "exclusions",
      "Record explicit exclusions, including “None” where reviewed.",
    );
  if (!r.pending_account_plan)
    add(
      "pending_account_plan",
      "Record the reviewed account clarification and Finance decision route.",
    );
  if (!r.authority)
    add(
      "authority_evidence",
      "Record exact synthetic manual authority evidence.",
    );
  if (!r.coverage)
    add(
      "coverage",
      "Record a coverage assessment and separate charging-review route.",
    );
  if (!r.items.length)
    add("items", "Add at least one task with completion requirements.");
  const uncertain =
    r.coverage && ["Unknown", "Disputed"].includes(r.coverage.status);
  if (
    uncertain &&
    (!r.diagnostic_limit ||
      r.items.some(
        (i: { task_kind: string }) => i.task_kind === "Intervention",
      ))
  )
    add(
      "diagnostic_limit",
      "Unknown or disputed coverage permits only explicitly limited inspection or identification; intervention requires a resolved coverage assessment.",
    );
  for (const i of r.items) {
    if (!i.assets.length)
      add(
        `items.${i.sequence}.assets`,
        "Identify the affected equipment, using a distinct unresolved equipment record where needed.",
      );
    if (i.task_kind === "Intervention" && !i.shutdown_condition)
      add(
        `items.${i.sequence}.shutdown_condition`,
        "Record explicit shutdown and isolation conditions for intervention.",
      );
    for (const a of i.assets) {
      if (
        a.identity_status !== "Verified" &&
        (i.task_kind !== "Identification" ||
          !a.method ||
          !a.limits ||
          !r.diagnostic_limit)
      )
        add(
          `items.${i.sequence}.asset`,
          "Confirm equipment identity or restrict this task to a reviewed identification method and limits.",
        );
      if (a.configuration_id && a.configuration_status !== "Verified")
        add(
          `items.${i.sequence}.configuration`,
          "The selected configuration is Review required and cannot authorise work as verified evidence.",
        );
    }
  }
  const links = (
    await c.query(
      "SELECT t.id,t.status FROM ppo.work_order_tickets l JOIN ppo.tickets t ON (t.workspace_id,t.id)=(l.workspace_id,l.ticket_id) WHERE l.workspace_id=$1 AND l.work_order_id=$2",
      [p.workspace_id, w.id],
    )
  ).rows;
  if (!links.length) add("tickets", "Link a triaged service request.");
  for (const t of links)
    if (t.status !== "Triaged")
      add(
        "tickets",
        `Linked service request needs triage. Urgent priority provides no authority.`,
      );
  try {
    await scopedOwner(
      c,
      p,
      w.service_owner_id,
      w.company_id,
      w.site_id,
      "service.work_order.edit",
    );
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    add(
      "service_owner_id",
      "The service owner needs current business authority.",
    );
  }
  for (const a of await readiness(c, p, r)) {
    if (!["Pass", "PermittedException", "NotApplicable"].includes(a.outcome))
      add(
        a.criterion_code,
        `${a.label}: ${a.stale ? "scope changed — assess again" : a.expired ? "evidence expired" : a.outcome}.`,
      );
  }
  return b;
}
export async function assessWorkReadiness(
  p: Principal,
  id: string,
  input: unknown,
) {
  const { raw, base } = commandFields(id, input, ["assessment"]);
  const cmd = { ...base, assessment: assessmentFields(raw.assessment) };
  return sharedOperation(
    p,
    cmd,
    "AssessWorkReadiness",
    (c) => visibleWorkOrder(c, p, id, "service.readiness.assess"),
    async (c, w) => {
      checkVersion(w.version, cmd.expected_version);
      const a = cmd.assessment,
        r = await scopeDetail(c, p, w, a.scope_revision_id);
      checkVersion(r.version, a.scope_version);
      if (!a.appointment_id && (r.id !== w.scope_revision_id || r.approved_at))
        invalid(
          "scope_revision_id",
          "Assess the current draft scope before authorisation.",
        );
      if (a.appointment_id) {
        const visit = (
          await c.query(
            "SELECT * FROM ppo.appointments WHERE workspace_id=$1 AND work_order_id=$2 AND id=$3",
            [p.workspace_id, w.id, a.appointment_id],
          )
        ).rows[0];
        if (!visit || visit.scope_revision_id !== r.id) throw unavailable();
        if (visit.scope_version !== r.version)
          invalid(
            "appointment_id",
            "This proposal refers to older scope. Create a new proposal after scope review.",
          );
      }
      const pc = (
        await c.query(
          "SELECT * FROM ppo.policy_criteria WHERE workspace_id=$1 AND policy_version_id=$2 AND criterion_code=$3",
          [p.workspace_id, r.policy_version_id, a.criterion_code],
        )
      ).rows[0];
      if (
        !pc ||
        (a.appointment_id
          ? pc.blocking_stage === "Authorisation"
          : pc.blocking_stage !== "Authorisation")
      )
        invalid(
          "criterion_code",
          "Choose a criterion for this assessment stage.",
        );
      if (
        ["CrewCompetency", "DispatchControls"].includes(a.criterion_code) &&
        ["Pass", "PermittedException", "NotApplicable"].includes(a.outcome)
      )
        invalid(
          "outcome",
          "This control needs the later planner/dispatch evidence and cannot be cleared in P04.",
        );
      if (a.outcome === "PermittedException" && !pc.exception_allowed)
        invalid("outcome", "This mandatory control cannot be waived.");
      if (
        a.outcome === "NotApplicable" &&
        (!pc.not_applicable_allowed ||
          r.items.some(
            (i: { task_kind: string; shutdown_condition: string | null }) =>
              i.task_kind === "Intervention" || !!i.shutdown_condition,
          ))
      )
        invalid(
          "outcome",
          "This control is applicable and cannot be marked not applicable.",
        );
      if (
        ["Pass", "PermittedException", "NotApplicable"].includes(a.outcome) &&
        !a.evidence
      )
        invalid("evidence", "Reviewed evidence is required for this decision.");
      if (
        a.valid_until &&
        Date.parse(a.valid_until) <= Date.now() &&
        ["Pass", "PermittedException", "NotApplicable"].includes(a.outcome)
      )
        invalid(
          "valid_until",
          "Expired evidence cannot clear a readiness control.",
        );
      const evidence_ref = await evidence(c, p, w, a.evidence);
      const n = (
        await c.query(
          "SELECT coalesce(max(assessment_version),0)+1 AS n FROM ppo.readiness_assessments WHERE workspace_id=$1 AND scope_revision_id=$2 AND appointment_id IS NOT DISTINCT FROM $3::uuid AND criterion_code=$4",
          [p.workspace_id, r.id, a.appointment_id, a.criterion_code],
        )
      ).rows[0].n;
      await insert(c, "readiness_assessments", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        scope_revision_id: r.id,
        scope_version: r.version,
        appointment_id: a.appointment_id,
        criterion_code: a.criterion_code,
        policy_version_id: r.policy_version_id,
        assessment_version: n,
        outcome: a.outcome,
        blocking_stage: pc.blocking_stage,
        exception_allowed: pc.exception_allowed,
        evidence_ref,
        assessed_by: p.actor_id,
        reason: a.reason,
        source_as_at: a.source_as_at,
        valid_until: a.valid_until,
      });
      return bump(c, p, w, {
        scope_revision_id: r.id,
        appointment_id: a.appointment_id,
        criterion_code: a.criterion_code,
        outcome: a.outcome,
        policy_version_id: r.policy_version_id,
      });
    },
    "WorkOrder",
    "ReadinessAssessed",
  );
}
export async function authoriseWorkOrder(
  p: Principal,
  id: string,
  input: unknown,
) {
  const { raw, base } = commandFields(id, input, [
    "scope_revision_id",
    "scope_version",
    "policy_version_id",
  ]);
  const cmd = {
    ...base,
    scope_revision_id: uuid(raw.scope_revision_id, "scope_revision_id"),
    scope_version: version(raw.scope_version),
    policy_version_id: uuid(raw.policy_version_id, "policy_version_id"),
  };
  return sharedOperation(
    p,
    cmd,
    "AuthoriseWorkOrder",
    (c) => visibleWorkOrder(c, p, id, "service.scope.authorise"),
    async (c, w) => {
      // Lock current mutable source rows as well as the existing workspace command lock.
      await c.query(
        "SELECT id FROM ppo.work_orders WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
        [p.workspace_id, w.id],
      );
      checkVersion(w.version, cmd.expected_version);
      if (w.scope_revision_id !== cmd.scope_revision_id)
        throw new AppError(
          409,
          "VersionConflict",
          "The current scope changed. Review its exact revision.",
        );
      const r = await scopeDetail(c, p, w, cmd.scope_revision_id);
      checkVersion(r.version, cmd.scope_version);
      if (r.approved_at)
        invalid("scope", "This revision is already authorised.");
      if (r.policy_version_id !== cmd.policy_version_id)
        throw new AppError(
          409,
          "VersionConflict",
          "The readiness policy changed.",
        );
      const pol = await policy(c, p, r.policy_version_id);
      await c.query(
        "SELECT id FROM ppo.sites WHERE workspace_id=$1 AND id=$2 FOR SHARE",
        [p.workspace_id, w.site_id],
      );
      await c.query(
        "SELECT a.id FROM ppo.assets a JOIN ppo.scope_assets sa ON (sa.workspace_id,sa.asset_id)=(a.workspace_id,a.id) WHERE sa.workspace_id=$1 AND sa.scope_revision_id=$2 ORDER BY a.id FOR SHARE OF a",
        [p.workspace_id, r.id],
      );
      const b = await blockers(c, p, w, r);
      if (b.length)
        throw new AppError(
          422,
          "AuthorisationBlocked",
          "Resolve the work-authorisation blockers. The draft remains saved.",
          b.map(({ field, message }) => ({ field, message })),
        );
      const controls = await readiness(c, p, r);
      const site = (
        await c.query(
          "SELECT id,version,display_name,timezone,access_instructions,biosecurity_notes FROM ppo.sites WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, w.site_id],
        )
      ).rows[0];
      const snapshot = {
        schema_version: 1,
        synthetic: true,
        work_order_id: w.id,
        display_number: w.display_number,
        site,
        customer_id: w.customer_id,
        service_owner_id: w.service_owner_id,
        revision: r.revision,
        scope_version: r.version,
        summary: r.summary,
        exclusions: r.exclusions,
        diagnostic_limit: r.diagnostic_limit,
        pending_account_plan: r.pending_account_plan,
        items: r.items,
        coverage: r.coverage,
        authority: r.authority,
        readiness: controls,
        policy: {
          id: pol.id,
          key: pol.key,
          version: pol.version,
          definition: pol.definition,
        },
        financial_disposition: "PendingFinanceReview",
      };

      await c.query(
        "UPDATE ppo.identification_plans SET approved_by=$3,approved_at=clock_timestamp() WHERE workspace_id=$1 AND scope_revision_id=$2",
        [p.workspace_id, r.id, p.actor_id],
      );
      const approved = (
        await c.query(
          "UPDATE ppo.scope_revisions SET approved_by=$3,approved_at=clock_timestamp(),approved_snapshot=$4,content_hash=encode(sha256(convert_to($4::jsonb::text,'UTF8')),'hex') WHERE workspace_id=$1 AND id=$2 RETURNING content_hash",
          [p.workspace_id, r.id, p.actor_id, snapshot],
        )
      ).rows[0];
      const content_hash = approved.content_hash;
      await c.query(
        "UPDATE ppo.work_orders SET status='Authorised',authorised_scope_revision_id=$3 WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, w.id, r.id],
      );
      return bump(c, p, w, {
        scope_revision_id: r.id,
        scope_revision: r.revision,
        scope_hash: content_hash,
        policy_version_id: pol.id,
        predecessor_id: r.predecessor_id,
        synthetic: true,
      });
    },
    "WorkOrder",
    "ScopeAuthorised",
  );
}
export async function proposeVisit(p: Principal, id: string, input: unknown) {
  const { raw, base } = commandFields(id, input, [
    "id",
    "scope_revision_id",
    "scope_version",
    "start_at",
    "end_at",
    "requested_window_start",
    "requested_window_end",
    "customer_commitment",
    "preparation_status",
  ]);
  const start_at = instant(raw.start_at, "start_at"),
    end_at = instant(raw.end_at, "end_at");
  if (end_at <= start_at) invalid("end_at", "Finish must follow start.");
  const ws =
      raw.requested_window_start == null
        ? null
        : instant(raw.requested_window_start, "requested_window_start"),
    we =
      raw.requested_window_end == null
        ? null
        : instant(raw.requested_window_end, "requested_window_end");
  if (
    (ws === null) !== (we === null) ||
    (ws && we && (we <= ws || start_at < ws || end_at > we))
  )
    invalid(
      "requested_window_start",
      "Supply a paired customer window containing this proposal.",
    );
  const cmd = {
    ...base,
    id: uuid(raw.id, "id"),
    scope_revision_id: uuid(raw.scope_revision_id, "scope_revision_id"),
    scope_version: version(raw.scope_version),
    start_at,
    end_at,
    requested_window_start: ws,
    requested_window_end: we,
    customer_commitment: choice(
      raw.customer_commitment,
      "customer_commitment",
      ["Unknown", "Proposed"],
    ),
    preparation_status: choice(raw.preparation_status, "preparation_status", [
      "Unknown",
      "Preparing",
      "Blocked",
    ]),
  };
  return sharedOperation(
    p,
    cmd,
    "ProposeVisit",
    (c) => visibleWorkOrder(c, p, id, "service.work_order.edit"),
    async (c, w) => {
      checkVersion(w.version, cmd.expected_version);
      const r = await scope(c, p, w, cmd.scope_revision_id);
      checkVersion(r.version, cmd.scope_version);
      if (r.id !== w.scope_revision_id)
        invalid(
          "scope_revision_id",
          "Propose attendance against the current scope.",
        );
      const site = await visible(c, p, "Site", w.site_id);
      const visit = await insert(c, "appointments", {
        ...meta(p, w),
        id: cmd.id,
        work_order_id: w.id,
        scope_revision_id: r.id,
        scope_version: r.version,
        policy_version_id: r.policy_version_id,
        site_timezone: site.timezone,
        start_at,
        end_at,
        requested_window_start: ws,
        requested_window_end: we,
        customer_commitment: cmd.customer_commitment,
        preparation_status: cmd.preparation_status,
      });
      await bump(c, p, w);
      return {
        ...visit,
        state: "Proposed",
        audit_details: {
          work_order_id: w.id,
          scope_revision_id: r.id,
          synthetic: true,
        },
      };
    },
    "Appointment",
    "AppointmentProposed",
  );
}
export async function readWorkOrder(p: Principal, id: string) {
  const c = database(),
    w = await visibleWorkOrder(c, p, id);
  const scopes = [];
  const ids = (
    await c.query(
      "SELECT id FROM ppo.scope_revisions WHERE workspace_id=$1 AND work_order_id=$2 ORDER BY revision DESC",
      [p.workspace_id, w.id],
    )
  ).rows;
  for (const r of ids) {
    const full = await scopeDetail(c, p, w, r.id);
    scopes.push({ ...full, readiness: await readiness(c, p, full) });
  }
  const current = scopes.find((r) => r.id === w.scope_revision_id) ?? null;
  const visits = (
    await c.query(
      "SELECT id,display_number,version,status,start_at,end_at,site_timezone,requested_window_start,requested_window_end,customer_commitment,preparation_status,dispatch_hold,scope_revision_id,scope_version,policy_version_id FROM ppo.appointments WHERE workspace_id=$1 AND work_order_id=$2 ORDER BY start_at,id",
      [p.workspace_id, w.id],
    )
  ).rows;
  for (const v of visits) {
    const r = scopes.find((s) => s.id === v.scope_revision_id);
    v.scope_review_required =
      v.scope_revision_id !== w.authorised_scope_revision_id ||
      r?.version !== v.scope_version;
    v.readiness = r ? await readiness(c, p, r, v.id) : [];
  }
  const site = await visible(c, p, "Site", w.site_id),
    customer = await visible(c, p, "Organisation", w.customer_id);
  const tickets = (
    await c.query(
      "SELECT t.id,t.display_number,t.summary,t.status,t.priority,l.issue_disposition FROM ppo.work_order_tickets l JOIN ppo.tickets t ON (t.workspace_id,t.id)=(l.workspace_id,l.ticket_id) WHERE l.workspace_id=$1 AND l.work_order_id=$2 ORDER BY t.id",
      [p.workspace_id, w.id],
    )
  ).rows;
  const owner = (
    await c.query(
      "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, w.service_owner_id],
    )
  ).rows[0];
  const actions = {
    can_edit: await hasPermission(
      c,
      p,
      "service.work_order.edit",
      w.company_id,
      w.site_id,
    ),
    can_authorise: await hasPermission(
      c,
      p,
      "service.scope.authorise",
      w.company_id,
      w.site_id,
    ),
    can_assess: await hasPermission(
      c,
      p,
      "service.readiness.assess",
      w.company_id,
      w.site_id,
    ),
  };
  return envelope([
    {
      ...w,
      site_name: site.display_name,
      site_timezone: site.timezone,
      customer_name: customer.display_name,
      owner_name: owner?.display_name,
      scopes,
      visits,
      tickets,
      blockers: current?.approved_at ? [] : await blockers(c, p, w, current),
      actions,
      financial_disposition: "PendingFinanceReview",
    },
  ]);
}
export async function listWorkOrders(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "service.work_order.read");
  const r = object(input, [
    "limit",
    "cursor",
    "q",
    "company_id",
    "site_id",
    "status",
  ]);
  const company = optionalId(r.company_id, "company_id"),
    site = optionalId(r.site_id, "site_id"),
    status = r.status
      ? choice(r.status, "status", ["Draft", "Authorised"])
      : null;
  if (company)
    await companyContext(c, p, company, site, "service.work_order.read");
  if (site) await visible(c, p, "Site", site);
  const pg = page(
    Object.fromEntries(
      Object.entries(r).filter(([k]) => ["limit", "cursor", "q"].includes(k)),
    ),
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      resource: "WorkOrder",
      company,
      site,
      status,
    },
  );
  const candidates = (
    await c.query(
      `SELECT w.id,w.version,w.display_number,w.status,w.scope_revision_id,w.authorised_scope_revision_id,s.display_name AS site_name,o.display_name AS customer_name,r.summary,r.revision,c.status AS coverage_status FROM ppo.work_orders w JOIN ppo.sites s ON (s.workspace_id,s.id)=(w.workspace_id,w.site_id) JOIN ppo.organisations o ON (o.workspace_id,o.id)=(w.workspace_id,w.customer_id) LEFT JOIN ppo.scope_revisions r ON (r.workspace_id,r.id)=(w.workspace_id,w.scope_revision_id) LEFT JOIN ppo.coverage_assessments c ON (c.workspace_id,c.id)=(r.workspace_id,r.coverage_assessment_id) WHERE w.workspace_id=$1 AND ${orderVisibility()} AND ($3::uuid IS NULL OR w.company_id=$3) AND ($4::uuid IS NULL OR w.site_id=$4) AND ($5::text IS NULL OR w.status=$5) AND ($6::uuid IS NULL OR w.id>$6) AND position(lower($7) IN lower(concat_ws(' ',w.display_number,s.display_name,o.display_name,r.summary)))>0 ORDER BY w.id`,
      [p.workspace_id, p.actor_id, company, site, status, pg.after, pg.q],
    )
  ).rows;
  const rows = [];
  for (const w of candidates) {
    try {
      await visibleWorkOrder(c, p, w.id);
      rows.push(w);
      if (rows.length > pg.limit) break;
    } catch (e) {
      if (!(e instanceof AppError) || e.status !== 404) throw e;
    }
  }
  return envelope(
    rows.slice(0, pg.limit),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}
