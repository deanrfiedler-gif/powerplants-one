import { test, expect } from "@playwright/test";
import {
  siteId,
  siteFixture,
  sitesFixture,
  equipmentFixture,
} from "../helpers/sites-native";
import { revealOwnedFollowUp } from "../helpers/owned-follow-up";

// The P11 journey pages Site follow-ups that earlier suites add. CS-04 used to
// remount that list on every Overview observation, which stopped the journey in
// CI two ways: a refresh during a Tab walk wrapped focus to the top of the page
// and exhausted the 200-step budget, and a refresh as a page arrived hid the list
// from an instant check, so the page holding the target was skipped. The list now
// survives a refresh (PPO-SITE-FOLLOW-UP-FOCUS-DEC). Force both refreshes against
// the helper so neither failure can return unnoticed.
const cursors = [null, "synthetic-page-2", "synthetic-page-3"];
const activity = (page: number, n: number) => `a${page}${String(n).padStart(6, "0")}-0000-4000-8000-000000000000`;
const target = activity(2, 30);

test("P11 owned follow-up paging survives CS-04 Site refreshes during a keyboard walk and a page load", async ({ page }) => {
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
  // The two forced refreshes below advance the observation; the 15 s interval
  // may also re-read during the walk.
  let generation = 0;
  await page.route(`**/api/v1/sites/${siteId}/overview`, route => route.fulfill({ json: {
    site: siteFixture,
    sources: [
      // Retained suites leave many earlier Site records ahead of the list.
      { name: "Work orders", state: "Partial", items: Array.from({ length: 45 }, (_, n) => ({
        id: `d0000000-0000-4000-8000-${String(n + 1).padStart(12, "0")}`,
        reference: `SYN-WO-${String(n + 1).padStart(6, "0")}`,
        title: `SYN earlier work order ${n + 1}`,
        detail: "Draft",
        href: `/service/work-orders/d0000000-0000-4000-8000-${String(n + 1).padStart(12, "0")}`,
        kind: "Work order",
      })) },
      { name: "Follow-ups", state: "Partial", items: [] },
    ],
    observed_at: new Date(Date.parse(sitesFixture.observed_at) + generation * 1000).toISOString(),
  } }));
  const reads: (string | null)[] = [];
  let walkRefresh = -1, loadRefresh = -1;
  const refresh = async () => {
    generation++;
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  };
  await page.route("**/api/v1/activities?**", async route => {
    const query = new URL(route.request().url()).searchParams;
    expect(query.get("object_type")).toBe("Site");
    expect(query.get("object_id")).toBe(siteId);
    const cursor = query.get("cursor");
    const index = cursors.indexOf(cursor);
    expect(index).toBeGreaterThanOrEqual(0);
    reads.push(cursor);
    // A refreshed read of fifty retained activities is slow in CI. The walk and
    // any instant visibility check have to keep working while it is outstanding.
    if ((index === 0 && walkRefresh >= 0) || (index === 1 && loadRefresh >= 0))
      await new Promise(resolve => setTimeout(resolve, 1500));
    await route.fulfill({
      headers: { "cache-control": "private, no-store" },
      json: {
        items: Array.from({ length: index === 2 ? 7 : 50 }, (_, n) => ({
          id: activity(index + 1, n + 1),
          summary: `SYN linked follow-up ${index + 1}-${n + 1}`,
          status: "Open", owner_name: "SYN Coordinator", due_needed: true, due_at: null,
        })),
        next_cursor: cursors[index + 1] ?? null,
        observed_at: sitesFixture.observed_at, completeness: index === 2 ? "Complete" : "Partial", source: "Synthetic",
      },
    });
    // Refresh the moment the target page first arrives.
    if (index === 1 && loadRefresh < 0) {
      loadRefresh = reads.length;
      await refresh();
    }
  });
  // Refresh once the first keyboard walk is deep inside the page-one list.
  await page.exposeFunction("synthWalkRefresh", async () => {
    walkRefresh = reads.length;
    await refresh();
  });
  await page.goto(`/sites/${siteId}`);
  await page.evaluate(() => {
    const deep = "SYN linked follow-up 1-45";
    const listen = (event: FocusEvent) => {
      if ((event.target as Element | null)?.textContent !== deep) return;
      document.removeEventListener("focusin", listen);
      void (window as unknown as { synthWalkRefresh: () => Promise<void> }).synthWalkRefresh();
    };
    document.addEventListener("focusin", listen);
  });
  const first = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/activities");
  await page.getByRole("tab", { name: "Work and visits", exact: true }).click();
  const owned = await revealOwnedFollowUp(page, await first, target);
  const reached = owned.getByRole("link", { name: "SYN linked follow-up 2-30", exact: true });
  await expect(reached).toBeVisible();
  await expect(reached).toHaveAttribute("href", `/work/${target}`);
  // Both refreshes happened where intended and each re-read its own page.
  expect(walkRefresh).toBeGreaterThan(0);
  expect(reads.slice(walkRefresh)).toContain(null);
  expect(loadRefresh).toBeGreaterThan(walkRefresh);
  expect(reads.slice(loadRefresh)).toContain(cursors[1]);
  expect(generation).toBe(2);
  // The target page was never skipped.
  expect(reads).not.toContain(cursors[2]);
});
