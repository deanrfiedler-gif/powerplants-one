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
  href?: string;
  workspace?: WorkspaceId;
  requires?: Capability[];
  localOnly?: boolean;
};
export const destinations: ShellDestination[] = [
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
    href: "/crm/opportunities",
    workspace: "sales",
    requires: ["crm.opportunity.read"],
  },
  {
    id: "leads",
    label: "Leads",
    icon: "leads",
    href: "/crm/leads",
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
    icon: "supply",
    href: "/equipment",
    requires: ["shared.read"],
  },
  { id: "products", label: "Products", icon: "products" },
  { id: "documents", label: "Documents", icon: "documents" },
  {
    id: "reports",
    label: "Service reports",
    icon: "list",
    href: "/service/reports",
    workspace: "service",
    requires: ["report.read"],
  },
  {
    id: "recovery",
    label: "Exceptions & recovery",
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
    id: "settings",
    label: "Foundation checks",
    icon: "settings",
    href: "/foundation",
    localOnly: true,
  },
];
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
      ids: [
        "deals",
        "leads",
        "estimates",
        "intake",
        "engineering",
        "projects",
        "tickets",
        "planner",
        "technicians",
        "orders",
        "packs",
        "jobs",
        "supply",
        "finance",
      ],
    },
    { title: "My workspace", ids: ["home", "work", "mail", "calendar"] },
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
  return groups
    .map((g) => ({
      title: g.title,
      items: g.ids
        .map(destination)
        .filter((d) =>
          [
            d.label,
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
