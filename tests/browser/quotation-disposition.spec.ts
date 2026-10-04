import { test, expect, type Page } from "@playwright/test";
import {
  completedHttpFixture,
  conversionDetail,
  dispositionReview,
  json,
} from "../helpers/quotation-disposition-http";
import { receiving } from "../helpers/quotation-conversion";
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
    .getByLabel("Disposition reason", { exact: true })
    .fill("SYN corrected receiving reviewed against original demand");
  await page
    .getByLabel("Disposition evidence", { exact: true })
    .fill("SYN exact offer, target and dependencies compared");
  await page
    .getByLabel("Synthetic disposition acknowledgement")
    .selectOption("yes");
  await page.getByLabel("Disposition follow-up due date").fill("2026-10-12");
  await page
    .getByLabel("Disposition follow-up action")
    .fill("SYN Supply owner to review operational next steps");
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
    page.getByRole("heading", { name: "5. Disposition of completed targets" }),
  ).toBeVisible();
}
test("ES07 disposition desktop/mobile native quantity action recovers committed lost result through reload", async ({
  page,
}, info) => {
  const f = await completedHttpFixture();
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  await page
    .getByLabel("Disposition decision", { exact: true })
    .selectOption("ReviseQuantity");
  await page
    .getByLabel("Proposed positive quantity (each)", { exact: true })
    .fill("1.125");
  await page
    .getByRole("button", { name: "Record disposition review", exact: true })
    .click();
  await saved(page);
  expect(
    (await conversionDetail(f.owner, f.id)).targets[0].current.quantity,
  ).toBe("2");
  await evidence(page);
  let sends = 0;
  await page.route(`**/api/v1/${f.path}/disposition-apply`, async (route) => {
    sends++;
    const r = await route.fetch();
    expect(r.ok()).toBe(true);
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Apply reviewed disposition" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record replacement disposition review" }),
  ).toBeDisabled();
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await saved(page);
  expect(sends).toBe(1);
  await page.unrouteAll({ behavior: "wait" });
  const d = await conversionDetail(f.owner, f.id);
  expect(d.targets[0].current.quantity).toBe("1.125");
  expect(d.targets[0].current.version).toBe(2);
  expect(d.dispositions[0].status).toBe("Resolved");
  await page
    .getByText("Original and current source evidence", { exact: true })
    .click();
  await page
    .getByText("Reviewed downstream dependencies", { exact: true })
    .click();
  // The host scrolls inside the shell; element screenshots taller than that
  // viewport capture blank clipped space. Retain the actual visible viewport.
  await page
    .getByRole("heading", { name: "5. Disposition of completed targets" })
    .evaluate((node) => node.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: info.outputPath("disposition.png") });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page
    .getByText("Original and current source evidence", { exact: true })
    .evaluate((node) => node.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: info.outputPath("disposition-320.png") });
});
test("ES07 disposition unknown unsent action holds replacement through reload and inconclusive lookup until exact retry", async ({
  page,
}) => {
  const f = await completedHttpFixture();
  await json(
    f.owner,
    f.path + "/disposition-review",
    dispositionReview(f.d.dispositions[0]),
  );
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  let original = "";
  await page.route(`**/api/v1/${f.path}/disposition-apply`, async (route) => {
    original = route.request().postData()!;
    await route.abort("failed");
  });
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
  await page
    .getByRole("button", { name: "Apply reviewed disposition" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record replacement disposition review" }),
  ).toBeDisabled();
  await page.unrouteAll({ behavior: "wait" });
  let retried = "";
  await page.route(`**/api/v1/${f.path}/disposition-apply`, async (route) => {
    retried = route.request().postData()!;
    await route.continue();
  });
  await page.getByRole("button", { name: "Retry exact original" }).click();
  await saved(page);
  expect(retried).toBe(original);
  const d = await conversionDetail(f.owner, f.id);
  expect(d.dispositions[0].status).toBe("Resolved");
  expect(d.targets[0].current.version).toBe(1);
});
test("ES07 disposition stale source preserves proposed entries, Hold remains visible and denied reads remove evidence", async ({
  page,
}) => {
  const f = await completedHttpFixture();
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  await json(f.owner, f.path + "/receive", {
    ...receiving(f.d, f.d.preparation!.detail.owner_id!),
    decision: "Returned",
  });
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith(f.path) && r.request().method() === "GET",
    ),
    page.getByRole("button", { name: "Refresh current evidence" }).click(),
  ]);
  await expect(
    page.getByRole("button", {
      name: "Record disposition review",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Disposition reason", { exact: true }),
  ).toHaveValue("SYN corrected receiving reviewed against original demand");
  await page
    .getByRole("button", { name: "Use compared disposition evidence" })
    .click();
  await page
    .getByLabel("Disposition decision", { exact: true })
    .selectOption("Hold");
  await page
    .getByRole("button", { name: "Record disposition review", exact: true })
    .click();
  await saved(page);
  await expect(
    page.getByRole("button", { name: "Apply reviewed disposition" }),
  ).toBeDisabled();
  expect((await conversionDetail(f.owner, f.id)).dispositions[0].status).toBe(
    "Review required",
  );
  await identity(page, "second-company");
  await page.goto("/" + f.path);
  await expect(
    page.getByRole("heading", { name: "5. Disposition of completed targets" }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Disposition reason", { exact: true }),
  ).toHaveCount(0);
});
