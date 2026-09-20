// My Work read models. My Work projects obligations that other modules own; it stores none of
// them. Every row is re-read under the reader's current grants, and every count covers the whole
// permitted scope for the selected owner and filters, never just the rows shown.
import { crmAvailable } from "../crm/context";
import { leadsAvailable } from "../crm/leads/context";
import { listPlanningGaps } from "../crm/planning-gaps";
import { readCalendar } from "../email/service";
import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { hasPermission, requireCapability, scopeSql } from "../platform/permissions";
import { choice, invalid, object, optionalId } from "../shared/validation";
import { activityKinds, activityVisibility } from "./activities";
import { listWorkReviews } from "./work-reviews";
import {
  activityTypes,
  attentionGroup,
  localDay,
  localDayBounds,
  WORK_TIMEZONE,
  type ActivityType,
  type AttentionGroup,
} from "./work-view";
import { listWorkWaiting } from "./work-waiting";

export type WorkRow = {
  id: string;
  version: number;
  kind: (typeof activityKinds)[number];
  activity_type: ActivityType;
  summary: string;
  status: "Open" | "InProgress" | "Completed" | "Cancelled";
  owner_id: string;
  owner_name: string;
  company_id: string;
  site_id: string | null;
  access_class: string;
  due_at: string | null;
  due_needed: boolean;
  due_date_only: boolean;
  starts_at: string | null;
  outcome: string | null;
  updated_at: string;
  group: AttentionGroup;
  can_edit: boolean;
  can_complete: boolean;
  // The record this activity serves. The type is the link, never a guess from the title.
  linked: {
    type: "Lead" | "Opportunity" | "Ticket" | "Asset" | "Site" | "Organisation";
    id: string;
    reference: string | null;
    title: string | null;
    organisation_name: string | null;
    contact_name: string | null;
    // Contact methods of the linked record's primary person, whom the reader can already see.
    contact_email: string | null;
    contact_phone: string | null;
    version: number | null;
    can_plan: boolean;
  };
};
// A panel that cannot be read says so. It is never reported as an empty or zero result.
export type Panel<T> =
  | { status: "ok"; total: number; items: T[] }
  | { status: "not_permitted" }
  | { status: "unavailable" };

async function settle<T>(
  read: () => Promise<{ total: number; items: T[] } | null>,
): Promise<Panel<T>> {
  try {
    const value = await read();
    return value ? { status: "ok", ...value } : { status: "not_permitted" };
  } catch (error) {
    if (error instanceof AppError && [401, 403, 404].includes(error.status))
      return { status: "not_permitted" };
    console.error("My Work panel unavailable", (error as Error).message);
    return { status: "unavailable" };
  }
}

const sorts = ["Due", "Title"] as const;
function scopeFilters(r: Record<string, unknown>, p: Principal) {
  const owner = r.owner === undefined ? "mine" : choice(r.owner, "owner", ["mine", "all"] as const);
  return {
    owner,
    owner_id: owner === "mine" ? p.actor_id : null,
    company_id: optionalId(r.company_id, "company_id"),
    kind: r.kind === undefined || r.kind === "" ? null : choice(r.kind, "kind", activityKinds),
  };
}
const listFilters = (r: Record<string, unknown>) => ({
  activity_type:
    r.activity_type === undefined || r.activity_type === ""
      ? null
      : choice(r.activity_type, "activity_type", activityTypes),
  sort: r.sort === undefined ? ("Due" as const) : choice(r.sort, "sort", sorts),
});
function bounded(value: unknown, field: string, fallback: number, max: number) {
  const n = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max)
    invalid(field, `Use a whole number from 1 to ${max}.`);
  return n;
}

// One projection for every My Work list. activityVisibility has already refused any activity
// with a link the reader cannot see, so the linked names below are all permitted.
async function rowSql(c: ReturnType<typeof database>) {
  const crm = await crmAvailable(c),
    leads = await leadsAvailable(c);
  return {
    visibility: activityVisibility("a", crm, leads),
    select: `a.id,a.version,a.kind,a.activity_type,a.summary,a.status,a.owner_id,u.display_name AS owner_name,a.company_id,a.site_id,a.access_class,
      a.due_at,a.due_needed,a.due_date_only,a.starts_at,a.outcome,a.updated_at,
      ${scopeSql("a.company_id", "a.site_id", "activity.edit")} AS may_edit,
      ${leads ? "ld.id" : "NULL::uuid"} AS lead_id,${leads ? "ld.display_number" : "NULL"} AS lead_reference,${leads ? "ld.title" : "NULL"} AS lead_title,${leads ? "ld.version" : "NULL::int"} AS lead_version,
      ${leads ? "coalesce(ldo.display_name,ld.organisation_text)" : "NULL"} AS lead_organisation,${leads ? "coalesce(ldp.display_name,ld.contact_text)" : "NULL"} AS lead_contact,${leads ? "ldp.email" : "NULL"} AS lead_email,${leads ? "ldp.phone" : "NULL"} AS lead_phone,
      ${leads ? `(ld.owner_id=$2 AND ld.status IN ('New','Contacting','Nurturing') AND NOT ld.is_archived AND ${scopeSql("ld.company_id", "ld.site_id", "crm.lead.edit")})` : "false"} AS lead_can_plan,
      ${crm ? "op.id" : "NULL::uuid"} AS opportunity_id,${crm ? "op.display_number" : "NULL"} AS opportunity_reference,${crm ? "op.title" : "NULL"} AS opportunity_title,${crm ? "op.version" : "NULL::int"} AS opportunity_version,
      ${crm ? "opo.display_name" : "NULL"} AS opportunity_organisation,${crm ? "opp.display_name" : "NULL"} AS opportunity_contact,${crm ? "opp.email" : "NULL"} AS opportunity_email,${crm ? "opp.phone" : "NULL"} AS opportunity_phone,
      ${crm ? `(op.owner_id=$2 AND op.close_outcome='Open' AND ${scopeSql("op.company_id", "op.site_id", "crm.opportunity.edit")})` : "false"} AS opportunity_can_plan,
      tk.id AS ticket_id,tk.display_number AS ticket_reference,tk.summary AS ticket_title,
      ast.id AS asset_id,ast.display_number AS asset_reference,ast.description AS asset_title,
      st.id AS linked_site_id,st.display_number AS site_reference,st.display_name AS site_title,
      org.id AS organisation_id,org.display_number AS organisation_reference,org.display_name AS organisation_title`,
    joins: `JOIN ppo.users u ON (u.workspace_id,u.id)=(a.workspace_id,a.owner_id)
      ${leads ? `LEFT JOIN LATERAL (SELECT l.lead_id FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.object_type='Lead' ORDER BY l.object_id LIMIT 1) ll ON true
      LEFT JOIN ppo.lead_candidates ld ON (ld.workspace_id,ld.id)=(a.workspace_id,ll.lead_id)
      LEFT JOIN ppo.organisations ldo ON (ldo.workspace_id,ldo.id)=(ld.workspace_id,ld.organisation_id)
      LEFT JOIN ppo.people ldp ON (ldp.workspace_id,ldp.id)=(ld.workspace_id,ld.primary_person_id)` : ""}
      ${crm ? `LEFT JOIN LATERAL (SELECT l.opportunity_id FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.object_type='Opportunity' ORDER BY l.object_id LIMIT 1) ol ON true
      LEFT JOIN ppo.opportunities op ON (op.workspace_id,op.id)=(a.workspace_id,ol.opportunity_id)
      LEFT JOIN ppo.organisations opo ON (opo.workspace_id,opo.id)=(op.workspace_id,op.organisation_id)
      LEFT JOIN ppo.people opp ON (opp.workspace_id,opp.id)=(op.workspace_id,op.primary_person_id)` : ""}
      LEFT JOIN LATERAL (SELECT l.ticket_id FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.object_type='Ticket' ORDER BY l.object_id LIMIT 1) tl ON true
      LEFT JOIN ppo.tickets tk ON (tk.workspace_id,tk.id)=(a.workspace_id,tl.ticket_id)
      LEFT JOIN LATERAL (SELECT l.asset_id FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.object_type='Asset' ORDER BY l.object_id LIMIT 1) al ON true
      LEFT JOIN ppo.assets ast ON (ast.workspace_id,ast.id)=(a.workspace_id,al.asset_id)
      LEFT JOIN LATERAL (SELECT l.site_id FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.object_type='Site' ORDER BY l.object_id LIMIT 1) sl ON true
      LEFT JOIN ppo.sites st ON (st.workspace_id,st.id)=(a.workspace_id,coalesce(sl.site_id,a.site_id))
      LEFT JOIN LATERAL (SELECT l.organisation_id FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.object_type='Organisation' ORDER BY l.object_id LIMIT 1) orl ON true
      LEFT JOIN ppo.organisations org ON (org.workspace_id,org.id)=(a.workspace_id,orl.organisation_id)`,
  };
}
type Raw = Record<string, unknown> & {
  id: string;
  status: WorkRow["status"];
  owner_id: string;
  due_at: Date | null;
  starts_at: Date | null;
  updated_at: Date;
  may_edit: boolean;
};
function project(r: Raw, p: Principal, now: string): WorkRow {
  const text = (k: string) => (r[k] as string | null) ?? null;
  const linked: WorkRow["linked"] = r.lead_id
    ? { type: "Lead", id: r.lead_id as string, reference: text("lead_reference"), title: text("lead_title"), organisation_name: text("lead_organisation"), contact_name: text("lead_contact"), contact_email: text("lead_email"), contact_phone: text("lead_phone"), version: r.lead_version as number, can_plan: !!r.lead_can_plan }
    : r.opportunity_id
      ? { type: "Opportunity", id: r.opportunity_id as string, reference: text("opportunity_reference"), title: text("opportunity_title"), organisation_name: text("opportunity_organisation"), contact_name: text("opportunity_contact"), contact_email: text("opportunity_email"), contact_phone: text("opportunity_phone"), version: r.opportunity_version as number, can_plan: !!r.opportunity_can_plan }
      : r.ticket_id
        ? { type: "Ticket", id: r.ticket_id as string, reference: text("ticket_reference"), title: text("ticket_title"), organisation_name: text("organisation_title"), contact_name: null, contact_email: null, contact_phone: null, version: null, can_plan: false }
        : r.asset_id
          ? { type: "Asset", id: r.asset_id as string, reference: text("asset_reference"), title: text("asset_title"), organisation_name: text("organisation_title") ?? text("site_title"), contact_name: null, contact_email: null, contact_phone: null, version: null, can_plan: false }
          : r.linked_site_id
            ? { type: "Site", id: r.linked_site_id as string, reference: text("site_reference"), title: text("site_title"), organisation_name: text("organisation_title"), contact_name: null, contact_email: null, contact_phone: null, version: null, can_plan: false }
            : { type: "Organisation", id: r.organisation_id as string, reference: text("organisation_reference"), title: text("organisation_title"), organisation_name: text("organisation_title"), contact_name: null, contact_email: null, contact_phone: null, version: null, can_plan: false };
  const active = r.status === "Open" || r.status === "InProgress";
  const timed = {
    id: r.id,
    status: r.status,
    due_at: r.due_at?.toISOString() ?? null,
    due_needed: !!r.due_needed,
    due_date_only: !!r.due_date_only,
    starts_at: r.starts_at?.toISOString() ?? null,
  };
  return {
    ...timed,
    version: r.version as number,
    kind: r.kind as WorkRow["kind"],
    activity_type: r.activity_type as ActivityType,
    summary: r.summary as string,
    owner_id: r.owner_id,
    owner_name: r.owner_name as string,
    company_id: r.company_id as string,
    site_id: (r.site_id as string | null) ?? null,
    access_class: r.access_class as string,
    outcome: text("outcome"),
    updated_at: r.updated_at.toISOString(),
    group: attentionGroup(timed, now),
    can_edit: active && r.may_edit,
    can_complete: active && r.may_edit && r.owner_id === p.actor_id,
    linked,
  };
}
async function clock(c: ReturnType<typeof database>) {
  const now = (await c.query<{ now: Date }>("SELECT clock_timestamp() AS now")).rows[0].now.toISOString();
  const day = localDay(now);
  return { now, day, ...localDayBounds(day) };
}

export async function readWorkOverview(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "activity.read");
  const r = object(input, ["owner", "company_id", "kind", "activity_type", "sort", "limit"]);
  const scope = scopeFilters(r, p),
    list = listFilters(r),
    limit = bounded(r.limit, "limit", 8, 25);
  const t = await clock(c),
    sql = await rowSql(c);
  // Scope parameters shared by every activity query below.
  const args = [p.workspace_id, p.actor_id, scope.owner_id, scope.company_id, scope.kind, t.now, t.end];
  const scoped = `a.workspace_id=$1 AND ${sql.visibility} AND a.status IN ('Open','InProgress')
    AND ($3::uuid IS NULL OR a.owner_id=$3) AND ($4::uuid IS NULL OR a.company_id=$4) AND ($5::text IS NULL OR a.kind=$5)`;
  const counts = (
    await c.query<{ overdue: number; due_today: number; date_needed: number; listed: number }>(
      `SELECT count(*) FILTER (WHERE a.due_at<$6)::int AS overdue,
        count(*) FILTER (WHERE a.due_at>=$6 AND coalesce(a.starts_at,a.due_at)<$7)::int AS due_today,
        count(*) FILTER (WHERE a.due_needed)::int AS date_needed,
        count(*) FILTER (WHERE a.due_at IS NOT NULL AND coalesce(a.starts_at,a.due_at)<$7 AND ($8::text IS NULL OR a.activity_type=$8))::int AS listed
       FROM ppo.activities a WHERE ${scoped}`,
      [...args, list.activity_type],
    )
  ).rows[0];
  const order = list.sort === "Title" ? 'lower(a.summary) COLLATE "C"' : "coalesce(a.starts_at,a.due_at)";
  const rows = (
    await c.query<Raw>(
      `SELECT ${sql.select} FROM ppo.activities a ${sql.joins}
       WHERE ${scoped} AND a.due_at IS NOT NULL AND coalesce(a.starts_at,a.due_at)<$7 AND ($8::text IS NULL OR a.activity_type=$8)
       ORDER BY (a.due_at<$6) DESC,${order},a.id LIMIT $9`,
      [...args, list.activity_type, limit],
    )
  ).rows;
  const undated = (
    await c.query<Raw>(
      `SELECT ${sql.select} FROM ppo.activities a ${sql.joins} WHERE ${scoped} AND a.due_needed ORDER BY a.created_at,a.id LIMIT 3`,
      args.slice(0, 5),
    )
  ).rows;
  // The schedule repeats today's appointments; it never adds work. A finished appointment stays
  // on the day it happened so the day still reads as it was planned.
  const schedule = (
    await c.query<Raw>(
      `SELECT ${sql.select} FROM ppo.activities a ${sql.joins}
       WHERE a.workspace_id=$1 AND ${sql.visibility} AND a.status<>'Cancelled' AND a.starts_at IS NOT NULL
        AND ($3::uuid IS NULL OR a.owner_id=$3) AND ($4::uuid IS NULL OR a.company_id=$4) AND ($5::text IS NULL OR a.kind=$5)
        AND a.starts_at<$6 AND a.due_at>=$7 ORDER BY a.starts_at,a.id LIMIT 51`,
      [...args.slice(0, 5), t.end, t.start],
    )
  ).rows;
  const [waiting, gaps, reviews, meetings, canEdit] = await Promise.all([
    settle(() => listWorkWaiting(p, { owner_id: scope.owner_id, company_id: scope.company_id, limit: 3 })),
    settle(() => listPlanningGaps(p, { owner_id: scope.owner_id, company_id: scope.company_id, limit: 3 })),
    settle(() => listWorkReviews(p, { company_id: scope.company_id, limit: 3 })),
    // Calendar meetings are the reader's own and are separate records, never merged with an
    // activity by title or time. They appear only in the reader's own scope.
    scope.owner === "mine"
      ? readCalendar(p, { day: t.day }).then(
          (v) => v.meetings as { id: string; title: string; starts_at: Date; ends_at: Date; private: boolean; source: string }[],
          () => null,
        )
      : Promise.resolve(null),
    hasPermission(c, p, "activity.edit"),
  ]);
  return {
    observed_at: t.now,
    timezone: WORK_TIMEZONE,
    day: t.day,
    synthetic: true as const,
    scope: { ...scope, ...list, limit },
    capabilities: { can_create: canEdit, can_coordinate: canEdit },
    counts: { overdue: counts.overdue, due_today: counts.due_today, date_needed: counts.date_needed },
    activities: {
      items: rows.map((row) => project(row, p, t.now)),
      total: counts.listed,
      completeness: counts.listed > rows.length ? "BoundedWindow" : "Complete",
    },
    date_needed: { total: counts.date_needed, items: undated.map((row) => project(row, p, t.now)) },
    schedule: {
      items: schedule.slice(0, 50).map((row) => project(row, p, t.now)),
      truncated: schedule.length > 50,
      meetings: meetings?.map((m) => ({
        id: m.id,
        title: m.private ? "Private appointment" : m.title,
        starts_at: new Date(m.starts_at).toISOString(),
        ends_at: new Date(m.ends_at).toISOString(),
        source: m.source,
      })) ?? null,
    },
    waiting,
    gaps,
    reviews,
  };
}

// The full action list behind "View all activities", My actions and the Team queue: ordered on
// the server across the whole permitted scope, with a keyset so a page never reorders another.
const dueStates = ["Overdue", "Today", "Upcoming", "Needed"] as const;
const linkTypes = ["Lead", "Opportunity", "Ticket", "Other"] as const;
type Cursor = { k: string; id: string };
export async function listWork(p: Principal, input: unknown = {}, team = false) {
  const c = database();
  await requireCapability(c, p, "activity.read");
  // Coordinating other people's work means changing owners and dates, so the team view asks for
  // the capability those commands require. Every row is still scoped by the reader's grants.
  if (team) await requireCapability(c, p, "activity.edit");
  const r = object(input, ["owner", "owner_id", "company_id", "kind", "activity_type", "sort", "limit", "cursor", "status", "due", "linked", "q"]);
  const scope = scopeFilters(team ? { ...r, owner: "all" } : r, p),
    limit = bounded(r.limit, "limit", 25, 100);
  const owner_id = team ? optionalId(r.owner_id, "owner_id") : scope.owner_id;
  const filters = {
    activity_type: listFilters(r).activity_type,
    sort: r.sort === undefined ? ("Due" as const) : choice(r.sort, "sort", ["Due", "Title", "Updated"] as const),
    status: r.status === undefined ? ("Active" as const) : choice(r.status, "status", ["Active", "Completed", "Cancelled", "All"] as const),
    due: r.due === undefined || r.due === "" ? null : choice(r.due, "due", dueStates),
    linked: r.linked === undefined || r.linked === "" ? null : choice(r.linked, "linked", linkTypes),
    q: r.q === undefined ? "" : String(r.q),
  };
  if (filters.q.length > 200) invalid("q", "Use up to 200 search characters.");
  let cursor: Cursor | null = null;
  if (r.cursor !== undefined) {
    try {
      const value = JSON.parse(Buffer.from(String(r.cursor), "base64url").toString());
      if (typeof value?.k !== "string" || value.k.length > 2100 || !/^[0-9a-f-]{36}$/.test(value.id)) throw Error();
      cursor = { k: value.k, id: value.id };
    } catch {
      invalid("cursor", "This page token is invalid. Start a fresh read.");
    }
  }
  const t = await clock(c),
    sql = await rowSql(c);
  // Closed choices only; the identifier breaks every tie. Undated work sorts after dated work.
  const key =
    filters.sort === "Title"
      ? "lower(a.summary)"
      : filters.sort === "Updated"
        ? `to_char(a.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS.US')`
        : `coalesce(to_char(coalesce(a.starts_at,a.due_at) AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS.US'),'9999')`;
  const descending = filters.sort === "Updated";
  const where = `a.workspace_id=$1 AND ${sql.visibility}
    AND ($3::uuid IS NULL OR a.owner_id=$3) AND ($4::uuid IS NULL OR a.company_id=$4) AND ($5::text IS NULL OR a.kind=$5)
    AND ($6::text IS NULL OR a.activity_type=$6)
    AND ($7='All' OR a.status=$7 OR ($7='Active' AND a.status IN ('Open','InProgress')))
    AND position(lower($8) in lower(a.summary))>0
    AND ($9::text IS NULL OR ($9='Other' AND NOT EXISTS(SELECT 1 FROM ppo.activity_links f WHERE f.workspace_id=a.workspace_id AND f.activity_id=a.id AND f.object_type IN ('Lead','Opportunity','Ticket')))
      OR EXISTS(SELECT 1 FROM ppo.activity_links f WHERE f.workspace_id=a.workspace_id AND f.activity_id=a.id AND f.object_type=$9))`;
  const args = [p.workspace_id, p.actor_id, owner_id, scope.company_id, scope.kind, filters.activity_type, filters.status, filters.q.trim(), filters.linked];
  // A due state describes active work only; closed work has no due state.
  const due = `($12::text IS NULL OR (a.status IN ('Open','InProgress') AND (
      ($12='Needed' AND a.due_needed) OR ($12='Overdue' AND a.due_at<$10)
      OR ($12='Today' AND a.due_at>=$10 AND coalesce(a.starts_at,a.due_at)<$11)
      OR ($12='Upcoming' AND coalesce(a.starts_at,a.due_at)>=$11))))`;
  const timeArgs = [t.now, t.end, filters.due];
  const counts = (
    await c.query<{ total: number; overdue: number; today: number; upcoming: number; needed: number }>(
      `SELECT count(*) FILTER (WHERE ${due})::int AS total,
        count(*) FILTER (WHERE a.status IN ('Open','InProgress') AND a.due_at<$10)::int AS overdue,
        count(*) FILTER (WHERE a.status IN ('Open','InProgress') AND a.due_at>=$10 AND coalesce(a.starts_at,a.due_at)<$11)::int AS today,
        count(*) FILTER (WHERE a.status IN ('Open','InProgress') AND coalesce(a.starts_at,a.due_at)>=$11)::int AS upcoming,
        count(*) FILTER (WHERE a.status IN ('Open','InProgress') AND a.due_needed)::int AS needed
       FROM ppo.activities a WHERE ${where}`,
      [...args, ...timeArgs],
    )
  ).rows[0];
  const rows = (
    await c.query<Raw & { sort_key: string }>(
      `SELECT ${sql.select},${key} AS sort_key FROM ppo.activities a ${sql.joins}
       WHERE ${where} AND ${due}
        AND ($13::text IS NULL OR (${key}) COLLATE "C" ${descending ? "<" : ">"} $13 COLLATE "C" OR ((${key}) COLLATE "C"=$13 COLLATE "C" AND a.id>$14::uuid))
       ORDER BY (${key}) COLLATE "C" ${descending ? "DESC" : "ASC"},a.id LIMIT $15`,
      [...args, ...timeArgs, cursor?.k ?? null, cursor?.id ?? null, limit + 1],
    )
  ).rows;
  const page = rows.slice(0, limit),
    last = page.at(-1);
  const owners = team
    ? (
        await c.query<{ owner_id: string; owner_name: string; active: number; overdue: number; date_needed: number }>(
          `SELECT a.owner_id,u.display_name AS owner_name,count(*)::int AS active,
            count(*) FILTER (WHERE a.due_at<$5)::int AS overdue,count(*) FILTER (WHERE a.due_needed)::int AS date_needed
           FROM ppo.activities a JOIN ppo.users u ON (u.workspace_id,u.id)=(a.workspace_id,a.owner_id)
           WHERE a.workspace_id=$1 AND ${sql.visibility} AND a.status IN ('Open','InProgress')
            AND ($3::uuid IS NULL OR a.company_id=$3) AND ($4::text IS NULL OR a.kind=$4)
           GROUP BY a.owner_id,u.display_name ORDER BY u.display_name,a.owner_id LIMIT 50`,
          [p.workspace_id, p.actor_id, scope.company_id, scope.kind, t.now],
        )
      ).rows
    : null;
  return {
    items: page.map((row) => project(row, p, t.now)),
    next_cursor:
      last && rows.length > limit
        ? Buffer.from(JSON.stringify({ k: last.sort_key, id: last.id } satisfies Cursor)).toString("base64url")
        : null,
    observed_at: t.now,
    timezone: WORK_TIMEZONE,
    day: t.day,
    completeness: !cursor && rows.length <= limit ? "Complete" : "Partial",
    synthetic: true as const,
    total: counts.total,
    counts: { overdue: counts.overdue, today: counts.today, upcoming: counts.upcoming, date_needed: counts.needed },
    scope: { owner: team ? "all" : scope.owner, owner_id, company_id: scope.company_id, kind: scope.kind, ...filters },
    capabilities: { can_coordinate: await hasPermission(c, p, "activity.edit") },
    owners,
  };
}

// The full lists behind the two projection views. Same sources, same rules, larger window.
export async function readWorkWaiting(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "activity.read");
  const scope = scopeFilters(object(input, ["owner", "company_id"]), p),
    t = await clock(c);
  return {
    observed_at: t.now,
    timezone: WORK_TIMEZONE,
    day: t.day,
    synthetic: true as const,
    scope,
    waiting: await settle(() =>
      listWorkWaiting(p, { owner_id: scope.owner_id, company_id: scope.company_id, limit: 100 }),
    ),
  };
}
export async function readWorkReviews(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "activity.read");
  const r = object(input, ["company_id"]),
    t = await clock(c);
  return {
    observed_at: t.now,
    timezone: WORK_TIMEZONE,
    day: t.day,
    synthetic: true as const,
    reviews: await settle(() =>
      listWorkReviews(p, { company_id: optionalId(r.company_id, "company_id"), limit: 100 }),
    ),
  };
}

// Navigation facts for the My Work menu: whether the team view is open to this reader, and how
// many submissions await a decision they may make. A badge never shows a guess: an unreadable
// source yields no number.
export async function readWorkNavigation(p: Principal) {
  const c = database();
  await requireCapability(c, p, "activity.read");
  const [can_coordinate, sales, reviews] = await Promise.all([
    hasPermission(c, p, "activity.edit"),
    Promise.all([hasPermission(c, p, "crm.opportunity.read"), hasPermission(c, p, "crm.lead.read")]).then((v) => v.some(Boolean)),
    settle(() => listWorkReviews(p, { company_id: null, limit: 1 })),
  ]);
  return {
    observed_at: new Date().toISOString(),
    can_coordinate,
    sales,
    reviews: reviews.status === "ok" ? { status: reviews.status, total: reviews.total } : { status: reviews.status },
  };
}

// Other appointments the chosen owner already has in a proposed slot. Only appointments the
// reader may see are reported, so an empty answer means "none visible to you", and says so.
export async function readWorkConflicts(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "activity.read");
  const r = object(input, ["owner_id", "starts_at", "ends_at", "exclude"]);
  const owner = optionalId(r.owner_id, "owner_id") ?? p.actor_id,
    exclude = optionalId(r.exclude, "exclude");
  const from = Date.parse(String(r.starts_at)),
    to = Date.parse(String(r.ends_at));
  if (!Number.isFinite(from) || !Number.isFinite(to) || !(to > from) || to - from > 86400000)
    invalid("starts_at", "Give a start and a later end within 24 hours.");
  const sql = await rowSql(c);
  const rows = (
    await c.query<{ id: string; summary: string; starts_at: Date; due_at: Date }>(
      `SELECT a.id,a.summary,a.starts_at,a.due_at FROM ppo.activities a
       WHERE a.workspace_id=$1 AND ${sql.visibility} AND a.owner_id=$3 AND a.status IN ('Open','InProgress')
        AND a.starts_at IS NOT NULL AND a.starts_at<$5 AND a.due_at>$4 AND ($6::uuid IS NULL OR a.id<>$6)
       ORDER BY a.starts_at,a.id LIMIT 10`,
      [p.workspace_id, p.actor_id, owner, new Date(from).toISOString(), new Date(to).toISOString(), exclude],
    )
  ).rows;
  return {
    observed_at: new Date().toISOString(),
    basis: "Powerplants One appointments visible to you. No external calendar is connected.",
    items: rows.map((row) => ({
      id: row.id,
      summary: row.summary,
      starts_at: row.starts_at.toISOString(),
      ends_at: row.due_at.toISOString(),
    })),
  };
}
