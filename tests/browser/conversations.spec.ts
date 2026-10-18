import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmCreate } from "../helpers/crm";

// Conversations T1c-1 (PPO-CONV-T1C-DESIGN): people-only threads on the /conversations page, built and changed
// through the real API and the real page. Profiles: coordinator asks, crm-receiver is asked, and
// estimating-source-reviewer reads conversations but takes part in none, so its page stays empty.
const asker = "coordinator";
const asked = "crm-receiver";
const bystander = "estimating-source-reviewer";

async function signIn(page: Page, profile: string) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const r = await page.request.post("/api/v1/local-session", { headers: { Origin: origin }, data: { profile } });
  expect(r.ok()).toBe(true);
  return ((await r.json()) as { actor_id: string }).actor_id;
}
async function api<T = Record<string, unknown>>(page: Page, path: string, body?: unknown): Promise<{ status: number; body: T }> {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const r = await page.request.fetch(`/api/v1/${path}`, { method: body ? "POST" : "GET", headers: { Origin: origin }, data: body });
  return { status: r.status(), body: (await r.json()) as T };
}
const base = (reason: string) => ({ schema_version: 1, operation_id: randomUUID(), reason });

// A fresh deal and a thread on it, started by the asker, tagging and asking the asked person.
async function askedThread(page: Page, title = `SYN T1c-1 ${randomUUID().slice(0, 8)}`) {
  const askedId = await signIn(page, asked);
  await signIn(page, asker);
  const deal = crmCreate();
  expect((await api(page, "crm/opportunities", deal)).status).toBe(201);
  const started = await api<{ record_id: string }>(page, "conversations", {
    ...base("Start a conversation"),
    anchor_type: "Opportunity",
    anchor_id: deal.id,
    title,
    body: "@{1} SYN when does the controller arrive?",
    mentions: [{ ordinal: 1, kind: "Person", person_id: askedId }],
    asks: [{ ordinal: 1, question: "SYN delivery date", reply_by: "2026-10-30" }],
  });
  expect(started.status).toBe(201);
  return { thread: started.body.record_id, title, dealId: deal.id };
}

test.describe("T1c-1 conversations list", () => {
  test("T1c-1 empty page", async ({ page }) => {
    await signIn(page, bystander);
    await page.goto("/conversations");
    await expect(page.getByRole("heading", { name: "Start a conversation about a deal or project" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New thread" }).first()).toBeVisible();
  });

  test("T1c-1 sidebar groups and filters", async ({ page }) => {
    const { title } = await askedThread(page);
    await signIn(page, asked);
    await page.goto("/conversations");
    const sidebar = page.getByRole("navigation", { name: "Conversations" });
    await expect(sidebar.getByRole("link", { name: new RegExp(title) })).toBeVisible();
    await expect(sidebar.getByText(/^Deal .+ · /).first()).toBeVisible();
    const waiting = sidebar.getByRole("button", { name: /Waiting on you/ });
    await expect(waiting).toContainText(/\d+/);
    await sidebar.getByRole("searchbox", { name: "Search threads" }).fill(title);
    await expect(sidebar.getByRole("link")).toHaveCount(1);
    await sidebar.getByRole("searchbox", { name: "Search threads" }).fill(`no such thread ${randomUUID()}`);
    await expect(sidebar.getByRole("link")).toHaveCount(0);
  });

  test("T1c-1 no rail item is current and no horizontal scroll at 320 px", async ({ page, isMobile }) => {
    await askedThread(page, `SYN long ${"title ".repeat(30)}`.slice(0, 200));
    await signIn(page, asked);
    if (!isMobile) {
      await page.goto("/conversations");
      await expect(page.getByRole("navigation", { name: "Conversations" })).toBeVisible();
      await expect(page.locator("#primary-navigation [aria-current='page']")).toHaveCount(0);
      return;
    }
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto("/conversations");
    await expect(page.getByRole("navigation", { name: "Conversations" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});

test.describe("T1c-1 thread view", () => {
  test("T1c-1 thread shows messages, tags and an ask", async ({ page }) => {
    const { thread, dealId } = await askedThread(page);
    await signIn(page, asked);
    await page.goto(`/conversations/${thread}`);
    const log = page.getByRole("log");
    await expect(log).toHaveAttribute("aria-live", "polite");
    await expect(log.getByText(/when does the controller arrive\?/)).toBeVisible();
    await expect(log.locator(".cv-mention").first()).not.toContainText("@{");
    await expect(page.getByText(/^Waiting on you · SYN delivery date$/)).toBeVisible();
    await expect(page.getByRole("button", { name: "No answer needed" })).toBeVisible();
    await expect(page.locator(".cv-record-row").getByRole("link")).toHaveAttribute("href", `/crm/opportunities/${dealId}`);
  });

  test("T1c-1 the asked person's reply closes the ask", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asked);
    expect((await api(page, `conversations/${thread}/messages`, { ...base("Post a message"), body: "SYN 30 October" })).status).toBe(201);
    await page.goto(`/conversations/${thread}`);
    await expect(page.getByText(/^Answered by /)).toBeVisible();
    await expect(page.getByRole("button", { name: "No answer needed" })).toHaveCount(0);
  });

  test("T1c-1 resolve and reopen", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    await page.getByRole("button", { name: "Resolve" }).click();
    await expect(page.getByText("Reopen this conversation to reply")).toBeVisible();
    await page.getByRole("button", { name: "Reopen" }).click();
    await expect(page.getByText("Reopen this conversation to reply")).toHaveCount(0);
  });

  test("T1c-1 a link the reader cannot open", async ({ page }) => {
    const { thread, dealId } = await askedThread(page);
    await signIn(page, asker);
    expect(
      (
        await api(page, `conversations/${thread}/messages`, {
          ...base("Post a message"),
          body: "SYN see #{1}",
          mentions: [{ ordinal: 1, kind: "Record", record_type: "Opportunity", record_id: dealId }],
        })
      ).status,
    ).toBe(201);
    // The server draws links from each reader's access (T1b); here the read is narrowed to prove the page's drawing.
    await page.route(`**/api/v1/conversations/${thread}`, async (route) => {
      try {
        const response = await route.fetch();
        const body = await response.json();
        for (const m of body.messages) m.mentions = m.mentions.map((x: { kind: string; ordinal: number }) => (x.kind === "Record" ? { ordinal: x.ordinal, kind: "Record", can_open: false } : x));
        await route.fulfill({ response, json: body });
      } catch {
        // The page cancelled this read (a superseded or repeated request); the next read is intercepted the same way.
      }
    });
    await page.goto(`/conversations/${thread}`);
    const hidden = page.getByRole("log").getByText("A record you can't open");
    await expect(hidden).toBeVisible();
    await expect(page.getByRole("log").getByRole("link", { name: /OPP-/ })).toHaveCount(0);
  });

  test("T1c-1 access withdrawn between reads", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asked);
    await page.goto(`/conversations/${thread}`);
    await expect(page.getByRole("log").getByText(/when does the controller arrive/)).toBeVisible();
    await page.route(`**/api/v1/conversations/${thread}`, (route) =>
      route.fulfill({ status: 404, json: { code: "RecordUnavailable", message: "This record is unavailable." } }),
    );
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByText("This conversation isn't available to you")).toBeVisible();
    await expect(page.getByText(/when does the controller arrive/)).toHaveCount(0);
  });

  test("T1c-1 sidebar marks the open thread and the desktop opens one", async ({ page, isMobile }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asked);
    await page.goto(`/conversations/${thread}`);
    await expect(page.locator(`.cv-sidebar a[href="/conversations/${thread}"]`)).toHaveAttribute("aria-current", "page");
    if (isMobile) return;
    await page.goto("/conversations");
    await expect(page).toHaveURL(/\/conversations\/[0-9a-f-]{36}$/);
  });

  test("T1c-1 phone thread has Back to the list", async ({ page, isMobile }) => {
    test.skip(!isMobile, "the desktop shows the list beside the thread");
    const { thread } = await askedThread(page);
    await signIn(page, asked);
    await page.goto(`/conversations/${thread}`);
    await page.getByRole("link", { name: "Back to conversations" }).click();
    await expect(page).toHaveURL(/\/conversations$/);
    await expect(page.getByRole("navigation", { name: "Conversations" })).toBeVisible();
  });

  test("T1c-1 tablet keeps sidebar and thread", async ({ page, isMobile }) => {
    test.skip(isMobile, "tablet width is a desktop-browser layout");
    const { thread, title } = await askedThread(page);
    await signIn(page, asked);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`/conversations/${thread}`);
    await expect(page.getByRole("navigation", { name: "Conversations" })).toBeVisible();
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  });
});
