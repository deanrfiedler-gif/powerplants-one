import { test, expect, type Request } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { keyActivate } from "../helpers/quality-keyboard";

test("desktop and phone preserve exact shell navigation and Back with the baseline prefetch policy", async ({ page, isMobile }, info) => {
  const origin = new URL(info.project.use.baseURL!).origin;
  expect((await page.request.post("/api/v1/local-session", { headers: { Origin: origin }, data: { profile: "coordinator" } })).status()).toBe(200);
  const requests: { path: string; prefetch: boolean }[] = [];
  const observe = (request: Request) => {
    const headers = request.headers();
    requests.push({ path: new URL(request.url()).pathname, prefetch: headers["next-router-prefetch"] === "1" || headers["next-router-segment-prefetch"] !== undefined || /prefetch/i.test(headers.purpose ?? headers["sec-purpose"] ?? "") });
  };
  page.on("request", observe);
  await page.goto("/customers?department=sales");
  await expect(page.getByRole("heading", { name: "Organisations", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "More", exact: true }).click();
  const menu = page.getByRole("navigation", { name: isMobile ? "All modules" : "More navigation", exact: true });
  const link = menu.getByRole("link", { name: "People", exact: true });
  await expect(link).toBeVisible();
  if (!isMobile) await link.hover();
  const destinations = new Set(await page.locator(isMobile ? ".mobile-navigation a" : "[data-shell-navigation] a").evaluateAll(links => links.map(link => new URL((link as HTMLAnchorElement).href).pathname)));
  const sharedDestinations = new Set(await page.locator(".ppo-shell-header a:visible, .module-navigation a:visible").evaluateAll(links => links.map(link => new URL((link as HTMLAnchorElement).href).pathname)));
  // Fixed observation of background work; this does not change a readiness deadline.
  await page.waitForTimeout(1000);
  page.off("request", observe);
  const speculative = requests.filter(request => request.prefetch && destinations.has(request.path) && !sharedDestinations.has(request.path));
  await writeFile(info.outputPath("shell-requests.json"), JSON.stringify({ viewport: page.viewportSize(), destinations: [...destinations], shared_destinations: [...sharedDestinations], requests, speculative }, null, 2));
  // The prefetch trials did not establish a performance improvement. Preserve
  // the baseline policy on both viewports and retain observations without
  // imposing a speculative-request count as a navigation requirement.
  const target = new URL((await link.getAttribute("href"))!, origin);
  if (!isMobile) {
    expect(destinations.has(target.pathname)).toBe(true);
    expect(sharedDestinations.has(target.pathname)).toBe(false);
  }
  if (isMobile) await link.tap(); else await keyActivate(page, link);
  await expect(page).toHaveURL(target.href);
  await expect(page.getByRole("heading", { name: "People", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(`${origin}/customers?department=sales`);
  await expect(page.getByRole("heading", { name: "Organisations", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("shell-customers.png") });
});

// F13 / UXB-75 (Q04 budget): the server renders the rail at the width this browser last
// showed, so the workspace does not move when the shell context arrives after hydration.
test("F13 desktop rail keeps its first-paint width and layout shift stays under 0.1", async ({ page, isMobile }, info) => {
  test.skip(isMobile, "The primary rail is a desktop control; the phone shell has no rail to widen.");
  const origin = new URL(info.project.use.baseURL!).origin;
  await page.setViewportSize({ width: 1440, height: 900 });
  // From the first frame: every distinct rail width, and every layout shift without input.
  await page.addInitScript(() => {
    const probe = { widths: [] as number[], shift: 0 };
    (window as unknown as { railProbe: typeof probe }).railProbe = probe;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[])
        if (!entry.hadRecentInput) probe.shift += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
    const sample = () => {
      const rail = document.querySelector(".ppo-rail");
      const width = rail && Math.round(rail.getBoundingClientRect().width);
      if (width && probe.widths.at(-1) !== width) probe.widths.push(width);
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  expect((await page.request.post("/api/v1/local-session", { headers: { Origin: origin }, data: { profile: "coordinator" } })).status()).toBe(200);
  const measurements: { path: string; rail: string; widths: number[]; shift: number }[] = [];
  for (const [rail, width, toggle] of [["expanded", 240, "Collapse primary navigation"], ["compact", 76, "Expand primary navigation"]] as const) {
    for (const path of ["/work", "/customers", "/projects", "/service/work-orders", "/schedule"]) {
      await page.goto(path);
      await expect(page.getByRole("button", { name: toggle, exact: true })).toBeEnabled();
      // The page's own reads settle too, so a shift from arriving content is counted.
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
      const probe = await page.evaluate(() => (window as unknown as { railProbe: { widths: number[]; shift: number } }).railProbe);
      measurements.push({ path, rail, ...probe });
      // Soft, so one run records every page before reporting.
      expect.soft(probe.widths, `${path} rail width from first paint (${rail})`).toEqual([width]);
      expect.soft(probe.shift, `${path} cumulative layout shift (${rail})`).toBeLessThan(0.1);
    }
    // The choice persists for this identity; the next documents render at the new width.
    if (rail === "expanded") await page.getByRole("button", { name: toggle, exact: true }).click();
  }
  await writeFile(info.outputPath("rail-first-paint.json"), JSON.stringify(measurements, null, 2));
});

// F13 follow-up: the Planner can paint before the shell context arrives (the identity read
// settles first). The Scheduling tabs then appeared above the controls and moved them down 77 px,
// in the frame where the rail items arrive. The rail's More button, drawn directly below those
// items, dropped about 700 px in that same frame, so the frame scored 0.144 in a diagnostic run.
test("F13 Planner controls stay put when the shell context arrives after the page", async ({ page, isMobile }, info) => {
  test.skip(isMobile, "The F13 budget is measured on the desktop shell.");
  const origin = new URL(info.project.use.baseURL!).origin;
  await page.setViewportSize({ width: 1440, height: 900 });
  // From the first frame: every distinct top edge of the controls and of More, and every shift.
  await page.addInitScript(() => {
    const probe = { tops: [] as number[], more: [] as number[], shift: 0 };
    (window as unknown as { plannerProbe: typeof probe }).plannerProbe = probe;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[])
        if (!entry.hadRecentInput) probe.shift += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
    const sample = () => {
      const box = document.querySelector("section.planner-toolbar")?.getBoundingClientRect();
      if (box?.height && probe.tops.at(-1) !== Math.round(box.top)) probe.tops.push(Math.round(box.top));
      const more = document.querySelector("#desktop-more-toggle")?.getBoundingClientRect();
      if (more?.height && probe.more.at(-1) !== Math.round(more.top)) probe.more.push(Math.round(more.top));
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  expect((await page.request.post("/api/v1/local-session", { headers: { Origin: origin }, data: { profile: "coordinator" } })).status()).toBe(200);
  // Hold the shell context until the controls have painted, the order a slower runner can produce.
  let release!: () => void;
  const held = new Promise<void>(resolve => (release = resolve));
  await page.route("**/api/v1/shell/context", async route => {
    await held;
    await route.continue();
  });
  await page.goto("/schedule");
  await expect(page.getByRole("region", { name: "Planner controls", exact: true })).toBeVisible();
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  release();
  await expect(page.getByRole("navigation", { name: "Scheduling workspace", exact: true }).getByRole("link", { name: "Planner", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Collapse primary navigation", exact: true })).toBeEnabled();
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  const probe = await page.evaluate(() => (window as unknown as { plannerProbe: { tops: number[]; more: number[]; shift: number } }).plannerProbe);
  await writeFile(info.outputPath("planner-late-context.json"), JSON.stringify(probe, null, 2));
  expect.soft(probe.tops, "Planner controls top edge from first paint").toHaveLength(1);
  expect.soft(probe.more, "rail More top edge from first paint").toHaveLength(1);
  expect(probe.shift, "cumulative layout shift").toBeLessThan(0.1);
});
