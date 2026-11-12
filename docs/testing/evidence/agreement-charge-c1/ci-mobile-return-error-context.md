# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-crm.spec.ts >> mobile CRM completion, Brisbane follow-up and record links persist through reload
- Location: tests/browser/mobile-crm.spec.ts:9:1

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByRole('tab', { name: 'Activities', exact: true })

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - link "Skip to main content":
    - /url: "#main"
  - generic [ref=f1e2]:
    - navigation "Mobile navigation" [ref=f1e3]:
      - link "My Work" [ref=f1e4] [cursor=pointer]:
        - /url: /work?department=sales
      - link "Deals" [ref=f1e10] [cursor=pointer]:
        - /url: /sales/opportunities
      - link "Activities" [ref=f1e15] [cursor=pointer]:
        - /url: /calendar?day=2026-11-12&scope=sales&department=sales
      - link "Contacts" [ref=f1e21] [cursor=pointer]:
        - /url: /contacts?department=sales
      - button "More" [ref=f1e26] [cursor=pointer]
    - generic [ref=f1e32]:
      - banner [ref=f1e33]:
        - button "Menu, unread notifications" [ref=f1e34] [cursor=pointer]
        - 'button "Choose view. Current view: My Work" [ref=f1e37] [cursor=pointer]':
          - generic [ref=f1e38]: My Work
        - generic [ref=f1e42]:
          - link "Conversations" [ref=f1e44] [cursor=pointer]:
            - /url: /conversations
          - generic:
            - generic:
              - region "Local demonstration identity"
      - main [ref=f1e48]:
        - region "My Work" [ref=f1e50]:
          - generic [ref=f1e51]:
            - status [ref=f1e52]
            - generic [ref=f1e53]:
              - region "SYN Identify the controls upgrade need" [ref=f1e54]:
                - generic [ref=f1e56]:
                  - paragraph [ref=f1e57]: Activity · Task
                  - heading "SYN Identify the controls upgrade need" [level=1] [ref=f1e58]
                  - generic [ref=f1e59]:
                    - generic [ref=f1e60]: Completed
                    - generic [ref=f1e61]: "Owner: SYN Coordinator"
                    - generic [ref=f1e62]: "Details readable by: Internal staff only"
                - generic [ref=f1e63]:
                  - term [ref=f1e64]: Due
                  - definition [ref=f1e65]: Due date needed
                  - term [ref=f1e66]: Purpose
                  - definition [ref=f1e67]: Customer contact
                  - term [ref=f1e68]: Outcome
                  - definition [ref=f1e69]: SYN Confirmed the required growing area with the customer.
                  - term [ref=f1e70]: Linked to
                  - definition [ref=f1e71]:
                    - list [ref=f1e72]:
                      - listitem [ref=f1e73]:
                        - link "SYN Controls upgrade qualification" [ref=f1e74] [cursor=pointer]:
                          - /url: /crm/opportunities/5c6c313f-843b-4339-9854-bd013472d8ca
                        - generic [ref=f1e75]: · Opportunity, SYN-OPP-000003
                      - listitem [ref=f1e76]:
                        - link "SYN Greenhouse Demonstration" [ref=f1e77] [cursor=pointer]:
                          - /url: /customers/50000000-0000-4000-8000-000000000001
                        - generic [ref=f1e78]: · Customer, SYN-PPO-ORG-000001
                      - listitem [ref=f1e79]:
                        - link "SYN Q01 Demonstration Site" [ref=f1e80] [cursor=pointer]:
                          - /url: /sites/70000000-0000-4000-8000-000000000001
                        - generic [ref=f1e81]: · Site, SYN-PPO-SITE-000001
              - generic [ref=f1e82]:
                - heading "Continue in Sales" [level=2] [ref=f1e83]
                - paragraph [ref=f1e84]: Check Sales for an existing deal before you start a new one. This activity stays open with its owner and due date.
                - button "Refresh Sales follow-up context" [ref=f1e85] [cursor=pointer]
                - paragraph [ref=f1e86]: SYN Identify the controls upgrade need
                - paragraph [ref=f1e87]: "SYN Greenhouse Demonstration · SYN Q01 Demonstration Site · Completed · Owner: SYN Coordinator · Due date needed"
                - generic [ref=f1e88]:
                  - link "SYN-OPP-000003 · SYN Controls upgrade qualification" [ref=f1e89] [cursor=pointer]:
                    - /url: /crm/opportunities/5c6c313f-843b-4339-9854-bd013472d8ca
                  - link "SYN Greenhouse Demonstration" [ref=f1e90] [cursor=pointer]:
                    - /url: /customers/50000000-0000-4000-8000-000000000001
                  - link "SYN Q01 Demonstration Site" [ref=f1e91] [cursor=pointer]:
                    - /url: /sites/70000000-0000-4000-8000-000000000001
                - paragraph [ref=f1e93]:
                  - text: "Linked Deal:"
                  - link "SYN-OPP-000003 · SYN Controls upgrade qualification" [ref=f1e94] [cursor=pointer]:
                    - /url: /sales/opportunities/5c6c313f-843b-4339-9854-bd013472d8ca
                  - text: · Open.
                - paragraph [ref=f1e95]: To prepare a Sales review from this activity, it must be an open customer contact or relationship review that only internal staff can read, not yet linked to Sales, with a due date and you as its owner. For a different need, prepare a separate review.
                - group [ref=f1e96]:
                  - generic "Prepare a separate owned Sales review" [ref=f1e97]
              - paragraph [ref=f1e98]: Recording an activity does not prove that a message was sent, delivered or acknowledged.
              - status
              - paragraph [ref=f1e99]:
                - link "Return to opportunity and plan follow-up" [active] [ref=f1e100] [cursor=pointer]:
                  - /url: /sales/opportunities/5c6c313f-843b-4339-9854-bd013472d8ca
              - button "Compare current saved version" [ref=f1e101] [cursor=pointer]
  - alert [ref=f1e102]
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | import { CRM, crmCreate } from "../helpers/crm";
  3   | import { estimateInput } from "../helpers/estimating";
  4   | test.describe.configure({ timeout:120000 });
  5   | async function call(page:Page,path:string,body?:unknown) {
  6   |   const r=await page.request.fetch(`/api/v1/${path}`,{method:body===undefined?"GET":"POST",headers:body===undefined?{}:{Origin:new URL(test.info().project.use.baseURL!).origin},data:body});
  7   |   expect(r.ok(),await r.text()).toBe(true);return r.json();
  8   | }
  9   | test("mobile CRM completion, Brisbane follow-up and record links persist through reload",async({page},info)=>{
  10  |   await call(page,"local-session",{profile:"coordinator"});
  11  |   const input=crmCreate(); await call(page,"crm/opportunities",input);
  12  |   await page.goto(`/sales/opportunities/${input.id}?section=timeline`);
  13  |   await page.getByRole("link",{name:"Open activity",exact:true}).click();
  14  |   await page.getByLabel("Completion outcome or cancellation reason",{exact:true}).fill("SYN Confirmed the required growing area with the customer.");
  15  |   await page.getByLabel("Reason for change",{exact:true}).fill("SYN Customer discussion completed");
  16  |   await page.getByRole("button",{name:"Complete with outcome",exact:true}).click();
  17  |   await expect(page.getByText("Completed",{exact:true}).first()).toBeVisible();
  18  |   await page.reload();
  19  |   await page.getByRole("link",{name:"Return to opportunity and plan follow-up"}).click();
> 20  |   await page.getByRole("tab",{name:"Activities",exact:true}).click();
      |                                                              ^ Error: locator.click: Test timeout of 120000ms exceeded.
  21  |   await expect(page.getByRole("heading",{name:"Next action needed",exact:true})).toBeVisible();
  22  |   await page.getByLabel("Action purpose",{exact:true}).fill("SYN Confirm tunnel controller settings");
  23  |   await page.getByLabel("Due date needed",{exact:true}).uncheck();
  24  |   await page.getByLabel("Due date and time",{exact:true}).fill("2031-10-05T10:15");
  25  |   await page.getByRole("button",{name:"Save next action",exact:true}).click();
  26  |   await expect(page.getByText("Saved to the server",{exact:true})).toBeVisible();
  27  |   await page.reload();
  28  |   const o=(await call(page,`crm/opportunities/${input.id}`)).items[0];
  29  |   expect(o.next_activity.due_at).toBe("2031-10-05T00:15:00.000Z");
  30  |   expect(o.next_activity.id).not.toBe(input.initial_action.id);
  31  |   expect(o.actions.find((a:{id:string})=>a.id===input.initial_action.id).status).toBe("Completed");
  32  |   expect(o.actions).toHaveLength(2);
  33  |   await page.getByRole("tab",{name:"Scope & sites",exact:true}).click();
  34  |   await expect(page.getByText("Requirements and scope",{exact:true})).toBeVisible();
  35  |   await expect(page.locator(`a[href="/sites/${CRM.site}"]`)).toBeVisible();
  36  |   await page.screenshot({path:info.outputPath("mobile-crm-details.png")});
  37  |   const estimate = estimateInput(input.id);
  38  |   await call(page,"estimating/estimates",estimate);
  39  |   // The tab starts an authorised read. Assert its actual result before the
  40  |   // unchanged UI postcondition; a still-pending read is not an absent link.
  41  |   const [commercialRead] = await Promise.all([
  42  |     page.waitForResponse(response => response.request().method() === "GET" &&
  43  |       new URL(response.url()).pathname === `/api/v1/crm/opportunities/${input.id}/commercial`),
  44  |     page.getByRole("tab",{name:"Estimates & quotations",exact:true}).click(),
  45  |   ]);
  46  |   expect(commercialRead.status(), await commercialRead.text()).toBe(200);
  47  |   expect(commercialRead.headers()["cache-control"]).toBe("private, no-store");
  48  |   expect((await commercialRead.json()).estimate.id).toBe(estimate.id);
  49  |   await expect(page.locator(`a[href="/estimating/estimates/${estimate.id}"]`)).toBeVisible();
  50  |   const commercial = await call(page,`crm/opportunities/${input.id}/commercial`);
  51  |   expect(commercial.estimate.id).toBe(estimate.id);
  52  |   await page.getByRole("tab",{name:"Overview",exact:true}).focus();
  53  |   await page.keyboard.press("ArrowRight");
  54  |   await expect(page.getByRole("tab",{name:"Scope & sites",exact:true})).toBeFocused();
  55  |   await expect(page.getByRole("tab",{name:"Scope & sites",exact:true})).toHaveAttribute("aria-selected","true");
  56  | });
  57  | 
  58  | test("organisation summary opens the full Sites hierarchy; mobile menu contains keyboard focus",async({page},info)=>{
  59  |   await call(page,"local-session",{profile:"coordinator"});
  60  |   await page.goto(`/customers/${CRM.org}`);
  61  |   await expect(page.getByRole("tab",{name:"Overview",exact:true})).toHaveAttribute("aria-selected","true");
  62  |   const sitesTab=page.getByRole("tab",{name:"Sites",exact:true});
  63  |   await sitesTab.focus();
  64  |   await page.keyboard.press("Enter");
  65  |   await expect(sitesTab).toBeFocused();
  66  |   await expect(sitesTab).toHaveAttribute("aria-selected","true");
  67  |   await expect(page).toHaveURL(/view=sites/);
  68  |   const sitesPanel=page.getByRole("tabpanel");
  69  |   const siteLink=sitesPanel.locator(`a[href="/sites/${CRM.site}"]`).filter({hasText:"SYN-SITE-"});
  70  |   await expect(siteLink).toBeVisible();
  71  |   await expect(sitesPanel.locator(`a[href="/facilities?organisation_id=${CRM.org}"]`)).toBeVisible();
  72  |   await page.screenshot({path:info.outputPath("organisation-sites.png")});
  73  |   if(info.project.use.isMobile) {
  74  |     await page.setViewportSize({width:320,height:640});
  75  |     expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  76  |     await page.getByRole("button",{name:"More",exact:true}).click();
  77  |     const dialog=page.getByRole("dialog", { name: "More", exact: true }); await expect(dialog).toBeVisible();
  78  |     for(let i=0;i<16;i++){await page.keyboard.press("Tab");expect(await dialog.evaluate(e=>e.contains(document.activeElement))).toBe(true);}
  79  |     await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
  80  |     await expect(page.getByRole("button",{name:"More",exact:true})).toBeFocused();
  81  |     const targets=await page.locator('.mobile-navigation a,.mobile-navigation button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
  82  |     expect(targets.every(h=>h>=44)).toBe(true);
  83  |   }
  84  | });
  85  | 
  86  | test("typing after organisation selection clears its ID and dependent context",async({page})=>{
  87  |   await call(page,"local-session",{profile:"coordinator"});await page.goto("/sales/opportunities/new");
  88  |   await page.getByLabel("Visibility company",{exact:true}).selectOption(CRM.company);
  89  |   const organisation=page.getByRole("combobox",{name:"Organisation",exact:true});await organisation.fill("SYN");
  90  |   await page.locator(`[role=option][data-record-id="${CRM.org}"]`).click();
  91  |   await expect(page.getByRole("combobox",{name:"Site",exact:true})).toBeVisible();
  92  |   await organisation.fill("SYN no match for mobile lookup");
  93  |   await expect(page.getByRole("combobox",{name:"Site",exact:true})).toHaveCount(0);
  94  |   await expect(page.getByText("No matches. Try another name or reference.",{exact:true})).toBeVisible();
  95  |   page.once("dialog",d=>d.dismiss());
  96  |   await page.getByRole("link",{name:"Back to sales worklist",exact:true}).click();
  97  |   await expect(page).toHaveURL(/\/sales\/opportunities\/new$/);
  98  |   await expect(organisation).toHaveValue("SYN no match for mobile lookup");
  99  | });
  100 | 
```