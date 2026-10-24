import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page, baseURL }) => {
  const response = await page.request.post("/api/v1/local-session", {
    headers: { Origin: baseURL! },
    data: { profile: "coordinator" },
  });
  expect(response.ok()).toBe(true);
});

test("SV-03 register retains view context, selects, exports and opens source-labelled snapshots", async ({
  page,
}, info) => {
  await page.goto("/service/work-orders?sort=reference_asc");
  await expect(
    page.getByRole("heading", { name: "Work orders register", exact: true }),
  ).toBeAttached();
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  const phone = info.project.name.includes("mobile");
  const rows = phone
    ? page.locator(".wo-phone-row")
    : page.locator(".ppo-register tbody tr");
  await expect(rows.first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("register.png"),
    fullPage: true,
  });
  if (phone) {
    await rows.first().focus();
    await page.keyboard.press("Shift+Space");
  } else {
    await page
      .getByRole("checkbox", { name: /^Select / })
      .nth(1)
      .check();
  }
  const selected = page.getByRole("complementary", {
    name: "Selected work orders",
  });
  await expect(selected).toBeVisible();
  const download = page.waitForEvent("download");
  await selected
    .getByRole("button", { name: "Export list", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("selected-work-orders.csv");
  await selected.getByRole("button", { name: "Open in sequence" }).click();
  const snapshot = page.locator("dialog.wo-snapshot");
  await expect(
    snapshot.getByRole("link", { name: "Open work order", exact: true }),
  ).toBeVisible();
  await expect(snapshot).toContainText("Work-order commands");
  await expect(
    snapshot.getByRole("link", { name: "Open work order", exact: true }),
  ).toHaveAttribute("href", /return_to=.*reference_asc/);
  expect(
    await snapshot.getByRole("button", { name: /Authorise/i }).count(),
  ).toBe(0);
  await page.screenshot({
    path: info.outputPath("snapshot.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(snapshot).toHaveCount(0);
  await selected.getByRole("button", { name: "Cancel selection" }).click();
  if (!phone) {
    await page
      .getByRole("navigation", { name: "Work order views" })
      .getByRole("link", { name: /^Scope needed/ })
      .click();
    await expect(page).toHaveURL(/view=scope_needed/);
    await expect(
      page.getByText("No work orders in this view", { exact: true }).first(),
    ).toBeVisible();
  } else {
    await page.setViewportSize({ width: 320, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(rows.first()).toBeVisible();
    await page.screenshot({
      path: info.outputPath("register-320.png"),
      fullPage: true,
    });
  }
});

test("SV-03 read errors and denied reads clear records and support recovery", async ({
  page,
}) => {
  let fail = true;
  await page.route(
    "**/api/v1/service/work-orders/register?*",
    async (route) => {
      if (!fail) return route.continue();
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "Unavailable",
          message: "SYN register read failed",
        }),
      });
    },
  );
  await page.goto("/service/work-orders");
  await expect(
    page.getByRole("alert").filter({ hasText: "SYN register read failed" }),
  ).toBeVisible();
  await expect(
    page.locator(".wo-phone-row,.ppo-register tbody tr"),
  ).toHaveCount(0);
  fail = false;
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await expect(page.locator(".wo-phone-row").first()).toBeAttached();
  await page.unroute("**/api/v1/service/work-orders/register?*");
  await page.route("**/api/v1/service/work-orders/register?*", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Forbidden",
        message: "SYN source access removed",
      }),
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "SYN source access removed" }),
  ).toBeVisible();
  await expect(
    page.locator(".wo-phone-row,.ppo-register tbody tr"),
  ).toHaveCount(0);
});
