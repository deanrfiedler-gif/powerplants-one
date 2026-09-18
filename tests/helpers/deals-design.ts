import { expect, type Page } from "@playwright/test";

// Independent acceptance constraints: r38 interior plus the user's in-shell
// composition. These deliberately reject the first deployment's extra frame.
export async function assertDealsHost(page: Page) {
  await expect(page.locator("#ppo-deals")).toHaveAttribute(
    "data-module-layout",
    "full-bleed",
  );
  await expect(page.locator(".ppo-sales-navigation")).toHaveCount(0);
  const facts = await page.evaluate(() => {
    const root = document.querySelector("#ppo-deals")!,
      style = getComputedStyle(root);
    const box = root.getBoundingClientRect(),
      shell = document
        .querySelector(".ppo-shell-header")!
        .getBoundingClientRect();
    const toolbar = root
        .querySelector(".crm-toolbar-r38")!
        .getBoundingClientRect(),
      workbar = root.querySelector(".crm-workbar")!.getBoundingClientRect();
    return {
      margin: style.margin,
      border: style.borderWidth,
      radius: style.borderRadius,
      top: box.top,
      headerBottom: shell.bottom,
      toolbar: toolbar.height,
      workbar: workbar.height,
      fits:
        document.documentElement.scrollWidth <= innerWidth &&
        box.bottom <= innerHeight,
      boardScroll: getComputedStyle(root.querySelector(".crm-board-scroll")!)
        .overflowY,
      nestedScroll: [...root.querySelectorAll(".crm-stage,.crm-worklist")].some(
        (n) => ["auto", "scroll"].includes(getComputedStyle(n).overflowY),
      ),
    };
  });
  expect(facts).toMatchObject({
    margin: "0px",
    border: "0px",
    radius: "0px",
    fits: true,
    boardScroll: "auto",
    nestedScroll: false,
  });
  expect(facts.top).toBeCloseTo(facts.headerBottom, 0);
  if ((page.viewportSize()?.width ?? 0) >= 1280) {
    expect(facts.toolbar).toBe(58);
    expect(facts.workbar).toBe(44);
  }
}
export async function assertChoiceGeometry(page: Page) {
  const facts = await page
    .locator(".crm-r38-popover:popover-open")
    .evaluate((n) => {
      const s = getComputedStyle(n),
        r = n.getBoundingClientRect();
      return {
        radius: s.borderRadius,
        padding: s.padding,
        background: s.backgroundColor,
        border: s.borderColor,
        fits:
          r.left >= 0 &&
          r.right <= innerWidth &&
          r.top >= 0 &&
          r.bottom <= innerHeight,
      };
    });
  expect(facts).toEqual({
    radius: "14px",
    padding: "7px",
    background: "rgb(255, 255, 255)",
    border: "rgb(220, 224, 229)",
    fits: true,
  });
}
