import { choice, invalid, object, uuid } from "../shared/validation";
export const viewTargets = {
  search: { label: "Search", fields: ["q", "kind"] },
  reviews: {
    label: "Reviews & handovers",
    fields: ["view", "q", "module", "kind", "owner_id"],
  },
  updates: {
    label: "Notifications",
    fields: ["view", "q", "state", "archived"],
  },
} as const;
export const workViewRegistry = {
  overview: "/work",
  actions: "/work/actions",
  team: "/work/team",
} as const;
export type ViewTarget = keyof typeof viewTargets;
export type SavedView = {
  id: string;
  name: string;
  target: ViewTarget;
  schema_version: 1;
  scope: "personal";
  pinned: boolean;
  criteria: Record<string, string>;
};
export const teamSharing = {
  state: "not_configured",
  reason:
    "Team sharing is not configured: AD-01 has no canonical Team identity or current-membership service.",
} as const;
export function parseViewCriteria(target: ViewTarget, input: unknown) {
  const b = object(input, [...viewTargets[target].fields]);
  for (const [key, value] of Object.entries(b))
    if (
      typeof value !== "string" ||
      value.length > 200 ||
      /[\u0000-\u001f\u007f]/.test(value)
    )
      invalid(key, "Use a supported filter value.");
  if (target === "reviews") {
    if (b.view)
      choice(b.view, "view", [
        "mine",
        "all",
        "returned",
        "handovers",
        "sent",
        "history",
      ]);
    if (b.module)
      choice(b.module, "module", ["Service", "Finance", "Engineering"]);
    if (b.kind) choice(b.kind, "kind", ["Review", "Handover"]);
    if (b.owner_id) uuid(b.owner_id, "owner_id");
  }
  if (target === "updates") {
    if (b.view)
      choice(b.view, "view", ["Inbox", "Grouped changes", "Owned escalations"]);
    if (b.state) choice(b.state, "state", ["All", "Read", "Unread"]);
    if (b.archived) choice(b.archived, "archived", ["true", "false"]);
  }
  if (target === "search" && b.kind)
    choice(b.kind, "kind", [
      "Issued job pack",
      "Engineering package",
      "Lead",
      "Project",
      "Deal",
      "Customer",
      "Contact",
      "Site",
      "Equipment",
      "Activity",
      "Service request",
      "Facility / growing area",
    ]);
  return Object.fromEntries(
    Object.entries(b).filter(([, v]) => v !== ""),
  ) as Record<string, string>;
}
export function parseSavedView(input: unknown): SavedView {
  const b = object(input, [
    "id",
    "name",
    "target",
    "schema_version",
    "scope",
    "pinned",
    "criteria",
  ]);
  if (b.schema_version !== 1)
    invalid(
      "schema_version",
      "This saved view uses unavailable criteria. Retire it or recreate it from current filters.",
    );
  if (b.scope !== "personal") invalid("scope", teamSharing.reason);
  if (typeof b.name !== "string" || !b.name.trim() || b.name.length > 60)
    invalid("name", "Use a name of 1–60 characters.");
  if (typeof b.pinned !== "boolean")
    invalid("pinned", "Choose pinned or unpinned.");
  const target = choice(
    b.target,
    "target",
    Object.keys(viewTargets) as ViewTarget[],
  );
  return {
    id: uuid(b.id, "id"),
    name: b.name.trim(),
    target,
    schema_version: 1,
    scope: "personal",
    pinned: b.pinned,
    criteria: parseViewCriteria(target, b.criteria),
  };
}
export function sameViewCriteria(
  a: Record<string, string>,
  b: Record<string, string>,
) {
  return (
    JSON.stringify(
      Object.entries(a)
        .filter(([, v]) => v)
        .sort(),
    ) ===
    JSON.stringify(
      Object.entries(b)
        .filter(([, v]) => v)
        .sort(),
    )
  );
}
