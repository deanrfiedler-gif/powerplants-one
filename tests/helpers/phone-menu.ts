import { expect, type Locator, type Page } from "@playwright/test";

// Phone header amendment (PPO-SHELL-PHONE-HEADER-AMENDMENT-DEC, rule P4): at phone widths (780 px and below) the
// header row keeps the menu button, the view chooser and a few icons. Global search, the account and working
// company, notifications, the page guide and Design & build are inside the menu that the button opens. These
// helpers do that one extra step on a phone and are the plain direct control everywhere else.
export const phoneWidth = (page: Page) => (page.viewportSize()?.width ?? 1280) <= 780;

// `keyboard` activates each control with Enter instead of a click, for the keyboard journeys.
const activate = (target: Locator, keyboard: boolean) => (keyboard ? target.press("Enter") : target.click());

// The control that opens the phone menu on this page and takes focus back when a panel from it closes: the header's
// Menu button, or the tab bar's More on a record page, whose compact row has Back in its place (phone header
// amendment P3). Both open the same "More" dialog.
export const phoneMenuOpener = (page: Page) => page.locator("#shell-phone-menu, body:not(:has(#shell-phone-menu)) #navigation-toggle");

export async function openPhoneMenu(page: Page, keyboard = false) {
  await activate(phoneMenuOpener(page), keyboard);
  const menu = page.getByRole("dialog", { name: "More" });
  await expect(menu).toBeVisible();
  return menu;
}

// Opens the Account panel (local identity: "Change identity"; hosted: "Account").
export async function openAccountPanel(page: Page, desktopName: string | RegExp = "Change identity") {
  if (phoneWidth(page)) {
    const menu = await openPhoneMenu(page);
    await menu.getByRole("button", { name: "Account", exact: true }).click();
  } else await page.getByRole("button", { name: desktopName, ...(typeof desktopName === "string" ? { exact: true } : {}) }).click();
}

// The local identity trigger ("Change identity") stays mounted for its panel but is visibility:hidden in the phone row,
// and role queries skip hidden elements. State checks that only need it to exist and be enabled use this locator,
// which includes hidden elements at phone widths and is the plain role query everywhere else.
export const identityToggle = (page: Page) =>
  page.getByRole("button", { name: "Change identity", exact: true, includeHidden: phoneWidth(page) });

export async function openGlobalSearch(page: Page) {
  if (phoneWidth(page)) {
    const menu = await openPhoneMenu(page);
    await menu.getByRole("button", { name: "Search Powerplants One" }).click();
  } else await page.getByRole("combobox", { name: "Search Powerplants One" }).click();
}

export async function openPageGuide(page: Page, keyboard = false) {
  if (phoneWidth(page)) {
    const menu = await openPhoneMenu(page, keyboard);
    await activate(menu.getByRole("button", { name: "Page guide", exact: true }), keyboard);
  } else await activate(page.getByRole("button", { name: "Page guide", exact: true }), keyboard);
}

// Opens a page's secondary menu. On a phone the header's view chooser ("Choose view. Current view: ...") opens the
// sheet that the page's "<Name> menu" header toggle used to, and that toggle is hidden (phone header amendment P2);
// wider screens keep the page's own toggle.
export async function openSecondaryMenu(page: Page, desktopToggle: Locator = page.locator(".ppo-menu-toggle")) {
  await (phoneWidth(page) ? page.getByRole("button", { name: /^Choose view\./ }) : desktopToggle).click();
}
