import { test, expect, type Page } from "@playwright/test";
import { projectInput, taskInput } from "../helpers/projects";

test.setTimeout(180000);
async function call(page: Page, baseURL: string, path: string, data?: unknown) {
  const response = await page.request.fetch(`${baseURL}/api/v1/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { Origin: baseURL },
    data,
  });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}
test("saved register facts, restorable filters, selection, exact snapshots and phone/desktop layout", async ({
  page,
  baseURL,
}, info) => {
  const origin = baseURL!;
  await call(page, origin, "local-session", { profile: "coordinator" });
  const prefix = `SYN Register ${info.project.name} ${Date.now()}`;
  const first = {
    ...projectInput(),
    title: `${prefix} Block C fertigation upgrade`,
    target_date: "2026-11-28",
  };
  const second = {
    ...projectInput(),
    title: `${prefix} Water treatment skid replacement`,
    target_date: null,
  };
  await call(page, origin, "projects", first);
  await call(page, origin, "projects", second);
  await call(page, origin, `projects/${first.id}/tasks`, {
    ...taskInput(),
    status: "AtRisk",
    title: "SYN Controller configuration",
  });
  await call(page, origin, `projects/${first.id}/tasks`, {
    ...taskInput(2),
    milestone: true,
    status: "Planned",
    progress: 0,
    start_date: "2020-10-09",
    finish_date: "2020-10-09",
    title: "SYN Fertigation skid on site",
  });
  await page.goto(`/projects?q=${encodeURIComponent(prefix)}`);
  await expect(page.locator("#ppo-projects")).toBeVisible();
  await expect(page.getByText("2 projects", { exact: true }))
    .toBeVisible()
    .catch(async () => {
      await expect(page.locator(".pj-observed")).toContainText("2 projects");
    });
  const phone = (page.viewportSize()?.width ?? 1440) <= 780;
  if (!phone) {
    const expand = page.getByRole("button", {
      name: "Expand primary navigation",
      exact: true,
    });
    if (await expand.isVisible()) await expand.click();
    const row = page.locator(".pj-table-host tbody tr").first();
    await expect(row).toContainText("Overdue ·");
    expect((await row.boundingBox())!.height).toBe(40);
    await expect(
      page.locator(".pj-table-host th[aria-sort=ascending]"),
    ).toContainText("Target date");
    await page
      .getByRole("checkbox", { name: `Select ${first.title}`, exact: true })
      .check();
    await page
      .getByRole("checkbox", { name: `Select ${second.title}`, exact: true })
      .check();
    await expect(
      page.getByRole("complementary", { name: "Selected projects" }),
    ).toBeVisible();
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export list", exact: true })
      .click();
    expect((await download).suggestedFilename()).toBe("projects.csv");
    await page
      .getByRole("button", { name: "Open in sequence", exact: true })
      .first()
      .click();
  } else {
    const row = page.getByRole("button", {
      name: `Open ${first.title}`,
      exact: true,
    });
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(80);
    await row.click();
  }
  const snapshot = page.getByRole("dialog", { name: first.title });
  await expect(snapshot).toBeVisible();
  await expect(snapshot).toContainText("SYN Controller configuration");
  await expect(snapshot).toContainText("1 tasks · 0 complete · 1 at risk");
  await snapshot.getByRole("tab", { name: "Milestones (1)" }).click();
  await expect(snapshot.getByRole("tabpanel")).toContainText(
    "SYN Fertigation skid on site",
  );
  await page.screenshot({ path: info.outputPath("project-snapshot.png") });
  await snapshot
    .getByRole("button", { name: "Next project", exact: true })
    .click();
  await expect(page.getByRole("dialog", { name: second.title })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "No remaining milestones",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".pj-snapshot")).toHaveCount(0);
  if (!phone)
    await page
      .getByRole("button", { name: "Clear selection", exact: true })
      .click();
  await page.goto(`/projects?q=${encodeURIComponent(prefix)}&view=NoTarget`);
  await expect(
    page.locator(phone ? ".pj-phone-row" : ".pj-table-host tbody tr"),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    page.locator(phone ? ".pj-phone-row" : ".pj-table-host tbody tr"),
  ).toContainText(second.title);
  if (phone) {
    const row = page.locator(".pj-phone-row");
    await row.dispatchEvent("pointerdown", {
      pointerType: "touch",
      clientX: 100,
      clientY: 160,
    });
    await expect(page.locator(".pj-mobile-selection")).toContainText(
      "1 selected",
    );
    await row.dispatchEvent("pointerup", { pointerType: "touch" });
    await page.getByRole("button", { name: "Clear selection" }).click();
    await expect(
      page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByRole("link", { name: "Acceptance & closeout" }),
    ).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("project-register.png") });
  await page.goto(`/projects/${first.id}`);
  await expect(page.locator("#ppo-gantt-page")).toBeVisible();
  const schedule = await call(page, origin, `projects/${first.id}`);
  expect(schedule.project.version).toBe(3);
  expect(schedule.tasks).toHaveLength(2);
});

test("failed or forbidden register refresh never exports retained rows", async ({
  page,
  baseURL,
}) => {
  await call(page, baseURL!, "local-session", { profile: "coordinator" });
  await page.goto("/projects");
  await expect(page.locator("#ppo-projects")).toBeVisible();
  await page.route("**/api/v1/projects/register?**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ code: "Forbidden", message: "Access refused" }),
    }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Access refused");
  await expect(page.locator(".pj-table-host tbody tr")).toHaveCount(0);
  await expect(page.locator(".pj-phone-row")).toHaveCount(0);
});
