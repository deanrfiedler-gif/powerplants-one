import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { AppError } from "../../platform/errors";
import {
  releaseAuthority,
  releaseHistory,
  requireCurrentRelease,
} from "../release/context";
import { responseContext } from "../response/context";
import { conversionScope, conversionHistory } from "../conversion/context";
import { quotationStage } from "./model";

export const unavailableSource = (error: unknown) =>
  error instanceof AppError && [403, 404].includes(error.status);
type TimelineEvent = {
  id: string;
  source: "Revision" | "Release" | "Response" | "Conversion";
  action: string;
  outcome: string | null;
  actor_id: string;
  recorded_at: string;
  sequence: number;
};
export type QuotationHeader = {
  id: string;
  current_revision_id: string;
  updated_at: Date;
  display_number: string;
};

// Caller holds the workspace lock. This projects native facts, without making
// decisions or exposing the internal source/response/conversion payloads.
export async function quotationRevision(
  c: PoolClient,
  p: Principal,
  header: QuotationHeader,
  revisionId: string,
) {
  const a = await releaseAuthority(c, p, revisionId);
  if (a.q.quote_id !== header.id)
    throw new AppError(
      404,
      "RecordUnavailable",
      "This quotation is unavailable.",
    );
  const releases = (await releaseHistory(c, p, header.id)).events.filter(
    (e) => e.revision_id === revisionId,
  );
  const approval = releases.find((e) => e.action === "Approval") ?? null;
  const issue = releases.find((e) => e.action === "Issue") ?? null;
  const distribution =
    releases.filter((e) => e.action === "Distribution").at(-1) ?? null;
  let basisCurrent: boolean | null = null;
  if (a.base) {
    try {
      await requireCurrentRelease(c, p, revisionId);
      basisCurrent = true;
    } catch (error) {
      if (!(error instanceof AppError) || error.status !== 409) throw error;
      basisCurrent = false;
    }
  }
  const job = (
    await c.query<{ state: string }>(
      "SELECT state FROM ppo.estimate_quote_jobs WHERE workspace_id=$1 AND revision_id=$2",
      [p.workspace_id, revisionId],
    )
  ).rows[0];
  const response = issue ? await responseContext(c, p, revisionId) : null;
  let conversionSource: "NotApplicable" | "Available" | "Unavailable" =
    "NotApplicable";
  let conversionEvents: Awaited<ReturnType<typeof conversionHistory>> = [];
  if (response) {
    try {
      await conversionScope(c, p, response);
      conversionEvents = await conversionHistory(c, p, revisionId);
      await conversionScope(c, p, response);
      conversionSource = "Available";
    } catch (error) {
      if (!unavailableSource(error)) throw error;
      conversionSource = "Unavailable";
      conversionEvents = [];
    }
  }
  const execution =
    conversionEvents.find((e) => e.action === "Execute") ?? null;
  const reported = response?.state.response ?? null;
  const stage = quotationStage({
    prepared: !!a.base,
    basis_current: basisCurrent,
    issued: !!issue,
    approval: approval?.outcome ?? null,
    conversion_available: conversionSource !== "Unavailable",
    converted: !!execution,
    distribution: distribution?.outcome ?? null,
    response: reported?.report?.outcome ?? null,
  });
  const owner = (
    await c.query<{ display_name: string }>(
      "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, a.e.owner_id],
    )
  ).rows[0];
  const events: TimelineEvent[] = [
    {
      id: a.q.id,
      source: "Revision",
      action: "Saved",
      outcome: null,
      actor_id: a.q.created_by,
      recorded_at: a.q.created_at.toISOString(),
      sequence: a.q.version,
    },
  ];
  events.push(
    ...releases.map((e) => ({
      id: e.id,
      source: "Release" as const,
      action: e.action,
      outcome: e.outcome,
      actor_id: e.created_by,
      recorded_at: e.created_at.toISOString(),
      sequence: e.sequence,
    })),
  );
  events.push(
    ...(response?.events ?? []).map((e) => ({
      id: e.id,
      source: "Response" as const,
      action: e.action,
      outcome: e.report?.outcome ?? null,
      actor_id: e.created_by,
      recorded_at: e.created_at.toISOString(),
      sequence: e.sequence,
    })),
  );
  events.push(
    ...conversionEvents.map((e) => ({
      id: e.id,
      source: "Conversion" as const,
      action: e.action,
      outcome: null,
      actor_id: e.created_by,
      recorded_at: e.created_at.toISOString(),
      sequence: e.sequence,
    })),
  );
  events.sort(
    (x, y) =>
      x.recorded_at.localeCompare(y.recorded_at) ||
      x.source.localeCompare(y.source) ||
      x.sequence - y.sequence,
  );
  // Expiring grants are re-read after the last source read. Outer window reads
  // repeat this projection before publishing earlier rows as well.
  await releaseAuthority(c, p, revisionId);
  const snapshot = a.q.safe_snapshot;
  return {
    summary: {
      id: header.id,
      revision_id: a.q.id,
      revision: a.q.version,
      is_current_revision: header.current_revision_id === a.q.id,
      reference: header.display_number,
      estimate_id: a.q.estimate_id,
      estimate_version_id: a.q.estimate_version_id,
      estimate_reference: a.e.display_number,
      title: snapshot.title,
      customer: snapshot.customer,
      site: snapshot.site,
      contact: snapshot.contact,
      owner_id: a.e.owner_id,
      owner: owner?.display_name ?? null,
      owned_by_me: a.e.owner_id === p.actor_id,
      total: snapshot.total,
      currency: snapshot.currency,
      tax_basis: snapshot.tax_basis,
      tax_calculated: false,
      updated_at: header.updated_at.toISOString(),
      updated_basis: "QuotationRevision" as const,
      revision_created_at: a.q.created_at.toISOString(),
      stage,
      render_state: job?.state ?? "Unavailable",
      basis_current: basisCurrent,
      approval_outcome: approval?.outcome ?? null,
      issue_id: issue?.id ?? null,
      distribution_outcome: distribution?.outcome ?? null,
      response_outcome: reported?.report?.outcome ?? null,
      response_id: reported?.id ?? null,
      response_ready: response?.state.ready ?? false,
      response_holds: response?.state.holds ?? [],
      conversion_source: conversionSource,
      execution_id: execution?.id ?? null,
      lifecycle_completeness:
        conversionSource === "Unavailable"
          ? ("Partial" as const)
          : ("Complete" as const),
      needs_attention:
        basisCurrent === false ||
        approval?.outcome === "Returned" ||
        distribution?.outcome === "Unknown" ||
        reported?.report?.outcome === "Negotiation" ||
        reported?.report?.outcome === "Clarification" ||
        (reported?.report?.outcome === "Accepted" && !response?.state.ready),
      links: {
        quotation: `/estimating/quotes/${a.q.id}`,
        release: a.base ? `/estimating/quotes/${a.q.id}/release` : null,
        response: issue ? `/estimating/quotes/${a.q.id}/response` : null,
        conversion:
          conversionSource === "Available"
            ? `/estimating/quotes/${a.q.id}/conversion`
            : null,
        history: `/api/v1/estimating/quotations/${header.id}`,
      },
    },
    events,
  };
}
