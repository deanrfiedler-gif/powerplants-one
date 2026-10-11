import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { browserFixtureCall } from "../helpers/browser-fixture-call";

const base = "admin/access/requests",
  subject = "30000000-0000-4000-8000-000000000005",
  reviewer = "a0540000-0000-4000-8000-000000000001",
  company = "20000000-0000-4000-8000-000000000002";
async function fixture(page: Page, origin: string) {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    origin,
  );
  const grants = await browserFixtureCall(
    page,
    `admin/access/${subject}`,
    undefined,
    origin,
  );
  const context = await browserFixtureCall(
    page,
    `${base}/context`,
    undefined,
    origin,
  );
  const used = new Set<string>();
  let offset = 0;
  for (;;) {
    const queue = await browserFixtureCall(
      page,
      `${base}?offset=${offset}`,
      undefined,
      origin,
    );
    for (const r of queue.items as {
      subject_id: string;
      state: string;
      capability: string;
      company_id: string;
    }[])
      if (
        r.subject_id === subject &&
        r.company_id === company &&
        r.state !== "Returned"
      )
        used.add(r.capability);
    if (!queue.has_more) break;
    offset += 50;
  }
  for (const g of grants.grants as { capability: string }[])
    used.add(g.capability);
  const capability = (context.capabilities as { key: string }[]).find(
    (x) => !used.has(x.key),
  )!.key;
  return {
    grants: grants.grants,
    input: {
      schema_version: 1,
      operation_id: randomUUID(),
      request_id: randomUUID(),
      subject_id: subject,
      reviewer_id: reviewer,
      capability,
      scope_type: "Company",
      company_id: company,
      site_id: null,
      valid_from: "2035-01-01T00:00:00Z",
      valid_to: null,
      reason: "Browser proof of the exact independently reviewed scope.",
    },
  };
}
async function fill(page: Page, capability: string) {
  await page
    .getByLabel("Affected person", { exact: true })
    .selectOption(subject);
  await page
    .getByLabel("Independent reviewer", { exact: true })
    .selectOption(reviewer);
  await page
    .getByLabel("Capability to add", { exact: true })
    .selectOption(capability);
  await page.getByLabel("Company", { exact: true }).selectOption(company);
  await page
    .getByLabel("Proposed start (UTC)", { exact: true })
    .fill("2035-01-01T00:00");
  await page
    .getByLabel("Request reason", { exact: true })
    .fill("Browser proof of an independently reviewed access request.");
}
test("AD-01 submit, reopen and independently return an exact proposal without changing grants", async ({
  page,
  baseURL,
}) => {
  const f = await fixture(page, baseURL!);
  await page.goto("/admin/access");
  await page
    .getByRole("link", { name: "Access-change requests", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Propose one additional capability" }),
  ).toBeVisible();
  await fill(page, f.input.capability);
  await expect(
    page
      .getByLabel("Independent reviewer")
      .locator(`option[value="${subject}"]`),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Submit for independent review" })
    .click();
  const link = page.getByRole("link", {
    name: "Open saved request",
    exact: true,
  });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.locator("main")).toContainText("SYN-B");
  await expect(
    page.getByRole("button", { name: "Record decision", exact: true }),
  ).toHaveCount(0);
  const url = page.url();
  await page.reload();
  await expect(page.locator("main")).toContainText("Version 1");
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "scheduling-policy-reviewer" },
    baseURL!,
  );
  await page.goto(url);
  await page
    .getByLabel("Decision reason", { exact: true })
    .fill("Return this proposal for a narrower capability review.");
  await page
    .getByRole("button", { name: "Record decision", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Access decision saved" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Refresh request and history" })
    .click();
  await expect(page.locator("main .status-chip")).toHaveText("Returned");
  await expect(page.locator("main")).toContainText(
    "Return this proposal for a narrower capability review.",
  );
  await expect(
    page.getByRole("button", { name: "Record decision", exact: true }),
  ).toHaveCount(0);
  const after = await browserFixtureCall(
    page,
    `admin/access/${subject}`,
    undefined,
    baseURL!,
  );
  expect(after.grants).toEqual(f.grants);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("AD-01 a lost submission response recovers the original after reload and approval remains ineffective", async ({
  page,
  baseURL,
}) => {
  const f = await fixture(page, baseURL!);
  await page.goto(`/${base}`);
  await fill(page, f.input.capability);
  let requestId = "",
    operationId = "";
  let interceptionFinished!: () => void;
  const intercepted = new Promise<void>((resolve) => {
    interceptionFinished = resolve;
  });
  await page.route(`**/api/v1/${base}`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    const receipt = await response.json();
    requestId = receipt.record_id;
    operationId = receipt.operation_id;
    await route.abort("failed");
    interceptionFinished();
  });
  await page
    .getByRole("button", { name: "Submit for independent review" })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry unchanged action" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Submit for independent review" }),
  ).toBeDisabled();
  await intercepted;
  await page.unroute(`**/api/v1/${base}`);
  await page.reload();
  const link = page.getByRole("link", {
    name: "Open saved request",
    exact: true,
  });
  await expect(link).toHaveAttribute("href", `/${base}/${requestId}`);
  const receipt = await browserFixtureCall(
    page,
    `${base}/operations/${operationId}`,
    undefined,
    baseURL!,
  );
  expect(receipt.record_id).toBe(requestId);
  const detail = await browserFixtureCall(
    page,
    `${base}/${requestId}`,
    undefined,
    baseURL!,
  );
  expect(detail.history).toHaveLength(1);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "scheduling-policy-reviewer" },
    baseURL!,
  );
  await page.goto(`/${base}/${requestId}`);
  await page.getByLabel("Decision", { exact: true }).selectOption("Approved");
  await page
    .getByLabel("Decision reason", { exact: true })
    .fill("Reviewed the exact proposal; applying grants remains separate.");
  await page
    .getByRole("button", { name: "Record decision", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Access decision saved" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Refresh request and history" })
    .click();
  await expect(page.locator("main .status-chip")).toHaveText("Approved");
  await expect(page.locator("main")).toContainText(
    "This request has not installed a grant",
  );
  expect(
    (
      await browserFixtureCall(
        page,
        `admin/access/${subject}`,
        undefined,
        baseURL!,
      )
    ).grants,
  ).toEqual(f.grants);
});
test("AD-01 stale decisions are refused and denied refresh hides request context", async ({
  page,
  baseURL,
}) => {
  const f = await fixture(page, baseURL!);
  const saved = await browserFixtureCall(page, base, f.input, baseURL!);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "scheduling-policy-reviewer" },
    baseURL!,
  );
  await page.goto(`/${base}/${saved.record_id}`);
  await page
    .getByLabel("Decision reason", { exact: true })
    .fill("This tab has the earlier version of the saved request.");
  await browserFixtureCall(
    page,
    `${base}/${saved.record_id}/decision`,
    {
      schema_version: 1,
      operation_id: randomUUID(),
      expected_version: 1,
      decision: "Returned",
      reason: "A concurrent tab recorded this exact decision first.",
    },
    baseURL!,
  );
  await page
    .getByRole("button", { name: "Record decision", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "already been decided",
  );
  await page
    .getByRole("button", { name: "Refresh request and history" })
    .click();
  await expect(page.locator("main .status-chip")).toHaveText("Returned");
  await page.route(`**/api/v1/${base}/${saved.record_id}`, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Forbidden",
        message: "Synthetic current-duty refusal.",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Refresh request and history" })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Synthetic current-duty refusal",
  );
  await expect(
    page.getByRole("heading", { name: "Saved history", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("SYN-B");
});

async function approvedFixture(page: Page, origin: string) {
  const f = await fixture(page, origin);
  await browserFixtureCall(page, base, f.input, origin);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "scheduling-policy-reviewer" },
    origin,
  );
  await browserFixtureCall(
    page,
    `${base}/${f.input.request_id}/decision`,
    {
      schema_version: 1,
      operation_id: randomUUID(),
      expected_version: 1,
      decision: "Approved",
      reason: "Independent approval of this exact local scope and dates.",
    },
    origin,
  );
  return f;
}
test("AD-01 approved local application installs once, retains its dates and opens current person access", async ({
  page,
  baseURL,
}) => {
  const f = await approvedFixture(page, baseURL!);
  await page.goto(`/${base}/${f.input.request_id}`);
  await expect(
    page.getByRole("button", { name: "Apply approved grant", exact: true }),
  ).toHaveCount(0);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Apply approved grant", exact: true }),
  ).toBeEnabled();
  await page
    .getByLabel("Application reason", { exact: true })
    .fill("Install only the independently approved local synthetic grant.");
  await page
    .getByRole("button", { name: "Apply approved grant", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Access application saved" }),
  ).toContainText("exact approved grant was installed");
  await page
    .getByRole("button", { name: "Refresh request and history" })
    .click();
  await expect(page.locator("main .status-chip")).toHaveText("Applied");
  await expect(page.locator("main")).toContainText(
    "Applied does not mean current effective access",
  );
  await expect(page.locator("main")).toContainText("Apply · Version 3");
  const d = await browserFixtureCall(
    page,
    `${base}/${f.input.request_id}`,
    undefined,
    baseURL!,
  );
  expect(d.history).toHaveLength(3);
  expect(d.request.grant_snapshot.capability).toBe(f.input.capability);
  expect(new Date(d.request.grant_snapshot.valid_from).toISOString()).toBe(
    "2035-01-01T00:00:00.000Z",
  );
  await expect(
    page.getByRole("button", { name: "Apply approved grant", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "Inspect current person access", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Person access", exact: true }),
  ).toBeVisible();
  const grants = await browserFixtureCall(
    page,
    `admin/access/${subject}`,
    undefined,
    baseURL!,
  );
  expect(
    grants.grants.filter((g: { id: string }) => g.id === d.request.grant_id),
  ).toHaveLength(1);
});
test("AD-01 lost committed application response recovers the original after reload", async ({
  page,
  baseURL,
}) => {
  const f = await approvedFixture(page, baseURL!);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto(`/${base}/${f.input.request_id}`);
  await page
    .getByLabel("Application reason", { exact: true })
    .fill("Recover this exact synthetic application after a lost response.");
  let operationId = "",
    done!: () => void;
  const intercepted = new Promise<void>((resolve) => {
    done = resolve;
  });
  await page.route(
    `**/api/v1/${base}/${f.input.request_id}/apply`,
    async (route) => {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      const receipt = await response.json();
      operationId = receipt.operation_id;
      await route.abort("failed");
      done();
    },
  );
  await page
    .getByRole("button", { name: "Apply approved grant", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry unchanged action" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Apply approved grant", exact: true }),
  ).toBeDisabled();
  await intercepted;
  await page.unroute(`**/api/v1/${base}/${f.input.request_id}/apply`);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Open saved request", exact: true }),
  ).toHaveAttribute("href", `/${base}/${f.input.request_id}`);
  await expect(page.locator("main .status-chip")).toHaveText("Applied");
  const original = await browserFixtureCall(
    page,
    `${base}/operations/${operationId}`,
    undefined,
    baseURL!,
  );
  const d = await browserFixtureCall(
    page,
    `${base}/${f.input.request_id}`,
    undefined,
    baseURL!,
  );
  expect(original.state).toBe("Applied");
  expect(d.history).toHaveLength(3);
  expect(d.history[2].operation_id).toBe(operationId);
});
test("AD-01 stale application and denied command clear protected context", async ({
  page,
  baseURL,
}) => {
  const f = await approvedFixture(page, baseURL!);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto(`/${base}/${f.input.request_id}`);
  await page
    .getByLabel("Application reason", { exact: true })
    .fill("This tab still holds the previous approved request version.");
  await browserFixtureCall(
    page,
    `${base}/${f.input.request_id}/apply`,
    {
      schema_version: 1,
      operation_id: randomUUID(),
      expected_version: 2,
      reason: "A separate tab installed the same exact approved grant first.",
    },
    baseURL!,
  );
  await page
    .getByRole("button", { name: "Apply approved grant", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "exact Approved version",
  );
  await page
    .getByRole("button", { name: "Refresh request and history" })
    .click();
  await expect(page.locator("main .status-chip")).toHaveText("Applied");
  const g = await approvedFixture(page, baseURL!);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto(`/${base}/${g.input.request_id}`);
  await page
    .getByLabel("Application reason", { exact: true })
    .fill("Permission changes must hide this retained protected proposal.");
  await page.route(`**/api/v1/${base}/${g.input.request_id}/apply`, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Forbidden",
        message: "Application duty no longer held.",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Apply approved grant", exact: true })
    .click();
  await expect(page.locator("main")).toContainText(
    "Application duty no longer held",
  );
  await expect(
    page.getByLabel("Application reason", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(g.input.capability);
});

test("AD-01 requester withdraws both un-applied states and starts a fresh independently reviewed proposal", async ({
  page,
  baseURL,
}) => {
  for (const state of ["Submitted", "Approved"]) {
    const f =
      state === "Approved"
        ? await approvedFixture(page, baseURL!)
        : await fixture(page, baseURL!);
    if (state === "Submitted")
      await browserFixtureCall(page, base, f.input, baseURL!);
    await browserFixtureCall(
      page,
      "local-session",
      { profile: "scheduling-policy-reviewer" },
      baseURL!,
    );
    await page.goto(`/${base}/${f.input.request_id}`);
    await expect(
      page.getByRole("button", { name: "Withdraw request", exact: true }),
    ).toHaveCount(0);
    await browserFixtureCall(
      page,
      "local-session",
      { profile: "systems" },
      baseURL!,
    );
    await page.reload();
    if (state === "Approved") {
      await page
        .getByLabel("Application reason", { exact: true })
        .fill("This independent application reason must not be overwritten.");
      await page.getByLabel("Withdrawal reason", { exact: true }).fill("short");
      await page
        .getByRole("button", { name: "Withdraw request", exact: true })
        .click();
      await expect(
        page.getByLabel("Withdrawal reason", { exact: true }),
      ).toHaveAttribute("aria-invalid", "true");
      const notice = page.locator("main").getByRole("alert");
      await expect(notice).toBeFocused();
      await notice.locator('a[href="#withdrawal_reason"]').click();
      await expect(
        page.getByLabel("Withdrawal reason", { exact: true }),
      ).toBeFocused();
      await expect(
        page.getByLabel("Application reason", { exact: true }),
      ).toHaveAttribute("aria-invalid", "false");
      await expect(
        page.getByLabel("Application reason", { exact: true }),
      ).toHaveValue(
        "This independent application reason must not be overwritten.",
      );
    }
    await page
      .getByLabel("Withdrawal reason", { exact: true })
      .fill(
        "Close this obsolete proposal; a fresh independent decision is required.",
      );
    await page
      .getByRole("button", { name: "Withdraw request", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "Request withdrawal saved" }),
    ).toContainText("No grants changed");
    await page
      .getByRole("button", { name: "Refresh request and history" })
      .click();
    await expect(page.locator("main .status-chip")).toHaveText("Withdrawn");
    await expect(page.locator("main")).toContainText(
      `Withdraw · Version ${state === "Submitted" ? 2 : 3}`,
    );
    await expect(
      page.getByRole("button", { name: "Apply approved grant", exact: true }),
    ).toHaveCount(0);
    if (state === "Approved")
      await expect(page.locator("main")).toContainText(
        "Retained approval reason:",
      );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const grants = await browserFixtureCall(
      page,
      `admin/access/${subject}`,
      undefined,
      baseURL!,
    );
    expect(grants.grants).toEqual(f.grants);
    await page
      .getByRole("link", { name: "Create a fresh request", exact: true })
      .click();
    await fill(page, f.input.capability);
    await page
      .getByRole("button", { name: "Submit for independent review" })
      .click();
    const saved = page.getByRole("link", {
      name: "Open saved request",
      exact: true,
    });
    await expect(saved).toBeVisible();
    await expect(saved).not.toHaveAttribute(
      "href",
      `/${base}/${f.input.request_id}`,
    );
    await saved.click();
    await expect(page.locator("main .status-chip")).toHaveText("Submitted");
    await expect(page.locator("main")).toContainText("Version 1");
  }
});

test("AD-01 lost committed withdrawal response recovers the original after reload", async ({
  page,
  baseURL,
}) => {
  const f = await approvedFixture(page, baseURL!);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto(`/${base}/${f.input.request_id}`);
  await page
    .getByLabel("Withdrawal reason", { exact: true })
    .fill("Recover this exact closure after losing the committed response.");
  let operationId = "";
  await page.route(
    `**/api/v1/${base}/${f.input.request_id}/withdraw`,
    async (route) => {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      operationId = (await response.json()).operation_id;
      await route.abort("failed");
    },
  );
  await page
    .getByRole("button", { name: "Withdraw request", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry unchanged action" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Withdraw request", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Apply approved grant", exact: true }),
  ).toBeDisabled();
  await page.unroute(`**/api/v1/${base}/${f.input.request_id}/withdraw`);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Open saved request", exact: true }),
  ).toHaveAttribute("href", `/${base}/${f.input.request_id}`);
  await expect(page.locator("main .status-chip")).toHaveText("Withdrawn");
  const original = await browserFixtureCall(
    page,
    `${base}/operations/${operationId}`,
    undefined,
    baseURL!,
  );
  const d = await browserFixtureCall(
    page,
    `${base}/${f.input.request_id}`,
    undefined,
    baseURL!,
  );
  expect(original.state).toBe("Withdrawn");
  expect(d.history).toHaveLength(3);
  expect(d.history[2].operation_id).toBe(operationId);
});

test("AD-01 stale withdrawal cannot undo an application and denied closure hides protected context", async ({
  page,
  baseURL,
}) => {
  const f = await approvedFixture(page, baseURL!);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto(`/${base}/${f.input.request_id}`);
  await page
    .getByLabel("Withdrawal reason", { exact: true })
    .fill("This stale tab must not close a grant already installed elsewhere.");
  await browserFixtureCall(
    page,
    `${base}/${f.input.request_id}/apply`,
    {
      schema_version: 1,
      operation_id: randomUUID(),
      expected_version: 2,
      reason:
        "A separate tab installed the exact independently approved grant.",
    },
    baseURL!,
  );
  await page
    .getByRole("button", { name: "Withdraw request", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert").first()).toContainText(
    "exact un-applied",
  );
  await page
    .getByRole("button", { name: "Refresh request and history" })
    .click();
  await expect(page.locator("main .status-chip")).toHaveText("Applied");
  await expect(
    page.getByRole("button", { name: "Withdraw request", exact: true }),
  ).toHaveCount(0);
  const g = await approvedFixture(page, baseURL!);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto(`/${base}/${g.input.request_id}`);
  await page
    .getByLabel("Withdrawal reason", { exact: true })
    .fill("A refused command must hide the retained protected proposal.");
  await page.route(
    `**/api/v1/${base}/${g.input.request_id}/withdraw`,
    (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          code: "Forbidden",
          message: "Submission duty no longer held.",
        }),
      }),
  );
  await page
    .getByRole("button", { name: "Withdraw request", exact: true })
    .click();
  await expect(page.locator("main")).toContainText(
    "Submission duty no longer held",
  );
  await expect(
    page.getByLabel("Withdrawal reason", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(g.input.capability);
});
