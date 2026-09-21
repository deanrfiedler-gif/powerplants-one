import { test, expect, request as playwrightRequest, type APIRequestContext, type Page } from "@playwright/test";
import { MATERIALS, scenarioIds, seedMaterialsScenario, type Call, type SignIn } from "../helpers/engineering-materials";

// EN-06 Released Materials & Substitutions. Every journey builds a package of its own through the ordinary API, as the
// fictional people who would do each step, so the persistent development database never makes a rerun fail. The origin
// comes from the project's baseURL, never a literal port. Task-local case labels (EN06-Axx) are from build plan r02.
test.describe.configure({ timeout: 240000 });

const originOf = () => new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:3000").origin;
// One cookie jar per fictional person, so a later step by the coordinator is still the coordinator.
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
const command = (reason: string, fields: Record<string, unknown>) => ({ operation_id: crypto.randomUUID(), schema_version: 1, reason, ...fields });
async function signIn(page: Page, profile: string, menu: "open" | "closed" | null = null) {
  const session = await page.request.post("/api/v1/local-session", { headers: { Origin: originOf() }, data: { profile } });
  expect(session.ok()).toBe(true);
  const me = (await session.json()) as { workspace_id: string; actor_id: string };
  if (menu) await page.addInitScript(([key, value]) => { try { if (!localStorage.getItem(key)) localStorage.setItem(key, value); } catch { /* storage unavailable */ } }, [`ppo.materials.layout.v1:${me.workspace_id}:${me.actor_id}`, JSON.stringify({ schema_version: 1, menu, columns: [] })]);
  return me;
}
async function build(tag: string) {
  const crew = people(), ids = scenarioIds(false), built = await seedMaterialsScenario(crew.as, ids, ` ${tag}`);
  return { ...crew, ids, base: `engineering/${ids.package}/materials`, href: `${built.href}?set=${ids.set}` };
}
type Item = { id: string; version: number; line_number: string; mapping: string; content_revision: number; readiness: { code: string; label: string } };
const lines = async (call: Call, base: string, set: string) => new Map(((await call(`${base}?set=${set}&page_size=100`)).body as { items: Item[] }).items.map((i) => [i.line_number, i]));
const rows = (page: Page) => page.locator("#ppo-materials .em-register tbody tr");

test("EN06-A33 A34 A35 A36 A37 A38 A39: the register keeps the refined r04 contract, My Work's menu and honest counts", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "Desktop composition; the phone case is below.");
  const s = await build(`register ${Date.now()}`);
  await signIn(page, MATERIALS.author.profile);
  await page.goto(s.href);
  const root = page.locator("#ppo-materials");
  await expect(rows(page)).toHaveCount(8);

  // A34: first use is collapsed, with no residual track; the header names module and destination while it is hidden.
  await expect(root).toHaveAttribute("data-menu", "collapsed");
  await expect(page.locator("#em-menu")).toBeHidden();
  await expect(page.locator(".product-heading")).toContainText("Engineering / Released Materials & Substitutions / Materials register");
  await expect(page.locator(".product-heading .ppo-product-name")).toBeHidden();
  // The module name is never cut short to make room for the destination: the destination shows whole or not at all.
  expect(await page.locator(".product-heading .ppo-heading-view").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  const collapsedLeft = (await page.locator(".em-register").boundingBox())!.x;
  expect(Math.round(collapsedLeft)).toBe(Math.round((await root.boundingBox())!.x));
  await page.getByRole("button", { name: "Show menu" }).first().click();
  await expect(root).toHaveAttribute("data-menu", "docked");
  await page.reload();
  await expect(root).toHaveAttribute("data-menu", "docked");
  await expect(page.locator(".product-heading .ppo-heading-subview")).toBeHidden();

  // A33 A36: My Work's menu, six route links in order, no horizontal module tabs.
  const menu = page.locator("#em-menu");
  await expect(menu.locator(".mw-menu-title strong")).toHaveText("Materials & substitutions");
  await expect(menu.locator("nav a")).toHaveText([/^Materials register$/, /^Item & unit mapping$/, /^Substitution review\s*2$/, /^Review & release$/, /^Supply handover$/, /^Changes & history$/]);
  await expect(menu.locator("nav a[aria-current=page]")).toHaveText("Materials register");
  expect(Math.round((await menu.boundingBox())!.width)).toBe(220);
  await expect(page.locator(".module-navigation")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Released Materials & Substitutions: Materials register/);

  // A35: header fill, rows and rules meet both edges of the register pane, with the menu open and the inspector shut.
  const flush = async () => {
    const pane = (await page.locator(".em-register").boundingBox())!, table = (await page.locator(".em-register .em-table").boundingBox())!, head = (await page.locator(".em-register thead th").first().boundingBox())!;
    expect(Math.abs(table.x - pane.x)).toBeLessThan(1);
    expect(Math.abs(head.x - pane.x)).toBeLessThan(1);
    expect(table.x + table.width).toBeGreaterThanOrEqual(pane.x + pane.width - 1);
  };
  await flush();
  expect(Math.round((await menu.boundingBox())!.x + 220)).toBe(Math.round((await page.locator(".em-register").boundingBox())!.x));

  // A38: the numbers come from the server for this set, and they agree with the rows.
  await expect(page.locator(".em-tabs button")).toHaveText([/All materials\s*8/, /Ready for review\s*5/, /Needs attention\s*3/]);
  await expect(page.locator(".em-attention strong")).toHaveText("3 material lines need attention");
  await expect(page.locator(".em-table-foot")).toContainText("8 materials · 0 selected");
  // The refined register: the notice sits above the table, states are chips, and no summary strip follows the table.
  const notice = (await page.locator(".em-attention").boundingBox())!, tableTop = (await page.locator(".em-register .em-table").boundingBox())!.y;
  expect(notice.y + notice.height).toBeLessThanOrEqual(tableTop + 1);
  await expect(page.locator(".em-states")).toHaveCount(0);
  await expect(rows(page).filter({ hasText: "Control interface module" }).locator(".em-chip")).toHaveText(["Verified", "Evidence needed"]);
  await expect(rows(page).filter({ hasText: "Control interface module" })).toContainText("Substitution proposed");
  await expect(rows(page).filter({ hasText: "Pump assembly" })).toContainText("H-101 · Rev C");

  // A37 A39: inspecting line 030 ticks nothing; required-by is "Date needed" and nothing is invented beside it.
  await rows(page).filter({ hasText: "Control interface module" }).getByRole("button", { name: /Inspect line 030/ }).click();
  const inspector = page.getByRole("complementary", { name: "Line inspector" });
  await expect(inspector.getByRole("heading", { level: 2 })).toHaveText("Control interface module");
  await expect(page).toHaveURL(/line=/);
  await expect(page.locator(".em-register tbody input:checked")).toHaveCount(0);
  await expect(page.locator(".em-table-foot")).toContainText("0 selected");
  await expect(inspector.locator(".em-pair", { hasText: "Material required-by" }).locator("strong")).toHaveText("Date needed");
  await expect(inspector).toContainText("Obtain supplier firmware statement");
  await expect(inspector).toContainText(/Review due 22 Sept? 2026/);
  await expect(inspector).toContainText("CI-100");
  await expect(inspector).toContainText("Alternate control interface");
  await expect(inspector.locator(".em-source")).toContainText("Selected sources current");
  await expect(inspector.locator(".em-pair", { hasText: "Material release" })).toContainText("Not issued");
  // The inspector stands beside the context rows as well as the register, and the rest of the line is one step away.
  expect(Math.round((await inspector.boundingBox())!.y)).toBe(Math.round((await page.locator(".em-context").boundingBox())!.y));
  await expect(inspector.getByRole("button", { name: "Correct requirement" })).toBeHidden();
  await inspector.getByText("View material details").click();
  await expect(inspector.getByRole("button", { name: "Correct requirement" })).toBeVisible();
  // Too narrow for both, the inspector overlays the register instead of docking, and it is really there.
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(inspector.getByRole("heading", { level: 2 })).toBeVisible();
  expect((await inspector.boundingBox())!.width).toBeGreaterThan(300);
  await page.setViewportSize(size);
  await expect(inspector.locator(".em-pair", { hasText: "Technical acceptance" })).toContainText("Pending review");
  await flush();
  await expect(rows(page).filter({ hasText: "Control interface module" })).toHaveAttribute("data-inspected", "true");

  // Selection is separate: two ticks make the page checkbox indeterminate and leave line 030 inspected.
  await page.getByRole("checkbox", { name: /Select line 020/ }).check();
  await page.getByRole("checkbox", { name: /Select line 050/ }).check();
  await expect(page.locator(".em-table-foot")).toContainText("2 selected");
  expect(await page.locator(".em-register thead input").evaluate((el) => (el as HTMLInputElement).indeterminate)).toBe(true);
  await expect(page.getByRole("region", { name: "Selected lines" })).toContainText("Prepare release set from 2 lines");
  await expect(inspector.getByRole("heading", { level: 2 })).toHaveText("Control interface module");

  // A36 A38: a criterion is a URL, Back restores it, and a filtered count says what it is a count of.
  await page.getByRole("button", { name: "Close inspector" }).click();
  await expect(inspector).toHaveCount(0);
  await page.locator(".em-tabs button", { hasText: "Needs attention" }).click();
  await expect(rows(page)).toHaveCount(3);
  await expect(page).toHaveURL(/view=attention/);
  await page.getByPlaceholder("Search materials").fill("tubing");
  await expect(page).toHaveURL(/q=tubing/);
  await expect(rows(page)).toHaveCount(0);
  await expect(page.locator(".em-empty")).toContainText("No lines match");
  await page.locator(".em-tabs button", { hasText: "All materials" }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(page.locator(".em-table-foot")).toContainText("1 material of 8 in this set");

  // The entry route opens the workspace itself, on the package last opened here; the list is there when asked for.
  await page.goto("/engineering/materials");
  await expect(page).toHaveURL(new RegExp(`/engineering/${s.ids.package}/materials`));
  await expect(rows(page)).toHaveCount(8);
  await expect(page.getByRole("combobox", { name: "Engineering package" }).locator("option").last()).toHaveText("Choose another package…");
  await page.goto("/engineering/materials?choose=1");
  await expect(page.getByRole("heading", { name: "Choose an Engineering package" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Nursery irrigation materials/ }).first()).toBeVisible();
  await s.dispose();
});

test("EN06-A04 A06 A07 A09 A10 A16 A27 A41: the server refuses what the screen would not offer", async ({}, info) => {
  test.skip(info.project.name !== "desktop-chromium", "API rules are project-independent.");
  const s = await build(`rules ${Date.now()}`), author = await s.as(MATERIALS.author.profile), reviewer = await s.as(MATERIALS.reviewer.profile),
    viewer = await s.as(MATERIALS.viewer.profile), release = await s.as(MATERIALS.release.profile), other = await s.as("second-company");
  const l = await lines(author, s.base, s.ids.set), code = (r: { body: unknown }) => (r.body as { code: string }).code;

  // Scope: another company's coordinator cannot tell this package from a missing one, for a read or a command.
  expect((await other(s.base)).status).toBe(404);
  expect((await other(`${s.base}/lines`, command("SYN cross-scope attempt", { action: "remove", line_id: l.get("070")!.id, expected_version: 1, removed_reason: "x" }))).status).toBe(404);
  // Duties: reading is not editing, editing is not verifying, and neither is review or release.
  const viewerSave = await viewer(`${s.base}/lines`, command("SYN viewer attempt", { action: "remove", line_id: l.get("070")!.id, expected_version: l.get("070")!.version, removed_reason: "x" }));
  expect([viewerSave.status, code(viewerSave)]).toEqual([403, "Forbidden"]);
  const verify = await author(`${s.base}/lines`, command("SYN author verifying", { action: "binding", line_id: l.get("080")!.id, expected_version: l.get("080")!.version, mapping: "Verified", mapping_configuration: "SYN-ITEMS-2026", mapping_entity: "SYN-A", mapping_item_key: "SYN-ITM-FA-200", target_unit: "EA" }));
  expect(verify.status).toBe(403);
  const subs = ((await author(`${s.base}/substitutions?set=${s.ids.set}`)).body as { items: { id: string; version: number; line_number: string }[] }).items, ci = subs.find((x) => x.line_number === "030")!;
  const own = await (await s.as(MATERIALS.engineer.profile))(`${s.base}/substitutions`, command("SYN self decision", { action: "decide", substitution_id: ci.id, expected_version: ci.version, result: "Accepted", rationale: "x" }));
  expect(own.status).toBe(403);
  // A09: mandatory firmware evidence is outstanding, so an independent reviewer still cannot accept it.
  const accept = await reviewer(`${s.base}/substitutions`, command("SYN premature acceptance", { action: "decide", substitution_id: ci.id, expected_version: ci.version, result: "Accepted", rationale: "SYN" }));
  expect([accept.status, code(accept)]).toEqual([422, "AcceptanceBlocked"]);
  // A07: a line cannot be verified across companies because the item code matches.
  const coordinator = await s.as(MATERIALS.coordinator.profile);
  const foreign = await coordinator(`${s.base}/lines`, command("SYN other entity", { action: "binding", line_id: l.get("080")!.id, expected_version: l.get("080")!.version, mapping: "Verified", mapping_configuration: "SYN-ITEMS-2026", mapping_entity: "SYN-B", mapping_item_key: "SYN-ITM-FA-200", target_unit: "EA" }));
  expect([foreign.status, code(foreign)]).toEqual([422, "EntityMismatch"]);
  // Stale version: the entries are refused, not silently merged.
  const stale = await author(`${s.base}/lines`, command("SYN stale", { action: "remove", line_id: l.get("070")!.id, expected_version: 1, removed_reason: "x" }));
  expect([stale.status, code(stale)]).toEqual([409, "VersionConflict"]);
  // A27: a client cannot carry an approval, a hash or a purpose into a command.
  const prepare = (selection: { line_id: string; quantity: string }[], extra: Record<string, unknown> = {}, set = s.ids.set) =>
    author(`${s.base}/releases`, command("SYN prepare", { action: "prepare", id: crypto.randomUUID(), set_id: set, purpose: "TechnicalReleaseForProcurement", audience: "SYN Supply Chain", selection, ...extra }));
  expect((await prepare([{ line_id: l.get("020")!.id, quantity: "4" }], { approved: true })).status).toBe(422);
  // A16: half of a dependency group is refused; A08: more than the requirement is refused.
  const split = await prepare([{ line_id: l.get("010")!.id, quantity: "1" }]);
  expect([split.status, code(split)]).toEqual([422, "ScopeInvalid"]);
  expect((split.body as { message: string }).message).toContain("works only as a whole");
  expect(code(await prepare([{ line_id: l.get("020")!.id, quantity: "7" }]))).toBe("ScopeInvalid");
  // A02: the coordination-only set can be prepared and inspected, and never submitted for procurement.
  const held = await lines(author, s.base, s.ids.setB), heldId = crypto.randomUUID();
  expect((await author(`${s.base}/releases`, command("SYN held", { action: "prepare", id: heldId, set_id: s.ids.setB, purpose: "TechnicalReleaseForProcurement", audience: "SYN", selection: [{ line_id: held.get("010")!.id, quantity: "2" }] }))).status).toBe(201);
  const submit = await author(`${s.base}/releases`, command("SYN submit held", { action: "submit", release_id: heldId, expected_version: 1 }));
  expect([submit.status, code(submit)]).toEqual([422, "ReleaseBlocked"]);
  expect((submit.body as { message: string }).message).toContain("does not permit procurement");
  // A10: the author who prepared a set cannot review it, whatever they send.
  const okId = crypto.randomUUID();
  expect((await prepare([{ line_id: l.get("070")!.id, quantity: "1" }], { id: okId })).status).toBe(201);
  expect((await author(`${s.base}/releases`, command("SYN submit", { action: "submit", release_id: okId, expected_version: 1 }))).status).toBe(201);
  expect((await author(`${s.base}/releases`, command("SYN self review", { action: "review", release_id: okId, expected_version: 2, result: "Accepted", rationale: "x" }))).status).toBe(403);
  // The release authority cannot skip the review either.
  const early = await release(`${s.base}/releases`, command("SYN early", { action: "authorise", release_id: okId, expected_version: 2 }));
  expect([early.status, code(early)]).toEqual([409, "NotReviewed"]);
  await s.dispose();
});

test("EN06-A15 A16 A17 A18 A19 A20 A22 A23 A42: partial release, unknown outcome, receiving and a changed source", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "One desktop journey.");
  const s = await build(`release ${Date.now()}`), author = await s.as(MATERIALS.author.profile), reviewer = await s.as(MATERIALS.reviewer.profile),
    authority = await s.as(MATERIALS.release.profile), supply = await s.as(MATERIALS.supply.profile), coordinator = await s.as(MATERIALS.coordinator.profile);
  const l = await lines(author, s.base, s.ids.set), releaseId = crypto.randomUUID(), releases = `${s.base}/releases`;
  // An independent subset: four of six valves, the tubing, the kits and the frame. The pump and control pair stays held.
  const selection = [{ line_id: l.get("020")!.id, quantity: "4" }, { line_id: l.get("050")!.id, quantity: "120" }, { line_id: l.get("060")!.id, quantity: "3" }, { line_id: l.get("070")!.id, quantity: "1" }];
  expect((await author(releases, command("SYN partial release prepared", { action: "prepare", id: releaseId, set_id: s.ids.set, purpose: "TechnicalReleaseForProcurement", audience: "SYN Supply Chain coordination", selection }))).status).toBe(201);
  expect((await author(releases, command("SYN submitted", { action: "submit", release_id: releaseId, expected_version: 1 }))).status).toBe(201);
  expect((await reviewer(releases, command("SYN reviewed", { action: "review", release_id: releaseId, expected_version: 2, result: "Accepted", rationale: "SYN exact manifest inspected against its sources." }))).status).toBe(201);
  // A17: the same original operation returns the same receipt; the same ID with different content conflicts.
  const authorise = command("SYN authorised", { action: "authorise", release_id: releaseId, expected_version: 3 });
  const first = await authority(releases, authorise), again = await authority(releases, authorise);
  // The route answers 201 for a first acceptance and 200 for a replay of the same original.
  expect([first.status, again.status]).toEqual([201, 200]);
  expect((again.body as { receipt_id: string }).receipt_id).toBe((first.body as { receipt_id: string }).receipt_id);
  expect((await authority(releases, { ...authorise, reason: "SYN changed content" })).status).toBe(409);

  // A18 A19 A42: issue in the browser with the reply thrown away. Unknown is shown as unknown and recovered once.
  await signIn(page, MATERIALS.release.profile, "open");
  await page.goto(`/engineering/${s.ids.package}/materials/releases?set=${s.ids.set}&release=${releaseId}`);
  await page.getByRole("button", { name: "Issue technical release" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Exercise recovery/).check();
  await dialog.getByRole("button", { name: "Issue this exact release" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Outcome unknown");
  await expect(dialog.getByRole("button", { name: "Issue this exact release" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Recover the original result" }).click();
  await expect(dialog.getByRole("status")).toContainText("Issued. Release 1 is now immutable");
  await dialog.getByRole("button", { name: "Close" }).first().click();
  await expect(page.locator(".em-facts", { hasText: "Release operation" })).toContainText("Issued");
  await expect(page.locator(".em-facts", { hasText: "Current use" })).toContainText("Eligible for purpose");
  const issued = ((await authority(`${releases}?set=${s.ids.set}`)).body as { items: { id: string; version: number; issue_state: string; manifest: { exclusions: { line_number: string; remaining_quantity: string }[] } }[] }).items.find((r) => r.id === releaseId)!;
  expect(issued.issue_state).toBe("Issued");
  // A16: the remainder is explicit, with the two valves still to come.
  expect(issued.manifest.exclusions.find((x) => x.line_number === "020")?.remaining_quantity).toBe("2");
  const second = await authority(releases, command("SYN second issue", { action: "issue", release_id: releaseId, expected_version: issued.version }));
  expect([second.status, (second.body as { code: string }).code]).toEqual([409, "AlreadyIssued"]);
  // The same scope cannot be released twice: three more valves would make seven of six.
  const over = await author(releases, command("SYN over", { action: "prepare", id: crypto.randomUUID(), set_id: s.ids.set, purpose: "TechnicalReleaseForProcurement", audience: "SYN", selection: [{ line_id: l.get("020")!.id, quantity: "3" }] }));
  expect(over.status).toBe(422);

  // A22 A20: forecast is never procurement-ready; approved demand is separate evidence; acceptance is of the whole payload.
  const handover = `${s.base}/handover`, handoverId = crypto.randomUUID();
  const forecast = await author(handover, command("SYN forecast", { action: "prepare", id: crypto.randomUUID(), release_id: releaseId, requested_action: "ProcurementReady", demand_basis: "Forecast", receiver_id: MATERIALS.supply.id }));
  expect(forecast.status).toBe(422);
  expect((await author(handover, command("SYN handover", { action: "prepare", id: handoverId, release_id: releaseId, requested_action: "ProcurementReady", demand_basis: "Approved", demand_source_id: s.ids.demand, receiver_id: MATERIALS.supply.id, required_by: "2026-11-14" }))).status).toBe(201);
  expect((await author(handover, command("SYN sent", { action: "send", handover_id: handoverId, expected_version: 1 }))).status).toBe(201);
  expect((await author(handover, command("SYN self accept", { action: "decide", handover_id: handoverId, expected_version: 2, result: "Accepted" }))).status).toBe(403);
  expect((await supply(handover, command("SYN accepted", { action: "decide", handover_id: handoverId, expected_version: 2, result: "Accepted" }))).status).toBe(201);
  expect((await supply(handover, command("SYN twice", { action: "decide", handover_id: handoverId, expected_version: 3, result: "Returned", reasons: [{ reason: "x" }], owner_id: MATERIALS.author.id, due: "2026-10-01" }))).status).toBe(409);

  // A14 A23: a new drawing revision rewrites nothing. The issue and the acceptance stay; current use needs reassessment; a follow-up is owned.
  expect((await coordinator(`${s.base}/sources`, command("SYN H-102 revised upstream", { action: "publish", id: crypto.randomUUID(), kind: "DrawingIssue", reference: "H-102", title: "Greenhouse 01 isolation schedule", revision: "C", file_version: "2.0", permitted_purpose: "Procurement", content: "SYNTHETIC H-102 revision C", supersedes_id: s.ids.drawings["020"] }))).status).toBe(201);
  const after = ((await authority(`${releases}?set=${s.ids.set}`)).body as { items: { id: string; issue_state: string; current_use: string }[] }).items.find((r) => r.id === releaseId)!;
  expect([after.issue_state, after.current_use]).toEqual(["Issued", "ReassessmentNeeded"]);
  const received = ((await supply(`${handover}?set=${s.ids.set}`)).body as { items: { id: string; state: string; release_current_use: string }[] }).items.find((h) => h.id === handoverId)!;
  expect([received.state, received.release_current_use]).toEqual(["Accepted", "ReassessmentNeeded"]);
  const history = (await author(`${s.base}/history?set=${s.ids.set}`)).body as { impacts: { state: string; required_action: string; affected: { lines: string[]; handovers: { state: string }[] } }[] };
  expect(history.impacts).toHaveLength(1);
  expect(history.impacts[0].affected.lines).toEqual(["020"]);
  expect(history.impacts[0].affected.handovers[0].state).toBe("Accepted");
  expect(history.impacts[0].required_action).toContain("Nothing has been recalled, cancelled or reversed");
  expect((await lines(author, s.base, s.ids.set)).get("020")!.readiness.code).toBe("ReassessmentNeeded");

  // A40 (browser half): the page shows the same facts after a reload, from the server.
  await page.reload();
  await expect(page.locator(".em-facts", { hasText: "Current use" })).toContainText("Reassessment needed");
  await expect(page.locator(".em-blockers").first()).toContainText("H-102 revision B is superseded");
  await s.dispose();
});

test("EN06-A11 A12 A13: return and corrected successor, explicit adoption, and a commercial decision that Engineering cannot make", async ({}, info) => {
  test.skip(info.project.name !== "desktop-chromium", "API journey.");
  const s = await build(`substitution ${Date.now()}`), engineer = await s.as(MATERIALS.engineer.profile), reviewer = await s.as(MATERIALS.reviewer.profile), coordinator = await s.as(MATERIALS.coordinator.profile), path = `${s.base}/substitutions`;
  type Sub = { id: string; version: number; line_number: string; state: string; predecessor_id: string | null; has_successor: boolean; criteria: { key: string; label: string; mandatory: boolean; result: string; note: string | null; evidence: string | null }[]; candidate_code: string; candidate_description: string; candidate_manufacturer: string; candidate_revision: string; candidate_item_key: string | null; proposal_reason: string; scope_quantity: string; impacts: unknown[] };
  const subs = async () => ((await engineer(`${path}?set=${s.ids.set}`)).body as { items: Sub[] }).items;
  const ci = (await subs()).find((x) => x.line_number === "030")!;
  expect((await reviewer(path, command("SYN returned", { action: "decide", substitution_id: ci.id, expected_version: ci.version, result: "Returned", rationale: "SYN firmware statement missing.", owner_id: MATERIALS.engineer.id, due: "2026-09-22" }))).status).toBe(201);
  const successorId = crypto.randomUUID();
  expect((await engineer(path, command("SYN successor", { action: "successor", id: successorId, substitution_id: ci.id, expected_version: ci.version + 1 }))).status).toBe(201);
  let next = (await subs()).find((x) => x.id === successorId)!;
  expect([next.state, next.predecessor_id]).toEqual(["Draft", ci.id]);
  // The returned comparison is retained exactly as it was decided.
  expect((await subs()).find((x) => x.id === ci.id)).toMatchObject({ state: "Returned", has_successor: true });
  const corrected = next.criteria.map((k) => (k.key === "firmware" ? { ...k, result: "Meets", evidence: "SYN supplier firmware statement FS-120 v1", note: null } : k));
  expect((await engineer(path, command("SYN corrected", { action: "update", substitution_id: next.id, expected_version: next.version, candidate_code: next.candidate_code, candidate_description: next.candidate_description, candidate_manufacturer: next.candidate_manufacturer, candidate_revision: next.candidate_revision, candidate_item_key: next.candidate_item_key, proposal_reason: next.proposal_reason, scope_quantity: next.scope_quantity, criteria: corrected, impacts: next.impacts, commercial_state: "NotAssessed" }))).status).toBe(201);
  expect((await engineer(path, command("SYN resubmitted", { action: "submit", substitution_id: next.id, expected_version: next.version + 1 }))).status).toBe(201);
  expect((await reviewer(path, command("SYN accepted", { action: "decide", substitution_id: next.id, expected_version: next.version + 2, result: "Accepted", rationale: "SYN all mandatory criteria evidenced." }))).status).toBe(201);
  const before = (await lines(engineer, s.base, s.ids.set)).get("030")!;
  expect((await engineer(path, command("SYN adopted", { action: "adopt", substitution_id: next.id, expected_version: next.version + 3 }))).status).toBe(201);
  const adopted = (await lines(engineer, s.base, s.ids.set)).get("030")!;
  expect(adopted.content_revision).toBe(before.content_revision + 1);
  // The specified item's verified binding does not transfer to a different product.
  expect(adopted.mapping).toBe("Proposed");
  next = (await subs()).find((x) => x.id === successorId)!;
  expect(next.state).toBe("Accepted");

  // A13: FA-220 is technically accepted while its commercial decision is still open, so the line stays held.
  const fa = (await subs()).find((x) => x.line_number === "080")!;
  expect((await reviewer(path, command("SYN technically accepted", { action: "decide", substitution_id: fa.id, expected_version: fa.version, result: "Accepted", rationale: "SYN comparison complete." }))).status).toBe(201);
  expect((await lines(engineer, s.base, s.ids.set)).get("080")!.readiness.code).toBe("ScopeDecision");
  expect((await reviewer(path, command("SYN not theirs", { action: "commercial", substitution_id: fa.id, expected_version: fa.version + 1, commercial_state: "NoEffectConfirmed", commercial_note: "x" }))).status).toBe(403);
  expect((await coordinator(path, command("SYN commercial decision", { action: "commercial", substitution_id: fa.id, expected_version: fa.version + 1, commercial_state: "Decided", commercial_note: "SYN price difference accepted by the fictional commercial owner." }))).status).toBe(201);
  expect((await lines(engineer, s.base, s.ids.set)).get("080")!.readiness.code).toBe("MappingToVerify");
  await s.dispose();
});

test("EN06-A30 A44: a phone keeps the page inside the viewport and the table in its own scroll", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile-chromium", "Phone containment.");
  const s = await build(`phone ${Date.now()}`);
  await signIn(page, MATERIALS.author.profile);
  await page.goto(s.href);
  await expect(rows(page)).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // A contained page can still clip a control: both page actions sit wholly inside the screen.
  for (const name of ["Add material requirement", "Review release set"]) {
    const box = (await page.getByRole("link", { name }).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
  }
  await expect(page.locator("#ppo-materials")).toHaveAttribute("data-menu", "overlay");
  await page.getByRole("button", { name: "Materials menu" }).first().click();
  const menu = page.getByRole("dialog", { name: "Materials menu" });
  await expect(menu.getByRole("link", { name: "Review & release" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await rows(page).first().getByRole("button", { name: /Inspect line 010/ }).click();
  await expect(page.getByRole("complementary", { name: "Line inspector" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await s.dispose();
});
