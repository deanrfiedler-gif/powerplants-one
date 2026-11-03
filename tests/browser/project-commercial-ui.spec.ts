import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { commercialUIFixture } from "../helpers/project-commercial-ui";
import { localConfig } from "../../src/platform/config";
import { randomUUID } from "node:crypto";
let fixture: Awaited<ReturnType<typeof commercialUIFixture>>;
const grants: string[] = [];
const captures = "docs/testing/evidence/project-commercial/captures";
test.beforeAll(async () => {
  test.setTimeout(600000);
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Only synthetic test DB");
  const existingGrants = await database().query<{ id: string }>(
    "SELECT id FROM ppo.permission_grants",
  );
  try {
    fixture = await commercialUIFixture();
  } finally {
    // Retain only this setup's additions, even if fixture preparation fails.
    const addedGrants = await database().query<{ id: string }>(
      "SELECT id FROM ppo.permission_grants WHERE NOT (id = ANY($1::uuid[]))",
      [existingGrants.rows.map(({ id }) => id)],
    );
    grants.push(...addedGrants.rows.map(({ id }) => id));
  }
  await mkdir(captures, { recursive: true });
});
test.afterAll(async () => {
  try {
    if (grants.length)
      await database().query(
        "DELETE FROM ppo.permission_grants WHERE id = ANY($1::uuid[])",
        [grants],
      );
  } finally {
    await closeDatabase();
  }
});
test.beforeEach(async ({ page }) => {
  // Retain accepted geometry while keeping licensed icon artwork out of captures.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = ".ppo-fa, svg { visibility: hidden !important; }";
      document.head.append(style);
    });
  });
});
async function login(page: Page, profile = "coordinator") {
  await page.goto("/login");
  const r = await page.request.post("/api/v1/local-session", {
    headers: { Origin: localConfig().origin },
    data: { profile },
  });
  expect(r.ok()).toBeTruthy();
  // Prepare the real identity read before timing page interactions on a cold dev server.
  await expect
    .poll(
      async () => (await page.request.get("/api/v1/local-session")).status(),
      { timeout: 60000 },
    )
    .toBe(200);
}
async function captureViewport(page: Page, width: number) {
  await page.setViewportSize({ width, height: width > 1000 ? 960 : 844 });
  if (width > 1000) {
    const railToggle = page.getByRole("button", {
      name: /^(Expand|Collapse) primary navigation$/,
    });
    // The server-rendered preference may change when this identity's shell loads.
    await expect(railToggle).toBeEnabled();
    const toggle = page.getByRole("button", {
      name:
        width === 1024
          ? "Collapse primary navigation"
          : "Expand primary navigation",
      exact: true,
    });
    if (await toggle.isVisible()) await toggle.click();
    await expect(railToggle).toHaveAttribute(
      "aria-expanded",
      width === 1024 ? "false" : "true",
    );
  }
}
const register = () => `/projects/commercial?project=${fixture.f.project.id}`;
const record = (key: string) =>
  `/projects/${fixture.f.project.id}/commercial/${fixture.entries[key]}`;

for (const outcome of [
  "VersionConflict",
  "ClosedProject",
  "Forbidden",
  "Network",
  "Server",
  "Timeout",
] as const) {
  test(`PJ05 restored journal retry handles ${outcome}`, async ({ page }) => {
    await login(page);
    await page.goto(record("basis"));
    const storageKey = `ppo.commercial.pending:${fixture.f.owner.workspace_id}:${fixture.f.owner.actor_id}:${fixture.f.project.id}`;
    const original = {
      title: "SYN restored commercial command",
      id: fixture.entries.basis,
      body: {
        id: fixture.entries.basis,
        operation_id: randomUUID(),
        schema_version: 1,
        action: "Submit",
        expected_version: 1,
        reason: "SYN retained reason",
      },
    };
    const journal = JSON.stringify(original);
    await page.evaluate(
      ({ storageKey, journal }) => sessionStorage.setItem(storageKey, journal),
      { storageKey, journal },
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Recover pending save", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(original.title);
    let submissions = 0;
    await page.route(
      `**/api/v1/projects/${fixture.f.project.id}/commercial`,
      async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        submissions++;
        expect(route.request().postDataJSON()).toEqual(original.body);
        if (outcome === "Network") return route.abort("failed");
        await route.fulfill({
          status:
            outcome === "Forbidden"
              ? 403
              : outcome === "Server"
                ? 503
                : outcome === "Timeout"
                  ? 408
                  : 409,
          contentType: "application/json",
          body: JSON.stringify({ code: outcome, message: `SYN ${outcome}` }),
        });
      },
    );
    await dialog
      .getByRole("button", { name: "Retry unchanged", exact: true })
      .click();
    const uncertain = ["Network", "Server", "Timeout"].includes(outcome);
    if (uncertain) {
      await expect(
        dialog.getByRole("button", { name: "Retry unchanged", exact: true }),
      ).toBeEnabled();
      await expect(dialog).toContainText(
        outcome === "Network" ? "could not be confirmed" : `SYN ${outcome}`,
      );
      expect(
        await page.evaluate((key) => sessionStorage.getItem(key), storageKey),
      ).toBe(journal);
      await page.route(
        `**/api/v1/operations/${original.body.operation_id}`,
        (route) =>
          route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ message: "Unavailable" }),
          }),
      );
      await dialog
        .getByRole("button", { name: "Check saved result", exact: true })
        .click();
      await expect(dialog).toContainText(
        "a missing receipt does not prove failure",
      );
      await dialog
        .getByRole("button", { name: `Close ${original.title}`, exact: true })
        .click();
      await expect(dialog).toBeVisible();
      expect(
        await page.evaluate((key) => sessionStorage.getItem(key), storageKey),
      ).toBe(journal);
      await dialog
        .getByRole("button", { name: "Retry unchanged", exact: true })
        .click();
      await expect.poll(() => submissions).toBe(2);
    } else {
      await expect(dialog).toContainText(`SYN ${outcome}`);
      await expect(
        dialog.getByRole("button", { name: "Retry unchanged", exact: true }),
      ).toHaveCount(0);
      expect(
        await page.evaluate((key) => sessionStorage.getItem(key), storageKey),
      ).toBeNull();
      page.on("dialog", (confirmation) => confirmation.accept());
      await dialog.getByRole("button", { name: /^Close / }).click();
      await expect(dialog).toHaveCount(0);
      expect(submissions).toBe(1);
    }
  });
}

test("PJ05 project picker, four record kinds and accepted viewport captures", async ({
  page,
}) => {
  test.setTimeout(1200000);
  await login(page);
  await page.goto("/projects/commercial");
  await expect(
    page.getByText("Choose a project", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Project", exact: true })
    .fill(fixture.f.project.id);
  await page.getByRole("option").first().click();
  await expect(page).toHaveURL(new RegExp(fixture.f.project.id));
  await expect(
    page
      .getByRole("link", {
        name: "Relocate controller to plant room",
        exact: true,
      })
      .filter({ visible: true }),
  ).toBeVisible();
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width > 1000 ? 960 : 844 });
    await page.goto(register());
    await captureViewport(page, width);
    await expect(page.locator(".commercial-values")).toContainText(
      "$11,200.00",
    );
    await expect(
      page
        .getByRole("link", {
          name: "Relocate controller to plant room",
          exact: true,
        })
        .filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Project", exact: true }),
    ).toHaveValue(/SYN Irrigation and climate delivery/);
    await page.screenshot({
      path: `${captures}/${width}-variations.png`,
      fullPage: true,
      animations: "disabled",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
  await login(page, "estimating-source-reviewer");
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width > 1000 ? 960 : 844 });
    await page.goto(record("submitted"));
    await captureViewport(page, width);
    await expect(
      page.getByRole("heading", {
        name: "Relocate controller to plant room",
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: `${captures}/${width}-variation.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await captureViewport(page, 1440);
  await page.goto(record("submitted"));
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(page.locator(".commercial-history").first()).toContainText(
    "Reason:",
  );
  await page.getByRole("button", { name: /^Submissions ·/ }).click();
  await expect(page.locator(".commercial-history")).toHaveCount(1);
  await page.getByRole("button", { name: /^All ·/ }).click();
  await page.screenshot({
    path: `${captures}/1440-history.png`,
    fullPage: true,
    animations: "disabled",
  });
  await login(page);
  await page.goto(register());
  await captureViewport(page, 1440);
  for (const [key, title] of [
    ["basis", "SYN commercial control"],
    ["obligation", "Supply commissioning evidence"],
    ["notice", "Site access notice recorded"],
  ]) {
    await page.goto(record(key));
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    if (key === "basis") {
      await expect(page.locator(".commercial-basis-value strong")).toHaveText(
        "$350.00",
      );
      await expect(page.locator(".commercial-amount-card")).toContainText(
        "$11,200.00",
      );
      await expect(
        page.getByRole("tabpanel", { name: "Overview", exact: true }),
      ).toContainText("Received handover and exact acceptance event retained");
      await expect(
        page.getByRole("button", { name: "New variation", exact: true }),
      ).toBeEnabled();
    }
    await page.screenshot({
      path: `${captures}/1440-${key}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.goto(register());
  await page
    .getByRole("button", {
      name: "Preview Relocate controller to plant room",
      exact: true,
    })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Open variation");
  await page.screenshot({
    path: `${captures}/1440-preview.png`,
    fullPage: true,
    animations: "disabled",
  });
  for (const view of ["Obligation", "Notice", "Values"]) {
    await page.goto(`${register()}&view=${view}`);
    if (view === "Values")
      await expect(page.locator(".commercial-values")).toContainText(
        "$11,200.00",
      );
    const visibleTitle =
      view === "Values"
        ? "Relocate controller to plant room"
        : view === "Obligation"
          ? "Supply commissioning evidence"
          : "Site access notice recorded";
    await expect(
      page
        .getByRole("link", { name: visibleTitle, exact: true })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Project", exact: true }),
    ).toHaveValue(/SYN Irrigation and climate delivery/);
    await page.screenshot({
      path: `${captures}/1440-${view.toLowerCase()}-list.png`,
      fullPage: true,
      animations: "disabled",
    });
    if (view === "Values") {
      await page.locator(".commercial-reconciliation").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${captures}/1440-values-reconciliation.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
  }
  await page.goto(record("obligation"));
  await page
    .getByRole("button", { name: "Mark satisfied", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Complete or cancel every linked Activity",
  );
  await page.screenshot({
    path: `${captures}/1440-satisfied-blocked.png`,
    fullPage: true,
    animations: "disabled",
  });
});
test("PJ05 independent review and lost-response recovery uses the original receipt", async ({
  page,
}) => {
  test.setTimeout(600000);
  await login(page);
  await page.goto(record("submitted"));
  await expect(
    page.getByRole("button", { name: "Record decision", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("You wrote or submitted a version", { exact: false }),
  ).toBeVisible();
  await login(page, "estimating-source-reviewer");
  await page.goto(record("submitted"));
  await page
    .getByRole("button", { name: "Record decision", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN independent review");
  await dialog
    .getByLabel("Note", { exact: true })
    .fill("SYN exact proposal approved");
  await page.screenshot({
    path: `${captures}/1440-decision.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `${captures}/390-decision.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 960 });
  let submissions = 0;
  const lostResponse = Promise.withResolvers<void>();
  const target = `**/api/v1/projects/${fixture.f.project.id}/commercial`;
  await page.route(target, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    submissions++;
    try {
      const result = await route.fetch();
      expect(result.status()).toBe(201);
      await route.abort("failed");
      lostResponse.resolve();
    } catch (error) {
      lostResponse.reject(error);
    }
  });
  await dialog
    .getByRole("button", { name: "Record decision", exact: true })
    .click();
  await lostResponse.promise;
  await expect(dialog).toContainText("save outcome is unconfirmed");
  await page.unroute(target);
  await page.reload();
  await page
    .getByRole("button", { name: "Recover pending save", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Check saved result", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".shared-record-title")).toContainText("Approved");
  expect(submissions).toBe(1);
});
test("PJ05 restricted Finance, failed refresh, stale read and revoked access", async ({
  page,
}) => {
  test.setTimeout(600000);
  await login(page);
  await page.goto(record("basis"));
  // The record and its separately authorised Finance read load in sequence.
  await expect(page.locator(".commercial-basis-value strong")).toHaveText(
    "$350.00",
    { timeout: 90000 },
  );
  const finance = `**/api/v1/projects/${fixture.f.project.id}/commercial/finance`;
  await page.route(finance, (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unavailable" }),
    }),
  );
  const moreActions = page.locator(".commercial-record-more:not([open]) > summary");
  if (await moreActions.isVisible()) await moreActions.click();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.locator(".commercial-basis-value")).toContainText(
    "Unavailable",
  );
  await expect(page.locator(".commercial-basis-value")).not.toContainText(
    "$350.00",
  );
  await expect(page.locator(".commercial-amount-card")).not.toContainText("$");
  await page.goto(register());
  await expect(page.locator(".commercial-values-unavailable")).toContainText(
    "Finance read access is required",
  );
  await expect(
    page.locator(".commercial-values-unavailable"),
  ).not.toContainText("$0.00");
  await page.goto(record("basis"));
  await expect(page.locator(".commercial-basis-value")).toContainText(
    "Unavailable",
  );
  await expect(page.locator(".commercial-basis-value")).not.toContainText(
    "$350.00",
  );
  await page.goto(register());
  await expect(page.locator(".commercial-values-unavailable")).toBeVisible();
  await page.unroute(finance);
  const list = `**/api/v1/projects/${fixture.f.project.id}/commercial?limit=*`;
  await page.route(list, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "SYN temporary read failure" }),
    }),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByText("Previously loaded details are retained.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New variation", exact: true }),
  ).toBeDisabled();
  await page.unroute(list);
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "New variation", exact: true }),
  ).toBeEnabled();
  await page.route(list, (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: "SYN access removed" }),
    }),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("link", {
      name: "Relocate controller to plant room",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("PJ05 native New variation and Record a notice panels retain unknowns and evidence", async ({
  page,
}) => {
  test.setTimeout(600000);
  await login(page);
  await page.goto(register());
  await page
    .getByRole("button", { name: "New variation", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("SYN browser unknown variation");
  await dialog.getByLabel("Clause", { exact: true }).fill("SYN clause 8");
  await dialog
    .getByLabel("Scope and exclusions", { exact: true })
    .fill("SYN bounded browser proposal");
  await expect(
    dialog.getByLabel("Requested amount unknown", { exact: true }),
  ).toBeChecked();
  await expect(
    dialog.getByLabel("Not priced yet", { exact: true }),
  ).toBeChecked();
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN record proposal");
  await dialog
    .getByLabel("Note", { exact: true })
    .fill("SYN unknown amounts remain unknown");
  await expect(
    dialog.getByRole("combobox", { name: "Owner", exact: true }),
  ).toHaveValue("SYN Coordinator");
  await expect(page.locator(".commercial-values")).toBeVisible({
    timeout: 90000,
  });
  await page.screenshot({
    path: `${captures}/1440-new-variation-actions.png`,
    fullPage: true,
    animations: "disabled",
  });
  await dialog.locator(".crm-r38-panel-body").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: `${captures}/1440-new-variation.png`,
    fullPage: true,
    animations: "disabled",
  });
  await dialog
    .getByRole("button", { name: "Save as Requested", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "SYN browser unknown variation",
      exact: true,
    }),
  ).toBeVisible({ timeout: 90000 });
  await expect(page.locator(".commercial-amount-card")).toContainText(
    "Unknown",
  );
  await page.goto(`${register()}&view=Notice`);
  await page
    .getByRole("button", { name: "Record a notice", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("SYN browser notice evidence");
  await dialog.getByLabel("Clause", { exact: true }).fill("SYN clause 9");
  await dialog
    .getByLabel("Requirement or narrative", { exact: true })
    .fill("SYN notice narrative");
  await dialog
    .getByLabel("Reported occurrence", { exact: true })
    .fill("2026-10-01T10:00");
  await dialog
    .getByLabel("Notice evidence", { exact: true })
    .fill("SYN record only; nothing sent");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN retained correspondence");
  await dialog
    .getByLabel("Note", { exact: true })
    .fill("SYN observed evidence");
  await expect(
    dialog.getByRole("combobox", { name: "Owner", exact: true }),
  ).toHaveValue("SYN Coordinator");
  await page.screenshot({
    path: `${captures}/1440-record-notice-actions.png`,
    fullPage: true,
    animations: "disabled",
  });
  await dialog.locator(".crm-r38-panel-body").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: `${captures}/1440-record-notice.png`,
    fullPage: true,
    animations: "disabled",
  });
  await dialog
    .getByRole("button", { name: "Record a notice", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "SYN browser notice evidence",
      exact: true,
    }),
  ).toBeVisible({ timeout: 90000 });
  await expect(page.locator(".shared-record-title")).toContainText(
    "Recorded evidence",
  );
});
