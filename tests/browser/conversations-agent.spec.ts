import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmCreate } from "../helpers/crm";

const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN T2c browser proof",
});
async function api(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body ? "POST" : "GET",
    data: body,
    headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
  });
  expect(r.ok()).toBe(true);
  return r.json();
}
async function fixture(page: Page) {
  const reader = await api(page, "local-session", { profile: "crm-receiver" });
  await api(page, "local-session", { profile: "coordinator" });
  const deal = crmCreate();
  await api(page, "crm/opportunities", deal);
  const saved = await api(page, "conversations", {
    ...base(),
    anchor_type: "Opportunity",
    anchor_id: deal.id,
    title: `SYN Carl ${randomUUID().slice(0, 8)}`,
    body: "SYN delivery question",
    mentions: [],
    asks: [],
  });
  return {
    thread: saved.record_id as string,
    reader: reader.actor_id as string,
    deal: deal.id,
  };
}

// Mocked presentation proof. Persisted worker proof lives separately and uses no answer interception.
test("T2c R8 warning offers cancel, confirmed send and a new thread on the same record", async ({
  page,
  isMobile,
}, info) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
  const { thread, reader, deal } = await fixture(page);
  await page.route("**/api/v1/conversations/people?*", async (route) => {
    const r = await route.fetch(),
      body = await r.json();
    body.items = [
      {
        id: reader,
        display_name: "Carl Jensen",
        role: "Role not recorded",
        history_warning: { count: 2, basis: "a".repeat(64) },
      },
    ];
    await route.fulfill({ response: r, json: body });
  });
  await page.goto(`/conversations/${thread}`);
  await page.getByRole("button", { name: "Tag a person", exact: true }).click();
  await page.getByRole("option", { name: /Carl Jensen/ }).click();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  const warning = page.getByRole("dialog", {
    name: "Some earlier sources are unavailable",
  });
  await expect(warning).toBeVisible();
  await expect(warning).toContainText("2 sources");
  await expect(warning.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(isMobile ? 320 : 1440);
  if (isMobile) {
    for (const button of await warning.getByRole("button").all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: info.outputPath("mocked-participant-warning.png"), fullPage: true });
  await warning.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeFocused();
  await expect(
    page.getByRole("textbox", { name: "Message", exact: true }),
  ).toHaveValue("@Carl Jensen ");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(warning).toBeVisible();
  await warning.press("Escape");
  await expect(warning).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await warning
    .getByRole("button", { name: "Start a new thread", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "New thread", exact: true }),
  ).toBeVisible();
  expect(page.url()).toContain(`record=Opportunity%3A${deal}`);
  await page
    .getByRole("dialog", { name: "New thread", exact: true })
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/conversations/${thread}$`));
  await expect(
    page.getByRole("textbox", { name: "Message", exact: true }),
  ).toHaveValue("@Carl Jensen ");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  const posted = page.waitForRequest(
    (r) =>
      r.url().endsWith(`/conversations/${thread}/messages`) &&
      r.method() === "POST",
  );
  await warning
    .getByRole("button", { name: "Add and send", exact: true })
    .click();
  expect((await posted).postDataJSON().participant_acknowledgements).toEqual([
    { person_id: reader, basis: "a".repeat(64) },
  ]);
  await expect(warning).toHaveCount(0);
});

test("T2c keyboard picker distinguishes Agent and person, refuses duplication and keeps atomic editing", async ({
  page,
  isMobile,
}, info) => {
  const { thread, reader } = await fixture(page);
  let enabled = true;
  await page.route("**/api/v1/conversations/people?*", async (route) => {
    const r = await route.fetch();
    await route.fulfill({
      response: r,
      json: {
        items: [
          {
            id: reader,
            display_name: "Carl Jensen",
            role: "Role not recorded",
          },
        ],
        agent: enabled ? { name: "Carl", label: "Carl · AI assistant" } : null,
      },
    });
  });
  await page.goto(`/conversations/${thread}`);
  const message = page.getByRole("textbox", { name: "Message", exact: true });
  await message.pressSequentially("@");
  const search = page.getByRole("combobox", { name: "Find a person" });
  await expect(search).toBeFocused();
  await search.fill("Carl");
  await expect(page.getByRole("option")).toHaveCount(2);
  const popup = await page.locator(".cv-composer > .cv-picker").boundingBox();
  const editor = await message.boundingBox();
  expect(popup!.y + popup!.height).toBeLessThanOrEqual(editor!.y);
  const personRow = await page.getByRole("option", { name: /Carl Jensen/ }).boundingBox();
  expect(personRow!.y + personRow!.height).toBeLessThanOrEqual(page.viewportSize()!.height - (isMobile ? 64 : 0));
  await page.screenshot({ path: info.outputPath("mocked-agent-picker.png"), fullPage: true });
  await search.press("Enter");
  await expect(message).toBeFocused();
  await expect(message).toHaveValue("@Carl ");
  await expect(page.getByRole("switch")).toHaveCount(0);
  await page.getByRole("button", { name: "Tag a person", exact: true }).click();
  await expect(page.getByRole("option", { name: /AI assistant/ })).toHaveCount(
    0,
  );
  await search.press("Escape");
  await message.press("End");
  await message.press("Backspace");
  await message.press("Backspace");
  await expect(message).toHaveValue("");
  enabled = false;
  await page.getByRole("button", { name: "Tag a person", exact: true }).click();
  await expect(page.getByRole("option", { name: /AI assistant/ })).toHaveCount(
    0,
  );
  await expect(page.getByRole("option", { name: /Carl Jensen/ })).toBeVisible();
  await page.getByRole("button", { name: "Close picker", exact: true }).click();
  await expect(search).toHaveCount(0);
  await expect(message).toBeFocused();
});

test("T2c a changed draft invalidates an in-flight participant preflight", async ({ page }) => {
  const { thread, reader } = await fixture(page);
  let release!: () => void, started!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const requested = new Promise<void>(resolve => { started = resolve; });
  let posts = 0;
  await page.route(`**/api/v1/conversations/${thread}/messages`, async route => {
    posts++; await route.continue();
  });
  await page.route("**/api/v1/conversations/people?*", async route => {
    const response = await route.fetch(), body = await response.json();
    body.items = [{ id: reader, display_name: "SYN New reader", role: "Role not recorded" }];
    if (new URL(route.request().url()).searchParams.has("thread_id")) {
      started(); await held;
      body.items[0].history_warning = { count: 1, basis: "a".repeat(64) };
    }
    await route.fulfill({ response, json: body });
  });
  await page.goto(`/conversations/${thread}`);
  await page.getByRole("button", { name: "Tag a person", exact: true }).click();
  await page.getByRole("option", { name: /SYN New reader/ }).click();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await requested;
  const message = page.getByRole("textbox", { name: "Message", exact: true });
  await message.fill("SYN changed while access was checked");
  release();
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeEnabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(message).toHaveValue("SYN changed while access was checked");
  expect(posts).toBe(0);
});

test("T2c a late answer read cannot return content to a different thread", async ({ page }) => {
  const first = await fixture(page), second = await fixture(page);
  const secondView = await api(page, `conversations/${second.thread}`);
  let hold = false, release!: () => void, started!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const requested = new Promise<void>(resolve => { started = resolve; });
  await page.route(`**/api/v1/conversations/${first.thread}`, async route => {
    const response = await route.fetch(), body = await response.json();
    body.messages.push({ ...presentationAnswer(first.reader), body: "SYN first-thread private answer" });
    if (hold) { started(); await held; }
    await route.fulfill({ response, json: body });
  });
  await page.goto(`/conversations/${first.thread}`);
  await expect(page.locator(".cv-agent-message")).toContainText("SYN first-thread private answer");
  hold = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await requested;
  await page.goto(`/conversations/${second.thread}`);
  await expect(page.locator(".cv-thread-header h1")).toHaveText(secondView.title);
  release();
  await expect(page.locator(".cv-agent-message")).toHaveCount(0);
  expect(await page.locator(".cv-workspace").innerHTML()).not.toContain("SYN first-thread private answer");
});

const presentationAnswer = (person: string) => ({
  id: "simulated-answer",
  sequence: 3,
  author_kind: "Agent",
  author_id: null,
  author_name: "Carl · AI assistant",
  created_at: "2026-10-22T00:21:00.000Z",
  mentions: [],
  acted_for: { user_id: person, display_name: "Sam" },
  body: "The deal is in Discovery. [1]\nGap: No delivery date is recorded.\nCoverage: 20 of the available activities were checked; more exist.\n1 source left out because not everyone here can see it.",
  agent: {
    outcome: "Answered",
    adapter: "Simulated",
    label: "Simulated",
    claims: [],
    left_out: 1,
    sources: [
      {
        number: 1,
        can_open: true,
        type: "Activity",
        record_id: "activity",
        label: "CRM Activity · Supplier confirmation and delivery discussion",
        route: "/work/activity",
      },
      { number: 2, can_open: false },
    ],
  },
});

test("T2c answer presentation, source wrapping and outcomes at all four review widths", async ({
  page,
  isMobile,
}, info) => {
  const { thread, reader } = await fixture(page);
  await page.route(`**/api/v1/conversations/${thread}`, async (route) => {
    const response = await route.fetch(),
      body = await response.json();
    body.messages.push(presentationAnswer(reader));
    body.turns = [
      "Queued",
      "Answering",
      "Unavailable",
      "Failed",
      "Discarded",
    ].map((state, i) => ({
      id: `turn-${i}`,
      trigger_message_id: body.messages[0].id,
      state,
      acted_for_id: reader,
      reason: null,
    }));
    await route.fulfill({ response, json: body });
  });
  for (const width of isMobile ? [390, 320] : [1440, 1024]) {
    await page.setViewportSize({ width, height: isMobile ? 844 : 1000 });
    await page.goto(`/conversations/${thread}`);
    const answer = page.locator(".cv-agent-message");
    await expect(answer).toContainText("Simulated");
    await expect(answer).toContainText("Acting for Sam");
    await expect(answer).toContainText("Gap:");
    await expect(answer).toContainText("Coverage:");
    await expect(answer).toContainText("1 source left out");
    await expect(answer.getByRole("link")).toHaveCount(1);
    await expect(page.locator(".cv-turn")).toHaveCount(5);
    await expect(page.locator(".cv-turn")).not.toContainText([
      "budget",
      "credit",
      "permission",
      "switched off",
      "budget",
    ]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const editor = await page.locator(".cv-composer textarea").boundingBox();
    const composer = await page.locator(".cv-composer").boundingBox();
    expect(editor!.width).toBeGreaterThan(composer!.width * 0.8);
    await expect(answer.locator(".cv-agent-avatar")).toHaveCSS(
      "color",
      "rgb(255, 255, 255)",
    );
    await expect(answer.getByRole("link")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
    await answer.scrollIntoViewIfNeeded();
    await info.attach(`geometry-${width}.json`, {
      contentType: "application/json",
      body: JSON.stringify(
        await page
          .locator(".cv-agent-avatar,.cv-source,.cv-composer textarea")
          .evaluateAll((elements) =>
            elements.map((e) => ({
              tag: e.tagName,
              className: e.className,
              html: e.innerHTML,
              width: e.getBoundingClientRect().width,
              color: getComputedStyle(e).color,
              background: getComputedStyle(e).backgroundColor,
              border: getComputedStyle(e).border,
              display: getComputedStyle(e).display,
            })),
          ),
      ),
    });
    if (isMobile)
      expect(
        (await answer.getByRole("link").boundingBox())!.height,
      ).toBeGreaterThanOrEqual(44);
    await page.screenshot({
      path: info.outputPath(`mocked-answer-${width}.png`),
      fullPage: true,
    });
  }
});

test("T2c refreshed projections remove withheld data and a denied refresh never restores the answer", async ({
  page,
}) => {
  const { thread, reader } = await fixture(page);
  let mode: "readable" | "withheld" | "denied" = "readable";
  await page.route(`**/api/v1/conversations/${thread}`, async (route) => {
    if (mode === "denied")
      return route.fulfill({
        status: 404,
        json: {
          code: "RecordUnavailable",
          message: "This record is unavailable.",
        },
      });
    const response = await route.fetch(),
      body = await response.json();
    const answer = presentationAnswer(reader);
    if (mode === "withheld") {
      answer.body = "A statement from a record you can't open";
      answer.agent.sources = [
        { number: 1, can_open: false },
      ] as typeof answer.agent.sources;
    }
    body.messages.push(answer);
    await route.fulfill({ response, json: body });
  });
  await page.goto(`/conversations/${thread}`);
  await expect(page.locator(".cv-agent-message")).toContainText(
    "Supplier confirmation",
  );
  mode = "withheld";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".cv-agent-message")).toContainText(
    "A statement from a record",
  );
  expect(await page.locator(".cv-agent-message").innerHTML()).not.toMatch(
    /Supplier confirmation|\/work\/activity|Discovery/,
  );
  mode = "denied";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByText("This conversation isn't available to you"),
  ).toBeVisible();
  await expect(page.locator(".cv-agent-message")).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".cv-agent-message")).toHaveCount(0);
});
