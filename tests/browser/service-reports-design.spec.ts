import { test, expect } from "@playwright/test";
import {
  reportFixture,
  reportId,
  reportRow,
} from "../helpers/service-report-fixture";
import { destinations } from "../../src/shell/navigation";

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (route) => route.abort());
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      json: {
        items: [],
        observed_at: reportRow.updated_at,
        completeness: "Complete",
      },
    }),
  );
  await page.route("**/api/v1/local-session", (route) =>
    route.fulfill({
      json: {
        actor_id: "30000000-0000-4000-8000-000000000001",
        workspace_id: "10000000-0000-4000-8000-000000000001",
        display_name: "SYN Service coordinator",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (route) =>
    route.fulfill({
      json: {
        display_name: "SYN Service coordinator",
        preference_scope: "sv06-fixture",
        actions: [],
        navigation: destinations.map((item) => item.id),
        can_preview: true,
      },
    }),
  );
});

test("SV-06 register: bounded filters, selection, snapshot focus and responsive rows", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await page.route("**/api/v1/reports", (route) =>
    route.fulfill({
      json: {
        items: [reportRow],
        observed_at: reportRow.updated_at,
        completeness: "BoundedWindow",
      },
    }),
  );
  await page.route(`**/api/v1/reports/${reportId}`, (route) =>
    route.fulfill({ json: { items: [reportFixture] } }),
  );
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({
      width,
      height: width < 1024 ? 844 : 900,
    });
    await page.goto("/service/reports?department=service");
    await expect(
      page.getByText("Recent 200-report window", { exact: false }),
    ).toBeVisible();
    if (width === 1024) {
      await expect(
        page.getByRole("button", { name: /^(Collapse|Expand) primary navigation$/ }),
      ).toBeVisible();
      const collapse = page.getByRole("button", {
        name: "Collapse primary navigation",
        exact: true,
      });
      if (await collapse.isVisible()) await collapse.click();
      await expect(
        page.getByRole("button", { name: "Expand primary navigation", exact: true }),
      ).toBeVisible();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width >= 1024) {
      await expect(page.locator(".sv06-grid")).toBeVisible();
      expect(
        (await page.locator(".sv06-grid thead tr").boundingBox())?.height,
      ).toBeLessThanOrEqual(44);
      expect(
        (await page.locator(".sv06-grid tbody tr").boundingBox())?.height,
      ).toBeLessThanOrEqual(44);
      await page
        .getByRole("checkbox", {
          name: `Select ${reportRow.reference}`,
          exact: true,
        })
        .check();
      await page
        .getByRole("button", { name: reportRow.reference, exact: true })
        .click();
      await expect(
        page.getByRole("region", { name: "Report snapshot" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Close snapshot", exact: true }),
      ).toBeInViewport();
      await page.screenshot({ path: info.outputPath(`snapshot-${width}.png`) });
      await page
        .getByRole("button", { name: "Close snapshot", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: reportRow.reference, exact: true }),
      ).toBeFocused();
      await page
        .getByRole("button", { name: reportRow.reference, exact: true })
        .click();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: reportRow.reference, exact: true }),
      ).toBeFocused();
    } else {
      await expect(page.locator(".sv06-phone-list a")).toHaveCount(1);
      await expect(page.locator(".sv06-grid")).toBeHidden();
    }
    await page.screenshot({ path: info.outputPath(`register-${width}.png`) });
  }
});

test("SV-06 exact review draft survives tabs and newer reads; view-only hides commands", async ({
  page,
}, info) => {
  let current = structuredClone(reportFixture);
  let sent: Record<string, unknown> | undefined;
  await page.route(`**/api/v1/reports/${reportId}`, (route) =>
    route.fulfill({ json: { items: [current] } }),
  );
  await page.route(`**/api/v1/reports/${reportId}/review`, async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({
      status: 409,
      json: {
        code: "StaleSource",
        message: "A newer submission exists. Original entries retained.",
      },
    });
  });
  await page.goto(`/service/reports/${reportId}?department=service`);
  await page.screenshot({ path: info.outputPath("evidence.png") });
  await page
    .getByRole("button", { name: "Review submission", exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByLabel("Entry 1 review reason", { exact: true })
    .fill("SYN verify original measurement");
  await page
    .getByLabel("Entry 1 decision", { exact: true })
    .selectOption("Returned");
  await page
    .getByLabel("Review decision", { exact: true })
    .selectOption("Returned");
  await page
    .getByLabel("Review remarks (internal)", { exact: true })
    .fill("SYN return for factual correction");
  await page.getByRole("tab", { name: "Work outcome", exact: true }).click();
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(
    page.getByLabel("Entry 1 review reason", { exact: true }),
  ).toHaveValue("SYN verify original measurement");
  current = { ...current, version: 2 };
  const refreshed = page.waitForResponse(
    (response) => response.url().endsWith(`/api/v1/reports/${reportId}`),
  );
  if ((page.viewportSize()?.width ?? 1440) <= 780) {
    await page.getByRole("button", { name: "More actions", exact: true }).click();
    await page
      .getByRole("menuitem", { name: "Refresh exact report", exact: true })
      .click();
  } else
    await page
      .getByRole("button", { name: "Refresh exact report", exact: true })
      .click();
  expect((await refreshed).ok()).toBe(true);
  await expect(
    page.getByLabel("Entry 1 review reason", { exact: true }),
  ).toHaveValue("SYN verify original measurement");
  await page
    .getByRole("button", { name: "Commit exact review", exact: true })
    .click();
  await expect(
    page.getByText("A newer submission exists.", { exact: false }),
  ).toBeVisible();
  expect(sent?.expected_version).toBe(1);
  expect(sent?.source_hash).toBe(reportFixture.revisions[0].source_hash);
  await expect(
    page.getByLabel("Entry 1 review reason", { exact: true }),
  ).toHaveValue("SYN verify original measurement");
  await page.screenshot({ path: info.outputPath("review-return-refused.png") });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  current = {
    ...current,
    can_review: false,
    can_issue: false,
    can_respond: false,
  };
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Review submission", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("view-only.png") });
});

test("SV-06 no-matches queue clears without confusing an empty window", async ({
  page,
}, info) => {
  await page.route("**/api/v1/reports", (route) =>
    route.fulfill({
      json: {
        items: [reportRow],
        observed_at: reportRow.updated_at,
        completeness: "BoundedWindow",
      },
    }),
  );
  await page.goto("/service/reports?department=service");
  if (info.project.name.startsWith("mobile")) {
    await page
      .getByRole("button", { name: "Report view", exact: true })
      .click();
    await page
      .getByRole("menuitemradio", {
        name: "Returned to technician",
        exact: true,
      })
      .click();
  } else
    await page.getByRole("button", { name: /^Returned to technician/ }).click();
  await expect(
    page.getByRole("heading", { name: "No reports match these filters" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove queue filter" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("no-matches.png") });
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(
    page.getByText("Recent 200-report window", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No reports match these filters" }),
  ).toHaveCount(0);
});

test("SV-06 phone Details handover stays above the action and view-only footer", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  let current = structuredClone(reportFixture);
  await page.route(`**/api/v1/reports/${reportId}`, (route) =>
    route.fulfill({ json: { items: [current] } }),
  );
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const canAct of [true, false]) {
      current = {
        ...current,
        can_review: canAct,
        can_issue: canAct,
        can_respond: canAct,
      };
      await page.goto(`/service/reports/${reportId}?department=service`);
      await page.getByRole("tab", { name: "Details", exact: true }).click();
      const handover = page
        .getByRole("link", {
          name: "Technician evidence and correction",
          exact: true,
        })
        .filter({ visible: true });
      await handover.scrollIntoViewIfNeeded();
      const linkBounds = await handover.boundingBox();
      const footerBounds = await page
        .locator(".sv06-phone-actions")
        .boundingBox();
      expect(linkBounds).not.toBeNull();
      expect(footerBounds).not.toBeNull();
      expect(linkBounds!.y + linkBounds!.height).toBeLessThanOrEqual(
        footerBounds!.y,
      );
      await page.screenshot({
        path: info.outputPath(
          `details-${width}-${canAct ? "action" : "view-only"}.png`,
        ),
      });
      await handover.click();
      await expect(page).toHaveURL(
        new RegExp(`/my-jobs/${reportFixture.appointment.id}$`),
      );
    }
  }
});

test("SV-06 prepared and issued output keep exact response binding on refusal", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const html =
    "<!doctype html><html><body><h1>SYN customer report</h1><p>Exact fictional attendance only.</p></body></html>";
  const { createHash } = await import("node:crypto");
  const contentHash = createHash("sha256").update(html).digest("hex");
  const presentation = {
    id: "16000000-0000-4000-8000-000000000009",
    revision_id: reportFixture.revisions[0].id,
    kind: "DraftEvidence",
    content_hash: contentHash,
  };
  const report = {
    ...reportFixture,
    status: "Reviewed",
    reviews: [
      {
        id: "16000000-0000-4000-8000-000000000008",
        revision_id: reportFixture.revisions[0].id,
        decision: "Approved",
        entry_decisions: [
          {
            id: reportFixture.revisions[0].snapshot.entries[0].id,
            decision: "Approved",
          },
        ],
      },
    ],
    presentations: [presentation],
  };
  await page.route(`**/api/v1/reports/${reportId}`, (route) =>
    route.fulfill({ json: { items: [report] } }),
  );
  await page.route(`**/api/v1/reports/${reportId}/html?*`, (route) =>
    route.fulfill({ contentType: "text/html", body: html }),
  );
  let submitted: Record<string, unknown> | undefined;
  await page.route(`**/api/v1/reports/${reportId}/respond`, async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 409,
      json: {
        code: "StaleSource",
        message: "A newer report was issued. Your response was not saved.",
      },
    });
  });
  await page.goto(`/service/reports/${reportId}?tab=report&department=service`);
  await expect(
    page.getByRole("heading", { name: "Generate and issue controlled report" }),
  ).toBeVisible();
  await expect(
    page
      .frameLocator(".report-preview")
      .getByRole("heading", { name: "SYN customer report" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("customer-report-ready.png") });
  presentation.kind = "IssuedReport";
  report.status = "Issued";
  await page.reload();
  await page
    .getByRole("button", { name: "Present Issued Report", exact: true })
    .click();
  await expect(page.locator("#report-presentation-heading")).toBeFocused();
  const sheet = page.getByRole("dialog", { name: "Record customer response" });
  await expect(sheet).toBeVisible();
  if ((page.viewportSize()?.width ?? 1440) <= 780) {
    const bounds = await sheet.boundingBox();
    expect(bounds?.x).toBe(0);
    expect(bounds?.y).toBe(0);
    expect(bounds?.width).toBe(page.viewportSize()?.width);
    expect(bounds?.height).toBe(page.viewportSize()?.height);
  }
  await page.getByRole("button", { name: "Customer unavailable", exact: true }).click();
  await expect(page.getByLabel("Customer response", { exact: true })).toHaveValue("Unavailable");
  await expect(page.getByLabel("Unavailable reason", { exact: true })).toBeFocused();
  expect(submitted).toBeUndefined();
  await page
    .getByLabel("Customer response", { exact: true })
    .selectOption("AcceptedWithReservations");
  await page
    .getByLabel("Stated respondent name (synthetic)", { exact: true })
    .fill("SYN Jordan");
  await page
    .getByLabel("Stated respondent role", { exact: true })
    .fill("Site contact");
  await page
    .getByLabel("Response remarks / reservations", { exact: true })
    .fill("SYN reservation retained");
  await page
    .getByLabel("Owned next action (required unless accepted)", { exact: true })
    .fill("SYN call to clarify the gland");
  await sheet.evaluate((dialog) => { dialog.scrollTop = 0; });
  if ((page.viewportSize()?.width ?? 1440) <= 780)
    await expect(
      page.getByRole("button", { name: "Record response", exact: true }),
    ).toBeInViewport();
  await page.screenshot({ path: info.outputPath("response-sheet.png") });
  await page
    .getByRole("button", {
      name: "Record response",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("A newer report was issued.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Response remarks / reservations", { exact: true }),
  ).toHaveValue("SYN reservation retained");
  expect(submitted?.presentation_id).toBe(presentation.id);
  expect(submitted?.presented_hash).toBe(contentHash);
  await page.screenshot({ path: info.outputPath("newer-report-refused.png") });
});

test("SV-06 clears failed reads and provides loading, empty and retry states", async ({
  page,
}, info) => {
  let state = "loading";
  let release: (() => void) | undefined;
  await page.route("**/api/v1/reports", async (route) => {
    if (state === "loading")
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    if (state === "error")
      await route.fulfill({
        status: 503,
        json: { code: "Unavailable", message: "SYN connection unavailable" },
      });
    else
      await route.fulfill({
        json: {
          items: [],
          observed_at: reportRow.updated_at,
          completeness: "Complete",
        },
      });
  });
  await page.goto("/service/reports");
  await expect(
    page.getByRole("status").filter({ hasText: "Loading reports…" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("loading.png") });
  state = "empty";
  release?.();
  await expect(
    page.getByRole("heading", { name: "No reports in this window" }),
  ).toBeVisible();
  state = "error";
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Reports could not be loaded" }),
  ).toBeVisible();
  await expect(
    page.locator(".sv06-phone-list a, .sv06-grid tbody tr"),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("could-not-load.png") });
  state = "empty";
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No reports in this window" }),
  ).toBeVisible();
});
