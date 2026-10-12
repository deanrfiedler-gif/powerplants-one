import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { hasPermission, requireCapability } from "../../platform/permissions";
import { estimateVisibility } from "../context";
import { estimateReviewInTransaction } from "./reads";
import { releaseInTransaction } from "../release/reads";
import {
  inQueueView,
  queueCounts,
  queueQuery,
  type QueueRow,
  type QueueState,
} from "./queue-model";

type Candidate = {
  id: string;
  source: QueueRow["source"];
  estimate_id: string;
  submitted_at: Date;
  owner_id: string;
  owner: string;
  author_id: string;
  reference: string;
  customer: string;
};

// This is a projection of native decisions, never an alternate approval engine.
// Candidate limits bound expensive exact-source checks. Counts deliberately describe
// only authorised rows in this window, never the total backlog or hidden records.
export async function readEstimatingReviewQueue(
  p: Principal,
  input: Record<string, string> = {},
) {
  const filters = queueQuery(input);
  return transaction(async (c) => {
    await requireCapability(c, p, "estimating.read");
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const quotationRead = await hasPermission(c, p, "estimating.quote.read");
    if (filters.source === "quotations" && !quotationRead)
      await requireCapability(c, p, "estimating.quote.read");
    const asOf = (
      await c.query<{ now: Date }>("SELECT clock_timestamp() AS now")
    ).rows[0].now;
    const candidates = (
      await c.query<Candidate>(
        `
      WITH candidates AS (
        SELECT e.id,'EstimateReview'::text AS source,e.id AS estimate_id,
          s.created_at AS submitted_at,e.owner_id,u.display_name AS owner,
          v.created_by AS author_id,e.display_number AS reference,org.display_name AS customer,
          v.title
        FROM ppo.estimates e
        JOIN LATERAL (SELECT * FROM ppo.estimate_review_events s
          WHERE s.workspace_id=e.workspace_id AND s.estimate_id=e.id AND s.kind='Submission'
          ORDER BY s.sequence DESC LIMIT 1) s ON true
        JOIN ppo.estimate_versions v ON (v.workspace_id,v.id)=(e.workspace_id,s.estimate_version_id)
        JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(e.workspace_id,e.opportunity_id)
        JOIN ppo.organisations org ON (org.workspace_id,org.id)=(o.workspace_id,o.organisation_id)
        JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.owner_id)
        WHERE e.workspace_id=$1 AND $3 IN ('all','estimates') AND ${estimateVisibility("e", "estimating.read", true)}
        UNION ALL
        SELECT b.revision_id,'QuotationApproval'::text,e.id,b.created_at,e.owner_id,u.display_name,
          r.created_by,q.display_number,org.display_name,v.title
        FROM ppo.draft_quotes q
        JOIN LATERAL (SELECT b.* FROM ppo.quote_release_bases b
          JOIN ppo.draft_quote_revisions r ON (r.workspace_id,r.id)=(b.workspace_id,b.revision_id)
          WHERE b.workspace_id=q.workspace_id AND b.quote_id=q.id
          ORDER BY r.version DESC LIMIT 1) b ON true
        JOIN ppo.draft_quote_revisions r ON (r.workspace_id,r.id)=(b.workspace_id,b.revision_id)
        JOIN ppo.estimates e ON (e.workspace_id,e.id)=(r.workspace_id,r.estimate_id)
        JOIN ppo.estimate_versions v ON (v.workspace_id,v.id)=(e.workspace_id,r.estimate_version_id)
        JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(e.workspace_id,e.opportunity_id)
        JOIN ppo.organisations org ON (org.workspace_id,org.id)=(o.workspace_id,o.organisation_id)
        JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.owner_id)
        WHERE q.workspace_id=$1 AND $3 IN ('all','quotations') AND $4::boolean
          AND ${estimateVisibility("e", "estimating.read", true)}
          AND ${estimateVisibility("e", "estimating.quote.read", true)}
      )
      SELECT * FROM candidates WHERE $5='' OR strpos(lower(title || ' ' || reference || ' ' || customer),lower($5))>0
      ORDER BY submitted_at DESC,source,id LIMIT $6 OFFSET $7`,
        [
          p.workspace_id,
          p.actor_id,
          filters.source,
          quotationRead,
          filters.q,
          filters.limit + 1,
          filters.offset,
        ],
      )
    ).rows;
    const rows: QueueRow[] = [];
    let partial = filters.source === "all" && !quotationRead;
    for (const candidate of candidates.slice(0, filters.limit)) {
      try {
        if (candidate.source === "EstimateReview") {
          const d = await estimateReviewInTransaction(c, p, candidate.id);
          const submission = d.submissions.at(-1)!;
          const saved = d.versions.find(
            (v) => v.id === submission.estimate_version_id,
          )!;
          const own = [
            candidate.owner_id,
            saved.created_by,
            submission.created_by,
          ].includes(p.actor_id);
          for (const status of d.statuses) {
            const current =
              submission.basis.fingerprints[status.kind] ===
              d.basis.fingerprints[status.kind];
            const currentDecision =
              status.decision?.submission_id === submission.id;
            const state: QueueState = !current
              ? "Changed basis"
              : currentDecision
                ? status.decision!.outcome
                : status.applicable && status.decision?.outcome === "Reviewed"
                  ? "Reviewed"
                  : "Pending";
            rows.push({
              id: `EstimateReview:${candidate.id}:${status.kind}`,
              source: candidate.source,
              record_id: candidate.id,
              estimate_id: candidate.id,
              estimate_version_id: saved.id,
              submission_id: submission.id,
              reference: d.estimate.display_number,
              revision: saved.version,
              title: saved.title,
              customer: candidate.customer,
              owner: candidate.owner,
              kind: status.kind,
              sequence: d.sequence,
              submitted_at: submission.created_at.toISOString(),
              submitted_by_me: submission.created_by === p.actor_id,
              own_work: own,
              state,
              basis_current: current,
              can_decide: status.can_review && state === "Pending",
              carried_forward:
                !!status.decision &&
                status.decision.outcome === "Reviewed" &&
                status.applicable &&
                status.decision.submission_id !== submission.id,
              decision_id: status.decision?.id ?? null,
              decision_outcome: status.decision?.outcome ?? null,
              finding_count: status.decision?.findings.length ?? 0,
              sell_total: saved.sell_total,
              currency: "AUD",
              tax_basis: "Excluding tax; tax not calculated",
              href: `/estimating/estimates/${candidate.id}/review`,
            });
          }
        } else {
          const d = await releaseInTransaction(c, p, candidate.id);
          const base = d.base!;
          const state: QueueState = d.issue
            ? "Issued"
            : !d.current
              ? "Changed basis"
              : d.approval?.outcome === "Returned"
                ? "Returned"
                : d.approval
                  ? "Approved"
                  : d.job.state !== "Ready"
                    ? "Output pending"
                    : "Pending";
          rows.push({
            id: `QuotationApproval:${d.revision.quote_id}`,
            source: candidate.source,
            record_id: d.revision.quote_id,
            estimate_id: d.revision.estimate_id,
            estimate_version_id: d.revision.estimate_version_id,
            submission_id: candidate.id,
            reference: d.revision.snapshot.display_number,
            revision: d.revision.version,
            title: d.revision.snapshot.title,
            customer: d.revision.snapshot.customer,
            owner: candidate.owner,
            kind: "QuotationApproval",
            sequence: d.sequence,
            submitted_at: base.created_at.toISOString(),
            submitted_by_me: base.created_by === p.actor_id,
            own_work: [
              candidate.owner_id,
              candidate.author_id,
              base.created_by,
            ].includes(p.actor_id),
            state,
            basis_current: d.current,
            can_decide: d.can.approve,
            carried_forward: false,
            decision_id: d.approval?.id ?? null,
            decision_outcome: d.approval?.outcome ?? null,
            finding_count: 0,
            sell_total: d.revision.snapshot.total,
            currency: "AUD",
            tax_basis: d.revision.snapshot.tax_basis,
            href: `/estimating/quotes/${candidate.id}/release`,
          });
        }
      } catch (error) {
        // Exact recipient, historical scope or source access may be narrower
        // than the candidate query. Suppress all identity/amount/count details.
        if (!(error instanceof AppError) || ![403, 404].includes(error.status))
          throw error;
        partial = true;
      }
    }
    // A grant can expire while later candidates are being inspected. Recheck
    // each source before publishing counts; keep no cached decision authority.
    for (const candidate of candidates.slice(0, filters.limit)) {
      const matches = (row: QueueRow) =>
        row.source === candidate.source &&
        (candidate.source === "EstimateReview"
          ? row.record_id === candidate.id
          : row.submission_id === candidate.id);
      if (!rows.some(matches)) continue;
      try {
        if (candidate.source === "EstimateReview") {
          const d = await estimateReviewInTransaction(c, p, candidate.id);
          for (const row of rows.filter(matches))
            row.can_decide =
              row.state === "Pending" &&
              !!d.statuses.find((s) => s.kind === row.kind)?.can_review;
        } else {
          const d = await releaseInTransaction(c, p, candidate.id);
          for (const row of rows.filter(matches))
            row.can_decide = d.can.approve;
        }
      } catch (error) {
        if (!(error instanceof AppError) || ![403, 404].includes(error.status))
          throw error;
        for (let i = rows.length - 1; i >= 0; i--)
          if (matches(rows[i])) rows.splice(i, 1);
        partial = true;
      }
    }
    await requireCapability(c, p, "estimating.read");
    return {
      items: rows.filter((row) => inQueueView(row, filters.view)),
      counts: queueCounts(rows),
      counts_scope: "CurrentCandidateWindow",
      completeness: partial ? "PartialWindow" : "CompleteWindow",
      quotation_source:
        filters.source === "estimates"
          ? "NotRequested"
          : quotationRead
            ? "Available"
            : "Denied",
      offset: filters.offset,
      candidate_limit: filters.limit,
      next_offset:
        candidates.length > filters.limit
          ? filters.offset + filters.limit
          : null,
      as_of: asOf.toISOString(),
      waiting_policy: "NotConfigured",
      synthetic: true,
    };
  });
}
