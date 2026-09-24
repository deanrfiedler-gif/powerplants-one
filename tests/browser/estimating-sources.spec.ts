import { test, expect, type Page } from "@playwright/test";
import { sourceInput } from "../helpers/estimating-sources";
import { crmBase, crmCreate } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";

test.describe.configure({ timeout: 120000 });
async function identity(page: Page, profile = "coordinator") {
  await page.goto("/");
  const r = await page.request.post("/api/v1/local-session", {
    headers: { Origin: new URL(page.url()).origin },
    data: { profile },
  });
  expect(r.ok()).toBe(true);
}
async function post(page: Page, path: string, data: unknown) {
  const r = await page.request.post(`/api/v1/${path}`, {
    headers: { Origin: new URL(page.url()).origin },
    data,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function source(page: Page) {
  const input = sourceInput();
  await post(page, "estimating/cost-sources", input);
  const d = await (
    await page.request.get(`/api/v1/estimating/cost-sources/${input.id}`)
  ).json();
  return { input, d };
}
test("ES03 native authoring recovers the original lost response and independently reviews exact evidence", async ({
  page,
}, info) => {
  await identity(page);
  const input = sourceInput();
  await page.goto("/estimating/cost-sources/new");
  await page
    .getByRole("textbox", { name: "Local synthetic reference" })
    .fill(input.reference);
  for (const [label, value] of [
    ["Source title", input.content.title],
    ["Supplier label", input.content.supplier_label],
    ["Item reference", input.content.item_reference],
    ["Unit", input.content.unit],
    ["Source date", input.content.source_date],
    ["Effective from", input.content.effective_from],
    ["Evidence reference", input.content.evidence_reference],
    ["Authored synthetic evidence", input.content.evidence_excerpt],
    ["Minimum quantity 1", "1"],
    ["Unit cost AUD 1", "100"],
    ["Reason for this source version", "Authored synthetic native proof"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  const guide = page.getByRole("button", { name: "Page guide", exact: true });
  await guide.click();
  await expect(
    page.getByRole("heading", {
      name: "Evidence, source review and saved costs",
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toBeFocused();
  await expect(page.getByLabel("Source title", { exact: true })).toHaveValue(
    input.content.title,
  );
  let sent = 0,
    operation = "",
    record = "";
  await page.route("**/api/v1/estimating/cost-sources", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sent++;
    const body = route.request().postDataJSON();
    operation = body.operation_id;
    record = body.id;
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Save synthetic source", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("source-recovery.png"),
    fullPage: true,
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  expect(sent).toBe(1);
  const journal = await page.evaluate(() =>
    sessionStorage.getItem("ppo:es03:create:accepted"),
  );
  expect(journal).toContain(operation);
  expect(journal).not.toContain(input.content.evidence_excerpt);
  await page.getByRole("button", { name: "Open saved record" }).click();
  await expect(page).toHaveURL(new RegExp(`/cost-sources/${record}$`));
  await expect(
    page.getByRole("heading", { name: "Exact source revision 1" }),
  ).toBeVisible();
  await page
    .getByLabel("Review or submission rationale", { exact: true })
    .fill("Submit fictional source evidence");
  await page
    .getByRole("button", { name: "Submit exact source evidence" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open saved record" }).click();
  await expect(page.getByText(/current source Submitted/)).toBeVisible();
  await identity(page, "estimating-source-reviewer");
  await page.goto(`/estimating/cost-sources/${record}`);
  await expect(
    page.getByRole("heading", { name: "Independent evidence review" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Prepare source successor" }),
  ).toHaveCount(0);
  await page
    .getByLabel("Review or submission rationale", { exact: true })
    .fill("Independent synthetic evidence check only");
  await page.getByRole("button", { name: "Record evidence decision" }).click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open saved record" }).click();
  await expect(page.getByText(/current source Reviewed/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("source-reviewed.png"),
    fullPage: true,
  });
});
test("ES03 exact comparison keeps sell unchanged and requires a deliberate estimate successor", async ({
  page,
}, info) => {
  await identity(page);
  const { input, d } = await source(page),
    opportunity = crmCreate(),
    estimate = estimateInput(opportunity.id);
  await post(page, "crm/opportunities", opportunity);
  await post(page, "estimating/estimates", estimate);
  const old = await (
    await page.request.get(`/api/v1/estimating/estimates/${estimate.id}`)
  ).json();
  await post(page, `estimating/cost-sources/${input.id}/review`, {
    ...crmBase(),
    expected_version: 1,
    revision_id: d.revision.id,
    action: "Submit",
  });
  await identity(page, "estimating-source-reviewer");
  await post(page, `estimating/cost-sources/${input.id}/review`, {
    ...crmBase(),
    expected_version: 2,
    revision_id: d.revision.id,
    action: "Reviewed",
  });
  await identity(page);
  await page.goto(
    `/estimating/estimates/${estimate.id}/sources?version_id=${old.saved.id}`,
  );
  await page
    .getByLabel("Explicit pricing date", { exact: true })
    .fill("2026-09-24");
  await page
    .getByRole("combobox", { name: "Reviewed source for line 1", exact: true })
    .selectOption(`${input.id}:${d.revision.id}`);
  await page
    .getByRole("button", { name: "Compare selected source costs", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review the successor cost basis" }),
  ).toBeVisible();
  await expect(page.getByText(/change AUD -40.00/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save reviewed estimate successor" }),
  ).toBeDisabled();
  await page.screenshot({
    path: info.outputPath("source-comparison.png"),
    fullPage: true,
  });
  await page
    .getByRole("heading", { name: "Review the successor cost basis" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("source-comparison-review.png"),
    fullPage: true,
  });
  await page
    .getByRole("checkbox", { name: /I reviewed every changed line/ })
    .check();
  await page
    .getByLabel("Reason for the estimate successor", { exact: true })
    .fill("Deliberately adopt exact reviewed source");
  await page
    .getByRole("button", { name: "Save reviewed estimate successor" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  const saved = await (
    await page.request.get(`/api/v1/estimating/estimates/${estimate.id}`)
  ).json();
  expect(saved.version).toBe(2);
  expect(saved.saved.lines[0].unit_sell).toBe(old.saved.lines[0].unit_sell);
  await page.getByRole("button", { name: "Open saved record" }).click();
  await page.goto(
    `/estimating/estimates/${estimate.id}/sources?version_id=${old.saved.id}`,
  );
  await expect(
    page.getByText(/This saved basis is historical, changed or read-only/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Compare selected source costs",
      exact: true,
    }),
  ).toBeDisabled();
});
test("ES03 register history, stale draft, failed read and denied evidence remain explicit", async ({
  page,
}, info) => {
  await identity(page);
  const { input } = await source(page);
  await page.goto(`/estimating/cost-sources?q=${input.reference}`);
  await expect(
    page.getByRole("link", { name: input.content.title, exact: true }),
  ).toBeVisible();
  const search = page.getByRole("searchbox");
  await search.fill("SYN-No-such-source");
  await search.press("Enter");
  await expect(
    page.getByRole("heading", { name: "No sources match these filters" }),
  ).toBeVisible();
  await page.goBack();
  await expect(search).toHaveValue(input.reference);
  await page.goForward();
  await expect(page.getByRole("heading", {name:"No sources match these filters"})).toBeVisible();
  await page.goBack();
  await page.reload();
  await expect(
    page.getByRole("link", { name: input.content.title, exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("source-register.png"),
    fullPage: true,
  });
  if (info.project.name.includes("mobile")) {
    await page.setViewportSize({ width: 320, height: 844 });
    await search.focus();
    await expect(search).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("source-register-320.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
  } else {
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await search.focus();
    await expect(search).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const heading = await page
      .locator(".ppo-shell-header .product-heading")
      .boundingBox();
    const centre = await page
      .locator(".ppo-shell-header .ppo-header-centre")
      .boundingBox();
    expect(heading).not.toBeNull();
    expect(centre).not.toBeNull();
    expect(heading!.x + heading!.width).toBeLessThanOrEqual(centre!.x + 1);
    await page.screenshot({
      path: info.outputPath("source-register-200-percent.png"),
      fullPage: true,
    });
    await page.evaluate(() => {
      document.documentElement.style.zoom = "";
    });
  }
  await page
    .getByRole("link", { name: input.content.title, exact: true })
    .click();
  await page.getByRole("button", { name: "Prepare source successor" }).click();
  await page
    .getByLabel("Source title", { exact: true })
    .fill("SYN my unsaved title");
  await post(page, `estimating/cost-sources/${input.id}`, {
    ...crmBase(),
    expected_version: 1,
    content: { ...input.content, title: "SYN another saved version" },
  });
  await page.evaluate(() => dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "The saved source changed" }),
  ).toBeVisible();
  await expect(page.getByLabel("Source title", { exact: true })).toHaveValue(
    "SYN my unsaved title",
  );
  await expect(
    page.getByRole("button", { name: "Save source successor" }),
  ).toBeDisabled();
  await page
    .getByRole("button", {
      name: "Replace my entries with current saved evidence",
    })
    .click();
  await expect(page.getByLabel("Source title", { exact: true })).toHaveValue(
    "SYN another saved version",
  );
  await page.getByRole("heading", {name:"Compare source revisions"}).scrollIntoViewIfNeeded();
  await page.screenshot({path:info.outputPath("source-revision-comparison.png"),fullPage:true});
  await page.route(`**/api/v1/estimating/cost-sources/${input.id}`, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Unavailable",
        message: "Synthetic source read failed",
      }),
    }),
  );
  await page.reload();
  await expect(page.getByText("Synthetic source read failed")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Exact source revision 2" }),
  ).toHaveCount(0);
  await page.unroute(`**/api/v1/estimating/cost-sources/${input.id}`);
  await page.getByRole("button", { name: "Try loading again" }).click();
  await expect(
    page.getByRole("heading", { name: "Exact source revision 2" }),
  ).toBeVisible();
  await identity(page, "second-company");
  await page.goto(`/estimating/cost-sources/${input.id}`);
  await expect(
    page.getByRole("button", { name: "Try loading again" }),
  ).toBeVisible();
  await expect(
    page.getByText(input.content.evidence_excerpt, { exact: true }),
  ).toHaveCount(0);
});
