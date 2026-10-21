import type { QueryClient } from "../platform/permissions";
import { opportunityVisibility } from "../crm/context";
import { visibility } from "../shared/reads";
import { activityVisibility } from "../activities/activities";
import { projectVisibility } from "../projects/visibility";
import type { SourceType } from "./model";

export type SourceKey = { type: SourceType; record_id: string };
export const sourceKey = (s: SourceKey) => `${s.type}:${s.record_id}`;

// Each source uses its own current record access, never the anchor's permission as a proxy.
// Tasks, RAID and acceptance stages have the same read duty as their parent project.
export async function readableSources(c: QueryClient, workspace: string, person: string, sources: SourceKey[]) {
  const result = new Set<string>();
  const queries: Record<SourceType, string> = {
    Opportunity: `SELECT o.id FROM ppo.opportunities o WHERE o.workspace_id=$1 AND o.id=ANY($3::uuid[]) AND ${opportunityVisibility("o")}`,
    Organisation: `SELECT r.id FROM ppo.organisations r WHERE r.workspace_id=$1 AND r.id=ANY($3::uuid[]) AND ${visibility("Organisation", "r")}`,
    Activity: `SELECT a.id FROM ppo.activities a WHERE a.workspace_id=$1 AND a.id=ANY($3::uuid[]) AND a.access_class='Internal' AND ${activityVisibility("a", true, true, true)}`,
    Project: `SELECT pj.id FROM ppo.projects pj WHERE pj.workspace_id=$1 AND pj.id=ANY($3::uuid[]) AND ${projectVisibility("pj")}`,
    ProjectTask: `SELECT r.id FROM ppo.project_tasks r JOIN ppo.projects pj ON (pj.workspace_id,pj.id)=(r.workspace_id,r.project_id)
      WHERE r.workspace_id=$1 AND r.id=ANY($3::uuid[]) AND ${projectVisibility("pj")}`,
    ProjectRaid: `SELECT r.id FROM ppo.project_raid_entries r JOIN ppo.projects pj ON (pj.workspace_id,pj.id)=(r.workspace_id,r.project_id)
      WHERE r.workspace_id=$1 AND r.id=ANY($3::uuid[]) AND ${projectVisibility("pj")}`,
    AcceptanceStage: `SELECT r.id FROM ppo.acceptance_stages r JOIN ppo.projects pj ON (pj.workspace_id,pj.id)=(r.workspace_id,r.project_id)
      WHERE r.workspace_id=$1 AND r.id=ANY($3::uuid[]) AND ${projectVisibility("pj")}`,
  };
  for (const type of Object.keys(queries) as SourceType[]) {
    const ids = [...new Set(sources.filter(s => s.type === type).map(s => s.record_id))];
    // Bound even callers that combine several messages' stored citations.
    for (let offset = 0; offset < ids.length; offset += 100) {
      const rows = (await c.query(queries[type], [workspace, person, ids.slice(offset, offset + 100)])).rows;
      for (const row of rows) result.add(`${type}:${row.id}`);
    }
  }
  return result;
}
