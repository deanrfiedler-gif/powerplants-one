import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { crmDiscovery } from "../helpers/crm";
import { projectInput } from "../helpers/projects";
// This suite owns its desktop, short-height and phone/reflow viewport changes.
// The repository's separate mobile project continues to run its existing phone suites.
test.skip(({ isMobile }) => !!isMobile, "Department rail suite uses explicit viewport scenarios.");
test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1440, height: 900 }); });
const evidence = resolve("verification-evidence/department-navigation");
const origin = () => new URL(test.info().project.use.baseURL!).origin;
async function login(page: Page, profile = "coordinator") {
  expect((await page.request.post("/api/v1/local-session", { headers: { Origin: origin() }, data: { profile } })).ok()).toBe(true);
}
async function capture(page: Page, name: string) {
  await expect(page.locator("main").getByText(/^Loading[ .…]/)).toHaveCount(0);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/${name}.png` });
}
async function revealSalesAction(page: Page, id: string, tasks: boolean) {
  const section = page.getByRole("region", { name: tasks ? "Deal tasks" : "Deal priorities", exact: true });
  const row = section.locator(`[data-activity="${id}"]`);
  await expect(section.locator(".mw-rows")).toBeVisible();
  // Other retained suites may already have filled several pages. Follow the
  // real cursor controls instead of assuming this new undated action sorts first.
  while (!(await row.count())) {
    const first = await section.locator("[data-activity]").first().getAttribute("data-activity");
    const next = section.getByRole("button", { name: "Next page", exact: true });
    await expect(next).toBeEnabled();
    await next.click();
    await expect.poll(async () => {
      const ids = await section.locator("[data-activity]").evaluateAll(rows => rows.map(row => row.getAttribute("data-activity")));
      return ids[0] ?? first;
    }).not.toBe(first);
  }
  await expect(row).toBeVisible();
}
const rails = {
  sales: ["Pulse", "Leads", "Deals", "Activities", "Tasks", "Sales Inbox", "Contacts"],
  estimate: ["My Work", "Estimation wizard", "Estimates", "Specialist configurations", "Quotations"],
  engineering: ["My Work", "Engineering workload", "Design basis & interfaces", "Drawings", "Materials & substitutions", "Change review", "Technical reviews", "Commissioning & as-built"],
  projects: ["My Work", "Projects", "Programme", "Acceptance & closeout"],
  service: ["My Work", "Service requests", "Work orders", "Schedule", "Field team", "Job packs", "Service review", "Equipment"],
  supply: ["My Work"],
  finance: ["My Work", "Finance handoffs", "Customer accounts"],
};
test("Sales Tasks uses the same saved action as My Work and completes that action once", async ({ page }) => {
  await login(page);
  const input = crmDiscovery();
  const summary = `SYN Navigation shared task ${input.initial_action.id}`;
  const title = `SYN Navigation task evidence ${input.id}`;
  const created = await page.request.post("/api/v1/crm/opportunities", {
    headers: { Origin: origin() }, data: { ...input, title,
      initial_action: { ...input.initial_action, activity_type: "Task", summary } },
  });
  expect(created.ok(), await created.text()).toBe(true);
  await page.goto("/sales/opportunities/new");
  await expect(page.getByRole("heading", { name: "Add deal", exact: true })).toBeVisible();
  await expect(page.getByLabel("Deal title", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add deal and action", exact: true })).toBeVisible();
  await page.goto(`/sales/opportunities/${input.id}`);
  await page.getByRole("button", { name: "Transfer deal owner", exact: true }).click();
  await expect(page.getByRole("dialog").getByLabel("New deal owner", { exact: true })).toBeVisible();
  await page.goto("/sales/tasks");
  const row = page.locator(`[data-activity="${input.initial_action.id}"]`);
  await revealSalesAction(page, input.initial_action.id, true);
  await capture(page, "sales-tasks-populated");
  await page.goto(`/work/actions?q=${encodeURIComponent(summary)}`);
  await expect(row).toBeVisible();
  await page.goto("/sales/pulse");
  await revealSalesAction(page, input.initial_action.id, false);
  await capture(page, "sales-pulse-populated");
  await page.goto("/sales/tasks");
  await revealSalesAction(page, input.initial_action.id, true);
  await row.getByRole("button", { name: `Complete: ${summary}`, exact: true }).click();
  await page.getByLabel("Notes", { exact: true }).fill("SYN Original action completed through Sales Tasks.");
  await page.getByLabel("No further action now", { exact: true }).check();
  await page.getByRole("button", { name: "Save outcome", exact: true }).click();
  await expect(row).toHaveCount(0);
  const detail = await page.request.get(`/api/v1/activities/${input.initial_action.id}`);
  const saved = await detail.json();
  expect(saved.items[0].id).toBe(input.initial_action.id);
  expect(saved.items[0].status).toBe("Completed");
  await page.goto(`/sales/opportunities?q=${encodeURIComponent(title)}`);
  await expect(page.locator(`[data-opportunity-id="${input.id}"]`)).toBeVisible();
  await capture(page, "sales-deals-populated");
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.getByRole("region", { name: "Deals List — scroll for all columns", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Forecast", exact: true }).click();
  await expect(page.getByRole("region", { name: "Deal forecast", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Board", exact: true }).click();
  await expect(page.locator(".ppo-primary-nav [aria-current=page]")).toHaveAttribute("aria-label", "Deals");
});
test("all seven actual department rails retain canonical order and dimensions", async ({ page }) => {
  await login(page);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  for (const [department, labels] of Object.entries(rails)) {
    if (department === "finance") await login(page, "finance");
    await page.goto(department === "finance" ? "/finance/handoffs" : `/work?department=${department}`);
    const nav = page.locator(".ppo-primary-nav");
    await expect(nav.getByRole("link").first()).toBeVisible();
    const expected = labels;
    await expect(nav.getByRole("link")).toHaveCount(expected.length);
    await expect.poll(() => nav.getByRole("link").evaluateAll(items => items.map(i => i.getAttribute("aria-label")))).toEqual(expected);
    expect(await page.locator(".ppo-rail").count()).toBe(1);
    expect(await nav.locator("svg").first().evaluate(e => e.getBoundingClientRect().width)).toBe(25);
    expect(await page.locator(".ppo-rail").evaluate(e => e.getBoundingClientRect().width)).toBe(76);
    expect(await nav.getByRole("link").first().evaluate(e => e.getBoundingClientRect().height)).toBe(48);
    const bounds = await nav.getByRole("link").first().boundingBox();
    expect(Math.abs(bounds!.x + bounds!.width / 2 - 38)).toBeLessThanOrEqual(4); // scrollbar allowance
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
  await expect(page.getByRole("navigation", { name: "Customer context sections" })).toHaveCount(0);
  const record = page.locator("main a[href^='/customers/']:not([href^='/customers/new'])").first();
  await expect(record).toBeVisible();
  const href = await record.getAttribute("href"); expect(href).toContain("department=engineering");
  await record.click(); await expect(page).toHaveURL(origin() + href!); await page.reload();
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
test("Finance chooser preserves the exact permitted account and its rail after reload", async ({ page }) => {
  await login(page, "finance");
  await page.goto("/finance/accounts");
  const account = page.locator("main a[href*='/account?account_id=']").first();
  await expect(account).toBeVisible();
  const href = await account.getAttribute("href");
  await account.click(); await expect(page).toHaveURL(origin() + href!);
  await page.reload();
  await expect(page.locator(".ppo-primary-nav [aria-current=page]")).toHaveAttribute("aria-label", "Customer accounts");
  await capture(page, "finance-exact-account");
});
test("Programme chooser opens a supported schedule context and returns to the chooser", async ({ page }) => {
  await login(page);
  const input = projectInput();
  const created = await page.request.post("/api/v1/projects", { headers: { Origin: origin() }, data: input });
  expect(created.ok(), await created.text()).toBe(true);
  await page.goto("/projects/programme");
  const link = page.locator(`main a[href="/projects/${input.id}?view=programme"]`);
  await expect(link).toBeVisible();
  await link.click(); await expect(page).toHaveURL(new RegExp(input.id + "\\?view=programme$"));
  await page.reload();
  await expect(page.locator(".ppo-primary-nav [aria-current=page]")).toHaveAttribute("aria-label", "Programme");
  await expect(page.getByRole("link", { name: "Programme — choose another project", exact: true })).toBeVisible();
  const schedule = page.getByRole("region", { name: "Project schedule workspace", exact: true });
  expect((await schedule.boundingBox())!.x).toBeLessThan(100);
  await capture(page, "programme-existing-schedule");
  await page.getByRole("link", { name: "Programme — choose another project", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/programme$/);
});
test("shared URL context survives unavailable browser storage", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("Synthetic storage unavailable"); };
    Storage.prototype.setItem = () => { throw new Error("Synthetic storage unavailable"); };
  });
  await login(page); await page.goto("/contacts?view=people&department=engineering");
  await expect(page.getByRole("navigation", { name: "Engineering shortcuts" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Engineering shortcuts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "People", exact: true })).toBeVisible();
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
  const headerBounds = await page.locator(".ppo-shell-header").boundingBox();
  for (const name of ["Open global search", "Page guide"]) {
    const bounds = await page.getByRole("button", { name, exact: true }).boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(headerBounds!.y + headerBounds!.height);
  }
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
