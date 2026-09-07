import { expect, type Locator, type Page } from "@playwright/test";

// Exercise native sequential focus and input. No DOM focus(), click(), fill()
// or selectOption() substitutes for the keyboard steps recorded by this helper.
export async function keyFocus(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  await expect(target).toBeEnabled();
  for (let step = 0; step < 200; step++) {
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      await expect(target).toBeFocused();
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw Error(
    "The requested labelled control was not reachable in 200 sequential Tab steps.",
  );
}
export async function keyType(page: Page, target: Locator, text: string) {
  await keyFocus(page, target);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type(text);
  await expect(target).toHaveValue(text);
}
export async function keySelect(page: Page, target: Locator, value: string) {
  await expect(target.locator(`option[value="${value}"]`)).toHaveCount(1);
  await keyFocus(page, target);
  const index = await target.evaluate(
    (element, selected) =>
      [...(element as HTMLSelectElement).options].findIndex(
        (option) => option.value === selected,
      ),
    value,
  );
  expect(index).toBeGreaterThanOrEqual(0);
  await page.keyboard.press("Home");
  for (let n = 0; n < index; n++) await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(target).toHaveValue(value);
}
export async function keyActivate(page: Page, target: Locator) {
  await keyFocus(page, target);
  await page.keyboard.press("Enter");
}
export async function keyAdvanceDays(
  page: Page,
  target: Locator,
  days: number,
) {
  await keyFocus(page, target);
  const before = await target.inputValue();
  const desired = new Date(Date.parse(before + "Z") + days * 86400000)
    .toISOString()
    .slice(0, 16);
  const oneDay = new Date(Date.parse(before + "Z") + 86400000)
    .toISOString()
    .slice(0, 16);
  // Native datetime controls expose separate locale-dependent segments. Find
  // the day segment using reversible arrow input and inspect the actual value.
  for (let segment = 0; segment < 14; segment++) {
    await page.keyboard.press("ArrowUp");
    if ((await target.inputValue()) === oneDay) {
      for (let n = 1; n < days; n++) await page.keyboard.press("ArrowUp");
      await page.keyboard.press("Tab");
      await expect(target).toHaveValue(desired);
      return;
    }
    await page.keyboard.press("ArrowDown");
    await expect(target).toHaveValue(before);
    await page.keyboard.press("ArrowRight");
  }
  throw Error(
    "The native date control did not expose its day segment to the tested keyboard sequence.",
  );
}
