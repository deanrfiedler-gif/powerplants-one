import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmCreate } from "../helpers/crm";

test.describe.configure({timeout: 120000});
async function setup(page: Page) {
  await page.goto("/estimating");
  const identity = await page.request.post("/api/v1/local-session", {headers: {Origin: new URL(page.url()).origin}, data: {profile: "coordinator"}});
  expect(identity.ok()).toBe(true);
  const input = {...crmCreate(), title: `SYN workload ${randomUUID()}`};
  const response = await page.request.post("/api/v1/crm/opportunities", {headers: {Origin: new URL(page.url()).origin}, data: input});
  expect(response.ok(), await response.text()).toBe(true);
  await page.goto(`/estimating?q=${encodeURIComponent(input.title)}`);
  await expect(page.getByRole("heading", {name: input.title, exact: true})).toBeVisible();
  return input;
}

test("ES01 native workload supports keyboard filters, exact discovery entry, reload, history and responsive cards", async ({page}, info) => {
  const input = await setup(page);
  await expect(page.getByText("Not allocated", {exact: true})).toBeVisible();
  await expect(page.getByText("Discovery not started", {exact: true}).last()).toBeVisible();
  await expect(page.getByRole("link", {name: "Start discovery", exact: true})).toHaveAttribute("href", `/estimating/discovery/new?opportunity=${input.id}`);
  const search = page.getByRole("searchbox", {name: "Search workload"});
  await search.fill("No such synthetic brief");
  await search.press("Enter");
  await expect(page.getByRole("heading", {name: "No workload matches these filters"})).toBeVisible();
  await page.goBack();
  await expect(search).toHaveValue(input.title);
  await expect(page.getByRole("heading", {name: input.title, exact: true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", {name: input.title, exact: true})).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", {name: "No workload matches these filters"})).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", {name: input.title, exact: true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const guide = page.getByRole("button", {name: "Page guide", exact: true});
  await guide.click();
  await expect(page.getByRole("heading", {name: "Workload, source context and authority"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toBeFocused();
  const header = (await page.locator(".ppo-shell-header").boundingBox())!;
  const guideBox = (await guide.boundingBox())!;
  expect(guideBox.y + guideBox.height).toBeLessThanOrEqual(header.y + header.height);
  await page.screenshot({path: info.outputPath("workload.png"), fullPage: true});
  await page.getByRole("link", {name: "Start discovery", exact: true}).scrollIntoViewIfNeeded();
  await page.screenshot({path: info.outputPath("workload-card.png"), fullPage: true});
  if (info.project.name.includes("mobile")) {
    await page.setViewportSize({width: 320, height: 844});
    await search.focus();
    await expect(search).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({path: info.outputPath("workload-320.png"), fullPage: true});
    await page.setViewportSize({width: 390, height: 844});
  } else {
    // Chromium CSS zoom exercises enlarged controls and reflow; physical-device
    // and browser-UI zoom acceptance remain separate from this automated proof.
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    await search.focus();
    await expect(search).toBeFocused();
    await expect(page.getByRole("button", {name: "Apply filters"})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({path: info.outputPath("workload-200-percent.png"), fullPage: true});
    await page.evaluate(() => { document.documentElement.style.zoom = ""; });
  }
  await page.getByRole("link", {name: "Start discovery", exact: true}).click();
  await expect(page).toHaveURL(new RegExp(`/estimating/discovery/new\\?opportunity=${input.id}`));
  await expect(page.getByLabel("Existing opportunity", {exact: true})).toHaveValue(input.id);
  await page.goto("/estimating?tab=estimates");
  await expect(page.getByRole("heading", {name: "Estimates", exact: true})).toBeVisible();
});

test("ES01 loading, failed refresh and revoked access never look like a successful empty workload", async ({page}) => {
  const input = await setup(page);
  await page.route("**/api/v1/estimating/workload?**", route => route.fulfill({status: 503, contentType: "application/json", body: JSON.stringify({code: "Unavailable", message: "Synthetic workload read failed", retryable: true})}));
  await page.reload();
  await expect(page.getByRole("button", {name: "Try loading again"})).toBeVisible();
  await expect(page.getByRole("heading", {name: input.title, exact: true})).toHaveCount(0);
  await page.unroute("**/api/v1/estimating/workload?**");
  await page.getByRole("button", {name: "Try loading again"}).click();
  await expect(page.getByRole("heading", {name: input.title, exact: true})).toBeVisible();
  await page.route("**/api/v1/estimating/workload?**", route => route.fulfill({status: 403, contentType: "application/json", body: JSON.stringify({code: "Forbidden", message: "Current estimating access required"})}));
  await page.reload();
  await expect(page.getByText("Current estimating access required")).toBeVisible();
  await expect(page.getByRole("heading", {name: input.title, exact: true})).toHaveCount(0);
});
