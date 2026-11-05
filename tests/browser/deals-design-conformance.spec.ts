import { test, expect } from "@playwright/test";
import { assertDealsHost, assertChoiceGeometry } from "../helpers/deals-design";
test("Sales routes preserve CRM bookmarks and the compiled shell has one board frame", async ({
  page,
}, info) => {
  const session = await page.request.post("/api/v1/local-session", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: { profile: "coordinator" },
  });
  expect(session.ok()).toBe(true);
  await page.goto("/crm/opportunities?pipeline=I1&view=Board&sort=Title");
  await expect(page).toHaveURL(
    /\/sales\/opportunities\?pipeline=I1&view=Board&sort=Title$/,
  );
  await expect(page.locator(".crm-board-scroll")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await assertDealsHost(page);
  await page.reload();
  await expect(page.locator(".crm-board-scroll")).toBeVisible();
  await assertDealsHost(page);
  const chooser = page.getByRole("button", {
    name: /^Choose view\. Current view:/,
  });
  if (await chooser.isVisible()) {
    // D13 removes the phone toolbar; Q1's view choice uses the native sheet.
    await chooser.click();
    const sheet = page.getByRole("dialog", {
      name: "Choose Deals view",
      exact: true,
    });
    await expect(sheet).toBeVisible();
    for (const name of ["Board", "List", "Forecast", "Archive"])
      await expect(
        sheet.getByRole("button", { name, exact: true }),
      ).toBeEnabled();
    await expect(
      sheet.getByRole("button", { name: "Board", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      await sheet.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return {
          modal: node.matches(":modal"),
          radius: getComputedStyle(node).borderRadius,
          fits:
            box.left >= 0 &&
            box.right <= innerWidth &&
            box.top >= 0 &&
            box.bottom <= innerHeight,
        };
      }),
    ).toEqual({ modal: true, radius: "10px", fits: true });
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(chooser).toBeFocused();
  } else {
    await page.getByRole("button", { name: "Views", exact: true }).click();
    await assertChoiceGeometry(page);
    await page.keyboard.press("Escape");
  }
  await page.screenshot({ path: info.outputPath("compiled-sales-board.png") });
  for (const [from, to] of [
    ["/crm/opportunities/new", "/sales/opportunities/new"],
    ["/crm/leads?view=List", "/sales/leads?view=List"],
    [
      "/crm/opportunities/00000000-0000-4000-8000-000000000001?section=files",
      "/sales/opportunities/00000000-0000-4000-8000-000000000001?section=files",
    ],
  ]) {
    const response = await page.request.get(from, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(to);
  }
});
