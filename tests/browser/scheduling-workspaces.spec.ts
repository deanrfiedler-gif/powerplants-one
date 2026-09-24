import { test, expect, type Page } from "@playwright/test";
const id = (t: string, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const origin = () => `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function identity(page: Page, profile = "coordinator") {
  const response = await page.request.post("/api/v1/local-session", {
    headers: { Origin: origin() },
    data: { profile },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}
async function settled(page: Page) {
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".business-error")).toHaveCount(0);
}
const screenshots = [
  ["/schedule?day=2031-09-22", "planner"],
  ["/service/technicians/" + id("a4") + "?day=2031-09-22", "resource"],
  ["/schedule/changes?day=2031-09-22&appointment_id=" + id("a8"), "changes"],
  ["/schedule/travel?day=2031-09-22", "travel"],
  ["/schedule/capacity?day=2031-09-22", "capacity"],
] as const;
test("native scheduling pages retain context and reflow at coordination, phone and zoom widths", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await identity(page);
  const sizes = info.project.name.includes("mobile")
    ? [
        [390, 844],
        [320, 844],
      ]
    : [
        [1440, 960],
        [1024, 768],
        [720, 480],
      ];
  for (const [width, height] of sizes)
    for (const [path, name] of screenshots) {
      await page.setViewportSize({ width, height });
      await page.goto(path);
      await expect(
        page.getByRole("navigation", { name: "Scheduling workspace" }),
      ).toBeVisible();
      if (name !== "planner")
        await expect(
          page
            .locator(".scheduling-workspace .read-meta")
            .filter({ hasText: /Read at|Snapshot/ })
            .first(),
        ).toBeVisible({ timeout: 15000 });
      else
        await expect(
          page.getByRole("heading", { name: "Service planner", exact: true }),
        ).toBeAttached();
      await settled(page);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        name + " must not overflow the page",
      ).toBe(true);
      expect(
        await page.locator(".ppo-shell-header").evaluate((header) => {
          const bounds = header.getBoundingClientRect();
          return [...header.querySelectorAll("button")]
            .filter((button) => button.getBoundingClientRect().width > 0)
            .every((button) => {
              const r = button.getBoundingClientRect();
              return r.top >= bounds.top && r.bottom <= bounds.bottom + 1;
            });
        }),
        "Header utilities stay above Service tabs",
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(name + "-" + width + "x" + height + ".png"),
        fullPage: true,
      });
    }
});
test("resource detail exposes read-only evidence, calendar intervals and anonymous reservations", async ({
  page,
}) => {
  await identity(page);
  await page.goto("/service/technicians/" + id("a4") + "?day=2031-09-22");
  await expect(
    page.getByRole("heading", { name: "Competence & evidence" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Published calendar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Busy reservations" }),
  ).toBeVisible();
  await page.getByText("Review evidence", { exact: true }).first().click();
  await expect(page.getByText(/Hash:/).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Save|Edit calendar|Add skill/ }),
  ).toHaveCount(0);
});
test("capacity exclusions compare scenarios and refresh clears analysis without writing sources", async ({
  page,
}) => {
  await identity(page);
  await page.goto("/schedule/capacity?day=2031-09-22");
  await expect(
    page.getByRole("heading", { name: "Scenario comparison" }),
  ).toBeVisible();
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/") && r.method() !== "GET")
      writes.push(r.url());
  });
  const boxes = page.getByRole("checkbox", {
    name: "Exclude from analytical scenario",
  });
  expect(await boxes.count()).toBeGreaterThan(0);
  await boxes.first().check();
  await expect(
    page.getByRole("button", { name: "Reset scenario" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Refresh source snapshot" }).click();
  await expect(
    page.getByRole("button", { name: "Reset scenario" }),
  ).toBeDisabled();
  expect(writes).toEqual([]);
  await page.getByLabel("Domain", { exact: true }).selectOption("Engineering");
  await expect(
    page.locator(".scheduling-workspace").getByText(/No contributions match/),
  ).toBeVisible();
});
test("travel handover retains exact appointment and resource without changing booking", async ({
  page,
}) => {
  await identity(page);
  await page.goto("/schedule/travel?day=2031-09-22");
  await expect(page.getByLabel("Resource / crew member")).toBeVisible();
  await page.getByLabel("Resource / crew member").selectOption(id("a4"));
  await expect(
    page.getByText("Unknown — no provider configured"),
  ).toBeVisible();
  const link = page
    .getByRole("link", { name: "Review booking change" })
    .first();
  const href = await link.getAttribute("href");
  expect(href).toContain("appointment_id=");
  expect(href).toContain("resource_id=" + id("a4"));
  await link.click();
  await expect(page.getByText(/Exact appointment handover/)).toBeVisible();
  await page.getByRole("link", { name: "Open appointment controls" }).click();
  await page.getByRole("link", { name: "Back to scheduling review" }).click();
  await expect(page.getByText(/Exact appointment handover/)).toBeVisible();
});
test("change request review presents exact comparison before a reasoned decision and returns focus", async ({
  page,
}, info) => {
  await identity(page);
  const a = (
    await (await page.request.get("/api/v1/appointments/" + id("a8"))).json()
  ).items[0];
  const requestId = crypto.randomUUID();
  const response = await page.request.post(
    "/api/v1/appointments/" + a.id + "/change-requests",
    {
      headers: { Origin: origin() },
      data: {
        operation_id: crypto.randomUUID(),
        schema_version: 1,
        reason: "SYN-PPO browser request comparison",
        id: requestId,
        expected_version: a.version,
        source_type: "Manual",
        source_reference: "SYN-PPO-BROWSER-REVIEW",
        source_version: "1",
        start_at: "2031-09-24T00:00:00Z",
        end_at: "2031-09-24T02:00:00Z",
        crew: [1, 2].map((n, i) => ({
          resource_id: id("a4", n),
          resource_version: 1,
          calendar_version: 1,
          crew_role: i ? "Technician" : "Lead",
          travel_before_minutes: 0,
          travel_after_minutes: 0,
          travel_reason: "SYN-PPO explicit zero travel review",
        })),
      },
    },
  );
  expect(response.ok(), await response.text()).toBeTruthy();
  await page.goto("/schedule/changes?appointment_id=" + a.id);
  const request = page
    .locator(".change-request")
    .filter({ hasText: requestId });
  await expect(
    request.getByRole("heading", { name: "Current booking" }),
  ).toBeVisible();
  await expect(
    request.getByRole("heading", { name: "Requested booking" }),
  ).toBeVisible();
  await request
    .getByRole("heading", { name: "Current booking", exact: true })
    .evaluate((e) => e.scrollIntoView({ block: "start" }));
  await page.screenshot({
    path: info.outputPath("current-proposed-comparison.png"),
  });
  await request
    .getByLabel("Decision reason")
    .fill("SYN-PPO retain the existing customer arrangement");
  await request
    .getByRole("button", { name: "Reject request", exact: true })
    .click();
  await expect(
    page
      .locator(".change-request")
      .filter({ hasText: requestId })
      .getByText("Rejected", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#scheduling-review-heading")).toBeFocused();
});
test("failed and denied reads cannot imply free capacity or retain an old source snapshot", async ({
  page,
}) => {
  await identity(page);
  await page.goto("/schedule/capacity?day=2031-09-22");
  await expect(
    page.getByRole("heading", { name: "Scenario comparison" }),
  ).toBeVisible();
  await page.route("**/api/v1/schedule/capacity?**", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "DependencyUnavailable",
        message: "SYN-PPO capacity source unavailable",
      }),
    }),
  );
  await page.getByRole("button", { name: "Refresh source snapshot" }).click();
  await expect(
    page.locator(".scheduling-workspace").getByRole("alert"),
  ).toContainText("capacity source unavailable");
  await expect(
    page.getByRole("heading", { name: "Scenario comparison" }),
  ).toHaveCount(0);
  await page.unroute("**/api/v1/schedule/capacity?**");
  await identity(page, "systems");
  await page.reload();
  await expect(
    page.locator(".scheduling-workspace").getByRole("alert"),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Scheduling workspace" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Scenario comparison" }),
  ).toHaveCount(0);
});

test("planner long resource labels wrap in the maintained component fixture", async ({
  page,
}, info) => {
  await page.setViewportSize({
    width: info.project.name.includes("mobile") ? 320 : 1440,
    height: 960,
  });
  await page.goto(
    "/development/component-preview?component=planner&state=long-label",
  );
  await expect(
    page.getByRole("link", { name: /SYN-PPO Technician with a long/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("planner-long-label.png") });
});
