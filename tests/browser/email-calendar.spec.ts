import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmCreate } from "../helpers/crm";
test.describe.configure({ timeout: 120000 });
test.use({ actionTimeout: 15000 });
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : {
            Origin: "http://127.0.0.1:3000",
            "Content-Type": "application/json",
          },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  expect(r.headers()["cache-control"]).toContain("no-store");
  return r.json();
}
async function identity(page: Page, profile = "coordinator") {
  await expect(
    page.getByRole("region", {
      name: "Local demonstration identity",
      exact: true,
    }),
  ).toHaveAttribute("aria-busy", "false");
  if (!(await page.getByLabel("Identity", { exact: true }).isVisible()))
    await page
      .getByRole("button", { name: "Change identity", exact: true })
      .click();
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Change identity", exact: true }),
  ).toBeEnabled();
}
test("EC complete journey, reload, calendar navigation, details, narrow layout and denied identity", async ({
  page,
}, info) => {
  // One private fixture per viewport; tests do not reset a running application's database.
  const message = info.project.name.startsWith("desktop")
    ? "ec000000-0000-4000-8000-000000000001"
    : "ec000000-0000-4000-8000-000000000002";
  await page.goto("/email");
  await identity(page);
  const o = { ...crmCreate(), title: `SYN Calendar UI ${randomUUID()}` };
  await call(page, "crm/opportunities", o);
  await page.goto(`/email/${message}`);
  await expect(page.locator(".ec-body")).toBeVisible();
  await page.getByLabel("Opportunity", { exact: true }).selectOption(o.id);
  await page.getByRole("button", { name: "Save link", exact: true }).click();
  await expect(page.getByLabel("Action", { exact: true })).toBeVisible();
  await page
    .getByLabel("Action", { exact: true })
    .fill("SYN Confirm irrigation site visit");
  await page
    .getByLabel("Due date and time · Brisbane", { exact: true })
    .fill("2026-09-09T09:00");
  let lost = false;
  await page.route(`**/api/v1/email/${message}/follow-up`, async (route) => {
    if (!lost) {
      lost = true;
      const r = await route.fetch();
      expect(r.ok()).toBe(true);
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Create follow-up", exact: true })
    .click();
  await expect(page.locator('.business-error[role="alert"]')).toContainText("could not be confirmed");
  await page
    .getByRole("button", { name: "Create follow-up", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "View on calendar", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "View on calendar", exact: true }),
  ).toBeVisible();
  const m = await call(page, `email/${message}`),
    saved = await call(page, `crm/opportunities/${o.id}`);
  expect(
    saved.actions.filter((a: { id: string }) => a.id === m.followup_id),
  ).toHaveLength(1);
  await page.goto(`/crm/opportunities/${o.id}`);
  await expect(
    page.getByText("SYN Confirm irrigation site visit", { exact: true }),
  ).toBeVisible();
  await page.goto("/calendar?day=2026-09-09");
  await expect(
    page
      .getByRole("button")
      .filter({ hasText: "SYN Confirm irrigation site visit" })
      .first(),
  ).toBeVisible();
  await page
    .getByRole("button")
    .filter({ hasText: "SYN Confirm irrigation site visit" })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("Internal follow-up");
  await page.getByRole("button", { name: "Close event details" }).click();
  await page.getByLabel("Calendar date", { exact: true }).fill("2026-09-08");
  await expect(
    page.getByRole("button", { name: /Irrigation scope review,/ }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Calendar date", { exact: true })).toHaveValue(
    "2026-09-08",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".ec-calendar").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("calendar-day.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: /Irrigation scope review,/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Read only");
  await page.screenshot({ path: info.outputPath("event-details.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await expect(page.getByLabel("Calendar date", { exact: true })).toHaveValue(
    "2026-09-15",
  );
  await expect(page.getByText("No meetings for this date.")).toBeVisible();
  await page
    .getByRole("button", { name: "Previous week", exact: true })
    .click();
  await page.getByRole("button", { name: "Agenda", exact: true }).click();
  await expect(page.locator(".ec-meeting")).toHaveCount(2);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("calendar-320.png"),
    fullPage: true,
  });
  await page.goto(`/email/${message}`);
  await identity(page, "systems");
  await expect(page.locator(".ec-body")).toHaveCount(0);
  await expect(page.locator('.business-error[role="alert"]').first()).toContainText("unavailable");
  const denied = await page.request.get(`/api/v1/email/${message}`);
  expect(denied.status()).toBe(404);
  const hostile = await page.request.post(`/api/v1/email/${message}/link`, {
    headers: { Origin: "https://unrelated.invalid" },
    data: {},
  });
  expect(hostile.status()).toBe(403);
});

test("EC accepted r02 demo: date navigation, timeline, details and phone sheet", async ({
  page,
}, info) => {
  const { pathToFileURL } = await import("node:url");
  const { resolve } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const exported = info.outputPath("accepted-r02-demo.html");
  execFileSync("python3", [
    resolve("docs/blueprints/email-calendar-prototype/export.py"),
    exported,
  ]);
  await page.goto(pathToFileURL(exported).href);
  await page
    .locator('[data-action="nav"][data-view="calendar"]:visible')
    .first()
    .click();
  await expect(page.locator(".week-strip")).toBeVisible();
  await expect(page.locator(".timeline-event").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("accepted-r02-calendar.png"),
    fullPage: true,
  });
  await page.locator(".timeline-event").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const box = await page.getByRole("dialog").boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width + 1,
  );
  await page.screenshot({
    path: info.outputPath("accepted-r02-event-details.png"),
  });
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await expect(page.locator("#selected-day")).toContainText("15");
  await page
    .getByRole("button", { name: "Previous week", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose calendar date", exact: true })
    .click();
  await page.getByLabel("Calendar date", { exact: true }).fill("2026-09-09");
  await page.getByRole("button", { name: "Show date", exact: true }).click();
  await expect(page.locator("#selected-day")).toContainText("9");
  await page
    .getByRole("button", {
      name: "Return to sample day, 8 September 2026",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Agenda", exact: true }).click();
  await expect(page.locator(".agenda-list")).toBeVisible();
});
