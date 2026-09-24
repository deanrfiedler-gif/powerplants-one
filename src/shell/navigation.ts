import { controlPath } from "../engineering/control/navigation";
import type { Capability } from "../platform/permissions";
import type { ProductIconName } from "../components/product-icons";

export const workspaces = [
  { id: "sales", label: "Sales", primary: "deals", secondary: "leads" },
  {
    id: "estimate",
    label: "Estimating & quotation",
    primary: "estimates",
    secondary: "wizard",
  },
  {
    id: "engineering",
    label: "Engineering",
    primary: "engineering",
    secondary: "drawings",
  },
  {
    id: "projects",
    label: "Projects",
    primary: "projects",
    secondary: "programme",
  },
  {
    id: "service",
    label: "Service operations",
    primary: "tickets",
    secondary: "planner",
  },
  {
    id: "supply",
    label: "Supply chain",
    primary: "supply",
    secondary: "deliveries",
  },
  {
    id: "finance",
    label: "Finance",
    primary: "finance",
    secondary: "accounts",
  },
] as const;
export type WorkspaceId = (typeof workspaces)[number]["id"];
export type ShellDestination = {
  id: string;
  label: string;
  icon: ProductIconName;
  tabLabel?: string;
  menuLabel?: string;
  href?: string;
  workspace?: WorkspaceId;
  requires?: Capability[];
  localOnly?: boolean;
  readiness?: "ready" | "unavailable";
  requiresAll?: Capability[];
  requiresAny?: Capability[];
};
export const destinations: ShellDestination[] = [
  {"id": "settings", "label": "Settings", "icon": "settings", "readiness": "unavailable"},
  {"id": "home", "label": "Home", "icon": "home", "readiness": "ready", "href": "/"},
  {"id": "work", "label": "My Work", "icon": "nav-work", "readiness": "ready", "href": "/work", "requires": ["activity.read"]},
  {"id": "mail", "label": "Sales Inbox", "icon": "nav-mail", "readiness": "ready", "href": "/email", "requires": ["email.read"]},
  {"id": "calendar", "label": "Activities", "icon": "nav-activities", "readiness": "ready", "href": "/calendar", "requires": ["activity.read"]},
  {"id": "pulse", "label": "Pulse", "icon": "nav-pulse", "readiness": "ready", "href": "/sales/pulse", "workspace": "sales", "requires": ["activity.read"], "requiresAny": ["crm.opportunity.read", "crm.lead.read"]},
  {"id": "leads", "label": "Leads", "icon": "nav-leads", "readiness": "ready", "href": "/sales/leads", "workspace": "sales", "requires": ["crm.lead.read"]},
  {"id": "deals", "label": "Deals", "icon": "nav-deals", "readiness": "ready", "href": "/sales/opportunities", "workspace": "sales", "requires": ["crm.opportunity.read"]},
  {"id": "tasks", "label": "Tasks", "icon": "nav-tasks", "readiness": "ready", "href": "/sales/tasks", "workspace": "sales", "requires": ["activity.read"], "requiresAny": ["crm.opportunity.read", "crm.lead.read"]},
  {"id": "contacts", "label": "Contacts", "icon": "nav-contacts", "readiness": "ready", "href": "/contacts", "requires": ["shared.read"]},
  {"id": "people", "label": "People", "icon": "nav-people", "readiness": "ready", "href": "/people", "requires": ["shared.read"]},
  {"id": "customers", "label": "Organisations", "icon": "nav-organisations", "readiness": "ready", "href": "/customers", "requires": ["shared.read"]},
  {"id": "products", "label": "Products", "icon": "nav-products", "readiness": "unavailable"},
  {"id": "insights", "label": "Insights", "icon": "nav-insights", "readiness": "unavailable", "workspace": "sales"},
  {"id": "intake", "label": "Intake", "icon": "nav-inbox", "readiness": "unavailable", "workspace": "estimate"},
  {"id": "wizard", "label": "Estimation wizard", "icon": "nav-wizard", "readiness": "ready", "href": "/estimating/discovery", "workspace": "estimate", "requires": ["estimating.read"]},
  {"id": "estimates", "label": "Estimates", "icon": "nav-estimates", "readiness": "ready", "href": "/estimating", "workspace": "estimate", "requires": ["estimating.read"]},
  {"id": "configurations", "label": "Specialist configurations", "icon": "nav-configurations", "readiness": "ready", "href": "/estimating/configurations", "workspace": "estimate", "requires": ["estimating.read"]},
  {"id": "pricing", "label": "Supplier pricing", "icon": "nav-pricing", "readiness": "unavailable"},
  {"id": "quotations", "label": "Quotations", "icon": "nav-quotation", "readiness": "ready", "href": "/estimating/quotes", "workspace": "estimate", "requires": ["estimating.quote.read"], "requiresAll": ["estimating.read"]},
  {"id": "estimate-reviews", "label": "Reviews & approvals", "icon": "nav-approval", "readiness": "unavailable", "workspace": "estimate"},
  {"id": "fertigation", "label": "Priva Fertigation Configurator", "icon": "nav-fertigation", "readiness": "ready", "href": "/estimating/fertigation", "workspace": "estimate", "requires": ["estimating.read"]},
  {"id": "engineering", "label": "Engineering workload", "icon": "nav-workload", "readiness": "ready", "href": "/engineering", "workspace": "engineering", "requires": ["engineering.read"]},
  {"id": "basis", "label": "Design basis & interfaces", "icon": "nav-interfaces", "readiness": "ready", "href": "/engineering/basis", "requires": ["engineering.read"], "workspace": "engineering"},
  {"id": "drawings", "label": "Drawings", "icon": "nav-drawings", "readiness": "ready", "href": "/engineering/drawings", "requires": ["engineering.read"], "workspace": "engineering"},
  {"id": "materials", "label": "Materials & substitutions", "icon": "nav-materials", "readiness": "ready", "href": "/engineering/materials", "workspace": "engineering", "requires": ["engineering.read"]},
  {"id": "changes", "label": "Change review", "icon": "nav-changes", "readiness": "ready", "href": "/engineering/changes", "workspace": "engineering", "requires": ["engineering.read"]},
  {"id": "technical-reviews", "label": "Technical reviews", "icon": "nav-approval", "readiness": "ready", "href": "/engineering/reviews", "requires": ["engineering.read"], "workspace": "engineering"},
  {"id": "commissioning", "label": "Commissioning & as-built", "icon": "nav-commissioning", "readiness": "ready", "href": "/engineering/commissioning", "workspace": "engineering", "requires": ["engineering.read"]},
  {"id": "projects", "label": "Projects", "icon": "nav-projects", "readiness": "ready", "href": "/projects", "workspace": "projects", "requires": ["project.read"]},
  {"id": "programme", "label": "Programme", "icon": "nav-programme", "readiness": "ready", "href": "/projects/programme", "workspace": "projects", "requires": ["project.read"]},
  {"id": "readiness", "label": "Delivery readiness", "icon": "nav-readiness", "readiness": "unavailable", "workspace": "projects"},
  {"id": "risks", "label": "Risks & issues", "icon": "nav-risks", "readiness": "unavailable", "workspace": "projects"},
  {"id": "variations", "label": "Variations & obligations", "icon": "nav-variations", "readiness": "unavailable", "workspace": "projects"},
  {"id": "assurance", "label": "Site assurance", "icon": "nav-assurance", "readiness": "unavailable", "workspace": "projects"},
  {"id": "acceptance", "label": "Acceptance & closeout", "icon": "nav-acceptance", "readiness": "ready", "href": "/projects/acceptance", "workspace": "projects", "requires": ["project.read"]},
  {"id": "tickets", "label": "Service requests", "icon": "nav-requests", "readiness": "ready", "href": "/service/tickets", "workspace": "service", "requires": ["service.ticket.read"]},
  {"id": "orders", "label": "Work orders", "icon": "nav-orders", "readiness": "ready", "href": "/service/work-orders", "workspace": "service", "requires": ["service.work_order.read"]},
  {"id": "planner", "label": "Schedule", "icon": "nav-schedule", "readiness": "ready", "href": "/schedule", "workspace": "service", "requires": ["schedule.read"]},
  {"id": "technicians", "label": "Field team", "icon": "nav-team", "readiness": "ready", "href": "/service/technicians", "workspace": "service", "requires": ["schedule.read"]},
  {"id": "packs", "label": "Job packs", "icon": "nav-packs", "readiness": "ready", "href": "/service/packs", "workspace": "service", "requires": ["pack.read"]},
  {"id": "reports", "label": "Service review", "icon": "nav-service-review", "readiness": "ready", "href": "/service/reports", "workspace": "service", "requires": ["report.read"]},
  {"id": "jobs", "label": "My jobs", "icon": "nav-service", "readiness": "ready", "href": "/my-jobs", "workspace": "service", "requires": ["field.read.own"]},
  {"id": "supply", "label": "Material demand", "icon": "nav-demand", "readiness": "unavailable", "workspace": "supply"},
  {"id": "purchasing", "label": "Purchasing", "icon": "nav-purchasing", "readiness": "unavailable", "workspace": "supply"},
  {"id": "inbound", "label": "Inbound shipments", "icon": "nav-inbound", "readiness": "unavailable", "workspace": "supply"},
  {"id": "receiving", "label": "Receiving", "icon": "nav-receiving", "readiness": "unavailable", "workspace": "supply"},
  {"id": "stock", "label": "Stock & reservations", "icon": "nav-stock", "readiness": "unavailable", "workspace": "supply"},
  {"id": "deliveries", "label": "Dispatch & delivery", "icon": "nav-dispatch", "readiness": "unavailable", "workspace": "supply"},
  {"id": "returns", "label": "Returns & claims", "icon": "nav-returns", "readiness": "unavailable", "workspace": "supply"},
  {"id": "finance", "label": "Finance handoffs", "icon": "nav-inbox", "readiness": "ready", "href": "/finance/handoffs", "workspace": "finance", "requires": ["finance.read"]},
  {"id": "accounts", "label": "Customer accounts", "icon": "nav-accounts", "readiness": "ready", "href": "/finance/accounts", "workspace": "finance", "requires": ["finance.account.read"], "requiresAll": ["shared.finance.read", "finance.read"]},
  {"id": "performance", "label": "Project performance", "icon": "nav-performance", "readiness": "unavailable", "workspace": "finance"},
  {"id": "claims", "label": "Claims & obligations", "icon": "nav-claims", "readiness": "unavailable", "workspace": "finance"},
  {"id": "cash", "label": "Cash outlook", "icon": "nav-cash", "readiness": "unavailable", "workspace": "finance"},
  {"id": "reconciliation", "label": "Reconciliation", "icon": "nav-reconciliation", "readiness": "unavailable", "workspace": "finance"},
  {"id": "exceptions", "label": "Exceptions", "icon": "nav-exceptions", "readiness": "unavailable", "workspace": "finance"},
  {"id": "sites", "label": "Sites", "icon": "nav-sites", "readiness": "ready", "href": "/sites", "requires": ["shared.read"]},
  {"id": "facilities", "label": "Facilities & growing areas", "icon": "nav-facilities", "readiness": "ready", "href": "/facilities", "requires": ["shared.read"]},
  {"id": "surveys", "label": "Site surveys & as-found", "icon": "nav-sites", "readiness": "ready", "href": "/surveys", "requires": ["shared.read"]},
  {"id": "equipment", "label": "Equipment", "icon": "nav-equipment", "readiness": "ready", "href": "/equipment", "requires": ["shared.read"]},
  {"id": "documents", "label": "Documents", "icon": "nav-documents", "readiness": "unavailable"},
  {"id": "approvals", "label": "Approvals & handovers", "icon": "nav-approval", "readiness": "ready", "href": "/work/reviews", "requires": ["activity.read"]},
  {"id": "recovery", "label": "Integrations & recovery", "icon": "nav-recovery", "readiness": "ready", "href": "/admin", "requires": ["shared.read", "finance.read", "service.work_order.read", "field.read.own"]},
  {"id": "foundation", "label": "Foundation checks", "icon": "settings", "readiness": "ready", "href": "/foundation", "localOnly": true},
];
// The My Work secondary menu. Order and labels follow design report r03; the routes are the
// only authority for what each view shows, and every read keeps its own permission checks.
export const workViews = [
  { id: "overview", label: "Overview", href: "/work", icon: "overview" },
  { id: "actions", label: "My actions", href: "/work/actions", icon: "nav-tasks" },
  { id: "reviews", label: "Reviews & handovers", href: "/work/reviews", icon: "nav-approval" },
  { id: "waiting", label: "Blocked & waiting", href: "/work/waiting", icon: "clock" },
  { id: "team", label: "Team queue", href: "/work/team", icon: "customers" },
  { id: "updates", label: "Updates & preferences", href: "/work/updates", icon: "settings" },
] as const;
export type WorkViewId = (typeof workViews)[number]["id"];
// The Sales phone bar of mobile r07: four destinations and More, icons only. Each entry is an
// existing destination under the name a salesperson uses for it; the name is the accessible
// label, and the destination keeps its own route and permission. Other workspaces keep the
// labelled three-and-More bar.
export const salesPhoneBar = [
  { id: "work", label: "My Work", icon: "bar-work" },
  { id: "deals", label: "Deals", icon: "bar-opportunities" },
  { id: "calendar", label: "Activities", icon: "bar-activities" },
  { id: "contacts", label: "Contacts", icon: "bar-contacts" },
] as const;
// The EN-06 Released Materials & Substitutions secondary menu (build plan r02, section 6.2): six route-backed
// destinations under one Engineering package, in this order. They replace horizontal module tabs completely.
export const materialsModuleLabel = "Released Materials & Substitutions";
export const materialViews = [
  { id: "register", label: "Materials register", segment: "" },
  { id: "mapping", label: "Item & unit mapping", segment: "mapping" },
  { id: "substitutions", label: "Substitution review", segment: "substitutions" },
  { id: "releases", label: "Review & release", segment: "releases" },
  { id: "handover", label: "Supply handover", segment: "handover" },
  { id: "history", label: "Changes & history", segment: "history" },
] as const;
export type MaterialViewId = (typeof materialViews)[number]["id"];
export const materialsHref = (packageId: string, view: MaterialViewId = "register") => {
  const segment = materialViews.find((v) => v.id === view)!.segment;
  return `/engineering/${packageId}/materials${segment ? `/${segment}` : ""}`;
};
// The header names the module, and the destination too while the secondary menu is hidden. The entry
// page has no destination; an unknown segment answers nothing rather than pretending to be the register.
export function materialsPath(path: string) {
  const match = /^\/engineering\/(?:([^/]+)\/)?materials(?:\/([a-z]+))?\/?$/.exec(path);
  if (!match) return undefined;
  const view = match[1] ? materialViews.find((v) => v.segment === (match[2] ?? "")) : undefined;
  return match[1] && !view ? undefined : { package_id: match[1] ?? null, view };
}
// The EN-07 Engineering Change-Impact Review secondary menu (build plan r02, section 6): six route-backed
// destinations under one Engineering package, in this order. There are no horizontal module tabs.
export const changesModuleLabel = "Engineering Change-Impact Review";
export const changeViews = [
  { id: "register", label: "Change register", segment: "" },
  { id: "impact", label: "Impact assessment", segment: "impact" },
  { id: "reviews", label: "Review & decisions", segment: "reviews" },
  { id: "handovers", label: "Actions & handovers", segment: "handovers" },
  { id: "verification", label: "Retest & verification", segment: "verification" },
  { id: "history", label: "Changes & history", segment: "history" },
] as const;
export type ChangeViewId = (typeof changeViews)[number]["id"];
// ?change=<uuid> names the selected change in every destination; the server validates it against the package.
export const changesHref = (packageId: string, view: ChangeViewId = "register", changeId?: string | null) => {
  const segment = changeViews.find((v) => v.id === view)!.segment;
  return `/engineering/${packageId}/changes${segment ? `/${segment}` : ""}${changeId ? `?change=${changeId}` : ""}`;
};
// The entry page has no destination; an unknown segment answers nothing rather than pretending to be the register.
export function changesPath(path: string) {
  const match = /^\/engineering\/(?:([^/]+)\/)?changes(?:\/([a-z]+))?\/?$/.exec(path);
  if (!match) return undefined;
  const view = match[1] ? changeViews.find((v) => v.segment === (match[2] ?? "")) : undefined;
  return match[1] && !view ? undefined : { package_id: match[1] ?? null, view };
}
// The EN-08 Commissioning Basis & As-Built Release secondary menu (build plan r02, section 4): six route-backed
// destinations at static addresses. The Engineering package is context (?package=<uuid>) and the commissioning
// package is the selected record (?record=<uuid>); they are different identities and neither is a display reference.
export const commissioningModuleLabel = "Commissioning Basis & As-Built Release";
export const commissioningViews = [
  { id: "register", label: "Commissioning register", heading: "Commissioning register", segment: "" },
  { id: "basis", label: "Test basis & criteria", heading: "Test basis & criteria", segment: "basis" },
  { id: "results", label: "Results & retests", heading: "Results & retests", segment: "results" },
  // A short menu label; the accessible heading says it in full.
  { id: "configuration", label: "Configuration & redlines", heading: "Installed configuration & redlines", segment: "configuration" },
  { id: "releases", label: "Review & as-built release", heading: "Review & as-built release", segment: "releases" },
  { id: "handovers", label: "Handover & history", heading: "Handover & history", segment: "handovers" },
] as const;
export type CommissioningViewId = (typeof commissioningViews)[number]["id"];
export const commissioningHref = (view: CommissioningViewId = "register", query: { package?: string | null; record?: string | null; panel?: string | null } = {}) => {
  const segment = commissioningViews.find((v) => v.id === view)!.segment, q = new URLSearchParams();
  for (const key of ["package", "record", "panel"] as const) if (query[key]) q.set(key, query[key]!);
  return `/engineering/commissioning${segment ? `/${segment}` : ""}${q.size ? `?${q}` : ""}`;
};
export const commissioningRecordHref = (recordId: string, section: string | null = null) => `/engineering/commissioning/packages/${recordId}${section ? `#${section}` : ""}`;
// Static segments: they take precedence over /engineering/:id, and an unknown segment answers nothing.
export function commissioningPath(path: string) {
  const match = /^\/engineering\/commissioning(?:\/(packages\/[^/]+|[a-z]+))?\/?$/.exec(path);
  if (!match) return undefined;
  if (match[1]?.startsWith("packages/")) return { view: undefined, record_id: match[1].slice(9) };
  const view = commissioningViews.find((v) => v.segment === (match[1] ?? ""));
  return view ? { view, record_id: null } : undefined;
}
export const workViewForPath = (path: string) =>
  workViews.find((view) => view.href === path);
export const destination = (id: string) =>
  destinations.find((item) => item.id === id)!;
export const matchesPath = (path: string, href: string) =>
  path === href || (href !== "/" && path.startsWith(href + "/"));
export function pageForPath(path: string) {
  if (path === "/search") return { ...destination("work"), id: "search", label: "Search", href: "/search" };
  if (materialsPath(path) || changesPath(path) || commissioningPath(path) || controlPath(path)) return destination("engineering");
  // Specific routes precede their parent; a future page must not inherit a wrong guide.
  const item = destinations
    .filter((d) => d.href && matchesPath(path, d.href))
    .toSorted((a, b) => b.href!.length - a.href!.length)[0];
  if (path.startsWith("/service/appointments/")) return destination("planner");
  if (path.startsWith("/documents/")) return destination("documents");
  return item;
}
export function navigationForCapabilities(
  grants: ReadonlySet<string>,
  hosted: boolean,
) {
  // Navigation is discovery only. Every page/read/command keeps its own scope checks.
  return destinations
    .filter(
      (d) =>
        d.href && d.readiness !== "unavailable" &&
        (!d.requiresAll || d.requiresAll.every(cap => grants.has(cap))) &&
        (!d.requiresAny || d.requiresAny.some(cap => grants.has(cap))) &&
        (!d.localOnly || !hosted) &&
        (!d.requires || d.requires.some((cap) => grants.has(cap))),
    )
    .map((d) => d.id);
}
export function canOpen(
  item: ShellDestination,
  permitted: readonly string[],
  hosted: boolean,
) {
  return (
    !!item.href && item.readiness !== "unavailable" &&
    (item.id === "home" ||
      (item.localOnly ? !hosted : permitted.includes(item.id)))
  );
}
export const preferenceKey = "ppo.shell.r15.preferences";
export function workspacePreference(raw: string | null): WorkspaceId {
  try {
    const value = JSON.parse(raw ?? "null");
    if (
      value?.schema_version === 1 &&
      workspaces.some((w) => w.id === value.workspace)
    )
      return value.workspace;
  } catch {
    /* Invalid preferences have no authority. */
  }
  return "sales";
}
export const departmentRails: Record<WorkspaceId, readonly string[]> = {
  sales: ["pulse", "leads", "deals", "calendar", "tasks", "mail", "contacts", "products", "insights"],
  estimate: ["work", "intake", "wizard", "estimates", "configurations", "pricing", "quotations", "estimate-reviews"],
  engineering: ["work", "engineering", "basis", "drawings", "materials", "changes", "technical-reviews", "commissioning"],
  projects: ["work", "projects", "programme", "readiness", "risks", "variations", "assurance", "acceptance"],
  service: ["work", "tickets", "orders", "planner", "technicians", "packs", "reports", "equipment"],
  supply: ["work", "supply", "purchasing", "inbound", "receiving", "stock", "deliveries", "returns"],
  finance: ["work", "finance", "accounts", "performance", "claims", "cash", "reconciliation", "exceptions"],
};
export const workspaceIcons: Record<WorkspaceId, ProductIconName> = {
  sales: "nav-sales", estimate: "nav-estimates", engineering: "nav-engineering", projects: "nav-projects",
  service: "nav-service", supply: "nav-products", finance: "nav-claims",
};
export function railDestinations(workspace: WorkspaceId, permitted: readonly string[], hosted: boolean) {
  return departmentRails[workspace].map(destination).filter(item => canOpen(item, permitted, hosted));
}
export function railDestinationForLocation(path: string, query: URLSearchParams, workspace: WorkspaceId) {
  if (workspace === "sales") {
    if (matchesPath(path, "/contacts") || matchesPath(path, "/people") ||
        (matchesPath(path, "/customers") && !/^\/customers\/[^/]+\/account$/.test(path))) return "contacts";
    if (/^\/work\/[^/]+$/.test(path) && query.get("salesTask") === "1") return "tasks";
    if (path === "/work/actions" && query.get("activity_type") === "Task" && ["Lead", "Opportunity"].includes(query.get("linked") ?? "")) return "tasks";
  }
  if (workspace === "finance" && /^\/customers\/[^/]+\/account$/.test(path)) return "accounts";
  if (workspace === "engineering") {
    const native = controlPath(path);
    if (native) return native.module === "reviews" ? "technical-reviews" : native.module === "queries" ? "engineering" : native.module;
    if (materialsPath(path)) return "materials";
    if (changesPath(path)) return "changes";
    if (commissioningPath(path)) return "commissioning";
  }
  if (workspace === "estimate" && matchesPath(path, "/estimating/fertigation")) return "configurations";
  if (workspace === "projects" && /^\/projects\/[^/]+$/.test(path) && query.get("view") === "programme") return "programme";
  const current = pageForPath(path)?.id;
  // Shared review pages are More-only, never a false My Work selection.
  return current && departmentRails[workspace].includes(current) ? current : undefined;
}
export function workspaceForLocation(path: string, query: URLSearchParams, preference: WorkspaceId, permitted: readonly string[]): WorkspaceId {
  const owned = pageForPath(path)?.workspace;
  if (owned) return owned;
  const requested = query.get("department");
  const candidate = workspaces.some(w => w.id === requested) ? requested as WorkspaceId : preference;
  if (railDestinations(candidate, permitted, true).length) return candidate;
  return workspaces.find(w => railDestinations(w.id, permitted, true).length)?.id ?? "sales";
}
export function departmentHref(href: string, workspace: WorkspaceId) {
  const url = new URL(href, "http://ppo.local");
  if (url.pathname === "/calendar" && workspace === "sales") url.searchParams.set("scope", "sales");
  if (!pageForPath(url.pathname)?.workspace) url.searchParams.set("department", workspace);
  return url.pathname + url.search + url.hash;
}
export function menuGroups(query: string, workspace: WorkspaceId = "sales") {
  const q = query.trim().toLocaleLowerCase("en-AU").slice(0, 100);
  const groups = [
    { title: "Workspaces", ids: workspaces.map(w => w.primary) },
    { title: "Department pages", ids: [...departmentRails[workspace], ...(workspace === "estimate" ? ["fertigation"] : workspace === "service" ? ["jobs"] : [])] },
    { title: "My workspace", ids: ["home", "work", "mail", "calendar", "approvals"] },
    { title: "Shared records", ids: ["contacts", "people", "customers", "sites", "facilities", "surveys", "equipment", "products", "documents", "reports"] },
    { title: "Administration & support", ids: ["settings", "recovery", "foundation"] },
    ...(q ? [{ title: "Workspace pages", ids: destinations.map(d => d.id) }] : []),
  ];
  const seen = new Set<string>();
  return groups.map(g => ({ title: g.title, items: g.ids.map(destination).filter(d => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return [d.label, d.menuLabel ?? "", g.title, workspaces.find(w => w.id === d.workspace)?.label ?? ""].join(" ").toLocaleLowerCase("en-AU").includes(q);
  }) })).filter(g => g.items.length);
}
