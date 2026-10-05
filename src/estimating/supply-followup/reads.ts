import { conversionReadClient } from "../conversion/source-authority";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { requireCapability } from "../../platform/permissions";
import { object } from "../../shared/validation";
import { AppError } from "../../platform/errors";
import { receivingSummary } from "./summary";
import { shortfallAvailable } from "./shortfall-context";
import { receiptAvailable } from "./receipt-context";
import { materialAvailable } from "./material-context";
export async function receivingWorklist(
  p: Principal,
  query: Record<string, string> = {},
) {
  object(query, []);
  return transaction(async (client) => {
    await client.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const c = await conversionReadClient(client, p);
    let coordinationError: AppError | null = null;
    try {
      await requireCapability(c, p, "supply.coordinate");
    } catch (e) {
      if (!(e instanceof AppError) || e.status !== 403) throw e;
      coordinationError = e;
    }
    const candidates = (
      await c.query<{
        revision_id: string;
        target_id: string;
        owner_id: string;
      }>(
        "SELECT DISTINCT ON (target_id) revision_id,target_id,owner_id FROM ppo.quote_supply_events WHERE workspace_id=$1 AND action='Refer' ORDER BY target_id,sequence DESC",
        [p.workspace_id],
      )
    ).rows;
    const rows = [];
    const affected = new Set<string>();
    if (await receiptAvailable(c)) {
      for (const row of (
        await c.query<{ target_id: string }>(
          `SELECT DISTINCT p.target_id FROM ppo.quote_supply_receipt_events p
        JOIN ppo.supply_allocations a ON a.workspace_id=p.workspace_id AND a.supply_id=(p.command->>'record_id')::uuid
        JOIN ppo.supply_records d ON d.workspace_id=a.workspace_id AND d.id=a.demand_id
        WHERE p.workspace_id=$1 AND p.action='ReceiptPropose' AND d.owner_id=$2`,
          [p.workspace_id, p.actor_id],
        )
      ).rows)
        affected.add(row.target_id);
    }
    if (await shortfallAvailable(c))
      for (const row of (
        await c.query<{ target_id: string }>(
          `SELECT DISTINCT p.target_id FROM ppo.quote_supply_shortfall_events p
      JOIN ppo.supply_records d ON d.workspace_id=p.workspace_id
      WHERE p.workspace_id=$1 AND p.action='ShortfallPropose' AND d.owner_id=$2
      AND (p.command->>'demand_id'=d.id::text OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(p.command->'changes','[]')) x WHERE x->>'demand_id'=d.id::text))`,
          [p.workspace_id, p.actor_id],
        )
      ).rows)
        affected.add(row.target_id);
    if (await materialAvailable(c))
      for (const row of (
        await c.query<{ target_id: string }>(
          `SELECT DISTINCT e.target_id FROM ppo.quote_material_events e
         JOIN ppo.supply_records d ON (d.workspace_id,d.id)=(e.workspace_id,e.demand_id)
         JOIN ppo.project_tasks t ON (t.workspace_id,t.id)=(e.workspace_id,e.task_id)
         JOIN ppo.projects p ON (p.workspace_id,p.id)=(t.workspace_id,t.project_id)
         JOIN ppo.activities a ON a.workspace_id=e.workspace_id AND a.id=(e.dependencies->'activity'->>'id')::uuid
         WHERE e.workspace_id=$1 AND e.action='MaterialPropose' AND $2::uuid IN (d.owner_id,t.owner_id,p.coordinator_id,a.owner_id)`,
          [p.workspace_id, p.actor_id],
        )
      ).rows)
        affected.add(row.target_id);
    for (const row of candidates.filter(
      (r) => r.owner_id === p.actor_id || affected.has(r.target_id),
    )) {
      try {
        const rowSummary = await receivingSummary(
          c,
          p,
          row.revision_id,
          row.target_id,
        );
        if (rowSummary) rows.push(rowSummary);
      } catch (e) {
        if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
      }
    }
    if (coordinationError && !rows.length) throw coordinationError;
    return { rows };
  });
}
