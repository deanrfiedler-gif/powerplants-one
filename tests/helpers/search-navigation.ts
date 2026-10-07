import { expect, type Page } from "@playwright/test";

/** Observe the exact initial search read before checking rendered geometry. */
export async function navigateToSearch(page: Page, url: string) {
  const target = new URL(url, "http://fixture.invalid");
  if (target.pathname !== "/search" || !target.searchParams.get("q"))
    throw new Error("A search route and query are required");
  const [response] = await Promise.all([
    page.waitForResponse(response => {
      const actual = new URL(response.url());
      return response.request().method() === "GET" &&
        actual.pathname === "/api/v1/search" &&
        actual.searchParams.get("q") === target.searchParams.get("q");
    }, { timeout: 15000 }),
    page.goto(url),
  ]);
  // Same bounded initial transport budget as My Work. Failed reads still fail;
  // callers retain their original five-second render/geometry assertions.
  expect(response.status(), "/api/v1/search initial read").toBe(200);
}
