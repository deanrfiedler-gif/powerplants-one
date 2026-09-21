import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSupportedBrowser } from "../src/platform/browser";
import { localConfig } from "../src/platform/config";
const origin = localConfig().origin,
  profile = await mkdtemp(join(tmpdir(), "pj09-zoom-proof-"));
// This disposable Chrome profile belongs to the proof; the user's Chrome profile is untouched.
const context = await chromium.launchPersistentContext(profile, {
  channel: "chrome",
  headless: true,
  viewport: { width: 1920, height: 1200 },
});
try {
  const settings = await context.newPage();
  await settings.goto("chrome://settings/appearance");
  await settings.locator("#zoomLevel").selectOption("2");
  assert.equal(await settings.locator("#zoomLevel").inputValue(), "2");
  const page = await context.newPage(),
    session = await context.newCDPSession(page),
    version = (await session.send("Browser.getVersion")).product.split("/")[1];
  assertSupportedBrowser(version);
  assert.equal(
    (
      await context.request.post(origin + "/api/v1/local-session", {
        headers: { Origin: origin },
        data: { profile: "coordinator" },
      })
    ).status(),
    200,
  );
  await page.goto(origin + "/projects/acceptance?panel=closed");
  await page.locator(".ac-footer").waitFor();
  const geometry = await page.evaluate(() => ({
    innerWidth,
    innerHeight,
    devicePixelRatio,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.equal(geometry.innerWidth, 960);
  assert.equal(geometry.devicePixelRatio, 2);
  assert.equal(geometry.scrollWidth, geometry.innerWidth);
  await page.screenshot({ path: "tmp/pj09-evidence/200-percent-native.png" });
  await page
    .getByRole("button", { name: "Greenhouse 01 acceptance", exact: true })
    .click();
  await page.locator(".ac-inspector-overlay").waitFor();
  assert(
    await page
      .locator(".ac-inspector-overlay")
      .evaluate((e) => e.contains(document.activeElement)),
  );
  await page.screenshot({
    path: "tmp/pj09-evidence/200-percent-native-inspector.png",
  });
  await page.keyboard.press("Escape");
  await page.locator(".ac-inspector-overlay").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "＋ Acceptance stage", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  await page.screenshot({
    path: "tmp/pj09-evidence/200-percent-native-dialog.png",
  });
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await writeFile(
    "tmp/pj09-evidence/zoom-results.json",
    JSON.stringify(
      {
        origin,
        browser: version,
        chromePageZoom: "200%",
        physicalViewport: { width: 1920, height: 1200 },
        geometry,
        overflow: false,
        inspectorFocusAndEscape: true,
        decisionDialog: true,
        profile: "Disposable proof profile outside the repository",
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: Chrome Page zoom 200%, actual CSS viewport 960×600, no page overflow, inspector and decision dialog usable.",
  );
} finally {
  await context.close();
}
