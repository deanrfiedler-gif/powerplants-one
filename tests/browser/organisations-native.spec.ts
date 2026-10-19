import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
const org = "50000000-0000-4000-8000-000000000001";
const company = "20000000-0000-4000-8000-000000000001";
async function capture(page: Page, info: TestInfo, name: string) {
  const root = process.env.PPO_CS01_EVIDENCE;
  if (root) {
    await mkdir(root, { recursive: true });
    await page.screenshot({ path: join(root, `${name}.png`) });
  } else await page.screenshot({ path: info.outputPath(`${name}.png`) });
}
test.beforeEach(async ({ page, baseURL }) => {
  const r = await page.request.post(`${baseURL}/api/v1/local-session`, {
    headers: { origin: baseURL! },
    data: { profile: "coordinator" },
  });
  expect(r.status()).toBe(200);
});
test("CS01 register and seven-tab record geometry at all retained widths", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  for (const width of [1440, 1280, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 900 : 844 });
    await page.goto("/customers?department=service");
    await expect(page.locator(".org-read-time")).toContainText("organisations");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("heading", {
        name: "Organisations",
        level: 1,
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.locator(width < 600 ? ".org-phone-list" : ".org-desktop-grid"),
    ).toBeVisible();
    if (width >= 1200) {
      const bounds = await page.locator("#org-menu").boundingBox();
      expect(bounds?.width).toBe(240);
    }
    const toolbarBounds = await page.locator(".org-toolbar").boundingBox();
    expect(toolbarBounds!.height).toBeGreaterThanOrEqual(60);
    if (width >= 1024) {
      for (const selector of [
        ".org-desktop-grid thead tr",
        ".org-desktop-grid tbody tr",
      ]) {
        expect(
          (await page.locator(selector).first().boundingBox())!.height,
        ).toBeGreaterThanOrEqual(44);
      }
    }
    if (width < 600) {
      const toolbar = await page.locator(".org-toolbar").boundingBox(),
        first = await page
          .locator(".org-phone-list article")
          .first()
          .boundingBox();
      expect(first!.y).toBeGreaterThanOrEqual(toolbar!.y + toolbar!.height - 1);
      expect(first!.height).toBeGreaterThanOrEqual(88);
    }
    await capture(page, info, `register-${width}`);
    if (width === 1440) await page.setViewportSize({ width, height: 1234 });
    await page.goto(`/customers/${org}?department=service`);
    await expect(
      page.getByRole("tab", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("h1")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 600) {
      const heading = await page.locator("h1").boundingBox();
      expect(heading!.width).toBeGreaterThan(width - 64);
    }
    await capture(page, info, `record-${width}`);
    if (width < 600)
      await expect(
        page
          .locator(".shared-record-sticky")
          .getByRole("link", { name: "Create follow-up" }),
      ).toBeVisible();
  }
});
test("CS01 filters, sorting, snapshot focus and return survive navigation", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/customers");
  await expect(page.getByRole("table")).toBeVisible();
  await page
    .getByLabel("Search organisations", { exact: true })
    .fill("SYN Greenhouse");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=SYN\+Greenhouse/);
  await page.getByRole("button", { name: "Name", exact: true }).click();
  await expect(page.locator('th[aria-sort="descending"]')).toContainText(
    "Name",
  );
  const checkbox = page
    .getByRole("checkbox", {
      name: "Select SYN Greenhouse Demonstration",
      exact: true,
    })
    .first();
  await checkbox.check();
  const dialog = page.getByRole("dialog", { name: "Organisation snapshot" });
  await expect(dialog).toBeVisible();
  expect((await dialog.boundingBox())!.width).toBe(380);
  await capture(page, info, "snapshot-1440");
  await dialog.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(checkbox).toBeFocused();
  const href = await page
    .locator(".org-col-name a")
    .first()
    .getAttribute("href");
  await page.goto(href!);
  await page
    .getByRole("link", { name: "Back to organisations", exact: true })
    .click();
  await expect(page).toHaveURL(/q=SYN\+Greenhouse/);
  await expect(page.locator('th[aria-sort="descending"]')).toContainText(
    "Name",
  );
  await expect(
    page.getByRole("checkbox", { name: /Select SYN/ }).first(),
  ).not.toBeChecked();
  await page
    .getByRole("button", { name: "Columns and views", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Columns and views" }),
  ).toBeVisible();
  await page.getByRole("dialog", { name: "Columns and views" }).press("Escape");
});
test("CS01 Sales type/status URL and permitted source states", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1078 });
  await page.goto(`/customers/${org}?view=deals&department=service`);
  await expect(
    page.getByRole("tab", { name: "Sales", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await capture(page, info, "sales-1440");
  await page.getByRole("button", { name: /^Quotations/ }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Status", exact: true }).click();
  await capture(page, info, "sales-filtered-1440");
  await page
    .getByRole("menuitemradio", { name: "Closed", exact: true })
    .click();
  await expect(page).toHaveURL(/status=closed/);
  await page.reload();
  await expect(page).toHaveURL(/type=quotations/);
  await expect(page).toHaveURL(/status=closed/);
  for (const name of ["Service", "Projects", "Sites", "Accounts", "Activity"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }
  await page.getByRole("tab", { name: "Accounts", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Restricted");
  await expect(page.getByRole("tabpanel")).not.toContainText(
    "Source account balance:",
  );
  await page.getByRole("tab", { name: "Accounts", exact: true }).press("Home");
  await expect(
    page.getByRole("tab", { name: "Overview", exact: true }),
  ).toBeFocused();
});
test("CS01 create fields persist through the existing command and duplicate handover", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/customers/new?department=service");
  await page
    .getByLabel("Company visibility context", { exact: true })
    .selectOption(company);
  await page.getByLabel("Display name", { exact: true }).fill("SYN Greenhouse");
  await expect(
    page.getByRole("complementary", { name: "Check before creating" }),
  ).toContainText("SYN-PPO-ORG");
  await capture(page, info, "create-1440");
  await page
    .getByLabel("Display name", { exact: true })
    .fill(`SYN CS01 browser ${Date.now()}`);
  await page
    .getByLabel("Legal name", { exact: true })
    .fill("SYN CS01 legal example");
  await page
    .getByLabel("Sector", { exact: true })
    .fill("Synthetic protected cropping");
  await page
    .getByLabel("Relationship notes", { exact: true })
    .fill("SYN Internal relationship context");
  await page
    .getByLabel("Reason for capture", { exact: true })
    .fill("SYN CS01 native save proof");
  await page
    .getByRole("button", { name: "Create organisation", exact: true })
    .click();
  await expect(page).toHaveURL(/customers\/[0-9a-f-]{36}$/);
  await expect(
    page.getByText("SYN CS01 legal example", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("SYN Internal relationship context", { exact: true }),
  ).toBeVisible();
});
test("CS01 loading, empty, unavailable, denied and partial source failures never retain counts", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release: () => void = () => {};
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/customers/register?*", async (route) => {
    await waiting;
    await route.continue();
  });
  await page.goto("/customers");
  await expect(
    page.getByText("Loading… Current results unconfirmed", { exact: true }),
  ).toBeVisible();
  await capture(page, info, "loading-390");
  release();
  await page.unrouteAll({ behavior: "wait" });
  await page.goto("/customers?q=SYN-no-matching-name");
  await expect(
    page
      .getByText("No matching organisations", { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await capture(page, info, "empty-390");
  for (const status of [503, 403]) {
    await page.route("**/api/v1/customers/register?*", (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({
          code: status === 403 ? "Forbidden" : "Unavailable",
          message: "SYN induced read failure",
        }),
      }),
    );
    await page.goto("/customers");
    await expect(
      page.getByText("Organisations could not be loaded", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry loading", exact: true })).toHaveCount(1);
    await expect(page.locator(".org-phone-list article")).toHaveCount(0);
    await expect(page.locator(".org-read-time")).toHaveText(
      "Current results unconfirmed",
    );
    await capture(
      page,
      info,
      `${status === 403 ? "denied" : "unavailable"}-390`,
    );
    await page.unrouteAll();
  }
  await page.route(`**/api/v1/customers/${org}/workspace`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.sections.cases = {
      ...body.sections.cases,
      state: "Unavailable",
      items: [],
      basis:
        "SYN induced Service read failure. Other source observations retained.",
    };
    await route.fulfill({ response, json: body });
  });
  await page.goto(`/customers/${org}`);
  await expect(
    page.getByRole("button", { name: "Retry requests" }),
  ).toBeVisible();
  await capture(page, info, "service-unavailable-390");
  await page.unrouteAll();
});

test("CS01 saved columns and identity correction retain existing save/recovery authority", async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(150000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/customers");
  await page
    .getByRole("button", { name: "Columns and views", exact: true })
    .first()
    .click();
  await page.getByRole("checkbox", { name: "Sector", exact: true }).uncheck();
  const name = `SYN CS01 view ${Date.now()}`;
  await page.getByLabel("View name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Save view", exact: true }).click();
  await expect(
    page.getByText("View saved for your account.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Columns and views", exact: true })
    .first()
    .click();
  await page.getByLabel("Saved view", { exact: true }).selectOption(name);
  await expect(
    page.getByRole("columnheader", { name: "Sector", exact: true }),
  ).toHaveCount(0);
  const id = crypto.randomUUID(),
    recordName = "SYN CS01 " + "long organisation identity ".repeat(7);
  const created = await page.request.post(`${baseURL}/api/v1/customers`, {
    headers: { origin: baseURL! },
    data: {
      operation_id: crypto.randomUUID(),
      schema_version: 1,
      id,
      company_id: company,
      display_name: recordName,
      owner_id: "30000000-0000-4000-8000-000000000001",
      relationship_status: "Prospect",
      reason: "SYN Correction recovery fixture",
    },
  });
  expect(created.status()).toBe(201);
  await page.goto(`/customers/${id}`);
  await expect(
    page.getByRole("heading", { name: recordName, exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await capture(page, info, "long-identity-1440");
  await page
    .getByRole("button", { name: "Organisation actions", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Correct details", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Correct organisation details",
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("Display name", { exact: true })
    .fill("SYN CS01 corrected identity");
  await dialog
    .getByLabel("Reason for correction")
    .fill("SYN Confirm the original correction after a lost response");
  let sent = 0;
  await page.route(
    `**/api/v1/customers/${id}/revise-identity`,
    async (route) => {
      sent++;
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{",
      });
    },
  );
  await dialog
    .getByRole("button", { name: "Save correction", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Confirm original save" }),
  ).toBeVisible();
  await capture(page, info, "correction-recovery-1440");
  await dialog.getByRole("button", { name: "Confirm original save" }).click();
  await expect(dialog).not.toBeVisible();
  expect(sent).toBe(1);
  await expect(
    page.getByRole("heading", {
      name: "SYN CS01 corrected identity",
      exact: true,
    }),
  ).toBeVisible();
  await page.unrouteAll();
  await page.setViewportSize({ width: 720, height: 500 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await capture(page, info, "record-reflow-720");
});

test("CS01 phone snapshot returns focus and context; create reflows without losing entries", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/customers?q=SYN+Greenhouse&department=service");
  const trigger = page
    .locator(".org-phone-list article")
    .filter({ hasText: "SYN-PPO-ORG-000001" })
    .getByRole("button", {
      name: "Snapshot for SYN Greenhouse Demonstration",
      exact: true,
    });
  const activate = () => info.project.use.isMobile ? trigger.tap() : trigger.click();
  await activate();
  const snapshot = page.getByRole("dialog", { name: "Organisation snapshot" });
  await expect(snapshot).toBeVisible();
  const bounds = (await snapshot.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(391);
  await capture(page, info, "snapshot-390");
  await snapshot.press("Escape");
  await expect(trigger).toBeFocused();
  await activate();
  await snapshot
    .getByRole("link", { name: "Open organisation", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Back to organisations", exact: true })
    .click();
  await expect(page).toHaveURL(/q=SYN\+Greenhouse/);
  await expect(page).toHaveURL(/department=service/);
  await page.goto("/customers/new");
  await page.getByLabel("Display name", { exact: true }).fill("SYN Greenhouse");
  await expect(
    page.getByRole("link", { name: "Open", exact: true }).first(),
  ).toBeVisible();
  for (const width of [1024, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1024 ? 900 : 844 });
    await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
      "SYN Greenhouse",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await capture(page, info, `create-${width}`);
  }
});
