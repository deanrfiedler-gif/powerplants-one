import { expect, type Page } from "@playwright/test";

// The session read can finish before the appointment read. Until the record publishes
// its phone header, Menu is a temporary opener that will be replaced by Back. Wait
// for the record and its header handover before starting an account/menu interaction.
export async function expectAppointmentNavigation(page: Page) {
  await expect(page.locator("#ppo-appointment")).toBeVisible();
  if ((page.viewportSize()?.width ?? 1440) <= 780)
    await expect(page.locator("#shell-header")).toHaveAttribute("data-phone-header", "record");
}

/** Verify the exact record and its visible reference in the accepted SV-04 layout. */
export async function expectAppointmentRecord(
  page: Page,
  appointment: { id: string; display_number: string },
) {
  await expect(page).toHaveURL(
    new RegExp(`/service/appointments/${appointment.id}(?:\\?|$)`),
  );
  const record = page.locator("#ppo-appointment");
  await expectAppointmentNavigation(page);
  const reference = record.locator(".shared-record-meta").getByText(appointment.display_number, { exact: true });
  await expect(reference).toHaveText(appointment.display_number);
  if ((page.viewportSize()?.width ?? 1440) < 781)
    await expect(page.locator("#shell-header")).toContainText(appointment.display_number);
  else await expect(reference).toBeVisible();
}
