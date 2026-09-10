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
import { projectRow } from "../projects/service";
import { visibleOpportunity, opportunityVisibility } from "../crm/context";
import { visibility } from "../shared/reads";
import {
  object,
  uuid,
  optionalId,
  invalid,
  choice,
} from "../shared/validation";
import {
  parseEngineeringRequest,
  parseEngineeringCoordination,
  parseEngineeringNote,
} from "./validation";
import {
  disciplines,
  type LinkKind,
  type EngineeringPackage,
  type EngineeringDetail,
} from "./model";

type Context = {
  company_id: string;
  organisation_id: string;
  site_id: string | null;
};
type Row = Omit<EngineeringPackage, "updated_at" | "can_edit"> & {
  workspace_id: string;
  updated_at: Date;
  project_id: string | null;
  opportunity_id: string | null;
};
async function linked(
  c: QueryClient,
  p: Principal,
  kind: LinkKind,
  id: string,
): Promise<Context> {
  return kind === "Project"
    ? projectRow(c, p, id)
    : visibleOpportunity(c, p, id);
}
async function contextPermission(
  c: QueryClient,
  p: Principal,
  context: Context,
  cap: "engineering.read" | "engineering.create" | "engineering.edit",
) {
  for (const required of [
    "engineering.read",
    cap,
    "shared.read",
    "shared.internal.read",
  ] as const)
    if (
      !(await hasPermission(
        c,
        p,
        required,
        context.company_id,
        context.site_id ?? undefined,
      ))
    )
      throw unavailable();
}
async function eligible(
  c: QueryClient,
  p: Principal,
  kind: LinkKind,
  id: string,
  ownerId: string,
) {
  const user = (
    await c.query<{ id: string; display_name: string }>(
      "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active",
      [p.workspace_id, ownerId],
    )
  ).rows[0];
  if (!user) throw unavailable();
  const candidate = {
    ...p,
    actor_id: user.id,
    display_name: user.display_name,
  };
  const context = await linked(c, candidate, kind, id);
  await contextPermission(c, candidate, context, "engineering.edit");
  return user;
}
const joins = `FROM ppo.engineering_packages p JOIN ppo.organisations org ON (org.workspace_id,org.id)=(p.workspace_id,p.organisation_id)
 JOIN ppo.users u ON (u.workspace_id,u.id)=(p.workspace_id,p.owner_id)
 LEFT JOIN ppo.projects ctx_project ON (ctx_project.workspace_id,ctx_project.id)=(p.workspace_id,p.project_id)
 LEFT JOIN ppo.opportunities ctx_op ON (ctx_op.workspace_id,ctx_op.id)=(p.workspace_id,p.opportunity_id)
 LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(p.workspace_id,p.site_id)`;
const projectionSql = `SELECT p.*,p.required_date::text,p.action_due::text,u.display_name AS owner_name,org.display_name AS customer_name,
 CASE WHEN p.project_id IS NOT NULL THEN 'Project' ELSE 'Opportunity' END AS context_kind,
 coalesce(p.project_id,p.opportunity_id) AS context_id,coalesce(ctx_project.title,ctx_op.title) AS context_title,
 coalesce(ctx_project.display_number,ctx_op.display_number) AS context_reference ${joins}`;
const permitted =
  () => `${scopeSql("p.company_id", "p.site_id", "engineering.read")} AND ${scopeSql("p.company_id", "p.site_id")} AND ${scopeSql("p.company_id", "p.site_id", "shared.internal.read")} AND ${visibility("Organisation", "org")} AND (p.site_id IS NULL OR ${visibility("Site", "s")}) AND
 ((p.project_id IS NOT NULL AND ${scopeSql("p.company_id", "p.site_id", "project.read")} AND (p.company_id,p.organisation_id,p.site_id) IS NOT DISTINCT FROM (ctx_project.company_id,ctx_project.organisation_id,ctx_project.site_id)) OR
 (p.opportunity_id IS NOT NULL AND ${opportunityVisibility("ctx_op")} AND (p.company_id,p.organisation_id,p.site_id) IS NOT DISTINCT FROM (ctx_op.company_id,ctx_op.organisation_id,ctx_op.site_id)))`;
function project(r: Row, can_edit = false): EngineeringPackage {
  const {
    id,
    display_number,
    version,
    title,
    brief,
    company_id,
    organisation_id,
    site_id,
    context_kind,
    context_id,
    context_title,
    context_reference,
    customer_name,
    owner_id,
    owner_name,
    discipline,
    state,
    required_date,
    next_action,
    action_due,
    blocker,
  } = r;
  return {
    id,
    display_number,
    version,
    title,
    brief,
    company_id,
    organisation_id,
    site_id,
    context_kind,
    context_id,
    context_title,
    context_reference,
    customer_name,
    owner_id,
    owner_name,
    discipline,
    state,
    required_date,
    next_action,
    action_due,
    blocker,
    updated_at: r.updated_at.toISOString(),
    can_edit,
  };
}
export async function engineeringRow(
  c: QueryClient,
  p: Principal,
  id: string,
  cap:
    | "engineering.read"
    | "engineering.create"
    | "engineering.edit" = "engineering.read",
) {
  const row = (
    await c.query<Row>(
      `${projectionSql} WHERE p.workspace_id=$1 AND p.id=$3 AND ${permitted()}`,
      [p.workspace_id, p.actor_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await contextPermission(c, p, row, cap);
  return row;
}
export async function listEngineering(p: Principal, value: unknown) {
  const q = object(value, [
      "q",
      "cursor",
      "limit",
      "view",
      "owner_id",
      "discipline",
      "attention",
    ]),
    text = q.q ?? "",
    limit = Number(q.limit ?? 50);
  if (
    typeof text !== "string" ||
    text.length > 200 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    invalid(
      "q",
      "Use up to 200 search characters and a page size from 1 to 100.",
    );
  const cursor = optionalId(q.cursor, "cursor"),
    owner = optionalId(q.owner_id, "owner_id"),
    view = choice(q.view ?? "all", "view", [
      "all",
      "mine",
      "review",
      "released",
    ] as const),
    discipline = q.discipline
      ? choice(q.discipline, "discipline", disciplines)
      : null;
  const attention =
    choice(q.attention ?? "false", "attention", ["true", "false"] as const) ===
    "true";
  const c = database();
  await requireCapability(c, p, "engineering.read");
  const rows = (
    await c.query<Row>(
      `${projectionSql} WHERE p.workspace_id=$1 AND ${permitted()} AND ($3::uuid IS NULL OR p.id>$3)
  AND ($4='' OR position($4 in lower(p.title||' '||p.display_number||' '||p.id::text||' '||org.display_name||' '||coalesce(ctx_project.title,ctx_op.title)))>0)
  AND ($5='all' OR ($5='mine' AND p.owner_id=$2)) AND ($6::uuid IS NULL OR p.owner_id=$6) AND ($7::text IS NULL OR p.discipline=$7)
  AND (NOT $8 OR p.blocker IS NOT NULL OR p.required_date<(clock_timestamp() AT TIME ZONE 'Australia/Brisbane')::date OR p.action_due<(clock_timestamp() AT TIME ZONE 'Australia/Brisbane')::date)
  ORDER BY p.id LIMIT $9`,
      [
        p.workspace_id,
        p.actor_id,
        cursor,
        text.trim().toLowerCase(),
        view,
        owner,
        discipline,
        attention,
        limit + 1,
      ],
    )
  ).rows;
  return {
    items: rows.slice(0, limit).map((r) => project(r)),
    next_cursor: rows.length > limit ? rows[limit - 1].id : null,
    observed_at: new Date().toISOString(),
    completeness: "Page",
  };
}
export async function readEngineering(
  p: Principal,
  id: string,
  input: unknown = {},
): Promise<EngineeringDetail> {
  object(input, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const row = await engineeringRow(c, p, id),
      can_edit = await hasPermission(
        c,
        p,
        "engineering.edit",
        row.company_id,
        row.site_id ?? undefined,
      );
    const events = (
      await c.query(
        `SELECT e.package_version,e.event_type,e.reason,e.note,e.created_at,u.display_name AS actor_name FROM ppo.engineering_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.created_by) WHERE e.workspace_id=$1 AND e.package_id=$2 ORDER BY e.package_version DESC LIMIT 101`,
        [p.workspace_id, id],
      )
    ).rows;
    return {
      package: project(row, can_edit),
      events: events.slice(0, 100),
      has_more_history: events.length > 100,
    };
  });
}
async function event(
  c: PoolClient,
  p: Principal,
  id: string,
  command: { operation_id: string; reason: string },
  kind: string,
  note: string | null = null,
) {
  await c.query(
    `INSERT INTO ppo.engineering_events(id,workspace_id,company_id,package_id,created_by,updated_by,operation_id,package_version,event_type,reason,note,package_snapshot)
  SELECT $1,p.workspace_id,p.company_id,p.id,$2,$2,$3,p.version,$4,$5,$6,to_jsonb(p) FROM ppo.engineering_packages p WHERE p.workspace_id=$7 AND p.id=$8`,
    [
      randomUUID(),
      p.actor_id,
      command.operation_id,
      kind,
      command.reason,
      note,
      p.workspace_id,
      id,
    ],
  );
}
export async function createEngineeringRequest(p: Principal, value: unknown) {
  const command = parseEngineeringRequest(value);
  return sharedOperation(
    p,
    command,
    "CreateEngineeringRequest",
    async (c) => {
      const context = await linked(
        c,
        p,
        command.context_kind,
        command.context_id,
      );
      await contextPermission(c, p, context, "engineering.create");
      await eligible(
        c,
        p,
        command.context_kind,
        command.context_id,
        command.owner_id,
      );
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.engineering_packages WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, command.id],
          )
        ).rowCount
      )
        await engineeringRow(c, p, command.id, "engineering.create");
      return context;
    },
    async (c, context) => {
      const row = (
        await c.query(
          `INSERT INTO ppo.engineering_packages(id,workspace_id,company_id,created_by,updated_by,title,brief,organisation_id,site_id,project_id,opportunity_id,owner_id,discipline,required_date,next_action,action_due)
    VALUES($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id,version,state,updated_at`,
          [
            command.id,
            p.workspace_id,
            context.company_id,
            p.actor_id,
            command.title,
            command.brief,
            context.organisation_id,
            context.site_id,
            command.context_kind === "Project" ? command.context_id : null,
            command.context_kind === "Opportunity" ? command.context_id : null,
            command.owner_id,
            command.discipline,
            command.required_date,
            command.next_action,
            command.action_due,
          ],
        )
      ).rows[0];
      await event(c, p, command.id, command, "EngineeringRequested");
      return row;
    },
    "EngineeringPackage",
    "EngineeringRequested",
  );
}
function currentVersion(row: Row, expected: number) {
  if (row.version !== expected)
    throw new AppError(
      409,
      "VersionConflict",
      "This package changed. Your entries are retained; review the latest package before saving again.",
    );
}
export async function coordinateEngineering(
  p: Principal,
  id: string,
  value: unknown,
) {
  const command = parseEngineeringCoordination(id, value);
  return sharedOperation(
    p,
    command,
    "CoordinateEngineering",
    (c) => engineeringRow(c, p, id, "engineering.edit"),
    async (c, row) => {
      currentVersion(row, command.expected_version);
      await eligible(c, p, row.context_kind, row.context_id, command.owner_id);
      const saved = (
        await c.query(
          `UPDATE ppo.engineering_packages SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,owner_id=$4,state=$5,required_date=$6,next_action=$7,action_due=$8,blocker=$9 WHERE workspace_id=$1 AND id=$2 RETURNING id,version,state,updated_at`,
          [
            p.workspace_id,
            id,
            p.actor_id,
            command.owner_id,
            command.state,
            command.required_date,
            command.next_action,
            command.action_due,
            command.blocker,
          ],
        )
      ).rows[0];
      await event(c, p, id, command, "EngineeringCoordinated");
      return saved;
    },
    "EngineeringPackage",
    "EngineeringCoordinated",
  );
}
export async function addEngineeringNote(
  p: Principal,
  id: string,
  value: unknown,
) {
  const command = parseEngineeringNote(id, value);
  return sharedOperation(
    p,
    command,
    "AddEngineeringNote",
    (c) => engineeringRow(c, p, id, "engineering.edit"),
    async (c, row) => {
      currentVersion(row, command.expected_version);
      const saved = (
        await c.query(
          "UPDATE ppo.engineering_packages SET version=version+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$1 AND id=$2 RETURNING id,version,state,updated_at",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0];
      await event(c, p, id, command, "EngineeringNoteAdded", command.note);
      return saved;
    },
    "EngineeringPackage",
    "EngineeringNoteAdded",
  );
}
export async function engineeringOptions(p: Principal, value: unknown) {
  const q = object(value, ["kind", "context_kind", "context_id", "q"]),
    kind = choice(q.kind ?? "context", "kind", ["context", "owner"] as const),
    contextKind = choice(q.context_kind ?? "Project", "context_kind", [
      "Project",
      "Opportunity",
    ] as const),
    search = q.q ?? "";
  if (typeof search !== "string" || search.length > 200)
    invalid("q", "Search up to 200 characters.");
  const c = database();
  await requireCapability(c, p, "engineering.read");
  if (kind === "owner") {
    const id = uuid(q.context_id, "context_id"),
      context = await linked(c, p, contextKind, id);
    await contextPermission(c, p, context, "engineering.read");
    const users = (
        await c.query<{ id: string; display_name: string }>(
          "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active AND position($2 in lower(display_name))>0 ORDER BY display_name,id",
          [p.workspace_id, search.toLowerCase()],
        )
      ).rows,
      items = [];
    for (const user of users) {
      try {
        await eligible(c, p, contextKind, id, user.id);
        items.push(user);
        if (items.length === 51) break;
      } catch (e) {
        if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
      }
    }
    return { items: items.slice(0, 50), has_more: items.length > 50 };
  }
  await requireCapability(c, p, "engineering.create");
  const table = contextKind === "Project" ? "projects" : "opportunities";
  const v =
    contextKind === "Project"
      ? `${scopeSql("ctx.company_id", "ctx.site_id", "project.read")} AND ${scopeSql("ctx.company_id", "ctx.site_id")} AND ${scopeSql("ctx.company_id", "ctx.site_id", "shared.internal.read")} AND ${visibility("Organisation", "org")} AND ${visibility("Site", "s")}`
      : opportunityVisibility("ctx");
  const rows = (
    await c.query(
      `SELECT ctx.id,ctx.title AS display_name,ctx.display_number,org.display_name AS customer_name FROM ppo.${table} ctx JOIN ppo.organisations org ON (org.workspace_id,org.id)=(ctx.workspace_id,ctx.organisation_id) LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(ctx.workspace_id,ctx.site_id) WHERE ctx.workspace_id=$1 AND ${v} AND ${scopeSql("ctx.company_id", "ctx.site_id", "engineering.create")} AND ${scopeSql("ctx.company_id", "ctx.site_id", "engineering.read")} AND position($3 in lower(ctx.title||' '||ctx.display_number||' '||org.display_name))>0 ORDER BY ctx.title,ctx.id LIMIT 51`,
      [p.workspace_id, p.actor_id, search.trim().toLowerCase()],
    )
  ).rows;
  return { items: rows.slice(0, 50), has_more: rows.length > 50 };
}
