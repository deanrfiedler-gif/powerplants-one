import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import {
  hasPermission,
  requireCapability,
  scopeSql,
} from "../platform/permissions";
import {
  opportunityVisibility,
  relationshipContext,
  visibleOpportunity,
} from "../crm/context";
import { visibleActivity } from "../activities/activities";
import {
  currentGroup,
  workspaceAuthority,
} from "./discovery-workspace-context";
import { estimateContext, versionContext } from "./context";
import {
  workloadQuery,
  workloadState,
  type WorkloadState,
} from "./workload-query";

// No cached principal, counts or business-state inference. A read uses one
// snapshot; the canonical services retain authority over every linked source.
// Readiness counts cover only permitted candidates in the same bounded window,
// matched by search and owner and counted before the readiness view applies.
export async function readEstimatingWorkload(
  p: Principal,
  query: Record<string, string> = {},
) {
  const filters = workloadQuery(query);
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireCapability(c, p, "estimating.read");
    const candidates = (
      await c.query<{
        id: string;
        workspace_id: string | null;
        changed_at: Date;
      }>(
        `
      SELECT o.id,g.id AS workspace_id,greatest(o.updated_at,g.updated_at) AS changed_at
      FROM ppo.opportunities o
      JOIN ppo.organisations org ON (org.workspace_id,org.id)=(o.workspace_id,o.organisation_id)
      LEFT JOIN ppo.estimating_workspaces g ON (g.workspace_id,g.opportunity_id)=(o.workspace_id,o.id)
      WHERE o.workspace_id=$1 AND ${opportunityVisibility()} AND ${scopeSql("o.company_id", "o.site_id", "estimating.read")}
      AND (o.close_outcome='Open' OR g.id IS NOT NULL)
      AND ($3='' OR strpos(lower(o.title || ' ' || o.display_number || ' ' || org.display_name || ' ' || o.need_summary),lower($3))>0)
      AND ($4='all' OR g.owner_id=$2)
      ORDER BY ${filters.sort === "customer" ? "lower(org.display_name)," : ""}greatest(o.updated_at,g.updated_at) DESC,o.id
      LIMIT 100`,
        [p.workspace_id, p.actor_id, filters.q, filters.owner],
      )
    ).rows;
    const items = [];
    const counts: Record<WorkloadState, number> = {
      unstarted: 0,
      clarification: 0,
      ready: 0,
      legacy: 0,
    };
    for (const candidate of candidates) {
      try {
        const opportunity = await visibleOpportunity(c, p, candidate.id);
        await relationshipContext(c, p, opportunity, "estimating.read");
        const workspace = candidate.workspace_id
          ? await workspaceAuthority(c, p, candidate.workspace_id)
          : null;
        const group = workspace ? await currentGroup(c, p, workspace) : [];
        const selected = group.find(
          (x) => x.option.id === workspace?.selected_option_id,
        );
        const state = workloadState(selected?.revision.scope_readiness ?? null);
        if (filters.view !== "all" && filters.view !== state) {
          counts[state] += 1;
          continue;
        }
        const context = (
          await c.query<{
            customer: string;
            site: string | null;
            estimating_owner: string | null;
            sales_owner: string;
          }>(
            `
          SELECT org.display_name AS customer,s.display_name AS site,u.display_name AS estimating_owner,sales.display_name AS sales_owner
          FROM ppo.organisations org
          LEFT JOIN ppo.sites s ON s.workspace_id=org.workspace_id AND s.id=$3
          LEFT JOIN ppo.users u ON u.workspace_id=org.workspace_id AND u.id=$4
          JOIN ppo.users sales ON sales.workspace_id=org.workspace_id AND sales.id=$5
          WHERE org.workspace_id=$1 AND org.id=$2`,
            [
              p.workspace_id,
              opportunity.organisation_id,
              opportunity.site_id,
              workspace?.owner_id ?? null,
              opportunity.owner_id,
            ],
          )
        ).rows[0];
        const estimates = [];
        for (const row of (
          await c.query<{ id: string }>(
            "SELECT id FROM ppo.estimates WHERE workspace_id=$1 AND opportunity_id=$2 ORDER BY created_at,id",
            [p.workspace_id, opportunity.id],
          )
        ).rows) {
          try {
            const e = await estimateContext(c, p, row.id),
              saved = await versionContext(c, p, e, e.current_version_id);
            estimates.push({
              id: e.id,
              display_number: e.display_number,
              version: saved.version,
              version_id: saved.id,
              option_id: e.option_id,
              discovery_revision_id: saved.discovery_basis?.revision_id ?? null,
              discovery_revision: saved.discovery_basis?.revision ?? null,
              title: saved.title,
            });
          } catch (error) {
            if (
              !(error instanceof AppError) ||
              ![403, 404].includes(error.status)
            )
              throw error;
          }
        }
        let sales_action: {
          id: string;
          summary: string;
          owner: string;
          due_at: string | null;
          status: string;
        } | null = null;
        try {
          const activity = await visibleActivity(
            c,
            p,
            opportunity.next_activity_id,
          );
          const owner = (
            await c.query<{ display_name: string }>(
              "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, activity.owner_id],
            )
          ).rows[0];
          sales_action = {
            id: activity.id,
            summary: activity.summary,
            owner: owner.display_name,
            due_at: activity.due_at?.toISOString() ?? null,
            status: activity.status,
          };
        } catch (error) {
          if (
            !(error instanceof AppError) ||
            ![403, 404].includes(error.status)
          )
            throw error;
        }
        const due = (
          await c.query<{
            outcome_event_id: string;
            opportunity_version: number;
            status: string;
          }>(
            "SELECT outcome_event_id,opportunity_version,status FROM ppo.opportunity_handovers_due WHERE workspace_id=$1 AND opportunity_id=$2",
            [p.workspace_id, opportunity.id],
          )
        ).rows[0];
        const can_start =
          !workspace &&
          (await hasPermission(
            c,
            p,
            "estimating.edit",
            opportunity.company_id,
            opportunity.site_id ?? undefined,
          ));
        items.push({
          opportunity: {
            id: opportunity.id,
            display_number: opportunity.display_number,
            version: opportunity.version,
            company_id: opportunity.company_id,
            title: opportunity.title,
            need_summary: opportunity.need_summary,
            close_outcome: opportunity.close_outcome,
          },
          ...context,
          estimating_owner_id: workspace?.owner_id ?? null,
          state,
          updated_at: candidate.changed_at.toISOString(),
          response_date: null,
          intake_acceptance: "NotConfigured" as const,
          priority: "NotConfigured" as const,
          sales_handover_due: due ?? null,
          sales_action,
          can_start,
          workspace: workspace
            ? {
                id: workspace.id,
                version: workspace.version,
                selected_option_id: workspace.selected_option_id,
                options: group.map(({ option, revision }) => ({
                  id: option.id,
                  label: option.label,
                  state: option.state,
                  revision_id: revision.id,
                  revision: revision.version,
                  content_hash: revision.content_hash,
                  readiness: revision.scope_readiness,
                })),
              }
            : null,
          estimates,
        });
        counts[state] += 1;
      } catch (error) {
        // Never disclose hidden-source status, counts, identities or labels.
        if (!(error instanceof AppError) || ![403, 404].includes(error.status))
          throw error;
      }
    }
    return {
      items,
      counts,
      filters,
      candidate_limit: 100,
      synthetic: true as const,
    };
  });
}
