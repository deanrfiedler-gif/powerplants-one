import { test, expect } from "@playwright/test";
import { mountWorkloadPresentation } from "../helpers/estimating-workload-presentation";

test("ES01 initial loading, no permitted workload and no matches are distinct", async ({
  page,
}) => {
  await mountWorkloadPresentation(page);
  const endpoint = "**/api/v1/estimating/workload?**";
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route(endpoint, async (route) => {
    requests++;
    await held;
    await route.fulfill({
      json: {
        items: [],
        counts: { unstarted: 0, clarification: 0, ready: 0, legacy: 0 },
        owner_counts: { all: 0, mine: 0 },
        candidate_limit: 100,
        observed_at: "2026-10-31T00:00:00.000Z",
        synthetic: true,
        filters: { q: "", owner: "all", view: "all", sort: "updated" },
      },
    });
  });
  await page.clock.install();
  await page.reload();
  await expect(
    page.getByText("Loading permitted workload…", { exact: true }).first(),
  ).toBeAttached();
  await expect(page.locator(".ew-row-title, .ew-phone-open")).toHaveCount(0);
  await expect(page.locator(".ew-menu-count").first()).toHaveText("—");
  await expect(page.locator(".ew-menu-count").last()).toHaveText("6");
  // Development StrictMode can start more than one initial request; polling must not add another.
  const initialRequests = requests;
  await page.clock.fastForward(16000);
  expect(requests).toBe(initialRequests);
  release();
  await expect(
    page.getByRole("heading", { name: "No permitted estimating workload" }),
  ).toBeVisible();
  await expect(page.getByText("No workload matches these filters")).toHaveCount(
    0,
  );
  await page.goto("/estimating?q=missing");
  await expect(
    page.getByRole("heading", { name: "No workload matches these filters" }),
  ).toBeVisible();
  await expect(page.getByText("No permitted estimating workload")).toHaveCount(
    0,
  );
});

test("ES01 Saved estimates withholds stale links and clears failed or denied results", async ({
  page,
}) => {
  const fixture = await mountWorkloadPresentation(page);
  const endpoint = "**/api/v1/estimating/estimates?**";
  await page.goto("/estimating?tab=estimates");
  const savedLink = page
    .getByRole("link", { name: fixture.saved.items[0].title, exact: true })
    .filter({ visible: true });
  await expect(savedLink).toBeVisible();
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(endpoint, async (route) => {
    await held;
    await route.fulfill({
      status: 503,
      json: {
        code: "Unavailable",
        message: "Synthetic saved estimate read failed",
      },
    });
  });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page
      .getByText("Refreshing — earlier results unconfirmed", { exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(savedLink).toHaveCount(0);
  await expect(page.locator(".ew-menu-count").last()).toHaveText("—");
  release();
  await expect(
    page.getByRole("heading", { name: "Saved estimates could not be loaded" }),
  ).toBeVisible();
  await expect(page.locator(".ew-saved tbody tr, .ew-phone-saved")).toHaveCount(
    0,
  );
  await page.unroute(endpoint);
  await page
    .getByRole("button", { name: "Try loading again", exact: true })
    .click();
  await expect(savedLink).toBeVisible();
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
  await expect(page.locator(".ew-saved tbody tr, .ew-phone-saved")).toHaveCount(
    0,
  );
});
