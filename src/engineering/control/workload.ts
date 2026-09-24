import { scopeSql } from "../../platform/permissions";
// Shared by EN-01's filters and counts. An inaccessible source withholds the whole
// technical record; no title or count leaks through the coordination register.
export function controlVisibilitySql(alias: string) {
  return `NOT EXISTS (SELECT 1 FROM jsonb_path_query(${alias}.content,'$.**.source_ids[*]') source_key
    LEFT JOIN ppo.material_sources ms ON ms.workspace_id=p.workspace_id AND ms.package_id=p.id AND ms.id=(source_key #>> '{}')::uuid
    WHERE ms.id IS NULL OR (ms.restricted AND NOT ${scopeSql("p.company_id", "p.site_id", "engineering.technical.source")}))`;
}
export const authorWorkSql = `SELECT r.id FROM ppo.engineering_bases r WHERE r.workspace_id=p.workspace_id AND r.package_id=p.id AND r.owner_id=$2 AND r.state IN ('Draft','Returned') AND ${controlVisibilitySql("r")}
 UNION ALL SELECT r.id FROM ppo.engineering_queries r WHERE r.workspace_id=p.workspace_id AND r.package_id=p.id AND r.owner_id=$2 AND r.state IN ('Open','Returned') AND ${controlVisibilitySql("r")}
 UNION ALL SELECT r.id FROM ppo.engineering_submittals r WHERE r.workspace_id=p.workspace_id AND r.package_id=p.id AND r.owner_id=$2 AND r.state='Returned' AND ${controlVisibilitySql("r")}
 UNION ALL SELECT f.id FROM ppo.engineering_findings f JOIN ppo.engineering_reviews r ON (r.workspace_id,r.id)=(f.workspace_id,f.review_id) WHERE r.workspace_id=p.workspace_id AND r.package_id=p.id AND f.owner_id=$2 AND f.state='Open' AND ${controlVisibilitySql("r")}`;
export function activeIssueSql(alias: string) {
  return `NOT EXISTS (SELECT 1 FROM ppo.engineering_source_lineage l JOIN ppo.material_source_changes mc ON (mc.workspace_id,mc.source_id)=(l.workspace_id,l.source_id) WHERE l.workspace_id=p.workspace_id AND l.issue_id=${alias}.id) AND ${alias}.state='Issued' AND ${controlVisibilitySql(alias)} AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(${alias}.content->'source_ids') sid
    JOIN ppo.material_source_changes ch ON ch.workspace_id=p.workspace_id AND ch.source_id=sid::uuid)`;
}
export const controlCountsSql = `jsonb_build_object(
 'deliverables',(SELECT count(*) FROM ppo.engineering_deliverables r WHERE r.workspace_id=p.workspace_id AND r.package_id=p.id AND ${controlVisibilitySql("r")}),
 'blocked',(SELECT count(*) FROM ppo.engineering_deliverables r WHERE r.workspace_id=p.workspace_id AND r.package_id=p.id AND (r.content->>'prerequisite_evidence') IS NULL AND ${controlVisibilitySql("r")}),
 'author_waiting',(SELECT count(*) FROM (${authorWorkSql}) author_work),
 'reviews',(SELECT count(*) FROM ppo.engineering_reviews r WHERE r.workspace_id=p.workspace_id AND r.package_id=p.id AND r.state='Submitted' AND r.owner_id=$2 AND ${controlVisibilitySql("r")}),
 'released',(SELECT count(*) FROM ppo.engineering_issues r WHERE r.workspace_id=p.workspace_id AND r.package_id=p.id AND ${activeIssueSql("r")})
 )`;
