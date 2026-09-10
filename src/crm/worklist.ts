import { leadsAvailable } from "./leads/context";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { hasPermission, requireCapability, scopeSql } from "../platform/permissions";
import { activityVisibility } from "../activities/activities";
import { envelope, page } from "../shared/reads";
import { choice, invalid, object, optionalId } from "../shared/validation";
import { opportunityVisibility, PIPELINE_ID } from "./context";

// Ephemeral read cursors confer no authority. Restart requires a fresh read.
const key = randomBytes(32);
const sign = (body: string) => createHmac("sha256", key).update(body).digest("base64url");
type Cursor = { binding: string; as_of: string; after: string; sort_key: string; stamp: string };
export type WorklistItem = {
  id: string; display_number: string; title: string; stage_id: "Enquiry" | "Qualified";
  close_outcome: "Open"; stage_entered_at: string; updated_at: string; version: number;
  company_id: string; company_name: string; organisation_name: string;
  site_id: string | null; site_name: string | null;
  owner_id: string; owner_name: string;
  primary_person_id: string | null; contact_name: string | null;
  next_action_state: "Unavailable" | "Needed" | "DueNeeded" | "Overdue" | "Upcoming";
  next_action_id: string | null; next_action_summary: string | null;
  action_owner_id: string | null; action_owner_name: string | null;
  due_at: string | null; due_needed: boolean | null;
  value_amount: string | null; expected_close_date: string | null; can_edit: boolean;
};

export async function listOpportunities(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "crm.opportunity.read");
  const r = object(input, ["limit", "cursor", "q", "company_id", "site_id", "owner_id", "stage_id", "next_action", "sort"]);
  const filters = {
    owner_id: optionalId(r.owner_id, "owner_id"),
    stage_id: r.stage_id === undefined ? null : choice(r.stage_id, "stage_id", ["Enquiry", "Qualified"]),
    next_action: r.next_action === undefined ? null : choice(r.next_action, "next_action", ["Needed", "DueNeeded", "Overdue", "Upcoming", "Unavailable"]),
    sort: r.sort === undefined ? "Reference" : choice(r.sort, "sort", ["Reference", "Title", "Newest"]),
  };
  const pg = page(Object.fromEntries(Object.entries(r).filter(([k]) => ["limit", "q", "company_id", "site_id"].includes(k))), {});
  const binding = JSON.stringify({ actor: p.actor_id, workspace: p.workspace_id, ...filters, q: pg.q, company: pg.company_id, site: pg.site_id, limit: pg.limit });
  let cursor: Cursor | null = null;
  if (r.cursor !== undefined) {
    try {
      if (typeof r.cursor !== "string" || r.cursor.length > 4000) throw Error();
      const [body, signature, ...extra] = r.cursor.split(".");
      if (extra.length || !signature || signature.length !== sign(body).length || !timingSafeEqual(Buffer.from(signature), Buffer.from(sign(body)))) throw Error();
      cursor = JSON.parse(Buffer.from(body, "base64url").toString()) as Cursor;
      if (cursor.binding !== binding) throw Error();
    } catch {
      invalid("cursor", "This page token is invalid or its filters changed. Start a fresh read.");
    }
  }
  const as_of = cursor?.as_of ?? new Date().toISOString();
  const stages = (await c.query<{ stage_id: "Enquiry" | "Qualified"; ordinal: number; pipeline_definition_id: string; pipeline_label: string }>(
    `SELECT s.stage_id,s.ordinal,s.pipeline_definition_id,d.label AS pipeline_label FROM ppo.crm_stage_definitions s JOIN ppo.crm_pipeline_definitions d ON (d.workspace_id,d.id)=(s.workspace_id,s.pipeline_definition_id) WHERE s.workspace_id=$1 AND d.id=$2 AND d.definition_key='SyntheticEnquiryI1' AND d.version=1 ORDER BY s.ordinal`, [p.workspace_id, PIPELINE_ID],
  )).rows;
  if (stages.length !== 2 || stages[0].stage_id !== "Enquiry" || stages[1].stage_id !== "Qualified")
    throw new AppError(503, "PipelineUnavailable", "The sales stage definition is unavailable. Try loading again.");
  // Expressions are closed server choices. UUID is a unique tie breaker for every sort.
  const sortKey = filters.sort === "Title" ? 'lower(o.title) COLLATE "C"' : filters.sort === "Newest" ? `to_char(o.created_at AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS.US')` : "o.id::text";
  const descending = filters.sort === "Newest";
  const result = (await c.query<{ stamp: string; items: (WorklistItem & { sort_key: string; action_version: number | null })[] }>(
    `WITH permitted AS MATERIALIZED (
      SELECT o.id,o.display_number,o.title,o.stage_id,o.close_outcome,o.stage_entered_at,o.updated_at,o.version,to_jsonb(o)->>'value_amount' AS value_amount,to_jsonb(o)->>'expected_close_date' AS expected_close_date,(o.owner_id=$2 AND ${scopeSql("o.company_id","o.site_id","crm.opportunity.edit")}) AS can_edit,
        o.company_id,co.display_name AS company_name,r.display_name AS organisation_name,o.site_id,s.display_name AS site_name,
        o.primary_person_id,pe.display_name AS contact_name,o.owner_id,u.display_name AS owner_name,a.id AS next_action_id,a.summary AS next_action_summary,a.owner_id AS action_owner_id,au.display_name AS action_owner_name,a.due_at,a.due_needed,a.version AS action_version,
        CASE WHEN a.id IS NULL THEN 'Unavailable' WHEN a.status NOT IN ('Open','InProgress') THEN 'Needed' WHEN a.due_needed THEN 'DueNeeded' WHEN a.due_at<$10::timestamptz THEN 'Overdue' ELSE 'Upcoming' END AS next_action_state,
        ${sortKey} AS sort_key
      FROM ppo.opportunities o JOIN ppo.companies co ON (co.workspace_id,co.id)=(o.workspace_id,o.company_id)
      JOIN ppo.users u ON (u.workspace_id,u.id)=(o.workspace_id,o.owner_id)
      JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id)
      LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(o.workspace_id,o.site_id)
      LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(o.workspace_id,o.primary_person_id)
      LEFT JOIN ppo.activities a ON (a.workspace_id,a.id)=(o.workspace_id,o.next_activity_id) AND ${activityVisibility("a", true, await leadsAvailable(c))}
      LEFT JOIN ppo.users au ON (au.workspace_id,au.id)=(a.workspace_id,a.owner_id)
      WHERE o.workspace_id=$1 AND ${opportunityVisibility()}
        AND ($3::uuid IS NULL OR o.company_id=$3) AND ($4::uuid IS NULL OR o.site_id=$4)
        AND position(lower($5) in lower(o.title||' '||o.display_number||' '||r.display_name))>0
        AND ($6::uuid IS NULL OR o.owner_id=$6) AND ($7::text IS NULL OR o.stage_id=$7)
        AND o.created_at<=$10::timestamptz
    ), matching AS MATERIALIZED (SELECT * FROM permitted WHERE $8::text IS NULL OR next_action_state=$8),
    stamp AS (SELECT md5(coalesce(string_agg(md5(row_to_json(m)::text),'' ORDER BY id),'')) AS stamp FROM matching m),
    result_window AS (SELECT * FROM matching WHERE $9::uuid IS NULL OR sort_key COLLATE "C" ${descending ? "<" : ">"} $11::text COLLATE "C" OR (sort_key COLLATE "C"=$11::text COLLATE "C" AND id>$9) ORDER BY sort_key COLLATE "C" ${descending ? "DESC" : "ASC"},id LIMIT $12)
    SELECT stamp.stamp,coalesce((SELECT jsonb_agg(row_to_json(w) ORDER BY sort_key COLLATE "C" ${descending ? "DESC" : "ASC"},id) FROM result_window w),'[]'::jsonb) AS items FROM stamp`,
    [p.workspace_id, p.actor_id, pg.company_id, pg.site_id, pg.q, filters.owner_id, filters.stage_id, filters.next_action, cursor?.after ?? null, as_of, cursor?.sort_key ?? null, pg.limit + 1],
  )).rows[0];
  if (cursor && cursor.stamp !== result.stamp)
    throw new AppError(409, "WorklistChanged", "The permitted results changed. Refresh from start to avoid skipped or repeated opportunities.");
  const selected = result.items.slice(0, pg.limit);
  const last = selected.at(-1);
  let next_cursor: string | null = null;
  if (last && result.items.length > pg.limit) {
    const body = Buffer.from(JSON.stringify({ binding, as_of, after: last.id, sort_key: last.sort_key, stamp: result.stamp } satisfies Cursor)).toString("base64url");
    next_cursor = `${body}.${sign(body)}`;
  }
  const items: WorklistItem[] = selected.map(({ sort_key, action_version, ...item }) => {
    void sort_key; void action_version;
    return item;
  });
  return {
    ...envelope(items, next_cursor),
    completeness: !cursor && !next_cursor ? "Complete" : "Partial",
    window: { as_of, first_page: !cursor, has_more: !!next_cursor, count_basis: "ReturnedPage" as const },
    stages: stages.map((stage) => ({ ...stage, count: items.filter((item) => item.stage_id === stage.stage_id).length })),
    sort: filters.sort,
    can_create: await hasPermission(c, p, "crm.opportunity.create"),
  };
}

// Filter labels come only from permitted opportunities, including for readers without create authority.
export async function worklistOptions(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "crm.opportunity.read");
  const r = object(input, ["kind", "company_id", "q", "limit", "cursor"]);
  const kind = choice(r.kind, "kind", ["Company", "Site", "Owner"]);
  const pg = page(Object.fromEntries(Object.entries(r).filter(([k]) => k !== "kind")), { workspace: p.workspace_id, actor: p.actor_id, resource: "CrmWorklistOptions", kind });
  const target = { Company: ["companies", "company_id"], Site: ["sites", "site_id"], Owner: ["users", "owner_id"] }[kind];
  const rows = (await c.query<{ id: string; display_name: string }>(
    `SELECT DISTINCT x.id,x.display_name FROM ppo.opportunities o JOIN ppo.${target[0]} x ON (x.workspace_id,x.id)=(o.workspace_id,o.${target[1]}) WHERE o.workspace_id=$1 AND ${opportunityVisibility()} AND ($3::uuid IS NULL OR o.company_id=$3) AND ($4::uuid IS NULL OR x.id>$4) AND position(lower($5) in lower(x.display_name))>0 ORDER BY x.id LIMIT $6`,
    [p.workspace_id, p.actor_id, pg.company_id, pg.after, pg.q, pg.limit + 1],
  )).rows;
  return { ...envelope(rows.slice(0, pg.limit), rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null), count_basis: "ReturnedPage" };
}
