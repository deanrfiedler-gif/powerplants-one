import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { projectInput } from "../helpers/projects";
import { engineeringInput, engineeringUpdate } from "../helpers/engineering";
import { command, saveFields } from "../helpers/engineering-control";

test.describe.configure({ timeout: 240000 });
const origin = () =>
  new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:3000").origin;
async function call(page: Page, path: string, body?: unknown) {
  const response = await page.request.fetch("/api/v1/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { Origin: origin() },
    data: body,
  });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}
async function setup(page: Page, count: number, titles?: string[]) {
  await call(page, "local-session", { profile: "coordinator" });
  const marker = "SYN EN01 browser " + randomUUID();
  const project = { ...projectInput(), title: marker };
  await call(page, "projects", project);
  const packages = [];
  for (let i = 0; i < count; i++) {
    const input = {
      ...engineeringInput(project.id),
      title: titles?.[i] ?? marker + " " + String(i).padStart(3, "0"),
      required_date: "2099-01-01",
      action_due: "2099-01-01",
    };
    await call(page, "engineering", input);
    packages.push(input);
  }
  return { marker, packages, project };
}
const registerPath = (marker: string, extra = "") =>
  "/engineering?q=" + encodeURIComponent(marker) + "&sort=Name" + extra;
const noOverflow = async (page: Page) =>
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
async function openFirst(page: Page, index = 0) {
  if ((page.viewportSize()?.width ?? 1440) < 768)
    await page.locator(".er-phone-open").nth(index).click();
  else
    await page
      .locator(".er-grid tbody tr")
      .nth(index)
      .locator(".er-cell-link")
      .first()
      .click();
}

test("EN01 full counts and native queues survive paging; a changed continuation restarts page one", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile-chromium",
    "Full native paging is proved once; phone interaction has separate coverage.",
  );
  const s = await setup(page, 51);
  await page.goto(registerPath(s.marker));
  await expect(page.locator(".er-count")).toHaveText("51 packages", {
    timeout: 60000,
  });
  await expect(page.locator(".er-grid tbody tr")).toHaveCount(50);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".er-grid tbody tr")).toHaveCount(1);
  await expect(page.locator(".er-register")).toContainText(
    "1 shown · 51 matching · Page 2",
  );
  await page.locator(".er-grid tbody input[type=checkbox]").first().check();
  await openFirst(page);
  await expect(
    page.getByRole("dialog").locator(".er-record-title"),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".er-register")).toContainText("Page 2");
  await expect(
    page.locator(".er-grid tbody input[type=checkbox]").first(),
  ).toBeChecked();
  const sameSource = page.waitForResponse(
    (r) =>
      r.url().includes("/engineering/register?") &&
      new URL(r.url()).searchParams.get("q") === s.marker,
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await sameSource;
  await expect(page.locator(".er-register")).toContainText("Page 2");
  await expect(
    page.locator(".er-grid tbody input[type=checkbox]").first(),
  ).toBeChecked();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.locator(".er-grid tbody tr")).toHaveCount(50);
  await call(page, "engineering/" + s.packages[0].id + "/coordination", {
    ...engineeringUpdate(),
    state: "Awaiting information",
    blocker: "SYN pending prerequisite",
    required_date: "2099-01-01",
    action_due: "2099-01-01",
  });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "The workload changed" }),
  ).toBeVisible();
  await expect(page.locator(".er-register")).toContainText(
    "50 shown · 51 matching · Page 1",
  );
  await expect(page.locator(".er-grid tbody tr")).toHaveCount(50);
  for (const [view, label] of [
    ["all", "All packages"],
    ["mine", "My work"],
    ["author", "Author actions"],
    ["review", "Reviews assigned to me"],
    ["released", "Released"],
  ]) {
    const expected = await call(
      page,
      "engineering/register?q=" +
        encodeURIComponent(s.marker) +
        "&view=" +
        view,
    );
    await page.goto(registerPath(s.marker, "&view=" + view));
    await expect(page.locator(".er-count")).toHaveText(
      expected.matching_count +
        " package" +
        (expected.matching_count === 1 ? "" : "s"),
    );
    await expect(
      page
        .getByRole("navigation", { name: "Engineering views" })
        .getByRole("button", { name: new RegExp("^" + label) }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(expected.counts.released).toBe(0);
  }
  await page.goto(
    registerPath(s.marker, "&attention=true&state=Awaiting+information"),
  );
  await expect(page.locator(".er-grid tbody tr")).toHaveCount(1);
  await expect(page.locator(".er-count")).toHaveText("1 package");
  const search = page.getByRole("searchbox", {
    name: "Search engineering packages",
  });
  await search.fill(s.marker);
  await search.pressSequentially(" missing");
  await search.press("Home");
  await search.pressSequentially("X");
  await expect(search).toHaveValue("X" + s.marker + " missing");
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("q") === "X" + s.marker + " missing",
  );
  await expect(
    page.getByRole("heading", { name: "No packages match these filters" }),
  ).toBeVisible();
});

test("EN01 selected CSV and sequence retain exact packages and refuse a changed source", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile-chromium",
    "Selection panel and CSV proof; phone selection is checked separately.",
  );
  const s = await setup(page, 3);
  await page.goto(registerPath(s.marker));
  await expect(page.locator(".er-grid tbody tr")).toHaveCount(3, {
    timeout: 60000,
  });
  const boxes = page.locator(".er-grid tbody input[type=checkbox]");
  await boxes.nth(0).check();
  await boxes.nth(2).check();
  const selection = page.getByRole("complementary", {
    name: "Selected packages",
  });
  await expect(selection).toContainText("2 packages selected");
  await openFirst(page, 1);
  await expect(page.getByRole("dialog")).toContainText("2 of 3 on this page");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Next package", exact: true }),
  ).toBeEnabled();
  await page.goBack();
  await expect(selection).toContainText("2 packages selected");
  // A failed read is retryable; it must not be treated as a changed source.
  await page.route("**/api/v1/engineering/register?*", async (route) => {
    if (new URL(route.request().url()).searchParams.get("q") !== s.marker) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "DependencyUnavailable",
        message: "SYN temporary read failure",
        retryable: true,
        field_errors: [],
      }),
    });
  });
  await selection
    .getByRole("button", { name: "Export list (CSV)", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "last confirmed results" }),
  ).toBeVisible();
  await expect(selection).toContainText("2 packages selected");
  await expect(boxes.nth(0)).toBeChecked();
  await expect(boxes.nth(2)).toBeChecked();
  await page.unroute("**/api/v1/engineering/register?*");
  const downloadPromise = page.waitForEvent("download");
  await selection
    .getByRole("button", { name: "Export list (CSV)", exact: true })
    .click();
  const download = await downloadPromise;
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain(s.packages[0].title);
  expect(csv).toContain(s.packages[2].title);
  expect(csv).not.toContain(s.packages[1].title);
  await selection
    .getByRole("button", { name: "Open in sequence", exact: true })
    .last()
    .click();
  const snapshot = page.getByRole("dialog");
  await expect(page).toHaveURL(new RegExp("package_id=" + s.packages[0].id));
  await expect(snapshot.locator(".er-record-title")).toHaveText(
    s.packages[0].title,
  );
  await expect(
    snapshot.getByRole("link", { name: "Open package", exact: true }),
  ).toHaveAttribute("href", "/engineering/" + s.packages[0].id);
  await expect(
    snapshot.getByRole("link", {
      name: "Design basis & interfaces",
      exact: true,
    }),
  ).toHaveAttribute("href", "/engineering/" + s.packages[0].id + "/basis");
  await snapshot
    .getByRole("button", { name: "Next package", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp("package_id=" + s.packages[2].id));
  await expect(
    snapshot.getByRole("button", { name: "Next package", exact: true }),
  ).toBeDisabled();
  await page.goBack();
  await expect(page).toHaveURL(new RegExp("package_id=" + s.packages[0].id));
  await expect(snapshot).toContainText("1 of 2 on this page");
  await snapshot
    .getByRole("button", { name: "Next package", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp("package_id=" + s.packages[2].id));
  await call(
    page,
    "engineering/" + s.packages[2].id + "/coordination",
    engineeringUpdate(),
  );
  await snapshot
    .getByRole("button", { name: "Previous package", exact: true })
    .click();
  await expect(snapshot).toContainText("The workload changed.");
  await expect(page).toHaveURL(new RegExp("package_id=" + s.packages[2].id));
  await expect(
    snapshot.getByRole("button", { name: "Previous package", exact: true }),
  ).toBeDisabled();
  await snapshot
    .getByRole("button", { name: "Close package", exact: true })
    .click();
  await expect(snapshot).toHaveCount(0);
  await expect(page.locator(".er-grid tbody tr")).toHaveCount(3);
  await boxes.nth(0).check();
  await boxes.nth(2).check();
  await call(
    page,
    "engineering/" + s.packages[2].id + "/coordination",
    engineeringUpdate(2),
  );
  let unexpectedDownload = false;
  page.on("download", () => {
    unexpectedDownload = true;
  });
  await selection
    .getByRole("button", { name: "Export list (CSV)", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "The workload changed" }),
  ).toBeVisible();
  await expect(selection).toHaveCount(0);
  expect(unexpectedDownload).toBe(false);
});

test("EN01 loading, denied, partial technical source and retry never present unconfirmed facts", async ({
  page,
}) => {
  const s = await setup(page, 1);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "**/api/v1/engineering/register?*",
    async (route) => {
      await gate;
      await route.continue();
    },
    { times: 1 },
  );
  await page.goto(registerPath(s.marker));
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Loading permitted engineering packages" }),
  ).toBeVisible();
  release();
  await expect(page.locator(".er-register")).toContainText(s.packages[0].title);
  await page.route(
    "**/api/v1/engineering/" + s.packages[0].id + "/control",
    (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "Forbidden",
            message: "SYN technical source unavailable",
            field_errors: [],
          },
        }),
      }),
  );
  await openFirst(page);
  const snapshot = page.getByRole("dialog");
  await expect(snapshot.locator(".er-record-title")).toHaveText(
    s.packages[0].title,
  );
  await expect(snapshot).toContainText("technical facts are not confirmed");
  await expect(
    snapshot.getByRole("tab", { name: "Deliverables", exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/v1/engineering/" + s.packages[0].id + "/control");
  if (page.viewportSize()!.width < 768) {
    await snapshot
      .getByRole("button", { name: "More package actions", exact: true })
      .click();
  }
  await snapshot
    .getByRole("button", { name: "Refresh package snapshot", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    snapshot.getByRole("tab", { name: "Deliverables 0", exact: true }),
  ).toBeVisible();
  await snapshot
    .getByRole("button", { name: "Close package", exact: true })
    .click();
  await page.route("**/api/v1/engineering/register?*", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "Forbidden",
          message: "SYN register unavailable",
          field_errors: [],
        },
      }),
    }),
  );
  if (page.viewportSize()!.width < 768) {
    await page.getByRole("button", { name: /^Filter/ }).click();
  }
  await page
    .getByRole("button", { name: "Refresh packages", exact: true })
    .filter({ visible: true })
    .click();
  if (page.viewportSize()!.width < 768) {
    await page
      .getByRole("button", {
        name: "Close Filter engineering packages",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Engineering access unavailable" }),
  ).toBeVisible();
  await expect(page.locator(".er-grid tbody tr")).toHaveCount(0);
  await expect(page.locator(".er-phone-row")).toHaveCount(0);
  await page.unroute("**/api/v1/engineering/register?*");
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await expect(page.locator(".er-register")).toContainText(s.packages[0].title);
});

test("EN01 accepted desktop and phone composition keeps keyboard and exact-package navigation at 320px", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile-chromium",
    "Explicit four-width capture and keyboard matrix is executed once.",
  );
  const titles = [
    "SYN Seedling conveyor arrangement",
    "SYN Nursery irrigation upgrade",
    "SYN Water recycling pump station",
    "SYN Fertigation skid & pipework",
    "SYN Climate control panel interfaces",
    "SYN Environmental sensor network",
    "SYN Propagation bench layout",
    "SYN Screen & lighting coordination",
  ];
  const s = await setup(page, 8, titles);
  const date = (days: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  for (let i = 0; i < 8; i++) {
    await call(page, "engineering/" + s.packages[i].id + "/coordination", {
      ...engineeringUpdate(),
      state: [2, 7].includes(i)
        ? "Awaiting information"
        : [5, 6].includes(i)
          ? "Queued"
          : "In design",
      blocker: [2, 7].includes(i) ? "SYN retained design input" : null,
      required_date: i >= 6 ? null : date(i === 0 ? -7 : i + 7),
      action_due: date(14),
    });
  }
  const source = randomUUID();
  await call(
    page,
    "engineering/" + s.packages[2].id + "/materials/sources",
    command({
      action: "publish",
      id: source,
      kind: "DesignBasis",
      reference: "SYN-INPUT-" + source.slice(0, 8),
      title: "SYN fictional design brief",
      revision: "A",
      file_version: "1",
      permitted_purpose: "DesignCoordination",
      content:
        "SYNTHETIC retained input; no actual calculation or certified design.",
    }),
  );
  await call(page, "local-session", { profile: "materials-author" });
  await call(
    page,
    "engineering/" + s.packages[2].id + "/control",
    command(
      saveFields(
        "deliverable",
        {
          schema_version: 1,
          source_ids: [source],
          discipline: "Hydraulics",
          document_id: null,
          prerequisite: "SYN exact layout input",
          prerequisite_evidence: null,
          next_action: "Obtain prerequisite",
          planned_hours: null,
          effort_source: null,
          authorised_hours: null,
          authorisation_reference: null,
        },
        { title: "SYN Reticulation layout", due_date: date(12) },
      ),
    ),
  );
  await call(page, "local-session", { profile: "coordinator" });
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [390, 844],
    [320, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/engineering?q=" + encodeURIComponent(s.marker));
    await expect(page.locator(".er-register")).toContainText(
      s.packages[0].title,
      { timeout: 60000 },
    );
    await noOverflow(page);
    await page.screenshot({
      path: info.outputPath("engineering-register-" + width + ".png"),
    });
    await openFirst(page, 2);
    const snapshot = page.getByRole("dialog");
    await expect(snapshot.locator(".er-record-title")).toHaveText(
      s.packages[2].title,
    );
    await expect(
      snapshot.getByRole("tab", { name: "Deliverables 1", exact: true }),
    ).toBeVisible();
    await expect(snapshot).toContainText("SYN Reticulation layout");
    await expect(
      snapshot.getByRole("button", { name: "Close package", exact: true }),
    ).toBeInViewport();
    await noOverflow(page);
    await page.screenshot({
      path: info.outputPath("engineering-snapshot-" + width + ".png"),
    });
    await page.keyboard.press("Escape");
    await expect(snapshot).toHaveCount(0);
    if (width < 768) {
      await expect(page.locator(".er-phone-open").nth(2)).toBeFocused();
      await page
        .getByRole("button", { name: "Select packages", exact: true })
        .click();
      await page.locator(".er-phone-row input[type=checkbox]").first().check();
      await page
        .getByRole("button", { name: "1 selected", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toContainText(
        "1 selected on this page.",
      );
      await page.screenshot({
        path: info.outputPath("engineering-selection-" + width + ".png"),
      });
      await page.keyboard.press("Escape");
    } else {
      await expect(
        page
          .locator(".er-grid tbody tr")
          .nth(2)
          .locator(".er-cell-link")
          .first(),
      ).toBeFocused();
      await page.locator(".er-grid tbody input[type=checkbox]").nth(2).check();
      await page.locator(".er-grid tbody input[type=checkbox]").nth(7).check();
      await page.screenshot({
        path: info.outputPath("engineering-selection-" + width + ".png"),
      });
      const resize = page.getByRole("button", {
        name: "Resize Reference column",
        exact: true,
      });
      await resize.focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Home");
      await expect(resize).toBeFocused();
    }
  }
});
