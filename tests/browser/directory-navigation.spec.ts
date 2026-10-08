import { test, expect, type Page, type Locator, type Request } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { keyActivate } from "../helpers/quality-keyboard";

test.describe.configure({ timeout: 180000 });
async function login(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const result = await page.request.post("/api/v1/local-session", {
    headers: { Origin: origin }, data: { profile: "coordinator" },
  });
  expect(result.status()).toBe(200);
}
async function directory(page: Page, path: "/customers" | "/people") {
  const pending = page.waitForResponse(r => new URL(r.url()).pathname === "/api/v1/crm/directory" && r.request().method() === "GET");
  await page.goto(path);
  const response = await pending;
  expect(response.status()).toBe(200);
  const data = await response.json();
  await expect(page.getByRole("heading", { name: path === "/customers" ? "Organisations" : "People", exact: true })).toBeVisible();
  await expect(page.locator(".crm-directory-table tbody th a").first()).toBeAttached();
  return data as { items: { id: string; display_name: string }[] };
}
async function activate(page: Page, link: Locator, touch: boolean, keyboard = false) {
  if (keyboard) await keyActivate(page, link);
  else if (touch) await link.tap();
  else await link.click();
}
async function receive(page: Page, link: Locator, touch: boolean, keyboard = false) {
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();
  const target = new URL(href!, page.url());
  const pending = page.waitForResponse(r => new URL(r.url()).pathname === `/api/v1${target.pathname}/workspace` && r.request().method() === "GET");
  await activate(page, link, touch, keyboard);
  const response = await pending;
  expect(response.status()).toBe(200);
  const body = await response.json();
  const record = target.pathname.startsWith("/customers/") ? body.context : body;
  expect(record.id).toBe(target.pathname.split("/").at(-1));
  await expect(page).toHaveURL(target.href);
  await expect(page.getByRole("heading", { name: record.display_name, exact: true }).first()).toBeVisible();
}

test("directory record links avoid automatic reads and keep exact receiving navigation", async ({ page, isMobile }, info) => {
  await login(page);
  const observations = [];
  for (const path of ["/customers", "/people"] as const) {
    const requests: { path: string; prefetch: boolean }[] = [];
    const onRequest = (request: Request) => {
      const h = request.headers();
      requests.push({ path: new URL(request.url()).pathname, prefetch: h["next-router-prefetch"] === "1" || h["next-router-segment-prefetch"] !== undefined || /prefetch/i.test(h.purpose ?? h["sec-purpose"] ?? "") });
    };
    page.on("request", onRequest);
    const data = await directory(page, path);
    const link = page.locator(isMobile ? ".crm-directory-mobile-main" : ".crm-directory-table tbody th a").first();
    if (!isMobile) await link.hover();
    // A bounded observation of automatic work, not a readiness/performance target.
    await page.waitForTimeout(1000);
    page.off("request", onRequest);
    const targets = new Set(data.items.map(row => `${path}/${row.id}`));
    const recordPrefetch = requests.filter(r => r.prefetch && targets.has(r.path));
    expect(recordPrefetch).toEqual([]);
    observations.push({ path, observed_requests: requests.length, record_prefetch: recordPrefetch });
    await receive(page, link, isMobile, !isMobile);
  }
  await writeFile(info.outputPath("directory-request-observation.json"), JSON.stringify({ viewport: page.viewportSize(), observations, boundary: "One-second observation before activation; exact directory record paths only. Shared shell duplicates some tab destinations and remains outside this assertion." }, null, 2));

  if (!isMobile) {
    // Sites and Facilities each use the numeric-link JSX site.
    for (const column of ["Sites", "Facilities"]) {
      await directory(page, "/customers");
      const headers = await page.locator(".crm-directory-table thead th").allTextContents();
      const index = headers.findIndex(text => text.trim().startsWith(column));
      expect(index).toBeGreaterThan(-1);
      await receive(page, page.locator(".crm-directory-table tbody tr").first().locator("th,td").nth(index).getByRole("link"), false);
    }
    await directory(page, "/people");
    await receive(page, page.locator(".crm-affiliation-list a").first(), false);
  }
  for (const [path, kind] of [["/customers", "customer"], ["/people", "person"]] as const) {
    await directory(page, path);
    await activate(page, page.locator(".crm-directory .primary-link"), isMobile, !isMobile);
    await expect(page).toHaveURL(new RegExp(`/customers/new\\?kind=${kind}$`));
    await expect(page.locator("main form").first()).toBeVisible();
  }
  await directory(page, "/customers");
  for (const [label, path] of [["People", "/people"], ["Sites", "/sites"], ["Equipment", "/equipment"]]) {
    const link = page.getByRole("navigation", { name: "Customer context sections", exact: true }).getByRole("link", { name: label, exact: true });
    await activate(page, link, isMobile, !isMobile);
    await expect(page).toHaveURL(new URL(path, page.url()).href);
    await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
    if (path !== "/people") await directory(page, "/customers");
  }
  await page.screenshot({ path: info.outputPath("directory-navigation.png"), fullPage: false });
});
