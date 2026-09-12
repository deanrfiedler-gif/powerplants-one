import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const fixture = pathToFileURL(
  resolve("verification-evidence/crm-ui/index.html"),
).href;

test("hosted header, populated board, filtering and independent card targets", async ({
  page,
}, info) => {
  await page.goto(fixture);
  await expect(page.locator(".crm-card:visible")).toHaveCount(
    info.project.name === "desktop" ? 8 : 4,
  );
  await expect(page.locator(".crm-worklist-stamp")).toContainText(
    "$538,500.50 known · 1 not estimated",
  );
  if (info.project.name === "desktop") await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
  if (info.project.name === "desktop") await page.keyboard.press("Escape");
  await expect(
    page.getByLabel("Search opportunities", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Synthetic data only", { exact: true })).toBeVisible();
  const geometry = await page.evaluate(() => {
    const header = document.querySelector(".topbar")!.getBoundingClientRect();
    const account = document
      .querySelector(".identity-hosted")!
      .getBoundingClientRect();
    const search = document
      .querySelector(".crm-header-search")!
      .getBoundingClientRect();
    const heading = document.querySelector<HTMLElement>(".product-heading")!;
    const headingBounds = heading.getBoundingClientRect();
    const rail = document.querySelector(".sidebar")!;
    const cards = [...document.querySelectorAll(".crm-card")].filter(
      (e) => e.getBoundingClientRect().width > 0,
    );
    return {
      pageFits: document.documentElement.scrollWidth <= innerWidth,
      railFits: rail.scrollWidth <= rail.clientWidth,
      headingFits:
        heading.scrollWidth <= heading.clientWidth &&
        headingBounds.width >= 100 &&
        headingBounds.top >= header.top &&
        headingBounds.top < search.bottom,
      accountInside:
        account.top >= header.top &&
        account.bottom <= header.bottom &&
        account.right <= header.right,
      noOverlap:
        search.right <= account.left ||
        search.bottom <= account.top ||
        search.top >= account.bottom,
      cardHeights: cards.map((e) => e.getBoundingClientRect().height),
    };
  });
  expect(geometry.pageFits).toBe(true);
  expect(geometry.headingFits).toBe(true);
  expect(geometry.accountInside).toBe(true);
  expect(geometry.noOverlap).toBe(true);
  if (info.project.name === "desktop") expect(geometry.railFits).toBe(true);
  expect(new Set(geometry.cardHeights).size).toBe(1);
  expect(geometry.cardHeights[0]).toBeLessThan(290);
  await expect(page.locator(".crm-stage-heading:visible")).toHaveCount(
    info.project.name === "desktop" ? 2 : 1,
  );
  await page.screenshot({ path: info.outputPath("populated-board.png") });
  await page.getByLabel("Sort", { exact: true }).selectOption("Title");
  await expect(page.locator(".crm-card:visible").first()).toContainText(
    "Automated fertigation system",
  );
  await page.getByLabel("Sort", { exact: true }).selectOption("Reference");
  await expect(page.locator(".crm-card:visible").first()).toContainText(
    "Glasshouse climate control upgrade",
  );
  const card = page.locator(".crm-card:visible").first();
  await expect(card.locator(".crm-card-close")).toContainText("30 Oct 2026");
  await expect(card.locator(".crm-card-activity")).toHaveAttribute(
    "aria-haspopup",
    "dialog",
  );
  await expect(card.locator(".crm-card-activity")).toHaveAttribute(
    "draggable",
    "false",
  );
  // The activity strip opens a snapshot instead of navigating away. The full
  // activity stays reachable from the snapshot, one action further on.
  await card.locator(".crm-card-activity").click();
  await expect(
    page.getByRole("link", { name: "Open full activity", exact: true }),
  ).toHaveAttribute("href", /^\/work\//);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("link", { name: "Open full activity", exact: true }),
  ).toBeHidden();
  if (info.project.name === "desktop") {
    await card.locator(".crm-card-body").click();
    await expect(
      page.getByRole("heading", { name: "Deal summary", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open full deal" }),
    ).toHaveAttribute("href", /^\/crm\/opportunities\//);
    await page.keyboard.press("Escape");
    await expect(card.locator(".crm-card-body")).toBeFocused();
  } else await expect(card).toHaveAttribute("draggable", "false");
  await page
    .getByLabel("Search opportunities", { exact: true })
    .fill("Glasshouse");
  await expect(page.locator(".crm-worklist-stamp")).toContainText(
    "1 opportunity",
  );
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(
    page.getByLabel("Search opportunities", { exact: true }),
  ).toHaveValue("Glasshouse");
  await page.getByRole("button", { name: "Board", exact: true }).click();
  await page
    .getByRole("button", { name: "Filters and sort", exact: true })
    .click();
  await expect(page.getByLabel("Stage", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Filters and sort", exact: true })
    .click();
  await page
    .getByLabel("Search opportunities", { exact: true })
    .fill("no matching records");
  await expect(page.locator(".crm-worklist-stamp")).toContainText(
    "0 opportunities",
  );
  await expect(page.locator(".crm-board-scroll")).toBeVisible();
  await expect(page.locator(".crm-workspace > .empty-state")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("empty-board.png") });
  await page.getByLabel("Search opportunities", { exact: true }).fill("denied");
  await expect(page.locator(".crm-workspace > .business-error")).toBeVisible();
  await expect(
    page.getByLabel("Search opportunities", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".crm-card")).toHaveCount(0);
});

test("local identity remains reachable in the shared header", async ({
  page,
}, info) => {
  await page.goto(fixture + "?mode=local");
  await expect(
    page.getByRole("button", { name: "Change identity", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Change identity", exact: true })
    .click();
  await expect(page.getByLabel("Identity", { exact: true })).toBeVisible();
  const bounds = await page.locator(".identity-controls").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
    info.project.use.viewport!.width,
  );
  await page.screenshot({ path: info.outputPath("local-identity.png") });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Change identity", exact: true }),
  ).toBeFocused();
});
