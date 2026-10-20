import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { canonical } from "../platform/operations";
import { scopedOwner } from "../shared/authority";
import { object, uuid, choice, optionalId } from "../shared/validation";
import { visibleOpportunity, relationshipContext } from "../crm/context";
import { handoverRecord, handoverBasis, hashBasis } from "../sales/handover-service";
import { prepareDiscoveryTargets } from "./discovery-context";
import type { DiscoveryInput } from "./discovery";
import type { CreationReview, SalesBriefSelection } from "./discovery-creation-review";

export async function eligibleCreationOwner(c: QueryClient, p: Principal, opportunityId: string, siteId: string | null, id: string) {
  const o = await visibleOpportunity(c, p, opportunityId);
  const owner = await scopedOwner(c, p, id, o.company_id, siteId ?? undefined, "estimating.edit");
  await visibleOpportunity(c, owner, o.id);
  for (const context of [o, { ...o, site_id: siteId }]) {
    await relationshipContext(c, owner, context, "estimating.read");
    await relationshipContext(c, owner, context, "estimating.edit");
  }
  return owner;
}

export async function creationSalesBrief(c: QueryClient, p: Principal, opportunityId: string) {
  const found = (await c.query<{ id: string }>(
    "SELECT id FROM ppo.sales_handovers WHERE workspace_id=$1 AND opportunity_id=$2 AND kind='Estimating'",
    [p.workspace_id, opportunityId],
  )).rows[0];
  if (!found) return null;
  const { row, history } = await handoverRecord(c, p, found.id);
  const accepted = history.find(e => e.action === "Accept" && e.version === row.version && e.revision === row.revision);
  const source_changed = !!row.source_hash && row.source_hash !== hashBasis(await handoverBasis(c, p, row));
  const receiver = (await c.query<{ display_name: string }>(
    "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2", [p.workspace_id, row.receiving_owner_id],
  )).rows[0]?.display_name ?? "Recorded receiver";
  const selection: SalesBriefSelection | null = row.state === "Accepted" && accepted && row.source_hash ? {
    handover_id: row.id, acceptance_event_id: accepted.id,
    expected_version: row.version, source_hash: row.source_hash,
  } : null;
  return { handover_id: row.id, state: row.state, revision: row.revision, receiver, accepted_at: accepted?.recorded_at ?? null,
    source_changed, selection, content: row.content };
}

export async function reviewCreationContext(c: QueryClient, p: Principal, opportunityId: string, discovery: DiscoveryInput, review: CreationReview) {
  const owner = await eligibleCreationOwner(c, p, opportunityId, discovery.scope.site_id, review.owner_id);
  // The recipient must be able to open and edit the actual proposed scope, including referenced records.
  await prepareDiscoveryTargets(c, owner, opportunityId, discovery);
  const brief = await creationSalesBrief(c, p, opportunityId);
  if (canonical(brief?.selection ?? null) !== canonical(review.sales_brief) || (review.sales_brief && brief?.source_changed))
    throw new AppError(409, "SalesBriefChanged", "The accepted Sales brief or its sources changed. Keep your entries and review the current brief before creating the workspace.");
  if (review.sales_brief) {
    const { row, history } = await handoverRecord(c, p, review.sales_brief.handover_id);
    const accepted = history.find(e => e.id === review.sales_brief!.acceptance_event_id);
    if (row.opportunity_id !== opportunityId || row.kind !== "Estimating" || !accepted ||
        accepted.action !== "Accept" || accepted.recorded_by !== row.receiving_owner_id ||
        accepted.source_hash !== row.source_hash) throw unavailable();
    if (hashBasis(await handoverBasis(c, p, row, row.content, true)) !== review.sales_brief.source_hash)
      throw new AppError(409, "SalesBriefChanged", "Review the current accepted Sales source before creating the workspace.");
    // Assignment must not make the incoming estimator unable to see the linked source.
    await handoverRecord(c, owner, row.id);
  }
  return { owner: { id: owner.actor_id, display_name: owner.display_name }, brief };
}

export async function discoveryCreationOptions(p: Principal, query: Record<string, string>) {
  const q = object(query, ["opportunity_id", "scope_mode", "site_id"]);
  const opportunityId = uuid(q.opportunity_id, "opportunity_id");
  const mode = choice(q.scope_mode ?? "Site", "scope_mode", ["Site", "Unknown", "NoSiteRequired"] as const);
  const requestedSite = optionalId(q.site_id, "site_id");
  return transaction(async c => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const o = await visibleOpportunity(c, p, opportunityId);
    const siteId = mode === "Site" ? requestedSite ?? o.site_id : null;
    for (const context of [o, { ...o, site_id: siteId }]) {
      await relationshipContext(c, p, context, "estimating.read");
      await relationshipContext(c, p, context, "estimating.edit");
    }
    const users = (await c.query<{ id: string; display_name: string }>(
      "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY (id=$2) DESC,display_name,id LIMIT 101",
      [p.workspace_id, p.actor_id],
    )).rows;
    const estimators: { id: string; display_name: string }[] = [];
    for (const u of users.slice(0, 100)) {
      try { await eligibleCreationOwner(c, p, o.id, siteId, u.id); estimators.push(u); }
      catch (e) { if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e; }
    }
    return { owner_id: p.actor_id, estimators, more_estimators: users.length > 100,
      brief: await creationSalesBrief(c, p, o.id) };
  });
}

// Historical recovery checks retained sources and current access, not today's acceptance or ownership.
export async function creationBriefReceiptAuthority(c: QueryClient, p: Principal, workspaceId: string, operationId: string, selection: SalesBriefSelection) {
  const b = (await c.query<{ selected_revision_id: string }>(
    `SELECT selected_revision_id FROM ppo.sales_estimating_bindings
     WHERE workspace_id=$1 AND estimating_workspace_id=$2 AND recorded_by=$3 AND operation_id=$4
       AND handover_id=$5 AND acceptance_event_id=$6`,
    [p.workspace_id, workspaceId, p.actor_id, operationId, selection.handover_id, selection.acceptance_event_id],
  )).rows[0];
  if (!b) throw unavailable();
  const { history } = await handoverRecord(c, p, selection.handover_id);
  const e = history.find(e => e.id === selection.acceptance_event_id && e.action === "Accept" && e.source_hash === selection.source_hash);
  if (!e) throw unavailable();
}
