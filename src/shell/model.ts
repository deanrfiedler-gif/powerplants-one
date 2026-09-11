import type { Capability } from "../platform/permissions";

export type QuickAction = { id: string; label: string; href: string; module: string };
const actions: (QuickAction & { requires: Capability[] })[] = [
  { id: "engineering", label: "Engineering request", href: "/engineering?create=1", module: "Engineering", requires: ["engineering.read", "engineering.create"] },
  { id: "lead", label: "Lead", href: "/crm/leads?create=1", module: "CRM Sales", requires: ["crm.lead.read", "crm.lead.create"] },
  { id: "project", label: "Project", href: "/projects/new", module: "Projects", requires: ["project.read", "project.create"] },
  { id: "opportunity", label: "Opportunity", href: "/crm/opportunities/new", module: "CRM Sales", requires: ["crm.opportunity.read", "crm.opportunity.create"] },
  { id: "estimate", label: "Estimate", href: "/estimating/new", module: "Estimating", requires: ["estimating.read", "estimating.edit"] },
  { id: "ticket", label: "Service request", href: "/service/tickets/new", module: "Service", requires: ["service.ticket.read", "service.ticket.edit"] },
  { id: "work-order", label: "Work order", href: "/service/work-orders/new", module: "Service", requires: ["service.work_order.read", "service.work_order.edit"] },
  { id: "activity", label: "Activity", href: "/work/new", module: "My Work", requires: ["activity.read", "activity.edit"] },
  { id: "customer", label: "Customer", href: "/customers/new?kind=customer", module: "Customers", requires: ["shared.read", "shared.create"] },
  { id: "contact", label: "Contact", href: "/customers/new?kind=person", module: "Contacts", requires: ["shared.read", "shared.create"] },
  { id: "site", label: "Site", href: "/customers/new?kind=site", module: "Customers", requires: ["shared.read", "shared.create"] },
  { id: "equipment", label: "Equipment", href: "/customers/new?kind=asset", module: "Customers", requires: ["shared.read", "shared.create"] },
];
export function actionsForCapabilities(grants: ReadonlySet<string>): QuickAction[] {
  // Entry points only. Existing forms/commands still check the chosen record scope.
  return actions.filter(action => action.requires.every(cap => grants.has(cap)))
    .map(({ id, label, href, module }) => ({ id, label, href, module }));
}
export function contextualActions(actions: QuickAction[], module: string) {
  return actions.toSorted((a, b) => Number(b.module === module) - Number(a.module === module));
}
export type ShellContext = { display_name: string; actions: QuickAction[] };
export type SearchItem = { id: string; label: string; reference: string; kind: string; href: string };
export type SearchResults = { items: SearchItem[]; has_more: boolean; limit_per_type: number };
