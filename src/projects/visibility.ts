import { scopeSql, type QueryClient } from "../platform/permissions";
import { visibility } from "../shared/reads";
// No imports of Project or Activity command services: reusable all-target access with no recursion.
export const projectVisibility = (alias = "pj") =>
  `${scopeSql(`${alias}.company_id`, `${alias}.site_id`, "project.read")} AND ${scopeSql(`${alias}.company_id`, `${alias}.site_id`)} AND ${scopeSql(`${alias}.company_id`, `${alias}.site_id`, "shared.internal.read")} AND EXISTS(SELECT 1 FROM ppo.organisations po WHERE po.workspace_id=${alias}.workspace_id AND po.id=${alias}.organisation_id AND ${visibility("Organisation", "po")}) AND EXISTS(SELECT 1 FROM ppo.sites ps WHERE ps.workspace_id=${alias}.workspace_id AND ps.id=${alias}.site_id AND ${visibility("Site", "ps")})`;
export const projectsAvailable = async (c: QueryClient) =>
  !!(await c.query("SELECT to_regclass('ppo.projects') AS relation")).rows[0]
    .relation;
