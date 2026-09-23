import type { Page } from "@playwright/test";

const activeReads = new WeakMap<Page, Set<Promise<void>>>();

// Browser navigation aborts a fetch without waiting for its server transaction.
// Keep reads owned by a route handler and drain them before removing routes
// or letting the next suite destroy the disposable database schema.
// Register first: individual test routes retain precedence over this fallback.
export async function retainApiReadsForTeardown(page: Page) {
  const active = new Set<Promise<void>>();
  activeReads.set(page, active);
  await page.route("**/api/v1/**", async route => {
    if (route.request().method() !== "GET") return route.continue();
    const read = (async () => {
      const response = await route.fetch();
      await route.fulfill({ response });
    })();
    active.add(read);
    try { await read; } finally { active.delete(read); }
  });
}

export async function drainApiReadsForTeardown(page: Page) {
  const active = activeReads.get(page);
  // Keep the route registered until every read has settled. Removing all routes
  // first lets the first completed handler disable interception while other
  // handlers still hold responses, causing "Route is already handled".
  while (active?.size) await Promise.all([...active]);
}
