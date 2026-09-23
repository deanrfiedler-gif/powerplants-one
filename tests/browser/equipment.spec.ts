import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const company = "20000000-0000-4000-8000-000000000001",
  // Preserve the seeded Site-01 observer window used by retained browser journeys.
  site = "70000000-0000-4000-8000-000000000002";
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN Equipment browser verification",
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
async function fixture(page: Page, origin: string) {
  const id = randomUUID();
  await post(page, origin, "assets", {
    ...base(),
    id,
    company_id: company,
    site_id: site,
    description: "SYN Equipment browser pump",
    identity_status: "Unresolved",
    manufacturer: "SYN Equipment",
    model: "P45",
    serial: "SYN-" + id,
    effective_at: "2026-09-01T00:00:00.000Z",
    configuration: "SYN hardware H1, firmware F1",
  });
  return id;
}
test.beforeEach(async ({ page, baseURL }) => login(page, baseURL!));
test("EQ01/02 URL lookup is read-only, restores context and requires physical comparison", async ({
  page,
  baseURL,
}) => {
  const id = await fixture(page, baseURL!);
  await page.goto(`/equipment/lookup?q=${id}`);
  await expect(
    page.getByRole("heading", { name: "Equipment found", exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Physical Facility", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Select Inspection context" }),
  ).toHaveCount(0);
  await page.getByRole("checkbox", { name: /I compared/ }).check();
  await page.getByRole("link", { name: "Select Inspection context" }).click();
  await expect(
    page.getByRole("tab", { name: "Inspection & evidence" }),
  ).toHaveAttribute("aria-selected", "true");
  const r = await page.request.get(baseURL + "/api/v1/equipment/" + id);
  expect((await r.json()).context.identity_status).toBe("Unresolved");
  await page.goto("/equipment?q=" + encodeURIComponent("SYN-" + id));
  await expect(page.getByText(/1 matching equipment/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Search installed base")).toHaveValue(
    "SYN-" + id,
  );
});
test("EQ02 unknown, malformed, unavailable camera and denial retain manual lookup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "BarcodeDetector", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/equipment/lookup");
  expect(
    await page.evaluate(() =>
      (
        document as Document & {
          featurePolicy: { allowsFeature(name: string): boolean };
        }
      ).featurePolicy.allowsFeature("camera"),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Start camera" }).click();
  await expect(
    page.getByText(/QR camera scanning is unavailable/),
  ).toBeVisible();
  await page
    .getByLabel("Asset reference, UUID or serial")
    .fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Look up equipment" }).click();
  await expect(
    page.getByRole("heading", { name: "This identifier is not recognised" }),
  ).toBeVisible();
  await page.getByLabel("Asset reference, UUID or serial").fill(randomUUID());
  await page.getByRole("button", { name: "Look up equipment" }).click();
  await expect(
    page.getByRole("heading", { name: /No permitted match/ }),
  ).toBeVisible();
  await page.addInitScript(() => {
    Object.defineProperty(window, "BarcodeDetector", {
      configurable: true,
      value: class {
        static async getSupportedFormats() {
          return ["qr_code"];
        }
        async detect() {
          return [];
        }
      },
    });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        throw new DOMException("Synthetic denial", "NotAllowedError");
      },
    });
  });
  await page.reload();
  await page.getByRole("button", { name: "Start camera" }).click();
  await expect(page.getByText(/Camera permission was denied/)).toBeVisible();
  await expect(
    page.getByLabel("Asset reference, UUID or serial"),
  ).toBeEnabled();
});
test("EQ03 native proposal, uncertain response recovery and exact successor survive reload", async ({
  page,
  baseURL,
}) => {
  const id = await fixture(page, baseURL!);
  await page.goto(`/equipment/${id}?view=configuration`);
  const form = page.getByRole("tabpanel", {
    name: "Configuration",
    exact: true,
  });
  await form
    .getByLabel("Configuration description", { exact: true })
    .fill("SYN H1 / F2\nSYN logical programme Z2; Facility unchanged");
  await form
    .getByLabel("Actual effective date and time")
    .fill("2026-09-20T10:00");
  await form
    .getByLabel("Source / evidence reference")
    .fill("SYN supplier change notice");
  await form.getByLabel("Exact source revision").fill("r02");
  await page
    .getByRole("tab", { name: "Movement & retirement", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Propose a physical lifecycle change" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await expect(form.getByLabel("Exact source revision")).toHaveValue("r02");
  const fieldIds = await page
    .locator(
      ".eq-workspace input[id], .eq-workspace textarea[id], .eq-workspace select[id]",
    )
    .evaluateAll((elements) => elements.map((el) => el.id));
  expect(new Set(fieldIds).size).toBe(fieldIds.length);
  await form
    .getByLabel("Reason for change", { exact: true })
    .fill("SYN source-backed successor");
  await form
    .getByLabel("Reviewed consequences")
    .fill(
      "SYN prior Service and Inspection bases retained; warranty and installed location unchanged",
    );
  await page.getByRole("button", { name: "Preview current impact" }).click();
  await expect(
    page.getByRole("heading", { name: /Current impact/ }),
  ).toBeVisible();
  let lost = false;
  await page.route(`**/api/v1/equipment/${id}/changes`, async (route) => {
    if (route.request().method() === "POST" && !lost) {
      lost = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Record proposal for review" })
    .click();
  await expect(
    page.getByRole("button", { name: "Recover original operation" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Recover original operation" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Configuration successor · Proposed" }),
  ).toHaveCount(1);
  await form
    .getByLabel("Review reason", { exact: true })
    .fill("SYN compared exact original and successor");
  await page.getByRole("button", { name: "Apply reviewed change" }).click();
  await expect(
    page.getByRole("heading", { name: "Configuration successor · Applied" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Revision 2", exact: true }),
  ).toBeVisible();
  const r = await page.request.get(baseURL + "/api/v1/equipment/" + id),
    body = await r.json();
  expect(body.asset.configurations).toHaveLength(2);
  expect(
    body.asset.configurations.filter(
      (c: { is_current: boolean }) => c.is_current,
    ),
  ).toHaveLength(1);
});
test("EQ07/08 native evidence forms save only their declared kind and retain exact source", async ({
  page,
  baseURL,
}) => {
  const id = await fixture(page, baseURL!);
  await page.goto(`/equipment/lifecycle?asset_id=${id}`);
  await page
    .getByRole("button", { name: "Record support evidence", exact: true })
    .click();
  await page
    .getByLabel("Exact source reference", { exact: true })
    .fill("SYN manufacturer support bulletin");
  await page.getByLabel("Exact source revision", { exact: true }).fill("r01");
  await page.getByLabel("Source date", { exact: true }).fill("2026-09-15");
  await page
    .getByLabel("Uncertainty / limits")
    .fill("SYN dates not supplied; retain Unknown");
  await page
    .getByLabel("Reason for recording")
    .fill("SYN retained support source");
  await page
    .getByRole("button", { name: "Record evidence", exact: true })
    .click();
  await expect(
    page.getByText("SYN manufacturer support bulletin", { exact: false }),
  ).toBeVisible();
  await page.goto(`/equipment/backups?asset_id=${id}`);
  await page
    .getByRole("button", { name: "Record backup", exact: true })
    .click();
  for (const [label, value] of [
    [
      "Protected backup location / document reference",
      "SYN protected backup reference",
    ],
    ["Exact source revision", "r01"],
    ["Backup reference", "SYN BK browser"],
    ["Captured by", "SYN technician"],
    ["Custodian", "SYN Engineering"],
    ["Software / firmware compatibility", "SYN H1 F1"],
    ["Recovery procedure reference", "SYN recovery instructions"],
    ["Exact procedure revision", "r01"],
    ["Reason for recording", "SYN captured exact basis"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel("Capture date and time").fill("2026-09-15T10:00");
  await page
    .getByRole("button", { name: "Record evidence", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "SYN BK browser" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Current configuration basis", { exact: true }),
  ).toBeVisible();
});
test("EQ permissions clear records after identity switch; missing sources remain explicit", async ({
  page,
  baseURL,
}) => {
  const id = await fixture(page, baseURL!);
  await page.goto(`/equipment/${id}`);
  await expect(
    page.getByRole("heading", { name: "SYN Equipment browser pump" }),
  ).toBeVisible();
  await login(page, baseURL!, "other-workspace");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "SYN Equipment browser pump" }),
  ).toHaveCount(0);
  await expect(page.getByText(/record is unavailable/i).first()).toBeVisible();
});
test("EQ06 native bulletin retains candidate and reviewed disposition separately", async ({
  page,
  baseURL,
}) => {
  const id = await fixture(page, baseURL!),
    reference = `SYN-B-${id}`;
  await page.goto("/equipment/bulletins");
  await page
    .getByRole("button", { name: "Record bulletin revision", exact: true })
    .click();
  await page.getByLabel("Company context").selectOption(company);
  for (const [label, value] of [
    ["Bulletin reference", reference],
    ["Bulletin revision", "r01"],
    ["Title", "SYN exact candidate review"],
    ["Publication date", "2026-09-15"],
    ["Exact serial criterion", `SYN-${id}`],
    ["Exact source reference", "SYN supplier bulletin"],
    ["Reason for recording", "SYN reviewed original source"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByRole("button", { name: "Record evidence", exact: true })
    .click();
  const card = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: `${reference} · r01 · Open`,
      exact: true,
    }),
  });
  await expect(
    card.getByText(
      /\d+ permitted candidates. Matching does not establish applicability\./,
    ),
  ).toBeVisible();
  await card.getByText("Review Asset applicability", { exact: true }).click();
  await expect(
    card.getByText("Source: SYN supplier bulletin · 2026-09-15", {
      exact: true,
    }),
  ).toBeVisible();
  const candidates = await card
    .getByLabel("Candidate equipment")
    .locator("option")
    .evaluateAll((options) =>
      options
        .map((option) => (option as HTMLOptionElement).value)
        .filter(Boolean),
    );
  expect(candidates).toContain(id);
  expect(candidates.length).toBeGreaterThan(1); // Unknown serials remain candidates, never automatic exclusions.
  await card.getByLabel("Candidate equipment").selectOption(id);
  await card
    .getByLabel("Applicability", { exact: true })
    .selectOption("NotApplicable");
  await card
    .getByLabel("Applicability evidence")
    .fill("SYN exact serial and source comparison");
  await card.getByLabel("Evidence revision").fill("r01");
  await card
    .getByLabel("Review / closure reason")
    .fill("SYN reviewed exclusion in retained supplier source");
  await card.getByRole("button", { name: "Record Asset disposition" }).click();
  await expect(
    card.getByRole("listitem").filter({ hasText: "NotApplicable" }),
  ).toBeVisible();
  await card
    .getByRole("button", { name: "Close bulletin after all dispositions" })
    .click();
  await expect(
    card
      .getByRole("alert")
      .filter({
        hasText:
          "Every candidate and previously reviewed Asset needs a current definitive disposition.",
      })
      .first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: `${reference} · r01 · Open`,
      exact: true,
    }),
  ).toBeVisible();
});
test("EQ09 native calibration creation and withdrawal retain certificate evidence", async ({
  page,
}) => {
  const reference = `SYN-I-${randomUUID()}`;
  await page.goto("/equipment/instruments");
  await page
    .getByRole("button", { name: "Record calibration evidence", exact: true })
    .click();
  await page.getByLabel("Company context").selectOption(company);
  for (const [label, value] of [
    ["Instrument reference", reference],
    ["Description", "SYN browser pressure gauge"],
    ["Measurement type", "Pressure"],
    ["Measurement range", "0-1000"],
    ["Unit", "kPa"],
    ["Calibration reference", `SYN-C-${randomUUID()}`],
    ["Calibration version", "r01"],
    ["Valid from", "2026-09-01"],
    ["Valid to", "2027-08-31"],
    ["Exact certificate evidence reference", "SYN certificate source"],
    ["Certificate revision", "r01"],
    ["Reason for recording", "SYN reviewed certificate and range"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByRole("button", { name: "Record certificate evidence", exact: true })
    .click();
  const card = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: `${reference} · SYN browser pressure gauge`,
      exact: true,
    }),
  });
  await expect(
    card.getByText("SYN certificate source · r01", { exact: true }),
  ).toBeVisible();
  await card
    .getByText("Record retrospective withdrawal", { exact: true })
    .click();
  await card.getByLabel("Withdrawal effective from").fill("2026-09-10");
  await card
    .getByLabel("Source-backed withdrawal reason")
    .fill("SYN supplier withdrawal notice r02");
  await card
    .getByRole("button", { name: "Record withdrawal", exact: true })
    .click();
  await expect(
    card.getByText(/2026-09-10 · SYN supplier withdrawal notice r02/),
  ).toBeVisible();
  await page.reload();
  await expect(
    card.getByText("SYN certificate source · r01", { exact: true }),
  ).toBeVisible();
});
for (const width of [1440, 1280, 1024, 768, 430, 390, 320]) {
  test(`EQ family reflows and preserves source decisions at ${width}px`, async ({
    page,
    baseURL,
  }, info) => {
    test.skip(
      info.project.name !== "desktop-chromium",
      "One exact matrix per declared width.",
    );
    test.setTimeout(120000);
    const id = await fixture(page, baseURL!);
    await page.setViewportSize({ width, height: 960 });
    const routes = [
      ["register", "/equipment?q=SYN"],
      ["record", `/equipment/${id}`],
      ["configuration", `/equipment/${id}?view=configuration`],
      ["lifecycle", `/equipment/${id}?view=lifecycle`],
      ["history", `/equipment/${id}?view=history`],
      ["lookup", `/equipment/lookup?q=${id}`],
      ["backups", `/equipment/backups?asset_id=${id}`],
      ["bulletins", "/equipment/bulletins"],
      ["support", `/equipment/lifecycle?asset_id=${id}`],
      ["instruments", "/equipment/instruments"],
    ];
    for (const [name, path] of routes) {
      await page.goto(path);
      await expect(page.locator(".eq-workspace h1")).toBeVisible();
      await expect(page.getByText(/^Loading permitted records/)).toHaveCount(0);
      await expect(page.locator(".business-error[role=alert]")).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: info.outputPath(`eq-${name}-${width}.png`),
      });
    }
  });
}
test("EQ retained reference and shared controls are independently inspected; keyboard and 200 percent reflow", async ({
  page,
  browser,
  baseURL,
}, info) => {
  test.skip(
    info.project.name !== "desktop-chromium",
    "One paired reference proof.",
  );
  const source = await browser.newPage();
  try {
    for (const [name, file] of [
      [
        "equipment",
        "docs/reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html",
      ],
      [
        "theme",
        "docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html",
      ],
    ]) {
      expect((await readFile(file, "utf8")).length).toBeGreaterThan(1000);
      for (const width of [1440, 390]) {
        await source.setViewportSize({ width, height: 960 });
        await source.goto(pathToFileURL(resolve(file)).href);
        await expect(source.locator("h1").first()).toBeVisible();
        await source.screenshot({
          path: info.outputPath(`source-${name}-${width}.png`),
        });
      }
    }
  } finally {
    await source.close();
  }
  const id = await fixture(page, baseURL!);
  await page.goto(`/equipment/${id}`);
  await page.getByRole("tab", { name: "Overview", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Configuration", exact: true }),
  ).toBeFocused();
  await page.setViewportSize({ width: 720, height: 480 }); // Effective CSS viewport of a 1440px desktop at 200% zoom.
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    .toBe(true);
  const style = await page
    .locator(".eq-workspace .ppo-button:visible")
    .first()
    .evaluate((el) => ({
      font: getComputedStyle(el).fontFamily,
      height: el.getBoundingClientRect().height,
      outline: getComputedStyle(el).outlineStyle,
    }));
  expect(style.font).toContain("Roboto");
  expect(style.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: info.outputPath("eq-effective-200-percent.png"),
  });
});
