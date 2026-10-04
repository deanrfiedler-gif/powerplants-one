import { expect, type Page } from "@playwright/test";

async function readMyWork(page: Page, endpoint: string, action: () => Promise<unknown>, label: string) {
  const [response] = await Promise.all([
    page.waitForResponse(response => response.request().method() === "GET" &&
      new URL(response.url()).pathname === endpoint, { timeout: 15000 }),
    action(),
  ]);
  expect(response.status(), `${endpoint} ${label}`).toBe(200);
}

/** Initial data readiness for the two My Work layouts inspected by SH. */
export async function navigateToMyWork(page: Page, url: string) {
  const path = new URL(url, "http://fixture.invalid").pathname;
  const endpoint = path === "/work" ? "/api/v1/work/overview"
    : path === "/work/actions" ? "/api/v1/work/actions" : undefined;
  if (!endpoint) throw new Error(`Unsupported My Work layout: ${path}`);
  // Observe before navigation so fast responses are not missed. Initial data
  // has its own bounded transport budget; the subsequent render assertion
  // retains Playwright's ordinary five-second deadline.
  await readMyWork(page, endpoint, () => page.goto(url), "initial read");
}

/** My Work mounts a fresh overview when crossing its native 780px phone boundary. */
export async function resizeMyWork(page: Page, viewport: { width: number; height: number }) {
  const before = page.viewportSize();
  const remounts = new URL(page.url()).pathname === "/work" && before &&
    (before.width <= 780) !== (viewport.width <= 780);
  if (remounts)
    await readMyWork(page, "/api/v1/work/overview", () => page.setViewportSize(viewport), "responsive read");
  else
    await page.setViewportSize(viewport);
}
