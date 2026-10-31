import { expect, test, type Page } from "@playwright/test";
import { briefsFixture, briefSnapshotFixture } from "../helpers/sales-briefs";
import {
  discoveryIdentityFixture,
  discoveryShellFixture,
} from "../helpers/discovery-register";
import {
  matchesReceivingView,
  receivingCsv,
  receivingViews,
} from "../../src/sales/receiving-queue-model";
import { mkdir } from "node:fs/promises";
test.setTimeout(90_000);
async function open(page: Page) {
  const state = {
    mode: "ok",
    data: briefsFixture(),
    snapshotMode: "ok",
    exports: [] as string[],
  };
  await page.route("**/api/v1/local-session", (r) =>
    r.fulfill({ json: discoveryIdentityFixture }),
  );
  await page.route("**/api/v1/shell/context", (r) =>
    r.fulfill({ json: discoveryShellFixture }),
  );
  await page.route("**/api/v1/sales/handovers/receiving**", async (route) => {
    const url = new URL(route.request().url()),
      selection = url.searchParams.get("selection");
    if (url.pathname.split("/").at(-1) !== "receiving") {
      if (state.snapshotMode !== "ok")
        return route.fulfill({
          status: 403,
          json: { code: "Forbidden", message: "SYN denied" },
        });
      const n = Number(url.pathname.split("-").at(-1));
      return route.fulfill({ json: briefSnapshotFixture(n) });
    }
    if (state.mode === "loading") return;
    if (state.mode !== "ok")
      return route.fulfill({
        status:
          state.mode === "denied" ? 403 : state.mode === "stale" ? 409 : 503,
        json: { code: "Unavailable", message: "SYN read unavailable" },
      });
    if (selection) {
      state.exports.push(selection);
      const rows = state.data.items.filter((r) => selection.includes(r.id));
      return route.fulfill({
        json: { csv: receivingCsv(rows), count: rows.length },
      });
    }
    const q = url.searchParams.get("q")?.toLowerCase() ?? "",
      customer = url.searchParams.get("customer"),
      owner = url.searchParams.get("owner");
    const filtered = state.data.items.filter(
      (r) =>
        (!q || r.opportunity.title.toLowerCase().includes(q)) &&
        (!customer || r.customer.id === customer) &&
        (!owner || r.receiving_owner?.id === owner),
    );
    const view =
      receivingViews.find((v) => v.id === url.searchParams.get("view"))?.id ??
      "All";
    const items = filtered.filter((r) =>
      matchesReceivingView(r, view, discoveryIdentityFixture.actor_id),
    );
    return route.fulfill({
      json: {
        ...state.data,
        items,
        total: state.data.total === 8 ? items.length : state.data.total,
        counts:
          state.data.total === 8
            ? Object.fromEntries(
                receivingViews.map((v) => [
                  v.id,
                  filtered.filter((r) =>
                    matchesReceivingView(
                      r,
                      v.id,
                      discoveryIdentityFixture.actor_id,
                    ),
                  ).length,
                ]),
              )
            : state.data.counts,
      },
    });
  });
  await page.goto("/estimating/intake", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#ppo-sales-briefs")).toBeVisible();
  await expect(page.locator(".sb-phone-row")).toHaveCount(8);
  return state;
}
test("CR-02 exact snapshots, clarification, evidence, keyboard and selected export", async ({
  page,
}, info) => {
  test.skip(
    !!info.project.use.isMobile,
    "Desktop control proof; phone has its own case",
  );
  const state = await open(page),
    host = page.locator("#ppo-sales-briefs");
  await expect(host.locator("tbody tr")).toHaveCount(8);
  await expect(host.locator(".sb-count")).toContainText("8 briefs");
  const title = host.getByRole("button", {
    name: "Nutrient room dosing upgrade",
    exact: true,
  });
  await title.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Submitted Sales brief snapshot",
  });
  await expect(
    dialog.getByRole("heading", { name: "Nutrient room dosing upgrade" }),
  ).toBeVisible();
  await expect(
    dialog.getByText(
      "Is tank C staying on manual dosing during the changeover?",
    ),
  ).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "Open brief", exact: true }),
  ).toHaveAttribute("href", /000030\?revision=1$/);
  await expect(
    dialog.getByRole("button", { name: "Accept", exact: true }),
  ).toHaveCount(0);
  await dialog.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(
    dialog.getByText("No document references submitted with this revision."),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(title).toBeFocused();
  await host
    .getByRole("checkbox", {
      name: "Select SYN-PPO-OPP-000031 r1",
      exact: true,
    })
    .check();
  await host
    .getByRole("checkbox", {
      name: "Select SYN-PPO-OPP-000030 r1",
      exact: true,
    })
    .check();
  await expect(
    host.getByRole("complementary", { name: "Selected briefs" }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await host.getByRole("button", { name: "Export list", exact: true }).click();
  expect((await download).suggestedFilename()).toBe(
    "sales-briefs-selected.csv",
  );
  expect(state.exports[0].split(",")).toHaveLength(2);
  await host
    .getByRole("button", { name: "Open in sequence", exact: true })
    .first()
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Nutrient room dosing upgrade" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Next brief", exact: true }).click();
  await expect(
    dialog.getByRole("heading", { name: "Boiler house heat recovery study" }),
  ).toBeVisible();
  state.snapshotMode = "denied";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    dialog.getByRole("heading", { name: "This brief is outside your access" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "Open brief", exact: true }),
  ).toHaveCount(0);
});
test("CR-02 counts use the server population, paging comparison and failure recovery clear rows", async ({
  page,
}, info) => {
  test.skip(!!info.project.use.isMobile, "Desktop read contract proof");
  const state = await open(page),
    host = page.locator("#ppo-sales-briefs");
  state.data = {
    ...state.data,
    items: state.data.items.slice(0, 2),
    total: 52,
    permitted_total: 52,
    counts: { ...state.data.counts, All: 52 },
    has_more: true,
    limit: 2,
  };
  await host
    .getByRole("button", { name: "Refresh briefs", exact: true })
    .click();
  await expect(host.locator("tbody tr")).toHaveCount(2);
  await expect(host.locator(".sb-count")).toContainText("52 briefs");
  state.mode = "stale";
  await host.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(
    host.getByRole("heading", { name: "The queue changed" }),
  ).toBeVisible();
  await expect(host.locator("tbody tr")).toHaveCount(0);
  state.mode = "ok";
  state.data = briefsFixture();
  await host.getByRole("button", { name: "Retry loading briefs" }).click();
  await expect(page).not.toHaveURL(/offset=/);
  await expect(host.locator("tbody tr")).toHaveCount(8);
  state.data = { ...state.data, completeness: "Partial" };
  await host
    .getByRole("button", { name: "Refresh briefs", exact: true })
    .click();
  await expect(host.getByText(/Partial read:/)).toBeVisible();
  await expect(host.locator(".sb-count")).toContainText("At least 8");
  state.mode = "denied";
  await host
    .getByRole("button", { name: "Refresh briefs", exact: true })
    .click();
  await expect(
    host.getByRole("heading", { name: "Sales briefs are outside your access" }),
  ).toBeVisible();
  await expect(host.locator(".sb-phone-row")).toHaveCount(0);
  await expect(host.locator(".mw-badge")).toHaveCount(0);
  state.mode = "ok";
  state.data = briefsFixture();
  await host.getByRole("button", { name: "Retry loading briefs" }).click();
  await host.getByRole("link", { name: "Awaiting my decision 3" }).click();
  await expect(host.locator("tbody tr")).toHaveCount(3);
});
test("CR-02 phone and 320px selection, snapshot and reflow", async ({
  page,
}, info) => {
  test.skip(!info.project.use.isMobile, "Phone contract");
  await open(page);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator(".sb-toolbar")).not.toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    const row = page.locator(".sb-phone-row").nth(1);
    await row.getByRole("button").click();
    const dialog = page.getByRole("dialog", {
      name: "Submitted Sales brief snapshot",
    });
    await expect(
      dialog.getByRole("heading", { name: "Nutrient room dosing upgrade" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: "Open brief", exact: true }),
    ).toBeVisible();
    expect(await dialog.evaluate((e) => e.scrollWidth)).toBeLessThanOrEqual(
      width + 1,
    );
    await dialog.getByRole("button", { name: "Close brief snapshot" }).click();
  }
});
test("CR-02 retained desktop/phone comparison captures", async ({
  page,
}, info) => {
  await open(page);
  const folder = "tmp/sales-briefs-captures";
  await mkdir(folder, { recursive: true });
  if (info.project.use.isMobile) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${folder}/phone-list.png` });
    await page.locator(".sb-phone-row").nth(1).getByRole("button").click();
    await expect(
      page.getByRole("heading", { name: "Nutrient room dosing upgrade" }),
    ).toBeVisible();
    await page.screenshot({ path: `${folder}/phone-snapshot.png` });
    await page.setViewportSize({ width: 320, height: 844 });
    await page.screenshot({ path: `${folder}/phone-320-snapshot.png` });
  } else {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      localStorage.setItem("ppo:rail-expanded", "true");
    });
    await page.screenshot({ path: `${folder}/desktop-register.png` });
    await page.locator(".sb-title").nth(1).click();
    await expect(
      page.getByRole("heading", { name: "Nutrient room dosing upgrade" }),
    ).toBeVisible();
    await page.screenshot({ path: `${folder}/desktop-snapshot.png` });
    await page.getByRole("button", { name: "Close brief snapshot" }).click();
    await page
      .getByRole("checkbox", {
        name: "Select SYN-PPO-OPP-000031 r1",
        exact: true,
      })
      .check();
    await page
      .getByRole("checkbox", {
        name: "Select SYN-PPO-OPP-000030 r1",
        exact: true,
      })
      .check();
    await page.screenshot({ path: `${folder}/desktop-selection.png` });
  }
});
