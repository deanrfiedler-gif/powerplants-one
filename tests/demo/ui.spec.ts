import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  database,
  transaction,
  closeDatabase,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createInvitedSession } from "../../src/platform/demo-auth";
import { readInvitedSession } from "../../src/platform/identity";
import { reconcileTesters } from "../../scripts/demo-database";
import { crmCreate } from "../helpers/crm";

// UI/permission integration on the disposable loopback server. This deliberately
// does not assert that Microsoft login, public HTTPS or a real phone was tested.
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable local test database required.");
const origin = "http://127.0.0.1:3000";
const tenant = randomUUID(),
  objectId = randomUUID(),
  otherId = randomUUID();
test.beforeAll(async () => {
  const expires_at = new Date(Date.now() + 86400000).toISOString();
  await reconcileTesters(tenant, [
    { object_id: objectId, expires_at },
    { object_id: otherId, expires_at },
  ]);
});
test.afterAll(closeDatabase);

async function signInFixture(context: BrowserContext, object: string) {
  const token = await transaction((c) =>
    createInvitedSession(c, tenant, object),
  );
  const p = await readInvitedSession(database(), token, tenant);
  await context.addCookies([
    {
      name: "ppo_local_session",
      value: token,
      url: origin,
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  return p;
}
async function call(page: Page, path: string, body?: unknown) {
  const response = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: origin },
    data: body,
  });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}

test("invited actor: schedule lanes, demand and appointment links load with booking controls", async ({ page, context }, info) => {
  await signInFixture(context, objectId);
  await page.goto("/schedule");
  await expect(page.getByRole("region", { name: "Week resource planner", exact: true })).toBeVisible();
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Unassigned demand", exact: true })).toBeVisible();
  await expect(page.getByText(/Unassigned demand is unknown/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Move or reassign", exact: true }).first()).toBeVisible();
  const schedule = await call(page, "schedule?from=2026-09-20T14%3A00%3A00Z&to=2026-09-27T14%3A00%3A00Z&timezone=Australia%2FBrisbane");
  expect(schedule.items.length).toBeGreaterThan(0);
  expect(schedule.resources.length).toBeGreaterThan(0);
  await call(page, "schedule/demand");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("private-schedule-week.png"), fullPage: true });
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.getByRole("region", { name: "Day resource planner", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("private-schedule-day-320.png"), fullPage: true });
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.getByText("Loading permitted records…", { exact: true })).toHaveCount(0);
  const appointment = schedule.items[0];
  await page.locator(`a[href="/service/appointments/${appointment.id}"]`).first().click();
  await expect(page.getByRole("heading", { name: appointment.display_number, exact: true })).toBeVisible();
  await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Record contact", exact: true })).toBeVisible();
  expect(appointment.actions.can_manage).toBe(true);
  const work = await call(page, `service/work-orders/${appointment.work_order_id}`);
  expect(work.items[0].id).toBe(appointment.work_order_id);
});

test("invited actor: mailbox to refined deal, follow-up, calendar and another browser", async ({
  page,
  context,
  browser,
}, info) => {
  const p = await signInFixture(context, objectId);
  const o = crmCreate();
  o.title = `SYN Integrated demo ${info.project.name}`;
  o.owner_id = p.actor_id;
  o.initial_action.owner_id = p.actor_id;
  await call(page, "crm/opportunities", o);
  await page.goto("/sales/opportunities");
  if (info.project.use.isMobile)
    await page.getByRole("button", { name: "More", exact: true }).click();
  else await page.getByRole("button", { name: "More", exact: true }).click();
  await page
    .getByRole("navigation", {
      name: info.project.use.isMobile ? "All modules" : "More navigation",
      exact: true,
    })
    .getByRole("link", { name: "Email & Calendar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Email", exact: true }),
  ).toBeVisible();
  const inbox = await call(page, "email");
  expect(inbox.items).toHaveLength(2);
  const message = inbox.items[0].id;
  await page.locator(`a[href="/email/${message}"]`).click();
  await expect(page.locator(".ec-body")).toBeVisible();
  await page.getByLabel("Opportunity", { exact: true }).selectOption(o.id);
  await page.getByRole("button", { name: "Save link", exact: true }).click();
  const summary = `SYN Arrange integrated site visit ${info.project.name}`;
  const day = new Date(Date.now() + 10 * 3600000).toISOString().slice(0, 10);
  await page.getByLabel("Action", { exact: true }).fill(summary);
  await page
    .getByLabel("Due date and time · Brisbane", { exact: true })
    .fill(`${day}T16:00`);
  await page
    .getByRole("button", { name: "Create follow-up", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "View on calendar", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("private-email-followup.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "View on calendar", exact: true })
    .click();
  await expect(
    page.getByRole("button").filter({ hasText: summary }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Irrigation scope review,/ }),
  ).toBeVisible();
  await page.getByRole("button").filter({ hasText: summary }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Internal follow-up");
  await page.keyboard.press("Escape");
  await page.goto(`/sales/opportunities/${o.id}`);
  await page
    .getByRole("button", { name: "Edit deal information", exact: true })
    .click();
  const editor = page.getByRole("dialog", { name: "Edit deal", exact: true });
  await editor
    .getByLabel("Deal title", { exact: true })
    .fill(o.title + " reviewed");
  await editor
    .getByLabel("Deal value · AUD, excl. GST", { exact: true })
    .fill("12500.50");
  await editor.getByRole("button", { name: "Save deal", exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.getByRole("tab", { name: "Details", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit requirements and scope", exact: true })
    .click();
  const scope = page.getByRole("dialog", {
    name: "Edit requirements and scope",
    exact: true,
  });
  await scope
    .getByLabel("Inclusions", { exact: true })
    .fill("SYN Irrigation site review");
  await scope
    .getByRole("button", { name: "Save requirements and scope", exact: true })
    .click();
  await expect(scope).not.toBeVisible();
  await page.getByRole("tab", { name: "Timeline", exact: true }).click();
  await expect(page.getByText(summary, { exact: true })).toBeVisible();
  const saved = (await call(page, `crm/opportunities/${o.id}`)).items[0];
  const mail = await call(page, `email/${message}`);
  expect(saved.value_amount).toBe("12500.50");
  expect(saved.scope_details.inclusions).toBe("SYN Irrigation site review");
  expect(saved.next_activity.id).toBe(o.initial_action.id);
  expect(
    saved.actions.filter((a: { id: string }) => a.id === mail.followup_id),
  ).toHaveLength(1);
  expect(JSON.stringify(saved)).not.toContain(mail.body_text);
  const another = await browser.newContext({
    baseURL: origin,
    viewport: info.project.use.viewport,
    isMobile: info.project.use.isMobile,
    hasTouch: info.project.use.hasTouch,
  });
  try {
    expect((await signInFixture(another, objectId)).actor_id).toBe(p.actor_id);
    const fresh = await another.newPage();
    await fresh.goto(`/email/${message}`);
    await expect(fresh.getByText(summary, { exact: true })).toBeVisible();
    await fresh.setViewportSize({ width: 320, height: 844 });
    expect(
      await fresh.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await fresh.screenshot({
      path: info.outputPath("private-email-320.png"),
      fullPage: true,
    });
    await signInFixture(another, otherId);
    await fresh.reload();
    await expect(fresh.locator(".ec-body")).toHaveCount(0);
    await expect(
      fresh.locator('.business-error[role="alert"]').first(),
    ).toContainText("unavailable");
    expect((await fresh.request.get(`/api/v1/email/${message}`)).status()).toBe(
      404,
    );
    expect(
      (await call(fresh, "email")).items.some(
        (m: { id: string }) => m.id === message,
      ),
    ).toBe(false);
  } finally {
    await another.close();
  }
});

test("invited actor books and reschedules a prepared visit through the UI and reloads saved crew", async ({ page, context }, info) => {
  await signInFixture(context, objectId);
  const day = info.project.name.startsWith("mobile") ? "2026-10-13" : "2026-10-08";
  const next = info.project.name.startsWith("mobile") ? "2026-10-14" : "2026-10-09";
  const workId = "a9000000-0000-4000-8000-000000000001";
  await page.goto(`/service/work-orders/${workId}`);
  await page.getByText("Propose a visit", { exact: true }).click();
  await page.getByLabel("Proposed start (device timezone)", { exact: true }).fill(`${day}T00:00`);
  await page.getByLabel("Proposed finish (device timezone)", { exact: true }).fill(`${day}T02:00`);
  await page.getByLabel("Customer commitment", { exact: true }).selectOption("Proposed");
  await page.getByLabel("Preparation state", { exact: true }).selectOption("Preparing");
  await page.getByRole("button", { name: "Save proposed visit", exact: true }).click();
  await expect.poll(async () => (await call(page, `service/work-orders/${workId}`)).items[0].visits
    .some((a: { start_at: string }) => a.start_at === `${day}T00:00:00.000Z`)).toBe(true);
  const work = (await call(page, `service/work-orders/${workId}`)).items[0];
  const visit = work.visits.find((a: { start_at: string }) => a.start_at === `${day}T00:00:00.000Z`);
  const article = page.locator("article").filter({ has: page.getByRole("link", { name: visit.display_number, exact: true }) });
  await article.getByText("Review proposed visit preparation", { exact: true }).click();
  await article.getByLabel("Readiness criterion", { exact: true }).selectOption("ToolPreparation");
  await article.getByLabel("Readiness decision", { exact: true }).selectOption("Pass");
  await article.getByLabel("Review reason", { exact: true }).fill("SYN inspection kit reviewed for hosted booking proof");
  await article.getByLabel("Evidence source time (your device timezone)", { exact: true }).fill("2026-09-19T00:00");
  await article.getByLabel("Evidence title", { exact: true }).fill("SYN booking preparation");
  await article.getByLabel("Synthetic source reference", { exact: true }).fill("SYN-PPO-HOSTED-BOOKING");
  await article.getByLabel("Source version", { exact: true }).fill("1");
  await article.getByLabel("Exact manual evidence", { exact: true }).fill("SYN inspection kit prepared. Dispatch remains held.");
  await article.getByRole("button", { name: "Record readiness review", exact: true }).click();
  await expect.poll(async () => (await call(page, `appointments/${visit.id}`)).items[0].readiness
    .find((a: { criterion_code: string }) => a.criterion_code === "ToolPreparation").outcome).toBe("Pass");
  await article.getByRole("link", { name: visit.display_number, exact: true }).click();
  await page.getByRole("button", { name: "Record contact", exact: true }).click();
  await page.getByLabel("Contact outcome", { exact: true }).selectOption("Confirmed");
  await page.getByLabel("Contact notes", { exact: true }).fill("SYN customer agreed to exact dates; simulated record only.");
  await page.getByRole("button", { name: "Save contact outcome", exact: true }).click();
  await expect(page.getByText("Contact outcome saved.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirm appointment", exact: true }).click();
  const form = page.getByRole("region", { name: "Confirm appointment", exact: true });
  await form.getByLabel("Resource 1", { exact: true }).selectOption("a4000000-0000-4000-8000-000000000001");
  await form.getByRole("button", { name: "Add crew member", exact: true }).click();
  await form.getByLabel("Resource 2", { exact: true }).selectOption("a4000000-0000-4000-8000-000000000002");
  for (const n of [1, 2]) {
    await form.getByLabel(`Travel before ${n} (minutes)`, { exact: true }).fill("0");
    await form.getByLabel(`Travel after ${n} (minutes)`, { exact: true }).fill("0");
    await form.getByLabel(`Travel basis ${n}`, { exact: true }).fill("SYN same-site zero travel allowance reviewed");
  }
  await form.getByLabel("Booking reason", { exact: true }).fill("SYN invited actor booking verification");
  await form.getByRole("button", { name: "Confirm booking", exact: true }).click();
  await expect(page.getByText("Appointment saved. Dispatch remains held.", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Move or reassign", exact: true }).click();
  const move = page.getByRole("region", { name: "Move or reassign", exact: true });
  await move.getByLabel("Start (site time)", { exact: true }).fill(`${next}T10:00`);
  await move.getByLabel("Finish (site time)", { exact: true }).fill(`${next}T12:00`);
  await move.getByLabel("Change reason", { exact: true }).fill("SYN reschedule and persistence verification");
  await move.getByRole("button", { name: "Save proposed move", exact: true }).click();
  await expect(page.getByText("Appointment saved. Dispatch remains held.", { exact: true })).toBeVisible();
  await page.reload();
  const saved = (await call(page, `appointments/${visit.id}`)).items[0];
  expect(saved.status).toBe("Confirmed");
  expect(saved.start_at).toBe(`${next}T00:00:00.000Z`);
  expect(saved.assignments.filter((a: { active: boolean }) => a.active)).toHaveLength(2);
  expect(saved.customer_commitment).toBe("Changed");
  await expect(page.getByRole("heading", { name: visit.display_number, exact: true })).toBeVisible();
  await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("private-booking-reloaded.png"), fullPage: true });
});
