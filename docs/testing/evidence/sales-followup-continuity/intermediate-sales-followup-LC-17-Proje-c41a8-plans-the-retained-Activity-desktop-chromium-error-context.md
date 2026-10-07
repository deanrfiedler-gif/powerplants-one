# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sales-followup.spec.ts >> LC-17 Project need creates and recovers a native Lead, then explicitly links and plans the retained Activity
- Location: tests\browser\sales-followup.spec.ts:72:1

# Error details

```
TypeError: Cannot read properties of null (reading 'id')
```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - link "Skip to main content":
    - /url: "#main"
  - generic [ref=f1e2]:
    - complementary "Application navigation" [ref=f1e3]:
      - link "Powerplants One home" [ref=f1e4] [cursor=pointer]:
        - /url: /
        - img "Powerplants Australia" [ref=f1e5]
      - navigation "Sales shortcuts" [ref=f1e6]:
        - link "Pulse" [ref=f1e7] [cursor=pointer]:
          - /url: /sales/pulse
        - link "Leads" [ref=f1e13] [cursor=pointer]:
          - /url: /sales/leads
        - link "Deals" [ref=f1e18] [cursor=pointer]:
          - /url: /sales/opportunities
        - link "Activities" [ref=f1e24] [cursor=pointer]:
          - /url: /calendar?scope=sales&department=sales
        - link "Tasks" [ref=f1e32] [cursor=pointer]:
          - /url: /sales/tasks
        - link "Sales Inbox" [ref=f1e40] [cursor=pointer]:
          - /url: /email?department=sales
        - link "Contacts" [ref=f1e46] [cursor=pointer]:
          - /url: /contacts?department=sales
      - button "More" [ref=f1e54] [cursor=pointer]
    - generic [ref=f1e59]:
      - banner [ref=f1e60]:
        - navigation "Breadcrumb" [ref=f1e61]:
          - list "Sales / Leads" [ref=f1e62]:
            - listitem [ref=f1e63]:
              - link "Sales" [ref=f1e64] [cursor=pointer]:
                - /url: /sales/opportunities
            - listitem [ref=f1e65]:
              - text: /
              - generic [ref=f1e66]: Leads
        - generic [ref=f1e67]:
          - generic [ref=f1e68]:
            - generic [ref=f1e69]:
              - combobox "Search Powerplants One" [ref=f1e73]
              - generic [aria-hidden] [ref=f1e74]: Ctrl K
            - button "Quick add" [ref=f1e75] [cursor=pointer]
          - generic [ref=f1e78]:
            - button "Design and build workspace" [ref=f1e79] [cursor=pointer]
            - button "Page guide" [ref=f1e82] [cursor=pointer]
            - button "Quick Help" [ref=f1e86] [cursor=pointer]
            - button "Notifications" [ref=f1e90] [cursor=pointer]
        - region "Local demonstration identity" [ref=f1e95]:
          - button "Change identity" [ref=f1e97] [cursor=pointer]:
            - generic [aria-hidden] [ref=f1e98]: SC
      - main [ref=f1e99]:
        - region "Leads workspace" [ref=f1e101]:
          - generic [ref=f1e102]:
            - navigation "Lead lifecycle" [ref=f1e103]:
              - button "Inbox" [ref=f1e104] [cursor=pointer]
              - button "Archived" [ref=f1e107] [cursor=pointer]
              - button "Disqualified" [ref=f1e110] [cursor=pointer]
              - button "Converted" [ref=f1e113] [cursor=pointer]
            - generic [ref=f1e116]:
              - heading "Leads" [level=1] [ref=f1e117]
              - generic [ref=f1e118]:
                - button "Add lead" [ref=f1e119] [cursor=pointer]:
                  - generic [ref=f1e122]: Lead
                - button "Add lead options" [ref=f1e123] [cursor=pointer]
            - generic [ref=f1e126]:
              - generic [ref=f1e127]: 1 lead
              - generic [ref=f1e128]:
                - button "Lead owner" [ref=f1e129] [cursor=pointer]:
                  - generic [ref=f1e132]: Everyone
                - button "Filters" [ref=f1e135] [cursor=pointer]
                - button "Sort order" [ref=f1e141] [cursor=pointer]:
                  - generic [ref=f1e144]: Newest
              - button "Leads options" [ref=f1e147] [cursor=pointer]
          - status [ref=f1e150]: Saved to the server.
          - generic [ref=f1e151]:
            - paragraph [ref=f1e152]: Drag the divider to resize. Left and Right change width by 10 pixels, Shift by 50. Home and End set minimum and maximum widths. Double-click fits this page’s content. Escape cancels dragging.
            - region "Leads list" [ref=f1e153]:
              - table [ref=f1e154]:
                - rowgroup [ref=f1e166]:
                  - row [ref=f1e167]:
                    - columnheader [ref=f1e168]:
                      - checkbox "Select all leads on this page" [ref=f1e169] [cursor=pointer]
                    - columnheader [ref=f1e170]:
                      - text: Lead title
                      - separator "Resize Lead title column" [ref=f1e171]
                    - columnheader [ref=f1e172]:
                      - text: Organisation
                      - separator "Resize Organisation column" [ref=f1e173]
                    - columnheader [ref=f1e174]:
                      - text: Contact
                      - separator "Resize Contact column" [ref=f1e175]
                    - columnheader [ref=f1e176]:
                      - text: Status
                      - separator "Resize Status column" [ref=f1e177]
                    - columnheader [ref=f1e178]:
                      - text: Lead owner
                      - separator "Resize Lead owner column" [ref=f1e179]
                    - columnheader [ref=f1e180]:
                      - text: Next activity
                      - separator "Resize Next activity column" [ref=f1e181]
                    - columnheader [ref=f1e182]:
                      - text: Next activity due
                      - separator "Resize Next activity due column" [ref=f1e183]
                    - columnheader "Date added" [ref=f1e184]
                    - columnheader [ref=f1e185]:
                      - button "Columns" [ref=f1e186] [cursor=pointer]
                - rowgroup [ref=f1e189]:
                  - row [ref=f1e190]:
                    - cell [ref=f1e191]:
                      - checkbox "Select SYN LC17 returned Lead ad9ffd9e-71f9-41ec-9e91-22a9cb9e4a59" [ref=f1e192] [cursor=pointer]
                    - cell [ref=f1e193]:
                      - link "SYN LC17 returned Lead ad9ffd9e-71f9-41ec-9e91-22a9cb9e4a59" [ref=f1e194] [cursor=pointer]:
                        - /url: /sales/leads/8e000234-bd21-4909-99aa-ac4b7c138eba
                    - cell "SYN Greenhouse Demonstration" [ref=f1e195]
                    - cell "Contact to confirm" [ref=f1e197]
                    - cell "New" [ref=f1e199]
                    - 'cell "Lead owner: SYN Coordinator Coordinator" [ref=f1e202]':
                      - generic [ref=f1e203]:
                        - 'generic "Lead owner: SYN Coordinator" [ref=f1e204]': C
                        - generic "SYN Coordinator" [ref=f1e205]: Coordinator
                    - cell "SYN Customer asks about another growing area" [ref=f1e206]
                    - cell "7 Oct 2031" [ref=f1e208]
                    - cell "7 Oct 2026" [ref=f1e209]
                    - cell [ref=f1e210]:
                      - button "Actions for SYN LC17 returned Lead ad9ffd9e-71f9-41ec-9e91-22a9cb9e4a59" [ref=f1e211] [cursor=pointer]
            - generic [ref=f1e214]:
              - generic [ref=f1e215]: 1 lead on this page · Inbox
              - button "Reset columns" [ref=f1e217] [cursor=pointer]
          - dialog [ref=f1e218]:
            - generic [ref=f1e219]:
              - generic [ref=f1e220]:
                - text: SYN-PPO-LEAD-000002
                - heading "SYN LC17 returned Lead ad9ffd9e-71f9-41ec-9e91-22a9cb9e4a59" [level=2] [ref=f1e221]
                - generic [ref=f1e222]: New
              - generic [active] [ref=f1e223]:
                - heading "Captured enquiry" [level=3] [ref=f1e224]
                - generic [ref=f1e225]:
                  - generic [ref=f1e226]:
                    - generic [ref=f1e227]: Organisation
                    - strong [ref=f1e228]: SYN Greenhouse Demonstration
                  - generic [ref=f1e229]:
                    - generic [ref=f1e230]: Contact
                    - strong [ref=f1e231]: Not yet known
                  - generic [ref=f1e232]:
                    - generic [ref=f1e233]: Site
                    - strong [ref=f1e234]: SYN Q01 Demonstration Site
                  - generic [ref=f1e235]:
                    - generic [ref=f1e236]: Owner
                    - strong [ref=f1e237]: SYN Coordinator
                  - generic [ref=f1e238]:
                    - generic [ref=f1e239]: Source
                    - strong [ref=f1e240]: Phone
                  - generic [ref=f1e241]:
                    - generic [ref=f1e242]: Date added
                    - strong [ref=f1e243]: 7 Oct 2026
                - generic [ref=f1e244]:
                  - heading "Resolved customer context" [level=3] [ref=f1e245]
                  - paragraph [ref=f1e246]: No later resolution recorded. Captured customer links apply.
                  - button "Resolve customer context" [ref=f1e247] [cursor=pointer]
                - generic [ref=f1e248]:
                  - heading "Requirement / enquiry" [level=3] [ref=f1e249]
                  - paragraph [ref=f1e250]: SYN Customer asks about another growing area
                  - text: Reviewed Activity 997743d7-53a6-434a-a975-ef32a0e6021d, version 1
                - generic [ref=f1e251]:
                  - heading "Next activity" [level=3] [ref=f1e252]
                  - generic [ref=f1e253]:
                    - link "SYN Customer asks about another growing area" [ref=f1e254] [cursor=pointer]:
                      - /url: /work/997743d7-53a6-434a-a975-ef32a0e6021d
                    - paragraph [ref=f1e255]: SYN Coordinator · 7 Oct 2031
                    - text: Upcoming
                  - button "Plan next activity" [ref=f1e256] [cursor=pointer]
                - generic [ref=f1e257]:
                  - heading "Notes and history" [level=3] [ref=f1e258]
                  - generic [ref=f1e259]:
                    - article [ref=f1e260]:
                      - strong [ref=f1e261]: Create Lead
                      - generic [ref=f1e262]: SYN Coordinator · 7 Oct 2026
                      - paragraph [ref=f1e263]: Capture a new manual enquiry
                    - article [ref=f1e264]:
                      - strong [ref=f1e265]: Plan Lead Action
                      - generic [ref=f1e266]: SYN Coordinator · 7 Oct 2026
                      - paragraph [ref=f1e267]: Plan an owned lead follow-up
                    - article [ref=f1e268]:
                      - link "SYN Customer asks about another growing area" [ref=f1e269] [cursor=pointer]:
                        - /url: /work/997743d7-53a6-434a-a975-ef32a0e6021d
                      - generic [ref=f1e270]: SYN Coordinator · Open
                  - button "Add note" [ref=f1e271] [cursor=pointer]
                - generic [ref=f1e272]:
                  - button "Transfer ownership" [ref=f1e273] [cursor=pointer]
                  - button "Edit lead" [ref=f1e274] [cursor=pointer]
                  - button "Archive" [ref=f1e275] [cursor=pointer]
                  - button "Disqualify" [ref=f1e276] [cursor=pointer]
              - button "Convert to deal" [ref=f1e278] [cursor=pointer]
              - button "Close dialog" [ref=f1e279] [cursor=pointer]
  - alert [ref=f1e282]
```

# Test source

```ts
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
  124 |   await page.getByRole("button", { name: "Save lead", exact: true }).click();
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
  158 |   await page.getByRole("button", { name: "Save", exact: true }).click();
> 159 |   expect((await call(page, `crm/leads/${target}`)).next_activity.id).toBe(id);
      |                                                                  ^ TypeError: Cannot read properties of null (reading 'id')
  160 |   const a = (await call(page, `activities/${id}`)).items[0];
  161 |   expect(a.owner_id).toBe(original.owner_id);
  162 |   expect(a.due_at).toBe(original.due_at);
  163 |   expect(a.status).toBe(original.status);
  164 |   expect(a.links).toHaveLength(2);
  165 |   expect(
  166 |     await page.evaluate(
  167 |       () => document.documentElement.scrollWidth <= innerWidth,
  168 |     ),
  169 |   ).toBe(true);
  170 | });
  171 | test("LC-17 restricted follow-up creates a separate review and a qualified Deal; original link recovery survives completion", async ({
  172 |   page,
  173 | }, info) => {
  174 |   const { a } = await fixture(page, true);
  175 |   await call(page, `activities/${a.id}/complete`, {
  176 |     ...crmBase(),
  177 |     expected_version: 1,
  178 |     outcome: "SYN technical review completed",
  179 |   });
  180 |   const original = (await call(page, `activities/${a.id}`)).items[0];
  181 |   await page.goto(`/work/${a.id}`);
  182 |   await page
  183 |     .getByText("Prepare a separate owned Sales review", { exact: true })
  184 |     .click();
  185 |   await page
  186 |     .getByLabel("Reviewed customer need", { exact: true })
  187 |     .fill("SYN Customer requests a separately qualified upgrade");
  188 |   await page
  189 |     .getByLabel("Sales review due date and time", { exact: true })
  190 |     .fill("2031-10-08T10:00");
  191 |   await page
  192 |     .getByLabel("I reviewed this wording for Internal Sales access")
  193 |     .check();
  194 |   await page
  195 |     .getByLabel("Reason for separate Sales review")
  196 |     .fill("SYN New customer need requires its own accountable review");
  197 |   await page
  198 |     .getByRole("button", { name: "Create owned Sales review", exact: true })
  199 |     .click();
  200 |   await expect(page).not.toHaveURL(new RegExp(a.id));
  201 |   await expect(page).toHaveURL(/\/work\/[a-f0-9-]+$/);
  202 |   const id = page.url().split("/").at(-1)!;
  203 |   await page.getByLabel("Sales destination type").selectOption("Opportunity");
  204 |   await page
  205 |     .getByLabel("I reviewed existing Sales records for this customer need")
  206 |     .check();
  207 |   await page
  208 |     .getByRole("link", {
  209 |       name: "Create qualified Deal and return for link review",
  210 |     })
  211 |     .click();
  212 |   await page
  213 |     .getByLabel("Deal title", { exact: true })
  214 |     .fill(`SYN LC17 qualified upgrade ${randomUUID()}`);
  215 |   await page
  216 |     .getByLabel("Qualification outcome", { exact: true })
  217 |     .fill("SYN Known customer need reviewed; no order authority");
  218 |   await pick(page, "Contact", CRM.person);
  219 |   await page
  220 |     .getByLabel("Action purpose", { exact: true })
  221 |     .fill("SYN Confirm scoped next discussion with customer");
  222 |   await page
  223 |     .getByRole("button", { name: "Add deal and action", exact: true })
  224 |     .click();
  225 |   await expect(page).toHaveURL(
  226 |     new RegExp(`/work/${id}\\?sales_kind=Opportunity`),
  227 |   );
  228 |   const target = new URL(page.url()).searchParams.get("sales_candidate")!,
  229 |     before = (await call(page, `crm/opportunities/${target}`)).items[0];
  230 |   await page
  231 |     .getByLabel("I reviewed existing Sales records for this customer need")
  232 |     .check();
  233 |   await page
  234 |     .getByRole("button", { name: "Compare Sales link", exact: true })
  235 |     .click();
  236 |   await page
  237 |     .getByLabel("Reason for Sales link")
  238 |     .fill("SYN Qualified new need, with retained restricted original");
  239 |   let posts = 0;
  240 |   await page.route(
  241 |     `**/api/v1/activities/${id}/sales-followup`,
  242 |     async (route) => {
  243 |       if (route.request().method() !== "POST") return route.continue();
  244 |       posts++;
  245 |       const r = await route.fetch();
  246 |       expect(r.ok(), await r.text()).toBe(true);
  247 |       await route.abort("failed");
  248 |     },
  249 |   );
  250 |   await page
  251 |     .getByRole("button", { name: "Link reviewed Sales record", exact: true })
  252 |     .click();
  253 |   await expect(
  254 |     page.getByRole("button", { name: "Check original Sales link" }),
  255 |   ).toBeVisible();
  256 |   await call(page, `activities/${id}/complete`, {
  257 |     ...crmBase(),
  258 |     expected_version: 2,
  259 |     outcome: "SYN completed discussion",
```
