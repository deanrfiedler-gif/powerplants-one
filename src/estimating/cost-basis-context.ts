import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { canonical } from "../platform/operations";
import { digest } from "../documents/store";
import { readDiscoveryTargets } from "./discovery-context";
import type { DiscoveryRevision } from "./discovery-workspace-context";
import type { Estimate, EstimateCap } from "./context";

export type CostBasis = {
  estimating_workspace_id: string; option_id: string; revision_id: string;
  revision: number; site_id: string | null; scope_snapshot_id: string;
  answer_snapshot_id: string; content_hash: string; context_hash: string;
  site_name: string | null; option_label: string;
};
// Upgrade tests deliberately exercise original commands before this schema.
export async function costBasisAvailable(c: QueryClient) {
  return Boolean((await c.query("SELECT to_regclass('ppo.estimate_discovery_roots') AS relation")).rows[0].relation);
}
export async function costBasisContext(c: QueryClient, p: Principal, e: Estimate, versionId: string, cap: EstimateCap): Promise<CostBasis | null> {
  if (!(await costBasisAvailable(c))) return null;
  const root = (await c.query("SELECT * FROM ppo.estimate_discovery_roots WHERE workspace_id=$1 AND estimate_id=$2", [p.workspace_id, e.id])).rows[0];
  if (!root) return null;
  const r = (await c.query<DiscoveryRevision>(`SELECT r.* FROM ppo.estimate_discovery_bases b
    JOIN ppo.estimation_revisions r ON (r.workspace_id,r.id)=(b.workspace_id,b.revision_id)
    WHERE b.workspace_id=$1 AND b.estimate_id=$2 AND b.estimate_version_id=$3`, [p.workspace_id, e.id, versionId])).rows[0];
  if (!r || r.kind !== "Discovery" || r.scope_readiness !== "Complete" || r.option_id !== e.option_id || r.company_id !== e.company_id || r.estimating_workspace_id !== root.estimating_workspace_id) throw unavailable();
  const current = await readDiscoveryTargets(c, p, e.opportunity_id, r.input, cap);
  if (current.compiled.scope_readiness !== "Complete" || current.compiled.content_hash !== r.content_hash ||
      digest(canonical({ input_hash: r.content_hash, references: r.observed_context })) !== r.context_hash)
    throw new AppError(409, "DiscoveryEvidenceMismatch", "The exact saved scope basis requires review before use.");
  // Labels belong to the accepted revision, after current permission checks.
  const option=(await c.query<{label:string}>("SELECT label FROM ppo.estimating_options WHERE workspace_id=$1 AND id=$2",[p.workspace_id,r.option_id])).rows[0];
  if(!option)throw unavailable();
  return { estimating_workspace_id: r.estimating_workspace_id, option_id: r.option_id, option_label: option.label, revision_id: r.id,
    revision: r.version, site_id: r.site_id, scope_snapshot_id: r.scope_snapshot_id!, answer_snapshot_id: r.answer_snapshot_id!,
    content_hash: r.content_hash!, context_hash: r.context_hash!, site_name: r.observed_context!.site?.display_name ?? null };
}
export async function latestCostingScope(c:QueryClient,p:Principal,e:Estimate) {
  if(!e.discovery_basis)return null;
  const r=(await c.query<DiscoveryRevision>(`SELECT r.* FROM ppo.estimating_options o JOIN ppo.estimation_revisions r
    ON (r.workspace_id,r.id)=(o.workspace_id,o.current_revision_id) WHERE o.workspace_id=$1 AND o.id=$2`,[p.workspace_id,e.option_id])).rows[0];
  if(!r||r.kind!=="Discovery")throw unavailable();
  await readDiscoveryTargets(c,p,e.opportunity_id,r.input);
  return {revision_id:r.id,revision:r.version,scope_readiness:r.scope_readiness};
}
export function estimateSite(e: Estimate) {
  return e.discovery_basis ? e.discovery_basis.site_id : e.site_id;
}
