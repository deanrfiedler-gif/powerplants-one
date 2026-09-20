import { test, expect, type Page } from "@playwright/test";

// A synthetic beforeinstallprompt proves this controller's behaviour only. It does not
// prove that Chrome will offer a real installation, which stays a physical-device check.
async function withSyntheticPrompt(page: Page) {
  await page.addInitScript(() => {
    const record = { prompts: 0, prevented: 0 };
    Object.assign(window, { __ppoInstall: record });
    Object.assign(window, {
      __ppoFire: (answer: "accepted" | "dismissed" | "throw") => {
        const event = new Event("beforeinstallprompt") as Event & {
          prompt: () => Promise<void>;
          userChoice: Promise<{ outcome: string }>;
        };
        let settle: (value: { outcome: string }) => void = () => {};
        event.userChoice = new Promise((resolve) => (settle = resolve));
        // The answer waits for the test, so a second click lands while one is in flight.
        Object.assign(window, { __ppoRelease: () => settle({ outcome: answer }) });
        event.prompt = async () => {
          record.prompts++;
          if (answer === "throw") throw new Error("synthetic prompt refusal");
        };
        const original = event.preventDefault.bind(event);
        event.preventDefault = () => {
          record.prevented++;
          original();
        };
        window.dispatchEvent(event);
      },
    });
  });
}

/**
 * Sign in, open My Work and wait until the shell is interactive. Opening the More
 * surface only works once React has hydrated, which is also when the controller is
 * certainly listening, so a synthetic event cannot be dispatched into a dead page.
 * The compiled application in CI reaches this point far sooner than a dev server, so
 * the wait is what makes the test deterministic rather than the ordering of the lines.
 */
async function openWorkspace(page: Page, baseURL: string) {
  await signIn(page, baseURL);
  await page.goto("/work");
  await openMore(page);
  const help = page.getByRole("button", { name: "How to install this app" });
  await expect(help).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(help).toBeHidden();
}

async function signIn(page: Page, baseURL: string) {
  const session = await page.request.post("/api/v1/local-session", {
    headers: { Origin: baseURL, "Content-Type": "application/json" },
    data: { profile: "coordinator" },
  });
  expect(session.ok()).toBe(true);
}

// Since mobile r07 the phone bar's trigger is also named "More"; the rail shows its own
// only on wide viewports, so exactly one "More" button exists at any width.
const openMore = async (page: Page) =>
  page.getByRole("button", { name: "More", exact: true }).click();

test("the app head and manifest describe one installable identity", async ({ page, baseURL }) => {
  await signIn(page, baseURL!);
  await page.goto("/work");
  const links = page.locator('link[rel="manifest"]');
  await expect(links).toHaveCount(1);
  await expect(links).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/pwa/ppo-app-icon-180.png",
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#242a37");
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
    "content",
    "Powerplants One",
  );
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect(manifest.headers()["content-type"]).toContain("application/manifest+json");
  const value = await manifest.json();
  expect(value).toMatchObject({ id: "/", start_url: "/work", scope: "/", display: "standalone" });
  // Every declared icon is a real image of the size it claims.
  for (const icon of value.icons) {
    const response = await page.request.get(icon.src);
    expect(response.status(), icon.src).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    const size = await page.evaluate(
      (src) =>
        new Promise<string>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(`${image.naturalWidth}x${image.naturalHeight}`);
          image.onerror = () => reject(new Error(`could not decode ${src}`));
          image.src = src;
        }),
      icon.src,
    );
    expect(size, icon.src).toBe(icon.sizes);
  }
});

test("install appears only with a real event, prompts once per event and reports the answer", async ({
  page,
  baseURL,
}, info) => {
  await withSyntheticPrompt(page);
  await openWorkspace(page, baseURL!);

  // No event: an enabled Install button that could do nothing is never shown; the
  // manual instructions remain reachable instead.
  await openMore(page);
  await expect(page.getByRole("button", { name: "Install Powerplants One" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "How to install this app" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.evaluate(() => (window as unknown as { __ppoFire: (a: string) => void }).__ppoFire("accepted"));
  // Taking ownership of the browser prompt means preventing its default.
  expect(await page.evaluate(() => (window as unknown as { __ppoInstall: { prevented: number } }).__ppoInstall.prevented)).toBe(1);

  await openMore(page);
  const install = page.getByRole("button", { name: "Install Powerplants One" });
  await expect(install).toBeVisible();
  await expect(install).toBeEnabled();
  await install.click();
  // A second click while the browser is still answering must not start a second prompt.
  const waiting = page.getByRole("button", { name: "Waiting for your browser…" });
  await expect(waiting).toBeVisible();
  await expect(waiting).toBeDisabled();
  await waiting.click({ force: true });
  await page.evaluate(() => (window as unknown as { __ppoRelease: () => void }).__ppoRelease());
  await expect(page.getByText("Installation accepted.")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __ppoInstall: { prompts: number } }).__ppoInstall.prompts)).toBe(1);
  // The consumed event cannot be used again.
  await expect(install).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("install-accepted.png") });
});

test("a dismissed prompt stays closed until the browser offers another event", async ({
  page,
  baseURL,
}) => {
  await withSyntheticPrompt(page);
  await openWorkspace(page, baseURL!);
  await page.evaluate(() => (window as unknown as { __ppoFire: (a: string) => void }).__ppoFire("dismissed"));
  await openMore(page);
  await page.getByRole("button", { name: "Install Powerplants One" }).click();
  await page.evaluate(() => (window as unknown as { __ppoRelease: () => void }).__ppoRelease());
  await expect(page.getByText("Installation was not completed.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Install Powerplants One" })).toHaveCount(0);
  // It does not reopen on its own, and the instructions stay available.
  await expect(page.getByRole("button", { name: /install/i })).toHaveCount(1);
  await page.keyboard.press("Escape");

  // A later eligible event enables the action again.
  await page.evaluate(() => (window as unknown as { __ppoFire: (a: string) => void }).__ppoFire("accepted"));
  await openMore(page);
  await expect(page.getByRole("button", { name: "Install Powerplants One" })).toBeVisible();
  await page.keyboard.press("Escape");

  // A browser that rejects its own prompt is reported truthfully, not as success.
  await page.evaluate(() => (window as unknown as { __ppoFire: (a: string) => void }).__ppoFire("throw"));
  await openMore(page);
  await page.getByRole("button", { name: "Install Powerplants One" }).click();
  await expect(page.getByText("could not show its installation prompt")).toBeVisible();
});

test("appinstalled removes the offer without claiming anything it cannot see", async ({
  page,
  baseURL,
}) => {
  await withSyntheticPrompt(page);
  await openWorkspace(page, baseURL!);
  await page.evaluate(() => (window as unknown as { __ppoFire: (a: string) => void }).__ppoFire("accepted"));
  // The browser reports the installation without our prompt having been used.
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await openMore(page);
  await expect(page.getByRole("button", { name: "Install Powerplants One" })).toHaveCount(0);
  await expect(page.getByText("Powerplants One was installed on this device.")).toBeVisible();
  // Nothing was written to storage: a new tab cannot claim an installation it never saw.
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => /install|pwa|standalone/i.test(key)),
    ),
  ).toEqual([]);
});

test("the manual instructions are complete, keyboard reachable and never claim success", async ({
  page,
  baseURL,
}, info) => {
  await signIn(page, baseURL!);
  await page.goto("/work");
  await openMore(page);
  const help = page.getByRole("button", { name: "How to install this app" });
  await help.focus();
  await expect(help).toBeFocused();
  await page.keyboard.press("Enter");
  const panel = page.getByRole("dialog", { name: "How to install Powerplants One" });
  await expect(panel).toBeVisible();
  // Every platform stays reachable, including on a browser reporting a desktop agent.
  for (const [device, heading] of [
    ["iPhone or iPad", "Add to the Home Screen with Safari"],
    ["Android", "Install with Chrome"],
    ["Mac", "Add to the Dock with Safari"],
  ] as const) {
    await panel.getByRole("button", { name: device, exact: true }).click();
    await expect(panel.getByRole("heading", { name: heading })).toBeVisible();
  }
  await panel.getByRole("button", { name: "iPhone or iPad", exact: true }).click();
  const list = panel.locator("ol");
  await expect(list).toContainText("Share");
  await expect(list).toContainText("Add to Home Screen");
  await expect(list).toContainText("View More");
  await expect(list).toContainText("Open as Web App");
  await expect(list).toContainText("My Work");
  // The panel is labelled as instructions and never simulates the system dialog.
  await expect(panel.locator(".ppo-install-note")).toContainText("a website cannot start them for you");
  await expect(panel.getByText(/was installed|installation (accepted|complete)/i)).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("install-instructions.png") });
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  // The trigger closed with the More surface behind the panel, so focus returns to the
  // control that opened that surface rather than being dropped on the document.
  await expect(page.getByRole("button", { name: "More", exact: true })).toBeFocused();
});

test("an installed window hides the offer and offers a reload that respects unsaved work", async ({
  page,
  baseURL,
}) => {
  // A test browser cannot be launched as an installed window, so the display mode is
  // emulated. This proves the controller reacts to the signal, not that iOS or Android
  // report it — that stays a physical-device check.
  await page.addInitScript(() => {
    const real = window.matchMedia.bind(window);
    window.matchMedia = (query: string) =>
      query === "(display-mode: standalone)"
        ? ({
            matches: true,
            media: query,
            onchange: null,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
            dispatchEvent: () => false,
          } as MediaQueryList)
        : real(query);
  });
  await signIn(page, baseURL!);
  await page.goto("/work");
  await openMore(page);
  await expect(page.getByRole("button", { name: "Install Powerplants One" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "How to install this app" })).toHaveCount(0);
  const reload = page.getByRole("button", { name: "Reload app" });
  await expect(reload).toBeVisible();

  // With nothing unsaved it reloads without asking.
  let asked = 0;
  page.on("dialog", (dialog) => {
    asked++;
    void dialog.dismiss();
  });
  await reload.click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(asked).toBe(0);
});
