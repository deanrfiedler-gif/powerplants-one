import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { compareEs02Design } from "../helpers/es02-design";
import { crmBase } from "../helpers/crm";
const fixtureCommand = (args: string[] = []) =>
  execFileSync(
    process.execPath,
    [
      "--env-file-if-exists=.env.local",
      "--import",
      "tsx",
      "scripts/es02-fixture.ts",
      ...args,
    ],
    { stdio: "pipe" },
  );
test.beforeAll(() => {
  fixtureCommand();
  execFileSync(
    process.execPath,
    [
      "--env-file-if-exists=.env.local",
      "--import",
      "tsx",
      "scripts/es02-boundary-proof.ts",
    ],
    { stdio: "pipe" },
  );
});
test.afterAll(() => {
  fixtureCommand(["restore-owner"]);
});
test.use({ actionTimeout: 15000 });
test("ES02 native five steps, exact saved costs, family filters, evidence, dirty navigation and responsive capture", async ({
  page,
  context,
}, info) => {
  const fixture = JSON.parse(await readFile("tmp/es02-fixture.json", "utf8"));
  await page.goto(fixture.route);
  await page
    .getByLabel("Identity", { exact: true })
    .selectOption("coordinator");
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Northbank climate & irrigation upgrade",
      exact: true,
    }),
  ).toBeVisible();
  await compareEs02Design(page, context, info);
  const summary = page.getByRole("complementary", { name: "Estimate summary" });
  await expect(summary).toContainText("Estimate v04");
  await expect(summary).toContainText("AUD 58,400.00");
  await expect(summary).toContainText("Discovery r02");
  await expect(page.getByRole("tab", { name: "Alternatives 3" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Revisions 3" })).toBeVisible();
  await expect(
    page.getByText("EQ-00142 · Climate controller", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Climate control", exact: true })
    .click();
  await expect(page.getByLabel("System name", { exact: true })).toHaveValue(
    "Climate control",
  );
  await page
    .getByLabel("Proposed work", { exact: true })
    .fill("Retain controller and expand zones — working review");
  await expect(summary).toContainText("working copy of r03");
  await expect(
    page.getByRole("button", { name: "Save discovery revision", exact: true }),
  ).toBeEnabled();
  await expect(summary).toContainText("AUD 58,400.00");
  await page
    .getByRole("button", { name: "Nursery machinery 0 systems", exact: true })
    .click();
  await expect(
    page.getByText("No matching systems.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("System name", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "All families", exact: true }).click();
  await page
    .getByRole("button", { name: "Climate control", exact: true })
    .click();
  await expect(page.getByLabel("Proposed work", { exact: true })).toHaveValue(
    "Retain controller and expand zones — working review",
  );
  await page
    .getByRole("button", { name: "View configuration evidence", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Configuration evidence" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  for (const label of [
    "1. Requirements",
    "3. Scope & delivery",
    "4. Pricing",
    "5. Review",
    "2. Configuration",
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(summary).toContainText("AUD 58,400.00");
  }
  await expect(page.getByLabel("System name", { exact: true })).toHaveValue(
    "Climate control",
  );
  await page.getByRole("tab", { name: "Alternatives 3" }).click();
  await page
    .getByRole("button", { name: "View alternative B — Fresh scope" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Unsaved discovery", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stay", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(fixture.workspace_id));
  await page.getByRole("tab", { name: "Revisions 3" }).click();
  await expect(
    page.getByRole("heading", { name: "Immutable discovery revisions" }),
  ).toBeVisible();
  await page.getByLabel("Baseline saved revision").selectOption(fixture.r02);
  await page.getByLabel("Target saved revision").selectOption(fixture.r03);
  await page
    .getByRole("button", { name: "Compare saved revisions", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Saved revision comparison" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Discovery", exact: true }).click();
  // A same-document programmatic transition must meet the same dirty guard.
  await page.evaluate(() => history.pushState({}, "", "/estimating/discovery"));
  await expect(
    page.getByRole("dialog", { name: "Unsaved discovery", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stay", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(fixture.workspace_id));
  await page
    .getByRole("button", { name: "Climate control", exact: true })
    .click();
  const captures = [];
  for (const [width, height] of [
    [1920, 1200],
    [1440, 900],
    [1280, 900],
    [1024, 900],
    [768, 1024],
    [390, 844],
    [320, 740],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(page.locator("#ppo-estimate-wizard")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const bytes = await page.screenshot({
      path: info.outputPath(`es02-${width}.png`),
    });
    captures.push({
      viewport: { width, height },
      route: fixture.route,
      schema: fixture.schema,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  await writeFile(
    info.outputPath("es02-captures.json"),
    JSON.stringify(captures, null, 2),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  const columns = page.getByRole("region", { name: "Systems & configuration", exact: true }).locator(".es02-columns");
  await columns.locator("summary").click();
  await columns.getByRole("checkbox", { name: "Family", exact: true }).check();
  await columns
    .getByRole("button", { name: "Move Family left", exact: true })
    .click();
  await columns
    .getByRole("slider", { name: "Family column width", exact: true })
    .focus();
  await page.keyboard.press("ArrowRight");
  await columns.locator("summary").click();
  await expect(
    page.getByRole("columnheader", { name: "Family", exact: true }),
  ).toBeVisible();

  await page
    .getByLabel("Viewed alternative", { exact: true })
    .selectOption({ label: "B — Fresh scope · Alternative · Active" });
  await page
    .getByRole("button", { name: "Save revision then continue", exact: true })
    .click();
  await page
    .getByLabel("Discovery change reason", { exact: true })
    .fill("Synthetic ES-02 native save verification");
  for (const checkbox of await page
    .getByRole("dialog", { name: "Review discovery revision" })
    .getByRole("checkbox")
    .all())
    await checkbox.check();
  await page
    .getByRole("button", {
      name: "Confirm save discovery revision",
      exact: true,
    })
    .click();
  await expect(summary).toContainText("Alternative B — Fresh scope");
  await expect(summary).toContainText("Not yet costed");
  await page
    .getByLabel("Viewed alternative", { exact: true })
    .selectOption(fixture.option_id);
  await expect(page.getByRole("tab", { name: "Revisions 4" })).toBeVisible();
  await expect(summary).toContainText("AUD 58,400.00");
  await expect(summary).toContainText("Discovery r02");
  await page.reload();
  await expect(summary).toContainText("Estimate v04");
  await expect(page.getByRole("tab", { name: "Revisions 4" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Family", exact: true }),
  ).toBeVisible();
});

test("ES02-T65: Back, Forward, shell router, breadcrumb and installed reload review a dirty proposal once", async ({
  page,
  context,
}, info) => {
  const fixture = JSON.parse(await readFile("tmp/es02-fixture.json", "utf8"));
  const origin = info.project.use.baseURL!;
  await context.request.post(`${origin}/api/v1/local-session`, {
    headers: { Origin: origin },
    data: { profile: "coordinator" },
  });
  // Exercise the standalone-only reload entry point; this is not an installation claim.
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { value: true }),
  );
  await page.goto("/my-work");
  await page.goto(fixture.route);
  await expect(
    page.getByRole("button", { name: "Climate control", exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    history.pushState(
      {},
      "",
      `${location.pathname}?step=Configuration&proof=prior`,
    ),
  );
  await page.evaluate(() =>
    history.pushState(
      {},
      "",
      `${location.pathname}?step=Configuration&proof=forward`,
    ),
  );
  await page.goBack();
  await expect(page).toHaveURL(new RegExp("step=Configuration&proof=prior$"));
  await page
    .getByRole("button", { name: "Climate control", exact: true })
    .click();
  await page
    .getByLabel("Proposed work", { exact: true })
    .fill("SYN navigation proposal retained");
  const retained = page.url();
  const stay = async () => {
    await expect(
      page.getByRole("dialog", { name: "Unsaved discovery", exact: true }),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "Stay", exact: true }).click();
    await expect(page).toHaveURL(retained);
    await expect(page.getByLabel("Proposed work", { exact: true })).toHaveValue(
      "SYN navigation proposal retained",
    );
  };
  await page.evaluate(() => history.forward());
  await stay();
  await page.evaluate(() => history.back());
  await stay();
  // Crossing a document boundary uses Chrome's native unsaved-work warning.
  const nativeWarning = page.waitForEvent("dialog");
  await page.evaluate(() => history.go(-2));
  const warning = await nativeWarning;
  expect(warning.type()).toBe("beforeunload");
  await warning.dismiss();
  await expect(page).toHaveURL(retained);

  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Estimating", exact: true })
    .click();
  await stay();
  const search = page.getByRole("combobox", { name: "Search Powerplants One" });
  await search.fill("Northbank");
  await expect(page.getByRole("option").first()).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await stay();
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "Reload app", exact: true }).click();
  await stay();
  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Estimating", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Discard working changes then continue",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/estimating$/);
  await page.goto(fixture.route);
  await page
    .getByRole("button", { name: "Climate control", exact: true })
    .click();
  await expect(
    page.getByLabel("Proposed work", { exact: true }),
  ).not.toHaveValue("SYN navigation proposal retained");
});

test("ES02-T64: maximum area/system scope stays editable and scrolls locally", async ({
  page,
  context,
}, info) => {
  const fixture = JSON.parse(await readFile("tmp/es02-maximum.json", "utf8"));
  const origin = info.project.use.baseURL!;
  await context.request.post(`${origin}/api/v1/local-session`, {
    headers: { Origin: origin },
    data: { profile: "coordinator" },
  });
  let requests = 0;
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/v1/estimating/")) requests++;
  });
  const started = Date.now();
  await page.goto(fixture.route);
  const summary = page.getByRole("complementary", { name: "Estimate summary" });
  await expect(summary).toContainText("40 systems");
  await page.getByLabel("Search systems", { exact: true }).fill("system 40");
  await page
    .getByRole("button", { name: "SYN system 40", exact: true })
    .click();
  await expect(page.getByLabel("System name", { exact: true })).toHaveValue(
    "SYN system 40",
  );
  await page
    .getByLabel("Proposed work", { exact: true })
    .fill("SYN maximum-scope working note");
  await expect(
    page.getByRole("button", { name: "Save discovery revision", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("es02-maximum.png") });
  await writeFile(
    info.outputPath("es02-maximum.json"),
    JSON.stringify(
      {
        ...fixture,
        native_browser: {
          requests,
          observed_ms: Date.now() - started,
          viewport: page.viewportSize(),
        },
      },
      null,
      2,
    ),
  );
});

test("ES02-T59: a delayed old preview cannot restore Complete after the current draft becomes invalid", async ({
  page,
  context,
}, info) => {
  const fixture = JSON.parse(await readFile("tmp/es02-fixture.json", "utf8"));
  const origin = info.project.use.baseURL!;
  await context.request.post(`${origin}/api/v1/local-session`, {
    headers: { Origin: origin },
    data: { profile: "coordinator" },
  });
  await page.goto(fixture.route);
  await page
    .getByRole("button", { name: "Climate control", exact: true })
    .click();
  let release!: () => void;
  let started!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    started = resolve;
  });
  let first = true;
  await page.route(
    `**/api/v1/estimating/workspaces/${fixture.workspace_id}/preview`,
    async (route) => {
      if (first) {
        first = false;
        const response = await route.fetch();
        started();
        await held;
        await route.fulfill({ response });
      } else await route.continue();
    },
  );
  await page
    .getByLabel("Proposed work", { exact: true })
    .fill("SYN slower earlier valid preview");
  await requested;
  const zones = page.getByLabel("Customer-required climate zones (Zones)", {
    exact: true,
  });
  await zones.fill("");
  const summary = page.getByRole("complementary", { name: "Estimate summary" });
  await expect(summary).toContainText("Not checked");
  await expect(
    page.getByRole("button", { name: "Save discovery revision", exact: true }),
  ).toBeDisabled();
  const returned = page.waitForResponse(
    (r) => r.url().endsWith("/preview") && r.status() === 200,
  );
  release();
  await returned;
  await expect(summary).toContainText("Not checked");
  await expect(zones).toHaveValue("");
  await expect(summary).toContainText("AUD 58,400.00");
  await expect(
    page.getByRole("button", { name: "Save discovery revision", exact: true }),
  ).toBeDisabled();
});

test("ES02-T57: archived unselected incomplete scope still reads its exact saved costs with editing disabled", async ({
  page,
  context,
}, info) => {
  const fixture = JSON.parse(await readFile("tmp/es02-fixture.json", "utf8"));
  const origin = info.project.use.baseURL!;
  await context.request.post(`${origin}/api/v1/local-session`, {
    headers: { Origin: origin },
    data: { profile: "coordinator" },
  });
  const path = `${origin}/api/v1/estimating/workspaces/${fixture.workspace_id}`;
  let d = await (await context.request.get(path)).json();
  const b = d.options.find((o: { option: { label: string } }) =>
    o.option.label.startsWith("B"),
  );
  for (const [action, option] of [
    ["Select", b],
    [
      "Archive",
      d.options.find(
        (o: { option: { id: string } }) => o.option.id === fixture.option_id,
      ),
    ],
  ] as const) {
    const result = await context.request.post(path + "/options", {
      headers: { Origin: origin },
      data: {
        ...crmBase(),
        action,
        option_id: option.option.id,
        expected_version: d.workspace.version,
        expected_revision_id: option.revision.id,
        expected_selected_option_id: d.workspace.selected_option_id,
      },
    });
    expect(result.ok(), await result.text()).toBe(true);
    d = await (await context.request.get(path)).json();
  }
  await page.goto(`${fixture.route}&option=${fixture.option_id}`);
  await page
    .getByLabel("Viewed alternative", { exact: true })
    .selectOption(fixture.option_id);
  const summary = page.getByRole("complementary", { name: "Estimate summary" });
  await expect(summary).toContainText("AUD 58,400.00");
  await expect(summary).toContainText("Discovery r02");
  await expect(summary).toContainText("Incomplete");
  await page
    .getByRole("button", { name: "Climate control", exact: true })
    .click();
  await expect(page.getByLabel("System name", { exact: true })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Save discovery revision", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: info.outputPath("es02-read-only-summary.png"),
  });
});
