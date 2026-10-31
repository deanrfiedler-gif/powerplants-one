import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { installDealsDesign } from "../helpers/deals-accepted-browser";
import { dealsDesignRecords } from "../helpers/deals-accepted-fixture";
const origin =
  process.env.PPO_TEST_ORIGIN ??
  `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
test.describe.configure({ timeout: 240000 });
test.use({ actionTimeout: 30000 });
test.beforeEach(async ({ page }) => {
  await expect(async () => {
    const r = await page.request.post(origin + "/api/v1/local-session", {
      headers: { Origin: origin },
      data: { profile: "coordinator" },
    });
    expect(r.status()).toBe(200);
  }).toPass({ timeout: 60000, intervals: [1000, 3000] });
});
test("CR-04 application geometry and compact List at matching viewports", async ({
  page,
}, info) => {
  await installDealsDesign(page);
  for (const [width, height] of [
    [1440, 960],
    [1024, 768],
    [390, 844],
    [320, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(origin + "/sales/opportunities?view=Grid");
    await expect(
      page.locator(
        width <= 780
          ? ".crm-phone-deal"
          : ".ppo-register-table tbody tr[data-opportunity-id]",
      ),
    ).toHaveCount(18, { timeout: 30000 });
    if (width === 1024)
      await page
        .getByRole("button", {
          name: "Collapse primary navigation",
          exact: true,
        })
        .click();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width <= 780) {
      await expect(page.locator(".crm-toolbar-accepted")).toBeHidden();
      expect(
        (await page.locator(".crm-phone-deal").first().boundingBox())!.height,
      ).toBe(136);
      await expect(page.locator(".crm-phone-add")).toBeVisible();
    } else {
      expect(
        (await page.locator(".crm-toolbar-accepted").boundingBox())!.height,
      ).toBe(54);
      expect(
        (await page
          .locator(".ppo-register-table tbody tr[data-opportunity-id]")
          .first()
          .boundingBox())!.height,
      ).toBe(40);
    }
    await page.screenshot({
      path: info.outputPath(`application-list-${width}.png`),
    });
    await page.goto(origin + "/sales/opportunities?view=Board");
    await expect(page.locator(".crm-card:visible")).toHaveCount(
      width <= 780 ? 4 : 18,
    );
    if (width === 1440) {
      expect(
        (await page.locator(".crm-stage-heading").first().boundingBox())!.width,
      ).toBeCloseTo(228, 0);
      expect(
        (await page.locator(".crm-card").first().boundingBox())!.width,
      ).toBeCloseTo(212, 0);
    }
    await page.screenshot({
      path: info.outputPath(`application-board-${width}.png`),
    });
  }
});
test("CR-04 chooser, selected CSV, sequential snapshots and changed permission/source recovery", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const state = await installDealsDesign(page);
  // Warm this real SPA destination before holding the export read. Cold route
  // compilation is not part of the cancellation assertion.
  const destination = await page.request.get(origin + "/sales/leads", {
    timeout: 120000,
  });
  expect(destination.ok()).toBe(true);
  await page.goto(origin + "/sales/opportunities?view=Grid");
  await page
    .getByRole("button", { name: "Column settings", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Reference", exact: true }).check();
  await page.screenshot({
    path: info.outputPath("application-columns-1440.png"),
  });
  await page.keyboard.press("Escape");
  const rows = page.locator(
    ".ppo-register-table tbody tr[data-opportunity-id]",
  );
  await rows.nth(0).getByRole("checkbox").check();
  await rows.nth(1).getByRole("checkbox").check();
  await expect(
    page.getByRole("dialog", { name: "2 deals selected" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-selection-1440.png"),
  });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export selected list" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("PPO-Deals-selected-list.csv");
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain("Reference");
  expect(csv).toContain(dealsDesignRecords[0].title);
  expect(csv).not.toContain(dealsDesignRecords[2].title);
  await page.getByRole("button", { name: "Open in sequence" }).click();
  await expect(page.locator(".crm-deal-dialog")).toContainText("1 of 2");
  await page.getByRole("button", { name: "Next selected deal" }).click();
  await expect(page.locator(".crm-deal-dialog")).toContainText(
    dealsDesignRecords[1].title,
  );
  await page.getByRole("button", { name: "Close deal dialog" }).click();
  state.changed = true;
  await page.getByRole("button", { name: "Export selected list" }).click();
  await expect(
    page.getByText("The permitted result page changed.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".crm-selection-panel")).toHaveCount(0);
  state.denied = true;
  await page
    .getByRole("button", { name: "Refresh from start", exact: true })
    .click();
  await expect(page.locator(".ppo-register-table")).toHaveCount(0);
  await expect(page.locator(".crm-selection-panel")).toHaveCount(0);
  await expect(
    page.getByText("This identity cannot read deals.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-denied-1440.png"),
  });

  // An export read started in this workspace must not download after a client-side departure.
  state.denied = false;
  state.changed = false;
  await page.goto(origin + "/sales/opportunities?view=Grid");
  await rows.first().getByRole("checkbox").check();
  let release!: () => void;
  let held = false;
  let lateDownload = false;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/api/v1/crm/opportunities?*",
    async (route) => {
      held = true;
      await pending;
      await route.fallback();
    },
    { times: 1 },
  );
  const response = page.waitForResponse(
    (r) => r.url().includes("/api/v1/crm/opportunities?") && r.status() === 200,
  );
  page.on("download", () => {
    lateDownload = true;
  });
  await page.getByRole("button", { name: "Export selected list" }).click();
  await expect.poll(() => held).toBe(true);
  try {
    await page.getByRole("link", { name: "Leads", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/sales/leads");
    await expect(page.locator("#ppo-deals")).toHaveCount(0);
  } finally {
    release();
  }
  await (await response).finished();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(lateDownload).toBe(false);
});
test("CR-04 filter URL, browser history, Add deal overlay and follow-through retry", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const state = await installDealsDesign(page);
  await page.goto(origin + "/sales/opportunities?view=Grid&q=Potting");
  await expect(
    page.locator(".ppo-register-table tbody tr[data-opportunity-id]"),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Add deal", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Add deal", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Deal title", { exact: true })).toBeVisible({
    timeout: 30000,
  });
  await page.screenshot({ path: info.outputPath("application-add-1440.png") });
  expect(new URL(page.url()).searchParams.get("q")).toBe("Potting");
  await page.goBack();
  await expect(
    page.getByRole("dialog", { name: "Add deal", exact: true }),
  ).toHaveCount(0);
  await page.goForward();
  await expect(
    page.getByRole("dialog", { name: "Add deal", exact: true }),
  ).toBeVisible();
  await page.reload();
  const draft = page.getByRole("dialog", { name: "Add deal", exact: true });
  await expect(draft).toBeVisible();
  await draft
    .getByLabel("Deal title", { exact: true })
    .fill("SYN unsaved modal title");
  page.once("dialog", (d) => d.dismiss());
  await draft.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(draft.getByLabel("Deal title", { exact: true })).toHaveValue(
    "SYN unsaved modal title",
  );
  page.once("dialog", (d) => d.accept());
  await draft.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(draft).toHaveCount(0);
  state.followFailed = true;
  await page
    .getByRole("button", { name: "Snapshot: Potting machine and take-off" })
    .click();
  await expect(
    page.getByText("Follow-through could not be read.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-snapshot-unavailable-1440.png"),
  });
  state.followFailed = false;
  await page.getByRole("button", { name: "Retry follow-through" }).click();
  await expect(
    page.getByText("No issued quotation available in this window.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-snapshot-1440.png"),
  });
  await expect(
    page.getByRole("link", { name: "Open full deal" }),
  ).toHaveAttribute("href", /return_to=.*view%3DGrid.*q%3DPotting/);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Forecast", exact: true }).click();
  await page.reload();
  await expect(page.locator(".crm-forecast-card")).toHaveCount(2);
  expect(new URL(page.url()).searchParams.get("q")).toBe("Potting");
});

test("CR-04 month and outcome grouping, partial/failed/empty reads and compact selection", async ({
  page,
}, info) => {
  const state = await installDealsDesign(page);
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({
      width,
      height: width === 1024 ? 768 : width > 1024 ? 960 : 844,
    });
    await page.goto(origin + "/sales/opportunities?view=Forecast");
    if (width === 1024)
      await page
        .getByRole("button", {
          name: "Collapse primary navigation",
          exact: true,
        })
        .click();
    await expect(page.locator(".crm-forecast-card")).toHaveCount(18, {
      timeout: 30000,
    });
    expect(
      await page
        .locator(".crm-forecast-card > a")
        .evaluateAll((nodes) => nodes.every((node) => node.clientHeight >= 18)),
    ).toBe(true);
    await expect(page.locator(".crm-forecast-workspace")).toContainText(
      "Not estimated",
    );
    await page.screenshot({
      path: info.outputPath(`application-forecast-${width}.png`),
    });
    await page.goto(origin + "/sales/opportunities?view=Archive");
    await expect(page.locator("[data-opportunity-id]")).toHaveCount(6, {
      timeout: 30000,
    });
    await expect(page.locator(".crm-outcome-band")).toHaveCount(2);
    await expect(page.locator(".crm-outcome-band").first()).toContainText(
      "$82,550.00",
    );
    await expect(page.locator(".crm-outcome-band").last()).toContainText(
      "1 not estimated",
    );
    await page.screenshot({
      path: info.outputPath(`application-archive-${width}.png`),
    });
  }
  await page.goto(origin + "/sales/opportunities?view=Grid");
  await page
    .getByRole("button", { name: /^Choose view\. Current view:/ })
    .click();
  await page
    .getByRole("button", { name: "Select deals in List", exact: true })
    .click();
  await page.locator(".crm-phone-select input").first().check();
  await expect(page.locator(".crm-selection-panel")).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-selection-320.png"),
  });
  await page.getByRole("button", { name: "Close selection" }).click();
  let failCompanyOptions = true;
  await page.route(
    /\/api\/v1\/crm\/worklist-options\?kind=Company(?:&|$)/,
    (route) =>
      failCompanyOptions
        ? route.fulfill({
            status: 503,
            json: {
              code: "Unavailable",
              message: "Synthetic company-option read failed. Retry this read.",
            },
          })
        : route.fallback(),
  );
  await page.getByRole("button", { name: /^Search and filter/ }).click();
  await expect(
    page.getByRole("dialog", { name: /^(Filter deals|Search and filter)$/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry company options", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-filter-unavailable-320.png"),
  });
  failCompanyOptions = false;
  await page
    .getByRole("button", { name: "Retry company options", exact: true })
    .click();
  await expect
    .poll(() =>
      page.getByLabel("Company", { exact: true }).locator("option").count(),
    )
    .toBeGreaterThan(1);
  for (const label of ["Deal owner", "Company", "Site"]) {
    await expect(
      page.getByLabel(label, { exact: true }).locator("option").first(),
    ).not.toHaveText(/Loading/);
  }
  await expect(
    page.getByRole("button", { name: "Show 18 deals", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-filters-320.png"),
  });
  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(
    page.getByRole("dialog", { name: "Filter deals", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-filters-1440.png"),
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page
    .getByRole("searchbox", { name: "Search deals", exact: true })
    .fill("no-synthetic-match");
  await page
    .getByRole("button", { name: /^Close (Filter deals|Search and filter)$/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "No deals match these filters" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-no-matches-320.png"),
  });
  state.empty = true;
  await page.goto(origin + "/sales/opportunities?view=Grid");
  await expect(
    page.getByRole("heading", { name: "No deals yet" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("application-empty-320.png") });
  state.empty = false;
  state.partial = true;
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.reload();
  await expect(page.locator("[data-opportunity-id]")).toHaveCount(3);
  await expect(page.locator(".crm-workspace-status")).toContainText(
    "this page",
  );
  await page.screenshot({
    path: info.outputPath("application-partial-1440.png"),
  });
  let releaseLoading!: () => void;
  const loading = new Promise<void>((resolve) => {
    releaseLoading = resolve;
  });
  await page.route("**/api/v1/crm/opportunities?*", async (route) => {
    await loading;
    await route.fallback();
  });
  await page.reload();
  await expect(
    page.getByText("Loading permitted sales records…", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-loading-1440.png"),
  });
  releaseLoading();
  await expect(page.locator("[data-opportunity-id]")).toHaveCount(3);
  state.failed = true;
  await page
    .getByRole("button", { name: "Refresh from start", exact: true })
    .click();
  await expect(
    page.getByText("Synthetic read unavailable. Try again.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-unavailable-1440.png"),
  });
  await expect(page.locator("[data-opportunity-id]")).toHaveCount(0);
  state.failed = false;
  await page
    .getByRole("button", { name: "Try loading again", exact: true })
    .click();
  await expect(page.locator("[data-opportunity-id]")).toHaveCount(3);
  await page.setViewportSize({ width: 320, height: 844 });
  const firstPage = await page
    .locator("[data-opportunity-id]")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-opportunity-id")),
    );
  const next = page.getByRole("button", { name: "Next page", exact: true });
  await next.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("application-partial-320.png"),
  });
  await next.click();
  // Actor-bound paging tokens remain in memory, never in a shareable URL.
  expect(new URL(page.url()).searchParams.has("cursor")).toBe(false);
  await expect
    .poll(
      async () =>
        await page
          .locator("[data-opportunity-id]")
          .evaluateAll((nodes) =>
            nodes.map((node) => node.getAttribute("data-opportunity-id")),
          ),
    )
    .not.toEqual(firstPage);
  await expect(page.locator("[data-opportunity-id]")).toHaveCount(3);
  await expect(page.locator(".crm-page-context")).toContainText("final page");
  await expect(next).toHaveCount(0);
});

test("CR-04 read states preserve native empty stages, suppress unread facts and clear a no-match List", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  const state = await installDealsDesign(page);
  state.empty = true;
  await page.goto(origin + "/sales/opportunities?view=Board");
  await expect(page.locator(".crm-stage-empty")).toHaveCount(5);
  const empty = page.locator(".crm-workspace-empty");
  await expect(empty).toHaveAttribute("data-board", "true");
  await expect(
    empty.getByRole("link", { name: "Open Leads", exact: true }),
  ).toHaveAttribute("href", "/sales/leads");
  await page.screenshot({
    path: info.outputPath("application-empty-1440.png"),
  });
  await empty.getByRole("button", { name: "Add deal", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Add deal", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Add deal", exact: true }),
  ).toHaveCount(0);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/crm/opportunities?*", async (route) => {
    await pending;
    await route.fallback();
  });
  await page.reload();
  try {
    await expect(
      page.getByText("Loading permitted sales records…", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".crm-skeleton-lane")).toHaveCount(5);
    await expect(page.locator(".crm-stage-heading")).toHaveCount(0);
    await expect(page.locator("[data-opportunity-id]")).toHaveCount(0);
    await page.screenshot({
      path: info.outputPath("application-board-loading-1440.png"),
    });
  } finally {
    release();
  }
  await expect(page.locator(".crm-stage-empty")).toHaveCount(5);
  state.empty = false;
  await page.goto(
    origin + "/sales/opportunities?view=Grid&q=no-synthetic-match",
  );
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    empty.getByRole("heading", { name: "No deals match these filters" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-no-matches-1440.png"),
  });
  await empty
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(
    page.locator(".crm-accepted-grid tbody tr[data-opportunity-id]"),
  ).toHaveCount(18);
  expect(new URL(page.url()).searchParams.get("q")).toBeNull();
  expect(new URL(page.url()).searchParams.get("view")).toBe("Grid");
});
