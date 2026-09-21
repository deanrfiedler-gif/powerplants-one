import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const fixture = pathToFileURL(resolve("verification-evidence/crm-ui/index.html")).href;
test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Desktop integration; existing CRM phone tests retain mobile coverage.");
  await page.goto(fixture + "?mode=local");
  await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeVisible();
});
test("approved shell fits laptop, desktop and compact viewports with a centred search-and-quick-add group, and no rail scroll", async ({ page }, info) => {
  for (const [width, height] of [[1366, 768], [1920, 1080], [800, 500], [960, 540]]) {
    await page.setViewportSize({ width, height });
    const geometry = await page.evaluate(() => {
      const rail = document.querySelector<HTMLElement>(".ppo-rail")!;
      const top = document.querySelector(".ppo-shell-header")!.getBoundingClientRect();
      const more = document.querySelector("#desktop-more-toggle")!.getBoundingClientRect();
      const logo = document.querySelector(".ppo-rail .brand-logo")!.getBoundingClientRect();
      const controls = [...document.querySelectorAll(".ppo-header-centre,.ppo-header-utilities,.header-account")].map(element => element.getBoundingClientRect());
      return { railWidth: rail.clientWidth, railFits: rail.scrollHeight <= rail.clientHeight, pageFits: document.documentElement.scrollWidth <= innerWidth,
        headerHeight: top.height, moreBottom: more.bottom, logoCentre: logo.left + logo.width / 2, logoWidth: logo.width, logoY: logo.top + logo.height / 2,
        // Global search and the quick-add button beside it are one group: it is the combined box that is
        // centred on the whole viewport, the navy rail included, not the text field on its own.
        groupCentre: (document.querySelector(".ppo-global-search")!.getBoundingClientRect().left + document.querySelector(".ppo-quick-add")!.getBoundingClientRect().right) / 2,
        plusGap: document.querySelector(".ppo-quick-add")!.getBoundingClientRect().left - document.querySelector(".ppo-global-search")!.getBoundingClientRect().right,
        // The navy disc is the quick-add button's own ::before. It stays inside the 44px button; if that
        // button ever stops being its own containing block the disc resolves against the centred group
        // instead and paints straight across the search field.
        discWidth: parseFloat(getComputedStyle(document.querySelector(".ppo-quick-add")!, "::before").width),
        icons: [...document.querySelectorAll(".ppo-primary-nav .product-icon")].map(element => element.getBoundingClientRect().width),
        controlsFit: controls.every(rect => rect.top >= top.top && rect.bottom <= top.bottom && rect.right <= innerWidth),
        noOverlap: controls.every((rect, index) => index === 0 || controls[index - 1].right <= rect.left), zoom: getComputedStyle(document.documentElement).zoom };
    });
    expect(geometry.railWidth).toBe(76); expect(geometry.headerHeight).toBe(64); expect(geometry.logoCentre).toBe(38);
    expect(geometry.logoWidth).toBe(54); expect(geometry.logoY).toBe(32); expect(Math.abs(geometry.groupCentre - width / 2)).toBeLessThanOrEqual(2); expect(geometry.plusGap).toBeCloseTo(12, 0); expect(geometry.discWidth, "quick-add disc stays inside its button").toBeCloseTo(40, 0);
    expect(geometry.railFits && geometry.pageFits && geometry.controlsFit && geometry.noOverlap).toBe(true);
    expect(geometry.moreBottom).toBeLessThanOrEqual(height); expect(geometry.icons).toEqual([]);
    expect(["1", "normal"]).toContain(geometry.zoom);
    await page.screenshot({ path: info.outputPath(`shell-${width}x${height}.png`) });
    await page.getByRole("button", { name: "More", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "More navigation" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "More navigation" }).getByRole("link", { name: "Sales", exact: true })).toHaveAttribute("aria-current", "page");
    const frames = await page.locator("#desktop-more-panel").evaluate(panel => {
      const body = panel.querySelector<HTMLElement>(".ppo-more-body")!, header = panel.querySelector("header")!, footer = panel.querySelector("footer")!;
      const before = { head: header.getBoundingClientRect().bottom, foot: footer.getBoundingClientRect().top };
      body.scrollTop = body.scrollHeight;
      return { before, after: { head: header.getBoundingClientRect().bottom, foot: footer.getBoundingClientRect().top }, bodyTop: body.getBoundingClientRect().top, bodyBottom: body.getBoundingClientRect().bottom, scrolled: body.scrollTop > 0 };
    });
    expect(frames.after).toEqual(frames.before); expect(frames.bodyTop).toBeCloseTo(frames.before.head); expect(frames.bodyBottom).toBeCloseTo(frames.before.foot); expect(frames.scrolled).toBe(true);
    await page.getByRole("searchbox", { name: "Find a menu item" }).fill("Sales");
    await expect(page.getByRole("navigation", { name: "More navigation" }).getByRole("link")).toHaveCount(2);
    await page.screenshot({ path: info.outputPath(`more-filter-${width}x${height}.png`) });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "More", exact: true })).toBeFocused();
    await expect(page.getByRole("navigation", { name: "More navigation" })).toBeHidden();
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("searchbox", { name: "Find a menu item" }).fill("");
    await page.keyboard.press("Escape");
  }
});
test("global search is independent of page filtering, keyboard selection and quick-add routes", async ({ page }) => {
  const search = page.getByRole("combobox", { name: "Search Powerplants One" });
  await page.keyboard.press("Control+k"); await expect(search).toBeFocused();
  await search.fill("upgrade");
  const options = page.locator("#shell-search-list").getByRole("option"); await expect(options).toHaveCount(2);
  await search.press("ArrowUp"); await expect(options.last()).toHaveAttribute("aria-selected", "true");
  await search.press("ArrowDown"); await expect(options.first()).toHaveAttribute("aria-selected", "true");
  expect(new URL(page.url()).searchParams.get("q")).toBeNull();
  await expect(page.locator(".crm-card:visible")).toHaveCount(8);
  await search.press("Escape"); await expect(search).toBeFocused(); await expect(page.getByRole("listbox")).toBeHidden();
  await page.getByRole("button", { name: "Quick add", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Create a record" }).getByRole("link").first()).toHaveAttribute("href", "/sales/opportunities/new");
  await page.keyboard.press("ArrowUp"); await expect(page.getByRole("link", { name: "Contact", exact: true })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(page.getByRole("button", { name: "Quick add", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Quick Help", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Quick Help" })).toBeVisible();
  await page.locator(".crm-workbar").click({position:{x:2,y:2}}); await expect(page.getByRole("heading", { name: "Quick Help" })).toBeHidden();
  await page.getByRole("button", { name: "Notifications", exact: true }).click();
  await expect(page.getByText("Notifications are not connected", { exact: false })).toBeVisible();
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

test("page guide is contextual and planned preview preserves the working page", async ({ page }) => {
  await page.getByRole("button", { name: "Page guide", exact: true }).click();
  const guide = page.getByRole("dialog", { name: "Page guide", exact: true });
  await expect(guide.getByRole("heading", { name: "Deals", exact: true })).toBeVisible();
  await expect(guide.getByText("The detailed Deals guide is being prepared.", { exact: false })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Page guide", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Change identity", exact: true }).click();
  await page.getByLabel("Preview workspace", { exact: true }).selectOption("supply");
  await expect(page.getByText("This workspace is planned; your current page stays open.", { exact: false })).toBeVisible();
  await expect(page.locator(".crm-card:visible")).toHaveCount(8);
  await page.reload();
  await page.getByRole("button", { name: "Change identity", exact: true }).click();
  await expect(page.getByLabel("Preview workspace", { exact: true })).toHaveValue("supply");
});

test("runtime shell matches the retained r17 reference typography, panel geometry and guide layout", async ({ page, context }, info) => {
  const reference = await context.newPage();
  await page.setViewportSize({ width: 1536, height: 864 });
  await reference.setViewportSize({ width: 1536, height: 864 });
  await page.goto(fixture);
  await reference.goto(pathToFileURL(resolve("docs/reference/ui/application-shell/PPO-Application-Shell-r17.html")).href);
  await page.evaluate(() => document.fonts.ready);
  await reference.evaluate(() => document.fonts.ready);
  const style = async (locator: import("@playwright/test").Locator, properties: string[]) => locator.evaluate((element, props) => {
    const css = getComputedStyle(element);
    return Object.fromEntries(props.map(property => [property, css.getPropertyValue(property)]));
  }, properties);
  const typography = ["font-size", "font-weight", "line-height", "letter-spacing"];
  await expect(page.getByRole("button", { name: "Account", exact: true })).toBeVisible();
  // The product name is no longer repeated in a module breadcrumb, so r17's product typography is compared
  // against what took its place in the header: the breadcrumb keeps the reference's 16px size and line box,
  // while the current page is semibold rather than bold and its parent is quieter still. The retained r17
  // reference file is unchanged; this is a recorded departure of the existing-modules UI refinement.
  const productType = await style(reference.locator(".sh-product"), ["font-size", "line-height"]);
  expect(await style(page.locator(".ppo-crumb-current"), ["font-size", "line-height"])).toEqual(productType);
  expect((await style(page.locator(".ppo-crumb-current"), ["font-weight"]))["font-weight"]).toBe("600");
  expect((await style(page.locator(".ppo-crumbs li").first().locator(".ppo-crumb"), ["font-weight"]))["font-weight"]).toBe("400");
  expect(await style(page.locator(".ppo-global-search input"), ["font-size", "font-weight", "height"])).toEqual(await style(reference.locator("#sh-global-search"), ["font-size", "font-weight", "height"]));
  expect(await style(page.locator(".ppo-global-search"), ["height", "border-radius", "background-color", "padding-left"])).toEqual(await style(reference.locator(".sh-search-anchor .sh-search-field"), ["height", "border-radius", "background-color", "padding-left"]));
  const cases = [
    ["search", ""], ["quick", "Quick add"], ["help", "Quick Help"], ["notifications", "Notifications"], ["guide", "Page guide"], ["account", "Account"], ["more", "More"],
  ] as const;
  for (const [kind, name] of cases) {
    if (kind === "search") {
      await page.getByRole("combobox", { name: "Search Powerplants One" }).focus();
      await reference.locator("#sh-global-search").focus();
      await expect(page.locator("#shell-search-list").getByRole("option")).toHaveCount(4);
    } else {
      await page.getByRole("button", { name, exact: true }).click();
      await reference.locator(`[data-panel="${kind}"]:visible`).first().click();
    }
    const actualPanel = page.locator(kind === "more" ? "#desktop-more-panel" : kind === "account" ? "#hosted-account-controls" : kind === "search" ? "#shell-search-panel" : "#shell-utility-panel");
    const referencePanel = reference.locator("#sh-panel");
    await expect(actualPanel).toBeVisible();
    await expect(referencePanel).toBeVisible();
    await referencePanel.evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
    const a = (await actualPanel.boundingBox())!, b = (await referencePanel.boundingBox())!;
    expect(a.width, kind + " width").toBeCloseTo(b.width, 0);
    // Global search and quick add now sit in one centred group, so both of their panels open 28px left of
    // where the retained r17 reference anchors them: half of the 44px button and its 12px gap. Their own
    // contract is asserted instead — the search panel flush with its field, the quick panel flush with the
    // right edge of its button — and the other five panels keep r17's absolute anchor exactly.
    if (kind === "search" || kind === "quick") {
      const trigger = (await page.locator(kind === "search" ? ".ppo-global-search" : ".ppo-quick-add").boundingBox())!;
      if (kind === "search") expect(a.x, "search panel follows its field").toBeCloseTo(trigger.x, 0);
      else expect(a.x + a.width, "quick panel follows its button").toBeCloseTo(trigger.x + trigger.width, 0);
      expect(b.x - a.x, kind + " offset from r17 anchor").toBeCloseTo(28, 0);
    } else expect(a.x, kind + " horizontal anchor").toBeCloseTo(b.x, 0);
    if (kind !== "more") expect(a.y, kind + " vertical anchor").toBeCloseTo(b.y, 0);
    expect(await style(actualPanel, ["border-radius", "box-shadow", "border-color"])).toEqual(await style(referencePanel, ["border-radius", "box-shadow", "border-color"]));
    expect(await style(actualPanel.locator("h2"), ["font-size", "font-weight", "line-height"])).toEqual(await style(referencePanel.locator("h2"), ["font-size", "font-weight", "line-height"]));
    if (["quick", "help", "notifications", "guide"].includes(kind)) {
      const referenceTrigger = reference.locator(`[data-panel="${kind}"]:visible`).first();
      await referenceTrigger.evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
      expect(await style(page.getByRole("button", { name, exact: true }), ["background-color", "color"])).toEqual(await style(referenceTrigger, ["background-color", "color"]));
    }
    if (kind === "help") {
      const actualHelp = actualPanel.getByRole("button", { name: "Open page guide" });
      const referenceHelp = referencePanel.getByRole("button", { name: "Open page guide" });
      await actualHelp.hover(); await referenceHelp.hover();
      expect(await style(actualHelp, ["background-color", "color"])).toEqual(await style(referenceHelp, ["background-color", "color"]));
    }
    if (kind === "account") {
      const actualReset = actualPanel.getByRole("button", { name: "Reset preview preference" });
      const referenceReset = referencePanel.getByRole("button", { name: "Reset preview preference" });
      await actualReset.hover(); await referenceReset.hover();
      expect(await style(actualReset, ["background-color", "color"])).toEqual(await style(referenceReset, ["background-color", "color"]));
    }
    if (kind === "guide") {
      await actualPanel.getByRole("button", { name: "Read the application shell guide" }).click();
      expect(await style(actualPanel.locator(".ppo-guide-intro h3"), typography)).toEqual(await style(referencePanel.locator(".sh-guide-intro h3"), typography));
      await expect(actualPanel.getByRole("button", { name: "Journey map", exact: true })).toBeVisible();
      const actualJourney = actualPanel.getByRole("button", { name: "Journey map", exact: true });
      const referenceJourney = referencePanel.getByRole("button", { name: "Journey map", exact: true });
      await actualJourney.hover(); await referenceJourney.hover();
      expect(await style(actualJourney, ["background-color", "color"])).toEqual(await style(referenceJourney, ["background-color", "color"]));
      await actualJourney.click();
      await expect(actualPanel.getByRole("heading", { name: "Your journey", exact: true })).toBeFocused();
      await actualPanel.locator(".ppo-panel-body").evaluate(element => { element.scrollTop = 0; });
    }
    if (kind === "more") {
      await expect(actualPanel.locator(".ppo-menu-group").first().locator(".ppo-more-link")).toHaveCount(7);
      await expect(actualPanel.locator("footer")).toContainText("20 destinations");
    }
    await page.screenshot({ path: info.outputPath(`r17-runtime-${kind}.png`) });
    await reference.screenshot({ path: info.outputPath(`r17-reference-${kind}.png`) });
    await page.keyboard.press("Escape");
    await reference.keyboard.press("Escape");
  }
  await reference.close();
});
