import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { areaId, siteId, mockFacilities } from "../helpers/facilities-design";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "ppo.shell.r15.preferences:cs05-design-fixture",
      JSON.stringify({ schema_version: 1, workspace: "service" }),
    ),
  );
  // These are composition/state tests. Real permissions and writes are covered
  // separately by facilities.spec.ts and tests/database/facilities.test.ts.
  await page.route("**/api/v1/local-session", (route) =>
    route.fulfill({
      json: {
        actor_id: "c5050023-0000-4000-8000-000000000001",
        workspace_id: "10000000-0000-4000-8000-000000000001",
        display_name: "SYN Sasha Cole",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (route) =>
    route.fulfill({
      json: {
        display_name: "SYN Sasha Cole",
        preference_scope: "cs05-design-fixture",
        actions: [],
        navigation: [
          "work",
          "tickets",
          "orders",
          "planner",
          "technicians",
          "packs",
          "reports",
          "equipment",
          "sites",
          "facilities",
        ],
        can_preview: true,
        conversations: false,
      },
    }),
  );
});
async function capture(page: Page, info: TestInfo, name: string) {
  await page.screenshot({
    path: info.outputPath(`${name}.png`),
    fullPage: false,
    style:
      "svg, .fa-light, .fa-solid, .svg-inline--fa { visibility:hidden !important; }",
  });
}
async function contained(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function review(page: Page) {
  await page.goto(`/facilities/${areaId}/edit`);
  await page.getByLabel("Footprint (m²)", { exact: true }).fill("1188");
  await page.getByLabel("Season label", { exact: true }).fill("");
  await page
    .getByLabel("Change reason", { exact: true })
    .fill("SYN remeasured at grower walkthrough");
  await page
    .getByRole("button", { name: "Review changes", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review changes to Bay 4" }),
  ).toBeVisible();
}
test("CS05 accepted register, snapshot, hierarchy and tablet handovers", async ({
  page,
}, info) => {
  await mockFacilities(page);
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(`/facilities${width === 390 ? `?site_id=${siteId}` : ""}`);
    await expect(
      page.getByRole("heading", { name: "Facilities & growing areas" }),
    ).toBeAttached({ timeout: 30000 });
    await expect(page.locator(".facility-loading")).toHaveCount(0);
    await expect(
      page
        .locator(width === 390 ? ".facility-phone-row" : ".facility-row-open")
        .filter({ hasText: "Bay 4" }),
    ).toBeVisible();
    await contained(page);
    await capture(page, info, `register-${width}`);
    if (width === 1440) {
      await page.getByRole("button", { name: "Bay 4", exact: true }).click();
      const snapshot = page.getByRole("dialog", {
        name: "Facility snapshot",
        exact: true,
      });
      await expect(
        snapshot.getByRole("heading", { name: "Bay 4", exact: true }),
      ).toBeVisible();
      await expect(
        snapshot.getByRole("link", { name: "Correct details" }),
      ).toHaveCount(0);
      await expect(
        snapshot.getByRole("link", { name: "Open facility", exact: true }),
      ).toHaveAttribute("href", `/facilities/${areaId}`);
      await capture(page, info, "snapshot-1440");
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Bay 4", exact: true }),
      ).toBeFocused();
      await page
        .getByRole("button", { name: "Hierarchy", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Hierarchy", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByRole("columnheader", { name: "Relationship", exact: true }),
      ).toBeVisible();
      await capture(page, info, "hierarchy-1440");
    }
  }
});
test("CS05 record widths, Equipment groups, view-only and site handovers", async ({
  page,
}, info) => {
  await mockFacilities(page, { readOnly: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.goto(`/facilities/${areaId}`);
    await expect(
      page.getByRole("heading", { name: "Measurements", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Correct details", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.locator(".facility-banner").filter({ hasText: "View only." }),
    ).toBeVisible();
    await contained(page);
    await capture(page, info, `view-only-${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("tab", { name: "Equipment", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Shade screen motor M-4", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Installed here · 2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Vent actuator VA-41", exact: true }),
  ).toBeVisible();
  await capture(page, info, "equipment-1440");
});
test("CS05 editable Overview, create lookup, review and required acknowledgement", async ({
  page,
}, info) => {
  await mockFacilities(page);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.goto(`/facilities/${areaId}`);
    await expect(
      page.getByRole("heading", { name: "Measurements", exact: true }),
    ).toBeVisible();
    await contained(page);
    await capture(page, info, `overview-${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/facilities/new?site_id=${siteId}`);
  await expect(
    page.getByRole("heading", { name: "Check before creating", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Facility / area name", { exact: true }).fill("Bay 4");
  await expect(
    page.getByText(/An area named Bay 4 is already recorded/),
  ).toBeVisible();
  await capture(page, info, "create-1440");
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(`/facilities/${areaId}/edit`);
  await page.setViewportSize({ width: 1440, height: 1033 });
  await expect(page.getByLabel("Footprint (m²)", { exact: true })).toHaveValue(
    "1152",
  );
  await capture(page, info, "correct-1440");
  await review(page);
  await page.setViewportSize({ width: 1440, height: 1120 });
  const confirm = page.getByRole("button", {
    name: "Confirm these changes",
    exact: true,
  });
  await expect(confirm).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "Review facility changes" }),
  ).toBeFocused();
  await capture(page, info, "review-1440");
  await page.setViewportSize({ width: 390, height: 844 });
  await contained(page);
  await capture(page, info, "review-390");
  await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await expect(confirm).toBeEnabled();
});
for (const state of ["loading", "empty", "error", "denied"] as const)
  test(`CS05 ${state}: phone read states never present stale rows`, async ({
    page,
  }, info) => {
    await mockFacilities(page, { state });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/facilities?site_id=${siteId}&q=Orchard`);
    if (state === "loading")
      await expect(
        page.getByText("Loading permitted facilities and areas…", {
          exact: true,
        }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole("heading", {
          name:
            state === "empty"
              ? "No matching areas"
              : state === "denied"
                ? "Facilities unavailable"
                : "Facilities could not be loaded",
          exact: true,
        }),
      ).toBeVisible();
    await expect(page.locator(".facility-phone-row")).toHaveCount(0);
    if (state !== "empty")
      await expect(page.locator(".facility-phone-toolbar")).not.toContainText(
        "31",
      );
    await contained(page);
    await capture(page, info, `${state}-390`);
  });
test("CS05 conflict preserves proposal and adopts unrelated latest values", async ({
  page,
}, info) => {
  const sent = await mockFacilities(page, { conflict: true });
  await page.setViewportSize({ width: 1440, height: 1120 });
  await review(page);
  await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await page
    .getByRole("button", { name: "Confirm these changes", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bay 4 changed since you opened it" }),
  ).toBeVisible();
  await capture(page, info, "conflict-1440");
  await page
    .getByRole("button", { name: "Use latest saved version for comparison" })
    .click();
  await expect(page.getByLabel("Footprint (m²)", { exact: true })).toHaveValue(
    "1188",
  );
  await expect(
    page.getByLabel("Crop / crop group", { exact: true }),
  ).toHaveValue("Capsicum");
  await page
    .getByRole("button", { name: "Review changes", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirm these changes", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await page
    .getByRole("button", { name: "Confirm these changes", exact: true })
    .click();
  expect(sent).toHaveLength(2);
  expect(sent[1].expected_version).toBe(8);
  expect(sent[1].changes).not.toHaveProperty("crop");
});
test("CS05 unconfirmed result retains original operation identity and proposal", async ({
  page,
}, info) => {
  const sent = await mockFacilities(page, { uncertain: true });
  await page.setViewportSize({ width: 1440, height: 1120 });
  await review(page);
  await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await page
    .getByRole("button", { name: "Confirm these changes", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Result not confirmed", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm these changes", exact: true }),
  ).toBeDisabled();
  await capture(page, info, "unconfirmed-1440");
  await page
    .getByRole("button", { name: "Try the original action again", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server", exact: true }),
  ).toBeVisible();
  expect(sent).toHaveLength(2);
  expect(sent[1]).toEqual(sent[0]);
});
