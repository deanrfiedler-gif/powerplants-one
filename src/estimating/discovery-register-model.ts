// ES-02 D1–D7: presentation of saved evidence, never a costing or approval rule.
export type RegisterCost =
  | { status: "NoEstimate" }
  | { status: "Unavailable" }
  | {
      status: "Available";
      estimate_id: string;
      version_id: string;
      version: number;
      revision_id: string | null;
      revision: number | null;
      latest_costed: boolean;
      amount: string | null;
    };
export type RegisterOption = {
  id: string;
  label: string;
  ordinal: number;
  state: "Active" | "Archived";
  revision_id: string;
  revision: number;
  kind: "Discovery" | "LegacyManual";
  scope_readiness: "NotRecorded" | "Incomplete" | "Complete";
};
export type DiscoveryRegisterRow = {
  id: string;
  version: number;
  opportunity_id: string;
  company_id: string;
  title: string;
  display_number: string;
  selected_option_id: string;
  customer: { id: string; name: string };
  owner: { id: string; name: string };
  updated_at: string;
  options: RegisterOption[];
  cost: RegisterCost;
};
export type DiscoveryRegisterData = {
  items: DiscoveryRegisterRow[];
  limit: number;
  synthetic: boolean;
  as_at: string;
  can_create: boolean;
};
export const discoveryViews = [
  { id: "All", label: "All workspaces", group: "" },
  { id: "Mine", label: "My workspaces", group: "" },
  { id: "NotRecorded", label: "Not recorded", group: "Readiness" },
  { id: "Incomplete", label: "Incomplete", group: "Readiness" },
  { id: "Complete", label: "Complete", group: "Readiness" },
  { id: "LegacyManual", label: "Legacy manual basis", group: "Readiness" },
  { id: "Ready", label: "Ready for costing", group: "Costing" },
  { id: "NotCosted", label: "Latest not costed", group: "Costing" },
  { id: "Alternatives", label: "With alternatives", group: "Options" },
] as const;
export type DiscoveryView = (typeof discoveryViews)[number]["id"];
export const selectedOption = (row: DiscoveryRegisterRow) =>
  row.options.find((o) => o.id === row.selected_option_id)!;
export const revisionLabel = (n: number) => `r${String(n).padStart(2, "0")}`;
export const optionLetter = (n: number) => String.fromCharCode(64 + n);
export const readiness = (o: RegisterOption) =>
  o.kind === "LegacyManual"
    ? "Legacy manual"
    : o.scope_readiness === "NotRecorded"
      ? "Not recorded"
      : o.scope_readiness;
export function matchesDiscoveryView(
  row: DiscoveryRegisterRow,
  view: DiscoveryView,
  actor: string,
) {
  const option = selectedOption(row),
    cost = row.cost;
  switch (view) {
    case "Mine":
      return row.owner.id === actor;
    case "LegacyManual":
      return option.kind === "LegacyManual";
    case "NotRecorded":
    case "Incomplete":
    case "Complete":
      return option.kind !== "LegacyManual" && option.scope_readiness === view;
    case "Ready":
      return (
        option.kind === "Discovery" &&
        option.scope_readiness === "Complete" &&
        (cost.status === "NoEstimate" ||
          (cost.status === "Available" && !cost.latest_costed))
      );
    case "NotCosted":
      return (
        cost.status === "Available" &&
        cost.revision !== null &&
        cost.revision < option.revision &&
        !cost.latest_costed
      );
    case "Alternatives":
      return row.options.length > 1; // archived alternatives remain alternatives
    default:
      return true;
  }
}
export function costLabel(row: DiscoveryRegisterRow) {
  const o = selectedOption(row),
    c = row.cost;
  if (c.status === "Unavailable") return "Cost basis unavailable";
  if (c.status === "NoEstimate")
    return o.kind === "LegacyManual"
      ? "Manual · not estimated"
      : o.scope_readiness === "Complete"
        ? "Ready for costing"
        : `Not ready · ${readiness(o).toLowerCase()}`;
  const basis = `v${c.version} on ${c.revision === null ? "manual basis" : revisionLabel(c.revision)}`;
  return `${basis} · ${c.revision_id === o.revision_id ? "current" : c.latest_costed ? `${revisionLabel(o.revision)} costed separately` : `${revisionLabel(o.revision)} ${o.scope_readiness === "Complete" ? "ready to cost" : "not costed"}`}`;
}

export function phoneCostLabel(row: DiscoveryRegisterRow) {
  const option = selectedOption(row), cost = row.cost;
  if (cost.status === "Unavailable") return "cost basis unavailable";
  if (cost.status === "NoEstimate") return option.kind === "LegacyManual" ? "not estimated" : "not ready for costing";
  const basis = `v${cost.version} on ${cost.revision === null ? "manual basis" : revisionLabel(cost.revision)}`;
  if (cost.revision_id === option.revision_id) return `estimate ${basis}, current`;
  if (cost.latest_costed) return `${revisionLabel(option.revision)} costed separately (${basis})`;
  return option.scope_readiness === "Complete" ? `ready for costing (${basis})` : `${revisionLabel(option.revision)} not costed (${basis})`;
}
