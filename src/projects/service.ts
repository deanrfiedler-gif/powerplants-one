import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { database, transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import { sharedOperation } from "../platform/operations";
import { companyContext, scopedOwner } from "../shared/authority";
import { visibility, visible } from "../shared/reads";
import { object, uuid, optionalId, invalid } from "../shared/validation";
import { parseProject, parseTask } from "./validation";
import {
  hasCycle,
  type Project,
  type Task,
  type Owner,
  type Schedule,
} from "./model";

type ProjectRow = Omit<Project, "updated_at" | "can_edit"> & {
  updated_at: Date;
  workspace_id: string;
};
const projectSelect = `SELECT p.*,p.target_date::text AS target_date,o.display_name AS customer_name,s.display_name AS site_name,s.timezone,u.display_name AS coordinator_name FROM ppo.projects p JOIN ppo.organisations o ON (o.workspace_id,o.id)=(p.workspace_id,p.organisation_id) JOIN ppo.sites s ON (s.workspace_id,s.id)=(p.workspace_id,p.site_id) JOIN ppo.users u ON (u.workspace_id,u.id)=(p.workspace_id,p.coordinator_id)`;
const projectVisibility = () =>
  `${scopeSql("p.company_id", "p.site_id", "project.read")} AND ${scopeSql("p.company_id", "p.site_id")} AND ${scopeSql("p.company_id", "p.site_id", "shared.internal.read")} AND ${visibility("Organisation", "o")} AND ${visibility("Site", "s")}`;
async function projectRow(
  c: QueryClient,
  p: Principal,
  id: string,
  edit = false,
) {
  const row = (
    await c.query<ProjectRow>(
      `${projectSelect} WHERE p.workspace_id=$1 AND p.id=$3 AND ${projectVisibility()}`,
      [p.workspace_id, p.actor_id, uuid(id, "project_id")],
    )
  ).rows[0];
  if (
    !row ||
    (edit &&
      !(await hasPermission(c, p, "project.edit", row.company_id, row.site_id)))
  )
    throw unavailable();
  return row;
}
function projection(row: ProjectRow, can_edit: boolean): Project {
  const {
    id,
    version,
    display_number,
    title,
    company_id,
    organisation_id,
    site_id,
    coordinator_id,
    customer_name,
    site_name,
    coordinator_name,
    timezone,
    target_date,
    updated_at,
  } = row;
  return {
    id,
    version,
    display_number,
    title,
    company_id,
    organisation_id,
    site_id,
    coordinator_id,
    customer_name,
    site_name,
    coordinator_name,
    timezone,
    target_date,
    updated_at: updated_at.toISOString(),
    can_edit,
  };
}
function pageInput(value: unknown) {
  const q = object(value, ["q", "limit", "cursor"]),
    text = q.q ?? "",
    limit = Number(q.limit ?? 50),
    cursor = optionalId(q.cursor, "cursor");
  if (typeof text !== "string" || text.length > 200)
    invalid("q", "Search up to 200 characters.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    invalid("limit", "Choose a page size from 1 to 100.");
  return { q: text.trim().toLowerCase(), limit, cursor };
}
export async function listProjects(p: Principal, input: unknown) {
  const q = pageInput(input),
    c = database();
  await requireCapability(c, p, "project.read");
  const rows = (
    await c.query<ProjectRow>(
      `${projectSelect} WHERE p.workspace_id=$1 AND ${projectVisibility()} AND ($3::uuid IS NULL OR p.id>$3) AND ($4='' OR position($4 in lower(p.title||' '||p.display_number||' '||p.id::text||' '||o.display_name||' '||s.display_name))>0) ORDER BY p.id LIMIT $5`,
      [p.workspace_id, p.actor_id, q.cursor, q.q, q.limit + 1],
    )
  ).rows;
  return {
    items: rows.slice(0, q.limit).map((r) => projection(r, false)),
    next_cursor: rows.length > q.limit ? rows[q.limit - 1].id : null,
    observed_at: new Date().toISOString(),
    completeness: "Page",
  };
}
async function tasksFor(
  c: QueryClient,
  p: Principal,
  id: string,
): Promise<Task[]> {
  return (
    await c.query<Task>(
      `SELECT t.id,t.version,t.title,t.phase,t.status,t.milestone,t.start_date::text,t.finish_date::text,t.progress,t.note,t.owner_id,
    CASE WHEN pe.id IS NULL OR ${visibility("Person", "pe")} THEN t.external_owner_id ELSE NULL END AS external_owner_id,
    CASE WHEN t.external_owner_id IS NOT NULL THEN CASE WHEN ${visibility("Person", "pe")} THEN pe.display_name ELSE 'Unavailable owner' END ELSE u.display_name END AS owner_name,
    (t.external_owner_id IS NOT NULL AND NOT ${visibility("Person", "pe")}) AS owner_unavailable,
    coalesce((SELECT jsonb_agg(jsonb_build_object('task_id',d.predecessor_id,'kind',d.kind) ORDER BY d.predecessor_id) FROM ppo.project_dependencies d WHERE d.workspace_id=t.workspace_id AND d.project_id=t.project_id AND d.task_id=t.id),'[]'::jsonb) AS dependencies
    FROM ppo.project_tasks t LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.owner_id) LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(t.workspace_id,t.external_owner_id)
    WHERE t.workspace_id=$1 AND t.project_id=$3 ORDER BY t.created_at,t.id`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
}
export async function readSchedule(
  p: Principal,
  id: string,
  input: unknown = {},
): Promise<Schedule> {
  object(input, []);
  return transaction(async (c) => {
    // A schedule is one consistent aggregate; project commands lock this same workspace.
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const row = await projectRow(c, p, id);
    const can_edit = await hasPermission(
      c,
      p,
      "project.edit",
      row.company_id,
      row.site_id,
    );
    return {
      project: projection(row, can_edit),
      tasks: await tasksFor(c, p, id),
      observed_at: new Date().toISOString(),
    };
  });
}
async function authoriseContext(
  c: QueryClient,
  p: Principal,
  context: { company_id: string; organisation_id: string; site_id: string },
  cap: "project.create" | "project.read",
) {
  await companyContext(c, p, context.company_id, context.site_id, cap);
  for (const capability of ["project.read", "shared.internal.read"] as const)
    if (
      !(await hasPermission(
        c,
        p,
        capability,
        context.company_id,
        context.site_id,
      ))
    )
      throw unavailable();
  const customer = await visible(c, p, "Organisation", context.organisation_id);
  if (
    customer.company_id !== context.company_id ||
    !(
      await c.query(
        "SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND organisation_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",
        [
          p.workspace_id,
          context.company_id,
          context.site_id,
          context.organisation_id,
        ],
      )
    ).rowCount
  )
    throw unavailable();
}
async function event(
  c: PoolClient,
  p: Principal,
  id: string,
  command: { operation_id: string; reason: string },
  taskId?: string,
) {
  await c.query(
    `INSERT INTO ppo.project_schedule_events(id,workspace_id,company_id,project_id,created_by,updated_by,operation_id,project_version,event_type,reason,project_snapshot,task_snapshot,dependencies)
    SELECT $1,p.workspace_id,p.company_id,p.id,$2,$2,$3,p.version,$4,$5,to_jsonb(p),(SELECT to_jsonb(t) FROM ppo.project_tasks t WHERE t.workspace_id=p.workspace_id AND t.project_id=p.id AND t.id=$6),
    CASE WHEN $6::uuid IS NOT NULL THEN coalesce((SELECT jsonb_agg(jsonb_build_object('task_id',d.predecessor_id,'kind',d.kind) ORDER BY d.predecessor_id) FROM ppo.project_dependencies d WHERE d.workspace_id=p.workspace_id AND d.project_id=p.id AND d.task_id=$6),'[]'::jsonb) END
    FROM ppo.projects p WHERE p.workspace_id=$7 AND p.id=$8`,
    [
      randomUUID(),
      p.actor_id,
      command.operation_id,
      taskId ? "ProjectTaskSaved" : "ProjectCreated",
      command.reason,
      taskId ?? null,
      p.workspace_id,
      id,
    ],
  );
}
export async function createProject(p: Principal, value: unknown) {
  const command = parseProject(value);
  return sharedOperation(
    p,
    command,
    "CreateProject",
    async (c) => {
      await authoriseContext(c, p, command, "project.create");
      const owner = await scopedOwner(
        c,
        p,
        command.coordinator_id,
        command.company_id,
        command.site_id,
        "project.edit",
      );
      await authoriseContext(c, owner, command, "project.read");
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.projects WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, command.id],
          )
        ).rowCount
      )
        await projectRow(c, p, command.id);
    },
    async (c) => {
      const row = (
        await c.query(
          `INSERT INTO ppo.projects(id,workspace_id,company_id,created_by,updated_by,title,organisation_id,site_id,coordinator_id,target_date) VALUES($1,$2,$3,$4,$4,$5,$6,$7,$8,$9) RETURNING id,version,updated_at,'Active'::text AS state`,
          [
            command.id,
            p.workspace_id,
            command.company_id,
            p.actor_id,
            command.title,
            command.organisation_id,
            command.site_id,
            command.coordinator_id,
            command.target_date,
          ],
        )
      ).rows[0];
      await event(c, p, command.id, command);
      return row;
    },
    "Project",
    "ProjectCreated",
  );
}
export async function authoriseProjectReceipt(
  c: QueryClient,
  p: Principal,
  id: string,
  command: string,
) {
  const row = await projectRow(c, p, id);
  if (
    !(await hasPermission(
      c,
      p,
      command === "CreateProject" ? "project.create" : "project.edit",
      row.company_id,
      row.site_id,
    ))
  )
    throw unavailable();
}
export async function saveTask(p: Principal, id: string, value: unknown) {
  const command = parseTask(id, value);
  return sharedOperation(
    p,
    command,
    "SaveProjectTask",
    (c) => projectRow(c, p, id, true),
    async (c, project) => {
      if (project.version !== command.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "The project schedule changed. Your entries are retained. Review the latest schedule before saving again.",
        );
      if (command.owner_id) {
        const owner = await scopedOwner(
          c,
          p,
          command.owner_id,
          project.company_id,
          project.site_id,
          "project.read",
        );
        await projectRow(c, owner, id);
      }
      if (command.external_owner_id) {
        const contact = await visible(
          c,
          p,
          "Person",
          command.external_owner_id,
        );
        if (
          !contact.active ||
          !(
            await c.query(
              "SELECT 1 FROM ppo.relationships WHERE workspace_id=$1 AND company_id=$2 AND organisation_id=$3 AND person_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",
              [
                p.workspace_id,
                project.company_id,
                project.organisation_id,
                command.external_owner_id,
              ],
            )
          ).rowCount
        )
          throw unavailable();
      }
      const tasks = await tasksFor(c, p, id),
        existing = tasks.find((t) => t.id === command.id);
      if (!existing && tasks.length >= 1000)
        throw new AppError(
          422,
          "ScheduleCapacity",
          "This schedule has reached the current 1,000-item limit.",
        );
      if (
        command.dependencies.some((d) => !tasks.some((t) => t.id === d.task_id))
      )
        throw unavailable();
      const candidate = { id: command.id, dependencies: command.dependencies };
      if (hasCycle([...tasks.filter((t) => t.id !== command.id), candidate]))
        throw new AppError(
          422,
          "DependencyCycle",
          "These predecessors create a circular dependency. Remove the circular link.",
        );
      const result = (
        await c.query(
          "UPDATE ppo.projects SET version=version+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$1 AND id=$2 RETURNING id,version,updated_at,'Active'::text AS state",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0];
      const values = [
        command.id,
        p.workspace_id,
        project.company_id,
        id,
        result.version,
        p.actor_id,
        command.title,
        command.phase,
        command.status,
        command.milestone,
        command.start_date,
        command.finish_date,
        command.progress,
        command.note,
        command.owner_id,
        command.external_owner_id,
      ];
      if (existing)
        await c.query(
          `UPDATE ppo.project_tasks SET version=version+1,project_version=$5,updated_by=$6,updated_at=clock_timestamp(),title=$7,phase=$8,status=$9,milestone=$10,start_date=$11,finish_date=$12,progress=$13,note=$14,owner_id=$15,external_owner_id=$16 WHERE id=$1 AND workspace_id=$2 AND company_id=$3 AND project_id=$4`,
          values,
        );
      else
        await c.query(
          `INSERT INTO ppo.project_tasks(id,workspace_id,company_id,project_id,project_version,created_by,updated_by,title,phase,status,milestone,start_date,finish_date,progress,note,owner_id,external_owner_id) VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          values,
        );
      await c.query(
        "DELETE FROM ppo.project_dependencies WHERE workspace_id=$1 AND project_id=$2 AND task_id=$3",
        [p.workspace_id, id, command.id],
      );
      for (const dep of command.dependencies)
        await c.query(
          "INSERT INTO ppo.project_dependencies(workspace_id,project_id,task_id,predecessor_id,kind) VALUES($1,$2,$3,$4,$5)",
          [p.workspace_id, id, command.id, dep.task_id, dep.kind],
        );
      await event(c, p, id, command, command.id);
      return { ...result, audit_details: { task_id: command.id } };
    },
    "Project",
    "ProjectTaskSaved",
  );
}
export async function projectHistory(p: Principal, id: string, input: unknown) {
  const q = object(input, ["cursor"]),
    cursor = Number(q.cursor ?? 2147483647);
  if (!Number.isSafeInteger(cursor) || cursor < 1)
    invalid("cursor", "Invalid history page.");
  return transaction(async (c) => {
    await projectRow(c, p, id);
    const rows = (
      await c.query(
        `SELECT e.project_version,e.event_type,e.reason,e.created_at,u.display_name AS actor_name FROM ppo.project_schedule_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.created_by) WHERE e.workspace_id=$1 AND e.project_id=$2 AND e.project_version<$3 ORDER BY e.project_version DESC LIMIT 51`,
        [p.workspace_id, id, cursor],
      )
    ).rows;
    return {
      items: rows.slice(0, 50),
      next_cursor: rows.length > 50 ? String(rows[49].project_version) : null,
    };
  });
}
async function internalOwners(
  c: QueryClient,
  p: Principal,
  context: { company_id: string; site_id: string; organisation_id: string },
  q: string,
  coordinator: boolean,
): Promise<Owner[]> {
  const users = (
      await c.query<{ id: string; display_name: string }>(
        `SELECT u.id,u.display_name FROM ppo.users u WHERE u.workspace_id=$1 AND u.active AND position($2 in lower(u.display_name))>0 ORDER BY u.display_name,u.id`,
        [p.workspace_id, q],
      )
    ).rows,
    result: Owner[] = [];
  for (const u of users) {
    const candidate = { ...p, actor_id: u.id, display_name: u.display_name };
    try {
      await authoriseContext(c, candidate, context, "project.read");
      if (
        coordinator &&
        !(await hasPermission(
          c,
          candidate,
          "project.edit",
          context.company_id,
          context.site_id,
        ))
      )
        continue;
      result.push({ ...u, external: false });
      if (result.length === 51) break;
    } catch (e) {
      if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
    }
  }
  return result;
}
export async function projectOwners(p: Principal, id: string, input: unknown) {
  const q = pageInput(input),
    c = database(),
    project = await projectRow(c, p, id);
  const internal = await internalOwners(c, p, project, q.q, false);
  const external = (
    await c.query<Owner>(
      `SELECT pe.id,pe.display_name,true AS external FROM ppo.people pe WHERE pe.workspace_id=$1 AND pe.active AND ${visibility("Person", "pe")} AND position($3 in lower(pe.display_name))>0 AND EXISTS(SELECT 1 FROM ppo.relationships r WHERE r.workspace_id=pe.workspace_id AND r.person_id=pe.id AND r.company_id=$4 AND r.organisation_id=$5 AND r.valid_from<=CURRENT_DATE AND (r.valid_to IS NULL OR r.valid_to>CURRENT_DATE)) ORDER BY pe.display_name,pe.id LIMIT 51`,
      [
        p.workspace_id,
        p.actor_id,
        q.q,
        project.company_id,
        project.organisation_id,
      ],
    )
  ).rows;
  const rows = [...internal, ...external].sort((a, b) =>
    a.display_name.localeCompare(b.display_name),
  );
  return { items: rows.slice(0, 50), has_more: rows.length > 50 };
}
export async function projectOptions(p: Principal, input: unknown) {
  const q = object(input, ["kind", "q", "organisation_id", "site_id"]),
    kind = q.kind ?? "customer",
    search = typeof q.q === "string" ? q.q.trim().toLowerCase() : "";
  if (search.length > 200) invalid("q", "Search up to 200 characters.");
  const c = database();
  await requireCapability(c, p, "project.create");
  if (kind === "customer") {
    const rows = (
      await c.query(
        `SELECT o.id,o.display_name,o.display_number,o.company_id FROM ppo.organisations o WHERE o.workspace_id=$1 AND ${visibility("Organisation", "o")} AND (position($3 in lower(o.display_name||' '||o.display_number))>0) AND EXISTS(SELECT 1 FROM ppo.site_parties sp WHERE sp.workspace_id=o.workspace_id AND sp.organisation_id=o.id AND sp.valid_from<=CURRENT_DATE AND (sp.valid_to IS NULL OR sp.valid_to>CURRENT_DATE) AND ${scopeSql("sp.company_id", "sp.site_id", "project.create")} AND ${scopeSql("sp.company_id", "sp.site_id", "project.read")} AND ${scopeSql("sp.company_id", "sp.site_id", "shared.internal.read")}) ORDER BY o.display_name,o.id LIMIT 51`,
        [p.workspace_id, p.actor_id, search],
      )
    ).rows;
    return { items: rows.slice(0, 50), has_more: rows.length > 50 };
  }
  const customer = await visible(
    c,
    p,
    "Organisation",
    uuid(q.organisation_id, "organisation_id"),
  );
  if (kind === "site") {
    const rows = (
      await c.query(
        `SELECT s.id,s.display_name,s.display_number FROM ppo.sites s WHERE s.workspace_id=$1 AND ${visibility("Site", "s")} AND ${scopeSql("s.company_id", "s.id", "project.create")} AND ${scopeSql("s.company_id", "s.id", "project.read")} AND ${scopeSql("s.company_id", "s.id", "shared.internal.read")} AND position($3 in lower(s.display_name||' '||s.display_number))>0 AND EXISTS(SELECT 1 FROM ppo.site_parties sp WHERE sp.workspace_id=s.workspace_id AND sp.site_id=s.id AND sp.organisation_id=$4 AND sp.valid_from<=CURRENT_DATE AND (sp.valid_to IS NULL OR sp.valid_to>CURRENT_DATE)) ORDER BY s.display_name,s.id LIMIT 51`,
        [p.workspace_id, p.actor_id, search, customer.id],
      )
    ).rows;
    return { items: rows.slice(0, 50), has_more: rows.length > 50 };
  }
  if (kind !== "coordinator")
    invalid("kind", "Choose customer, site or coordinator.");
  const context = {
    company_id: customer.company_id as string,
    organisation_id: customer.id as string,
    site_id: uuid(q.site_id, "site_id"),
  };
  await authoriseContext(c, p, context, "project.create");
  const rows = await internalOwners(c, p, context, search, true);
  return { items: rows.slice(0, 50), has_more: rows.length > 50 };
}
