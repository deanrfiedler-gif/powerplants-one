import { test, expect, type Page } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const C = {
  company: "20000000-0000-4000-8000-000000000001",
  site: "70000000-0000-4000-8000-000000000001",
  customer: "50000000-0000-4000-8000-000000000001",
  asset: "80000000-0000-4000-8000-000000000001",
  owner: "30000000-0000-4000-8000-000000000001",
  finance: "30000000-0000-4000-8000-000000000012",
};
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN MA browser proof",
});
const source = () => ({
  reference: "SYN-BROWSER-SOURCE",
  revision: "1",
  availability: "Available",
  source_date: "2026-01-01",
  content: "SYN exact contract evidence; no business policy",
  access_class: "RestrictedService",
});
async function login(page: Page, origin: string, profile = "coordinator") {
  const r = await page.request.post(origin + "/api/v1/local-session", {
    headers: { origin },
    data: { profile },
  });
  expect(r.status()).toBe(200);
}
async function post(page: Page, origin: string, path: string, data: unknown) {
  const r = await page.request.post(origin + "/api/v1/" + path, {
    headers: { origin },
    data,
  });
  expect([200, 201], await r.text()).toContain(r.status());
  return r.json();
}
async function read(page: Page, path: string) {
  const r = await page.request.get("/api/v1/" + path);
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}
async function fixtures(page: Page, origin: string) {
  const ag = randomUUID(),
    pl = randomUUID(),
    en = randomUUID(),
    ren = randomUUID(),
    war = randomUUID(),
    claim = randomUUID(),
    ent = randomUUID();
  const ui = JSON.parse(
    await readFile("docs/design/development/maintenance-fixtures.json", "utf8"),
  );
  await post(page, origin, "maintenance/agreements", {
    ...base(),
    id: ag,
    company_id: C.company,
    customer_id: C.customer,
    owner_id: C.owner,
    content: {
      title: ui.long_title,
      effective_from: "2026-01-01",
      effective_to: "2028-12-31",
      service_scope: "SYN visual scope",
      exclusions: "No invasive work",
      response_terms: null,
      charging_basis: "Independent Finance review",
      billing_owner_id: C.finance,
      responsibilities: "Source-owned review",
      source: source(),
      sites: [
        {
          site_id: C.site,
          mode: "WholeSite",
          facility_ids: [],
          asset_ids: [C.asset],
          excluded_facility_ids: [],
          excluded_asset_ids: [],
        },
      ],
    },
  });
  await login(page, origin, "finance-reviewer");
  await post(page, origin, `maintenance/agreements/${ag}`, {
    ...base(),
    expected_version: 1,
    action: "Approve",
    authority_reference: "SYN separate commercial approval",
  });
  await login(page, origin);
  const agreement = await read(page, `maintenance/agreements/${ag}`),
    rev = agreement.row.current_revision_id;
  const assessment = {
    status: "Covered",
    basis: "SYN available source reviewed",
    cause: "Cause assessed separately",
    owner_id: C.owner,
    review_due: "2026-10-01",
    next_action: "Owned review",
    event_date: "2026-01-31",
    agreement_revision_id: rev,
    facility_id: null,
  };
  await post(page, origin, "maintenance/coverage", {
    ...base(),
    id: en,
    company_id: C.company,
    site_id: C.site,
    customer_id: C.customer,
    asset_id: C.asset,
    assessment,
  });
  await post(page, origin, "maintenance/plans", {
    ...base(),
    id: pl,
    company_id: C.company,
    site_id: C.site,
    customer_id: C.customer,
    asset_id: C.asset,
    owner_id: C.owner,
    content: {
      title: "SYN reviewed calendar plan",
      agreement_revision_id: rev,
      task_set_reference: "SYN-TASK",
      task_set_revision: "1",
      interval: "Monthly",
      interval_source: source(),
      anchor: "2026-01-31",
      timezone: "Australia/Sydney",
      window_months: 3,
      tolerance: null,
      effective_from: "2026-01-01",
      tasks: [
        {
          id: randomUUID(),
          description: "SYN exact visual task",
          expected_outcome: "Retain observation",
          completion_requirements: "Reviewed source evidence",
          kind: "Inspection",
        },
      ],
    },
  });
  await post(page, origin, `maintenance/plans/${pl}`, {
    ...base(),
    expected_version: 1,
    action: "Review",
  });
  await post(page, origin, `maintenance/plans/${pl}`, {
    ...base(),
    expected_version: 2,
    action: "Generate",
    from: "2026-01-01",
    until: "2026-03-31",
  });
  const plan = await read(page, `maintenance/plans/${pl}`),
    due = plan.history.find((e: { action: string }) => e.action === "Generated")
      .content.created[0];
  await post(page, origin, "maintenance/renewals", {
    ...base(),
    id: ren,
    agreement_revision_id: rev,
    site_id: C.site,
    owner_id: C.owner,
    review_from: "2028-09-01",
    next_date: "2028-09-15",
    next_action: "SYN relationship and Service review",
  });
  await post(page, origin, "warranty/cases", {
    ...base(),
    id: war,
    company_id: C.company,
    site_id: C.site,
    customer_id: C.customer,
    asset_id: C.asset,
    owner_id: C.owner,
    event_date: "2026-09-01",
    symptoms: "SYN intermittent indication with retained equipment identity",
    source: source(),
    next_review: "2026-10-01",
    next_action: "Review cause and exact evidence",
  });
  await post(page, origin, `warranty/cases/${war}`, {
    ...base(),
    expected_version: 1,
    action: "ReviewEvidence",
    data: { basis: "SYN complete evidence review" },
  });
  await post(page, origin, "maintenance/coverage", {
    ...base(),
    id: ent,
    company_id: C.company,
    site_id: C.site,
    customer_id: C.customer,
    asset_id: C.asset,
    warranty_case_id: war,
    expected_case_version: 2,
    assessment: {
      ...assessment,
      event_date: "2026-09-01",
      agreement_revision_id: null,
    },
  });
  await post(page, origin, "warranty/supplier-recovery", {
    ...base(),
    id: claim,
    case_id: war,
    expected_case_version: 3,
    assessment_id: ent,
    supplier_id: C.customer,
    scope: "SYN exact supplier package",
    claimed_minor: 10000,
    currency: "AUD",
    tax_basis: "ExcludingTax",
    owner_id: C.owner,
    due_date: "2026-10-15",
  });
  return {
    paths: [
      [`maintenance/agreements`, ag],
      [`maintenance/coverage`, en],
      [`maintenance/plans`, pl],
      [`maintenance/due`, due],
      [`maintenance/renewals`, ren],
      [`warranty/cases`, war],
      [`warranty/supplier-recovery`, claim],
    ],
    war,
    ag,
    pl,
    due,
  };
}
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
test.beforeEach(async ({ page, baseURL }) => login(page, baseURL!));
test("all fourteen native routes expose their exact guide and preserve shell focus", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(240000);
  const f = await fixtures(page, baseURL!);
  for (const [path, id] of f.paths)
    for (const tail of ["", `/${id}`]) {
      await page.goto(`/${path}${tail}`);
      await expect(page.locator(".ma-workspace")).toBeVisible();
      await expect(
        page.locator(".ma-context, .ma-snapshot").first(),
      ).toBeVisible();
      const opener = page.getByRole("button", {
          name: "Page guide",
          exact: true,
        }),
        response = page.waitForResponse((r) =>
          r.url().includes("/api/development/catalog?pathname="),
        );
      await opener.click();
      const body = await (await response).json();
      expect(body.guide_key).toBe(
        "guide.route-" + path.replaceAll("/", "-") + (tail ? "-id" : ""),
      );
      await page
        .getByText("Development draft guide for this page", { exact: true })
        .click();
      await expect(page.locator(".ppo-development-guide")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(opener).toBeFocused();
    }
});
test("native reviewed forms preserve draft through guidance and recover a lost accepted response", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(120000);
  const f = await fixtures(page, baseURL!);
  await page.goto(`/warranty/cases/${f.war}`);
  const action = page
    .locator("details.ma-action")
    .filter({
      has: page.locator("summary", { hasText: "Assign next case review" }),
    });
  await action.locator("summary").click();
  await action
    .getByLabel("Responsible owner", { exact: false })
    .selectOption(C.owner);
  await action
    .getByLabel("Next review due", { exact: false })
    .fill("2026-10-12");
  await action
    .getByLabel("Next action", { exact: false })
    .fill("SYN retained keyboard draft");
  await action
    .getByLabel("Reason for this action", { exact: true })
    .fill("SYN owned follow-up");
  const opener = page.getByRole("button", { name: "Page guide", exact: true });
  await opener.click();
  await page.keyboard.press("Escape");
  await expect(action.getByLabel("Next action", { exact: false })).toHaveValue(
    "SYN retained keyboard draft",
  );
  let dropped = false;
  await page.route(`**/api/v1/warranty/cases/${f.war}`, async (route) => {
    if (route.request().method() === "POST" && !dropped) {
      dropped = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await action
    .getByRole("button", { name: "Assign next case review", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    action.getByRole("button", { name: "Recover original operation" }),
  ).toBeVisible();
  await action
    .getByRole("button", { name: "Recover original operation" })
    .click();
  await expect(
    page.getByText("Record version 4", { exact: true }),
  ).toBeVisible();
  expect(
    (await read(page, `warranty/cases/${f.war}`)).history.filter(
      (e: { action: string }) => e.action === "AssignReview",
    ),
  ).toHaveLength(1);
  await page
    .getByRole("tab", { name: "Failure & evidence", exact: true })
    .focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Coverage assessment", exact: true }),
  ).toBeFocused();
  await expect(page).toHaveURL(/view=coverage/);
});
test("paired original references and complete native shell reflow with overflow negative control", async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(240000);
  const f = await fixtures(page, baseURL!);
  const width = info.project.name.startsWith("mobile") ? 390 : 1440;
  for (const [path, id] of f.paths) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 960 });
    await page.goto(`/${path}/${id}`);
    await expect(page.locator(".ma-context")).toBeVisible();
    expect(await overflow(page)).toBe(false);
    await page.screenshot({
      path: info.outputPath(path.replaceAll("/", "-") + `-${width}.png`),
    });
  }
  for (const [w, h] of [
    [1024, 768],
    [390, 844],
    [320, 844],
    [720, 480],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`/warranty/cases/${f.war}`);
    await expect(page.locator(".ma-context")).toBeVisible();
    expect(await overflow(page)).toBe(false);
    await page.screenshot({
      path: info.outputPath(`warranty-reflow-${w}.png`),
    });
  }
  await page.evaluate(() => {
    const x = document.createElement("div");
    x.id = "ma-overflow-negative";
    x.style.width = "5000px";
    x.textContent = "Synthetic negative control";
    document.querySelector(".ma-workspace")!.append(x);
  });
  expect(await overflow(page)).toBe(true);
  await page.locator("#ma-overflow-negative").evaluate((x) => x.remove());
  expect(await overflow(page)).toBe(false);
  const hashes = [];
  for (const [path, scope] of [
    [
      "maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html",
      "#ppo-maintenance",
    ],
    [
      "warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html",
      "#ppo-warranty",
    ],
    ["theme-style-board/powerplants-one-theme-style-board-r22.html", "body"],
  ]) {
    const local = resolve("docs/reference/ui", path),
      bytes = await readFile(local);
    hashes.push({
      path,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
    const ref = await page.context().newPage();
    await ref.setViewportSize({ width, height: width === 390 ? 844 : 960 });
    await ref.goto(pathToFileURL(local).href);
    await expect(ref.locator(scope)).toBeVisible();
    await ref.screenshot({
      path: info.outputPath(path.split("/")[0] + `-reference-${width}.png`),
    });
    await ref.close();
  }
  await info.attach("exact-original-source-hashes", {
    body: JSON.stringify(hashes, null, 2),
    contentType: "application/json",
  });
});
test("filtered-empty, read-only, missing record and failed-read recovery are explicit", async ({
  page,
  baseURL,
}) => {
  await page.goto("/maintenance/agreements?q=no-matching-synthetic-term");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /No records match|No permitted records/ }),
  ).toBeVisible();
  await login(page, baseURL!, "observer");
  await page.reload();
  await expect(
    page.getByText(
      "Read-only for this identity. Decisions require current action permissions.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New record", exact: true }),
  ).toHaveCount(0);
  await page.goto(`/warranty/cases/${randomUUID()}`);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator(".ma-context")).toHaveCount(0);
  await login(page, baseURL!);
  await page.route("**/api/v1/maintenance/plans", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        code: "SyntheticReadFailure",
        message: "Synthetic failed source read",
      }),
    }),
  );
  await page.goto("/maintenance/plans");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator(".ma-register article")).toHaveCount(0);
  await page.unroute("**/api/v1/maintenance/plans");
  await page.getByRole("button", { name: /Retry/ }).click();
  await expect(page.locator(".ma-snapshot")).toBeVisible();
});
