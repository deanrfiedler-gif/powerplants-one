import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  jobPackDesign,
  jobPackViewports,
  jobPackTokens,
  jobPackTokenNames,
  assertJobPackHost,
} from "../helpers/job-pack-design";
const url = (path: string) => pathToFileURL(resolve(path)).href;
test.setTimeout(90000);
test.beforeAll(() =>
  execFileSync(process.execPath, [
    "scripts/build-crm-ui-review.mjs",
    "verification-evidence/job-pack-ui",
    "tests/ui/job-pack-fixture.tsx",
    "/service/packs/10000000-0000-4000-8000-000000000001",
  ]),
);
test.beforeEach(async ({ page }, info) => {
  test.skip(
    info.project.name !== "desktop",
    "One project runs the full viewport matrix.",
  );
  await page.goto(url("verification-evidence/job-pack-ui/index.html"));
  await expect(page.locator("#jp-panel-pack .jp-paper-section")).toHaveCount(9);
});
test("SV05-I5 actual components retain all r03 tokens and the shell fits six widths", async ({
  page,
  context,
}) => {
  const reference = await context.newPage();
  await reference.goto(url(jobPackDesign));
  expect(jobPackTokenNames).toHaveLength(41);
  expect(await jobPackTokens(page)).toEqual(await jobPackTokens(reference));
  for (const viewport of jobPackViewports) {
    await page.setViewportSize(viewport);
    await assertJobPackHost(page);
  }
  await reference.close();
});
test("SV05-I5 print releases the shell and prints saved sections even from Preparation", async ({
  page,
}) => {
  await page.getByRole("tab", { name: /^Preparation/ }).click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#jp-panel-prepare")).toBeHidden();
  await expect(page.locator("#jp-panel-pack")).toBeVisible();
  await expect(page.locator(".jp-print-warning")).toContainText(
    "saved revision only",
  );
  await expect(page.locator("#s-9")).toBeVisible();
  await expect(page.locator(".mobile-navigation")).toBeHidden();
  expect(
    await page
      .locator("#ppo-job-pack")
      .evaluate((n) => ({
        overflow: getComputedStyle(n).overflowY,
        unclipped: n.clientHeight >= n.scrollHeight,
      })),
  ).toEqual({ overflow: "visible", unclipped: true });
});
