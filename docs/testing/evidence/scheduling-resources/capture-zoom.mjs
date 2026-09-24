// Manual synthetic-only Chrome zoom evidence. Start the compiled local launcher first.
// Native zoom preference: Chromium ChromeZoomLevelPrefs, default partition x.
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const origin = "http://127.0.0.1:" + (process.env.PPO_PORT ?? "3000"),
  out = "docs/testing/evidence/scheduling-resources/images";
await mkdir(out, { recursive: true });
const profile = "tmp/scheduling-200-percent";
await mkdir(profile + "/Default", { recursive: true });
await writeFile(
  profile + "/Default/Preferences",
  JSON.stringify({
    partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } },
  }),
);
const browser = await chromium.launchPersistentContext(profile, {
  channel: "chrome",
  headless: true,
  viewport: null,
  args: ["--window-size=1440,960", "--force-device-scale-factor=1"],
});
const records = [];
try {
  const page = await browser.newPage();
  const cdp = await browser.newCDPSession(page);
  const capture = async (path) => {
    const result = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    await writeFile(path, Buffer.from(result.data, "base64"));
  };
  const session = await browser.request.post(origin + "/api/v1/local-session", {
    headers: { Origin: origin },
    data: { profile: "coordinator" },
  });
  if (!session.ok()) throw Error("Synthetic identity failed");
  for (const [name, path, detail] of [
    ["planner", "/schedule?day=2031-09-22", "Unassigned demand"],
    [
      "resource",
      "/service/technicians/a4000000-0000-4000-8000-000000000001?day=2031-09-22",
      "Competence & evidence",
    ],
    [
      "changes",
      "/schedule/changes?day=2031-09-22&appointment_id=a8000000-0000-4000-8000-000000000001",
      "Owned follow-up",
    ],
    ["travel", "/schedule/travel?day=2031-09-22", ""],
    ["capacity", "/schedule/capacity?day=2031-09-22", "Scenario comparison"],
  ]) {
    await page.goto(origin + path);
    if (name === "planner")
      await page
        .getByText(
          "Complete permitted result within this date/site/resource filter",
          { exact: false },
        )
        .waitFor({ timeout: 30000 });
    else
      await page
        .locator(".scheduling-workspace .read-meta")
        .filter({ hasText: /Read at|Snapshot/ })
        .first()
        .waitFor({ timeout: 30000 });
    const metrics = await page.evaluate(() => ({
      innerWidth,
      innerHeight,
      outerWidth,
      outerHeight,
      pixelRatio: devicePixelRatio,
      scale: visualViewport.scale,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    if (metrics.pixelRatio !== 2 || metrics.scale !== 1 || metrics.overflow)
      throw Error("Zoom or overflow proof failed: " + name);
    await capture(out + "/" + name + "-200-percent.png");
    if (detail) {
      await page
        .getByRole("heading", { name: detail, exact: true })
        .evaluate((e) => e.scrollIntoView({ block: "start" }));
      await capture(out + "/" + name + "-200-percent-detail.png");
    }
    records.push({ name, path, ...metrics });
  }
  await writeFile(
    "tmp/zoom-evidence.json",
    JSON.stringify(records, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
const normal = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await normal.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto(
    pathToFileURL(
      resolve(
        "docs/reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html",
      ),
    ).href,
  );
  await page.screenshot({ path: out + "/retained-reference-1440x960.png" });
} finally {
  await normal.close();
}
console.log(JSON.stringify({ zoom: 200, pages: records.length, records }));
