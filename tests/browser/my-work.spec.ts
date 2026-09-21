import { expect, test, type Page } from "@playwright/test";
import { MY_WORK, seedScenario, type Call } from "../helpers/my-work";

// My Work Sales Overview (design report r03, mockups r06). One synthetic identity owns the whole
// scenario, so its counts reconcile exactly; every record is created and changed through the
// real API and the real page. The tests run in order and share the scenario the first one builds.
test.describe.configure({ mode: "serial" });
// These are the desktop overview's journeys. A phone gets its own presentation of the same reads
// and commands (mobile r07), proved in my-work-mobile.spec.ts.
test.skip(({ isMobile }) => !!isMobile, "The phone overview is proved in my-work-mobile.spec.ts");

const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
const caller = (page: Page): Call => async (path, body) => {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Origin: origin },
    data: body,
  });
  return { status: r.status(), body: await r.json() };
};
const signIn = async (page: Page, profile = MY_WORK.profile) =>
  expect((await page.request.post("/api/v1/local-session", { headers: { Origin: origin }, data: { profile } })).ok()).toBe(true);
const open = async (page: Page, path = "/work") => {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".mw-page")).toHaveAttribute("aria-busy", "false");
};
const attention = (page: Page) => page.getByRole("navigation", { name: "Attention counts" });
const count = (page: Page, label: string) => attention(page).getByRole("link", { name: new RegExp(`^\\d+ ${label}`, "i") });
const row = (page: Page, title: string) => page.locator(".mw-activities .mw-row").filter({ hasText: title });
const local = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Australia/Brisbane", dateStyle: "short", timeStyle: "short" }).format(new Date(iso)).replace(" ", "T");
let scenario: Awaited<ReturnType<typeof seedScenario>>;

test("the overview reconciles its four counts, the list, the schedule and the notices in both menu states", async ({ page }, info) => {
  test.setTimeout(240000);
  await signIn(page);
  scenario = await seedScenario(caller(page));
  await open(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Good (morning|afternoon|evening), /);

  // Four different sets. Two overdue plus four today are the six listed rows; the three
  // appointments repeat three of them; requests and opportunities are other kinds of record.
  await expect(count(page, "overdue")).toHaveAccessibleName(/^2 overdue, activities/);
  await expect(count(page, "due today")).toHaveAccessibleName(/^4 due today, activities/);
  await expect(count(page, "waiting on others")).toHaveAccessibleName(/^2 waiting on others, requests/);
  await expect(count(page, "no next activity")).toHaveAccessibleName(/^2 no next activity, opportunities/);
  await expect(page.getByRole("region", { name: "Overdue, 2" }).locator(".mw-row")).toHaveCount(2);
  await expect(page.getByRole("region", { name: "Today, 4" }).locator(".mw-row")).toHaveCount(4);
  await expect(row(page, "Follow up climate upgrade proposal")).toContainText("2 days overdue");
  await expect(row(page, "Send revised irrigation quotation")).toContainText("1 day overdue");
  await expect(row(page, "Make first contact with new lead")).toContainText("Due by");
  await expect(row(page, "Make first contact with new lead")).toContainText("Greenleaf Nursery · Alex Morgan");
  await expect(row(page, "Attend site assessment")).toContainText("Starts at");
  const schedule = page.locator(".mw-schedule > li");
  await expect(schedule).toHaveCount(3);
  await expect(schedule.nth(0)).toContainText("Call about site assessment");
  await expect(schedule.nth(0)).toContainText("20 min");
  await expect(schedule.nth(0).getByText("Next", { exact: true })).toBeVisible();
  await expect(schedule.nth(2)).toContainText("60 min");
  const gaps = page.getByRole("region", { name: /Needs a next activity/ });
  await expect(gaps.getByText("Cedar Grove Nursery")).toBeVisible();
  await expect(gaps.getByText("Quoting", { exact: true })).toBeVisible();
  await expect(gaps.getByText("Scoping", { exact: true })).toBeVisible();
  const waiting = page.getByRole("region", { name: /Waiting on others/ });
  await expect(waiting.getByText("Morgan Lee, supplier")).toBeVisible();
  await expect(waiting.getByText("Taylor Chen, Engineering")).toBeVisible();
  await expect(page.getByText("1 activity needs a date")).toBeVisible();
  await expect(page.getByText("Prepare Greenview follow-up")).toBeVisible();
  await expect(page.locator("#mw-content").getByText("Synthetic demo data")).toBeVisible();

  // r22 values are read from the rendered components, not judged by eye.
  const style = (selector: string, property: string) =>
    page.locator(selector).first().evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), property);
  expect(await style(".mw-activities .mw-row-title", "color")).toBe("rgb(36, 42, 55)");
  expect(await style(".mw-activities .mw-row-title", "font-weight")).toBe("500");
  expect(await style(".mw-activities .mw-row-title", "font-family")).toMatch(/^Roboto/);
  expect(await style(".mw-schedule .mw-row-title", "color")).toBe("rgb(36, 42, 55)");
  expect(await style(".mw-schedule .mw-row-title", "font-weight")).toBe("500");
  expect(await style(".mw-panel-foot .mw-link", "color")).toBe("rgb(53, 91, 128)");
  expect(await style(".mw-toolbar .mw-button-primary", "background-color")).toBe("rgb(36, 42, 55)");
  expect(await style(".mw-activities", "background-color")).toBe("rgb(255, 255, 255)");
  expect(await style(".mw-activities", "border-top-color")).toBe("rgb(225, 229, 235)");
  expect(await style(".mw-activities", "border-top-left-radius")).toBe("7px");
  expect(await style(".mw-group-overdue", "color")).toBe("rgb(153, 59, 42)");
  expect(await style(".mw-group-overdue", "background-color")).toBe("rgb(255, 241, 237)");
  expect(await style(".mw-row-context .mw-tag", "color")).toBe("rgb(82, 96, 120)");
  expect(await style("#ppo-my-work", "background-color")).toBe("rgb(245, 246, 248)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("overview-expanded.png") });

  // Desktop: the header control and the edge handle both toggle; content, filters and scroll stay.
  const menu = page.getByRole("navigation", { name: "My Work views" });
  await expect(menu.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "All activity types" }).click();
  await page.getByRole("menuitemradio", { name: "Call" }).click();
  await expect(page.locator(".mw-activities .mw-row")).toHaveCount(2);
  // A short window guarantees there is something to scroll, whatever the filter leaves listed.
  await page.setViewportSize({ width: 1440, height: 560 });
  await page.locator("#mw-content").evaluate((node) => node.scrollTo(0, 60));
  const scrolled = await page.locator("#mw-content").evaluate((node) => node.scrollTop);
  expect(scrolled).toBeGreaterThan(0);
  const before = await page.locator(".mw-activities").evaluate((node) => node.getBoundingClientRect().width);
  const header = page.getByRole("banner").getByRole("button", { name: "Hide menu", exact: true });
  await expect(header).toHaveAttribute("aria-expanded", "true");
  await header.click();
  await expect(menu).toBeHidden();
  const show = page.getByRole("banner").getByRole("button", { name: "Show menu", exact: true });
  await expect(show).toHaveAttribute("aria-expanded", "false");
  await expect(show).toBeFocused();
  expect(await page.locator(".mw-activities").evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThan(before);
  await expect(page.locator(".mw-activities .mw-row")).toHaveCount(2);
  await expect(page.getByRole("button", { name: /^Call$/ })).toBeVisible();
  expect(await page.locator("#mw-content").evaluate((node) => node.scrollTop)).toBe(scrolled);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByText("1 activity needs a date")).toBeVisible();
  await page.screenshot({ path: info.outputPath("overview-collapsed.png") });
  await page.reload();
  await expect(page.getByRole("banner").getByRole("button", { name: "Show menu", exact: true })).toBeVisible();
  await expect(menu).toBeHidden();
  // The 24px collapsed strip is the expand target; hover alone never opens it.
  const strip = page.locator(".mw-menu-strip");
  await expect(strip).toHaveJSProperty("offsetWidth", 24);
  await strip.hover();
  await expect(menu).toBeHidden();
  await strip.click();
  await expect(menu.getByRole("link", { name: "Team queue" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("button", { name: "Hide menu", exact: true })).toBeVisible();
});

test("the list and the schedule open the same activity, and closing returns to the control that opened it", async ({ page }) => {
  await signIn(page);
  await open(page);
  const title = row(page, "Call about site assessment").getByRole("button", { name: "Call about site assessment", exact: true });
  await title.click();
  const details = page.getByRole("dialog", { name: "Call about site assessment" });
  await expect(details.getByText("Riverbend Horticulture")).toBeVisible();
  const full = await details.getByRole("link", { name: "Open full activity page" }).getAttribute("href");
  expect(full).toBe(`/work/${scenario.riverbend.action}`);
  await page.keyboard.press("Escape");
  await expect(details).toBeHidden();
  await expect(title).toBeFocused();
  await page.locator(".mw-schedule").getByRole("button", { name: "Call about site assessment", exact: true }).click();
  await expect(details.getByRole("link", { name: "Open full activity page" })).toHaveAttribute("href", full!);
  // Opening details records nothing: the activity is unchanged.
  const read = await caller(page)(`activities/${scenario.riverbend.action}`);
  expect((read.body.items as { version: number; status: string }[])[0]).toMatchObject({ version: 1, status: "Open" });
});

test("completing a lead call records the outcome, plans the next activity and keeps the lead as it was", async ({ page }) => {
  await signIn(page);
  await open(page);
  const call = caller(page);
  const before = (await call(`crm/leads/${scenario.greenleaf.id}`)).body as { status: string; version: number };
  await row(page, "Make first contact with new lead").getByRole("button", { name: /^Complete: / }).click();
  const dialog = page.getByRole("dialog", { name: "Record outcome" });
  await dialog.getByLabel("No answer").check();
  await dialog.getByLabel("Next activity", { exact: true }).fill("Call Alex Morgan again");
  await dialog.getByLabel("Due on a day").check();
  await dialog.getByLabel("Due on", { exact: true }).fill(local(scenario.slots.tomorrow).slice(0, 10));
  const save = dialog.getByRole("button", { name: "Save outcome and next activity" });
  await save.dblclick();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: "Outcome saved" })).toContainText("next activity is planned");
  await expect(row(page, "Make first contact with new lead")).toHaveCount(0);
  await expect(count(page, "due today")).toHaveAccessibleName(/^3 due today/);
  await page.reload();
  await expect(count(page, "due today")).toHaveAccessibleName(/^3 due today/);
  const after = (await call(`crm/leads/${scenario.greenleaf.id}`)).body as { status: string; version: number; next_activity: { summary: string; status: string; due_date_only: boolean }; actions: { status: string }[] };
  expect(after.status).toBe(before.status);
  expect(after.next_activity).toMatchObject({ summary: "Call Alex Morgan again", status: "Open", due_date_only: true });
  // A double click made one completion and one next activity, not two of either.
  expect(after.actions).toHaveLength(2);
  expect((await call(`activities/${scenario.greenleaf.action}`)).body.items).toMatchObject([{ status: "Completed", outcome: "No answer" }]);
});

test("completing a quotation task issues and approves nothing: only the activity changes", async ({ page }) => {
  await signIn(page);
  await open(page);
  const call = caller(page);
  const before = (await call(`crm/opportunities/${scenario.coastal.id}`)).body as Record<string, unknown>;
  await row(page, "Send revised irrigation quotation").getByRole("button", { name: /^Complete: / }).click();
  const dialog = page.getByRole("dialog", { name: "Record outcome" });
  await expect(dialog.getByText(/does not send a message, issue or approve a quotation/)).toBeVisible();
  await dialog.getByLabel("Email handled").check();
  await dialog.getByLabel("No further action now").check();
  await dialog.getByRole("button", { name: "Save outcome", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(count(page, "overdue")).toHaveAccessibleName(/^1 overdue/);
  const after = (await call(`crm/opportunities/${scenario.coastal.id}`)).body as Record<string, unknown>;
  for (const key of ["stage_id", "close_outcome", "version", "value_amount", "next_activity_id"]) expect(after[key]).toEqual(before[key]);
  // Its designated next action is now finished, so the opportunity becomes a planning gap.
  await expect(count(page, "no next activity")).toHaveAccessibleName(/^3 no next activity/);
});

test("rescheduling moves the same appointment in the list and the schedule and keeps the change in its history", async ({ page }) => {
  await signIn(page);
  await open(page);
  const moved = new Date(Date.parse(scenario.slots.meeting.starts_at) + 30 * 60000).toISOString();
  const clock = (iso: string) => {
    const [h, m] = local(iso).slice(11).split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  };
  await row(page, "Discuss screen system scope").getByRole("button", { name: /^Reschedule: / }).click();
  const dialog = page.getByRole("dialog", { name: "Reschedule" });
  await expect(dialog.getByText(/No external calendar is connected/)).toBeVisible();
  await dialog.getByLabel("Starts at", { exact: true }).fill(local(moved));
  await dialog.getByRole("button", { name: "Save change" }).click();
  await expect(dialog.getByRole("alert")).toContainText("reason");
  await dialog.getByLabel("Reason for the change").fill("Customer asked to start half an hour later.");
  await dialog.getByRole("button", { name: "Save change" }).click();
  await expect(dialog).toBeHidden();
  await expect(row(page, "Discuss screen system scope")).toContainText(clock(moved));
  await expect(page.locator(".mw-schedule > li").filter({ hasText: "Discuss screen system scope" })).toContainText(clock(moved));
  await expect(page.locator(".mw-schedule > li")).toHaveCount(3);
  await row(page, "Discuss screen system scope").getByRole("button", { name: "Discuss screen system scope", exact: true }).click();
  const details = page.getByRole("dialog", { name: "Discuss screen system scope" });
  await expect(details.getByText("Customer asked to start half an hour later.")).toBeVisible();
  const read = (await caller(page)(`activities/${scenario.orchard.action}`)).body.items as { version: number; starts_at: string }[];
  expect(read[0]).toMatchObject({ version: 2, starts_at: moved });
});

test("planning a next activity removes only that opportunity's gap; cancelling the form changes nothing", async ({ page }) => {
  await signIn(page);
  await open(page);
  const gaps = page.getByRole("region", { name: /Needs a next activity/ });
  const plan = gaps.getByRole("button", { name: /^Plan activity: Cedar Grove Nursery/ });
  await plan.click();
  const dialog = page.getByRole("dialog", { name: "Plan activity" });
  await expect(dialog.getByText(/Cedar Grove Nursery · Climate control upgrade/)).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(plan).toBeFocused();
  await expect(count(page, "no next activity")).toHaveAccessibleName(/^3 no next activity/);
  await plan.click();
  await dialog.getByLabel("Title").fill("Send climate control quotation summary");
  await dialog.getByLabel("Activity type").selectOption("Email");
  await dialog.getByLabel("Due on a day").check();
  await dialog.getByLabel("Due on", { exact: true }).fill(local(scenario.slots.dayAfter).slice(0, 10));
  await dialog.getByRole("button", { name: "Save activity" }).click();
  await expect(dialog).toBeHidden();
  await expect(gaps.getByText("Cedar Grove Nursery")).toHaveCount(0);
  await expect(gaps.getByText("Valley Fresh Produce")).toBeVisible();
  await expect(count(page, "no next activity")).toHaveAccessibleName(/^2 no next activity/);
  // A future activity plans the opportunity without joining today's list.
  await expect(count(page, "due today")).toHaveAccessibleName(/^3 due today/);
});

test("setting a date updates the same undated activity and clears its notice", async ({ page }) => {
  await signIn(page);
  await open(page);
  await page.getByRole("button", { name: /^Set date/ }).click();
  const dialog = page.getByRole("dialog", { name: "Set a date" });
  await expect(dialog.getByText("Prepare Greenview follow-up")).toBeVisible();
  await dialog.getByLabel("Due on a day").check();
  await dialog.getByLabel("Due on", { exact: true }).fill(local(scenario.slots.tomorrow).slice(0, 10));
  await dialog.getByLabel("Reason for the change").fill("Agreed a day with the customer.");
  await dialog.getByRole("button", { name: "Save change" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/needs? a date/)).toHaveCount(0);
  await expect(count(page, "due today")).toHaveAccessibleName(/^3 due today/);
  const read = (await caller(page)(`activities/${scenario.greenview.action}`)).body.items as Record<string, unknown>[];
  expect(read[0]).toMatchObject({ id: scenario.greenview.action, version: 2, due_needed: false, due_date_only: true, due_at: scenario.slots.tomorrow });
});

test("following up a waiting request records the chase, keeps its age and clears nothing", async ({ page }) => {
  await signIn(page);
  await open(page);
  const waiting = page.getByRole("region", { name: /Waiting on others/ });
  const card = waiting.locator("li").filter({ hasText: "Supplier lead time" });
  const since = await card.getByText(/Since /).textContent();
  await card.getByRole("button", { name: /^Follow up: / }).click();
  const dialog = page.getByRole("dialog", { name: /Record a follow-up/ });
  await expect(dialog.getByText(/does not send anything/)).toBeVisible();
  await dialog.getByLabel("What happened when you followed up?").fill("Rang the supplier; lead time promised by Friday.");
  await dialog.getByLabel("Due on a day").check();
  await dialog.getByLabel("Due on", { exact: true }).fill(local(scenario.slots.dayAfter).slice(0, 10));
  await dialog.getByRole("button", { name: "Save change" }).click();
  await expect(dialog).toBeHidden();
  await expect(count(page, "waiting on others")).toHaveAccessibleName(/^2 waiting on others/);
  await expect(card.getByText(/Since /)).toHaveText(since!);
  const ticket = (await caller(page)(`service/tickets/${scenario.waiting[0]}`)).body.items as { status: string }[];
  expect(ticket[0].status).toBe("NeedsInformation");
});

test("saved views store criteria only: save, modify, reset, pin and retire leave every record alone", async ({ page }, info) => {
  await signIn(page);
  await open(page);
  const listed = await page.locator(".mw-activities .mw-row").count();
  await page.getByRole("button", { name: "All activity types" }).click();
  await page.getByRole("menuitemradio", { name: "Call" }).click();
  await expect(page.getByRole("button", { name: /View: Today's focus · Modified/ })).toBeVisible();
  await page.getByRole("button", { name: /^View: / }).click();
  await page.getByRole("menuitem", { name: "Save or manage views…" }).click();
  const dialog = page.getByRole("dialog", { name: "Saved views" });
  const name = `My calls ${info.project.name}`;
  await dialog.getByLabel("Save the current criteria as").fill(name);
  await dialog.getByRole("button", { name: "Save view" }).click();
  await expect(dialog.getByText(name, { exact: true })).toBeVisible();
  await dialog.locator("li").filter({ hasText: name }).getByRole("button", { name: "Pin" }).click();
  await expect(dialog.locator("li").filter({ hasText: name }).getByRole("button", { name: "Unpin" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: `View: ${name}` })).toBeVisible();
  if (!info.project.use.isMobile) await expect(page.locator("#mw-menu").getByRole("link", { name })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: `View: ${name}` })).toBeVisible();
  await page.getByRole("button", { name: /^Sort: / }).click();
  await page.getByRole("menuitemradio", { name: /^Title/ }).click();
  await expect(page.getByRole("button", { name: new RegExp(`View: ${name} · Modified`) })).toBeVisible();
  await page.getByRole("button", { name: /^View: / }).click();
  await page.getByRole("menuitem", { name: `Reset to “${name}”` }).click();
  await expect(page.getByRole("button", { name: /^Sort: Due time/ })).toBeVisible();
  await page.getByRole("button", { name: /^View: / }).click();
  await page.getByRole("menuitem", { name: "Save or manage views…" }).click();
  page.once("dialog", (confirm) => void confirm.accept());
  await dialog.locator("li").filter({ hasText: name }).getByRole("button", { name: "Retire" }).click();
  await expect(dialog.getByText(name, { exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^View: Today's focus$/ })).toBeVisible();
  await expect(page.locator(".mw-activities .mw-row")).toHaveCount(listed);
});

test("an unread source is never shown as zero, and the team queue is closed to a read-only identity", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/v1/work/overview?**", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: "DependencyUnavailable", message: "SYN overview unavailable.", retryable: true }) }),
  );
  await page.goto("/work");
  await expect(page.getByRole("alert").filter({ hasText: "SYN overview unavailable." })).toContainText("an unread list is not an empty one");
  await expect(attention(page).getByRole("link")).toHaveCount(0);
  await expect(attention(page).getByRole("group", { name: /Overdue: could not be loaded. This is not zero/ })).toBeVisible();
  await expect(attention(page)).not.toContainText("0");
  await page.unroute("**/api/v1/work/overview?**");
  await page.getByRole("alert").getByRole("button", { name: "Try again" }).click();
  await expect(count(page, "overdue")).toBeVisible();

  // The observer can read activities but cannot reassign them: no Team queue link, and the
  // direct address refuses as the read does, not as a hidden menu item.
  await signIn(page, "observer");
  await page.goto("/work/team");
  await expect(page.getByText(/The team queue is for people who can reassign/)).toBeVisible();
  expect((await caller(page)("work/team")).status).toBe(403);
});
