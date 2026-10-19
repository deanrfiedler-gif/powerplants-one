export const organisationViews = [
  "All",
  "Prospects",
  "Duplicates",
  "NoSite",
  "Inactive",
] as const;
export const organisationSorts = [
  "name",
  "status",
  "owner",
  "sites",
  "deals",
  "follow_up",
  "sector",
  "areas",
  "reference",
] as const;
export type OrganisationView = (typeof organisationViews)[number];
export type OrganisationSort = (typeof organisationSorts)[number];
export type OrganisationRegisterRow = {
  id: string;
  company_id: string;
  display_name: string;
  display_number: string;
  status: string;
  sector: string | null;
  owner_id: string | null;
  owner_name: string | null;
  sites: number;
  areas: number;
  deals: number | null;
  possible_duplicate: boolean;
  follow_up_state: "Available" | "Restricted";
  next_follow_up: {
    id: string;
    summary: string;
    due_at: string | null;
    due_needed: boolean;
  } | null;
};
export type OrganisationRegisterData = {
  items: OrganisationRegisterRow[];
  total: number;
  counts: Record<OrganisationView, number>;
  owners: { id: string; label: string }[];
  next_cursor: string | null;
  observed_at: string;
};

/** Return only to this register; a query string must never become an arbitrary destination. */
export function organisationReturn(value: string | null) {
  if (!value) return "/customers";
  const query = new URLSearchParams(value);
  const allowed = new Set([
    "q",
    "view",
    "status",
    "owner",
    "mine",
    "sort",
    "direction",
    "limit",
    "department",
    "columns",
  ]);
  for (const key of [...query.keys()]) if (!allowed.has(key)) query.delete(key);
  return `/customers${query.size ? `?${query}` : ""}`;
}
