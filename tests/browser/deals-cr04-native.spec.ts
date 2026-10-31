import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { CRM, crmBase, crmDiscovery } from "../helpers/crm";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3404"}`;
test.describe.configure({timeout:240000});
test.use({viewport:{width:1440,height:960},actionTimeout:30000});
async function call(page: Page,path:string,body?:unknown){
 const r=await page.request.fetch(`${origin}/api/v1/${path}`,{method:body===undefined?"GET":"POST",headers:{Origin:origin},data:body});
 expect(r.ok(),await r.text()).toBe(true); return r.json();
}
test.beforeEach(async({page})=>{await call(page,"local-session",{profile:"coordinator"});});
async function open(page:Page,id:string,title:string){
 await page.goto(origin+"/sales/opportunities?view=Board&q="+encodeURIComponent(title));
 await expect(page.locator(`[data-opportunity-id="${id}"]`)).toBeVisible({timeout:30000});
}
async function pick(page:Page,label:string,id:string){
 await page.getByRole("combobox",{name:label,exact:true}).click();
 await page.locator(`[role="option"][data-record-id="${id}"]`).click();
}
test("CR-04 native Add deal modal preserves the original intent after an accepted save loses its response",async({page},info)=>{
 await page.goto(origin+"/sales/opportunities?view=Grid");
 await page.getByRole("button",{name:"Add deal",exact:true}).filter({visible:true}).click();
 const dialog=page.getByRole("dialog",{name:"Add deal",exact:true});
 await expect(dialog.getByLabel("Deal title",{exact:true})).toBeVisible({timeout:30000});
 await dialog.getByLabel("Visibility company",{exact:true}).selectOption(CRM.company);
 await pick(page,"Organisation",CRM.org); await pick(page,"Site",CRM.site); await pick(page,"Contact",CRM.person); await pick(page,"Deal owner",CRM.owner);
 const title="SYN CR04 modal recovery "+randomUUID();
 await dialog.getByLabel("Deal title",{exact:true}).fill(title);
 await dialog.getByLabel("Qualification outcome",{exact:true}).fill("SYN Known need reviewed; no order authority.");
 await dialog.getByLabel("Customer need",{exact:true}).fill("SYN Review controls for the fictional growing area.");
 await dialog.getByLabel("Source context (synthetic)",{exact:true}).fill("SYN Fictional conversation");
 await pick(page,"Activity owner",CRM.owner);
 await dialog.getByLabel("Action purpose",{exact:true}).fill("SYN Review fictional control needs");
 await page.screenshot({path:info.outputPath("application-add-filled-1440.png")});
 let operation="",id="";
 await page.route("**/api/v1/crm/opportunities",async route=>{
  if(route.request().method()!=="POST") return route.continue();
  const input=route.request().postDataJSON(); operation=input.operation_id; id=input.id;
  const accepted=await route.fetch(); expect(accepted.ok(),await accepted.text()).toBe(true); await route.abort("connectionfailed");
 },{times:1});
 await dialog.getByRole("button",{name:"Add deal",exact:true}).click();
 await expect(dialog.getByRole("button",{name:"Confirm original save outcome"})).toBeVisible({timeout:30000});
 await expect(dialog.getByRole("button",{name:"Cancel",exact:true})).toBeDisabled();
 await dialog.getByRole("button",{name:"Confirm original save outcome"}).click();
 await expect(dialog).toHaveCount(0,{timeout:30000});
 await expect(page.locator(".crm-deal-dialog")).toContainText(title);
 const saved=(await call(page,`crm/opportunities/${id}`)).items[0];
 expect(saved.version).toBe(1); expect(saved.value_amount).toBeNull(); expect(saved.actions).toHaveLength(1);
 expect((await call(page,`operations/${operation}`)).record_id).toBe(id);
});
test("CR-04 native keyboard stage change rejects a stale version and keeps the proposal for comparison",async({page},info)=>{
 const input={...crmDiscovery(),title:"SYN CR04 stale stage "+randomUUID()}; await call(page,"crm/opportunities",input);
 await open(page,input.id,input.title);
 const trigger=page.getByRole("button",{name:`Change stage for ${input.title}`,exact:true});
 await trigger.focus(); await page.keyboard.press("Enter");
 const dialog=page.getByRole("dialog",{name:"Change deal stage",exact:true});
 await dialog.getByLabel("Deal stage",{exact:true}).selectOption("Scoping");
 await dialog.getByLabel("Reason for change",{exact:true}).fill("SYN Keyboard stage review");
 await call(page,`crm/opportunities/${input.id}/stage`,{...crmBase(),expected_version:1,stage_id:"Scoping",qualification_note:null,identification_activity_id:null});
 await dialog.getByRole("button",{name:"Save stage",exact:true}).click();
 await expect(dialog.getByRole("button",{name:"Load current saved version for comparison"})).toBeVisible({timeout:30000});
 await expect(dialog.getByLabel("Deal stage",{exact:true})).toHaveValue("Scoping");
 await page.screenshot({path:info.outputPath("application-stale-stage-1440.png")});
 await dialog.getByRole("button",{name:"Load current saved version for comparison"}).click();
 await expect(dialog.getByText(/saved version 2/i)).toBeVisible();
 await dialog.getByLabel("Deal stage",{exact:true}).selectOption("Quoting");
 await dialog.getByRole("button",{name:"Save stage",exact:true}).click();
 await expect(dialog).toHaveCount(0,{timeout:30000});
 const saved=(await call(page,`crm/opportunities/${input.id}`)).items[0]; expect(saved.version).toBe(3); expect(saved.stage_id).toBe("Quoting");
});
test("CR-04 native Won prompt preserves receiving acceptance and Lost recovers an accepted response exactly once",async({page},info)=>{
 for(const outcome of ["Won","Lost"] as const){
  const input={...crmDiscovery(),title:`SYN CR04 ${outcome} `+randomUUID()}; await call(page,"crm/opportunities",input);
  let version=1;
  if(outcome==="Won")for(const stage_id of ["Scoping","Quoting","Negotiation","Closing"])await call(page,`crm/opportunities/${input.id}/stage`,{...crmBase(),expected_version:version++,stage_id,qualification_note:null,identification_activity_id:null});
  await open(page,input.id,input.title);
  await page.getByRole("button",{name:`Snapshot: ${input.title}`,exact:true}).click();
  await page.getByRole("button",{name:`Record ${outcome}`,exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"Record sales outcome",exact:true});
  await dialog.getByLabel("Outcome evidence source",{exact:true}).selectOption("Independent");
  await dialog.getByLabel("Separate outcome evidence",{exact:true}).fill("SYN Separate fictional Sales evidence");
  if(outcome==="Won")await dialog.getByLabel("Acceptance or order evidence").fill("SYN Fictional accepted scope; delivery still requires explicit receiving acceptance");
  else await dialog.getByLabel("Lost reason").selectOption("Timing");
  await dialog.getByLabel("Reason for change",{exact:true}).fill("SYN Native outcome proof");
  await page.screenshot({path:info.outputPath(`application-record-${outcome.toLowerCase()}-1440.png`)});
  let operation="";
  if(outcome==="Lost")await page.route(`**/api/v1/crm/opportunities/${input.id}/outcome`,async route=>{operation=route.request().postDataJSON().operation_id;const r=await route.fetch();expect(r.ok(),await r.text()).toBe(true);await route.abort("connectionfailed");},{times:1});
  await dialog.getByRole("button",{name:"Record outcome",exact:true}).click();
  if(outcome==="Lost"){
   await expect(dialog.getByRole("button",{name:"Confirm original save outcome"})).toBeVisible({timeout:30000});
   await expect(dialog.getByLabel("Lost reason")).toBeDisabled(); await dialog.getByRole("button",{name:"Confirm original save outcome"}).click();
  }
  await expect(dialog).toHaveCount(0,{timeout:30000});
  const saved=(await call(page,`crm/opportunities/${input.id}`)).items[0]; expect(saved.close_outcome).toBe(outcome); expect(saved.version).toBe(version+1); expect(saved.events.filter((e:{event_type:string})=>e.event_type==="OpportunityOutcomeRecorded")).toHaveLength(1);
  if(outcome==="Won"){
   await expect(page.locator(".crm-won-feedback")).toContainText("explicitly accept");
   await page.screenshot({path:info.outputPath("application-won-recorded-1440.png")});
   await expect(page.getByRole("link",{name:"Open receiving handover",exact:true})).toHaveAttribute("href",`/sales/handoffs/won?opportunity_id=${input.id}`);
   expect((await call(page,`crm/opportunities/${input.id}/follow-through`)).handovers.items).toHaveLength(0);
   await page.getByRole("link",{name:"Open receiving handover",exact:true}).click();
   await expect(page).toHaveURL(new RegExp(`/sales/handoffs/won\\?opportunity_id=${input.id}`));
  }else expect((await call(page,`operations/${operation}`)).state).toBe("Lost");
 }
});
