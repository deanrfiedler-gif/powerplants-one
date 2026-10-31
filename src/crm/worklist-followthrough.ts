import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import { requireCapability } from "../platform/permissions";
import { object } from "../shared/validation";
import { visibleOpportunity } from "./context";
import { estimateContext, versionContext } from "../estimating/context";
import {
  quotationRevision,
  unavailableSource,
  type QuotationHeader,
} from "../estimating/quotations/projection";
import {
  handoverRecord,
  handoverBasis,
  hashBasis,
} from "../sales/handover-service";
import { dealExitGuidance } from "./worklist-advisory";

type Section<T> = {
  availability: "Complete" | "Partial" | "Unavailable";
  items: T[];
  has_more: boolean;
  candidate_limit: number;
};
const limit = 20;
const section = <T>(): Section<T> => ({
  availability: "Complete",
  items: [],
  has_more: false,
  candidate_limit: limit,
});
const restricted = (error: unknown) =>
  unavailableSource(error) ||
  (error instanceof AppError && error.status === 409);
type Quotation = Pick<
  Awaited<ReturnType<typeof quotationRevision>>["summary"],
  | "id"
  | "revision_id"
  | "revision"
  | "reference"
  | "estimate_id"
  | "estimate_version_id"
  | "is_current_revision"
  | "issue_id"
  | "response_id"
  | "response_outcome"
  | "response_ready"
  | "response_holds"
  | "basis_current"
  | "links"
>;
type Estimate = {
  id: string;
  reference: string;
  version_id: string;
  version: number;
  state: string;
  content_hash: string;
};
type Handover = {
  id: string;
  kind: "Estimating" | "Won";
  version: number;
  revision: number;
  state: string;
  source_hash: string | null;
  source_changed: boolean;
  href: string;
};

// A bounded adjunct to the deal read. Every published source passes its native
// exact-version authority; the workspace lock follows the quotation read contract.
// Source access is independent of sales access. No advisory fact is a command gate.
export async function readDealFollowThrough(
  p: Principal,
  id: string,
  query: unknown = {},
) {
  object(query, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const o = await visibleOpportunity(c, p, id);
    const estimates = section<Estimate>(),
      quotations = section<Quotation>(),
      handovers = section<Handover>();
    try {
      await requireCapability(c, p, "estimating.read");
      const candidates = (
        await c.query<{ id: string }>(
          "SELECT id FROM ppo.estimates WHERE workspace_id=$1 AND opportunity_id=$2 ORDER BY updated_at DESC,id LIMIT $3",
          [p.workspace_id, id, limit + 1],
        )
      ).rows;
      estimates.has_more = candidates.length > limit;
      for (const candidate of candidates.slice(0, limit))
        try {
          const e = await estimateContext(c, p, candidate.id),
            v = await versionContext(c, p, e, e.current_version_id);
          estimates.items.push({
            id: e.id,
            reference: e.display_number,
            version_id: v.id,
            version: v.version,
            state: e.state,
            content_hash: v.content_hash,
          });
        } catch (error) {
          if (!restricted(error)) throw error;
          estimates.availability = "Partial";
        }
      await requireCapability(c, p, "estimating.read");
    } catch (error) {
      if (!restricted(error)) throw error;
      estimates.availability = "Unavailable";
      estimates.items = [];
      estimates.has_more = false;
    }
    try {
      await requireCapability(c, p, "estimating.read");
      await requireCapability(c, p, "estimating.quote.read");
      // Include exact issued revisions, even when a newer unissued draft exists.
      const candidates = (
        await c.query<QuotationHeader & { revision_id: string }>(
          `
        SELECT q.id,q.current_revision_id,q.updated_at,q.display_number,r.id revision_id
        FROM ppo.draft_quotes q
        JOIN ppo.estimates e ON (e.workspace_id,e.id)=(q.workspace_id,q.estimate_id)
        JOIN ppo.draft_quote_revisions r ON (r.workspace_id,r.quote_id)=(q.workspace_id,q.id)
        WHERE q.workspace_id=$1 AND e.opportunity_id=$2
          AND EXISTS(SELECT 1 FROM ppo.quote_release_events i WHERE (i.workspace_id,i.revision_id)=(r.workspace_id,r.id) AND i.action='Issue')
        ORDER BY r.created_at DESC,r.id LIMIT $3`,
          [p.workspace_id, id, limit + 1],
        )
      ).rows;
      quotations.has_more = candidates.length > limit;
      for (const header of candidates.slice(0, limit))
        try {
          const { summary: q } = await quotationRevision(
            c,
            p,
            header,
            header.revision_id,
          );
          if (!q.issue_id) continue;
          quotations.items.push({
            id: q.id,
            revision_id: q.revision_id,
            revision: q.revision,
            reference: q.reference,
            estimate_id: q.estimate_id,
            estimate_version_id: q.estimate_version_id,
            is_current_revision: q.is_current_revision,
            issue_id: q.issue_id,
            response_id: q.response_id,
            response_outcome: q.response_outcome,
            response_ready: q.response_ready,
            response_holds: q.response_holds,
            basis_current: q.basis_current,
            links: q.links,
          });
          if (q.lifecycle_completeness === "Partial")
            quotations.availability = "Partial";
        } catch (error) {
          if (!restricted(error)) throw error;
          quotations.availability = "Partial";
        }
      await requireCapability(c, p, "estimating.read");
      await requireCapability(c, p, "estimating.quote.read");
    } catch (error) {
      if (!restricted(error)) throw error;
      quotations.availability = "Unavailable";
      quotations.items = [];
      quotations.has_more = false;
    }
    const candidates = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.sales_handovers WHERE workspace_id=$1 AND opportunity_id=$2 ORDER BY updated_at DESC,id LIMIT $3",
        [p.workspace_id, id, limit + 1],
      )
    ).rows;
    handovers.has_more = candidates.length > limit;
    for (const candidate of candidates.slice(0, limit))
      try {
        const { row } = await handoverRecord(c, p, candidate.id),
          basis = await handoverBasis(c, p, row);
        handovers.items.push({
          id: row.id,
          kind: row.kind,
          version: row.version,
          revision: row.revision,
          state: row.state,
          source_hash: row.source_hash,
          source_changed:
            !!row.source_hash && row.source_hash !== hashBasis(basis),
          href: `/sales/handoffs/${row.kind === "Won" ? "won" : "estimating"}/${row.id}`,
        });
      } catch (error) {
        if (!restricted(error)) throw error;
        handovers.availability = "Partial";
      }
    // Re-read every included source before publication, as native quotation reads do.
    // A grant or source relation revoked during this request must remove its facts.
    for (const item of [...estimates.items])
      try {
        const e = await estimateContext(c, p, item.id);
        const v = await versionContext(c, p, e, item.version_id);
        if (e.opportunity_id !== id || e.current_version_id !== v.id)
          throw new AppError(409, "SourceChanged", "Estimate source changed.");
      } catch (error) {
        if (!restricted(error)) throw error;
        estimates.items = estimates.items.filter((e) => e.id !== item.id);
        estimates.availability = "Partial";
      }
    for (const item of [...quotations.items])
      try {
        const header = (
          await c.query<QuotationHeader>(
            "SELECT id,current_revision_id,updated_at,display_number FROM ppo.draft_quotes WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, item.id],
          )
        ).rows[0];
        if (!header)
          throw new AppError(404, "Unavailable", "Quotation unavailable.");
        const { summary: q } = await quotationRevision(
          c,
          p,
          header,
          item.revision_id,
        );
        const e = await estimateContext(c, p, q.estimate_id);
        if (e.opportunity_id !== id)
          throw new AppError(409, "SourceChanged", "Quotation source changed.");
        Object.assign(item, {
          is_current_revision: q.is_current_revision,
          issue_id: q.issue_id,
          response_id: q.response_id,
          response_outcome: q.response_outcome,
          response_ready: q.response_ready,
          response_holds: q.response_holds,
          basis_current: q.basis_current,
        });
        if (q.lifecycle_completeness === "Partial")
          quotations.availability = "Partial";
      } catch (error) {
        if (!restricted(error)) throw error;
        quotations.items = quotations.items.filter(
          (q) => q.revision_id !== item.revision_id,
        );
        quotations.availability = "Partial";
      }
    for (const item of [...handovers.items])
      try {
        const { row } = await handoverRecord(c, p, item.id),
          basis = await handoverBasis(c, p, row);
        if (row.opportunity_id !== id)
          throw new AppError(409, "SourceChanged", "Handover source changed.");
        Object.assign(item, {
          version: row.version,
          revision: row.revision,
          state: row.state,
          source_hash: row.source_hash,
          source_changed:
            !!row.source_hash && row.source_hash !== hashBasis(basis),
        });
      } catch (error) {
        if (!restricted(error)) throw error;
        handovers.items = handovers.items.filter((h) => h.id !== item.id);
        handovers.availability = "Partial";
      }
    const current = await visibleOpportunity(c, p, id);
    if (current.version !== o.version)
      throw new AppError(
        409,
        "SourceChanged",
        "The deal changed during this read. Reload its snapshot.",
      );
    const observed = (
      await c.query<{ now: Date }>("SELECT clock_timestamp() now")
    ).rows[0].now;
    return {
      opportunity_id: id,
      opportunity_version: o.version,
      observed_at: observed.toISOString(),
      estimates,
      quotations,
      handovers,
      advisory: {
        stage: o.stage_id,
        conditions: dealExitGuidance(o.stage_id),
        assessment: "ReviewRequired" as const,
        authority: "AdvisoryOnly" as const,
      },
    };
  });
}
