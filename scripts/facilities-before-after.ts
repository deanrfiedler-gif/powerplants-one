import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const output =
  process.env.PPO_FACILITIES_EVIDENCE ??
  "verification-evidence/facilities-before-after";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const results = [];
try {
  for (const [label, origin] of [
    ["main-af3f045", "http://127.0.0.1:3106"],
    ["candidate", "http://127.0.0.1:3105"],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      locale: "en-AU",
    });
    const login = await page.request.post(`${origin}/api/v1/local-session`, {
      headers: { origin },
      data: { profile: "coordinator" },
    });
    expect(login.status()).toBe(200);
    await page.goto(`${origin}/sites/c5050001-0000-4000-8000-000000000001`);
    await expect(
      page.getByRole("heading", {
        name: "SYN Nursery & propagation",
        exact: true,
      }),
    ).toBeVisible({ timeout: 45000 });
    if (label === "candidate")
      await page
        .getByRole("tab", { name: "Facilities & areas", exact: true })
        .click();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `${output}/${label}-site-1440.png`,
      fullPage: true,
    });
    results.push({
      label,
      route: page.url(),
      dimensions: await page.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    });
    if (label === "candidate") {
      await page.goto(
        `${origin}/equipment/c5050003-0000-4000-8000-000000000001`,
      );
      await expect(
        page.getByRole("heading", { name: /SYN Willowbank irrigation pump/ }),
      ).toBeVisible();
      await page.screenshot({
        path: `${output}/candidate-neighbour-equipment-1440.png`,
        fullPage: true,
      });
    }
    await page.close();
  }
  await writeFile(
    `${output}/manifest.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        browser: browser.version(),
        baseline:
          "unmodified main af3f045; same authored synthetic database; development server",
        candidate:
          "compiled application; browser screenshots are observations, not owner acceptance",
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
