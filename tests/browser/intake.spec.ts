import { test, expect, type Page } from "@playwright/test";
import { openAccountPanel, identityToggle } from "../helpers/phone-menu";
const company = "20000000-0000-4000-8000-000000000001",
  site = "70000000-0000-4000-8000-000000000001",
  person = "60000000-0000-4000-8000-000000000001";
async function identity(page: Page, profile = "coordinator") {
  await expect(
    page.getByRole("region", {
      name: "Local demonstration identity",
      exact: true,
    }),
  ).toHaveAttribute("aria-busy", "false");
  if (!(await page.getByLabel("Identity", { exact: true }).isVisible())) await openAccountPanel(page);

  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page.getByRole("button", { name: "Use this identity", exact: true }).click();
  await expect(identityToggle(page)).toBeEnabled();
  await expect(
    page.getByRole("region", {
      name: "Local demonstration identity",
      exact: true,
    }),
  ).toHaveAttribute("aria-busy", "false");
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
async function capture(page: Page, info: { outputPath: (name: string) => string }, name: string) {
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath(name), fullPage: true });
}
test("P03 customer, shared contact, site/equipment attribution and My Work at desktop/mobile widths", async ({
  page,
}, info) => {
  await page.goto("/customers");
  await identity(page);
  await expect(page.getByRole("heading", { name: "Organisations", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "SYN Greenhouse Demonstration",
      exact: true,
    }),
  ).toHaveCount(2);
  await capture(page, info, "P03-customers-list.png");
  await page.getByRole("link", { name: "SYN Greenhouse Demonstration", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Possible duplicate organisations" })).toBeVisible();
  await expect(page.getByText("000Ab-C.01")).toHaveCount(0);
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  const duplicates = page.locator("section.detail-section").filter({
    has: page.getByRole("heading", {
      name: "Possible duplicate organisations",
      exact: true,
    }),
  });
  await expect(duplicates.getByRole("link", { name: /SYN-PPO-ORG-000005/ })).toHaveAttribute(
    "href",
    "/customers/50000000-0000-4000-8000-000000000005",
  );
  await expect(duplicates.locator('a[href="/customers/50000000-0000-4000-8000-000000000001"]')).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-customer.png"),
    fullPage: true,
  });
  await noOverflow(page);
  const stakeholders = page.getByRole("link", {
    name: "Stakeholders & relationships",
    exact: true,
  });
  await page.getByRole("button", { name: "Organisation actions", exact: true }).click();
  await expect(stakeholders).toHaveAttribute("href", "/customers/50000000-0000-4000-8000-000000000001/stakeholders");
  await stakeholders.click();
  await expect(page).toHaveURL(`/customers/50000000-0000-4000-8000-000000000001/stakeholders`);
  const currentContact = page
    .getByRole("tabpanel", { name: "Current & future", exact: true })
    .getByRole("link", { name: "SYN Avery Contact", exact: true });
  await expect(currentContact).toHaveAttribute("href", `/people/${person}`);
  await currentContact.click();
  await page.getByRole("tab", { name: "Relationships", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Organisation affiliations",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Purchasing authority: Unknown/).first()).toBeVisible();
  await capture(page, info, "P03-contact.png");
  await page.goto(`/sites/${site}`);
  await expect(page.getByRole("heading", { name: "Operator, owner and billing parties" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start service intake" })).toBeVisible();
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-site.png"),
    fullPage: true,
  });
  await noOverflow(page);
  await page.goto("/equipment/80000000-0000-4000-8000-000000000001");
  await page.getByRole("tab", { name: "Documents & service", exact: true }).click();
  await expect(
    page.getByText("SYN cable replacement did not resolve intermittent reading; cause suspected.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /SYN OEM query:/ })).toBeVisible();
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-history.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Create follow-up", exact: true }).click();
  await page.getByLabel("What needs doing?", { exact: true }).fill("SYN inspect owned equipment follow-up form");
  await capture(page, info, "P03-create-activity.png");
  await page.goto("/equipment/80000000-0000-4000-8000-000000000002");
  await expect(page.getByText(/Similar descriptions or serial candidates remain separate assets/)).toBeVisible();
  await capture(page, info, "P03-identity-uncertainty.png");
  // My actions is the activity list behind My Work; its due windows are applied on the server.
  await page.goto("/work/actions");
  // Other browser journeys may fill the first permitted page. Select each
  // server-side due window instead of assuming every bucket is on page one.
  await page.getByLabel("Due date", { exact: true }).selectOption("Overdue");
  await expect(page.getByRole("heading", { name: "Overdue", exact: true })).toBeVisible();
  await capture(page, info, "P03-work-overdue.png");
  await page.getByLabel("Due date", { exact: true }).selectOption("Needed");
  await expect(page.getByRole("heading", { name: "Date needed", exact: true })).toBeVisible();
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-work.png"),
    fullPage: true,
  });
  await noOverflow(page);
  await page.getByLabel("Due date", { exact: true }).selectOption("");
  await page.getByLabel("Status", { exact: true }).selectOption("Completed");
  await expect(page.getByText(/SYN conversation recorded as a fictional fixture/)).toBeVisible();
  await identity(page, "systems");
  await expect(page.getByRole("alert").filter({ hasText: /permission/ })).toBeVisible();
  await expect(page.getByText(/SYN conversation recorded as a fictional fixture/)).toHaveCount(0);
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-permission.png"),
    fullPage: true,
  });
});
test("SV-01/SV-02 persisted logging, customer statement and atomic owned clarification triage", async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(120000);
  const origin = baseURL!;
  await page.request.post(origin + "/api/v1/local-session", {
    headers: { origin },
    data: { profile: "coordinator" },
  });
  await page.goto(`/service/tickets/new?site_id=${site}`);
  await expect(page.getByLabel("Site", { exact: true })).toHaveValue(site);
  await page.getByLabel("Summary", { exact: true }).fill(`SYN accepted intake ${info.project.name}`);
  await page.getByLabel("Caller", { exact: true }).selectOption(person);
  await page.getByLabel("Reported symptoms", { exact: true }).fill("SYN intermittent alarm reported");
  await page.getByLabel("Impact and backup", { exact: true }).fill("Manual monitoring in place");
  await page.getByLabel("Priority reason", { exact: true }).fill("Review while manual monitoring continues");
  await page.getByLabel("Next action", { exact: true }).fill("Confirm the sensor identity");
  await page.getByLabel("Reason for logging", { exact: true }).fill("Capture the synthetic call");
  await page.getByRole("button", { name: "Log request", exact: true }).click();
  await expect(page).toHaveURL(/\/service\/tickets\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").at(-1)!;
  await page.getByRole("tab", { name: "Updates", exact: true }).click();
  await page.getByRole("tabpanel").getByRole("button", { name: "Record customer statement", exact: true }).click();
  const statement = page.getByRole("dialog", {
    name: "Record customer statement",
    exact: true,
  });
  await statement.getByLabel("Customer statement", { exact: true }).fill("SYN caller says the alarm returned");
  await statement.getByLabel("Who said this?", { exact: true }).fill("SYN caller");
  await statement.getByLabel("Reason for recording", { exact: true }).fill("Retain the original customer words");
  await statement.getByRole("button", { name: "Record statement", exact: true }).click();
  await expect(statement).toHaveCount(0);
  let t = (await (await page.request.get(`/api/v1/service/tickets/${id}`)).json()).items[0];
  expect(t.version).toBe(2);
  expect(t.status).toBe("New");
  expect(t.symptom).toBe("SYN intermittent alarm reported");
  const activity = crypto.randomUUID();
  const requested = await page.request.post(`/api/v1/service/tickets/${id}/request-information`, {
    headers: { origin },
    data: {
      operation_id: crypto.randomUUID(),
      schema_version: 1,
      expected_version: 2,
      reason: "Clarify sensor identity",
      open_questions: "Which sensor was replaced?",
      next_action: "Confirm sensor identity",
      follow_up: {
        id: activity,
        owner_id: t.triage_owner_id,
        due_needed: true,
        due_at: null,
      },
    },
  });
  expect(requested.status()).toBe(200);
  await page.reload();
  await page.getByRole("button", { name: "Complete triage", exact: true }).filter({ visible: true }).click();
  await page.getByLabel("Clarification outcome", { exact: true }).fill("SYN caller confirmed the replaced sensor");
  await page.getByLabel("Reviewed priority", { exact: true }).selectOption("High");
  await page
    .getByLabel("Reason for this triage action", { exact: true })
    .fill("Clarification received; review next action");
  await page.getByRole("button", { name: "Complete triage", exact: true }).filter({ visible: true }).click();
  await expect(page.locator(".sv-triage-form")).toHaveCount(0);
  t = (await (await page.request.get(`/api/v1/service/tickets/${id}`)).json()).items[0];
  expect(t.version).toBe(4);
  expect(t.status).toBe("Triaged");
  expect(t.priority).toBe("High");
  expect(t.clarification_activity.status).toBe("Completed");
  expect(t.clarification_activity.outcome).toBe("SYN caller confirmed the replaced sensor");
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("SV02-persisted-triage.png") });
});
test("P03 unavailable and empty queues stay distinct; keyboard focus and network-failed form entries survive", async ({
  page,
}, info) => {
  const retainedName = `SYN retained new customer ${info.project.name} ${crypto.randomUUID()}`;
  // My actions is the activity list behind My Work; the Overview is a bounded preview of it.
  await page.goto("/work/actions");
  await identity(page);
  await page.getByLabel("Search activities", { exact: true }).fill("SYN no matching action 493021");
  await expect(page.getByText("No permitted activities match these filters.")).toBeVisible();
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-empty.png"),
    fullPage: true,
  });
  await page.route("**/api/v1/work/actions?**", (route) => route.abort());
  await page.getByRole("button", { name: "Refresh activities", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /could not be confirmed/ })).toBeVisible();
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-unavailable.png"),
    fullPage: true,
  });
  await page.goto("/customers/new?kind=customer");
  await page.getByLabel("Company visibility context", { exact: true }).selectOption(company);
  await page.getByLabel("Display name", { exact: true }).fill(retainedName);
  await page.getByLabel("Reason for capture").fill("Verify recoverable connection failure");
  await expect(page.getByLabel("Relationship / site owner")).toContainText("SYN Coordinator");
  await page.route("**/api/v1/customers", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await page.getByRole("button", { name: "Create organisation", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /could not be confirmed/ })).toBeVisible();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(retainedName);
  await page.keyboard.press("Tab");
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-failure-focus.png"),
    fullPage: true,
  });
  await noOverflow(page);
  // Lose a real accepted receipt, then retry: the original operation must be replayed, not duplicated.
  await page.unroute("**/api/v1/customers");
  const operationIds: string[] = [];
  await page.route("**/api/v1/customers", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    operationIds.push(route.request().postDataJSON().operation_id);
    const response = await route.fetch();
    if (operationIds.length === 1)
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{",
      });
    else await route.fulfill({ response });
  });
  await page.getByRole("button", { name: "Create organisation", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /response could not be read/ })).toBeVisible();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(retainedName);
  await page.getByRole("button", { name: "Create organisation", exact: true }).click();
  await expect(page).toHaveURL(/\/customers\/[0-9a-f-]{36}$/);
  expect(operationIds).toHaveLength(2);
  expect(operationIds[1]).toBe(operationIds[0]);
  await expect(page.getByRole("heading", { name: retainedName, exact: true })).toBeVisible();
  const records = await (await page.request.get(`/api/v1/customers?q=${encodeURIComponent(retainedName)}`)).json();
  expect(records.items).toHaveLength(1);
});
