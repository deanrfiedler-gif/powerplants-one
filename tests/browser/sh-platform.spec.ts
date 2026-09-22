import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { CRM, crmBase } from "../helpers/crm";

test.beforeEach(async ({ page, baseURL }) => {
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: baseURL! },
        data: { profile: "coordinator" },
      })
    ).ok(),
  ).toBe(true);
});
test("SH notification event, explicit read, source guard, grouped state and preferences persist", async ({
  page,
  baseURL,
  isMobile,
}, info) => {
  const id = randomUUID(),
    title = `SYN SH browser ${id.slice(0, 8)}`;
  const created = await page.request.post("/api/v1/activities", {
    headers: { Origin: baseURL! },
    data: {
      ...crmBase(),
      id,
      company_id: CRM.company,
      site_id: CRM.site,
      owner_id: CRM.owner,
      kind: "CustomerContact",
      summary: title,
      due_at: null,
      due_needed: true,
      access_class: "RestrictedService",
      links: [{ object_type: "Site", object_id: CRM.site }],
    },
  });
  expect(created.status()).toBe(201);
  await page.goto("/work/updates");
  if (!isMobile) {
    await page.getByRole("button", { name: "Notifications", exact: true }).click();
    await expect(page.getByRole("link", { name: "Open Notifications", exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath("notification-bell.png") });
    await page.keyboard.press("Escape");
  }
  await expect(
    page.getByRole("heading", { name: "Notifications", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Find updates").fill(title);
  await expect(
    page.getByRole("button", { name: title, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: title, exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Notification detail" });
  await expect(detail.getByText("Date needed", { exact: true })).toBeVisible();
  await expect(
    detail.getByRole("button", { name: "Mark read", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("notification-detail.png") });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Mark read", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mark unread", exact: true }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: `Select ${title}` }).check();
  await page.getByRole("button", { name: "Archive selected" }).click();
  await expect(
    page.getByText(
      "Active required work cannot be archived. Open its source workflow.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Grouped changes", exact: true })
    .click();
  await page.screenshot({
    path: info.outputPath("notifications-grouped.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Owned escalations", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: title, exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("notifications-owned.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  const digestTime = page.getByLabel("Digest time", { exact: true });
  await expect(digestTime).toBeVisible();
  const changedTime =
    (await digestTime.inputValue()) === "09:15" ? "10:15" : "09:15";
  await digestTime.fill(changedTime);
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  await expect(
    page.getByText("Preferences saved. No messages were sent.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("notifications-preferences.png"),
    fullPage: true,
  });
  await page.getByRole("heading", { name: "Notifications", exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("notifications-preferences-top.png") });
  await page.reload();
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  await expect(page.getByLabel("Digest time", { exact: true })).toHaveValue(
    changedTime,
  );
  const record = await (
    await page.request.get(`/api/v1/activities/${id}`)
  ).json();
  expect(record.items[0].status).toBe("Open");
});
test("SH search keyboard entry, full results, authorised preview and personal saved view", async ({
  page,
  isMobile,
}, info) => {
  await page.goto("/work");
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: /Search/ });
  await search.fill("SYN");
  await expect(
    page.getByRole("link", { name: "View all results", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("search-compact.png") });
  await page
    .getByRole("link", { name: "View all results", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Search", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".sh-register .sh-title").first()).toBeVisible();
  await page.locator(".sh-register .sh-title").first().click();
  await expect(
    page
      .getByRole("dialog", { name: "Record preview" })
      .getByRole("link", { name: "Open record" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("search-preview.png") });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Saved views", exact: true }).click();
  await page
    .getByLabel("Save current criteria as")
    .fill(`SYN browser view ${isMobile ? "phone" : "desktop"} ${Date.now()}`);
  await page.getByRole("button", { name: "Save view", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Update to current criteria" }).first(),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("saved-views.png") });
  await page.keyboard.press("Escape");
});
test("SH review perspectives, responsive geometry and current My Work interiors", async ({
  page,
}, info) => {
  test.setTimeout(180000); // Seven widths × five routes plus six review perspectives.
  for (const width of [1440, 1280, 1024, 768, 430, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/work",
      "/work/actions",
      "/work/updates",
      "/work/reviews",
      "/search?q=SYN",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (path.startsWith("/search"))
        await expect(page.getByText(/results on this page/)).toBeVisible();
      else if (path === "/work/reviews")
        await expect(page.getByText(/matching tasks/)).toBeVisible();
      else if (path === "/work/updates")
        await expect(page.locator(".sh-stats")).toBeVisible();
      else
        await expect(page.locator(".mw-page")).toHaveAttribute(
          "aria-busy",
          "false",
        );
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
      if (width === 1440 || width === 390 || width === 320)
        await page.screenshot({
          path: info.outputPath(
            `${path.split("?")[0].replaceAll("/", "-")}-${width}.png`,
          ),
          fullPage: true,
        });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/work/reviews");
  for (const label of [
    "My reviews",
    "All permitted",
    "Returned to me",
    "Handovers",
    "Sent by me",
    "History",
  ]) {
    await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
    await expect(page.getByText(/matching tasks/)).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`reviews-${label.replaceAll(" ", "-")}.png`),
      fullPage: true,
    });
  }
});

test("SH failure, partial and successful empty presentations retain retry and clear revoked previews", async ({
  page,
}, info) => {
  let mode = "failed";
  await page.route("**/api/v1/search?**", async (route) => {
    if (mode === "failed")
      return route.fulfill({
        status: 503,
        json: {
          code: "SourceUnavailable",
          message: "Synthetic source unavailable",
        },
      });
    if (mode === "empty")
      return route.fulfill({
        json: {
          items: [],
          sources: [{ kind: "Activity", state: "available", has_more: false }],
          state: "complete",
          observed_at: new Date().toISOString(),
          limit_per_type: 20,
          has_more: false,
          next_cursor: null,
        },
      });
    const response = await route.fetch();
    const data = await response.json();
    return route.fulfill({
      json: {
        ...data,
        state: "partial",
        sources: [
          ...data.sources,
          {
            kind: "Synthetic unavailable adapter",
            state: "unavailable",
            has_more: false,
          },
        ],
      },
    });
  });
  await page.goto("/search?q=SYN");
  await expect(
    page.getByText("Synthetic source unavailable", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("search-failed.png") });
  mode = "partial";
  await page.getByRole("button", { name: "Refresh results" }).click();
  await expect(page.getByText(/Partial results/)).toBeVisible();
  await expect(page.locator(".sh-register .sh-title").first()).toBeVisible();
  await page.screenshot({ path: info.outputPath("search-partial.png") });
  await page.route("**/api/v1/search/preview?**", (route) =>
    route.fulfill({
      status: 404,
      json: {
        code: "Unavailable",
        message: "The record is no longer available to this identity.",
      },
    }),
  );
  await page.locator(".sh-register .sh-title").first().click();
  const detail = page.getByRole("dialog", { name: "Record preview" });
  await expect(
    detail.getByText("The record is no longer available to this identity.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(detail.getByRole("link", { name: "Open record" })).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  mode = "empty";
  await page.getByRole("button", { name: "Refresh results" }).click();
  await expect(page.getByText(/0 results on this page/)).toBeVisible();
  await page.screenshot({ path: info.outputPath("search-empty.png") });
  await page.route("**/api/v1/notifications", (route) =>
    route.fulfill({
      status: 503,
      json: {
        code: "SourceUnavailable",
        message: "Synthetic notification source unavailable",
      },
    }),
  );
  await page.goto("/work/updates");
  await expect(
    page.getByText("Synthetic notification source unavailable", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".sh-stats")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("notifications-failed.png") });
});
