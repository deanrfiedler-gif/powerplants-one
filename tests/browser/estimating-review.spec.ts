import { test, expect, type Page } from "@playwright/test";
import { crmCreate, crmBase } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";
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
async function post(page: Page, path: string, data: unknown) {
  const r = await page.request.post(`/api/v1/${path}`, {
    headers: { Origin: new URL(page.url()).origin },
    data,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function fixture(page: Page) {
  await identity(page);
  const o = crmCreate();
  await post(page, "crm/opportunities", o);
  const input = estimateInput(o.id);
  await post(page, "estimating/estimates", input);
  return input;
}
const detail = async (page: Page, id: string) =>
  (await page.request.get(`/api/v1/estimating/estimates/${id}/review`)).json();
const submit = (d: Awaited<ReturnType<typeof detail>>) => ({
  ...crmBase(),
  estimate_version_id: d.saved.id,
  basis_hash: d.basis_hash,
  expected_version: d.estimate.version,
  expected_review_version: d.sequence,
  responses: [],
});
test("ES04 exact submission recovers a lost response then retains returned findings through correction and independent review", async ({
  page,
}, info) => {
  const input = await fixture(page),
    path = `estimating/estimates/${input.id}/review`;
  await page.goto(`/estimating/estimates/${input.id}`);
  await page.getByRole("link", { name: "Review exact saved estimate" }).click();
  await page
    .getByLabel("Submission or review rationale")
    .fill("SYN Submit exact saved estimate");
  let sends = 0;
  await page.route(`**/api/v1/${path}`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sends++;
    const r = await route.fetch();
    expect(r.status()).toBe(200);
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Submit exact saved revision" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  expect(sends).toBe(1);
  await page.unroute(`**/api/v1/${path}`);
  await page.getByRole("button", { name: "Open saved review" }).click();
  expect((await detail(page, input.id)).submissions).toHaveLength(1);
  await identity(page, "estimating-source-reviewer");
  await page.goto(`/${path}`);
  await page
    .getByLabel("Submission or review rationale")
    .fill("SYN return incomplete scope statement");
  await page.getByLabel("Review outcome").selectOption("Returned");
  await page
    .getByLabel("Finding requiring correction")
    .fill("State the commissioning scope explicitly");
  await page
    .getByRole("button", { name: "Record exact review decision" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open saved review" }).click();
  await identity(page);
  const original = await detail(page, input.id);
  await post(page, `estimating/estimates/${input.id}`, {
    ...crmBase(),
    expected_version: 1,
    title: input.title,
    scope: {
      ...input.scope,
      included: "SYN Controls supply and commissioning included",
    },
    lines: input.lines,
    policy: input.policy,
  });
  await page.goto(`/${path}`);
  await page
    .getByLabel("Submission or review rationale")
    .fill("SYN corrected scope resubmission");
  await page
    .getByLabel(/^Response to finding /)
    .fill("Saved the explicit commissioning scope in version 2");
  await page
    .getByRole("button", { name: "Submit exact saved revision" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open saved review" }).click();
  await identity(page, "estimating-source-reviewer");
  await page.goto(`/${path}`);
  for (const kind of ["Completeness", "SourcePrice", "Technical"]) {
    await page.getByLabel("Review kind").selectOption(kind);
    await page
      .getByLabel("Submission or review rationale")
      .fill(`SYN ${kind} checked exact correction`);
    await page
      .getByRole("button", { name: "Record exact review decision" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Saved to the server" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Open saved review" }).click();
  }
  await expect(
    page.getByText("Commercial approval: Not configured.", { exact: true }),
  ).toBeVisible();
  const final = await detail(page, input.id);
  expect(final.outcome).toBe("Reviewed");
  expect(final.submissions).toHaveLength(2);
  expect(final.decisions[0].outcome).toBe("Returned");
  await page.screenshot({
    path: info.outputPath("reviewed-history.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Open exact submitted estimate" })
    .first()
    .click();
  await expect(
    page.getByText(/Viewing saved version 1 · Current version 2/),
  ).toBeVisible();
  expect(original.saved.id).not.toBe(final.saved.id);
});
test("ES04 stale proposals retain fields and denied reads remove evidence at narrow widths", async ({
  page,
}, info) => {
  const input = await fixture(page),
    path = `estimating/estimates/${input.id}/review`;
  await page.goto(`/${path}`);
  await page
    .getByLabel("Submission or review rationale")
    .fill("SYN retained rationale after concurrent change");
  await post(page, `estimating/estimates/${input.id}`, {
    ...crmBase(),
    expected_version: 1,
    title: input.title,
    scope: input.scope,
    lines: input.lines.map((l) => ({ ...l, unit_sell: "250" })),
    policy: input.policy,
  });
  await page.getByRole("button", { name: "Refresh current evidence" }).click();
  await expect(
    page.getByRole("heading", { name: "Saved basis changed" }),
  ).toBeVisible();
  await expect(page.getByLabel("Submission or review rationale")).toHaveValue(
    "SYN retained rationale after concurrent change",
  );
  await expect(
    page.getByRole("button", { name: "Submit exact saved revision" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Use current review basis" }).click();
  await page
    .getByRole("button", { name: "Submit exact saved revision" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open saved review" }).click();
  for (const width of [1024, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("heading", {
        name: "Immutable submission and decision history",
      }),
    ).toBeVisible();
  }
  await page.screenshot({
    path: info.outputPath("review-320.png"),
    fullPage: true,
  });
  await page.route(`**/api/v1/${path}`, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ message: "SYN permission revoked" }),
    }),
  );
  await page.getByRole("button", { name: "Refresh current evidence" }).click();
  await expect(page.locator(".estimate-review .business-error")).toContainText(
    "SYN permission revoked",
  );
  await expect(page.getByLabel("Submission or review rationale")).toHaveCount(
    0,
  );
  await expect(page.getByText(input.title, { exact: true })).toHaveCount(0);
});
test("ES04 unknown decision receipt holds replacement until exact retry recovers one original", async ({
  page,
}) => {
  const input = await fixture(page),
    path = `estimating/estimates/${input.id}/review`;
  await post(page, path, submit(await detail(page, input.id)));
  await identity(page, "estimating-source-reviewer");
  await page.goto(`/${path}`);
  await page
    .getByLabel("Submission or review rationale")
    .fill("SYN independently checked original");
  const operations: string[] = [];
  await page.route(`**/api/v1/${path}/decision`, async (route) => {
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
    .getByRole("button", { name: "Record exact review decision" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await expect(page.locator(".estimate-review .business-error")).toContainText(
    "still unknown",
  );
  await expect(
    page.getByLabel("Submission or review rationale"),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Retry exact original" }).click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  expect(operations).toHaveLength(2);
  expect(operations[0]).toBe(operations[1]);
  expect((await detail(page, input.id)).decisions).toHaveLength(1);
});
