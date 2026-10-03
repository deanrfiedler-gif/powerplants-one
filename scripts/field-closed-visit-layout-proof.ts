// Read-only continuation of the retained compiled Service/return journey.
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { mkdir, readFile, writeFile, mkdtemp } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { localConfig } from "../src/platform/config";

const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const output = resolve(process.argv[2]);
const source = JSON.parse(await readFile(process.argv[3], "utf8"));
const returned = JSON.parse(await readFile(process.argv[4], "utf8"));
await mkdir(output, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), "ppo-closed-visit-layout-"));
const context = await chromium.launchPersistentContext(profile, {
  channel: "chrome",
  headless: true,
  viewport: { width: 1440, height: 1000 },
});
const measurements: unknown[] = [];
try {
  const settings = await context.newPage();
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  async function identity(name: string) {
    const response = await context.request.post(
      config.origin + "/api/v1/local-session",
      {
        headers: { origin: config.origin },
        data: { profile: name },
      },
    );
    assert.equal(response.status(), 200);
  }
  async function inspect(width: number, zoom = false) {
    await identity("second-technician");
    await page.goto(`${config.origin}/my-jobs/${source.appointment_id}`);
    await expect(page.locator(".field-start")).toContainText(
      "Another crew member's attendance is not your attendance",
    );
    await expect(
      page.getByRole("button", { name: "Record my actual start", exact: true }),
    ).toHaveCount(0);
    const region = page.getByRole("region", {
      name: "Further attendance",
      exact: true,
    });
    await expect(region).toBeVisible();
    await expect(
      page.locator('#ppo-work-timer .work > p[role="status"]'),
    ).toHaveCount(0);
    const view = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      dpr: devicePixelRatio,
      scrollWidth: document.documentElement.scrollWidth,
      owners: [...document.querySelectorAll("body *")]
        .filter(
          (e) =>
            e.scrollHeight > e.clientHeight + 1 &&
            ["auto", "scroll"].includes(getComputedStyle(e).overflowY),
        )
        .map((e) => e.id || e.tagName),
    }));
    assert.equal(view.width, width);
    assert.equal(view.scrollWidth, width);
    assert.deepEqual(view.owners, ["main"]);
    if (zoom) assert.equal(view.dpr, 2);
    // In particular, a clock initially below a 320 px viewport must not
    // alternate header compaction and move the content on every frame.
    const positions = await page.locator(".field-start").evaluate(async (e) => {
      const values: number[] = [];
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      for (let i = 0; i < 30; i++) {
        await new Promise(requestAnimationFrame);
        values.push(e.getBoundingClientRect().top);
      }
      return values;
    });
    assert(
      Math.max(...positions) - Math.min(...positions) < 1,
      JSON.stringify({ width, positions }),
    );
    const label = zoom ? "zoom" : String(width);
    await page.locator(".field-start").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output, `closed-${label}.png`) });
    const link = region.getByRole("link", {
      name: "Review work-order visits",
      exact: true,
    });
    await link.scrollIntoViewIfNeeded();
    const reach = await link.evaluate((e) => {
      const b = e.getBoundingClientRect();
      return {
        left: b.left,
        right: b.right,
        top: b.top,
        bottom: b.bottom,
        unobscured: e.contains(
          document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2),
        ),
      };
    });
    assert(
      reach.left >= 0 && reach.right <= width && reach.unobscured,
      JSON.stringify(reach),
    );
    await page.screenshot({ path: join(output, `receiving-${label}.png`) });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(
      new RegExp(
        `/service/work-orders/${source.work_order_id}#planned-visits$`,
      ),
    );
    await expect(
      page.getByText("Propose a visit", { exact: true }),
    ).toHaveCount(0);
    await page.goBack();
    const guide = page.getByRole("button", { name: "Page guide", exact: true });
    await guide.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("dialog", { name: "Page guide", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(guide).toBeFocused();
    await page.goto(`${config.origin}/my-jobs/${returned.appointment_id}`);
    await expect(page.locator(".field-start")).toContainText(
      returned.attendance_id,
    );
    await expect(page.locator(".field-start")).toContainText(
      "Internal Service acceptance",
    );
    await page.locator(".field-start").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: join(output, `own-attendance-${label}.png`),
    });
    measurements.push({
      zoom: zoom ? "200%" : "100%",
      ...view,
      link: reach,
      keyboard:
        "Receiving link Enter; guide Enter/Escape and focus return passed",
      own_attendance: returned.attendance_id,
    });
  }
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    await inspect(width);
  }
  await page.setViewportSize({ width: 1440, height: 1200 });
  await settings.goto("chrome://settings/appearance");
  await settings.locator("#zoomLevel").selectOption("2");
  assert.equal(await settings.locator("#zoomLevel").inputValue(), "2");
  await inspect(720, true);
  await settings.locator("#zoomLevel").selectOption("1");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(config.origin + "/offline/index.html");
  await expect(page.locator("#workspace")).toBeVisible();
  await page
    .getByLabel("Assigned job to download")
    .selectOption(source.appointment_id);
  const download = page.getByRole("button", {
    name: "Download selected job",
    exact: true,
  });
  await download.click();
  // Same explicit download boundary used by the retained P08 journey.
  await expect(download).toBeEnabled({ timeout: 45000 });
  await expect(page.locator("#notice")).toContainText(
    "Job context and exact pack saved",
  );
  await expect(page.getByText(/Cached visit state: Completed\./)).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Save provisional start intent",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Save my pack acknowledgement intent",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByText(/Cached visit state: Completed\./)
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(output, "offline-closed-390.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "geometry.json"),
    JSON.stringify(
      {
        executed_at: new Date().toISOString(),
        head: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        working_tree: execFileSync("git", ["status", "--short"], {
          encoding: "utf8",
        }).trim(),
        compiled_build: (await readFile(".next/BUILD_ID", "utf8")).trim(),
        measurements,
        offline_closed:
          "Downloaded closed original has no new arrival or acknowledgement control; retained P08 replay remains separate.",
        page_errors: errors,
        limits:
          "Technical Chrome inspection; physical-device, screen-reader, owner and independent visual acceptance remain pending.",
      },
      null,
      2,
    ),
  );
  console.log(
    "Four widths, actual Chrome 200% zoom, keyboard receiving links/guide focus return and personal retained attendance passed.",
  );
} finally {
  await context.close();
}
