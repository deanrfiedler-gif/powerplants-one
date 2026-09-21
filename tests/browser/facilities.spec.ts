import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
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
  await page.getByRole("tab", { name: "Related records", exact: true }).click();
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
    page.getByRole("tab", { name: "Hierarchy", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("link", { name: "SYN Propagation Bay A", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "SYN Propagation Bay A", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "SYN Propagation Bay A", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Within SYN Propagation House 01", { exact: true }),
  ).toBeVisible();
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
  await page.getByRole("link", { name: "Edit", exact: true }).click();
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
  await page
    .getByRole("button", { name: "Confirm these changes", exact: true })
    .click();
  await expect(
    page.getByText("0, 0 · Proposed", { exact: true }),
  ).toBeVisible();
  await page.goto("/facilities/c5050002-0000-4000-8000-000000000001");
  await page.getByRole("tab", { name: "Related records", exact: true }).click();
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
test("CS05 native source comparison, dense register and responsive geometry", async ({
  page,
  baseURL,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const name =
    "SYN long propagation location — north-east nursery structure with reported mixed growing context";
  await create(page, baseURL!, {
    name,
    detail_notes: "SYN multiline note\nSecond line remains readable",
    use: "mixed",
    crop: "Mixed nursery stock",
    context_observed_on: "2026-09-01",
  });
  const widths = info.project.name.startsWith("mobile")
    ? [390, 320]
    : [1920, 1440, 1280];
  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await page.goto(`/facilities?site_id=${site}`);
    await expect(
      page.getByRole("link", { name, exact: true }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`register-${width}.png`),
      fullPage: true,
    });
    if (width < 500) {
      await page.locator(".facility-table thead").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: info.outputPath(`register-table-${width}.png`),
        fullPage: true,
      });
      await page.locator(".facility-table-scroll").evaluate((el) => {
        el.scrollLeft = el.scrollWidth;
      });
      await page
        .getByRole("button", { name: /Inspect SYN Greenhouse 01/ })
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: info.outputPath(`register-actions-${width}.png`),
        fullPage: true,
      });
      const menu = page.getByRole("button", {
        name: "Customer locations menu",
        exact: true,
      });
      await menu.click();
      await expect(
        page.getByRole("dialog", {
          name: "Customer locations menu",
          exact: true,
        }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeFocused();
    }
  }
  if (!info.project.name.startsWith("mobile")) {
    await page.setViewportSize({ width: 1920, height: 1200 });
    await page
      .getByRole("button", { name: /Inspect SYN Greenhouse 01/ })
      .click();
    await expect(
      page.getByRole("complementary", { name: "Facility inspection" }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath("inspector-1920.png"),
      fullPage: true,
    });
    const reference = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await reference.goto(
      pathToFileURL(
        resolve(
          "docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html",
        ),
      ).href,
    );
    await reference.screenshot({
      path: info.outputPath("issued-r03-reference.png"),
      fullPage: true,
    });
    await reference.close();
    const theme = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await theme.setContent(
      await readFile(
        "docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html",
        "utf8",
      ),
    );
    const native = await page.locator(".facility-workspace").evaluate((el) => {
      const c = getComputedStyle(el);
      return { font: c.fontFamily, ink: c.color };
    });
    expect(native.font).toContain("Roboto");
    expect(native.ink).toBe("rgb(36, 42, 55)");
    const themePrimary = await theme
      .locator("#controls button.primary")
      .first()
      .evaluate((el) => {
        const c = getComputedStyle(el);
        return {
          background: c.backgroundColor,
          color: c.color,
          radius: c.borderRadius,
        };
      });
    const nativePrimary = await page
      .getByRole("link", { name: "Add facility / area", exact: true })
      .evaluate((el) => {
        const c = getComputedStyle(el);
        return {
          background: c.backgroundColor,
          color: c.color,
          radius: c.borderRadius,
        };
      });
    expect(nativePrimary).toEqual(themePrimary);
    // Negative control: the observed generic button override painted every tab navy.
    const tabs = await page.getByRole("tab").evaluateAll((els) =>
      els.map((el) => {
        const c = getComputedStyle(el);
        return { background: c.backgroundColor, color: c.color };
      }),
    );
    expect(tabs.every((t) => t.background === nativePrimary.background)).toBe(
      false,
    );
    const inspect = await page
      .getByRole("button", { name: /Inspect SYN Greenhouse 01/ })
      .evaluate((el) => {
        const c = getComputedStyle(el);
        return { wrap: c.whiteSpace, width: el.getBoundingClientRect().width };
      });
    expect(inspect.wrap).toBe("nowrap");
    expect(inspect.width).toBeGreaterThan(60);
    await theme.screenshot({
      path: info.outputPath("issued-r22-theme.png"),
      fullPage: true,
    });
    await theme.close();
    await page.setViewportSize({ width: 720, height: 450 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("zoom-short-height.png"),
      fullPage: true,
    });
  }
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
  await expect(page.locator(".facility-table tbody tr").first()).toBeVisible();
  release();
  await expect(
    page.getByRole("link", { name: "SYN Greenhouse 01", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Site", { exact: true })).toHaveValue(/field/i);
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
  await expect(page.locator(".facility-table tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "More facilities", exact: true })
    .click();
  await expect.poll(() => requests).toBe(3);
  await expect(page.locator(".facility-table tbody tr")).toHaveCount(1);
  expect(page.url()).toContain(site);
  await expect(page.locator(".business-error")).toHaveCount(0);
  const list = page.getByRole("tab", { name: "List", exact: true });
  await list.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Hierarchy", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(list).toBeFocused();
  await page.unroute("**/api/v1/facilities/register?**");
  const id = await create(page, baseURL!);
  await page.goto(`/facilities/${id}/edit`);
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
      .getByRole("button", {
        name: "Expand SYN Propagation House 01",
        exact: true,
      })
      .click();
    const child = page
      .locator(".facility-tree-row")
      .filter({
        has: page.getByRole("link", {
          name: "SYN Propagation Bay A",
          exact: true,
        }),
      });
    await child.getByRole("button", { name: "Inspect", exact: true }).click();
    await expect(
      page.getByRole("complementary", {
        name: "Facility inspection",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Collapse SYN Propagation House 01",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("complementary", {
        name: "Facility inspection",
        exact: true,
      }),
    ).toHaveCount(0);
    await page.getByRole("tab", { name: "List", exact: true }).click();
    await page
      .getByRole("button", { name: /^Inspect SYN Greenhouse 01 / })
      .click();
    await expect(
      page.getByRole("complementary", {
        name: "Facility inspection",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByLabel("Search facilities", { exact: true })
      .fill("No matching SYN area");
    await expect(
      page.getByRole("complementary", {
        name: "Facility inspection",
        exact: true,
      }),
    ).toHaveCount(0);
  }
  const id = await create(page, baseURL!);
  await page.goto(`/facilities/${id}/edit`);
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
