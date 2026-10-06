// Run after field-timer-restart-proof verify against the same synthetic instance.
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localConfig } from "../src/platform/config";
const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const root = "tmp/field-timer-restart";
const proof = JSON.parse(await readFile(`${root}/original.json`, "utf8"));
const profile = await mkdtemp(join(tmpdir(), "ppo-timer-zoom-"));
const context = await chromium.launchPersistentContext(profile, {
  channel: "chrome",
  headless: true,
  viewport: { width: 1440, height: 1200 },
});
try {
  const settings = await context.newPage();
  await settings.goto("chrome://settings/appearance");
  await settings.locator("#zoomLevel").selectOption("2");
  assert.equal(await settings.locator("#zoomLevel").inputValue(), "2");
  const page = await context.newPage();
  assert.equal(
    (
      await context.request.post(config.origin + "/api/v1/local-session", {
        headers: { origin: config.origin },
        data: { profile: "assigned-technician" },
      })
    ).status(),
    200,
  );
  await page.goto(`${config.origin}/my-jobs/${proof.appointment}`);
  const resume = page.getByRole("button", { name: "Resume work", exact: true });
  await expect(resume).toBeEnabled();
  const geometry = await page.evaluate(() => ({
    innerWidth,
    innerHeight,
    devicePixelRatio,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.equal(geometry.innerWidth, 720);
  assert.equal(geometry.devicePixelRatio, 2);
  assert.equal(geometry.scrollWidth, geometry.innerWidth);
  await page.screenshot({ path: `${root}/zoom-page.png` });
  await resume.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Resume work", exact: true });
  await expect(dialog).toBeVisible();
  assert.equal(
    await dialog.evaluate((e) => e.contains(document.activeElement)),
    true,
  );
  const bounds = await dialog.boundingBox();
  assert.ok(
    bounds &&
      bounds.x >= 0 &&
      bounds.x + bounds.width <= geometry.innerWidth + 1,
  );
  await page.screenshot({ path: `${root}/zoom-dialog.png` });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(resume).toBeFocused();
  const result = {
    result: "Passed",
    actual_browser_zoom: "200%",
    physical_viewport: { width: 1440, height: 1200 },
    geometry,
    keyboard:
      "Enter opens the labelled dialog, focus is contained, Escape returns focus",
    limit:
      "Synthetic desktop Chrome; owner, screen-reader and physical-device acceptance remain separate",
  };
  await writeFile(`${root}/zoom.json`, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result));
} finally {
  await context.close();
}
