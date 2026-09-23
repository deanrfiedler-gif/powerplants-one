import { test, expect } from "@playwright/test";
import { observedResponse } from "../helpers/observed-response";

// Exercise the timing contract without a database, app mutation or real host.
const origin = "http://ppo-readiness.test";
const matchesRequest = (request: import("@playwright/test").Request) => request.url() === `${origin}/workspace`;
const matchesResponse = (response: import("@playwright/test").Response) => matchesRequest(response.request());

test("navigation readiness does not consume the data response budget", async ({ page }) => {
  page.setDefaultTimeout(15000);
  await page.route(`${origin}/**`, async route => {
    if (route.request().isNavigationRequest()) {
      await route.fulfill({ contentType: "text/html", body: '<script>setTimeout(() => fetch("/workspace"), 8000)</script>' });
    } else {
      await new Promise(resolve => setTimeout(resolve, 8000));
      await route.fulfill({ json: { id: "SYN-customer" } });
    }
  });
  const response = await observedResponse(page, "separate-readiness", matchesResponse,
    () => page.goto(origin), { request: matchesRequest, timeout: 60000 });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ id: "SYN-customer" });
});

test("navigation observer catches an immediate response and retains the response deadline", async ({ page }) => {
  page.setDefaultTimeout(1000);
  let refuseResponse = false;
  await page.route(`${origin}/**`, async route => {
    if (route.request().isNavigationRequest()) {
      await route.fulfill({ contentType: "text/html", body: '<script>fetch("/workspace").catch(() => {})</script>' });
    } else if (refuseResponse) {
      await route.abort("failed");
    } else {
      await route.fulfill({ json: { id: "SYN-customer" } });
    }
  });
  const response = await observedResponse(page, "immediate-read", matchesResponse,
    () => page.goto(origin), { request: matchesRequest, timeout: 60000 });
  expect(response.status()).toBe(200);
  refuseResponse = true;
  await expect(observedResponse(page, "missing-response", matchesResponse,
    () => page.reload(), { request: matchesRequest, timeout: 60000 }))
    .rejects.toThrow(/page.waitForResponse: Timeout 1000ms exceeded/);
});
