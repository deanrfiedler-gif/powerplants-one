import { test, expect, type Page } from "@playwright/test";
import {
  httpFixture,
  detail,
  json,
  releasePath,
  prepare,
  approve,
  envelope,
} from "../helpers/quotation-release-http";
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
async function rationale(page: Page, text: string) {
  await page.getByLabel("Release rationale or simulation evidence").fill(text);
  await page
    .getByLabel("Demonstration policy acknowledgement")
    .selectOption("yes");
}
async function saved(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Open saved release" }).click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Immutable release history" }),
  ).toBeVisible();
}

test("ES05 desktop/mobile journey recovers lost preparation then independently approves, issues and resolves unknown distribution", async ({
  page,
}, info) => {
  const f = await httpFixture();
  await identity(page);
  await page.goto(`/estimating/quotes/${f.draft.id}`);
  await page
    .getByRole("link", { name: "Open controlled quotation release" })
    .click();
  await rationale(page, "SYN explicit release preparation");
  let sends = 0;
  await page.route(
    `**/api/v1/${releasePath(f.draft.id)}/prepare`,
    async (route) => {
      sends++;
      const r = await route.fetch();
      expect(r.ok()).toBe(true);
      await route.abort("failed");
    },
  );
  await page
    .getByRole("button", { name: "Prepare synthetic release successor" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await saved(page);
  expect(sends).toBe(1);
  const id = page.url().match(/quotes\/([^/]+)/)![1];
  await page.unrouteAll({ behavior: "wait" });
  await page
    .getByRole("button", { name: "Generate or recover exact output" })
    .click();
  await expect(page.getByRole("link", { name: "Open exact PDF" })).toBeVisible({
    timeout: 30000,
  });
  await identity(page, "quotation-approver");
  await page.goto("/" + releasePath(id));
  await rationale(page, "SYN independently inspected exact synthetic output");
  await page
    .getByRole("button", { name: "Record exact approval decision" })
    .click();
  await saved(page);
  await identity(page, "quotation-issuer");
  await page.goto("/" + releasePath(id));
  await rationale(page, "SYN separate issuer verifies exact approved document");
  await page
    .getByRole("button", { name: "Issue exact synthetic document" })
    .click();
  await saved(page);
  await rationale(page, "SYN simulation acknowledgement uncertain");
  await page
    .getByRole("button", { name: "Record distribution simulation" })
    .click();
  await saved(page);
  const before = await detail(f.issuer, id);
  expect(before.events.at(-1)!.outcome).toBe("Unknown");
  await rationale(
    page,
    "SYN original simulation result reconciled; no customer send",
  );
  await page
    .getByLabel("Recorded simulation outcome")
    .selectOption("SimulatedDelivered");
  await page
    .getByRole("button", { name: "Record original simulation resolution" })
    .click();
  await saved(page);
  const d = await detail(f.issuer, id);
  expect(d.events.at(-1)!.attempt_id).toBe(before.events.at(-1)!.attempt_id);
  expect(d.events.at(-2)!.outcome).toBe("Unknown");
  expect(d.events.at(-1)!.outcome).toBe("SimulatedDelivered");
  expect(d.issue!.output_hash).toBe(d.approval!.output_hash);
  await page.screenshot({
    path: info.outputPath("issued-overview.png"),
    fullPage: false,
  });
  await page
    .getByRole("heading", { name: "Immutable release history" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("issued-history.png"),
    fullPage: false,
  });
});

test("ES05 uncertain approval keeps the exact command across reload and retry without a second decision", async ({
  page,
}) => {
  const f = await httpFixture(),
    p = prepare(await detail(f.owner, f.draft.id));
  await json(f.owner, releasePath(f.draft.id) + "/prepare", p);
  await json(f.owner, `estimating/quotes/${p.id}/render`, {});
  await identity(page, "quotation-approver");
  await page.goto("/" + releasePath(p.id));
  await rationale(page, "SYN retained exact approval");
  const operations: string[] = [];
  await page.route(`**/api/v1/${releasePath(p.id)}/approval`, async (route) => {
    operations.push(route.request().postDataJSON().operation_id);
    const r = await route.fetch();
    expect(r.ok()).toBe(true);
    if (operations.length === 1) await route.abort("failed");
    else await route.fulfill({ response: r });
  });
  await page.route("**/api/v1/operations/*", (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: "Original temporarily unavailable" }),
    }),
  );
  await page
    .getByRole("button", { name: "Record exact approval decision" })
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
    page.locator(".quotation-release .business-error"),
  ).toContainText("still unknown");
  await expect(
    page.getByRole("button", { name: "Prepare synthetic release successor" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Retry exact original" }).click();
  await saved(page);
  expect(operations).toHaveLength(2);
  expect(operations[0]).toBe(operations[1]);
  expect(
    (await detail(f.approver, p.id)).events.filter(
      (e) => e.action === "Approval",
    ),
  ).toHaveLength(1);
});

test("ES05 stale release fields stay visible, 320px evidence fits and denied reads clear saved content", async ({
  page,
}, info) => {
  const f = await httpFixture(),
    p = prepare(await detail(f.owner, f.draft.id));
  await json(f.owner, releasePath(f.draft.id) + "/prepare", p);
  await json(f.owner, `estimating/quotes/${p.id}/render`, {});
  await identity(page, "quotation-approver");
  await page.goto("/" + releasePath(p.id));
  await rationale(page, "SYN retained rationale after other decision");
  await json(
    f.approver,
    releasePath(p.id) + "/approval",
    approve(await detail(f.approver, p.id)),
  );
  await page
    .getByRole("button", { name: "Refresh current release evidence" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Release basis changed" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Release rationale or simulation evidence"),
  ).toHaveValue("SYN retained rationale after other decision");
  await expect(
    page.getByLabel("Release rationale or simulation evidence"),
  ).toBeDisabled();
  // Owner retains a preparation form across the same event-sequence change.
  await identity(page);
  await page.goto("/" + releasePath(p.id));
  await rationale(page, "SYN successor rationale retained");
  const before = await detail(f.owner, p.id),
    successor = { ...prepare(before), ...envelope(before) };
  await json(f.owner, releasePath(p.id) + "/prepare", successor);
  await page
    .getByRole("button", { name: "Refresh current release evidence" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Release basis changed" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Release rationale or simulation evidence"),
  ).toHaveValue("SYN successor rationale retained");
  for (const width of [1024, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await page
    .getByText("Exact source, recipient, terms and template", { exact: true })
    .click();
  await page.screenshot({
    path: info.outputPath("release-320.png"),
    fullPage: false,
  });
  await page.route(`**/api/v1/${releasePath(p.id)}`, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ message: "SYN release authority revoked" }),
    }),
  );
  await page
    .getByRole("button", { name: "Refresh current release evidence" })
    .click();
  await expect(
    page.locator(".quotation-release .business-error"),
  ).toContainText("SYN release authority revoked");
  await expect(
    page.getByRole("heading", { name: "Immutable release history" }),
  ).toHaveCount(0);
  await expect(page.getByText(f.input.title, { exact: true })).toHaveCount(0);
});
