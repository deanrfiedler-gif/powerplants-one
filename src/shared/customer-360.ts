import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { hasPermission, type Capability } from "../platform/permissions";
import { opportunityVisibility } from "../crm/context";
import { estimateContext, quoteContext } from "../estimating/context";
import { projectRow } from "../projects/service";
import { visibleWorkOrder } from "../service/work-orders";
import { ticketVisibility } from "../service/tickets";
import { listActivities } from "../activities/activities";
import { readAccount } from "../finance/accounts";
import { customerContext, visible } from "./reads";

export type CustomerRecordLink = {
  id: string;
  label: string;
  href: string;
  state: string;
  detail?: string;
  amount?: string | null;
  currency?: string | null;
  company_id?: string;
  source_as_at?: string | null;
};
export type CustomerSection = {
  state:
    "Complete" | "Partial" | "Restricted" | "Unavailable" | "Not configured";
  owner: string;
  basis: string;
  observed_at: string;
  items: CustomerRecordLink[];
  next_cursor?: string | null;
};
export type Customer360 = {
  context: {
    id: string;
    version: number;
    company_id: string;
    display_number: string;
    display_name: string;
    legal_name: string | null;
    sector: string | null;
    notes?: string | null;
    owner_name: string | null;
    can_edit: boolean;
    relationship_status: string;
    sites: {
      id: string;
      display_name: string;
      display_number: string;
      location_description: string;
      address: Record<string, string> | null;
      facilities: {
        items: {
          id: string;
          name: string;
          parent_facility_id: string | null;
          parent_relationship: string | null;
        }[];
      };
    }[];
  };
  sections: Record<
    | "deals"
    | "quotations"
    | "orders"
    | "cases"
    | "work_orders"
    | "projects"
    | "accounts"
    | "activities"
    | "documents",
    CustomerSection
  >;
  observed_at: string;
};

// Query each domain by the canonical Organisation UUID. Every candidate is
// scoped by its existing source predicate/context; no hidden totals are sent.
export async function customer360(
  p: Principal,
  id: string,
): Promise<Customer360> {
  const c = database(),
    org = await visible(c, p, "Organisation", id),
    observed_at = new Date().toISOString();
  const context = (await customerContext(
    p,
    id,
  )) as unknown as Customer360["context"];
  const result = (
    state: CustomerSection["state"],
    owner: string,
    basis: string,
    items: CustomerRecordLink[] = [],
  ): CustomerSection => ({ state, owner, basis, items, observed_at });
  async function source(
    owner: string,
    basis: string,
    caps: Capability[],
    read: () => Promise<{
      items: CustomerRecordLink[];
      partial?: boolean;
      next_cursor?: string | null;
    }>,
  ) {
    for (const cap of caps)
      if (!(await hasPermission(c, p, cap, org.company_id)))
        return result(
          "Restricted",
          owner,
          "This source is restricted in the customer's company context. No records or counts are disclosed.",
        );
    try {
      const value = await read();
      return {
        ...result(
          value.partial ? "Partial" : "Complete",
          owner,
          basis,
          value.items,
        ),
        ...(value.next_cursor ? { next_cursor: value.next_cursor } : {}),
      };
    } catch (error) {
      if (error instanceof AppError && [403, 404].includes(error.status))
        return result(
          "Restricted",
          owner,
          "Current source access could not be established; no records or counts are disclosed.",
        );
      return result(
        "Unavailable",
        owner,
        "This source could not be read. Refresh to retry; an unavailable collection is not an empty collection.",
      );
    }
  }
  async function permitted<T>(
    candidates: { id: string }[],
    read: (id: string) => Promise<T>,
  ) {
    const rows: T[] = [];
    for (const candidate of candidates.slice(0, 100))
      try {
        rows.push(await read(candidate.id));
      } catch (error) {
        if (!(error instanceof AppError) || ![403, 404].includes(error.status))
          throw error;
      }
    return rows;
  }
  const deals = await source(
    "CRM Sales",
    "Current permitted opportunities. Forecast values are not orders, invoices or payments; no totals are calculated.",
    ["crm.opportunity.read", "shared.internal.read"],
    async () => {
      const rows = (
        await c.query(
          `SELECT o.id,o.display_number,o.title,o.stage_id,o.close_outcome,o.value_amount FROM ppo.opportunities o
      WHERE o.workspace_id=$1 AND o.organisation_id=$3 AND ${opportunityVisibility()} ORDER BY o.id LIMIT 101`,
          [p.workspace_id, p.actor_id, id],
        )
      ).rows;
      return {
        items: rows.slice(0, 100).map((o) => ({
          id: o.id,
          label: `${o.display_number} · ${o.title}`,
          href: `/sales/opportunities/${o.id}`,
          state: `${o.stage_id} · ${o.close_outcome}`,
          detail:
            o.value_amount === null
              ? "Opportunity value unknown"
              : "Manual opportunity value; inspect the source for its financial basis.",
        })),
        partial: rows.length > 100,
      };
    },
  );
  const quotations = await source(
    "Estimating & quotation",
    "Saved estimates and exact Draft quotations. Alternative estimates and successive quotation revisions are not added together.",
    ["estimating.read"],
    async () => {
      const candidates = (
        await c.query(
          "SELECT e.id FROM ppo.estimates e JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(e.workspace_id,e.opportunity_id) WHERE e.workspace_id=$1 AND o.organisation_id=$2 ORDER BY e.id LIMIT 101",
          [p.workspace_id, id],
        )
      ).rows;
      const estimates = await permitted(candidates, (x) =>
        estimateContext(c, p, x),
      );
      const items: CustomerRecordLink[] = estimates.map((e) => ({
        id: e.id,
        label: e.display_number,
        href: `/estimating/estimates/${e.id}`,
        state: e.state,
        detail:
          "Saved estimate; Estimating owns its selected basis and changes.",
      }));
      for (const e of estimates) {
        const candidates = (
          await c.query(
            "SELECT id FROM ppo.draft_quote_revisions WHERE workspace_id=$1 AND estimate_id=$2 ORDER BY created_at DESC,id LIMIT 101",
            [p.workspace_id, e.id],
          )
        ).rows;
        const quotes = await permitted(candidates, (x) =>
          quoteContext(c, p, x),
        );
        for (const { q } of quotes)
          items.push({
            id: q.id,
            label: `Draft quotation · ${e.display_number}`,
            href: `/estimating/quotes/${q.id}`,
            state: "Draft",
            detail: "Exact saved revision; not an issued or accepted order.",
          });
      }
      return { items, partial: true }; // Bounded revision lists, never a complete commercial population.
    },
  );
  const cases = await source(
    "Service cases",
    "Permitted cases at Sites with a current customer relationship. This is location context, not a claim that the customer is the bill payer.",
    ["service.ticket.read"],
    async () => {
      const rows = (
        await c.query(
          `SELECT t.id,t.display_number,t.summary,t.status FROM ppo.tickets t WHERE t.workspace_id=$1 AND ${ticketVisibility()}
      AND EXISTS(SELECT 1 FROM ppo.site_parties sp WHERE sp.workspace_id=t.workspace_id AND sp.site_id=t.site_id AND sp.organisation_id=$3
      AND sp.valid_from<=clock_timestamp() AND (sp.valid_to IS NULL OR sp.valid_to>clock_timestamp())) ORDER BY t.id LIMIT 101`,
          [p.workspace_id, p.actor_id, id],
        )
      ).rows;
      return {
        items: rows.slice(0, 100).map((t) => ({
          id: t.id,
          label: `${t.display_number} · ${t.summary}`,
          href: `/service/tickets/${t.id}`,
          state: t.status,
        })),
        partial: rows.length > 100,
      };
    },
  );
  const work_orders = await source(
    "Service work orders",
    "Work orders with this exact customer ID. Attendance, remaining work, resolution and commercial settlement remain separate.",
    ["service.work_order.read"],
    async () => {
      const candidates = (
        await c.query(
          "SELECT id FROM ppo.work_orders WHERE workspace_id=$1 AND customer_id=$2 ORDER BY id LIMIT 101",
          [p.workspace_id, id],
        )
      ).rows;
      const rows = await permitted(candidates, (x) =>
        visibleWorkOrder(c, p, x),
      );
      return {
        items: rows.map((w) => ({
          id: w.id,
          label: w.display_number,
          href: `/service/work-orders/${w.id}`,
          state: w.status,
        })),
        partial: true,
      };
    },
  );
  const projects = await source(
    "Projects",
    "Exact customer-related Projects. Technical completion, customer acceptance and commercial closeout are separate decisions.",
    ["project.read", "shared.internal.read"],
    async () => {
      const candidates = (
        await c.query(
          "SELECT id FROM ppo.projects WHERE workspace_id=$1 AND organisation_id=$2 ORDER BY id LIMIT 101",
          [p.workspace_id, id],
        )
      ).rows;
      const rows = await permitted(candidates, (x) => projectRow(c, p, x));
      return {
        items: rows.map((r) => ({
          id: r.id,
          label: `${r.display_number} · ${r.title}`,
          href: `/projects/${r.id}`,
          state: r.lifecycle ?? "Active",
        })),
        partial: true,
      };
    },
  );
  const accounts = await source(
    "Finance",
    "Exact company-specific synthetic account observations. Each currency and account stands alone; source balances and unapplied cash are separate. No ageing or credit rule is inferred.",
    ["finance.account.read", "shared.finance.read"],
    async () => {
      const candidates = (
        await c.query(
          "SELECT id FROM ppo.finance_accounts WHERE workspace_id=$1 AND organisation_id=$2 ORDER BY id LIMIT 101",
          [p.workspace_id, id],
        )
      ).rows;
      const rows = await permitted(candidates, (x) =>
        readAccount(p, id, { account_id: x }),
      );
      return {
        items: rows.map((r) => ({
          id: r.account.id,
          label: `${r.account.currency} account`,
          href: `/customers/${id}/account?account_id=${r.account.id}`,
          state: r.balance_status,
          amount: r.account_balance,
          currency: r.account.currency,
          company_id: r.account.company_id,
          source_as_at: r.current?.source_as_at ?? null,
          detail: `Source completeness: ${r.current?.completeness ?? "Not observed"}. Unapplied cash: ${r.unapplied_cash ?? "Unknown"} ${r.account.currency}.`,
        })),
        partial:
          rows.some((r) => r.current?.completeness !== "Complete") ||
          candidates.length > 100,
      };
    },
  );
  const activities = await source(
    "My Work / Activity",
    "Direct Organisation-linked Activities, with current source permissions. Broader interaction history is not inferred.",
    ["activity.read"],
    async () => {
      const page = await listActivities(p, {
        object_type: "Organisation",
        object_id: id,
        limit: 100,
      });
      return {
        items: page.items.map((a) => ({
          id: a.id,
          label: a.summary,
          href: `/work/${a.id}`,
          state: a.status,
          detail: `${a.owner_name} · ${a.due_needed ? "Due date needed" : (a.due_at ?? "Date unknown")}`,
        })),
        partial: !!page.next_cursor,
        next_cursor: page.next_cursor,
      };
    },
  );
  // There is no live sales-order or generic customer-document provider contract.
  // Keep these first-class views truthful rather than inventing a source store.
  const orders = result(
    "Not configured",
    "MYOB Acumatica (intended ERP authority)",
    "No verified sales-order read contract is connected. Orders and ordered, allocated, shipped, delivered, cancelled, returned and invoiced quantities are unavailable, not zero. Accepted quotations are not ERP orders.",
  );
  const documents = result(
    "Not configured",
    "SharePoint (intended business-document authority)",
    "A general customer-linked document library is not connected. Exact native Draft quotations remain under Deals & quotations; Service owns its issued reports. No document is issued from Customer 360.",
  );
  // Recheck the root after reading cross-domain data, including identity changes.
  await visible(c, p, "Organisation", id);
  return {
    context,
    sections: {
      deals,
      quotations,
      orders,
      cases,
      work_orders,
      projects,
      accounts,
      activities,
      documents,
    },
    observed_at,
  };
}
