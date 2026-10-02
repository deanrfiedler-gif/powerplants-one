import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { mkdir, readFile, writeFile, mkdtemp } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { localConfig } from "../src/platform/config";
const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const root = resolve(process.argv[2]),
  journey = JSON.parse(await readFile(process.argv[3], "utf8"));
await mkdir(root, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), "ppo-fi07-zoom-"));
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
  assert.equal(
    (
      await context.request.post(config.origin + "/api/v1/local-session", {
        headers: { origin: config.origin },
        data: { profile: "coordinator" },
      })
    ).status(),
    200,
  );
  const page = await context.newPage();
  await page.goto(config.origin + "/service/reports/" + journey.report);
  await expect(
    page.getByRole("heading", { name: "Response history", exact: true }),
  ).toBeVisible();
  const geometry = await page.evaluate(() => ({
    innerWidth,
    innerHeight,
    devicePixelRatio,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.equal(geometry.innerWidth, 720);
  assert.equal(geometry.devicePixelRatio, 2);
  assert.equal(geometry.scrollWidth, 720);
  const guide = page.getByRole("button", { name: "Page guide", exact: true });
  await guide.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Page guide", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: join(root, "zoom-guide.png") });
  await page.keyboard.press("Escape");
  await expect(guide).toBeFocused();
  await page.screenshot({ path: join(root, "zoom-record.png") });
  await page.locator("#present-" + journey.issued).click();
  await expect(
    page.getByRole("heading", {
      name: "Customer report presentation",
      exact: true,
    }),
  ).toBeFocused();
  await page.screenshot({ path: join(root, "zoom-presentation.png") });
  await settings.locator("#zoomLevel").selectOption("1");
  const widths = [];
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    await page.goto(config.origin + "/service/reports/" + journey.report);
    await expect(
      page.getByRole("heading", { name: "Response history", exact: true }),
    ).toBeVisible();
    const view = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      owners: [...document.querySelectorAll("body *")]
        .filter(
          (e) =>
            e.scrollHeight > e.clientHeight + 1 &&
            ["auto", "scroll"].includes(getComputedStyle(e).overflowY),
        )
        .map((e) => e.id || e.tagName),
    }));
    assert.equal(view.scrollWidth, width);
    assert.deepEqual(view.owners, ["main"]);
    await page.screenshot({ path: join(root, "record-" + width + ".png") });
    await page.locator("#present-" + journey.issued).click();
    const frame = page.frameLocator(
      'iframe[title="Exact customer-safe report presentation"]',
    );
    await expect(
      frame.getByRole("heading", {
        name: "Customer service report",
        exact: true,
      }),
    ).toBeVisible();
    const evidence = await frame
      .locator("html")
      .evaluate((e) => ({
        width: e.clientWidth,
        scrollWidth: e.scrollWidth,
        scrollHeight: e.scrollHeight,
        viewportHeight: innerHeight,
      }));
    assert(evidence.scrollWidth <= evidence.width, JSON.stringify(evidence));
    assert(
      evidence.scrollHeight <= evidence.viewportHeight + 1,
      JSON.stringify(evidence),
    );
    await page.screenshot({
      path: join(root, "presentation-" + width + ".png"),
    });
    await page
      .getByRole("heading", { name: "Record customer response", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(root, "response-" + width + ".png") });
    const save = page.getByRole("button", { name: "Save response to presented content", exact: true });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeInViewport();
    const reachability = await save.evaluate(e => {
      const box = e.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, viewport: innerHeight, unobscured: document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2) === e };
    });
    assert(reachability.unobscured, JSON.stringify(reachability));
    await page.screenshot({ path: join(root, "response-save-" + width + ".png") });
    widths.push({ ...view, evidence, reachability });
  }
  await writeFile(
    join(root, "zoom.json"),
    JSON.stringify(
      {
        executed_at: new Date().toISOString(),
        geometry,
        widths,
        result:
          "Actual Chrome 200% zoom, guide keyboard/focus return and 1440/1024/390/320 exact presentation geometry",
        acceptance:
          "Physical-device, screen-reader and independent visual/owner acceptance pending",
      },
      null,
      2,
    ),
  );
} finally {
  await context.close();
}
