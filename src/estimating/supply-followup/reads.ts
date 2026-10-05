import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { requireCapability } from "../../platform/permissions";
import { object } from "../../shared/validation";
import { AppError } from "../../platform/errors";
import { followupContext } from "./context";
import { receiptAvailable } from "./receipt-context";
export async function receivingWorklist(
  p: Principal,
  query: Record<string, string> = {},
) {
  object(query, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    await requireCapability(c, p, "supply.coordinate");
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
    for (const row of candidates.filter(
      (r) => r.owner_id === p.actor_id || affected.has(r.target_id),
    )) {
      try {
        const d = await followupContext(c, p, row.revision_id, row.target_id);
        const effects = d.receipt_correction.required.filter(
          (x) => x.demand.owner_id === p.actor_id,
        );
        if (
          (!d.can_write || row.owner_id !== p.actor_id) &&
          !effects.some((x) => x.can_receive)
        )
          continue;
        rows.push({
          revision_id: d.revision_id,
          target_id: d.target_id,
          referral_id: d.referral!.id,
          title: d.basis.conversion.target.title,
          status:
            row.owner_id === p.actor_id
              ? d.status
              : "Affected-demand Receipt receiving",
          due_date: d.referral!.due_date,
          date_needed: d.referral!.date_needed,
          next_action: d.referral!.next_action,
          owner_id: d.referral!.owner_id,
        });
      } catch (e) {
        if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
      }
    }
    return { rows };
  });
}
