import { test, expect, type Page } from "@playwright/test";
import { CRM, crmBase, crmDiscovery } from "../helpers/crm";
import { leadCreate } from "../helpers/leads";
import { randomUUID } from "node:crypto";
import { openGlobalSearch, identityToggle } from "../helpers/phone-menu";
const origin = () => new URL(test.info().project.use.baseURL!).origin;
async function login(page: Page, profile = "coordinator") {
  const result = await page.request.post("/api/v1/local-session", { headers: { Origin: origin() }, data: { profile } });
  expect(result.ok(), await result.text()).toBe(true);
}
async function dirtyPreferences(page: Page) {
  await page.goto("/work/updates");
  await page.getByRole("button", { name: "Preferences", exact: true }).click();
  const time = page.getByLabel("Digest time", { exact: true });
  await expect(time).toBeVisible();
  await time.fill((await time.inputValue()) === "09:15" ? "10:15" : "09:15");
  return time;
}
test("N03 CRM compatibility aliases retain supported list and record query state", async ({ page }) => {
  await login(page);
  for (const [from,to] of [["/crm/leads?view=Archived&q=SYN", "/sales/leads?view=Archived&q=SYN"], ["/crm/opportunities?view=list&q=SYN", "/sales/opportunities?view=list&q=SYN"]]) {
    await page.goto(from); await expect(page).toHaveURL(origin()+to);
  }
  const lead=leadCreate();
  expect((await page.request.post("/api/v1/crm/leads",{headers:{Origin:origin()},data:lead})).ok()).toBe(true);
  await page.goto(`/crm/leads/${lead.id}?view=activities`);
  await expect(page).toHaveURL(`${origin()}/sales/leads/${lead.id}?view=activities`);
  await expect(page.getByRole("dialog",{name:lead.title,exact:true}).getByRole("heading",{name:lead.title,level:2,exact:true})).toBeVisible();
  await page.goto("/crm/opportunities/new?company_id="+lead.company_id);
  await expect(page).toHaveURL(origin()+"/sales/opportunities/new?company_id="+lead.company_id);
  const deal=crmDiscovery();
  expect((await page.request.post("/api/v1/crm/opportunities",{headers:{Origin:origin()},data:deal})).ok()).toBe(true);
  await page.goto(`/crm/opportunities/${deal.id}?section=commercial`);
  await expect(page).toHaveURL(`${origin()}/sales/opportunities/${deal.id}?section=commercial`);
  await expect(page.getByRole("tab",{name:"Estimates & quotations",exact:true})).toHaveAttribute("aria-selected","true");
});
test("N04/N05/N10 Home and Workspace follow the current synthetic identity", async ({ page }) => {
  await login(page,"assigned-technician"); await page.goto("/");
  const context = await (await page.request.get("/api/v1/shell/context")).json();
  expect(context.navigation).not.toContain("finance");
  await expect(page).not.toHaveURL(origin()+"/");
  await page.getByRole("button", { name:"More", exact:true }).click();
  // Workspaces in More offers only the departments this identity can reach (no separate dropdown since 18 October 2026).
  const departments = page.locator(".ppo-more-panel:visible .ppo-menu-group").filter({ has: page.getByRole("heading", { name:"Workspaces", exact:true }) });
  await expect(departments.getByRole("link").first()).toBeVisible();
  expect(await departments.getByRole("link").evaluateAll(links => links.map(link => link.getAttribute("aria-label")))).not.toContain("Finance");
  await page.screenshot({path:test.info().outputPath("restricted-workspace.png")});
  // Existing unassigned Technician has no grants; no transport mock or new grant.
  await login(page,"technician");
  await page.goto("/");
  await expect(page.getByText("No operational destinations are available for your current identity.", {exact:true})).toBeVisible();
});
test("N07/N08/N20 dirty preferences protect pointer, keyboard, touch and workspace intent", async ({ page, isMobile }) => {
  await login(page); const time=await dirtyPreferences(page), value=await time.inputValue();
  const preference=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key.startsWith("ppo.shell"))));
  let reviews=0;page.on("dialog",dialog=>{reviews++;void dialog.dismiss();});
  await page.getByRole("button",{name:"More",exact:true}).click();
  await page.locator(".ppo-more-panel:visible .ppo-menu-group").filter({has:page.getByRole("heading",{name:"Workspaces",exact:true})}).getByRole("link",{name:"Engineering",exact:true}).click();
  await expect(page).toHaveURL(/\/work\/updates$/); await expect(time).toHaveValue(value);
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key.startsWith("ppo.shell"))))).toEqual(preference);
  await page.keyboard.press("Escape");
  if(isMobile) await openGlobalSearch(page);
  const search=page.getByRole("combobox",{name:"Search Powerplants One",exact:true});
  await search.fill("opportunity");
  const option=page.getByRole("option").filter({has:page.getByText("Deals",{exact:true})}).first();
  await expect(option).toBeVisible();
  if(isMobile) await option.tap(); else await option.click();
  await expect(page).toHaveURL(/\/work\/updates$/); await expect(time).toHaveValue(value);
  await search.focus(); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work\/updates$/); await expect(time).toHaveValue(value);
  await page.keyboard.press("Escape");
  // Native Chrome history traversal is separate from an anchor or beforeunload.
  const beforeBack=reviews;await page.evaluate(()=>history.back());
  await expect.poll(()=>reviews).toBeGreaterThan(beforeBack);
  await expect(page).toHaveURL(/\/work\/updates$/); await expect(time).toHaveValue(value);
  page.removeAllListeners("dialog");page.on("dialog",dialog=>void dialog.accept());
  if(isMobile)await openGlobalSearch(page);
  await search.click();await search.fill("opportunity");await expect(option).toBeVisible();await option.click();
  await expect(page).toHaveURL(/\/sales\/opportunities/);
});
for (const selection of ["pointer", "keyboard"] as const) {
  test(`N07 approving current-page search by ${selection} keeps later edits protected on reload`, async ({ page, isMobile }) => {
    await login(page);
    const id = randomUUID(), title = `SYN current-page Contact ${id}`;
    const created = await page.request.post("/api/v1/people", {
      headers: { Origin: origin() }, data: { ...crmBase(), id, company_ids: [CRM.company], display_name: title },
    });
    expect(created.status()).toBe(201);
    const read = page.waitForResponse(response => new URL(response.url()).pathname === `/api/v1/people/${id}/workspace` && response.request().method() === "GET");
    await page.goto(`/people/${id}`);
    const loaded = await read;
    expect(loaded.status()).toBe(200); await loaded.finished();
    const contact = await loaded.json();
    expect(contact.id).toBe(id); expect(contact.display_name).toBe(title);
    await page.getByRole("button", { name: "Correct contact", exact: true }).click();
    const name = page.getByLabel("Name", { exact: true }), draft = "SYN unsaved current-page correction";
    await name.fill(draft);
    let confirmations = 0, unloadWarnings = 0, saves = 0;
    page.on("request", request => {
      if (request.method() === "POST" && new URL(request.url()).pathname === `/api/v1/people/${id}/revise`) saves++;
    });
    page.on("dialog", dialog => {
      if (dialog.type() === "beforeunload") { unloadWarnings++; void dialog.dismiss(); }
      else { confirmations++; void dialog.accept(); }
    });
    if (isMobile) await openGlobalSearch(page);
    const search = page.getByRole("combobox", { name: "Search Powerplants One", exact: true });
    await search.fill(contact.display_name);
    const option = page.getByRole("option").filter({ has: page.getByText(contact.display_name, { exact: true }) });
    await expect(option).toBeVisible();
    if (selection === "keyboard") {
      await search.press("ArrowDown"); await search.press("Enter");
    } else if (isMobile) await option.tap();
    else await option.click();
    expect(confirmations).toBe(1);
    await expect(page).toHaveURL(origin() + `/people/${id}`);
    await expect(name).toHaveValue(draft);
    // Dirty stays true: no remount or clean/dirty effect cycle may rearm the guard.
    const laterDraft = "SYN later correction still needs protection";
    await name.fill(laterDraft);
    // A dismissed beforeunload has no new document to await with page.reload().
    await page.evaluate(() => window.location.reload()).catch(() => {});
    await expect.poll(() => unloadWarnings, { message: "Chrome must still warn before discarding the later draft" }).toBe(1);
    await expect(page).toHaveURL(origin() + `/people/${id}`);
    await expect(name).toHaveValue(laterDraft);
    expect(saves).toBe(0);
    // Approval remains available for a real departure, with one review only.
    if (isMobile) await openGlobalSearch(page);
    await search.fill("opportunity");
    const deals = page.getByRole("option").filter({ has: page.getByText("Deals", { exact: true }) }).first();
    await expect(deals).toBeVisible(); await deals.click();
    await expect(page).toHaveURL(origin() + "/sales/opportunities");
    expect(confirmations).toBe(2);
    expect(saves).toBe(0);
  });
}

// F42 / principle 11: typing into a create form and then following the rail (the phone
// bar), a header search result or browser Back asks before discarding it; a clean form just leaves.
for (const form of [
  { path: "/customers/new", label: "Display name" },
  { path: "/service/tickets/new", label: "Summary" },
  { path: "/work/new", label: "What needs doing?" },
  { path: "/service/work-orders/new", label: "Company context", option: CRM.company },
  { path: "/sales/opportunities/new", label: "Qualification outcome" },
]) test(`F42 ${form.path} asks before rail, header or Back discards typed input`, async ({ page, isMobile }) => {
  await login(page);
  const prompts: string[] = [];
  let leave = false;
  page.on("dialog", dialog => { prompts.push(dialog.type()); void (leave ? dialog.accept() : dialog.dismiss()); });
  const control = page.getByLabel(form.label, { exact: true });
  // Back needs an earlier entry; each visit opens the form afresh.
  const open = async () => {
    await page.goto("/customers"); await page.goto(form.path);
    await expect(control).toBeEnabled();
    await expect(identityToggle(page)).toBeEnabled();
  };
  const rail = async () => {
    const links = page.locator(isMobile ? ".mobile-navigation a[href]" : ".ppo-primary-nav a[href]");
    const paths = await links.evaluateAll(all => all.map(link => new URL((link as HTMLAnchorElement).href).pathname));
    return links.nth(paths.findIndex(path => path !== new URL(page.url()).pathname));
  };
  // The header's global search is on every page and opens its result through navigateWithReview.
  const header = async () => {
    if (isMobile) await openGlobalSearch(page);
    await page.getByRole("combobox", { name: "Search Powerplants One", exact: true }).fill("opportunity");
    const option = page.getByRole("option").filter({ has: page.getByText("Deals", { exact: true }) }).first();
    await expect(option).toBeVisible();
    if (isMobile) await option.tap(); else await option.click();
  };
  const routes: { name: string; go: () => Promise<unknown> }[] = [
    { name: "rail", go: async () => (await rail()).click() },
    { name: "header search", go: header },
    { name: "Back", go: () => page.evaluate(() => history.back()).catch(() => {}) },
  ];
  for (const route of routes) {
    await open();
    await route.go();
    await expect(page, `a clean form leaves by ${route.name} without asking`).not.toHaveURL(new RegExp(`${form.path}$`));
    expect(prompts).toEqual([]);
  }
  await open();
  if (form.option) await control.selectOption(form.option); else await control.fill("SYN F42 typed and not yet saved");
  const typed = await control.inputValue();
  for (const [index, route] of routes.entries()) {
    await route.go();
    await expect.poll(() => prompts.length, { message: `${route.name} asks before leaving` }).toBe(index + 1);
    await expect(page).toHaveURL(origin() + form.path);
    await expect(control).toHaveValue(typed);
    await page.keyboard.press("Escape");
  }
  // Confirming the prompt is a real departure, asked once.
  leave = true;
  const target = await rail(), href = new URL((await target.getAttribute("href"))!, origin());
  await target.click();
  await expect(page).toHaveURL(new RegExp(`^${origin()}${href.pathname}`));
  expect(prompts).toHaveLength(routes.length + 1);
});

test("N18/N19 primary rail expands, persists and retains endpoints in a short window", async ({ page, isMobile }) => {
  test.skip(isMobile,"Primary rail is a desktop control; mobile uses More and its Workspaces links.");
  await login(page);
  // The overview is an eight-row due-ordered window, not a complete register.
  // Place this owned synthetic fixture before its current earliest item.
  const priorRead=await page.request.get("/api/v1/work/overview?owner=mine&sort=Due");
  expect(priorRead.status()).toBe(200);
  const prior=await priorRead.json();
  const firstDue=Math.min(Date.parse(prior.observed_at),...prior.activities.items.map(
    (a:{starts_at:string|null;due_at:string})=>Date.parse(a.starts_at??a.due_at),
  ));
  const fixture=crmDiscovery();fixture.initial_action.summary="SYN NAV readable expanded activity context";
  fixture.initial_action.due_at=new Date(firstDue-3600000).toISOString();fixture.initial_action.due_needed=false;
  const created=await page.request.post("/api/v1/crm/opportunities",{headers:{Origin:origin()},data:fixture});
  expect(created.ok(),await created.text()).toBe(true);
  const overview=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/v1/work/overview"&&r.request().method()==="GET");
  await page.goto("/work?department=service"); const renderedRead=await overview;
  expect(renderedRead.status()).toBe(200);expect(await renderedRead.finished()).toBeNull();
  expect((await renderedRead.json()).activities.items.map((a:{id:string})=>a.id)).toContain(fixture.initial_action.id);
  await page.getByRole("button",{name:"Collapse primary navigation",exact:true}).click();
  await page.getByRole("button",{name:"Expand primary navigation",exact:true}).click();
  await expect(page.getByRole("button",{name:"Collapse primary navigation",exact:true})).toHaveAttribute("aria-expanded","true");
  expect(await page.locator(".ppo-rail").evaluate(el=>el.getBoundingClientRect().width)).toBe(240);
  await expect(page.getByText("Loading your work…", {exact:true})).not.toBeVisible();
  const row=page.locator(`.mw-activities [data-activity='${fixture.initial_action.id}'] .mw-row-main`);
  await expect(row).toBeVisible();expect((await row.boundingBox())!.width).toBeGreaterThanOrEqual(240);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:test.info().outputPath("expanded-desktop.png")});
  await page.reload(); await expect(page.getByRole("button",{name:"Collapse primary navigation",exact:true})).toBeVisible();
  await login(page,"observer");await page.reload();
  await page.getByRole("button",{name:"Collapse primary navigation",exact:true}).click();
  await expect(page.getByRole("button",{name:"Expand primary navigation",exact:true})).toBeEnabled();
  await login(page);await page.reload();
  await expect(page.getByRole("button",{name:"Collapse primary navigation",exact:true})).toBeVisible();
  await page.setViewportSize({width:1280,height:400});
  await page.getByRole("button",{name:"More",exact:true}).click();
  await expect(page.locator("#desktop-more-panel").getByRole("link",{name:"Sales",exact:true})).toBeVisible();
  await expect(page.getByText("Loading your work…",{exact:true})).not.toBeVisible();
  await page.screenshot({path:test.info().outputPath("expanded-short-more.png")});
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:"Collapse primary navigation",exact:true}).click();
  expect(await page.locator(".ppo-rail").evaluate(el=>el.getBoundingClientRect().width)).toBe(76);
});
test("N18 blocked storage retains expansion for the current identity and visit", async ({page,isMobile})=>{
  test.skip(isMobile,"Desktop primary rail persistence.");
  await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error("SYN storage denied");};Storage.prototype.getItem=()=>{throw Error("SYN storage denied");};});
  await login(page);
  // The session check re-reads the shell context but keeps the current one meanwhile,
  // so the first enabled toggle can be clicked straight away.
  await page.goto("/sales/opportunities");
  await page.getByRole("button",{name:"Collapse primary navigation",exact:true}).click();
  await page.getByRole("button",{name:"Expand primary navigation",exact:true}).click();
  await expect(page.getByRole("button",{name:"Collapse primary navigation",exact:true})).toBeVisible();
  await page.locator(".ppo-primary-nav").getByRole("link",{name:"Leads",exact:true}).click();
  await expect(page).toHaveURL(/\/sales\/leads$/);
  await expect(page.getByRole("button",{name:"Collapse primary navigation",exact:true})).toBeVisible();
});
test("N18 rail toggle stays enabled through the session check after load", async ({page,isMobile})=>{
  test.skip(isMobile,"Desktop primary rail.");
  // Sample the toggle's disabled state every animation frame from the first paint.
  await page.addInitScript(()=>{
    const states:string[]=[];(window as unknown as {railStates:string[]}).railStates=states;
    const sample=()=>{const button=document.querySelector<HTMLButtonElement>(".ppo-rail-toggle");
      const state=!button?"absent":button.disabled?"disabled":"enabled";if(states.at(-1)!==state)states.push(state);requestAnimationFrame(sample);};
    requestAnimationFrame(sample);
  });
  await login(page);
  let started=0,settled=0;const shellRead=(r:{url():string})=>new URL(r.url()).pathname==="/api/v1/shell/context";
  page.on("request",r=>{if(shellRead(r))started++;});
  page.on("requestfinished",r=>{if(shellRead(r))settled++;});page.on("requestfailed",r=>{if(shellRead(r))settled++;});
  await page.goto("/sales/opportunities");
  // The first read, then the re-read after BusinessSession confirms the identity.
  await expect.poll(()=>started>=2&&settled===started).toBe(true);
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const states=await page.evaluate(()=>(window as unknown as {railStates:string[]}).railStates);
  expect(states,"the toggle must not disable again once enabled").toContain("enabled");
  expect(states.slice(states.indexOf("enabled"))).toEqual(["enabled"]);
});

test("N12Sales Activities preserves selected day in rail, phone, More and search",async({page,isMobile})=>{
  await login(page);const day="2026-09-08",href=`/calendar?day=${day}&scope=sales&department=sales`;
  await page.goto(href);
  const nav=page.getByRole("navigation",{name:isMobile?"Mobile navigation":"Sales shortcuts",exact:true});
  await expect(nav.getByRole("link",{name:"Activities",exact:true})).toHaveAttribute("href",href);
  await page.getByRole("button",{name:"More",exact:true}).click();
  await expect(page.locator(".ppo-more-panel:visible").getByRole("link",{name:"Activities",exact:true})).toHaveAttribute("href",href);
  await page.keyboard.press("Escape");
  if(isMobile)await openGlobalSearch(page);
  const search=page.getByRole("combobox",{name:"Search Powerplants One",exact:true});await search.fill("activities");
  const result=page.getByRole("option").filter({has:page.getByText("Activities",{exact:true})}).first();await result.click();
  await expect(page).toHaveURL(origin()+href);
  await page.goto("/work?department=service");await page.getByRole("button",{name:"More",exact:true}).click();
  await expect(page.locator(".ppo-more-panel:visible").getByRole("link",{name:"Personal Calendar",exact:true})).toHaveAttribute("href","/calendar?department=service");
});

test("N11 blank workspace More opens each permitted operational entry",async({page})=>{
  for(const [profile,workspace,target,label,api,title] of [
    ["coordinator","estimate","/estimating/intake","Intake","/api/v1/sales/handovers","Estimating Intake"],
    ["assigned-technician","service","/my-jobs/inspections","My inspections","/api/v1/my-jobs/inspections","My inspections"],
    ["coordinator","service","/service/incidents","Incidents and actions","/api/v1/service/incidents","Incidents and corrective actions"],
    ["coordinator","service","/service/inspections","Inspection review","/api/v1/service/inspections","Inspection review"],
  ]){
    await login(page,profile);await page.goto(`/work?department=${workspace}`);
    await page.getByRole("button",{name:"More",exact:true}).click();
    const link=page.locator(".ppo-more-panel:visible").getByRole("link",{name:label,exact:true});
    await expect(link).toHaveAttribute("href",target);
    const read=page.waitForResponse(r=>new URL(r.url()).pathname===api&&r.request().method()==="GET"&&r.ok());
    await link.click();await read;await expect(page).toHaveURL(origin()+target);
    await expect(page.getByRole("heading",{name:title,level:1,exact:true})).toBeVisible();
  }
});
