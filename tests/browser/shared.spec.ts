import { test, expect } from "@playwright/test";
test("P02 diagnostic context, labels, keyboard focus and scoped error state", async ({
  page,
}, info) => {
  await page.goto("/foundation");
  await expect(page.getByText("Synthetic data only")).toBeVisible();
  await page.getByLabel("Demonstration identity").selectOption("coordinator");
  await page.getByRole("button", { name: "Use this identity" }).click();
  const load = page.getByRole("button", { name: "Load shared context" });
  await expect(load).toBeEnabled();
  await load.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(load).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Shared context loaded from PostgreSQL.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("SYN Former Technician", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("SYN restricted finance source note"),
  ).toHaveCount(0);
  await expect(
    page.getByText("SYN unidentified sensor · Identity: Unresolved"),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("P02-shared-context.png"),
    fullPage: true,
  });
  await page.getByLabel("Demonstration identity").selectOption("site-observer");
  await page.getByRole("button", { name: "Use this identity" }).click();
  await load.click();
  await expect(
    page.getByText("Shared context loaded from PostgreSQL.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("SYN Former Technician", { exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByText("SYN Previous Technician", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("P02-site-scope.png"),
    fullPage: true,
  });
  await page.getByLabel("Demonstration identity").selectOption("systems");
  await page.getByRole("button", { name: "Use this identity" }).click();
  await load.click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "required shared-data permission" }),
  ).toBeVisible();
  await expect(
    page.getByText("SYN Previous Technician", { exact: false }),
  ).toHaveCount(0);
  await expect(load).toBeEnabled();
  await load.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(load).toBeFocused();
  await page.screenshot({
    path: info.outputPath("P02-permission-error-focus.png"),
    fullPage: true,
  });
});
