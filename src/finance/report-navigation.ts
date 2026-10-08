import type { Principal } from "../platform/identity";
import { hasPermission, scopeSql, type QueryClient } from "../platform/permissions";
import { financeContext, financeWork } from "./context";
import { AppError } from "../platform/errors";
// Navigation only. Existing source/account/recipient checks own preparation and writes.
export async function reportFinanceNavigation(c: QueryClient, p: Principal, report: { id: string; company_id: string; site_id: string; status: string; current_revision_id: string }, workId: string) {
  const permitted = async () => await hasPermission(c,p,"finance.read",report.company_id,report.site_id) && await hasPermission(c,p,"shared.finance.read",report.company_id,report.site_id);
  if (!await permitted() || !["Reviewed","Issued"].includes(report.status)) return null;
  const existing = (await c.query<{id:string;reference:string}>(`SELECT f.id,f.display_number AS reference FROM ppo.finance_handoffs f JOIN ppo.finance_revisions r ON (r.workspace_id,r.id)=(f.workspace_id,f.current_revision_id) WHERE f.workspace_id=$1 AND f.work_order_id=$3 AND ${scopeSql("f.company_id","f.site_id","finance.read")} AND ${scopeSql("f.company_id","f.site_id","shared.finance.read")} AND EXISTS(SELECT 1 FROM jsonb_array_elements(r.source_snapshot->'reports') report WHERE report->>'report_id'=$4 AND report->>'revision_id'=$5 AND EXISTS(SELECT 1 FROM ppo.report_reviews review WHERE review.workspace_id=f.workspace_id AND review.report_id=$4::uuid AND review.revision_id=$5::uuid AND review.id=(report->>'review_id')::uuid AND review.decision='Approved')) ORDER BY f.id LIMIT 20`,[p.workspace_id,p.actor_id,workId,report.id,report.current_revision_id])).rows;
  const visible = [];
  for (const row of existing) try {
    await financeContext(c,p,row.id);
    visible.push({...row, href:`/finance/handoffs/${row.id}`});
  } catch (error) { if (!(error instanceof AppError) || ![403,404].includes(error.status)) throw error; }
  let prepare = false;
  if (report.status === "Issued" && await hasPermission(c,p,"finance.prepare",report.company_id,report.site_id)) try {
    await financeWork(c,p,workId,"finance.prepare"); prepare = true;
  } catch (error) { if (!(error instanceof AppError) || ![403,404].includes(error.status)) throw error; }
  if (!await permitted()) return null;
  return { existing: visible, prepare_href: prepare ? `/finance/handoffs/new?${new URLSearchParams({work_order_id:workId, report_id:report.id})}` : null };
}
