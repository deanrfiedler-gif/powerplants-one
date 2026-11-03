import { expect, type Page } from "@playwright/test";
import { keyActivate, keyType } from "./quality-keyboard";

// r38's filter form is a modal drawer. Close it with its own control before
// exercising the worklist; the background correctly remains inert.
export async function toggleWorklistFilters(page: Page) {
  const close = page.getByRole("button", {
    name: /^Close (Filter deals|Search and filter)$/,
  });
  if (await close.isVisible()) await close.click();
  else
    await page
      .getByRole("button", {
        name: /^(Filters and sort|Filters?|Search and filter)(,|$)/,
      })
      .filter({ visible: true })
      .click();
}

const filterDrawer = (page: Page) =>
  page.getByRole("dialog", { name: /^(Filter deals|Search and filter)$/ });

// Accepted CR-04 search lives in the filter drawer at every viewport.
export async function searchNeedsDrawer(page: Page) {
  return !(await filterDrawer(page).isVisible());
}

export async function fillOpportunitySearch(page: Page, value: string) {
  const search = page.getByRole("searchbox", {
    name: "Search deals",
    exact: true,
  });
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
      page
        .getByRole("button", {
          name: /^(Filters and sort|Filters?|Search and filter)(,|$)/,
        })
        .filter({ visible: true }),
    );
  await keyType(
    page,
    page.getByRole("searchbox", { name: "Search deals", exact: true }),
    value,
  );
  if (opened)
    await keyActivate(
      page,
      page.getByRole("button", {
        name: /^Close (Filter deals|Search and filter)$/,
      }),
    );
}
export async function chooseWorklistSort(page: Page, value: string) {
  const opened = await searchNeedsDrawer(page);
  if (opened) await toggleWorklistFilters(page);
  await filterDrawer(page)
    .getByLabel("Sort", { exact: true })
    .selectOption(value);
  if (opened) await toggleWorklistFilters(page);
}

export async function chooseDealsView(
  page: Page,
  view: "Board" | "List" | "Forecast" | "Archive",
) {
  const chooser = page.getByRole("button", {
    name: /^Choose view\. Current view:/,
  });
  if (await chooser.isVisible()) await chooser.click();
  await page
    .getByRole("button", { name: view, exact: true })
    .filter({ visible: true })
    .click();
}

// The accepted phone workspace keeps refresh in its view sheet.
export async function refreshDeals(page: Page) {
  const refresh = page
    .getByRole("button", { name: "Refresh from start", exact: true })
    .filter({ visible: true });
  if (!(await refresh.isVisible())) {
    await page
      .getByRole("button", { name: /^Choose view\. Current view:/ })
      .click();
  }
  await refresh.click();
}
