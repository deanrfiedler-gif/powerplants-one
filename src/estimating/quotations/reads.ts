import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { requireCapability } from "../../platform/permissions";
import { unavailable } from "../../platform/errors";
import { uuid } from "../../shared/validation";
import { estimateVisibility } from "../context";
import {
  quotationQuery,
  quotationHistoryQuery,
  quotationStages,
} from "./model";
import {
  quotationRevision,
  unavailableSource,
  type QuotationHeader,
} from "./projection";

type Projection = Awaited<ReturnType<typeof quotationRevision>>;
const sorts = {
  updated_desc: "q.updated_at DESC,q.id",
  updated_asc: "q.updated_at,q.id",
  reference_asc: "q.display_number,q.id",
} as const;

export async function listQuotations(
  p: Principal,
  query: Record<string, string> = {},
) {
  const f = quotationQuery(query);
  return transaction(async (c) => {
    await requireCapability(c, p, "estimating.read");
    await requireCapability(c, p, "estimating.quote.read");
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const asOf = (await c.query<{ now: Date }>("SELECT clock_timestamp() now"))
      .rows[0].now;
    const candidates = (
      await c.query<QuotationHeader>(
        `
      SELECT q.id,q.current_revision_id,q.updated_at,q.display_number
      FROM ppo.draft_quotes q
      JOIN ppo.draft_quote_revisions r ON (r.workspace_id,r.id)=(q.workspace_id,q.current_revision_id)
      JOIN ppo.estimates e ON (e.workspace_id,e.id)=(q.workspace_id,q.estimate_id)
      JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(e.workspace_id,e.opportunity_id)
      LEFT JOIN ppo.quote_release_bases b ON (b.workspace_id,b.revision_id)=(r.workspace_id,r.id)
      WHERE q.workspace_id=$1 AND ${estimateVisibility("e", "estimating.read", true)}
        AND ${estimateVisibility("e", "estimating.quote.read", true)}
        AND ($3='' OR strpos(lower(q.display_number || ' ' || (r.safe_snapshot->>'title') || ' ' || (r.safe_snapshot->>'customer')),lower($3))>0)
        AND ($4::uuid IS NULL OR e.owner_id=$4)
        AND ($5::uuid IS NULL OR COALESCE((b.basis#>>'{recipient,organisation_id}')::uuid,o.organisation_id)=$5)
      ORDER BY ${sorts[f.sort]} LIMIT $6 OFFSET $7`,
        [
          p.workspace_id,
          p.actor_id,
          f.q,
          f.owner_id,
          f.customer_id,
          f.limit + 1,
          f.offset,
        ],
      )
    ).rows;
    let partial = false;
    const visible = new Map<string, Projection>();
    // Repeat exact reads before publishing the window: no cached actor authority.
    for (let pass = 0; pass < 2; pass++) {
      for (const header of candidates.slice(0, f.limit)) {
        if (pass && !visible.has(header.id)) continue;
        try {
          visible.set(
            header.id,
            await quotationRevision(c, p, header, header.current_revision_id),
          );
        } catch (error) {
          if (!unavailableSource(error)) throw error;
          visible.delete(header.id);
          partial = true;
        }
      }
    }
    const rows = [...visible.values()].map((r) => r.summary);
    partial ||= rows.some((r) => r.lifecycle_completeness === "Partial");
    const counts = {
      all: rows.length,
      mine: rows.filter((r) => r.owned_by_me).length,
      needs_attention: rows.filter((r) => r.needs_attention).length,
      unknown_stage: rows.filter((r) => r.stage === null).length,
      stages: Object.fromEntries(
        quotationStages.map((s) => [
          s,
          rows.filter((r) => r.stage === s).length,
        ]),
      ),
    };
    await requireCapability(c, p, "estimating.read");
    await requireCapability(c, p, "estimating.quote.read");
    return {
      items: rows.filter(
        (r) =>
          (f.stage === "all" || r.stage === f.stage) &&
          (f.view === "all" ||
            (f.view === "mine" ? r.owned_by_me : r.needs_attention)),
      ),
      counts,
      counts_scope: "CurrentCandidateWindow",
      completeness: partial ? "PartialWindow" : "CompleteWindow",
      offset: f.offset,
      candidate_limit: f.limit,
      next_offset: candidates.length > f.limit ? f.offset + f.limit : null,
      sort: f.sort,
      as_of: asOf.toISOString(),
      period: "AllTime",
      synthetic: true,
    };
  });
}

export async function readQuotation(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  const quoteId = uuid(id, "id"),
    f = quotationHistoryQuery(query);
  return transaction(async (c) => {
    await requireCapability(c, p, "estimating.read");
    await requireCapability(c, p, "estimating.quote.read");
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const header = (
      await c.query<QuotationHeader>(
        "SELECT id,current_revision_id,updated_at,display_number FROM ppo.draft_quotes WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, quoteId],
      )
    ).rows[0];
    if (!header) throw unavailable();
    await quotationRevision(c, p, header, header.current_revision_id);
    const candidates = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.draft_quote_revisions WHERE workspace_id=$1 AND quote_id=$2 ORDER BY version DESC,id LIMIT $3 OFFSET $4",
        [p.workspace_id, quoteId, f.limit + 1, f.offset],
      )
    ).rows;
    const visible = new Map<string, Projection>();
    let partial = false;
    for (let pass = 0; pass < 2; pass++) {
      for (const revision of candidates.slice(0, f.limit)) {
        if (pass && !visible.has(revision.id)) continue;
        try {
          visible.set(
            revision.id,
            await quotationRevision(c, p, header, revision.id),
          );
        } catch (error) {
          if (!unavailableSource(error)) throw error;
          visible.delete(revision.id);
          partial = true;
        }
      }
    }
    const latest = await quotationRevision(
      c,
      p,
      header,
      header.current_revision_id,
    );
    const revisions = [...visible.values()];
    partial ||=
      latest.summary.lifecycle_completeness === "Partial" ||
      revisions.some((r) => r.summary.lifecycle_completeness === "Partial");
    await requireCapability(c, p, "estimating.read");
    await requireCapability(c, p, "estimating.quote.read");
    return {
      latest: latest.summary,
      revisions,
      completeness: partial ? "PartialWindow" : "CompleteWindow",
      offset: f.offset,
      candidate_limit: f.limit,
      next_offset: candidates.length > f.limit ? f.offset + f.limit : null,
      synthetic: true,
    };
  });
}
