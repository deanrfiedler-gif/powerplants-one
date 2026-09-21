import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { object, uuid, invalid } from "../shared/validation";
import {
  currentGroup,
  optionContext,
  revisionAuthority,
  workspaceAuthority,
} from "./discovery-workspace-context";
import { estimateContext, versionContext } from "./context";
import { compareSavedDiscovery } from "./discovery-comparison";
import { readDiscoveryTargets } from "./discovery-context";
import type { QueryClient } from "../platform/permissions";
import { scopeSql } from "../platform/permissions";
import { visibility } from "../shared/reads";
import { activityVisibility } from "../activities/activities";
import type { DiscoveryWorkspace } from "./discovery-workspace-context";

// One aggregate ACL query returns counts, never historical payloads. A denied
// historical source withholds the count; it is not presented as zero or exposed
// through the current revision's ordinal. Exact history rows still use the
// full revision authority when requested. Copy ancestors belong to this group.
export async function discoveryHistoryCounts(
  c: QueryClient,
  p: Principal,
  g: DiscoveryWorkspace,
) {
  const org = (
    await c.query<{ organisation_id: string }>(
      "SELECT organisation_id FROM ppo.opportunities WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, g.opportunity_id],
    )
  ).rows[0];
  const rows = (
    await c.query<{ option_id: string; count: number | null }>(
      `WITH history AS (
    SELECT * FROM ppo.estimation_revisions WHERE workspace_id=$1 AND estimating_workspace_id=$3
  ), denied AS (SELECT 1 FROM history h WHERE NOT (
    ${scopeSql("h.company_id", "h.site_id", "estimating.read")}
    AND ${scopeSql("h.company_id", "h.site_id", "crm.opportunity.read")}
    AND ${scopeSql("h.company_id", "h.site_id", "shared.internal.read")}
    AND (h.site_id IS NULL OR EXISTS(SELECT 1 FROM ppo.sites hs WHERE hs.workspace_id=$1 AND hs.id=h.site_id AND ${visibility("Site", "hs")} AND EXISTS(SELECT 1 FROM ppo.site_parties sp WHERE sp.workspace_id=$1 AND sp.site_id=hs.id AND sp.organisation_id=$4 AND sp.valid_from<=CURRENT_DATE AND (sp.valid_to IS NULL OR sp.valid_to>CURRENT_DATE))))
    AND (h.observed_context->'contact'->>'id' IS NULL OR EXISTS(SELECT 1 FROM ppo.people hp WHERE hp.workspace_id=$1 AND hp.id=(h.observed_context->'contact'->>'id')::uuid AND ${visibility("Person", "hp")}))
    AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(coalesce(h.input->'scope'->'facility_ids','[]')) f WHERE NOT EXISTS(SELECT 1 FROM ppo.facilities hf WHERE hf.workspace_id=$1 AND hf.id=f::uuid AND ${visibility("Facility", "hf")}))
    AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(coalesce(h.input->'scope'->'equipment_ids','[]')) e WHERE NOT EXISTS(SELECT 1 FROM ppo.assets he WHERE he.workspace_id=$1 AND he.id=e::uuid AND ${visibility("Asset", "he")}))
    AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(h.input->'configuration'->'follow_ups','[]')) f WHERE f->>'activity_id' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.activities ha WHERE ha.workspace_id=$1 AND ha.id=(f->>'activity_id')::uuid AND ${activityVisibility("ha", true, true)}))
  )) SELECT option_id,CASE WHEN EXISTS(SELECT 1 FROM denied) THEN NULL ELSE count(*)::integer END AS count FROM history GROUP BY option_id`,
      [p.workspace_id, p.actor_id, g.id, org.organisation_id],
    )
  ).rows;
  // Legacy roots are at most one per retained option. Reuse their receiving
  // authority instead of inventing a second legacy estimate projection.
  const legacy = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.estimation_revisions WHERE workspace_id=$1 AND estimating_workspace_id=$2 AND kind='LegacyManual' LIMIT 11",
      [p.workspace_id, g.id],
    )
  ).rows;
  try {
    if (legacy.length > 10) throw unavailable();
    for (const r of legacy) await revisionAuthority(c, p, g, r.id);
  } catch (error) {
    if (!(error instanceof AppError) || ![403, 404, 409].includes(error.status))
      throw error;
    return new Map(rows.map((r) => [r.option_id, null]));
  }
  return new Map(rows.map((r) => [r.option_id, r.count]));
}

// Shared bounded read, independent of permission to adopt or edit discovery.
export async function savedOptionCost(
  c: QueryClient,
  p: Principal,
  optionId: string,
) {
  const row = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.estimates WHERE workspace_id=$1 AND option_id=$2",
      [p.workspace_id, optionId],
    )
  ).rows[0];
  if (!row) return { option_id: optionId, status: "NoEstimate" as const };
  try {
    const e = await estimateContext(c, p, row.id),
      v = await versionContext(c, p, e, e.current_version_id);
    return {
      option_id: optionId,
      status: "Available" as const,
      estimate_id: e.id,
      estimate_version_id: v.id,
      version: v.version,
      title: v.title,
      sell_total: v.sell_total,
      cost_total: v.cost_total,
      currency: "AUD" as const,
      tax_basis: "ExcludingTax" as const,
      tax_calculated: false,
      basis: v.discovery_basis ?? null,
      basis_kind: v.discovery_basis
        ? ("Discovery" as const)
        : ("LegacyManual" as const),
      lines: v.lines,
      cost_schema_version: v.cost_schema_version ?? 1,
    };
  } catch (error) {
    if (!(error instanceof AppError) || ![403, 404, 409].includes(error.status))
      throw error;
    return { option_id: optionId, status: "Unavailable" as const };
  }
}

export async function readDiscoverySummary(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const q = object(query, ["option_id"]),
    optionId = uuid(q.option_id, "option_id");
  return transaction(async (c) => {
    const g = await workspaceAuthority(c, p, id);
    await currentGroup(c, p, g);
    const option = await optionContext(c, g, optionId);
    return savedOptionCost(c, p, option.id);
  });
}

export async function listDiscoveryCostVersions(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const q = object(query, ["option_id", "before"]),
    optionId = uuid(q.option_id, "option_id"),
    before = q.before === undefined ? null : Number(q.before);
  if (before !== null && (!Number.isSafeInteger(before) || before < 1))
    invalid("before", "Use the returned positive version cursor.");
  return transaction(async (c) => {
    const g = await workspaceAuthority(c, p, id);
    await currentGroup(c, p, g);
    await optionContext(c, g, optionId);
    const summary = await savedOptionCost(c, p, optionId);
    if (summary.status !== "Available")
      return { status: summary.status, items: [], next: null };
    const e = await estimateContext(c, p, summary.estimate_id);
    const rows = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.estimate_versions WHERE workspace_id=$1 AND estimate_id=$2 AND ($3::integer IS NULL OR version<$3) ORDER BY version DESC LIMIT 21",
        [p.workspace_id, e.id, before],
      )
    ).rows;
    const items = [];
    for (const row of rows.slice(0, 20)) {
      const v = await versionContext(c, p, e, row.id);
      items.push({
        estimate_id: e.id,
        id: v.id,
        version: v.version,
        amount: v.sell_total,
        basis: v.discovery_basis ?? null,
      });
    }
    return {
      status: "Available" as const,
      items,
      next: rows.length > 20 ? items.at(-1)!.version : null,
    };
  });
}
export async function listDiscoveryHistory(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const q = object(query, ["option_id", "before"]),
    optionId = uuid(q.option_id, "option_id"),
    before = q.before === undefined ? null : Number(q.before);
  if (before !== null && (!Number.isSafeInteger(before) || before < 1))
    invalid("before", "Use the returned positive revision cursor.");
  return transaction(async (c) => {
    const g = await workspaceAuthority(c, p, id);
    await currentGroup(c, p, g);
    await optionContext(c, g, optionId);
    const rows = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.estimation_revisions WHERE workspace_id=$1 AND option_id=$2 AND ($3::integer IS NULL OR version<$3) ORDER BY version DESC LIMIT 21",
        [p.workspace_id, optionId, before],
      )
    ).rows;
    const items = [];
    // Do not disclose even a count when any historical source is denied. A separate
    // bounded ACL pass uses the same authority; never load all payloads to count.
    for (const row of rows) {
      const r = await revisionAuthority(c, p, g, row.id);
      if (items.length === 20) continue;
      const author =
        (
          await c.query<{ display_name: string }>(
            "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, r.created_by],
          )
        ).rows[0]?.display_name ?? "Recorded author";
      items.push({
        id: r.id,
        version: r.version,
        kind: r.kind,
        predecessor_id: r.predecessor_id,
        copied_from_id: r.copied_from_id,
        reason: r.reason,
        created_at: r.created_at,
        author,
        scope_readiness: r.scope_readiness,
      });
    }
    return {
      option_id: optionId,
      items,
      next: rows.length > 20 ? items.at(-1)!.version : null,
      limit: 20,
    };
  });
}
export async function compareDiscoverySources(
  p: Principal,
  id: string,
  value: unknown,
) {
  const q = object(value, [
      "baseline_id",
      "target_id",
      "baseline_cost",
      "target_cost",
    ]),
    a = uuid(q.baseline_id, "baseline_id"),
    b = uuid(q.target_id, "target_id");
  return transaction(async (c) => {
    const g = await workspaceAuthority(c, p, id);
    await currentGroup(c, p, g);
    const baseline = await revisionAuthority(c, p, g, a),
      target = await revisionAuthority(c, p, g, b);
    const summary = async (r: typeof baseline) => ({
      id: r.id,
      option_id: r.option_id,
      option_label: (await optionContext(c, g, r.option_id)).label,
      revision: r.version,
      kind: r.kind,
      readiness: r.scope_readiness,
      created_at: r.created_at,
    });
    const cost = async (value: unknown, r: typeof baseline) => {
      if (value == null) return null;
      const v = object(value, ["estimate_id", "version_id"]),
        e = await estimateContext(
          c,
          p,
          uuid(v.estimate_id, "estimate_id"),
          "estimating.read",
          uuid(v.version_id, "version_id"),
        );
      if (e.option_id !== r.option_id) throw unavailable();
      const saved = await versionContext(c, p, e, String(v.version_id));
      return {
        estimate_id: e.id,
        version_id: saved.id,
        version: saved.version,
        amount: saved.sell_total,
        currency: "AUD",
        tax_basis: "ExcludingTax",
        discovery_basis: saved.discovery_basis ?? null,
      };
    };
    return {
      baseline: await summary(baseline),
      target: await summary(target),
      differences: compareSavedDiscovery(baseline, target),
      costs: {
        baseline: await cost(q.baseline_cost, baseline),
        target: await cost(q.target_cost, target),
      },
    };
  });
}
export async function readConfigurationEvidence(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const q = object(query, ["revision_id"]);
  return transaction(async (c) => {
    const g = await workspaceAuthority(c, p, id),
      r = await revisionAuthority(c, p, g, uuid(q.revision_id, "revision_id"));
    if (!r.input)
      return { revision_id: r.id, evidence: [], current: [], activities: [] };
    const now = await readDiscoveryTargets(c, p, g.opportunity_id, r.input);
    return {
      revision_id: r.id,
      evidence: r.input.configuration?.evidence ?? [],
      current: now.references.configuration_evidence ?? [],
      activities: now.references.linked_activities ?? [],
    };
  });
}
