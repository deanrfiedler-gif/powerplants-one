import { test, expect, type Page, type Route } from "@playwright/test";
import { compileDiscovery, type DiscoveryInput } from "../../src/estimating/discovery";
import { configurationConfirmations } from "../../src/estimating/configuration";
import { creationIds, creationFormFixture, creationContextFixture, creationChoicesFixture } from "../helpers/discovery-creation";
import { CRM } from "../helpers/crm";

type State = {
  choices: "normal" | "empty" | "loading" | "denied";
  create: "held" | "lost" | "duplicate" | "denied";
  recovery: "denied" | "absent";
  refreshDenied: boolean;
  requests: Record<string, unknown>[];
};
async function fixture(page: Page) {
  const state: State = { choices: "normal", create: "held", recovery: "denied", refreshDenied: false, requests: [] };
  const reply = (route: Route, value: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(value) });
  await page.route("**/api/v1/**", async route => {
    const path = new URL(route.request().url()).pathname.replace("/api/v1/", "");
    if (path === "local-session") return reply(route, { actor_id: CRM.owner, workspace_id: CRM.workspace, display_name: "Riley" });
    if (path === "shell/context") return reply(route, { display_name: "Riley", preference_scope: "es02-creation-proof", can_preview: false, navigation: ["home", "work", "calendar", "deals", "leads", "intake", "wizard", "estimates", "customers", "sites", "products"], actions: [], companies: [{ id: CRM.company, name: "Synthetic PPO" }], working_company_id: null });
    if (path === "estimating/workspaces/create-choices") {
      if (state.choices === "loading") return;
      if (state.choices === "denied") return reply(route, { code: "Forbidden", message: "Current access does not permit these opportunities." }, 403);
      return reply(route, { ...creationChoicesFixture, items: state.choices === "empty" ? [] : creationChoicesFixture.items });
    }
    if (path === "estimating/workspaces/form-options") return state.refreshDenied
      ? reply(route, { code: "Forbidden", message: "Current scope access is unavailable." }, 403) : reply(route, creationFormFixture);
    if (path === "estimating/workspaces/create-options") return state.refreshDenied
      ? reply(route, { code: "Forbidden", message: "Current estimator choices are unavailable." }, 403) : reply(route, creationContextFixture);
    if (path === `sales/handovers/${creationIds.handover}`) return reply(route, { record: { id: creationIds.handover, opportunity_id: creationIds.opportunity, kind: "Estimating" } });
    if (path === "estimating/workspaces/preview") {
      const body = route.request().postDataJSON() as { discovery: DiscoveryInput; creation: { owner_id: string } };
      const compiled = compileDiscovery(body.discovery);
      return reply(route, { compiled, references: {}, context_hash: "b".repeat(64), expected_opportunity_version: 4,
        required_confirmation_ids: compiled.input.answers.filter(a => a.state === "Confirmed").map(a => a.question_id).sort(),
        configuration_confirmations: configurationConfirmations(compiled.input.configuration, undefined, "b".repeat(64)),
        creation: { owner: creationContextFixture.estimators.find(o => o.id === body.creation.owner_id), brief: creationContextFixture.brief } });
    }
    if (path === "estimating/workspaces" && route.request().method() === "POST") {
      state.requests.push(route.request().postDataJSON());
      if (state.create === "held") return;
      return reply(route, { code: state.create === "duplicate" ? "RelationshipConflict" : state.create === "denied" ? "Forbidden" : "Unavailable",
        message: state.create === "lost" ? "SYN lost response; outcome not confirmed." : "SYN create refused." }, state.create === "duplicate" ? 409 : state.create === "denied" ? 403 : 503);
    }
    if (path.startsWith("operations/")) return reply(route, { code: "Unavailable", message: "Original result is currently unavailable." }, state.recovery === "denied" ? 403 : 404);
    if (path === "estimating/workspaces/create-existing") return reply(route, { id: creationIds.existing, creator: "Morgan", created_at: "2026-10-20T00:00:00Z" });
    return reply(route, { items: [], count: 0 });
  });
  return state;
}
async function capture(page: Page, path: string) {
  // Retained captures exclude the licensed runtime glyphs. No Pro artwork is evidence.
  await page.screenshot({ path, style: ".ppo-fa, .svg-inline--fa, [data-prefix], .es02-icon, .product-icon, .shell-icon, i[class*='fa-'] { visibility: hidden !important; }" });
}
async function enter(page: Page) {
  await page.goto("/estimating/discovery/new", { waitUntil: "domcontentloaded" });
  await page.getByRole("radio", { name: /Northbank controls expansion/ }).check();
  await page.getByRole("button", { name: "Continue to discovery", exact: true }).click();
  await expect(page.getByLabel("Included work · Q01", { exact: true })).toBeVisible();
}
async function reviewed(page: Page) {
  await enter(page);
  await page.getByLabel("Estimating owner", { exact: true }).selectOption(creationIds.estimator);
  await page.getByLabel("Estimating effort", { exact: true }).selectOption("Express");
  await page.getByRole("checkbox", { name: "Freight", exact: true }).check();
  for (const id of ["Q01", "Q02", "Q03"]) {
    await page.getByRole("button", { name: `Review ${id} state, source and follow-up`, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(`${id} follow-up reason`, { exact: true }).fill(`SYN confirm ${id} with the customer`);
    await dialog.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByRole("button", { name: `Review ${id} state, source and follow-up`, exact: true })).toBeFocused();
  }
  if ((page.viewportSize()?.width ?? 1440) <= 780) await page.getByLabel("Discovery step", { exact: true }).selectOption("Scope & delivery");
  else await page.getByRole("button", { name: /3\. Scope & delivery/ }).click();
  for (const id of ["Q04", "Q09"]) await page.getByLabel(`${id} follow-up reason`, { exact: true }).fill(`SYN review ${id}`);
  await page.locator(".es02-bottom .ppo-button--primary").click();
  const dialog = page.getByRole("dialog", { name: "Create discovery workspace", exact: true });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await dialog.getByLabel("Discovery change reason", { exact: true }).fill("SYN first discovery from accepted Sales context");
  return dialog;
}

for (const width of [1440, 1024, 390, 320]) test(`ES02 creation: choose and wrap at ${width} px`, async ({ page }, info) => {
    await fixture(page);
    await page.setViewportSize({ width, height: width >= 781 ? 1000 : 844 });
    await page.goto("/estimating/discovery/new", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("radio")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Continue to discovery" })).toBeDisabled();
    await page.getByRole("searchbox", { name: "Search opportunity, number or customer" }).fill("Eastvale");
    await expect(page.getByRole("radio")).toHaveCount(1);
    await page.getByRole("searchbox", { name: "Search opportunity, number or customer" }).fill("");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width <= 780) await expect(page.locator("#shell-header")).toBeVisible();
    await page.getByRole("radio").first().check();
    await expect(page.getByRole("button", { name: "Continue to discovery" })).toBeEnabled();
    await page.locator(".create-choose > p").first().click();
    await capture(page, info.outputPath(`choose-${width}.png`));
});

test("ES02 creation: empty, denied and loading choices", async ({ page }, info) => {
  const state = await fixture(page);
  await page.setViewportSize({ width: 320, height: 844 });
  state.choices = "empty"; await page.goto("/estimating/discovery/new", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "No eligible opportunities" })).toBeVisible();
  await capture(page, info.outputPath("empty.png"));
  state.choices = "denied"; await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByText("Current access does not permit these opportunities.")).toBeVisible();
  await capture(page, info.outputPath("denied-choices.png"));
  state.choices = "loading"; await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Loading permitted opportunities…")).toBeVisible();
  await capture(page, info.outputPath("loading-320.png"));
});

test("ES02 creation: Sales entry, explicit follow-ups and exact original recovery survive access refresh", async ({ page }, info) => {
  const state = await fixture(page);
  const dialog = await reviewed(page);
  await expect(dialog).toContainText("Morgan");
  await expect(dialog).toContainText("exact acceptance linked with this creation");
  await capture(page, info.outputPath("review.png"));
  state.create = "lost";
  await dialog.getByRole("button", { name: "Create discovery workspace", exact: true }).click();
  const recovery = page.getByRole("dialog", { name: "Creation outcome not confirmed", exact: true });
  await expect(recovery).toBeVisible();
  expect(state.requests).toHaveLength(1);
  expect(state.requests[0].creation).toEqual({ owner_id: creationIds.estimator, sales_brief: creationContextFixture.brief!.selection });
  state.refreshDenied = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await recovery.getByRole("button", { name: "Confirm original save outcome" }).click();
  await expect(recovery).toBeVisible();
  await expect(recovery).not.toContainText("Nothing was created");
  expect(state.requests).toHaveLength(1);
  await capture(page, info.outputPath("outcome-not-confirmed.png"));
  state.recovery = "absent";
  await recovery.getByRole("button", { name: "Confirm original save outcome" }).click();
  await expect.poll(() => state.requests.length).toBe(2);
  expect(state.requests[1]).toEqual(state.requests[0]);
});

test("ES02 creation: busy freezes review; duplicate and denied outcomes do not copy the draft", async ({ page }, info) => {
  const state = await fixture(page);
  const review = await reviewed(page);
  state.create = "duplicate";
  await review.getByRole("button", { name: "Create discovery workspace", exact: true }).click();
  const collision = page.getByRole("dialog", { name: "This opportunity already has a workspace", exact: true });
  await expect(collision).toContainText("Your entries are not copied");
  await expect(collision.getByRole("link", { name: "Open existing workspace" })).toHaveAttribute("href", `/estimating/discovery/${creationIds.existing}`);
  await capture(page, info.outputPath("already-exists.png"));
  await collision.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".es02-bottom .ppo-button--primary").click();
  state.create = "denied";
  await page.getByRole("dialog").getByRole("button", { name: "Create discovery workspace", exact: true }).click();
  const denied = page.getByRole("dialog", { name: "You can no longer create this workspace", exact: true });
  await expect(denied).toContainText("Nothing was created by this request.");
  await capture(page, info.outputPath("creation-not-permitted.png"));
  await denied.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".es02-bottom .ppo-button--primary").click();
  state.create = "held";
  await page.getByRole("dialog").getByRole("button", { name: "Create discovery workspace", exact: true }).click();
  await expect(page.getByRole("button", { name: "Creating…", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await capture(page, info.outputPath("creating.png"));
});

test("ES02 creation: direct Sales handover locks the opportunity and validation focuses an owned question", async ({ page }, info) => {
  await fixture(page);
  await page.goto(`/estimating/discovery/new?opportunity=${creationIds.opportunity}&sales_handover=${creationIds.handover}`);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByLabel("Included work · Q01", { exact: true })).toHaveValue(creationContextFixture.brief!.content.included_scope);
  await expect(page.getByRole("button", { name: "Choose another opportunity", exact: true })).toHaveCount(0);
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width >= 781 ? 1000 : 844 });
    await page.locator('.es02-scroll').evaluate(element => element.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, info.outputPath(`requirements-${width}.png`));
    const fullHeight = await page.locator(".es02-scroll").evaluate(element => element.scrollHeight + element.getBoundingClientRect().top + 96);
    await page.setViewportSize({ width, height: Math.ceil(fullHeight) });
    await capture(page, info.outputPath(`requirements-full-${width}.png`));
  }
  await page.locator(".es02-bottom .ppo-button--primary").click();
  await expect(page.getByRole("alert").filter({ hasText: "details need attention" })).toBeVisible();
  await expect(page.locator('[id="scope.systems"]')).toBeFocused();
  await capture(page, info.outputPath("needs-attention.png"));
});
