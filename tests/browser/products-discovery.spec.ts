import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import {
  productFixture,
  productInput,
  productContentFixture,
} from "../helpers/products";
import { createProduct } from "../../src/products/commands";
import { closeDatabase } from "../../src/platform/database";

test.beforeAll(() => {
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
});
test.afterAll(closeDatabase);
test("PD-DISC catalogue filters, exact return, bounded rows and unavailable recovery", async ({
  page,
}, info) => {
  const f = await productFixture();
  const marker = `SYN Discovery ${f.variant.id.slice(0, 8)}`;
  for (let i = 0; i < 22; i++)
    await createProduct(
      f.author.p,
      productInput({
        kind: "Variant",
        parent_id: f.model.id,
        content: productContentFixture({
          title: `${marker} ${String(i).padStart(2, "0")}`,
        }),
      }),
    );
  await page
    .context()
    .addCookies([
      {
        name: "ppo_local_session",
        value: f.author.token,
        url: process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000",
      },
    ]);
  const evidence = "docs/testing/evidence/products-discovery";
  await mkdir(evidence, { recursive: true });
  const observations = [];
  for (const width of info.project.name.includes("desktop")
    ? [1440, 1024]
    : [390, 320]) {
    await page.setViewportSize({ width, height: width === 1024 ? 768 : width <= 780 ? 844 : 900 });
    await page.goto(
      `/products?q=${encodeURIComponent(marker)}&kind=Variant&state=Draft&lifecycle=Supported`,
    );
    await expect(
      page.getByText("22 shown · maximum 100").first(),
    ).toBeAttached();
    const rows = page.locator(
      width > 780 ? ".pd-catalogue-desktop tbody tr" : ".pd-catalogue-phone li",
    );
    await expect(rows).toHaveCount(22);
    if (width >= 1200) {
      const draft = page
        .getByRole("link", { name: "New catalogue draft", exact: true })
        .filter({ visible: true });
      await expect(draft).toHaveCSS("color", "rgb(255, 255, 255)");
    }
    await page.screenshot({ path: `${evidence}/catalogue-${width}.png` });
    if (width === 1440) {
      await page.getByLabel("Record kind", { exact: true }).selectOption("Model");
      await expect(page.getByText("No products match these filters", { exact: true })).toBeVisible();
      await page.getByLabel("Record kind", { exact: true }).selectOption("Variant");
      await expect(rows).toHaveCount(22);
      await page.getByLabel("Publication state", { exact: true }).selectOption("Published");
      await expect(page.getByText("No products match these filters", { exact: true })).toBeVisible();
      await page.getByLabel("Publication state", { exact: true }).selectOption("Draft");
      await expect(rows).toHaveCount(22);
      await page.getByLabel("Lifecycle", { exact: true }).selectOption("Retired");
      await expect(page.getByText("No products match these filters", { exact: true })).toBeVisible();
      await page.getByLabel("Lifecycle", { exact: true }).selectOption("Supported");
      await expect(rows).toHaveCount(22);
    }
    const row = rows.nth(18),
      link = row.getByRole("link");
    await link.scrollIntoViewIfNeeded();
    const top = await page
      .locator(".pd-catalogue-results")
      .evaluate((e) => e.scrollTop);
    const label = await link.innerText();
    await link.click();
    await expect(
      page.getByRole("heading", {
        name: "Product technical workspace",
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await page
      .getByRole("link", { name: "Back to catalogue", exact: true })
      .click();
    await expect(rows).toHaveCount(22);
    await expect(
      page.getByLabel("Search exact identity, model or name"),
    ).toHaveValue(marker);
    await expect(row).toHaveAttribute("data-selected", "true");
    await expect
      .poll(() =>
        page.locator(".pd-catalogue-results").evaluate((e) => e.scrollTop),
      )
      .toBe(top);
    await expect(link).toBeFocused();
    await link.click();
    await expect(
      page.getByRole("heading", {
        name: "Product technical workspace",
        exact: true,
      }),
    ).toBeVisible();
    await page.goBack();
    await expect(row).toHaveAttribute("data-selected", "true");
    await expect(link).toContainText(label.split("\n")[0]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    expect(overflow).toBe(false);
    if (width < 1200) {
      const trigger =
        width <= 780
          ? page.getByRole("button", { name: /^Filters/ })
          : page.getByRole("button", { name: "Show menu", exact: true });
      await trigger.click();
      await expect(
        page.getByRole("dialog", { name: "Products menu" }),
      ).toBeVisible();
      await expect(page.getByLabel("Record kind", { exact: true })).toHaveValue(
        "Variant",
      );
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    await page.screenshot({
      path: `${evidence}/catalogue-return-${width}.png`,
    });
    observations.push({
      width,
      count: 22,
      overflow,
      selected_return: true,
      scroll_return: top,
    });
  }
  await page
    .getByLabel("Search exact identity, model or name")
    .fill(`${marker} absent`);
  await expect(
    page.getByText("No products match these filters", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search exact identity, model or name").fill(marker);
  await expect(page.getByText("22 shown · maximum 100").first()).toBeAttached();
  await page.route("**/api/v1/products?*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "Unavailable",
          message: "SYN temporary unavailable read",
        },
      }),
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Retry loading" }),
  ).toBeVisible();
  await expect(page.locator("[data-product]")).toHaveCount(0);
  await expect(
    page.getByText("No products match these filters", { exact: true }),
  ).toHaveCount(0);
  await page.unroute("**/api/v1/products?*");
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(page.getByText("22 shown · maximum 100").first()).toBeAttached();
  // A different identity cannot inherit the prior selection or return projection.
  await page
    .context()
    .addCookies([
      {
        name: "ppo_local_session",
        value: f.technical.token,
        url: process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000",
      },
    ]);
  await page.reload();
  await expect(page.getByText("22 shown · maximum 100").first()).toBeAttached();
  await expect(page.locator("[data-selected=true]")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "New catalogue draft", exact: true }),
  ).toHaveCount(0);
  await writeFile(
    `${evidence}/${info.project.name}.json`,
    JSON.stringify(
      {
        source: process.env.PPO_SOURCE_HEAD ?? "working tree",
        observations,
        fixture: "synthetic Products discovery",
        stock: "NotConfigured",
        checks:
          "explicit return/reload/browser Back, focus/scroll, menu Escape, empty, unavailable recovery, identity reset",
      },
      null,
      2,
    ) + "\n",
  );
});
