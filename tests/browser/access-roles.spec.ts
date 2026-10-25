import { test, expect } from "@playwright/test";
import { browserFixtureCall } from "../helpers/browser-fixture-call";
import { phoneWidth, openSecondaryMenu } from "../helpers/phone-menu";

test("AD-01 returning to earlier selections waits for a fresh comparison or explanation", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  for (const role of [true, false]) {
    const id = "30000000-0000-4000-8000-000000000005";
    await page.goto(`/admin/access/${id}${role ? "/roles" : ""}`);
    if (role)
      await page
        .getByLabel("Proposed bundle", { exact: true })
        .selectOption("bundle-observer");
    const site = page.getByLabel("Site", { exact: true });
    await site.selectOption("70000000-0000-4000-8000-000000000001");
    const button = page.getByRole("button", {
      name: role ? "Compare current grants" : "Check grant eligibility",
    });
    const heading = page.getByRole("heading", {
      name: role
        ? "1 of 1 capabilities permit this scope"
        : "Grant permits this scope",
      exact: true,
    });
    await button.click();
    await expect(heading).toBeVisible();
    await site.selectOption("70000000-0000-4000-8000-000000000002");
    await site.selectOption("70000000-0000-4000-8000-000000000001");
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const pattern = role
      ? "**/api/v1/admin/access/*/roles?**"
      : "**/api/v1/admin/access/*/explanation?**";
    await page.route(pattern, async (route) => {
      await pending;
      await route.continue();
    });
    const sent = page.waitForRequest((request) =>
      request
        .url()
        .includes(
          `/api/v1/admin/access/${id}/${role ? "roles" : "explanation"}?`,
        ),
    );
    try {
      await button.click();
      await sent;
      await expect(heading).toHaveCount(0);
    } finally {
      release();
    }
    await expect(heading).toBeVisible();
    await page.unroute(pattern);
  }
});

test("AD-01 retained proposed bundles, scoped comparison and fresh explanation handover", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto("/admin/access");
  await expect(page.locator("#ppo-access-register")).toBeVisible();
  const bundles = page.getByRole("link", {
    name: "Role bundles (proposed)",
    exact: true,
  });
  if (!(await bundles.isVisible())) await openSecondaryMenu(page);
  await bundles.click();
  // The phone header draws the page name as its title and no breadcrumb (phone header amendment P1, P2).
  await expect(
    phoneWidth(page)
      ? page.locator("#shell-header .ppo-phone-title-text")
      : page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("list", {
          name: "Users and access / Proposed role bundles",
          exact: true,
        }),
  ).toContainText("Proposed role bundles");
  await expect(
    page
      .getByRole("region", { name: "Role proposals" })
      .locator("article.record-card"),
  ).toHaveCount(7);
  const coordinator = page.locator("main article").filter({
    has: page.getByRole("heading", {
      name: "Service coordinator",
      exact: true,
    }),
  });
  await expect(coordinator).toContainText("added pack.check; removed none");
  await expect(coordinator).toContainText(
    "This draft has not replaced the proposal.",
  );
  const disclosure = coordinator.getByText("Capabilities in r02", {
    exact: true,
  });
  expect((await disclosure.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(
    coordinator.getByRole("link", { name: "pack.check", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to users and access" }).click();
  // The register is paged and its record links retain workspace context.
  // Find the same person through the visible register on both layouts.
  if (phoneWidth(page))
    await page.locator("#shell-header").getByRole("button", { name: /^(Search identities|Search and filter)$/ }).filter({ visible: true }).click();
  const search = page.getByRole("textbox", { name: "Find a person", exact: true }).filter({ visible: true });
  await search.fill("SYN Site observer");
  await search.press("Enter");
  await page
    .getByRole("link", { name: "SYN Site observer", exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("link", { name: "Compare proposed role bundle", exact: true })
    .click();
  await page
    .getByLabel("Proposed bundle", { exact: true })
    .selectOption("bundle-observer");
  await page
    .getByLabel("Site", { exact: true })
    .selectOption("70000000-0000-4000-8000-000000000001");
  await page.getByRole("button", { name: "Compare current grants" }).click();
  await expect(
    page.getByRole("heading", {
      name: "1 of 1 capabilities permit this scope",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Missing capabilities are not a recommendation/),
  ).toBeVisible();
  await page
    .getByLabel("Site", { exact: true })
    .selectOption("70000000-0000-4000-8000-000000000002");
  await expect(page.locator("#comparison-result")).toHaveCount(0);
  await page.getByRole("button", { name: "Compare current grants" }).click();
  await expect(
    page.getByRole("heading", {
      name: "0 of 1 capabilities permit this scope",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "Explain shared.read", exact: true })
    .click();
  await expect(page.getByLabel("Capability key", { exact: true })).toHaveValue(
    "shared.read",
  );
  await expect(page.getByLabel("Site", { exact: true })).toHaveValue(
    "70000000-0000-4000-8000-000000000002",
  );
  await expect(
    page.getByRole("heading", {
      name: "Grant does not permit this scope",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Check grant eligibility" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Grant does not permit this scope",
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("AD-01 role comparison clears changed results and recovers from read failure without retaining denied context", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto("/admin/access/30000000-0000-4000-8000-000000000005/roles");
  await page.getByRole("button", { name: "Compare current grants" }).click();
  await expect(page.locator("#comparison-result")).toContainText(
    "of 13 capabilities",
  );
  await page.getByLabel("Source revision", { exact: true }).selectOption("r02");
  await expect(page.locator("#comparison-result")).toHaveCount(0);
  await page.getByRole("button", { name: "Compare current grants" }).click();
  await expect(page.locator("#comparison-result")).toContainText(
    "of 14 capabilities",
  );
  let failure: "Unavailable" | "Forbidden" | "WorkingCompanySelected" | null =
    "Unavailable";
  await page.route("**/api/v1/admin/access/*/roles?**", (route) =>
    failure
      ? route.fulfill({
          status:
            failure === "Forbidden"
              ? 403
              : failure === "WorkingCompanySelected"
                ? 409
                : 503,
          contentType: "application/json",
          body: JSON.stringify({
            code: failure,
            message: `Synthetic comparison ${failure}`,
          }),
        })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Compare current grants" }).click();
  await expect(page.locator("main .business-error")).toContainText(
    "Synthetic comparison Unavailable",
  );
  await expect(page.locator("#comparison-result")).toHaveCount(0);
  failure = null;
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await expect(page.locator("#comparison-result")).toContainText(
    "of 14 capabilities",
  );
  failure = "WorkingCompanySelected";
  await page.getByRole("button", { name: "Compare current grants" }).click();
  await expect(page.locator("main .business-error")).toContainText(
    "WorkingCompanySelected",
  );
  await expect(
    page.getByRole("heading", { name: "SYN Site observer", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Proposed bundle", { exact: true })).toHaveCount(
    0,
  );
  failure = null;
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await page.getByRole("button", { name: "Compare current grants" }).click();
  await expect(page.locator("#comparison-result")).toContainText(
    "of 13 capabilities",
  );
  failure = "Forbidden";
  await page.getByRole("button", { name: "Compare current grants" }).click();
  await expect(page.locator("main .business-error")).toContainText("Forbidden");
  await expect(
    page.getByRole("heading", { name: "SYN Site observer", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("#comparison-result")).toHaveCount(0);
});

test("AD-01 team proposals retain example provenance and hand over only to actual local people", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto("/admin/access/roles");
  await page.getByRole("link", { name: "Inspect proposed teams" }).click();
  const teams = page.getByRole("region", {
    name: "Proposed teams",
    exact: true,
  });
  await expect(teams).toContainText("Retained example as at 2026-09-17");
  await expect(teams).toContainText("not saved memberships");
  await expect(teams.locator("article")).toHaveCount(2);
  for (const name of ["Service coordination", "Finance handoff"]) {
    const disclosure = teams.getByText(`Example roster for ${name}`, {
      exact: true,
    });
    expect((await disclosure.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await disclosure.focus();
    await page.keyboard.press("Enter");
  }
  const service = teams.getByRole("article", {
    name: "Service coordination proposal",
  });
  await expect(service).toContainText("Source example: SYN Service team lead");
  await expect(service).toContainText("Source dates: 2026-01-01 to 2026-09-12");
  await expect(service.getByRole("link")).toHaveCount(3);
  await expect(
    teams
      .getByRole("article", { name: "Finance handoff proposal" })
      .getByRole("link"),
  ).toHaveCount(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await service
    .getByRole("link", { name: "SYN Site observer", exact: true })
    .click();
  await expect(page).toHaveURL(
    /\/admin\/access\/30000000-0000-4000-8000-000000000005$/,
  );
  await expect(
    page.getByRole("heading", { name: "SYN Site observer", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Grant permits this scope",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("AD-01 team refresh clears stale rosters on loading, unavailable and authority failures", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto("/admin/access/roles");
  const teams = page.getByRole("region", {
    name: "Proposed teams",
    exact: true,
  });
  await expect(teams).toBeVisible();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const pattern = "**/api/v1/admin/access/roles";
  await page.route(pattern, async (route) => {
    await pending;
    await route.continue();
  });
  const sent = page.waitForRequest(
    (r) => new URL(r.url()).pathname === "/api/v1/admin/access/roles",
  );
  try {
    await page
      .getByRole("button", { name: "Refresh proposals", exact: true })
      .click();
    await sent;
    await expect(teams).toHaveCount(0);
  } finally {
    release();
  }
  await expect(teams).toBeVisible();
  await page.unroute(pattern);
  for (const [code, status] of [
    ["Unavailable", 503],
    ["Forbidden", 403],
    ["WorkingCompanySelected", 409],
  ] as const) {
    await page.route(pattern, (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ code, message: `Synthetic catalogue ${code}` }),
      }),
    );
    await page
      .getByRole("button", { name: "Refresh proposals", exact: true })
      .click();
    await expect(page.locator("main .business-error")).toContainText(code);
    await expect(teams).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: "Role proposals", exact: true }),
    ).toHaveCount(0);
    await page.unroute(pattern);
    await page
      .getByRole("button", { name: "Retry loading", exact: true })
      .click();
    await expect(teams).toBeVisible();
  }
});

test("AD-01 team presentation separates inactive and unavailable local people from source examples", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  // Presentation fixture only; actual issuer, workspace and inactive checks are in the database suite.
  await page.route("**/api/v1/admin/access/roles", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const team = body.teams.find(
      (item: { id: string }) => item.id === "team-service",
    );
    team.members[0].current = null;
    team.members[2].current = {
      ...team.members[2].current,
      display_name: "SYN Renamed inactive observer",
      active: false,
    };
    await route.fulfill({ response, json: body });
  });
  await page.goto("/admin/access/roles");
  const service = page.getByRole("article", {
    name: "Service coordination proposal",
  });
  await service
    .getByText("Example roster for Service coordination", { exact: true })
    .click();
  await expect(service).toContainText(
    "Local identity unavailable in this workspace",
  );
  await expect(service).toContainText("Source example: SYN Site observer");
  await expect(service).toContainText("Inactive identity");
  await expect(
    service.getByRole("link", {
      name: "SYN Renamed inactive observer",
      exact: true,
    }),
  ).toBeVisible();
  await expect(service.getByRole("link")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
