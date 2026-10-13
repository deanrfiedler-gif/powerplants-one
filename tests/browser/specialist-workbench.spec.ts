import { randomUUID } from "node:crypto";
import type { CostLine } from "../../src/estimating/math";
import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { fixtureIds } from "../../src/estimating/specialist/fixture-policy";
import { compareEs08Design } from "../helpers/es08-design";
const fixture = (...args: string[]) =>
  execFileSync(
    process.execPath,
    [
      "--env-file=.env.local",
      "--import",
      "tsx",
      "scripts/es08-fixture.ts",
      ...args,
    ],
    { stdio: "pipe" },
  );
const path = `/estimating/configurations/${fixtureIds.configuration}`,
  api = `/api/v1/estimating/configurations/${fixtureIds.configuration}`;
test.use({ actionTimeout: 15000 });
test.beforeEach(() => {
  fixture("reset");
});
async function login(page: Page, route = path + "/configure") {
  await page.goto(route);
  await page
    .getByLabel("Identity", { exact: true })
    .selectOption("coordinator");
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(page.locator("#ppo-specialist h1")).toBeVisible();
}
// The seven views are the module header's own navigation (design board
// departure D1); the secondary menu now lists the current view contents.
// A view link's accessible name includes its count badge ("Drawings 5 sheets"),
// so match the label at the start of the name.
async function view(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Workbench views", exact: true })
    .getByRole("link", { name: new RegExp("^" + name.replace(/[^\w ]/g, (c) => "\\" + c)) })
    .click();
}
// The readiness strip is a description list; Playwright has no role for it.
const gates = (page: Page) => page.locator(".es08-gates");
test("ES08 native seven views, shared shell, drawing set, dense parts and responsive evidence", async ({
  page,
  context,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1920, height: 1200 });
  await login(page);
  await expect(gates(page)).toContainText("Model resolves · 1,843 m² floor");
  await expect(
    page.getByRole("status").filter({ hasText: /Draft v\d+ · saved/ }),
  ).toBeVisible();
  await compareEs08Design(page, context, info);
  for (const [name, slug, heading] of [
    ["Configure", "configure", "Configure"],
    ["Drawings", "drawings", "Drawing set"],
    ["Parts & working", "parts", "Parts & working"],
    ["Pricing", "pricing", "Commercial review"],
    ["Compare & save", "compare", "Compare & save"],
    ["Definition review", "definition", "Definition review"],
    ["Run history", "history", "Immutable run history"],
  ]) {
    await view(page, name);
    await expect(page).toHaveURL(new RegExp(slug + "$"));
    await expect(
      page.locator("#es08-content").getByRole("heading", { name: heading, exact: true, level: 2 }),
    ).toBeVisible();
    // The module header, its seven views and the six gates stay on every view (D8).
    await expect(gates(page)).toBeVisible();
    if (slug === "history")
      await expect(
        page.getByRole("button", { name: "Inspect", exact: true }),
      ).toBeVisible();
    await page.screenshot({ path: info.outputPath(`es08-${slug}-1920.png`) });
    if (slug === "configure") {
      const live = page.getByRole("group", { name: "Live drawing", exact: true });
      await live.getByRole("button", { name: "Plan", exact: true }).click();
      await expect(
        page.getByRole("img", { name: /^Schematic plan, 48\.0 m long/ }),
      ).toBeVisible();
      await live.getByRole("button", { name: "Section", exact: true }).click();
      await expect(
        page.getByRole("img", { name: /cross section: 6 spans of 6\.4 m/ }),
      ).toBeVisible();
      // Every roof profile draws from the one shared section component (D5, D15).
      const profile = page.getByRole("group", { name: "Roof profile", exact: true });
      for (const [name, pattern] of [
        ["Venlo", /^Venlo cross section/],
        ["Gothic", /^Gothic cross section/],
        ["Sawtooth", /^Sawtooth cross section/],
        ["Gable", /^Gable cross section/],
      ]) {
        await profile.getByRole("button", { name, exact: true }).click();
        await expect(page.getByRole("img", { name: pattern })).toBeVisible();
      }
      // A drawing-only error withholds the section and never the quantities (D14).
      await profile.getByRole("button", { name: "Venlo", exact: true }).click();
      await page
        .getByRole("group", { name: "Venlo roof width", exact: true })
        .getByRole("button", { name: "4.0 m", exact: true })
        .click();
      await expect(
        page.getByRole("img", { name: /^Cross section withheld/ }),
      ).toBeVisible();
      await expect(gates(page)).toContainText("Drawing withheld");
      await expect(gates(page)).toContainText("Quantities valid");
      await page
        .getByRole("group", { name: "Venlo roof width", exact: true })
        .getByRole("button", { name: "3.2 m", exact: true })
        .click();
      await profile.getByRole("button", { name: "Gable", exact: true }).click();
      await expect(gates(page)).toContainText("Model resolves");
    }
    if (slug === "drawings") {
      for (const pattern of [
        /^Plan, 48\.0 m long by 38\.4 m wide/,
        /cross section: 6 spans/,
        /^Longitudinal section, 48\.0 m long/,
        /^Bay section of bays B03 and B04/,
        /^Standard screen cut 20\.0 m by 4\.3 m/,
      ])
        await expect(page.getByRole("img", { name: pattern })).toBeVisible();
      await page
        .getByRole("button", { name: "Select field B05 group B", exact: true })
        .click();
      await expect(page.getByRole("status").filter({ hasText: "B05·B" })).toBeVisible();
      await expect(
        page.getByRole("img", { name: /^Bay section of bays B05 and B06/ }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Open", exact: true }).click();
      await expect(
        page.getByRole("img", { name: /screen open:/ }),
      ).toBeVisible();
      await expect(page.getByText("Estimating study · not for fabrication").first()).toBeVisible();
      await expect(page.getByRole("heading", { name: "Cut schedule", exact: true })).toBeVisible();
      await expect(page.getByText("2,064.0 m²").first()).toBeVisible();
      await page.screenshot({ path: info.outputPath("es08-drawings-selected-1920.png") });
    }
    if (slug === "parts") {
      await page
        .getByRole("navigation", { name: "Position state", exact: true })
        .getByRole("button", { name: /^All · / })
        .click();
      await expect(page.locator(".es08-table--parts tbody tr")).toHaveCount(
        143,
      );
      const opener = page
        .getByRole("row", { name: /CE-LINE-223 · / })
        .getByRole("button", { name: "Working for CE-LINE-223", exact: true });
      await opener.click();
      // Figma working panel overlays the desktop table and fills a phone.
      const panel = page.getByRole("dialog", { name: "Standard screen cloth", exact: true });
      await expect(panel).toBeVisible();
      await expect(panel).toContainText("24 × 20.0 m × 4.3 m = 2,064.0 m²");
      await page.screenshot({ path: info.outputPath("es08-working-1920.png") });
      await page.keyboard.press("Escape");
      await expect(panel).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
    if (slug === "history") {
      await page.getByRole("button", { name: "Inspect", exact: true }).click();
      await expect(page.getByRole("dialog")).toContainText(
        "definition_bundle_hash",
      );
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Run R01 actions", exact: true }).click();
      const download = page.waitForEvent("download");
      await page
        .getByRole("menuitem", { name: "Export evidence", exact: true })
        .click();
      expect((await download).suggestedFilename()).toMatch(/PPO-ES08-review/);
      // The export is a download, not a departure: the leave guard stays
      // closed although the profile edits above left the draft unsaved.
      await expect(
        page.getByRole("dialog", { name: "Unsaved configuration changes" }),
      ).toHaveCount(0);
    }
  }
  await view(page, "Configure");
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [1024, 768],
    [390, 844],
    [320, 800],
    [960, 600],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: info.outputPath(`es08-configure-${width}.png`),
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
    await expect(
      page.getByRole("button", { name: "Save draft", exact: true }),
    ).toBeVisible();
    if (width <= 390) {
      const save = page.getByRole("button", {
        name: "Save draft",
        exact: true,
      });
      await save.scrollIntoViewIfNeeded();
      const box = (await save.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(height - 8);
      // The phone stepper replaces the section list (design board D).
      await expect(
        page.getByRole("button", { name: "Next section", exact: true }).first(),
      ).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`es08-actions-${width}.png`),
      });
      await page.locator("#ppo-specialist h1").scrollIntoViewIfNeeded();
    }
  }
  expect(errors).toEqual([]);
});
test("ES08 durable raw draft, manual re-review, native receiving, exact history and contribution link", async ({
  page,
}, info) => {
  await login(page);
  await page.locator("#es08-span").fill("-");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved to the server" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("#es08-span")).toHaveValue("-");
  // A quantity error withholds every result and names the rule on the field.
  await expect(page.locator("#es08-span")).toHaveAttribute("aria-invalid", "true");
  await expect(gates(page)).toContainText("Withheld");
  await page.locator("#es08-span").fill("6.4");
  await page.locator("#es08-bays").fill("13");
  await view(page, "Compare & save");
  await page
    .getByRole("button", { name: "Review all manual quantities", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Record review of all 14 displayed values",
      exact: true,
    })
    .click();
  await page
    .getByRole("checkbox", { name: /I understand run R02 is a local design record/ })
    .check();
  await expect(gates(page)).toContainText("14 of 14");
  // Hold the resource reload behind the accepted command read. The old
  // resource must not restore the previous version while that reload waits.
  let releaseRefresh!: () => void;
  let refreshStarted!: () => void;
  const refreshGate = new Promise<void>((resolve) => {
    releaseRefresh = resolve;
  });
  const refreshPending = new Promise<void>((resolve) => {
    refreshStarted = resolve;
  });
  const detailRoute = new RegExp(api + "$");
  await page.route(detailRoute, async (route) => {
    // The shared resource also polls periodically. Classify by accepted UI
    // state so an intervening poll cannot make us hold the command's own read.
    if (
      route.request().method() === "GET" &&
      await page.getByRole("status")
        .filter({ hasText: "Saved to the server" }).isVisible()
    ) {
      refreshStarted();
      await refreshGate;
    }
    await route.continue();
  });
  await expect(
    page.getByRole("button", { name: "Save review run", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Save review run", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved to the server" }),
  ).toBeVisible();
  await refreshPending;
  await page
    .getByText("Review native AUD rates for 11 saved positions", {
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Use authored synthetic 1.00 / 2.00 rate proposal",
      exact: true,
    })
    .click();
  try {
    const reviewed = page.waitForResponse((response) =>
      response.url().endsWith(`${api}/receiving-preview`),
    );
    await page
      .getByRole("button", { name: "Review estimate changes", exact: true })
      .click();
    expect((await reviewed).status()).toBe(200);
  } finally {
    releaseRefresh();
    await page.unrouteAll({ behavior: "wait" });
  }
  await expect(
    page.getByRole("button", { name: "Apply reviewed changes", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Apply reviewed changes", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("es08-receiving-comparison.png"),
  });
  await page
    .getByRole("button", { name: "Cancel receiving comparison", exact: true })
    .click();
  let d = await (await page.request.get(api)).json();
  expect(d.estimate.version).toBe(1);
  await page
    .getByRole("button", { name: "Review estimate changes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply reviewed changes", exact: true })
    .click();
  await expect(page.getByText(/Saved estimate v2:/)).toBeVisible();
  d = await (await page.request.get(api)).json();
  expect(d.adoptions).toHaveLength(1);
  const estimateApi = `/api/v1/estimating/estimates/${fixtureIds.estimate}`;
  const estimate = await (await page.request.get(estimateApi)).json();
  const deleted = estimate.specialist_contributions.find(
    (c: { key: string }) => c.key === "CE-LINE-240",
  );
  const edited = estimate.specialist_contributions.find(
    (c: { key: string }) => c.key === "CE-LINE-242",
  );
  const manual = estimate.saved.lines[0];
  const lines = estimate.saved.lines
    .filter((l: CostLine) => l.id !== deleted.line_id)
    .map((l: CostLine) =>
      l.id === edited.line_id ? { ...l, quantity: "999" } : l,
    );
  const save = await page.request.post(estimateApi, {
    headers: { Origin: new URL(page.url()).origin },
    data: {
      operation_id: randomUUID(),
      schema_version: 2,
      reason: "SYN browser manual edit and deliberate deletion",
      expected_version: estimate.version,
      title: estimate.saved.title,
      scope: estimate.saved.scope,
      lines,
      policy: estimate.saved.policy,
    },
  });
  expect(save.status()).toBe(200);
  await page.reload();
  await page
    .getByText("Review native AUD rates for 11 saved positions", {
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Use authored synthetic 1.00 / 2.00 rate proposal",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Review estimate changes", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Apply reviewed changes", exact: true }),
  ).toBeDisabled();
  // Every required decision is chosen in place as a segmented choice (D10).
  await page
    .getByRole("group", { name: "CE-LINE-240 decision", exact: true })
    .getByRole("button", { name: "Keep omitted", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review estimate changes", exact: true })
    .click();
  await page
    .getByRole("group", { name: "CE-LINE-242 decision", exact: true })
    .getByRole("button", { name: /^Keep saved/ })
    .click();
  await page
    .getByRole("button", { name: "Review estimate changes", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Apply reviewed changes", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Apply reviewed changes", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("es08-receiving-manual-deletion.png"),
  });
  await page
    .getByRole("button", { name: "Apply reviewed changes", exact: true })
    .click();
  await expect(page.getByText(/Saved estimate v4:/)).toBeVisible();
  const after = await (await page.request.get(estimateApi)).json();
  expect(
    after.saved.lines.find((l: CostLine) => l.id === edited.line_id).quantity,
  ).toBe("999.000");
  expect(
    after.saved.lines.some((l: CostLine) => l.id === deleted.line_id),
  ).toBe(false);
  expect(after.saved.lines[0]).toEqual(manual);
  await page.goto(`/estimating/estimates/${fixtureIds.estimate}`);
  await page.getByText(/Specialist contribution evidence/).click();
  await expect(page.getByText(/CE-LINE-242/)).toBeVisible();
});
test("ES08 reload recovery after accepted and unaccepted saves retains only a minimal pointer", async ({
  page,
}, info) => {
  await login(page);
  let lost = true;
  await page.route(
    "**/api/v1/estimating/configurations/*/draft",
    async (route) => {
      if (lost) {
        lost = false;
        await route.fetch();
        await route.abort("failed");
      } else await route.continue();
    },
  );
  await page.locator("#es08-bays").fill("13");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Outcome unknown/ })).toBeVisible();
  const stored = await page.evaluate(() =>
    Object.entries(sessionStorage).filter(([k]) =>
      k.startsWith("ppo:es08:pending"),
    ),
  );
  expect(stored).toHaveLength(1);
  expect(stored[0][1]).not.toMatch(/proposal|unit_cost|manual_quantities/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resolve original outcome", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Resolve original outcome", exact: true })
    .click();
  await expect(
    page.getByText("Original accepted", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#es08-bays")).toHaveValue("13");
  await page.unroute("**/api/v1/estimating/configurations/*/draft");
  await page.route("**/api/v1/estimating/configurations/*/draft", (route) =>
    route.abort("failed"),
  );
  await page.locator("#es08-bays").fill("14");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Outcome unknown/ })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Resolve original outcome", exact: true })
    .click();
  await expect(
    page.getByText("Closed without acceptance", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#es08-bays")).toHaveValue("13");
  await page.screenshot({
    path: info.outputPath("es08-terminal-recovery.png"),
  });
});
test("ES08 create recovery through reload, read-only review and permission withdrawal", async ({
  page,
}, info) => {
  await login(page, "/estimating/configurations/new");
  await page.route("**/api/v1/estimating/configurations", (route) =>
    route.request().method() === "POST"
      ? route.abort("failed")
      : route.continue(),
  );
  await page
    .getByRole("button", { name: "Create configuration", exact: true })
    .click();
  await expect(page.getByRole("status").filter({ hasText: /Outcome unknown/ })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Resolve original outcome", exact: true })
    .click();
  await expect(
    page.getByText("Closed without acceptance", { exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/v1/estimating/configurations");
  fixture("revoke-edit");
  await page.goto(path + "/history");
  await expect(
    page.getByRole("heading", { name: "Immutable run history" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".es08-notices").getByRole("heading", { name: "Read-only", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("es08-read-only.png") });
  fixture("revoke-read");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByText("SYN Northbank Screen Systems", { exact: true }),
  ).toHaveCount(0);
  expect((await page.request.get(api)).status()).toBe(404);
  await page.screenshot({
    path: info.outputPath("es08-permission-withdrawn.png"),
  });
});

test("ES08-T52 late preview cannot replace a newer calculation", async ({
  page,
}) => {
  await login(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let delivered!: () => void;
  const finished = new Promise<void>((resolve) => {
    delivered = resolve;
  });
  let reached!: () => void;
  const started = new Promise<void>((resolve) => {
    reached = resolve;
  });
  await page.route(
    "**/api/v1/estimating/configurations/*/preview",
    async (route) => {
      if (route.request().postDataJSON().proposal.inputs.bays.raw === "13") {
        const response = await route.fetch();
        reached();
        await gate;
        await route.fulfill({ response });
        delivered();
      } else await route.continue();
    },
  );
  await page.locator("#es08-bays").fill("13");
  await started;
  const latest = page.waitForResponse(
    (r) =>
      r.url().endsWith("/preview") &&
      r.request().postDataJSON().proposal.inputs.bays.raw === "14",
  );
  await page.locator("#es08-bays").fill("14");
  await latest;
  await expect(gates(page)).toContainText("2,150 m² floor");
  const current = await gates(page).innerText();
  release();
  await finished;
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(gates(page)).toHaveText(current, {
    useInnerText: true,
  });
  // The compact strip hides its detailed floor figure; assert that figure
  // explicitly so a stale preview cannot pass on the generic “Valid” label.
  await expect(gates(page)).toContainText("2,150 m² floor");
  await expect(page.locator("#es08-bays")).toHaveValue("14");
});


test("ES08 Figma contents, findings filter, working focus and phone actions retain one proposal", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  const expandRail = page.getByRole("button", { name: "Expand primary navigation", exact: true });
  if (await expandRail.isVisible()) await expandRail.click();
  // Independent dimensions read from Figma frame 416:92770. These check the
  // shared rail/menu and module bands, not a screenshot generated by this code.
  await expect.poll(async () => (await page.locator(".es08-main").boundingBox())?.x).toBe(480);
  expect((await page.locator(".es08-header-top").boundingBox())!.height).toBe(101);
  expect(Math.abs((await page.locator(".es08-context").boundingBox())!.height - 75)).toBeLessThanOrEqual(2);
  expect(Math.abs((await page.locator(".es08-views").boundingBox())!.height - 45)).toBeLessThanOrEqual(2);
  expect((await gates(page).boundingBox())!.height).toBeLessThanOrEqual(43);
  await expect(page.locator(".es08-stale-note")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("es08-figma-configure-docked-1440.png") });
  const sections = page.getByRole("navigation", { name: "Configuration sections" });
  await sections.getByRole("button", { name: /2.*Cloth/ }).click();
  await expect(page.locator("#es08-roll-width")).toBeVisible();
  await page.locator("#es08-roll-width").fill("4200");
  await expect(page.locator("#es08-roll-width")).toHaveAttribute("aria-invalid", "true");
  await page.locator("#es08-roll-width").fill("");
  await view(page, "Definition review");
  await page.getByRole("navigation", { name: "Finding kinds" }).getByRole("button", { name: /AUD/ }).click();
  await expect(page.locator(".es08-findings > li")).toHaveCount(3);
  await expect(page.locator(".es08-findings")).not.toContainText("REV-01");
  await page.getByRole("navigation", { name: "Finding kinds" }).getByRole("button", { name: /All findings/ }).click();
  await expect(page.locator(".es08-findings > li")).toHaveCount(38);
  await view(page, "Parts & working");
  await page.getByRole("button", { name: "Working for CE-LINE-223" }).click();
  const working = page.getByRole("dialog", { name: "Standard screen cloth", exact: true });
  await expect(working).toBeVisible();
  expect((await working.boundingBox())!.width).toBe(440);
  await page.screenshot({ path: info.outputPath("es08-figma-working-1440.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Working for CE-LINE-223" })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await view(page, "Configure");
  await expect(page.locator(".es08-header h1")).toBeVisible();
  await expect(page.locator(".topbar.ppo-shell-header")).toBeHidden();
  // Phone frame 425:5176: compact header and actions stay at viewport edges.
  const phoneHeader = (await page.locator(".es08-header-top").boundingBox())!;
  expect(phoneHeader.y).toBe(0);
  expect(phoneHeader.height).toBe(64);
  expect((await page.locator(".es08-actions").boundingBox())!.y).toBe(772);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole("button", { name: /^Draft v.*Readiness/ }).click();
  await expect(gates(page)).toBeVisible();
  await page.getByRole("button", { name: /^Draft v.*Readiness/ }).click();
  await page.getByRole("button", { name: "Workbench actions", exact: true }).click();
  const actions = page.getByRole("dialog", { name: "Workbench actions", exact: true });
  await actions.getByLabel("Reason for next saved change").fill("Synthetic phone review");
  await expect(actions.getByRole("button", { name: "Review calculation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Workbench actions", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved to the server" })).toBeVisible();
  await view(page, "Parts & working");
  await page.getByRole("button", { name: "Working for CE-LINE-223" }).click();
  expect((await working.boundingBox())!.width).toBe(390);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Working for CE-LINE-223" })).toBeFocused();
  await view(page, "Definition review");
  await page.getByRole("combobox", { name: "Finding kind" }).selectOption("AUD");
  await expect(page.locator(".es08-findings > li")).toHaveCount(3);
  await page.getByRole("combobox", { name: "Finding kind" }).selectOption("All");
  await expect(page.locator(".es08-findings > li")).toHaveCount(38);
  await view(page, "Drawings");
  await page.getByRole("button", { name: "Select field B05 group B", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Selected screen field B05·B", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Select field B05 group B", exact: true })).toBeFocused();
  await page.screenshot({ path: info.outputPath("es08-figma-phone-drawings.png") });
});
