import { test, expect, type Page } from "@playwright/test";

const resourceId = "a4000000-0000-4000-8000-000000000001";
const siteId = "70000000-0000-4000-8000-000000000001";
async function identity(page: Page) {
  const response = await page.request.post("/api/v1/local-session", {
    headers: { Origin: `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}` },
    data: { profile: "coordinator" },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

test("planner renders a continuing closure on every intersecting day, excluding its end boundary", async ({
  page,
}, info) => {
  await page.goto(
    "/development/component-preview?component=planner&state=week",
  );
  for (const day of ["2026-09-24", "2026-09-25", "2026-09-26"])
    await expect(
      page
        .locator(`[data-day="${day}"]`)
        .getByText("Calendar closed", { exact: true }),
    ).toBeVisible();
  await expect(
    page
      .locator('[data-day="2026-09-27"]')
      .getByText("Calendar closed", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("continuing-calendar-closure.png"),
    fullPage: true,
  });
});

test("Field Team and resource evidence retain date, site and timezone through reload and return", async ({
  page,
}, info) => {
  await identity(page);
  await page.goto(
    `/service/technicians?day=2031-09-22&site_id=${siteId}&timezone=Australia%2FMelbourne`,
  );
  await expect(page.getByLabel("Visit date", { exact: true })).toHaveValue(
    "2031-09-22",
  );
  await expect(
    page.getByRole("combobox", { name: "Display timezone", exact: true }),
  ).toHaveValue("Australia/Melbourne");
  await expect(
    page.getByRole("combobox", { name: "Site", exact: true }),
  ).toHaveValue(siteId);
  await page.getByRole("tab", { name: /^Technicians/ }).click();
  await page
    .getByRole("link", { name: "Availability & competence" })
    .first()
    .click();
  await expect(page.getByLabel("Review timezone")).toHaveValue(
    "Australia/Melbourne",
  );
  await page.getByLabel("Review timezone").selectOption("UTC");
  await page.getByLabel("Week starting").fill("2031-09-23");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Published calendar" }),
  ).toBeVisible();
  await expect(page.getByLabel("Week starting")).toHaveValue("2031-09-23");
  await expect(page.getByLabel("Review timezone")).toHaveValue("UTC");
  await page.screenshot({
    path: info.outputPath("resource-timezone-context.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Back to Field Team" }).click();
  await expect(page.getByLabel("Visit date", { exact: true })).toHaveValue(
    "2031-09-23",
  );
  await expect(
    page.getByRole("combobox", { name: "Display timezone", exact: true }),
  ).toHaveValue("UTC");
  await expect(
    page.getByRole("combobox", { name: "Site", exact: true }),
  ).toHaveValue(siteId);
});

test("changes queue and selected appointment survive reload and the appointment control handover", async ({
  page,
}) => {
  await identity(page);
  await page.goto("/schedule/changes?day=2031-09-22&queue=history");
  const queue = page.locator(".scheduling-queue");
  const buttons = queue.getByRole("button");
  await expect(buttons.first()).toBeVisible();
  await buttons.last().focus();
  await page.keyboard.press("Enter");
  const selected = new URL(page.url()).searchParams.get("selected_id");
  expect(selected).toMatch(/^[0-9a-f-]{36}$/);
  const heading = await page
    .locator("#scheduling-review-heading")
    .textContent();
  await page.reload();
  await expect(page.getByLabel("Queue", { exact: true })).toHaveValue(
    "history",
  );
  await expect(page.locator("#scheduling-review-heading")).toHaveText(heading!);
  const link = page.getByRole("link", { name: "Open appointment controls" });
  const target = new URL((await link.getAttribute("href"))!, page.url());
  const back = new URL(target.searchParams.get("returnTo")!, page.url());
  expect(back.searchParams.get("queue")).toBe("history");
  expect(back.searchParams.get("selected_id")).toBe(selected);
  await link.click();
  await page
    .getByRole("link", { name: "Back to scheduling review", exact: true })
    .click();
  await expect(page.locator("#scheduling-review-heading")).toHaveText(heading!);
});

test("travel warns about a supplied closure, retains resource on reload and hands exact site context to Changes", async ({
  page,
}, info) => {
  await identity(page);
  // Read-only presentation challenge: the existing immutable calendar publisher
  // does not permit adding a closure after a conflicting booking is confirmed.
  await page.route("**/api/v1/schedule?**", async (route) => {
    const response = await route.fetch();
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    for (const resource of data.resources)
      resource.exceptions = [
        {
          id: "SYN-PPO-CLOSURE-CHALLENGE",
          kind: "Closed",
          start_at: "2031-09-21T14:00:00Z",
          end_at: "2031-09-22T14:00:00Z",
        },
      ];
    await route.fulfill({ response, json: data });
  });
  await page.goto(`/schedule/travel?day=2031-09-22&site_id=${siteId}`);
  await page.getByLabel("Resource / crew member").selectOption(resourceId);
  await page.reload();
  await expect(page.getByLabel("Resource / crew member")).toHaveValue(
    resourceId,
  );
  await expect(
    page.getByText(/Calendar closure overlaps/).first(),
  ).toBeVisible();
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/") && request.method() !== "GET")
      writes.push(request.url());
  });
  const change = page
    .getByRole("link", { name: "Review booking change" })
    .first();
  const target = new URL((await change.getAttribute("href"))!, page.url());
  expect(target.searchParams.get("site_id")).toBe(siteId);
  expect(target.searchParams.get("resource_id")).toBe(resourceId);
  expect(target.searchParams.get("appointment_id")).toMatch(/^[0-9a-f-]{36}$/);
  await page.screenshot({
    path: info.outputPath("travel-closure-challenge.png"),
    fullPage: true,
  });
  await change.click();
  await expect(page.getByText(/Exact appointment handover/)).toBeVisible();
  expect(writes).toEqual([]);
});

test("capacity retains meaningful filters on reload while analytical exclusions stay disposable", async ({
  page,
}, info) => {
  await identity(page);
  await page.goto("/schedule/capacity?day=2031-09-22");
  await page.getByLabel("Domain", { exact: true }).selectOption("Service");
  await page
    .getByLabel("Commitment", { exact: true })
    .selectOption("Operational booking");
  await page.getByLabel("Resource", { exact: true }).selectOption(resourceId);
  await page
    .getByLabel("Required skill", { exact: true })
    .selectOption("SYN-VISUAL");
  await page.getByLabel("Unknown effort only").check();
  await page
    .getByRole("checkbox", { name: "Exclude from analytical scenario" })
    .first()
    .check();
  await expect(
    page.getByRole("button", { name: "Reset scenario" }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel("Domain", { exact: true })).toHaveValue(
    "Service",
  );
  await expect(page.getByLabel("Commitment", { exact: true })).toHaveValue(
    "Operational booking",
  );
  await expect(page.getByLabel("Resource", { exact: true })).toHaveValue(
    resourceId,
  );
  await expect(page.getByLabel("Required skill", { exact: true })).toHaveValue(
    "SYN-VISUAL",
  );
  await expect(page.getByLabel("Unknown effort only")).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Reset scenario" }),
  ).toBeDisabled();
  await page.screenshot({
    path: info.outputPath("capacity-restored-filters.png"),
    fullPage: true,
  });
});
