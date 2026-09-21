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
async function view(page: Page, name: string) {
  const toggle = page.getByRole("button", {
    name: "Expand Specialist configuration menu",
    exact: true,
  });
  if (await toggle.isVisible()) await toggle.click();
  const link = page.getByRole("link", { name, exact: true });
  if (!(await link.isVisible()))
    await page
      .getByRole("button", {
        name: "Specialist configuration menu",
        exact: true,
      })
      .click();
  await link.click();
  await expect(
    page.getByRole("dialog", {
      name: "Specialist configuration menu",
      exact: true,
    }),
  ).not.toBeVisible();
}
test("ES08 native six views, shared shell, dense parts and responsive evidence", async ({
  page,
  context,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await expect(page.locator(".es08-summary")).toContainText(
    "Current calculation",
  );
  await compareEs08Design(page, context, info);
  for (const [name, slug] of [
    ["Configure", "configure"],
    ["Parts & working", "parts"],
    ["Pricing", "pricing"],
    ["Compare & save", "compare"],
    ["Definition review", "definition"],
    ["Run history", "history"],
  ]) {
    await view(page, name);
    await expect(page).toHaveURL(new RegExp(slug + "$"));
    await expect(
      page
        .locator("#ppo-specialist h2")
        .filter({
          hasText: name === "Configure" ? "Configure Screen Systems" : name,
        })
        .first(),
    ).toBeVisible();
    if (slug === "history")
      await expect(
        page.getByRole("button", { name: "Inspect", exact: true }),
      ).toBeVisible();
    await page.screenshot({ path: info.outputPath(`es08-${slug}-1920.png`) });
    if (slug === "configure") {
      await page
        .getByRole("region", { name: "Screen Systems schematics" })
        .scrollIntoViewIfNeeded();
      for (const drawing of [
        "Plan",
        "Screen cut",
        "Cross section",
        "Bay section",
      ]) {
        await page
          .getByRole("combobox", { name: /^Drawing/ })
          .selectOption(drawing);
        await expect(
          page.getByRole("img", { name: new RegExp("^" + drawing + ":") }),
        ).toBeVisible();
        await page.screenshot({
          path: info.outputPath(
            `es08-diagram-${drawing.toLowerCase().replaceAll(" ", "-")}-1920.png`,
          ),
        });
      }
      await page
        .getByRole("combobox", { name: /^Drawing/ })
        .selectOption("Plan");
    }
    if (slug === "parts") {
      await page
        .getByLabel("Position state", { exact: true })
        .selectOption("All");
      await expect(page.locator(".es08-table-scroll tbody tr")).toHaveCount(
        143,
      );
      await page
        .getByRole("button", { name: /Working/ })
        .first()
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.screenshot({ path: info.outputPath("es08-working-1920.png") });
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: /Working/ }).first(),
      ).toBeFocused();
    }
    if (slug === "history") {
      await page.getByRole("button", { name: "Inspect", exact: true }).click();
      await expect(page.getByRole("dialog")).toContainText(
        "definition_bundle_hash",
      );
      await page.keyboard.press("Escape");
      const download = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Export evidence", exact: true })
        .click();
      expect((await download).suggestedFilename()).toMatch(/PPO-ES08-review/);
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
      expect(box.y + box.height).toBeLessThan(height - 50);
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
  await expect(
    page.getByRole("alert").filter({ hasText: "Review calculation inputs" }),
  ).toBeVisible();
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
    await page.unroute(detailRoute);
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
  await page
    .getByLabel("CE-LINE-240 decision", { exact: true })
    .selectOption("omit");
  await page
    .getByRole("button", { name: "Review estimate changes", exact: true })
    .click();
  await page
    .getByLabel("CE-LINE-242 decision", { exact: true })
    .selectOption("keep");
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
  await expect(page.getByText(/Outcome unknown/).first()).toBeVisible();
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
  await expect(page.getByText(/Outcome unknown/).first()).toBeVisible();
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
  await expect(page.getByText(/Outcome unknown/).first()).toBeVisible();
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
  await page.screenshot({ path: info.outputPath("es08-read-only.png") });
  fixture("revoke-read");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", {
      name: "SYN Northbank Screen Systems",
      exact: true,
    }),
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
  await expect(page.locator(".es08-summary")).toContainText("2150");
  const current = await page.locator(".es08-summary").innerText();
  release();
  await finished;
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(page.locator(".es08-summary")).toHaveText(current, {
    useInnerText: true,
  });
  await expect(page.locator("#es08-bays")).toHaveValue("14");
});
