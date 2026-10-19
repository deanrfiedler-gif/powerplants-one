import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { openSecondaryMenu } from "./phone-menu";
export const jobPackDesign =
  "docs/reference/ui/job-pack/powerplants-one-job-pack-r03.html";
export const jobPackViewports = [
  { width: 1440, height: 960 },
  { width: 1024, height: 768 },
  { width: 820, height: 800 },
  { width: 770, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 800 },
];
const source = readFileSync(jobPackDesign, "utf8");
export const jobPackTokenNames = [
  ...new Set(
    source
      .slice(
        source.indexOf("#ppo-job-pack{"),
        source.indexOf("box-sizing:border-box;padding:24px"),
      )
      .match(/--[a-z0-9-]+(?=:)/g),
  ),
];
export const jobPackTokens = (page: Page) =>
  page
    .locator("#ppo-job-pack")
    .evaluate(
      (node, names) =>
        Object.fromEntries(
          names.map((n) => [
            n,
            getComputedStyle(node).getPropertyValue(n).trim(),
          ]),
        ),
      jobPackTokenNames,
    );
export async function assertJobPackHost(page: Page) {
  const facts = await page.evaluate(() => {
    const node = document.querySelector("#ppo-job-pack")!,
      style = getComputedStyle(node);
    const header = document
      .querySelector(".ppo-shell-header")!
      .getBoundingClientRect();
    // A phone row (780 px and below) flattens the utilities group into the header (display: contents), so its own
    // box is empty: check the visible controls it holds and the Menu button instead (phone header amendment P1).
    const group = document.querySelector(".ppo-header-utilities")!;
    const utilityBoxes =
      getComputedStyle(group).display === "contents"
        ? [...group.querySelectorAll("a, button"), document.querySelector("#shell-phone-menu")!]
            .filter((control) => control.getClientRects().length > 0)
            .map((control) => control.getBoundingClientRect())
        : [group.getBoundingClientRect()];
    return {
      layout: node.getAttribute("data-module-layout"),
      overflow: style.overflowY,
      padding: style.padding,
      pageFits: document.documentElement.scrollWidth <= innerWidth,
      moduleFits: node.scrollWidth <= node.clientWidth,
      utilityInHeader:
        utilityBoxes.length > 0 &&
        utilityBoxes.every(
          (box) => box.top >= header.top && box.bottom <= header.bottom,
        ),
    };
  });
  expect(facts).toMatchObject({
    layout: "full-bleed",
    overflow: "hidden",
    pageFits: true,
    moduleFits: true,
    utilityInHeader: true,
  });
  expect(facts.padding).toBe("0px");
}

// The same views live in the docked menu on desktop and its dialog on narrow screens.
export async function openPackView(page: Page, name: string | RegExp) {
  const tab = page.getByRole("tab", { name, exact: typeof name === "string" });
  if (!(await tab.isVisible())) await openSecondaryMenu(page);
  await tab.click();
}
export async function showPackReadiness(page: Page) {
  const tab = page.getByRole("tab", { name: "Readiness", exact: true });
  if (await tab.isVisible()) await tab.click();
}
