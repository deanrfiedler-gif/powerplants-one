import { test, expect, type Page } from "@playwright/test";
import { mountWorkloadPresentation } from "../helpers/estimating-workload-presentation";

const visibleRows = (page: Page) =>
  page.locator(".ew-row-title, .ew-phone-open").filter({ visible: true });
function gate() {
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { pending, release };
}

for (const saved of [false, true])
  test(`ES01 background checks retain focus and failed ${saved ? "saved" : "workload"} reads stay cleared during retry`, async ({
    page,
  }) => {
    await page.clock.install();
    const fixture = await mountWorkloadPresentation(page);
    if (saved) await page.goto("/estimating?tab=estimates");
    const control = saved
      ? page
          .getByRole("link", {
            name: fixture.saved.items[0].title,
            exact: true,
          })
          .filter({ visible: true })
      : visibleRows(page).first();
    await expect(control).toBeEnabled();
    await control.focus();
    const endpoint = saved
      ? "**/api/v1/estimating/estimates?**"
      : "**/api/v1/estimating/workload?**";
    const background = gate();
    let calls = 0;
    await page.route(endpoint, async (route) => {
      calls++;
      await background.pending;
      await route.fulfill({
        status: 503,
        json: { code: "Unavailable", message: "Synthetic read failed" },
      });
    });
    await page.clock.fastForward(16000);
    await expect.poll(() => calls).toBe(1);
    await expect(control).toBeFocused();
    await expect(control).toBeEnabled();
    await expect(page.locator(".ew-menu-count").nth(saved ? 6 : 0)).toHaveText(
      saved ? "6" : "7",
    );
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    expect(calls).toBe(1);
    background.release();
    const heading = page.getByRole("heading", {
      name: saved
        ? "Saved estimates could not be loaded"
        : "Workload could not be loaded",
    });
    await expect(heading).toBeVisible();
    await expect(control).toHaveCount(0);
    const retry = gate();
    await page.unroute(endpoint);
    await page.route(endpoint, async (route) => {
      await retry.pending;
      await route.fallback();
    });
    const button = page.getByRole("button", {
      name: "Try loading again",
      exact: true,
    });
    await button.click();
    await expect(button).toBeFocused();
    await page.clock.fastForward(31000);
    await expect(heading).toBeVisible();
    await expect(control).toHaveCount(0);
    await expect(page.locator(".ew-menu-count").nth(saved ? 6 : 0)).toHaveText(
      "—",
    );
    retry.release();
    await expect(control).toBeEnabled();
  });

test("ES01 snapshot links survive a background read and a failed retry cannot reopen the modal", async ({
  page,
}) => {
  const fixture = await mountWorkloadPresentation(page);
  await visibleRows(page).nth(1).click();
  const snapshot = page.getByRole("dialog", {
    name: fixture.items[1].opportunity.title,
    exact: true,
  });
  const link = snapshot.getByRole("link", {
    name: "Open discovery",
    exact: true,
  });
  await link.focus();
  const held = gate();
  const endpoint = "**/api/v1/estimating/workload?**";
  await page.route(endpoint, async (route) => {
    await held.pending;
    await route.fulfill({
      status: 503,
      json: { message: "Synthetic failure" },
    });
  });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(link).toBeFocused();
  await expect(link).toHaveAttribute("href", /option=/);
  held.release();
  await expect(snapshot).toHaveCount(0);
  const retry = gate();
  await page.unroute(endpoint);
  await page.route(endpoint, async (route) => {
    await retry.pending;
    await route.fallback();
  });
  const button = page.getByRole("button", {
    name: "Try loading again",
    exact: true,
  });
  await button.click();
  await expect(button).toBeFocused();
  await expect(snapshot).toHaveCount(0);
  await expect(visibleRows(page)).toHaveCount(0);
  retry.release();
  await expect(snapshot).toBeVisible();
  await expect(
    snapshot.getByText("· owner: Saved owner", { exact: false }),
  ).toBeVisible();
  await expect(
    snapshot.getByText(
      fixture.items[1].readiness_reasons[0].follow_up.owner_id,
      { exact: false },
    ),
  ).toHaveCount(0);
});

test("ES01 query controls keep focus and selection toolbar preserves register geometry", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Desktop toolbar and sorting controls",
  );
  await mountWorkloadPresentation(page);
  await expect(visibleRows(page)).toHaveCount(7);
  const search = page.getByRole("searchbox", {
    name: "Search workload",
    exact: true,
  });
  await search.fill("Glasshouse");
  await search.press("Enter");
  await expect(visibleRows(page)).toHaveCount(2);
  await expect(search).toBeFocused();
  await search.fill("");
  await search.press("Enter");
  await expect(visibleRows(page)).toHaveCount(7);
  const customer = page.getByRole("button", { name: "Customer", exact: true });
  await customer.press("Enter");
  await expect(page).toHaveURL(/sort=customer/);
  await expect(customer).toBeFocused();
  const sort = page.getByRole("button", { name: "Sort workload", exact: true });
  await sort.click();
  await page
    .getByRole("menuitemradio", { name: "Recently changed", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(/sort=updated/);
  await expect(sort).toBeFocused();
  const before = await page.locator(".ew-results").boundingBox();
  const checks = page.locator(".ew-desktop-grid tbody input");
  await checks.nth(0).check();
  await checks.nth(1).check();
  expect((await page.locator(".ew-results").boundingBox())?.y).toBe(before?.y);
  expect((await page.locator(".ew-results").boundingBox())?.width).toBe(
    before?.width,
  );
  expect((await page.locator(".ew-toolbar").boundingBox())?.height).toBe(60);
  const panel = page.getByRole("complementary", {
    name: "Selected opportunities",
  });
  await page.getByRole("button", { name: "Hide panel", exact: true }).click();
  await expect(panel).toHaveCount(0);
  await expect(checks.nth(0)).toBeChecked();
  await page.getByRole("button", { name: "Show panel", exact: true }).click();
  await expect(panel).toBeVisible();
  await page
    .locator(".ew-toolbar")
    .getByRole("button", { name: "Open in sequence", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await panel.getByRole("button", { name: "Cancel", exact: true }).click();
  await visibleRows(page).nth(2).click();
  await expect(
    page
      .getByRole("button", { name: "Previous opportunity", exact: true })
      .filter({ visible: true }),
  ).toBeEnabled();
  await expect(
    page
      .getByRole("button", { name: "Next opportunity", exact: true })
      .filter({ visible: true }),
  ).toBeEnabled();
});

test("ES01 complete references, read times and formatted phone sell; Saved no-match recovery", async ({
  page,
}, info) => {
  await mountWorkloadPresentation(page);
  await expect(visibleRows(page)).toHaveCount(7);
  if (info.project.name === "desktop") {
    await expect(page.locator(".ew-time")).toBeVisible();
    const leading = page.locator(".ew-desktop-grid tbody tr").first();
    const lastValue = await leading.locator("td").nth(5).boundingBox();
    const actions = await leading.locator("td").last().boundingBox();
    expect(lastValue!.x + lastValue!.width).toBeLessThanOrEqual(actions!.x + 1);
    expect(
      await page
        .locator(".ew-reference")
        .evaluateAll((cells) =>
          cells.every((cell) => cell.scrollWidth <= cell.clientWidth),
        ),
    ).toBe(true);
  }
  await page.goto("/estimating?tab=estimates");
  await expect(
    page
      .locator(".ew-phone-saved, .ew-saved tbody tr")
      .filter({ visible: true }),
  ).toHaveCount(6);
  if (info.project.name === "desktop") {
    await expect(page.locator(".ew-time")).toBeVisible();
    const savedRow = page.locator(".ew-saved tbody tr").first();
    const amount = await savedRow.locator(".ew-amount").boundingBox();
    const action = await savedRow.locator("td").last().boundingBox();
    expect(amount!.x + amount!.width).toBeLessThanOrEqual(action!.x + 1);
    expect(
      await page
        .locator(".ew-reference")
        .evaluateAll((cells) =>
          cells.every((cell) => cell.scrollWidth <= cell.clientWidth),
        ),
    ).toBe(true);
  } else
    await expect(page.locator(".ew-phone-saved").first()).toContainText(
      "$12,500.00",
    );
  await page.goto("/estimating?tab=estimates&estimate_q=absent");
  await expect(
    page.getByRole("heading", {
      name: "No saved estimates match this search",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(
    page
      .locator(".ew-phone-saved, .ew-saved tbody tr")
      .filter({ visible: true }),
  ).toHaveCount(6);
});

test("ES01 narrow phone selection can hide its panel and clear back to a visible control", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "phone", "Compact selection controls");
  await page.setViewportSize({ width: 320, height: 844 });
  await mountWorkloadPresentation(page);
  await expect(visibleRows(page)).toHaveCount(7);
  await page.getByRole("button", { name: /^Filter/ }).click();
  await page
    .getByRole("button", { name: "Select opportunities", exact: true })
    .click();
  const check = page.locator(".ew-phone-row input").first();
  await check.check();
  const panel = page.getByRole("complementary", {
    name: "Selected opportunities",
  });
  await expect(panel).toBeVisible();
  await page.getByRole("button", { name: "Hide panel", exact: true }).click();
  await expect(panel).toHaveCount(0);
  await expect(check).toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /^Clear selection \(/ }).click();
  await expect(check).not.toBeChecked();
  await expect(check).toBeFocused();
});
