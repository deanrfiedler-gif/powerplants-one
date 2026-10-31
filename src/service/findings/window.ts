import { activityVisibility } from "../../activities/activities";
import { scopeSql, type QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";
import { visibility } from "../../shared/reads";
import { orderVisibility } from "../work-orders";
import type { findingQuery } from "./model";
import { candidateSql, type Candidate } from "./sources";

// Candidate admission mirrors native read authority before LIMIT. The owning
// readers remain the publication gate for every row and the continuation row.
// All aliases and SQL fragments are internal constants, never request input.
export async function candidateWindow(
  c: QueryClient,
  p: Principal,
  f: ReturnType<typeof findingQuery>,
  recurrence?: {
    equipment: string;
    check: string;
    procedure: string;
    at: string;
  },
) {
  const field = `(${scopeSql("a.company_id", "a.site_id", "field.read.own")}
    AND EXISTS(SELECT 1 FROM ppo.assignments x JOIN ppo.resources r ON (r.workspace_id,r.id)=(x.workspace_id,x.resource_id)
      WHERE x.workspace_id=a.workspace_id AND x.appointment_id=a.id AND x.active
      AND x.assignment_version=a.assignment_version AND r.user_id=$2 AND r.active)
    AND EXISTS(SELECT 1 FROM ppo.scope_revisions sr WHERE sr.workspace_id=a.workspace_id AND sr.id=a.scope_revision_id AND sr.work_order_id=w.id))`;
  const service = scopeSql(
    "a.company_id",
    "a.site_id",
    "service.work_order.edit",
  );
  return (
    await c.query<Candidate>(
      `
    WITH sources AS (${candidateSql}), contexts AS (
      SELECT f.*, COALESCE(d.host_id,i.appointment_id,report.appointment_id,CASE WHEN f.source='schedule' THEN f.parent_id END) AS appointment_id,
        COALESCE(ib.asset_id,b.asset_id) AS asset_id,
        d.check_key AS fault_bound_check,
        d.reference AS defect_reference,d.title AS defect_title,d.source_attempt_id,ir.evaluation,
        i.state AS incident_state,i.reporter_id,i.company_id AS incident_company,i.site_id AS incident_site,i.work_order_id AS incident_work_order,
        ia.instruction,report.display_number AS report_reference,report.company_id AS report_company,report.site_id AS report_site,
        rr.revision,rr.snapshot#>>'{completion,remaining_work}' AS remaining_work,cr.remarks,
        COALESCE(d.updated_at,i.updated_at,rr.submitted_at,cr.received_at) AS source_updated,
        ib.attempt_id AS inspection_binding,b.incident_id AS incident_binding
      FROM sources f
      LEFT JOIN ppo.inspection_defects d ON f.source='inspection' AND d.workspace_id=$1 AND d.id=f.id
      LEFT JOIN ppo.service_inspection_bindings ib ON (ib.workspace_id,ib.attempt_id)=(d.workspace_id,d.source_attempt_id)
      LEFT JOIN ppo.inspection_results ir ON (ir.workspace_id,ir.attempt_id,ir.check_key)=(d.workspace_id,d.source_attempt_id,d.check_key)
      LEFT JOIN ppo.incident_actions ia ON f.source='incident' AND ia.workspace_id=$1 AND ia.id=f.id
      LEFT JOIN ppo.incidents i ON (i.workspace_id,i.id)=(ia.workspace_id,ia.incident_id)
      LEFT JOIN LATERAL(SELECT asset_id,incident_id FROM ppo.incident_bindings WHERE workspace_id=i.workspace_id AND incident_id=i.id ORDER BY sequence DESC LIMIT 1) b ON true
      LEFT JOIN ppo.report_revisions rr ON f.source='completion' AND rr.workspace_id=$1 AND rr.id=f.id
      LEFT JOIN ppo.customer_responses cr ON f.source='response' AND cr.workspace_id=$1 AND cr.id=f.id
      LEFT JOIN ppo.service_reports report ON report.workspace_id=$1 AND report.id=COALESCE(rr.report_id,cr.report_id)
      WHERE ($3::text IS NULL OR f.source=$3)
    )
    SELECT f.source,f.id,f.parent_id,f.activity_id FROM contexts f
    JOIN ppo.appointments a ON a.workspace_id=$1 AND a.id=f.appointment_id
    JOIN ppo.work_orders w ON (w.workspace_id,w.id)=(a.workspace_id,a.work_order_id)
    JOIN ppo.sites s ON (s.workspace_id,s.id)=(a.workspace_id,a.site_id)
    LEFT JOIN ppo.assets e ON e.workspace_id=$1 AND e.id=f.asset_id
    LEFT JOIN ppo.activities task ON task.workspace_id=$1 AND task.id=f.activity_id
    LEFT JOIN ppo.users owner ON (owner.workspace_id,owner.id)=(task.workspace_id,task.owner_id)
    WHERE ${orderVisibility("w")} AND ${scopeSql("a.company_id", "a.site_id", "schedule.read")} AND ${visibility("Site", "s")}
      AND NOT EXISTS(SELECT 1 FROM ppo.scope_revisions sr JOIN ppo.scope_assets sa ON (sa.workspace_id,sa.scope_revision_id)=(sr.workspace_id,sr.id)
        WHERE sr.workspace_id=w.workspace_id AND sr.work_order_id=w.id AND NOT EXISTS(
          SELECT 1 FROM ppo.assets historic WHERE historic.workspace_id=sa.workspace_id AND historic.id=sa.asset_id AND ${visibility("Asset", "historic")}))
      AND (f.asset_id IS NULL OR (e.id IS NOT NULL AND ${visibility("Asset", "e")}))
      AND (f.activity_id IS NULL OR (task.id IS NOT NULL AND task.company_id=a.company_id AND task.site_id=a.site_id AND ${activityVisibility("task", true, true, true)}))
      AND CASE f.source
        WHEN 'inspection' THEN f.inspection_binding IS NOT NULL AND
          ((${scopeSql("a.company_id", "a.site_id", "report.read")} AND ${service} AND w.service_owner_id=$2) OR ${field})
        WHEN 'incident' THEN f.incident_binding IS NOT NULL AND f.incident_company=a.company_id AND f.incident_site=a.site_id AND f.incident_work_order=w.id
          AND (f.incident_state<>'Draft' OR f.reporter_id=$2) AND ${scopeSql("a.company_id", "a.site_id", "incident.read")} AND (${service} OR ${field})
        WHEN 'schedule' THEN true
        ELSE ${scopeSql("a.company_id", "a.site_id", "report.read")} AND ${scopeSql("f.report_company", "f.report_site", "report.read")}
          AND (${scopeSql("f.report_company", "f.report_site", "service.work_order.edit")} OR ${field}) END
      AND ($10::uuid IS NULL OR (f.source='inspection' AND EXISTS (
        SELECT 1 FROM ppo.inspection_defect_attempts dl
        JOIN ppo.inspection_attempts obs ON (obs.workspace_id,obs.id)=(dl.workspace_id,dl.attempt_id)
        JOIN ppo.service_inspection_bindings ob ON (ob.workspace_id,ob.attempt_id)=(obs.workspace_id,obs.id)
        JOIN ppo.service_inspection_templates ot ON (ot.workspace_id,ot.id)=(ob.workspace_id,ob.template_id)
        JOIN ppo.inspection_results ores ON (ores.workspace_id,ores.attempt_id,ores.check_key)=(obs.workspace_id,obs.id,f.fault_bound_check)
        JOIN LATERAL jsonb_array_elements(obs.plan) WITH ORDINALITY pc(definition,ordinality) ON pc.definition->>'key'=ores.check_key
        WHERE dl.workspace_id=$1 AND dl.defect_id=f.id AND ob.asset_id=$10 AND ot.procedure_key=$13
          AND ot.checks->((pc.ordinality-1)::int)->>'key'=$11 AND ores.evaluation='Fail'
          AND obs.occurred_at < $12::timestamptz AND obs.occurred_at >= $12::timestamptz - interval '2160 hours'
      )))
      AND ($4::uuid IS NULL OR a.company_id=$4) AND ($5::uuid IS NULL OR a.site_id=$5) AND ($6::uuid IS NULL OR task.owner_id=$6)
      AND strpos(lower(concat_ws(' ',a.display_number,
        CASE f.source WHEN 'inspection' THEN a.display_number||' · '||f.defect_reference
          WHEN 'completion' THEN f.report_reference||' · revision '||f.revision
          WHEN 'response' THEN f.report_reference ELSE a.display_number END,
        CASE f.source WHEN 'inspection' THEN f.defect_title||CASE f.evaluation
          WHEN 'NotTested' THEN ' · required check not tested' WHEN 'UnableToAssess' THEN ' · required check not assessed' ELSE '' END
          WHEN 'incident' THEN f.instruction WHEN 'completion' THEN f.remaining_work WHEN 'response' THEN f.remarks ELSE task.summary END,
        s.display_name,e.display_number,task.summary,owner.display_name)),lower($7))>0
    ORDER BY GREATEST(f.source_updated,COALESCE(task.updated_at,a.updated_at)) DESC,f.source,f.id
    LIMIT $8 OFFSET $9`,
      [
        p.workspace_id,
        p.actor_id,
        f.source,
        f.company_id,
        f.site_id,
        f.owner_id,
        f.q,
        f.limit + 1,
        f.offset,
        recurrence?.equipment ?? null,
        recurrence?.check ?? null,
        recurrence?.at ?? null,
        recurrence?.procedure ?? null,
      ],
    )
  ).rows;
}
