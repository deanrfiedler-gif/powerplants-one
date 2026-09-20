// "Reviews & handovers" lists submissions that are waiting for a decision the reader is allowed
// to make. It is a set of doors, not a decision surface: accepting, returning, clarifying and
// releasing stay in the owning module, and opening an item here decides nothing.
// Only modules that record a review appear. Estimating and Engineering record none today.
import { listFinance } from "../finance/reads";
import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { hasPermission } from "../platform/permissions";
import { listReports } from "../reports/service";

export type ReviewItem = {
  id: string;
  source: "ServiceReport" | "FinanceHandoff";
  record_id: string;
  reference: string;
  // The exact submission awaiting a decision, as the source identifies it.
  revision: string;
  title: string;
  context: string | null;
  submitted_at: string | null;
  href: string;
};

export async function listWorkReviews(
  p: Principal,
  filters: { company_id: string | null; limit: number },
) {
  const c = database();
  const [reports, finance] = await Promise.all([
    Promise.all([hasPermission(c, p, "report.read"), hasPermission(c, p, "report.review")]).then((v) => v.every(Boolean)),
    Promise.all([hasPermission(c, p, "finance.read"), hasPermission(c, p, "finance.review")]).then((v) => v.every(Boolean)),
  ]);
  if (!reports && !finance) return null;
  const items: ReviewItem[] = [];
  if (reports) {
    const list = await listReports(p);
    for (const r of list.items)
      if (r.status === "Submitted")
        items.push({
          id: `report:${r.id}:${r.revision}`,
          source: "ServiceReport",
          record_id: r.id,
          reference: r.reference,
          revision: `r${String(r.revision).padStart(2, "0")}`,
          title: "Service report submitted for review",
          context: r.appointment_reference,
          submitted_at: new Date(r.updated_at).toISOString(),
          href: `/service/reports/${r.id}`,
        });
  }
  if (finance) {
    const list = await listFinance(p, {
      status: "ReadyForReview",
      ...(filters.company_id ? { company_id: filters.company_id } : {}),
    });
    for (const f of list.items)
      items.push({
        id: `finance:${f.id}:${f.version}`,
        source: "FinanceHandoff",
        record_id: f.id,
        reference: f.display_number,
        revision: `v${f.version}`,
        title: "Finance handoff ready for review",
        context: [f.customer_name, f.work_reference].filter(Boolean).join(" · ") || null,
        submitted_at: new Date(f.submitted_at ?? f.created_at).toISOString(),
        href: `/finance/handoffs/${f.id}`,
      });
  }
  // Longest waiting first; identifiers keep equal times stable.
  items.sort(
    (a, b) =>
      (a.submitted_at ?? "").localeCompare(b.submitted_at ?? "") || a.id.localeCompare(b.id),
  );
  return { total: items.length, items: items.slice(0, filters.limit) };
}
