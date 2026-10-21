import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { object, uuid } from "../shared/validation";
import { estimatingOptions } from "./reads";
import { handoverRecord } from "../sales/handover-service";
import { workspaceAuthority, currentGroup } from "./discovery-workspace-context";

export type CreationOpportunity = {
  id: string; display_number: string; title: string; company_id: string;
  site_id: string | null; customer: string; site: string | null;
  brief: { state: string; revision: number | null } | null;
};

// The existing eligibility/order/100-row read remains authoritative. Handover labels
// are added only after the same source visibility check as opening that handover.
export async function discoveryCreationChoices(p: Principal) {
  const choices = await estimatingOptions(p);
  return transaction(async c => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const candidates = (await c.query<{ id: string; opportunity_id: string }>(
      "SELECT id,opportunity_id FROM ppo.sales_handovers WHERE workspace_id=$1 AND kind='Estimating' AND opportunity_id=ANY($2::uuid[])",
      [p.workspace_id, choices.items.map(o => o.id)],
    )).rows;
    const items: CreationOpportunity[] = [];
    for (const item of choices.items) {
      const h = candidates.find(h => h.opportunity_id === item.id);
      let brief: CreationOpportunity["brief"] = null;
      if (h) try {
        const { row } = await handoverRecord(c, p, h.id);
        brief = { state: row.state, revision: row.revision };
      } catch (error) {
        if (!(error instanceof AppError) || ![403, 404].includes(error.status)) throw error;
        // Preserve the eligible opportunity without exposing a restricted brief state.
        brief = { state: "Unavailable", revision: null };
      }
      items.push({ ...item, brief } as CreationOpportunity);
    }
    return { ...choices, items };
  });
}

// Resolve a collision by its permitted opportunity, never by an unscoped guessed ID.
export async function existingCreationWorkspace(p: Principal, query: Record<string, string>) {
  const q = object(query, ["opportunity_id"]), opportunity = uuid(q.opportunity_id, "opportunity_id");
  return transaction(async c => {
    const found = (await c.query<{ id: string }>(
      "SELECT id FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND opportunity_id=$2", [p.workspace_id, opportunity],
    )).rows[0];
    if (!found) throw unavailable();
    const workspace = await workspaceAuthority(c, p, found.id);
    await currentGroup(c, p, workspace);
    const created = (await c.query<{ created_at: Date; creator: string }>(
      `SELECT g.created_at,u.display_name AS creator FROM ppo.estimating_workspaces g
       JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.created_by) WHERE g.workspace_id=$1 AND g.id=$2`,
      [p.workspace_id, workspace.id],
    )).rows[0];
    return { id: workspace.id, ...created };
  });
}
