import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { Pack } from "../../src/documents/components/client/job-pack-types";

async function fixture(page: Page) {
  const read = JSON.parse(
    await readFile("tests/fixtures/job-pack-read.json", "utf8"),
  ) as { items: Pack[] };
  const pack = read.items[0],
    revision = pack.revisions.find((r) => r.id === pack.current_revision_id)!;
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
        data: { profile: "coordinator" },
      })
    ).status(),
  ).toBe(200);
  await page.route(`**/api/v1/packs/${pack.id}`, (route) =>
    route.fulfill({ json: read }),
  );
  const open = async () => {
    const ready = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/v1/packs/${pack.id}`) &&
        r.request().method() === "GET" &&
        r.status() === 200,
    );
    await page.goto(`/service/packs/${pack.id}`);
    await ready;
    await expect(page.locator("#jp-panel-pack .jp-paper-section")).toHaveCount(
      9,
    );
  };
  return { pack, revision, open };
}
test("SV05-I6 verified sections retain the exact saved text beside structured content", async ({
  page,
}) => {
  const { revision, open } = await fixture(page);
  await open();
  await expect(page.locator("#s-3")).toContainText("Approved tasks");
  await expect(page.locator("#s-3")).toContainText("Scope limits");
  await expect(
    page.locator("#s-4 dt").filter({ hasText: "Serial" }),
  ).toHaveCount(1);
  await expect(page.locator("#s-4 a[href^='/equipment/']")).toHaveCount(0);
  await expect(page.locator("#s-7 .jp-structured-controls")).toHaveCount(1);
  for (const [key, n] of [
    ["customer_arrangements", 2],
    ["scope", 3],
    ["equipment", 4],
    ["history", 5],
    ["readiness", 7],
    ["site_controls", 8],
    ["completion", 9],
  ] as const) {
    const section = page.locator(`#s-${n}`),
      details = section.locator("details.jp-exact");
    await details.locator("summary").click();
    await expect(details.locator("p")).toHaveText(
      revision.snapshot.sections[key].text,
    );
    await expect(section).toContainText(revision.snapshot.sections[key].notes);
    await details.locator("summary").click();
  }
});
test("SV05-I6 unavailable or nonmatching scope falls back to the frozen section", async ({
  page,
}) => {
  const { pack, revision, open } = await fixture(page);
  pack.section_view!.scope!.summary =
    "SYN later live summary that must not replace saved text";
  await open();
  await expect(page.locator("#s-3 details")).toHaveCount(0);
  await expect(page.locator("#s-3")).toContainText(
    revision.snapshot.sections.scope.text,
  );
  await expect(page.locator("#s-3")).not.toContainText(
    "SYN later live summary",
  );
  pack.section_view = null;
  await open();
  for (const n of [3, 4, 5, 9])
    await expect(page.locator(`#s-${n} details`)).toHaveCount(0);
  await expect(page.locator("#s-2 details")).toHaveCount(1);
});
test("SV05-I6 structured fields wrap at all shell widths and exact text works by keyboard", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop-chromium",
    "One six-viewport proof across shell breakpoints",
  );
  const { open } = await fixture(page);
  await open();
  for (const [width, height] of [
    [1440, 960],
    [1024, 768],
    [820, 800],
    [770, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewportSize({ width, height });
    const summary = page.locator("#s-3 details summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#s-3 details")).toHaveAttribute("open", "");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const bounds = await page.locator("#s-3").boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    await page
      .locator("#s-3")
      .screenshot({ path: info.outputPath(`structured-scope-${width}.png`) });
    await summary.focus();
    await page.keyboard.press("Enter");
  }
});
