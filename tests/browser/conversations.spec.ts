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
