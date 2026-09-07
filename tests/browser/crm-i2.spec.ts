import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { CRM, crmCreate, crmAction, crmQualify } from "../helpers/crm";
import { database, closeDatabase } from "../../src/platform/database";
test.describe.configure({ timeout: 120000 });
test.use({ actionTimeout: 15000 });
test.beforeAll(() => { process.loadEnvFile(".env.local"); });
test.afterAll(closeDatabase);
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, { method: body === undefined ? "GET" : "POST", headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000", "Content-Type": "application/json" }, data: body });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function identity(page: Page, profile = "coordinator") {
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
  if (!(await page.getByLabel("Identity", { exact: true }).isVisible())) await page.getByRole("button", { name: "Change identity", exact: true }).click();
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page.getByRole("button", { name: "Use this identity", exact: true }).click();
  await expect(page.locator("#business-profile")).toBeEnabled();
}
async function capture(page: Page, info: TestInfo, scenario: string, top = true) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (top) await page.evaluate(() => scrollTo(0, 0));
  const firstCard = page.locator(".crm-stage[data-selected=true] .crm-card").first();
  const geometry = await firstCard.count() ? await firstCard.boundingBox() : null;
  const bytes = await page.screenshot({ path: info.outputPath(`I2-${scenario}.png`), fullPage: false });
  await writeFile(info.outputPath(`I2-${scenario}.json`), JSON.stringify({ scenario, first_card:geometry, viewport: page.viewportSize(), source_head: process.env.PPO_SOURCE_HEAD, executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim(), run_id: process.env.GITHUB_RUN_ID, run_attempt: process.env.GITHUB_RUN_ATTEMPT, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length }, null, 2));
}
const ids = (page: Page) => page.locator(".crm-workspace [data-opportunity-id]").evaluateAll((elements) => elements.map((e) => e.getAttribute("data-opportunity-id")));
const snapshot = async () => Promise.all(["opportunities", "activities", "activity_links", "opportunity_events", "business_identities", "operation_receipts", "audit_events", "outbox_jobs", "reference_counters"].map(async (table) => (await database().query(`SELECT md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY to_jsonb(t)::text),'')) AS hash FROM ppo.${table} t`)).rows[0].hash));

test("CA-02/03/05/13 Board/Grid preserve canonical IDs, filters, order, phone stage and business records", async ({ page }, info) => {
  await page.goto("/crm/opportunities"); await identity(page);
  const marker = `SYN ${randomUUID().slice(0, 8)}`;
  const actionOwner = randomUUID();
  await database().query("INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN Action colleague')", [actionOwner, CRM.workspace, randomUUID()]);
  await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2 AND capability NOT IN ('crm.opportunity.create','crm.opportunity.edit')", [actionOwner, CRM.owner]);
  const inputs = ["Controls check", "Irrigation review", "Follow-up"].map((title) => ({ ...crmCreate(), title: `${marker} ${title}`, initial_action: { ...crmAction(), summary: "SYN Confirm the site visit" } }));
  inputs[0].initial_action.owner_id = actionOwner;
  for (const input of inputs) await call(page, "crm/opportunities", input);
  await call(page, `crm/opportunities/${inputs[1].id}/qualify`, crmQualify());
  await page.getByLabel("Search opportunities", { exact: true }).fill(marker);
  await expect.poll(() => ids(page)).toHaveLength(3);
  await capture(page, info, "loaded-board");
  if (info.project.use.isMobile) {
    const firstCard = await page.locator('.crm-stage[data-selected="true"] .crm-card').first().boundingBox();
    expect(firstCard).not.toBeNull();
    expect(firstCard!.y + firstCard!.height).toBeLessThanOrEqual(844);
  }
  expect(await page.evaluate(async () => (await document.fonts.load("16px Roboto")).length)).toBeGreaterThan(0);
  const font = await page.request.get("/brand/Roboto-variable.ttf");
  expect(createHash("sha256").update(await font.body()).digest("hex")).toBe("d7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134");
  const logo = page.locator(".brand-logo");
  await expect(logo).toHaveAttribute("src", "/brand/powerplants-logo-green-white.png");
  const original = await page.request.get("/brand/powerplants-logo-green-white.png");
  expect(createHash("sha256").update(await original.body()).digest("hex")).toBe("8d12f0ecc394950cd9eb66964c588efb71c8e6f445390336c245c3f6712b9694");
  await page.getByText("Filters and sort", { exact: true }).click();
  await page.getByLabel("Company", { exact: true }).selectOption(CRM.company);
  await page.getByLabel("Site", { exact: true }).selectOption(CRM.site);
  await page.getByLabel("Opportunity owner", { exact: true }).selectOption(CRM.owner);
  await page.getByLabel("Next action", { exact: true }).selectOption("DueNeeded");
  await page.getByLabel("Sort", { exact: true }).selectOption("Title");
  await expect.poll(() => ids(page)).toHaveLength(3);
  await page.getByRole("button", { name: "Filters and sort", exact: true }).click();
  const before = await snapshot();
  const commands: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/api/v1/") && request.method() !== "GET") commands.push(`${request.method()} ${request.url()}`); });
  const boardIDs = (await ids(page)).sort();
  const gridButton = page.getByRole("button", { name: "List", exact: true });
  await gridButton.focus(); await page.keyboard.press("Enter");
  await expect(gridButton).toHaveAttribute("aria-pressed", "true");
  await expect(gridButton).toBeFocused();
  const exact = await call(page, `crm/opportunities?${new URLSearchParams({ q: marker, company_id: CRM.company, site_id: CRM.site, owner_id: CRM.owner, next_action: "DueNeeded", sort: "Title" })}`);
  expect(await ids(page)).toEqual(exact.items.map((i: { id: string }) => i.id));
  expect((await ids(page)).sort()).toEqual(boardIDs);
  await expect(page.getByRole("table")).toHaveCount(1);
  await expect(page.getByRole("columnheader", { name: "Next action / action owner", exact: true })).toHaveAttribute("scope", "col");
  await expect(page.getByText("Action owner: SYN Action colleague", { exact: true })).toBeVisible();
  await capture(page, info, "loaded-grid");
  const scroll = page.getByRole("region", { name: "Opportunity List — scroll for all columns", exact: true });
  await scroll.evaluate((e) => { e.scrollLeft = 350; e.scrollTop = 100; });
  const sticky = await page.locator(".crm-grid tbody th").first().evaluate((e) => ({ left: e.getBoundingClientRect().left, container: e.closest(".crm-grid-scroll")!.getBoundingClientRect().left, position: getComputedStyle(e).position }));
  expect(sticky.position).toBe("sticky"); expect(Math.abs(sticky.left - sticky.container)).toBeLessThan(3);
  await capture(page, info, "grid-contained-scroll");
  await page.getByRole("button", { name: "Board", exact: true }).click();
  for (const stage of ["Enquiry", "Qualified"]) {
    const rendered = await page.locator(`.crm-stage[aria-labelledby="board-${stage}"] [data-opportunity-id]`).evaluateAll((elements) => elements.map(e => e.getAttribute("data-opportunity-id")));
    expect(rendered).toEqual(exact.items.filter((i: {stage_id:string}) => i.stage_id === stage).map((i: {id:string}) => i.id));
  }
  if (info.project.use.isMobile) {
    await page.getByRole("button", { name: /^Qualified \(/ }).click();
    await page.getByRole("button", { name: "List", exact: true }).click();
    await page.getByRole("button", { name: "Board", exact: true }).click();
    await expect(page.getByRole("button", { name: /^Qualified \(/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: inputs[1].title, exact: true })).toBeVisible();
    await capture(page, info, "phone-retained-qualified-stage");
  }
  expect(commands).toEqual([]);
  expect(await snapshot()).toEqual(before);
  await page.getByRole("button", { name: "List", exact: true }).click();
  await page.getByRole("link", { name: inputs[0].title, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/opportunities/${inputs[0].id}$`));
  await expect(page.getByLabel("Qualification outcome", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: inputs[0].title, exact: true })).toBeVisible();
});

test("CA-02/05/13 I2 pagination, long actions, 320px keyboard and error completeness", async ({ page }, info) => {
  await page.goto("/crm/opportunities"); await identity(page);
  const marker = `SYN page ${randomUUID().slice(0, 8)}`;
  const inputs = Array.from({ length: 12 }, (_, n) => ({ ...crmCreate(), title: `${marker} ${String(n).padStart(2, "0")}`, initial_action: { ...crmAction(), summary: n === 0 ? `SYN ${"X".repeat(1983)}END OF ACTION` : "SYN Arrange follow-up" } }));
  inputs[0].title = `${marker} 00 ${"LongReference".repeat(13)}`.slice(0, 200);
  // Put this valid long-action fixture in the canonical customer's first
  // bounded Activity page so the shared consumer is exercised deterministically.
  const [, time, version, variant, node] = randomUUID().split("-");
  inputs[0].initial_action.id = `00000000-${time}-${version}-${variant}-${node}`;
  for (const input of inputs) await call(page, "crm/opportunities", input);
  await page.getByLabel("Search opportunities", { exact: true }).fill(marker);
  await page.getByText("Filters and sort", { exact: true }).click();
  await page.getByLabel("Sort", { exact: true }).selectOption("Title");
  await page.getByLabel("Page size", { exact: true }).selectOption("10");
  await expect.poll(() => ids(page)).toHaveLength(10);
  await page.getByRole("button", { name: "Filters and sort", exact: true }).click();
  await page.getByRole("button", { name: "List", exact: true }).click();
  const first = await ids(page);
  await expect(page.locator(".crm-action-text").first()).toContainText("END OF ACTION");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByLabel("Search opportunities", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Stage", { exact: true })).toBeFocused();
  await capture(page, info, "320-grid-keyboard");
  await page.getByRole("button", { name: "Board", exact: true }).click();
  await capture(page, info, "320-board-long-action");
  // r08 keeps equal-height previews; the canonical Activity retains all 2,000 characters.
  const actionLink = page.locator("a.crm-action-text").first();
  await expect(actionLink).toHaveText(inputs[0].initial_action.summary);
  await expect(actionLink).toHaveAttribute("href", `/work/${inputs[0].initial_action.id}`);
  const activityPage = await page.context().newPage();
  await activityPage.setViewportSize({ width: 320, height: 844 });
  await activityPage.goto(`/work/${inputs[0].initial_action.id}`);
  await expect(activityPage.getByRole("heading", { level: 1 })).toHaveText(inputs[0].initial_action.summary);
  await activityPage.getByRole("heading", { level: 1 }).evaluate(e => e.scrollIntoView({block:"end"}));
  await capture(activityPage, info, "320-long-action-canonical-detail", false);
  await activityPage.close();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect.poll(() => ids(page)).toHaveLength(2);
  const last = await ids(page);
  expect(new Set([...first, ...last]).size).toBe(12);
  await expect(page.locator(".crm-worklist-stamp")).toContainText("Partial — final page");
  await page.getByRole("button", { name: "List", exact: true }).click();
  expect(await ids(page)).toEqual(last);
  await capture(page, info, "320-final-page-grid");
  await page.setViewportSize(info.project.use.viewport!);
  await call(page, `crm/opportunities/${inputs[0].id}/qualify`, crmQualify());
  const changed = page.waitForResponse(r => r.url().includes("/api/v1/crm/opportunities?") && r.status() === 409);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  expect((await changed).status()).toBe(409);
  await expect(page.locator('.crm-workspace > .business-error[role="alert"]')).toContainText("The permitted results changed");
  await expect(page.locator(".crm-worklist-stamp")).toHaveCount(0);
  expect(await ids(page)).toEqual([]);
  await capture(page, info, "grid-changed-window");
  await page.getByRole("button", { name: "Try loading again", exact: true }).click();
  await expect.poll(() => ids(page)).toHaveLength(10);
  await page.route("**/api/v1/crm/opportunities?**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: "DatabaseUnavailable", message: "Sales records are temporarily unavailable.", retryable: true }) }));
  await page.getByRole("button", { name: "Refresh from start", exact: true }).click();
  await expect(page.locator('.crm-workspace > .business-error[role="alert"]')).toBeVisible();
  await expect(page.locator(".crm-worklist-stamp")).toHaveCount(0);
  expect(await ids(page)).toEqual([]);
  await capture(page, info, "grid-unavailable");
  await page.unroute("**/api/v1/crm/opportunities?**");
  await page.getByRole("button", { name: "Try loading again", exact: true }).click();
  await expect.poll(() => ids(page)).toHaveLength(10);
  const relatedRead = page.waitForResponse(response => {
    const url = new URL(response.url());
    return response.request().method() === "GET" && url.pathname === "/api/v1/activities"
      && url.searchParams.get("object_type") === "Organisation"
      && url.searchParams.get("object_id") === CRM.org;
  });
  await page.goto(`/customers/${CRM.org}`);
  expect((await relatedRead).ok()).toBe(true);
  const related = page.locator(`a[href="/work/${inputs[0].initial_action.id}"]`);
  await expect(related).toHaveText(inputs[0].initial_action.summary);
  await related.focus();
  await related.evaluate(e => e.scrollIntoView({ block: "end" }));
  await capture(page, info, "shared-customer-long-activity", false);
  await page.setViewportSize({ width: 320, height: 844 });
  await related.evaluate(e => e.scrollIntoView({ block: "end" }));
  await capture(page, info, "320-shared-customer-long-activity", false);
});

test("CA-06/10/13 I2 revocation clears list, filter labels and late responses; identity switch clears search", async ({ page }, info) => {
  const user = randomUUID(), token = randomBytes(32).toString("hex");
  await database().query("INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN I2 browser actor')", [user, CRM.workspace, randomUUID()]);
  await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2", [user, CRM.owner]);
  await database().query("INSERT INTO ppo.sessions(token_hash,workspace_id,actor_id,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '1 hour')", [createHash("sha256").update(token).digest("hex"), CRM.workspace, user]);
  await page.context().addCookies([{ name: "ppo_local_session", value: token, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Strict" }]);
  const input = { ...crmCreate(), title: `SYN private ${randomUUID()}`, owner_id: user, initial_action: crmAction(user) };
  await page.goto("/crm/opportunities"); await call(page, "crm/opportunities", input);
  await page.getByLabel("Search opportunities", { exact: true }).fill(input.title);
  await expect.poll(() => ids(page)).toHaveLength(1);
  let release!: () => void, held = false, intercept = true;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/v1/crm/opportunities?**", async (route) => {
    if (!intercept) { await route.continue(); return; }
    intercept = false;
    const response = await route.fetch(); expect(response.ok()).toBe(true); held = true;
    await pending; await route.fulfill({ response });
  });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(() => held).toBe(true);
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'", [user]);
  const deniedList = page.waitForResponse(r => r.url().includes("/api/v1/crm/opportunities?") && r.status() === 403);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  expect((await deniedList).status()).toBe(403);
  await expect(page.locator('.crm-workspace > .business-error[role="alert"]')).toBeVisible();
  await expect(page.getByLabel("Search opportunities", { exact: true })).toHaveCount(0);
  const late = page.waitForResponse((r) => r.url().includes("/api/v1/crm/opportunities?") && r.status() === 200);
  release(); await (await late).finished();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await ids(page)).toEqual([]);
  expect(await page.locator("body").innerText()).not.toContain(input.title);
  expect(await page.locator("body").innerText()).not.toContain(input.initial_action.summary);
  await expect(page.locator(".crm-stage-heading")).toHaveCount(0);
  await capture(page, info, "board-denied-after-revocation");
  expect((await page.request.get(`/api/v1/operations/${input.operation_id}`)).status()).toBe(404);
  await identity(page);
  await expect(page.getByLabel("Search opportunities", { exact: true })).toHaveValue("");
  await page.getByLabel("Search opportunities", { exact: true }).fill(input.title);
  await identity(page, "systems");
  await expect(page.locator('.crm-workspace > .business-error[role="alert"]')).toBeVisible();
  expect(await page.locator("body").innerText()).not.toContain(input.title);
  await capture(page, info, "identity-change-cleared");
});

test("CA-06/13 initial identity must settle before an actor can switch", async ({ page }, info) => {
  await call(page, "local-session", { profile: "systems" });
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/v1/local-session", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    await held;
    await route.fulfill({ response });
  });
  await page.goto("/crm/opportunities");
  const strip = page.getByRole("region", { name: "Local demonstration identity", exact: true });
  await expect(strip).toHaveAttribute("aria-busy", "true");
  await expect(page.getByLabel("Identity", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Use this identity", exact: true })).toBeDisabled();
  await capture(page, info, "identity-loading");
  release();
  await expect(strip).toHaveAttribute("aria-busy", "false");
  await expect(strip).toContainText("SYN Systems");
  await identity(page);
  await expect(strip).toContainText("SYN Coordinator");
  await expect(page.getByLabel("Search opportunities", { exact: true })).toBeVisible();
  expect((await call(page, "local-session")).actor_id).toBe(CRM.owner);
});

test("CA-13 shared brand consumers retain navigation, readable actions and original identity controls", async ({ page }, info) => {
  for (const [path, title] of [["/", "A connected view"], ["/customers", "Customers"], ["/work", "Owned follow-up"], ["/service/reports", "Service review"]]) {
    await page.goto(path);
    if (path !== "/") await identity(page);
    await expect(page.locator("h1")).toContainText(title);
    await expect(page.locator(".brand-logo")).toBeVisible();
    if (info.project.use.isMobile) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await expect(page.getByRole("navigation", { name: "Main navigation", exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "CRM Sales", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Menu", exact: true }).click();
    }
    await capture(page, info, `shared-${path.replaceAll("/", "-") || "overview"}`);
  }
});

test("Accepted r08 shell and board retain full-width stages, fixed headers and shared scrolling", async ({ page }, info) => {
  await page.goto("/crm/opportunities"); await identity(page);
  const marker = `SYN r08 ${randomUUID().slice(0, 8)}`;
  for (let n = 0; n < 10; n++) {
    const input = { ...crmCreate(), title: `${marker} ${n} ${n === 0 ? "Long climate control and irrigation opportunity" : "Controls upgrade"}`, initial_action: { ...crmAction(), summary: n % 2 ? "SYN Confirm installation scope and arrange the next technical review" : "SYN Call customer" } };
    await call(page, "crm/opportunities", input);
    if (n % 2) await call(page, `crm/opportunities/${input.id}/qualify`, crmQualify());
  }
  await page.getByLabel("Search opportunities", { exact: true }).fill(marker);
  await expect.poll(() => ids(page)).toHaveLength(10);
  const board = page.locator(".crm-board-scroll");
  const activeLink = page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "CRM Sales", exact: true });
  if (info.project.use.isMobile) await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(activeLink).toHaveAttribute("aria-current", "page");
  const activeStyle = await activeLink.evaluate(e => ({ fill: getComputedStyle(e).backgroundColor, icon: getComputedStyle(e.querySelector("svg")!).color }));
  expect(activeStyle).toEqual({ fill: "rgb(52, 60, 76)", icon: "rgb(255, 255, 255)" });
  if (info.project.use.isMobile) await page.getByRole("button", { name: "Menu", exact: true }).click();
  for (const width of info.project.use.isMobile ? [390, 320] : [1920, 1440, 1280, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    if (info.project.use.isMobile) expect(await page.locator('.sidebar').evaluate(e => e.getBoundingClientRect().height)).toBe(50);
    await expect.poll(async () => board.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    const boxes = await page.locator('.crm-stage .crm-card:visible').evaluateAll(es => es.map(e => e.getBoundingClientRect().height));
    expect(Math.max(...boxes) - Math.min(...boxes)).toBeLessThan(1);
    const before = await page.locator('.crm-stage-heading:visible').evaluateAll(es => es.map(e => e.getBoundingClientRect().top));
    const firstBefore = await page.locator('.crm-stage:visible .crm-card:first-child').evaluateAll(es => es.map(e => e.getBoundingClientRect().top));
    await board.evaluate(e => { e.scrollTop = 210; });
    expect(await board.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
    const after = await page.locator('.crm-stage-heading:visible').evaluateAll(es => es.map(e => e.getBoundingClientRect().top));
    expect(after.map((y, i) => Math.abs(y - before[i]))).toEqual(before.map(() => 0));
    const firstAfter = await page.locator('.crm-stage:visible .crm-card:first-child').evaluateAll(es => es.map(e => e.getBoundingClientRect().top));
    firstAfter.forEach((y, i) => expect(y).toBeLessThan(firstBefore[i]));
    await capture(page, info, `r08-${width}-shared-scroll`, false);
    const position = await board.evaluate(e => e.scrollTop);
    await page.getByRole("button", { name: "List", exact: true }).click();
    await page.getByRole("button", { name: "Board", exact: true }).click();
    expect(await board.evaluate(e => e.scrollTop)).toBe(position);
    await board.evaluate(e => { e.scrollTop = 0; });
  }
  await page.locator('.crm-stage:visible .crm-owner-label').first().focus();
  await expect(page.locator('.crm-stage:visible .crm-owner-label').first()).toBeFocused();
  await capture(page, info, "r08-owner-keyboard-tooltip", false);
  await page.keyboard.press("Escape");
  await expect(page.locator('.crm-stage:visible .crm-owner-label').first()).toBeFocused();
  expect(await page.locator('.crm-stage:visible .crm-owner-label').first().evaluate(e => getComputedStyle(e, '::after').content)).toBe("none");
});
