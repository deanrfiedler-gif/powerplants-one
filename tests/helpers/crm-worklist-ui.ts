import type { Page } from "@playwright/test";

// r38's filter form is a modal drawer. Close it with its own control before
// exercising the worklist; the background correctly remains inert.
export async function toggleWorklistFilters(page: Page) {
  const close = page.getByRole("button", { name: "Close Filter opportunities", exact: true });
  if (await close.isVisible()) await close.click();
  else await page.getByRole("button", { name: "Filters and sort", exact: true }).click();
}
