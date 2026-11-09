import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { financeContext } from "./context";
import { cents, decimal } from "../projects/commercial/model";
export async function projectClaimMeasures(
  c: QueryClient,
  p: Principal,
  project: string,
) {
  const handoffs = (
    await c.query(
      "SELECT id FROM ppo.finance_handoffs WHERE workspace_id=$1 AND project_id=$2 AND source_kind='ProjectClaim' ORDER BY id",
      [p.workspace_id, project],
    )
  ).rows;
  // Totals require every source's authority, never a sum of a filtered visible page.
  for (const h of handoffs) await financeContext(c, p, h.id);
  const byState = (
    await c.query(
      `SELECT h.status,h.currency,l.claim_tax_basis AS tax_basis,count(DISTINCT h.id)::int AS claim_count,sum(l.claim_amount)::text AS amount
    FROM ppo.finance_handoffs h JOIN ppo.finance_lines l ON (l.workspace_id,l.revision_id)=(h.workspace_id,h.current_revision_id)
    WHERE h.workspace_id=$1 AND h.project_id=$2 AND h.source_kind='ProjectClaim' GROUP BY h.status,h.currency,l.claim_tax_basis ORDER BY h.status,h.currency,l.claim_tax_basis`,
      [p.workspace_id, project],
    )
  ).rows;
  const allocations = (
    await c.query(
      `SELECT a.state,l.claim_currency AS currency,l.claim_tax_basis AS tax_basis,sum(l.claim_amount)::text AS amount FROM ppo.finance_allocation_holds a JOIN ppo.finance_handoffs h ON (h.workspace_id,h.id)=(a.workspace_id,a.handoff_id) JOIN ppo.finance_lines l ON (l.workspace_id,l.id)=(a.workspace_id,a.line_id) WHERE h.workspace_id=$1 AND h.project_id=$2 AND a.state<>'Released' GROUP BY a.state,l.claim_currency,l.claim_tax_basis ORDER BY a.state`,
      [p.workspace_id, project],
    )
  ).rows;
  return {
    completeness: "Complete",
    by_state: byState.map((x) => ({ ...x, amount: decimal(cents(x.amount)) })),
    allocations: allocations.map((x) => ({
      ...x,
      amount: decimal(cents(x.amount)),
    })),
    amount_basis:
      "Current claim revision amounts by workflow state; proposals may overlap. Held/Consumed allocations count each entitlement once. ReconciliationRequired does not establish an exact matched amount.",
    erp_basis:
      "Processed per recorded synthetic ERP outcome; not revenue, invoiced value or cash",
    billed_value: null,
    cash_received: null,
    open_receivable: null,
  };
}
