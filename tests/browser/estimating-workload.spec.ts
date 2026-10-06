import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmCreate } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";

test.describe.configure({ timeout: 120000 });
async function setup(page: Page) {
  await page.goto("/estimating");
  const identity = await page.request.post("/api/v1/local-session", {
    headers: { Origin: new URL(page.url()).origin },
    data: { profile: "coordinator" },
  });
  expect(identity.ok()).toBe(true);
  const input = { ...crmCreate(), title: `SYN workload ${randomUUID()}` };
  const response = await page.request.post("/api/v1/crm/opportunities", {
    headers: { Origin: new URL(page.url()).origin },
    data: input,
  });
  expect(response.ok(), await response.text()).toBe(true);
  const loaded = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/estimating/workload?") &&
      new URL(response.url()).searchParams.get("q") === input.title,
  );
  await page.goto(`/estimating?q=${encodeURIComponent(input.title)}`);
  expect((await loaded).ok()).toBe(true);
  await expect(
    page.getByRole("heading", { name: input.title, exact: true }),
  ).toBeVisible();
  return input;
}

test("ES01 native workload supports keyboard filters, exact discovery entry, reload, history and responsive cards", async ({
  page,
}, info) => {
  const input = await setup(page);
  await expect(
    page.getByText("Not allocated", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Discovery not started", { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start discovery", exact: true }),
  ).toHaveAttribute(
    "href",
    `/estimating/discovery/new?opportunity=${input.id}`,
  );
  const search = page.getByRole("searchbox", { name: "Search workload" });
  if (info.project.use.isMobile) {
    // Phone: readiness, owner and sort share a disclosure whose summary names
    // the retained selections while it is collapsed.
    const more = page.getByRole("button", {
      name: /^Readiness, owner and sort All readiness · All owners · Recently changed$/,
    });
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await page
      .getByRole("combobox", { name: "Scope readiness", exact: true })
      .selectOption("unstarted");
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
  } else {
    // Desktop: readiness is a segmented control with permitted counts; owner
    // and sort stay inline.
    await expect(
      page.getByRole("combobox", { name: "Estimating owner", exact: true }),
    ).toBeVisible();
    const readiness = page.getByRole("group", { name: "Scope readiness" });
    await expect(
      readiness.getByRole("button", { name: "All 1", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await readiness
      .getByRole("button", { name: "Discovery not started 1", exact: true })
      .click();
    await expect(
      readiness.getByRole("button", {
        name: "Discovery not started 1",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page).toHaveURL(/view=unstarted/);
  await expect(
    page.getByRole("heading", { name: input.title, exact: true }),
  ).toBeVisible();
  await search.fill("No such synthetic brief");
  await search.press("Enter");
  await expect(
    page.getByRole("heading", { name: "No workload matches these filters" }),
  ).toBeVisible();
  await page.goBack();
  await expect(search).toHaveValue(input.title);
  await expect(
    page.getByRole("heading", { name: input.title, exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: input.title, exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "No workload matches these filters" }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: input.title, exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const guide = page.getByRole("button", { name: "Page guide", exact: true });
  await guide.click();
  await expect(
    page.getByRole("heading", {
      name: "Workload, source context and authority",
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toBeFocused();
  const header = (await page.locator(".ppo-shell-header").boundingBox())!;
  const guideBox = (await guide.boundingBox())!;
  expect(guideBox.y + guideBox.height).toBeLessThanOrEqual(
    header.y + header.height,
  );
  await page.screenshot({
    path: info.outputPath("workload.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Start discovery", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("workload-card.png"),
    fullPage: true,
  });
  if (info.project.name.includes("mobile")) {
    await page.setViewportSize({ width: 320, height: 844 });
    await search.focus();
    await expect(search).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("workload-320.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
  } else {
    // Chromium CSS zoom exercises enlarged controls and reflow; physical-device
    // and browser-UI zoom acceptance remain separate from this automated proof.
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await search.focus();
    await expect(search).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Apply filters" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("workload-200-percent.png"),
      fullPage: true,
    });
    await page.evaluate(() => {
      document.documentElement.style.zoom = "";
    });
  }
  const choicesLoaded = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/estimating/options",
  );
  await page
    .getByRole("link", { name: "Start discovery", exact: true })
    .click();
  expect((await choicesLoaded).ok()).toBe(true);
  await expect(page).toHaveURL(
    new RegExp(`/estimating/discovery/new\\?opportunity=${input.id}`),
  );
  await expect(
    page.getByLabel("Existing opportunity", { exact: true }),
  ).toHaveValue(input.id);
  await page.goto("/estimating?tab=estimates");
  await expect(
    page.getByRole("heading", { name: "Saved estimates", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Estimating registers" })
      .getByRole("link", { name: "Saved estimates", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("ES01 register selects into the persistent panel from 1360 px, opens a drawer below it and never shows unpriced scope as zero", async ({
  page,
}, info) => {
  test.skip(
    !!info.project.use.isMobile,
    "Phone cards carry the detail inline; the first case covers them.",
  );
  await page.goto("/estimating");
  const origin = new URL(page.url()).origin;
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: origin },
        data: { profile: "coordinator" },
      })
    ).ok(),
  ).toBe(true);
  const prefix = `SYN panel ${randomUUID()}`;
  const first = { ...crmCreate(), title: `${prefix} first` },
    second = { ...crmCreate(), title: `${prefix} second` };
  for (const data of [first, second]) {
    const created = await page.request.post("/api/v1/crm/opportunities", {
      headers: { Origin: origin },
      data,
    });
    expect(created.ok(), await created.text()).toBe(true);
  }
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.goto(`/estimating?q=${encodeURIComponent(prefix)}`);
  const panel = page.locator("#est-workload-detail");
  await expect(panel).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: "Scope readiness" })
      .getByRole("button", { name: "All 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const choose = page.getByRole("button", { name: first.title, exact: true });
  await choose.click();
  await expect(choose).toHaveAttribute("aria-pressed", "true");
  await expect(
    panel.getByRole("heading", { name: first.title, exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByText("Required response", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole("link", { name: "Start discovery", exact: true }),
  ).toHaveAttribute(
    "href",
    `/estimating/discovery/new?opportunity=${first.id}`,
  );
  await page.screenshot({ path: info.outputPath("workload-panel-1360.png") });
  await page.setViewportSize({ width: 1359, height: 900 });
  await expect(panel).toHaveCount(0);
  const opener = page.getByRole("button", { name: second.title, exact: true });
  await opener.click();
  const drawer = page.getByRole("dialog", { name: second.title });
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("link", { name: "Start discovery", exact: true }),
  ).toHaveAttribute(
    "href",
    `/estimating/discovery/new?opportunity=${second.id}`,
  );
  await page.screenshot({ path: info.outputPath("workload-drawer-1359.png") });
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
  // A layout change closes the drawer; the panel keeps the same record and
  // returning below the panel width does not reopen the drawer by itself.
  await opener.click();
  await expect(drawer).toBeVisible();
  await page.setViewportSize({ width: 1360, height: 900 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    panel.getByRole("heading", { name: second.title, exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1359, height: 900 });
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const scopeOnly = {
    ...estimateInput(first.id),
    title: `${prefix} scope only`,
    lines: [],
  };
  const estimate = await page.request.post("/api/v1/estimating/estimates", {
    headers: { Origin: origin },
    data: scopeOnly,
  });
  expect(estimate.ok(), await estimate.text()).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/estimating?tab=estimates");
  const row = page.getByRole("row", { name: new RegExp(prefix) });
  await expect(row.getByRole("cell", { name: "Not estimated" })).toBeVisible();
  await expect(row.getByRole("cell", { name: "0.00" })).toHaveCount(0);
});

test("ES01 loading, failed refresh and revoked access never look like a successful empty workload", async ({
  page,
}) => {
  const input = await setup(page);
  await page.route("**/api/v1/estimating/workload?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Unavailable",
        message: "Synthetic workload read failed",
        retryable: true,
      }),
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Try loading again" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: input.title, exact: true }),
  ).toHaveCount(0);
  await page.unroute("**/api/v1/estimating/workload?**");
  await page.getByRole("button", { name: "Try loading again" }).click();
  await expect(
    page.getByRole("heading", { name: input.title, exact: true }),
  ).toBeVisible();
  await page.route("**/api/v1/estimating/workload?**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Forbidden",
        message: "Current estimating access required",
      }),
    }),
  );
  await page.reload();
  await expect(
    page.getByText("Current estimating access required"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: input.title, exact: true }),
  ).toHaveCount(0);
});
