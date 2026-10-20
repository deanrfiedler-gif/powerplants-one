import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  siteId,
  siteFixture,
  sitesFixture,
  siteSources,
  equipmentFixture,
} from "../helpers/sites-native";

async function capture(page: Page, info: TestInfo, name: string) {
  const root = process.env.PPO_CS04_EVIDENCE;
  if (root) {
    await mkdir(root, { recursive: true });
    await page.screenshot({ path: join(root, `${name}.png`) });
  } else await page.screenshot({ path: info.outputPath(`${name}.png`) });
}
test.beforeEach(async ({ page, baseURL }, info) => {
  if (!info.title.includes("live API")) {
    // Visual/state compositions use a synthetic shell as well as synthetic reads.
    // The separate live journey below retains the real session and API boundary.
    await page.route("**/api/v1/local-session", route => route.fulfill({ json: {
      actor_id: "30000000-0000-4000-8000-000000000001",
      workspace_id: "10000000-0000-4000-8000-000000000001",
      display_name: "SYN Coordinator",
    } }));
    await page.route("**/api/v1/shell/context", route => route.fulfill({ json: {
      display_name: "SYN Coordinator", can_preview: true, conversations: false,
      navigation: ["work", "tickets", "work-orders", "planner", "customers", "people", "sites", "facilities", "surveys", "equipment"],
      actions: [], companies: [], working_company_id: null,
    } }));
    await page.route("**/api/v1/notifications**", route => route.fulfill({ json: { items: [], unread: 0 } }));
    return;
  }
  const response = await page.request.post(`${baseURL}/api/v1/local-session`, {
    headers: { origin: baseURL! },
    data: { profile: "coordinator" },
  });
  expect(response.status()).toBe(200);
});
async function fixtures(page: Page) {
  await page.route("**/api/v1/sites/register?**", (route) =>
    route.fulfill({ json: sitesFixture }),
  );
  await page.route(`**/api/v1/sites/${siteId}/overview`, (route) =>
    route.fulfill({
      json: {
        site: siteFixture,
        sources: siteSources,
        observed_at: sitesFixture.observed_at,
      },
    }),
  );
  await page.route(`**/api/v1/equipment?site_id=${siteId}`, (route) =>
    route.fulfill({ json: { items: equipmentFixture, total: 14 } }),
  );
}
test("CS04 live API short and legacy references retain the existing record", async ({
  page,
}) => {
  const response = await page.request.get("/api/v1/sites/register");
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.items.length).toBeGreaterThan(0);
  const first = data.items[0];
  expect(first.display_number).toMatch(/^SYN-SITE-/);
  for (const q of [first.display_number, first.legacy_display_number]) {
    const result = await page.request.get(
      `/api/v1/sites/register?q=${encodeURIComponent(q)}`,
    );
    expect(
      (await result.json()).items.map((s: { id: string }) => s.id),
    ).toEqual([first.id]);
  }
  await page.goto(`/sites/${first.id}`);
  await expect(
    page.getByRole("heading", { name: first.display_name, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".site-record-meta")).toContainText(
    first.display_number,
  );
});
test("CS04 accepted compositions at desktop, tablet and 390/320 with exact handovers", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  await fixtures(page);
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width > 780 ? 900 : 844 });
    await page.goto("/sites?department=service");
    await expect(
      page.locator(width > 780 ? ".sites-desktop-grid" : ".sites-phone-list"),
    ).toBeVisible();
    await expect(page.locator(".module-navigation")).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1440)
      expect((await page.locator("#sites-menu").boundingBox())?.width).toBe(
        240,
      );
    if (width < 780) {
      await expect(page.locator(".sites-toolbar")).toBeHidden();
      await expect(
        page.getByRole("button", {
          name: width === 320 ? "Search and filter" : "Search sites",
          exact: true,
        }),
      ).toBeVisible();
    }
    await capture(page, info, `register-${width}`);
    await page.goto(`/sites/${siteId}?department=service`);
    await expect(
      page.getByRole("heading", { name: "SYN Glasshouse 4", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".site-readiness-card")).toContainText("P4");
    await expect(page.locator(".site-readiness-card")).toContainText(
      "not available",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("link", {
        name: width < 780 ? "Service request" : "Start service request",
        exact: true,
      }),
    ).toHaveAttribute("href", `/service/tickets/new?site=${siteId}`);
    if (width < 780) {
      await expect(page.locator(".site-phone-access")).toBeVisible();
      await expect(
        page.locator(".site-phone-access").getByRole("link", { name: /Maps/ }),
      ).toHaveAttribute("target", "_blank");
    }
    if (width === 320) {
      await expect(page.locator(".site-footer-readiness")).toBeHidden();
      await page
        .locator(".site-phone-actions")
        .getByRole("button", { name: "Site actions", exact: true })
        .click();
      await expect(
        page.getByRole("menuitem", { name: "Access & readiness", exact: true }),
      ).toHaveAttribute("href", `/sites/${siteId}/readiness`);
      await page.keyboard.press("Escape");
    }
    await capture(page, info, `overview-${width}`);
    if (width === 1440) {
      await page.getByRole("tab", { name: /Equipment/ }).click();
      await expect(
        page.getByRole("columnheader", { name: "Installed in" }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Serves", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Show 8 more" }),
      ).toHaveAttribute("href", `/equipment?site_id=${siteId}`);
      await capture(page, info, "equipment-1440");
      await page.getByRole("tab", { name: /Equipment/ }).focus();
      await page.keyboard.press("Home");
      await expect(
        page.getByRole("tab", { name: "Overview", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
    }
  }
});
test("CS04 loading, empty, retry, revoked access and partial source states", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 390, height: 844 });
  let state = "loading";
  await page.route("**/api/v1/sites/register?**", async (route) => {
    if (state === "loading") return; // deliberately unresolved first read; replaced by reload below
    if (state === "error")
      return route.fulfill({
        status: 503,
        json: { code: "Unavailable", message: "Synthetic read failure" },
      });
    if (state === "denied")
      return route.fulfill({
        status: 403,
        json: { code: "Forbidden", message: "Synthetic access revoked" },
      });
    return route.fulfill({
      json:
        state === "empty"
          ? {
              ...sitesFixture,
              items: [],
              total: 0,
              counts: { All: 0, Readiness: 0, Biosecurity: 0, Address: 0 },
            }
          : sitesFixture,
    });
  });
  await page.goto("/sites?department=service");
  await expect(page.getByText("Loading permitted sites…")).toBeVisible();
  await capture(page, info, "loading-390");
  state = "empty";
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "No matching sites" }),
  ).toBeVisible();
  await capture(page, info, "empty-390");
  state = "error";
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Could not load sites" }),
  ).toBeVisible();
  await expect(page.locator(".sites-phone-list")).toHaveCount(0);
  await expect(page.locator(".ppo-register-foot")).toHaveCount(0);
  await capture(page, info, "error-390");
  state = "ready";
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(page.locator(".sites-phone-list article")).toHaveCount(7);
  state = "denied";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "Sites unavailable with this access" }),
  ).toBeVisible();
  await expect(page.locator(".sites-phone-list")).toHaveCount(0);
  await page.route(`**/api/v1/sites/${siteId}/overview`, (route) =>
    route.fulfill({
      json: {
        site: siteFixture,
        observed_at: sitesFixture.observed_at,
        sources: [
          { name: "Follow-ups", state: "Unavailable", items: [] },
          { name: "Work orders", state: "Restricted", items: [] },
          { ...siteSources[0], state: "Partial" },
        ],
      },
    }),
  );
  await page.goto(`/sites/${siteId}`);
  const overview = page.getByRole("tabpanel", { name: "Overview", exact: true });
  await expect(overview.getByText("Work orders: Access restricted")).toBeVisible();
  await expect(overview.getByText(/Could not load this source/)).toBeVisible();
  await expect(
    overview.getByText(/Showing the first permitted records/),
  ).toBeVisible();
  await capture(page, info, "partial-390");
});
