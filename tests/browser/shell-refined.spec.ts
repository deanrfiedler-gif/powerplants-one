import { test, expect } from "@playwright/test";
import { expectRefinedHeader } from "../helpers/refined-header-geometry";
import { refinedPreferenceKey } from "../../src/shell/refined";

test.skip(
  ({ isMobile }) => !!isMobile,
  "Refined shell suite owns desktop and phone viewport checks.",
);

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.request.post("/api/v1/local-session", {
    headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
    data: { profile: "coordinator" },
  });
  expect(response.ok()).toBe(true);
  const context = await (
    await page.request.get("/api/v1/shell/context")
  ).json();
  await page.addInitScript(
    ({ key }) =>
      localStorage.setItem(
        key,
        JSON.stringify({ schema_version: 1, version: "refined" }),
      ),
    { key: refinedPreferenceKey(context.preference_scope) },
  );
});
test("refined header geometry is independent of either rail width", async ({
  page,
}) => {
  await page.goto("/sales/opportunities/new");
  await expect(
    page.getByRole("button", { name: "New", exact: true }),
  ).toBeVisible();
  for (const width of [834, 960, 1024, 1199, 1200, 1280, 1366, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (let state = 0; state < 2; state++) {
      await expectRefinedHeader(page, width);
      await page
        .getByRole("button", { name: /^(Expand|Collapse) primary navigation$/ })
        .click();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "New", exact: true }),
  ).toBeHidden();
  await expect(page.locator("#shell-header")).toHaveCSS("height", "56px");
});
test("New, search and tenant layers restore focus without adding history", async ({
  page,
}) => {
  await page.goto("/sales/opportunities/new");
  const add = page.getByRole("button", { name: "New", exact: true });
  await expect(add).toBeVisible();
  const history = await page.evaluate(() => window.history.length);
  await add.focus();
  await page.keyboard.press("n");
  const menu = page.getByRole("dialog", { name: "New", exact: true });
  await expect(menu).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(add).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Global search", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("combobox", { name: "Search Powerplants One" }),
  ).toBeFocused();
  const tenant = page.getByRole("button", { name: /^Switch tenant:/ });
  await tenant.click();
  await expect(
    page.getByRole("dialog", { name: "Switch tenant", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tenant).toBeFocused();
  expect(await page.evaluate(() => window.history.length)).toBe(history);
});
test("account records unavailable sign-in data and opens the same tenant switcher", async ({
  page,
}) => {
  await page.goto("/sales/opportunities/new");
  await page.locator("#identity-toggle").click();
  const account = page.getByRole("dialog", { name: "Account", exact: true });
  await expect(
    account.getByText("Last sign-in details unavailable", { exact: true }),
  ).toBeVisible();
  await account
    .getByRole("button", { name: "Switch tenant", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Switch tenant", exact: true }),
  ).toBeVisible();
  await expect(account).toBeHidden();
});

test("utilities are one tab stop across responsive changes, with arrow navigation", async ({
  page,
}) => {
  await page.goto("/customers");
  const toolbar = page.getByRole("toolbar", { name: "Shell utilities" });
  const stops = toolbar.locator('[tabindex="0"]');
  await expect(stops).toHaveCount(1);
  await stops.focus();
  await page.keyboard.press("End");
  await expect(
    toolbar.getByRole("button", { name: /^Notifications/ }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(stops).toBeFocused();
  await page.setViewportSize({ width: 834, height: 900 });
  await expect(stops).toHaveCount(1);
  await expect(stops).toBeVisible();
  await stops.focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#identity-toggle")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#identity-toggle")).not.toBeFocused();
});

test("New opens only its existing create form and respects typing in inputs", async ({
  page,
}) => {
  await page.goto("/customers");
  const search = page.getByRole("combobox", { name: "Search Powerplants One" });
  await search.fill("n");
  await expect(
    page.getByRole("dialog", { name: "New", exact: true }),
  ).toBeHidden();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "New", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "New", exact: true });
  await expect(menu.getByRole("link", { name: /New contact/ })).toBeVisible();
  await page.keyboard.press("c");
  await expect(page).toHaveURL(/\/customers\/new\?kind=person$/);
});

test("tenant switching reviews unsaved work and persists through the existing API", async ({
  page,
}) => {
  const original = await (
    await page.request.get("/api/v1/shell/context")
  ).json();
  const next = original.companies.find(
    (c: { id: string }) => c.id !== original.working_company_id,
  );
  expect(next, "coordinator has an existing company choice").toBeTruthy();
  let allow = false,
    prompts = 0;
  page.on("dialog", (dialog) => {
    prompts++;
    void (allow ? dialog.accept() : dialog.dismiss());
  });
  await page.goto("/sales/opportunities/new");
  await page
    .getByLabel("Deal title", { exact: true })
    .fill("SYN Refined tenant leave review");
  const choose = async () => {
    await page.getByRole("button", { name: /^Switch tenant:/ }).click();
    await page
      .getByRole("menuitemradio", {
        name: new RegExp(next.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      })
      .click();
  };
  try {
    await choose();
    expect(prompts).toBe(1);
    await expect(page.getByLabel("Deal title", { exact: true })).toHaveValue(
      "SYN Refined tenant leave review",
    );
    expect(
      (await (await page.request.get("/api/v1/shell/context")).json())
        .working_company_id,
    ).toBe(original.working_company_id);
    allow = true;
    const saved = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/shell/company") &&
        r.request().method() === "POST",
    );
    await choose();
    expect((await saved).ok()).toBe(true);
    await expect(
      page.getByRole("button", {
        name: `Switch tenant: ${next.name}`,
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", {
        name: `Switch tenant: ${next.name}`,
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    expect(
      (
        await page.request.post("/api/v1/shell/company", {
          headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
          data: { company_id: original.working_company_id },
        })
      ).ok(),
    ).toBe(true);
  }
});

test("the preference can be turned off and does not follow another identity", async ({
  page,
}) => {
  await page.goto("/customers");
  await page.locator("#identity-toggle").click();
  await page.getByText("Preferences", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Refined desktop shell", exact: true })
    .uncheck();
  await expect(page.locator(".app-frame")).not.toHaveAttribute(
    "data-shell-version",
    "refined",
  );
  await expect(
    page.getByRole("button", { name: "Quick add", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#shell-header")).toHaveCSS("height", "64px");
  await page
    .getByRole("checkbox", { name: "Refined desktop shell", exact: true })
    .check();
  await expect(
    page.getByRole("button", { name: "New", exact: true }),
  ).toBeVisible();
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
        data: { profile: "observer" },
      })
    ).ok(),
  ).toBe(true);
  await page.reload();
  await expect(page.locator("#identity-toggle")).toBeVisible();
  await expect(page.locator(".app-frame")).not.toHaveAttribute(
    "data-shell-version",
    "refined",
  );
});
