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
  - generic [ref=f1e3]:
    - text: /
    - main [ref=f1e4]:
      - region "Leads workspace" [ref=f1e6]:
        - generic [ref=f1e7]:
          - link "Back to deals" [ref=f1e8] [cursor=pointer]:
            - /url: /sales/opportunities
          - button "Sort leads" [ref=f1e11] [cursor=pointer]
          - generic [ref=f1e14]:
            - generic [ref=f1e15]: Lead view
            - combobox "Lead view" [ref=f1e16]:
              - option "Inbox" [selected]
              - option "Archived"
              - option "Disqualified"
              - option "Converted"
          - button "Search leads" [ref=f1e17] [cursor=pointer]
          - button "Filter leads" [ref=f1e20] [cursor=pointer]
        - button "Add lead" [ref=f1e26] [cursor=pointer]
        - status [ref=f1e29]: Saved to the server.
        - generic [ref=f1e31]:
          - link "SYN LC17 returned Lead e5029a72-46e8-40fd-bd49-888030c69729, SYN Coordinator, New" [ref=f1e32] [cursor=pointer]:
            - /url: /sales/leads/dd0e6bba-1de2-4208-ae26-9dab87c2d98c
            - generic [ref=f1e33]: New
            - strong [ref=f1e34]: SYN LC17 returned Lead e5029a72-46e8-40fd-bd49-888030c69729
            - generic [ref=f1e35]: SYN Greenhouse Demonstration
          - link "SYN Greenhouse controls enquiry, SYN Coordinator, New, Next action needed" [ref=f1e36] [cursor=pointer]:
            - /url: /sales/leads/803a8a43-6986-47c9-a4a4-afdf97c8e1e2
            - generic [ref=f1e37]: New
            - strong [ref=f1e38]: SYN Greenhouse controls enquiry
            - generic [ref=f1e39]: SYN Greenhouse Demonstration · SYN Avery Contact
            - generic "Next action needed" [ref=f1e40]
          - link "SYN LC17 returned Lead ad9ffd9e-71f9-41ec-9e91-22a9cb9e4a59, SYN Coordinator, New" [ref=f1e43] [cursor=pointer]:
            - /url: /sales/leads/8e000234-bd21-4909-99aa-ac4b7c138eba
            - generic [ref=f1e44]: New
            - strong [ref=f1e45]: SYN LC17 returned Lead ad9ffd9e-71f9-41ec-9e91-22a9cb9e4a59
            - generic [ref=f1e46]: SYN Greenhouse Demonstration
        - dialog [ref=f1e47]:
          - generic [ref=f1e48]:
            - generic [ref=f1e49]:
              - text: SYN-PPO-LEAD-000005
              - heading "SYN LC17 returned Lead e5029a72-46e8-40fd-bd49-888030c69729" [level=2] [ref=f1e50]
              - generic [ref=f1e51]: New
            - generic [active] [ref=f1e52]:
              - heading "Captured enquiry" [level=3] [ref=f1e53]
              - generic [ref=f1e54]:
                - generic [ref=f1e55]:
                  - generic [ref=f1e56]: Organisation
                  - strong [ref=f1e57]: SYN Greenhouse Demonstration
                - generic [ref=f1e58]:
                  - generic [ref=f1e59]: Contact
                  - strong [ref=f1e60]: Not yet known
                - generic [ref=f1e61]:
                  - generic [ref=f1e62]: Site
                  - strong [ref=f1e63]: SYN Q01 Demonstration Site
                - generic [ref=f1e64]:
                  - generic [ref=f1e65]: Owner
                  - strong [ref=f1e66]: SYN Coordinator
                - generic [ref=f1e67]:
                  - generic [ref=f1e68]: Source
                  - strong [ref=f1e69]: Phone
                - generic [ref=f1e70]:
                  - generic [ref=f1e71]: Date added
                  - strong [ref=f1e72]: 7 Oct 2026
              - generic [ref=f1e73]:
                - heading "Resolved customer context" [level=3] [ref=f1e74]
                - paragraph [ref=f1e75]: No later resolution recorded. Captured customer links apply.
                - button "Resolve customer context" [ref=f1e76] [cursor=pointer]
              - generic [ref=f1e77]:
                - heading "Requirement / enquiry" [level=3] [ref=f1e78]
                - paragraph [ref=f1e79]: SYN Customer asks about another growing area
                - text: Reviewed Activity bcc879ce-23af-42e7-b5ca-c854fa58b754, version 1
              - generic [ref=f1e80]:
                - heading "Next activity" [level=3] [ref=f1e81]
                - generic [ref=f1e82]:
                  - link "SYN Customer asks about another growing area" [ref=f1e83] [cursor=pointer]:
                    - /url: /work/bcc879ce-23af-42e7-b5ca-c854fa58b754
                  - paragraph [ref=f1e84]: SYN Coordinator · 7 Oct 2031
                  - text: Upcoming
                - button "Plan next activity" [ref=f1e85] [cursor=pointer]
              - generic [ref=f1e86]:
                - heading "Notes and history" [level=3] [ref=f1e87]
                - generic [ref=f1e88]:
                  - article [ref=f1e89]:
                    - strong [ref=f1e90]: Create Lead
                    - generic [ref=f1e91]: SYN Coordinator · 7 Oct 2026
                    - paragraph [ref=f1e92]: Capture a new manual enquiry
                  - article [ref=f1e93]:
                    - strong [ref=f1e94]: Plan Lead Action
                    - generic [ref=f1e95]: SYN Coordinator · 7 Oct 2026
                    - paragraph [ref=f1e96]: Plan an owned lead follow-up
                  - article [ref=f1e97]:
                    - link "SYN Customer asks about another growing area" [ref=f1e98] [cursor=pointer]:
                      - /url: /work/bcc879ce-23af-42e7-b5ca-c854fa58b754
                    - generic [ref=f1e99]: SYN Coordinator · Open
                - button "Add note" [ref=f1e100] [cursor=pointer]
              - generic [ref=f1e101]:
                - button "Transfer ownership" [ref=f1e102] [cursor=pointer]
                - button "Edit lead" [ref=f1e103] [cursor=pointer]
                - button "Archive" [ref=f1e104] [cursor=pointer]
                - button "Disqualify" [ref=f1e105] [cursor=pointer]
            - button "Convert to deal" [ref=f1e107] [cursor=pointer]
            - button "Close dialog" [ref=f1e108] [cursor=pointer]
  - alert [ref=f1e111]: Powerplants One | Private prototype
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
