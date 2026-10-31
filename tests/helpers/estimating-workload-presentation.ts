import type { Page } from "@playwright/test";
import type {
  WorkloadItem,
  SavedEstimates,
} from "../../src/components/estimating-workload-model";

export const workloadId = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const workloadCaptureStyle =
  ".ppo-fa, .svg-inline--fa, [data-prefix], .es02-icon, .product-icon, .shell-icon, .mw-icon, i[class*='fa-'] { visibility:hidden !important; }";
// Deterministic API-boundary presentation fixtures. Native count/authority proof lives in the database suite.
export function workloadPresentation() {
  const titles = [
    "Controls upgrade assessment",
    "Glasshouse 4 irrigation controller renewal",
    "Isolation nursery fertigation expansion",
    "Substrate store dosing review",
    "Propagation house climate screens",
    "Glasshouse 2 lighting and CO₂ scope",
    "Packhouse cold room monitoring",
  ];
  const states = [
    "unstarted",
    "clarification",
    "ready",
    "unstarted",
    "clarification",
    "ready",
    "legacy",
  ] as const;
  const items: WorkloadItem[] = titles.map((title, i) => ({
    opportunity: {
      id: workloadId(i + 1),
      display_number: `SYN-PPO-OPP-${String(19 + i).padStart(6, "0")}`,
      version: i === 1 ? 3 : 1,
      company_id: workloadId(90),
      title,
      need_summary:
        i === 1
          ? "Replace the failing zone controller and confirm sensor wiring and valve counts before costing."
          : "SYN customer scope to review with the recorded source.",
      close_outcome: "Open",
    },
    customer:
      i < 2 || i === 6
        ? "SYN Greenhouse Demonstration"
        : i < 4
          ? "SYN Isolation Nursery"
          : "SYN Systems",
    site: "SYN Q01 Demonstration Site",
    estimating_owner: states[i] === "unstarted" ? null : "Alex Lee",
    sales_owner: "Jordan Pike",
    estimating_owner_id: states[i] === "unstarted" ? null : workloadId(92),
    state: states[i],
    updated_at: `2026-10-${String(10 - i).padStart(2, "0")}T00:00:00.000Z`,
    response_date: null,
    intake_acceptance: "NotConfigured",
    priority: "NotConfigured",
    sales_handover_due: null,
    sales_action: {
      id: workloadId(100 + i),
      summary: "Confirm site visit and source details",
      owner: "Jordan Pike",
      due_at: null,
      status: "Open",
    },
    can_start: states[i] === "unstarted",
    sales_brief: null,
    readiness_reasons: [],
    readiness_findings: [],
    workspace:
      states[i] === "unstarted"
        ? null
        : {
            id: workloadId(200 + i),
            version: 4,
            selected_option_id: workloadId(300 + i),
            options: [
              {
                id: workloadId(300 + i),
                label: "B",
                state: "Active",
                revision_id: workloadId(400 + i),
                revision: 4,
                content_hash: "synthetic-presentation",
                readiness:
                  states[i] === "ready"
                    ? "Complete"
                    : states[i] === "legacy"
                      ? "NotRecorded"
                      : "Incomplete",
              },
              {
                id: workloadId(500 + i),
                label: "A",
                state: "Active",
                revision_id: workloadId(600 + i),
                revision: 2,
                content_hash: "synthetic-alternative",
                readiness: "Incomplete",
              },
            ],
          },
    estimates: [],
  }));
  const saved: SavedEstimates = {
    items: Array.from({ length: 6 }, (_, i) => ({
      id: workloadId(700 + i),
      version_id: workloadId(800 + i),
      version: i + 1,
      display_number: `SYN-PPO-EST-0000${21 + i}`,
      title: titles[i],
      customer: items[i].customer,
      updated_at: items[i].updated_at,
      sell_total: i === 5 ? null : String(12500 + i * 1230),
      state: "Draft",
    })),
    limit: 100,
    next_offset: null,
    can_create: true,
  };
  return { items, saved };
}
export async function mountWorkloadPresentation(page: Page) {
  const fixture = workloadPresentation();
  await page.route(/https:\/\/(kit|ka-p|kit-pro|pro)\./, (route) =>
    route.abort(),
  );
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname.replace("/api/v1/", "");
    const reply = (body: unknown) => route.fulfill({ json: body });
    if (path === "local-session")
      return reply({
        actor_id: workloadId(92),
        workspace_id: workloadId(91),
        display_name: "SYN Coordinator",
      });
    if (path === "shell/context")
      return reply({
        display_name: "SYN Coordinator",
        preference_scope: "es01-presentation",
        actions: [],
        navigation: [
          "work",
          "estimates",
          "intake",
          "wizard",
          "pricing",
          "quotations",
          "configurations",
          "estimate-reviews",
        ],
        can_preview: false,
        companies: [],
        conversations: true,
      });
    if (path === "estimating/estimates") return reply(fixture.saved);
    if (path === "estimating/workload") {
      const q = url.searchParams.get("q") ?? "",
        owner = url.searchParams.get("owner") ?? "all",
        view = url.searchParams.get("view") ?? "all",
        sort = url.searchParams.get("sort") ?? "updated";
      const basis = fixture.items.filter((i) =>
        i.opportunity.title.toLowerCase().includes(q.toLowerCase()),
      );
      const mine = basis.filter(
          (i) => i.estimating_owner_id === workloadId(92),
        ),
        window = owner === "mine" ? mine : basis;
      const counts = { unstarted: 0, clarification: 0, ready: 0, legacy: 0 };
      for (const item of window) counts[item.state]++;
      const items = window.filter((i) => view === "all" || i.state === view);
      return reply({
        items,
        counts,
        owner_counts: { all: basis.length, mine: mine.length },
        observed_at: "2026-10-11T00:42:00.000Z",
        candidate_limit: 100,
        synthetic: true,
        filters: { q, owner, view, sort },
      });
    }
    return reply({ items: [] });
  });
  await page.goto("/estimating");
  return fixture;
}
