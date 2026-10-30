import type { PoolClient } from "pg";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { invalid, object, uuid } from "../shared/validation";
import {
  editableProject,
  projectLinkAvailable,
  refuse,
  type ProjectFacts,
} from "./project-access";
import {
  linkRefusal,
  type FieldWork,
  type FieldWorkCandidate,
  type FieldWorkItem,
} from "./project-field-work-model";
import {
  orderVisibility,
  visibleWorkOrder,
  type WorkOrder,
} from "./work-orders";
import { commandFields } from "./work-scope-validation";

// B1 (project delivery billing decision R1). A work order belongs to at most one project. Linking
// and unlinking need project.edit on the project AND service.work_order.edit on the work order; no
// new capability or grant exists. Each record keeps its own read permission.

function linkFields(id: string, input: unknown) {
  const { raw, base } = commandFields(id, input, [
    "project_id",
    "expected_project_version",
  ]);
  const v = raw.expected_project_version;
  if (!Number.isSafeInteger(v) || Number(v) < 1)
    invalid(
      "expected_project_version",
      "A positive project version is required.",
    );
  return {
    ...base,
    project_id: uuid(raw.project_id, "project_id"),
    expected_project_version: Number(v),
  };
}
async function visitStarted(c: QueryClient, p: Principal, workOrderId: string) {
  return !!(
    await c.query(
      "SELECT 1 FROM ppo.appointments WHERE workspace_id=$1 AND work_order_id=$2 AND actual_start_at IS NOT NULL LIMIT 1",
      [p.workspace_id, workOrderId],
    )
  ).rowCount;
}
async function changeLink(
  p: Principal,
  id: string,
  input: unknown,
  action: "link" | "unlink",
) {
  const cmd = linkFields(id, input);
  return sharedOperation(
    p,
    cmd,
    action === "link" ? "LinkWorkOrderProject" : "UnlinkWorkOrderProject",
    // Current permission on both records precedes any receipt replay.
    async (c) => ({
      order: await visibleWorkOrder(
        c,
        p,
        cmd.work_order_id,
        "service.work_order.edit",
      ),
      project: await editableProject(c, p, cmd.project_id),
    }),
    async (c: PoolClient, { order }) => {
      const w = (
        await c.query(
          "SELECT * FROM ppo.work_orders WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
          [p.workspace_id, order.id],
        )
      ).rows[0] as WorkOrder & { project_id: string | null };
      // Share-lock the project so a concurrent closure cannot pass this check unseen.
      const project = await editableProject(c, p, cmd.project_id, true);
      if (w.version !== cmd.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "This work order changed. Refresh to compare its saved version.",
        );
      if (project.version !== cmd.expected_project_version)
        throw new AppError(
          409,
          "VersionConflict",
          "This project changed. Refresh to compare its saved version.",
        );
      refuse(
        linkRefusal(action, {
          work_order: w,
          project,
          visit_started: await visitStarted(c, p, w.id),
        }),
      );
      const r = (
        await c.query(
          "UPDATE ppo.work_orders SET project_id=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [
            p.workspace_id,
            w.id,
            action === "link" ? project.id : null,
            p.actor_id,
          ],
        )
      ).rows[0];
      return {
        ...r,
        state: r.status,
        audit_details: {
          project_id: project.id,
          project_version: project.version,
          link: action === "link" ? "Linked" : "Unlinked",
          synthetic: true,
        },
      };
    },
    "WorkOrder",
    action === "link" ? "WorkOrderProjectLinked" : "WorkOrderProjectUnlinked",
  );
}
export const linkWorkOrderProject = (
  p: Principal,
  id: string,
  input: unknown,
) => changeLink(p, id, input, "link");
export const unlinkWorkOrderProject = (
  p: Principal,
  id: string,
  input: unknown,
) => changeLink(p, id, input, "unlink");

const itemSelect = `SELECT w.id,w.display_number,w.status,w.version,w.company_id,w.site_id,s.display_name AS site_name,r.summary,
 EXISTS(SELECT 1 FROM ppo.appointments a WHERE a.workspace_id=w.workspace_id AND a.work_order_id=w.id AND a.actual_start_at IS NOT NULL) AS visit_started
 FROM ppo.work_orders w JOIN ppo.sites s ON (s.workspace_id,s.id)=(w.workspace_id,w.site_id)
 LEFT JOIN ppo.scope_revisions r ON (r.workspace_id,r.id)=(w.workspace_id,w.scope_revision_id)`;
type ItemRow = FieldWorkCandidate & {
  company_id: string;
  site_id: string;
  visit_started: boolean;
};
// Keep only rows the caller may read in full (assets and linked requests included).
async function readable(c: QueryClient, p: Principal, rows: ItemRow[]) {
  const kept: ItemRow[] = [];
  for (const row of rows)
    try {
      await visibleWorkOrder(c, p, row.id);
      kept.push(row);
    } catch (e) {
      if (!(e instanceof AppError) || e.status !== 404) throw e;
    }
  return kept;
}

// The project read lists linked work orders filtered by the caller's own work-order read
// permission. Hidden work orders are omitted and never counted.
export async function projectFieldWork(
  c: QueryClient,
  p: Principal,
  project: {
    id: string;
    company_id: string;
    site_id: string;
    lifecycle: string;
  },
): Promise<FieldWork> {
  if (!(await projectLinkAvailable(c))) return { items: [], can_link: false };
  const editProject =
    project.lifecycle === "Active" &&
    (await hasPermission(
      c,
      p,
      "project.edit",
      project.company_id,
      project.site_id,
    ));
  const can_link =
    editProject && (await hasPermission(c, p, "service.work_order.edit"));
  if (!(await hasPermission(c, p, "service.work_order.read")))
    return { items: [], can_link: false };
  const rows = await readable(
    c,
    p,
    (
      await c.query<ItemRow>(
        `${itemSelect} WHERE w.workspace_id=$1 AND w.project_id=$3 AND ${orderVisibility()} ORDER BY w.display_number,w.id`,
        [p.workspace_id, p.actor_id, project.id],
      )
    ).rows,
  );
  const items: FieldWorkItem[] = [];
  for (const { company_id, site_id, ...row } of rows)
    items.push({
      ...row,
      can_unlink:
        editProject &&
        !row.visit_started &&
        (await hasPermission(
          c,
          p,
          "service.work_order.edit",
          company_id,
          site_id,
        )),
    });
  return { items, can_link };
}

// Work orders the caller could link: same company and customer, unlinked, no started visit, and
// editable and readable by the caller. A bounded page, searched by reference or scope summary.
export async function fieldWorkCandidates(
  p: Principal,
  projectId: string,
  input: unknown = {},
) {
  const q = object(input, ["q"]),
    text = q.q ?? "";
  if (typeof text !== "string" || text.length > 200)
    invalid("q", "Search up to 200 characters.");
  return transaction(async (c) => {
    const project: ProjectFacts = await editableProject(
      c,
      p,
      uuid(projectId, "project_id"),
    );
    if (
      project.lifecycle !== "Active" ||
      !(await hasPermission(c, p, "service.work_order.edit")) ||
      !(await projectLinkAvailable(c))
    )
      return {
        items: [] as FieldWorkCandidate[],
        has_more: false,
        observed_at: new Date().toISOString(),
      };
    const found = (
      await c.query<ItemRow>(
        `${itemSelect} WHERE w.workspace_id=$1 AND w.company_id=$3 AND w.customer_id=$4 AND w.project_id IS NULL
        AND ${orderVisibility()} AND NOT EXISTS(SELECT 1 FROM ppo.appointments a WHERE a.workspace_id=w.workspace_id AND a.work_order_id=w.id AND a.actual_start_at IS NOT NULL)
        AND ($5='' OR position(lower($5) IN lower(concat_ws(' ',w.display_number,r.summary)))>0)
        ORDER BY w.display_number,w.id LIMIT 101`,
        [
          p.workspace_id,
          p.actor_id,
          project.company_id,
          project.organisation_id,
          text.trim(),
        ],
      )
    ).rows;
    const items: FieldWorkCandidate[] = [];
    for (const row of await readable(c, p, found.slice(0, 100)))
      if (
        await hasPermission(
          c,
          p,
          "service.work_order.edit",
          row.company_id,
          row.site_id,
        )
      )
        items.push({
          id: row.id,
          display_number: row.display_number,
          status: row.status,
          version: row.version,
          site_name: row.site_name,
          summary: row.summary,
        });
    // A bounded page: has_more says more unlinked work orders matched, not how many.
    return {
      items,
      has_more: found.length > 100,
      observed_at: new Date().toISOString(),
    };
  });
}
