import { expect, test } from "@playwright/test";
import { keyAdvanceDays } from "../helpers/quality-keyboard";

// Literal expected dates make these regressions independent of the helper's
// calendar arithmetic. Each profile exercises its real native input segments.
const cases = [
  ["same month", "2026-10-20T10:15", 3, "2026-10-23T10:15"],
  ["reported October rollover", "2026-10-30T10:15", 3, "2026-11-02T10:15"],
  ["last day of month", "2026-01-31T23:45", 1, "2026-02-01T23:45"],
  ["March end", "2026-03-31T10:15", 1, "2026-04-01T10:15"],
  ["first day", "2026-11-01T10:15", 1, "2026-11-02T10:15"],
  ["leap-year to ordinary year", "2028-02-29T10:15", 366, "2029-03-01T10:15"],
  ["divisible by 400 is leap", "2000-02-28T10:15", 1, "2000-02-29T10:15"],
  ["year rollover", "2026-12-31T10:15", 1, "2027-01-01T10:15"],
  ["enter leap day", "2028-02-28T10:15", 1, "2028-02-29T10:15"],
  ["leave leap day", "2028-02-29T10:15", 1, "2028-03-01T10:15"],
  ["ordinary February", "2027-02-28T10:15", 1, "2027-03-01T10:15"],
  ["century is not leap", "2100-02-28T10:15", 1, "2100-03-01T10:15"],
  ["multiple months", "2026-12-30T10:15", 65, "2027-03-05T10:15"],
  ["backward year rollover", "2027-01-02T10:15", -3, "2026-12-30T10:15"],
  ["zero days", "2026-10-30T10:15", 0, "2026-10-30T10:15"],
] as const;

for (const [name, before, days, after] of cases) {
  test(`native keyboard date: ${name}`, async ({ page }) => {
    await page.setContent(
      `<label>Start<input type="datetime-local" value="${before}"></label><button>Next</button>`,
    );
    // A direct value write/fill must not masquerade as keyboard evidence.
    await page.locator("input").evaluate((element) => {
      Object.defineProperty(element, "value", {
        get() {
          return Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value",
          )!.get!.call(this);
        },
        set() {
          throw new Error("Date regression requires native keyboard input");
        },
      });
    });
    const target = page.getByLabel("Start");
    await keyAdvanceDays(page, target, days);
    await expect(target).toHaveValue(after);
    await expect(page.getByRole("button", { name: "Next" })).toBeFocused();
  });
}
