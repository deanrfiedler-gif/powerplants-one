import { expect, type Page } from "@playwright/test";

/** Verify the exact record and its visible reference in the accepted SV-04 layout. */
export async function expectAppointmentRecord(
  page: Page,
  appointment: { id: string; display_number: string },
) {
  await expect(page).toHaveURL(
    new RegExp(`/service/appointments/${appointment.id}(?:\\?|$)`),
  );
  const record = page.locator("#ppo-appointment");
  await expect(record).toBeVisible();
  const reference = record.locator(".shared-record-meta").getByText(appointment.display_number, { exact: true });
  await expect(reference).toHaveText(appointment.display_number);
  if ((page.viewportSize()?.width ?? 1440) < 781)
    await expect(page.locator("#shell-header")).toContainText(appointment.display_number);
  else await expect(reference).toBeVisible();
}
