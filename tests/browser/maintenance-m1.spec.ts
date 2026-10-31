// PPO-MAINTENANCE-TS02-DEC M1 browser proof: six-monthly and yearly interval choices, Prepare owned
// Service request creating its Draft work order, the follow-on action's Partial-only offer and the
// work order's warning before a plan task's wording is changed. Synthetic data only.
import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
const C = {
  company: "20000000-0000-4000-8000-000000000001",
  site: "70000000-0000-4000-8000-000000000001",
  customer: "50000000-0000-4000-8000-000000000001",
  asset: "80000000-0000-4000-8000-000000000001",
  owner: "30000000-0000-4000-8000-000000000001",
  finance: "30000000-0000-4000-8000-000000000012",
};
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN M1 browser proof",
});
const source = () => ({
  reference: "SYN-M1-BROWSER-SOURCE",
  revision: "1",
  availability: "Available",
  source_date: "2026-01-01",
  content: "SYN exact contract evidence; no business policy",
  access_class: "RestrictedService",
});
const tasks = [
  "SYN exact visual observation of the dosing enclosure",
  "SYN identify the irrigation controller firmware label",
];
const origin = () => new URL(test.info().project.use.baseURL!).origin;
async function login(page: Page, profile = "coordinator") {
  const r = await page.request.post("/api/v1/local-session", {
    headers: { origin: origin() },
    data: { profile },
  });
  expect(r.status()).toBe(200);
}
async function post(page: Page, path: string, data: unknown) {
  const r = await page.request.post("/api/v1/" + path, { headers: { origin: origin() }, data });
  expect([200, 201], await r.text()).toContain(r.status());
  return r.json();
}
async function read(page: Page, path: string) {
  const r = await page.request.get("/api/v1/" + path);
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}
// A reviewed six-monthly plan with two tasks, its first generated occurrence and a Covered entitlement.
async function fixtures(page: Page) {
  const ag = randomUUID(),
    pl = randomUUID(),
    en = randomUUID();
  await post(page, "maintenance/agreements", {
    ...base(),
    id: ag,
    company_id: C.company,
    customer_id: C.customer,
    owner_id: C.owner,
    content: {
      title: "SYN M1 agreement",
      effective_from: "2026-01-01",
      effective_to: "2028-12-31",
      service_scope: "SYN visual scope",
      exclusions: "No invasive work",
      response_terms: null,
      charging_basis: "Independent Finance review",
      billing_owner_id: C.finance,
      responsibilities: "Source-owned review",
      source: source(),
      sites: [
        {
          site_id: C.site,
          mode: "WholeSite",
          facility_ids: [],
          asset_ids: [C.asset],
          excluded_facility_ids: [],
          excluded_asset_ids: [],
        },
      ],
    },
  });
  await login(page, "finance-reviewer");
  await post(page, `maintenance/agreements/${ag}`, {
    ...base(),
    expected_version: 1,
    action: "Approve",
    authority_reference: "SYN separate commercial approval",
  });
  await login(page);
  const rev = (await read(page, `maintenance/agreements/${ag}`)).row.current_revision_id;
  await post(page, "maintenance/plans", {
    ...base(),
    id: pl,
    company_id: C.company,
    site_id: C.site,
    customer_id: C.customer,
    asset_id: C.asset,
    owner_id: C.owner,
    content: {
      title: "SYN six-monthly plan",
      agreement_revision_id: rev,
      task_set_reference: "SYN-TASK",
      task_set_revision: "1",
      interval: "SixMonthly",
      interval_source: source(),
      anchor: "2026-01-31",
      timezone: "Australia/Sydney",
      window_months: 12,
      tolerance: null,
      effective_from: "2026-01-01",
      tasks: tasks.map((description, i) => ({
        id: randomUUID(),
        description,
        expected_outcome: "Retain the observed condition",
        completion_requirements: "Reviewed source evidence",
        kind: i ? "Identification" : "Inspection",
      })),
    },
  });
  await post(page, `maintenance/plans/${pl}`, { ...base(), expected_version: 1, action: "Review" });
  await post(page, `maintenance/plans/${pl}`, {
    ...base(),
    expected_version: 2,
    action: "Generate",
    from: "2026-01-01",
    until: "2027-01-01",
  });
  const plan = await read(page, `maintenance/plans/${pl}`);
  const due = plan.history.find((e: { action: string }) => e.action === "Generated").content.created[0];
  await post(page, "maintenance/coverage", {
    ...base(),
    id: en,
    company_id: C.company,
    site_id: C.site,
    customer_id: C.customer,
    asset_id: C.asset,
    assessment: {
      status: "Covered",
      basis: "SYN available source reviewed",
      cause: "Cause assessed separately",
      owner_id: C.owner,
      review_due: "2026-10-01",
      next_action: "Owned review",
      event_date: "2026-01-31",
      agreement_revision_id: rev,
      facility_id: null,
    },
  });
  return { pl, due, en, generated: plan.history.find((e: { action: string }) => e.action === "Generated").content.created };
}
const noOverflow = (page: Page) =>
  page.evaluate(() =>
    [document.documentElement, document.querySelector("#main")].every(
      (el) => !el || el.scrollWidth <= el.clientWidth + 1,
    ),
  );
test.beforeEach(async ({ page }) => login(page));
test("six-monthly plans, prepared work orders, Partial-only follow-on and the plan wording warning", async ({ page }) => {
  test.setTimeout(180000);
  const f = await fixtures(page);
  // M-R1: the plan generated six-monthly dates, and the successor form offers all four intervals.
  expect(f.generated).toHaveLength(2);
  await page.goto(`/maintenance/plans/${f.pl}?view=actions`);
  const successor = page.locator("details.ma-action").filter({
    has: page.locator("summary", { hasText: "Prepare successor plan" }),
  });
  await successor.locator("summary").click();
  const interval = successor.getByLabel("Sourced interval", { exact: false });
  await expect(interval).toHaveValue("SixMonthly");
  await expect(interval.locator("option")).toHaveText(["Select…", "Monthly", "Quarterly", "Six Monthly", "Yearly"]);

  // M-R2: an Open occurrence offers Prepare owned Service request, not a follow-on.
  await page.goto(`/maintenance/due/${f.due}?view=actions`);
  await expect(page.locator("summary", { hasText: "Prepare owned Service request" })).toBeVisible();
  await expect(page.locator("summary", { hasText: "Prepare follow-on Service request" })).toHaveCount(0);
  const prepare = page.locator("details.ma-action").filter({
    has: page.locator("summary", { hasText: "Prepare owned Service request" }),
  });
  await prepare.locator("summary").click();
  await prepare.getByLabel("Exact entitlement assessment", { exact: false }).selectOption(f.en);
  await prepare.getByLabel("Responsible owner", { exact: false }).selectOption(C.owner);
  await prepare.getByLabel("Reason for this action", { exact: true }).fill("SYN prepare planned work");
  await prepare.getByRole("button", { name: "Prepare owned Service request", exact: true }).click();
  await expect(page.getByText("Record version 2", { exact: true })).toBeVisible();
  const detail = await read(page, `maintenance/due/${f.due}`);
  const request = detail.sources.requests[0];
  expect(request.work_order.status).toBe("Draft");
  // A Requested occurrence offers neither preparation action.
  await expect(page.locator("summary", { hasText: "Prepare owned Service request" })).toHaveCount(0);
  await expect(page.locator("summary", { hasText: "Prepare follow-on Service request" })).toHaveCount(0);
  await page.goto(`/maintenance/due/${f.due}`);
  const open = page.getByRole("link", { name: `Open work order ${request.work_order.display_number}`, exact: true });
  await expect(open).toBeVisible();
  expect(await noOverflow(page)).toBe(true);
  await open.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("due-prepared.png") });

  // The prepared work order carries the plan's tasks; changing one task's wording shows the warning.
  await open.click();
  await expect(page).toHaveURL(new RegExp(`/service/work-orders/${request.work_order.id}`));
  await page.getByText("Edit scope draft", { exact: true }).click();
  const first = page.getByLabel("Task description", { exact: false }).first();
  await expect(first).toHaveValue(tasks[0]);
  await expect(page.getByLabel("Task description", { exact: false }).nth(1)).toHaveValue(tasks[1]);
  const warning = page.getByText(/no longer matches the maintenance plan task wording exactly/);
  await expect(warning).toHaveCount(0);
  await first.fill(`${tasks[0]} and its cable glands`);
  await expect(warning).toBeVisible();
  await expect(warning).toContainText("Task 1");
  expect(await noOverflow(page)).toBe(true);
  await warning.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("work-order-warning.png") });
  await first.fill(tasks[0]);
  await expect(warning).toHaveCount(0);
  // #770 review R2: replacing task 2 with task 1's wording leaves every item matching some plan
  // task, yet plan task 2 has no item, so the warning names the missing plan wording.
  const second = page.getByLabel("Task description", { exact: false }).nth(1);
  const missing = page.getByText(/no scope task with its exact wording/);
  await expect(missing).toHaveCount(0);
  await second.fill(tasks[0]);
  await expect(missing).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: tasks[1] })).toBeVisible();
  await expect(warning).toHaveCount(0);
  expect(await noOverflow(page)).toBe(true);
  await second.fill(tasks[1]);
  await expect(missing).toHaveCount(0);
  // Removing a required task warns the same way; nothing blocks saving.
  await page.getByRole("button", { name: "Remove task 2" }).click();
  await expect(missing).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: tasks[1] })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save scope draft" })).toBeEnabled();
});
