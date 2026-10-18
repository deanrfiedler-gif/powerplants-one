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
    // The next re-read must not bring the withdrawn thread back while it loads (final review I3).
    await page.unroute(`**/api/v1/conversations/${thread}`);
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(`**/api/v1/conversations/${thread}`, async (route) => {
      await held;
      await route.fulfill({ status: 404, json: { code: "RecordUnavailable", message: "This record is unavailable." } });
    });
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByText(/when does the controller arrive/)).toHaveCount(0);
    await page.waitForTimeout(1500);
    await expect(page.getByText(/when does the controller arrive/)).toHaveCount(0);
    release();
    await expect(page.getByText("This conversation isn't available to you")).toBeVisible();
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

test.describe("T1c-1 composer and New thread", () => {
  async function askedName(page: Page) {
    const id = await signIn(page, asked);
    return { id, name: ((await (await page.request.get("/api/v1/local-session")).json()) as { display_name: string }).display_name };
  }

  test("T1c-1 New thread with an ask", async ({ page }) => {
    const person = await askedName(page);
    await signIn(page, asker);
    const deal = crmCreate();
    expect((await api(page, "crm/opportunities", deal)).status).toBe(201);
    const number = (await api<{ items: { display_number: string }[] }>(page, `crm/opportunities/${deal.id}`)).body.items[0].display_number;
    await page.goto("/conversations?new=1");
    const dialog = page.getByRole("dialog", { name: "New thread" });
    await dialog.getByRole("combobox", { name: "About" }).fill(number);
    await dialog.getByRole("option", { name: new RegExp(number) }).click();
    const message = dialog.getByRole("textbox", { name: "Message" });
    await message.fill("Where is the controller? ");
    await dialog.getByRole("button", { name: "Tag a person" }).click();
    await dialog.getByRole("option", { name: person.name }).click();
    await expect(message).toHaveValue(`Where is the controller? @${person.name} `);
    const askSwitch = dialog.getByRole("switch", { name: `Ask ${person.name}` });
    await expect(askSwitch).toHaveAttribute("aria-checked", "false");
    await askSwitch.click();
    await dialog.getByRole("textbox", { name: `Question for ${person.name}` }).fill("SYN delivery date");
    await dialog.getByLabel(`Reply by for ${person.name}`).fill("2026-10-30");
    await expect(dialog.getByText("Title: Where is the controller?")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(dialog.getByText("Switch on Ask for anyone you're asking a question; you can add a reply-by date.")).toBeVisible();
    await dialog.getByRole("button", { name: "Start thread" }).click();
    await expect(page).toHaveURL(/\/conversations\/[0-9a-f-]{36}$/);
    await expect(page.getByText(`Waiting on ${person.name} · SYN delivery date`)).toBeVisible();
  });

  test("T1c-1 the @ picker lists only people who can read the record", async ({ page }) => {
    const { thread, dealId } = await askedThread(page);
    await signIn(page, asker);
    const people = (await api<{ items: { display_name: string }[] }>(page, `conversations/people?anchor_type=Opportunity&anchor_id=${dealId}`)).body.items;
    await page.goto(`/conversations/${thread}`);
    await page.getByRole("button", { name: "Tag a person" }).click();
    const options = page.getByRole("listbox", { name: "People" }).getByRole("option");
    await expect(options).toHaveCount(people.length);
    await expect(options).toHaveText(people.map((p) => p.display_name));
  });

  test("T1c-1 pickers and the Ask switch are accessible", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    const message = page.getByRole("textbox", { name: "Message" });
    await message.fill("Hello ");
    await message.press("@");
    const find = page.getByRole("combobox", { name: "Find a person" });
    await expect(find).toBeFocused();
    await expect(page.getByRole("listbox", { name: "People" }).getByRole("option").first()).toBeVisible();
    await find.press("ArrowDown");
    await find.press("Enter");
    await expect(message).toHaveValue(/^Hello @.+ $/);
    await expect(page.getByRole("switch").first()).toHaveAttribute("aria-checked", "false");
  });

  test("T1c-1 the draft survives a re-read", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    const message = page.getByRole("textbox", { name: "Message" });
    await message.fill("Draft in progress ");
    await page.getByRole("button", { name: "Tag a person" }).click();
    await page.getByRole("listbox", { name: "People" }).getByRole("option").first().click();
    const typed = await message.inputValue();
    const reread = page.waitForResponse((r) => r.url().endsWith(`/api/v1/conversations/${thread}`) && r.request().method() === "GET");
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await reread;
    await expect(message).toHaveValue(typed);
    await expect(page.getByRole("switch").first()).toBeVisible();
  });

  test("T1c-1 a failed send keeps the message", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    await page.route(`**/api/v1/conversations/${thread}/messages`, (route) => route.abort());
    const message = page.getByRole("textbox", { name: "Message" });
    await message.fill("SYN kept after a failure");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(message).toHaveValue("SYN kept after a failure");
    await page.unroute(`**/api/v1/conversations/${thread}/messages`);
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByRole("log").getByText("SYN kept after a failure")).toHaveCount(1);
    await expect(message).toHaveValue("");
  });

  test("T1c-1 a picker failure still lets you send", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.route("**/api/v1/conversations/people**", (route) => route.abort());
    await page.goto(`/conversations/${thread}`);
    await page.getByRole("button", { name: "Tag a person" }).click();
    await expect(page.getByText("People could not be loaded.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("textbox", { name: "Message" }).fill("SYN sent without tags");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByRole("log").getByText("SYN sent without tags")).toBeVisible();
  });
});

test.describe("T1c-1 final review fixes", () => {
  test("T1c-1 a failed re-read keeps the thread and the draft", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    const message = page.getByRole("textbox", { name: "Message" });
    await message.fill("Draft kept through a failed read");
    await page.route(`**/api/v1/conversations/${thread}`, (route) =>
      route.fulfill({ status: 503, json: { code: "DependencyUnavailable", message: "Try again." } }),
    );
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByText("This conversation could not be refreshed.")).toBeVisible();
    await expect(page.getByRole("log").getByText(/when does the controller arrive/)).toBeVisible();
    await expect(message).toHaveValue("Draft kept through a failed read");
  });

  test("T1c-1 the draft survives a resolve elsewhere and a refused post re-reads", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    const message = page.getByRole("textbox", { name: "Message" });
    await message.fill("Draft kept through a resolve");
    // Until the refused post goes out, the page's own re-reads see the thread as it was, so the race with the
    // 30-second refresh cannot hide the composer first.
    const stale = await (await page.request.get(`/api/v1/conversations/${thread}`)).json();
    let posted = false;
    await page.route(`**/api/v1/conversations/${thread}`, (route) => (posted ? route.fallback() : route.fulfill({ json: stale })));
    await page.route(`**/api/v1/conversations/${thread}/messages`, (route) => {
      posted = true;
      return route.fallback();
    });
    const version = (await api<{ version: number }>(page, `conversations/${thread}`)).body.version;
    expect((await api(page, `conversations/${thread}/resolve`, { ...base("Resolve conversation"), expected_version: version })).status).toBe(200);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Reopen this conversation to reply")).toBeVisible();
    await page.getByRole("button", { name: "Reopen" }).click();
    await expect(page.getByRole("textbox", { name: "Message" })).toHaveValue("Draft kept through a resolve");
  });

  test("T1c-1 a pending resolve can be retried", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    await page.route(`**/api/v1/conversations/${thread}/resolve`, (route) => route.abort());
    await page.getByRole("button", { name: "Resolve" }).click();
    await expect(page.getByText("Resolve conversation has not been confirmed.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Resolve" })).toBeDisabled();
    await page.unroute(`**/api/v1/conversations/${thread}/resolve`);
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Reopen this conversation to reply")).toBeVisible();
  });

  test("T1c-1 a pending New thread is shown when the dialog opens again", async ({ page }) => {
    await signIn(page, asker);
    const deal = crmCreate();
    expect((await api(page, "crm/opportunities", deal)).status).toBe(201);
    await page.goto(`/conversations?new=1&record=Opportunity:${deal.id}`);
    const dialog = page.getByRole("dialog", { name: "New thread" });
    await expect(dialog.locator(".cv-about-chosen")).toBeVisible();
    await dialog.getByRole("textbox", { name: "Message" }).fill("SYN pending start");
    await page.route("**/api/v1/conversations", (route) => (route.request().method() === "POST" ? route.abort() : route.fallback()));
    await dialog.getByRole("button", { name: "Start thread" }).click();
    await expect(dialog.getByRole("button", { name: "Retry" })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await page.goto("/conversations?new=1");
    await expect(page.getByRole("dialog", { name: "New thread" }).getByText("“SYN pending start” has not been confirmed.")).toBeVisible();
    await page.unroute("**/api/v1/conversations");
    await page.getByRole("dialog", { name: "New thread" }).getByRole("button", { name: "Retry" }).click();
    await expect(page).toHaveURL(/\/conversations\/[0-9a-f-]{36}$/);
  });

  test("T1c-1 New thread pre-fills a newly created record", async ({ page }) => {
    await signIn(page, asker);
    const deal = crmCreate();
    expect((await api(page, "crm/opportunities", deal)).status).toBe(201);
    const number = (await api<{ items: { display_number: string }[] }>(page, `crm/opportunities/${deal.id}`)).body.items[0].display_number;
    await page.goto(`/conversations?new=1&record=Opportunity:${deal.id}`);
    await expect(page.getByRole("dialog", { name: "New thread" }).locator(".cv-about-chosen")).toContainText(number);
  });

  test("T1c-1 a typed # stays when the picker is dismissed", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    const message = page.getByRole("textbox", { name: "Message" });
    await message.fill("PO ");
    await message.press("End");
    await message.press("#");
    await expect(page.getByRole("combobox", { name: "Find a record" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(message).toBeFocused();
    await message.pressSequentially("4432");
    await expect(message).toHaveValue("PO #4432");
  });
});
