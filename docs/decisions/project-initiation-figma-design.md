---
document_id: PPO-PJ01-INITIATION-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; named Figma version awaited; building the page, its data model and operational rules separate
source_commit: 6e939bf0b937fc05f9e477d1cd14f8838c92fd9a
versioning: git
---

# Project initiation design — owner decision

Dean asked Claude to "design and build the "Project initiation and receiving review (PJ-01)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." After an audit, Dean said "Draw F1, F2, F3" on 31 October 2026. Claude drew them and asked "Do you accept PJ-01 with the recommended answers to Q1–Q13?". Dean answered: "Accept". That adopts departures D1–D15 and the recommended answers to Q1–Q13.

PJ-01 starts a project from an accepted delivery handover. The project manager reviews the frozen commitment, asks owned questions, creates the project natively, links it as a separate decision, then starts it with owned first actions.

Claude drew the page from these sources:
- the design register entry `scope:PJ-01` and [scope-pj-01](../design/development/pages/scope-pj-01.md);
- the [accepted Won handover decision](won-delivery-continuity.md) and the [lead-to-delivery contract](../contracts/lead-to-delivery-continuity.md), section LC-16;
- [leads-projects-integration](leads-projects-integration.md), [project-specialist-handover](project-specialist-handover.md) and [project-raid-backend](project-raid-backend.md);
- the accepted [Projects register](projects-register-design.md) and [Project record](project-record-page-design.md) designs;
- the built `/projects/new` form in `src/components/projects-screens.tsx`;
- the Figma proposals Won-deal receiving CR-03 `2689:87` and Quotation conversion ES-07 `2705:2415`, for the story, read and not edited.

Scope:
- `scope:PJ-01`, route `/projects/new`, with a proposed worklist at `/projects/initiation`.
- Parent requirements PRJ-01, PRJ-03 and PRJ-04, with CRM-03 and CRM-08 through LC-16, are unchanged. No parent ID is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, route, read model, migration, capability, grant or deployment. Linking never copies or approves scope, creates schedule tasks, authorises work, books anything or completes the Sales Activity. Started records that the project manager has taken the project on, and nothing more.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design PJ-01 in Figma | User decision | Dean's request quoted above |
| Audit and polish | User request, 31 October 2026 | Findings applied on the page; section 6 |
| Features F1, F2 and F3 | User decision, 31 October 2026 | "Draw F1, F2, F3". D13–D15 |
| Departures D1–D15 | Accepted as recommended, 31 October 2026 | "Accept". Section 4 |
| Q1 Who assigns the project manager | Resolved as recommended | Sales proposes the receiving owner on the handover. That person is project manager by default at Create project. A Projects lead can change it with a reason. Always a named person with current access, never a team |
| Q2 What must be confirmed before a project can start | Resolved as recommended | Handover linked with the site matched; every review item settled or carrying an owned question; questions marked "must be answered" answered; assumptions owned and sent; every first action sent, or Not needed with a reason. Not required: a recorded baseline, or every question closed |
| Q3 Stakeholder updates cadence: automatic or prompt | Resolved as recommended | Prompt. Customer communication needs a person's decision and distribution approval (PRJ-07), so the row stays Not decided until chosen |
| Q4 Does service work need an equivalent initiation | Resolved as recommended | No new page now. Service keeps its existing intake, scope and authorisation under LC-16. Revisit if large service jobs repeatedly need questions and assumptions |
| Q5 Story date | Resolved as recommended | The brief's as-at Tue 13 Oct 09:00 AEST predates CR-03 (won Thu 15 Oct, accepted Tue 20 Oct 09:32, site AEDT). CR-03's values are kept exactly, and the story is drawn on Tue 20 Oct in AEDT |
| Q6 Coordinator or project manager | Resolved as recommended | One word everywhere, Project manager, at each page's next amendment. The native field and accepted pages still say Coordinator until then; the form's help names the coordinator field |
| Q7 Return after acceptance | Resolved as recommended | Allowed, as a request for a successor that keeps r1 and its acceptance. CR-03 draws Return only before acceptance, so this needs a contract change |
| Q8 Entry points | Resolved as recommended | Projects side entry and New project on the register, plus My Work. No new rail item until use shows the need |
| Q9 Electrical difference between CR-03 and ES-07 | Recorded, as recommended | Quotation r2 line 3 "Electrical connection and controls integration" $8,400.00 against r1's exclusion "electrical work". No accepted or other page was changed. Sales resolves it at the next CR-03 or ES-07 amendment. Section 5 |
| Q10 Synthetic filler | No action, as recommended | New worklist rows and the projects in Link an existing project are synthetic. Project numbers were checked only against Projects `209:46` |
| Q11 Project class | Resolved as recommended | PRJ-01 requires a proportionate project class and the app holds none. Dean names three classes. The class only suggests which first actions are expected; the project manager decides each one. "Equipment upgrade" is a synthetic example, and the three names are still to be given |
| Q12 Waiting limit | Resolved as recommended | One company-wide limit set by a Projects lead, in calendar days, starting at 5, with per-class limits only if needed. The frames draw 4 days as a synthetic example, so that one row is flagged; at 5 that row would not be flagged |
| Q13 Does an open source difference stop Started | Resolved as recommended | Yes. It must be looked at, as a question or as no conflict with a reason. It need not be resolved |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | Awaited | Dean saves "Project initiation — accepted", or tells Claude to. Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Project initiation · PJ-01" `2883:6244`, under "— Projects —", after Projects `209:46` and before Project record page `345:2`. The page header holds the conformance declaration; the notes card `2899:14515` is in Flows and notes. File index row `2929:16290` in the Projects table, after Projects · PJ-02 |
| Desktop 1440 | Worklist `2887:137`; receiving review, full length `2890:547`; raising a question `2890:1061`; create project `2894:10413`; link decision with a site check `2894:10795`; start checklist `2894:11213`; capture an assumption `2896:13673`; return to Sales `2896:14159`; successor, history kept `2896:14640`; Project record header amendment `2896:14964`; Questions tab `2907:6005`; link an existing project `2907:6477`; prepared request `2907:6961`; Set Started `2907:7439`; source difference `2916:9645`; Over limit view `2916:22419` |
| Tablet 1024 | Receiving review `2897:13831` |
| Phone 390 | Review summary `2897:14251`; raise a question `2897:14392`; answer a question `2897:14451` |
| Phone 320 | The same three: `2897:14499`, `2897:14637`, `2897:14696` |
| States | Loading `2899:14302`; nothing waiting `2899:14354`; could not load `2899:14372`; read-only `2899:14387`; site mismatch `2899:14410`; handover changed `2899:14443`; created but link pending `2899:14469`; outcome unknown `2899:14495`; filtered empty `2911:5585`; validation error `2911:5597`; saving `2911:5626`; denied `2911:5647`; unknown Sales site `2911:5659`; review status menu `2911:5704`; waiting limit `2916:23217`; runway cannot work back `2916:23270`; source not compared `2916:23278` |
| Amendment frames | Project record header `2896:14964` and My Work row `2916:23070`. Pages `345:2` and `404:2` are not edited |
| New part | Initiation / Review status `2887:136`, moved at lock-in to Components · Service, Supply chain and Shared records parts. [Binding](../design/development/component-bindings/2026-10-31-pj01-project-initiation.json) |
| Prototype | Flows "PJ-01 — desktop" (from `2887:137`) and "PJ-01 — phone" (from `2897:14251`), none off the page. The tablet frame is a layout reference outside the flows |
| Retained captures | [Project initiation design r01](../reference/ui/projects/project-initiation-design-r01/README.md): 41 icon-free PNGs with hashes, from copies `2929:16299`–`2929:18953` on Captures at y = 1,300,000 onwards |

## 3. Story and conformance

Synthetic, Tue 20 Oct 2026 in AEDT, continuing Won-deal receiving CR-03. These are CR-03's values, kept exactly: SYN-PPO-OPP-000326 Potting machine and take-off, SYN Woodhaven Nursery, Potting Shed 2, $81,200.00, quotation SYN-PPO-QUO-000188 r02 Option A, purchase order WN-PO-55821, r1 accepted 09:32 by Morgan Lee, fingerprint 4b19…e07c, project SYN-PPO-PRJ-000041 created 09:58, comparison fixed 10:02.

- **Review:** Morgan Lee confirms 9 items, raises one question on the shutdown window to Sasha Clarke, due Thu 22 Oct, and marks Sales' own next action Not applicable. That makes 11 items in all.
- **Assumption:** "Grower provides crane access", owned by Morgan Lee, confirm with Jamie Ellis, review by Fri 6 Nov.
- **Start checklist as at 14:20:** 3 of 6 done. Design basis sent to Alex Morgan 11:10; material demand sent to Robin Hale 11:25 (SYN-DEM-000101 and 000102, from ES-07); assumption entry saved 11:40.
- **Set Started:** Fri 23 Oct 16:05, after the answer on Wed 21 Oct.
- **Source check:** 5 match and 1 differs. The difference stays open in this story, so the counts stay 9, 1 and 1.

New synthetic facts: the review, question and assumption times; link saved 10:04; SYN-OPP-000330 and 000331; SYN-PRJ-000044 to 000048 and SYN-PRJ-000039; the shutdown answer; the successor story on SYN-OPP-000330; fingerprints 91c2…77ad, 27de…40b1 and 8a30…c1d2. Existing references are not rewritten. None of this is a Woodhaven, Powerplants or operating rule, and the dates worked out by the runway are example arithmetic.

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PJ-01`, `/projects/new`; worklist `/projects/initiation` proposed. Parent IDs above, unchanged |
| Page type (r20) | Register / worklist for the queue. Review / comparison for the receiving review. Form / guided workflow for create, link, return and start. Record layout as Project record |
| Reused components | Shell / Top bar `35:138`, Rail · Projects `209:516`, v2 Menu item and heading, Grid cells, Grid / Group band and Grid / List row (R6), Tag, Button, Toolbar search, Record / Header, Field, Section heading, View tab, Check item and Banner, Quotation detail / Lifecycle step and Linked chain row, Controls / Form field and Choice option (R6), Shell / Phone header · compact `1530:110`. New: Initiation / Review status |
| Incoming handovers | Won-deal receiving CR-03: the exact accepted Won event, read only. Quotation conversion ES-07: forecast demand already raised, read only. Exact quotation revision for the source check, read only. Customer and site from Organisations and Sites |
| Outgoing handovers | Prepared requests, each sent by a person, never created automatically: Design basis EN-02, Baseline PJ-03, Material demand SC-01, Subcontractor packages PJ-06, Stakeholder updates PJ-08 (prompt), Risks & issues PJ-04 (assumptions as Assumption entries). Back to Sales or Estimating: owned questions and Return with reasons; the successor returns here. PJ-07 and PJ-09 stay independent |
| Source authority | The sources listed above |
| Proposed departures | D1–D15 in section 4, accepted |
| Status | Owner-accepted design, 31 October 2026 |
| Decision record | This file |
| Named version | "Project initiation — accepted", awaited |

## 4. What the design shows

| ID | Departure, accepted | Basis, or what exists today |
|---|---|---|
| D1 | One record with six tabs: Receiving review, Questions, Assumptions, Project & link, Start checklist, History | Project record and CR-03 record layout. Built: the `/projects/new` form and a Sales handovers dialog |
| D2 | Worklist inside Projects with its own side menu and grouped bands, on shared Grid parts. No rail change | Pipedrive-style register rule; R6 Group band |
| D3 | The review table sets the frozen r1 text beside the project context, row by row. r1 is never editable here | LC-16; frozen revision and fingerprint |
| D4 | Create and link are separate steps with separate buttons, receipts and recovery. The form is the built form, prepared from r1 and saved by the person | [Won delivery decision](won-delivery-continuity.md) |
| D5 | The link decision is the same record as CR-03's Delivery tab, reached from Projects, with visible Company, Customer and Site checks | CR-03 D7, no copied lifecycle; LC-16 site rule |
| D6 | Questions go to a named owner in Sales or Estimating with a date. An answer sits beside r1; a changed commitment means successor r2 | LC-16; CR-03 Q2. No question record exists |
| D7 | Assumptions are owned items here and reach Risks & issues as Assumption entries only when sent | [RAID backend](project-raid-backend.md) kinds and owner rules |
| D8 | Return after acceptance asks Sales for a successor and keeps r1, its acceptance and any project | LC-16 successor rule; Q7 |
| D9 | Start checklist rows are prepared requests. Material demand refers to the forecast already raised by ES-07 rather than raising more | ES-07; [specialist handover](project-specialist-handover.md) authority split |
| D10 | Started is the project manager's own fact, in words, separate from project status, baseline, scope or authorisation. One line on the Project record shows it | PRJ-01; accepted, linked and completed are separate facts in LC-16 |
| D11 | Phone keeps the review summary, raising and answering. Compact header rules, 48 px actions, 16 px inputs | Phone header amendment |
| D12 | One new part, Initiation / Review status; everything else reuses existing parts | Components read me |
| D13 | Date runway on the review: works back from dates and lead times written in r1, labelled arithmetic. It creates no task or date, and says so | F1 |
| D14 | Source check on the review: a rule-based comparison of r1 with the exact quotation. A person looks at each difference, as a question or as no conflict with a reason. An unread quotation says Not compared, never a pass | F2; LC-14, restricted reads are not absent facts |
| D15 | Handover ageing: an icon, band wording, an Over limit view and a My Work row for the named project manager. A reminder only; nothing is sent or moved | F3; My Work Reviews & handovers on `404:2`, not edited |

## 5. What this does not decide or build

- **Building the page.** Each of these needs its own contract and go-ahead: review items, questions, assumptions as owned items before RAID, the checklist and prepared requests, Started, project class, the source check rules, the runway, the waiting limit, the worklist read model and its permissions.
- **Return after acceptance (Q7)** needs a change to the LC-16 contract.
- **The three project class names (Q11)** are still Dean's to give.
- **Q9, for those pages' next change:** the electrical difference between CR-03 and ES-07. CR-03 and ES-07 are unaccepted proposals and were not edited.
- **Q6, for each page's next amendment:** Coordinator to Project manager.
- **Not drawn:** Assumptions tab at rest; tablet other than the review; phone create and link; tablet and phone start checklist. Feature options F4 Suggested questions, F5 Question threads, F6 Kick-off brief and F7 Return reasons report are listed in the notes card and not adopted.

## 6. Verification

Audits of 31 October 2026, by script and screenshots: all checked fills bound to variables; the only text under 4.5:1 contrast is the shared breadcrumb slash, which is decorative; no overlap and nothing outside a section; phone choice targets at least 44 px; no list row truncating on the phones; story values checked against CR-03. The audit also corrected tab counts and history so they follow the clock.

**The flows were not played in Present mode.** Links were set by script and each returned success. Keyboard order, screen reader and 200% zoom cannot be tested in Figma and were not.

The 41 captures are copies on the "Captures (icon-free)" page `115:2`. A scan after the swap found no Font Awesome instance and no visible vector outside a placeholder, the logo or a control. Four nested prototype links in the copies could not be cleared; they do not affect the images. Dimensions and hashes are in the [capture README](../reference/ui/projects/project-initiation-design-r01/README.md).

Design acceptance is not functional, business or deployment acceptance. No device, accessibility or operational review is recorded. The register's visual status stays "Needs review", and no review fingerprint was copied.

## 7. Named version

Awaited. The version "Project initiation — accepted" has not been saved at the time of this record. It is recorded here only once it is seen in the file's version history.
