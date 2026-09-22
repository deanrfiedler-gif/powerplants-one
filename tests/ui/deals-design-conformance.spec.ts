import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { moduleWorkspaces } from "../../src/shell/module-workspaces";
import { assertDealsHost, assertChoiceGeometry } from "../helpers/deals-design";
const register = JSON.parse(
  readFileSync("docs/standards/ui-baselines.json", "utf8"),
);
const baseline = register.module_integrations.find(
  (entry: { id: string }) => entry.id === "deals-r38",
);
const url = (path: string) => pathToFileURL(resolve(path)).href;
test.setTimeout(60000);
test.beforeAll(() => {
  execFileSync(process.execPath, [
    "scripts/build-crm-ui-review.mjs",
    "verification-evidence/crm-r38-five",
    "tests/ui/crm-five-stage-fixture.tsx",
  ]);
});
test.beforeEach(async ({ page }, info) => {
  test.skip(
    info.project.name !== "desktop",
    "This case runs the complete viewport matrix.",
  );
  await page.goto(url("verification-evidence/crm-r38-five/index.html"));
  await expect(page.locator(".crm-card")).toHaveCount(18);
  await page.evaluate(() => document.fonts.ready);
});
test("each adopted module retains sources, a host contract and compiled-app verification", () => {
  for (const workspace of moduleWorkspaces) {
    const entry = register.module_integrations.find(
      (item: { id: string }) => item.id === workspace.baseline,
    );
    expect(entry, `Missing contract for ${workspace.route}`).toBeTruthy();
    expect(entry).toMatchObject({
      route: workspace.route,
      scope: `#${workspace.scope}`,
      layout: workspace.layout,
    });
    for (const [path, hash] of [
      [entry.design, entry.sha256],
      [entry.shared_design, entry.shared_sha256],
    ])
      expect(
        createHash("sha256").update(readFileSync(path)).digest("hex"),
      ).toBe(hash);
    for (const path of [
      entry.component_proof,
      entry.application_proof,
      entry.adaptations,
    ])
      expect(existsSync(path), path).toBe(true);
  }
});
test("r38 geometry agrees with the full-shell application across the viewport matrix", async ({
  page,
  context,
}, info) => {
  const reference = await context.newPage();
  await reference.goto(url(baseline.design));
  await reference.evaluate(() => document.fonts.ready);
  for (const width of [1920, 1440, 1280, 1024, 820, 390, 320]) {
    const viewport = { width, height: width > 780 ? 900 : 844 };
    await page.setViewportSize(viewport);
    await reference.setViewportSize(viewport);
    await assertDealsHost(page);
    const keys = [
      "height",
      "paddingTop",
      "paddingLeft",
      "borderRadius",
    ] as const;
    const actual = await page
      .locator(".crm-card:visible")
      .first()
      .evaluate(
        (n, props) =>
          Object.fromEntries(props.map((k) => [k, getComputedStyle(n)[k]])),
        keys,
      );
    if (width >= 1024) {
      // The reference replaces its cards in a resize animation frame. Resolve
      // and measure the current node atomically instead of holding a stale one.
      const expected = await reference.evaluate((props) => {
        const card = document.querySelector("#ppo-deals .card")!;
        return Object.fromEntries(
          props.map((key) => [key, getComputedStyle(card)[key]]),
        );
      }, keys);
      expect(actual, `Card geometry at ${width}px`).toEqual(expected);
    } else {
      // r38 switches to List below 1024px. The documented app adaptation keeps
      // the Board and, below 781px, its touch stage selector.
      await expect(reference.locator("#ppo-deals .list-scroll")).toBeVisible();
      await expect(page.locator(".crm-board-scroll")).toBeVisible();
      await expect(page.locator(".crm-card:visible")).toHaveCount(width > 780 ? 18 : 4);
    }
    if (width >= 1280)
      for (const [app, source] of [
        [".crm-card-title", ".card-title"],
        [".crm-card-company", ".card-org"],
        [".crm-card-value strong", ".card-value strong"],
      ]) {
        const actualFont = await page
          .locator(app)
          .first()
          .evaluate((n) => ({
            size: getComputedStyle(n).fontSize,
            weight: getComputedStyle(n).fontWeight,
          }));
        expect(actualFont, app).toEqual(
          await reference
            .locator(`#ppo-deals ${source}`)
            .first()
            .evaluate((n) => ({
              size: getComputedStyle(n).fontSize,
              weight: getComputedStyle(n).fontWeight,
            })),
        );
      }
    await page.screenshot({
      path: info.outputPath(`application-${width}.png`),
    });
    await reference.screenshot({
      path: info.outputPath(`reference-${width}.png`),
    });
  }
  await reference.close();
});
test("r22 menus and r38 inspection/forms retain their different behaviours", async ({
  page,
  context,
}, info) => {
  const theme = await context.newPage();
  await theme.goto(url(baseline.shared_design));
  const expected = await theme
    .locator("#ppo-theme-board .dropdown-preview")
    .first()
    .evaluate((n) => ({
      radius: getComputedStyle(n).borderRadius,
      padding: getComputedStyle(n).padding,
    }));
  await page.getByRole("button", { name: "Sort", exact: true }).click();
  await assertChoiceGeometry(page);
  expect(
    await page
      .locator(".crm-r38-popover:popover-open")
      .evaluate((n) => ({
        radius: getComputedStyle(n).borderRadius,
        padding: getComputedStyle(n).padding,
      })),
  ).toEqual(expected);
  await page.keyboard.press("End");
  await expect(
    page.getByRole("menuitemradio", { name: "Newest first" }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("menuitemradio", { name: "Default order" }),
  ).toBeFocused();
  await page.keyboard.press("t");
  await expect(
    page.getByRole("menuitemradio", { name: "Title A–Z" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Sort", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Views", exact: true }).click();
  await assertChoiceGeometry(page);
  await page.screenshot({ path: info.outputPath("r22-views.png") });
  await page.keyboard.press("Escape");
  await page
    .locator('.crm-card-shortcuts button[title="Snapshot"]')
    .first()
    .click();
  const snapshot = page.locator(".crm-deal-dialog.mode-snapshot");
  await expect(
    snapshot.getByRole("link", { name: "Open full deal", exact: true }),
  ).toBeVisible();
  expect(
    await snapshot.evaluate((n) => ({
      modal: n.matches(":modal"),
      radius: getComputedStyle(n).borderRadius,
      width: n.getBoundingClientRect().width,
    })),
  ).toEqual({ modal: false, radius: "0px", width: 448 });
  await expect(
    page.getByRole("button", { name: "Board", exact: true }),
  ).toBeEnabled();
  await page.screenshot({ path: info.outputPath("modeless-snapshot.png") });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Filters and sort", exact: true })
    .click();
  const filter = page.getByRole("dialog", {
      name: "Filter deals",
      exact: true,
    }),
    box = (await filter.boundingBox())!;
  expect(box.y).toBe(0);
  expect(box.height).toBe(page.viewportSize()!.height);
  expect(box.x + box.width / 2).toBe(page.viewportSize()!.width / 2);
  await page.screenshot({ path: info.outputPath("centred-filter-form.png") });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Filters and sort", exact: true }),
  ).toBeFocused();
  await theme.close();
});
test("conformance rejects the original extra frame and wrong menu radius", async ({
  page,
}) => {
  await page.addStyleTag({
    content:
      "#ppo-deals{margin:16px!important;border:1px solid!important;border-radius:10px!important}",
  });
  await expect(assertDealsHost(page)).rejects.toThrow();
  await page.reload();
  await expect(page.locator(".crm-card")).toHaveCount(18);
  await page.getByRole("button", { name: "Views", exact: true }).click();
  await page.addStyleTag({
    content: "#ppo-deals .crm-r38-popover{border-radius:8px!important}",
  });
  await expect(assertChoiceGeometry(page)).rejects.toThrow();
});
