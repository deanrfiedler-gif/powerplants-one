import type { countLeads } from "../crm/leads/register";
import type { ProductIconName } from "./product-icons";
import type { LeadsIconName } from "./leads-workspace";

// The Leads secondary menu drawn on the accepted Figma Leads page (190:20237, side menu 190:20519;
// docs/decisions/leads-design.md L1/L2). Every view is an existing read of GET /api/v1/crm/leads and
// its count is the same-named key of GET /api/v1/crm/leads/counts (docs/decisions/lead-register-backend.md).
// Nothing here defines a rule: Overdue and Next action needed are the backend's follow-up predicates.
export type LeadCounts = Awaited<ReturnType<typeof countLeads>>;
type CountKey = Exclude<keyof LeadCounts["counts"], "FollowUpUnavailable">;
// The URL parameters the menu owns. The toolbar's search, owner, source and sort stay as they are.
const menuParams = ["view", "status", "follow_up"] as const;
type MenuParam = (typeof menuParams)[number];

export type LeadMenuView = {
  id: string;
  label: string;
  group: "Status" | "Follow-up" | "Other views" | null;
  icon: { product: ProductIconName } | { lead: LeadsIconName };
  count: CountKey;
  params: Partial<Record<MenuParam, string>>;
  // The lifecycle the list reads, which decides the row menu (restore, reopen or convert).
  lifecycle: "Active" | "Archived" | "Disqualified" | "Converted";
  empty: string;
};

export const leadMenuViews: readonly LeadMenuView[] = [
  { id: "inbox", label: "Inbox", group: null, icon: { product: "inbox" }, count: "Active", params: {}, lifecycle: "Active", empty: "No active leads" },
  { id: "mine", label: "My leads", group: null, icon: { product: "person" }, count: "MyLeads", params: { view: "MyLeads" }, lifecycle: "Active", empty: "You own no active leads" },
  { id: "new", label: "New", group: "Status", icon: { product: "bell" }, count: "New", params: { status: "New" }, lifecycle: "Active", empty: "No new leads" },
  { id: "contacting", label: "Contacting", group: "Status", icon: { product: "mail" }, count: "Contacting", params: { status: "Contacting" }, lifecycle: "Active", empty: "No leads in Contacting" },
  { id: "nurturing", label: "Nurturing", group: "Status", icon: { lead: "seedling" }, count: "Nurturing", params: { status: "Nurturing" }, lifecycle: "Active", empty: "No leads in Nurturing" },
  { id: "overdue", label: "Overdue", group: "Follow-up", icon: { lead: "calendar-alert" }, count: "Overdue", params: { follow_up: "Overdue" }, lifecycle: "Active", empty: "No overdue leads" },
  { id: "next-action", label: "Next action needed", group: "Follow-up", icon: { lead: "calendar" }, count: "NextActionNeeded", params: { follow_up: "NextActionNeeded" }, lifecycle: "Active", empty: "No leads need a next action" },
  { id: "archived", label: "Archived", group: "Other views", icon: { product: "archive" }, count: "Archived", params: { view: "Archived" }, lifecycle: "Archived", empty: "No archived leads" },
  { id: "disqualified", label: "Disqualified", group: "Other views", icon: { product: "disqualified" }, count: "Disqualified", params: { view: "Disqualified" }, lifecycle: "Disqualified", empty: "No disqualified leads" },
  { id: "converted", label: "Converted", group: "Other views", icon: { product: "converted" }, count: "Converted", params: { view: "Converted" }, lifecycle: "Converted", empty: "No converted leads" },
];

// The view a URL shows. A lifecycle or My leads view is named by `view`; within the Inbox a follow-up
// filter outranks a status, because the list applies both and Follow-up is the narrower question.
// An address the menu did not write (e.g. an older status link) still lands on the view it reads.
export function currentLeadView(params: { get(name: string): string | null }): LeadMenuView {
  const view = params.get("view"),
    followUp = params.get("follow_up"),
    status = params.get("status");
  const by = (test: (v: LeadMenuView) => boolean) => leadMenuViews.find(test);
  if (view && view !== "Active") return by((v) => v.params.view === view) ?? leadMenuViews[0];
  return by((v) => !!followUp && v.params.follow_up === followUp) ?? by((v) => !!status && v.params.status === status) ?? leadMenuViews[0];
}

// The address of a view: the menu's own parameters are replaced, the toolbar's are kept, and the page
// cursor is dropped because a cursor is signed to the filters that produced it.
export function leadViewQuery(view: LeadMenuView, query: string) {
  const next = new URLSearchParams(query);
  for (const key of [...menuParams, "cursor"]) next.delete(key);
  for (const [key, value] of Object.entries(view.params)) next.set(key, value);
  return next.toString();
}

// The counts read takes the toolbar's filters only. The menu's own status is never sent, or every
// other status count would read zero while one status is open.
export function leadCountQuery(params: { get(name: string): string | null }) {
  const next = new URLSearchParams();
  for (const key of ["q", "source", "owner_id"]) {
    const value = params.get(key);
    if (value) next.set(key, value);
  }
  return next.toString();
}

// What a view's count says. Unavailable is not zero: no count is shown until the read answers. Leads
// whose saved next activity the reader cannot see are left out of both follow-up views by the backend,
// so those two counts are lower bounds and say so.
export function leadViewCount(view: LeadMenuView, counts: LeadCounts | null) {
  if (!counts) return null;
  const n = counts.counts[view.count],
    hidden = counts.counts.FollowUpUnavailable;
  const partial = view.group === "Follow-up" && counts.follow_up_completeness === "Partial";
  const noun = n === 1 ? "lead" : "leads";
  return {
    text: `${n}${partial ? "+" : ""}`,
    label: partial
      ? `At least ${n} ${noun}; ${hidden} ${hidden === 1 ? "lead has a next activity" : "leads have next activities"} you cannot see`
      : `${n} ${noun}`,
  };
}
