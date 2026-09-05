import { test, expect, type Page } from "@playwright/test";
const company = "20000000-0000-4000-8000-000000000001",
  site = "70000000-0000-4000-8000-000000000001",
  person = "60000000-0000-4000-8000-000000000001";
async function identity(page: Page, profile = "coordinator") {
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Use this identity", exact: true }),
  ).toBeEnabled();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
test("P03 customer, shared contact, site/equipment attribution and My Work at desktop/mobile widths", async ({
  page,
}, info) => {
  await page.goto("/customers");
  await identity(page);
  await expect(
    page.getByRole("heading", { name: "Customers", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "SYN Greenhouse Demonstration",
      exact: true,
    }),
  ).toHaveCount(2);
  await page
    .getByRole("link", { name: "SYN Greenhouse Demonstration", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Possible duplicate organisations" }),
  ).toBeVisible();
  await expect(page.getByText("000Ab-C.01")).toHaveCount(0);
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-customer.png"),
    fullPage: true,
  });
  await noOverflow(page);
  await page
    .getByRole("link", { name: "SYN Avery Contact", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Affiliations for this shared person" }),
  ).toBeVisible();
  await page.goto(`/sites/${site}`);
  await expect(
    page.getByRole("heading", { name: "Operator, owner and billing parties" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start service intake" }),
  ).toBeVisible();
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-site.png"),
    fullPage: true,
  });
  await noOverflow(page);
  await page.goto("/equipment/80000000-0000-4000-8000-000000000001");
  await expect(page.getByText(/did not resolve/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /SYN OEM query:/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-history.png"),
    fullPage: true,
  });
  await page.goto("/equipment/80000000-0000-4000-8000-000000000002");
  await expect(
    page.getByText(
      /Similar descriptions or serial candidates remain separate assets/,
    ),
  ).toBeVisible();
  await page.goto("/work");
  await expect(
    page.getByRole("heading", { name: "Overdue", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Due date needed", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-work.png"),
    fullPage: true,
  });
  await noOverflow(page);
  await page.getByLabel("Status", { exact: true }).selectOption("Completed");
  await expect(
    page.getByText(/SYN conversation recorded as a fictional fixture/),
  ).toBeVisible();
  await identity(page, "systems");
  await expect(
    page.getByRole("alert").filter({ hasText: /permission/ }),
  ).toBeVisible();
  await expect(
    page.getByText(/SYN conversation recorded as a fictional fixture/),
  ).toHaveCount(0);
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-permission.png"),
    fullPage: true,
  });
});
test("P03 persisted intake, validation retention, clarification completion, triage and conflict comparison", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto("/service/tickets/new");
  await identity(page);
  await page
    .getByLabel("Company visibility context", { exact: true })
    .selectOption(company);
  await page
    .getByLabel("Request summary", { exact: true })
    .fill(`SYN browser P03 ${info.project.name}`);
  await page
    .getByLabel("Requester description / clarification")
    .fill("SYN caller; identity and site need clarification");
  await page
    .getByLabel("Reported symptoms / explicit symptom uncertainty")
    .fill(
      "An intermittent alarm is reported.\nPrevious fix did not resolve it.",
    );
  await page
    .getByLabel("Next action", { exact: true })
    .fill("Clarify caller, site and operational impact");
  await page
    .getByLabel("Reason for saving")
    .fill("Capture incomplete synthetic intake");
  await expect(page.getByLabel("Triage and next-action owner")).toContainText(
    "SYN Coordinator",
  );
  await page
    .getByRole("button", { name: "Save service request", exact: true })
    .click();
  await expect(page).toHaveURL(/\/service\/tickets\/[0-9a-f-]{36}$/);
  const url = page.url();
  await expect(
    page.getByRole("heading", { name: /SYN browser P03/ }),
  ).toBeVisible();
  await page
    .getByLabel("Reason for this triage action")
    .fill("Urgency cannot bypass missing information");
  await page
    .getByRole("button", { name: "Complete triage", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: /Complete the listed intake requirements/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Request summary", { exact: true })).toHaveValue(
    `SYN browser P03 ${info.project.name}`,
  );
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-intake-validation.png"),
    fullPage: true,
  });
  await page
    .getByText("Request information with owned follow-up", { exact: true })
    .click();
  await page
    .getByLabel("Open clarification questions")
    .fill(
      "Confirm caller identity and exact site.\nWhat is the operational impact?",
    );
  await page
    .getByRole("button", { name: "Request information", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Owned clarification", exact: true }),
  ).toBeVisible();
  const activityLink = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "Owned clarification",
        exact: true,
      }),
    })
    .getByRole("link");
  const href = await activityLink.getAttribute("href");
  await page
    .getByLabel("Known requester", { exact: true })
    .selectOption(person);
  await page.getByLabel("Known site", { exact: true }).selectOption(site);
  await page
    .getByLabel("Operational impact", { exact: true })
    .fill("Sensor readings interrupt monitoring");
  await page
    .getByLabel("Priority rationale", { exact: true })
    .fill("Urgent assessment; no work or booking is authorised");
  await page.getByLabel("Priority", { exact: true }).selectOption("Urgent");
  await page
    .getByLabel("Reason for saving")
    .fill("Record clarified business context");
  // A distinct API writer changes the same aggregate; the browser must keep its proposed form.
  const id = url.split("/").at(-1)!;
  const old = (
    await (await page.request.get(`/api/v1/service/tickets/${id}`)).json()
  ).items[0];
  await page.request.post(`/api/v1/service/tickets/${id}/save-intake`, {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: {
      operation_id: crypto.randomUUID(),
      schema_version: 1,
      reason: "Competing browser test writer",
      expected_version: old.version,
      received_at: old.received_at,
      channel: old.channel,
      requester_id: old.requester_id,
      requester_description: old.requester_description,
      site_id: old.site_id,
      site_identification_needed: old.site_identification_needed,
      asset_id: old.asset_id,
      summary: "SYN competing edit",
      symptom: old.symptom,
      impact: old.impact,
      priority: old.priority,
      priority_reason: old.priority_reason,
      triage_owner_id: old.triage_owner_id,
      next_action: old.next_action,
    },
  });
  await page
    .getByRole("button", { name: "Save intake details", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: /This request changed/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Request summary", { exact: true })).toHaveValue(
    `SYN browser P03 ${info.project.name}`,
  );
  await page
    .getByRole("button", { name: "Compare current saved version", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Use current version with my entries",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-intake-conflict.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Use current version with my entries",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Save intake details", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved to the server." }),
  ).toBeVisible();
  await page.goto(href!);
  await page
    .getByLabel("Reason for change", { exact: true })
    .fill("Complete owned clarification");
  await page
    .getByLabel("Completion outcome or cancellation reason")
    .fill("Caller, site and impact confirmed in synthetic demonstration.");
  await page
    .getByRole("button", { name: "Complete with outcome", exact: true })
    .click();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await page.goto(url);
  await page
    .getByLabel("Reason for this triage action")
    .fill("Intake questions resolved");
  await page
    .getByLabel("How the clarification questions were resolved")
    .fill("Known requester and site now linked; operational impact recorded");
  await page
    .getByRole("button", { name: "Complete triage", exact: true })
    .click();
  await expect(page.getByText("Triaged", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-triaged.png"),
    fullPage: true,
  });
  await noOverflow(page);
});
test("P03 unavailable and empty queues stay distinct; keyboard focus and network-failed form entries survive", async ({
  page,
}, info) => {
  const retainedName = `SYN retained new customer ${info.project.name}`;
  await page.goto("/work");
  await identity(page);
  await page
    .getByLabel("Search activities", { exact: true })
    .fill("SYN no matching action 493021");
  await expect(
    page.getByText("No permitted activities match these filters."),
  ).toBeVisible();
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-empty.png"),
    fullPage: true,
  });
  await page.route("**/api/v1/work?**", (route) => route.abort());
  await page
    .getByRole("button", { name: "Refresh activities", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: /could not be confirmed/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("P03-unavailable.png"),
    fullPage: true,
  });
  await page.goto("/customers/new?kind=customer");
  await page
    .getByLabel("Company visibility context", { exact: true })
    .selectOption(company);
  await page.getByLabel("Display name", { exact: true }).fill(retainedName);
  await page
    .getByLabel("Reason for capture")
    .fill("Verify recoverable connection failure");
  await expect(page.getByLabel("Relationship / site owner")).toContainText(
    "SYN Coordinator",
  );
  await page.route("**/api/v1/customers", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /could not be confirmed/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
    retainedName,
  );
  await page.keyboard.press("Tab");
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
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
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /response could not be read/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
    retainedName,
  );
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page).toHaveURL(/\/customers\/[0-9a-f-]{36}$/);
  expect(operationIds).toHaveLength(2);
  expect(operationIds[1]).toBe(operationIds[0]);
  await expect(
    page.getByRole("heading", { name: retainedName, exact: true }),
  ).toBeVisible();
  const records = await (
    await page.request.get(
      `/api/v1/customers?q=${encodeURIComponent(retainedName)}`,
    )
  ).json();
  expect(records.items).toHaveLength(1);
});
