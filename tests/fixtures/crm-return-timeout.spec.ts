import { test } from "@playwright/test";
import { assertSupportedBrowser } from "../../src/platform/browser";
import { crmReturnDiagnostics } from "../helpers/crm-return-diagnostics";

test("deliberate timeout retains CRM return events", async ({
  page,
  browser,
}, info) => {
  assertSupportedBrowser(browser.version());
  const diagnostics = await crmReturnDiagnostics(
    page,
    info,
    "synthetic-return",
    "synthetic-opportunity",
  );
  try {
    await page.route("**/work/synthetic-return", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<a href="#" onclick="event.preventDefault()">Return to opportunity and plan follow-up</a>',
      }),
    );
    await page.goto("http://127.0.0.1:3000/work/synthetic-return");
    await page.getByRole("link").click();
    // Let deferred cancellation sampling run, then flush its delivered events
    // before the real runner deadline tears down the page.
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await (
        window as typeof window & {
          ppoCrmReturnDiagnostics: () => Promise<void>;
        }
      ).ppoCrmReturnDiagnostics();
    });
    info.setTimeout(1);
    await page.getByRole("button", { name: "SYN deliberately absent" }).click();
  } finally {
    await diagnostics.finish();
  }
});
