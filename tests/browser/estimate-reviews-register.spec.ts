import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmCreate, crmBase } from "../helpers/crm";
import { releaseFixture, prepared } from "../helpers/quotation-release";
import { closeDatabase } from "../../src/platform/database";
import { estimateInput } from "../helpers/estimating";

test.describe.configure({ timeout: 300000 });
test.beforeAll(() => {
  // Direct native fixture calls run in the test worker, separately from the server.
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
});
test.afterAll(closeDatabase);
async function identity(page: Page, profile = "coordinator") {
  await page.goto("/work");
  const r = await page.request.post("/api/v1/local-session", {
    headers: { Origin: new URL(page.url()).origin },
    data: { profile },
  });
  expect(r.ok(), await r.text()).toBe(true);
}
async function post(page: Page, path: string, data: unknown) {
  const r = await page.request.post(`/api/v1/${path}`, {
    headers: { Origin: new URL(page.url()).origin },
    data,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function fixture(
  page: Page,
  suppliedTitle?: string,
  sessionReady = false,
) {
  if (!sessionReady) await identity(page);
  const title = suppliedTitle ?? `SYN Queue browser ${randomUUID()}`;
  const opportunity = crmCreate();
  await post(page, "crm/opportunities", opportunity);
  const input = { ...estimateInput(opportunity.id), title };
  await post(page, "estimating/estimates", input);
  const path = `estimating/estimates/${input.id}/review`;
  const d = await (await page.request.get(`/api/v1/${path}`)).json();
  await post(page, path, {
    ...crmBase(),
    estimate_version_id: d.saved.id,
    basis_hash: d.basis_hash,
    expected_version: d.estimate.version,
    expected_review_version: d.sequence,
    responses: [],
  });
  return { input, title, path };
}
test("accepted queue uses exact snapshots, selected-only export and native handovers on desktop and phone", async ({
  page,
}, info) => {
  const f = await fixture(page);
  await identity(page, "estimating-source-reviewer");
  await page.goto(`/estimating/reviews?q=${encodeURIComponent(f.title)}`);
  await expect(page.getByText("3 reviews · this window")).toBeVisible();
  await expect(
    page
      .getByRole("navigation", {
        name: "Mobile navigation",
        includeHidden: true,
      })
      .getByRole("link", { name: "Reviews & approvals", includeHidden: true }),
  ).toHaveAttribute("href", /estimating\/reviews/);
  const phone = (page.viewportSize()?.width ?? 1440) < 781;
  const list = page.locator(phone ? ".er-phone-list" : ".er-desktop-grid");
  await list.getByRole("checkbox", { name: /Select .* Completeness/ }).check();
  await list.getByRole("checkbox", { name: /Select .* Technical/ }).check();
  if (phone)
    await page.getByRole("button", { name: "Show panel", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Selected reviews" }),
  ).toBeVisible();
  if (phone)
    await page.getByRole("button", { name: "Close selection panel" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export list", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("selected-reviews.csv");
  await page
    .getByRole("button", { name: "Open in sequence", exact: true })
    .first()
    .click();
  const snapshot = page.getByRole("region", { name: "Exact review snapshot" });
  await expect(snapshot.getByRole("heading", { name: f.title })).toBeVisible();
  await expect(
    snapshot.getByRole("link", { name: "Open review", exact: true }),
  ).toHaveAttribute("href", /submission_id=.*kind=Completeness/);
  await page.screenshot({
    path: info.outputPath("review-snapshot.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Next review", exact: true }).click();
  await expect(
    snapshot.getByRole("link", { name: "Open review", exact: true }),
  ).toHaveAttribute("href", /kind=Technical/);
  await page.keyboard.press("Escape");
  await expect(snapshot).toHaveCount(0);
  await page
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await list
    .getByRole("button", { name: /Open .* Source & price snapshot/ })
    .click();
  await snapshot
    .getByRole("link", { name: "Open review", exact: true })
    .click();
  await expect(page.getByLabel("Review kind")).toHaveValue("SourcePrice");
  await page.goto(`/estimating/reviews?q=${encodeURIComponent(f.title)}`);
  await expect(page.getByText("3 reviews · this window")).toBeVisible();
  await page.screenshot({
    path: info.outputPath("reviews-register.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("queue retains returned findings and refuses silently following a superseded submission", async ({
  page,
}) => {
  const f = await fixture(page);
  await identity(page, "estimating-source-reviewer");
  let d = await (await page.request.get(`/api/v1/${f.path}`)).json();
  await post(page, `${f.path}/decision`, {
    ...crmBase(),
    submission_id: d.submissions.at(-1).id,
    expected_version: d.estimate.version,
    expected_review_version: d.sequence,
    kind: "Completeness",
    outcome: "Returned",
    findings: [{ line_id: null, detail: "SYN Clarify installation scope" }],
  });
  await page.goto(
    `/estimating/reviews?q=${encodeURIComponent(f.title)}&view=returned`,
  );
  const list = page.locator(
    (page.viewportSize()?.width ?? 1440) < 781
      ? ".er-phone-list"
      : ".er-desktop-grid",
  );
  await list
    .getByRole("button", { name: /Open .* Completeness snapshot/ })
    .click();
  await expect(
    page.getByText("SYN Clarify installation scope", { exact: true }),
  ).toBeVisible();
  const oldHref = await page
    .getByRole("link", { name: "Open review", exact: true })
    .getAttribute("href");
  await identity(page);
  d = await (await page.request.get(`/api/v1/${f.path}`)).json();
  await post(page, f.path, {
    ...crmBase(),
    estimate_version_id: d.saved.id,
    basis_hash: d.basis_hash,
    expected_version: d.estimate.version,
    expected_review_version: d.sequence,
    responses: [
      {
        finding_id: d.statuses.find(
          (s: { kind: string }) => s.kind === "Completeness",
        ).decision.findings[0].id,
        response: "SYN Installation responsibility clarified",
      },
    ],
  });
  await identity(page, "estimating-source-reviewer");
  await page.goto(oldHref!);
  await expect(
    page.getByRole("heading", {
      name: "Selected submission has been superseded",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record exact review decision" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Open current review" }).click();
  await expect(
    page.getByRole("button", { name: "Record exact review decision" }),
  ).toBeVisible();
});
test("queue failure clears content and retry recovers at 320 pixels with keyboard filters", async ({
  page,
}, info) => {
  const f = await fixture(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(`/estimating/reviews?q=${encodeURIComponent(f.title)}`);
  await expect(page.getByText("3 reviews · this window")).toBeVisible();
  await page
    .getByRole("button", { name: "Filter reviews", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Filter reviews" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Filter reviews" }),
  ).toHaveCount(0);
  await page.route("**/api/v1/estimating/reviews?*", (r) => r.abort("failed"));
  await page
    .getByRole("button", { name: "Refresh reviews", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Reviews could not be loaded" }),
  ).toBeVisible();
  await expect(page.locator(".er-phone-list article")).toHaveCount(0);
  await page.unroute("**/api/v1/estimating/reviews?*");
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(page.getByText("3 reviews · this window")).toBeVisible();
  await page.screenshot({
    path: info.outputPath("reviews-320.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await identity(page, "assigned-technician");
  await page.goto("/estimating/reviews");
  await expect(
    page.getByRole("heading", { name: "Reviews are outside your access" }),
  ).toBeVisible();
  await expect(page.locator(".er-phone-list article")).toHaveCount(0);
  await expect(
    page.locator("nav.mobile-navigation a[href='/estimating/reviews']"),
  ).toHaveCount(0);
});

test("quotation snapshot hands over to the exact native approval on desktop and phone", async ({
  page,
}, info) => {
  const f = await releaseFixture(),
    next = await prepared(f);
  await identity(page, "quotation-approver");
  const d = await (
    await page.request.get(`/api/v1/estimating/quotes/${next.id}/release`)
  ).json();
  await page.goto(
    `/estimating/reviews?view=quotations&q=${encodeURIComponent(d.revision.snapshot.display_number)}`,
  );
  await expect(page.getByText("1 review · this window")).toBeVisible();
  const list = page.locator(
    (page.viewportSize()?.width ?? 1440) < 781
      ? ".er-phone-list"
      : ".er-desktop-grid",
  );
  await list
    .getByRole("button", { name: /Open .* Quotation approval snapshot/ })
    .click();
  const snapshot = page.getByRole("region", { name: "Exact review snapshot" });
  await expect(
    snapshot.getByRole("link", { name: "Open approval", exact: true }),
  ).toHaveAttribute("href", `/estimating/quotes/${next.id}/release`);
  await page.screenshot({
    path: info.outputPath("quotation-snapshot.png"),
    fullPage: true,
  });
  await snapshot
    .getByRole("link", { name: "Open approval", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`${next.id}/release`));
  await expect(
    page.getByRole("button", { name: /Record.*approval/i }),
  ).toBeVisible();
});

test("empty awaiting-my-review windows retain native continuation beyond 25 candidates", async ({
  page,
}) => {
  await identity(page);
  const title = `SYN Browser window ${randomUUID()}`;
  for (let i = 0; i < 26; i++) await fixture(page, title, true);
  await page.goto(
    `/estimating/reviews?q=${encodeURIComponent(title)}&view=awaiting_me`,
  );
  await expect(page.getByText("0 reviews · this window")).toBeVisible({
    timeout: 45000,
  });
  await expect(
    page.getByRole("button", { name: "Next window", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Next window", exact: true }).click();
  await expect(page).toHaveURL(/offset=25/);
  await expect(
    page.getByRole("button", { name: "Next window", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Previous window", exact: true }),
  ).toBeEnabled();
  await page.goto(`/estimating/reviews?q=${encodeURIComponent(title)}`);
  await expect(page.getByText("75 reviews · this window")).toBeVisible({
    timeout: 45000,
  });
  await page.getByRole("button", { name: "Next window", exact: true }).click();
  await expect(page.getByText("3 reviews · this window")).toBeVisible();
});
