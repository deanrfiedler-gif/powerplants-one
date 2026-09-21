import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { COMMISSIONING, commissioningScenarioIds, seedCommissioningScenario } from "../helpers/engineering-commissioning";
import type { Call, SignIn } from "../helpers/engineering-materials";

// The fixture uses ordinary server commands and independent synthetic identities, including
// accepted evidence, retained redlines, exact issues and receiving. No shared records are reset.
test("EN-08 retains its six-view layout and reachable inspector after the EN-06 grid change", async ({ page, isMobile }, testInfo) => {
  test.setTimeout(420000);
  const origin = new URL(testInfo.project.use.baseURL ?? "http://127.0.0.1:3000").origin;
  const contexts = new Map<string, APIRequestContext>();
  const as: SignIn = async (profile) => {
    let context = contexts.get(profile);
    if (!context) {
      context = await request.newContext({ baseURL: origin, extraHTTPHeaders: { Origin: origin } });
      expect((await context.post("/api/v1/local-session", { data: { profile } })).ok()).toBe(true);
      contexts.set(profile, context);
    }
    const call: Call = async (path, body) => {
      const response = await context!.fetch(`/api/v1/${path}`, { method: body ? "POST" : "GET", data: body });
      return { status: response.status(), body: await response.json() };
    };
    return call;
  };
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    const built = await seedCommissioningScenario(as, commissioningScenarioIds(false));
    expect((await page.request.post("/api/v1/local-session", { headers: { Origin: origin }, data: { profile: COMMISSIONING.engineer.profile } })).ok()).toBe(true);
    if (!isMobile) await page.setViewportSize({ width: 1920, height: 1200 });
    await page.goto(built.href);
    await expect(page.locator("#ppo-commissioning .em-register tbody tr")).toHaveCount(8);
    const inspector = page.locator("#ppo-commissioning .em-inspector");
    await expect(inspector).toBeVisible();
    await expect(inspector.getByRole("heading", { name: "Irrigation commissioning", exact: true })).toBeVisible();
    if (!isMobile) {
      await page.getByRole("button", { name: "Show menu", exact: true }).first().click();
      await expect(page.locator("#ppo-commissioning")).toHaveAttribute("data-menu", "docked");
      await expect(page.locator("#ppo-commissioning .em-workspace")).toHaveCSS("display", "flex");
      const menu = await page.locator("#cm-menu").boundingBox();
      const panel = await inspector.boundingBox();
      const context = await page.locator("#ppo-commissioning .em-context").boundingBox();
      expect(menu!.width).toBe(220);
      expect(panel!.width).toBe(480);
      expect(panel!.y).toBeGreaterThanOrEqual(context!.y + context!.height - 1);
      const register = await page.locator("#ppo-commissioning .em-register").boundingBox();
      const table = await page.locator("#ppo-commissioning .em-table").boundingBox();
      expect(Math.abs(register!.x - table!.x)).toBeLessThan(1);
      expect(Math.abs(register!.x + register!.width - table!.x - table!.width)).toBeLessThan(1);
    } else {
      const panel = await inspector.boundingBox();
      expect(panel!.y).toBe(64);
      expect(panel!.width).toBe(page.viewportSize()!.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: testInfo.outputPath("commissioning-register.png") });
    // A real click detects the historical phone-header overlap; never force it past an obstruction.
    await page.getByRole("button", { name: "Close inspector", exact: true }).click();
    await expect(inspector).toHaveCount(0);
    if (isMobile) {
      const toggle = page.getByRole("button", { name: "Commissioning menu", exact: true }).first();
      await toggle.click();
      await expect(page.locator("#cm-menu")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("#cm-menu")).toBeHidden();
      await expect(toggle).toBeFocused();
    }
    for (const view of ["basis", "results", "configuration", "releases", "handovers"]) {
      const url = new URL(built.href, origin);
      url.pathname = `/engineering/commissioning/${view}`;
      expect((await page.goto(url.href))!.status()).toBe(200);
      await expect(page.locator("#ppo-commissioning .cm-page")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    expect(errors).toEqual([]);
  } finally {
    await Promise.all([...contexts.values()].map(context => context.dispose()));
  }
});
