import { test, expect, type Page } from "@playwright/test";

async function identity(page: Page, profile = "coordinator") {
  await expect(
    page.getByRole("region", {
      name: "Local demonstration identity",
      exact: true,
    }),
  ).toHaveAttribute("aria-busy", "false");
  if (!(await page.getByLabel("Identity", { exact: true }).isVisible()))
    await page
      .getByRole("button", { name: "Change identity", exact: true })
      .click();
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Change identity", exact: true }),
  ).toBeEnabled();
}
async function open(page: Page) {
  await page.goto("/service/technicians");
  await identity(page);
  await page.getByLabel("Visit date", { exact: true }).fill("2026-09-21");
  await expect(
    page.getByRole("table", { name: "Scheduled service visits", exact: true }),
  ).toBeVisible();
}
test("approved field views keep filters, open controlled records and preserve outer padding", async ({
  page,
}, info) => {
  await open(page);
  const root = page.locator("#ppo-field-technicians");
  await expect(root).toHaveCSS(
    "padding-left",
    info.project.name.startsWith("mobile") ? "16px" : "24px",
  );
  const first = page.getByRole("button", { name: /^Open visit:/ }).first();
  const name = await first.getAttribute("aria-label");
  await first.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open full visit", exact: true }),
  ).toHaveAttribute("href", /^\/service\/appointments\//);
  await page.getByRole("tab", { name: "Job pack", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Open job packs", exact: true }),
  ).toHaveAttribute("href", "/service/packs");
  await page.getByRole("tab", { name: "Field notes", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Open My Jobs", exact: true }),
  ).toHaveAttribute("href", "/my-jobs");
  await page
    .getByRole("button", { name: "Close details", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: name!, exact: true }),
  ).toBeFocused();
  await page
    .getByRole("searchbox", { name: "Search visits", exact: true })
    .fill("SYN-no-match-484fb");
  await expect(
    page.getByRole("heading", { name: "No matching results" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /^Technicians/ }).click();
  await expect(
    page.getByRole("table", { name: "Field technicians", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /^Visits/ }).click();
  await expect(
    page.getByRole("searchbox", { name: "Search visits", exact: true }),
  ).toHaveValue("SYN-no-match-484fb");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("failed refresh clears rows and counts; a denied identity hides prior records", async ({
  page,
}) => {
  await open(page);
  await page.route("**/api/v1/schedule?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        message: "SYN unavailable read",
        retryable: true,
      }),
    }),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.locator("#ppo-field-technicians").getByRole("alert"),
  ).toContainText("SYN unavailable read");
  await expect(
    page.getByRole("table", { name: "Scheduled service visits", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Selected day summary")).toContainText("—");
  await page.unroute("**/api/v1/schedule?**");
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^Open visit:/ })
    .first()
    .click();
  await expect(
    page.getByRole("link", { name: "Open full visit", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close details", exact: true })
    .click();
  await identity(page, "systems");
  await expect(
    page.getByRole("table", { name: "Scheduled service visits", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator("#ppo-field-technicians").getByRole("alert"),
  ).toBeVisible();
});
