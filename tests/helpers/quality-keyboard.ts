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
  if (!Number.isSafeInteger(days))
    throw Error("Date movement requires whole days.");
  await keyFocus(page, target);
  const before = await target.inputValue();
  const date = new Date(before + "Z");
  date.setUTCDate(date.getUTCDate() + days);
  const desired = date.toISOString().slice(0, 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(desired))
    throw Error("Date movement exceeds the supported four-digit year range.");

  // Native day arrows wrap within the selected month; they do not add calendar
  // days. Locate segments by their observable values, not locale-specific order.
  async function findSegment(
    start: number,
    end: number,
    next: number,
    direction = "ArrowUp",
  ) {
    const value = await target.inputValue();
    const probe =
      value.slice(0, start) +
      String(next).padStart(end - start, "0") +
      value.slice(end);
    for (let n = 0; n < 14; n++) await page.keyboard.press("ArrowLeft");
    for (let n = 0; n < 14; n++) {
      await page.keyboard.press(direction);
      const found = (await target.inputValue()) === probe;
      await page.keyboard.press(
        direction === "ArrowUp" ? "ArrowDown" : "ArrowUp",
      );
      await expect(
        target,
        "Native segment probing must restore the original value",
      ).toHaveValue(value);
      if (found) return;
      await page.keyboard.press("ArrowRight");
    }
    throw Error(
      "The native date control did not expose the requested segment to keyboard input.",
    );
  }
  async function changeBy(amount: number) {
    for (let n = 0; n < Math.abs(amount); n++)
      await page.keyboard.press(amount > 0 ? "ArrowUp" : "ArrowDown");
  }
  if (days !== 0) {
    const year = Number(before.slice(0, 4));
    const month = Number(before.slice(5, 7));
    const day = Number(before.slice(8, 10));
    await findSegment(
      8,
      10,
      day > 1 ? day - 1 : 2,
      day > 1 ? "ArrowDown" : "ArrowUp",
    );
    // Day 1 is valid in every month/year, including a leap-year transition.
    // This prevents temporary impossible dates while changing other segments.
    await changeBy(1 - day);
    if (Number(desired.slice(0, 4)) !== year) {
      await findSegment(0, 4, year + 1);
      await changeBy(Number(desired.slice(0, 4)) - year);
    }
    if (Number(desired.slice(5, 7)) !== month) {
      await findSegment(5, 7, month === 12 ? 1 : month + 1);
      await changeBy(Number(desired.slice(5, 7)) - month);
    }
    await findSegment(8, 10, 2);
    await changeBy(Number(desired.slice(8, 10)) - 1);
  }
  // Commit the native edit by leaving every internal segment with Tab.
  for (let n = 0; n < 14; n++) {
    await page.keyboard.press("Tab");
    if (
      !(await target.evaluate((element) => element === document.activeElement))
    )
      break;
  }
  await expect(target).not.toBeFocused();
  await expect(target).toHaveValue(desired);
}
