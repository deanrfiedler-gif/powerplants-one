import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { waitForSampleCoreResponse } from "../../scripts/quality-core-response";
import {
  peopleRegisterFixture,
  peopleFixtureId,
} from "../helpers/people-register";

test.describe.configure({ timeout: 180000 });
test.beforeEach(async ({ page, baseURL }) => {
  // Evidence uses the repository's local fallback icons, never licensed Kit artwork.
  await page.route("**/*fontawesome*", (r) => r.abort());
  const session = await page.request.post("/api/v1/local-session", {
    headers: { origin: baseURL! },
    data: { profile: "coordinator" },
  });
  expect(session.status()).toBe(200);
});
async function fixture(page: Page) {
  await page.route("**/api/v1/people/register?**", (r) =>
    r.fulfill({ json: peopleRegisterFixture() }),
  );
}
async function capture(page: Page, info: TestInfo, name: string) {
  await expect(page.locator(".ppo-fa")).toHaveCount(0);
  const root = process.env.PPO_CS02_EVIDENCE;
  if (root) {
    await mkdir(root, { recursive: true });
    await page.screenshot({ path: join(root, `${name}.png`) });
  } else await page.screenshot({ path: info.outputPath(`${name}.png`) });
}
test("CS02 grid, compact phone list and menu at drawn and narrow widths", async ({
  page,
}, info) => {
  await fixture(page);
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 900 : 844 });
    await page.goto("/people?department=service");
    if (width >= 1024)
      await expect(
        page.getByRole("button", { name: /Collapse primary navigation/ }),
      ).toBeEnabled();
    await expect(page.locator(".people-col-name a").first()).toHaveText(
      "Ava Singh",
    );
    await expect(page.locator("h1")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width >= 1024) {
      await expect(page.getByRole("table")).toBeVisible();
      expect(
        (await page.locator(".people-toolbar").boundingBox())!.height,
      ).toBe(60);
      expect(
        (await page.locator(".people-desktop tbody tr").first().boundingBox())!
          .height,
      ).toBe(40);
      if (width === 1440)
        expect((await page.locator("#people-menu").boundingBox())!.width).toBe(
          240,
        );
    } else {
      await expect(page.locator(".people-toolbar")).toBeHidden();
      await expect(page.locator(".people-phone-row")).toHaveCount(8);
      expect(
        (await page.locator(".people-phone-row").first().boundingBox())!.y,
      ).toBe(56);
      expect(
        (await page.locator(".people-phone-row").first().boundingBox())!.height,
      ).toBe(85);
      await expect(page.locator(".people-phone-row").first()).toHaveAttribute(
        "href",
        new RegExp(`/people/${peopleFixtureId(1)}`),
      );
      await expect(
        page.getByRole("button", {
          name: width === 320 ? "Search and filter" : "Search people",
          exact: true,
        }),
      ).toBeVisible();
    }
    await capture(page, info, `register-${width}`);
  }
});
test("CS02 filter edits apply together, selection is transient and exact handovers retain department", async ({
  page,
}) => {
  await fixture(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/people?department=service");
  await page
    .getByRole("button", { name: "People options", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Search and filter", exact: true })
    .click();
  const panel = page.getByRole("dialog", { name: "Search and filter people" });
  await panel.getByLabel("Search people", { exact: true }).fill("Ava");
  await panel
    .getByLabel("Organisation", { exact: true })
    .selectOption(peopleFixtureId(101));
  await expect(panel).toBeVisible();
  await panel
    .getByLabel("Notices", { exact: true })
    .selectOption("DoNotNotify");
  await panel.getByRole("button", { name: "Show people", exact: true }).click();
  await expect(page).toHaveURL(/q=Ava/);
  expect(new URL(page.url()).searchParams.get("organisation")).toBe(
    peopleFixtureId(101),
  );
  expect(new URL(page.url()).searchParams.get("notices")).toBe("DoNotNotify");
  await page
    .getByRole("checkbox", { name: "Select Ava Singh", exact: true })
    .check();
  await expect(page.getByText("1 selected on this page")).toBeVisible();
  await page.getByRole("button", { name: "Name", exact: true }).click();
  await expect(page.locator('th[aria-sort="descending"]')).toContainText(
    "Name",
  );
  await expect(
    page.getByRole("checkbox", { name: "Select Ava Singh", exact: true }),
  ).not.toBeChecked();
  await expect(page.locator(".people-col-name a").first()).toHaveAttribute(
    "href",
    `/people/${peopleFixtureId(1)}?department=service`,
  );
  await page
    .getByRole("button", { name: "People options", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Create person", exact: true }),
  ).toHaveAttribute("href", /\/customers\/new\?kind=person/);
});
test("CS02 loading, empty, failed and denied reads never retain a list or stale count", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let mode = "loading";
  let release: (() => void) | undefined;
  await page.route("**/api/v1/people/register?**", async (r) => {
    if (mode === "loading")
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    if (mode === "empty")
      return r.fulfill({
        json: {
          ...peopleRegisterFixture(),
          items: [],
          total: 0,
          counts: { Active: 0, SiteContacts: 0, Channels: 0, Inactive: 0 },
        },
      });
    if (mode === "error" || mode === "denied")
      return r.fulfill({
        status: mode === "denied" ? 403 : 503,
        json: { code: "Unavailable", message: "Synthetic unavailable read" },
      });
    return r.fulfill({ json: peopleRegisterFixture() });
  });
  await page.goto("/people?department=service");
  await expect(page.locator(".people-loading")).toBeVisible();
  await capture(page, info, "loading-390");
  mode = "loaded";
  release?.();
  await expect(page.locator(".people-phone-row")).toHaveCount(8);
  for (const state of ["empty", "error", "denied"]) {
    mode = state;
    await page.reload();
    await expect(page.locator(".people-state")).toBeVisible();
    await expect(page.locator(".people-phone-row")).toHaveCount(0);
    await expect(page.locator("#people-menu small")).toHaveCount(
      state === "empty" ? 4 : 0,
    );
    if (state === "empty")
      await expect(
        page.getByText("No matching people", { exact: true }),
      ).toBeVisible();
    else
      await expect(page.locator(".people-error")).toContainText(
        state === "denied" ? "outside your access" : "could not be loaded",
      );
    await capture(page, info, `${state}-390`);
  }
});
test("CS02 Contacts hub preserves People and Organisations and real person receiving", async ({
  page,
}) => {
  await page.goto("/contacts?view=people&department=service");
  await expect(
    page.getByRole("navigation", { name: "Contacts views" }),
  ).toBeVisible();
  await expect(page.locator(".people-col-name a").first()).toBeAttached();
  const href = await page
    .locator(".people-col-name a")
    .first()
    .getAttribute("href");
  expect(href).toMatch(/^\/people\/[a-f0-9-]+\?department=service$/);
  const receiving = waitForSampleCoreResponse(
    page,
    `/api/v1${new URL(href!, page.url()).pathname}/workspace`,
  );
  void receiving.catch(() => undefined);
  await page.goto(href!);
  expect((await receiving).status()).toBe(200);
  await expect(
    page.getByRole("tab", { name: "Identity & channels", exact: true }),
  ).toBeVisible();
  await page.goto("/contacts?view=organisations&department=service");
  await expect(page.locator(".crm-directory-table")).toBeVisible();
});

test("CS02 phone chooser and full-screen filters return focus and keep draft edits separate", async ({
  page,
}, info) => {
  await fixture(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/people?department=service");
  const filter = page.getByRole("button", {
    name: "Search and filter",
    exact: true,
  });
  await filter.click();
  const dialog = page.getByRole("dialog", { name: "Search and filter people" });
  await expect(dialog).toBeVisible();
  expect((await dialog.boundingBox())!.width).toBe(320);
  await dialog.getByLabel("Search people", { exact: true }).fill("Draft");
  await dialog.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(dialog.getByLabel("Search people", { exact: true })).toHaveValue(
    "",
  );
  await capture(page, info, "filters-320");
  await dialog.press("Escape");
  await expect(filter).toBeFocused();
  await page
    .getByRole("button", { name: /Choose view. Current view: People/ })
    .click();
  const menu = page.getByRole("dialog", { name: "People menu", exact: true });
  await menu.getByRole("button", { name: /Channels to review/ }).click();
  await expect(page).toHaveURL(/people_view=Channels/);
  await expect(
    page.getByRole("button", {
      name: /Choose view. Current view: Channels to review/,
    }),
  ).toBeVisible();
});
