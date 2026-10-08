import { test, expect, type Page } from "@playwright/test";
import { crmDiscovery } from "../helpers/crm";
import { leadCreate } from "../helpers/leads";
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
  const picker = page.getByLabel("Workspace", {exact:true});
  await expect(picker).toBeVisible();
  expect(await picker.locator("option").allTextContents()).not.toContain("Finance");
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
  await page.getByLabel("Workspace",{exact:true}).selectOption("engineering");
  await expect(page).toHaveURL(/\/work\/updates$/); await expect(time).toHaveValue(value);
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key.startsWith("ppo.shell"))))).toEqual(preference);
  await page.keyboard.press("Escape");
  if(isMobile) await page.getByRole("button",{name:"Open global search",exact:true}).click();
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
  if(isMobile)await page.getByRole("button",{name:"Open global search",exact:true}).click();
  await search.click();await search.fill("opportunity");await expect(option).toBeVisible();await option.click();
  await expect(page).toHaveURL(/\/sales\/opportunities/);
});
test("N18/N19 primary rail expands, persists and retains endpoints in a short window", async ({ page, isMobile }) => {
  test.skip(isMobile,"Primary rail is a desktop control; mobile uses labelled More/Workspace.");
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
  await page.getByRole("button",{name:"Expand primary navigation",exact:true}).click();
  await expect(page.getByRole("button",{name:"Collapse primary navigation",exact:true})).toHaveAttribute("aria-expanded","true");
  expect(await page.locator(".ppo-rail").evaluate(el=>el.getBoundingClientRect().width)).toBe(232);
  await expect(page.getByText("Loading your work…", {exact:true})).not.toBeVisible();
  const row=page.locator(`.mw-activities [data-activity='${fixture.initial_action.id}'] .mw-row-main`);
  await expect(row).toBeVisible();expect((await row.boundingBox())!.width).toBeGreaterThanOrEqual(240);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:test.info().outputPath("expanded-desktop.png")});
  await page.reload(); await expect(page.getByRole("button",{name:"Collapse primary navigation",exact:true})).toBeVisible();
  await login(page,"observer");await page.reload();
  await expect(page.getByRole("button",{name:"Expand primary navigation",exact:true})).toBeEnabled();
  await login(page);await page.reload();
  await expect(page.getByRole("button",{name:"Collapse primary navigation",exact:true})).toBeVisible();
  await page.setViewportSize({width:1280,height:400});
  await page.getByRole("button",{name:"More",exact:true}).click();
  await expect(page.getByLabel("Workspace",{exact:true})).toBeVisible();
  await expect(page.getByText("Loading your work…",{exact:true})).not.toBeVisible();
  await page.screenshot({path:test.info().outputPath("expanded-short-more.png")});
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:"Collapse primary navigation",exact:true}).click();
  expect(await page.locator(".ppo-rail").evaluate(el=>el.getBoundingClientRect().width)).toBe(76);
});
test("N18 blocked storage retains expansion for the current identity and visit", async ({page,isMobile})=>{
  test.skip(isMobile,"Desktop primary rail persistence.");
  await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error("SYN storage denied");};Storage.prototype.getItem=()=>{throw Error("SYN storage denied");};});
  await login(page); await page.goto("/sales/opportunities");
  await page.getByRole("button",{name:"Expand primary navigation",exact:true}).click();
  await page.locator(".ppo-primary-nav").getByRole("link",{name:"Leads",exact:true}).click();
  await expect(page.getByRole("button",{name:"Collapse primary navigation",exact:true})).toBeVisible();
});

test("N12 Sales Activities preserves selected day in rail, phone, More and search",async({page,isMobile})=>{
  await login(page);const day="2026-09-08",href=`/calendar?day=${day}&scope=sales&department=sales`;
  await page.goto(href);
  const nav=page.getByRole("navigation",{name:isMobile?"Mobile navigation":"Sales shortcuts",exact:true});
  await expect(nav.getByRole("link",{name:"Activities",exact:true})).toHaveAttribute("href",href);
  await page.getByRole("button",{name:"More",exact:true}).click();
  await expect(page.locator(".ppo-more-panel:visible").getByRole("link",{name:"Activities",exact:true})).toHaveAttribute("href",href);
  await page.keyboard.press("Escape");
  if(isMobile)await page.getByRole("button",{name:"Open global search",exact:true}).click();
  const search=page.getByRole("combobox",{name:"Search Powerplants One",exact:true});await search.fill("activities");
  const result=page.getByRole("option").filter({has:page.getByText("Activities",{exact:true})}).first();await result.click();
  await expect(page).toHaveURL(origin()+href);
  await page.goto("/work?department=service");await page.getByRole("button",{name:"More",exact:true}).click();
  await expect(page.locator(".ppo-more-panel:visible").getByRole("link",{name:"Personal Calendar",exact:true})).toHaveAttribute("href","/calendar?department=service");
});

test("N11 blank workspace More opens each permitted operational entry",async({page})=>{
  for(const [profile,workspace,target,label,api,title] of [
    ["coordinator","estimate","/estimating/intake","Intake","/api/v1/sales/handovers","Estimating Intake"],
    ["assigned-technician","service","/my-jobs/inspections","My inspections","/api/v1/my-jobs/inspections","Inspection capture"],
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
