import { test, expect } from "@playwright/test";
import { browserFixtureCall } from "../helpers/browser-fixture-call";

test("AD-01 people and exact company/site explanation on the native page", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto("/admin/access");
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }),
  ).toBeVisible();
  await expect(
    page.locator(
      'a[href="/admin/access/30000000-0000-4000-8000-000000000005"]',
    ),
  ).toBeVisible();
  await page.getByLabel("Find a person", { exact: true }).fill("not-a-person");
  await page.getByRole("button", { name: "Search identities" }).click();
  await expect(
    page.getByText("No identities match these filters."),
  ).toBeVisible();
  await page.getByLabel("Find a person", { exact: true }).fill("");
  await page.getByRole("button", { name: "Search identities" }).click();
  await page
    .locator('a[href="/admin/access/30000000-0000-4000-8000-000000000005"]')
    .click();
  await expect(
    page.getByRole("heading", { name: "Explain grant eligibility" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Company", exact: true })
    .selectOption("20000000-0000-4000-8000-000000000001");
  await page
    .getByRole("combobox", { name: "Site", exact: true })
    .selectOption("70000000-0000-4000-8000-000000000001");
  await page.getByRole("button", { name: "Check grant eligibility" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Grant permits this scope",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Site", exact: true })
    .selectOption("70000000-0000-4000-8000-000000000002");
  await expect(
    page.getByRole("heading", {
      name: "Grant permits this scope",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Check grant eligibility" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Grant does not permit this scope",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Authentication, assignment, record state/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.route("**/api/v1/admin/access/*/explanation?**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Forbidden",
        message: "Synthetic revoked inspection permission",
      }),
    }),
  );
  await page.getByRole("button", { name: "Check grant eligibility" }).click();
  await expect(page.locator("main .business-error")).toContainText(
    "Synthetic revoked inspection permission",
  );
  await expect(
    page.getByRole("heading", { name: /Recorded grants/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "SYN Site observer", exact: true }),
  ).toHaveCount(0);
});

test("AD-01 direct HTTP requests enforce current inspection permission and expose no write method", async ({
  request,
  baseURL,
}) => {
  await browserFixtureCall(
    { request },
    "local-session",
    { profile: "coordinator" },
    baseURL!,
  );
  for (const route of [
    "/api/v1/admin/access",
    "/api/v1/admin/access/capabilities",
    "/api/v1/admin/access/capabilities/shared.read",
    "/api/v1/admin/access/30000000-0000-4000-8000-000000000005",
    "/api/v1/admin/access/30000000-0000-4000-8000-000000000005/explanation?capability=shared.read&company_id=20000000-0000-4000-8000-000000000001",
  ]) {
    const response = await request.get(route);
    expect(response.status()).toBe(403);
    expect((await response.json()).code).toBe("Forbidden");
  }
  await browserFixtureCall(
    { request },
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  const read = await request.get("/api/v1/admin/access");
  expect(read.status()).toBe(200);
  expect(read.headers()["cache-control"]).toContain("no-store");
  expect(JSON.stringify(await read.json())).not.toContain("subject_id");
  for (const route of [
    "/api/v1/admin/access",
    "/api/v1/admin/access/capabilities",
    "/api/v1/admin/access/capabilities/shared.read",
  ]) {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(
      (
        await request.post(route, {
          data: {},
          headers: { Origin: baseURL! },
        })
      ).status(),
    ).toBe(405);
  }
});

test("AD-01 denied page clears people; failed reads retry without displaying retained data", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "coordinator" },
    baseURL!,
  );
  await page.goto("/admin/access");
  await expect(page.locator("main .business-error")).toContainText(
    "Workspace access inspection is not permitted",
  );
  await expect(page.locator('a[href^="/admin/access/300"]')).toHaveCount(0);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.route("**/api/v1/admin/access?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "DependencyUnavailable",
        message: "Synthetic read failure",
        retryable: true,
      }),
    }),
  );
  await page.reload();
  await expect(page.locator("main .business-error")).toContainText(
    "Synthetic read failure",
  );
  await page.unroute("**/api/v1/admin/access?**");
  await page.getByRole("button", { name: /retry/i }).click();
  await expect(
    page.locator(
      'a[href="/admin/access/30000000-0000-4000-8000-000000000005"]',
    ),
  ).toBeVisible();
});

test("AD-01 capability catalogue shows unassigned keys and drills through exact site grants", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto("/admin/access");
  await page
    .getByRole("link", { name: "Browse the capability catalogue" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Capability catalogue", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Find a capability").fill("no-matching-capability");
  await page.getByRole("button", { name: "Search capabilities" }).click();
  await expect(
    page.getByText("No capabilities match these filters."),
  ).toBeVisible();
  await page.getByLabel("Find a capability").fill("email.connect");
  await page.getByRole("button", { name: "Search capabilities" }).click();
  await page.getByRole("link", { name: "email.connect", exact: true }).click();
  await expect(
    page.getByText(
      "No recorded grants match this capability and these filters.",
    ),
  ).toBeVisible();
  await expect(page.getByText(/Hosted demo only. Invitation/)).toBeVisible();
  await page
    .getByRole("link", { name: "Back to capability catalogue" })
    .click();
  await page
    .getByRole("combobox", { name: "Domain", exact: true })
    .selectOption("shared");
  await page.getByLabel("Find a capability").fill("shared.read");
  await page.getByRole("button", { name: "Search capabilities" }).click();
  await page.getByRole("link", { name: "shared.read", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "shared.read", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Grant scope", exact: true })
    .selectOption("Site");
  await page.getByRole("button", { name: "Filter grants" }).click();
  await expect(page.locator("main .record-grid")).toContainText("SYN-A");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "SYN Site observer", exact: true })
    .click();
  await expect(page.getByLabel("Capability key", { exact: true })).toHaveValue(
    "shared.read",
  );
  await expect(
    page.getByRole("combobox", { name: "Company", exact: true }),
  ).toHaveValue("20000000-0000-4000-8000-000000000001");
  await expect(
    page.getByRole("combobox", { name: "Site", exact: true }),
  ).toHaveValue("70000000-0000-4000-8000-000000000001");
  await expect(
    page.getByRole("heading", {
      name: "Grant permits this scope",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Check grant eligibility" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Grant permits this scope",
      exact: true,
    }),
  ).toBeVisible();
});

test("AD-01 catalogue retries unavailable reads and clears holders after authority loss", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto("/admin/access/capabilities");
  await expect(
    page.getByRole("link", { name: "shared.read", exact: true }),
  ).toBeVisible();
  await page.route("**/api/v1/admin/access/capabilities?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "DependencyUnavailable",
        message: "Synthetic catalogue read failure",
        retryable: true,
      }),
    }),
  );
  await page.getByRole("button", { name: "Refresh capabilities" }).click();
  await expect(page.locator("main .business-error")).toContainText(
    "Synthetic catalogue read failure",
  );
  await expect(
    page.getByRole("link", { name: "shared.read", exact: true }),
  ).toHaveCount(0);
  await page.unroute("**/api/v1/admin/access/capabilities?**");
  await page.getByRole("button", { name: /retry/i }).click();
  await page.getByRole("link", { name: "shared.read", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "SYN Site observer", exact: true }),
  ).toBeVisible();
  // Actual session change: the next server read must refuse the old inspection view.
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "coordinator" },
    baseURL!,
  );
  await page.getByRole("button", { name: "Refresh grants" }).click();
  await expect(page.locator("main .business-error")).toContainText(
    "Workspace access inspection is not permitted",
  );
  await expect(
    page.getByRole("link", { name: "SYN Site observer", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "shared.read", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
