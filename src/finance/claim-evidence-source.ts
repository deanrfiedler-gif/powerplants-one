import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { companyContext } from "../shared/authority";
import { agreementRevision } from "../maintenance/context";
import { cents, decimal } from "../projects/commercial/model";
import { financeContext, blocked, hash } from "./context";
import { currentRevision, financeLines } from "./service";
import type { ClaimEvidence } from "./claim-evidence-render";

type Context = Awaited<ReturnType<typeof financeContext>>;
type Revision = Awaited<ReturnType<typeof currentRevision>>;
export async function claimIssueAuthority(
  c: PoolClient,
  p: Principal,
  ctx: Context,
  r: Revision,
) {
  if (ctx.h.source_kind === "AgreementCharge") {
    const original = await agreementRevision(
      c,
      p,
      r.source_snapshot.agreement_charge.revision_id,
    );
    for (const site of original.revision.content.sites)
      await companyContext(
        c,
        p,
        ctx.h.company_id,
        site.site_id,
        "finance.issue",
      );
  }
}
export async function claimEvidenceSource(
  c: PoolClient,
  p: Principal,
  ctx: Context,
  r: Revision,
  review: Record<string, unknown>,
  recon: Record<string, unknown>,
  outcome: unknown,
): Promise<ClaimEvidence> {
  await claimIssueAuthority(c, p, ctx, r);
  if (review.decision !== "Approved" || recon.result !== "Matched")
    blocked(
      "ClaimEvidenceNotReconciled",
      "Claim evidence requires exact Approved review and Matched reconciliation.",
    );
  const project = ctx.h.source_kind === "ProjectClaim";
  const s = project
    ? r.source_snapshot.project_claim
    : r.source_snapshot.agreement_charge;
  const entries: {
    id?: string;
    target_id?: string;
    kind?: string;
    amount: string;
    due_date?: string;
    event_version?: number;
  }[] = project ? s.claims : s.charges;
  const lines = await financeLines(c, p, r.id);
  if (lines.length !== entries.length || !lines.length)
    blocked(
      "SourceChanged",
      "Every exact claim entitlement must have one monetary line.",
    );
  const projected = entries.map((entry) => {
    const matches = lines.filter((l) =>
      project
        ? l.claim_target_id === entry.target_id &&
          l.claim_kind === entry.kind &&
          l.claim_event_version === entry.event_version
        : l.agreement_charge_id === entry.id &&
          l.agreement_revision_id === s.revision_id,
    );
    const l = matches[0];
    if (
      matches.length !== 1 ||
      l.source_kind !== ctx.h.source_kind ||
      l.source_entry_hash !== hash(entry) ||
      cents(l.claim_amount) !== cents(entry.amount) ||
      l.claim_currency !== s.currency ||
      l.claim_tax_basis !== s.tax_basis ||
      l.disposition !== "Billable" ||
      l.direction !== "Claim" ||
      l.uom !== "CLAIM" ||
      Number(l.allocated_quantity) !== 1
    )
      blocked(
        "SourceChanged",
        "The monetary line differs from its exact reconciled entitlement.",
      );
    return {
      id: l.id as string,
      kind: project ? entry.kind! : "Agreement charge",
      entitlement_id: project ? entry.target_id! : entry.id!,
      amount: decimal(cents(entry.amount)),
      due_date: entry.due_date ?? null,
      evidence: entry,
    };
  });
  return {
    source_kind: ctx.h.source_kind,
    reference: ctx.h.display_number,
    source_reference: project ? ctx.w.display_number : ctx.w.reference,
    revision: r.revision,
    company_id: ctx.h.company_id,
    customer_id: ctx.h.customer_id,
    account: ctx.a.fixture_key,
    currency: s.currency,
    tax_basis: s.tax_basis,
    mode: ctx.h.mode,
    source_hash: r.source_hash,
    review_id: review.id as string,
    reconciliation_id: recon.id as string,
    treatment_basis: r.treatment_basis,
    reconciliation_basis: recon.basis as string,
    total: decimal(projected.reduce((sum, l) => sum + cents(l.amount), 0n)),
    lines: projected,
    source_manifest: r.source_snapshot,
    definition: {
      id: r.definition_id,
      version: r.definition_version,
      policy_version: r.policy_version,
    },
    review,
    reconciliation: recon,
    target_evidence: outcome,
    corrections: (
      await c.query(
        "SELECT id,source_revision_id,outcome_id,disposition,reason,created_at FROM ppo.finance_corrections WHERE workspace_id=$1 AND handoff_id=$2 ORDER BY created_at,id",
        [p.workspace_id, ctx.h.id],
      )
    ).rows,
  };
}
