import { expect, type Page } from "@playwright/test";

// Phone header amendment (PPO-SHELL-PHONE-HEADER-AMENDMENT-DEC, rule P4): at phone widths (780 px and below) the
// header row keeps the menu button, the view chooser and a few icons. Global search, the account and working
// company, notifications, the page guide and Design & build are inside the menu that the button opens. These
// helpers do that one extra step on a phone and are the plain direct control everywhere else.
export const phoneWidth = (page: Page) => (page.viewportSize()?.width ?? 1280) <= 780;

export async function openPhoneMenu(page: Page) {
  const button = page.getByRole("button", { name: /^Menu(,|$)/ });
  await button.click();
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

export async function openGlobalSearch(page: Page) {
  if (phoneWidth(page)) {
    const menu = await openPhoneMenu(page);
    await menu.getByRole("button", { name: "Search Powerplants One" }).click();
  } else await page.getByRole("combobox", { name: "Search Powerplants One" }).click();
}

export async function openPageGuide(page: Page) {
  if (phoneWidth(page)) {
    const menu = await openPhoneMenu(page);
    await menu.getByRole("button", { name: "Page guide", exact: true }).click();
  } else await page.getByRole("button", { name: "Page guide", exact: true }).click();
}
