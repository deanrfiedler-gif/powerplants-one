import type { Page } from "@playwright/test";

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

// Desktop search belongs inside Filters; compact search stays in the shell.
export async function fillOpportunitySearch(page: Page, value: string) {
  const search = page.getByLabel("Search opportunities", { exact: true });
  const opened = !(await search.isVisible());
  if (opened) await toggleWorklistFilters(page);
  await search.fill(value);
  const close = page.getByRole("button", {
    name: "Close Filter opportunities",
    exact: true,
  });
  if (opened && (await close.isVisible())) await close.click();
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
