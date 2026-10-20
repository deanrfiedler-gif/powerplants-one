import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
const site = "c5050001-0000-4000-8000-000000000001",
  company = "20000000-0000-4000-8000-000000000001";
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN CS-05 browser proof",
});
async function login(page: Page, origin: string, profile = "coordinator") {
  const response = await page.request.post(`${origin}/api/v1/local-session`, {
    headers: { origin },
    data: { profile },
  });
  expect(response.status()).toBe(200);
}
async function create(
  page: Page,
  origin: string,
  details: Record<string, unknown> = {},
) {
  const id = randomUUID();
  const response = await page.request.post(
    `${origin}/api/v1/facilities/create-details`,
    {
      headers: { origin },
      data: {
        ...base(),
        id,
        company_id: company,
        site_id: site,
        details: {
          name: `SYN browser ${id.slice(0, 8)}`,
          structure_type: "greenhouse",
          greenhouse_cladding: "glass",
          bay_count: 8,
          footprint_m2: "2400",
          ...details,
        },
      },
    },
  );
  expect(response.status(), await response.text()).toBe(201);
  return id;
}
test.beforeEach(async ({ page, baseURL }) => {
  await login(page, baseURL!);
});

test("CS05 Equipment add and end keep one installation and show accepted versions", async ({
  page,
  baseURL,
}, info) => {
  const id = await create(page, baseURL!),
    pump = "c5050003-0000-4000-8000-000000000001";
  const before = (
    await (await page.request.get(`${baseURL}/api/v1/assets/${pump}`)).json()
  ).items[0];
  await page.goto(`/facilities/${id}`);
  await page.getByRole("tab", { name: "Equipment", exact: true }).click();
  await page
    .locator("summary")
    .filter({ hasText: "Manage service links" })
    .click();
  await page
    .getByRole("button", { name: "Add serving equipment", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Equipment", exact: true })
    .fill("SYN Willowbank irrigation pump");
  await page
    .getByRole("option", { name: /SYN Willowbank irrigation pump/ })
    .click();
  await page
    .getByLabel("Relationship reason", { exact: true })
    .fill("SYN explicit served area");
  await page
    .getByLabel("Source basis", { exact: true })
    .selectOption("reported_note");
  await page
    .getByLabel("Source title", { exact: true })
    .fill("SYN reported pump service observation");
  await page
    .getByRole("button", { name: "Add service relationship", exact: true })
    .click();
  await expect(
    page.getByText(
      `Saved to the server. Equipment version ${before.version + 1}.`,
      { exact: false },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "End service relationship", exact: true })
    .click();
  await page
    .getByLabel("Reason for ending", { exact: true })
    .fill("SYN service ended; installation retained");
  await page.getByRole("button", { name: "Confirm end", exact: true }).click();
  await expect(
    page.getByText(
      `Saved to the server. Equipment version ${before.version + 2}.`,
      { exact: false },
    ),
  ).toBeVisible();
  const after = (
    await (await page.request.get(`${baseURL}/api/v1/assets/${pump}`)).json()
  ).items[0];
  expect(after.facility_id).toBe(before.facility_id);
  expect(after.version).toBe(before.version + 2);
  expect(
    (
      await (
        await page.request.get(`${baseURL}/api/v1/facilities/${id}/workspace`)
      ).json()
    ).version,
  ).toBe(1);
  await page.screenshot({
    path: info.outputPath("service-ended.png"),
    fullPage: true,
  });
});
test("CS05 register, exact hierarchy, create, controlled clearing, reload and history", async ({
  page,
  baseURL,
}, info) => {
  await page.goto(`/facilities?site_id=${site}&q=Propagation&view=hierarchy`);
  await expect(
    page.getByRole("button", { name: "Hierarchy", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  if (info.project.name.startsWith("mobile")) {
    await page
      .locator(".facility-phone-row")
      .filter({ hasText: "SYN Propagation Bay A" })
      .click();
  } else {
    await page
      .getByRole("button", { name: "SYN Propagation Bay A", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Open facility", exact: true })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "SYN Propagation Bay A", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("link", { name: "SYN Propagation House 01", exact: true })
      .first(),
  ).toBeAttached();
  await page.goto(`/facilities/new?site_id=${site}`);
  const name = `SYN native outdoor ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Facility / area name", { exact: true }).fill(name);
  await page
    .getByLabel("Structure type", { exact: true })
    .selectOption("greenhouse");
  await page.getByLabel("Cladding", { exact: true }).selectOption("glass");
  await page.getByLabel("Bay count", { exact: true }).fill("8");
  await page.getByLabel("Footprint (m²)", { exact: true }).fill("2400");
  await page
    .getByLabel("Reason for recording", { exact: true })
    .fill("SYN native fixture");
  await page
    .getByRole("button", { name: "Save facility", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Open saved facility", exact: true })
    .click();
  await expect(page).toHaveURL(/\/facilities\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").at(-1)!;
  await page.reload();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: "Copy full record ID", exact: true })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(id);
  await page.screenshot({
    path: info.outputPath("canonical-detail.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Correct details", exact: true })
    .click();
  await page.locator("summary").filter({ hasText: "Structure" }).click();
  await page
    .getByLabel("Structure type", { exact: true })
    .selectOption("open_growing_area");
  await page
    .getByLabel("Change reason", { exact: true })
    .fill("SYN changed recorded structure");
  await page
    .getByRole("button", { name: "Review changes", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Review facility changes" }),
  ).toBeVisible();
  await expect(
    page.getByText("Bay count — will be cleared", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to proposal", exact: true })
    .click();
  const before = await page.request.get(
    `${baseURL}/api/v1/facilities/${id}/workspace`,
  );
  expect((await before.json()).version).toBe(1);
  await page
    .getByRole("button", { name: "Review changes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm these changes", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("clearing-review.png"),
    fullPage: true,
  });
  if (await page.getByRole("checkbox", { name: /I have reviewed/ }).count())
    await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await page
    .getByRole("button", { name: "Confirm these changes", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Open saved facility", exact: true })
    .click();
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(
    page.getByText("SYN changed recorded structure", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".facility-history").first()).toContainText(
    "Glass → Not recorded",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("CS05 lost response freezes original, absent lookup replays exactly once, accepted refresh failure remains saved", async ({
  page,
  baseURL,
}, info) => {
  const id = await create(page, baseURL!);
  await page.goto(`/facilities/${id}/edit`);
  await page.locator("summary").filter({ hasText: "Source & notes" }).click();
  await page
    .getByLabel("Detail notes", { exact: true })
    .fill("SYN retained original");
  await page
    .getByLabel("Change reason", { exact: true })
    .fill("SYN uncertain response");
  await page
    .getByRole("button", { name: "Review changes", exact: true })
    .click();
  let submitted: unknown = null,
    posts = 0;
  await page.route(`**/api/v1/facilities/${id}/revise`, async (route) => {
    posts++;
    const body = route.request().postDataJSON();
    if (submitted) expect(body).toEqual(submitted);
    else submitted = body;
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    if (posts === 1) await route.abort("failed");
    else await route.fulfill({ response });
  });
  if (await page.getByRole("checkbox", { name: /I have reviewed/ }).count())
    await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await page
    .getByRole("button", { name: "Confirm these changes", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check original action", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Detail notes", { exact: true })).toBeDisabled();
  await page.screenshot({
    path: info.outputPath("uncertain-original.png"),
    fullPage: true,
  });
  await page.route("**/api/v1/operations/*", (route) =>
    route.fulfill({
      status: 404,
      json: {
        code: "RecordUnavailable",
        message: "Record is unavailable",
        field_errors: [],
        correlation_id: randomUUID(),
        retryable: false,
      },
    }),
  );
  await page.route(`**/api/v1/facilities/${id}/workspace`, (route) =>
    route.fulfill({
      status: 503,
      json: {
        code: "DependencyUnavailable",
        message: "SYN refresh interruption",
        retryable: true,
      },
    }),
  );
  await page
    .getByRole("button", { name: "Check original action", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server", exact: true }),
  ).toBeVisible();
  expect(posts).toBe(2);
  const record = await page.request.get(
    `${baseURL}/api/v1/facilities/${id}/workspace`,
  );
  expect((await record.json()).version).toBe(2);
  await expect(page.getByText(/Saved; latest details/)).toBeVisible();
});
test("CS05 conflict retains proposal, pin review records zero, related pump and identity denial", async ({
  page,
  baseURL,
}, info) => {
  const id = await create(page, baseURL!);
  await page.goto(`/facilities/${id}/edit`);
  await page.locator("summary").filter({ hasText: "Source & notes" }).click();
  await page
    .getByLabel("Detail notes", { exact: true })
    .fill("SYN proposal stays");
  await page
    .getByLabel("Change reason", { exact: true })
    .fill("SYN stale proposal");
  expect(
    (
      await page.request.post(`${baseURL}/api/v1/facilities/${id}/revise`, {
        headers: { origin: baseURL! },
        data: {
          ...base(),
          expected_version: 1,
          changes: {
            structure_type: "greenhouse",
            detail_notes: "SYN other writer",
          },
        },
      })
    ).status(),
  ).toBe(200);
  await page
    .getByRole("button", { name: "Review changes", exact: true })
    .click();
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "saved record changed",
  );
  await expect(page.getByLabel("Detail notes", { exact: true })).toHaveValue(
    "SYN proposal stays",
  );
  await page.screenshot({
    path: info.outputPath("version-conflict.png"),
    fullPage: true,
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("link", { name: "Cancel", exact: true }).click();
  await page.getByRole("tab", { name: "Sources", exact: true }).click();
  await page
    .getByRole("button", { name: "Record location pin", exact: true })
    .click();
  await page.getByLabel("Latitude", { exact: true }).fill("0");
  await page.getByLabel("Longitude", { exact: true }).fill("0");
  await page
    .getByLabel("Pin change reason", { exact: true })
    .fill("SYN proposed coordinates");
  await page.getByRole("button", { name: "Review pin", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm these changes", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("pin-review.png"),
    fullPage: true,
  });
  if (await page.getByRole("checkbox", { name: /I have reviewed/ }).count())
    await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await page
    .getByRole("button", { name: "Confirm these changes", exact: true })
    .click();
  await expect(
    page.getByText("0, 0 · Proposed", { exact: true }),
  ).toBeVisible();
  await page.goto("/facilities/c5050002-0000-4000-8000-000000000001");
  await page.getByRole("tab", { name: "Equipment", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /SYN Willowbank irrigation pump/ }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("related-equipment.png"),
    fullPage: true,
  });
  await login(page, baseURL!, "site-observer");
  await page.reload();
  await expect(page.locator(".business-error[role=alert]")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "SYN Greenhouse 01", exact: true }),
  ).toHaveCount(0);
});
test("CS05 real synthetic register and record remain contained at desktop, phone and short zoom widths", async ({
  page,
  baseURL,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const name =
    "SYN long propagation location — north-east nursery structure with reported mixed growing context";
  const id = await create(page, baseURL!, {
    name,
    use: "mixed",
    crop: "Mixed nursery stock",
    context_observed_on: "2026-09-01",
  });
  for (const width of info.project.name.startsWith("mobile")
    ? [390, 320]
    : [1920, 1440, 1024]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await page.goto(`/facilities?site_id=${site}`);
    await expect(
      page
        .locator(width < 500 ? ".facility-phone-row" : ".facility-row-open")
        .filter({ hasText: name }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto(`/facilities/${id}`);
    await expect(
      page.getByRole("heading", { name: "Measurements", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 720, height: 450 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("CS05 late Site response, expired cursor, keyboard tabs and forced reload preserve the online boundary", async ({
  page,
  baseURL,
}, info) => {
  let release!: () => void, reached!: () => void;
  const held = new Promise<void>((r) => {
      release = r;
    }),
    started = new Promise<void>((r) => {
      reached = r;
    });
  await page.route("**/api/v1/facilities/register?**", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("q") === "SYN delayed") {
      const response = await route.fetch();
      reached();
      await held;
      await route.fulfill({ response });
    } else await route.continue();
  });
  await page.goto(`/facilities?site_id=${site}&q=SYN%20delayed`);
  await started;
  const fieldSite = "c5050001-0000-4000-8000-000000000002";
  await page.goto(`/facilities?site_id=${fieldSite}`);
  await expect(
    page.locator(".facility-desktop-grid tbody tr").first(),
  ).toBeAttached();
  release();
  await expect(
    page.getByRole("link", { name: "SYN Greenhouse 01", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".facility-site-filter")).toContainText(/field/i);
  await page.unroute("**/api/v1/facilities/register?**");
  let requests = 0,
    invalidated = false;
  await page.route("**/api/v1/facilities/register?**", async (route) => {
    requests++;
    const url = new URL(route.request().url());
    if (url.searchParams.has("cursor") && !invalidated) {
      invalidated = true;
      await route.fulfill({
        status: 422,
        json: {
          code: "InvalidData",
          message: "Cursor belongs to an earlier process.",
          field_errors: [
            { field: "cursor", message: "Refresh the first page." },
          ],
          retryable: false,
        },
      });
    } else {
      url.searchParams.set("limit", "1");
      const response = await route.fetch({ url: url.href });
      await route.fulfill({ response });
    }
  });
  await page.goto(`/facilities?site_id=${site}`);
  await expect(page.locator(".facility-desktop-grid tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "More facilities", exact: true })
    .click();
  await expect.poll(() => requests).toBe(3);
  await expect(page.locator(".facility-desktop-grid tbody tr")).toHaveCount(1);
  expect(page.url()).toContain(site);
  await expect(page.locator(".business-error")).toHaveCount(0);
  if (!info.project.name.startsWith("mobile")) {
    const list = page.getByRole("button", { name: "List", exact: true });
    await list.focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Hierarchy", exact: true }),
    ).toBeFocused();
  }
  await page.unroute("**/api/v1/facilities/register?**");
  const id = await create(page, baseURL!);
  await page.goto(`/facilities/${id}/edit`);
  await page.locator("summary").filter({ hasText: "Source & notes" }).click();
  let posts = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes(`/facilities/${id}/revise`))
      posts++;
  });
  await page
    .getByLabel("Detail notes", { exact: true })
    .fill("SYN memory-only unsaved proposal");
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await page.locator("summary").filter({ hasText: "Source & notes" }).click();
  await expect(page.getByLabel("Detail notes", { exact: true })).toHaveValue(
    "",
  );
  expect(posts).toBe(0);
  await page.screenshot({
    path: info.outputPath("reload-memory-boundary.png"),
    fullPage: true,
  });
});

test("CS05 selection leaves no hidden dock actions and dirty navigation is deliberate", async ({
  page,
  baseURL,
}, info) => {
  if (!info.project.name.startsWith("mobile")) {
    await page.goto(`/facilities?site_id=${site}&view=hierarchy`);
    await page
      .getByRole("button", { name: "SYN Propagation Bay A", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Facility snapshot", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Facility snapshot", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", {
        name: "Search and filter facilities",
        exact: true,
      })
      .click();
    await page
      .getByLabel("Search facilities", { exact: true })
      .fill("No matching SYN area");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "No matching areas", exact: true }),
    ).toBeVisible();
  }
  const id = await create(page, baseURL!);
  await page.goto(`/facilities/${id}/edit`);
  await page.locator("summary").filter({ hasText: "Source & notes" }).click();
  await page
    .getByLabel("Detail notes", { exact: true })
    .fill("SYN retained until deliberate discard");
  let asked = false;
  page.once("dialog", async (d) => {
    asked = true;
    await d.dismiss();
  });
  await page.getByRole("link", { name: "Cancel", exact: true }).click();
  expect(asked).toBe(true);
  await expect(page).toHaveURL(new RegExp(`/facilities/${id}/edit$`));
  await expect(page.getByLabel("Detail notes", { exact: true })).toHaveValue(
    "SYN retained until deliberate discard",
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("link", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/facilities/${id}$`));
  expect(
    (
      await (
        await page.request.get(`${baseURL}/api/v1/facilities/${id}/workspace`)
      ).json()
    ).version,
  ).toBe(1);
});
