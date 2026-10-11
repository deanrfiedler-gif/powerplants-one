import { expect, type Page } from "@playwright/test";

/** Initial data readiness for the two My Work layouts inspected by SH. */
export async function navigateToMyWork(page: Page, url: string) {
  const path = new URL(url, "http://fixture.invalid").pathname;
  const endpoint = path === "/work" ? "/api/v1/work/overview"
    : path === "/work/actions" ? "/api/v1/work/actions" : undefined;
  if (!endpoint) throw new Error(`Unsupported My Work layout: ${path}`);
  // Observe before navigation so fast responses are not missed. Initial data
  // has its own bounded transport budget; the subsequent render assertion
  // retains Playwright's ordinary five-second deadline.
  const [response] = await Promise.all([
    page.waitForResponse(response => response.request().method() === "GET" &&
      new URL(response.url()).pathname === endpoint, { timeout: 15000 }),
    page.goto(url),
  ]);
  expect(response.status(), `${endpoint} initial read`).toBe(200);
}
