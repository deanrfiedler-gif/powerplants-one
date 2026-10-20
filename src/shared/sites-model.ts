export const siteViews = {
  All: "All sites",
  Readiness: "Readiness to confirm",
  Biosecurity: "Biosecurity unknown",
  Address: "Address to review",
} as const;
export type SiteView = keyof typeof siteViews;
export const siteSorts = [
  "name",
  "location",
  "areas",
  "equipment",
  "next_visit",
  "reference",
] as const;
export type SiteVisit = {
  id: string;
  display_number: string;
  start_at: string;
  end_at: string;
  status: string;
};
export type SiteRow = {
  id: string;
  company_id: string;
  version: number;
  display_name: string;
  display_number: string;
  legacy_display_number: string;
  location_description: string | null;
  address: string | null;
  timezone: string;
  access_instructions: string | null;
  biosecurity_notes: string | null;
  address_recorded: boolean;
  biosecurity_recorded: boolean;
  customers: { id: string; name: string; role: string }[];
  primary_contact: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  areas: number;
  equipment: number;
  next_visit: SiteVisit | null;
  last_visit: SiteVisit | null;
  visits_state: "Available" | "Restricted";
  readiness:
    | "Check in CS-06"
    | "No upcoming permitted visit"
    | "Visit access restricted";
  can_edit: boolean;
  can_request: boolean;
  can_follow_up: boolean;
};
export type SitesData = {
  items: SiteRow[];
  total: number;
  counts: Record<SiteView, number>;
  customers: { id: string; label: string }[];
  observed_at: string;
  next_cursor: string | null;
};
export type SiteWork = {
  id: string;
  reference: string;
  title: string;
  detail: string;
  href: string;
  kind: "Visit" | "Work order" | "Follow-up" | "Survey";
};
export type SiteWorkSource = {
  name: string;
  state: "Available" | "Partial" | "Restricted" | "Unavailable";
  items: SiteWork[];
};
