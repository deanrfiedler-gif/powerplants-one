import { test } from "../helpers/browser-lifecycle";
import { serviceJourney } from "../helpers/service-journey";
// Fixed device-local evidence represents UTC in both Windows and CI.
test.use({ actionTimeout: 15000, navigationTimeout: 60000, timezoneId: "UTC" });
test("P11 selected UI service-to-Finance journey preserves controlled booking, personal originals, exact response and reconciled Travel no-posting", async ({ page, context }, info) => {
  test.setTimeout(600000);
  await serviceJourney({ page, context }, info);
});
