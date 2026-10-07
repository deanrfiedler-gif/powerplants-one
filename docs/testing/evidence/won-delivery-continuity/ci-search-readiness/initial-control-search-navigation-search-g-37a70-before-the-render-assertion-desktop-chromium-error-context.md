# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search-navigation.spec.ts >> search geometry waits for its exact initial read before the render assertion
- Location: tests\browser\search-navigation.spec.ts:9:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 2
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - list "Search" [ref=e62]:
            - listitem [ref=e63]:
              - generic [ref=e64]: Search
        - generic [ref=e65]:
          - generic [ref=e66]:
            - generic [ref=e67]:
              - combobox "Search Powerplants One" [ref=e71]
              - generic [aria-hidden] [ref=e72]: Ctrl K
            - button "Quick add" [ref=e73] [cursor=pointer]
          - generic [ref=e76]:
            - button "Design and build workspace" [ref=e77] [cursor=pointer]
            - button "Page guide" [ref=e80] [cursor=pointer]
            - button "Quick Help" [ref=e84] [cursor=pointer]
            - button "Notifications" [ref=e88] [cursor=pointer]
        - region "Local demonstration identity" [ref=e93]:
          - button "Change identity" [ref=e95] [cursor=pointer]:
            - generic [aria-hidden] [ref=e96]: SC
      - main [ref=e97]:
        - generic [ref=e100]:
          - generic [ref=e101]:
            - generic [ref=e102]:
              - paragraph [ref=e103]: Shared workspace
              - heading "Search" [level=1] [ref=e104]
              - paragraph [ref=e105]: Find records within your current access.
            - button "Saved views" [ref=e106] [cursor=pointer]
            - link "My Work" [ref=e107] [cursor=pointer]:
              - /url: /work
          - generic [ref=e108]:
            - generic [ref=e109]:
              - text: Search records
              - searchbox "Search records" [ref=e110]: SYN
            - button "Search" [ref=e111] [cursor=pointer]
            - button "Refresh results" [ref=e112] [cursor=pointer]
          - navigation "Result types" [ref=e113]:
            - button "All types" [pressed] [ref=e114] [cursor=pointer]
            - button "Site survey" [ref=e115] [cursor=pointer]
            - button "Site readiness" [ref=e116] [cursor=pointer]
            - button "Account development" [ref=e117] [cursor=pointer]
            - button "Issued job pack" [ref=e118] [cursor=pointer]
            - button "Engineering package" [ref=e119] [cursor=pointer]
            - button "Lead" [ref=e120] [cursor=pointer]
            - button "Project" [ref=e121] [cursor=pointer]
            - button "Deal" [ref=e122] [cursor=pointer]
            - button "Customer" [ref=e123] [cursor=pointer]
            - button "Contact" [ref=e124] [cursor=pointer]
            - button "Site" [ref=e125] [cursor=pointer]
            - button "Equipment" [ref=e126] [cursor=pointer]
            - button "Activity" [ref=e127] [cursor=pointer]
            - button "Service request" [ref=e128] [cursor=pointer]
            - button "Facility / growing area" [ref=e129] [cursor=pointer]
          - status [ref=e130]: 48 results on this page for “SYN”
          - list [ref=e131]:
            - listitem [ref=e132]:
              - generic [ref=e133]:
                - button "SYN Greenhouse controls enquiry" [ref=e134] [cursor=pointer]
                - paragraph [ref=e135]: SYN-PPO-LEAD-000003 · Lead
              - link "Open record" [ref=e136] [cursor=pointer]:
                - /url: /sales/leads/803a8a43-6986-47c9-a4a4-afdf97c8e1e2
            - listitem [ref=e137]:
              - generic [ref=e138]:
                - button "SYN LC17 returned Lead ad9ffd9e-71f9-41ec-9e91-22a9cb9e4a59" [ref=e139] [cursor=pointer]
                - paragraph [ref=e140]: SYN-PPO-LEAD-000002 · Lead
              - link "Open record" [ref=e141] [cursor=pointer]:
                - /url: /sales/leads/8e000234-bd21-4909-99aa-ac4b7c138eba
            - listitem [ref=e142]:
              - generic [ref=e143]:
                - button "SYN Gantt integration desktop-chromium 1791358505487" [ref=e144] [cursor=pointer]
                - paragraph [ref=e145]: SYN-PPO-PRJ-000001 · Project
              - link "Open record" [ref=e146] [cursor=pointer]:
                - /url: /projects/2bb13835-b34c-4c3b-b341-3285a95f65d9
            - listitem [ref=e147]:
              - generic [ref=e148]:
                - button "SYN Irrigation and climate delivery" [ref=e149] [cursor=pointer]
                - paragraph [ref=e150]: SYN-PPO-PRJ-000003 · Project
              - link "Open record" [ref=e151] [cursor=pointer]:
                - /url: /projects/4e5d9769-9286-429c-9838-65ec239e4331
            - listitem [ref=e152]:
              - generic [ref=e153]:
                - button "SYN Irrigation and climate delivery" [ref=e154] [cursor=pointer]
                - paragraph [ref=e155]: SYN-PPO-PRJ-000002 · Project
              - link "Open record" [ref=e156] [cursor=pointer]:
                - /url: /projects/51ce36e3-2bf9-43d6-a852-c142082ad51a
            - listitem [ref=e157]:
              - generic [ref=e158]:
                - button "SYN Irrigation and climate delivery" [ref=e159] [cursor=pointer]
                - paragraph [ref=e160]: SYN-PPO-PRJ-000004 · Project
              - link "Open record" [ref=e161] [cursor=pointer]:
                - /url: /projects/b0d76cc1-9d64-4d84-a7aa-469461bdb944
            - listitem [ref=e162]:
              - generic [ref=e163]:
                - button "SYN Greenhouse Demonstration" [ref=e164] [cursor=pointer]
                - paragraph [ref=e165]: SYN-PPO-ORG-000001 · Customer
              - link "Open record" [ref=e166] [cursor=pointer]:
                - /url: /customers/50000000-0000-4000-8000-000000000001
            - listitem [ref=e167]:
              - generic [ref=e168]:
                - button "SYN Previous Operator" [ref=e169] [cursor=pointer]
                - paragraph [ref=e170]: SYN-PPO-ORG-000002 · Customer
              - link "Open record" [ref=e171] [cursor=pointer]:
                - /url: /customers/50000000-0000-4000-8000-000000000002
            - listitem [ref=e172]:
              - generic [ref=e173]:
                - button "SYN Greenhouse Demonstration" [ref=e174] [cursor=pointer]
                - paragraph [ref=e175]: SYN-PPO-ORG-000005 · Customer
              - link "Open record" [ref=e176] [cursor=pointer]:
                - /url: /customers/50000000-0000-4000-8000-000000000005
            - listitem [ref=e177]:
              - generic [ref=e178]:
                - button "SYN Willowbank Horticulture" [ref=e179] [cursor=pointer]
                - paragraph [ref=e180]: SYN-PPO-ORG-000006 · Customer
              - link "Open record" [ref=e181] [cursor=pointer]:
                - /url: /customers/c5050000-0000-4000-8000-000000000001
            - listitem [ref=e182]:
              - generic [ref=e183]:
                - button "SYN Avery Contact" [ref=e184] [cursor=pointer]
                - paragraph [ref=e185]: Reference not supplied · Contact
              - link "Open record" [ref=e186] [cursor=pointer]:
                - /url: /people/60000000-0000-4000-8000-000000000001
            - listitem [ref=e187]:
              - generic [ref=e188]:
                - button "SYN Q01 Demonstration Site" [ref=e189] [cursor=pointer]
                - paragraph [ref=e190]: SYN-PPO-SITE-000001 · Site
              - link "Open record" [ref=e191] [cursor=pointer]:
                - /url: /sites/70000000-0000-4000-8000-000000000001
            - listitem [ref=e192]:
              - generic [ref=e193]:
                - button "SYN V01 Previous Site" [ref=e194] [cursor=pointer]
                - paragraph [ref=e195]: SYN-PPO-SITE-000002 · Site
              - link "Open record" [ref=e196] [cursor=pointer]:
                - /url: /sites/70000000-0000-4000-8000-000000000002
            - listitem [ref=e197]:
              - generic [ref=e198]:
                - button "SYN Nursery & propagation" [ref=e199] [cursor=pointer]
                - paragraph [ref=e200]: SYN-PPO-SITE-000004 · Site
              - link "Open record" [ref=e201] [cursor=pointer]:
                - /url: /sites/c5050001-0000-4000-8000-000000000001
            - listitem [ref=e202]:
              - generic [ref=e203]:
                - button "SYN Field production" [ref=e204] [cursor=pointer]
                - paragraph [ref=e205]: SYN-PPO-SITE-000005 · Site
              - link "Open record" [ref=e206] [cursor=pointer]:
                - /url: /sites/c5050001-0000-4000-8000-000000000002
            - listitem [ref=e207]:
              - generic [ref=e208]:
                - button "SYN irrigation controller" [ref=e209] [cursor=pointer]
                - paragraph [ref=e210]: SYN-PPO-AST-000001 · Equipment
              - link "Open record" [ref=e211] [cursor=pointer]:
                - /url: /equipment/80000000-0000-4000-8000-000000000001
            - listitem [ref=e212]:
              - generic [ref=e213]:
                - button "SYN unidentified sensor" [ref=e214] [cursor=pointer]
                - paragraph [ref=e215]: SYN-PPO-AST-000002 · Equipment
              - link "Open record" [ref=e216] [cursor=pointer]:
                - /url: /equipment/80000000-0000-4000-8000-000000000002
            - listitem [ref=e217]:
              - generic [ref=e218]:
                - button "SYN Willowbank irrigation pump" [ref=e219] [cursor=pointer]
                - paragraph [ref=e220]: SYN-PPO-AST-000004 · Equipment
              - link "Open record" [ref=e221] [cursor=pointer]:
                - /url: /equipment/c5050003-0000-4000-8000-000000000001
            - listitem [ref=e222]:
              - generic [ref=e223]:
                - button "SYN Customer requests a separately qualified upgrade" [ref=e224] [cursor=pointer]
                - paragraph [ref=e225]: Reference not supplied · Activity
              - link "Open record" [ref=e226] [cursor=pointer]:
                - /url: /work/14a4c44e-b770-4825-9b53-5417ff864102
            - listitem [ref=e227]:
              - generic [ref=e228]:
                - button "SYN Confirm scoped next discussion with customer" [ref=e229] [cursor=pointer]
                - paragraph [ref=e230]: Reference not supplied · Activity
              - link "Open record" [ref=e231] [cursor=pointer]:
                - /url: /work/38676851-e0d3-438a-80c3-5dbec3f1e766
            - listitem [ref=e232]:
              - generic [ref=e233]:
                - button "SYN Resolve the original customer questions" [ref=e234] [cursor=pointer]
                - paragraph [ref=e235]: Reference not supplied · Activity
              - link "Open record" [ref=e236] [cursor=pointer]:
                - /url: /work/3a2955ec-700a-427e-b7bd-5901954169f1
            - listitem [ref=e237]:
              - generic [ref=e238]:
                - button "SYN LC17 observed need 6c11cdaf-6fcc-49a9-b790-da10be96679c" [ref=e239] [cursor=pointer]
                - paragraph [ref=e240]: Reference not supplied · Activity
              - link "Open record" [ref=e241] [cursor=pointer]:
                - /url: /work/3cfd01e0-ea43-4569-bdb8-5f1e2c084849
            - listitem [ref=e242]:
              - generic [ref=e243]:
                - button "SYN Arrange a technical discovery conversation" [ref=e244] [cursor=pointer]
                - paragraph [ref=e245]: Reference not supplied · Activity
              - link "Open record" [ref=e246] [cursor=pointer]:
                - /url: /work/4e0b2fcc-4f93-4cf7-908d-323caa74cb6b
            - listitem [ref=e247]:
              - generic [ref=e248]:
                - button "SYN LC17 observed need 9eaced40-34e0-435e-8030-512fe4ff06fc" [ref=e249] [cursor=pointer]
                - paragraph [ref=e250]: Reference not supplied · Activity
              - link "Open record" [ref=e251] [cursor=pointer]:
                - /url: /work/4e4d0531-e7d9-4138-b991-73eceaf07aeb
            - listitem [ref=e252]:
              - generic [ref=e253]:
                - 'button "SYN OEM query: intermittent sensor alarm remains unresolved" [ref=e254] [cursor=pointer]'
                - paragraph [ref=e255]: Reference not supplied · Activity
              - link "Open record" [ref=e256] [cursor=pointer]:
                - /url: /work/85000000-0000-4000-8000-000000000001
            - listitem [ref=e257]:
              - generic [ref=e258]:
                - button "SYN Confirm disputed serial candidates; do not assume one asset" [ref=e259] [cursor=pointer]
                - paragraph [ref=e260]: Reference not supplied · Activity
              - link "Open record" [ref=e261] [cursor=pointer]:
                - /url: /work/85000000-0000-4000-8000-000000000002
            - listitem [ref=e262]:
              - generic [ref=e263]:
                - button "SYN Clarify access information" [ref=e264] [cursor=pointer]
                - paragraph [ref=e265]: Reference not supplied · Activity
              - link "Open record" [ref=e266] [cursor=pointer]:
                - /url: /work/85000000-0000-4000-8000-000000000003
            - listitem [ref=e267]:
              - generic [ref=e268]:
                - button "SYN Duplicate relationship action withdrawn" [ref=e269] [cursor=pointer]
                - paragraph [ref=e270]: Reference not supplied · Activity
              - link "Open record" [ref=e271] [cursor=pointer]:
                - /url: /work/85000000-0000-4000-8000-000000000004
            - listitem [ref=e272]:
              - generic [ref=e273]:
                - button "SYN Review replacement cable availability question" [ref=e274] [cursor=pointer]
                - paragraph [ref=e275]: Reference not supplied · Activity
              - link "Open record" [ref=e276] [cursor=pointer]:
                - /url: /work/85000000-0000-4000-8000-000000000005
            - listitem [ref=e277]:
              - generic [ref=e278]:
                - button "SYN Customer asks about another growing area" [ref=e279] [cursor=pointer]
                - paragraph [ref=e280]: Reference not supplied · Activity
              - link "Open record" [ref=e281] [cursor=pointer]:
                - /url: /work/997743d7-53a6-434a-a975-ef32a0e6021d
            - listitem [ref=e282]:
              - generic [ref=e283]:
                - button "SYN Call to clarify the irrigation controls need" [ref=e284] [cursor=pointer]
                - paragraph [ref=e285]: Reference not supplied · Activity
              - link "Open record" [ref=e286] [cursor=pointer]:
                - /url: /work/a3151975-ce33-46e7-b912-6d4a3b227822
            - listitem [ref=e287]:
              - generic [ref=e288]:
                - 'button "SYN-PPO planner: review seeded booking contact and preparation" [ref=e289] [cursor=pointer]'
                - paragraph [ref=e290]: Reference not supplied · Activity
              - link "Open record" [ref=e291] [cursor=pointer]:
                - /url: /work/b2000000-0000-4000-8000-000000000001
            - listitem [ref=e292]:
              - generic [ref=e293]:
                - button "SYN Review retained enquiry questions with the site contact" [ref=e294] [cursor=pointer]
                - paragraph [ref=e295]: Reference not supplied · Activity
              - link "Open record" [ref=e296] [cursor=pointer]:
                - /url: /work/b5dc516f-cf15-4e25-97ce-c2e9e24a4920
            - listitem [ref=e297]:
              - generic [ref=e298]:
                - button "Prepare an irrigation controller inspection" [ref=e299] [cursor=pointer]
                - paragraph [ref=e300]: SYN-PPO-TKT-000001 · Service request
              - link "Open record" [ref=e301] [cursor=pointer]:
                - /url: /service/tickets/40000000-0000-4000-8000-000000000001
            - listitem [ref=e302]:
              - generic [ref=e303]:
                - button "SYN Intermittent sensor alarm" [ref=e304] [cursor=pointer]
                - paragraph [ref=e305]: SYN-PPO-TKT-000003 · Service request
              - link "Open record" [ref=e306] [cursor=pointer]:
                - /url: /service/tickets/40000000-0000-4000-8000-000000000010
            - listitem [ref=e307]:
              - generic [ref=e308]:
                - button "SYN Urgent request — site still unknown" [ref=e309] [cursor=pointer]
                - paragraph [ref=e310]: SYN-PPO-TKT-000004 · Service request
              - link "Open record" [ref=e311] [cursor=pointer]:
                - /url: /service/tickets/40000000-0000-4000-8000-000000000011
            - listitem [ref=e312]:
              - generic [ref=e313]:
                - button "SYN P04 triaged inspection request" [ref=e314] [cursor=pointer]
                - paragraph [ref=e315]: SYN-PPO-TKT-000005 · Service request
              - link "Open record" [ref=e316] [cursor=pointer]:
                - /url: /service/tickets/40000000-0000-4000-8000-000000000020
            - listitem [ref=e317]:
              - generic [ref=e318]:
                - button "SYN customer requests a follow-up after service" [ref=e319] [cursor=pointer]
                - paragraph [ref=e320]: SYN-PPO-TKT-000006 · Service request
              - link "Open record" [ref=e321] [cursor=pointer]:
                - /url: /service/tickets/8740b8a3-1e25-40ab-bd69-111c8e720060
            - listitem [ref=e322]:
              - generic [ref=e323]:
                - button "SYN Greenhouse 01" [ref=e324] [cursor=pointer]
                - paragraph [ref=e325]: Reference not supplied · Facility / growing area
                - paragraph [ref=e326]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Greenhouse 01
              - link "Open record" [ref=e327] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000001
            - listitem [ref=e328]:
              - generic [ref=e329]:
                - button "SYN irrigation bay" [ref=e330] [cursor=pointer]
                - paragraph [ref=e331]: Reference not supplied · Facility / growing area
                - paragraph [ref=e332]: SYN Previous Operator → SYN Greenhouse Demonstration → SYN Q01 Demonstration Site → SYN irrigation bay
              - link "Open record" [ref=e333] [cursor=pointer]:
                - /url: /facilities/72000000-0000-4000-8000-000000000001
            - listitem [ref=e334]:
              - generic [ref=e335]:
                - button "SYN Irrigation Block 01" [ref=e336] [cursor=pointer]
                - paragraph [ref=e337]: Reference not supplied · Facility / growing area
                - paragraph [ref=e338]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Irrigation Block 01
              - link "Open record" [ref=e339] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000007
            - listitem [ref=e340]:
              - generic [ref=e341]:
                - button "SYN Irrigation Block 02 / Field" [ref=e342] [cursor=pointer]
                - paragraph [ref=e343]: Reference not supplied · Facility / growing area
                - paragraph [ref=e344]: SYN Willowbank Horticulture → SYN Field production → SYN Irrigation Block 02 / Field
              - link "Open record" [ref=e345] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000008
            - listitem [ref=e346]:
              - generic [ref=e347]:
                - button "SYN Irrigation Shed 01" [ref=e348] [cursor=pointer]
                - paragraph [ref=e349]: Reference not supplied · Facility / growing area
                - paragraph [ref=e350]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Irrigation Shed 01
              - link "Open record" [ref=e351] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000006
            - listitem [ref=e352]:
              - generic [ref=e353]:
                - button "SYN Pack Room 01" [ref=e354] [cursor=pointer]
                - paragraph [ref=e355]: Reference not supplied · Facility / growing area
                - paragraph [ref=e356]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Pack Room 01
              - link "Open record" [ref=e357] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000005
            - listitem [ref=e358]:
              - generic [ref=e359]:
                - button "SYN Propagation Bay A" [ref=e360] [cursor=pointer]
                - paragraph [ref=e361]: Reference not supplied · Facility / growing area
                - paragraph [ref=e362]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Propagation House 01 (physical parent) → SYN Propagation Bay A
              - link "Open record" [ref=e363] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000004
            - listitem [ref=e364]:
              - generic [ref=e365]:
                - button "SYN Propagation House 01" [ref=e366] [cursor=pointer]
                - paragraph [ref=e367]: Reference not supplied · Facility / growing area
                - paragraph [ref=e368]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Propagation House 01
              - link "Open record" [ref=e369] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000003
            - listitem [ref=e370]:
              - generic [ref=e371]:
                - button "SYN Tunnel 01" [ref=e372] [cursor=pointer]
                - paragraph [ref=e373]: Reference not supplied · Facility / growing area
                - paragraph [ref=e374]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Tunnel 01
              - link "Open record" [ref=e375] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000002
            - listitem [ref=e376]:
              - generic [ref=e377]:
                - button "SYN Tunnel 02" [ref=e378] [cursor=pointer]
                - paragraph [ref=e379]: Reference not supplied · Facility / growing area
                - paragraph [ref=e380]: SYN Willowbank Horticulture → SYN Field production → SYN Tunnel 02
              - link "Open record" [ref=e381] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000009
          - paragraph [ref=e382]: Observed 07/10/2026, 5:35:31 pm. Counts describe this page, not all business records.
  - alert [ref=e383]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { navigateToSearch } from "../helpers/search-navigation";
  3  |
  4  | test.beforeEach(async ({ page, baseURL }) => {
  5  |   expect((await page.request.post("/api/v1/local-session", {
  6  |     headers: { Origin: baseURL! }, data: { profile: "coordinator" },
  7  |   })).ok()).toBe(true);
  8  | });
  9  | test("search geometry waits for its exact initial read before the render assertion", async ({ page }) => {
  10 |   test.setTimeout(30000);
  11 |   let reads = 0;
  12 |   await page.route("**/api/v1/search?*", async route => {
  13 |     reads++;
  14 |     await new Promise(resolve => setTimeout(resolve, 6000));
  15 |     await route.continue();
  16 |   });
  17 |   const start = Date.now();
  18 |   await navigateToSearch(page, "/search?q=SYN");
  19 |   expect(Date.now() - start).toBeGreaterThanOrEqual(6000);
  20 |   await expect(page.getByText(/results on this page/)).toBeVisible();
> 21 |   expect(reads).toBe(1);
     |                 ^ Error: expect(received).toBe(expected) // Object.is equality
  22 | });
  23 | test("search readiness rejects an unsuccessful initial read", async ({ page }) => {
  24 |   await page.route("**/api/v1/search?*", route => route.fulfill({
  25 |     status: 503, contentType: "application/json",
  26 |     body: JSON.stringify({ code: "Unavailable", message: "SYN search unavailable" }),
  27 |   }));
  28 |   await expect(navigateToSearch(page, "/search?q=SYN")).rejects.toThrow("/api/v1/search initial read");
  29 |   await expect(page.getByText(/results on this page/)).toHaveCount(0);
  30 | });
  31 |
```
