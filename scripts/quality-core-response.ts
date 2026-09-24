import type { Page, Request } from "@playwright/test";

/** Observe this sample's GET, excluding late responses from an earlier wave. */
export async function waitForSampleCoreResponse(page: Page, api: string, timeout = 120000) {
  const requests = new Set<Request>();
  const started = (request: Request) => {
    if (new URL(request.url()).pathname === api && request.method() === "GET") requests.add(request);
  };
  page.on("request", started);
  try {
    return await page.waitForResponse(
      response => requests.has(response.request()),
      { timeout },
    );
  } finally {
    page.off("request", started);
  }
}
