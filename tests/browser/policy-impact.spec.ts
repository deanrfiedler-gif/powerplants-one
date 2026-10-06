import { test, expect } from "@playwright/test";
const path =
  "/schedule/policy-impact?day=2031-09-21&timezone=Australia/Brisbane";
test.beforeEach(async ({ page }) => {
  const response = await page.request.post("/api/v1/local-session", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: { profile: "coordinator" },
  });
  expect(response.ok()).toBeTruthy();
});
test("policy analysis is read-only, clears edited results and hands over the exact booking", async ({
  page,
}, info) => {
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: "Published rule" }),
  ).toBeVisible();
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/") && r.method() !== "GET")
      writes.push(r.url());
  });
  await page.getByLabel("Proposed maximum visit (minutes)").fill("60");
  await page.getByRole("button", { name: "Compare future bookings" }).click();
  await expect(
    page.getByText("Visit exceeds the proposed duration limit").first(),
  ).toBeVisible();
  const link = page.getByRole("link", { name: /^Review .*APT/ }).first();
  await expect(link).toHaveAttribute("href", /appointment_id=/);
  for (const width of info.project.name.includes("mobile")
    ? [390, 320]
    : [1440, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`policy-impact-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("heading", { name: "Bookings requiring review" })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath(`policy-impact-results-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByLabel("Proposed maximum visit (minutes)").fill("1440");
  await expect(
    page.getByRole("heading", { name: "Bookings requiring review" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Compare future bookings" }).click();
  await expect(
    page.getByText(
      "No matching bookings require review under this comparison. This is not publication or dispatch approval.",
    ),
  ).toBeVisible();
  await page.getByLabel("Proposed maximum visit (minutes)").fill("60");
  await page.getByRole("button", { name: "Compare future bookings" }).click();
  await expect(link).toBeVisible();
  const destination = await link.getAttribute("href");
  expect(writes).toEqual([]);
  await link.click();
  await expect(page).toHaveURL(
    new RegExp(
      "appointment_id=" +
        new URL(destination!, "http://127.0.0.1").searchParams.get(
          "appointment_id",
        ),
    ),
  );
  await expect(
    page.getByRole("heading", { name: "Review a scheduling rule change" }),
  ).toHaveCount(0);
});
test("failed refresh and identity changes clear prior analysis, with no publish endpoint", async ({
  page,
}) => {
  await page.goto(path);
  await page.getByLabel("Proposed maximum visit (minutes)").fill("60");
  await page.getByRole("button", { name: "Compare future bookings" }).click();
  await expect(
    page.getByText("Visit exceeds the proposed duration limit").first(),
  ).toBeVisible();
  await page.route("**/api/v1/schedule/policy-impact?*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "DependencyUnavailable",
        message: "Synthetic unavailable impact read",
      }),
    }),
  );
  await page.getByRole("button", { name: "Compare future bookings" }).click();
  await expect(
    page.getByText("Synthetic unavailable impact read"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bookings requiring review" }),
  ).toHaveCount(0);
  await page.unroute("**/api/v1/schedule/policy-impact?*");
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(
    page.getByText("Visit exceeds the proposed duration limit").first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Change identity", exact: true })
    .click();
  await page.getByLabel("Identity", { exact: true }).selectOption("systems");
  // Clearing the old page happens before the session cookie changes. Verify
  // the completed identity transition before asserting the new server scope.
  const identityChanged = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/local-session" &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  const changed = await identityChanged;
  expect(changed.status()).toBe(200);
  const current = await changed.json();
  const identity = page.getByRole("region", {
    name: "Local demonstration identity",
    exact: true,
  });
  await expect(identity.locator("strong").first()).toHaveText(current.display_name);
  await expect(identity).toHaveAttribute("aria-busy", "false");
  await expect(
    page.getByRole("heading", { name: "Bookings requiring review" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Published rule" }),
  ).toHaveCount(0);
  const denied = await page.request.get("/api/v1/schedule/policy-impact");
  expect(denied.status()).toBe(403);
  const post = await page.request.post("/api/v1/schedule/policy-impact", {
    data: { publish: true },
  });
  expect(post.status()).toBe(405);
});
