import { test, expect, type Page } from "@playwright/test";
import { findingRows, findingsClock } from "../helpers/findings-fixture";
import { destinations } from "../../src/shell/navigation";
import { dueThisWeek, isOverdue, inView, views } from "../../src/service/findings/model";
async function setup(
  page: Page,
  { viewOnly = false, uncertain = false, stale = false } = {},
) {
  const rows = structuredClone(findingRows),
    posts: Record<string, unknown>[] = [],
    events: Record<string, unknown>[] = [];
  let failed = false;
  await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (route) =>
    route.abort(),
  );
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      json: { items: [], observed_at: findingsClock, completeness: "Complete" },
    }),
  );
  await page.route("**/api/v1/local-session", (route) =>
    route.fulfill({
      json: {
        actor_id: rows[0].action!.owner_id,
        workspace_id: "10000000-0000-4000-8000-000000000001",
        display_name: "SYN coordinator",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (route) =>
    route.fulfill({
      json: {
        display_name: "SYN coordinator",
        preference_scope: "sv07-fixture",
        actions: [],
        navigation: destinations.map((d) => d.id),
        can_preview: true,
      },
    }),
  );
  await page.route("**/api/v1/selectors/owners?*", (route) =>
    route.fulfill({
      json: {
        items: [
          { id: rows[0].action!.owner_id, display_name: "SYN Morgan Lee" },
        ],
      },
    }),
  );
  await page.route("**/api/v1/activities/*/history", (route) =>
    route.fulfill({
      json: {
        items: events,
        owners: { [rows[0].action!.owner_id]: "SYN Morgan Lee" },
        observed_at: findingsClock,
        completeness: "Complete",
      },
    }),
  );
  await page.route("**/api/v1/service/findings**", async (route) => {
    const url = new URL(route.request().url()),
      key = decodeURIComponent(
        url.pathname.split("/findings/")[1]?.split("/")[0] ?? "",
      );
    if (key) {
      const item = rows.find((r) => r.id === key)!;
      if (url.pathname.endsWith("/next-action")) {
        if (route.request().method() === "POST") {
          const body = route.request().postDataJSON();
          posts.push(body);
          if (stale && !failed) {
            failed = true;
            item.action!.version = 2;
            await route.fulfill({
              status: 409,
              json: {
                code: "VersionConflict",
                message: "This activity changed. Compare its current version.",
              },
            });
            return;
          }
          if (posts.length === 1 || stale) {
            const before = structuredClone(item.action);
            item.action = {
              ...rows[0].action!,
              ...item.action,
              version: (item.action?.version ?? 0) + 1,
              summary: body.instruction,
              owner_id: body.owner_id,
              due_at: body.due_at,
              required_evidence: body.required_evidence,
            };
            item.state = "Open";
            events.unshift({
              id: "event-1",
              command: "ServiceFinding:SetNextAction",
              occurred_at: findingsClock,
              actor_name: "SYN coordinator",
              reason: body.reason,
              before,
              after: {
                summary: body.instruction,
                required_evidence: body.required_evidence,
                owner_id: body.owner_id,
                due_at: body.due_at,
              },
            });
          }
          if (uncertain && !failed) {
            failed = true;
            await route.abort();
            return;
          }
          await route.fulfill({
            json: { record_version: item.action!.version },
          });
          return;
        }
        await route.fulfill({
          json: {
            item,
            source_token: "a".repeat(64),
            expected_version: item.action?.version ?? 0,
            can_edit:
              !viewOnly &&
              !["Closed", "FollowUpCompleted"].includes(item.state),
            blocked_reason: viewOnly ? "ViewOnly" : null,
          },
        });
        return;
      }
      await route.fulfill({
        json: { item, as_of: findingsClock, synthetic: true },
      });
      return;
    }
    const view = (url.searchParams.get("view") ??
        "open") as (typeof views)[number],
      source = url.searchParams.get("source"),
      q = url.searchParams.get("q") ?? "";
    const filtered = rows.filter(
      (r) =>
        (!source || r.source === source) &&
        r.what_remains.toLowerCase().includes(q.toLowerCase()),
    );
    const selected = filtered.filter((r) => inView(r, view));
    await route.fulfill({
      json: {
        items: selected,
        total: selected.length,
        counts: Object.fromEntries(
          views.map((v) => [v, filtered.filter((r) => inView(r, v)).length]),
        ),
        options: {
          owners: [{ id: rows[0].action!.owner_id, label: "SYN Morgan Lee" }],
          sites: [{ id: rows[0].site.id, label: rows[0].site.name }],
        },
        view,
        offset: 0,
        limit: 25,
        next_offset: null,
        count_scope: "AuthorisedCandidateWindow",
        as_of: findingsClock,
        completeness: "Complete",
        synthetic: true,
      },
    });
  });
  return { rows, posts };
}
async function openRemaining(page: Page) {
  await page.goto("/service/findings?department=service");
  await page
    .getByRole("button", { name: "SYN-PPO-RPT-000058", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Finding snapshot" }),
  ).toBeVisible();
}
test("SV07 all views and source types keep source-owned closure and bounded counts", async ({
  page,
}) => {
  for (const row of findingRows) {
    expect(row.overdue).toBe(isOverdue(row, new Date(findingsClock)));
    expect(row.due_this_week).toBe(dueThisWeek(row, new Date(findingsClock)));
  }
  await setup(page);
  await page.goto("/service/findings?department=service");
  const menu = page.getByRole("navigation", { name: "Service review views" });
  await expect(
    page.getByText("7 in this authorised candidate window", { exact: false }),
  ).toBeVisible();
  for (const [label, count] of [
    ["Needs an owner", 1],
    ["Due this week", 3],
    ["Overdue", 1],
    ["Waiting on review", 1],
    ["Ready to close", 1],
    ["Recurring", 1],
    ["Closed findings", 1],
    ["All open", 7],
  ] as const) {
    await menu.getByRole("link", { name: new RegExp(`^${label}`) }).click();
    await expect(page.locator(".sv07-desktop tbody tr")).toHaveCount(count);
  }
  for (const source of [
    "inspection",
    "incident",
    "completion",
    "response",
    "schedule",
  ]) {
    await page.goto(`/service/findings?department=service`);
    await expect(page.locator(".sv07-desktop tbody tr")).toHaveCount(7);
    const row = findingRows.find((r) => r.source === source)!;
    await page
      .getByRole("button", { name: row.source_record.reference, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "What closes it" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: /Close finding|Request remote diagnosis/,
      }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Close", exact: true }).click();
  }
});
test("SV07 save/change keeps the same activity, history and an unchanged retry after an uncertain save", async ({
  page,
}) => {
  const f = await setup(page, { uncertain: true });
  await openRemaining(page);
  await page
    .getByRole("button", { name: "Change next action", exact: true })
    .click();
  await page
    .getByLabel("Instruction", { exact: true })
    .fill("SYN replace gland and verify the full-scale reading");
  await page
    .getByLabel("Reason for change", { exact: true })
    .fill("SYN clarify required follow-up");
  await page
    .getByRole("button", { name: "Save next action", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry unchanged save" }),
  ).toBeVisible();
  await expect(page.getByLabel("Instruction", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Finding snapshot" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Back to findings", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Finding snapshot" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry unchanged save" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Retry unchanged save" }).click();
  await expect(
    page.getByRole("button", { name: "Change next action", exact: true }),
  ).toBeVisible();
  expect(f.posts).toHaveLength(2);
  expect(f.posts[0]).toEqual(f.posts[1]);
  expect(f.rows[2].action!.id).toBe(findingRows[2].action!.id);
  await expect(page.locator(".sv07-history-below")).toContainText(
    "SYN clarify required follow-up",
  );
});
test("SV07 stale version compares without dropping entries, while technician stays view-only", async ({
  page,
}) => {
  const f = await setup(page, { stale: true });
  await openRemaining(page);
  await page
    .getByRole("button", { name: "Change next action", exact: true })
    .click();
  await page
    .getByLabel("Instruction", { exact: true })
    .fill("SYN preserved draft");
  await page
    .getByLabel("Reason for change", { exact: true })
    .fill("SYN version comparison");
  await page
    .getByRole("button", { name: "Save next action", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Compare current next action" })
    .click();
  await page
    .getByRole("button", { name: "Use current version with my entries" })
    .click();
  await expect(page.getByLabel("Instruction", { exact: true })).toHaveValue(
    "SYN preserved draft",
  );
  await page
    .getByRole("button", { name: "Save next action", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Change next action", exact: true }),
  ).toBeVisible();
  expect(f.posts[1].expected_version).toBe(2);
  await page.unrouteAll({ behavior: "wait" });
  await setup(page, { viewOnly: true });
  await openRemaining(page);
  await expect(
    page.getByText(
      "You can read this finding but not change its next action.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Change next action" }),
  ).toHaveCount(0);
});
test("SV07 read failures remove earlier content and counts, and empty windows can continue", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/service/findings?department=service");
  await expect(page.locator(".sv07-desktop tbody tr")).toHaveCount(7);
  await page.route("**/api/v1/service/findings?*", (route) =>
    route.fulfill({ status: 403, json: { message: "Access revoked" } }),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator("#ppo-findings").getByRole("alert")).toContainText(
    "Access revoked",
  );
  await expect(page.locator(".sv07-desktop tbody tr")).toHaveCount(0);
  await expect(page.getByText("Current results unconfirmed")).toBeVisible();
  await page.route("**/api/v1/service/findings?*", (route) =>
    route.fulfill({
      json: {
        items: [],
        total: 0,
        counts: {},
        options: { owners: [], sites: [] },
        offset: 0,
        limit: 25,
        next_offset: 25,
        as_of: findingsClock,
        completeness: "Complete",
      },
    }),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByRole("button", { name: "Next window" })).toBeEnabled();
});
test("SV07 comparison captures at 1440, 1024, 390 and 320", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await setup(page);
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 900 : 844 });
    await page.goto("/service/findings?department=service");
    await expect(
      page.getByText("7 in this authorised candidate window", { exact: false }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1024) {
      const collapse = page.getByRole("button", {
        name: "Collapse primary navigation",
        exact: true,
      });
      if (await collapse.isVisible()) await collapse.click();
    }
    await page.screenshot({ path: info.outputPath(`register-${width}.png`) });
    if (width >= 1024)
      await page
        .getByRole("button", { name: "SYN-PPO-RPT-000058", exact: true })
        .click();
    else
      await page
        .locator(".sv07-phone-row")
        .filter({ hasText: "Corroded cable gland" })
        .click();
    await expect(
      page.getByRole("heading", { name: "What closes it" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath(`snapshot-${width}.png`) });
    if (width < 1024) {
      await page.locator(".sv07-snapshot").evaluate((el) => {
        el.scrollTop = el.scrollHeight / 2;
      });
      await page.screenshot({
        path: info.outputPath(`snapshot-${width}-middle.png`),
      });
      await page.locator(".sv07-snapshot").evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.screenshot({
        path: info.outputPath(`snapshot-${width}-bottom.png`),
      });
      await expect(
        page.getByRole("link", { name: "Open report", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Back to findings", exact: true })
        .click();
      await expect(page.locator(".sv07-snapshot")).toHaveCount(0);
      await expect(page).toHaveURL(/\/service\/findings/);
      await expect(page.locator(".sv07-phone-row")).toHaveCount(7);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/service/findings?department=service");
  const expand = page.getByRole("button", {
    name: "Expand primary navigation",
    exact: true,
  });
  if (await expand.isVisible()) await expand.click();
  await page.getByRole("link", { name: /^Needs an owner/ }).click();
  await page
    .locator(".sv07-desktop tbody tr")
    .filter({ hasText: "Firmware check" })
    .locator(".sv07-open")
    .click();
  await expect(
    page.getByRole("heading", { name: "Set the next action" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("assignment-1440.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("link", { name: /^Recurring/ }).click();
  await page
    .locator(".sv07-desktop tbody tr")
    .filter({ hasText: "VA-12 travel fault" })
    .locator(".sv07-open")
    .click();
  await page.getByRole("tab", { name: /Recurrence/ }).click();
  await expect(
    page.getByText("Same equipment and failed check within 90 days.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("recurrence-1440.png") });
});
