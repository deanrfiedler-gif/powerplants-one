import { test, expect, type Page } from "@playwright/test";
const resourceId = (n: number) =>
  `a4000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const appointmentId = (n: number) =>
  `a8000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const day = "2031-09-22";
const at = (time: string) => `${day}T${time}:00+10:00`;
function fixture(actor = "") {
  const resources = [
    { id: resourceId(3), name: "Pat Rowe" },
    { id: resourceId(1), name: "Casey Ward" },
    { id: resourceId(2), name: "Riley Tran", user_id: actor },
  ].map((r) => ({
    ...r,
    active: true,
    status: "Active",
    resource_type: "Technician",
    version: 1,
    base_timezone: "Australia/Brisbane",
    source_as_at: at("08:00"),
    calendar: {
      id: "SYN-calendar",
      name: "SYN calendar",
      version: 1,
      timezone: "Australia/Brisbane",
      intervals: [],
    },
    skills: [],
    busy: [],
    blocks: [],
    exceptions: [],
  }));
  const items = [
    {
      id: appointmentId(49),
      display_number: "SYN-PPO-APT-000049",
      start_at: at("08:30"),
      end_at: at("11:30"),
      site_name: "SYN Block C Plant Room",
      scope_summary: "Irrigation controller firmware update",
      work_order_display_number: "SYN-PPO-WO-000039",
    },
    {
      id: appointmentId(52),
      display_number: "SYN-PPO-APT-000052",
      start_at: at("13:30"),
      end_at: at("16:30"),
      site_name: "SYN Glasshouse 4",
      scope_summary: "Shade screen motor replacement",
      work_order_display_number: "SYN-PPO-WO-000040",
    },
  ].map((a) => ({
    ...a,
    status: "Confirmed",
    assignment_version: 1,
    site_timezone: "Australia/Brisbane",
    customer_name: "SYN Greenhouse",
    requested_window_start: null,
    requested_window_end: null,
    assignments: [
      {
        id: a.id + ":crew",
        resource_id: resourceId(1),
        name: "Casey Ward",
        active: true,
        assignment_version: 1,
        crew_role: "Lead",
        travel_before_minutes: 30,
        travel_after_minutes: 30,
        travel_reason: "SYN reviewed standard allowance",
      },
    ],
  }));
  const casey = resources[1] as unknown as {
    blocks: object[];
    exceptions: object[];
    busy: object[];
  };
  casey.blocks = [
    {
      id: "SYN-toolbox",
      kind: "OtherWork",
      start_at: at("12:45"),
      end_at: at("13:15"),
    },
  ];
  casey.exceptions = [];
  casey.busy = [
    { start_at: at("08:00"), end_at: at("12:00") },
    { start_at: at("13:00"), end_at: at("17:00") },
  ];
  return {
    items,
    resources,
    observed_at: at("08:45"),
    completeness: "Complete",
    display_timezone: "Australia/Brisbane",
    from: at("00:00"),
    to: "2031-09-23T00:00:00+10:00",
  };
}
async function routeStart(page: Page) {
  await page.locator("#ppo-travel-review").evaluate((root) => {
    for (
      let scroller: Element | null = root;
      scroller;
      scroller = scroller.parentElement
    )
      scroller.scrollTop = 0;
  });
}
async function identity(page: Page) {
  const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
  const response = await page.request.post("/api/v1/local-session", {
    headers: { Origin: origin },
    data: { profile: "coordinator" },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()).actor_id as string;
}
async function readyShell(page: Page) {
  // Establish the real identity/permission read before testing the synthetic route.
  await expect(
    page.getByText("Loading demonstration identity…", { exact: true }),
  ).toHaveCount(0, { timeout: 15000 });
  await expect(
    page
      .getByRole("navigation", { name: "Scheduling workspace" })
      .getByRole("link", { name: "Travel review", exact: true }),
  ).toBeVisible({ timeout: 15000 });
}
async function mock(page: Page, data = fixture()) {
  await page.route("**/api/v1/schedule?**", (route) =>
    route.fulfill({ json: data }),
  );
  await page.goto(`/schedule/travel?day=${day}`);
  await readyShell(page);
  await expect(page.getByLabel("Resource / crew member")).toHaveValue(
    resourceId(1),
  );
}
test("Travel route selects the conflict person, places named conflicts on the right leg and retains exact handover", async ({
  page,
}) => {
  await identity(page);
  await mock(page);
  await expect(
    page.locator(
      '.travel-leg[data-appointment="' +
        appointmentId(52) +
        '"][data-travel-part="before"]',
    ),
  ).toContainText("OtherWork");
  await expect(page.locator(".travel-visit .travel-conflict")).toHaveCount(0);
  await expect(
    page.locator(
      '.travel-leg[data-appointment="' +
        appointmentId(49) +
        '"] .travel-conflict',
    ),
  ).toHaveCount(0);
  await expect(
    page.getByRole("complementary", { name: "Day summary" }),
  ).toContainText("120 min in 4 allowances");
  const href = await page
    .getByRole("link", { name: "Review booking change" })
    .first()
    .getAttribute("href");
  const target = new URL(href!, page.url());
  expect(target.searchParams.get("appointment_id")).toBe(appointmentId(49));
  expect(target.searchParams.get("resource_id")).toBe(resourceId(1));
  expect(target.searchParams.get("day")).toBe(day);
});
test("Keyboard comparison changes no bookings, preserves booked times, warns on reversal and resets; four-width captures", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await identity(page);
  await mock(page);
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/") && r.method() !== "GET")
      writes.push(r.url());
  });
  const before = await page
    .locator(".travel-visit-heading strong")
    .allTextContents();
  const later = page.getByRole("button", {
    name: "Move SYN-PPO-APT-000049 later in comparison",
  });
  await later.focus();
  await expect(later).toBeFocused();
  await page.keyboard.press("Space");
  await expect(
    page.getByText("Original order 2 · now 1", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/A controlled move is required/)).toBeVisible();
  await expect(
    page.getByText("Not recalculated", { exact: true }),
  ).toBeVisible();
  expect(
    await page.locator(".travel-visit-heading strong").allTextContents(),
  ).toEqual([...before].reverse());
  await page.setViewportSize({ width: 1440, height: 900 });
  await routeStart(page);
  await page.screenshot({
    path: info.outputPath("travel-compare-1440.png"),
    fullPage: true,
  });
  await page.locator(".travel-visit").last().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("travel-compare-end-1440.png"),
    fullPage: true,
  });
  const reset = page.getByRole("button", { name: "Reset comparison" });
  await reset.focus();
  await page.keyboard.press("Enter");
  await expect(reset).toBeDisabled();
  expect(
    await page.locator(".travel-visit-heading strong").allTextContents(),
  ).toEqual(before);
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator("#ppo-travel-review")
        .evaluate((root) => root.scrollWidth <= root.clientWidth),
    ).toBe(true);
    await expect(
      page.getByRole("link", { name: "Review booking change" }).first(),
    ).toBeVisible();
    if (width === 320)
      await expect(
        page.locator(".ppo-shell-header").getByText("Travel", { exact: true }),
      ).toBeVisible();
    await routeStart(page);
    await page.screenshot({
      path: info.outputPath(`travel-route-${width}.png`),
      fullPage: true,
    });
    await page.locator(".travel-visit").last().scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath(`travel-route-end-${width}.png`),
      fullPage: true,
    });
    await page.locator(".travel-compare").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath(`travel-summary-${width}.png`),
      fullPage: true,
    });
  }
  expect(writes).toEqual([]);
});
test("No visits, signed-in technician fallback and limited resources remain distinct", async ({
  page,
}, info) => {
  const actor = await identity(page);
  const data = fixture(actor);
  data.resources[1].blocks = [];
  await page.route("**/api/v1/schedule?**", (route) =>
    route.fulfill({ json: data }),
  );
  await page.goto(`/schedule/travel?day=${day}`);
  await readyShell(page);
  await expect(page.getByLabel("Resource / crew member")).toHaveValue(
    resourceId(2),
  );
  await expect(
    page.getByRole("heading", { name: "No assigned visits for Riley Tran" }),
  ).toBeVisible();
  await page.getByLabel("Resource / crew member").selectOption(resourceId(3));
  await expect(
    page.getByRole("heading", { name: "No assigned visits for Pat Rowe" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open the planner" }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Day summary" }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: info.outputPath("travel-empty-390.png"),
    fullPage: true,
  });
  data.resources = data.resources.filter((r) => r.id === resourceId(2));
  data.items = [];
  await page.getByRole("button", { name: "Refresh visits" }).click();
  await expect(
    page.getByRole("heading", { name: "Selected person is unavailable" }),
  ).toBeVisible();
  await expect(page.locator(".travel-route")).toHaveCount(0);
  await expect(
    page.getByLabel("Resource / crew member").locator("option"),
  ).toHaveCount(2);
});
test("Failed and denied refreshes remove previous routes and comparison; retry reads current evidence", async ({
  page,
}, info) => {
  await identity(page);
  let status = 200;
  await page.route("**/api/v1/schedule?**", (route) =>
    route.fulfill({
      status,
      json:
        status === 200
          ? fixture()
          : {
              code: status === 403 ? "Forbidden" : "DependencyUnavailable",
              message:
                status === 403
                  ? "SYN travel access denied"
                  : "SYN travel source unavailable",
              retryable: status !== 403,
            },
    }),
  );
  await page.goto(`/schedule/travel?day=${day}`);
  await readyShell(page);
  await expect(page.locator(".travel-visit")).toHaveCount(2);
  await page
    .getByRole("button", {
      name: "Move SYN-PPO-APT-000049 later in comparison",
    })
    .click();
  for (const failure of [503, 403]) {
    status = failure;
    await page.getByRole("button", { name: "Refresh visits" }).click();
    await expect(
      page.getByRole("heading", { name: "Travel could not be loaded" }),
    ).toBeVisible();
    await expect(page.locator(".travel-route")).toHaveCount(0);
    await expect(
      page.locator("#ppo-travel-review").getByRole("alert"),
    ).toContainText(
      failure === 403
        ? "SYN travel access denied"
        : "SYN travel source unavailable",
    );
    await expect(
      page.getByText("— visits · Current results unconfirmed"),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: info.outputPath(`travel-failure-${failure}.png`),
      fullPage: true,
    });
    status = 200;
    await page
      .getByRole("button", { name: "Retry loading", exact: true })
      .click();
    await expect(page.locator(".travel-visit")).toHaveCount(2);
    await expect(
      page.getByRole("button", { name: "Reset comparison" }),
    ).toBeDisabled();
  }
});
test("Late earlier-day reads cannot replace the current day or leave a stale route visible", async ({
  page,
}) => {
  await identity(page);
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const requested = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/api/v1/schedule?**", async (route) => {
    const q = new URL(route.request().url()).searchParams;
    if (q.get("from")?.startsWith("2031-09-21")) {
      started();
      await held;
      await route.fulfill({ json: fixture() });
    } else {
      const data = fixture();
      data.items = [];
      data.resources[1].blocks = [];
      await route.fulfill({ json: data });
    }
  });
  await page.goto(`/schedule/travel?day=${day}`);
  await readyShell(page);
  await requested;
  await page.getByLabel("Review day", { exact: true }).fill("2031-09-23");
  await expect(page.locator(".travel-visit")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /No assigned visits for/ }),
  ).toBeVisible();
  const earlierResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/schedule?") &&
      new URL(response.url()).searchParams
        .get("from")
        ?.startsWith("2031-09-21") === true,
  );
  release();
  await earlierResponse;
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
  await expect(page.getByLabel("Review day", { exact: true })).toHaveValue(
    "2031-09-23",
  );
  await expect(page.locator(".travel-visit")).toHaveCount(0);
});
