import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
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
    const utility = document
      .querySelector(".ppo-header-utilities")!
      .getBoundingClientRect();
    return {
      layout: node.getAttribute("data-module-layout"),
      overflow: style.overflowY,
      padding: style.padding,
      pageFits: document.documentElement.scrollWidth <= innerWidth,
      moduleFits: node.scrollWidth <= node.clientWidth,
      utilityInHeader:
        utility.top >= header.top && utility.bottom <= header.bottom,
    };
  });
  expect(facts).toMatchObject({
    layout: "full-bleed",
    overflow: "auto",
    pageFits: true,
    moduleFits: true,
    utilityInHeader: true,
  });
  expect(facts.padding).toBe(
    (page.viewportSize()?.width ?? 1440) <= 760 ? "16px" : "24px",
  );
}
