import { test, expect } from "@playwright/test";
import { browserFixtureCall } from "../helpers/browser-fixture-call";
import { identityRegisterFixture } from "../helpers/access-identity-register";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

test.setTimeout(90000);
test("AD-01 register: real read, exact person handover and current authority", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  const response = await page.request.get(
    "/api/v1/admin/access?register=1&q=SYN%20Systems",
  );
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const data = await response.json();
  expect(data.items.length).toBeGreaterThan(0);
  await page.goto("/admin/access?q=SYN%20Systems");
  const link = page
    .locator(
      `#ppo-access-register a[href^="/admin/access/${data.items[0].id}"]:visible`,
    )
    .first();
  await expect(link).toBeVisible({ timeout: 30000 });
  await link.click();
  await expect(
    page.getByRole("heading", { name: "Explain grant eligibility" }),
  ).toBeVisible({timeout:60000});
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "observer" },
    baseURL!,
  );
  const denied = await page.request.get("/api/v1/admin/access?register=1");
  expect(denied.status()).toBe(403);
  expect(JSON.stringify(await denied.json())).not.toContain("items");
});

test("AD-01 register: Figma layout, filters, selection, columns and cleared failed reads", async ({
  page,
  baseURL,
}, testInfo) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  let failure = 0;
  await page.route("**/api/v1/admin/access?*", async (route) => {
    if (failure)
      return route.fulfill({
        status: failure,
        contentType: "application/json",
        body: JSON.stringify({
          code:
            failure === 409
              ? "WorkingCompanySelected"
              : failure === 403
                ? "Forbidden"
                : "Unavailable",
          message:
            failure === 409
              ? "Clear your working company in the account panel to inspect workspace access."
              : "Synthetic identity read unavailable",
        }),
      });
    const data = identityRegisterFixture(),
      query = new URL(route.request().url()).searchParams;
    data.items = data.items.filter(
      (r) =>
        !query.get("q") ||
        r.display_name.toLowerCase().includes(query.get("q")!.toLowerCase()),
    );
    const view = query.get("view");
    if (view === "active") data.items = data.items.filter((r) => r.active);
    if (view === "inactive") data.items = data.items.filter((r) => !r.active);
    if (view === "hosted") data.items = data.items.filter((r) => r.masked);
    if (query.get("company_id"))
      data.items = data.items.filter(
        (r) =>
          r.workspace_scope ||
          r.company_keys.includes(
            query.get("company_id")!.endsWith("2") ? "SYN-B" : "SYN-A",
          ),
      );
    if (query.get("sort") === "changed")
      data.items.sort((a, b) =>
        (b.last_changed_at ?? "").localeCompare(a.last_changed_at ?? ""),
      );
    data.total = data.items.length;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  await page.goto("/admin/access?department=service");
  const phone = (page.viewportSize()?.width ?? 1440) <= 780;
  await expect(page.locator("#ppo-access-register")).toBeVisible({
    timeout: 30000,
  });
  const rows = page.locator(
    phone ? ".access-phone-row" : ".access-desktop tbody tr",
  );
  await expect(rows).toHaveCount(phone ? 13 : 14);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (process.env.PPO_CAPTURE_DIR) {
    await mkdir(process.env.PPO_CAPTURE_DIR, { recursive: true });
    await page.screenshot({
      path: join(
        process.env.PPO_CAPTURE_DIR,
        `register-${testInfo.project.name}.png`,
      ),
    });
  }
  if (!phone) {
    await page
      .getByRole("checkbox", { name: "Select Alex Nguyen", exact: true })
      .check();
    await expect(page.getByText("1 selected on this page")).toBeVisible();
    await page
      .getByRole("button", { name: "Choose identity columns", exact: true })
      .click();
    await page.getByLabel("Teams", { exact: true }).uncheck();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(
      page.getByRole("columnheader", { name: "Teams", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Current", exact: true }).click();
    await expect(page).toHaveURL(/sort=current/);
  }
  if (phone)
    await page
      .locator("#shell-header")
      .getByRole("button", { name: /^Search (identities|and filter)$/ })
      .click();
  await page
    .getByRole("textbox", { name: "Find a person", exact: true })
    .fill("no-such-person");
  await page
    .getByRole("textbox", { name: "Find a person", exact: true })
    .press("Enter");
  await expect(
    page.getByRole("heading", { name: "No identities match these filters." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(rows).toHaveCount(14);
  for (const status of [503, 403, 409]) {
    failure = status;
    await page
      .getByRole("button", { name: "Refresh identities", exact: true })
      .filter({ visible: true })
      .click();
    await expect(
      page.locator("#ppo-access-register .business-error"),
    ).toBeVisible();
    await expect(rows).toHaveCount(0);
    await expect(page.locator(".access-count")).not.toContainText(
      "14 identities",
    );
    await expect(page.locator("#access-menu small")).toHaveCount(0);
  }
  failure = 0;
  await page
    .getByRole("button", { name: "Refresh identities", exact: true })
    .filter({ visible: true })
    .click();
  await expect(rows).toHaveCount(14);
});
