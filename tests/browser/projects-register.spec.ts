import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { projectInput, taskInput } from "../helpers/projects";
const design = JSON.parse(
  readFileSync(
    new URL(
      "../../docs/design/projects-register/figma-measurements.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

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
  const [registerRead] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/v1/projects/register?")),
    page.goto(`/projects?q=${encodeURIComponent(prefix)}`),
  ]);
  expect(registerRead.ok()).toBe(true);
  await expect(page.locator("#ppo-projects")).toBeVisible();
  await expect(page.getByText("2 projects", { exact: true }))
    .toBeVisible()
    .catch(async () => {
      await expect(page.locator(".pj-observed")).toContainText("2 projects");
    });
  const phone = (page.viewportSize()?.width ?? 1440) <= 780;
  const openSnapshot = async (action: () => Promise<unknown>) => {
    const [read] = await Promise.all([
      page.waitForResponse((r) =>
        r.url().endsWith(`/api/v1/projects/${first.id}`),
      ),
      action(),
    ]);
    expect(read.ok()).toBe(true);
  };
  if (!phone) {
    const expand = page.getByRole("button", {
      name: "Expand primary navigation",
      exact: true,
    });
    if (await expand.isVisible()) await expand.click();
    const heading = page.getByRole("navigation", {
      name: "Breadcrumb",
      exact: true,
    });
    await expect(
      heading.getByText("Project register", { exact: true }),
    ).toBeVisible();
    const headingBounds = (await heading.boundingBox())!;
    const searchBounds = (await page
      .locator(".ppo-header-centre")
      .boundingBox())!;
    expect(headingBounds.x + headingBounds.width).toBeLessThanOrEqual(
      searchBounds.x,
    );
    const row = page.locator(".pj-table-host tbody tr").first();
    await expect(row).toContainText("Overdue ·");
    expect((await row.boundingBox())!.height).toBe(design.desktop.row);
    expect(
      (await page.locator(".pj-table-host thead").boundingBox())!.height,
    ).toBe(design.desktop.header_row);
    expect(
      (await page.locator(".pj-toolbar.pj-desktop").boundingBox())!.height,
    ).toBe(design.desktop.toolbar);
    expect((await page.locator("#projects-menu").boundingBox())!.width).toBe(
      design.desktop.menu,
    );
    await expect(
      page.locator(".pj-table-host th[aria-sort=ascending]"),
    ).toContainText("Target date");
    await page.screenshot({ path: info.outputPath("project-register.png") });
    await page
      .getByRole("checkbox", { name: `Select ${first.title}`, exact: true })
      .check();
    await page
      .getByRole("checkbox", { name: `Select ${second.title}`, exact: true })
      .check();
    await expect(
      page.getByRole("complementary", { name: "Selected projects" }),
    ).toBeVisible();
    expect((await page.locator(".pj-bulk").boundingBox())!.width).toBe(
      design.selection.width,
    );
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export list", exact: true })
      .click();
    expect((await download).suggestedFilename()).toBe("projects.csv");
    await openSnapshot(() =>
      page
        .getByRole("button", { name: "Open in sequence", exact: true })
        .first()
        .click(),
    );
  } else {
    const row = page.getByRole("button", {
      name: `Open ${first.title}`,
      exact: true,
    });
    expect((await row.boundingBox())!.height).toBe(design.phone.row);
    await page.screenshot({ path: info.outputPath("project-register.png") });
    await openSnapshot(() => row.click());
  }
  const snapshot = page.getByRole("dialog", { name: first.title });
  await expect(snapshot).toBeVisible();
  expect((await snapshot.boundingBox())!.width).toBe(
    phone ? design.phone_snapshot.width : design.snapshot.width,
  );
  if (!phone)
    expect((await snapshot.locator(".pj-record").boundingBox())!.width).toBe(
      design.snapshot.record,
    );
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
  await page.screenshot({
    path: info.outputPath("project-register-filtered.png"),
  });
  // Exercise the shared overlay breakpoint and the smallest supported phone.
  const smaller = phone
    ? { width: 320, height: 740 }
    : { width: 1024, height: 768 };
  await page.setViewportSize(smaller);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const [smallRead] = await Promise.all([
    page.waitForResponse((r) =>
      r.url().endsWith(`/api/v1/projects/${second.id}`),
    ),
    phone
      ? page
          .getByRole("button", { name: `Open ${second.title}`, exact: true })
          .click()
      : page.locator(".pj-table-host .ppo-register-row-title").click(),
  ]);
  expect(smallRead.ok()).toBe(true);
  const smallerSnapshot = page.getByRole("dialog", { name: second.title });
  await expect(smallerSnapshot).toBeVisible();
  for (const target of [
    smallerSnapshot,
    smallerSnapshot.getByRole("link", { name: "Open schedule", exact: true }),
    smallerSnapshot.getByRole("link", {
      name: "Acceptance & closeout",
      exact: true,
    }),
  ]) {
    const bounds = (await target.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(smaller.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(smaller.height);
  }
  await page.screenshot({
    path: info.outputPath("project-snapshot-responsive.png"),
  });
  await page.keyboard.press("Escape");
  await page.goto(`/projects/${first.id}`);
  await expect(page.locator("#ppo-gantt-page")).toBeVisible();
  const schedule = await call(page, origin, `projects/${first.id}`);
  expect(schedule.project.version).toBe(3);
  expect(schedule.tasks).toHaveLength(2);
});

test("failed refresh disables retained rows and forbidden refresh clears them", async ({
  page,
  baseURL,
}) => {
  await call(page, baseURL!, "local-session", { profile: "coordinator" });
  const saved = { ...projectInput(), title: `SYN Refresh ${Date.now()}` };
  await call(page, baseURL!, "projects", saved);
  const [initialRead] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/v1/projects/register?")),
    page.goto(`/projects?q=${encodeURIComponent(saved.title)}`),
  ]);
  expect(initialRead.ok()).toBe(true);
  await expect(page.locator("#ppo-projects")).toBeVisible();
  const phone = (page.viewportSize()?.width ?? 1440) <= 780;
  const rows = page.locator(
    phone ? ".pj-phone-row" : ".pj-table-host tbody tr",
  );
  await expect(rows).toHaveCount(1);
  let status = 503;
  await page.route("**/api/v1/projects/register?**", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(
        status === 403
          ? { code: "Forbidden", message: "Access refused" }
          : { code: "Unavailable", message: "Synthetic service unavailable" },
      ),
    }),
  );
  if (phone)
    await page
      .getByRole("button", { name: "Filter projects", exact: true })
      .click();
  await page
    .getByRole("button", { name: "Refresh projects", exact: true })
    .click();
  await expect(page.locator("#ppo-projects").getByRole("alert")).toContainText(
    "Synthetic service unavailable",
  );
  await expect(rows).toHaveCount(1);
  if (phone) {
    await expect(rows).toBeDisabled();
  } else {
    await expect(
      page.getByRole("checkbox", { name: "Select all projects on this page" }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Project register actions", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Export this page (CSV)", exact: true }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");
  }
  status = 403;
  await page
    .getByRole("button", { name: "Refresh projects", exact: true })
    .click();
  await expect(page.locator("#ppo-projects").getByRole("alert")).toContainText(
    "Access refused",
  );
  await expect(page.locator(".pj-table-host tbody tr")).toHaveCount(0);
  await expect(page.locator(".pj-phone-row")).toHaveCount(0);
});

// F13 / UXB-75: the results are most of the viewport, so moving them when the loading line goes
// multiplied with any other shift in that frame (0.125 against the 0.1 budget in CI).
test("first load puts the results in the loading line's place without moving them", async ({
  page,
  baseURL,
}) => {
  await call(page, baseURL!, "local-session", { profile: "coordinator" });
  // From the first frame: every distinct top edge of the laid-out results.
  await page.addInitScript(() => {
    const tops: number[] = [];
    (window as unknown as { resultTops: number[] }).resultTops = tops;
    const sample = () => {
      const box = document
        .querySelector("#ppo-projects .pj-results")
        ?.getBoundingClientRect();
      if (box?.height && tops.at(-1) !== Math.round(box.top))
        tops.push(Math.round(box.top));
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  // Hold the register read so the loading line is painted before the results arrive.
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/v1/projects/register?**", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/projects");
  await expect(
    page.locator("#ppo-projects").getByText("Loading permitted records…"),
  ).toBeVisible();
  release();
  await expect(page.locator(".pj-results")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(page.locator(".pj-results")).toBeVisible();
  await page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
  expect(
    await page.evaluate(
      () => (window as unknown as { resultTops: number[] }).resultTops,
    ),
  ).toHaveLength(1);
});
