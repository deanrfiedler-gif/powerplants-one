import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

// SV-01 build plan I2: the native service requests register for the three states the application moves a
// request through today (D3). Synthetic seed data only.
const id = (type: number, n = 1) => `${type}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const company = id(20),
  site = id(70),
  coordinator = id(30),
  person = id(60);

async function login(page: Page, origin: string, profile = "coordinator") {
  const response = await page.request.post(`${origin}/api/v1/local-session`, { headers: { origin }, data: { profile } });
  expect(response.status()).toBe(200);
}
async function createRequest(page: Page, origin: string) {
  const ticket = randomUUID(),
    summary = `SYN SV-01 register ${ticket.slice(0, 8)}`;
  const response = await page.request.post(`${origin}/api/v1/service/tickets`, {
    headers: { origin },
    data: {
      schema_version: 1,
      operation_id: randomUUID(),
      reason: "SYN SV-01 register browser proof",
      id: ticket,
      company_id: company,
      received_at: new Date(Date.now() - 3600000).toISOString(),
      channel: "Phone",
      requester_id: person,
      requester_description: null,
      site_id: site,
      site_identification_needed: false,
      asset_id: null,
      summary,
      symptom: "Fictional symptom for the register proof.",
      impact: "Monitoring interrupted",
      priority: "Urgent",
      priority_reason: "Fictional scenario; urgency does not authorise work.",
      triage_owner_id: coordinator,
      next_action: "Review intake and assign response",
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  const read = await (await page.request.get(`${origin}/api/v1/service/tickets/${ticket}`)).json();
  return { id: ticket, summary, reference: read.items[0].display_number as string };
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
async function settled(page: Page) {
  await expect(page.getByText("Loading permitted requests…", { exact: true })).toHaveCount(0);
}

test("SV-01 board shows the native lanes and queues, and a keyboard Move completes triage through the existing form", async ({ page, baseURL }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "The board is a desktop presentation; phones use the card list.");
  await login(page, baseURL!);
  const request = await createRequest(page, baseURL!);
  await page.goto("/service/tickets");
  await settled(page);
  // A full-bleed module workspace: the hidden heading stays for assistive technology and the shell hides its
  // Service tab row (D6).
  await expect(page.getByRole("heading", { level: 1, name: "Service requests", exact: true })).toBeAttached();
  await expect(page.locator("nav.module-navigation")).toHaveCount(0);
  await expect(page.locator("#ppo-service-requests[data-module-layout=full-bleed]")).toBeVisible();
  for (const lane of ["New", "Needs information", "Triaged"])
    await expect(page.getByRole("region", { name: lane, exact: true })).toBeVisible();
  await expect(page.locator("[data-lane]")).toHaveCount(3);
  const queues = page.getByRole("group", { name: "Queues", exact: true });
  for (const name of ["All open", "New to triage", "Urgent", "Needs information", "Overdue clarifications"])
    await expect(queues.getByRole("button", { name: new RegExp(`^${name} \\d+$`) })).toBeVisible();
  await expect(queues.getByRole("button", { name: /^All open/ })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: info.outputPath("SV01-board.png") });

  // Queue and search narrow the board on the server; the new request is Urgent and New.
  await queues.getByRole("button", { name: /^Urgent/ }).click();
  await expect(page).toHaveURL(/queue=urgent/);
  await page.getByRole("searchbox", { name: "Search service requests by title or reference" }).fill(request.summary);
  await expect(page).toHaveURL(/q=SYN/);
  const card = page.locator(`[data-lane="New"] [data-ticket-id="${request.id}"]`);
  await expect(card).toBeVisible();
  await expect(card.getByText("Ready to triage", { exact: true })).toBeVisible();
  await expect(card.getByText("Recorded next action · no due time", { exact: true })).toBeVisible();

  // Move is the keyboard alternative to dragging. It opens the existing command form; the request stays in its
  // lane until the server accepts the form.
  await card.getByRole("button", { name: `Move ${request.reference}`, exact: true }).focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Move request", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("radio", { name: /Needs information/ })).toBeChecked();
  await dialog.getByRole("radio", { name: /Triaged/ }).check();
  await expect(dialog.getByRole("button", { name: "Request information", exact: true })).toHaveCount(0);
  await expect(card).toBeVisible();
  await page.screenshot({ path: info.outputPath("SV01-move-triage.png") });
  await dialog.getByLabel("Reason for this triage action", { exact: true }).fill("SYN register proof triage");
  await dialog.getByRole("button", { name: "Complete triage", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: `${request.reference}: triage saved.` })).toBeVisible();
  const moved = page.locator(`[data-lane="Triaged"] [data-ticket-id="${request.id}"]`);
  await expect(moved).toBeVisible();
  await expect(moved.getByRole("link", { name: request.summary, exact: true })).toBeFocused();
  // Triaged is the last native stage, so Move stays visible, disabled, with its reason.
  await expect(moved.getByRole("button", { name: `Move ${request.reference}`, exact: true })).toBeDisabled();
  const saved = await (await page.request.get(`${baseURL}/api/v1/service/tickets/${request.id}`)).json();
  expect(saved.items[0].status).toBe("Triaged");
  await noOverflow(page);
});

test("SV-01 list shows the fourteen native columns, keeps a column choice, and previews with focus return", async ({ page, baseURL }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "The table is a desktop presentation; phones use the card list.");
  await login(page, baseURL!);
  await page.goto("/service/tickets?view=list");
  await settled(page);
  const table = page.getByRole("region", { name: "Service requests list — scroll for all columns", exact: true });
  await expect(table).toBeVisible();
  await expect(table.locator("thead th")).toHaveCount(14);
  await expect(table.locator("thead th").first()).toHaveText("Request");
  for (const hidden of ["Customer update", "Affected areas", "Response route", "Category"])
    await expect(table.locator("thead th", { hasText: hidden })).toHaveCount(0);
  await expect(page.getByText(/^\d+–\d+ of \d+$/)).toBeVisible();

  // Columns is a per-viewer choice that survives a reload; Request cannot be hidden.
  await page.getByText("Columns", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Request (always shown)" })).toBeDisabled();
  await page.getByRole("checkbox", { name: "Channel", exact: true }).uncheck();
  await expect(table.locator("thead th")).toHaveCount(13);
  await page.reload();
  await settled(page);
  await expect(table.locator("thead th")).toHaveCount(13);
  await page.getByText("Columns", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Channel", exact: true }).check();
  await expect(table.locator("thead th")).toHaveCount(14);
  await page.keyboard.press("Escape");

  // Preview docks beside the table at 1440 px and returns focus to its trigger.
  const first = table.locator("tbody tr").first();
  const trigger = first.getByRole("button", { name: /^Preview / });
  await trigger.click();
  const preview = page.locator("aside.sr-preview");
  await expect(preview).toBeVisible();
  await expect(page.locator(".sr-body")).toHaveAttribute("data-preview", "docked");
  await expect(first).toHaveAttribute("data-selected", "true");
  await expect(preview.getByRole("link", { name: "Open request", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("SV01-list-preview.png") });
  await page.keyboard.press("Escape");
  await expect(preview).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await noOverflow(page);

  // At 1024 × 768 the preview overlays the table and the queues use their short labels (frame 16).
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole("group", { name: "Queues" }).getByRole("button", { name: /^New \d+$/ })).toBeVisible();
  await trigger.click();
  await expect(page.locator(".sr-body")).toHaveAttribute("data-preview", "overlay");
  await page.screenshot({ path: info.outputPath("SV01-list-1024.png") });
  await noOverflow(page);
});

test("SV-01 read-only and unavailable registers state why nothing can change", async ({ page, baseURL }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "Covered once at desktop width.");
  await login(page, baseURL!, "observer");
  await page.goto("/service/tickets");
  await settled(page);
  await expect(page.getByText("You can view service requests.", { exact: true })).toBeVisible();
  const moves = page.locator("[data-move]");
  expect(await moves.count()).toBeGreaterThan(0);
  for (const button of await moves.all()) await expect(button).toBeDisabled();
  await page.route("**/api/v1/service/tickets?**", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  await expect(page.getByText("Nothing was changed. Check the connection and try again.", { exact: true })).toBeVisible();
  await expect(page.locator("[data-ticket-id]")).toHaveCount(0);
});

test("SV-01 phone register: cards, the filters sheet, no matches and 320 px", async ({ page, baseURL }, info) => {
  test.skip(info.project.name !== "mobile-chromium", "The card list is the phone presentation.");
  await login(page, baseURL!);
  await page.goto("/service/tickets");
  await settled(page);
  await expect(page.getByRole("group", { name: "Presentation" })).toHaveCount(0);
  await expect(page.locator(".sr-phone-card").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Log a request", exact: true })).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("SV01-phone.png") });

  // Filters open as a full-screen sheet with a live count (frame 19).
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Filters", exact: true });
  await expect(sheet).toBeVisible();
  expect((await sheet.boundingBox())!.width).toBe(390);
  await expect(sheet.getByRole("button", { name: /^Show \d+ requests?$/ })).toBeVisible();
  await page.screenshot({ path: info.outputPath("SV01-phone-filters.png") });
  await sheet.getByRole("button", { name: "Close filters", exact: true }).click();
  await expect(sheet).toHaveCount(0);

  // No matches keeps the removable condition visible and offers Clear filters (frame 20).
  await page.getByRole("searchbox").fill("SYN no matching request 493021");
  await expect(page.getByRole("heading", { name: "No requests match these filters", exact: true })).toBeVisible();
  await expect(page.getByText(/open requests? (is|are) hidden by the current filters\./)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Remove search / })).toBeVisible();
  await page.screenshot({ path: info.outputPath("SV01-phone-no-matches.png") });
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page.locator(".sr-phone-card").first()).toBeVisible();

  // At 320 px Filters becomes an icon button so Log a request keeps its label (frame 23).
  await page.setViewportSize({ width: 320, height: 568 });
  const filters = page.getByRole("button", { name: "Filters", exact: true });
  expect(Math.round((await filters.boundingBox())!.width)).toBe(44);
  await expect(page.getByRole("link", { name: "Log a request", exact: true })).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("SV01-phone-320.png") });
});
