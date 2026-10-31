import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmCreate } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";
import {
  phoneWidth,
  openSecondaryMenu,
  openPageGuide,
} from "../helpers/phone-menu";

test.describe.configure({ timeout: 120000 });
const iconFreeCaptureStyle =
  ".mw-icon, .ppo-fa, .svg-inline--fa, [data-prefix], .es02-icon, .product-icon, .shell-icon, i[class*='fa-'] { visibility:hidden !important; }";
const rowButton = (page: Page, title: string) =>
  page
    .locator(".ew-row-title:visible, .ew-phone-open:visible")
    .filter({ hasText: title });
async function filters(page: Page) {
  if (phoneWidth(page))
    await page.getByRole("button", { name: /^Filter/ }).click();
  else {
    await page
      .getByRole("button", { name: "Workload actions", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Search and filters", exact: true })
      .click();
  }
  return page.getByRole("dialog", { name: "Workload filters", exact: true });
}
async function setup(page: Page) {
  await page.goto("/estimating?q=fixture-setup-no-match");
  const origin = new URL(page.url()).origin;
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: origin },
        data: { profile: "coordinator" },
      })
    ).ok(),
  ).toBe(true);
  const input = { ...crmCreate(), title: `SYN workload ${randomUUID()}` };
  const created = await page.request.post("/api/v1/crm/opportunities", {
    headers: { Origin: origin },
    data: input,
  });
  expect(created.ok(), await created.text()).toBe(true);
  await page.goto(`/estimating?q=${encodeURIComponent(input.title)}`);
  await expect(rowButton(page, input.title)).toBeEnabled();
  return { input, origin };
}
test("ES01 accepted snapshot, native Discovery entry, filters, view picker and URL restoration", async ({
  page,
}, info) => {
  const { input } = await setup(page);
  const opener = rowButton(page, input.title);
  await opener.press("Enter");
  const snapshot = page.getByRole("dialog", { name: input.title, exact: true });
  await expect(snapshot).toBeVisible();
  await expect(
    snapshot.getByRole("link", { name: "Start discovery", exact: true }),
  ).toHaveAttribute(
    "href",
    `/estimating/discovery/new?opportunity=${input.id}`,
  );
  await expect(
    snapshot.getByText("Not allocated", { exact: true }),
  ).toBeVisible();
  await snapshot
    .getByRole("tab", { name: "Alternatives (0)", exact: true })
    .focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    snapshot.getByRole("tab", { name: "Saved estimates (0)", exact: true }),
  ).toBeFocused();
  await expect(
    snapshot.getByText(
      "No readable saved estimate. Unpriced scope is not zero.",
    ),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(snapshot).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.goBack();
  await expect(snapshot).toBeVisible();
  await page.reload();
  await expect(snapshot).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  const filter = await filters(page);
  await filter
    .getByRole("combobox", { name: "Scope readiness", exact: true })
    .selectOption("unstarted");
  await filter
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(page).toHaveURL(/view=unstarted/);
  await expect(opener).toBeVisible();
  const search = await filters(page);
  await search
    .getByRole("searchbox", { name: "Search workload", exact: true })
    .fill("No such synthetic brief");
  await search
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No workload matches these filters" }),
  ).toBeVisible();
  await page.goBack();
  await expect(opener).toBeEnabled();
  if (phoneWidth(page)) {
    await openSecondaryMenu(page);
    await page
      .getByRole("dialog", { name: "Intake & workload menu" })
      .getByRole("link", { name: /^My estimating work/ })
      .click();
  } else
    await page
      .getByRole("navigation", { name: "Estimating views" })
      .getByRole("link", { name: /^My estimating work/ })
      .click();
  await expect(page).toHaveURL(/owner=mine/);
  await expect(
    page.getByRole("heading", { name: "No workload matches these filters" }),
  ).toBeVisible();
  await page.goBack();
  await expect(opener).toBeEnabled();
  await openPageGuide(page);
  await expect(
    page.getByRole("heading", {
      name: "Workload, source context and authority",
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: info.outputPath("workload.png"),
    style: iconFreeCaptureStyle,
    fullPage: true,
  });
  await opener.click();
  await page.screenshot({
    path: info.outputPath("snapshot.png"),
    style: iconFreeCaptureStyle,
    fullPage: true,
  });
  if (phoneWidth(page)) {
    await page.setViewportSize({ width: 320, height: 844 });
    await expect(
      snapshot.getByRole("heading", { name: input.title }),
    ).toBeVisible();
    await snapshot
      .getByRole("button", { name: "Snapshot actions", exact: true })
      .click();
    await expect(
      snapshot
        .getByRole("button", { name: "Close snapshot", exact: true })
        .last(),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("snapshot-320.png"),
      style: iconFreeCaptureStyle,
      fullPage: true,
    });
  }
  await snapshot
    .getByRole("link", { name: "Start discovery", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/estimating/discovery/new\\?opportunity=${input.id}`),
  );
  await expect(
    page.getByRole("radio", { name: new RegExp(input.title) }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Continue to discovery", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: input.title, exact: true }),
  ).toHaveAttribute("href", `/sales/opportunities/${input.id}`);
});
test("ES01 selection opens newest first, exports only fresh permitted rows and preserves register width", async ({
  page,
}, info) => {
  const { input, origin } = await setup(page);
  const second = { ...crmCreate(), title: input.title + " second" };
  expect(
    (
      await page.request.post("/api/v1/crm/opportunities", {
        headers: { Origin: origin },
        data: second,
      })
    ).ok(),
  ).toBe(true);
  await page.reload();
  await expect(rowButton(page, second.title)).toBeEnabled();
  if (phoneWidth(page)) {
    const f = await filters(page);
    await f
      .getByRole("button", { name: "Select opportunities", exact: true })
      .click();
  }
  const current = await (
    await page.request.get(
      `/api/v1/estimating/workload?q=${encodeURIComponent(input.title)}`,
    )
  ).json();
  for (const item of current.items)
    await page
      .getByRole("checkbox", {
        name: `Select ${item.opportunity.display_number}`,
        exact: true,
      })
      .filter({ visible: true })
      .check();
  const selected = page.getByRole("complementary", {
    name: "Selected opportunities",
  });
  await expect(
    selected.getByRole("heading", { name: "2 opportunities selected" }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await selected
    .getByRole("button", { name: "Export list (CSV)", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "ppo-estimating-workload.csv",
  );
  const before = await page.locator(".ew-results").boundingBox();
  await selected
    .getByRole("button", { name: "Open in sequence", exact: true })
    .last()
    .click();
  const snapshot = page.getByRole("dialog", {
    name: second.title,
    exact: true,
  });
  await expect(snapshot).toBeVisible();
  const after = await page.locator(".ew-results").boundingBox();
  expect(after?.width).toBe(before?.width);
  if (!phoneWidth(page)) {
    const box = await snapshot.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(960);
    await snapshot
      .getByRole("button", { name: "Next opportunity", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("dialog", { name: input.title, exact: true }),
    ).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await page.route("**/api/v1/estimating/workload?**", (route) =>
    route.fulfill({
      json: {
        ...current,
        items: [],
        counts: { unstarted: 0, ready: 0, legacy: 0, clarification: 0 },
        owner_counts: { all: 0, mine: 0 },
      },
    }),
  );
  await selected
    .getByRole("button", { name: "Export list (CSV)", exact: true })
    .click();
  await expect(
    page.getByText(
      "Selected records changed or are no longer available. Refresh and select the current records again.",
    ),
  ).toBeVisible();
  await expect(selected).toHaveCount(0);
  if (!phoneWidth(page)) {
    await page.unroute("**/api/v1/estimating/workload?**");
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();
    await expect(rowButton(page, input.title).first()).toBeEnabled();
    await rowButton(page, input.title).first().click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("snapshot-tablet.png"),
      style: iconFreeCaptureStyle,
      fullPage: true,
    });
  }
});
test("ES01 Saved estimates keeps legacy URL, exact versions, null sell and browser history", async ({
  page,
}, info) => {
  const { input, origin } = await setup(page),
    cost = {
      ...estimateInput(input.id),
      title: input.title + " scope only",
      lines: [],
    };
  const created = await page.request.post("/api/v1/estimating/estimates", {
    headers: { Origin: origin },
    data: cost,
  });
  expect(created.ok(), await created.text()).toBe(true);
  const list = await (
      await page.request.get(
        `/api/v1/estimating/estimates?q=${encodeURIComponent(cost.title)}`,
      )
    ).json(),
    saved = list.items.find((e: { id: string }) => e.id === cost.id);
  expect(saved.version_id).toBeTruthy();
  await page.goto(
    `/estimating?tab=estimates&estimate_q=${encodeURIComponent(cost.title)}&q=${encodeURIComponent(input.title)}`,
  );
  const link = page
    .getByRole("link", { name: cost.title, exact: true })
    .filter({ visible: true });
  await expect(link).toHaveAttribute(
    "href",
    `/estimating/estimates/${cost.id}?version_id=${saved.version_id}`,
  );
  await expect(
    page
      .getByText(/Not estimated/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await page.reload();
  await expect(link).toBeVisible();
  await page.screenshot({
    path: info.outputPath("saved-estimates.png"),
    style: iconFreeCaptureStyle,
    fullPage: true,
  });
  await page.goBack();
  await expect(rowButton(page, input.title)).toBeEnabled();
  await page.goForward();
  await expect(link).toBeVisible();
});
test("ES01 refresh withholding, failed/denied reads, no matches and no-edit permission remain distinct", async ({
  page,
}) => {
  const { input } = await setup(page);
  const endpoint = "**/api/v1/estimating/workload?**";
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(endpoint, async (route) => {
    await held;
    await route.fulfill({
      status: 503,
      json: { code: "Unavailable", message: "Synthetic workload read failed" },
    });
  });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page
      .getByText("Refreshing — earlier results unconfirmed", { exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(rowButton(page, input.title)).toBeDisabled();
  release();
  await expect(
    page.getByRole("heading", { name: "Workload could not be loaded" }),
  ).toBeVisible();
  await expect(rowButton(page, input.title)).toHaveCount(0);
  await expect(page.getByText("No workload matches these filters")).toHaveCount(
    0,
  );
  await page.unroute(endpoint);
  await page
    .getByRole("button", { name: "Try loading again", exact: true })
    .click();
  await expect(rowButton(page, input.title)).toBeEnabled();
  await page.route(endpoint, async (route) => {
    const response = await route.fetch(),
      body = await response.json();
    await route.fulfill({
      json: {
        ...body,
        items: body.items.map((i: object) => ({ ...i, can_start: false })),
      },
    });
  });
  await page.reload();
  await rowButton(page, input.title).click();
  await expect(
    page.getByRole("link", { name: "Start discovery", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(
      /Discovery creation is unavailable under current permissions/,
    ),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.unroute(endpoint);
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 403,
      json: {
        code: "Forbidden",
        message: "Current estimating access required",
      },
    }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "Estimating is outside your access" }),
  ).toBeVisible();
  await expect(rowButton(page, input.title)).toHaveCount(0);
});
