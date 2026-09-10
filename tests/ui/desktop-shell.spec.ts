import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const fixture = pathToFileURL(resolve("verification-evidence/crm-ui/index.html")).href;
test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Desktop integration; existing CRM phone tests retain mobile coverage.");
  await page.goto(fixture + "?mode=local");
  await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeVisible();
});
test("approved shell fits laptop, desktop and compact viewports with persistent labels and no rail scroll", async ({ page }, info) => {
  for (const [width, height] of [[1366, 768], [1920, 1080], [800, 500], [960, 540]]) {
    await page.setViewportSize({ width, height });
    const geometry = await page.evaluate(() => {
      const rail = document.querySelector<HTMLElement>(".ppo-rail")!;
      const top = document.querySelector(".ppo-shell-header")!.getBoundingClientRect();
      const more = document.querySelector("#desktop-more-toggle")!.getBoundingClientRect();
      const logo = document.querySelector(".ppo-rail .brand-logo")!.getBoundingClientRect();
      const controls = [...document.querySelectorAll(".ppo-header-centre,.ppo-header-utilities,.header-account")].map(element => element.getBoundingClientRect());
      return { railWidth: rail.clientWidth, railFits: rail.scrollHeight <= rail.clientHeight, pageFits: document.documentElement.scrollWidth <= innerWidth,
        headerHeight: top.height, moreBottom: more.bottom, logoCentre: logo.left + logo.width / 2,
        icons: [...document.querySelectorAll(".ppo-primary-nav .product-icon")].map(element => element.getBoundingClientRect().width),
        controlsFit: controls.every(rect => rect.top >= top.top && rect.bottom <= top.bottom && rect.right <= innerWidth),
        noOverlap: controls.every((rect, index) => index === 0 || controls[index - 1].right <= rect.left), zoom: getComputedStyle(document.documentElement).zoom };
    });
    expect(geometry.railWidth).toBe(96); expect(geometry.headerHeight).toBe(64); expect(geometry.logoCentre).toBe(48);
    expect(geometry.railFits && geometry.pageFits && geometry.controlsFit && geometry.noOverlap).toBe(true);
    expect(geometry.moreBottom).toBeLessThanOrEqual(height); expect(geometry.icons).toEqual(Array(7).fill(30));
    expect(["1", "normal"]).toContain(geometry.zoom);
    await page.screenshot({ path: info.outputPath(`shell-${width}x${height}.png`) });
    await page.getByRole("button", { name: "More", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "More navigation" })).toBeVisible();
    for (const label of ["Sales / CRM", "Estimating & Quotation", "Engineering — planned", "Projects", "Service", "Supply Chain — planned", "Finance"]) {
      const target = page.getByRole("navigation", { name: "Main navigation", exact: true }).getByLabel(label, { exact: true });
      await target.hover();
      await expect(page.getByRole("tooltip")).toHaveText(label);
      await expect(page.getByRole("navigation", { name: "More navigation" })).toBeVisible();
    }
    await page.getByRole("tooltip").hover(); await expect(page.getByRole("tooltip")).toBeVisible();
    await page.screenshot({ path: info.outputPath(`more-hover-${width}x${height}.png`) });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "More", exact: true })).toBeFocused();
    await expect(page.getByRole("tooltip")).toBeHidden();
  }
});
test("global search is independent of page filtering, keyboard selection and quick-add routes", async ({ page }) => {
  const search = page.getByRole("combobox", { name: "Search Powerplants One" });
  await page.keyboard.press("Control+k"); await expect(search).toBeFocused();
  await search.fill("upgrade");
  const options = page.locator("#shell-search-list").getByRole("option"); await expect(options).toHaveCount(2);
  await search.press("ArrowUp"); await expect(options.last()).toHaveAttribute("aria-selected", "true");
  await search.press("ArrowDown"); await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Search opportunities", { exact: true })).toHaveValue("");
  await expect(page.locator(".crm-card:visible")).toHaveCount(8);
  await search.press("Escape"); await expect(search).toBeFocused(); await expect(page.getByRole("listbox")).toBeHidden();
  await page.getByRole("button", { name: "Quick add", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Create a record" }).getByRole("link").first()).toHaveAttribute("href", "/crm/opportunities/new");
  await page.keyboard.press("ArrowUp"); await expect(page.getByRole("link", { name: "Contact", exact: true })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(page.getByRole("button", { name: "Quick add", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Quick Help", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Quick Help" })).toBeVisible();
  await page.locator(".crm-worklist-stamp").click(); await expect(page.getByRole("heading", { name: "Quick Help" })).toBeHidden();
  await page.getByRole("button", { name: "Notifications", exact: true }).click();
  await expect(page.getByText("Notifications are not connected yet.", { exact: false })).toBeVisible();
});
test("identity lock clears results and rejects a late response even if transport ignores abort", async ({ page }) => {
  const search = page.getByRole("combobox", { name: "Search Powerplants One" });
  await search.fill("upgrade"); await expect(page.locator("#shell-search-list").getByRole("option")).toHaveCount(2);
  await page.evaluate(() => {
    const original = window.fetch;
    window.fetch = (input, init) => String(input).includes("/shell/search") ? new Promise(resolve => {
      (window as unknown as { resolveShellSearch: () => void }).resolveShellSearch = () => resolve(new Response(JSON.stringify({ items: [{ id: "late", label: "SYN Late private result", kind: "Customer", reference: "", href: "/customers/late" }], has_more: false, limit_per_type: 5 })));
    }) : original(input, init);
  });
  await search.fill("delayed");
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { resolveShellSearch?: unknown }).resolveShellSearch)).toBe("function");
  await page.getByRole("button", { name: "Change identity", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(search).toHaveValue("");
  await page.evaluate(() => (window as unknown as { resolveShellSearch: () => void }).resolveShellSearch());
  await search.focus();
  await expect(page.getByText("SYN Late private result", { exact: true })).toHaveCount(0);
  await expect(page.locator("#shell-search-list").getByRole("option")).toHaveCount(0);
});
