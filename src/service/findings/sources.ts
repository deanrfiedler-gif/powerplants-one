import type { Principal } from "../../platform/identity";
import { unavailable } from "../../platform/errors";
import type { QueryClient } from "../../platform/permissions";
import { visible } from "../../shared/reads";
import { visibleActivity } from "../../activities/activities";
import { activityRequirements } from "../../activities/requirements";
import { serviceInspectionAccess } from "../../inspections/service-context";
import {
  access as incidentAccess,
  latestBinding,
} from "../../incidents/context";
import { reportContext } from "../../reports/context";
import { visibleAppointment } from "../../scheduling/planner";
import { AppError } from "../../platform/errors";
import { followUpState, type Finding, type FindingSource } from "./model";

export type Candidate = {
  source: FindingSource;
  id: string;
  parent_id: string;
  activity_id: string | null;
};

// Only identifiers are discovered here. Every payload and every count is gated
// by the owning source's native authority below, before filtering or paging.
export const nativeCandidateSql = `
 SELECT 'inspection' AS source,d.id,d.host_id AS parent_id,d.activity_id FROM ppo.inspection_defects d
 WHERE d.workspace_id=$1 AND d.host_type='ServiceAppointment'
 UNION ALL
 SELECT 'incident',a.id,a.incident_id,a.activity_id FROM ppo.incident_actions a WHERE a.workspace_id=$1
 UNION ALL
 SELECT 'completion',r.id,r.report_id,(r.snapshot#>>'{completion,follow_up_activity_id}')::uuid
 FROM ppo.report_revisions r WHERE r.workspace_id=$1
 AND r.snapshot#>>'{completion,scope_outcome}' IN ('Partial','UnableToProceed')
 UNION ALL
 SELECT 'response',r.id,r.report_id,r.follow_up_activity_id FROM ppo.customer_responses r
 WHERE r.workspace_id=$1 AND r.response<>'Accepted'
 UNION ALL
 SELECT 'schedule',f.activity_id,f.appointment_id,f.activity_id FROM ppo.schedule_follow_ups f WHERE f.workspace_id=$1`;

export const candidateSql = `SELECT n.source,n.id,n.parent_id,COALESCE(n.activity_id,b.activity_id) AS activity_id
 FROM (${nativeCandidateSql}) n LEFT JOIN ppo.service_finding_activity_bindings b
 ON b.workspace_id=$1 AND b.source=n.source AND b.source_id=n.id
 WHERE b.activity_id IS NULL OR (b.parent_id=n.parent_id AND (n.activity_id IS NULL OR n.activity_id=b.activity_id))`;

export async function authorise(c: QueryClient, p: Principal, row: Candidate) {
  let ctx: Awaited<ReturnType<typeof visibleAppointment>>;
  let assetId: string | null = null;
  let inspectionMode: "review" | "capture" = "review";
  if (row.source === "inspection") {
    try {
      ctx = await serviceInspectionAccess(c, p, row.parent_id, "review");
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      ctx = await serviceInspectionAccess(c, p, row.parent_id, "capture");
      inspectionMode = "capture";
    }
    const binding = (
      await c.query<{ asset_id: string }>(
        `SELECT b.asset_id FROM ppo.inspection_defects d
      JOIN ppo.service_inspection_bindings b ON (b.workspace_id,b.attempt_id)=(d.workspace_id,d.source_attempt_id)
      WHERE d.workspace_id=$1 AND d.id=$2`,
        [p.workspace_id, row.id],
      )
    ).rows[0];
    if (!binding) throw unavailable();
    assetId = binding.asset_id;
  } else if (row.source === "incident") {
    ctx = await incidentAccess(c, p, row.parent_id);
    assetId = (await latestBinding(c, p, row.parent_id)).asset_id;
  } else if (row.source === "completion" || row.source === "response") {
    ctx = await reportContext(c, p, row.parent_id);
  } else {
    ctx = await visibleAppointment(c, p, row.parent_id);
  }
  const equipment = assetId ? await visible(c, p, "Asset", assetId) : null;
  const activity = row.activity_id
    ? await visibleActivity(c, p, row.activity_id)
    : null;
  // The native source link is not a grant to an Activity from another context.
  if (
    activity &&
    (activity.company_id !== ctx.a.company_id ||
      activity.site_id !== ctx.a.site_id)
  )
    throw unavailable();
  const site = await visible(c, p, "Site", ctx.a.site_id);
  return { ctx, equipment, activity, site, inspectionMode };
}

export async function project(
  c: QueryClient,
  p: Principal,
  row: Candidate,
): Promise<Finding> {
  const { ctx, equipment, activity, site, inspectionMode } = await authorise(
    c,
    p,
    row,
  );
  const owner = activity
    ? (
        await c.query<{ display_name: string }>(
          "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, activity.owner_id],
        )
      ).rows[0]
    : null;
  const result: Finding = {
    id: `${row.source}:${row.id}`,
    source: row.source,
    source_id: row.id,
    source_record: {
      id: row.parent_id,
      reference: ctx.a.display_number,
      version: ctx.a.version,
      href: `/service/appointments/${ctx.a.id}`,
    },
    appointment: { id: ctx.a.id, reference: ctx.a.display_number },
    work_order: { id: ctx.w.id, reference: ctx.w.display_number },
    company_id: ctx.a.company_id,
    site: {
      id: ctx.a.site_id,
      name: String(site.display_name),
      timezone: String(site.timezone),
    },
    equipment: equipment
      ? {
          id: String(equipment.id),
          reference: String(equipment.display_number),
        }
      : null,
    what_remains: activity?.summary ?? "Source follow-up requires review",
    native_state: activity?.status ?? "Unknown",
    state: followUpState(activity?.status),
    action: activity
      ? {
          id: activity.id,
          version: activity.version,
          summary: activity.summary,
          required_evidence: await activityRequirements(c, p, activity.id),
          status: activity.status,
          owner_id: activity.owner_id,
          owner_name: owner?.display_name ?? "Unknown",
          due_at: activity.due_at?.toISOString() ?? null,
          due_date_only: activity.due_date_only ?? false,
          outcome: activity.outcome,
          cancellation_reason: activity.cancellation_reason,
          href: `/work/${activity.id}`,
        }
      : null,
    overdue: false,
    closes_when: "Resolve the source follow-up through its owning workflow.",
    closure_authority: "ServiceDisposition",
    updated_at: (activity?.updated_at ?? ctx.a.updated_at).toISOString(),
  };
  const newer = (at: Date) => {
    if (at.toISOString() > result.updated_at)
      result.updated_at = at.toISOString();
  };
  if (row.source === "inspection") {
    const d = (
      await c.query<{
        reference: string;
        version: number;
        title: string;
        state: string;
        updated_at: Date;
        evaluation: string | null;
      }>(
        `SELECT d.reference,d.version,d.title,d.state,d.updated_at,r.evaluation FROM ppo.inspection_defects d
       LEFT JOIN ppo.inspection_results r ON (r.workspace_id,r.attempt_id,r.check_key)=(d.workspace_id,d.source_attempt_id,d.check_key)
       WHERE d.workspace_id=$1 AND d.id=$2`,
        [p.workspace_id, row.id],
      )
    ).rows[0];
    result.source_record = {
      id: row.id,
      reference: `${ctx.a.display_number} · ${d.reference}`,
      version: d.version,
      href: `/${inspectionMode === "capture" ? "my-jobs" : "service"}/inspections?appointment_id=${ctx.a.id}`,
    };
    result.what_remains =
      d.evaluation && ["NotTested", "UnableToAssess"].includes(d.evaluation)
        ? `${d.title} · required check ${d.evaluation === "NotTested" ? "not tested" : "not assessed"}`
        : d.title;
    result.native_state = d.state;
    result.state =
      d.state === "Closed"
        ? "Closed"
        : d.state === "CorrectionRecorded"
          ? "WaitingReview"
          : followUpState(activity?.status);
    result.closure_authority = "InspectionReview";
    result.closes_when =
      "The native inspection workflow accepts the exact passing retest and closes this defect. Completing its Activity does not close it.";
    newer(d.updated_at);
  } else if (row.source === "incident") {
    const d = (
      await c.query<{
        state: string;
        version: number;
        updated_at: Date;
        instruction: string;
        accepted: boolean;
      }>(
        `SELECT i.state,i.version,i.updated_at,a.instruction,(a.accepted_evidence_id IS NOT NULL) AS accepted
       FROM ppo.incident_actions a JOIN ppo.incidents i ON (i.workspace_id,i.id)=(a.workspace_id,a.incident_id)
       WHERE a.workspace_id=$1 AND a.id=$2`,
        [p.workspace_id, row.id],
      )
    ).rows[0];
    result.source_record = {
      id: row.parent_id,
      reference: ctx.a.display_number,
      version: d.version,
      href: `/service/incidents/${row.parent_id}`,
    };
    result.what_remains = d.instruction;
    result.native_state = d.state;
    result.state =
      d.state === "Closed"
        ? "Closed"
        : d.accepted
          ? "WaitingReview"
          : followUpState(activity?.status);
    result.closure_authority = "IncidentClosure";
    result.closes_when =
      "The incident reviewer accepts the action evidence and independently closes the incident. Activity completion alone does not release its hold.";
    newer(d.updated_at);
  } else if (row.source === "completion") {
    const d = (
      await c.query<{
        display_number: string;
        version: number;
        revision: number;
        submitted_at: Date;
        remaining_work: string;
        scope_outcome: string;
        current: boolean;
      }>(
        `SELECT s.display_number,s.version,r.revision,r.submitted_at,r.snapshot#>>'{completion,remaining_work}' AS remaining_work,
       r.snapshot#>>'{completion,scope_outcome}' AS scope_outcome,(s.current_revision_id=r.id) AS current
       FROM ppo.report_revisions r JOIN ppo.service_reports s ON (s.workspace_id,s.id)=(r.workspace_id,r.report_id)
       WHERE r.workspace_id=$1 AND r.id=$2`,
        [p.workspace_id, row.id],
      )
    ).rows[0];
    result.source_record = {
      id: row.parent_id,
      reference: `${d.display_number} · revision ${d.revision}`,
      version: d.revision,
      href: `/service/reports/${row.parent_id}`,
    };
    result.what_remains = d.remaining_work;
    result.native_state = d.scope_outcome;
    if (!d.current) result.state = "Superseded";
    result.closes_when =
      "Service disposes the remaining scope in its native records. A completed or cancelled follow-up does not prove the reported work complete; a successor report revision supersedes this observation.";
    newer(d.submitted_at);
  } else if (row.source === "response") {
    const d = (
      await c.query<{
        display_number: string;
        version: number;
        response: string;
        remarks: string;
        received_at: Date;
        superseded: boolean;
      }>(
        `SELECT s.display_number,s.version,r.response,r.remarks,r.received_at,
       EXISTS(SELECT 1 FROM ppo.customer_response_contexts n WHERE n.workspace_id=r.workspace_id AND n.supersedes_response_id=r.id) AS superseded
       FROM ppo.customer_responses r JOIN ppo.service_reports s ON (s.workspace_id,s.id)=(r.workspace_id,r.report_id)
       WHERE r.workspace_id=$1 AND r.id=$2`,
        [p.workspace_id, row.id],
      )
    ).rows[0];
    result.source_record = {
      id: row.parent_id,
      reference: d.display_number,
      version: null,
      href: `/service/reports/${row.parent_id}`,
    };
    result.what_remains = d.remarks;
    result.native_state = d.response;
    if (d.superseded) result.state = "Superseded";
    result.closure_authority = "ResponseCorrection";
    result.closes_when =
      "Review the exact customer response and its follow-up in Service. Only an explicit response correction supersedes this observation; completing an Activity does not change the customer's response.";
    newer(d.received_at);
  } else {
    const d = (
      await c.query<{ schedule_version: number; consequence: string }>(
        "SELECT schedule_version,consequence FROM ppo.schedule_follow_ups WHERE workspace_id=$1 AND activity_id=$2",
        [p.workspace_id, row.id],
      )
    ).rows[0];
    result.source_record.version = d.schedule_version;
    result.native_state = activity!.status;
    if (activity!.status === "Completed") result.state = "Closed";
    result.closure_authority = "SchedulingFollowUp";
    result.closes_when =
      "The native scheduling follow-up Activity is completed with an outcome. This does not change the booking or establish customer acknowledgement. Cancellation remains an unresolved disposition.";
  }
  return result;
}
