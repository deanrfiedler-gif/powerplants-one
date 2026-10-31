import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { requireCapability, scopeSql } from "../../platform/permissions";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { canonical } from "../../platform/operations";
import { choice, invalid, object, optionalId } from "../../shared/validation";
import { sourceContext, sourceRevision, type SourceState } from "./context";

export const sourceStates = [
  "Draft",
  "Submitted",
  "Reviewed",
  "Returned",
  "Rejected",
] as const;

function search(value: unknown, field: string) {
  const text = value ?? "";
  if (
    typeof text !== "string" ||
    text.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(text)
  )
    invalid(field, "Use at most 100 characters without control characters.");
  return text.trim();
}
function windowNumber(
  value: unknown,
  field: string,
  fallback: number,
  min: number,
  max: number,
) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value))
    invalid(field, "Use a canonical whole number.");
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max)
    invalid(field, `Use a value from ${min} to ${max}.`);
  return n;
}
export function costSourceRegisterQuery(value: unknown) {
  const r = object(value, [
    "q",
    "supplier",
    "company_id",
    "state",
    "view",
    "validity",
    "limit",
    "offset",
  ]);
  return {
    q: search(r.q, "q"),
    supplier: search(r.supplier, "supplier"),
    company_id: optionalId(r.company_id, "company_id"),
    state: choice(r.state ?? "all", "state", ["all", ...sourceStates] as const),
    view: choice(r.view ?? "all", "view", [
      "all",
      "mine",
      "awaiting_my_review",
    ] as const),
    validity: choice(r.validity ?? "all", "validity", [
      "all",
      "unknown",
      "past",
    ] as const),
    limit: windowNumber(r.limit, "limit", 25, 1, 100),
    offset: windowNumber(r.offset, "offset", 0, 0, 1000000),
  };
}
type Filters = ReturnType<typeof costSourceRegisterQuery>;
type Candidate = {
  id: string;
  version: number;
  current_revision_id: string;
  state: SourceState;
  owner_id: string;
  author_id: string;
  can_review: boolean;
};
type Snapshot = {
  candidates: Candidate[];
  matching_count: number;
  counts: {
    all: number;
    mine: number;
    awaiting_my_review: number;
    states: Record<SourceState, number>;
    validity: { unknown: number; past: number };
  };
};

async function registerSnapshot(
  c: QueryClient,
  p: Principal,
  f: Filters,
  date: string,
) {
  return (
    await c.query<Snapshot>(
      `
    WITH permitted AS MATERIALIZED (
      SELECT s.id,s.version,s.current_revision_id,s.state,s.owner_id,s.updated_at,
        r.created_by AS author_id,
        s.owner_id=$2 AS mine,
        s.state='Submitted' AND s.owner_id<>$2 AND r.created_by<>$2
          AND ${scopeSql("s.company_id", "NULL::uuid", "estimating.source.review")} AS can_review,
        r.content->>'valid_until' IS NULL AS expiry_unknown,
        COALESCE((r.content->>'valid_until')::date < $6::date,false) AS expiry_past
      FROM ppo.cost_sources s
      JOIN ppo.cost_source_revisions r ON (r.workspace_id,r.id)=(s.workspace_id,s.current_revision_id)
      WHERE s.workspace_id=$1
        AND ${scopeSql("s.company_id", "NULL::uuid", "estimating.read")}
        AND ${scopeSql("s.company_id", "NULL::uuid", "shared.read")}
        AND ($3='' OR strpos(lower(s.reference||' '||(r.content->>'title')||' '||(r.content->>'supplier_label')||' '||(r.content->>'item_reference')),lower($3))>0)
        AND ($4='' OR strpos(lower(r.content->>'supplier_label'),lower($4))>0)
        AND ($5::uuid IS NULL OR s.company_id=$5)
    ), matching AS (
      SELECT * FROM permitted
      WHERE ($7='all' OR state=$7)
        AND ($8='all' OR ($8='mine' AND mine) OR ($8='awaiting_my_review' AND can_review))
        AND ($9='all' OR ($9='unknown' AND expiry_unknown) OR ($9='past' AND expiry_past))
    ), page AS (
      SELECT * FROM matching ORDER BY updated_at DESC,id LIMIT $10 OFFSET $11
    )
    SELECT
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',id,'version',version,
        'current_revision_id',current_revision_id,'state',state,'owner_id',owner_id,
        'author_id',author_id,'can_review',can_review) ORDER BY updated_at DESC,id) FROM page),'[]'::jsonb) AS candidates,
      (SELECT count(*)::int FROM matching) AS matching_count,
      jsonb_build_object('all',count(*)::int,'mine',count(*) FILTER (WHERE mine)::int,
        'awaiting_my_review',count(*) FILTER (WHERE can_review)::int,
        'states',jsonb_build_object(${sourceStates.map((s) => `'${s}',count(*) FILTER (WHERE state='${s}')::int`).join(",")}),
        'validity',jsonb_build_object('unknown',count(*) FILTER (WHERE expiry_unknown)::int,
          'past',count(*) FILTER (WHERE expiry_past)::int)) AS counts
    FROM permitted`,
      [
        p.workspace_id,
        p.actor_id,
        f.q,
        f.supplier,
        f.company_id,
        date,
        f.state,
        f.view,
        f.validity,
        f.limit + 1,
        f.offset,
      ],
    )
  ).rows[0];
}

const changed = () =>
  new AppError(
    409,
    "CostSourceRegisterChanged",
    "Source records or access changed during this read. Refresh the register.",
  );

// Additive read contract: the original list, detail DTO and native writers stay compatible.
export async function listCostSourceRegister(
  p: Principal,
  query: Record<string, string> = {},
) {
  const f = costSourceRegisterQuery(query);
  return transaction(async (c) => {
    await requireCapability(c, p, "estimating.read");
    await requireCapability(c, p, "shared.read");
    // Native source commands use this same lock. READ COMMITTED lets the final
    // authority query observe grants revoked independently during hydration.
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const clock = (
      await c.query<{ as_of: Date; validity_date: string }>(
        "SELECT statement_timestamp() AS as_of,to_char(statement_timestamp() AT TIME ZONE 'Australia/Brisbane','YYYY-MM-DD') AS validity_date",
      )
    ).rows[0];
    const snapshot = await registerSnapshot(c, p, f, clock.validity_date);
    const createCompanies = async () => (await c.query<{ id: string; display_name: string }>(
      `SELECT c.id,c.display_name FROM ppo.companies c WHERE c.workspace_id=$1
        AND ${scopeSql("c.id", "NULL::uuid", "estimating.read")}
        AND ${scopeSql("c.id", "NULL::uuid", "shared.read")}
        AND ${scopeSql("c.id", "NULL::uuid", "estimating.edit")}
        ORDER BY c.display_name,c.id`, [p.workspace_id, p.actor_id],
    )).rows;
    const companies = await createCompanies();
    const items = [];
    for (const row of snapshot.candidates.slice(0, f.limit)) {
      const source = await sourceContext(c, p, row.id);
      if (
        source.version !== row.version ||
        source.current_revision_id !== row.current_revision_id
      )
        throw changed();
      const revision = await sourceRevision(
        c,
        p,
        source,
        row.current_revision_id,
      );
      const content = revision.content;
      items.push({
        id: source.id,
        reference: source.reference,
        company_id: source.company_id,
        version: source.version,
        state: source.state,
        revision: revision.revision,
        revision_id: revision.id,
        content_hash: revision.content_hash,
        owner_id: source.owner_id,
        revision_author_id: revision.created_by,
        owned_by_me: source.owner_id === p.actor_id,
        your_submission:
          source.state === "Submitted" &&
          (source.owner_id === p.actor_id ||
            revision.created_by === p.actor_id),
        can_review: row.can_review,
        title: content.title,
        supplier: content.supplier_label,
        supplier_entity_key: content.supplier_entity_key,
        item: content.item_reference,
        unit: content.unit,
        currency: content.currency,
        tax_basis: content.tax_basis,
        tier_1: content.tiers[0],
        effective_from: content.effective_from,
        valid_until: content.valid_until,
        expiry_unknown: content.valid_until === null,
        expiry_past:
          content.valid_until !== null &&
          content.valid_until < clock.validity_date,
        updated_at: source.updated_at,
      });
    }
    // Recheck all counted metadata, the visible window and its lookahead. Do not
    // return stale rows, review affordances or counts after a current-access change.
    const current = await registerSnapshot(c, p, f, clock.validity_date);
    await requireCapability(c, p, "estimating.read");
    await requireCapability(c, p, "shared.read");
    if (canonical(current) !== canonical(snapshot)) throw changed();
    if (canonical(await createCompanies()) !== canonical(companies)) throw changed();
    return {
      items,
      companies,
      counts: current.counts,
      matching_count: current.matching_count,
      counts_scope: "AllAuthorisedSearchMatches",
      counts_filters: {
        q: f.q,
        supplier: f.supplier,
        company_id: f.company_id,
      },
      filters: f,
      limit: f.limit,
      offset: f.offset,
      next_offset:
        current.candidates.length > f.limit ? f.offset + f.limit : null,
      sort: "updated_desc",
      as_of: clock.as_of.toISOString(),
      validity_date: clock.validity_date,
      validity_timezone: "Australia/Brisbane",
      synthetic: true,
    };
  });
}
