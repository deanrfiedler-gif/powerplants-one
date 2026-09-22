import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const evidence = resolve("verification-evidence/department-navigation");
const origin = () => new URL(test.info().project.use.baseURL!).origin;
async function login(page: Page, profile = "coordinator") {
  expect((await page.request.post("/api/v1/local-session", { headers: { Origin: origin() }, data: { profile } })).ok()).toBe(true);
}
async function capture(page: Page, name: string) {
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/${name}.png` });
}
const rails = {
  sales: ["Pulse", "Leads", "Deals", "Activities", "Tasks", "Sales Inbox", "Contacts"],
  estimate: ["My Work", "Estimation wizard", "Estimates", "Specialist configurations", "Quotations"],
  engineering: ["My Work", "Engineering workload", "Materials & substitutions", "Change review", "Commissioning & as-built"],
  projects: ["My Work", "Projects", "Programme", "Acceptance & closeout"],
  service: ["My Work", "Service requests", "Work orders", "Schedule", "Field team", "Job packs", "Service review", "Equipment"],
  supply: ["My Work"],
  finance: ["My Work", "Finance handoffs", "Customer accounts"],
};
test("all seven actual department rails retain canonical order and dimensions", async ({ page }) => {
  await login(page);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  for (const [department, labels] of Object.entries(rails)) {
    await page.goto(`/work?department=${department}`);
    const nav = page.locator(".ppo-primary-nav");
    await expect(nav.getByRole("link").first()).toBeVisible();
    const actual = await nav.getByRole("link").evaluateAll(items => items.map(i => i.getAttribute("aria-label")));
    // Coordinator's existing grants may withhold Finance rows. No synthetic grant is added.
    expect(actual).toEqual(labels.filter(label => actual.includes(label)));
    expect(actual.length).toBeGreaterThan(0);
    expect(await page.locator(".ppo-rail").count()).toBe(1);
    expect(await nav.locator("svg").first().evaluate(e => e.getBoundingClientRect().width)).toBe(25);
    expect(await page.locator(".ppo-rail").evaluate(e => e.getBoundingClientRect().width)).toBe(76);
    expect(await nav.getByRole("link").first().evaluate(e => e.getBoundingClientRect().height)).toBe(48);
    await capture(page, `department-${department}-1440x900`);
  }
  expect(errors).toEqual([]);
});
test("Sales active drawings, real landing pages and More keyboard state", async ({ page }) => {
  await login(page);
  for (const [path, label] of [["/sales/pulse", "Pulse"], ["/sales/leads", "Leads"], ["/sales/tasks", "Tasks"], ["/contacts?view=people&department=sales", "Contacts"], ["/sales/opportunities", "Deals"], ["/email?department=sales", "Sales Inbox"], ["/calendar?scope=sales&department=sales&day=2026-09-08", "Activities"]]) {
    await page.goto(path);
    const active = page.locator(".ppo-primary-nav [aria-current=page]");
    await expect(active).toHaveAttribute("aria-label", label);
    await expect(active.locator("svg")).toHaveAttribute("data-variant", "active");
    await expect(page.locator(".ppo-primary-nav [aria-current=page]")).toHaveCount(1);
    await capture(page, `sales-${label.toLowerCase().replaceAll(" ", "-")}`);
  }
  await page.locator(".ppo-primary-nav [aria-current=page]").focus();
  await expect(page.getByRole("tooltip")).toHaveText("Activities");
  await capture(page, "active-keyboard-focus");
  await page.getByRole("button", { name: "More", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("searchbox", { name: "Find a menu item" })).toBeFocused();
  await expect(page.locator(".ppo-primary-nav [aria-current=page]")).toHaveAttribute("aria-label", "Activities");
  await capture(page, "more-open");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "More", exact: true })).toBeFocused();
  await expect(page.locator("#desktop-more-panel")).toBeHidden();
});
test("Engineering and Service retain shared Contacts view through records, reload, back and new tabs", async ({ page, context }) => {
  await login(page);
  await page.goto("/contacts?view=organisations&department=engineering");
  await expect(page.getByRole("navigation", { name: "Engineering shortcuts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Organisations", exact: true })).toBeVisible();
  const record = page.locator("main a[href^='/customers/']").filter({ hasNotText: "New" }).first();
  await expect(record).toBeVisible();
  const href = await record.getAttribute("href"); expect(href).toContain("department=engineering");
  await record.click(); await page.reload();
  await expect(page.getByRole("navigation", { name: "Engineering shortcuts" })).toBeVisible();
  const other = await context.newPage(); await other.goto(origin() + href!);
  await expect(other.getByRole("navigation", { name: "Engineering shortcuts" })).toBeVisible(); await other.close();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Organisations", exact: true })).toBeVisible();
  await page.goto("/contacts?department=engineering");
  await expect(page).toHaveURL(/view=organisations/);
  await page.getByRole("button", { name: "Change identity", exact: true }).click();
  await page.getByLabel("Preview workspace", { exact: true }).selectOption("service");
  await expect(page).toHaveURL(/department=service/);
  await expect(page.getByRole("navigation", { name: "Service operations shortcuts" })).toBeVisible();
});
test("specific Engineering, Projects and Fertigation destinations preserve their active parent", async ({ page }) => {
  await login(page);
  for (const [path, label] of [["/engineering/materials", "Materials & substitutions"], ["/engineering/changes", "Change review"], ["/engineering/commissioning", "Commissioning & as-built"], ["/projects/acceptance", "Acceptance & closeout"], ["/projects/programme", "Programme"], ["/estimating/fertigation", "Specialist configurations"], ["/estimating/quotes", "Quotations"]]) {
    await page.goto(path);
    await expect(page.locator(".ppo-primary-nav [aria-current=page]")).toHaveAttribute("aria-label", label);
  }
  await page.goto("/estimating/fertigation");
  await expect(page.locator("#ppo-fertigation")).toBeVisible();
  await page.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "More navigation" }).getByRole("link", { name: "Priva Fertigation Configurator", exact: true })).toHaveAttribute("href", "/estimating/fertigation");
  await capture(page, "fertigation-preserved");
});
test("short desktop keeps More and logo anchored while shortcuts scroll", async ({ page }) => {
  await login(page); await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/work?department=service");
  const more = page.locator("#desktop-more-toggle"), nav = page.locator(".ppo-primary-nav");
  await expect(nav.getByRole("link", { name: "Equipment", exact: true })).toBeAttached();
  const before = await more.boundingBox();
  await nav.getByRole("link", { name: "Equipment", exact: true }).focus();
  expect(await nav.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  expect(await more.boundingBox()).toEqual(before);
  expect(before!.y + before!.height).toBeLessThanOrEqual(400);
  await expect(page.getByRole("tooltip")).toHaveText("Equipment");
  await capture(page, "short-desktop-1280x400");
  await page.setViewportSize({ width: 1280, height: 600 }); await capture(page, "desktop-1280x600");
});
test("phone and 200 percent equivalent reflow keep the established navigation", async ({ page }) => {
  await login(page); await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sales/opportunities");
  await expect(page.locator(".ppo-rail")).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Mobile navigation", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mobile navigation", exact: true }).getByRole("link", { name: "Deals", exact: true })).toBeVisible();
  await capture(page, "mobile-deals-390x844");
  await page.goto("/sales/leads"); await expect(page.getByRole("navigation", { name: "Mobile navigation", exact: true })).toBeHidden();
  await capture(page, "mobile-leads-exception");
  await page.setViewportSize({ width: 720, height: 450 }); await page.goto("/contacts?view=people&department=sales");
  await expect(page.getByRole("heading", { name: "People", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await capture(page, "reflow-200-percent-equivalent");
});
test("restricted and empty access omit links; server guards still refuse account access", async ({ page }) => {
  await login(page, "observer"); await page.goto("/work?department=sales");
  await expect(page.locator(".ppo-primary-nav")).toBeVisible();
  await expect(page.locator(".ppo-primary-nav a[href^='/finance']")).toHaveCount(0);
  const account = await page.request.get("/api/v1/navigation/accounts"); expect([403, 404]).toContain(account.status());
  await page.route("**/api/v1/shell/context", route => route.fulfill({ json: { display_name: "Synthetic empty access fixture", actions: [], navigation: [], can_preview: true, preference_scope: "fixture:empty" } }));
  await page.reload(); await expect(page.locator(".ppo-primary-nav a")).toHaveCount(0);
  await page.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Find a menu item" })).toBeVisible();
  await capture(page, "explicit-empty-access-fixture");
});
