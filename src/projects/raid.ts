import type { PoolClient } from "pg";
import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { workingCompanyFor } from "../platform/working-company";
import { sharedOperation } from "../platform/operations";
import { activityVisibility } from "../activities/activities";
import { scopedOwner } from "../shared/authority";
import { page } from "../shared/reads";
import { choice, invalid, object, optionalId, uuid } from "../shared/validation";
import { projectRow } from "./service";
import { parseRaid, raidKinds, raidStates } from "./raid-validation";

type Revision = {
  entry_id: string; version: number; title: string; detail: string; owner_id: string; owner_name: string;
  priority: "Normal" | "High"; due_at: Date | null; due_needed: boolean; response: string | null; interface_notes: string | null;
  state: "Open" | "Monitoring" | "Closed"; outcome: string | null; action_ids: string[];
  action_snapshot: {id: string; version: number; state: string}[]; reason: string; created_by: string; created_at: Date;
};
type Entry = { id: string; company_id: string; project_id: string; kind: typeof raidKinds[number] };
type Action = { id: string; version: number; company_id: string; site_id: string | null; summary: string; owner_id: string; state: string; due_at: Date | null; due_needed: boolean; project_ids: string[] };

async function lockRead(c: PoolClient, p: Principal) {
  await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [p.workspace_id]);
}
async function entryRow(c: QueryClient, p: Principal, id: string): Promise<Entry | null> {
  return (await c.query<Entry>("SELECT id,company_id,project_id,kind FROM ppo.project_raid_entries WHERE workspace_id=$1 AND id=$2", [p.workspace_id,id])).rows[0] ?? null;
}
async function revisions(c: QueryClient, p: Principal, id: string, before: number | null = null, limit = 1) {
  return (await c.query<Revision>(`SELECT r.*,u.display_name AS owner_name FROM ppo.project_raid_revisions r
    JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.owner_id)
    WHERE r.workspace_id=$1 AND r.entry_id=$2 AND ($3::int IS NULL OR r.version<$3) ORDER BY r.version DESC LIMIT $4`, [p.workspace_id,id,before,limit])).rows;
}
async function actionsFor(c: QueryClient, p: Principal, ids: string[]) {
  if (!ids.length) return new Map<string,Action>();
  const rows = (await c.query<Action>(`SELECT a.id,a.version,a.company_id,a.site_id,a.summary,a.owner_id,a.status AS state,a.due_at,a.due_needed,
    ARRAY(SELECT l.object_id FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.object_type='Project') AS project_ids
    FROM ppo.activities a WHERE a.workspace_id=$1 AND a.id=ANY($3::uuid[]) AND ${activityVisibility("a",true,true,true)}`, [p.workspace_id,p.actor_id,ids])).rows;
  return new Map(rows.map(a => [a.id,a]));
}
function requireActions(ids: string[], actions: Map<string,Action>) {
  if (ids.some(id => !actions.has(id))) throw unavailable();
}
function projection(entry: Entry, r: Revision, actions: Map<string,Action>, canEdit: boolean) {
  const partial = r.action_ids.some(id => !actions.has(id));
  return {
    id: entry.id, project_id: entry.project_id, company_id: entry.company_id, kind: entry.kind,
    version: r.version, title: r.title, detail: r.detail, owner_id: r.owner_id, owner_name: r.owner_name,
    priority: r.priority, due_at: r.due_at?.toISOString() ?? null, due_needed: r.due_needed,
    response: r.response, interface_notes: r.interface_notes, state: r.state, outcome: r.outcome,
    reason: r.reason, recorded_by: r.created_by, recorded_at: r.created_at.toISOString(),
    action_basis: r.action_snapshot.filter(a => actions.has(a.id)),
    actions: r.action_ids.flatMap(id => {
      const a = actions.get(id);
      return a ? [{id:a.id,version:a.version,summary:a.summary,owner_id:a.owner_id,state:a.state,due_at:a.due_at?.toISOString() ?? null,due_needed:a.due_needed}] : [];
    }),
    action_completeness: partial ? "Partial" : "Complete", can_edit: canEdit && !partial,
  };
}

export async function raidReceiptAuthority(c: QueryClient, p: Principal, id: string, operation: string) {
  const entry = await entryRow(c,p,id);
  if (!entry) throw unavailable();
  await projectRow(c,p,entry.project_id,true);
  const row = (await c.query<{action_ids:string[]}>("SELECT action_ids FROM ppo.project_raid_revisions WHERE workspace_id=$1 AND entry_id=$2 AND created_by=$3 AND operation_id=$4",[p.workspace_id,id,p.actor_id,operation])).rows[0];
  if (!row) throw unavailable();
  requireActions(row.action_ids, await actionsFor(c,p,row.action_ids));
}

export async function saveRaid(p: Principal, projectId: string, input: unknown) {
  const command = parseRaid(projectId,input);
  return sharedOperation(p,command,"SaveProjectRaid",async c => {
    const project = await projectRow(c,p,command.project_id,true);
    const entry = await entryRow(c,p,command.id);
    if (entry && entry.project_id !== project.id) throw unavailable();
    // Current source authority precedes even an original-operation replay.
    const prior = entry ? (await revisions(c,p,entry.id))[0] : null;
    const ids = [...new Set([...command.action_ids,...(prior?.action_ids ?? [])])];
    const actions = await actionsFor(c,p,ids);
    requireActions(ids,actions);
    return {project,entry,prior,actions};
  },async (c,{project,entry,prior,actions}) => {
    if (project.lifecycle === "Closed") throw new AppError(409,"ClosedProject","Reopen the project through Acceptance & closeout before changing its RAID register.");
    if ((prior?.version ?? 0) !== command.expected_version) throw new AppError(409,"VersionConflict","The RAID record changed. Read its current version before saving again.");
    if (entry && entry.kind !== command.kind) invalid("kind","The recorded kind is permanent. Record a separate item when its meaning changes.");
    if (prior?.state === "Closed" && command.state !== "Open") invalid("state","Explicitly reopen the record before making further changes.");
    if (prior?.action_ids.some(id => !command.action_ids.includes(id))) invalid("action_ids","Keep earlier action links. Cancel an Activity through its own workflow when it is no longer needed.");
    const owner = await scopedOwner(c,p,command.owner_id,project.company_id,project.site_id,"project.edit");
    await projectRow(c,owner,project.id);
    for (const id of command.action_ids) {
      const a = actions.get(id)!;
      if (a.company_id !== project.company_id || a.site_id !== project.site_id || !a.project_ids.includes(project.id)) throw unavailable();
      if (command.state === "Closed" && !["Completed","Cancelled"].includes(a.state)) throw new AppError(409,"OpenActions","Complete or cancel each linked Activity before closing this record.");
    }
    if (!entry) await c.query("INSERT INTO ppo.project_raid_entries(id,workspace_id,company_id,project_id,kind,created_by) VALUES($1,$2,$3,$4,$5,$6)",[command.id,p.workspace_id,project.company_id,project.id,command.kind,p.actor_id]);
    const snapshot = command.action_ids.map(id => { const a=actions.get(id)!; return {id,version:a.version,state:a.state}; });
    const row = (await c.query(`INSERT INTO ppo.project_raid_revisions(workspace_id,entry_id,version,title,detail,owner_id,priority,due_at,due_needed,response,interface_notes,state,outcome,action_ids,action_snapshot,reason,created_by,operation_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING entry_id AS id,version,state,created_at AS updated_at`,
      [p.workspace_id,command.id,command.expected_version+1,command.title,command.detail,command.owner_id,command.priority,command.due_at,command.due_needed,command.response,command.interface_notes,command.state,command.outcome,command.action_ids,JSON.stringify(snapshot),command.reason,p.actor_id,command.operation_id])).rows[0];
    return {...row,audit_details:{project_id:project.id,kind:command.kind}};
  },"ProjectRaidEntry","SharedRecordUpdated");
}

export async function readRaid(p: Principal, projectId: string, input: unknown = {}) {
  const q = object(input,["id","before_version","limit","cursor","q","kind","state","owner_id"]);
  const project_id = uuid(projectId,"project_id");
  return transaction(async c => {
    await lockRead(c,p);
    const project = await projectRow(c,p,project_id);
    const canEdit = project.lifecycle !== "Closed" && await hasPermission(c,p,"project.edit",project.company_id,project.site_id);
    if (q.id !== undefined) {
      object(q,["id","before_version"]);
      const id = uuid(q.id,"id"), entry = await entryRow(c,p,id);
      if (!entry || entry.project_id !== project.id) throw unavailable();
      const before = q.before_version === undefined ? null : Number(q.before_version);
      if (before !== null && (!Number.isSafeInteger(before) || before<1 || before>2147483647)) invalid("before_version","Use a positive revision number.");
      const latest = (await revisions(c,p,id))[0], history = await revisions(c,p,id,before,51);
      const actions = await actionsFor(c,p,[...new Set([latest,...history].flatMap(r => r.action_ids))]);
      await projectRow(c,p,project.id);
      return {current:projection(entry,latest,actions,canEdit),history:history.slice(0,50).map(r => projection(entry,r,actions,false)),next_before_version:history.length>50 ? history[49].version : null,observed_at:new Date().toISOString()};
    }
    if (q.before_version !== undefined) invalid("before_version","History paging requires a record id.");
    const kind = q.kind === undefined ? null : choice(q.kind,"kind",raidKinds), state = q.state === undefined ? null : choice(q.state,"state",raidStates), owner = optionalId(q.owner_id,"owner_id");
    const pg = page({limit:q.limit,cursor:q.cursor,q:q.q},{workspace:p.workspace_id,actor:p.actor_id,company:workingCompanyFor(p.actor_id),project_id,kind,state,owner});
    const rows = (await c.query<Entry & Revision>(`WITH current AS (
      SELECT e.id,e.company_id,e.project_id,e.kind,r.*,u.display_name AS owner_name FROM ppo.project_raid_entries e
      JOIN LATERAL (SELECT * FROM ppo.project_raid_revisions r WHERE r.workspace_id=e.workspace_id AND r.entry_id=e.id ORDER BY version DESC LIMIT 1) r ON true
      JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.owner_id)
      WHERE e.workspace_id=$1 AND e.project_id=$2 AND ($3::text IS NULL OR e.kind=$3) AND ($4::text IS NULL OR r.state=$4) AND ($5::uuid IS NULL OR r.owner_id=$5)
      AND ($6='' OR position(lower($6) in lower(r.title||' '||r.detail))>0)
    ) SELECT * FROM current WHERE ($7::uuid IS NULL OR id>$7) ORDER BY id LIMIT $8`,[p.workspace_id,project.id,kind,state,owner,pg.q,pg.after,pg.limit+1])).rows;
    const selected = rows.slice(0,pg.limit), actions = await actionsFor(c,p,[...new Set(selected.flatMap(r=>r.action_ids))]);
    await projectRow(c,p,project.id);
    return {items:selected.map(r=>projection(r,r,actions,canEdit)),next_cursor:rows.length>pg.limit ? pg.cursor(selected.at(-1)!.id) : null,completeness:"Page",observed_at:new Date().toISOString()};
  });
}
