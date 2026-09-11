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

// Component-only fixture for the accepted five-stage pipeline. No database,
// Microsoft login or external requests. Keep the real React components/CSS;
// replace only framework navigation and API.
//
// The stage identifiers below are PRESENTATION ONLY. WorklistItem.stage_id is
// deliberately typed "Enquiry" | "Qualified" because that is what the database
// and the read contract actually supply. This fixture widens the field locally
// rather than relaxing the domain type, so the contract stays honest while the
// accepted layout can be reviewed. See docs/decisions/crm-pipeline-stage-model.md.
type ReviewItem = Omit<WorklistItem, "stage_id"> & { stage_id: string };
const STAGES = ["Discovery", "Scoping", "Quoting", "Negotiation", "Closing"];

type Seed = [string, string, string, string | null, string, string, WorklistItem["next_action_state"], string];
// title, organisation, stage, value, expected close, contact, action state, next action
const seeds: Seed[] = [
  ["Glasshouse climate control upgrade", "Fernbank Growers", "Discovery", "68500.00", "2026-10-30", "Jamie Rivers", "Upcoming", "Confirm the existing controller"],
  ["Propagation bench irrigation", "Cedar Vale Nursery", "Discovery", null, "2026-11-13", "Morgan Avery", "Upcoming", "Arrange a site discussion"],
  ["Substrate monitoring trial", "Greenhaven Research", "Discovery", "14600.00", "2026-10-16", "Drew Linden", "Needed", "Plan the next activity"],
  ["Replacement circulation fans", "Silverleaf Produce", "Discovery", "8200.00", "2026-09-25", "Robin Ellis", "Upcoming", "Confirm quantities and dimensions"],
  ["Automated fertigation system", "Fernbank Growers", "Scoping", "127500.50", "2026-11-27", "Jamie Rivers", "Overdue", "Review water analysis"],
  ["Growing-room lighting", "Banksia Seedlings", "Scoping", "48300.00", "2026-10-23", "Sasha Wells", "Upcoming", "Confirm crop and lighting hours"],
  ["Screen drive replacement", "Cedar Vale Nursery", "Scoping", null, "2026-10-09", "Morgan Avery", "DueNeeded", "Confirm drive specifications"],
  ["Water recycling upgrade", "Creekside Horticulture", "Quoting", "184000.00", "2026-12-11", "Cameron Brooks", "Upcoming", "Review the scope with engineering"],
  ["Seedling handling conveyor", "Banksia Seedlings", "Quoting", "92500.00", "2026-11-20", "Sasha Wells", "Upcoming", "Check the equipment schedule"],
  ["Nutrient dosing extension", "Silverleaf Produce", "Quoting", "36750.00", "2026-10-09", "Robin Ellis", "Overdue", "Confirm pump duty"],
  ["Climate sensor network", "Greenhaven Research", "Quoting", "28400.00", "2026-09-30", "Drew Linden", "Upcoming", "Follow up the draft quotation"],
  ["Glasshouse heating controls", "Hillcrest Demonstration", "Quoting", "76300.00", "2026-10-16", "Taylor Aspen", "Upcoming", "Answer the scope questions"],
  ["Irrigation filtration package", "Creekside Horticulture", "Quoting", "45200.00", "2026-10-02", "Cameron Brooks", "Upcoming", "Arrange the quotation review"],
  ["Research compartment controls", "Greenhaven Research", "Negotiation", "218000.00", "2026-10-30", "Drew Linden", "Upcoming", "Review the delivery programme"],
  ["Fertigation pump-set upgrade", "Fernbank Growers", "Negotiation", "53900.00", "2026-09-25", "Jamie Rivers", "Overdue", "Confirm the revised scope"],
  ["Propagation climate expansion", "Cedar Vale Nursery", "Negotiation", "134500.00", "2026-11-06", "Morgan Avery", "Upcoming", "Discuss the proposed installation"],
  ["Environmental data gateway", "Hillcrest Demonstration", "Closing", "19800.00", "2026-09-18", "Taylor Aspen", "Upcoming", "Confirm the customer decision"],
  ["Bench misting controls", "Banksia Seedlings", "Closing", "32700.00", "2026-09-25", "Sasha Wells", "Upcoming", "Confirm the final scope"],
];

const records: ReviewItem[] = seeds.map(
  ([title, organisation, stage, value, close, contact, state, action], i) => ({
    id: `c2000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    display_number: `SYN-PPO-OPP-${String(i + 1).padStart(6, "0")}`,
    title,
    stage_id: stage,
    close_outcome: "Open",
    stage_entered_at: "2026-09-09T00:00:00Z",
    updated_at: "2026-09-09T00:00:00Z",
    version: 1,
    company_id: CRM.company,
    company_name: "SYN Review company",
    organisation_name: `SYN ${organisation}`,
    site_id: CRM.site,
    site_name: "SYN Demonstration glasshouse",
    owner_id: CRM.owner,
    owner_name: "SYN Alex Lee",
    primary_person_id: CRM.person,
    contact_name: contact,
    next_action_state: state,
    next_action_id: `d2000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    next_action_summary: action,
    action_owner_id: CRM.owner,
    action_owner_name: "SYN Sam Jordan",
    due_at: state === "Overdue" ? "2026-09-04T06:00:00Z" : "2026-09-09T06:00:00Z",
    due_needed: state === "DueNeeded",
    value_amount: value,
    expected_close_date: close,
    can_edit: true,
  }),
);

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
  else if (url.pathname.endsWith("/shell/context")) data = {
    display_name: "SYN Demo tester with a long display name",
    actions: [
      { id: "opportunity", label: "Opportunity", module: "CRM Sales", href: "/crm/opportunities/new" },
      { id: "activity", label: "Activity", module: "My Work", href: "/work/new" },
      { id: "contact", label: "Contact", module: "Contacts", href: "/customers/new?kind=person" },
    ],
  };
  else if (url.pathname.endsWith("/shell/search")) data = {
    items: records.filter(record => record.title.toLowerCase().includes((url.searchParams.get("q") ?? "").toLowerCase())).map(record => ({ id: record.id, kind: "Opportunity", label: record.title, reference: record.display_number, href: `/crm/opportunities/${record.id}` })),
    has_more: false, limit_per_type: 5,
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
      stages: STAGES.map((stage_id, i) => ({
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
