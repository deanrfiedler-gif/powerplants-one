import { test, expect, request as playwrightRequest, type APIRequestContext, type Page } from "@playwright/test";
import { CHANGES, changeScenarioIds, seedChangesScenario } from "../helpers/engineering-changes";
import type { Call, SignIn } from "../helpers/engineering-materials";

// EN-07 Engineering Change-Impact Review. Every journey builds a package of its own through the ordinary API, as the
// fictional people who would do each step, so the persistent development database never makes a rerun fail. The origin
// comes from the project's baseURL, never a literal port. Task-local case labels (EN07-Axx) are from build plan r02.
test.describe.configure({ timeout: 420000 });

const originOf = () => new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:3000").origin;
function people() {
  const origin = originOf(), contexts = new Map<string, APIRequestContext>();
  const as: SignIn = async (profile) => {
    let context = contexts.get(profile);
    if (!context) {
      context = await playwrightRequest.newContext({ baseURL: origin, extraHTTPHeaders: { Origin: origin } });
      const session = await context.post("/api/v1/local-session", { data: { profile } });
      expect(session.ok(), `session for ${profile}`).toBe(true);
      contexts.set(profile, context);
    }
    const call: Call = async (path, body) => {
      const r = await context!.fetch(`/api/v1/${path}`, { method: body ? "POST" : "GET", data: body });
      return { status: r.status(), body: await r.json() };
    };
    return call;
  };
  return { as, dispose: () => Promise.all([...contexts.values()].map((c) => c.dispose())) };
}
async function signIn(page: Page, profile: string, menu: "open" | "closed" | null = null) {
  const session = await page.request.post("/api/v1/local-session", { headers: { Origin: originOf() }, data: { profile } });
  expect(session.ok()).toBe(true);
  const me = (await session.json()) as { workspace_id: string; actor_id: string };
  if (menu) await page.addInitScript(([key, value]) => { try { if (!localStorage.getItem(key)) localStorage.setItem(key, value); } catch { /* storage unavailable */ } }, [`ppo.changes.layout.v1:${me.workspace_id}:${me.actor_id}`, JSON.stringify({ schema_version: 1, menu, columns: [] })]);
  return me;
}
async function build(tag: string) {
  const crew = people(), built = await seedChangesScenario(crew.as, changeScenarioIds(false), ` ${tag}`);
  return { ...crew, ...built, base: `engineering/${built.package_id}/changes`, register: `/engineering/${built.package_id}/changes` };
}
const rows = (page: Page) => page.locator("#ppo-changes .em-register tbody tr");
const colour = (page: Page, selector: string) => page.locator(selector).first().evaluate((e) => getComputedStyle(e).color);
const rgb = (hex: string) => `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;

test("EN07-A03 A04 A05 A06 A08 A10 A53 A57 A58 A59: the register keeps the audited contract, shared menu controls and honest counts", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "Desktop composition; the phone case is below.");
  const s = await build(`register ${Date.now()}`);
  await signIn(page, CHANGES.engineer.profile);
  await page.goto(s.register);
  const root = page.locator("#ppo-changes");
  await expect(rows(page)).toHaveCount(8);

  // A05 A03: first use is collapsed with no residual track; the header names module and destination while it is hidden.
  await expect(root).toHaveAttribute("data-menu", "collapsed");
  await expect(page.locator("#ec-menu")).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Breadcrumb", exact: true }).locator(".ppo-crumbs"))
    .toHaveAttribute("title", "Engineering / Engineering Change-Impact Review / Change register");
  await expect(page.locator(".ppo-crumbs .ppo-crumb")).toHaveText(["Engineering", "Engineering Change-Impact Review", "Change register"]);
  await expect(page.locator(".product-heading .ppo-product-name")).toBeHidden();
  expect(Math.round((await page.locator(".em-register").boundingBox())!.x)).toBe(Math.round((await root.boundingBox())!.x));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Engineering Change-Impact Review: Change register/);
  await expect(page.locator(".module-navigation")).toHaveCount(0);

  // A04 A57: the shared frame retains EN-07's 220px geometry. My Work's newer
  // #271 presentation is checked separately below without redefining this module's baseline.
  await page.getByRole("button", { name: "Show menu" }).first().click();
  await expect(root).toHaveAttribute("data-menu", "docked");
  const menu = page.locator("#ec-menu");
  await expect(menu.locator(".mw-menu-title strong")).toHaveText("Engineering changes");
  await expect(menu.locator(".mw-menu-title span")).toHaveText("Engineering workspace");
  // A58: badges are counts of this whole permitted package, derived from its records.
  await expect(menu.locator("nav a")).toHaveText([/^Change register$/, /^Impact assessment$/, /^Review & decisions\s*2$/, /^Actions & handovers\s*3$/, /^Retest & verification$/, /^Changes & history$/]);
  await expect(menu.locator("nav a[aria-current=page]")).toHaveText("Change register");
  const measure = (scope: string) => page.evaluate((id) => {
    const m = document.querySelector(`${id} .mw-menu`)!, a = m.querySelector("nav a")!, current = m.querySelector("nav a[aria-current=page]")!, icon = a.querySelector(".mw-icon")!, title = m.querySelector(".mw-menu-title strong")!;
    const c = getComputedStyle(m), l = getComputedStyle(a), k = getComputedStyle(current), marker = getComputedStyle(current, "::before"), t = getComputedStyle(title), i = getComputedStyle(icon);
    return { width: Math.round(m.getBoundingClientRect().width), padding: c.padding, border: c.borderRight, background: c.backgroundColor, link: [l.minHeight, l.padding, l.gap, l.borderRadius, l.fontSize, l.lineHeight].join("|"),
      current: [k.backgroundColor, k.fontWeight].join("|"), marker: [marker.width, marker.backgroundColor, marker.left].join("|"), title: [t.fontSize, t.lineHeight, t.fontWeight].join("|"), icon: [i.width, i.height, i.strokeWidth].join("|") };
  }, scope);
  const mine = await measure("#ppo-changes");
  expect(mine.width).toBe(220);
  expect(mine.background).toBe(rgb("#ffffff"));
  expect(mine.current).toBe(`${rgb("#edf0f5")}|500`);
  expect(mine.marker).toBe(`3px|${rgb("#242a37")}|-10px`);
  await page.reload();
  await expect(root).toHaveAttribute("data-menu", "docked"); // the person's later choice persists
  await expect(page.locator(".ppo-crumbs [data-crumb=view]")).toBeHidden();

  // A06: header fill, rows and rules meet the menu divider on the left and the pane edge on the right.
  const flush = async () => {
    const pane = (await page.locator(".em-register").boundingBox())!, table = (await page.locator(".em-register .em-table").boundingBox())!, head = (await page.locator(".em-register thead th").first().boundingBox())!;
    expect(Math.abs(table.x - pane.x)).toBeLessThan(1);
    expect(Math.abs(head.x - pane.x)).toBeLessThan(1);
    expect(table.x + table.width).toBeGreaterThanOrEqual(pane.x + pane.width - 1);
  };
  await flush();
  expect(Math.round((await menu.boundingBox())!.x + 220)).toBe(Math.round((await page.locator(".em-register").boundingBox())!.x));

  // A59: the audited fixture, row for row, from the server.
  const expected = [["Valve assembly substitution", "In review", "21 Sep", "Review required"], ["Pump duty amendment", "Assessing", "21 Sep", "Source changed"], ["Control interface revision", "Decision recorded", "22 Sep", "Cost review"],
    ["Sensor relocation", "In review", "23 Sep", "Review required"], ["Pipework reroute", "Returned", "24 Sep", "Scope clarification"], ["Filter access clearance", "Assessing", "25 Sep", "Evidence needed"],
    ["Commissioning logic update", "Decision recorded", "25 Sep", "Retest failed"], ["Valve isolation arrangement", "Draft", "Date needed", "Assessment needed"]];
  for (const [i, [title, stage, due, attention]] of expected.entries()) {
    const row = rows(page).nth(i);
    await expect(row.locator(".em-row-title")).toHaveText(title);
    await expect(row.locator("td[data-label='Review state']")).toHaveText(stage);
    await expect(row.locator("td[data-label='Due']")).toHaveText(due); // A10: "Date needed" stands alone, with no invented date beside it
    await expect(row.locator("td[data-label='Attention']")).toHaveText(attention);
  }
  await expect(page.locator(".em-table-foot")).toContainText("8 changes · 0 selected");

  // A53: equal conditions render equal tone; the prescribed r22 values are what the browser computes.
  const tones = await page.locator("#ppo-changes .em-register td[data-label='Attention'] .ec-tone").evaluateAll((els) => els.map((e) => [e.textContent, (e as HTMLElement).dataset.tone, getComputedStyle(e).color]));
  const reviewRequired = tones.filter(([text]) => text === "Review required");
  expect(reviewRequired).toHaveLength(2);
  expect(new Set(reviewRequired.map(([, tone, c]) => `${tone}${c}`)).size).toBe(1);
  expect(reviewRequired[0][2]).toBe(rgb("#346580"));
  expect(tones.find(([text]) => text === "Cost review")![2]).toBe(rgb("#80530e"));
  expect(tones.find(([text]) => text === "Retest failed")![2]).toBe(rgb("#993b2a"));
  expect(tones.find(([text]) => text === "Assessment needed")![2]).toBe(rgb("#526078"));
  const states = await page.locator("#ppo-changes .em-register td[data-label='Review state'] .ec-tone").evaluateAll((els) => els.map((e) => [e.textContent, (e as HTMLElement).dataset.tone]));
  expect(states.filter(([text]) => text === "Decision recorded").every(([, tone]) => tone === "neutral")).toBe(true); // an acceptance or a rejection may lie underneath
  expect(new Set(states.filter(([text]) => text === "In review").map(([, tone]) => tone))).toEqual(new Set(["information"]));
  expect(await colour(page, "#ppo-changes .em-context-actions .mw-button-primary")).toBe("rgb(255, 255, 255)");
  expect(await page.locator("#ppo-changes .em-context-actions .mw-button-primary").evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(rgb("#242a37"));

  // A08: inspecting row three ticks nothing, and ticking is separate from inspecting.
  await rows(page).nth(2).getByRole("link", { name: /Inspect SYN-EN07-003/ }).click();
  const inspector = page.getByRole("complementary", { name: /Inspector: SYN-EN07-003/ });
  await expect(inspector.getByRole("heading", { level: 2 })).toHaveText("Control interface revision");
  await expect(page).toHaveURL(/change=/);
  await expect(page.locator(".em-register tbody input:checked")).toHaveCount(0);
  await expect(rows(page).nth(2)).toHaveAttribute("data-inspected", "true");
  await expect(rows(page).nth(2).locator("td").nth(1)).toHaveCSS("background-color", rgb("#edf6e9"));
  await flush();
  // A07: the available width governs docking. At 1440 with the menu docked the register would fall under its usable
  // width, so the inspector overlays it and the register keeps the whole pane; with the menu hidden it docks, and the
  // table ends exactly at the inspector divider with no gutter between them.
  const edges = async () => ({ pane: await page.locator(".em-register").evaluate((e) => Math.round(e.getBoundingClientRect().right)), inspector: Math.round((await inspector.boundingBox())!.x), position: await inspector.evaluate((e) => getComputedStyle(e).position) });
  expect((await edges()).position).toBe("absolute");
  await page.getByRole("button", { name: "Hide menu" }).first().click();
  await expect(root).toHaveAttribute("data-menu", "collapsed");
  const docked = await edges();
  expect(docked.position).not.toBe("absolute");
  expect(Math.abs(docked.pane - docked.inspector)).toBeLessThanOrEqual(1);
  expect(docked.pane - Math.round((await page.locator(".em-register").boundingBox())!.x)).toBeGreaterThanOrEqual(760);
  await flush();
  await page.getByRole("button", { name: "Show menu" }).first().click();
  await page.getByRole("checkbox", { name: /Select SYN-EN07-001/ }).check();
  await expect(page.locator(".em-table-foot")).toContainText("1 selected");
  await expect(rows(page).nth(2)).toHaveAttribute("data-inspected", "true");
  await expect(page.getByRole("region", { name: "Selected changes" })).toContainText("Selection is for export only");
  // Hidden selection is disclosed when a filter hides the ticked row.
  await page.locator(".ec-view select").selectOption("closed");
  await expect(page.getByRole("region", { name: "Selected changes" })).toContainText("not shown by the current filters");
  await page.getByRole("button", { name: "Clear selection" }).click();
  await page.locator(".ec-view select").selectOption("open");
  await page.getByRole("button", { name: "Close inspector" }).click();
  await expect(inspector).toHaveCount(0);
  await flush(); // closing releases the space at once

  // A57: #271 changes My Work's width/surfaces and removes its marker. Both
  // presentations still share the actual frame's link, title, border and icon geometry.
  await page.goto("/work");
  if (await page.locator("#ppo-my-work[data-menu=collapsed]").count()) await page.getByRole("button", { name: "Show menu" }).first().click();
  await expect(page.locator("#ppo-my-work .mw-menu nav a[aria-current=page]")).toBeVisible();
  const shared = await measure("#ppo-my-work");
  expect(shared.width).toBe(240);
  expect(shared.background).toBe(rgb("#f5f6f8"));
  expect(shared.current).toBe(`${rgb("#ffffff")}|500`);
  for (const key of ["padding", "border", "link", "title", "icon"] as const)
    expect(mine[key], key).toEqual(shared[key]);
  // EN-07's preference never touched My Work's key.
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("ppo.changes.")).length)).toBe(1);
  await s.dispose();
});

test("EN07-A54 A55 A56 A60 A25 A44: the inspector projects retained records, and the next action follows the outstanding work", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "Desktop composition.");
  const s = await build(`inspector ${Date.now()}`);
  await signIn(page, CHANGES.engineer.profile);
  await page.goto(`${s.register}?change=${s.selected}`);
  const inspector = page.getByRole("complementary", { name: /Inspector: SYN-EN07-003/ });
  await expect(inspector.locator(".ec-row", { hasText: "Technical decision" })).toContainText("Accepted");
  await expect(inspector.locator(".ec-row", { hasText: "Technical decision" }).locator(".ec-tone")).toHaveAttribute("data-tone", "positive");
  await expect(inspector.locator(".ec-row", { hasText: "Implementation" })).toContainText("Not authorised");
  await expect(inspector.locator(".ec-revisions")).toContainText("E-201 · Revision C");
  await expect(inspector.locator(".ec-revisions")).toContainText("Purpose: Procurement");
  await expect(inspector.locator(".ec-revisions")).toContainText("E-201 · Revision D");
  await expect(inspector.locator(".ec-revisions")).toContainText("Not issued");
  // A54: "Sources current" carries the time of a recorded check, not of this page load.
  await expect(inspector.locator(".ec-sources")).toContainText("Sources current");
  const checked = await inspector.locator(".ec-sources small").innerText();
  expect(checked).toMatch(/^Checked /);
  await page.reload();
  await expect(inspector.locator(".ec-sources small")).toHaveText(checked);
  for (const [label, value] of [["Installed assets", "1 affected"], ["Material lines", "2 affected"], ["Retest", "Required"], ["Cost decision", "Pending"]]) await expect(inspector.locator(".ec-row", { hasText: label })).toContainText(value);
  await expect(inspector.locator(".ec-blocking")).toContainText("Commercial review required");
  await expect(inspector.locator(".ec-blocking")).toHaveCSS("background-color", rgb("#fff2d9"));
  // A55: one line per obligation, each from its own record.
  await expect(inspector.locator(".ec-follow li")).toHaveText([/Revised technical release\s*Not requested/, /Supply Chain review\s*Awaiting response/, /Control interface retest\s*Test pending/]);
  // Another row's "Source changed" does not alter this record's indicator, and the reverse.
  await page.getByRole("link", { name: /Inspect SYN-EN07-002/ }).click();
  await expect(page.getByRole("complementary", { name: /Inspector: SYN-EN07-002/ }).locator(".ec-sources")).toContainText("Source changed");
  await page.getByRole("link", { name: /Inspect SYN-EN07-003/ }).click();
  await expect(inspector.locator(".ec-sources")).toContainText("Sources current");

  // A56 A60: the primary action opens the permitted prerequisite and approves nothing. This identity may read, not resolve.
  await expect(inspector.getByRole("link", { name: "Open commercial review" })).toBeVisible();
  await inspector.getByRole("link", { name: "Open commercial review" }).click();
  await expect(page).toHaveURL(/changes\/handovers\?change=.*panel=commercial/);
  const review = page.getByRole("region", { name: "Commercial and scheduling prerequisites" });
  await expect(review).toContainText("never an actual Project, Finance or booking approval");
  await expect(review).toContainText("Known cost impact AUD 1250.00 excluding tax");
  await expect(review).toContainText("Unknown, not zero: Remobilisation");
  await expect(review.getByRole("button", { name: /Record commercial outcome/ })).toHaveCount(0);
  await expect(review).toContainText("A commercial or scheduling decision belongs to the Project's commercial coordinator");
  await expect(page.getByRole("region", { name: "Requests", exact: true })).toContainText("Awaiting response"); // opening it completed nothing

  // The commercial coordinator resolves it in their own session; the next action is then recomputed for everyone.
  const theirs = await browser.newContext({ baseURL: originOf() }), coordinator = await theirs.newPage();
  await signIn(coordinator, CHANGES.coordinator.profile);
  await coordinator.goto(`/engineering/${s.package_id}/changes/handovers?change=${s.selected}&panel=commercial`);
  const form = coordinator.getByRole("region", { name: "Commercial and scheduling prerequisites" });
  await form.getByLabel("What was decided, and on what basis").fill("SYN cost impact confirmed within the fictional contingency.");
  await form.getByRole("button", { name: "Record commercial outcome" }).click();
  // Wait for the server's recorded outcome, not for a word the outcome picker already contains.
  await expect(form.locator(".ec-item", { hasText: "Commercial review" }).locator(".ec-tone")).toHaveText("Confirmed");
  await expect(form).toContainText("SYN cost impact confirmed within the fictional contingency.");
  await theirs.close();
  await page.goto(`${s.register}?change=${s.selected}`);
  await expect(inspector.locator(".ec-blocking")).toHaveCount(0);
  await expect(inspector.locator(".ec-row", { hasText: "Cost decision" })).toContainText("Confirmed");
  await expect(inspector.getByRole("link", { name: "Open commercial review" })).toHaveCount(0);
  await expect(inspector.locator(".ec-inspector-foot .mw-button-primary")).toHaveText("Review handover");
  // A25: technically accepted and commercially confirmed is still not implementation: the revised release is not issued.
  await expect(inspector.locator(".ec-row", { hasText: "Implementation" })).toContainText("Not authorised");

  // A44: a reader with no commercial duty never receives the amounts, in the page or in the payload behind it.
  const viewer = await s.as(CHANGES.viewer.profile), detail = JSON.stringify((await viewer(`${s.base}/impact?change=${s.selected}`)).body);
  expect(detail).not.toContain("1250.00"); // the amount as written; a bare "1250" can occur inside a content hash
  expect(detail).toContain("Cost detail is limited");
  await s.dispose();
});

test("EN07-A02 A30 A36 A37: a wrong selection leaves nothing on screen, and a lost reply recovers the original requests without a second set", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "Desktop composition.");
  const s = await build(`handover ${Date.now()}`);
  await signIn(page, CHANGES.engineer.profile);
  // A02: a change that does not exist in this package shows nothing in its place, in the register and in a focused view.
  await page.goto(`${s.register}?change=00000000-0000-4000-8000-0000000000aa`);
  await expect(page.getByRole("complementary", { name: "Change inspector" })).toContainText("Change unavailable");
  await page.goto(`${s.register}/handovers?change=00000000-0000-4000-8000-0000000000aa`);
  await expect(page.locator("#ppo-changes .mw-notice[role=alert]")).toContainText("Change unavailable");
  await expect(page.locator(".ec-detail-head")).toHaveCount(0);

  await page.goto(`${s.register}/handovers?change=${s.selected}`);
  const builder = page.getByRole("region", { name: "Prepare requests" });
  await builder.getByRole("button", { name: "Revised release request" }).click();
  await builder.getByLabel("Requested action").fill("SYN prepare and issue E-201 revision D.");
  await builder.getByRole("button", { name: "Preview exact requests" }).click();
  // A30: the confirm button is named for its effect, and the preview says what stays outstanding.
  await expect(builder.getByRole("button", { name: "Request revised technical release" })).toBeEnabled();
  await expect(builder).toContainText("does not issue that release and cannot instruct procurement or field work");
  await expect(builder).toContainText("The revised technical release still has to be issued by its owner");
  // An implementation handover is refused in the same preview, with its reasons beside it.
  await builder.getByRole("button", { name: "Implementation handover" }).click();
  await builder.getByLabel("Requested action").last().fill("SYN replace the interface module.");
  await builder.getByRole("button", { name: "Preview exact requests" }).click();
  await expect(builder.locator(".em-blockers").last()).toContainText("Commercial review is outstanding");
  await expect(builder.getByRole("button", { name: "Create 2 requests" })).toBeDisabled();
  await builder.getByRole("button", { name: "Remove" }).last().click();
  await builder.getByRole("button", { name: "Preview exact requests" }).click();

  // A36 A37: the command runs and its reply is discarded. The outcome is unknown, no new attempt is invited, and
  // recovery returns the original result: one request, not two.
  await builder.locator("summary").click();
  await builder.getByLabel(/Synthetic fault/).check();
  await builder.getByRole("button", { name: "Request revised technical release" }).click();
  await expect(builder.locator(".mw-notice[role=alert]")).toContainText("Outcome unknown");
  await builder.getByRole("button", { name: "Recover the original result" }).click();
  const requests = page.getByRole("region", { name: "Requests", exact: true });
  await expect(requests.locator(".ec-item", { hasText: "Prepare revised technical release" })).toHaveCount(1);
  const call = await s.as(CHANGES.engineer.profile), after = (await call(`${s.base}/handovers?change=${s.selected}`)).body as { selected: { requests: { purpose: string }[] } };
  expect(after.selected.requests.filter((r) => r.purpose === "PrepareRevisedRelease")).toHaveLength(1);
  await page.reload();
  await expect(requests.locator(".ec-item", { hasText: "Prepare revised technical release" })).toHaveCount(1); // it survives a reload
  await s.dispose();
});

test("EN07-A46: a phone reads flush stacked summaries with a full-width inspector, an overlay menu and no page overflow", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile-chromium", "Phone composition.");
  const s = await build(`phone ${Date.now()}`);
  await signIn(page, CHANGES.engineer.profile);
  await page.goto(s.register);
  await expect(rows(page)).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  // The eight-column grid is not shrunk to fit: each change is a stacked summary with its labels in words.
  await expect(rows(page).nth(2).locator("td[data-label='Attention']")).toHaveText("Cost review");
  expect(await rows(page).nth(2).evaluate((e) => getComputedStyle(e).display)).toBe("grid");
  await expect(page.locator("#ppo-changes")).toHaveAttribute("data-menu", "overlay");
  await page.getByRole("button", { name: "Engineering changes menu" }).first().click();
  await expect(page.locator("#ec-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#ec-menu")).toBeHidden();
  await rows(page).nth(2).getByRole("link", { name: /Inspect SYN-EN07-003/ }).click();
  const inspector = page.getByRole("complementary", { name: /Inspector: SYN-EN07-003/ });
  await expect(inspector).toBeVisible();
  expect(Math.round((await inspector.boundingBox())!.width)).toBe(390);
  const primary = (await inspector.getByRole("link", { name: "Open commercial review" }).boundingBox())!;
  expect(primary.height).toBeGreaterThanOrEqual(44);
  await s.dispose();
});
