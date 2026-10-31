import { test, expect } from "@playwright/test";
import {
  mountWorkloadPresentation,
  workloadCaptureStyle,
} from "../helpers/estimating-workload-presentation";
import { openSecondaryMenu } from "../helpers/phone-menu";
test.describe.configure({ timeout: 120000 });
for (const width of [1440, 1024, 390, 320])
  test(`ES01 accepted presentation and accessible view/filter controls at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({
      width,
      height: width === 1440 ? 900 : width === 1024 ? 768 : 844,
    });
    const fixture = await mountWorkloadPresentation(page);
    const rows = page.locator(width < 781 ? ".ew-phone-open" : ".ew-row-title");
    await expect(rows).toHaveCount(7);
    await expect(rows.first()).toBeEnabled();
    await expect(page.locator("#ppo-estimating-workload")).toHaveAttribute(
      "data-ppo-workspace",
      "shared",
    );
    await expect(page.locator(".module-navigation")).toHaveCount(0);
    if (width === 1440) {
      expect(
        (await page.locator("#estimating-views").boundingBox())?.width,
      ).toBe(240);
      await expect(page.locator("#estimating-views ul").first()).toHaveCSS(
        "list-style-type",
        "none",
      );
      expect(
        (
          await page
            .getByRole("link", { name: /^My estimating work/ })
            .boundingBox()
        )?.height,
      ).toBe(40);
      expect((await page.locator(".ew-toolbar").boundingBox())?.height).toBe(
        60,
      );
      expect((await page.locator(".ew-results").boundingBox())?.x).toBe(480);
      expect(
        (await page.locator(".ew-desktop-grid tbody tr").first().boundingBox())
          ?.height,
      ).toBe(40);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1024) {
      const register = page.getByRole("region", {
        name: "Estimating workload register",
        exact: true,
      });
      await register.focus();
      await register.press("ArrowRight");
      await expect
        .poll(() => register.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(0);
      await register.evaluate((element) => {
        element.scrollLeft = 0;
        (element as HTMLElement).blur();
      });
    }
    await page.screenshot({
      path: info.outputPath("workload.png"),
      style: workloadCaptureStyle,
      fullPage: true,
    });
    if (width < 781) {
      await openSecondaryMenu(page);
      await page
        .getByRole("dialog", { name: "Intake & workload menu" })
        .getByRole("link", { name: /^My estimating work/ })
        .press("Enter");
      await expect(page).toHaveURL(/owner=mine/);
      await expect(rows).toHaveCount(5);
      await page.getByRole("button", { name: /^Filter/ }).press("Enter");
      const filters = page.getByRole("dialog", {
        name: "Workload filters",
        exact: true,
      });
      await filters
        .getByRole("combobox", { name: "Estimating owner", exact: true })
        .selectOption("all");
      await filters
        .getByRole("button", { name: "Apply filters", exact: true })
        .click();
      await expect(rows).toHaveCount(7);
    }
    const before = await page.locator(".ew-results").boundingBox();
    await rows.nth(1).press("Enter");
    const snapshot = page.getByRole("dialog", {
      name: fixture.items[1].opportunity.title,
      exact: true,
    });
    await expect(snapshot).toBeVisible();
    await expect(snapshot).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const after = await page.locator(".ew-results").boundingBox();
    expect(after?.width).toBe(before?.width);
    expect((await snapshot.boundingBox())?.width).toBe(
      width === 1440 ? 960 : width === 1024 ? 944 : width,
    );
    await expect(
      snapshot.getByRole("link", { name: "Open discovery", exact: true }),
    ).toHaveAttribute("href", /\?option=/);
    await page.screenshot({
      path: info.outputPath("snapshot.png"),
      style: workloadCaptureStyle,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(snapshot).toHaveCount(0);
    await expect(rows.nth(1)).toBeFocused();
    if (width === 1440) {
      await page
        .getByRole("button", {
          name: "Collapse Intake & workload menu",
          exact: true,
        })
        .click();
      await rows.nth(1).click();
      await expect(snapshot).toBeVisible();
      expect((await snapshot.boundingBox())?.width).toBe(960);
      await page.screenshot({
        path: info.outputPath("collapsed-snapshot.png"),
        style: workloadCaptureStyle,
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", {
          name: "Expand Intake & workload menu",
          exact: true,
        })
        .click();
      await page
        .getByRole("checkbox", {
          name: "Select all visible opportunities",
          exact: true,
        })
        .check();
      await expect(
        page.getByRole("complementary", { name: "Selected opportunities" }),
      ).toBeVisible();
      await page.screenshot({
        path: info.outputPath("selection.png"),
        style: workloadCaptureStyle,
        fullPage: true,
      });
    }
    await page.goto("/estimating?tab=estimates");
    await expect(
      page
        .getByRole("link", { name: fixture.saved.items[0].title, exact: true })
        .filter({ visible: true }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath("saved-estimates.png"),
      style: workloadCaptureStyle,
      fullPage: true,
    });
  });
