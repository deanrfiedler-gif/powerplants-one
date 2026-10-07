# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sales-followup.spec.ts >> LC-17 Project need creates and recovers a native Lead, then explicitly links and plans the retained Activity
- Location: tests\browser\sales-followup.spec.ts:72:1

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Add lead', exact: true })
    - locator resolved to <button aria-label="Add lead" class="lead-add lead-primary">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <dialog open="" class="lead-modal " aria-labelledby="lead-dialog-title">…</dialog> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <dialog open="" class="lead-modal " aria-labelledby="lead-dialog-title">…</dialog> intercepts pointer events
    - retrying click action
      - waiting 100ms
    223 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <dialog open="" class="lead-modal " aria-labelledby="lead-dialog-title">…</dialog> intercepts pointer events
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content":
    - /url: "#main"
  - generic [ref=e2]:
    - complementary "Application navigation" [ref=e3]:
      - link "Powerplants One home" [ref=e4] [cursor=pointer]:
        - /url: /
        - img "Powerplants Australia" [ref=e5]
      - navigation "Sales shortcuts" [ref=e6]:
        - link "Pulse" [ref=e7] [cursor=pointer]:
          - /url: /sales/pulse
        - link "Leads" [ref=e13] [cursor=pointer]:
          - /url: /sales/leads
        - link "Deals" [ref=e18] [cursor=pointer]:
          - /url: /sales/opportunities
        - link "Activities" [ref=e24] [cursor=pointer]:
          - /url: /calendar?scope=sales&department=sales
        - link "Tasks" [ref=e32] [cursor=pointer]:
          - /url: /sales/tasks
        - link "Sales Inbox" [ref=e40] [cursor=pointer]:
          - /url: /email?department=sales
        - link "Contacts" [ref=e46] [cursor=pointer]:
          - /url: /contacts?department=sales
      - button "More" [ref=e54] [cursor=pointer]
    - generic [ref=e59]:
      - banner [ref=e60]:
        - navigation "Breadcrumb" [ref=e61]:
          - list "Sales / Leads" [ref=e62]:
            - listitem [ref=e63]:
              - link "Sales" [ref=e64] [cursor=pointer]:
                - /url: /sales/opportunities
            - listitem [ref=e65]:
              - text: /
              - generic [ref=e66]: Leads
        - generic [ref=e67]:
          - generic [ref=e68]:
            - generic [ref=e69]:
              - combobox "Search Powerplants One" [ref=e73]
              - generic [aria-hidden] [ref=e74]: Ctrl K
            - button "Quick add" [ref=e75] [cursor=pointer]
          - generic [ref=e78]:
            - button "Design and build workspace" [ref=e79] [cursor=pointer]
            - button "Page guide" [ref=e82] [cursor=pointer]
            - button "Quick Help" [ref=e86] [cursor=pointer]
            - button "Notifications" [ref=e90] [cursor=pointer]
        - region "Local demonstration identity" [ref=e95]:
          - button "Change identity" [ref=e97] [cursor=pointer]:
            - generic [aria-hidden] [ref=e98]: SC
      - main [ref=e99]:
        - region "Leads workspace" [ref=e101]:
          - generic [ref=e102]:
            - navigation "Lead lifecycle" [ref=e103]:
              - button "Inbox" [ref=e104] [cursor=pointer]
              - button "Archived" [ref=e107] [cursor=pointer]
              - button "Disqualified" [ref=e110] [cursor=pointer]
              - button "Converted" [ref=e113] [cursor=pointer]
            - generic [ref=e116]:
              - heading "Leads" [level=1] [ref=e117]
              - generic [ref=e118]:
                - button "Add lead" [ref=e119] [cursor=pointer]:
                  - generic [ref=e122]: Lead
                - button "Add lead options" [ref=e123] [cursor=pointer]
            - generic [ref=e126]:
              - generic [ref=e127]: 0 leads
              - generic [ref=e128]:
                - button "Lead owner" [ref=e129] [cursor=pointer]:
                  - generic [ref=e132]: Everyone
                - button "Filters" [ref=e135] [cursor=pointer]
                - button "Sort order" [ref=e141] [cursor=pointer]:
                  - generic [ref=e144]: Newest
              - button "Leads options" [ref=e147] [cursor=pointer]
          - generic [ref=e150]:
            - paragraph [ref=e151]: Drag the divider to resize. Left and Right change width by 10 pixels, Shift by 50. Home and End set minimum and maximum widths. Double-click fits this page’s content. Escape cancels dragging.
            - region "Leads list" [ref=e152]:
              - table [ref=e153]:
                - rowgroup [ref=e165]:
                  - row [ref=e166]:
                    - columnheader [ref=e167]:
                      - checkbox "Select all leads on this page" [disabled] [ref=e168] [cursor=pointer]
                    - columnheader [ref=e169]:
                      - text: Lead title
                      - separator "Resize Lead title column" [ref=e170]
                    - columnheader [ref=e171]:
                      - text: Organisation
                      - separator "Resize Organisation column" [ref=e172]
                    - columnheader [ref=e173]:
                      - text: Contact
                      - separator "Resize Contact column" [ref=e174]
                    - columnheader [ref=e175]:
                      - text: Status
                      - separator "Resize Status column" [ref=e176]
                    - columnheader [ref=e177]:
                      - text: Lead owner
                      - separator "Resize Lead owner column" [ref=e178]
                    - columnheader [ref=e179]:
                      - text: Next activity
                      - separator "Resize Next activity column" [ref=e180]
                    - columnheader [ref=e181]:
                      - text: Next activity due
                      - separator "Resize Next activity due column" [ref=e182]
                    - columnheader "Date added" [ref=e183]
                    - columnheader [ref=e184]:
                      - button "Columns" [ref=e185] [cursor=pointer]
                - rowgroup
              - generic [ref=e188]:
                - heading "No active leads" [level=2] [ref=e191]
                - paragraph [ref=e192]: Leads will appear here as you work through enquiries.
                - button "+ Lead" [ref=e193] [cursor=pointer]
            - generic [ref=e194]:
              - generic [ref=e195]: 0 leads on this page · Inbox
              - button "Reset columns" [ref=e197] [cursor=pointer]
          - dialog [ref=e198]:
            - generic [ref=e199]:
              - generic [ref=e200]:
                - generic [ref=e201]:
                  - heading "Add lead" [level=2] [ref=e202]
                  - paragraph [ref=e203]: Capture the enquiry. Qualify it when you know more.
                - generic [ref=e204]:
                  - generic [ref=e205]:
                    - heading "Capture from reviewed follow-up" [level=2] [ref=e206]
                    - paragraph [ref=e207]: This native Sales record saves independently. Return to the Activity for a separate link review.
                    - link "Return to source Activity" [ref=e208] [cursor=pointer]:
                      - /url: /work/a208db37-d274-414b-b372-9d9aae6c1363
                    - paragraph [ref=e209]: SYN Customer asks about another growing area
                    - paragraph [ref=e210]: "SYN Greenhouse Demonstration · SYN Q01 Demonstration Site · Open · Activity version 1 · Owner: SYN Coordinator · Due: 7 Oct 2031, 9:00 am"
                    - generic [ref=e211]: SYN-PPO-PRJ-000002 Â· SYN Irrigation and climate delivery
                  - group [ref=e212]:
                    - generic [ref=e213]:
                      - text: Lead title
                      - textbox "Lead title" [active] [ref=e214]: SYN LC17 returned Lead 148e8472-f3e7-48a3-bed5-574f05305600
                    - generic [ref=e215]:
                      - generic [ref=e217]:
                        - generic [ref=e218]: Company
                        - combobox "Company" [ref=e219]: SYN Greenhouse Demonstration
                        - generic [ref=e220]: Selected record. Type to change it.
                      - generic [ref=e222]:
                        - generic [ref=e223]: Lead owner
                        - combobox "Lead owner" [ref=e224]: SYN Coordinator
                        - generic [ref=e225]: Selected record. Type to change it.
                    - generic [ref=e226]:
                      - generic [ref=e227]:
                        - text: Organisation / business
                        - textbox "Organisation / business" [ref=e228]
                      - generic [ref=e229]:
                        - text: Contact name
                        - textbox "Contact name" [ref=e230]
                    - generic [ref=e231]: Names can be unverified at this stage.
                    - group [ref=e232]:
                      - generic "Link existing records (optional)" [ref=e233] [cursor=pointer]
                    - generic [ref=e234]:
                      - text: Requirement / enquiry
                      - textbox "Requirement / enquiry" [ref=e235]: SYN Customer asks about another growing area
                    - generic [ref=e237]:
                      - text: Source
                      - combobox "Source" [ref=e238]:
                        - option "Phone" [selected]
                        - option "Email"
                        - option "Meeting"
                        - option "Referral"
                        - option "Other"
                    - generic [ref=e239]:
                      - text: Source details
                      - textbox "Source details" [ref=e240]: Reviewed Activity a208db37-d274-414b-b372-9d9aae6c1363, version 1
                - generic [ref=e241]:
                  - status [ref=e242]: Unsaved
                  - button "Cancel" [ref=e243] [cursor=pointer]
                  - button "Save lead" [ref=e244] [cursor=pointer]
              - button "Close dialog" [ref=e245] [cursor=pointer]
  - alert [ref=e248]: Powerplants One | Private prototype
```

# Test source

```ts
  24  |   await call(page, "local-session", { profile: "coordinator" });
  25  |   const project = projectInput();
  26  |   await call(page, "projects", project);
  27  |   const a = {
  28  |     ...crmBase(),
  29  |     id: randomUUID(),
  30  |     company_id: CRM.company,
  31  |     site_id: CRM.site,
  32  |     owner_id: CRM.owner,
  33  |     summary: `SYN LC17 observed need ${randomUUID()}`,
  34  |     kind: restricted ? "TechnicalFollowUp" : "CustomerContact",
  35  |     access_class: restricted ? "RestrictedService" : "Internal",
  36  |     due_at: "2031-10-01T00:00:00.000Z",
  37  |     due_needed: false,
  38  |     links: [{ object_type: "Project", object_id: project.id }] as {
  39  |       object_type: string;
  40  |       object_id: string;
  41  |     }[],
  42  |   };
  43  |   if (restricted) {
  44  |     const ticket = randomUUID();
  45  |     await call(page, "service/tickets", {
  46  |       ...crmBase(),
  47  |       id: ticket,
  48  |       company_id: CRM.company,
  49  |       summary: "SYN customer requests a follow-up after service",
  50  |       symptom: "SYN reported monitoring gap",
  51  |       received_at: "2026-10-07T00:00:00.000Z",
  52  |       channel: "Manual",
  53  |       requester_id: null,
  54  |       requester_description: "SYN customer contact",
  55  |       site_id: CRM.site,
  56  |       site_identification_needed: false,
  57  |       asset_id: null,
  58  |       impact: "Monitoring",
  59  |       priority: "Normal",
  60  |       priority_reason: "SYN no work authorisation",
  61  |       triage_owner_id: CRM.owner,
  62  |       next_action: "SYN Review the reported need",
  63  |     });
  64  |     a.links = [
  65  |       { object_type: "Ticket", object_id: ticket },
  66  |       { object_type: "Organisation", object_id: CRM.org },
  67  |     ];
  68  |   }
  69  |   await call(page, "activities", a);
  70  |   return { project, a };
  71  | }
  72  | test("LC-17 Project need creates and recovers a native Lead, then explicitly links and plans the retained Activity", async ({
  73  |   page,
  74  | }, info) => {
  75  |   await call(page, "local-session", { profile: "coordinator" });
  76  |   const project = projectInput();
  77  |   await call(page, "projects", project);
  78  |   await page.goto(`/projects/${project.id}`);
  79  |   await page
  80  |     .getByRole("button", { name: "Sales handovers", exact: true })
  81  |     .click();
  82  |   await page
  83  |     .getByRole("link", { name: "Record a customer need for Sales review" })
  84  |     .click();
  85  |   await expect(page.getByLabel("Linked record", { exact: true })).toHaveValue(
  86  |     project.id,
  87  |   );
  88  |   await expect(
  89  |     page.getByLabel("Activity category", { exact: true }),
  90  |   ).toHaveValue("CustomerContact");
  91  |   await expect(page.getByLabel("Content access", { exact: true })).toHaveValue(
  92  |     "Internal",
  93  |   );
  94  |   await page
  95  |     .getByLabel("Purpose / summary", { exact: true })
  96  |     .fill("SYN Customer asks about another growing area");
  97  |   await page.getByLabel("Due date still needed", { exact: true }).uncheck();
  98  |   await page
  99  |     .getByLabel("Due date and time", { exact: true })
  100 |     .fill("2031-10-07T09:00");
  101 |   await page
  102 |     .getByRole("button", { name: "Create activity", exact: true })
  103 |     .click();
  104 |   await expect(page).toHaveURL(/\/work\/[a-f0-9-]+$/);
  105 |   const id = page.url().split("/").at(-1)!,
  106 |     original = (await call(page, `activities/${id}`)).items[0];
  107 |   await page
  108 |     .getByLabel("I reviewed existing Sales records for this customer need")
  109 |     .check();
  110 |   await page
  111 |     .getByRole("link", { name: "Create Lead and return for link review" })
  112 |     .click();
  113 |   await page
  114 |     .getByLabel("Lead title", { exact: true })
  115 |     .fill(`SYN LC17 returned Lead ${randomUUID()}`);
  116 |   let posts = 0;
  117 |   await page.route("**/api/v1/crm/leads", async (route) => {
  118 |     if (route.request().method() !== "POST") return route.continue();
  119 |     posts++;
  120 |     const r = await route.fetch();
  121 |     expect(r.ok(), await r.text()).toBe(true);
  122 |     await route.abort("failed");
  123 |   });
> 124 |   await page.getByRole("button", { name: "Add lead", exact: true }).click();
      |                                                                     ^ Error: locator.click: Test timeout of 120000ms exceeded.
  125 |   await expect(
  126 |     page.getByRole("button", { name: "Check original Sales creation" }),
  127 |   ).toBeVisible();
  128 |   await page.reload();
  129 |   await expect(page).toHaveURL(new RegExp(`/work/${id}\\?sales_kind=Lead`));
  130 |   expect(posts).toBe(1);
  131 |   const target = new URL(page.url()).searchParams.get("sales_candidate")!;
  132 |   await page
  133 |     .getByLabel("I reviewed existing Sales records for this customer need")
  134 |     .check();
  135 |   await page
  136 |     .getByRole("button", { name: "Compare Sales link", exact: true })
  137 |     .click();
  138 |   await page
  139 |     .getByLabel("Reason for Sales link", { exact: true })
  140 |     .fill("SYN Existing enquiries checked; retain delivery source");
  141 |   await page
  142 |     .getByRole("heading", { name: "Review fixed Sales comparison" })
  143 |     .scrollIntoViewIfNeeded();
  144 |   await page.screenshot({
  145 |     path: info.outputPath("project-lead-link-review.png"),
  146 |   });
  147 |   await page
  148 |     .getByRole("button", { name: "Link reviewed Sales record", exact: true })
  149 |     .click();
  150 |   await page
  151 |     .getByRole("link", {
  152 |       name: "Review this Activity as the Lead’s next action",
  153 |     })
  154 |     .click();
  155 |   await expect(
  156 |     page.getByRole("combobox", { name: "Next activity", exact: true }),
  157 |   ).toHaveValue(id);
  158 |   await page
  159 |     .getByRole("button", { name: "Plan next activity", exact: true })
  160 |     .click();
  161 |   expect((await call(page, `crm/leads/${target}`)).next_activity.id).toBe(id);
  162 |   const a = (await call(page, `activities/${id}`)).items[0];
  163 |   expect(a.owner_id).toBe(original.owner_id);
  164 |   expect(a.due_at).toBe(original.due_at);
  165 |   expect(a.status).toBe(original.status);
  166 |   expect(a.links).toHaveLength(2);
  167 |   expect(
  168 |     await page.evaluate(
  169 |       () => document.documentElement.scrollWidth <= innerWidth,
  170 |     ),
  171 |   ).toBe(true);
  172 | });
  173 | test("LC-17 restricted follow-up creates a separate review and a qualified Deal; original link recovery survives completion", async ({
  174 |   page,
  175 | }, info) => {
  176 |   const { a } = await fixture(page, true);
  177 |   await call(page, `activities/${a.id}/complete`, {
  178 |     ...crmBase(),
  179 |     expected_version: 1,
  180 |     outcome: "SYN technical review completed",
  181 |   });
  182 |   const original = (await call(page, `activities/${a.id}`)).items[0];
  183 |   await page.goto(`/work/${a.id}`);
  184 |   await page
  185 |     .getByText("Prepare a separate owned Sales review", { exact: true })
  186 |     .click();
  187 |   await page
  188 |     .getByLabel("Reviewed customer need", { exact: true })
  189 |     .fill("SYN Customer requests a separately qualified upgrade");
  190 |   await page
  191 |     .getByLabel("Sales review due date and time", { exact: true })
  192 |     .fill("2031-10-08T10:00");
  193 |   await page
  194 |     .getByLabel("I reviewed this wording for Internal Sales access")
  195 |     .check();
  196 |   await page
  197 |     .getByLabel("Reason for separate Sales review")
  198 |     .fill("SYN New customer need requires its own accountable review");
  199 |   await page
  200 |     .getByRole("button", { name: "Create owned Sales review", exact: true })
  201 |     .click();
  202 |   await expect(page).not.toHaveURL(new RegExp(a.id));
  203 |   await expect(page).toHaveURL(/\/work\/[a-f0-9-]+$/);
  204 |   const id = page.url().split("/").at(-1)!;
  205 |   await page.getByLabel("Sales destination type").selectOption("Opportunity");
  206 |   await page
  207 |     .getByLabel("I reviewed existing Sales records for this customer need")
  208 |     .check();
  209 |   await page
  210 |     .getByRole("link", {
  211 |       name: "Create qualified Deal and return for link review",
  212 |     })
  213 |     .click();
  214 |   await page
  215 |     .getByLabel("Deal title", { exact: true })
  216 |     .fill(`SYN LC17 qualified upgrade ${randomUUID()}`);
  217 |   await page
  218 |     .getByLabel("Qualification outcome", { exact: true })
  219 |     .fill("SYN Known customer need reviewed; no order authority");
  220 |   await pick(page, "Contact", CRM.person);
  221 |   await page
  222 |     .getByLabel("Action purpose", { exact: true })
  223 |     .fill("SYN Confirm scoped next discussion with customer");
  224 |   await page
```
