import {
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function assertFertigationHost(page: Page) {
  await expect(page.locator("#ppo-fertigation")).toHaveAttribute(
    "data-module-layout",
    "full-bleed",
  );
  await expect(page.locator("#ppo-fertigation h1")).toHaveCount(1);
  await expect(
    page.locator(
      "#ppo-fertigation iframe, #ppo-fertigation .standalone-masthead",
    ),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

export async function compareFertigationDesign(
  page: Page,
  context: BrowserContext,
  info: TestInfo,
) {
  const reference = await context.newPage();
  try {
    await reference.goto(
      pathToFileURL(
        resolve("reference/ui/priva-fertigation-scoping-workbench-r02.html"),
      ).href,
    );
    const theme = await context.newPage();
    try {
      await theme.goto(
        pathToFileURL(
          resolve(
            "docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html",
          ),
        ).href,
      );
      await expect(theme.locator("body")).toBeVisible();
      await theme.screenshot({
        path: info.outputPath("fertigation-independent-r22.png"),
      });
    } finally {
      await theme.close();
    }
    const referencePrimary = reference.locator(".btn.primary:visible").first();
    const nativePrimary = page
      .locator("#ppo-fertigation .fn-primary:visible")
      .first();
    const properties = ["backgroundColor", "borderRadius", "color"] as const;
    const expected = await referencePrimary.evaluate(
      (element, keys) =>
        Object.fromEntries(
          keys.map((key) => [key, getComputedStyle(element)[key]]),
        ),
      properties,
    );
    const actual = await nativePrimary.evaluate(
      (element, keys) =>
        Object.fromEntries(
          keys.map((key) => [key, getComputedStyle(element)[key]]),
        ),
      properties,
    );
    expect(actual).toEqual(expected);
    await reference.screenshot({
      path: info.outputPath("fertigation-independent-r02.png"),
    });
    await assertFertigationHost(page);
    // A second module masthead is the explicit negative control; it must be detected.
    await page.locator("#ppo-fertigation").evaluate((element) => {
      const duplicate = document.createElement("h1");
      duplicate.dataset.negativeControl = "true";
      duplicate.textContent = "Duplicate module masthead";
      element.append(duplicate);
    });
    expect(await page.locator("#ppo-fertigation h1").count()).toBe(2);
    await page
      .locator("[data-negative-control]")
      .evaluate((element) => element.remove());
    await assertFertigationHost(page);
  } finally {
    await reference.close();
  }
}
