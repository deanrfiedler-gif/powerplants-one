---
document_id: PPO-CP05-CUSTOMER-KNOWLEDGE-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; implementation, article publication and live customer access separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Customer knowledge and guided support design — owner decision

On 23 October 2026 Dean asked Claude to "design and build the "Customer knowledge and guided support (CP-05)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/portal/knowledge` is not built, so this design defines the build.

On 30 October 2026, asked "Do you accept the CP-05 design with the recommended answers?", Dean answered: "Accept and lock in". That adopts departures D1–D14 and the recommended answers to Q1–Q8.

Claude drew the page from these sources:
- the [customer portal design](../blueprints/customer-portal-design.md), in particular §5 screens, §6 the knowledge article record, §8 publication and §9 access and recovery;
- the [implementation plan](../delivery/customer-portal-implementation-plan.md) (stage CP3) and [acceptance procedures](../testing/customer-portal-acceptance.md) (CPA-11, CPA-12);
- the [Knowledge search and article design](knowledge-search-article-design.md) and the DK-05 r01 HTML reference;
- the [Portal home and access design](portal-home-access-figma-design.md) for the portal shell;
- the Support requests CP-02, Equipment & reports CP-04 and Knowledge DK-04 Figma pages, read and not edited.

Scope:
- `scope:CP-05` "Customer knowledge and guided support", destination `/portal/knowledge`.
- Parent requirements DOC-01, DOC-02, DOC-04, DOC-06 and NFR-08, with local acceptance CPA-11 and CPA-12 (both Not run). No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, article publication, customer message or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design CP-05 in Figma | User decision, 23 October 2026 | Dean's request quoted above |
| Departures D1–D14 | Accepted as recommended, 30 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Which topics come first | Resolved as recommended | Climate screens, Climate control, Irrigation and fertigation, Alarms and controller display, then Using the portal and support. Start with five to ten articles answering the commonest requests, and add more from pilot evidence: searches with no result and articles that still led to a request |
| Q2 Offer guided help before the support form every time | Resolved as recommended | Offered, never required. Help home and No results suggest it; CP-02 step 2 may show "Try guided help" as a link when the chosen equipment has a path. Request support stays one click away |
| Q3 Video content later | Resolved as recommended | Not in CP3. Revisit after the pilot as short captioned clips with a transcript, reviewed and revised like articles. No external video service until an ADR chooses one |
| Q4 Public or portal-only articles | Resolved as recommended | Portal-only for CP3. A separately reviewed public set can be decided later with the website |
| Q5 CP-4 or CC-4 in the story | Resolved as recommended | CC-4. On Tue 13 Oct CP-4 is still in the workshop (installed Thu 15 Oct, CP-04 Q1), and keeping that date lets guided help produce `SYN-TKT-000105` at 09:06 as on CP-02. After the install, applicability is checked again against CP-4 |
| Q6 DK-05 handover | Resolved as recommended; partly met | Record as DK-05 requirements: a Customer-publishable audience with its own review, guided paths as reviewable content, withdrawal reasons written for customers, and a feedback list for article owners. Section 5 says what DK-05 now covers |
| Q7 Reference type for guided paths | Resolved as recommended | `SYN-GH-000nnn`, separate from articles (`SYN-KA-`) |
| Q8 Next page | Resolved as recommended; since done | Knowledge authoring · DK-05, which was drawn after this page |
| Accept the design | User decision, 30 October 2026 | Quoted above |
| Named Figma version | Waiting for Dean | "Customer knowledge — accepted" is not saved yet (section 7) |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Customer knowledge · CP-05" `2244:41313`, under "— Customer portal —", after Equipment & reports · CP-04. The page header `2244:41314` holds the conformance declaration; the notes card `2245:802440` is in Flows and notes. File index row `2771:533079` |
| Desktop 1440 | Help home `2245:732403`; search results for "screen position" `2245:732640`; article, full length `2245:740957`; guided help questions 1–3 `2245:750133`, `2245:750285`, `2245:750445`; guided result `2245:750612`; request support prefilled from guided help (CP-02 step 2 copy) `2245:756082`; superseded article `2245:741215` |
| Tablet 1024 | Article `2245:756244` |
| Phone 390 | Help home `2245:766544`; questions 1–3 `2245:774605`, `2245:774663`, `2245:774725`; result `2245:774789`; request support `2245:785735`; article `2245:766714` |
| Phone 320 | Help home `2245:766905`; question 1 `2245:774842`; question 3 `2245:774900`; result `2245:774964`; request support `2245:785875`; article `2245:767077`. Question 2 at 320 is not drawn; it matches 390 |
| States | Desktop: loading `2245:796058`, no results `2245:796212`, applicability unknown `2245:796348`, source unavailable `2245:796472`. Phone 390: article withdrawn `2245:786013`, offline or poor signal `2245:786101` |
| Parts | Moved at acceptance to "Components · Customer portal" `2613:6751` on the Components page: Knowledge / Portal result row · desktop `2244:732016`, Portal result card · phone `2244:732025`, Topic tile `2244:732033`, Guided help entry `2244:732038`, Stop and call us `2244:732047`, Step image `2244:732060`, Feedback `2244:732090`, Notice `2244:732145`; Guided / Progress `2244:732109`. Names still carry "(proposed)" |
| Prototype | Flows "CP-05 — desktop" (from Help home) and "CP-05 — phone" (from Help home 390), 62 links on this page. Desktop: Screens not moving → questions 1–3 → result → request prefilled; Help home → article → Replaces → superseded article → current article; search → results → article. Phone: the same guided path and Help home → article |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST (site time, Brisbane). Priya Shah (Customer site coordinator, Hillview Growers, SYN Glasshouse 4, as on CP-01) follows guided help "Screens not moving" `SYN-GH-000003` r01 at 09:02 and answers Shade screen M-3, a screen or drive alarm, grinding at the motor. The result asks for a technician, CP-02 opens prefilled, and she sends `SYN-TKT-000105` at 09:06 as on CP-02. Article `SYN-KA-000021` r02 "Checking screen position settings" applies to the CC-4 climate controller `SYN-AST-000141` (ScreenDesk 3.2). It replaced `SYN-KA-000017` r03 on Mon 28 Sep; `SYN-KA-000019` r02 was withdrawn Thu 8 Oct. Other results: `SYN-KA-000022`, `000023`, `000027` (Yes), `000028` (No), `000029` (Not sure). Section 5 records a difference from DK-05 |
| Retained captures | [Customer knowledge design r01](../reference/ui/customer-portal/customer-knowledge-design-r01/README.md): 29 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CP-05` and `/portal/knowledge` (not built). Stage CP3. Parents DOC-01, DOC-02, DOC-04, DOC-06 and NFR-08, unchanged; all 78 parent IDs preserved |
| Page type (r20) | Register / worklist (Help home, results). Record detail (article, superseded and withdrawn articles). Form / guided workflow (guided help and result) |
| Reused components | CP-01 portal shell: Header · desktop (Help selected by an instance override), Nav bar · desktop (no item selected), Phone header, Tab bar · phone (no tab selected), Card header, Footer. CP-02: Support / Choice, Step, Text area, Detail row. DK-04: Knowledge / Step and Safety note. Components: Button, Tag, Record / Banner and Font Awesome Pro Light icons through the Kit. New parts as listed in section 2 |
| Incoming handovers | Customer articles and guided paths reviewed as Customer-publishable on DK-05 (exact revision, owner, review dates, successor or withdrawal); applicability facts from Equipment EQ-01 for equipment shared with the signed-in contact; portal context from CP-01. Staff knowledge on DK-04 is never read into the portal |
| Outgoing handovers | Request support opens a CP-02 new request carrying the article and revision, the search words, or the guided path with its answers, site and equipment. The customer reviews and sends it; Service owns triage. "Did this help?" reaches the article owner as feedback only and changes no article, request or status |
| Source authority | The sources listed above. Articles, guided paths, people and equipment are synthetic fixtures; no step is a real or validated procedure |
| Proposed departures | D1–D14 in section 4, accepted |
| Status | Owner-accepted design, 30 October 2026 |
| Decision record | This file |
| Named version | "Customer knowledge — accepted", waiting for Dean (section 7) |

## 4. What the design shows

| ID | Departure or rule | Basis |
|---|---|---|
| D1 | Help is the knowledge entry. The header Help action opens Help, and the CP-01 Help menu gains "Search help and guided help" (an accepted amendment for CP-01's next change, not drawn there). No new navigation item or phone tab; on phone Help stays in the account menu | CP-01 D4, D12, D15; design §5 |
| D2 | Help home: search with popular searches, product families, For your equipment, Guided help, Still need help with Request support, and the urgent line. On phone guided help comes first | Brief; design §5 |
| D3 | Every result and article says Applies: Yes, No or Not sure in words, with its reason. Not sure stays Not sure ("We won't guess") with Ask us to check. Only equipment shared with the contact is checked; replaced articles say Not checked | Design §5, §6; DK-04 D2 |
| D4 | Results show title, product family and topic, reference and revision, summary, applies with reason, and last reviewed. Applies first, then best match, with filters and counts. Replaced and withdrawn articles and their snippets never appear | Design §8; CPA-11 |
| D5 | Article: reference and exact revision, applicability, Stop and call us above the steps, Before you start, Take care, numbered steps with images, Did this help?, Request support with this article, and About this article (owner, reviewer, last and next review, coverage, what it replaces, source) | Design §5, §8; brief |
| D6 | "Stop and call us" is distinct: a red edge, a stop icon and its own heading, ending in Request a technician. Customer articles cover what the grower owns (settings, routine checks, reading alarms); hardware and electrical work is never customer advice | Brief |
| D7 | "Did this help?" is feedback only | Brief; design §12 |
| D8 | Request support carries its context from an article, from No results or from guided help. The customer always reviews and sends; searching or guided help never blocks a request | Design §8; CPA-11 |
| D9 | Guided help paths are reviewed content with a reference, revision, owner and review date, never generated. Up to three plain questions including "Not sure" and "I can't check"; large answer targets; Back, Start again and Close always available; answers held on screen only. Each path ends in an article or a prefilled request | Brief; design §8, §9 |
| D10 | A hardware result never instructs a repair. It says what the answers point to, shows "This needs a technician", lists what carries over and offers Continue to your request | Brief |
| D11 | CP-02 step 2 prefilled: a "Filled in from guided help" banner with Start again, an Attached chip with Remove, the suggested summary as a hint so the customer's words win, and the answers in What is happening. Drawn here as copies; an accepted amendment for CP-02's next change | Brief; CP-02 D5 |
| D12 | An old link opens a notice. Superseded points to the replacement and keeps the old revision for reference only, its steps collapsed and labelled not current. Withdrawn shows no steps, a customer-safe reason and what to use instead | Design §8; DK-04 D3; CPA-11 |
| D13 | Loading keeps Request support available. If help can't load, no saved copy is shown. Help is online only; offline, guided answers stay on screen unsaved and Continue waits for the connection | Design §9; CPA-12 |
| D14 | Only content reviewed as Customer-publishable on DK-05 appears; staff knowledge, suspected fixes and generated advice never do. Step images are placeholders until source rights are confirmed. Printed copies show revision and date | Design §8; brief |

## 5. Not decided and not drawn

- **Difference from DK-05, open for Dean.** DK-05 was drawn after this page and accepted on 30 October 2026. It tells the same article differently: `SYN-KA-000016` r01, returned by Jordan Kim on Tue 13 Oct at 09:10 and so not yet published, ScreenDesk 3.2 only, with Sasha Cole approving the customer audience. CP-05 shows `SYN-KA-000021` r02 as already published on that date, covering ScreenDesk 3.1 to 3.4, reviewed for customers by Jordan Kim. The rule agrees: only articles reviewed as Customer-publishable appear. These are synthetic fixtures and the accepted frames are retained as they are. Aligning them would need a revised capture set, r02.
- **Not on DK-05.** Guided-path authoring and the owner feedback list from Q6 are not drawn there; DK-05 lists feedback dispositions as not drawn. Both are prerequisites for building guided help and "Did this help?".
- **Building the page.** `/portal/knowledge` is not built and CP3 waits for verified CP1 and controlled knowledge publication (implementation plan).
- **Prerequisites for a build:** published customer article and guided-path records with audience, revision and withdrawal; an applicability read over shared equipment only; audience-scoped search with no stale snippets; CP-02 receiving article, search or guided context; recording feedback for owners.
- **Not drawn:** question 2 at 320; other guided paths and their article endings; a printed article; 200% zoom, checked at build; dark mode.
- **Data in the frames:** the people, equipment, articles, paths and requests are synthetic. Steps, values and sources are placeholders, not validated procedures.

## 6. Audit and polish

Before presenting, Claude checked 29 frames by script and screenshot: about 1,280 visible texts, all Roboto; no stored colour different from its bound variable; no frame overlapping or outside its section; nothing past a frame edge; phone search inputs at 16 px and phone buttons at 48 px; no staff terms in customer frames. Fixed: two filter labels that clipped, 40 px "Request a technician" buttons, DK-04 step and safety text raised to the portal's 16 px body, and double borders on last list rows.

The flows have not been played in Present mode.

## 7. Verification

- The 29 captures are copies of the accepted frames on the "Captures (icon-free)" page at y = 560,000, named "CP-05 capture r01 · …". 340 Font Awesome instances were swapped for `Icon/placeholder`. Scans afterwards found no Font Awesome instance and no visible vector outside a placeholder or the logo, no text colour among 1,136 visible texts differing from its bound variable, and no prototype link on a copy.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/customer-portal/customer-knowledge-design-r01/README.md).
- The named Figma version "Customer knowledge — accepted" is not saved yet.
- New references were checked unused in the repository and across the Figma file on 23 October 2026. A re-check on 30 October found no use of the new `SYN-KA-` or `SYN-GH-` numbers in the repository, and found the DK-05 difference in section 5.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline. CPA-11 and CPA-12 remain Not run.
