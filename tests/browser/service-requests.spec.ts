import { test, expect, type Page } from "@playwright/test";
import type { RegisterItem } from "../../src/service/ticket-register-view";
const uuid = (n: number) => `40000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const actor = "30000000-0000-4000-8000-000000000001",
  company = "20000000-0000-4000-8000-000000000001",
  site = "70000000-0000-4000-8000-000000000001";
const now = "2026-10-17T00:42:00.000Z";
const titles = [
  "Irrigation pump not starting after power outage",
  "Heating loop sensor readings drift overnight",
  "Climate computer alarm: vent position fault",
  "Fertigation EC reading above set point",
  "Misting line pressure drops at midday",
  "Invoice query on the last service visit",
  "Boiler controller alarm",
  "Shade screen stops halfway",
  "Vent actuator in bay 2",
  "Nutrient tank level sensor reads empty",
  "Cool room fan vibrating",
  "Unidentified pump at bore 3",
];
const items: RegisterItem[] = titles.map((summary, i) => ({
  id: uuid(97 - i),
  display_number: `SYN-PPO-TKT-${String(97 - i).padStart(6, "0")}`,
  summary,
  status: [0, 2, 4].includes(i) ? "New" : [1, 3, 5].includes(i) ? "NeedsInformation" : "Triaged",
  priority: i === 0 ? "Urgent" : [1, 2, 6].includes(i) ? "High" : "Normal",
  version: 3,
  received_at: now,
  channel: "Phone",
  next_action: "Review the reported issue",
  triage_owner_id: actor,
  triage_owner_name: "SYN Sasha Cole",
  site:
    i === 2
      ? null
      : {
          id: site,
          display_number: "SYN-PPO-SITE-000001",
          display_name: "SYN Block C Plant Room",
        },
  site_identification_needed: i === 2,
  asset: {
    id: uuid(500),
    display_number: "SYN-PPO-EQP-000001",
    description: "Heating loop controller",
  },
  customer: {
    id: uuid(600),
    display_name: "SYN Northbank Farm",
    basis: "SiteOperator",
  },
  clarification:
    i === 1
      ? {
          id: uuid(700),
          summary: "Confirm which loop sensor was replaced",
          owner_name: "SYN Sasha Cole",
          due_at: "2026-10-16T06:00:00Z",
          due_needed: false,
          status: "Open",
        }
      : null,
  clarification_unavailable: false,
  triage_blocker_count: i < 6 ? 1 : 0,
  work_orders: [],
  can_edit_intake: i < 6,
}));
const record = () => ({
  id: items[1].id,
  company_id: company,
  display_number: items[1].display_number,
  summary: items[1].summary,
  status: "NeedsInformation",
  version: 3,
  synthetic: true,
  updated_at: now,
  received_at: now,
  received_time_basis: "UserReported",
  channel: "Phone",
  requester_id: uuid(600),
  requester_description: "",
  site_id: site,
  site_identification_needed: false,
  asset_id: uuid(500),
  symptom: "Readings drift up to 3 °C between 01:00 and 05:00.",
  impact: "Manual check at 06:00",
  priority: "High",
  priority_reason: "Drift could harm the crop",
  triage_owner_id: actor,
  owner_name: "SYN Sasha Cole",
  next_action: "Review the linked work order",
  open_questions: "Was it the sensor replaced on 3 Oct?",
  clarification_outcome: null,
  clarification_activity: {
    id: uuid(700),
    version: 1,
    status: "Open",
    summary: "Confirm which loop sensor was replaced",
    owner_id: actor,
    owner_name: "SYN Sasha Cole",
    due_at: "2026-10-16T06:00:00Z",
    can_complete: true,
  },
  clarification_unavailable: false,
  requester: { display_name: "SYN Ravi Patel" },
  site: { display_name: "SYN Block C Plant Room" },
  asset: { description: "Heating loop controller" },
  customer: items[1].customer,
  work_orders: [],
  history: [
    {
      id: uuid(800),
      kind: "TicketInformationRequested",
      occurred_at: now,
      actor_name: "SYN Sasha Cole",
      record_version: 3,
    },
  ],
  history_partial: false,
  can_edit: false,
  can_edit_intake: true,
  can_record_statement: true,
  triage_blockers: [
    {
      field: "clarification_activity_id",
      message: "Complete the owned clarification activity with an outcome before triage.",
    },
  ],
});
const envelope = (values: unknown[]) => ({
  items: values,
  next_cursor: null,
  observed_at: now,
  completeness: "Complete",
});
async function setup(page: Page, origin: string) {
  const login = await page.request.post(origin + "/api/v1/local-session", {
    headers: { origin },
    data: { profile: "coordinator" },
  });
  expect(login.status()).toBe(200);
  await page.route("**/api/v1/selectors/owners?*", (r) =>
    r.fulfill({
      json: envelope([{ id: actor, display_name: "SYN Sasha Cole" }]),
    }),
  );
  await page.route("**/api/v1/service/tickets/queues**", (r) =>
    r.fulfill({
      json: {
        as_at: now,
        all_open: 12,
        my_requests: 4,
        new: 3,
        urgent: 1,
        needs_information: 3,
        overdue_clarifications: 1,
        no_work_order: 6,
        work_order_linked: 0,
        triaged: 6,
      },
    }),
  );
  await page.route("**/api/v1/service/tickets?*", (r) => r.fulfill({ json: envelope(items) }));
  await page.route("**/api/v1/service/tickets/" + items[1].id, (r) => r.fulfill({ json: envelope([record()]) }));
  await page.route("**/api/v1/service/tickets/*/statements", (r) => r.fulfill({ json: { items: [], partial: false } }));
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
for (const width of [1440, 1024, 390, 320])
  test(`SV-01 accepted register at ${width}px: list, named controls and no page overflow`, async ({
    page,
    baseURL,
  }, info) => {
    await page.setViewportSize({ width, height: width > 780 ? 900 : 844 });
    await setup(page, baseURL!);
    await page.goto("/service/tickets");
    await expect(page.getByText(titles[0], { exact: true }).first()).toBeVisible();
    await fits(page);
    if (width > 780) {
      await expect(page.getByRole("table")).toBeVisible();
      await page.getByLabel(`Select ${items[0].display_number}`, { exact: true }).check();
      await expect(page.getByRole("link", { name: "Open in sequence" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Export list" })).toBeVisible();
    } else {
      await expect(page.locator(".sr-phone-row")).toHaveCount(12);
      await expect(
        page.getByRole("link", { name: "Log a request", exact: true }).filter({ visible: true }),
      ).toHaveCount(1);
    }
    await page.screenshot({ path: info.outputPath(`register-${width}.png`) });
  });
test("SV-01 Board and large snapshot retain three native states", async ({ page, baseURL }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setup(page, baseURL!);
  await page.goto("/service/tickets?view=board");
  await expect(page.locator("[data-lane]")).toHaveCount(3);
  await page.screenshot({ path: info.outputPath("board.png") });
  await page.goto("/service/tickets");
  await page
    .getByRole("button", {
      name: `Preview ${items[1].display_number}`,
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog", { name: "Request snapshot" })).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Reported issue", { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("snapshot.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("SV-01 no matches, failed read and loading never present stale rows", async ({ page, baseURL }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, baseURL!);
  await page.route("**/api/v1/service/tickets?*", (r) => r.fulfill({ json: envelope([]) }));
  await page.goto("/service/tickets?q=unknown");
  await expect(page.getByRole("heading", { name: "No requests match these filters" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("no-matches.png") });
  await page.route("**/api/v1/service/tickets?*", (r) =>
    r.fulfill({
      status: 503,
      json: { message: "Requests could not be loaded" },
    }),
  );
  await page.reload();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.locator(".sr-phone-row")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("failed.png") });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/service/tickets?*", async (r) => {
    await gate;
    await r.fulfill({ json: envelope(items) });
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".sr-skeleton")).toBeVisible();
  await page.screenshot({ path: info.outputPath("loading.png") });
  release();
});
test("SV-02 phone triage keeps entries on validation and newer revision, then submits one reviewed command", async ({
  page,
  baseURL,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, baseURL!);
  const sent: Record<string, unknown>[] = [];
  await page.route("**/api/v1/service/tickets/*/triage", async (r) => {
    sent.push(r.request().postDataJSON());
    await r.fulfill({
      status: 409,
      json: {
        code: "VersionConflict",
        message: "Not saved. A newer request revision exists.",
      },
    });
  });
  await page.goto("/service/tickets/" + items[1].id);
  await page.getByRole("button", { name: "Complete triage", exact: true }).filter({ visible: true }).click();
  await page.getByRole("button", { name: "Complete triage", exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.screenshot({ path: info.outputPath("triage-validation.png") });
  await page.getByLabel("Clarification outcome", { exact: true }).fill("SYN caller confirmed the sensor identity");
  await page.getByLabel("Reason for this triage action", { exact: true }).fill("SYN clarification received");
  await page.getByRole("button", { name: "Complete triage", exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("button", { name: "Review changes", exact: true })).toBeVisible();
  await expect(page.getByLabel("Clarification outcome", { exact: true })).toHaveValue(
    "SYN caller confirmed the sensor identity",
  );
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({
    expected_version: 3,
    clarification_version: 1,
    review: {
      priority: "High",
      triage_owner_id: actor,
      priority_reason: "Drift could harm the crop",
      next_action: "Review the linked work order",
    },
  });
  await page.screenshot({ path: info.outputPath("triage-refused.png") });
  await fits(page);
});
test("SV-02 view-only and permission denied expose no write path", async ({ page, baseURL }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, baseURL!);
  await page.route("**/api/v1/service/tickets/" + items[1].id, (r) =>
    r.fulfill({
      json: envelope([{ ...record(), can_edit_intake: false, can_record_statement: false }]),
    }),
  );
  await page.goto("/service/tickets/" + items[1].id);
  await expect(page.getByText(/View only. Triage needs/)).toBeVisible();
  await page.screenshot({ path: info.outputPath("view-only.png") });
  await page.route("**/api/v1/service/tickets/" + items[1].id, (r) =>
    r.fulfill({ status: 404, json: { message: "Record unavailable" } }),
  );
  await page.reload();
  await expect(page.getByText(titles[1], { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Complete triage", exact: true })).toHaveCount(0);
});
