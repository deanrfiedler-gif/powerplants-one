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
  await page.goto("/crm/opportunities");
  if (info.project.use.isMobile)
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page
    .getByRole("navigation", {
      name: info.project.use.isMobile ? "All modules" : "Main navigation",
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
  await page.goto(`/crm/opportunities/${o.id}`);
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
