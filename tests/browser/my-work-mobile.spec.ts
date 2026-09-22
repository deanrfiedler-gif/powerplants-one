import { test, myWorkOrigin as origin } from "../helpers/my-work-browser";
import { MY_WORK_NOW } from "../helpers/my-work-clock";
import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { MY_WORK, seedScenario, WEATHER_SAMPLE, type Call } from "../helpers/my-work";

// My Work on a phone (mobile build report r02, mockup r07). The same synthetic identity and the same
// scenario as the desktop journeys, built and changed through the real API and the real page, so the
// counts reconcile exactly. The tests run in order and share the scenario the first one builds.
// The dedicated test server fixes the My Work observation clock to 08:40 on a future
// Brisbane day, including runs across midnight. All records and
// commands remain real. This is browser emulation of a phone, not a physical device.
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => !isMobile, "The desktop overview is proved in my-work.spec.ts");

const caller = (page: Page): Call => async (path, body) => {
  const r = await page.request.fetch(`/api/v1/${path}`, { method: body ? "POST" : "GET", headers: { Origin: origin }, data: body });
  return { status: r.status(), body: await r.json() };
};
const signIn = async (page: Page, profile = MY_WORK.profile) =>
  expect((await page.request.post("/api/v1/local-session", { headers: { Origin: origin }, data: { profile } })).ok()).toBe(true);
const open = async (page: Page) => {
  // Navigation can finish while the coordinator's scoped overview is still
  // being read. Observe that original response before checking its UI commit.
  const [response] = await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.origin === origin && url.pathname === "/api/v1/work/overview" && response.request().method() === "GET";
    }),
    page.goto("/work"),
  ]);
  expect(response.status()).toBe(200);
  expect(await response.finished()).toBeNull();
  await expect(page.locator(".mw-mobile")).toHaveAttribute("aria-busy", "false");
  await expect(agendaCount(page)).not.toContainText("loading");
};
const agendaCount = (page: Page) => page.locator(".mw-agenda-count");
const attention = (page: Page) => page.getByRole("region", { name: "Needs attention" });
const agendaRow = (page: Page, title: string) => page.locator(".mw-agenda-row").filter({ hasText: title });
const local = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Australia/Brisbane", dateStyle: "short", timeStyle: "short" }).format(new Date(iso)).replace(" ", "T");
const dayLabel = (day: string) => {
  const d = new Date(`${day}T12:00:00Z`);
  return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()]} ${d.getUTCDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]}`;
};
const style = (page: Page, selector: string, property: string) =>
  page.locator(selector).first().evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), property);
let scenario: Awaited<ReturnType<typeof seedScenario>>;
let tomorrow: string;

test("the phone overview is one page: header, five-cell bar, Quick Actions, attention, one agenda and follow-ups", async ({ page }, info) => {
  test.setTimeout(240000);
  await signIn(page);
  const overview = await caller(page)("work/overview");
  expect(overview.status).toBe(200);
  expect(overview.body.observed_at).toBe(MY_WORK_NOW);
  scenario = await seedScenario(caller(page), new Date(MY_WORK_NOW));
  tomorrow = local(scenario.slots.tomorrow).slice(0, 10);
  await open(page);

  // Header, left to right on one row: My Work menu, title, search, page guide, account.
  const banner = page.getByRole("banner");
  const boxes = await Promise.all(
    [banner.getByRole("button", { name: "My Work menu", exact: true }), banner.locator(".product-heading"), banner.getByRole("button", { name: "Open global search" }), banner.getByRole("button", { name: "Page guide" }), banner.getByRole("button", { name: "Change identity" })].map(
      async (l) => (await l.boundingBox())!,
    ),
  );
  for (let i = 1; i < boxes.length; i++) expect(boxes[i].x).toBeGreaterThanOrEqual(boxes[i - 1].x + boxes[i - 1].width - 1);
  for (const b of boxes) expect(b.y + b.height).toBeLessThanOrEqual(64);
  await expect(banner.locator(".product-heading")).toHaveText("My Work", { useInnerText: true });
  await expect(banner.locator(".brand-logo:visible")).toHaveCount(0);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Good (morning|afternoon|evening), /);
  await expect(page.locator(".mw-hello .mw-tag")).toHaveText("Sales");
  // The workspace context carries r22's soft brand tint, not an outline.
  expect(await style(page, ".mw-hello .mw-tag", "background-color")).toBe("rgb(234, 241, 229)");
  expect(await style(page, ".mw-hello .mw-tag", "color")).toBe("rgb(69, 98, 59)");

  // The bar: five cells in order, names for assistive technology, nothing to read on screen.
  const bar = page.getByRole("navigation", { name: "Mobile navigation", exact: true });
  expect(await bar.locator(":scope > *").evaluateAll((cells) => cells.map((c) => `${c.tagName}:${c.getAttribute("aria-label")}`))).toEqual(["A:My Work", "A:Deals", "A:Activities", "A:Contacts", "BUTTON:More"]);
  expect(await bar.locator(":scope > * > span").evaluateAll((labels) => labels.every((l) => l.getBoundingClientRect().width <= 1))).toBe(true);
  const cells = await bar.locator(":scope > *").evaluateAll((all) => all.map((c) => Math.round(c.getBoundingClientRect().width)));
  expect(Math.max(...cells) - Math.min(...cells)).toBeLessThanOrEqual(1);
  const current = bar.getByRole("link", { name: "My Work", exact: true });
  await expect(current).toHaveAttribute("aria-current", "page");
  expect(await current.evaluate((n) => getComputedStyle(n).backgroundColor)).toBe("rgb(52, 60, 76)");
  expect(await current.evaluate((n) => getComputedStyle(n).boxShadow)).toContain("rgb(98, 187, 70)");
  await expect(bar.getByRole("link", { name: "Deals", exact: true })).toHaveAttribute("href", "/sales/opportunities");
  await expect(bar.getByRole("link", { name: "Activities", exact: true })).toHaveAttribute("href", `/calendar?day=${scenario.slots.day}`);
  await expect(bar.getByRole("link", { name: "Contacts", exact: true })).toHaveAttribute("href", "/contacts");

  // Quick Actions: four icon tiles in order, each named for assistive technology and nothing to read on
  // screen. This identity holds no mail access, so that tile is a locked image, not a link; no unread
  // number is shown to anyone, because the mailbox records no read state.
  expect(await page.locator(".mw-tile").evaluateAll((tiles) => tiles.map((t) => t.getAttribute("aria-label")))).toEqual(["Emails: outside your current access", "Leads", "Map", "Insights", "Tasks"]);
  expect((await page.locator(".mw-tiles").innerText()).trim()).toBe("");
  await expect(page.getByRole("img", { name: "Emails: outside your current access" })).toBeVisible();
  expect(new Set(await page.locator(".mw-tile").evaluateAll((tiles) => tiles.map((t) => Math.round(t.getBoundingClientRect().top)))).size).toBe(1);
  await expect(page.getByRole("link", { name: "Leads", exact: true })).toHaveAttribute("href", `/sales/leads?owner_id=${MY_WORK.owner}`);
  await expect(page.getByRole("link", { name: "Tasks", exact: true })).toHaveAttribute("href", "/work/actions?activity_type=Task");

  // Needs attention: different units, never summed, every raised category listed. Reviews are outside
  // this identity's access; the rest are calculated from the records.
  const rows = attention(page).locator(".mw-attention-row");
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toHaveText(/^2\s*overdue activities$/);
  await expect(rows.nth(1)).toHaveText(/^1\s*overdue opportunity$/);
  await expect(rows.nth(2)).toHaveText(/^2\s*opportunities without a next activity$/);
  await expect(rows.nth(3)).toHaveText(/^1\s*activity needs a date$/);
  await expect(rows.nth(0)).toHaveAttribute("href", "/work/actions?due=Overdue");
  await expect(rows.nth(3)).toHaveAttribute("href", "/work/actions?due=Needed");
  await expect(attention(page).getByRole("link", { name: "View all" })).toHaveAttribute("href", "/work/actions");
  // Brick is for what is truly overdue, activity or opportunity; a missing next step is neutral.
  expect(await rows.nth(0).locator("strong").evaluate((n) => getComputedStyle(n).color)).toBe("rgb(153, 59, 42)");
  expect(await rows.nth(1).locator("strong").evaluate((n) => getComputedStyle(n).color)).toBe("rgb(153, 59, 42)");
  expect(await rows.nth(2).locator("strong").evaluate((n) => getComputedStyle(n).color)).toBe("rgb(36, 42, 55)");

  // One weekly agenda, Monday first, today selected. The preview says how much it is showing.
  await expect(page.locator(".mw-week")).toHaveCount(1);
  expect(await page.locator(".mw-day span").allTextContents()).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  await expect(page.locator('.mw-day[aria-pressed="true"]')).toHaveAttribute("aria-current", "date");
  // Today is marked by a green tab on its top edge that stops short of the rounded corners.
  expect(
    await page.locator(".mw-day[aria-current=date]").evaluate((day) => {
      const tab = getComputedStyle(day, "::before"),
        card = day.getBoundingClientRect();
      return { colour: tab.backgroundColor, top: tab.top, inset: parseFloat(tab.left) >= parseFloat(getComputedStyle(day).borderTopLeftRadius), foot: getComputedStyle(day).boxShadow, width: Math.round(card.width) > 0 };
    }),
  ).toEqual({ colour: "rgb(98, 187, 70)", top: "-1px", inset: true, foot: "none", width: true });
  await expect(agendaCount(page)).toHaveText(/^Today · 4 activities$/);
  await expect(page.locator(".mw-agenda-row")).toHaveCount(1);
  await expect(page.getByText("1 of 4 shown.")).toBeVisible();
  await page.screenshot({ path: info.outputPath("personal-overview.png") });

  // View day opens the same agenda in place: no second list appears anywhere.
  const viewDay = page.getByRole("button", { name: /^View day/ });
  await expect(viewDay).toHaveAttribute("aria-expanded", "false");
  await viewDay.click();
  await expect(page.locator(".mw-agenda-row")).toHaveCount(4);
  await expect(page.getByRole("button", { name: /^Show less/ })).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".mw-week")).toHaveCount(1);
  // "By" is a deadline, a bare time a booked appointment; Next is the next appointment, not the deadline.
  await expect(agendaRow(page, "Make first contact with new lead").locator("time")).toHaveText(/^By \d{1,2}:\d{2}$/);
  await expect(agendaRow(page, "Make first contact with new lead")).toContainText("Greenleaf Nursery · Lead");
  await expect(agendaRow(page, "Call about site assessment").locator("time")).toHaveText(/^\d{1,2}:\d{2}$/);
  await expect(agendaRow(page, "Call about site assessment")).toContainText("Riverbend Horticulture · 20 min");
  await expect(page.locator(".mw-agenda-row").filter({ hasText: "Next" })).toHaveCount(1);
  await expect(agendaRow(page, "Call about site assessment")).toContainText("Next");
  expect(await page.locator(".mw-agenda-row .mw-agenda-title").allTextContents()).toEqual(["Make first contact with new lead", "Call about site assessment", "Discuss screen system scope", "Attend site assessment"]);

  // Waiting on others, then the opportunity link, which is the same population as the attention row.
  const waiting = page.getByRole("region", { name: /Waiting on others/ });
  await expect(waiting.locator(".mw-count")).toHaveText("2");
  await expect(waiting.getByRole("button", { name: /^Follow up: / })).toHaveCount(2);
  await expect(waiting.getByText(/Morgan Lee, supplier/)).toBeVisible();
  await expect(page.locator(".mw-gap-link")).toHaveText(/^2 opportunities need a next activity$/);

  // The old phone presentation is gone: no summary grid, no toolbar, no inline + Activity, no in-page menu bar.
  await expect(page.locator(".mw-attention, .mw-toolbar, .mw-phone-bar, .mw-activities")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create", exact: true })).toHaveCount(1);

  // r22 values read from the rendered components, and no sideways page scroll.
  expect(await style(page, ".mw-agenda-title", "color")).toBe("rgb(36, 42, 55)");
  expect(await style(page, ".mw-agenda-title", "font-weight")).toBe("500");
  expect(await style(page, ".mw-agenda-title", "font-family")).toMatch(/^Roboto/);
  expect(await style(page, ".mw-fab", "background-color")).toBe("rgb(36, 42, 55)");
  // One navy Create control, square with the theme's elevated-surface radius.
  expect(await page.locator(".mw-fab").evaluate((n) => [n.getBoundingClientRect().width, n.getBoundingClientRect().height, getComputedStyle(n).borderRadius])).toEqual([56, 56, "10px"]);
  expect(await style(page, "#ppo-my-work", "background-color")).toBe("rgb(245, 246, 248)");
  expect(await style(page, ".mw-list-panel", "border-top-color")).toBe("rgb(225, 229, 235)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("agenda-and-follow-ups.png") });

  // Collapsing keeps the day; the state survives opening and closing a detail sheet.
  await agendaRow(page, "Attend site assessment").click();
  const details = page.getByRole("dialog", { name: "Attend site assessment" });
  await expect(details.getByText("Banksia Nurseries")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(details).toBeHidden();
  await expect(agendaRow(page, "Attend site assessment")).toBeFocused();
  await expect(page.locator(".mw-agenda-row")).toHaveCount(4);
  await page.getByRole("button", { name: /^Show less/ }).click();
  await expect(page.locator(".mw-agenda-row")).toHaveCount(1);
});

test("choosing a day changes the agenda and nothing else; other weeks and Today are one press away", async ({ page }) => {
  await signIn(page);
  await open(page);
  const before = await attention(page).locator(".mw-attention-row").allTextContents();
  // Tomorrow holds exactly one owned activity: the first waiting request's chase.
  await page.getByLabel("Go to a date").fill(tomorrow);
  await expect(agendaCount(page)).toHaveText(new RegExp(`^${dayLabel(tomorrow)} · 1 activity$`));
  await expect(page.locator(".mw-agenda-row")).toHaveCount(1);
  await expect(page.locator('.mw-day[aria-pressed="true"]')).toHaveAccessibleName(dayLabel(tomorrow));
  expect(await attention(page).locator(".mw-attention-row").allTextContents()).toEqual(before);
  await expect(page.getByRole("region", { name: /Waiting on others/ }).locator(".mw-count")).toHaveText("2");

  // A day with nothing planned says so, and never invents an appointment.
  const week = await page.locator(".mw-week-nav span").textContent();
  await page.getByRole("button", { name: "Next week" }).click();
  await page.getByRole("button", { name: "Next week" }).click();
  await expect(page.locator(".mw-week-nav span")).not.toHaveText(week!);
  await expect(page.getByText("No activities planned for this day.")).toBeVisible();
  await expect(agendaCount(page)).toContainText("· 0 activities");
  await expect(page.locator(".mw-day[aria-current=date]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(agendaCount(page)).toHaveText(/^Today · 4 activities$/);
  await expect(page.getByRole("button", { name: "Today", exact: true })).toHaveCount(0);
});

test("Create is a six-choice menu in order; Activity carries the visible agenda day and cancelling creates nothing", async ({ page }, info) => {
  await signIn(page);
  await open(page);
  const create = page.getByRole("button", { name: "Create", exact: true });
  await create.click();
  const menu = page.getByRole("dialog", { name: "Create", exact: true });
  expect(await menu.locator(".mw-create-option").evaluateAll((options) => options.map((o) => [o.querySelector("strong")!.textContent, o.querySelector("small")!.textContent]))).toEqual([
    ["Scan business card", "Capture and review contact details"],
    ["Activity", "Call, meeting or task"],
    ["Opportunity", "Start a sales opportunity"],
    ["Lead", "Capture a new enquiry"],
    ["Contact", "Add a person"],
    ["Organisation", "Customer, supplier or other organisation"],
  ]);
  // A menu, not a form; every choice hands over to the record's own canonical form.
  await expect(menu.getByRole("button", { name: /save/i })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: /^Opportunity/ })).toHaveAttribute("href", "/sales/opportunities/new");
  await expect(menu.getByRole("link", { name: /^Lead/ })).toHaveAttribute("href", "/sales/leads?create=1");
  await expect(menu.getByRole("link", { name: /^Contact/ })).toHaveAttribute("href", "/customers/new?kind=person");
  await expect(menu.getByRole("link", { name: /^Organisation/ })).toHaveAttribute("href", "/customers/new?kind=customer");
  await page.screenshot({ path: info.outputPath("create-menu.png") });
  // The background is inert while the sheet is open, and Escape returns focus to the control.
  expect(await page.evaluate(() => document.querySelector(".mw-fab")!.matches(":not(dialog[open] *)") && !!document.querySelector("dialog.mw-sheet:modal"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(create).toBeFocused();

  // Insights needs a reporting module that does not exist, so the tile says so and promises nothing.
  await page.getByRole("button", { name: "Insights", exact: true }).click();
  const insights = page.getByRole("dialog", { name: "Insights" });
  await expect(insights.getByText("Insights are not available yet.")).toBeVisible();
  await expect(insights.getByRole("link")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(insights).toBeHidden();
  await expect(page.getByRole("button", { name: "Insights", exact: true })).toBeFocused();

  // Scanning needs an extraction service that does not exist: it says so and offers the real form.
  await create.click();
  await menu.getByRole("button", { name: /^Scan business card/ }).click();
  const scan = page.getByRole("dialog", { name: "Scan business card" });
  await expect(scan.getByText("Card scanning is not available yet.")).toBeVisible();
  await expect(scan.getByRole("link", { name: "Add the contact manually" })).toHaveAttribute("href", "/customers/new?kind=person");
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await page.keyboard.press("Escape");

  // With another agenda day in view, the activity form starts on that day and says so.
  await page.getByLabel("Go to a date").fill(tomorrow);
  await expect(agendaCount(page)).toContainText(dayLabel(tomorrow));
  const owned = ((await caller(page)("work/actions?owner=mine&status=Active&limit=100")).body.items as unknown[]).length;
  await create.click();
  await expect(menu.getByRole("button", { name: /^Activity/ })).toContainText(`for ${dayLabel(tomorrow)}`);
  await menu.getByRole("button", { name: /^Activity/ }).click();
  const form = page.getByRole("dialog", { name: "New activity" });
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await expect(form.getByRole("note")).toContainText(dayLabel(tomorrow));
  await expect(form.getByLabel("Due on", { exact: true })).toHaveValue(tomorrow);
  await form.getByLabel("Title").fill("SYN not saved");
  page.once("dialog", (confirm) => void confirm.accept());
  await form.getByRole("button", { name: "Cancel" }).click();
  await expect(form).toBeHidden();
  expect(((await caller(page)("work/actions?owner=mine&status=Active&limit=100")).body.items as unknown[]).length).toBe(owned);
});

test("a row opens details; Complete saves through the source command and every affected count follows, after a reload too", async ({ page }, info) => {
  await signIn(page);
  await open(page);
  const call = caller(page);
  const lead = (await call(`crm/leads/${scenario.greenleaf.id}`)).body as { status: string };
  await page.getByRole("button", { name: /^View day/ }).click();
  await agendaRow(page, "Make first contact with new lead").click();
  const details = page.getByRole("dialog", { name: "Make first contact with new lead" });
  // A lead link says Lead; an opportunity link says Opportunity.
  await expect(details.locator("dt").filter({ hasText: /^Lead$/ })).toBeVisible();
  await expect(details.getByText("Brisbane time")).toBeVisible();
  await page.screenshot({ path: info.outputPath("activity-detail.png") });
  await details.getByRole("button", { name: "Complete", exact: true }).click();
  const outcome = page.getByRole("dialog", { name: "Record outcome" });
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await outcome.getByLabel("No answer").check();
  await outcome.getByLabel("No further action now").check();
  await outcome.getByRole("button", { name: "Save outcome", exact: true }).dblclick();
  await expect(outcome).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: "Outcome saved" })).toBeVisible();
  await expect(agendaCount(page)).toHaveText(/^Today · 3 activities$/);
  await expect(agendaRow(page, "Make first contact with new lead")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".mw-mobile")).toHaveAttribute("aria-busy", "false");
  await expect(agendaCount(page)).toHaveText(/^Today · 3 activities$/);
  expect((await call(`activities/${scenario.greenleaf.action}`)).body.items).toMatchObject([{ status: "Completed", outcome: "No answer", version: 2 }]);
  // Completing the activity changed the activity, not the lead it serves.
  expect(((await call(`crm/leads/${scenario.greenleaf.id}`)).body as { status: string }).status).toBe(lead.status);
});

test("Reschedule moves the same appointment to another day: no duplicate, its history kept", async ({ page }) => {
  await signIn(page);
  await open(page);
  const moved = new Date(Date.parse(scenario.slots.meeting.starts_at) + 86400000).toISOString();
  await page.getByRole("button", { name: /^View day/ }).click();
  await agendaRow(page, "Discuss screen system scope").click();
  await page.getByRole("dialog", { name: "Discuss screen system scope" }).getByRole("button", { name: "Reschedule", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Reschedule" });
  await expect(dialog.getByText(/No external calendar is connected/)).toBeVisible();
  await dialog.getByLabel("Starts at", { exact: true }).fill(local(moved));
  await dialog.getByLabel("Reason for the change").fill("Customer asked for the same time tomorrow.");
  await dialog.getByRole("button", { name: "Save change" }).click();
  await expect(dialog).toBeHidden();
  await expect(agendaCount(page)).toHaveText(/^Today · 2 activities$/);
  await page.getByLabel("Go to a date").fill(tomorrow);
  await expect(agendaCount(page)).toHaveText(new RegExp(`^${dayLabel(tomorrow)} · 2 activities$`));
  // The agenda was opened above and stays open across a change of day.
  await expect(page.getByRole("button", { name: /^Show less/ })).toBeVisible();
  await expect(agendaRow(page, "Discuss screen system scope")).toHaveCount(1);
  const read = (await caller(page)(`activities/${scenario.orchard.action}`)).body.items as { version: number; starts_at: string }[];
  expect(read[0]).toMatchObject({ version: 2, starts_at: moved });
});

test("the undated activity stays reachable, and setting its date from the detail sheet updates the same record", async ({ page }) => {
  await signIn(page);
  await open(page);
  await attention(page).getByRole("link", { name: /activity needs a date/ }).click();
  await expect(page).toHaveURL(/\/work\/actions\?due=Needed$/);
  await page.getByRole("button", { name: "Prepare Greenview follow-up", exact: true }).click();
  await page.getByRole("dialog", { name: "Prepare Greenview follow-up" }).getByRole("button", { name: "Set date", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Set a date" });
  await dialog.getByLabel("Due on a day").check();
  await dialog.getByLabel("Due on", { exact: true }).fill(tomorrow);
  await dialog.getByLabel("Reason for the change").fill("Agreed a day with the customer.");
  await dialog.getByRole("button", { name: "Save change" }).click();
  await expect(dialog).toBeHidden();
  const read = (await caller(page)(`activities/${scenario.greenview.action}`)).body.items as Record<string, unknown>[];
  expect(read[0]).toMatchObject({ id: scenario.greenview.action, version: 2, due_needed: false, due_date_only: true, due_at: scenario.slots.tomorrow });
  await open(page);
  await expect(attention(page).getByText(/needs? a date/)).toHaveCount(0);
  // A date-only task has no invented time: it sits under Any time on its day.
  await page.getByLabel("Go to a date").fill(tomorrow);
  await page.getByRole("button", { name: /^View day/ }).click();
  await expect(agendaRow(page, "Prepare Greenview follow-up").locator("time")).toHaveText("Any time");
});

test("Follow up records the chase and clears nothing; Plan activity closes only that opportunity's gap, in both places", async ({ page }) => {
  await signIn(page);
  await open(page);
  const waiting = page.getByRole("region", { name: /Waiting on others/ });
  await waiting.getByRole("button", { name: "Follow up: Supplier lead time" }).click();
  const chase = page.getByRole("dialog", { name: /Record a follow-up/ });
  await expect(chase.getByText(/does not send anything/)).toBeVisible();
  await chase.getByLabel("What happened when you followed up?").fill("Rang the supplier; lead time promised by Friday.");
  await chase.getByLabel("Due on a day").check();
  await chase.getByLabel("Due on", { exact: true }).fill(local(scenario.slots.dayAfter).slice(0, 10));
  await chase.getByRole("button", { name: "Save change" }).click();
  await expect(chase).toBeHidden();
  await expect(waiting.locator(".mw-count")).toHaveText("2");
  expect(((await caller(page)(`service/tickets/${scenario.waiting[0]}`)).body.items as { status: string }[])[0].status).toBe("NeedsInformation");

  await page.locator(".mw-gap-link").click();
  const queue = page.getByRole("dialog", { name: "Opportunities without a next activity" });
  await expect(queue.locator(".mw-gaps > li")).toHaveCount(2);
  await expect(queue.locator(".mw-gaps > li").filter({ hasText: "Cedar Grove Nursery" })).toContainText("Quoting");
  await queue.getByRole("button", { name: /^Plan activity: Cedar Grove Nursery/ }).click();
  const plan = page.getByRole("dialog", { name: "Plan activity" });
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await expect(plan.getByText(/Cedar Grove Nursery · Climate control upgrade/)).toBeVisible();
  await plan.getByLabel("Title").fill("Send climate control quotation summary");
  await plan.getByLabel("Due on a day").check();
  await plan.getByLabel("Due on", { exact: true }).fill(local(scenario.slots.dayAfter).slice(0, 10));
  await plan.getByRole("button", { name: "Save activity" }).click();
  await expect(plan).toBeHidden();
  await expect(attention(page).locator(".mw-attention-row").filter({ hasText: "without a next activity" })).toHaveText(/^1\s*opportunity without a next activity$/);
  await expect(page.locator(".mw-gap-link")).toHaveText(/^1 opportunity needs a next activity$/);
  // The plan is linked to that opportunity as its next action; its stage did not move.
  const cedar = ((await caller(page)(`crm/opportunities/${scenario.cedar.id}`)).body.items as { stage_id: string; next_action_state: string; next_activity: { summary: string } }[])[0];
  expect(cedar.stage_id).toBe("Quoting");
  expect(cedar.next_action_state).not.toBe("Needed");
  expect(cedar.next_activity.summary).toBe("Send climate control quotation summary");
});

test("an overdue opportunity is raised by the Deals worklist's own rule, and leaves when its next action is no longer overdue", async ({ page }) => {
  await signIn(page);
  await open(page);
  const call = caller(page);
  const row = attention(page).locator(".mw-attention-row").filter({ hasText: /overdue opportunit/ });
  await expect(row).toHaveText(/^1\s*overdue opportunity$/);
  // The count is the Deals worklist's "Overdue" state for the same owner, on the active pipeline.
  const worklist = (await call(`crm/opportunities?next_action=Overdue&owner_id=${MY_WORK.owner}&pipeline_definition_id=${MY_WORK.pipeline}&limit=50`)).body.items as { id: string }[];
  expect(worklist.map((o) => o.id)).toEqual([scenario.coastal.id]);
  await row.click();
  const queue = page.getByRole("dialog", { name: "Overdue opportunities" });
  await expect(queue.locator(".mw-gaps > li")).toHaveCount(1);
  await expect(queue.locator(".mw-gaps > li")).toContainText("Irrigation controls");
  await expect(queue.locator(".mw-gaps > li")).toContainText("Coastal Berry Farms");
  await expect(queue.locator(".mw-gaps > li")).toContainText("Send revised irrigation quotation · 1 day overdue");
  await expect(queue.getByRole("link", { name: "Open activity: Send revised irrigation quotation" })).toHaveAttribute("href", `/work/${scenario.coastal.action}`);
  await expect(queue.getByRole("link", { name: /^Open these in Opportunities/ })).toHaveAttribute("href", `/sales/opportunities?next_action=Overdue&owner_id=${MY_WORK.owner}`);
  await page.keyboard.press("Escape");
  await expect(row).toBeFocused();
  // Moving that action to tomorrow, by the ordinary command, ends the overdue state for both the
  // activity and the opportunity it serves. Nothing about the opportunity itself was changed.
  const moved = await call(`activities/${scenario.coastal.action}/update`, {
    operation_id: randomUUID(), schema_version: 1, reason: "Customer asked for the quotation tomorrow.", expected_version: 1,
    owner_id: MY_WORK.owner, summary: "Send revised irrigation quotation", activity_type: "Email",
    due_at: scenario.slots.tomorrow, due_needed: false, due_date_only: true, starts_at: null,
  });
  expect(moved.status).toBeLessThan(300);
  await open(page);
  await expect(attention(page).locator(".mw-attention-row").filter({ hasText: /overdue opportunit/ })).toHaveCount(0);
  await expect(attention(page).locator(".mw-attention-row").first()).toHaveText(/^1\s*overdue activity$/);
});

test("weather is honest: not connected by default, a provider's answer renders, hiding frees the space, and failure blocks nothing", async ({ page }, info) => {
  await signIn(page);
  await open(page);
  const card = page.getByRole("region", { name: "Local weather" });
  await expect(card).toContainText("Weather is not connected");
  await expect(card).not.toContainText("°");

  // Only a stubbed read can show a forecast: the application itself has no provider.
  await page.route("**/api/v1/work/weather**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WEATHER_SAMPLE) }));
  await open(page);
  await expect(card.getByRole("button", { name: /^Weather location: Brisbane/ })).toBeVisible();
  await expect(card).toContainText("23°");
  await expect(card).toContainText("Partly cloudy");
  await expect(card).toContainText("High 27° · Low 17° · Rain chance 20%");
  await page.screenshot({ path: info.outputPath("weather-sample.png") });
  await card.getByRole("button", { name: /^View forecast/ }).click();
  const forecast = page.getByRole("dialog", { name: "Forecast for Brisbane" });
  // A chance of rain and an amount of rain are separate facts.
  await expect(forecast).toContainText("Rain chance 70% · Rainfall 4 mm");
  await expect(forecast).toContainText("Sample values for a test. Not a forecast.");
  await page.keyboard.press("Escape");

  await card.getByRole("button", { name: "Weather options" }).click();
  await page.getByRole("menuitem", { name: "Hide weather" }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".mw-mobile")).toHaveAttribute("aria-busy", "false");
  await expect(card).toHaveCount(0);
  // It comes back from Customise overview, reached through the My Work menu.
  await page.getByRole("banner").getByRole("button", { name: "My Work menu", exact: true }).click();
  await page.getByRole("dialog", { name: "My Work menu" }).getByRole("button", { name: "Customise overview" }).click();
  const customise = page.getByRole("dialog", { name: "Customise overview" });
  await customise.getByLabel("Local weather").check();
  await customise.getByRole("button", { name: "Save layout" }).click();
  await expect(card).toContainText("23°");

  await page.unroute("**/api/v1/work/weather**");
  await page.route("**/api/v1/work/weather**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: "DependencyUnavailable", message: "SYN weather unavailable.", retryable: true }) }));
  await open(page);
  await expect(card).toContainText("Weather could not be loaded.");
  await expect(attention(page).locator(".mw-attention-row").first()).toContainText("overdue");
});

test("an unread source is never zero, the Create control never covers a focused control, and access decides what is offered", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/v1/work/overview?**", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: "DependencyUnavailable", message: "SYN overview unavailable.", retryable: true }) }),
  );
  await page.goto("/work");
  await expect(page.getByRole("alert").filter({ hasText: "SYN overview unavailable." })).toContainText("an unread list is not an empty one");
  await expect(attention(page).getByRole("link", { name: /\d/ })).toHaveCount(0);
  await expect(attention(page)).not.toContainText("Nothing of yours");
  await page.unroute("**/api/v1/work/overview?**");
  await page.getByRole("alert").getByRole("button", { name: "Try again" }).click();
  await expect(attention(page).locator(".mw-attention-row").first()).toContainText("overdue");

  // Clearance at 390 and at 320: focusing any control brings it to rest clear of the floating control,
  // the last record scrolls completely above it, the page never scrolls sideways, and targets are 44px.
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 700 });
    await page.getByRole("button", { name: /^View day/ }).click();
    const report = await page.evaluate(() => {
      const fab = document.querySelector(".mw-fab")!.getBoundingClientRect();
      const covered: string[] = [],
        small: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(".mw-mobile :is(a,button,input):not(.mw-fab)")) {
        el.focus();
        const r = el.getBoundingClientRect();
        const name = (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40);
        if (r.width && r.right > fab.left && r.left < fab.right && r.bottom > fab.top && r.top < fab.bottom) covered.push(name);
        // Links inside a sentence are exempt from the target size, as WCAG 2.5.8 allows.
        if (r.width && !el.closest(".mw-quiet-note,.mw-scope-note,.mw-weather-quiet p,.mw-notice") && Math.min(r.height, el.closest("label")?.getBoundingClientRect().height ?? r.height) < 44) small.push(`${name} ${Math.round(r.height)}`);
      }
      const scroller = document.querySelector("#mw-content")!;
      scroller.scrollTo(0, scroller.scrollHeight);
      const last = document.querySelector(".mw-gap-link")!.getBoundingClientRect();
      return { covered, small, lastClear: last.bottom <= fab.top, fits: document.documentElement.scrollWidth <= window.innerWidth };
    });
    expect(report, `at ${width}px`).toEqual({ covered: [], small: [], lastClear: true, fits: true });
    await page.getByRole("button", { name: /^Show less/ }).click();
  }
  // Icon tiles stay four in a row, even at 320.
  const tiles = await page.locator(".mw-tile").evaluateAll((all) => all.map((t) => Math.round(t.getBoundingClientRect().top)));
  expect(new Set(tiles).size).toBe(1);
  await page.setViewportSize({ width: 390, height: 844 });

  // An observer reads activities but may not change them: details open without Complete or Reschedule,
  // and Create offers nothing this identity could not save.
  await signIn(page, "observer");
  await open(page);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Create", exact: true });
  await expect(menu.getByRole("button", { name: /^Activity/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  // The coordinator holds mail access: Emails opens the synthetic mailbox, still with no unread number.
  await signIn(page, "coordinator");
  // Reproduce the retained CI race: the read can outlast a five-second render
  // assertion. Keep the real response and require open() to await its completion.
  await page.route("**/api/v1/work/overview?**", async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 6000));
    await route.fulfill({ response });
  }, { times: 1 });
  await open(page);
  const emails = page.getByRole("link", { name: "Emails", exact: true });
  await expect(emails).toHaveAttribute("href", "/email");
  await expect(emails).toHaveText("");
});
