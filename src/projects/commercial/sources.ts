import { AppError, unavailable } from "../../platform/errors";
import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { canonical } from "../../platform/operations";
import { digest } from "../../documents/store";
import { documentContext, revisionContext } from "../../library/context";
import { responseContext } from "../../estimating/response/context";
import { draftBytes } from "../../estimating/worker";
import {
  exactBytes,
  sourceAuthority as librarySourceAuthority,
} from "../../library/sources";
import { reviewOutcomeSource } from "../../crm/outcome-sources";
import { visibleOpportunity } from "../../crm/context";
import { deliverySalesSourcesInSnapshot } from "../../sales/delivery-binding";
import { projectRow } from "../service";
import { money } from "./model";
import type { Source } from "./validation";

export const changed = () =>
  new AppError(
    409,
    "CommercialSourceChanged",
    "The exact commercial source changed or is not eligible. Reconcile it before another commercial decision.",
  );
export type FrozenSource = {
  input: Source;
  amount: string;
  currency: "AUD";
  tax_basis: "ExcludingTax";
  document_hash: string;
  acceptance_hash: string;
  hash: string;
};
// Historical authority and present applicability deliberately have separate paths.
export async function inspectSource(
  c: QueryClient,
  p: Principal,
  projectId: string,
  source: Source,
  requireCurrent: boolean,
  frozen?: FrozenSource,
): Promise<FrozenSource> {
  const project = await projectRow(c, p, projectId);
  const sales = await deliverySalesSourcesInSnapshot(
    c,
    p,
    "Projects",
    projectId,
  );
  const binding = sales.items.find(
    (x) =>
      x.access === "Available" &&
      x.handover_id === source.handover_id &&
      x.acceptance_event_id === source.acceptance_event_id,
  );
  if (
    !binding ||
    binding.access !== "Available" ||
    !binding.accepted_source_hash
  )
    throw unavailable();
  const opportunity = await visibleOpportunity(c, p, binding.opportunity_id);
  const quotation = await responseContext(c, p, source.quotation.revision_id);
  if (
    quotation.e.opportunity_id !== opportunity.id ||
    quotation.e.company_id !== project.company_id ||
    opportunity.organisation_id !== project.organisation_id ||
    opportunity.site_id !== project.site_id ||
    quotation.base.basis.recipient.organisation_id !==
      project.organisation_id ||
    quotation.base.basis.recipient.site_id !== project.site_id
  )
    throw unavailable();
  const response = quotation.events.find(
    (e) => e.id === source.quotation.response_event_id,
  );
  if (
    quotation.issue.id !== source.quotation.issue_id ||
    quotation.issue.output_hash !== source.quotation.output_hash ||
    !response ||
    !["Record", "Correct"].includes(response.action) ||
    response.report?.outcome !== "Accepted"
  )
    throw unavailable();
  const { d } = await documentContext(c, p, source.document_id);
  const revision = await revisionContext(c, p, d, source.document_revision_id);
  if (
    d.company_id !== project.company_id ||
    d.organisation_id !== project.organisation_id ||
    (d.site_id !== null && d.site_id !== project.site_id)
  )
    throw unavailable();
  const review = (
    await c.query<{
      id: string;
      outcome: string;
      reviewer_id: string;
      content_hash: string;
      document_version: number;
    }>(
      "SELECT * FROM ppo.library_reviews WHERE workspace_id=$1 AND document_id=$2 AND revision_id=$3 AND id=$4",
      [p.workspace_id, d.id, revision.id, source.document_review_id],
    )
  ).rows[0];
  if (
    !review ||
    review.outcome !== "Reviewed" ||
    review.reviewer_id === revision.created_by ||
    review.reviewer_id === revision.source.author_id ||
    review.content_hash !== revision.source.content_hash
  )
    throw unavailable();
  if (requireCurrent) {
    try {
      if (!(await librarySourceAuthority(c, p, revision.source)).current)
        throw changed();
      await exactBytes(c, p, d.id, revision.id, revision.source);
      await draftBytes(p, quotation.q.id);
    } catch (e) {
      if (e instanceof AppError && e.status === 503) throw changed();
      throw e;
    }
    if (
      !binding.current ||
      binding.source_changed ||
      opportunity.close_outcome !== "Won" ||
      d.state !== "Current" ||
      d.current_revision_id !== revision.id ||
      d.version !== source.document_version ||
      (
        await c.query(
          "SELECT 1 FROM ppo.library_findings WHERE workspace_id=$1 AND revision_id=$2 AND state<>'Closed'",
          [p.workspace_id, revision.id],
        )
      ).rowCount
    )
      throw changed();
    try {
      await reviewOutcomeSource(c, p, opportunity, "Won", source.quotation);
    } catch (e) {
      if (e instanceof AppError && e.status === 409) throw changed();
      throw e;
    }
  }
  const safe = quotation.q.safe_snapshot;
  if (
    safe.currency !== "AUD" ||
    safe.tax_basis !== "ExcludingTax" ||
    safe.tax_calculated !== false
  )
    throw changed();
  const amount = money(safe.total, "quotation.total", false)!;
  const facts = {
    input: source,
    amount,
    currency: "AUD" as const,
    tax_basis: "ExcludingTax" as const,
    document_hash: revision.source.content_hash,
    acceptance_hash: binding.accepted_source_hash,
  };
  const result = { ...facts, hash: digest(canonical(facts)) };
  if (frozen && canonical(result) !== canonical(frozen)) throw unavailable();
  return result;
}
export async function savedSource(c: QueryClient, p: Principal, basis: string) {
  const row = (
    await c.query<{ snapshot: FrozenSource }>(
      "SELECT snapshot FROM ppo.project_commercial_sources WHERE workspace_id=$1 AND basis_id=$2",
      [p.workspace_id, basis],
    )
  ).rows[0];
  if (!row) throw unavailable();
  return row.snapshot;
}
export async function sourceStatus(
  c: QueryClient,
  p: Principal,
  project: string,
  source: FrozenSource,
) {
  await inspectSource(c, p, project, source.input, false, source);
  try {
    await inspectSource(c, p, project, source.input, true, source);
    return "Current" as const;
  } catch (e) {
    if (e instanceof AppError && e.code === "CommercialSourceChanged")
      return "Changed" as const;
    throw e;
  }
}
