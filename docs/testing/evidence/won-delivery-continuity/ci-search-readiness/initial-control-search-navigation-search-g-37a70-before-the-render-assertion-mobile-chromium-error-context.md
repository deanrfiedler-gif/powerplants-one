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
    - navigation "Mobile navigation" [ref=e3]:
      - link "My Work" [ref=e4] [cursor=pointer]:
        - /url: /work
      - link "Deals" [ref=e10] [cursor=pointer]:
        - /url: /sales/opportunities
      - link "Activities" [ref=e15] [cursor=pointer]:
        - /url: /calendar?day=2026-10-07
      - link "Contacts" [ref=e21] [cursor=pointer]:
        - /url: /contacts
      - button "More" [ref=e26] [cursor=pointer]
    - generic [ref=e32]:
      - banner [ref=e33]:
        - link "Powerplants One home" [ref=e34] [cursor=pointer]:
          - /url: /
          - img "Powerplants Australia" [ref=e35]
        - navigation "Breadcrumb" [ref=e36]:
          - list "Search" [ref=e37]:
            - listitem [ref=e38]:
              - generic [ref=e39]: Search
        - generic [ref=e41]:
          - button "Design and build workspace" [ref=e42] [cursor=pointer]
          - button "Open global search" [ref=e45] [cursor=pointer]
          - button "Page guide" [ref=e49] [cursor=pointer]
        - region "Local demonstration identity" [ref=e55]:
          - button "Change identity" [ref=e57] [cursor=pointer]:
            - generic [aria-hidden] [ref=e58]: SC
      - main [ref=e59]:
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e64]:
              - paragraph [ref=e65]: Shared workspace
              - heading "Search" [level=1] [ref=e66]
              - paragraph [ref=e67]: Find records within your current access.
            - button "Saved views" [ref=e68] [cursor=pointer]
            - link "My Work" [ref=e69] [cursor=pointer]:
              - /url: /work
          - generic [ref=e70]:
            - generic [ref=e71]:
              - text: Search records
              - searchbox "Search records" [ref=e72]: SYN
            - button "Search" [ref=e73] [cursor=pointer]
            - button "Refresh results" [ref=e74] [cursor=pointer]
          - navigation "Result types" [ref=e75]:
            - button "All types" [pressed] [ref=e76] [cursor=pointer]
            - button "Site survey" [ref=e77] [cursor=pointer]
            - button "Site readiness" [ref=e78] [cursor=pointer]
            - button "Account development" [ref=e79] [cursor=pointer]
            - button "Issued job pack" [ref=e80] [cursor=pointer]
            - button "Engineering package" [ref=e81] [cursor=pointer]
            - button "Lead" [ref=e82] [cursor=pointer]
            - button "Project" [ref=e83] [cursor=pointer]
            - button "Deal" [ref=e84] [cursor=pointer]
            - button "Customer" [ref=e85] [cursor=pointer]
            - button "Contact" [ref=e86] [cursor=pointer]
            - button "Site" [ref=e87] [cursor=pointer]
            - button "Equipment" [ref=e88] [cursor=pointer]
            - button "Activity" [ref=e89] [cursor=pointer]
            - button "Service request" [ref=e90] [cursor=pointer]
            - button "Facility / growing area" [ref=e91] [cursor=pointer]
          - status [ref=e92]: 60 results on this page for “SYN”; more available. Choose a type to page through its results.
          - list [ref=e93]:
            - listitem [ref=e94]:
              - generic [ref=e95]:
                - button "SYN Greenhouse controls enquiry" [ref=e96] [cursor=pointer]
                - paragraph [ref=e97]: SYN-PPO-LEAD-000006 · Lead
              - link "Open record" [ref=e98] [cursor=pointer]:
                - /url: /sales/leads/b1cb0442-5daa-4e1e-b420-886ce6d864f5
            - listitem [ref=e99]:
              - generic [ref=e100]:
                - button "SYN LC17 returned Lead e5029a72-46e8-40fd-bd49-888030c69729" [ref=e101] [cursor=pointer]
                - paragraph [ref=e102]: SYN-PPO-LEAD-000005 · Lead
              - link "Open record" [ref=e103] [cursor=pointer]:
                - /url: /sales/leads/dd0e6bba-1de2-4208-ae26-9dab87c2d98c
            - listitem [ref=e104]:
              - generic [ref=e105]:
                - button "SYN Greenhouse controls enquiry" [ref=e106] [cursor=pointer]
                - paragraph [ref=e107]: SYN-PPO-LEAD-000003 · Lead
              - link "Open record" [ref=e108] [cursor=pointer]:
                - /url: /sales/leads/803a8a43-6986-47c9-a4a4-afdf97c8e1e2
            - listitem [ref=e109]:
              - generic [ref=e110]:
                - button "SYN LC17 returned Lead ad9ffd9e-71f9-41ec-9e91-22a9cb9e4a59" [ref=e111] [cursor=pointer]
                - paragraph [ref=e112]: SYN-PPO-LEAD-000002 · Lead
              - link "Open record" [ref=e113] [cursor=pointer]:
                - /url: /sales/leads/8e000234-bd21-4909-99aa-ac4b7c138eba
            - listitem [ref=e114]:
              - generic [ref=e115]:
                - button "SYN Gantt integration mobile-chromium 1791358567829" [ref=e116] [cursor=pointer]
                - paragraph [ref=e117]: SYN-PPO-PRJ-000005 · Project
              - link "Open record" [ref=e118] [cursor=pointer]:
                - /url: /projects/27142565-92f4-494f-840b-58c1f129f514
            - listitem [ref=e119]:
              - generic [ref=e120]:
                - button "SYN Gantt integration desktop-chromium 1791358505487" [ref=e121] [cursor=pointer]
                - paragraph [ref=e122]: SYN-PPO-PRJ-000001 · Project
              - link "Open record" [ref=e123] [cursor=pointer]:
                - /url: /projects/2bb13835-b34c-4c3b-b341-3285a95f65d9
            - listitem [ref=e124]:
              - generic [ref=e125]:
                - button "SYN Irrigation and climate delivery" [ref=e126] [cursor=pointer]
                - paragraph [ref=e127]: SYN-PPO-PRJ-000006 · Project
              - link "Open record" [ref=e128] [cursor=pointer]:
                - /url: /projects/30203944-6f80-4c69-8a55-3eba9b5d9052
            - listitem [ref=e129]:
              - generic [ref=e130]:
                - button "SYN Irrigation and climate delivery" [ref=e131] [cursor=pointer]
                - paragraph [ref=e132]: SYN-PPO-PRJ-000003 · Project
              - link "Open record" [ref=e133] [cursor=pointer]:
                - /url: /projects/4e5d9769-9286-429c-9838-65ec239e4331
            - listitem [ref=e134]:
              - generic [ref=e135]:
                - button "SYN Irrigation and climate delivery" [ref=e136] [cursor=pointer]
                - paragraph [ref=e137]: SYN-PPO-PRJ-000002 · Project
              - link "Open record" [ref=e138] [cursor=pointer]:
                - /url: /projects/51ce36e3-2bf9-43d6-a852-c142082ad51a
            - listitem [ref=e139]:
              - generic [ref=e140]:
                - button "SYN Irrigation and climate delivery" [ref=e141] [cursor=pointer]
                - paragraph [ref=e142]: SYN-PPO-PRJ-000008 · Project
              - link "Open record" [ref=e143] [cursor=pointer]:
                - /url: /projects/864b7a97-be4e-4218-a31f-2988e35eddbd
            - listitem [ref=e144]:
              - generic [ref=e145]:
                - button "SYN Irrigation and climate delivery" [ref=e146] [cursor=pointer]
                - paragraph [ref=e147]: SYN-PPO-PRJ-000007 · Project
              - link "Open record" [ref=e148] [cursor=pointer]:
                - /url: /projects/ae11f070-a165-4fce-a5fd-73d9543b9c9e
            - listitem [ref=e149]:
              - generic [ref=e150]:
                - button "SYN Irrigation and climate delivery" [ref=e151] [cursor=pointer]
                - paragraph [ref=e152]: SYN-PPO-PRJ-000004 · Project
              - link "Open record" [ref=e153] [cursor=pointer]:
                - /url: /projects/b0d76cc1-9d64-4d84-a7aa-469461bdb944
            - listitem [ref=e154]:
              - generic [ref=e155]:
                - button "SYN Greenhouse Demonstration" [ref=e156] [cursor=pointer]
                - paragraph [ref=e157]: SYN-PPO-ORG-000001 · Customer
              - link "Open record" [ref=e158] [cursor=pointer]:
                - /url: /customers/50000000-0000-4000-8000-000000000001
            - listitem [ref=e159]:
              - generic [ref=e160]:
                - button "SYN Previous Operator" [ref=e161] [cursor=pointer]
                - paragraph [ref=e162]: SYN-PPO-ORG-000002 · Customer
              - link "Open record" [ref=e163] [cursor=pointer]:
                - /url: /customers/50000000-0000-4000-8000-000000000002
            - listitem [ref=e164]:
              - generic [ref=e165]:
                - button "SYN Greenhouse Demonstration" [ref=e166] [cursor=pointer]
                - paragraph [ref=e167]: SYN-PPO-ORG-000005 · Customer
              - link "Open record" [ref=e168] [cursor=pointer]:
                - /url: /customers/50000000-0000-4000-8000-000000000005
            - listitem [ref=e169]:
              - generic [ref=e170]:
                - button "SYN Willowbank Horticulture" [ref=e171] [cursor=pointer]
                - paragraph [ref=e172]: SYN-PPO-ORG-000006 · Customer
              - link "Open record" [ref=e173] [cursor=pointer]:
                - /url: /customers/c5050000-0000-4000-8000-000000000001
            - listitem [ref=e174]:
              - generic [ref=e175]:
                - button "SYN Avery Contact" [ref=e176] [cursor=pointer]
                - paragraph [ref=e177]: Reference not supplied · Contact
              - link "Open record" [ref=e178] [cursor=pointer]:
                - /url: /people/60000000-0000-4000-8000-000000000001
            - listitem [ref=e179]:
              - generic [ref=e180]:
                - button "SYN Q01 Demonstration Site" [ref=e181] [cursor=pointer]
                - paragraph [ref=e182]: SYN-PPO-SITE-000001 · Site
              - link "Open record" [ref=e183] [cursor=pointer]:
                - /url: /sites/70000000-0000-4000-8000-000000000001
            - listitem [ref=e184]:
              - generic [ref=e185]:
                - button "SYN V01 Previous Site" [ref=e186] [cursor=pointer]
                - paragraph [ref=e187]: SYN-PPO-SITE-000002 · Site
              - link "Open record" [ref=e188] [cursor=pointer]:
                - /url: /sites/70000000-0000-4000-8000-000000000002
            - listitem [ref=e189]:
              - generic [ref=e190]:
                - button "SYN Nursery & propagation" [ref=e191] [cursor=pointer]
                - paragraph [ref=e192]: SYN-PPO-SITE-000004 · Site
              - link "Open record" [ref=e193] [cursor=pointer]:
                - /url: /sites/c5050001-0000-4000-8000-000000000001
            - listitem [ref=e194]:
              - generic [ref=e195]:
                - button "SYN Field production" [ref=e196] [cursor=pointer]
                - paragraph [ref=e197]: SYN-PPO-SITE-000005 · Site
              - link "Open record" [ref=e198] [cursor=pointer]:
                - /url: /sites/c5050001-0000-4000-8000-000000000002
            - listitem [ref=e199]:
              - generic [ref=e200]:
                - button "SYN irrigation controller" [ref=e201] [cursor=pointer]
                - paragraph [ref=e202]: SYN-PPO-AST-000001 · Equipment
              - link "Open record" [ref=e203] [cursor=pointer]:
                - /url: /equipment/80000000-0000-4000-8000-000000000001
            - listitem [ref=e204]:
              - generic [ref=e205]:
                - button "SYN unidentified sensor" [ref=e206] [cursor=pointer]
                - paragraph [ref=e207]: SYN-PPO-AST-000002 · Equipment
              - link "Open record" [ref=e208] [cursor=pointer]:
                - /url: /equipment/80000000-0000-4000-8000-000000000002
            - listitem [ref=e209]:
              - generic [ref=e210]:
                - button "SYN Willowbank irrigation pump" [ref=e211] [cursor=pointer]
                - paragraph [ref=e212]: SYN-PPO-AST-000004 · Equipment
              - link "Open record" [ref=e213] [cursor=pointer]:
                - /url: /equipment/c5050003-0000-4000-8000-000000000001
            - listitem [ref=e214]:
              - generic [ref=e215]:
                - button "SYN Customer requests a separately qualified upgrade" [ref=e216] [cursor=pointer]
                - paragraph [ref=e217]: Reference not supplied · Activity
              - link "Open record" [ref=e218] [cursor=pointer]:
                - /url: /work/14a4c44e-b770-4825-9b53-5417ff864102
            - listitem [ref=e219]:
              - generic [ref=e220]:
                - button "SYN Confirm scoped next discussion with customer" [ref=e221] [cursor=pointer]
                - paragraph [ref=e222]: Reference not supplied · Activity
              - link "Open record" [ref=e223] [cursor=pointer]:
                - /url: /work/38676851-e0d3-438a-80c3-5dbec3f1e766
            - listitem [ref=e224]:
              - generic [ref=e225]:
                - button "SYN Resolve the original customer questions" [ref=e226] [cursor=pointer]
                - paragraph [ref=e227]: Reference not supplied · Activity
              - link "Open record" [ref=e228] [cursor=pointer]:
                - /url: /work/3a2955ec-700a-427e-b7bd-5901954169f1
            - listitem [ref=e229]:
              - generic [ref=e230]:
                - button "SYN LC17 observed need 6c11cdaf-6fcc-49a9-b790-da10be96679c" [ref=e231] [cursor=pointer]
                - paragraph [ref=e232]: Reference not supplied · Activity
              - link "Open record" [ref=e233] [cursor=pointer]:
                - /url: /work/3cfd01e0-ea43-4569-bdb8-5f1e2c084849
            - listitem [ref=e234]:
              - generic [ref=e235]:
                - button "SYN LC17 observed need f38dbaee-67ac-463e-8a24-1e06a51b929a" [ref=e236] [cursor=pointer]
                - paragraph [ref=e237]: Reference not supplied · Activity
              - link "Open record" [ref=e238] [cursor=pointer]:
                - /url: /work/4216592e-f63c-4bc3-af52-fad7ee0b23eb
            - listitem [ref=e239]:
              - generic [ref=e240]:
                - button "SYN Arrange a technical discovery conversation" [ref=e241] [cursor=pointer]
                - paragraph [ref=e242]: Reference not supplied · Activity
              - link "Open record" [ref=e243] [cursor=pointer]:
                - /url: /work/4917a2c4-4108-488a-bda5-ec34141018f3
            - listitem [ref=e244]:
              - generic [ref=e245]:
                - button "SYN Arrange a technical discovery conversation" [ref=e246] [cursor=pointer]
                - paragraph [ref=e247]: Reference not supplied · Activity
              - link "Open record" [ref=e248] [cursor=pointer]:
                - /url: /work/4e0b2fcc-4f93-4cf7-908d-323caa74cb6b
            - listitem [ref=e249]:
              - generic [ref=e250]:
                - button "SYN LC17 observed need 9eaced40-34e0-435e-8030-512fe4ff06fc" [ref=e251] [cursor=pointer]
                - paragraph [ref=e252]: Reference not supplied · Activity
              - link "Open record" [ref=e253] [cursor=pointer]:
                - /url: /work/4e4d0531-e7d9-4138-b991-73eceaf07aeb
            - listitem [ref=e254]:
              - generic [ref=e255]:
                - button "SYN Resolve the original customer questions" [ref=e256] [cursor=pointer]
                - paragraph [ref=e257]: Reference not supplied · Activity
              - link "Open record" [ref=e258] [cursor=pointer]:
                - /url: /work/56ccd3da-a952-4199-898f-2815d97185c6
            - listitem [ref=e259]:
              - generic [ref=e260]:
                - button "SYN Review retained enquiry questions with the site contact" [ref=e261] [cursor=pointer]
                - paragraph [ref=e262]: Reference not supplied · Activity
              - link "Open record" [ref=e263] [cursor=pointer]:
                - /url: /work/643804d5-21a5-4fbe-8deb-e871a25b8e7a
            - listitem [ref=e264]:
              - generic [ref=e265]:
                - button "SYN LC17 observed need df13d318-6d60-48f9-adb7-a3254528312e" [ref=e266] [cursor=pointer]
                - paragraph [ref=e267]: Reference not supplied · Activity
              - link "Open record" [ref=e268] [cursor=pointer]:
                - /url: /work/7497efb1-4648-4b54-b058-8cecc9f4bb58
            - listitem [ref=e269]:
              - generic [ref=e270]:
                - 'button "SYN OEM query: intermittent sensor alarm remains unresolved" [ref=e271] [cursor=pointer]'
                - paragraph [ref=e272]: Reference not supplied · Activity
              - link "Open record" [ref=e273] [cursor=pointer]:
                - /url: /work/85000000-0000-4000-8000-000000000001
            - listitem [ref=e274]:
              - generic [ref=e275]:
                - button "SYN Confirm disputed serial candidates; do not assume one asset" [ref=e276] [cursor=pointer]
                - paragraph [ref=e277]: Reference not supplied · Activity
              - link "Open record" [ref=e278] [cursor=pointer]:
                - /url: /work/85000000-0000-4000-8000-000000000002
            - listitem [ref=e279]:
              - generic [ref=e280]:
                - button "SYN Clarify access information" [ref=e281] [cursor=pointer]
                - paragraph [ref=e282]: Reference not supplied · Activity
              - link "Open record" [ref=e283] [cursor=pointer]:
                - /url: /work/85000000-0000-4000-8000-000000000003
            - listitem [ref=e284]:
              - generic [ref=e285]:
                - button "SYN Duplicate relationship action withdrawn" [ref=e286] [cursor=pointer]
                - paragraph [ref=e287]: Reference not supplied · Activity
              - link "Open record" [ref=e288] [cursor=pointer]:
                - /url: /work/85000000-0000-4000-8000-000000000004
            - listitem [ref=e289]:
              - generic [ref=e290]:
                - button "SYN Review replacement cable availability question" [ref=e291] [cursor=pointer]
                - paragraph [ref=e292]: Reference not supplied · Activity
              - link "Open record" [ref=e293] [cursor=pointer]:
                - /url: /work/85000000-0000-4000-8000-000000000005
            - listitem [ref=e294]:
              - generic [ref=e295]:
                - button "SYN Customer asks about another growing area" [ref=e296] [cursor=pointer]
                - paragraph [ref=e297]: Reference not supplied · Activity
              - link "Open record" [ref=e298] [cursor=pointer]:
                - /url: /work/997743d7-53a6-434a-a975-ef32a0e6021d
            - listitem [ref=e299]:
              - generic [ref=e300]:
                - button "SYN Confirm scoped next discussion with customer" [ref=e301] [cursor=pointer]
                - paragraph [ref=e302]: Reference not supplied · Activity
              - link "Open record" [ref=e303] [cursor=pointer]:
                - /url: /work/9f2038d2-09bb-424e-850c-91fc104b4ff8
            - listitem [ref=e304]:
              - generic [ref=e305]:
                - button "SYN Call to clarify the irrigation controls need" [ref=e306] [cursor=pointer]
                - paragraph [ref=e307]: Reference not supplied · Activity
              - link "Open record" [ref=e308] [cursor=pointer]:
                - /url: /work/a3151975-ce33-46e7-b912-6d4a3b227822
            - listitem [ref=e309]:
              - generic [ref=e310]:
                - 'button "SYN-PPO planner: review seeded booking contact and preparation" [ref=e311] [cursor=pointer]'
                - paragraph [ref=e312]: Reference not supplied · Activity
              - link "Open record" [ref=e313] [cursor=pointer]:
                - /url: /work/b2000000-0000-4000-8000-000000000001
            - listitem [ref=e314]:
              - generic [ref=e315]:
                - button "SYN customer requests a follow-up after service" [ref=e316] [cursor=pointer]
                - paragraph [ref=e317]: SYN-PPO-TKT-000007 · Service request
              - link "Open record" [ref=e318] [cursor=pointer]:
                - /url: /service/tickets/0999ce98-eccc-4939-a851-0099c841e092
            - listitem [ref=e319]:
              - generic [ref=e320]:
                - button "Prepare an irrigation controller inspection" [ref=e321] [cursor=pointer]
                - paragraph [ref=e322]: SYN-PPO-TKT-000001 · Service request
              - link "Open record" [ref=e323] [cursor=pointer]:
                - /url: /service/tickets/40000000-0000-4000-8000-000000000001
            - listitem [ref=e324]:
              - generic [ref=e325]:
                - button "SYN Intermittent sensor alarm" [ref=e326] [cursor=pointer]
                - paragraph [ref=e327]: SYN-PPO-TKT-000003 · Service request
              - link "Open record" [ref=e328] [cursor=pointer]:
                - /url: /service/tickets/40000000-0000-4000-8000-000000000010
            - listitem [ref=e329]:
              - generic [ref=e330]:
                - button "SYN Urgent request — site still unknown" [ref=e331] [cursor=pointer]
                - paragraph [ref=e332]: SYN-PPO-TKT-000004 · Service request
              - link "Open record" [ref=e333] [cursor=pointer]:
                - /url: /service/tickets/40000000-0000-4000-8000-000000000011
            - listitem [ref=e334]:
              - generic [ref=e335]:
                - button "SYN P04 triaged inspection request" [ref=e336] [cursor=pointer]
                - paragraph [ref=e337]: SYN-PPO-TKT-000005 · Service request
              - link "Open record" [ref=e338] [cursor=pointer]:
                - /url: /service/tickets/40000000-0000-4000-8000-000000000020
            - listitem [ref=e339]:
              - generic [ref=e340]:
                - button "SYN customer requests a follow-up after service" [ref=e341] [cursor=pointer]
                - paragraph [ref=e342]: SYN-PPO-TKT-000006 · Service request
              - link "Open record" [ref=e343] [cursor=pointer]:
                - /url: /service/tickets/8740b8a3-1e25-40ab-bd69-111c8e720060
            - listitem [ref=e344]:
              - generic [ref=e345]:
                - button "SYN Greenhouse 01" [ref=e346] [cursor=pointer]
                - paragraph [ref=e347]: Reference not supplied · Facility / growing area
                - paragraph [ref=e348]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Greenhouse 01
              - link "Open record" [ref=e349] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000001
            - listitem [ref=e350]:
              - generic [ref=e351]:
                - button "SYN irrigation bay" [ref=e352] [cursor=pointer]
                - paragraph [ref=e353]: Reference not supplied · Facility / growing area
                - paragraph [ref=e354]: SYN Previous Operator → SYN Greenhouse Demonstration → SYN Q01 Demonstration Site → SYN irrigation bay
              - link "Open record" [ref=e355] [cursor=pointer]:
                - /url: /facilities/72000000-0000-4000-8000-000000000001
            - listitem [ref=e356]:
              - generic [ref=e357]:
                - button "SYN Irrigation Block 01" [ref=e358] [cursor=pointer]
                - paragraph [ref=e359]: Reference not supplied · Facility / growing area
                - paragraph [ref=e360]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Irrigation Block 01
              - link "Open record" [ref=e361] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000007
            - listitem [ref=e362]:
              - generic [ref=e363]:
                - button "SYN Irrigation Block 02 / Field" [ref=e364] [cursor=pointer]
                - paragraph [ref=e365]: Reference not supplied · Facility / growing area
                - paragraph [ref=e366]: SYN Willowbank Horticulture → SYN Field production → SYN Irrigation Block 02 / Field
              - link "Open record" [ref=e367] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000008
            - listitem [ref=e368]:
              - generic [ref=e369]:
                - button "SYN Irrigation Shed 01" [ref=e370] [cursor=pointer]
                - paragraph [ref=e371]: Reference not supplied · Facility / growing area
                - paragraph [ref=e372]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Irrigation Shed 01
              - link "Open record" [ref=e373] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000006
            - listitem [ref=e374]:
              - generic [ref=e375]:
                - button "SYN Pack Room 01" [ref=e376] [cursor=pointer]
                - paragraph [ref=e377]: Reference not supplied · Facility / growing area
                - paragraph [ref=e378]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Pack Room 01
              - link "Open record" [ref=e379] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000005
            - listitem [ref=e380]:
              - generic [ref=e381]:
                - button "SYN Propagation Bay A" [ref=e382] [cursor=pointer]
                - paragraph [ref=e383]: Reference not supplied · Facility / growing area
                - paragraph [ref=e384]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Propagation House 01 (physical parent) → SYN Propagation Bay A
              - link "Open record" [ref=e385] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000004
            - listitem [ref=e386]:
              - generic [ref=e387]:
                - button "SYN Propagation House 01" [ref=e388] [cursor=pointer]
                - paragraph [ref=e389]: Reference not supplied · Facility / growing area
                - paragraph [ref=e390]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Propagation House 01
              - link "Open record" [ref=e391] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000003
            - listitem [ref=e392]:
              - generic [ref=e393]:
                - button "SYN Tunnel 01" [ref=e394] [cursor=pointer]
                - paragraph [ref=e395]: Reference not supplied · Facility / growing area
                - paragraph [ref=e396]: SYN Willowbank Horticulture → SYN Nursery & propagation → SYN Tunnel 01
              - link "Open record" [ref=e397] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000002
            - listitem [ref=e398]:
              - generic [ref=e399]:
                - button "SYN Tunnel 02" [ref=e400] [cursor=pointer]
                - paragraph [ref=e401]: Reference not supplied · Facility / growing area
                - paragraph [ref=e402]: SYN Willowbank Horticulture → SYN Field production → SYN Tunnel 02
              - link "Open record" [ref=e403] [cursor=pointer]:
                - /url: /facilities/c5050002-0000-4000-8000-000000000009
          - paragraph [ref=e404]: Observed 07/10/2026, 5:36:29 pm. Counts describe this page, not all business records.
  - alert [ref=e405]
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
