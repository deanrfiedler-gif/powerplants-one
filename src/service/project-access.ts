import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { invalid } from "../shared/validation";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { projectVisibility } from "../projects/visibility";
import { linkRefusal, type LinkedProject } from "./project-field-work-model";
// B1: Service reads and commands reach a linked project through the Projects visibility rule only.
// No Project command service is imported, so Service and Projects stay free of import cycles.
export type ProjectFacts = LinkedProject & {
  version: number;
  company_id: string;
  organisation_id: string;
  site_id: string;
};
const select =
  "SELECT pj.id,pj.version,pj.display_number,pj.title,pj.lifecycle,pj.company_id,pj.organisation_id,pj.site_id FROM ppo.projects pj";
export async function readableProject(
  c: QueryClient,
  p: Principal,
  id: string,
  lock = false,
): Promise<ProjectFacts | null> {
  return (
    ((
      await c.query(
        `${select} WHERE pj.workspace_id=$1 AND pj.id=$3 AND ${projectVisibility("pj")}${lock ? " FOR SHARE OF pj" : ""}`,
        [p.workspace_id, p.actor_id, id],
      )
    ).rows[0] as ProjectFacts | undefined) ?? null
  );
}
// Linking needs project.edit on the project as well as its read; an unreadable project is unavailable.
export async function editableProject(
  c: QueryClient,
  p: Principal,
  id: string,
  lock = false,
) {
  const row = await readableProject(c, p, id, lock);
  if (
    !row ||
    !(await hasPermission(c, p, "project.edit", row.company_id, row.site_id))
  )
    throw unavailable();
  return row;
}
// Upgrade proofs read work orders and projects against schemas older than migration 0122.
export async function projectLinkAvailable(c: QueryClient) {
  return !!(
    await c.query(
      "SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('ppo.work_orders') AND attname='project_id' AND NOT attisdropped",
    )
  ).rowCount;
}
export const linkedProject = (row: ProjectFacts): LinkedProject => ({
  id: row.id,
  display_number: row.display_number,
  title: row.title,
  lifecycle: row.lifecycle,
});

export function refuse(refusal: ReturnType<typeof linkRefusal>) {
  if (!refusal) return;
  if (refusal.field) invalid(refusal.field, refusal.message);
  throw new AppError(refusal.status, refusal.code, refusal.message);
}
// Creating a work order with a project link: the same authority and rules as linking.
export async function authoriseCreateLink(
  c: QueryClient,
  p: Principal,
  project_id: string,
  order: { company_id: string; customer_id: string },
) {
  const project = await editableProject(c, p, project_id);
  refuse(
    linkRefusal("link", {
      work_order: { ...order, project_id: null },
      project: { ...project, lifecycle: "Active" },
      visit_started: false,
    }),
  );
}
export async function checkCreateLink(
  c: QueryClient,
  p: Principal,
  project_id: string,
) {
  const project = await editableProject(c, p, project_id, true);
  if (project.lifecycle !== "Active")
    throw new AppError(
      409,
      "ClosedProject",
      "This project is closed. Reopen it through Acceptance & closeout before raising field work for it.",
    );
}

// The work order read shows its project only to someone who may read that project.
export async function workOrderProject(
  c: QueryClient,
  p: Principal,
  projectId: string | null | undefined,
): Promise<LinkedProject | null> {
  if (!projectId) return null;
  const row = await readableProject(c, p, projectId);
  return row ? linkedProject(row) : null;
}
