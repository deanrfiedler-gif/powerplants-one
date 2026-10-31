import type { Page } from "@playwright/test";
import {
  dealsDesignRecords,
  dealsArchiveRecords,
  dealsDesignAsOf,
  dealsDesignStages,
} from "./deals-accepted-fixture";
export async function installDealsDesign(page: Page) {
  const state = {
    denied: false,
    failed: false,
    partial: false,
    changed: false,
    followFailed: false,
    empty: false,
  };
  await page.route("**/api/v1/crm/opportunities?*", async (route) => {
    if (state.denied)
      return route.fulfill({
        status: 403,
        json: {
          code: "PermissionDenied",
          message: "This identity cannot read deals.",
        },
      });
    if (state.failed)
      return route.fulfill({
        status: 503,
        json: {
          code: "Unavailable",
          message: "Synthetic read unavailable. Try again.",
        },
      });
    const p = new URL(route.request().url()).searchParams;
    let items = (p.get("outcome") === "Closed" ? dealsArchiveRecords : dealsDesignRecords).filter(
      (r) =>
        !p.get("q") ||
        r.title.toLowerCase().includes(p.get("q")!.toLowerCase()),
    );
    if (p.get("next_action"))
      items = items.filter((r) => r.next_action_state === p.get("next_action"));
    if (p.get("stage_id"))
      items = items.filter((r) => r.stage_id === p.get("stage_id"));
    if (state.empty) items = [];
    if (state.changed)
      items = items.map((r) => ({ ...r, version: r.version + 1 }));
    if (state.partial) items = items.slice(0, 3);
    if (p.get("sort") === "Title")
      items = items.toSorted((a, b) => a.title.localeCompare(b.title));
    await route.fulfill({
      json: {
        items,
        completeness: state.partial ? "Partial" : "Complete",
        next_cursor: null,
        observed_at: dealsDesignAsOf,
        window: {
          as_of: dealsDesignAsOf,
          first_page: true,
          has_more: state.partial,
          count_basis: "ReturnedPage",
        },
        stages: dealsDesignStages.map((stage_id, i) => ({
          stage_id,
          ordinal: i + 1,
          count: items.filter((r) => r.stage_id === stage_id).length,
        })),
        pipelines: [
          {
            id: "c1000000-0000-4000-8000-000000000002",
            display_name: "Sales pipeline",
          },
        ],
        sort: p.get("sort") ?? "Reference",
        can_create: true,
      },
    });
  });
  await page.route(
    /\/api\/v1\/crm\/opportunities\/[0-9a-f-]+$/,
    async (route) => {
      const r = [...dealsDesignRecords, ...dealsArchiveRecords].find((r) =>
        route.request().url().endsWith(r.id),
      );
      if (!r || state.denied)
        return route.fulfill({
          status: 404,
          json: {
            code: "RecordUnavailable",
            message: "This record is unavailable.",
          },
        });
      await route.fulfill({
        json: {
          items: [
            {
              ...r,
              organisation_id: "50000000-0000-4000-8000-000000000001",
              need_summary:
                "SYN Review the customer need and scope with the existing team.",
              scope_details: {},
              qualification_note: "SYN qualification recorded",
              identification_activity_id: null,
              next_activity: r.next_action_id
                ? {
                    id: r.next_action_id,
                    summary: r.next_action_summary,
                    owner_name: r.action_owner_name,
                    due_at: r.due_at,
                  }
                : null,
              stages: dealsDesignStages.map((stage_id, i) => ({
                stage_id,
                ordinal: i + 1,
              })),
              events: [],
            },
          ],
          completeness: "Complete",
          observed_at: dealsDesignAsOf,
        },
      });
    },
  );
  await page.route(
    "**/api/v1/crm/opportunities/*/follow-through",
    async (route) => {
      if (state.followFailed)
        return route.fulfill({
          status: 503,
          json: {
            code: "Unavailable",
            message: "Follow-through could not be read.",
          },
        });
      const section = {
        availability: "Complete",
        items: [],
        has_more: false,
        candidate_limit: 20,
      };
      await route.fulfill({
        json: {
          opportunity_id: route.request().url().split("/").at(-2),
          opportunity_version: 1,
          observed_at: dealsDesignAsOf,
          estimates: section,
          quotations: section,
          handovers: section,
          advisory: {
            stage: "Discovery",
            assessment: "ReviewRequired",
            authority: "AdvisoryOnly",
            conditions: [
              "Review the discovery meeting evidence and agreement to explore.",
            ],
          },
        },
      });
    },
  );
  return state;
}
