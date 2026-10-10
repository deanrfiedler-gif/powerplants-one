import { expect, type Page } from "@playwright/test";

export async function crmRefinementCall(page: Pick<Page, "request">, path: string, body?: unknown, origin = "http://127.0.0.1:3000") {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    // Fixture reads can follow a long browser interaction. Do not reuse an
    // idle API socket at its closing boundary; retain the same cookie jar,
    // exact request and response assertion, with no retry.
    headers: body === undefined
      ? { Connection: "close" }
      : { Origin: origin, Connection: "close" },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
