import { test, expect, type Page } from "@playwright/test";
async function identity(page: Page, baseURL: string, profile: string) {
  const result = await page.request.post("/api/v1/local-session", {
    timeout: 120000,
    headers: { Origin: baseURL },
    data: { profile },
  });
  expect(result.ok()).toBeTruthy();
}
async function family(page: Page) {
  const response = await page.request.get("/api/v1/admin/policies", {
    timeout: 120000,
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}
test("AD-02 real per-area reads, record families and four-width capture proof", async ({
  page,
  baseURL,
}, info) => {
  await identity(page, baseURL!, "scheduling-policy-publisher");
  const data = await family(page),
    policy = data.items.find((r: { area: string }) => r.area === "Scheduling");
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/settings");
    if (width >= 1024) {
      await expect(
        page.locator('.settings-area-card[data-area="policies"]'),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("region", { name: "Business policies", exact: true }),
      ).toBeVisible();
      await expect(
        page.locator('.settings-area-card[data-area="policies"]'),
      ).toBeHidden();
    }
    await expect(
      page.locator(".settings-area-card").filter({ hasText: "Retention" }),
    ).toHaveCount(0);
    await expect(
      page.locator(".settings-area-card").filter({ hasText: "Templates" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`hub-${width}.png`),
      fullPage: true,
    });
    await page.goto("/admin/policies");
    await expect(
      page.getByRole("link", { name: policy.name, exact: true }),
    ).toBeVisible();
    await page.getByLabel("Find a policy").fill("no-match-ad02");
    await expect(
      page.getByText("No policies match", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Clear search", exact: true })
      .click();
    await page.screenshot({
      path: info.outputPath(`register-${width}.png`),
      fullPage: true,
    });
    await page.goto(`/admin/policies/${policy.id}`);
    await expect(
      page.getByRole("heading", { name: policy.name, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width >= 1024) {
      const facts = await page.locator(".shared-record-facts").boundingBox();
      const workspace = await page
        .locator(".shared-record-workspace")
        .boundingBox();
      expect(facts).toBeTruthy();
      expect(workspace).toBeTruthy();
      expect(workspace!.x).toBeGreaterThanOrEqual(facts!.x + facts!.width - 1);
    } else {
      await expect(page.locator(".shared-record-facts")).toBeHidden();
    }
    expect(
      await page
        .locator(".shared-record .ppo-register")
        .evaluateAll((nodes) =>
          nodes.every((el) => el.scrollWidth <= el.clientWidth + 1),
        ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`terms-${width}.png`),
      fullPage: true,
    });
  }
  await page.goto("/admin/policies?state=waiting-to-publish");
  await expect(
    page.getByText("No policies waiting to publish", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Show all policies", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Business policies", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/policies/record-references");
  await expect(
    page.getByRole("heading", {
      name: "Readable record references",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Propose change", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("references-1440.png"),
    fullPage: true,
  });
  const seed = data.items.find(
    (r: { area: string }) => r.area === "Working hours",
  );
  await page.goto(`/admin/policies/${seed.id}`);
  await expect(
    page.getByRole("heading", { name: seed.name, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Propose change", exact: true }),
  ).toHaveCount(0);
  await identity(page, baseURL!, "observer");
  await page.goto("/admin/settings");
  await expect(
    page.getByRole("heading", { name: "Configuration areas", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".settings-area-card")
      .filter({ hasText: "Business policies" }),
  ).toHaveCount(0);
  await page.goto(`/admin/policies/${policy.id}`);
  await expect(
    page.getByRole("heading", { name: policy.name, exact: true }),
  ).toHaveCount(0);
});
test("AD-02 clears failed and pending reads instead of retaining policy evidence", async ({
  page,
  baseURL,
}) => {
  await identity(page, baseURL!, "scheduling-policy-publisher");
  const data = await family(page),
    policy = data.items[0];
  await page.goto(`/admin/policies/${policy.id}`);
  await expect(
    page.getByRole("heading", { name: policy.name, exact: true }),
  ).toBeVisible();
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/v1/admin/policies/${policy.id}`, async (route) => {
    await held;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Unavailable",
        message: "Synthetic source failed",
      }),
    });
  });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: policy.name, exact: true }),
  ).toHaveCount(0);
  release();
  await expect(
    page.getByText("Synthetic source failed", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Propose change", exact: true }),
  ).toHaveCount(0);
});
test("AD-02 dialogs save an independent proposal and refuse stale publication", async ({
  page,
  baseURL,
}, info) => {
  await identity(page, baseURL!, "scheduling-policy-publisher");
  const data = await family(page),
    policy = data.items[0];
  await page.goto(`/admin/policies/${policy.id}`);
  await expect(
    page.getByRole("heading", { name: policy.name, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Propose change", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: /Propose version/ });
  await dialog
    .getByLabel("Maximum visit (minutes)", { exact: true })
    .fill("420");
  await dialog
    .getByLabel("Effective from · Brisbane time", { exact: true })
    .fill("2031-11-02T10:00");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN AD-02 browser proposal");
  await page.screenshot({
    path: info.outputPath("propose-dialog.png"),
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Save proposal", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("tab", { name: /proposal/ })).toBeVisible();
  await identity(page, baseURL!, "scheduling-policy-reviewer");
  await page.reload();
  await page.getByRole("tab", { name: /proposal/ }).click();
  await page
    .getByRole("button", { name: "Review proposal", exact: true })
    .click();
  const review = page.getByRole("dialog", {
    name: "Review proposal independently",
  });
  await review
    .getByLabel("Reason", { exact: true })
    .fill("SYN complete independent review");
  await review
    .getByRole("button", { name: "Save complete review", exact: true })
    .click();
  await expect(review).toHaveCount(0);
  await identity(page, baseURL!, "scheduling-policy-publisher");
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Publish version/ }).first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: /proposal/ }).click();
  await page.screenshot({
    path: info.outputPath("reviewed-proposal.png"),
    fullPage: true,
  });
  const current = await (
    await page.request.get(`/api/v1/admin/policies/${policy.id}`)
  ).json();
  const p = current.evidence.proposal;
  const replacement = await page.request.post(
    "/api/v1/schedule/policy-proposals",
    {
      headers: { Origin: baseURL! },
      data: {
        operation_id: crypto.randomUUID(),
        schema_version: 1,
        id: crypto.randomUUID(),
        source: current.item.chain.head.policy,
        expected_head_version: current.item.chain.head.version,
        predecessor_proposal: {
          id: p.id,
          version: p.version,
          content_hash: p.content_hash,
        },
        max_visit_minutes: 420,
        effective_from: "2031-11-09T00:00:00.000Z",
        reason: "SYN source changes after the read",
      },
    },
  );
  expect(replacement.ok()).toBeTruthy();
  await page
    .getByRole("button", { name: /Publish version/ })
    .first()
    .click();
  const publish = page.getByRole("dialog", { name: /Publish version/ });
  await page.screenshot({
    path: info.outputPath("publish-dialog.png"),
    fullPage: true,
  });
  await publish.getByRole("button", { name: /Publish version/ }).click();
  await expect(publish.getByText(/newer immutable revision/i)).toBeVisible();
  await page.screenshot({
    path: info.outputPath("publish-refused.png"),
    fullPage: true,
  });
  const after = await family(page);
  expect(after.items[0].chain.head.version).toBe(
    data.items[0].chain.head.version,
  );
  await publish.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.reload();
  await page.getByRole("tab", { name: /proposal/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Review out of date · reference only",
      exact: true,
    }),
  ).toBeVisible();
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`revision-refused-${width}.png`),
      fullPage: true,
    });
  }
});

test("AD-02 recovers a committed publication after its response is lost without publishing twice", async ({
  page,
  baseURL,
}, info) => {
  await identity(page, baseURL!, "scheduling-policy-publisher");
  const data = await family(page),
    policy = data.items[0];
  const proposed = await page.request.post(
    "/api/v1/schedule/policy-proposals",
    {
      headers: { Origin: baseURL! },
      data: {
        operation_id: crypto.randomUUID(),
        schema_version: 1,
        id: crypto.randomUUID(),
        source: policy.chain.head.policy,
        expected_head_version: policy.chain.head.version,
        predecessor_proposal: null,
        max_visit_minutes: 60,
        effective_from: "2031-09-22T00:00:00.000Z",
        reason: "SYN independent browser recovery fixture",
      },
    },
  );
  expect(proposed.status(), await proposed.text()).toBe(201);
  await identity(page, baseURL!, "scheduling-policy-reviewer");
  await page.goto(`/admin/policies/${policy.id}`);
  const proposalTab = page.getByRole("tab", { name: /proposal/ });
  const retryRead = page.getByRole("button", {
    name: "Retry loading",
    exact: true,
  });
  await expect(proposalTab.or(retryRead)).toBeVisible();
  if (await retryRead.isVisible()) await retryRead.click();
  await proposalTab.click();
  await page
    .getByRole("button", { name: "Review proposal", exact: true })
    .click();
  const review = page.getByRole("dialog", {
    name: "Review proposal independently",
  });
  await review
    .getByLabel("Reason", { exact: true })
    .fill("SYN independent latest revision review");
  await review
    .getByRole("button", { name: "Save complete review", exact: true })
    .click();
  await expect(review).toHaveCount(0);
  await identity(page, baseURL!, "scheduling-policy-publisher");
  await page.reload();
  await page.getByRole("tab", { name: /proposal/ }).click();
  await expect(
    page.locator('a[href^="/service/appointments/"]'),
  ).not.toHaveCount(0);
  for (const width of [1440, 1024, 390, 320]) {
    if (width === 390)
      await page.getByRole("tab", { name: "Terms", exact: true }).click();
    await page.setViewportSize({ width, height: 1000 });
    await expect(
      page.getByRole("button", { name: /Publish version/ }).last(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`waiting-publish-${width}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  let accepted: { record_id: string } | undefined;
  await page.route(
    "**/api/v1/schedule/policy-publications",
    async (route) => {
      const response = await route.fetch();
      expect(response.status(), await response.text()).toBe(201);
      accepted = await response.json();
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page
    .getByRole("button", { name: /Publish version/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: /Publish version/ });
  await dialog.getByRole("button", { name: /Publish version/ }).click();
  await expect(dialog.getByText(/outcome is unknown/i)).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Outcome not yet confirmed",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("uncertain-publication.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Check original receipt", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Outcome not yet confirmed",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Policy publication saved by the server.", { exact: false }),
  ).toBeVisible();
  expect(accepted?.record_id).toBeTruthy();
  const after = await family(page);
  expect(after.items[0].chain.head.version).toBe(
    data.items[0].chain.head.version + 1,
  );
  await page.screenshot({
    path: info.outputPath("recovered-publication.png"),
    fullPage: true,
  });
});
