import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { supplyInput, supplyBase, supplyFact } from "../helpers/supply";
test.describe.configure({ timeout: 180000 });
async function login(page: Page, origin: string, profile = "coordinator") {
  const r = await page.request.post(origin + "/api/v1/local-session", {
    headers: { origin },
    data: { profile },
  });
  expect(r.status()).toBe(200);
}
async function seed(page: Page, origin: string) {
  const prefix = `SYN-INV-${randomUUID().slice(0, 8)}`;
  const names = [
    "Circulation pump CP-40",
    "Dosing pump DP-12",
    "Fertigation valve FV-20",
    "Fertigation valve FV-32",
    "Climate controller CC-8",
    "PVC pipe 40 mm",
    "Poly pipe 25 mm",
    "Drip emitter 2 L/h",
    "Screen drive motor 120",
    "Pump CP60 (supplier code)",
    "Cable gland M20",
    "Controller spare kit",
  ];
  const ids: string[] = [];
  for (const [n, title] of names.entries()) {
    const input = supplyInput("Supply", {
      item: `${prefix}-${n}`,
      title,
      observed_at: "2026-10-12T23:30:00.000Z",
      unit: n === 5 || n === 6 ? "m" : "EA",
      completeness: n === 10 ? "Unavailable" : n === 3 ? "Partial" : "Complete",
      data: {
        ...supplyInput("Supply").data,
        warehouse: n === 10 ? "Service van 2" : "Warehouse North",
        bin: `A-${n + 1}`,
        on_hand:
          n === 10
            ? null
            : [
                "6",
                "3",
                "14",
                "5",
                "1",
                "480",
                "1200",
                "40",
                "4",
                "2",
                "0",
                "2",
              ][n],
        available:
          n === 10 || n === 3
            ? null
            : [
                "4",
                "3",
                "12",
                "0",
                "1",
                "480",
                "900",
                "40",
                "2",
                "2",
                "0",
                "2",
              ][n],
        reserved: n === 10 || n === 3 ? null : n === 0 ? "2" : "0",
        held: n === 10 ? null : n === 8 ? "2" : "0",
        usable: n === 0 || n === 10 ? null : "2",
      },
    });
    const r = await page.request.post(origin + "/api/v1/supply/records", {
      headers: { origin },
      data: input,
    });
    expect(r.status(), await r.text()).toBe(201);
    ids.push(input.id);
  }
  const demand = supplyInput("Demand", {
    item: `${prefix}-0`,
    title: "SYN Pump installation demand",
  });
  const incoming = supplyInput("Supply", {
    item: `${prefix}-0`,
    title: "SYN Incoming pump evidence",
    data: {
      ...supplyInput("Supply").data,
      supply_kind: "Shipment",
      shipment_id: randomUUID(),
    },
  });
  for (const input of [demand, incoming]) {
    const response = await page.request.post(
      origin + "/api/v1/supply/records",
      { headers: { origin }, data: input },
    );
    expect(response.status(), await response.text()).toBe(201);
  }
  const allocation = await page.request.post(
    origin + "/api/v1/supply/allocations",
    {
      headers: { origin },
      data: {
        ...supplyBase(),
        id: randomUUID(),
        expected_version: null,
        demand_id: demand.id,
        supply_id: incoming.id,
        demand_version: 1,
        supply_version: 1,
        quantity: "2",
        unit: "EA",
        basis: "Incoming",
      },
    },
  );
  expect(allocation.status(), await allocation.text()).toBe(201);
  return { prefix, ids };
}
test.beforeEach(async ({ page, baseURL }) => login(page, baseURL!));
test("Inventory Activity opens Shipment receipt and inspection evidence in Receiving", async ({
  page,
  baseURL,
}) => {
  const stock = supplyInput("Supply", { item: `SYN-HANDOVER-${randomUUID()}` });
  const shipment = supplyInput("Supply", {
    item: stock.item,
    title: "SYN Incoming receipt handover",
    data: { ...stock.data, supply_kind: "Shipment", shipment_id: randomUUID() },
  });
  for (const input of [stock, shipment]) {
    const response = await page.request.post(`${baseURL}/api/v1/supply/records`, {
      headers: { origin: baseURL! }, data: input,
    });
    expect(response.status(), await response.text()).toBe(201);
  }
  const receipt = supplyFact("Receipt", 1, {
    received: "8", inspected: "8", damaged: "2", quarantined: "3",
    usable: "5", short: "0", identity: "SYN exact shipment item", identity_status: "Verified",
    inspection: "SYN Inventory handover inspection finding",
  });
  receipt.evidence = "SYN Inventory handover retained receipt";
  const response = await page.request.post(`${baseURL}/api/v1/supply/records/${shipment.id}/facts`, {
    headers: { origin: baseURL! }, data: receipt,
  });
  expect(response.status(), await response.text()).toBe(201);
  await page.goto(`/supply/stock?record=${stock.id}&tab=activity`);
  const activity = page.locator(".iv-activity");
  await expect(activity.getByRole("link", { name: stock.title, exact: true }))
    .toHaveAttribute("href", `/supply/stock?native=1&record=${stock.id}`);
  await activity.getByRole("link", { name: shipment.title, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/supply/receipts\\?record=${shipment.id}$`));
  await expect(page.getByRole("heading", { name: "Receiving & inspection", exact: true })).toBeVisible();
  await expect(page.locator(".supply-fact").getByText(receipt.evidence, { exact: true })).toBeVisible();
  await expect(page.locator(".supply-fact").getByText(receipt.data.inspection!, { exact: true })).toBeVisible();
});
test("Inventory observation save and close clear the launch parameter without adding history", async ({
  page,
  baseURL,
}) => {
  const stock = supplyInput("Supply", { item: `SYN-OBSERVATION-${randomUUID()}` });
  const response = await page.request.post(`${baseURL}/api/v1/supply/records`, {
    headers: { origin: baseURL! }, data: stock,
  });
  expect(response.status(), await response.text()).toBe(201);
  const launch = `/supply/stock?native=1&observation=1&record=${stock.id}`;
  await page.goto(launch);
  const dialog = page.getByRole("dialog", { name: "Revise coordination record" });
  await expect(dialog).toBeVisible();
  const beforeSave = await page.evaluate(() => history.length);
  await dialog.getByLabel("Reason for this record").fill("SYN observation URL regression");
  await dialog.getByRole("button", { name: "Save supply", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/supply/stock\\?native=1&record=${stock.id}$`));
  expect(await page.evaluate(() => history.length)).toBe(beforeSave);
  const saved = await page.request.get(`${baseURL}/api/v1/supply/records/${stock.id}`);
  expect(saved.status()).toBe(200);
  expect((await saved.json()).record.last_reason).toBe("SYN observation URL regression");
  await page.reload();
  await expect(page.getByRole("button", { name: "Revise record", exact: true })).toBeEnabled();
  await expect(dialog).toHaveCount(0);
  await page.goto(launch);
  await expect(dialog).toBeVisible();
  const beforeClose = await page.evaluate(() => history.length);
  page.once("dialog", (confirmation) => confirmation.accept());
  await dialog.getByRole("button", { name: "Close Revise coordination record", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/supply/stock\\?native=1&record=${stock.id}$`));
  expect(await page.evaluate(() => history.length)).toBe(beforeClose);
  await page.reload();
  await expect(page.getByRole("button", { name: "Revise record", exact: true })).toBeEnabled();
  await expect(dialog).toHaveCount(0);
});
test("Inventory register, snapshot, keyboard, native observation handover and 320px", async ({
  page,
  baseURL,
}) => {
  const { prefix, ids } = await seed(page, baseURL!);
  await page.goto(`/supply/stock?q=${prefix}`);
  const root = page.locator("#ppo-inventory");
  await expect(
    root.getByText("12 shown · limit 100", { exact: true }).first(),
  ).toBeVisible();
  await expect(root.locator('nav[aria-label="Inventory views"]')).toHaveCount(
    1,
  );
  if (page.viewportSize()!.width > 780) {
    const select = root.getByRole("checkbox", {
      name: "Snapshot Circulation pump CP-40",
    });
    await select.focus();
    await page.keyboard.press("Space");
    await expect(
      root.getByRole("complementary", { name: "Inventory snapshot" }),
    ).toBeVisible();
    const later = supplyInput("Supply", {
      item: `${prefix}-0`,
      title: "Circulation pump CP-40",
      observed_at: "2026-10-14T00:00:00.000Z",
      data: {
        ...supplyInput("Supply").data,
        warehouse: "SYN second warehouse",
        bin: "B-1",
      },
    });
    const created = await page.request.post(
      baseURL + "/api/v1/supply/records",
      { headers: { origin: baseURL! }, data: later },
    );
    expect(created.status(), await created.text()).toBe(201);
    await page.reload();
    await expect(
      root.getByRole("link", { name: "Open item record" }),
    ).toBeVisible();
    await expect(select).toBeChecked();
    ids[0] = later.id;
    const open = root.getByRole("link", { name: "Open item record" });
    await open.focus();
    await page.keyboard.press("Enter");
  } else
    await root.getByRole("link", { name: /Circulation pump CP-40/ }).click();
  await expect(root.locator(".iv-record-header")).toBeVisible();
  await expect(root.locator("h1")).toContainText("Circulation pump CP-40");
  if (page.viewportSize()!.width > 1200) {
    await page.getByRole("button", { name: "Show menu", exact: true }).click();
    await expect(
      root.getByRole("navigation", { name: "Inventory views" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Hide menu", exact: true }).click();
  }
  await expect(
    root
      .getByText("No link recorded", { exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(
    root.getByRole("button", { name: "Open product", exact: true }),
  ).toBeDisabled();
  await expect(root.locator(".iv-demand")).toContainText("2 EA · Incoming");
  const activity = root.getByRole("button", { name: "Activity", exact: true });
  await activity.focus();
  await page.keyboard.press("Enter");
  await expect(root.getByText(/Evidence history, not a ledger/)).toBeVisible();
  await root
    .getByRole("link", { name: "Record observation", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`native=1.*record=${ids[0]}`));
  await expect(
    page.getByRole("dialog", { name: "Revise coordination record" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Exact item reference", { exact: false }),
  ).toHaveValue(`${prefix}-0`);
  await page.goto(`/supply/stock?record=${ids[10]}`);
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(page.getByText(/Quantities are Unknown/)).toBeVisible();
  await expect(
    page
      .locator(".iv-tab-content")
      .getByText("Unknown", { exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await login(page, baseURL!, "observer");
  await page.goto(`/supply/stock?record=${ids[0]}`);
  await expect(root.locator(".iv-record-header")).toBeVisible();
  await expect(
    root.getByRole("link", { name: "Record observation", exact: true }),
  ).toHaveCount(0);
  await page.goto(`/supply/stock?native=1&observation=1&record=${ids[0]}`);
  await expect(
    page.getByRole("button", { name: "Revise record", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("dialog", { name: "Revise coordination record" }),
  ).toHaveCount(0);
});
test("Inventory failure clears old projections and retry preserves item and filters", async ({
  page,
  baseURL,
}) => {
  const { prefix, ids } = await seed(page, baseURL!);
  await page.goto(`/supply/stock?q=${prefix}&record=${ids[0]}`);
  await expect(page.locator(".iv-record-header")).toBeVisible();
  await page.route("**/api/v1/supply/records?*", async (route) => {
    if (new URL(route.request().url()).searchParams.get("record"))
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "SYN source read failed" }),
      });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Retry read", exact: true }).click();
  await expect(page.getByText("SYN source read failed")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Circulation pump CP-40/ }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`q=${prefix}.*record=${ids[0]}`));
  await page.unroute("**/api/v1/supply/records?*");
  await page.getByRole("button", { name: "Retry read", exact: true }).click();
  await expect(page.locator(".iv-record-header")).toBeVisible();
});
test("Inventory stale search cannot overwrite a newer response", async ({
  page,
  baseURL,
}) => {
  const { prefix } = await seed(page, baseURL!);
  await page.goto(`/supply/stock?q=${prefix}`);
  await expect(page.locator(".iv-count")).toHaveText("12 shown · limit 100");
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let reached = () => {};
  const held = new Promise<void>((resolve) => {
    reached = resolve;
  });
  await page.route("**/api/v1/supply/records?*", async (route) => {
    if (new URL(route.request().url()).searchParams.get("q") === "SYN-HOLD") {
      const response = await route.fetch();
      reached();
      await gate;
      await route.fulfill({ response }).catch(() => {});
    } else await route.continue();
  });
  if (page.viewportSize()!.width <= 780)
    await page.getByRole("button", { name: "Search and filter" }).click();
  await page
    .getByRole("searchbox", { name: "Search inventory" })
    .fill("SYN-HOLD");
  await held;
  await page.getByRole("searchbox", { name: "Search inventory" }).fill(prefix);
  await expect(page.locator(".iv-count")).toHaveText("12 shown · limit 100");
  release();
  await expect(page.locator(".iv-count")).toHaveText("12 shown · limit 100");
  await expect(page.getByRole("searchbox")).toHaveValue(prefix);
});
test("Inventory design comparison captures at all four widths", async ({
  page,
  baseURL,
}, info) => {
  test.skip(
    info.project.name !== "desktop-chromium",
    "One capture matrix per run",
  );
  const { prefix, ids } = await seed(page, baseURL!);
  test.setTimeout(300000);
  const dir = "docs/testing/evidence/inventory/captures";
  await mkdir(dir, { recursive: true });
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({
      width,
      height: width === 1440 ? 900 : width === 1024 ? 768 : 844,
    });
    await page.goto(`/supply/stock?q=${prefix}`);
    if (width === 1024)
      await page
        .getByRole("button", {
          name: "Collapse primary navigation",
          exact: true,
        })
        .click();
    await expect(page.locator(".iv-count")).toHaveText("12 shown · limit 100");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${dir}/register-${width}.png` });
    await page.goto(`/supply/stock?q=${prefix}&record=${ids[0]}`);
    await expect(page.locator(".iv-record-header")).toBeVisible();
    await expect(page.locator(".iv-position")).toContainText("of 12 shown");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${dir}/quantities-${width}.png` });
    await page.getByRole("button", { name: "Activity", exact: true }).click();
    await expect(
      page
        .locator(".iv-tab-content")
        .getByRole("heading", { name: "Activity", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${dir}/activity-${width}.png` });
  }
  await page.goto(`/supply/stock?q=${prefix}&record=${ids[10]}`);
  await expect(page.locator(".iv-position")).toContainText("of 12 shown");
  await expect(page.getByText(/Quantities are Unknown/)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${dir}/unknown-320.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/supply/stock?q=${prefix}&record=${ids[0]}&snapshot=1`);
  await page
    .getByRole("button", { name: "Expand primary navigation", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Inventory snapshot" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open item record" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".iv-count")).toHaveText("12 shown · limit 100");
  await page.screenshot({ path: `${dir}/snapshot-1440.png` });
});
