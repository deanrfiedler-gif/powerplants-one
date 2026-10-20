export const peopleViews = [
  "Active",
  "SiteContacts",
  "Channels",
  "Inactive",
] as const;
export type PeopleView = (typeof peopleViews)[number];
export const peopleViewLabels: Record<PeopleView, string> = {
  Active: "Active people",
  SiteContacts: "Site contacts",
  Channels: "Channels to review",
  Inactive: "Inactive",
};
export const peopleSorts = ["name", "email", "phone", "status"] as const;
export type PeopleRegisterRow = {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  contact_preference: string | null;
  active: boolean;
  organisations: { id: string; name: string; role: string }[];
  sites: { id: string; name: string }[];
  notice_exceptions: number;
  notices_restricted: boolean;
  history_restricted: boolean;
  last_correction: string | null;
};
export type PeopleRegisterData = {
  items: PeopleRegisterRow[];
  total: number;
  counts: Record<PeopleView, number>;
  organisations: { id: string; label: string }[];
  next_cursor: string | null;
  observed_at: string;
};
export function peopleStatusLine(row: PeopleRegisterRow) {
  const notice = row.notice_exceptions
    ? `${row.notice_exceptions} notice preference${row.notice_exceptions === 1 ? "" : "s"}: do not notify`
    : "";
  if (!row.email) return "Email not recorded";
  if (!row.phone) return "Phone not recorded";
  if (row.sites.length)
    return `Primary contact at ${row.sites.length === 1 ? row.sites[0].name : `${row.sites.length} sites`}${notice ? ` · ${row.notice_exceptions} do not notify` : ""}`;
  return (
    notice ||
    (row.notices_restricted
      ? "Notice preferences restricted"
      : "No site contact roles")
  );
}
