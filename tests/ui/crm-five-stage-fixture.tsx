import { ShellProvider } from "../../src/components/shell-provider";
import { destinations } from "../../src/shell/navigation";
import { createRoot } from "react-dom/client";
import { BusinessSession } from "../../src/components/business-session";
import {
  ProductHeader,
  ProductNavigation,
} from "../../src/components/product-navigation";
import { SalesWorklist } from "../../src/components/crm-worklist";
import {
  dealsDesignRecords,
  dealsDesignStages,
  dealsDesignAsOf,
} from "../helpers/deals-accepted-fixture";
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
// These are synthetic presentation records, not persisted acceptance evidence.
const STAGES = dealsDesignStages;
const records = dealsDesignRecords.map((record) => ({ ...record }));

records.push(
  {
    ...records[0],
    id: "c2000000-0000-4000-8000-000000000021",
    display_number: "SYN-PPO-OPP-000021",
    title: "SYN Won irrigation upgrade",
    stage_id: "Closing",
    close_outcome: "Won",
  },
  {
    ...records[1],
    id: "c2000000-0000-4000-8000-000000000022",
    display_number: "SYN-PPO-OPP-000022",
    title: "SYN Lost controls upgrade",
    close_outcome: "Lost",
  },
);

const envelope = (items: unknown[]) => ({
  items,
  next_cursor: null,
  observed_at: dealsDesignAsOf,
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
      display_name: "Sasha Clarke",
    };
  else if (url.pathname.endsWith("/demo-role"))
    data = { current: "tester", available: ["tester", "pack-reviewer"] };
  else if (url.pathname.endsWith("/shell/context"))
    data = {
      preference_scope: `${CRM.workspace}:${CRM.owner}`,
      navigation: destinations
        .filter((item) => item.href)
        .map((item) => item.id),
      can_preview: true,
      display_name: "Sasha Clarke",
      actions: [
        {
          id: "opportunity",
          label: "Opportunity",
          module: "CRM Sales",
          href: "/sales/opportunities/new",
        },
        {
          id: "activity",
          label: "Activity",
          module: "My Work",
          href: "/work/new",
        },
        {
          id: "contact",
          label: "Contact",
          module: "Contacts",
          href: "/customers/new?kind=person",
        },
      ],
    };
  else if (url.pathname.endsWith("/shell/search"))
    data = {
      items: records
        .filter((record) =>
          record.title
            .toLowerCase()
            .includes((url.searchParams.get("q") ?? "").toLowerCase()),
        )
        .map((record) => ({
          id: record.id,
          kind: "Opportunity",
          label: record.title,
          reference: record.display_number,
          href: `/sales/opportunities/${record.id}`,
        })),
      has_more: false,
      limit_per_type: 5,
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
        (url.searchParams.get("outcome") === "All" ||
          (url.searchParams.get("outcome") === "Closed"
            ? r.close_outcome !== "Open"
            : r.close_outcome ===
              (url.searchParams.get("outcome") ?? "Open"))) &&
        (!url.searchParams.get("next_action") ||
          r.next_action_state === url.searchParams.get("next_action")) &&
        (!url.searchParams.get("stage_id") ||
          r.stage_id === url.searchParams.get("stage_id")),
    );
    if (url.searchParams.get("sort") === "Title")
      items = items.toSorted((a, b) => a.title.localeCompare(b.title));
    data = {
      ...envelope(items),
      window: {
        as_of: dealsDesignAsOf,
        first_page: true,
        has_more: false,
        count_basis: "ReturnedPage",
      },
      pipelines: [
        {
          id: "c1000000-0000-4000-8000-000000000002",
          display_name: "Sales pipeline",
        },
      ],
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
        pipelines: [
          {
            id: "c1000000-0000-4000-8000-000000000002",
            display_name: "Sales pipeline",
          },
        ],
        stages: STAGES.map((stage_id, i) => ({ stage_id, ordinal: i + 1 })),
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
  <ShellProvider
    hosted={new URLSearchParams(location.search).get("mode") !== "local"}
  >
    <div className="app-frame">
      <ProductNavigation />
      <div className="workspace">
        <ProductHeader />
        <main id="main">
          <BusinessSession
            hosted={
              new URLSearchParams(location.search).get("mode") !== "local"
            }
          >
            <SalesWorklist />
          </BusinessSession>
        </main>
      </div>
    </div>
  </ShellProvider>,
);
