import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  jobPackViewports,
  assertJobPackHost,
} from "../helpers/job-pack-design";
import { openSecondaryMenu } from "../helpers/phone-menu";
const url = (name: string) =>
  pathToFileURL(resolve(`verification-evidence/${name}/index.html`)).href;
test.setTimeout(120000);
test.beforeAll(() => {
  for (const [name, entry, route] of [
    [
      "job-pack-figma-record",
      "job-pack-fixture",
      "/service/packs/10000000-0000-4000-8000-000000000001",
    ],
    ["job-pack-figma-register", "job-pack-register-fixture", "/service/packs"],
  ]) {
    execFileSync(process.execPath, [
      "scripts/build-crm-ui-review.mjs",
      `verification-evidence/${name}`,
      `tests/ui/${entry}.tsx`,
      route,
    ]);
  }
});
test.beforeEach(({}, info) =>
  test.skip(
    info.project.name !== "desktop",
    "One project exercises the whole responsive matrix.",
  ),
);

test("Figma record owns one scroll surface, remembers its panels, and keeps all nine sections at six widths", async ({
  page,
}) => {
  await page.goto(url("job-pack-figma-record"));
  await expect(page.locator("#jp-panel-pack .jp-paper-section")).toHaveCount(9);
  await expect(page.locator(".jp-heading-actions > .jp-primary")).toHaveText(
    "Review changed sources",
  );
  await page
    .getByRole("button", { name: "Collapse status panel", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Expand status panel", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Expand status panel", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Expand status panel", exact: true })
    .click();
  await page.getByRole("tab", { name: "Job pack", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#jp-panel-prepare")).toBeVisible();
  await page.getByRole("tab", { name: "Job pack", exact: true }).click();
  for (const viewport of jobPackViewports) {
    await page.setViewportSize(viewport);
    await assertJobPackHost(page);
  }
  await page.getByRole("tab", { name: "Readiness", exact: true }).click();
  await expect(page.locator(".jp-readiness-group").first()).toBeVisible();
  await expect(page.locator("#jp-panel-pack .jp-main-column")).toBeHidden();
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(page.locator("#jp-panel-revisions")).toBeVisible();
  await page.getByRole("tab", { name: "Pack", exact: true }).click();
  await expect(page.locator("#s-1")).toBeVisible();
  // The phone header's view chooser opens the Job packs menu (phone header amendment P2).
  await openSecondaryMenu(page);
  await page.getByRole("tab", { name: "Preparation", exact: true }).click();
  await expect(page.locator("#jp-panel-prepare")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Job packs menu", exact: true }),
  ).toBeHidden();
});

test("register views, columns, inspection and selection operate without offering bulk issue", async ({
  page,
}) => {
  await page.goto(url("job-pack-figma-register"));
  await expect(page.locator(".jpr-count")).toHaveText("6 job packs");
  // Visual contract: shared controls must be included by the fixture, and global button colours
  // must not turn navigation white or render pack references as filled primary actions.
  await expect(page.getByRole("button", { name: /Prepared by me/ })).toHaveCSS(
    "color",
    "rgb(36, 42, 55)",
  );
  await expect(page.locator(".ppo-register-caption")).toHaveCSS("width", "1px");
  await expect(page.locator(".jpr-reference").first()).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".jpr-group th").first()).toHaveCSS(
    "text-align",
    "left",
  );
  await page.getByRole("button", { name: /Readiness not satisfied/ }).click();
  await expect(page.locator(".jpr-count")).toHaveText("1 job pack");
  await page.getByRole("button", { name: /All job packs/ }).click();
  await page
    .getByRole("checkbox", { name: "Select all displayed job packs" })
    .check();
  const selected = page.getByRole("region", { name: "Selected job packs" });
  await expect(selected).toContainText("6 selected");
  await expect(selected.getByRole("button")).toHaveText([
    "Open in sequence",
    "Export list",
    "Clear selection",
  ]);
  const downloaded = page.waitForEvent("download");
  await selected.getByRole("button", { name: "Export list" }).click();
  expect((await downloaded).suggestedFilename()).toBe("job-packs.csv");
  await selected.getByRole("button", { name: "Open in sequence" }).click();
  const modal = page.getByRole("dialog", { name: /SYN-PPO-PACK/ });
  await expect(modal).toBeVisible();
  await modal.getByRole("tab", { name: "Crew", exact: true }).click();
  await expect(
    modal.getByRole("tabpanel", { name: "Crew", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await selected.getByRole("button", { name: "Clear selection" }).click();
  await page.getByRole("button", { name: "Column settings" }).click();
  await page
    .getByRole("dialog", { name: "Column settings" })
    .getByLabel("Customer", { exact: true })
    .uncheck();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("columnheader", { name: "Customer", exact: true }),
  ).toHaveCount(0);
});

test("phone register uses the compact list and filters with no horizontal page overflow; denied refresh clears rows", async ({
  page,
}) => {
  await page.goto(url("job-pack-figma-register"));
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator(".jpr-phone-list>a")).toHaveCount(6);
    await expect(page.locator(".jpr-desktop")).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole("button", { name: "Filter job packs", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Filter job packs", exact: true })
    .getByLabel("Site", { exact: true })
    .selectOption("second-site");
  await page.keyboard.press("Escape");
  await expect(page.locator(".jpr-phone-list>a")).toHaveCount(1);
  await page.goto(url("job-pack-figma-register") + "?denied=1");
  await expect(page.locator(".jpr-phone-list>a")).toHaveCount(0);
});
