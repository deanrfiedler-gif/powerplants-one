import { test, expect, type Page } from "@playwright/test";
const id = (t: number, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function identity(page: Page, profile = "coordinator") {
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Use this identity", exact: true }),
  ).toBeEnabled();
}
async function capture(
  page: Page,
  info: { outputPath: (s: string) => string },
  name: string,
) {
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath(name), fullPage: true });
}
test("P04 SC-05 draft, authority refusal, dispute, identity limits, mandatory blocker, exception and approved history", async ({
  page,
}, info) => {
  await page.goto("/service/work-orders");
  await identity(page);
  await expect(
    page.getByRole("heading", { name: "Work orders", exact: true }),
  ).toBeVisible();
  await capture(page, info, "P04-list.png");
  for (const [n, name] of [
    [1, "draft"],
    [2, "authorised"],
    [3, "authority-missing"],
    [4, "disputed"],
    [5, "unresolved"],
    [6, "mandatory-blocker"],
    [7, "permitted-exception"],
    [8, "successor"],
    [9, "identification-plan"],
  ] as const) {
    await page.goto(`/service/work-orders/${id(90, n)}`);
    await expect(
      page.getByRole("heading", { name: "Work authorisation", exact: true }),
    ).toBeVisible();
    if (n === 2)
      await expect(
        page.getByText("Authorised scope — read-only", { exact: true }),
      ).toBeVisible();
    if (n === 8) {
      await page
        .getByText("Scope r01 — Authorised, read-only", { exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Scope revision history" }),
      ).toBeVisible();
    }
    await capture(page, info, `P04-${name}.png`);
  }
  await page.goto(`/service/work-orders/${id(90, 3)}`);
  await page
    .getByRole("button", { name: "Authorise current scope", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Resolve the work-authorisation blockers",
  );
  await capture(page, info, "P04-authorisation-refusal.png");
});
test("P04 forms retain invalid and stale proposals with explicit comparison; keyboard and phone layouts", async ({
  page,
}, info) => {
  await page.goto(`/service/work-orders/${id(90, 3)}`);
  await identity(page);
  await page.getByText("Edit scope draft", { exact: true }).click();
  const summary = page.getByLabel("Scope summary", { exact: true });
  await summary.fill(
    "SYN retained long scope proposal\n" +
      "Inspect the external display and retain uncertainty. ".repeat(15),
  );
  await summary.focus();
  await capture(page, info, "P04-scope-form-focus.png");
  await page.getByLabel("Task description", { exact: true }).fill("");
  await page
    .getByRole("button", { name: "Save scope draft", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Check the highlighted details",
  );
  await expect(summary).toHaveValue(/SYN retained long scope proposal/);
  await capture(page, info, "P04-validation-retained.png");
  await page
    .getByLabel("Task description", { exact: true })
    .fill("SYN original proposal retained after conflict");
  await page.route(
    `**/api/v1/service/work-orders/${id(90, 3)}/save-scope`,
    async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          code: "VersionConflict",
          message:
            "This work order changed. Keep your proposal and compare the saved version.",
          field_errors: [],
          retryable: false,
        }),
      });
    },
  );
  await page
    .getByRole("button", { name: "Save scope draft", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "This work order changed",
  );
  await expect(summary).toHaveValue(/SYN retained long scope proposal/);
  await capture(page, info, "P04-conflict-retained.png");
  await page.unrouteAll();
  await page.goto(`/service/work-orders/${id(90, 7)}`);
  await page
    .getByText("Review proposed visit preparation", { exact: true })
    .click();
  await page
    .getByLabel("Readiness criterion", { exact: true })
    .selectOption("ToolPreparation");
  await page
    .getByLabel("Readiness decision", { exact: true })
    .selectOption("PermittedException");
  await capture(page, info, "P04-preparation-review-form.png");
  await page.goto(`/service/work-orders/${id(90, 1)}`);
  await page.getByText("Propose a visit", { exact: true }).click();
  await capture(page, info, "P04-proposed-visit-form.png");
});
test("P04 creation, exact uncertain retry, scoped empty results and Systems refusal", async ({
  page,
}, info) => {
  await page.goto("/service/work-orders/new");
  await identity(page);
  await page
    .getByLabel("Company context", { exact: true })
    .selectOption(id(20));
  await page.getByLabel("Service site", { exact: true }).selectOption(id(70));
  await page
    .getByLabel("Customer at this site", { exact: true })
    .selectOption(id(50));
  await page.getByLabel("Service owner", { exact: true }).selectOption(id(30));
  await page
    .getByLabel("Service request to link", { exact: true })
    .selectOption(id(40, 20));
  await page
    .getByRole("button", { name: "Link service request", exact: true })
    .click();
  await page
    .getByLabel("Purpose of these linked requests", { exact: true })
    .fill("SYN browser explicit source context");
  await capture(page, info, "P04-create-form.png");
  let first = true;
  const payloads: string[] = [];
  await page.route("**/api/v1/service/work-orders", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    payloads.push(route.request().postData()!);
    const response = await route.fetch();
    if (first) {
      first = false;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: "unreadable accepted response",
      });
    } else await route.fulfill({ response });
  });
  await page
    .getByRole("button", { name: "Save draft work order", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "server response could not be read",
  );
  await capture(page, info, "P04-uncertain-retry.png");
  await page
    .getByRole("button", { name: "Save draft work order", exact: true })
    .click();
  await expect(page).toHaveURL(/\/service\/work-orders\/[a-f0-9-]+$/);
  expect(payloads).toHaveLength(2);
  expect(payloads[0]).toBe(payloads[1]);
  await capture(page, info, "P04-created-empty-scope.png");
  await page.unrouteAll();
  await page.goto("/service/work-orders");
  await page
    .getByLabel("Search work orders", { exact: true })
    .fill("SYN no matching work 748291");
  await expect(
    page.getByRole("heading", { name: "No work orders in this view" }),
  ).toBeVisible();
  await capture(page, info, "P04-empty.png");
  await identity(page, "systems");
  await expect(page.getByRole("alert")).toBeVisible();
  await capture(page, info, "P04-systems-refusal.png");
});
