import { test, expect, type Page } from "@playwright/test";
import { CRM, crmCreate } from "../helpers/crm";
test.describe.configure({ timeout:120000 });
async function call(page:Page,path:string,body?:unknown) {
  const r=await page.request.fetch(`/api/v1/${path}`,{method:body===undefined?"GET":"POST",headers:body===undefined?{}:{Origin:"http://127.0.0.1:3000"},data:body});
  expect(r.ok(),await r.text()).toBe(true);return r.json();
}
test("mobile CRM completion, Brisbane follow-up and record links persist through reload",async({page},info)=>{
  await call(page,"local-session",{profile:"coordinator"});
  const input=crmCreate(); await call(page,"crm/opportunities",input);
  await page.goto(`/crm/opportunities/${input.id}`);
  await page.getByRole("link",{name:"Open activity",exact:true}).click();
  await page.getByLabel("Completion outcome or cancellation reason",{exact:true}).fill("SYN Confirmed the required growing area with the customer.");
  await page.getByLabel("Reason for change",{exact:true}).fill("SYN Customer discussion completed");
  await page.getByRole("button",{name:"Complete with outcome",exact:true}).click();
  await expect(page.getByText("Completed",{exact:true}).first()).toBeVisible();
  await page.reload();
  await page.getByRole("link",{name:"Return to opportunity and plan follow-up"}).click();
  await expect(page.getByRole("heading",{name:"Next action needed",exact:true})).toBeVisible();
  await page.getByLabel("Action purpose",{exact:true}).fill("SYN Confirm tunnel controller settings");
  await page.getByLabel("Due date needed",{exact:true}).uncheck();
  await page.getByLabel("Due date and time",{exact:true}).fill("2026-10-04T10:15");
  await page.getByRole("button",{name:"Save next action",exact:true}).click();
  await expect(page.getByText("Saved to the server",{exact:true})).toBeVisible();
  await page.reload();
  const o=(await call(page,`crm/opportunities/${input.id}`)).items[0];
  expect(o.next_activity.due_at).toBe("2026-10-04T00:15:00.000Z");
  expect(o.next_activity.id).not.toBe(input.initial_action.id);
  expect(o.actions.find((a:{id:string})=>a.id===input.initial_action.id).status).toBe("Completed");
  expect(o.actions).toHaveLength(2);
  await page.getByRole("tab",{name:"Details",exact:true}).click();
  await expect(page.getByText("Requirements and scope",{exact:true})).toBeVisible();
  await expect(page.locator(`a[href="/sites/${CRM.site}"]`)).toBeVisible();
  await page.screenshot({path:info.outputPath("mobile-crm-details.png")});
  await page.getByRole("tab",{name:"Timeline",exact:true}).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab",{name:"Details",exact:true})).toBeFocused();
  await expect(page.getByRole("tab",{name:"Details",exact:true})).toHaveAttribute("aria-selected","true");
});

test("organisation summary opens the full Sites hierarchy; mobile menu contains keyboard focus",async({page},info)=>{
  await call(page,"local-session",{profile:"coordinator"});
  await page.goto(`/customers/${CRM.org}`);
  await expect(page.locator(".site-summary")).toContainText("linked sites");
  await expect(page.locator(".site-card:visible")).toHaveCount(0);
  await page.getByRole("button",{name:"View sites",exact:true}).click();
  await expect(page.getByRole("tab",{name:"Sites",exact:true})).toBeFocused();
  await expect(page.locator(".site-card").first()).toBeVisible();
  await page.screenshot({path:info.outputPath("organisation-sites.png")});
  if(info.project.use.isMobile) {
    await page.setViewportSize({width:320,height:640});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole("button",{name:"Menu",exact:true}).click();
    const dialog=page.getByRole("dialog",{name:"Powerplants One"}); await expect(dialog).toBeVisible();
    for(let i=0;i<16;i++){await page.keyboard.press("Tab");expect(await dialog.evaluate(e=>e.contains(document.activeElement))).toBe(true);}
    await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("button",{name:"Menu",exact:true})).toBeFocused();
    const targets=await page.locator('.mobile-navigation a,.mobile-navigation button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
    expect(targets.every(h=>h>=44)).toBe(true);
  }
});

test("typing after organisation selection clears its ID and dependent context",async({page})=>{
  await call(page,"local-session",{profile:"coordinator"});await page.goto("/crm/opportunities/new");
  await page.getByLabel("Visibility company",{exact:true}).selectOption(CRM.company);
  const organisation=page.getByRole("combobox",{name:"Organisation",exact:true});await organisation.fill("SYN");
  await page.locator(`[role=option][data-record-id="${CRM.org}"]`).click();
  await expect(page.getByRole("combobox",{name:"Site",exact:true})).toBeVisible();
  await organisation.fill("SYN no match for mobile lookup");
  await expect(page.getByRole("combobox",{name:"Site",exact:true})).toHaveCount(0);
  await expect(page.getByText("No matches. Try another name or reference.",{exact:true})).toBeVisible();
  page.once("dialog",d=>d.dismiss());
  await page.getByRole("link",{name:"Back to sales worklist",exact:true}).click();
  await expect(page).toHaveURL(/\/crm\/opportunities\/new$/);
  await expect(organisation).toHaveValue("SYN no match for mobile lookup");
});
