import { expect, test, type Page } from "@playwright/test";
import {
  discoveryFixture,
  discoveryOwnerIds,
  discoverySnapshotFixture,
  discoveryIdentityFixture,
  discoveryShellFixture,
} from "../helpers/discovery-register";
import type { DiscoveryRegisterData } from "../../src/estimating/discovery-register-model";

test.setTimeout(90_000);

async function open(
  page: Page,
  value:
    DiscoveryRegisterData | "error" | "denied" | "loading" = discoveryFixture(),
  query = "",
) {
  await page.route("**/api/v1/estimating/workspaces*", async (route) => {
    if (value === "loading") return; // pending read, discarded with the test's page
    if (value === "error" || value === "denied")
      return route.fulfill({
        status: value === "error" ? 503 : 403,
        json: {
          error: { code: "Unavailable", message: "Synthetic read failure" },
        },
      });
    await route.fulfill({ json: value });
  });
  // Deterministic presentation contract; database authority is tested separately.
  await page.route("**/api/v1/local-session", (route) =>
    route.fulfill({ json: discoveryIdentityFixture }),
  );
  await page.route("**/api/v1/shell/context", (route) =>
    route.fulfill({ json: discoveryShellFixture }),
  );
  await page.goto(`/estimating/discovery${query}`, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Discovery register", exact: true }),
  ).toBeAttached({ timeout: 30_000 });
}
test("ES-02 grid, counts, filters, read-only and failure recovery", async ({
  page,
}, info) => {
  await open(page);
  const phone = info.project.use.isMobile;
  const host = page.locator("#ppo-discovery-register");
  if (!phone) {
    await expect(host.getByRole("table")).toBeVisible();
    await expect(host.locator("tbody tr")).toHaveCount(8);
    await host.getByRole("button", { name: "Estimator", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Jordan Kim" }).click();
    await expect(page).toHaveURL(new RegExp(`owner=${discoveryOwnerIds["Jordan Kim"]}`));
    await expect(host.locator("tbody tr")).toHaveCount(3);
  } else {
    await expect(host.locator(".dr-phone-row")).toHaveCount(8);
    await expect(host.locator(".dr-phone-row").last()).toHaveAttribute(
      "href",
      /\/estimating\/discovery\/e2000000/,
    );
  }
  await page.unroute("**/api/v1/estimating/workspaces*");
  await page.route("**/api/v1/estimating/workspaces*", (route) =>
    route.fulfill({
      status: 503,
      json: { error: { code: "Unavailable", message: "Synthetic failure" } },
    }),
  );
  await host
    .getByRole("button", { name: "Refresh workspaces" })
    .filter({ visible: true })
    .click();
  await expect(host.getByRole("alert").filter({ visible: true })).toContainText(
    "could not be loaded",
  );
  await expect(host.locator(".dr-phone-row")).toHaveCount(0);
  await expect(host.locator("tbody tr")).toHaveCount(0);
  await expect(
    host.getByRole("link", { name: /^All workspaces/ }),
  ).not.toContainText("8");
  await page.unroute("**/api/v1/estimating/workspaces*");
  await page.route("**/api/v1/estimating/workspaces*", (route) =>
    route.fulfill({ json: { ...discoveryFixture(), can_create: false } }),
  );
  await host
    .getByRole("button", { name: "Retry loading" })
    .filter({ visible: true })
    .click();
  await expect(
    host.getByRole("link", { name: "New discovery workspace" }),
  ).toHaveCount(0);
});
test("ES-02 phone rows at 390 and 320 retain context without horizontal page overflow", async ({
  page,
}) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await open(page);
    await expect(page.locator(".dr-phone-row")).toHaveCount(8);
    await expect(page.locator(".dr-phone-row").first()).toContainText(
      "SYN-PPO-OPP-000340",
    );
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    expect(overflows).toBe(false);
    await expect(page.locator(".ppo-phone-title-text")).toHaveText(
      "Estimation wizard",
    );
    await page.unroute("**/api/v1/estimating/workspaces*");
  }
});
for (const state of [
  "loading",
  "error",
  "denied",
  "empty",
  "no-matches",
] as const) {
  test(`ES-02 ${state} has an explicit state and no phantom rows`, async ({
    page,
  }) => {
    const fixture = discoveryFixture();
    if (state === "empty") fixture.items = [];
    await open(
      page,
      ["loading", "error", "denied"].includes(state)
        ? (state as "loading" | "error" | "denied")
        : fixture,
      state === "no-matches" ? `?view=Incomplete&owner=${discoveryOwnerIds["Jordan Kim"]}` : "",
    );
    const expected = {
      loading: "Loading permitted discovery workspaces…",
      error: "Discovery workspaces could not be loaded",
      denied: "Discovery workspaces are outside your access",
      empty: "No discovery workspaces yet",
      "no-matches": "No matching workspaces",
    }[state];
    await expect(
      page.getByText(expected, { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await expect(page.locator(".dr-phone-row")).toHaveCount(0);
    await expect(page.locator("#ppo-discovery-register tbody tr")).toHaveCount(
      0,
    );
  });
}

test("ES-02 snapshot keeps exact saved basis, keyboard focus and handovers", async ({
  page,
}, info) => {
  test.skip(
    !!info.project.use.isMobile,
    "Phone rows hand over directly to the wizard",
  );
  const story = discoverySnapshotFixture();
  await open(page);
  await page.route(
    `**/api/v1/estimating/workspaces/${story.row.id}**`,
    (route) =>
      route.fulfill({
        json: route.request().url().includes("/summary?")
          ? story.summary
          : route.request().url().includes("/history?")
            ? story.history
            : story.detail,
      }),
  );
  const title = page.getByRole("button", {
    name: story.row.title,
    exact: true,
  });
  await title.click();
  const snapshot = page.getByRole("region", {
    name: `Discovery snapshot: ${story.row.title}`,
  });
  await expect(snapshot).toBeFocused();
  await expect(snapshot).toContainText("AUD 58,400.00");
  await expect(
    snapshot.getByRole("link", { name: "Open estimate" }),
  ).toHaveAttribute(
    "href",
    `/estimating/estimates/${story.summary.estimate_id}?version_id=${story.summary.estimate_version_id}`,
  );
  await expect(
    snapshot.getByRole("link", { name: "Open workspace" }),
  ).toHaveAttribute("href", `/estimating/discovery/${story.row.id}`);
  await expect(page.locator(".dr-register-list")).toHaveAttribute("inert", "");
  await snapshot.getByRole("tab", { name: /Alternatives/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    snapshot.getByRole("tab", { name: /Revisions/ }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(snapshot).toHaveCount(0);
  await expect(title).toBeFocused();
});
