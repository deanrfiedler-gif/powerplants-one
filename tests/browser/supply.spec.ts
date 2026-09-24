import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { supplyPages } from "../../src/supply/navigation";
import { supplyInput, supplyFact, supplyBase } from "../helpers/supply";
import { randomUUID } from "node:crypto";
import { destination } from "../../src/shell/navigation";
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
test.beforeEach(async ({ page, baseURL }) => login(page, baseURL!));
for (const spec of supplyPages)
  test(`${spec.scope} route, guide, filters, keyboard and responsive containment`, async ({
    page,
    baseURL,
  }, testInfo) => {
    if (spec.kind === "Return") {
      const d = supplyInput();
      await post(page, baseURL!, "supply/records", d);
      await post(
        page,
        baseURL!,
        "supply/records",
        supplyInput("Return", {
          quantity: "1",
          data: {
            ...supplyInput("Return").data,
            demand_id: d.id,
            identity_status: "Unresolved",
          },
        }),
      );
    }
    if (spec.scope === "SC-09") {
      const d = supplyInput();
      await post(page, baseURL!, "supply/records", d);
      await post(
        page,
        baseURL!,
        `supply/records/${d.id}/facts`,
        supplyFact("Promise", 1, { quantity: "10", promised_on: "2026-11-01" }),
      );
    }
    if (spec.kind === "Custody") {
      const o = await (
        await page.request.get(baseURL + "/api/v1/supply/options")
      ).json();
      const a = o.contexts.appointment_id.find(
        (a: { company_id: string; work_order_id: string }) =>
          o.custodians.some(
            (u: { company_id: string }) => u.company_id === a.company_id,
          ) &&
          o.contexts.WorkOrder.some(
            (w: { id: string }) => w.id === a.work_order_id,
          ),
      );
      expect(a).toBeTruthy();
      const d = supplyInput("Demand", {
        company_id: a.company_id,
        site_id: a.site_id,
        data: {
          ...supplyInput().data,
          origin_kind: "WorkOrder",
          origin_id: a.work_order_id,
          appointment_id: a.id,
        },
      });
      await post(page, baseURL!, "supply/records", d);
      const custody = supplyInput("Custody", {
        company_id: a.company_id,
        site_id: a.site_id,
        data: {
          ...supplyInput("Custody").data,
          demand_id: d.id,
          appointment_id: a.id,
          technician_id: o.custodians.find(
            (u: { company_id: string }) => u.company_id === a.company_id,
          ).id,
        },
      });
      await post(page, baseURL!, "supply/records", custody);
      await post(
        page,
        baseURL!,
        `supply/records/${custody.id}/facts`,
        supplyFact("Custody", 1, { held: "10", state: "Open" }),
      );
    }
    await page.goto(`/supply/${spec.slug}`);
    const surface = page.locator("#ppo-supply");
    await expect(surface).toBeVisible();
    await expect(
      surface.getByRole("heading", { name: spec.title, exact: true }),
    ).toBeVisible();
    await expect(surface.getByText(/matching of/)).toBeVisible({
      timeout: 60000,
    });
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      await expect(
        page.locator(".ppo-primary-nav").getByRole("link", {
          name: destination(spec.rail).label,
          exact: true,
        }),
      ).toHaveAttribute("aria-current", "page");
    }
    await surface.getByRole("searchbox").fill("SYN-NO-SUPPLY-MATCH");
    await expect(surface.getByText(/No records match/)).toBeVisible();
    await expect(page).toHaveURL(/q=SYN-NO-SUPPLY-MATCH/);
    await page.reload();
    await expect(surface.getByRole("searchbox")).toHaveValue(
      "SYN-NO-SUPPLY-MATCH",
    );
    await surface.getByRole("button", { name: "Clear filters" }).click();
    await expect(
      surface.getByRole("button", {
        name: `New ${spec.kind.toLowerCase()}`,
        exact: true,
      }),
    ).toBeEnabled({ timeout: 60000 });
    const firstRecord = surface
      .locator(".supply-worklist article button")
      .first();
    await expect(firstRecord).toBeVisible();
    {
      await firstRecord.click();
      await expect(page).toHaveURL(/record=/);
      await expect(
        surface.getByRole("button", { name: "Revise record", exact: true }),
      ).toBeVisible();
      await page.goBack();
      await expect(page).not.toHaveURL(/record=/);
      await firstRecord.click();
    }
    const guide = page.getByRole("button", { name: "Page guide", exact: true });
    await guide.click();
    await expect(
      page.getByText(`${spec.scope} — purpose and prerequisites`, {
        exact: true,
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(guide).toBeFocused();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    expect(overflow).toBe(false);
    await mkdir("docs/testing/evidence/supply-chain-native", {
      recursive: true,
    });
    await page.screenshot({
      path: `docs/testing/evidence/supply-chain-native/${spec.scope.toLowerCase()}-${testInfo.project.name}.png`,
      fullPage: true,
    });
    if ((page.viewportSize()?.width ?? 0) < 800) {
      await surface.locator(".supply-detail").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `docs/testing/evidence/supply-chain-native/${spec.scope.toLowerCase()}-detail-${testInfo.project.name}.png`,
        fullPage: true,
      });
    }
  });
test("mobile receipt capture, persisted correction and focus return", async ({
  page,
  baseURL,
}) => {
  const input = supplyInput("Supply", {
    quantity: "8",
    data: {
      ...supplyInput("Supply").data,
      supply_kind: "Shipment",
      shipment_id: randomUUID(),
      usable: null,
    },
  });
  await post(page, baseURL!, "supply/records", input);
  await page.goto(`/supply/receipts?record=${input.id}`);
  await page
    .getByRole("button", { name: "Receipt and inspection", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Receipt and inspection" });
  for (const [label, value] of [
    ["Physically received", "8"],
    ["Inspected", "8"],
    ["Damaged (included in quarantine)", "2"],
    ["Quarantined", "3"],
    ["Evidenced usable", "5"],
    ["Short on this receipt", "0"],
    ["Inspection finding", "SYN bent guard"],
    ["Disposition / unresolved", "SYN inspect held goods"],
    ["Item identity evidence / unresolved", "SYN exact cable"],
    ["Evidence reference / finding", "SYN receipt photograph reference"],
    ["Reason / correction explanation", "SYN physical receipt capture"],
  ])
    await dialog.getByLabel(label, { exact: false }).fill(value);
  await dialog.getByLabel("Source completeness").selectOption("Complete");
  await dialog.getByLabel("Receipt item identity").selectOption("Verified");
  await page.screenshot({
    path: `docs/testing/evidence/supply-chain-native/receipt-form-${page.viewportSize()!.width}.png`,
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Save receipt and inspection" })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Receipt and inspection", exact: true }),
  ).toBeFocused();
  await expect(
    page.locator(".supply-fact").getByText("SYN bent guard", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".supply-fact").getByText("SYN bent guard", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Review / correct capture", exact: true })
    .click();
  const correction = page.getByRole("dialog", {
    name: "Receipt and inspection",
  });
  await correction
    .getByLabel("Inspection finding")
    .fill("SYN corrected bent guard finding");
  await correction
    .getByLabel("Evidence reference / finding")
    .fill("SYN reinspection");
  await correction
    .getByLabel("Reason / correction explanation")
    .fill("SYN corrected finding only");
  await correction
    .getByRole("button", { name: "Save receipt and inspection" })
    .click();
  await expect(correction).not.toBeVisible();
  await expect(
    page
      .locator(".supply-fact")
      .getByText("SYN corrected bent guard finding", { exact: true }),
  ).toBeVisible();
});
test("picking, staging and partial POD use exact outstanding quantities and browser restoration", async ({
  page,
  baseURL,
}) => {
  const origin = baseURL!,
    d = supplyInput(),
    s = supplyInput("Supply");
  await post(page, origin, "supply/records", d);
  await post(page, origin, "supply/records", s);
  await post(page, origin, "supply/allocations", {
    ...supplyBase(),
    id: randomUUID(),
    expected_version: null,
    demand_id: d.id,
    supply_id: s.id,
    demand_version: 1,
    supply_version: 1,
    quantity: "10",
    unit: "EA",
    basis: "Usable",
  });
  await page.goto(`/supply/dispatch?record=${d.id}`);
  await page.getByRole("button", { name: "Pick goods", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Pick goods" });
  for (const [label, value] of [
    ["Picked quantity", "5"],
    ["Warehouse / bin", "SYN-WH-A"],
    ["Evidence reference / finding", "SYN picker observation"],
    ["Reason / correction explanation", "SYN picked quantity"],
  ])
    await dialog.getByLabel(label, { exact: false }).fill(value);
  await dialog.getByLabel("Source completeness").selectOption("Complete");
  await page.screenshot({
    path: `docs/testing/evidence/supply-chain-native/pick-form-${page.viewportSize()!.width}.png`,
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Save pick goods" }).click();
  await expect(dialog).not.toBeVisible();
  const w = await (
    await page.request.get(origin + `/api/v1/supply/records/${d.id}`)
  ).json();
  await post(
    page,
    origin,
    `supply/records/${d.id}/facts`,
    supplyFact("Stage", w.record.version, { quantity: "5" }),
  );
  const next = await (
    await page.request.get(origin + `/api/v1/supply/records/${d.id}`)
  ).json();
  const prepared = supplyFact("Dispatch", next.record.version, {
    quantity: "4",
    state: "Prepared",
  });
  await post(page, origin, `supply/records/${d.id}/facts`, prepared);
  await post(page, origin, `supply/records/${d.id}/facts`, {
    ...supplyFact("Dispatch", next.record.version + 1, {
      quantity: "4",
      state: "Moved",
      movement_at: "2026-09-24T00:00:00.000Z",
    }),
    predecessor_id: prepared.id,
  });
  await page.goto(`/supply/deliveries?record=${d.id}`);
  await page
    .getByRole("button", { name: "Delivery / POD capture", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Delivery / POD capture" });
  for (const [label, value] of [
    ["Physically delivered", "3"],
    ["Physical delivery time", "2026-09-24T02:00:00.000Z"],
    ["Site delivery address", "SYN Site address"],
    ["Receiving point", "SYN Goods gate"],
    ["Intended installation / use area", "SYN Growing area 2"],
    ["Physical recipient evidence", "SYN Receiving custodian"],
    ["Evidence reference / finding", "SYN POD original"],
    ["Reason / correction explanation", "SYN partial delivery"],
  ])
    await dialog.getByLabel(label, { exact: false }).fill(value);
  await dialog.getByLabel("Source completeness").selectOption("Complete");
  await page.screenshot({
    path: `docs/testing/evidence/supply-chain-native/pod-form-${page.viewportSize()!.width}.png`,
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Save delivery / pod capture" })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.locator(".supply-metrics").getByText("7 EA", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".supply-metrics").getByText("7 EA", { exact: true }),
  ).toBeVisible();
});

test("lost accepted save survives reload and recovers its original receipt without a second revision", async ({
  page,
  baseURL,
}) => {
  const d = supplyInput();
  await post(page, baseURL!, "supply/records", d);
  await page.goto(`/supply/material-readiness?record=${d.id}`);
  await page
    .getByRole("button", { name: "Revise record", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Revise coordination record",
  });
  await dialog
    .getByLabel("Next action", { exact: false })
    .fill("SYN recovered original change");
  await dialog
    .getByLabel("Reason for this record")
    .fill("SYN lost-response proof");
  await page.route(`**/api/v1/supply/records/${d.id}`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    await route.abort("failed");
  });
  await dialog
    .getByRole("button", { name: "Save demand", exact: true })
    .click();
  await expect(
    dialog.getByText("Uncertain result — original operation retained", {
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute(`**/api/v1/supply/records/${d.id}`);
  await page.reload();
  await page
    .getByRole("button", { name: "Check original receipt", exact: true })
    .click();
  await expect(
    page.getByText("Original save recovered. No second effect was created.", {
      exact: true,
    }),
  ).toBeVisible();
  const saved = await (
    await page.request.get(baseURL + `/api/v1/supply/records/${d.id}`)
  ).json();
  expect(saved.record.version).toBe(2);
  expect(saved.record.next_action).toBe("SYN recovered original change");
});
test("denied identity and Partial evidence do not become authorised or zero availability", async ({
  page,
  baseURL,
}) => {
  const input = supplyInput("Demand", { completeness: "Partial" });
  await post(page, baseURL!, "supply/records", input);
  await page.goto(`/supply/material-readiness?record=${input.id}`);
  await expect(
    page
      .locator(".supply-summary")
      .getByText("Evidence needed", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".supply-summary")).toContainText(
    "Shortage: Unknown",
  );
  await login(page, baseURL!, "observer");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Revise record", exact: true }),
  ).toBeDisabled();
  await login(page, baseURL!, "second-company");
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "This record is unavailable" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Revise record", exact: true }),
  ).not.toBeVisible();
});
