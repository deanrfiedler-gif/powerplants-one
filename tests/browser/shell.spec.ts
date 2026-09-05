import { test, expect } from "@playwright/test";
test("responsive shell, keyboard focus, server save, read-only refusal and storage feasibility", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A connected view",
  );
  await expect(page.getByText("Synthetic data only")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
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
  await expect(page.getByRole("alert")).toContainText("cannot read");
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
