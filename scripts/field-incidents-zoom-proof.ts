import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { localConfig } from "../src/platform/config";
const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const root = resolve(process.argv[2]),
  proof = JSON.parse(await readFile(join(root, "original.json"), "utf8"));
const profile = await mkdtemp(join(tmpdir(), "ppo-fi06-zoom-"));
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
  const r = await context.request.post(
    config.origin + "/api/v1/local-session",
    { headers: { origin: config.origin }, data: { profile: "coordinator" } },
  );
  assert.equal(r.status(), 200);
  const page = await context.newPage();
  await page.goto(
    `${config.origin}/service/incidents/${proof.journey.incident}`,
  );
  await expect(
    page.getByRole("heading", {
      name: "Original report and retained history",
      exact: true,
    }),
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
  await page.screenshot({
    path: join(root, "zoom-record.png"),
    fullPage: true,
  });
  await settings.locator("#zoomLevel").selectOption("1");
  const widths = [];
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "Original report and retained history",
        exact: true,
      }),
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
    await page.locator("#main").evaluate((e) => {
      e.scrollTop = 0;
    });
    await page.screenshot({ path: join(root, `record-${width}.png`) });
    await page
      .getByRole("heading", { name: "Retained evidence", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(root, `evidence-${width}.png`) });
    widths.push(view);
  }
  const outputPage = await context.newPage();
  await outputPage.setViewportSize({ width: 1440, height: 1000 });
  await outputPage.goto(
    `${config.origin}/api/v1/service/incidents/${proof.journey.incident}/files?output_id=${proof.journey.output}`,
  );
  await expect(
    outputPage.getByRole("heading", {
      name: "Scoped incident outcome",
      exact: true,
    }),
  ).toBeVisible();
  await outputPage.screenshot({ path: join(root, "outcome-1440.png") });
  const operational = proof.snapshot.view.evidence.find(
    (e: { audience: string }) => e.audience === "Operational",
  );
  assert.ok(operational);
  await outputPage.goto(
    `${config.origin}/api/v1/service/incidents/${proof.journey.incident}/files?evidence_id=${operational.id}`,
  );
  await expect(outputPage.locator("body")).toContainText(
    "SYN corrected external observation",
  );
  await outputPage.screenshot({
    path: join(root, "original-evidence-1440.png"),
  });
  await writeFile(
    join(root, "zoom.json"),
    JSON.stringify(
      {
        result:
          "Passed actual Chrome 200% zoom, keyboard guide and focus return",
        geometry,
        widths,
        limit:
          "Desktop emulator; human screen-reader, physical-device and owner visual acceptance pending",
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await context.close();
}
