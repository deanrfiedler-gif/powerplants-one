import { test, expect, type Page } from "@playwright/test";
import {
  conversionHttpFixture,
  conversionDetail,
  conversionPath,
  receiving,
  resolution,
  plan,
  json,
} from "../helpers/quotation-conversion-http";
test.describe.configure({ timeout: 120000 });
async function identity(page: Page, profile = "coordinator") {
  await page.goto("/work");
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: new URL(page.url()).origin },
        data: { profile },
      })
    ).ok(),
  ).toBe(true);
}
async function evidence(page: Page) {
  await page
    .getByLabel("Reason for this decision")
    .fill("SYN exact reviewed source and target");
  await page
    .getByLabel("Synthetic receiving evidence", { exact: true })
    .fill("SYN original issue and response checked");
  await page
    .getByLabel("Synthetic coordination acknowledgement")
    .selectOption("yes");
}
async function saved(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Open saved receiving" }).click(),
  ]);
  await expect(
    page.getByRole("heading", {
      name: "Immutable receiving and conversion history",
    }),
  ).toBeVisible();
}
test("ES07 desktop/mobile receive resolve review real conversion and recover committed lost response after reload", async ({
  page,
}, info) => {
  const f = await conversionHttpFixture();
  await identity(page);
  await page.goto(`/estimating/quotes/${f.id}/response`);
  await page.getByRole("link", { name: "Open ES-07 receiving" }).click();
  await evidence(page);
  await page.getByLabel("Follow-up due date").fill("2026-10-12");
  await page
    .getByLabel("Owned follow-up")
    .fill("SYN review demand before procurement");
  await page.getByRole("button", { name: "Record receiving decision" }).click();
  await saved(page);
  await expect(
    page.getByRole("button", { name: "Review and freeze plan" }),
  ).toBeDisabled();
  await evidence(page);
  await page.getByRole("button", { name: "Record item resolution" }).click();
  await saved(page);
  await evidence(page);
  await page.getByRole("button", { name: "Review and freeze plan" }).click();
  await saved(page);
  await evidence(page);
  let sends = 0;
  await page.route(
    `**/api/v1/${conversionPath(f.id)}/execute`,
    async (route) => {
      sends++;
      const r = await route.fetch();
      expect(r.ok()).toBe(true);
      await route.abort("failed");
    },
  );
  await page
    .getByRole("button", { name: "Create synthetic demand records" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review replacement plan" }),
  ).toBeDisabled();
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await saved(page);
  expect(sends).toBe(1);
  await page.unrouteAll({ behavior: "wait" });
  const d = await conversionDetail(f.owner, f.id);
  expect(d.targets).toHaveLength(1);
  await expect(
    page.getByRole("link", { name: "Open native demand" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("conversion-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByText("Exact receiving boundary", { exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("conversion-320.png"),
    fullPage: false,
  });
  await page.getByRole("link", { name: "Open native demand" }).click();
  await expect(
    page.getByRole("heading", {
      name: d.targets[0].current.title,
      exact: true,
    }),
  ).toBeVisible();
});
test("ES07 uncertain unsent original holds replacements through inconclusive receipt then exact retry", async ({
  page,
}) => {
  const f = await conversionHttpFixture();
  await identity(page);
  await page.goto("/" + conversionPath(f.id));
  await evidence(page);
  await page.getByLabel("Follow-up due date").fill("2026-10-12");
  await page
    .getByLabel("Owned follow-up")
    .fill("SYN incomplete pack needs owned review");
  let original: string | undefined;
  await page.route(
    `**/api/v1/${conversionPath(f.id)}/receive`,
    async (route) => {
      original = route.request().postData()!;
      await route.abort("failed");
    },
  );
  await page.route("**/api/v1/operations/*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Unavailable",
        message: "SYN inconclusive receipt",
      }),
    }),
  );
  await page.getByRole("button", { name: "Record receiving decision" }).click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Recover original conversion receipt" })
    .click();
  await expect(
    page.getByRole("button", { name: "Record item resolution" }),
  ).toBeDisabled();
  await page.unrouteAll({ behavior: "wait" });
  await page.route(
    `**/api/v1/${conversionPath(f.id)}/receive`,
    async (route) => {
      expect(route.request().postData()).toBe(original);
      await route.continue();
    },
  );
  await page.getByRole("button", { name: "Retry exact original" }).click();
  await saved(page);
  expect((await conversionDetail(f.owner, f.id)).events).toHaveLength(1);
});
test("ES07 stale mapping proposal stays visible, held plan and permission change remove protected content", async ({
  page,
}) => {
  const f = await conversionHttpFixture();
  await json(
    f.owner,
    conversionPath(f.id) + "/receive",
    receiving(f.d, f.d.preparation!.detail.owner_id!),
  );
  let d = await conversionDetail(f.owner, f.id);
  await json(f.owner, conversionPath(f.id) + "/resolve", resolution(d));
  d = await conversionDetail(f.owner, f.id);
  await json(f.owner, conversionPath(f.id) + "/plan", plan(d));
  await identity(page);
  await page.goto("/" + conversionPath(f.id));
  await evidence(page);
  await page.getByLabel("One-off display label").fill("SYN retained proposal");
  d = await conversionDetail(f.owner, f.id);
  await json(f.owner, conversionPath(f.id) + "/resolve", {
    ...resolution(d),
    state: "Obsolete",
  });
  await page.getByRole("button", { name: "Refresh current evidence" }).click();
  await expect(
    page.getByRole("heading", { name: "Receiving basis changed" }),
  ).toBeVisible();
  await expect(page.getByLabel("One-off display label")).toHaveValue(
    "SYN retained proposal",
  );
  await expect(
    page.getByRole("button", { name: "Create synthetic demand records" }),
  ).toBeDisabled();
  page.once("dialog", (d) => d.accept());
  await identity(page, "second-company");
  await page.goto("/" + conversionPath(f.id));
  await expect(
    page.getByRole("heading", {
      name: "2. Resolve items and review target lines",
    }),
  ).toHaveCount(0);
  await expect(
    page.getByText(f.d.revision.snapshot.customer, { exact: true }),
  ).toHaveCount(0);
});
