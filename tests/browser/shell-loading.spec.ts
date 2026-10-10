import { test, expect, type Request } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { keyActivate } from "../helpers/quality-keyboard";

test("shell destinations wait for activation and preserve exact navigation and Back", async ({ page, isMobile }, info) => {
  const origin = new URL(info.project.use.baseURL!).origin;
  expect((await page.request.post("/api/v1/local-session", { headers: { Origin: origin }, data: { profile: "coordinator" } })).status()).toBe(200);
  const requests: { path: string; prefetch: boolean }[] = [];
  const observe = (request: Request) => {
    const headers = request.headers();
    requests.push({ path: new URL(request.url()).pathname, prefetch: headers["next-router-prefetch"] === "1" || headers["next-router-segment-prefetch"] !== undefined || /prefetch/i.test(headers.purpose ?? headers["sec-purpose"] ?? "") });
  };
  page.on("request", observe);
  await page.goto("/customers?department=sales");
  await expect(page.getByRole("heading", { name: "Organisations", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "More", exact: true }).click();
  const menu = page.getByRole("navigation", { name: isMobile ? "All modules" : "More navigation", exact: true });
  const link = menu.getByRole("link", { name: "People", exact: true });
  await expect(link).toBeVisible();
  if (!isMobile) await link.hover();
  const destinations = new Set(await page.locator("[data-shell-navigation] a, .mobile-navigation a, .ppo-shell-header a").evaluateAll(links => links.map(link => new URL((link as HTMLAnchorElement).href).pathname)));
  // Fixed observation of background work; this does not change a readiness deadline.
  await page.waitForTimeout(1000);
  page.off("request", observe);
  const speculative = requests.filter(request => request.prefetch && destinations.has(request.path));
  await writeFile(info.outputPath("shell-requests.json"), JSON.stringify({ viewport: page.viewportSize(), destinations: [...destinations], requests, speculative }, null, 2));
  expect(speculative).toEqual([]);
  const target = new URL((await link.getAttribute("href"))!, origin);
  if (isMobile) await link.tap(); else await keyActivate(page, link);
  await expect(page).toHaveURL(target.href);
  await expect(page.getByRole("heading", { name: "People", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(`${origin}/customers?department=sales`);
  await expect(page.getByRole("heading", { name: "Organisations", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("shell-customers.png") });
});
