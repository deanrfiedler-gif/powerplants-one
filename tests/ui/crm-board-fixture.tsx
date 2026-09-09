import { createRoot } from "react-dom/client";
import { BusinessSession } from "../../src/components/business-session";
import {
  ProductHeader,
  ProductNavigation,
} from "../../src/components/product-navigation";
import { SalesWorklist } from "../../src/components/crm-worklist";
import type { WorklistItem } from "../../src/crm/worklist";
const CRM = {
  workspace: "10000000-0000-4000-8000-000000000001",
  company: "20000000-0000-4000-8000-000000000001",
  owner: "30000000-0000-4000-8000-000000000001",
  org: "50000000-0000-4000-8000-000000000001",
  site: "70000000-0000-4000-8000-000000000001",
  person: "60000000-0000-4000-8000-000000000001",
};

// Component-only fixture. No database, Microsoft login or external requests.
// Keep the real React components/CSS; replace only framework navigation and API.
const titles = [
  "Glasshouse climate control upgrade",
  "Propagation bench irrigation",
  "Automated fertigation system",
  "Growing-room lighting",
  "Water recycling upgrade",
  "Climate sensor network",
  "Research compartment controls",
  "Environmental data gateway",
];
const organisations = [
  "Fernbank Growers",
  "Cedar Vale Nursery",
  "Creekside Horticulture",
  "Banksia Seedlings",
];
const records: WorklistItem[] = titles.map((title, i) => ({
  id: `c2000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  display_number: `SYN-OP-${i + 1}`,
  title,
  stage_id: i % 2 ? "Qualified" : "Enquiry",
  close_outcome: "Open",
  stage_entered_at: "2026-09-09T00:00:00Z",
  updated_at: "2026-09-09T00:00:00Z",
  version: 1,
  company_id: CRM.company,
  company_name: "SYN Review company",
  organisation_name: organisations[i % 4],
  site_id: CRM.site,
  site_name: "SYN Demonstration glasshouse",
  owner_id: CRM.owner,
  owner_name: "SYN Alex Lee",
  primary_person_id: CRM.person,
  contact_name: i % 2 ? "Jamie Rivers" : "Cameron Brooks",
  next_action_state: i === 2 ? "Overdue" : i === 3 ? "Needed" : "Upcoming",
  next_action_id: `d2000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  next_action_summary: [
    "Confirm the existing controller",
    "Arrange a site discussion",
    "Review water analysis",
    "Schedule an activity",
  ][i % 4],
  action_owner_id: CRM.owner,
  action_owner_name: "SYN Alex Lee",
  due_at: "2026-09-09T06:00:00Z",
  due_needed: false,
  value_amount: i === 1 ? null : i === 2 ? "127500.50" : "68500.00",
  expected_close_date: "2026-10-30",
  can_edit: true,
}));
const envelope = (items: unknown[]) => ({
  items,
  next_cursor: null,
  observed_at: "2026-09-09T00:00:00Z",
  completeness: "Complete",
});
// Revoked access stays revoked when the worklist clears its search filters.
let accessDenied = false;
window.fetch = async (input) => {
  const url = new URL(String(input), "http://fixture.invalid");
  let data: unknown;
  if (url.pathname.endsWith("/local-session"))
    data = {
      actor_id: CRM.owner,
      workspace_id: CRM.workspace,
      display_name: "SYN Demo tester with a long display name",
    };
  else if (url.pathname.includes("worklist-options")) data = envelope([]);
  else if (url.pathname.endsWith("/crm/opportunities")) {
    const search = (url.searchParams.get("q") ?? "").toLowerCase();
    if (search === "denied") accessDenied = true;
    if (accessDenied)
      return new Response(
        JSON.stringify({
          code: "PermissionDenied",
          message: "This identity cannot read opportunities.",
        }),
        { status: 403 },
      );
    let items = records.filter(
      (r) =>
        r.title.toLowerCase().includes(search) &&
        (!url.searchParams.get("stage_id") ||
          r.stage_id === url.searchParams.get("stage_id")),
    );
    if (url.searchParams.get("sort") === "Title")
      items = items.toSorted((a, b) => a.title.localeCompare(b.title));
    data = {
      ...envelope(items),
      window: {
        as_of: "2026-09-09T00:00:00Z",
        first_page: true,
        has_more: false,
        count_basis: "ReturnedPage",
      },
      stages: ["Enquiry", "Qualified"].map((stage_id, i) => ({
        stage_id,
        ordinal: i + 1,
        count: items.filter((r) => r.stage_id === stage_id).length,
      })),
      sort: url.searchParams.get("sort") ?? "Reference",
      can_create: true,
    };
  } else {
    const record = records.find((r) => url.pathname.endsWith(r.id));
    if (!record)
      return new Response(
        JSON.stringify({
          error: {
            message: "This component fixture does not provide that API.",
          },
        }),
        { status: 404 },
      );
    data = envelope([
      {
        ...record,
        organisation_id: CRM.org,
        need_summary: "Synthetic controls upgrade for visual review.",
        next_activity: {
          id: record.next_action_id,
          summary: record.next_action_summary,
          owner_name: record.action_owner_name,
          due_at: record.due_at,
        },
      },
    ]);
  }
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};
createRoot(document.getElementById("root")!).render(
  <div className="app-frame">
    <ProductNavigation />
    <div className="workspace">
      <ProductHeader />
      <main id="main">
        <BusinessSession
          hosted={new URLSearchParams(location.search).get("mode") !== "local"}
        >
          <SalesWorklist />
        </BusinessSession>
      </main>
    </div>
  </div>,
);
