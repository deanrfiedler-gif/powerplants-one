import { test, expect, type Page } from "@playwright/test";
import { createDemand, openDemandPanel, fillProposal } from "../helpers/pl01";

async function enter(page: Page) {
  const session = await page.request.post("/api/v1/local-session", {
    headers: { Origin: `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}` }, data: { profile: "coordinator" },
  });
  expect(session.ok(), await session.text()).toBeTruthy();
  const read = page.waitForResponse(r => new URL(r.url()).pathname === "/api/v1/schedule" && new URL(r.url()).searchParams.has("from"));
  await page.goto("/schedule?day=2031-09-22&view=day");
  const response = await read;
  expect(response.ok(), await response.text()).toBeTruthy();
  const through = new URL(response.url()).searchParams.get("to")!;
  expect(new Date(through).toISOString()).toBe((page.viewportSize()!.width <= 780 ? "2031-09-28" : "2031-09-22") + "T14:00:00.000Z");
  await expect(page.locator('[data-appointment][data-status="Confirmed"]').first()).toBeVisible();
}

for (const width of [1440, 1024, 390, 320]) test(`PL-01 band, tray, selection and phone sheets at ${width}px`, async ({ page }, info) => {
  test.skip(info.project.name.includes("mobile"), "The desktop project executes the full explicit width matrix.");
    await page.setViewportSize({ width, height: width > 780 ? 960 : 844 });
    await enter(page);
    // The tablet reference uses the existing collapsed primary rail.
    if (width === 1024) await page.getByRole("button", { name: "Collapse primary navigation", exact: true }).click();
    const root = page.locator("#ppo-service-planner");
    await expect(root).toHaveAttribute("data-ppo-workspace", "shared");
    await expect(root.locator(".planner-stat-row")).toHaveCount(0);
    if (width <= 780) {
      await page.getByRole("button", { name: /^Needs attention and tray/ }).click();
      await expect(page.getByRole("region", { name: "Needs attention", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "To plan", exact: true })).toBeVisible();
      await page.screenshot({ path: info.outputPath(`PL01-tray-${width}.png`), fullPage: false });
      await page.getByRole("button", { name: /Back to planner/ }).click();
    } else {
      await expect(page.getByRole("region", { name: "Needs attention", exact: true })).toBeVisible();
      if (width === 1024) {
        await expect(page.getByRole("button", { name: /^Expand tray/ })).toBeVisible();
        expect(await page.locator(".pl01-tray").evaluate(e => Math.round(e.getBoundingClientRect().width))).toBe(44);
        await page.screenshot({ path: info.outputPath("PL01-tablet-collapsed.png"), fullPage: false });
        await page.getByRole("button", { name: /^Expand tray/ }).click();
      }
      await expect(page.getByRole("heading", { name: "To plan", exact: true })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`PL01-day-${width}.png`), fullPage: width <= 780 });
    const visit = page.locator('[data-appointment][data-status="Confirmed"]').first();
    await visit.focus(); await visit.press("Enter");
    const details = page.getByRole("complementary", { name: /^Visit details:/ });
    await expect(details).toBeVisible();
    if (width > 780) expect(await page.locator(".pl01-tray").evaluate(e => Math.round(e.getBoundingClientRect().width))).toBe(44);
    await page.screenshot({ path: info.outputPath(`PL01-details-${width}.png`), fullPage: false });
    await details.getByRole("button", { name: "Move or reassign", exact: true }).click();
    const move = page.getByRole("dialog", { name: "Move or reassign", exact: true });
    await expect(move.getByRole("region", { name: "Current and proposed visit" })).toBeVisible();
    await expect(move.getByText(/new customer site readiness confirmation/)).toBeVisible();
    await page.getByRole("button", { name: "Close move", exact: true }).click();
    await details.getByRole("button", { name: "Close visit details", exact: true }).click();

});

for (const width of [1440, 1024, 390, 320]) test(`PL-01 Day to Week keeps the measured read range at ${width}px`, async ({ page }, info) => {
  test.skip(info.project.name.includes("mobile"), "The desktop project executes the explicit width matrix.");
  await page.setViewportSize({ width, height: width > 780 ? 960 : 844 });
  await enter(page);
  if (width === 1024) await page.getByRole("button", { name: "Collapse primary navigation", exact: true }).click();
  // Phone Day already holds the week for its day chips. Only desktop Day must
  // change the read range when switching to Week; do not wait for a fake read.
  const read = width > 780 ? page.waitForResponse(r => new URL(r.url()).pathname === "/api/v1/schedule" && new URL(r.url()).searchParams.has("from")) : null;
  await page.getByRole("button", { name: "Week", exact: true }).click();
  if (read) expect((await read).ok()).toBeTruthy();
  await expect(page.getByRole("region", { name: "Week resource planner", exact: true })).toBeVisible();
  await expect(page.locator('[data-appointment][data-status="Confirmed"]').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath(`PL01-week-${width}.png`), fullPage: width <= 780 });
});

test("PL-01 tray opens the native proposal without reserving or saving a visit", async ({ page }, info) => {
  if (!info.project.name.includes("mobile")) await page.setViewportSize({ width: 1440, height: 960 });
  await enter(page);
  const work = await createDemand(page);
  const scheduleRead = page.waitForResponse(r => new URL(r.url()).pathname === "/api/v1/schedule" && new URL(r.url()).searchParams.has("from"));
  const demandRead = page.waitForResponse(r => new URL(r.url()).pathname === "/api/v1/schedule/demand");
  await page.reload();
  expect((await scheduleRead).ok()).toBeTruthy();
  expect((await demandRead).ok()).toBeTruthy();
  const writes: string[] = [];
  page.on("request", r => { if (r.method() === "POST" && r.url().endsWith(`/service/work-orders/${work.id}/visits`)) writes.push(r.url()); });
  const panel = await openDemandPanel(page, work.id);
  await expect(panel.getByRole("button", { name: "Save proposal", exact: true })).toBeEnabled();
  await fillProposal(page);
  await page.screenshot({ path: info.outputPath("PL01-plan-visit.png"), fullPage: false });
  await panel.getByRole("button", { name: "Close plan visit" }).click();
  expect(writes).toEqual([]);
});

test("PL-01 a timeline drag opens Move this visit without sending a booking command", async ({ page }, info) => {
  if (!info.project.name.includes("mobile")) await page.setViewportSize({ width: 1440, height: 960 });
  test.skip(info.project.name.includes("mobile"), "Phone movement uses the keyboard and button alternative.");
  await enter(page);
  const visit = page.locator('.tl-card[data-status="Confirmed"]').first();
  const lane = visit.locator("xpath=../..");
  const box = (await lane.boundingBox())!;
  const writes: string[] = [];
  page.on("request", r => { if (r.url().includes("/appointments/") && r.method() === "POST") writes.push(r.url()); });
  await visit.dragTo(lane, { targetPosition: { x: box.width * 0.7, y: 24 } });
  const dialog = page.getByRole("dialog", { name: "Move this visit?", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("region", { name: "Current and proposed visit" })).toContainText("Current → Proposed");
  await expect(dialog.getByText(/new customer site readiness confirmation/)).toBeVisible();
  expect(writes).toEqual([]);
  await expect(dialog.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("PL01-drag-comparison.png"), fullPage: false });
  await page.getByRole("button", { name: "Close move", exact: true }).click();
  expect(writes).toEqual([]);
});

test("PL-01 reasonless holds, failed refresh and denied reads never imply a clear planner", async ({ page }, info) => {
  await page.route("**/api/v1/schedule?**", async route => {
    const response = await route.fetch();
    const data = await response.json();
    for (const a of data.items ?? []) { a.dispatch_hold = true; a.dispatch_readiness = null; }
    await route.fulfill({ response, json: data });
  });
  await enter(page);
  const phone = info.project.name.includes("mobile");
  if (phone) await page.getByRole("button", { name: /^Needs attention and tray/ }).click();
  await expect(page.getByRole("region", { name: "Needs attention", exact: true })).toContainText("a reason is not available");
  await page.unroute("**/api/v1/schedule?**");
  await page.route("**/api/v1/schedule?**", route => route.fulfill({ status: 503, json: { code: "DependencyUnavailable", message: "SYN planner unavailable", retryable: true } }));
  await page.getByRole("button", { name: "Refresh planner", exact: true }).click();
  await expect(page.getByRole("region", { name: "Needs attention", exact: true })).toContainText("Current holds are unknown");
  if (phone) await page.getByRole("button", { name: /Back to planner/ }).click();
  await page.locator('[data-appointment][data-status="Confirmed"]').first().click();
  await expect(page.getByRole("complementary", { name: /^Visit details:/ }).getByRole("button", { name: "Move or reassign" })).toHaveCount(0);
  await page.unroute("**/api/v1/schedule?**");
  await page.route("**/api/v1/schedule?**", route => route.fulfill({ status: 403, json: { code: "Forbidden", message: "SYN permission refused" } }));
  await page.getByRole("button", { name: "Refresh planner", exact: true }).click();
  await expect(page.locator('[data-appointment]')).toHaveCount(0);
  await expect(page.locator(".tl-snapshot")).toHaveCount(0);
});
