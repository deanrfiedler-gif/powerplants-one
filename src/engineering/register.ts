import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { requireCapability } from "../platform/permissions";
import { workingCompanyFor } from "../platform/working-company";
import { page } from "../shared/reads";
import { invalid } from "../shared/validation";
import { controlCountsSql } from "./control/workload";
import {
  engineeringProjectionSql,
  engineeringVisibilitySql,
  projectEngineering,
  type EngineeringRow,
} from "./service";
import { workloadOrder, workloadQuery } from "./register-query";

type RegisterRow = EngineeringRow & {
  needs_attention: boolean;
  owner_active: boolean;
};
type Summary = {
  fingerprint: string;
  counts: {
    all: number;
    mine: number;
    author: number;
    review: number;
    released: number;
    attention: number;
    states: {
      Queued: number;
      "In design": number;
      "Awaiting information": number;
    };
  };
  matching_count: number;
  engineers: { id: string; name: string; active: boolean }[];
  engineer_count: number;
};
// $1/$2 workspace/actor; $3 text; $4 discipline; $5 attention; $6 Brisbane date;
// $7 owner; $8 view; $9 state. Every population, count and facet uses native source authority.
function sourceSql() {
  return `WITH source AS MATERIALIZED (
    ${engineeringProjectionSql.replace(
      "SELECT p.*,",
      `SELECT ${controlCountsSql} AS technical,u.active AS owner_active,
      p.id,p.workspace_id,p.display_number,p.version,p.title,p.brief,p.company_id,p.organisation_id,p.site_id,
      p.project_id,p.opportunity_id,p.owner_id,p.discipline,p.state,p.next_action,p.blocker,p.updated_at,`,
    )}
    WHERE p.workspace_id=$1 AND ${engineeringVisibilitySql()}
      AND position($3 IN lower(concat_ws(' ',p.title,p.display_number,p.id::text,org.display_name,coalesce(ctx_project.title,ctx_op.title))))>0
      AND ($4::text IS NULL OR p.discipline=$4)
  ), observed AS MATERIALIZED (
    SELECT source.*, (blocker IS NOT NULL OR (technical->>'blocked')::int>0
      OR coalesce(required_date::date<$6::date,false) OR coalesce(action_due::date<$6::date,false)) AS needs_attention
    FROM source
  ), base AS MATERIALIZED (
    SELECT * FROM observed WHERE NOT $5::boolean OR needs_attention
  ), filtered AS MATERIALIZED (
    SELECT * FROM base WHERE $7::uuid IS NULL OR owner_id=$7
  ), selected AS (
    SELECT * FROM filtered WHERE ($9::text IS NULL OR state=$9) AND ($8='all' OR ($8='mine' AND owner_id=$2)
      OR ($8='author' AND (technical->>'author_waiting')::int>0)
      OR ($8='review' AND (technical->>'reviews')::int>0)
      OR ($8='released' AND (technical->>'released')::int>0))
  )`;
}
const summarySql = `
  SELECT
    (SELECT md5(coalesce(string_agg(md5(to_jsonb(b)::text),'' ORDER BY b.id),'')) FROM base b) AS fingerprint,
    (SELECT jsonb_build_object(
      'all',count(*),'mine',count(*) FILTER(WHERE owner_id=$2),
      'author',count(*) FILTER(WHERE (technical->>'author_waiting')::int>0),
      'review',count(*) FILTER(WHERE (technical->>'reviews')::int>0),
      'released',count(*) FILTER(WHERE (technical->>'released')::int>0),
      'attention',count(*) FILTER(WHERE needs_attention),
      'states',jsonb_build_object(
        'Queued',count(*) FILTER(WHERE state='Queued'),
        'In design',count(*) FILTER(WHERE state='In design'),
        'Awaiting information',count(*) FILTER(WHERE state='Awaiting information'))) FROM filtered) AS counts,
    (SELECT count(*)::int FROM selected) AS matching_count,
    (SELECT coalesce(jsonb_agg(e ORDER BY lower(e.name) COLLATE "C",e.id),'[]'::jsonb) FROM (
      SELECT * FROM (SELECT DISTINCT owner_id AS id,owner_name AS name,owner_active AS active FROM base) owners
      ORDER BY lower(name) COLLATE "C",id LIMIT 100
    ) e) AS engineers,
    (SELECT count(DISTINCT owner_id)::int FROM base) AS engineer_count`;

export async function engineeringRegister(p: Principal, input: unknown = {}) {
  const q = workloadQuery(input);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    await requireCapability(c, p, "engineering.read");
    const clock = (
      await c.query<{ observed_at: Date; observed_on: string }>(
        "SELECT statement_timestamp() AS observed_at,(statement_timestamp() AT TIME ZONE 'Australia/Brisbane')::date::text AS observed_on",
      )
    ).rows[0];
    const source = sourceSql();
    const values = [
      p.workspace_id,
      p.actor_id,
      q.q,
      q.discipline,
      q.attention,
      clock.observed_on,
      q.owner_id,
      q.view,
      q.state,
    ];
    const summary = async () =>
      (await c.query<Summary>(source + summarySql, values)).rows[0];
    const original = await summary();
    const { cursor, ...filters } = q;
    const pg = page(
      { limit: q.limit, cursor },
      {
        kind: "EngineeringRegister",
        workspace: p.workspace_id,
        actor: p.actor_id,
        company: workingCompanyFor(p.actor_id),
        filters,
        observed_on: clock.observed_on,
        source: original.fingerprint,
      },
    );
    const rows = (
      await c.query<RegisterRow>(
        `${source}, ordered AS (
        SELECT r.*,row_number() OVER(ORDER BY ${workloadOrder(q)}) AS position FROM selected r
      ) SELECT * FROM ordered WHERE $10::uuid IS NULL
        OR position>(SELECT position FROM ordered WHERE id=$10)
      ORDER BY position LIMIT $11`,
        [...values, pg.after, q.limit + 1],
      )
    ).rows;
    // A returned token must identify a row in this exact source. Never silently
    // interpret a missing anchor as a complete empty final page.
    if (pg.after && !rows.length)
      invalid("cursor", "This page has changed or ended. Start a fresh read.");
    const current = await summary();
    await requireCapability(c, p, "engineering.read");
    if (JSON.stringify(current) !== JSON.stringify(original))
      throw new AppError(
        409,
        "ReadConflict",
        "Engineering workload changed during this read. Refresh the register.",
      );
    const more = rows.length > q.limit;
    const items = rows.slice(0, q.limit).map((r) => ({
      ...projectEngineering(r),
      technical: r.technical!,
      owner_active: r.owner_active,
      needs_attention: r.needs_attention,
    }));
    return {
      items,
      next_cursor: more ? pg.cursor(items.at(-1)!.id) : null,
      counts: original.counts,
      matching_count: original.matching_count,
      count_scope: "AllAuthorisedMatches" as const,
      engineers: {
        items: original.engineers,
        has_more: original.engineer_count > 100,
        scope: "AssignedToSearchMatches" as const,
      },
      filters,
      observed_at: clock.observed_at.toISOString(),
      observed_on: clock.observed_on,
      completeness: more ? ("Partial" as const) : ("Complete" as const),
      source: "Synthetic" as const,
    };
  });
}
