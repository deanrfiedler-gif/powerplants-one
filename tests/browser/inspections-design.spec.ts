import { test, expect, type Page } from "@playwright/test";
import {
  acceptedInspectionFixture,
  inspectionVisitId,
} from "../fixtures/inspections-accepted";
import { destinations } from "../../src/shell/navigation";
const actor = "30000000-0000-4000-8000-000000000001";
const capture = `/my-jobs/inspections?appointment_id=${inspectionVisitId}&department=service`;
const review = `/service/inspections?appointment_id=${inspectionVisitId}&department=service`;
const api = `**/api/v1/my-jobs/${inspectionVisitId}/inspections`;
const noOverflow = async (page: Page) =>
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (r) => r.abort());
  await page.route("**/api/v1/**", (r) =>
    r.fulfill({
      json: {
        items: [],
        observed_at: "2026-10-15T00:31:00Z",
        completeness: "Complete",
      },
    }),
  );
  await page.route("**/api/v1/local-session", (r) =>
    r.fulfill({
      json: {
        actor_id: actor,
        workspace_id: "10000000-0000-4000-8000-000000000001",
        display_name: "SYN Riley Tran",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (r) =>
    r.fulfill({
      json: {
        display_name: "SYN Riley Tran",
        preference_scope: "inspections-visual-fixture",
        actions: [],
        navigation: destinations.map((d) => d.id),
        can_preview: true,
      },
    }),
  );
});
async function captureWithoutIcons(page: Page, path: string) {
  const viewport = page.viewportSize()!;
  if (/capture-(390|320)\.png$/.test(path))
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.width === 320 ? 1772 : 1550,
    });
  await page
    .locator("#ppo-service-inspections")
    .evaluate((e) => (e.scrollTop = 0));
  await page.addStyleTag({
    content: "svg,i[class*=fa-]{visibility:hidden!important}",
  });
  await page.screenshot({ path, fullPage: true });
  if (/capture-(390|320)\.png$/.test(path)) {
    await page.getByLabel("What you found", { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.replace(".png", "-details.png"), fullPage: true });
  }
  await page.setViewportSize(viewport);
}
test("review register and technician worklist keep bounded views, filters and empty/error states", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  const fixture = acceptedInspectionFixture(actor, "review");
  const rows = fixture.attempts.map((a, i) => ({
    id: inspectionVisitId,
    reference: "SYN-PPO-APT-000052",
    work_order: "SYN-PPO-WO-000040",
    status: "InProgress",
    site_id: "syn-site",
    site: "SYN Glasshouse 4",
    start_at: "2026-10-15T22:00:00Z",
    attempt_id: a.row.id,
    procedure: "Drive motor insulation and torque",
    procedure_reference: "SYN-SVC-INS-04 v1",
    attempt_number: i + 1,
    predecessor_number: i ? 1 : null,
    performer: a.row.performer_name,
    performer_id: a.row.performer_id,
    submitted_at: "2026-10-15T00:31:00Z",
    review: a.review,
    state: "Submitted",
    result: i ? "4 of 4 pass" : "1 failed",
    failed: i ? 0 : 1,
    defects: 1,
    retest_due: true,
    issued: false,
    equipment: "Shade screen motor M-4",
  }));
  let empty = false,
    denied = false;
  await page.route("**/api/v1/service/inspections", (r) =>
    denied
      ? r.fulfill({
          status: 403,
          json: {
            code: "Forbidden",
            message:
              "Inspection review is unavailable under your current access.",
          },
        })
      : r.fulfill({
          json: {
            rows: empty ? [] : rows,
            window: "Latest 100 candidate visits; access checked individually.",
            as_at: "2026-10-15T00:31:00Z",
          },
        }),
  );
  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/service/inspections?department=service");
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(2);
    if (width === 1024)
      await page.getByRole("button", { name: "Collapse primary navigation", exact: true }).click();
    await noOverflow(page);
    await captureWithoutIcons(page, info.outputPath(`register-${width}.png`));
    await page
      .getByLabel("Performer", { exact: true })
      .selectOption(rows[1].performer_id);
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(1);
    await page.getByLabel("Performer", { exact: true }).selectOption("");
  }
  empty = true;
  await page
    .getByRole("button", { name: "Refresh inspections", exact: true })
    .click();
  await expect(
    page.getByText("No attempts in this view", { exact: true }),
  ).toBeVisible();
  await captureWithoutIcons(page, info.outputPath("empty-1024.png"));
  denied = true;
  await page.reload();
  await expect(
    page.getByText(
      "Inspection review is unavailable under your current access.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Drive motor insulation and torque",
      exact: true,
    }),
  ).toHaveCount(0);
  await captureWithoutIcons(
    page,
    info.outputPath("permission-denied-1024.png"),
  );
  await page.route("**/api/v1/my-jobs/inspections", (r) =>
    r.fulfill({
      json: {
        rows: [
          {
            ...rows[1],
            state: "Draft",
            review: "NotSubmitted",
            result: "2 of 4 recorded",
          },
          rows[0],
        ],
        window: "Latest 100 candidate visits; access checked individually.",
        as_at: "2026-10-15T00:31:00Z",
      },
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/my-jobs/inspections?department=service");
  await expect(
    page.getByRole("heading", { name: "To do 1", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await captureWithoutIcons(page, info.outputPath("my-inspections-390.png"));
});
test("accepted capture at 1440, 1024, 390 and 320 preserves drafts, local preview and offline boundary", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  await page.route(api, (r) =>
    r.fulfill({ json: acceptedInspectionFixture(actor) }),
  );
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width < 780 ? 844 : 900 });
    await page.goto(capture);
    await expect(
      page.getByRole("button", {
        name: /Insulation resistance, phase to earth.*Edit saved check/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Checks · 2 of 4 recorded",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByLabel("Holding torque at full travel reading", { exact: true })
      .fill("11.2");
    await page
      .getByLabel("Holding torque at full travel instrument", { exact: true })
      .selectOption("f1030000-0000-4000-8000-000000000011");
    await expect(page.getByText(/not saved yet/).first()).toBeVisible();
    await noOverflow(page);
    await captureWithoutIcons(page, info.outputPath(`capture-${width}.png`));
    if (width < 780) {
      await expect(
        page.getByRole("heading", { name: "Evidence · 1", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByLabel("What you found", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Save draft", exact: true }),
      ).toBeInViewport();
      const options = page.getByRole("radiogroup", {
        name: "Gearbox seal condition outcome",
      });
      expect((await options.boundingBox())!.width).toBeLessThanOrEqual(
        width - 32,
      );
    }
    await page.context().setOffline(true);
    await expect(page.getByText(/Not connected · last saved/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save draft", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Submit inspection", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByLabel("Holding torque at full travel reading", { exact: true }),
    ).toHaveValue("11.2");
    if (width === 390)
      await captureWithoutIcons(page, info.outputPath("not-connected-390.png"));
    await page.context().setOffline(false);
    // Explicit reload discards this presentation fixture's memory-only draft.
    page.once("dialog", (d) => d.accept());
  }
});
test("saved failed submission sheet freezes commands while the original outcome is uncertain", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let posts = 0;
  await page.route(api, (r) =>
    r.request().method() === "POST"
      ? (posts++, r.abort("connectionreset"))
      : r.fulfill({ json: acceptedInspectionFixture(actor, "failed") }),
  );
  await page.goto(capture);
  await page
    .getByRole("button", { name: "Submit inspection", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Submit attempt 2?" });
  await expect(
    dialog.getByText("4 checks · 3 pass · 1 fail", { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText(/owned defect/)).toBeVisible();
  await captureWithoutIcons(page, info.outputPath("submit-failed-390.png"));
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Submit inspection", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await dialog
    .getByRole("button", { name: "Submit attempt", exact: true })
    .click();
  await expect(
    page.getByText("Submission not confirmed", { exact: true }),
  ).toBeVisible();
  expect(posts).toBe(1);
  await expect(
    page.getByRole("button", { name: "Submit inspection", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Recover the original", exact: true }),
  ).toBeEnabled();
  await captureWithoutIcons(page, info.outputPath("uncertain-submit-390.png"));
});
test("attendance refusal, retained retest chronology and prepared outcome use the drawn states", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(api, (r) =>
    r.fulfill({ json: acceptedInspectionFixture(actor, "not-attending") }),
  );
  await page.goto(capture);
  await expect(
    page.getByText("Can't record yet", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toBeDisabled();
  await noOverflow(page);
  await captureWithoutIcons(page, info.outputPath("not-attending-390.png"));
  let state: "review" | "returned" | "accepted" = "review";
  await page.route(`**/api/v1/service/inspections/${inspectionVisitId}`, (r) =>
    r.fulfill({ json: acceptedInspectionFixture(actor, state) }),
  );
  for (const next of ["review", "returned", "accepted"] as const) {
    state = next;
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(review);
    await expect(
      page.getByRole("heading", { name: "Submitted readings", exact: true }),
    ).toBeVisible();
    if (next === "accepted") {
      await page.getByRole("tab", { name: "Outcome", exact: true }).click();
      await expect(
        page.getByRole("link", { name: "Open exact PDF", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Issue outcome", exact: true }),
      ).toBeEnabled();
    }
    await noOverflow(page);
    await captureWithoutIcons(page, info.outputPath(`${next}-1440.png`));
  }
  state = "review";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(review);
  await page
    .getByRole("tab", { name: "Defects and retests", exact: true })
    .click();
  const timeline = page.locator(".inspection-timeline");
  await expect(
    timeline.getByText("SYN-DEF-000019 · Holding torque above limit", {
      exact: true,
    }),
  ).toBeVisible();
  expect(await timeline.locator(":scope > li").count()).toBe(2);
  await expect(
    page
      .getByRole("button", { name: "Review attempt", exact: true })
      .filter({ visible: true }),
  ).toBeEnabled();
  await noOverflow(page);
  await captureWithoutIcons(page, info.outputPath("retests-390.png"));
});
