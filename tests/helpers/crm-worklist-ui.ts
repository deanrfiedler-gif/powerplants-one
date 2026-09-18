import { expect, type Page } from "@playwright/test";
import { keyActivate, keyType } from "./quality-keyboard";

// r38's filter form is a modal drawer. Close it with its own control before
// exercising the worklist; the background correctly remains inert.
export async function toggleWorklistFilters(page: Page) {
  const close = page.getByRole("button", {
    name: "Close Filter opportunities",
    exact: true,
  });
  if (await close.isVisible()) await close.click();
  else
    await page
      .getByRole("button", { name: "Filters and sort", exact: true })
      .click();
}

const filterDrawer = (page: Page) =>
  page.getByRole("dialog", { name: "Filter opportunities", exact: true });

// Desktop search belongs inside Filters; compact search stays in the shell.
//
// Ask the page the same question useDesktopCRM() asks rather than probing for
// the field itself. The compact layout portals search into the shell header
// only once the client has hydrated, so a single isVisible() probe straight
// after goto() can report "missing", open the modal drawer over the real
// field, and leave it inert: fill() then silently misses it and sequential
// focus can never reach it at all.
export async function searchNeedsDrawer(page: Page) {
  const desktop = await page.evaluate(
    () => matchMedia("(min-width: 781px)").matches,
  );
  return desktop && !(await filterDrawer(page).isVisible());
}

export async function fillOpportunitySearch(page: Page, value: string) {
  const search = page.getByLabel("Search opportunities", { exact: true });
  const opened = await searchNeedsDrawer(page);
  if (opened) await toggleWorklistFilters(page);
  await expect(search).toBeVisible();
  await search.fill(value);
  if (opened) {
    // A denied response removes the drawer immediately. Leave the search
    // input first (it consumes Escape), then dismiss any remaining drawer.
    // This also works after denial, unlike clicking a disappearing button.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(filterDrawer(page)).toBeHidden();
  }
}

// Keyboard-only sibling for the native sequential-focus proofs: same layout
// decision, but every step is a real key press with no fill() substitute.
export async function keyOpportunitySearch(page: Page, value: string) {
  const opened = await searchNeedsDrawer(page);
  if (opened)
    await keyActivate(
      page,
      page.getByRole("button", { name: "Filters and sort", exact: true }),
    );
  await keyType(
    page,
    page.getByLabel("Search opportunities", { exact: true }),
    value,
  );
  if (opened)
    await keyActivate(
      page,
      page.getByRole("button", {
        name: "Close Filter opportunities",
        exact: true,
      }),
    );
}
export async function chooseWorklistSort(page: Page, value: string) {
  const form = page.getByRole("dialog", {
    name: "Filter opportunities",
    exact: true,
  });
  if (await form.isVisible())
    await form.getByLabel("Sort", { exact: true }).selectOption(value);
  else {
    await page.getByRole("button", { name: "Sort", exact: true }).click();
    await page
      .getByRole("menuitemradio", {
        name: (
          {
            Reference: "Default order",
            Title: "Title A–Z",
            Newest: "Newest first",
          } as Record<string, string>
        )[value],
        exact: true,
      })
      .click();
  }
}
