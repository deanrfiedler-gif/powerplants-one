import type { Page } from "@playwright/test";

// Browser navigation aborts a fetch without waiting for its server transaction.
// Keep reads owned by a route handler so unrouteAll({ behavior: "wait" }) can
// drain them before the next suite destroys the disposable database schema.
// Register first: individual test routes retain precedence over this fallback.
export async function retainApiReadsForTeardown(page: Page) {
  await page.route("**/api/v1/**", async route => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response });
  });
}
