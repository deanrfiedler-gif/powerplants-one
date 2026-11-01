import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFile, mkdir } from "node:fs/promises";
let browserErrors: string[] = [];
test.beforeEach(({ page }) => {
  browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|cannot be a descendant|cannot contain a nested|same key/i.test(
        message.text(),
      )
    )
      browserErrors.push(message.text());
  });
});
test.afterEach(() => {
  expect(browserErrors).toEqual([]);
});
let fixture: {
  route: string;
  wizard: string;
  source: string;
  source_id: string;
  source_revision_id: string;
  lines: string[];
};
test.beforeAll(async () => {
  execFileSync(
    process.execPath,
    [
      "--env-file=.env.local",
      "--import",
      "tsx",
      "tests/helpers/excel-import-browser-fixture.ts",
    ],
    { stdio: "pipe", timeout: 180000 },
  );
  fixture = JSON.parse(
    await readFile("tmp/excel-import-ui/fixture.json", "utf8"),
  );
});
async function identity(page: Page) {
  const r = await page.request.post("/api/v1/local-session", {
    data: { profile: "coordinator" },
    headers: { origin: test.info().project.use.baseURL! },
  });
  expect(r.ok()).toBeTruthy();
}
async function upload(page: Page, name: string) {
  await page
    .getByLabel("Workbook (.xlsx, up to 5 MiB)")
    .setInputFiles(`tmp/excel-import-ui/${name}.xlsx`);
  await page
    .getByRole("button", { name: "Validate workbook", exact: true })
    .click();
}
async function confirm(page: Page) {
  for (const name of [
    "Source calculation",
    "Scope",
    "Reconciliation",
    "Source warnings",
  ])
    await page.getByRole("checkbox", { name: new RegExp(`^${name}`) }).check();
  await page
    .getByLabel("Reason · kept with the import")
    .fill("Synthetic browser proof of exact source, scope and totals review");
}
async function capture(page: Page, name: string, width = 1440, height = 1000) {
  await page.setViewportSize({ width, height });
  await mkdir("tmp/excel-import-ui/captures", { recursive: true });
  await expect(page.locator('script[src*="kit.fontawesome.com"]')).toHaveCount(
    0,
  );
  await page.locator("#ppo-excel-import .es02-scroll").evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.screenshot({
    path: `tmp/excel-import-ui/captures/${name}-${width}.png`,
    fullPage: false,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
}
test("XI-01 to XI-08 native upload, comparison, pricing and explicit Draft choices", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile-chromium",
    "The native journey captures all four widths in one serial run.",
  );
  test.setTimeout(600000);
  await identity(page);
  await page.goto(fixture.wizard);
  await page.getByRole("button", { name: "5. Review", exact: true }).click();
  await page
    .getByRole("link", { name: "Import Excel estimate", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Choose workbook", exact: true }),
  ).toBeVisible();
  await capture(page, "workbook");
  await upload(page, "damaged");
  await expect(
    page
      .getByRole("region", { name: "Excel import", exact: true })
      .getByRole("alert"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save as estimate v1", exact: true }),
  ).toHaveCount(0);
  await upload(page, "blocked");
  await expect(
    page.getByText("Saving is blocked", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to confirm", exact: true }),
  ).toHaveCount(0);
  await capture(page, "blocked", 320, 844);
  await page
    .getByRole("button", { name: "Upload corrected file", exact: true })
    .click();
  await upload(page, "ready");
  await expect(
    page.getByText("Ready for your review", { exact: true }),
  ).toBeVisible();
  for (const [width, height] of [
    [1440, 1000],
    [1024, 768],
    [390, 844],
    [320, 844],
  ])
    await capture(page, "review", width, height);
  const summaryButton = page.getByRole("button", {
    name: "Summary",
    exact: true,
  });
  await expect(
    page.locator(".xi-phone-totals .xi-reconciliation"),
  ).toContainText("Exact to the cent");
  await summaryButton.click();
  await expect(
    page.getByRole("dialog", { name: "Import summary", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Import summary", exact: true }),
  ).toHaveCount(0);
  await expect(summaryButton).toBeFocused();
  await page.getByRole("button", { name: /Show all .* lines/ }).click();
  await expect(
    page.getByRole("region", { name: "Workbook line review", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hide line list", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Continue to confirm", exact: true })
    .click();
  await confirm(page);
  await expect(page.locator(".es02-bottom-state")).toHaveText("Ready to save");
  await capture(page, "confirm");
  const stale = await page.context().newPage();
  // Freeze this tab's already-read workspace to exercise a truly stale native commit,
  // even if the shared resource poll runs after the other tab saves.
  const workspaceId = new URL(
    fixture.route,
    info.project.use.baseURL,
  ).searchParams.get("workspace");
  const workspacePath = `/api/v1/estimating/workspaces/${workspaceId}`;
  const workspaceSnapshot = await stale.request.get(workspacePath);
  expect(workspaceSnapshot.ok()).toBeTruthy();
  const workspaceBody = await workspaceSnapshot.text();
  await stale.route(`**${workspacePath}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: workspaceBody,
    }),
  );
  await stale.goto(fixture.route);
  await upload(stale, "ready");
  await stale
    .getByRole("button", { name: "Continue to confirm", exact: true })
    .click();
  await confirm(stale);
  // Drop the real response after the native transaction commits. Recovery must keep one operation/version.
  let operation = "";
  await page.route(
    "**/excel-import/commit",
    async (route) => {
      operation = route.request().postDataJSON().operation_id;
      const response = await route.fetch();
      expect(response.ok()).toBeTruthy();
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Save as estimate v1", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Save outcome uncertain" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check original outcome", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Estimate saved", exact: true }),
  ).toBeVisible();
  const recovered = await page.request.get(`/api/v1/operations/${operation}`);
  expect(recovered.ok()).toBeTruthy();
  const staleResponse = stale.waitForResponse(
    (r) =>
      r.url().endsWith("/excel-import/commit") &&
      r.request().method() === "POST",
  );
  await stale
    .getByRole("button", { name: "Save as estimate v1", exact: true })
    .click();
  expect((await staleResponse).status()).toBe(409);
  await expect(
    stale
      .getByRole("region", { name: "Excel import", exact: true })
      .getByRole("alert"),
  ).toBeVisible();
  await expect(
    stale.getByRole("button", { name: "Save as estimate v1", exact: true }),
  ).toBeDisabled();
  await capture(stale, "stale");
  await stale.close();
  await page
    .getByRole("button", { name: "Open saved result", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Import evidence", exact: true }),
  ).toBeVisible();
  const originalHref = await page
    .getByRole("link", {
      name: "Download retained original workbook",
      exact: true,
    })
    .getAttribute("href");
  const original = await page.request.get(originalHref!);
  expect(original.ok()).toBeTruthy();
  expect(await original.body()).toEqual(
    await readFile("tmp/excel-import-ui/ready.xlsx"),
  );
  await capture(page, "saved");
  await capture(page, "saved", 390, 844);
  await page
    .getByRole("link", { name: "Import a revised workbook", exact: true })
    .click();
  await upload(page, "revised");
  await expect(
    page.getByRole("heading", {
      name: "Compare revised workbook",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to confirm", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel(/^Decision for /)
    .first()
    .selectOption("Keep");
  const proposedSell = await page.getByTestId("proposed-sell").innerText();
  expect(proposedSell).not.toBe("Unknown");
  await capture(page, "compare");
  await page
    .getByRole("button", { name: "Continue to confirm", exact: true })
    .click();
  await confirm(page);
  await page
    .getByRole("checkbox", { name: /Confirm all replacements/ })
    .check();
  await page
    .getByRole("button", { name: "Save revised estimate", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open saved result", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Next steps", exact: true }),
  ).toBeVisible();
  const savedParams = new URL(page.url()).searchParams;
  const savedResponse = await page.request.get(
    `/api/v1/estimating/estimates/${savedParams.get("estimate")}?version_id=${savedParams.get("version")}`,
  );
  expect(savedResponse.ok()).toBeTruthy();
  const savedEstimate = await savedResponse.json();
  expect(proposedSell).toBe(
    `AUD ${savedEstimate.totals.sell.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
  );
  expect(await (await page.request.get(originalHref!)).body()).toEqual(
    await readFile("tmp/excel-import-ui/ready.xlsx"),
  );
  await page
    .getByRole("link", { name: "Price from reviewed sources", exact: true })
    .click();
  await page.getByLabel("Pricing date", { exact: true }).fill("2026-10-14");
  await page
    .getByLabel("Search reviewed sources", { exact: true })
    .fill(fixture.source);
  await page
    .getByRole("button", { name: "Search sources", exact: true })
    .click();
  await expect(
    page
      .locator(
        `option[value="${fixture.source_id}:${fixture.source_revision_id}"]`,
      )
      .first(),
  ).toBeAttached();
  await page
    .getByLabel(/^Reviewed source for /)
    .first()
    .selectOption(`${fixture.source_id}:${fixture.source_revision_id}`);
  await page
    .getByRole("button", { name: "Continue to charges", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review pricing comparison", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "3. Review exact prices and allocation",
      exact: true,
    }),
  ).toBeVisible();
  await capture(page, "pricing");
  await page.getByRole("checkbox", { name: /I reviewed every price/ }).check();
  await page
    .getByLabel("Pricing reason", { exact: true })
    .fill("Synthetic reviewed-source pricing");
  await page
    .getByRole("button", { name: "Save priced estimate", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Estimate saved", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('[aria-label="Excel import steps"] [aria-current="step"]'),
  ).toContainText("4. Priced");
  const pricedEstimateId = new URL(page.url()).searchParams.get("estimate");
  await page.route(
    `**/api/v1/estimating/estimates/${pricedEstimateId}`,
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "SyntheticReadFailure",
          message:
            "Saved result temporarily unavailable; original receipt retained.",
        }),
      }),
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Open saved result", exact: true })
    .click();
  await expect(
    page.getByText(
      "Saved result temporarily unavailable; original receipt retained.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Estimate saved", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open saved result", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Prepare Draft quotation", exact: true })
    .click();
  await expect(
    page.getByText("Kept line · no workbook proposal · choose explicitly", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review Draft choices", exact: true }),
  ).toBeDisabled();
  for (const select of await page.locator(".xi-confirmation select").all())
    if ((await select.inputValue()) === "") await select.selectOption("Yes");
  await page
    .getByRole("button", { name: "Review Draft choices", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Customer-safe Draft preview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Customer-safe Draft preview" }),
  ).not.toContainText(fixture.source);
  await capture(page, "quotation");
  for (const name of [
    "Customer wording",
    "Include and print choices",
    "Reconciliation",
  ])
    await page.getByRole("checkbox", { name, exact: true }).check();
  await page
    .getByLabel("Draft preparation reason", { exact: true })
    .fill("Synthetic separate customer wording and total review");
  await page
    .getByRole("button", { name: "Prepare Draft quotation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Draft saved", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('[aria-label="Excel import steps"] [aria-current="step"]'),
  ).toContainText("4. Draft saved");
  await page
    .getByRole("button", { name: "Open saved result", exact: true })
    .click();
  await expect(page).toHaveURL(/\/estimating\/quotes\//);
  await expect(page.getByText(/Synthetic review copy/)).toBeVisible();
});
test("missing target, refused context, failed read and stale preview remain unsaved", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile-chromium",
    "Boundary states run once; the native journey captures phone states.",
  );
  test.setTimeout(180000);
  await identity(page);
  await page.goto("/estimating/import");
  await expect(
    page.getByRole("heading", { name: /Choose a Draft workspace/ }),
  ).toBeVisible();
  await page.goto(fixture.route);
  await page.route(
    "**/excel-import/context",
    (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          code: "Forbidden",
          message: "Synthetic access refusal",
        }),
      }),
    { times: 1 },
  );
  await upload(page, "ready");
  await expect(
    page
      .getByRole("region", { name: "Excel import", exact: true })
      .getByRole("alert"),
  ).toContainText("Synthetic access refusal");
  await expect(
    page.getByRole("button", { name: "Save as estimate v1" }),
  ).toHaveCount(0);
  await page.reload();
  await page.route(
    "**/excel-import/preview",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "DependencyUnavailable",
          message: "Synthetic dependency unavailable",
        }),
      }),
    { times: 1 },
  );
  await upload(page, "ready");
  await expect(
    page
      .getByRole("region", { name: "Excel import", exact: true })
      .getByRole("alert"),
  ).toContainText("Synthetic dependency unavailable");
  await page.route(
    "**/excel-import/preview",
    (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          code: "ExcelImportBasisChanged",
          message: "The selected basis changed. Review again.",
        }),
      }),
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Validate workbook", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Excel import", exact: true })
      .getByRole("alert"),
  ).toContainText("The selected basis changed");
  await expect(
    page.getByRole("button", { name: "Save as estimate v1" }),
  ).toHaveCount(0);
  const refused = await page.request.post("/api/v1/local-session", {
    data: { profile: "observer" },
    headers: { origin: test.info().project.use.baseURL! },
  });
  expect(refused.ok()).toBeTruthy();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: /^(Excel import unavailable|Import is unavailable for this basis)$/,
    }),
  ).toBeVisible();
  await capture(page, "refused");
});

test("native reviewed FX evidence and landed charges preserve sell and original workbook values", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile-chromium",
    "Native FX/landed proof runs once.",
  );
  test.setTimeout(600000);
  execFileSync(
    process.execPath,
    [
      "--env-file=.env.local",
      "--import",
      "tsx",
      "tests/helpers/excel-import-browser-fixture.ts",
      "--pricing",
    ],
    { stdio: "pipe", timeout: 300000 },
  );
  const fx = JSON.parse(
    await readFile("tmp/excel-import-ui/pricing-fixture.json", "utf8"),
  );
  await identity(page);
  await page.goto(fx.route);
  await page.getByLabel("Pricing date", { exact: true }).fill("2026-10-14");
  await page
    .getByLabel("Search reviewed sources", { exact: true })
    .fill(fx.source);
  await page
    .getByRole("button", { name: "Search sources", exact: true })
    .click();
  await expect(
    page
      .locator(`option[value="${fx.source_id}:${fx.source_revision_id}"]`)
      .first(),
  ).toBeAttached();
  await page
    .getByLabel(/^Reviewed source for /)
    .first()
    .selectOption(`${fx.source_id}:${fx.source_revision_id}`);
  await page
    .getByRole("button", { name: "Continue to charges", exact: true })
    .click();
  await page.getByRole("button", { name: "Add charge", exact: true }).click();
  await page.getByLabel("Amount AUD 1", { exact: true }).fill("0.30");
  await page.getByLabel("Effective date 1", { exact: true }).fill("2026-10-14");
  await page
    .getByLabel("Evidence reference 1", { exact: true })
    .fill("SYN-BROWSER-FREIGHT");
  await page
    .getByLabel("Evidence excerpt 1", { exact: true })
    .fill("Fictional freight excluded from supplier price and other lines.");
  await page.locator(".xi-charge").getByRole("checkbox").first().check();
  await page
    .getByRole("checkbox", { name: /These charges are excluded/ })
    .check();
  await page
    .getByRole("button", { name: "Review pricing comparison", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Original foreign prices and recorded rates",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Landed cost by line", exact: true }),
  ).toContainText("AUD 1.31");
  await expect(
    page.getByRole("region", { name: "Pricing totals", exact: true }),
  ).toContainText("AUD 7.50");
  await capture(page, "pricing-fx-landed");
  await page.getByRole("checkbox", { name: /I reviewed every price/ }).check();
  await page
    .getByLabel("Pricing reason", { exact: true })
    .fill("Synthetic independently reviewed FX and exact landed allocation");
  await page
    .getByRole("button", { name: "Save priced estimate", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open saved result", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Import evidence", exact: true }),
  ).toBeVisible();
});
