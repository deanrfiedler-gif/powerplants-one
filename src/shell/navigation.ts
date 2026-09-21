import type { Capability } from "../platform/permissions";
import type { ProductIconName } from "../components/product-icons";

export const workspaces = [
  { id: "sales", label: "Sales", primary: "deals", secondary: "leads" },
  {
    id: "estimate",
    label: "Estimating & quotation",
    primary: "estimates",
    secondary: "intake",
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
};
export const destinations: ShellDestination[] = [
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "home", label: "Home", icon: "home", href: "/" },
  {
    id: "work",
    label: "My Work",
    icon: "work",
    href: "/work",
    requires: ["activity.read"],
  },
  {
    id: "mail",
    label: "Email & Calendar",
    icon: "mail",
    href: "/email",
    requires: ["email.read"],
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: "calendar",
    href: "/calendar",
    requires: ["activity.read"],
  },
  {
    id: "deals",
    label: "Deals",
    icon: "deals",
    href: "/sales/opportunities",
    workspace: "sales",
    requires: ["crm.opportunity.read"],
  },
  {
    id: "leads",
    label: "Leads",
    icon: "leads",
    href: "/sales/leads",
    workspace: "sales",
    requires: ["crm.lead.read"],
  },
  {
    id: "estimates",
    label: "Estimates",
    icon: "estimate",
    href: "/estimating",
    workspace: "estimate",
    requires: ["estimating.read"],
  },
  {
    id: "intake",
    label: "Discovery",
    icon: "work",
    href: "/estimating/discovery",
    workspace: "estimate",
    requires: ["estimating.read"],
  },
  {
    id: "engineering",
    label: "Engineering",
    icon: "engineering",
    href: "/engineering",
    workspace: "engineering",
    requires: ["engineering.read"],
  },
  {
    id: "drawings",
    label: "Drawings",
    icon: "documents",
    workspace: "engineering",
  },
  {
    id: "projects",
    label: "Projects",
    icon: "projects",
    href: "/projects",
    workspace: "projects",
    requires: ["project.read"],
  },
  {
    id: "programme",
    label: "Programme",
    icon: "calendar",
    workspace: "projects",
  },
  {
    id: "tickets",
    label: "Service requests",
    icon: "service",
    href: "/service/tickets",
    workspace: "service",
    requires: ["service.ticket.read"],
  },
  {
    id: "planner",
    label: "Service planner",
    icon: "calendar",
    href: "/schedule",
    workspace: "service",
    requires: ["schedule.read"],
  },
  {
    id: "technicians",
    label: "Field technicians",
    icon: "person",
    href: "/service/technicians",
    workspace: "service",
    requires: ["schedule.read"],
  },
  {
    id: "orders",
    label: "Work orders",
    icon: "work",
    href: "/service/work-orders",
    workspace: "service",
    requires: ["service.work_order.read"],
  },
  {
    id: "packs",
    label: "Job packs",
    icon: "documents",
    href: "/service/packs",
    workspace: "service",
    requires: ["pack.read"],
  },
  {
    id: "jobs",
    label: "My Jobs",
    icon: "service",
    href: "/my-jobs",
    workspace: "service",
    requires: ["field.read.own"],
  },
  { id: "supply", label: "Supply chain", icon: "supply", workspace: "supply" },
  {
    id: "deliveries",
    label: "Deliveries",
    icon: "supply",
    workspace: "supply",
  },
  {
    id: "finance",
    label: "Finance",
    icon: "finance",
    href: "/finance/handoffs",
    workspace: "finance",
    requires: ["finance.read"],
  },
  { id: "accounts", label: "Accounts", icon: "finance", workspace: "finance" },
  {
    id: "customers",
    label: "Customers",
    icon: "customers",
    href: "/customers",
    requires: ["shared.read"],
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: "person",
    href: "/people",
    requires: ["shared.read"],
  },
  {
    id: "sites",
    label: "Sites",
    icon: "sites",
    href: "/sites",
    requires: ["shared.read"],
  },
  {
    id: "equipment",
    label: "Equipment",
    icon: "engineering",
    href: "/equipment",
    requires: ["shared.read"],
  },
  { id: "products", label: "Products", icon: "products" },
  { id: "documents", label: "Documents", icon: "documents" },
  {
    id: "reports",
    label: "Service reports",
    menuLabel: "Reports",
    tabLabel: "Service review",
    icon: "list",
    href: "/service/reports",
    workspace: "service",
    requires: ["report.read"],
  },
  {
    id: "recovery",
    label: "Exceptions and recovery",
    icon: "warning",
    href: "/admin",
    requires: [
      "shared.read",
      "finance.read",
      "service.work_order.read",
      "field.read.own",
    ],
  },
  {
    id: "foundation",
    label: "Foundation checks",
    icon: "settings",
    href: "/foundation",
    localOnly: true,
  },
];
// The My Work secondary menu. Order and labels follow design report r03; the routes are the
// only authority for what each view shows, and every read keeps its own permission checks.
export const workViews = [
  { id: "overview", label: "Overview", href: "/work", icon: "overview" },
  { id: "actions", label: "My actions", href: "/work/actions", icon: "list" },
  { id: "reviews", label: "Reviews & handovers", href: "/work/reviews", icon: "contacts" },
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
  { id: "deals", label: "Opportunities", icon: "bar-opportunities" },
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
        d.href &&
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
    !!item.href &&
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
export function menuGroups(query: string) {
  const q = query.trim().toLocaleLowerCase("en-AU").slice(0, 100);
  const groups = [
    {
      title: "Workspaces",
      ids: workspaces.map((w) => w.primary),
    },
    { title: "My workspace", ids: ["home", "work", "mail"] },
    {
      title: "Shared records",
      ids: [
        "customers",
        "contacts",
        "sites",
        "equipment",
        "products",
        "documents",
        "reports",
      ],
    },
    { title: "Administration & support", ids: ["settings", "recovery"] },
  ];
  // The resting menu matches r17's seven domain entries. Search also discovers
  // retained child routes; desktop module tabs keep them reachable without search.
  if (q) groups.push({ title: "Workspace pages", ids: ["leads", "intake", "planner", "technicians", "orders", "packs", "jobs", "calendar", "foundation"] });
  return groups
    .map((g) => ({
      title: g.title,
      items: g.ids
        .map(destination)
        .filter((d) =>
          [
            d.label,
            d.menuLabel ?? "",
            g.title,
            workspaces.find((w) => w.id === d.workspace)?.label ?? "",
          ]
            .join(" ")
            .toLocaleLowerCase("en-AU")
            .includes(q),
        ),
    }))
    .filter((g) => g.items.length);
}
