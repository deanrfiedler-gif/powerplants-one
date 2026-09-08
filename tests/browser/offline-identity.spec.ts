import { test, expect } from "@playwright/test";
import { keyActivate } from "../helpers/quality-keyboard";

// Isolated shell/IndexedDB UI proof with synthetic HTTP responses. The real
// identity, permission and retained-original journeys remain separate tests.
test("P08 identity controls expose startup, pending verification and denied recovery", async ({ page }) => {
  const owner = {
    workspace_id: "11111111-1111-4111-8111-111111111111",
    actor_id: "22222222-2222-4222-8222-222222222222",
    display_name: "SYN identity-control fixture",
  };
  let identityRequests = 0;
  let denyIdentity = false;
  let releaseModule!: () => void;
  const moduleGate = new Promise<void>(resolve => { releaseModule = resolve; });
  let releaseAssigned!: () => void;
  const assignedGate = new Promise<void>(resolve => { releaseAssigned = resolve; });
  let assignedStarted!: () => void;
  const pendingAssigned = new Promise<void>(resolve => { assignedStarted = resolve; });
  let holdAssigned = false;
  await page.route("**/offline/modules/offline/app.js", async route => {
    await moduleGate;
    await route.continue();
  });
  await page.route("**/api/v1/local-session", async route => {
    identityRequests++;
    await route.fulfill({
      status: denyIdentity ? 401 : 200,
      contentType: "application/json",
      body: JSON.stringify(denyIdentity
        ? { code: "NoSession", message: "SYN identity verification denied." }
        : owner),
    });
  });
  await page.route("**/api/v1/my-jobs", async route => {
    if (holdAssigned) {
      assignedStarted();
      await assignedGate;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [] }) });
  });
  const reconnect = page.getByRole("button", { name: "Verify identity online", exact: true });
  const lock = page.getByRole("button", { name: "Lock saved workspace", exact: true });
  try {
    await page.goto("/offline/index.html", { waitUntil: "commit" });
    await expect(reconnect).toBeVisible();
    await expect(reconnect).toBeDisabled();
    const initialRead = page.waitForResponse(response =>
      new URL(response.url()).pathname === "/api/v1/my-jobs");
    releaseModule();
    expect((await initialRead).status()).toBe(200);
    await expect(reconnect).toBeEnabled();
    await expect(page.locator("#identity")).toContainText(owner.display_name);
    await keyActivate(page, lock);
    await expect(page.locator("#workspace")).toBeHidden();

    holdAssigned = true;
    const reopened = page.waitForResponse(response =>
      new URL(response.url()).pathname === "/api/v1/my-jobs");
    await keyActivate(page, reconnect);
    await pendingAssigned;
    await expect(reconnect).toBeDisabled();
    await expect(page.locator("#notice")).toHaveText("Verifying identity and saved workspace…");
    await expect(page.locator("#error")).toBeEmpty();
    // Repeated native activation cannot start a concurrent verification.
    await page.keyboard.press("Enter");
    expect(identityRequests).toBe(2);
    releaseAssigned();
    expect((await reopened).status()).toBe(200);
    await expect(reconnect).toBeEnabled();
    await expect(page.locator("#notice")).toContainText("Identity verified");
    await expect(page.locator("#identity")).toContainText(owner.display_name);

    await keyActivate(page, lock);
    await expect(page.locator("#workspace")).toBeHidden();
    denyIdentity = true;
    await keyActivate(page, reconnect);
    await expect(page.locator("#error")).toHaveText("SYN identity verification denied.");
    await expect(reconnect).toBeEnabled();
    await expect(page.locator("#workspace")).toBeHidden();
    await expect(page.locator("#notice")).toContainText("Identity verification did not finish");
    expect(identityRequests).toBe(3);
  } finally {
    releaseModule();
    releaseAssigned();
  }
});
