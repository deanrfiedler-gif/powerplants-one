export const identityViews = ["all", "active", "inactive", "hosted"] as const;
export type IdentityView = (typeof identityViews)[number];
export const identityViewLabels: Record<IdentityView, string> = {
  all: "All identities",
  active: "Active",
  inactive: "Inactive",
  hosted: "Hosted (masked)",
};
export type IdentityRegisterRow = {
  id: string;
  display_name: string;
  active: boolean;
  masked: boolean;
  grant_count: number;
  current_count: number;
  scheduled_count: number;
  expired_count: number;
  workspace_scope: boolean;
  company_keys: string[];
  site_count: number;
  teams: string[];
  submitted_count: number;
  approved_count: number;
  next_scheduled_at: string | null;
  last_changed_at: string | null;
};
export type IdentityRegisterData = {
  items: IdentityRegisterRow[];
  total: number;
  offset: number;
  has_more: boolean;
  observed_at: string;
  local_details_available: boolean;
  counts: Record<IdentityView, number>;
  companies: { id: string; display_name: string; erp_company_id: string }[];
};
export function identityScope(row: IdentityRegisterRow) {
  return (
    [
      row.workspace_scope ? "Workspace" : "",
      ...row.company_keys,
      row.site_count
        ? `${row.site_count} ${row.site_count === 1 ? "site" : "sites"}`
        : "",
    ]
      .filter(Boolean)
      .join(" · ") || "No recorded scope"
  );
}
export function identityStatus(row: IdentityRegisterRow) {
  if (!row.active) return "Inactive identity · grants do not permit access";
  const attention = [
    row.expired_count ? `${row.expired_count} expired` : "",
    row.scheduled_count ? `${row.scheduled_count} scheduled` : "",
    row.approved_count ? `${row.approved_count} approved, not applied` : "",
    row.submitted_count ? `${row.submitted_count} awaiting review` : "",
  ].filter(Boolean);
  return attention.length
    ? attention.join(" · ")
    : `${row.current_count} current grants${row.masked ? " · session not evaluated" : ""}`;
}
