import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmBase, crmDiscovery, CRM } from "../helpers/crm";
import { projectInput, taskInput } from "../helpers/projects";
import { emptyHandover } from "../../src/sales/handover-model";

test.describe.configure({ timeout: 120000 });
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000" },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function fixture(
  page: Page,
  kind: "Projects" | "Service" = "Projects",
  unknown = false,
) {
  await call(page, "local-session", { profile: "coordinator" });
  const o = { ...crmDiscovery(), title: `SYN LC16 ${kind} ${randomUUID()}` },
    id = randomUUID();
  o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  o.initial_action.due_needed = false;
  if (unknown) {
    o.site_id = null;
    o.site_unknown_reason = "SYN receiver identifies site";
  }
  await call(page, "crm/opportunities", o);
  for (const [i, stage_id] of [
    "Scoping",
    "Quoting",
    "Negotiation",
    "Closing",
  ].entries())
    await call(page, `crm/opportunities/${o.id}/stage`, {
      ...crmBase(),
      expected_version: i + 1,
      stage_id,
      qualification_note: null,
      identification_activity_id: null,
    });
  await call(page, `crm/opportunities/${o.id}/outcome`, {
    ...crmBase(),
    expected_version: 5,
    close_outcome: "Won",
    lost_reason: null,
    acceptance_evidence: "SYN reviewed fictional order",
    commercial_source: {
      kind: "Independent",
      evidence: "SYN separate customer order",
    },
  });
  await call(page, "sales/handovers", {
    ...crmBase(),
    id,
    opportunity_id: o.id,
    kind: "Won",
  });
  const content = {
    ...emptyHandover(),
    problem: "SYN exact retained Sales problem",
    outcome: "SYN customer outcome",
    included_scope: "SYN scope reported by Sales; native review remains",
    exclusions: "None",
    assumptions: "None",
    unknowns: "SYN receiver owns review",
    date_reason: "SYN date awaits agreement",
    next_activity_id: o.initial_action.id,
    destination: kind,
    routing_basis: "SYN deliberate native route",
    delivery_items: "SYN controls package",
    release_prerequisites: "SYN independent native authorisation",
  };
  await call(page, `sales/handovers/${id}`, {
    ...crmBase(),
    action: "Save",
    expected_version: 1,
    content,
    receiving_owner_id: CRM.owner,
    note: "SYN prepare",
  });
  await call(page, `sales/handovers/${id}`, {
    ...crmBase(),
    action: "Submit",
    expected_version: 2,
    note: "SYN submit",
  });
  const submitted = await call(page, `sales/handovers/${id}`);
  await call(page, `sales/handovers/${id}`, {
    ...crmBase(),
    action: "Accept",
    expected_version: 3,
    source_hash: submitted.record.source_hash,
    note: "SYN accept",
  });
  return { id, o, content };
}
async function review(page: Page) {
  await page
    .getByRole("button", { name: "Review delivery link", exact: true })
    .click();
  await page
    .getByLabel("Delivery link reason", { exact: true })
    .fill("SYN exact receiving context reviewed");
}

test("LC-16 native project creation and delivery link recover separately after lost responses and Sales successor", async ({
  page,
}, info) => {
  const f = await fixture(page);
  page.on("dialog", (d) => void d.accept());
  await page.goto(`/sales/handoffs/won/${f.id}`);
  await page
    .getByRole("link", { name: "Create native project", exact: true })
    .click();
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    f.o.title,
  );
  let project = "",
    operation = "";
  await page.route(
    "**/api/v1/projects",
    async (route) => {
      project = route.request().postDataJSON().id;
      const r = await route.fetch();
      expect(r.ok(), await r.text()).toBe(true);
      await route.abort("connectionfailed");
    },
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Check original native creation",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(
    new RegExp(`/sales/handoffs/won/${f.id}\\?created_destination=${project}`),
  );
  expect(
    (await call(page, `sales/handovers/${f.id}/delivery`)).links,
  ).toHaveLength(0);
  await review(page);
  await page.route(
    `**/api/v1/sales/handovers/${f.id}/delivery`,
    async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      operation = route.request().postDataJSON().operation_id;
      const r = await route.fetch();
      expect(r.ok(), await r.text()).toBe(true);
      await route.abort("connectionfailed");
    },
  );
  await page
    .getByRole("button", { name: "Link accepted Won handover", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Check original delivery link",
      exact: true,
    }),
  ).toBeVisible();
  await call(page, `sales/handovers/${f.id}`, {
    ...crmBase(),
    action: "Successor",
    expected_version: 4,
    note: "SYN later Sales correction",
  });
  await page.reload();
  await expect(
    page.getByText("Link accepted Won handover saved.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Historical accepted handover linked/ }),
  ).toBeVisible();
  expect(
    (await call(page, `sales/handovers/${f.id}/delivery`)).links,
  ).toHaveLength(1);
  expect((await call(page, `operations/${operation}`)).state).toBe(
    "DestinationLinked",
  );
  await page.goto(`/projects/${project}`);
  await expect(
    page.getByRole("heading", { name: f.o.title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sales handovers", exact: true })
    .click();
  await page
    .getByText(new RegExp("Historical accepted Sales handover"))
    .click();
  await expect(
    page.getByText(f.content.problem, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "Accepted Sales handovers", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("delivery-project-history.png"),
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Project Sales handovers", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Sales handovers", exact: true }),
  ).toBeFocused();
});

test("LC-16 Service intake returns to a native work order and the explicit link preserves independent scope authority", async ({
  page,
}, info) => {
  const f = await fixture(page, "Service");
  await page.goto(`/sales/handoffs/won/${f.id}`);
  await page
    .getByRole("link", {
      name: "Create native Service work order",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Customer at this site", { exact: true }),
  ).toHaveValue(CRM.org);
  await page
    .getByRole("link", {
      name: "Record a new Service request and return",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Requester description / clarification", { exact: true })
    .fill("SYN request reviewed with fictional customer");
  await page
    .getByLabel("Request summary", { exact: true })
    .fill("SYN Won receiving intake");
  await page
    .getByLabel("Reported symptoms / explicit symptom uncertainty", {
      exact: true,
    })
    .fill("SYN scope needs technical review");
  await page
    .getByLabel("Next action", { exact: true })
    .fill("SYN receiver reviews scope before authorisation");
  await page
    .getByLabel("Reason for saving", { exact: true })
    .fill("SYN independently captured intake");
  await page
    .getByRole("button", { name: "Save service request", exact: true })
    .click();
  await expect(page).toHaveURL(/\/service\/work-orders\/new\?.*ticket_id=/);
  const ticket = new URL(page.url()).searchParams.get("ticket_id")!;
  await page
    .getByLabel("Purpose of these linked requests", { exact: true })
    .fill("SYN retained intake for independent scope review");
  await page
    .getByRole("button", { name: "Save draft work order", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/sales/handoffs/won/${f.id}\\?created_destination=`),
  );
  const target = new URL(page.url()).searchParams.get("created_destination")!;
  await review(page);
  await page
    .getByRole("button", { name: "Link accepted Won handover", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Current accepted handover linked/ }),
  ).toBeVisible();
  const native = (await call(page, `service/work-orders/${target}`)).items[0];
  expect(native.status).toBe("Draft");
  expect(native.scope_revision_id).toBeNull();
  expect(native.tickets.map((t: { id: string }) => t.id)).toContain(ticket);
  await page.goto(`/service/work-orders/${target}`);
  await expect(
    page.getByText(f.content.problem, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "Accepted Sales handovers", exact: true })
    .scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("delivery-service-scope.png"),
  });
});

test("LC-16 unknown-site comparison stays frozen through native changes and requires a new review", async ({
  page,
}, info) => {
  const f = await fixture(page, "Projects", true),
    target = projectInput();
  await call(page, "projects", target);
  await page.goto(
    `/sales/handoffs/won/${f.id}?created_destination=${target.id}`,
  );
  await review(page);
  await expect(page.getByText(/Sales left the site unknown/)).toBeVisible();
  await call(page, `projects/${target.id}/tasks`, taskInput());
  await page
    .getByRole("button", { name: "Refresh receiving context", exact: true })
    .click();
  await expect(page.getByText(/Selected:.*version 2/)).toBeVisible();
  await expect(
    page.getByText(/Sales version 4;.*native version 1/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Link accepted Won handover", exact: true })
    .click();
  await expect(
    page.getByText(/The native destination changed or closed/),
  ).toBeVisible();
  expect(
    (await call(page, `sales/handovers/${f.id}/delivery`)).links,
  ).toHaveLength(0);
  await page
    .getByRole("button", { name: "Discard delivery comparison", exact: true })
    .click();
  await review(page);
  await page
    .getByRole("heading", { name: "Reviewed delivery comparison", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("delivery-explicit-site.png"),
  });
  await page
    .getByRole("button", { name: "Link accepted Won handover", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Current accepted handover linked/ }),
  ).toBeVisible();
  expect(
    (await call(page, `sales/handovers/${f.id}`)).record.site_id,
  ).toBeNull();
  await page.goto(`/sales/opportunities/${f.o.id}`);
  await expect(page.getByText(/Current receiving link:/)).toBeVisible();
  await expect(
    page.getByText(/Receiving route and owner still need confirmation/),
  ).toHaveCount(0);
});

test("LC-16 a denied receiving refresh removes the reviewed native identity and accepted Sales details", async ({
  page,
}) => {
  const f = await fixture(page),
    target = projectInput();
  await call(page, "projects", target);
  await page.goto(
    `/sales/handoffs/won/${f.id}?created_destination=${target.id}`,
  );
  await review(page);
  await page.route(`**/api/v1/sales/handovers/${f.id}/delivery?*`, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        code: "AccessDenied",
        message: "SYN access changed",
        retryable: false,
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Refresh receiving context", exact: true })
    .click();
  await expect(
    page.getByText("SYN access changed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Reviewed delivery comparison",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Review native destination", exact: true }),
  ).toHaveCount(0);
  expect(
    (await call(page, `sales/handovers/${f.id}/delivery`)).links,
  ).toHaveLength(0);
});
