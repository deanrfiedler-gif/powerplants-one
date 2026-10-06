import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { hasPermission, type QueryClient } from "../../platform/permissions";
import { uuid } from "../../shared/validation";
import { estimateContext, versionContext } from "../context";
import { estimateSite, latestCostingScope } from "../cost-basis-context";
import { versionHash } from "../service";
import { readLineage } from "../specialist/lineage";
import { configuration, run } from "../specialist/context";
import { sourceBindings } from "../sources/bindings";
import { sourceContext } from "../sources/context";
import { visibleOpportunity } from "../../crm/context";
import { reviewBasis, type Submission, type Decision } from "./model";
import { reviewCapabilities, type ReviewKind } from "./validation";

export async function exactBasis(
  c: QueryClient,
  p: Principal,
  id: string,
  versionId?: string,
) {
  const e = await estimateContext(c, p, id, "estimating.read", versionId);
  const v = await versionContext(c, p, e, versionId ?? e.current_version_id);
  if (versionHash(v) !== v.content_hash)
    throw new AppError(
      409,
      "EstimateEvidenceMismatch",
      "The saved estimate hash does not match its original content.",
    );
  const bindings = await sourceBindings(c, p, v.id);
  const sources = [];
  for (const id of [...new Set(bindings.map((b) => b.source_id))].sort()) {
    const source = await sourceContext(c, p, id);
    sources.push({
      id,
      version: source.version,
      revision_id: source.current_revision_id,
    });
  }
  const lineage = await readLineage(c, p, v);
  const technical = [];
  for (const x of lineage?.snapshot.contributions ?? []) {
    const cfg = await configuration(c, p, x.configuration_id);
    await run(c, p, cfg, x.run_id);
    // Exclude successor cost-version IDs and manual price fields from technical applicability.
    technical.push({
      line_id: x.line_id,
      configuration_id: x.configuration_id,
      run_id: x.run_id,
      resolved_set_id: x.resolved_set_id,
      part_id: x.part_id,
      unit: x.unit,
      disposition: x.disposition,
      source_revision_id: x.source_revision_id,
      source_basis_changed: x.source_basis_changed,
      mapping_policy: x.mapping_policy,
    });
  }
  const latest = e.discovery_basis ? await latestCostingScope(c, p, e) : null;
  const opportunity = await visibleOpportunity(c, p, e.opportunity_id);
  return {
    e,
    v,
    basis: reviewBasis(
      v,
      bindings,
      sources,
      technical.sort((a, b) => a.line_id.localeCompare(b.line_id)),
      latest?.revision_id ?? null,
      {
        company_id: e.company_id,
        opportunity_id: e.opportunity_id,
        organisation_id: opportunity.organisation_id,
        person_id: opportunity.primary_person_id,
        site_id: estimateSite(e),
        option_id: e.option_id,
      },
    ),
  };
}
export async function reviewHistory(c: QueryClient, p: Principal, id: string) {
  const rows = (
    await c.query<Submission & Decision>(
      "SELECT * FROM ppo.estimate_review_events WHERE workspace_id=$1 AND estimate_id=$2 ORDER BY sequence",
      [p.workspace_id, id],
    )
  ).rows;
  return {
    submissions: rows.filter(
      (r) => String(r.kind) === "Submission",
    ) as Submission[],
    decisions: rows.filter(
      (r) => String(r.kind) !== "Submission",
    ) as Decision[],
    sequence: rows.at(-1)?.sequence ?? 0,
  };
}
export async function reviewAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  versionId: string,
  kind?: ReviewKind,
) {
  const e = await estimateContext(
    c,
    p,
    id,
    kind ? "estimating.read" : "estimating.edit",
    versionId,
  );
  const v = await versionContext(c, p, e, versionId);
  if (
    kind &&
    !(await hasPermission(
      c,
      p,
      reviewCapabilities[kind],
      e.company_id,
      estimateSite(e) ?? undefined,
    ))
  )
    throw unavailable();
  return { e, v };
}
export async function reviewReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operationId: string,
) {
  const row = (
    await c.query<{
      estimate_version_id: string;
      kind: "Submission" | ReviewKind;
    }>(
      "SELECT estimate_version_id,kind FROM ppo.estimate_review_events WHERE workspace_id=$1 AND estimate_id=$2 AND created_by=$3 AND operation_id=$4",
      [
        p.workspace_id,
        uuid(id, "id"),
        p.actor_id,
        uuid(operationId, "operation_id"),
      ],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await exactBasis(c, p, id, row.estimate_version_id);
  await reviewAuthority(
    c,
    p,
    id,
    row.estimate_version_id,
    row.kind === "Submission" ? undefined : row.kind,
  );
}
