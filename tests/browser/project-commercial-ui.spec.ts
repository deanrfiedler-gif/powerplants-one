import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { closeDatabase } from "../../src/platform/database";
import { commercialUIFixture } from "../helpers/project-commercial-ui";
import { localConfig } from "../../src/platform/config";
let fixture: Awaited<ReturnType<typeof commercialUIFixture>>;
const captures = "docs/testing/evidence/project-commercial/captures";
test.beforeAll(async () => {
  test.setTimeout(180000);
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Only synthetic test DB");
  fixture = await commercialUIFixture();
  await mkdir(captures, { recursive: true });
});
test.afterAll(closeDatabase);
async function login(page: Page, profile = "coordinator") {
  await page.goto("/login");
  const r = await page.request.post("/api/v1/local-session", {
    headers: { Origin: localConfig().origin },
    data: { profile },
  });
  expect(r.ok()).toBeTruthy();
}
const register = () => `/projects/commercial?project=${fixture.f.project.id}`;
const record = (key: string) =>
  `/projects/${fixture.f.project.id}/commercial/${fixture.entries[key]}`;
test("PJ05 project picker, four record kinds and accepted viewport captures", async ({
  page,
}) => {
  test.setTimeout(240000);
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
    await expect(page.locator(".commercial-values")).toContainText(
      "$11,200.00",
    );
    await page.screenshot({
      path: `${captures}/${width}-variations.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page.goto(record("submitted"));
    await expect(
      page.getByRole("heading", {
        name: "Relocate controller to plant room",
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: `${captures}/${width}-variation.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 960 });
  for (const [key, title] of [
    ["basis", "SYN commercial control"],
    ["obligation", "Supply commissioning evidence"],
    ["notice", "Site access notice recorded"],
  ]) {
    await page.goto(record(key));
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `${captures}/1440-${key}.png`,
      fullPage: true,
    });
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
  });
});
test("PJ05 independent review and lost-response recovery uses the original receipt", async ({
  page,
}) => {
  test.setTimeout(120000);
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
  });
  let submissions = 0;
  const target = `**/api/v1/projects/${fixture.f.project.id}/commercial`;
  await page.route(target, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    submissions++;
    const result = await route.fetch();
    expect(result.status()).toBe(201);
    await route.abort("failed");
  });
  await dialog
    .getByRole("button", { name: "Record decision", exact: true })
    .click();
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
  test.setTimeout(120000);
  await login(page);
  const finance = `**/api/v1/projects/${fixture.f.project.id}/commercial/finance`;
  await page.route(finance, (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unavailable" }),
    }),
  );
  await page.goto(register());
  await expect(page.locator(".commercial-values-unavailable")).toContainText(
    "Finance read access is required",
  );
  await expect(
    page.locator(".commercial-values-unavailable"),
  ).not.toContainText("$0.00");
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
