import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const fixture = pathToFileURL(
  resolve("verification-evidence/projects-ui/index.html"),
).href;
const widths = (page: Page) =>
  page
    .locator(".task-row:not(.group) .sheet-row")
    .first()
    .locator(".cell")
    .evaluateAll((cells) => cells.map((c) => c.getBoundingClientRect().width));
test.beforeEach(async ({ page }) => {
  await page.goto(fixture);
  await expect(
    page.getByRole("heading", {
      name: "SYN Block C · Irrigation & climate upgrade",
    }),
  ).toBeVisible();
});
test("divider clips fixed columns; individual handles track header/body borders through scrolling and resize", async ({
  page,
}, info) => {
  const before = await widths(page),
    pane = page.getByRole("separator", {
      name: "Resize task pane",
      exact: true,
    });
  await pane.focus();
  await pane.press("Home");
  expect(await widths(page)).toEqual(before);
  await expect(pane).toHaveAttribute("aria-valuenow", "240");
  await pane.press("End");
  expect(await widths(page)).toEqual(before);
  await pane.press("Enter");
  const owner = page.getByRole("separator", {
    name: "Resize Owner column",
    exact: true,
  });
  await owner.focus();
  await owner.press("Shift+ArrowRight");
  const after = await widths(page);
  expect(after[2]).toBe(before[2] + 40);
  expect(after.filter((_, i) => i !== 2)).toEqual(
    before.filter((_, i) => i !== 2),
  );
  await pane.focus();
  await pane.press("Home");
  for (const label of [
    "Task name",
    "Owner",
    "Start",
    "Finish",
    "Progress (%)",
  ]) {
    const grip = page.getByRole("separator", {
      name: `Resize ${label} column`,
      exact: true,
    });
    await grip.focus();
    const geometry = await grip.evaluate((handle) => {
      const header = handle.parentElement!,
        index = [...header.parentElement!.children].indexOf(header),
        row = document.querySelector(".task-row:not(.group) .sheet-row")!
          .children[index];
      const h = header.getBoundingClientRect(),
        b = row.getBoundingClientRect(),
        g = handle.getBoundingClientRect();
      return {
        headerEdge: h.right,
        bodyEdge: b.right,
        stroke: g.left + parseFloat(getComputedStyle(handle, "::after").left),
      };
    });
    expect(geometry.headerEdge).toBeCloseTo(geometry.bodyEdge, 3);
    expect(geometry.stroke).toBeCloseTo(geometry.bodyEdge - 1, 3);
  }
  await pane.focus();
  await pane.press("Enter");
  const box = await pane.boundingBox();
  await page.mouse.move(box!.x + 6, box!.y + 90);
  await page.mouse.down();
  await page.mouse.move(box!.x - 170, box!.y + 90, { steps: 5 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(pane).toHaveAttribute("aria-valuenow", "632");
  expect(await widths(page)).toEqual(after);
  await page.screenshot({ path: info.outputPath("approved-r10-columns.png") });
});
test("long timelines scroll independently, views retain their own widths, and geometry survives reload", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Week", exact: true }).click();
  const rail = page.getByRole("region", { name: "Timeline horizontal scroll" });
  await rail.evaluate((el) => {
    el.scrollLeft = 1600;
  });
  await expect
    .poll(() => rail.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(1500);
  expect(
    await page
      .getByRole("region", { name: "Task columns horizontal scroll" })
      .evaluate((el) => el.scrollLeft),
  ).toBe(0);
  const owner = page.getByRole("separator", { name: "Resize Owner column" });
  await owner.press("Shift+ArrowRight");
  await expect(owner).toHaveAttribute("aria-valuenow", "124");
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(owner).toHaveAttribute("aria-valuenow", "168");
  await owner.press("ArrowRight");
  await page.getByRole("button", { name: "Gantt", exact: true }).click();
  await expect(owner).toHaveAttribute("aria-valuenow", "124");
  await page.reload();
  await expect(owner).toHaveAttribute("aria-valuenow", "124");
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Week", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Fit project", exact: true }).click();
  await expect
    .poll(() => rail.evaluate((el) => el.scrollWidth - el.clientWidth))
    .toBeLessThanOrEqual(1);
});
test("shared shell fits desktops; Task padding and view-toggle widths remain equal", async ({
  page,
}, info) => {
  for (const [width, height] of [
    [1366, 768],
    [1920, 1080],
    [1024, 768],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    const geometry = await page.evaluate(() => {
      const toggle = [
          ...document.querySelectorAll(".schedule-view-toggle button"),
        ].map((el) => el.getBoundingClientRect().width),
        button = document.querySelector("#ppogantt-addTask")!,
        style = getComputedStyle(button),
        header = document.querySelector(".left-head")!.getBoundingClientRect(),
        first = document.querySelector(".task-row")!.getBoundingClientRect();
      return {
        toggle,
        rightPadding: parseFloat(style.paddingRight),
        leftPadding: parseFloat(style.paddingLeft),
        buttonWidth: button.getBoundingClientRect().width,
        headerBottom: header.bottom,
        rowTop: first.top,
        rail: document.querySelector(".ppo-rail")!.getBoundingClientRect()
          .width,
      };
    });
    expect(geometry.toggle[0]).toBeCloseTo(geometry.toggle[1], 3);
    expect(geometry.rightPadding).toBe(15);
    expect(geometry.leftPadding).toBe(15);
    expect(geometry.buttonWidth).toBeGreaterThanOrEqual(86);
    expect(geometry.rail).toBe(96);
    expect(geometry.headerBottom).toBeCloseTo(geometry.rowTop, 2);
    await page.screenshot({
      path: info.outputPath(`project-${width}x${height}.png`),
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "List", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("task dialog retains an uncertain accepted save and retries the original operation once", async ({
  page,
}) => {
  await page.goto(fixture + "?mode=uncertain");
  await page.getByRole("button", { name: "Add task or milestone" }).click();
  const dialog = page.getByRole("dialog"),
    name = dialog.getByLabel("Task name", { exact: true });
  await name.fill("SYN Uncertain acceptance check");
  await dialog.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Retry unchanged save" }),
  ).toBeVisible();
  await expect(name).toBeDisabled();
  await dialog.getByRole("button", { name: "Retry unchanged save" }).click();
  await expect(dialog).toBeHidden();
  await page
    .getByLabel("Search tasks", { exact: true })
    .fill("SYN Uncertain acceptance check");
  await expect(page.locator(".task-row:not(.group)")).toHaveCount(1);
});
test("stale edits require explicit review of the refreshed version before resubmission", async ({
  page,
}) => {
  await page.goto(fixture + "?mode=conflict");
  await page.locator(".task-row:not(.group) button.name").first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Edit task", exact: true }).click();
  await dialog
    .getByLabel("Task name", { exact: true })
    .fill("SYN My retained proposal");
  await dialog.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Save task", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Load latest schedule" }).click();
  await expect(
    dialog.getByText(/SYN Concurrently revised site review/),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Use this version and keep my entries" })
    .click();
  await expect(dialog.getByLabel("Task name", { exact: true })).toHaveValue(
    "SYN My retained proposal",
  );
  await dialog.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(dialog).toBeHidden();
});
