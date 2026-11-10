import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { companyContext } from "../shared/authority";
import { unavailable, AppError } from "../platform/errors";
import { authority, sourceAuthority } from "../projects/commercial/context";
import {
  basisContext,
  evidence,
  variationAmount,
} from "../projects/commercial/claims";
import type { ClaimEvent } from "../projects/commercial/claim-model";
import type { FinanceCapability } from "./context";

export async function projectClaimProject(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: FinanceCapability = "finance.read",
) {
  const pr = await authority(c, p, id);
  for (const duty of new Set([
    cap,
    "finance.read",
    "shared.finance.read",
  ] as const))
    await companyContext(c, p, pr.company_id, pr.site_id, duty);
  return {
    ...pr,
    customer_id: pr.organisation_id,
  };
}
export async function projectClaimSource(
  c: QueryClient,
  p: Principal,
  project: string,
  basis: string,
  versions: number[],
  current = true,
) {
  const ctx = await basisContext(c, p, project, basis);
  if (current) {
    if (ctx.pr.lifecycle !== "Active")
      throw new AppError(
        409,
        "ClosedProject",
        "Reopen the project before releasing claim authority.",
      );
    await sourceAuthority(c, p, ctx.basis, true);
  }
  const claims = [];
  for (const version of versions) {
    const event = (
      await c.query<ClaimEvent>(
        "SELECT * FROM ppo.project_claim_events WHERE workspace_id=$1 AND basis_id=$2 AND version=$3 AND command='RecordEvidence'",
        [p.workspace_id, basis, version],
      )
    ).rows[0];
    if (!event?.completion) throw unavailable();
    const e = event.completion;
    await evidence(c, p, project, e, current);
    if (current) {
      const latest = (
        await c.query(
          "SELECT version FROM ppo.project_claim_events WHERE workspace_id=$1 AND basis_id=$2 AND completion->>'kind'=$3 AND completion->>'target_id'=$4 ORDER BY version DESC LIMIT 1",
          [p.workspace_id, basis, e.kind, e.target_id],
        )
      ).rows[0];
      if (latest?.version !== version)
        throw new AppError(
          409,
          "ClaimEvidenceChanged",
          "Use the latest completion evidence for this entitlement.",
        );
      if (
        e.kind === "Variation" &&
        (await variationAmount(c, p, project, basis, e)) !== e.amount
      )
        throw new AppError(
          409,
          "ClaimAmountChanged",
          "Retain the exact approved variation amount.",
        );
    }
    claims.push({
      event_version: event.version,
      schedule_version: event.schedule_version,
      ...e,
    });
  }
  return {
    project_id: project,
    basis_id: basis,
    basis_version: ctx.basisEvent.version,
    source_hash: ctx.source.hash,
    currency: ctx.source.currency,
    tax_basis: ctx.source.tax_basis,
    claims,
  };
}
// Reads and original-operation recovery must retain authority to every historical source they expose.
export async function projectClaimHistoryAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  project: string,
) {
  const revisions = (
    await c.query(
      "SELECT source_snapshot FROM ppo.finance_revisions WHERE workspace_id=$1 AND handoff_id=$2",
      [p.workspace_id, id],
    )
  ).rows;
  for (const r of revisions) {
    const s = r.source_snapshot.project_claim;
    if (!s || s.project_id !== project) throw unavailable();
    await projectClaimSource(
      c,
      p,
      project,
      s.basis_id,
      s.claims.map((x: { event_version: number }) => x.event_version),
      false,
    );
  }
}
