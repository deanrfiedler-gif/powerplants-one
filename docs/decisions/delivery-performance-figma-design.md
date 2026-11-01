---
document_id: PPO-RP03-DELIVERY-PERFORMANCE-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; native implementation, measure definitions and UI baseline acceptance separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Engineering and project delivery performance RP-03 design — owner decision

On 24 October 2026 Dean asked for the design of the Engineering and Projects report: "Your task is to design and build the "Engineering and project delivery performance (RP-03)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma and presented it with ten decisions and seven questions. It covers:
- the report at `/reports/delivery`, one page with a section for each of REP-06, REP-07, REP-08, KPI-09 and KPI-11;
- the report header, a chart and a table in each section, and a drill to source records;
- "Definition pending" and export;
- desktop 1440, tablet 1024, phone 390 and 320, and seven states.

Claude drew the page from these sources:
- [BP-01](../blueprints/BP-01-master-blueprint.md) §22.1 (KPI-09, KPI-11) and §22.3 (REP-06 to REP-08);
- the [engineering workload](engineering-workload-design.md), [baseline and forecast](baseline-forecast-figma-design.md), [project commercial](project-commercial-figma-design.md) and [commissioning and as-built](engineering-commissioning-as-built-design.md) design records, and the [conformance standard](../standards/html-module-conformance.md);
- the drawn pages Reports overview RP-01, Sales performance RP-02, Measure definitions FN-06, Cash outlook FN-05, Engineering workload, Technical queries, Technical reviews, Change review, Commissioning & as-built, Baseline PJ-03, Contract obligations PJ-05 and Acceptance & closeout PJ-09.

On 1 November 2026 Dean answered "Do you accept the RP-03 design?": "Accept". The button he chose was offered as accepting the page as drawn with the recommended answers to Q1–Q7, so this record reads his answer as adopting D1–D10 and those answers.

Scope:
- `scope:RP-03` "Engineering and project delivery performance", at `/reports/delivery`. No new scope is added.
- No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, export or deployment. It publishes no measure definition. Every record, figure and date shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page RP-03 | User decision, 24 October 2026 | Dean's request quoted above |
| Decisions D1–D10 | Accepted as drawn, 1 November 2026 | Dean's answer, quoted above. Section 4 |
| Q1 EN-08 dates the CP-4 results after this report's as-at | Resolved as recommended; source page not changed | Redate the CP-4 results on Commissioning & as-built to before Tue 13 Oct and keep this as-at. The page is drawn without CP-4 test dates. The change to EN-08 is still to do (section 6) |
| Q2 Who owns RP-03 | Resolved as recommended | The Projects lead owns the report, and each section keeps its BP-01 owner: Engineering for REP-06 and KPI-11, project manager for REP-07, project manager and Commercial for REP-08 and KPI-09. Morgan Lee, Alex Morgan and Jamie Rossi are synthetic-story roles until real people are assigned |
| Q3 Test classes | Resolved as recommended | Group first pass by test method in the EN-08 basis: electrical safety, motor and drive current, travel and limits, safety functions. Never compare across classes |
| Q4 Working or calendar days | Resolved as recommended | Working days on the project calendar as the headline, calendar days beside them, as Baseline PJ-03 does |
| Q5 Default period | Resolved as recommended | Quarterly (Q3 against Q2), as RP-02. Open-item sections ignore the period. A monthly option follows when a class has enough completed tests to compare |
| Q6 REP-07 is pending on RP-01 but published here | Resolved as recommended; nothing published | Publish REP-07 v1 (baseline, date authority, attribution, second approver) before building RP-03. Until then the Definition pending frame is what ships |
| Q7 Capability names | Resolved as recommended; still proposed | `engineering.workload.read`, `engineering.review.read`, `project.read`, `project.commercial.read` and `engineering.commissioning.read` are proposed. Confirm them with Users and access (AD-01) before any build |
| Accept the design | User decision, 1 November 2026 | Quoted above |
| Named Figma version | Saved by Dean | "Delivery performance · RP-03 — accepted": "I have saved the named version as Delivery performance · RP-03 — accepted". Section 8 |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Delivery performance · RP-03" `2413:127`, under "— Reporting —". The page header `2413:128` holds the conformance declaration; the notes card `2489:4096` holds D1–D10, Q1–Q7, the flows, the story and the checks. File index: the row "Row / Delivery performance · RP-03" `3096:131` in the Reporting group |
| Desktop 1440 | Full report `2413:889344`, with sections REP-06 `2416:442`, REP-07 `2439:713`, REP-08 `2442:893376`, KPI-09 `2449:1097` and KPI-11 `2449:1392`; REP-07 drill to Block C's milestones `2456:1239`; KPI-11 by test class, Motor and drive current `2456:3336`; REP-07 Definition pending with About this measure open `2457:1540`; export side form `2457:3677` |
| Tablet 1024 | Full report, rail and side menu collapsed `2465:1943` |
| Phone 390 and 320 | Section summaries and one drill list `2466:2876` and `2466:3109` |
| States | S1 loading `2477:7411`; S2 no data, filters match nothing `2477:9514`; S3 could not load `2477:11587`; S4 partial completeness `2477:13625`; S5 phone Definition pending `2477:19699`; S6 sections withheld by permission `2477:15651`; S7 source out of date `2477:17678` |
| Components | No new components. Renamed at acceptance under D10, keeping their node IDs and instances: Report / Tile `2405:876834`, Cell `2405:876838`, Header cell `2405:876841`, Section header `2405:876843`, Legend item `2405:876862`. They were "Sales report / …" when RP-02 was accepted, and that record cites them by the old names with these IDs |
| Prototype | Flows "RP-03 — desktop" and "RP-03 — phone" |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, Q3 2026 beside Q2, signed in as Dean Fiedler. Existing references are unchanged |
| Retained captures | [Delivery performance design r01](../reference/ui/reporting/delivery-performance-design-r01/README.md): nineteen icon-free PNGs of fifteen frames, with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:RP-03` Engineering and project delivery performance, `/reports/delivery`. BP-01 §22.3 REP-06 to REP-08 and §22.1 KPI-09, KPI-11; AT-09, AT-32. Parent IDs unchanged. Capabilities proposed (Q7) |
| Page type (r20) | Overview / dashboard (department report page), as RP-01's report detail and RP-02. Supporting: Register (result tables) and right-side panels for source records, About this measure and Export |
| Reused components | The RP-01 and RP-02 report shell: Rail · Reports, the top bar with the Conversations action (badge 3), v2 / Menu item and heading, toolbar and report header facts, Record / Banner, Button and Tag. The RP-02 report parts and side panels. FN-05 Outlook / Basis swatch for patterns. The compact phone header |
| Incoming handovers | Reports overview RP-01 (rail item, tiles and catalogue rows). Read-only reads of Engineering workload, Technical queries, Technical reviews, Change review, Commissioning & as-built, Programme and Baseline PJ-03, Contract obligations PJ-05 and Acceptance & closeout PJ-09 |
| Outgoing handovers | Each section header and row opens its source page, and About this measure opens Measure definitions FN-06. Export produces a file with a manifest and an audit event (AD-07). The page never edits, reschedules, approves or raises a variation |
| Source authority | The records listed above. Section 6 records what is still a proposal |
| Proposed departures | Accepted: section 4 |
| Status | Owner-accepted design, 1 November 2026 |
| Decision record | This file |
| Named version | "Delivery performance · RP-03 — accepted", saved by Dean |

## 4. What the design shows

- **One page, five sections (D1):** the Reports rail item Engineering & delivery opens one page. Each section has a header (question, definition version, grain, source as at, completeness), four tiles, a chart with printed values, a table and a drill to source records.
- **Open items are as-at (D2):** REP-06, REP-07, REP-08 and KPI-09 read open items as at Tue 13 Oct 09:00 and say "not a period measure". The period selector governs KPI-11. A period not recorded says Not recorded, never zero.
- **No targets, thresholds or good/bad colour (D3):** status is words in a Tag, charts add pattern to colour (solid, hatched, dashed), and percent complete is never shown as release. REP-06 shows the released revision.
- **Slippage (D4):** movement in working days on each project's calendar, calendar days beside it. A changed baseline is kept: Glasshouse 4 is on r2 and shown against r1. Each movement names a dependency or readiness cause, or says none is recorded. No date moves from here.
- **Partial acceptance and disputed value (D5):** both stay outside the counts in their own cards. A source not read says Not read, never zero.
- **Variation exposure (D6):** values by status with no sum; approved value (definition PJ05-FD08 v1) sits apart on the same axis; unpriced is a dashed outline; alternatives are never summed as revenue.
- **First pass (D7):** accepted without a corrective retest ÷ eligible completed tests, by class. A failed result counts against first pass even when its retest passes (T06 SM-3). Q4 to date is counts beside Q3, not a complete period.
- **Definition pending (D8):** the value is withheld and the missing definition named, with a link to Measure definitions FN-06. Drawn for REP-07, as RP-01 draws it; the report frame shows REP-07 as it reads once published.
- **States (D9):** restricted sections are counted, never described; partial completeness shows Not known; a stale source marks only its own section and nothing is recalculated.
- **Reuse (D10):** no new parts. The report parts lose "Sales" from their names. Export carries a manifest and an audit event; an export that leaves Powerplants needs a second person (proposed, as RP-02).

### Departures, accepted

| ID | Departure | Pattern it changes |
|---|---|---|
| D2, D7 | Q4 to date appears beside Q3 and Q2 in KPI-11 | The brief asked for Q3 against Q2. The story's failed test is an October test, so it could not fall in Q3 |
| D8 | The main frames show REP-07 and the other definitions as published v1, and none exists yet | RP-01 draws REP-07 as pending |
| D10 | Export is RP-01's side form | The brief's "Export" frame was unspecified; RP-02 did the same |

## 5. Earlier records this amends

None. The rename of the five report parts changes their Figma names only; their IDs still resolve from the RP-02 record.

## 6. Not decided and not drawn

- **Building the page.** No route exists. The build order is not decided.
- **Publishing definitions.** This acceptance publishes nothing. Until REP-06, REP-07, REP-08, KPI-09 and KPI-11 definitions are published with a second person's approval, the page must show Definition pending, as D8 requires.
- **EN-08 dates (Q1).** Commissioning & as-built still draws the CP-4 results on Thu 15 Oct, as at Fri 16 Oct. That page was not changed, because the brief kept other pages untouched. The redating is to do when EN-08 next changes or is accepted.
- **Other proposals.** RP-01, FN-06 and several source pages were still proposals when this was accepted. If one changes the shared report shell or a source fact, this design follows it through a recorded amendment.
- **A difference from RP-06.** The Report definitions story places a saved view "Glasshouse projects" on RP-03; this page shows "Q3 by project". Neither is a rule. Align them when either page next changes.
- **Prerequisites for a build:**
  - the `/reports/delivery` route in the Reports workspace;
  - definitions in the Measure definitions model;
  - read models across engineering, programme, change, commercial, acceptance and commissioning records;
  - test classes on the commissioning test basis, and retained test results for first pass;
  - export with a manifest and audit event, and personal saved views;
  - any new capability, with the access-review chain.
- **Not drawn:** the filters popover (as RP-02); a Glasshouse 4 milestone drill; the tablet drill; the Save view dialog; month and custom periods; states at 320; keyboard order, 200% zoom and dark mode.
- **Data in the frames:** synthetic, and it sets no operating rule. Invented for this page:
  - SYN-DEL-0227, 0229, 0236 and 0287, the counts of deliverables by engineer, and the REP-06 review ages;
  - Glasshouse 4 stage 2's r1 date, its stated cause and the working-day counts for Boiler room and Propagation house, which are derived from Programme's calendar-day movements;
  - the split of the eight stage 1 tests into classes, and those tests passing first time (Acceptance & closeout records only that they were accepted);
  - the packages named in S4 and the 30 s timeout in S3.

## 7. Audit and polish

- **Before presenting:** Claude checked the page by script for overlaps, frames outside their sections and leftover RP-02 wording, and screenshotted the page header, one Definition pending frame, one phone card, and the charts. Corrected then: KPI-09 tick labels and heading spacing, a missing KPI-11 block, the rail selection and breadcrumb, and the tablet top bar.
- **Not checked when presented:** the state frames, the 320 phone and several tables. Claude told Dean so when it asked for acceptance.
- **Corrected at lock-in, on 1 November 2026, after Dean accepted.** Reviewing the exports found defects in what had been accepted. Each fix was made on the source frame and its capture copy, and none changes a decision or a number:
  - phone section buttons had collapsed well below 48 px, and a stray 100 px gap sat under the drill-list heading;
  - three side-menu labels hid their IDs, now Closeout · REP-08, First pass · KPI-11 and Workload · EN-01;
  - the selected rail glyph was pale on its white pill;
  - S2's REP-07 line counted deliverables, and S3's facts claimed sources had been read and Q3 was complete;
  - S4's tiles had muddled values, and its section line still said Complete;
  - S6's header, facts and footnote named the withheld sections and the missing permissions, against "counted, never revealed";
  - S7's section line said the stale source was read at 09:00;
  - clipped or broken cells: "Answered · awaiting disposal" (now Answered), "Needed, not raised" (now Needed), "Not measurable" (now — in the two day columns; the cause column keeps the words) and "+$10,850.00" (now $10,850.00 in the table).
- **Correction to Claude's report.** When asking for acceptance, Claude said the phone header still read "REP-09 report". It read "RP-03 report"; the edit had landed.

## 8. Verification

- The fifteen captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 1,452,000 (`3096:20492` to `3096:72560`). Prototype reactions were removed and each Font Awesome icon instance was swapped for `Icon/placeholder`: 631 swaps. A scan of all twenty-one capture frames then found no Font Awesome instance and no prototype link. Unlike RP-02, stored text colours were not compared with their bound variables.
- The captures were exported at scale 1 with the Figma connector and reviewed as images. The export is capped at 4,096 px, so the two full-length reports (desktop 9,281 px, tablet 9,297 px) were each split into three clipped frames at section boundaries, `3096:61397` to `3096:63271` and `3096:70686` to `3096:72560`. The hashes are in the [captures README](../reference/ui/reporting/delivery-performance-design-r01/README.md). In the tablet, only the top of the report (06a) was viewed at this stage; 06b and 06c were exported but not looked at individually.
- The flows have 22 links. Claude did not play them in Present mode.
- **The named version.** Dean saved "Delivery performance · RP-03 — accepted" and told Claude so; Claude did not check the version history. It is a version of the whole file, so it also holds whatever other sessions had drawn by then. The page header and the File index row were updated afterwards to record it, so those two text changes post-date the named version.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
