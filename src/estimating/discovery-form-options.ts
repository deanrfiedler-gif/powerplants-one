import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import {
  visibleOpportunity,
  relationshipContext,
  eligibleActionOwner,
} from "../crm/context";
import { visibility, visible } from "../shared/reads";
import { object, uuid, optionalId, choice } from "../shared/validation";
import { discoveryDefinition, discoveryDefinitionHash } from "./discovery";
import { workspaceAuthority } from "./discovery-workspace-context";

// Candidate labels are current scoped observations, never authority to save.
// Preview and acceptance independently recheck the complete proposed context.
export async function discoveryFormOptions(
  p: Principal,
  query: Record<string, string>,
) {
  const input = object(query, [
      "opportunity_id",
      "site_id",
      "workspace_id",
      "scope_mode",
    ]),
    opportunityId = uuid(input.opportunity_id, "opportunity_id"),
    requestedSite = optionalId(input.site_id, "site_id"),
    mode = choice(input.scope_mode ?? "Site", "scope_mode", [
      "Site",
      "NoSiteRequired",
      "Unknown",
    ] as const),
    workspaceId = optionalId(input.workspace_id, "workspace_id");
  return transaction(async (c) => {
    const o = await visibleOpportunity(c, p, opportunityId);
    await relationshipContext(c, p, o, "estimating.read");
    await relationshipContext(c, p, o, "estimating.edit");
    if (workspaceId) {
      const g = await workspaceAuthority(c, p, workspaceId, true);
      if (g.opportunity_id !== o.id) throw unavailable();
    }
    const siteId = mode === "Site" ? (requestedSite ?? o.site_id) : null;
    const context = { ...o, site_id: siteId };
    await relationshipContext(c, p, context, "estimating.read");
    await relationshipContext(c, p, context, "estimating.edit");
    const sites: { id: string; display_name: string }[] = [];
    const candidates = (
      await c.query<{ id: string; display_name: string }>(
        `SELECT r.id,r.display_name FROM ppo.sites r WHERE r.workspace_id=$1 AND r.company_id=$3 AND ${visibility("Site")} AND EXISTS(SELECT 1 FROM ppo.site_parties sp WHERE sp.workspace_id=r.workspace_id AND sp.site_id=r.id AND sp.organisation_id=$4 AND sp.valid_from<=CURRENT_DATE AND (sp.valid_to IS NULL OR sp.valid_to>CURRENT_DATE)) ORDER BY r.display_name,r.id LIMIT 101`,
        [p.workspace_id, p.actor_id, o.company_id, o.organisation_id],
      )
    ).rows;
    for (const s of candidates.slice(0, 100))
      try {
        await relationshipContext(
          c,
          p,
          { ...o, site_id: s.id },
          "estimating.read",
        );
        await relationshipContext(
          c,
          p,
          { ...o, site_id: s.id },
          "estimating.edit",
        );
        sites.push(s);
      } catch (error) {
        if (!(error instanceof AppError) || ![403, 404].includes(error.status))
          throw error;
      }
    // Keep an explicitly permitted current selection available even outside the candidate page.
    if (siteId && !sites.some((s) => s.id === siteId)) {
      await relationshipContext(c, p, { ...o, site_id: siteId }, "estimating.read");
      await relationshipContext(c, p, { ...o, site_id: siteId }, "estimating.edit");
      const s = await visible(c, p, "Site", siteId);
      sites.push({ id: s.id, display_name: s.display_name });
    }
    const facilities = siteId
      ? (
          await c.query<{ id: string; display_name: string }>(
            `SELECT r.id,r.name AS display_name FROM ppo.facilities r WHERE r.workspace_id=$1 AND r.company_id=$3 AND r.site_id=$4 AND ${visibility("Facility")} ORDER BY r.name,r.id LIMIT 101`,
            [p.workspace_id, p.actor_id, o.company_id, siteId],
          )
        ).rows
      : [];
    const equipment = siteId
      ? (
          await c.query<{
            id: string;
            display_name: string;
            identity_status: string;
            lifecycle_status: string;
          }>(
            `SELECT r.id,r.display_number||' · '||r.description AS display_name,r.identity_status,r.lifecycle_status FROM ppo.assets r WHERE r.workspace_id=$1 AND r.company_id=$3 AND r.site_id=$4 AND ${visibility("Asset")} ORDER BY r.display_number,r.id LIMIT 101`,
            [p.workspace_id, p.actor_id, o.company_id, siteId],
          )
        ).rows
      : [];
    const owners: { id: string; display_name: string }[] = [];
    for (const u of (
      await c.query<{ id: string; display_name: string }>(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY id",
        [p.workspace_id],
      )
    ).rows)
      try {
        await eligibleActionOwner(c, p, context, u.id);
        owners.push(u);
      } catch (error) {
        if (!(error instanceof AppError) || ![403, 404].includes(error.status))
          throw error;
      }
    return {
      opportunity: {
        id: o.id,
        title: o.title,
        version: o.version,
        site_id: o.site_id,
      },
      owner: { id: p.actor_id, display_name: p.display_name },
      definition: discoveryDefinition,
      definition_hash: discoveryDefinitionHash,
      sites,
      facilities: facilities.slice(0, 100),
      equipment: equipment.slice(0, 100),
      owners,
      limits: { sites: 100, facilities: 100, equipment: 100 },
      more: {
        sites: candidates.length > 100,
        facilities: facilities.length > 100,
        equipment: equipment.length > 100,
      },
    };
  });
}
