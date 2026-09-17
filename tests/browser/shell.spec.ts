import { test, expect } from "@playwright/test";
test("responsive shell, keyboard focus, server save, read-only refusal and storage feasibility", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A connected view",
  );
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  await page.screenshot({
    path: info.outputPath("P01-keyboard-focus.png"),
  });
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("P01-overview.png"),
    fullPage: true,
  });
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Open My Work" })).toBeFocused();
  await page.getByRole("button", { name: info.project.use.isMobile ? "Menu" : "More", exact: true }).click();
  await expect(page.getByText("Synthetic data only", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: info.project.use.isMobile ? "Close menu" : "Close More menu", exact: true }).click();
  await page.getByRole("link", { name: "Open foundation checks" }).click();
  await expect(
    page.getByRole("heading", { name: "Foundation checks" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use this identity" }).click();
  await expect(page.getByText("Request loaded from PostgreSQL.")).toBeVisible();
  await page
    .getByLabel("Request summary")
    .fill("SYN browser verified inspection");
  await page
    .getByLabel("Reason for change")
    .fill("Verify local form and server receipt");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved to PostgreSQL." }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("P01-foundation.png"),
    fullPage: true,
  });
  await page.getByLabel("Demonstration identity").selectOption("observer");
  await page.getByRole("button", { name: "Use this identity" }).click();
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Demonstration identity").selectOption("systems");
  await page.getByRole("button", { name: "Use this identity" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "This identity cannot read service requests." }),
  ).toBeVisible();
  await page.getByText("Browser-storage experiment", { exact: true }).click();
  await page.getByRole("button", { name: "Check browser storage" }).click();
  await expect(page.getByText(/Synthetic marker committed/)).toBeVisible();
  await page.reload();
  await page.getByText("Browser-storage experiment", { exact: true }).click();
  await page.getByRole("button", { name: "Check browser storage" }).click();
  await expect(page.getByText(/Previous marker recovered/)).toBeVisible();
  const storage = await page.getByText(/Previous marker recovered/).innerText();
  console.log(
    JSON.stringify({
      viewport: info.project.use.viewport,
      storage_evidence: storage,
    }),
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("unavailable dependency and missing page show useful recoverable states", async ({
  page,
}, info) => {
  // Deliberate browser network failure; this is UI evidence, not a mocked database proof.
  await page.route("**/api/v1/health", (route) => route.abort());
  await page.goto("/foundation");
  await expect(
    page.getByText("Database unavailable — check local setup"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Check connection" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("P01-unavailable.png"),
    fullPage: true,
  });
  await page.goto("/unimplemented-page");
  await expect(
    page.getByRole("heading", { name: "This page is unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Return to overview" }),
  ).toBeVisible();
});

test("r17 preview preserves permissions, contextual navigation and page guidance", async ({ page }, info) => {
  const response = await page.request.post("/api/v1/local-session", { headers: { Origin: "http://127.0.0.1:3000" }, data: { profile: "coordinator" } });
  expect(response.ok()).toBe(true);
  await page.goto("/crm/opportunities");
  await page.getByRole("button", { name: "Change identity", exact: true }).click();
  await page.getByLabel("Preview workspace", { exact: true }).selectOption("engineering");
  await expect(page).toHaveURL(/\/engineering$/);
  await expect(page.locator(".product-heading")).toHaveText("Powerplants OneEngineering");
  if (info.project.use.isMobile) {
    const navigation = page.getByRole("navigation", { name: "Mobile navigation", exact: true });
    await expect(navigation.getByRole("link", { name: "Engineering", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Deals", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Open global search", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Search Powerplants One" })).toBeFocused();
    await page.getByRole("button", { name: "Close search", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Global search", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Open global search", exact: true })).toBeFocused();
  }
  await page.getByRole("button", { name: "Page guide", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Page guide", exact: true }).getByRole("heading", { name: "Engineering", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Page guide", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Change identity", exact: true }).click();
  await page.getByLabel("Preview workspace", { exact: true }).selectOption("supply");
  await expect(page).toHaveURL(/\/engineering$/);
  await expect(page.getByRole("status").filter({ hasText: "This workspace is planned" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Change identity", exact: true }).click();
  await expect(page.getByLabel("Preview workspace", { exact: true })).toHaveValue("supply");
  await page.keyboard.press("Escape");
  const navButton = page.getByRole("button", { name: info.project.use.isMobile ? "Menu" : "More", exact: true });
  await navButton.click();
  await page.getByRole("searchbox", { name: "Find a menu item" }).fill("Customer");
  await page.getByRole("navigation", { name: info.project.use.isMobile ? "All modules" : "More navigation", exact: true }).getByRole("link", { name: "Customers", exact: true }).click();
  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.locator(".product-heading")).toHaveText("Powerplants OneCustomers");
});
