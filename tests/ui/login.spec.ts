import { test, expect, type Page } from "@playwright/test";
import { renderLoginPage, loginPolicy, loginState } from "../../src/login/login-page";

const origin = "https://ppo-login.example.invalid";
// The actual gateway renderer and CSP; provider navigation is synthetic here.
async function serve(page: Page, local = false) {
  // Interception handles the application entry; real cross-origin provider completion
  // remains a hosted acceptance check. No test request is sent to Microsoft.
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) { await route.abort(); return; }
    if (url.pathname === "/auth/login") {
      await route.fulfill({ status: 200, contentType: "text/html", body: '<!doctype html><html lang="en"><title>Synthetic handoff boundary</title><p>Microsoft handoff endpoint reached (synthetic)</p></html>' }); return;
    }
    await route.fulfill({ status: 200, contentType: "text/html", headers: { "Content-Security-Policy": loginPolicy }, body: renderLoginPage(loginState(url.searchParams), local) });
  });
}
async function loaded(page: Page) {
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator(".logo").evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1254);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("approved login layout retains intact brand and readable narrow-desktop heading", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await serve(page); await page.goto(origin + "/login"); await loaded(page);
  await expect(page.locator(".brand")).toHaveCSS("background-color", "rgb(36, 42, 55)");
  await expect(page.getByRole("button", { name: "Sign in with Microsoft", exact: true })).toHaveCSS("min-height", "54px");
  await expect(page.getByText("Private prototype · Fictional records", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Explore sign-in states" })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("login-ready.png"), fullPage: true });
  if (info.project.name === "desktop") {
    for (const width of [1366, 1024, 900, 820, 781, 780]) {
      await page.setViewportSize({ width, height: 900 }); await loaded(page);
      if (width > 780) expect(await page.locator(".product").evaluate(el => {
        const range = document.createRange(); range.selectNodeContents(el.firstChild!);
        const panel = el.closest(".brand")!, style = getComputedStyle(panel);
        return range.getBoundingClientRect().right <= panel.getBoundingClientRect().right - parseFloat(style.paddingRight);
      })).toBe(true);
    }
    await page.setViewportSize({ width: 781, height: 900 });
    await page.screenshot({ path: info.outputPath("login-781.png"), fullPage: true });
  }
  expect(errors).toEqual([]);
});

test("recovery copy and real form destinations are bounded and do not expose details", async ({ page }, info) => {
  await serve(page);
  for (const [state, title, action] of [
    ["cancelled", "Sign-in was cancelled", "Sign in with Microsoft"],
    ["denied", "This account doesn’t have access", "Use another Microsoft account"],
    ["expired", "Your session has expired", "Sign in with Microsoft"],
    ["unavailable", "Sign-in is temporarily unavailable", "Try again with Microsoft"],
  ]) {
    await page.goto(`${origin}/login?status=${state}`); await loaded(page);
    await expect(page.getByRole("region", { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: action, exact: true })).toBeVisible();
    await expect(page.locator("#signin-form")).toHaveAttribute("action", "/auth/login");
    await page.screenshot({ path: info.outputPath(`login-${state}.png`), fullPage: true });
  }
  await page.getByRole("button", { name: "Try again with Microsoft", exact: true }).click();
  await expect(page.getByText("Microsoft handoff endpoint reached (synthetic)")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/auth/login");
  await page.goBack(); await loaded(page);
  await expect(page.getByRole("button", { name: "Try again with Microsoft", exact: true })).not.toHaveAttribute("aria-disabled", "true");
});

test("pending navigation announces progress and rejects duplicate keyboard submissions", async ({ page }) => {
  await serve(page);
  let attempts = 0, release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route(url => url.origin === origin && url.pathname === "/auth/login", async route => {
    attempts++; await held;
    await route.fulfill({ status: 200, contentType: "text/html", body: "<p>Synthetic handoff completed</p>" });
  });
  try {
    await page.goto(origin + "/login");
    const action = page.locator("#sign-in");
    await action.focus(); await page.keyboard.press("Enter");
    // Locator assertions wait for navigation; inspect the still-visible document
    // while this test deliberately holds the response before navigation commits.
    const pending = await page.evaluate(() => ({ busy: document.getElementById("sign-in")!.getAttribute("aria-busy"), disabled: document.getElementById("sign-in")!.getAttribute("aria-disabled"), announcement: document.getElementById("announcer")!.textContent }));
    expect(pending.busy).toBe("true"); expect(pending.disabled).toBe("true"); expect(pending.announcement).toContain("Opening Microsoft");
    await expect.poll(() => attempts).toBe(1);
    await page.keyboard.press("Enter");
    release();
    await expect(page.getByText("Synthetic handoff completed")).toBeVisible();
    expect(attempts).toBe(1);
  } finally { release(); }
});

test("help wraps keyboard focus and preserves close actions with expanded phone content", async ({ page }, info) => {
  await serve(page); await page.goto(origin + "/login");
  const help = page.getByRole("button", { name: "Need help signing in?", exact: true });
  await help.click();
  const dialog = page.getByRole("dialog", { name: "Help signing in", exact: true });
  const close = dialog.getByRole("button", { name: "Close sign-in help" });
  const back = dialog.getByRole("button", { name: "Back to sign in" });
  await expect(close).toBeFocused(); await page.keyboard.press("Shift+Tab"); await expect(back).toBeFocused();
  await page.keyboard.press("Tab"); await expect(close).toBeFocused();
  await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible(); await expect(help).toBeFocused();
  await page.setViewportSize({ width: 320, height: 568 }); await help.click();
  for (const summary of ["Microsoft shows the wrong account", "I forgot my password", "My access has been denied"])
    await dialog.locator("summary").filter({ hasText: summary }).click();
  expect(await dialog.locator("details[open]").count()).toBe(4);
  const bounds = await dialog.evaluate(el => {
    const body = el.querySelector(".dialog-body")!, header = el.querySelector(".dialog-header")!, footer = el.querySelector(".dialog-actions")!;
    return { scrolls: body.scrollHeight > body.clientHeight, fits: el.scrollWidth <= el.clientWidth, header: header.getBoundingClientRect().top, footer: footer.getBoundingClientRect().bottom, viewport: innerHeight };
  });
  expect(bounds.scrolls).toBe(true); expect(bounds.fits).toBe(true); expect(bounds.header).toBeGreaterThanOrEqual(0); expect(bounds.footer).toBeLessThanOrEqual(bounds.viewport);
  await page.screenshot({ path: info.outputPath("login-help-320.png"), fullPage: true });
  await back.click(); await expect(help).toBeFocused();
});

test("local entry is explicit; JavaScript-free Microsoft navigation and help remain usable", async ({ page, browser }, info) => {
  await serve(page, true); await page.goto(origin + "/login"); await loaded(page);
  await expect(page.getByRole("button", { name: "Sign in with Microsoft", exact: true })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Open local prototype" })).toHaveAttribute("href", "/work");
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: info.project.use.viewport });
  try {
    const plain = await context.newPage(); await serve(plain); await plain.goto(origin + "/login");
    await expect(plain.getByRole("region", { name: "Help signing in" })).toBeVisible();
    await plain.getByRole("button", { name: "Sign in with Microsoft", exact: true }).click();
    await expect(plain.getByText("Microsoft handoff endpoint reached (synthetic)")).toBeVisible();
  } finally { await context.close(); }
});
