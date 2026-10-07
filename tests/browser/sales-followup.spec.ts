import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmBase, CRM } from "../helpers/crm";
import { leadCreate } from "../helpers/leads";
import { projectInput } from "../helpers/projects";
test.describe.configure({ timeout: 120000 });
test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => void dialog.accept());
});
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000" },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function pick(page: Page, label: string, id: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.locator(`[role=option][data-record-id="${id}"]`).click();
}
async function fixture(page: Page, restricted = false) {
  await call(page, "local-session", { profile: "coordinator" });
  const project = projectInput();
  await call(page, "projects", project);
  const a = {
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
    site_id: CRM.site,
    owner_id: CRM.owner,
    summary: `SYN LC17 observed need ${randomUUID()}`,
    kind: restricted ? "TechnicalFollowUp" : "CustomerContact",
    access_class: restricted ? "RestrictedService" : "Internal",
    due_at: "2031-10-01T00:00:00.000Z",
    due_needed: false,
    links: [{ object_type: "Project", object_id: project.id }] as {
      object_type: string;
      object_id: string;
    }[],
  };
  if (restricted) {
    const ticket = randomUUID();
    await call(page, "service/tickets", {
      ...crmBase(),
      id: ticket,
      company_id: CRM.company,
      summary: "SYN customer requests a follow-up after service",
      symptom: "SYN reported monitoring gap",
      received_at: "2026-10-07T00:00:00.000Z",
      channel: "Manual",
      requester_id: null,
      requester_description: "SYN customer contact",
      site_id: CRM.site,
      site_identification_needed: false,
      asset_id: null,
      impact: "Monitoring",
      priority: "Normal",
      priority_reason: "SYN no work authorisation",
      triage_owner_id: CRM.owner,
      next_action: "SYN Review the reported need",
    });
    a.links = [
      { object_type: "Ticket", object_id: ticket },
      { object_type: "Organisation", object_id: CRM.org },
    ];
  }
  await call(page, "activities", a);
  return { project, a };
}
test("LC-17 Project need creates and recovers a native Lead, then explicitly links and plans the retained Activity", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const project = projectInput();
  await call(page, "projects", project);
  await page.goto(`/projects/${project.id}`);
  await page
    .getByRole("button", { name: "Sales handovers", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Record a customer need for Sales review" })
    .click();
  await expect(page.getByLabel("Linked record", { exact: true })).toHaveValue(
    project.id,
  );
  await expect(
    page.getByLabel("Activity category", { exact: true }),
  ).toHaveValue("CustomerContact");
  await expect(page.getByLabel("Content access", { exact: true })).toHaveValue(
    "Internal",
  );
  await page
    .getByLabel("Purpose / summary", { exact: true })
    .fill("SYN Customer asks about another growing area");
  await page.getByLabel("Due date still needed", { exact: true }).uncheck();
  await page
    .getByLabel("Due date and time", { exact: true })
    .fill("2031-10-07T09:00");
  await page
    .getByRole("button", { name: "Create activity", exact: true })
    .click();
  await expect(page).toHaveURL(/\/work\/[a-f0-9-]+$/);
  const id = page.url().split("/").at(-1)!,
    original = (await call(page, `activities/${id}`)).items[0];
  await page
    .getByLabel("I reviewed existing Sales records for this customer need")
    .check();
  await page
    .getByRole("link", { name: "Create Lead and return for link review" })
    .click();
  await page
    .getByLabel("Lead title", { exact: true })
    .fill(`SYN LC17 returned Lead ${randomUUID()}`);
  let posts = 0;
  await page.route("**/api/v1/crm/leads", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    posts++;
    const r = await route.fetch();
    expect(r.ok(), await r.text()).toBe(true);
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "Save lead", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Check original Sales creation" }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`/work/${id}\\?sales_kind=Lead`));
  expect(posts).toBe(1);
  const target = new URL(page.url()).searchParams.get("sales_candidate")!;
  await page
    .getByLabel("I reviewed existing Sales records for this customer need")
    .check();
  await page
    .getByRole("button", { name: "Compare Sales link", exact: true })
    .click();
  await page
    .getByLabel("Reason for Sales link", { exact: true })
    .fill("SYN Existing enquiries checked; retain delivery source");
  await page
    .getByRole("heading", { name: "Review fixed Sales comparison" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("project-lead-link-review.png"),
  });
  await page
    .getByRole("button", { name: "Link reviewed Sales record", exact: true })
    .click();
  await page
    .getByRole("link", {
      name: "Review this Activity as the Lead’s next action",
    })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Next activity", exact: true }),
  ).toHaveValue(id);
  const planned = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === `/api/v1/crm/leads/${target}/next-action`);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const planResponse=await planned;
  expect(planResponse.ok(),await planResponse.text()).toBe(true);
  expect((await call(page, `crm/leads/${target}`)).next_activity.id).toBe(id);
  const a = (await call(page, `activities/${id}`)).items[0];
  expect(a.owner_id).toBe(original.owner_id);
  expect(a.due_at).toBe(original.due_at);
  expect(a.status).toBe(original.status);
  expect(a.links).toHaveLength(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("LC-17 restricted follow-up creates a separate review and a qualified Deal; original link recovery survives completion", async ({
  page,
}, info) => {
  const { a } = await fixture(page, true);
  await call(page, `activities/${a.id}/complete`, {
    ...crmBase(),
    expected_version: 1,
    outcome: "SYN technical review completed",
  });
  const original = (await call(page, `activities/${a.id}`)).items[0];
  await page.goto(`/work/${a.id}`);
  await page
    .getByText("Prepare a separate owned Sales review", { exact: true })
    .click();
  await page
    .getByLabel("Reviewed customer need", { exact: true })
    .fill("SYN Customer requests a separately qualified upgrade");
  await page
    .getByLabel("Sales review due date and time", { exact: true })
    .fill("2031-10-08T10:00");
  await page
    .getByLabel("I reviewed this wording for Internal Sales access")
    .check();
  await page
    .getByLabel("Reason for separate Sales review")
    .fill("SYN New customer need requires its own accountable review");
  await page
    .getByRole("button", { name: "Create owned Sales review", exact: true })
    .click();
  await expect(page).not.toHaveURL(new RegExp(a.id));
  await expect(page).toHaveURL(/\/work\/[a-f0-9-]+$/);
  const id = page.url().split("/").at(-1)!;
  await page.getByLabel("Sales destination type").selectOption("Opportunity");
  await page
    .getByLabel("I reviewed existing Sales records for this customer need")
    .check();
  await page
    .getByRole("link", {
      name: "Create qualified Deal and return for link review",
    })
    .click();
  await page
    .getByLabel("Deal title", { exact: true })
    .fill(`SYN LC17 qualified upgrade ${randomUUID()}`);
  await page
    .getByLabel("Qualification outcome", { exact: true })
    .fill("SYN Known customer need reviewed; no order authority");
  await pick(page, "Contact", CRM.person);
  await page
    .getByLabel("Action purpose", { exact: true })
    .fill("SYN Confirm scoped next discussion with customer");
  await page
    .getByRole("button", { name: "Add deal and action", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/work/${id}\\?sales_kind=Opportunity`),
  );
  const target = new URL(page.url()).searchParams.get("sales_candidate")!,
    before = (await call(page, `crm/opportunities/${target}`)).items[0];
  await page
    .getByLabel("I reviewed existing Sales records for this customer need")
    .check();
  await page
    .getByRole("button", { name: "Compare Sales link", exact: true })
    .click();
  await page
    .getByLabel("Reason for Sales link")
    .fill("SYN Qualified new need, with retained restricted original");
  let posts = 0;
  await page.route(
    `**/api/v1/activities/${id}/sales-followup`,
    async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      posts++;
      const r = await route.fetch();
      expect(r.ok(), await r.text()).toBe(true);
      await route.abort("failed");
    },
  );
  await page
    .getByRole("button", { name: "Link reviewed Sales record", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check original Sales link" }),
  ).toBeVisible();
  await call(page, `activities/${id}/complete`, {
    ...crmBase(),
    expected_version: 2,
    outcome: "SYN completed discussion",
  });
  await page.getByRole("button", { name: "Check original Sales link" }).click();
  await expect(page.getByText("Link recorded", { exact: false })).toBeVisible();
  expect(posts).toBe(1);
  expect((await call(page, `activities/${a.id}`)).items[0]).toEqual(original);
  const after = (await call(page, `crm/opportunities/${target}`)).items[0];
  expect(after.version).toBe(before.version);
  expect(after.next_activity.id).toBe(before.next_activity.id);
  expect(after.actions.some((x: { id: string }) => x.id === id)).toBe(true);
  await page
    .getByRole("heading", { name: "Continue a customer need in Sales" })
    .scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("retained-review-deal-history.png"),
  });
});
test("LC-17 fixed comparison refuses stale context and a denied refresh clears private review", async ({
  page,
}) => {
  const { a } = await fixture(page),
    lead = leadCreate();
  await call(page, "crm/leads", lead);
  await page.goto(`/work/${a.id}?sales_kind=Lead&sales_candidate=${lead.id}`);
  await page
    .getByLabel("I reviewed existing Sales records for this customer need")
    .check();
  await page
    .getByRole("button", { name: "Compare Sales link", exact: true })
    .click();
  await page
    .getByLabel("Reason for Sales link")
    .fill("SYN private review text");
  await call(page, `activities/${a.id}/start`, {
    ...crmBase(),
    expected_version: 1,
  });
  await page
    .getByRole("button", { name: "Refresh Sales follow-up context" })
    .click();
  await expect(
    page.getByText(
      "Saved context changed. Discard and compare again before linking.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Link reviewed Sales record", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "reviewed Activity changed" }),
  ).toBeVisible();
  expect((await call(page, `activities/${a.id}`)).items[0].links).toHaveLength(
    1,
  );
  await page.route(`**/api/v1/activities/${a.id}/sales-followup?*`, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Unavailable",
        message: "SYN access removed",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Refresh Sales follow-up context" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review fixed Sales comparison" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Reason for Sales link")).toHaveCount(0);
  await page.unroute(`**/api/v1/activities/${a.id}/sales-followup?*`);
  await page
    .getByRole("button", { name: "Retry Sales follow-up context" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Continue a customer need in Sales" }),
  ).toBeVisible();
});
