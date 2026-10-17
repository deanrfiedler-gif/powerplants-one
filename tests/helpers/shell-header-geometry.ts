import { expect, type Page } from "@playwright/test";

// Shell top bar amendment R9: the search sits alone in the header grid's centre column, between equal
// side zones, so its centre is the top bar's centre. Retained source comparisons still own typography,
// tokens and page geometry.
export async function readShellHeaderGeometry(page: Page) {
  return page.evaluate(() => {
    const box = (selector: string) =>
      document.querySelector(selector)!.getBoundingClientRect();
    const header = box(".ppo-shell-header");
    const controls = [
      ".product-heading", ".ppo-header-centre", ".ppo-header-utilities", ".header-account",
    ].map(box);
    const search = box(".ppo-global-search");
    const add = box(".ppo-quick-add");
    return {
      headerHeight: header.height,
      controlsFit: controls.every(rect => rect.width > 0 && rect.height > 0 &&
        rect.left >= header.left - 1 && rect.right <= header.right + 1 &&
        rect.top >= header.top - 1 && rect.bottom <= header.bottom + 1),
      noOverlap: controls.every((rect, index) => index === 0 ||
        controls[index - 1].right <= rect.left + 1),
      pageFits: document.documentElement.scrollWidth <= innerWidth,
      quickAddGap: add.left - search.right,
      searchWidth: search.width,
      searchCentreOffset: search.left + search.width / 2 - (header.left + header.width / 2),
    };
  });
}

export async function expectFlowingShellHeader(page: Page) {
  const geometry = await readShellHeaderGeometry(page);
  expect(geometry.headerHeight).toBe(64);
  expect(geometry.controlsFit && geometry.noOverlap && geometry.pageFits).toBe(true);
  expect(geometry.searchWidth).toBeGreaterThan(0);
  expect(geometry.quickAddGap).toBeCloseTo(12, 0);
  // Equal side zones hold wherever the end zone's controls fit half the bar: 1280 px and wider.
  if (geometry.pageFits && (page.viewportSize()?.width ?? 0) >= 1280)
    expect(Math.abs(geometry.searchCentreOffset), "search centred in the top bar (R9)").toBeLessThanOrEqual(1);
  return geometry;
}
