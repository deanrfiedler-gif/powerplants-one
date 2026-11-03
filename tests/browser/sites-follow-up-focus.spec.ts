import { test, expect, type Page } from "@playwright/test";
import { siteId, siteFixture, sitesFixture, equipmentFixture } from "../helpers/sites-native";

// PPO-SITE-FOLLOW-UP-FOCUS-DEC: a routine refresh of the Site's Owned follow-up
// list keeps rows, focus and scroll. A denied, failed or overdue read and a
// Restricted source still clear it. The window focus event stands in for the
// 15 s timer, except in the time limit case, which runs the real interval.
const activity = (page: number, n: number) => `a${page}${String(n).padStart(6, "0")}-0000-4000-8000-000000000000`;

async function site(page: Page) {
  const server = {
    source: "Partial",
    status: 200,
    hidden: new Set<string>(),
    hold: null as Promise<void> | null,
    cursors: [] as (string | null)[],
  };
  await page.route("**/api/v1/local-session", route => route.fulfill({ json: {
    actor_id: "30000000-0000-4000-8000-000000000001",
    workspace_id: "10000000-0000-4000-8000-000000000001",
    display_name: "SYN Coordinator",
  } }));
  await page.route("**/api/v1/shell/context", route => route.fulfill({ json: {
    display_name: "SYN Coordinator", can_preview: true, conversations: false,
    navigation: ["work", "tickets", "work-orders", "planner", "customers", "people", "sites", "facilities", "surveys", "equipment"],
    actions: [], companies: [], working_company_id: null,
  } }));
  await page.route("**/api/v1/notifications**", route => route.fulfill({ json: { items: [], unread: 0 } }));
  await page.route("**/api/v1/sites/register?**", route => route.fulfill({ json: sitesFixture }));
  await page.route(`**/api/v1/equipment?site_id=${siteId}`, route => route.fulfill({ json: { items: equipmentFixture, total: 14 } }));
  // The real server stamps a new observed_at on every response.
  await page.route(`**/api/v1/sites/${siteId}/overview`, route => route.fulfill({ json: {
    site: siteFixture,
    sources: [{ name: "Follow-ups", state: server.source, items: [] }],
    observed_at: new Date().toISOString(),
  } }));
  await page.route("**/api/v1/activities?**", async route => {
    const query = new URL(route.request().url()).searchParams;
    expect(query.get("object_type")).toBe("Site");
    expect(query.get("object_id")).toBe(siteId);
    const cursor = query.get("cursor");
    server.cursors.push(cursor);
    const hold = server.hold;
    if (hold) await hold;
    if (server.status !== 200)
      return route.fulfill({ status: server.status, json: { code: "Synthetic", message: `Synthetic read answered ${server.status}` } });
    const number = cursor ? 2 : 1;
    return route.fulfill({
      headers: { "cache-control": "private, no-store" },
      json: {
        items: Array.from({ length: cursor ? 7 : 50 }, (_, n) => ({
          id: activity(number, n + 1),
          summary: `SYN linked follow-up ${number}-${n + 1}`,
          status: "Open", owner_name: "SYN Coordinator", due_needed: true, due_at: null,
        })).filter(item => !server.hidden.has(item.summary)),
        next_cursor: cursor ? null : "synthetic-page-2",
        observed_at: sitesFixture.observed_at, completeness: "Partial", source: "Synthetic",
      },
    });
  });
  await page.goto(`/sites/${siteId}`);
  await page.getByRole("tab", { name: "Work and visits", exact: true }).click();
  const heading = page.getByRole("heading", { name: "Owned follow-up", exact: true });
  const owned = page.locator(".detail-section").filter({ has: heading });
  const link = (name: string) => owned.getByRole("link", { name: `SYN linked follow-up ${name}`, exact: true });
  await expect(link("1-1")).toBeVisible();
  const refresh = () => page.evaluate(() => window.dispatchEvent(new Event("focus")));
  // Resolves once the list's own re-read has answered and been rendered.
  const reread = async () => {
    const answered = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/activities");
    await refresh();
    await answered;
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  return { server, heading, owned, link, refresh, reread };
}
const held = () => {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
};

test("CS04 a routine follow-up refresh keeps rows, focus and scroll with no loading message", async ({ page }) => {
  const { server, owned, link, refresh } = await site(page);
  await link("1-20").focus();
  await link("1-20").scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const w = window as unknown as { fewest: number; loading: number; stop: boolean };
    w.fewest = Infinity;
    w.loading = 0;
    const tick = () => {
      const section = [...document.querySelectorAll(".detail-section")].find(x => x.querySelector("h2")?.textContent === "Owned follow-up");
      w.fewest = Math.min(w.fewest, section?.querySelectorAll("a").length ?? 0);
      if (section?.textContent?.includes("Loading permitted records")) w.loading++;
      if (!w.stop) requestAnimationFrame(tick);
    };
    tick();
  });
  const before = await link("1-20").evaluate(element => element.getBoundingClientRect().top);
  const gate = held();
  server.hold = gate.promise;
  const count = server.cursors.length;
  await refresh();
  await expect.poll(() => server.cursors.length).toBeGreaterThan(count);
  await expect(link("1-20")).toBeFocused();
  // The next Tab carries on from the same row while the read is outstanding.
  await page.keyboard.press("Tab");
  await expect(link("1-21")).toBeFocused();
  server.hold = null;
  const answered = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/activities");
  gate.release();
  await answered;
  await expect(link("1-21")).toBeFocused();
  expect(await link("1-20").evaluate(element => element.getBoundingClientRect().top)).toBe(before);
  const seen = await page.evaluate(() => {
    const w = window as unknown as { fewest: number; loading: number; stop: boolean };
    w.stop = true;
    return { fewest: w.fewest, loading: w.loading };
  });
  expect(seen).toEqual({ fewest: 51, loading: 0 });
  await expect(owned.getByRole("alert")).toHaveCount(0);
});

test("CS04 a keyboard walk reaches Next across a refresh, and paging keeps focus on the list", async ({ page }) => {
  const { server, heading, owned, link, reread } = await site(page);
  const next = owned.getByRole("button", { name: "Next linked activities", exact: true });
  await link("1-1").focus();
  for (let n = 2; n <= 50; n++) {
    await page.keyboard.press("Tab");
    await expect(link(`1-${n}`)).toBeFocused();
    if (n === 25) await reread();
  }
  await page.keyboard.press("Tab");
  await expect(next).toBeFocused();
  const gate = held();
  server.hold = gate.promise;
  await page.keyboard.press("Enter");
  // Next has gone, the page is loading and focus has somewhere to be.
  await expect(owned.getByRole("status")).toContainText("Loading permitted records");
  await expect(heading).toBeFocused();
  await expect(heading).not.toHaveCSS("outline-style", "none");
  server.hold = null;
  gate.release();
  await expect(link("2-1")).toBeVisible();
  await expect(heading).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(link("2-1")).toBeFocused();
  // A refresh re-reads the selected page rather than returning to the first.
  await reread();
  expect(server.cursors.at(-1)).toBe("synthetic-page-2");
  await expect(link("2-1")).toBeFocused();
  await owned.getByRole("button", { name: "First linked activities", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(link("1-1")).toBeVisible();
  await expect(heading).toBeFocused();
});

test("CS04 a re-read removes a row that is no longer permitted without the source state changing", async ({ page }) => {
  const { server, heading, link, reread } = await site(page);
  // Focus on another row is left alone.
  await link("1-20").focus();
  server.hidden.add("SYN linked follow-up 1-40");
  await reread();
  await expect(link("1-40")).toHaveCount(0);
  await expect(link("1-20")).toBeFocused();
  // A focused row that goes moves focus to the heading, not to the document.
  server.hidden.add("SYN linked follow-up 1-20");
  await reread();
  await expect(link("1-20")).toHaveCount(0);
  await expect(heading).toBeFocused();
});

test("CS04 a denied or failed follow-up read clears the list and only moves focus it displaced", async ({ page }) => {
  const { server, heading, owned, link, reread } = await site(page);
  await link("1-20").focus();
  server.status = 403;
  await reread();
  await expect(owned.getByRole("link")).toHaveCount(0);
  await expect(owned.getByRole("alert")).toContainText("Synthetic read answered 403");
  await expect(heading).toBeFocused();
  const retry = owned.getByRole("button", { name: "Retry loading", exact: true });
  await page.keyboard.press("Tab");
  await expect(retry).toBeFocused();
  // Success removes the focused Retry, which also has to land somewhere.
  server.status = 200;
  await page.keyboard.press("Enter");
  await expect(link("1-20")).toBeVisible();
  await expect(heading).toBeFocused();
  // With focus elsewhere, a failure and its recovery leave that focus alone.
  const tab = page.getByRole("tab", { name: "Work and visits", exact: true });
  await tab.focus();
  server.status = 500;
  await reread();
  await expect(owned.getByRole("link")).toHaveCount(0);
  await expect(owned.getByRole("alert")).toContainText("Synthetic read answered 500");
  await expect(tab).toBeFocused();
  server.status = 200;
  await reread();
  await expect(link("1-20")).toBeVisible();
  await expect(tab).toBeFocused();
});

test("CS04 a Restricted source removes the list at once and a late reply cannot restore it", async ({ page }) => {
  const { server, heading, link, refresh } = await site(page);
  await link("1-20").focus();
  const gate = held();
  server.hold = gate.promise;
  const count = server.cursors.length;
  await refresh();
  await expect.poll(() => server.cursors.length).toBeGreaterThan(count);
  // Still retained, because nothing has said otherwise yet.
  await expect(link("1-20")).toBeFocused();
  server.source = "Restricted";
  const overview = page.waitForResponse(response => new URL(response.url()).pathname === `/api/v1/sites/${siteId}/overview`);
  await refresh();
  await overview;
  await expect(heading).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Work and visits", exact: true })).toBeFocused();
  server.hold = null;
  const late = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/activities");
  gate.release();
  await late;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(link("1-20")).toHaveCount(0);
  await expect(heading).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Work and visits", exact: true })).toBeFocused();
});

test("CS04 old follow-up rows are cleared when a re-read is still unanswered as the next falls due", async ({ page }) => {
  await page.clock.install();
  const { server, owned, link } = await site(page);
  const gate = held();
  server.hold = gate.promise;
  const count = server.cursors.length;
  // The first interval only starts the re-read: the rows stay.
  await page.clock.runFor(15000);
  await expect.poll(() => server.cursors.length).toBeGreaterThan(count);
  await expect(link("1-1")).toBeVisible();
  await expect(owned.getByRole("alert")).toHaveCount(0);
  // The next interval finds it unanswered: the rows go.
  await page.clock.runFor(15000);
  await expect(link("1-1")).toHaveCount(0);
  await expect(owned.getByRole("alert")).toContainText("could not be confirmed");
  // A later read that does answer brings the current rows back.
  server.hold = null;
  gate.release();
  await page.clock.runFor(15000);
  await expect(link("1-1")).toBeVisible();
  await expect(owned.getByRole("alert")).toHaveCount(0);
});
