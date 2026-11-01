import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmCreate } from "../helpers/crm";
import { openPageGuide } from "../helpers/phone-menu";
import { projectInput } from "../helpers/projects";

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
async function api<T = Record<string, unknown>>(
  page: Page,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: T }> {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Origin: origin },
    data: body,
  });
  return { status: r.status(), body: (await r.json()) as T };
}
const base = (reason: string) => ({ schema_version: 1, operation_id: randomUUID(), reason });

// A fresh deal and a thread on it, started by the asker, tagging and asking the asked person.
async function askedThread(
  page: Page,
  title = `SYN T1c-1 ${randomUUID().slice(0, 8)}`,
) {
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
    asks: [{ ordinal: 1, question: "SYN delivery date", reply_by: "2031-12-01" }],
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

  test("T1c-1 no rail item is current and no horizontal scroll at 320 px", async ({
    page,
    isMobile,
  }) => {
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
    expect(
      (
        await api(page, `conversations/${thread}/messages`, {
          ...base("Post a message"),
          body: "SYN 30 October",
        })
      ).status,
    ).toBe(201);
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
          mentions: [
            {
              ordinal: 1,
              kind: "Record",
              record_type: "Opportunity",
              record_id: dealId,
            },
          ],
        })
      ).status,
    ).toBe(201);
    // The server draws links from each reader's access (T1b); here the read is narrowed to prove the page's drawing.
    await page.route(`**/api/v1/conversations/${thread}`, async (route) => {
      try {
        const response = await route.fetch();
        const body = await response.json();
        for (const m of body.messages)
          m.mentions = m.mentions.map((x: { kind: string; ordinal: number }) =>
            x.kind === "Record"
              ? { ordinal: x.ordinal, kind: "Record", can_open: false }
              : x,
          );
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
      route.fulfill({
        status: 404,
        json: {
          code: "RecordUnavailable",
          message: "This record is unavailable.",
        },
      }),
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

  test("T1c-1 sidebar marks the open thread and the desktop opens one", async ({
    page,
    isMobile,
  }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asked);
    await page.goto(`/conversations/${thread}`);
    await expect(
      page.locator(`.cv-sidebar a[href="/conversations/${thread}"]`),
    ).toHaveAttribute("aria-current", "page");
    if (isMobile) return;
    await page.goto("/conversations");
    await expect(page).toHaveURL(/\/conversations\/[0-9a-f-]{36}$/);
  });

  test("T1c-1 phone thread has Back to the list", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "the desktop shows the list beside the thread");
    const { thread } = await askedThread(page);
    await signIn(page, asked);
    await page.goto(`/conversations/${thread}`);
    // The header's own Back (phone header amendment P3) and the thread's in-page link both lead to the list.
    await expect(page.getByRole("banner").locator(".ppo-phone-back")).toHaveAttribute("aria-label", "Back to Conversations");
    await page.getByRole("main").getByRole("link", { name: "Back to conversations" }).click();
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
    return {
      id,
      name: (
        (await (await page.request.get("/api/v1/local-session")).json()) as {
          display_name: string;
        }
      ).display_name,
    };
  }

  test("T1c-1 New thread with an ask", async ({ page }) => {
    const person = await askedName(page);
    await signIn(page, asker);
    const deal = crmCreate();
    expect((await api(page, "crm/opportunities", deal)).status).toBe(201);
    const number = (
      await api<{ items: { display_number: string }[] }>(
        page,
        `crm/opportunities/${deal.id}`,
      )
    ).body.items[0].display_number;
    await page.goto("/conversations?new=1");
    const dialog = page.getByRole("dialog", { name: "New thread" });
    await dialog.getByRole("combobox", { name: "About" }).fill(number);
    await dialog.getByRole("option", { name: new RegExp(number) }).click();
    const message = dialog.getByRole("textbox", { name: "Message" });
    await message.fill("Where is the controller? ");
    await dialog.getByRole("button", { name: "Tag a person" }).click();
    await dialog.getByRole("option", { name: person.name }).click();
    await expect(message).toHaveValue(
      `Where is the controller? @${person.name} `,
    );
    const askSwitch = dialog.getByRole("switch", {
      name: `Ask ${person.name}`,
    });
    await expect(askSwitch).toHaveAttribute("aria-checked", "false");
    await askSwitch.click();
    await dialog
      .getByRole("textbox", { name: `Question for ${person.name}` })
      .fill("SYN delivery date");
    await dialog.getByLabel(`Reply by for ${person.name}`).fill("2031-12-01");
    await expect(dialog.getByText("Title: Where is the controller?")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(dialog.getByText("Switch on Ask for anyone you're asking a question; you can add a reply-by date.")).toBeVisible();
    await dialog.getByRole("button", { name: "Start thread" }).click();
    await expect(page).toHaveURL(/\/conversations\/[0-9a-f-]{36}$/);
    await expect(
      page.getByText(`Waiting on ${person.name} · SYN delivery date`),
    ).toBeVisible();
  });

  test("T1c-1 the @ picker lists only people who can read the record", async ({
    page,
  }) => {
    const { thread, dealId } = await askedThread(page);
    await signIn(page, asker);
    const people = (
      await api<{ items: { display_name: string }[] }>(
        page,
        `conversations/people?anchor_type=Opportunity&anchor_id=${dealId}`,
      )
    ).body.items;
    await page.goto(`/conversations/${thread}`);
    await page.getByRole("button", { name: "Tag a person" }).click();
    const options = page
      .getByRole("listbox", { name: "People" })
      .locator('[role="option"][data-mention-kind="Person"]');
    await expect(options).toHaveCount(people.length);
    await expect(options).toHaveText(
      people.map((p) => `${p.display_name}Person · Role not recorded`),
    );
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
    await page
      .getByRole("listbox", { name: "People" })
      .locator('[role="option"][data-mention-kind="Person"]')
      .first()
      .click();
    const typed = await message.inputValue();
    const reread = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/v1/conversations/${thread}`) &&
        r.request().method() === "GET",
    );
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await reread;
    await expect(message).toHaveValue(typed);
    await expect(page.getByRole("switch").first()).toBeVisible();
  });

  test("T1c-1 a failed send keeps the message", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    await page.route(`**/api/v1/conversations/${thread}/messages`, (route) =>
      route.abort(),
    );
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
  test("T1c-1 a failed re-read keeps the thread and the draft", async ({
    page,
  }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    const message = page.getByRole("textbox", { name: "Message" });
    await message.fill("Draft kept through a failed read");
    await page.route(`**/api/v1/conversations/${thread}`, (route) =>
      route.fulfill({
        status: 503,
        json: { code: "DependencyUnavailable", message: "Try again." },
      }),
    );
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByText("This conversation could not be refreshed.")).toBeVisible();
    await expect(page.getByRole("log").getByText(/when does the controller arrive/)).toBeVisible();
    await expect(message).toHaveValue("Draft kept through a failed read");
  });

  test("T1c-1 the draft survives a resolve elsewhere and a refused post re-reads", async ({
    page,
  }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    const message = page.getByRole("textbox", { name: "Message" });
    await message.fill("Draft kept through a resolve");
    // Until the refused post goes out, the page's own re-reads see the thread as it was, so the race with the
    // 30-second refresh cannot hide the composer first.
    const stale = await (
      await page.request.get(`/api/v1/conversations/${thread}`)
    ).json();
    let posted = false;
    await page.route(`**/api/v1/conversations/${thread}`, (route) =>
      posted ? route.fallback() : route.fulfill({ json: stale }),
    );
    await page.route(`**/api/v1/conversations/${thread}/messages`, (route) => {
      posted = true;
      return route.fallback();
    });
    const version = (
      await api<{ version: number }>(page, `conversations/${thread}`)
    ).body.version;
    expect(
      (
        await api(page, `conversations/${thread}/resolve`, {
          ...base("Resolve conversation"),
          expected_version: version,
        })
      ).status,
    ).toBe(200);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Reopen this conversation to reply")).toBeVisible();
    await page.getByRole("button", { name: "Reopen" }).click();
    await expect(page.getByRole("textbox", { name: "Message" })).toHaveValue("Draft kept through a resolve");
  });

  test("T1c-1 a pending resolve can be retried", async ({ page }) => {
    const { thread } = await askedThread(page);
    await signIn(page, asker);
    await page.goto(`/conversations/${thread}`);
    await page.route(`**/api/v1/conversations/${thread}/resolve`, (route) =>
      route.abort(),
    );
    await page.getByRole("button", { name: "Resolve" }).click();
    await expect(page.getByText("Resolve conversation has not been confirmed.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Resolve" })).toBeDisabled();
    await page.unroute(`**/api/v1/conversations/${thread}/resolve`);
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("Reopen this conversation to reply")).toBeVisible();
  });

  test("T1c-1 a pending New thread is shown when the dialog opens again", async ({
    page,
  }) => {
    await signIn(page, asker);
    const deal = crmCreate();
    expect((await api(page, "crm/opportunities", deal)).status).toBe(201);
    await page.goto(`/conversations?new=1&record=Opportunity:${deal.id}`);
    const dialog = page.getByRole("dialog", { name: "New thread" });
    await expect(dialog.locator(".cv-about-chosen")).toBeVisible();
    await dialog.getByRole("textbox", { name: "Message" }).fill("SYN pending start");
    await page.route("**/api/v1/conversations", (route) =>
      route.request().method() === "POST" ? route.abort() : route.fallback(),
    );
    await dialog.getByRole("button", { name: "Start thread" }).click();
    await expect(dialog.getByRole("button", { name: "Retry" })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await page.goto("/conversations?new=1");
    await expect(page.getByRole("dialog", { name: "New thread" }).getByText("“SYN pending start” has not been confirmed.")).toBeVisible();
    await page.unroute("**/api/v1/conversations");
    await page.getByRole("dialog", { name: "New thread" }).getByRole("button", { name: "Retry" }).click();
    await expect(page).toHaveURL(/\/conversations\/[0-9a-f-]{36}$/);
  });

  test("T1c-1 New thread pre-fills a newly created record", async ({
    page,
  }) => {
    await signIn(page, asker);
    const deal = crmCreate();
    expect((await api(page, "crm/opportunities", deal)).status).toBe(201);
    const number = (
      await api<{ items: { display_number: string }[] }>(
        page,
        `crm/opportunities/${deal.id}`,
      )
    ).body.items[0].display_number;
    await page.goto(`/conversations?new=1&record=Opportunity:${deal.id}`);
    await expect(page.getByRole("dialog", { name: "New thread" }).locator(".cv-about-chosen")).toContainText(number);
  });

  test("T1c-1 a typed # stays when the picker is dismissed", async ({
    page,
  }) => {
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

// T1c-2 (PPO-CONV-T1C-DESIGN 10): the shared top bar's Conversations action and badge (D1, D2, D7) and the 320 px header.
test.describe("T1c-2 top-bar Conversations action", () => {
  const badgeCount = async (page: Page) => (await api<{ unread_threads: number }>(page, "conversations/badge")).body.unread_threads;

  test("T1c-2 the action opens the preferred desktop thread or phone list, counts unread threads and stays current", async ({
    page,
    isMobile,
  }) => {
    const { thread, title } = await askedThread(page);
    await signIn(page, asked);
    const unread = await badgeCount(page);
    expect(unread).toBeGreaterThan(0);
    await page.goto("/work");
    const banner = page.getByRole("banner");
    const action = banner.getByRole("link", { name: /^Conversations/ });
    await expect(action).toHaveAccessibleName(
      `Conversations, ${unread} unread`,
    );
    await expect(action.locator(".ppo-top-badge")).toHaveText(unread > 9 ? "9+" : String(unread));
    await expect(action).not.toHaveAttribute("aria-current", "page");
    await expect(action).toHaveAttribute("href", "/conversations");
    // D1: immediately left of the information (Page guide) icon on desktop. The phone row hides the Page guide
    // button (phone header amendment P4: it is in the Menu), so only Conversations' place at the right is kept there.
    if (!isMobile) expect(await action.evaluate((link) => link.nextElementSibling?.getAttribute("aria-label"))).toBe("Page guide");
    const markedRead = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/v1/conversations/${thread}/read`) &&
        response.request().method() === "POST",
    );
    await action.click();
    // T1c 5.2: desktop automatically opens the newest thread waiting on the viewer (this fixture).
    // Phone stays on the populated list until the viewer chooses a thread; listing alone must not mark it read.
    if (isMobile) {
      const row = page.getByRole("navigation", { name: "Conversations" }).getByRole("link", { name: new RegExp(title) });
      await expect(row).toBeVisible();
      await expect(page).toHaveURL("/conversations");
      await expect(action).toHaveAttribute("aria-current", "page");
      await expect(action).toHaveAccessibleName(
        `Conversations, ${unread} unread`,
      );
      expect(await badgeCount(page)).toBe(unread);
      await expect(row).toHaveAttribute("href", `/conversations/${thread}`);
      await row.click();
    }
    await expect(page).toHaveURL(`/conversations/${thread}`);
    // Opening the thread marks it read; the badge re-reads on the Conversations change event.
    await expect(page.getByText("SYN when does the controller arrive?")).toBeVisible();
    expect((await markedRead).ok()).toBe(true);
    await expect.poll(() => badgeCount(page)).toBe(unread - 1);
    // A phone thread is a record page, whose compact header hides Conversations (phone header amendment P3); the
    // action keeps its name, badge and current state, so those are read from the hidden link there.
    const threadAction = banner.getByRole("link", { name: /^Conversations/, includeHidden: isMobile });
    if (isMobile) await expect(banner.getByRole("link", { name: /^Conversations/ })).toBeHidden();
    const expectedName = unread - 1 ? `Conversations, ${unread - 1} unread` : "Conversations";
    // A hidden element has no computed accessible name, so on a phone the label the action carries is read directly.
    if (isMobile) await expect(threadAction).toHaveAttribute("aria-label", expectedName);
    else await expect(threadAction).toHaveAccessibleName(expectedName);
    await expect(threadAction).toHaveAttribute("aria-current", "page");
    if (isMobile) expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("T1c-2 nothing new shows no badge, and a profile without conversations has no action", async ({ page, isMobile }) => {
    await signIn(page, bystander);
    await page.goto("/work");
    const action = page.getByRole("banner").getByRole("link", { name: /^Conversations/ });
    await expect(action).toHaveAccessibleName("Conversations");
    await expect(action.locator(".ppo-top-badge")).toHaveCount(0);
    await signIn(page, "systems");
    await page.goto("/");
    // On a phone the account trigger is not in the row (it opens from the Menu button), so the Menu button is the control to find.
    await expect(isMobile ? page.getByRole("banner").getByRole("button", { name: /^Menu(,|$)/ }) : page.getByRole("banner").getByRole("button", { name: "Account" }).or(page.getByRole("banner").getByRole("button", { name: /Change identity/ })).first()).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: /^Conversations/ })).toHaveCount(0);
  });

  test("T1c-2 at 320 px the header keeps the page name whole and the Page guide moves into the identity menu", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Phone header departure");
    await signIn(page, asked);
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto("/conversations");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: /^Conversations/ })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Page guide", exact: true })).toBeHidden();
    const header = await page.locator(".ppo-shell-header").evaluate((node) => {
      const title = node.querySelector<HTMLElement>(".ppo-phone-title .ppo-phone-title-text")!;
      const style = getComputedStyle(node);
      return { left: style.paddingLeft, right: style.paddingRight, size: getComputedStyle(title).fontSize, text: title.textContent, whole: title.scrollWidth <= title.clientWidth };
    });
    expect(header).toEqual({ left: "4px", right: "4px", size: "18px", text: "Conversations", whole: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    // Phone header amendment P4: the Page guide is in the Menu at every phone width; Escape returns focus to the Menu button.
    await openPageGuide(page);
    await expect(page.getByRole("dialog", { name: "Page guide", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#shell-phone-menu")).toBeFocused();
  });

  test("T1c-2 a phone record row has no Menu button: its More starts with Open menu and Conversations, and focus returns to More", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "Phone header record row");
    const { thread } = await askedThread(page);
    await signIn(page, asked);
    await page.goto(`/conversations/${thread}`);
    await expect(page.getByText("SYN when does the controller arrive?")).toBeVisible();
    const banner = page.getByRole("banner");
    // Phone header amendment P3: Back and the reference, no Menu button and no Conversations icon; More carries both.
    await expect(banner.getByRole("button", { name: /^Menu(,|$)/ })).toHaveCount(0);
    await expect(banner.getByRole("link", { name: /^Conversations/ })).toBeHidden();
    const more = banner.getByRole("button", { name: "More actions" });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await more.click();
      const items = banner.getByRole("menuitem");
      await expect(items.first()).toHaveText("Open menu");
      await expect(items.nth(1)).toHaveAccessibleName(/^Conversations(, \d+ unread)?$/);
      await items.first().click();
      const menu = page.getByRole("dialog", { name: "More", exact: true });
      await expect(menu).toBeVisible();
      await menu.getByRole("button", { name: "Page guide", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Page guide", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await more.click();
      await items.first().click();
      await expect(menu).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(more).toBeFocused();
    }
    await more.click();
    await banner.getByRole("menuitem", { name: /^Conversations/ }).click();
    await expect(page).toHaveURL(/\/conversations$/);
  });
});

// T1c-3 (PPO-CONV-T1C-DESIGN 11): the context panel, docked at 320 px from 1280 px, a drawer behind the Context button
// below that, and a sheet on phones. Built from the real read: the asked person cannot open projects.
test.describe("T1c-3 context panel", () => {
  // A thread on a fresh deal that tags the asked person and links a project only the asker can open.
  async function contextThread(page: Page) {
    const askedId = await signIn(page, asked);
    await signIn(page, asker);
    const deal = crmCreate();
    expect((await api(page, "crm/opportunities", deal)).status).toBe(201);
    const project = projectInput();
    expect((await api(page, "projects", project)).status).toBe(201);
    const started = await api<{ record_id: string }>(page, "conversations", {
      ...base("Start a conversation"),
      anchor_type: "Opportunity",
      anchor_id: deal.id,
      title: `SYN T1c-3 ${randomUUID().slice(0, 8)}`,
      body: "@{1} SYN when does the controller arrive? See #{2}",
      mentions: [
        { ordinal: 1, kind: "Person", person_id: askedId },
        {
          ordinal: 2,
          kind: "Record",
          record_type: "Project",
          record_id: project.id,
        },
      ],
      asks: [
        { ordinal: 1, question: "SYN delivery date", reply_by: "2031-12-01" },
      ],
    });
    expect(started.status).toBe(201);
    return { thread: started.body.record_id, dealId: deal.id, project };
  }

  test("T1c-3 desktop docks the panel; every item says why; close and reopen", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "the docked panel is a desktop layout");
    const { thread, dealId, project } = await contextThread(page);
    await page.goto(`/conversations/${thread}`);
    const panel = page.getByRole("complementary", { name: "Context", exact: true });
    await expect(panel).toBeVisible();
    expect(Math.round((await panel.boundingBox())!.width)).toBe(320);
    await expect(panel.getByText("Rebuilt from the records each time it opens, from what you can open.")).toBeVisible();
    await expect(panel.getByRole("link", { name: /^Deal .+ · SYN Controls upgrade qualification$/ })).toHaveAttribute("href", `/sales/opportunities/${dealId}`);
    await expect(panel.getByText("The record this thread is about")).toBeVisible();
    await expect(panel.getByText("Can open this deal")).toBeVisible();
    await expect(panel.getByText("Deal owner")).toBeVisible();
    // The asker can open the linked project: it is a related record, with why it is there.
    const related = panel.locator(".cv-context-item", { hasText: project.title });
    await expect(related.locator(".cv-context-why")).toHaveText(/^Mentioned by /);
    await expect(panel.getByText(/: SYN delivery date$/)).toBeVisible();
    await expect(panel.getByText("Open question · reply by 1 Dec 2031")).toBeVisible();
    for (const item of await panel.locator(".cv-context-item").all()) await expect(item.locator(".cv-context-why").first()).toBeVisible();
    // No Carl, pins or exclusions in T1.
    await expect(panel.getByText(/Carl|Pin|Exclude/)).toHaveCount(0);
    // Groups collapse from their headings.
    const heading = panel.getByRole("button", { name: "Contacts" });
    await heading.click();
    await expect(heading).toHaveAttribute("aria-expanded", "false");
    await expect(panel.getByText("Deal owner")).toBeHidden();
    await panel.getByRole("button", { name: "Close context" }).click();
    await expect(panel).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Context", exact: true })).toBeFocused(); await page.getByRole("button", { name: "Context", exact: true }).click();
    await expect(page.getByRole("complementary", { name: "Context", exact: true })).toBeVisible();
    // A second close makes a fresh focus request; keyboard users can reopen without searching for the button.
    await panel.getByRole("button", { name: "Close context" }).click();
    await expect(page.getByRole("button", { name: "Context", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(panel).toBeVisible();
    // The consumed request must not steal focus when the button next mounts because of a viewport change.
    const title = page.getByRole("heading", { level: 1 });
    await title.evaluate((node) => { node.setAttribute("tabindex", "-1"); node.focus(); });
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.getByRole("button", { name: "Context", exact: true })).toBeVisible();
    await expect(title).toBeFocused();
  });

  test("T1c-3 an item the viewer cannot open is absent, title included", async ({
    page,
    isMobile,
  }) => {
    const { thread, project } = await contextThread(page);
    await signIn(page, asked);
    await page.goto(`/conversations/${thread}`);
    if (isMobile) await page.getByRole("button", { name: "Context", exact: true }).click();
    const panel = isMobile ? page.getByRole("dialog", { name: "Context", exact: true }) : page.getByRole("complementary", { name: "Context", exact: true });
    await expect(panel.getByText("The record this thread is about")).toBeVisible();
    await expect(panel.getByText("Can open this deal")).toBeVisible();
    await expect(panel.getByText(project.title)).toHaveCount(0);
    await expect(panel.getByText(/Mentioned by/)).toHaveCount(0);
    await expect(panel.getByText("No related records you can open.")).toBeVisible();
    expect(await panel.evaluate((node, id) => node.innerHTML.includes(id), project.id)).toBe(false);
  });

  test("T1c-3 at 1024 px the panel is behind the Context button, as a drawer", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "tablet width is a desktop-browser layout");
    const { thread } = await contextThread(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`/conversations/${thread}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Context", exact: true })).toHaveCount(0);
    const button = page.getByRole("button", { name: "Context", exact: true });
    await expect(button).toBeVisible();
    await button.click();
    const drawer = page.getByRole("dialog", { name: "Context", exact: true });
    await expect(drawer.getByText("The record this thread is about")).toBeVisible();
    const box = (await drawer.boundingBox())!;
    expect(Math.round(box.width)).toBe(320);
    expect(Math.round(box.x + box.width)).toBe(1024);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test("T1c-3 phone opens the context as a sheet, icon-only at 320 px", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "the sheet is the phone layout");
    const { thread } = await contextThread(page);
    await page.goto(`/conversations/${thread}`);
    const button = page.getByRole("button", { name: "Context", exact: true });
    await expect(button.getByText("Context")).toBeVisible();
    await button.click();
    const sheet = page.getByRole("dialog", { name: "Context", exact: true });
    await expect(sheet.getByText("The record this thread is about")).toBeVisible();
    const box = (await sheet.boundingBox())!;
    expect(Math.round(box.width)).toBe(390);
    expect(Math.round(box.y + box.height)).toBe(844);
    await sheet.getByRole("button", { name: "Close context" }).click();
    await expect(sheet).toHaveCount(0);
    await expect(button).toBeFocused();
    await page.setViewportSize({ width: 320, height: 844 });
    await expect(button).toHaveAccessibleName("Context");
    await expect(button.locator(".cv-context-button-label")).toHaveCSS("position", "absolute");
    await button.click();
    await expect(page.getByRole("dialog", { name: "Context", exact: true }).getByText("The record this thread is about")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});
