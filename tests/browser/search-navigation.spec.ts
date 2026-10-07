import { test, expect } from "@playwright/test";
import { navigateToSearch } from "../helpers/search-navigation";

test.beforeEach(async ({ page, baseURL }) => {
  expect((await page.request.post("/api/v1/local-session", {
    headers: { Origin: baseURL! }, data: { profile: "coordinator" },
  })).ok()).toBe(true);
});
test("search geometry waits for its exact initial read before the render assertion", async ({ page }) => {
  test.setTimeout(30000);
  await page.route("**/api/v1/search?*", async route => {
    await new Promise(resolve => setTimeout(resolve, 6000));
    await route.continue();
  });
  const start = Date.now();
  await navigateToSearch(page, "/search?q=SYN");
  expect(Date.now() - start).toBeGreaterThanOrEqual(6000);
  await expect(page.getByText(/results on this page/)).toBeVisible();
});
test("search readiness rejects an unsuccessful initial read", async ({ page }) => {
  await page.route("**/api/v1/search?*", route => route.fulfill({
    status: 503, contentType: "application/json",
    body: JSON.stringify({ code: "Unavailable", message: "SYN search unavailable" }),
  }));
  await expect(navigateToSearch(page, "/search?q=SYN")).rejects.toThrow("/api/v1/search initial read");
  await expect(page.getByText(/results on this page/)).toHaveCount(0);
});
