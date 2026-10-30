---
document_id: PPO-RP02-SALES-PERFORMANCE-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; native implementation, measure definitions and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Sales and quotation performance RP-02 design — owner decision

On 24 October 2026 Dean asked for the design of the Sales and Estimating report: "Your task is to design and build the "Sales and quotation performance (RP-02)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma, audited it and presented it with fifteen decisions and seven questions. It covers:
- the report at `/reports/sales`, one page with a section for each of REP-01 to REP-05;
- the report header, a chart and a table in each section, and a drill-down to source records;
- "Definition pending", filters and export;
- desktop 1440, tablet 1024, phone 390 and 320, and seven states.

Claude drew the page from these sources:
- [BP-01](../blueprints/BP-01-master-blueprint.md) §22.1, §22.3 (REP-01 to REP-05, KPI-08) and the CRE-09 row (block, approval and advisory outcomes);
- the [pipeline stage model](crm-pipeline-stage-model.md), the [quotations design](quotations-design.md), [quotation view tracking](quote-view-tracking.md) and [estimate review and pricing exceptions](estimate-review-pricing-exceptions-design.md);
- [Service and Finance download access](report-finance-download-access.md) and the [conformance standard](../standards/html-module-conformance.md);
- the drawn proposals Reports overview RP-01 and Pipeline insights CR-04, and the Deals, Leads, Quotations, Quotation detail, Account development, Product pricing and Reviews & approvals pages.

On 30 October 2026 Dean answered "Do you accept the RP-02 design?": "Accept and lock in". The button he chose was offered as accepting the design with its recommendations, so this record reads his answer as adopting D1–D15 and the recommended answers to Q1–Q7. The named Figma version is section 8.

Scope:
- `scope:RP-02` "Sales and quotation performance", at `/reports/sales`. No new scope is added.
- No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, export or deployment. It publishes no measure definition and adopts no pricing policy or threshold. Every record, figure and date shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page RP-02 | User decision, 24 October 2026 | Dean's request quoted above |
| Decisions D1–D15 | Accepted as drawn, 30 October 2026 | Dean's answer, quoted above. Section 4 |
| Q1 Conversion definition | Resolved as recommended; design direction only | Count of records, three transitions: lead to deal (leads created in the window), a stage cohort (deals entering Quoting: moved on, or moved back or lost) and deal to won (deals closed in the window). Each is the numerator divided by decided records; still-open records are listed and never count as losses; one pursuit counts once. A by-value win rate may follow as its own measure once deal values are complete. The definition still has to be published in Measure definitions (section 6) |
| Q2 Customer views in management reports | Resolved as recommended; amends quote-view-tracking Q6 | The state word only (Viewed, Viewed · may be automatic, Not viewed yet, Not tracked) on the open-quotations list. Never counts, times, sections or names, never exported in detail, never a sales rule. Section 5 |
| Q3 Who owns RP-02 | Resolved as recommended | Jamie Park (Sales) owns the page and REP-01 to REP-03; Alex Lee owns REP-04; Morgan Patel owns REP-05. Dean approves definitions until department approvers are named. These are synthetic-story roles until real people are assigned |
| Q4 Default period | Resolved as recommended | The last complete quarter, with Month and Custom as choices. As-at sections are not affected |
| Q5 REP-03 eligibility | Resolved as recommended | Every account in Account development (CS-07 All accounts), so an account with no plan still counts. Meaningful activity is as CS-07 Q3 proposes |
| Q6 REP-05 before a pricing policy exists | Resolved as recommended | REP-05 groups by policy version and kind, and shows "No pricing policy published" until D-010 publishes one. The synthetic test policy SYN-PPOL-000001 v1 is for the demonstration only. No threshold appears anywhere |
| Q7 Story checks | Resolved as recommended; source pages not changed | Count SYN-PPO-QUO-000188 in REP-04 and update the RP-01 tile when that page next changes. Correct the SYN-QUO-0079 organisation on Deals when that page next changes. Section 7 |
| Accept the design | User decision, 30 October 2026 | Quoted above |
| Named Figma version | Waiting for Dean | Section 8 |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Sales performance · RP-02" `2404:876863`, under "— Reporting —", after Reports overview · RP-01. The page header `2404:876864` holds the conformance declaration; the notes card `2412:887468` holds D1–D15, Q1–Q7, the flows, story sources, gaps and the audit. File index: the row "Row / Sales performance · RP-02" `2781:344447` in the Reporting group |
| Desktop 1440 | Full report `2405:876871`, with sections REP-01 `2406:878646`, REP-02 `2406:878948`, REP-03 `2407:878617`, REP-04 `2407:878922` and REP-05 `2407:879234`; drill-down from REP-04 to its quotations `2408:909`; REP-02 Definition pending with About this measure open `2408:2786`; filters open `2408:885070`; export side form `2408:886869` |
| Tablet 1024 | Full report, rail and side menu collapsed `2408:890748` |
| Phone 390 and 320 | Section summaries `2410:884218` and `2410:884579`; drill-down list `2410:884997` and `2410:885283` |
| States | S1 loading `2410:889883`; S2 no records match, a true zero `2410:891657`; S3 could not load `2410:893400`; S4 partial completeness `2410:896770`; S5 phone Definition pending sheet `2410:901996`; S6 permission limits some sections `2410:900250`; S7 source out of date `2410:898510` |
| Components | Moved at acceptance to the Components page, section "Components · Reporting parts" `2781:344446`, keeping their node IDs and instances: Sales report / Tile `2405:876834`, Cell `2405:876838`, Header cell `2405:876841`, Section header `2405:876843`, Legend item `2405:876862` |
| Prototype | Flows "RP-02 — desktop" and "RP-02 — phone" |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, Q3 2026 beside Q2, signed in as Dean Fiedler. S6 is signed in as Kate Morgan. Existing references are unchanged. New in this story: SYN-APR-000001 and SYN-PPOL-000001 |
| Retained captures | [Sales performance design r01](../reference/ui/reporting/sales-performance-design-r01/README.md): twenty-one icon-free PNGs of seventeen frames, with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:RP-02` Sales and quotation performance, `/reports/sales`. BP-01 §22.3 REP-01 to REP-05, relating to KPI-08. Parent IDs unchanged. Reads `crm.opportunity.read`, `estimating.quote.read` and `estimating.read`; `reporting.overview.read` and `reporting.export` stay proposed, as on RP-01 |
| Page type (r20) | Overview / dashboard (department report page). Supporting: Review / comparison (period beside period), Register (result tables), and a right-side inspection panel for the drill-down |
| Reused components | The RP-01 report shell: Rail · Reports (proposal), the top bar with the Conversations action, v2 / Menu item and Menu heading, toolbar and report header facts, Record / Banner, Button and Tag. FN-05 Outlook / Basis swatch for patterns. RP-01's Export, About and Source-record side panels. The compact phone header and action bar. New: the five parts in section 2 |
| Incoming handovers | Reports overview RP-01 (rail item, tiles and catalogue rows); Pipeline insights CR-04 (About these numbers). Read-only reads of Deals, Leads, Quotations, Account development, Reviews & approvals and Measure definitions |
| Outgoing handovers | Every figure drills to its records: Pipeline insights and Deal record (REP-01, REP-02), Account development (REP-03), Quotations and Quotation detail (REP-04), Reviews & approvals and Estimate review (REP-05), and Measure definitions (About this measure). Export produces a file with a manifest and an audit event. The page changes no record, sends no message and approves nothing |
| Source authority | The records listed above. RP-01 and CR-04 are still proposals; section 6 records that dependency |
| Proposed departures | Accepted: section 4 |
| Status | Owner-accepted design, 30 October 2026 |
| Decision record | This file |
| Named version | Waiting for Dean: section 8 |

## 4. What the design shows

Pipeline insights CR-04 stays the sales team's working view; RP-02 is the management report and links to it rather than repeating it.

### The page (D1–D5)

- **Place (D1):** the Reports rail item Sales & quotations opens one page with five sections. The side menu jumps to each section and links the working views and saved views.
- **Report header (D2):** owner, definitions, grain, timeframe and time zone, filters, sources as at, completeness and permission. Each section repeats its own version, grain, completeness and source time.
- **Same shape for every section (D3):** a header with About this measure and the working-view link, four tiles, one chart with printed values and pattern as well as colour, one table, and a footnote stating the rule.
- **Period and comparison (D4):** REP-02, REP-04 and exceptions raised use the chosen quarter. REP-01, REP-03 and the approval queue use the as-at time and say so. Q2 sits beside Q3, never as better or worse. History that was not recorded says Not recorded, never 0.
- **No targets, thresholds or good/bad colour (D5):** values are ink, and tags name data states in words. No probability, weight or rotting, and no deal or account is flagged.

### The sections (D6–D10)

- **REP-01 ageing (D6):** median and range per stage with printed ends. The re-entered deal is listed and left out of medians. No-next-action and overdue activities are counted separately. The eight longest deals are listed with their close-date moves.
- **REP-02 conversion (D7):** the Q1 cohorts with numerator, denominator and window stated. By-value stays withheld as Definition pending.
- **REP-03 account activity (D8):** eligible accounts, owned next actions, site visits with an outcome, and days since meaningful activity. Email counts are never shown, and Not known is never 0.
- **REP-04 quotations (D9):** current or accepted revision only, with revisions counted apart. Cycle time (KPI-08) and issue to response appear as median and range. An open-now list covers any issue date.
- **REP-05 exceptions (D10):** approval queue age, then exceptions by policy version and kind: hard block (below cost), approval requirement (below minimum sell) and advisory (below target margin).

### Definitions, drill-down, export and phone (D11–D15)

- **Definitions (D11):** About this measure opens Measure definitions. An unpublished definition shows Definition pending and withholds every value.
- **Drill-down (D12):** a tile, bar, block or count opens the source-records panel, and each record opens its own page.
- **Export (D13):** permitted rows only, a CSV per section with one PDF manifest, a required purpose, an audit event, and a second person for anything leaving Powerplants.
- **Phone (D14):** section summaries stacked for a sales manager, with a 16 px select, 44 px information targets and 48 px buttons, and one drill list. Charts, the source panel and Export stay on desktop.
- **Story state (D15):** the full report is drawn with REP-02, REP-03 and REP-05 v1 published so the build is visible. The REP-02 pending frame and S5 show the state that applies until a definition is published.

### Departures, accepted

| ID | Departure | Pattern it changes |
|---|---|---|
| D13 | Export is RP-01's side form, not a centred dialog | The brief's "Export dialog" |
| D15 | The main frames show definitions and a test pricing policy that do not exist yet | RP-01's catalogue lists REP-02 as Draft and REP-03 and REP-05 as Not built |
| Q2 | Report readers see the customer-view state word | Quote-view-tracking Q6: the sender, quotation owner and deal owner see views; other deal readers see the delivery state |
| Icon | The selected rail item keeps the Light chart-line, because no solid version exists on the Components page | Selected rail items use a solid glyph |

## 5. Earlier records this amends

| Record | What changes |
|---|---|
| [Quotation view tracking](quote-view-tracking.md) Q6 | Amended by Q2: a reader of RP-02 sees the state word on the open-quotations list, and nothing more. Everything else in Q6 and §4.4 stands. A dated pointer is appended to that record |

## 6. Not decided and not drawn

- **Building the page.** No route exists. The build order is not decided.
- **Publishing definitions.** This acceptance publishes nothing. Until REP-02, REP-03 and REP-05 definitions are published with a second person's approval, the page must show Definition pending or Not built for them, as D11 requires.
- **Pricing policy.** D-010 stays open. REP-05 shows "No pricing policy published" until a real policy version exists.
- **RP-01 and CR-04.** Both were still proposals when this was accepted. If either changes the shared report shell or the REP-01 rules, this design follows it through a recorded amendment.
- **Prerequisites for a build:**
  - the `/reports/sales` route in the Reports workspace;
  - definitions in the Measure definitions model;
  - stage history and cohort queries, with the re-entry rule;
  - scope-ready, issue and response times for KPI-08;
  - the approval queue and pricing policy versions;
  - a customer-view state read for reports;
  - export with a manifest and audit event;
  - personal saved views;
  - any new capability, with the access-review chain.
- **Not drawn:** the tablet drill-down and phone filters sheet; the Save view dialog and an opened saved view; month and custom periods; an owner-filtered view; keyboard order, 200% zoom and dark mode.
- **Data in the frames:** synthetic, and it sets no operating rule. Close dates of the closed deals, lead cohorts, cycle and response days, SYN-APR-000001, SYN-PPOL-000001, advisory lines and five of the nine accounts were invented for this page.

## 7. Audit and polish

Before presenting the page Claude screenshotted the frames inside Figma, checked overflow, fonts, overlaps and section bounds by script, and checked the story against the drawn pages.

- **Corrected:**
  - component heights stuck at fixed sizes, which clipped text;
  - table columns 4 px wider than their cards on 21 tables;
  - overlapping REP-04 day labels and REP-05 gridlines over bars;
  - toolbar overflow at 1440, and a squeezed right zone at 1024;
  - export form overflow, and the S6 section that fell below the fold;
  - wording on S1, S2, S3 and S6;
  - toolbar counts that had been written into the rail's hidden badge on six frames.
- **Corrected at lock-in, on 30 October 2026:** the REP-04 table's Revisions column, which broke "Revisions" and "superseded" mid-word. Only the column widths changed, by the same amount on the source frames and the capture copies.
- **Left open for later pages (Q7):**
  - Quotations `123:40` does not list SYN-PPO-QUO-000188, so RP-01's REP-04 tile differs from this page;
  - SYN-QUO-0079's organisation differs between Quotations and Deals.

## 8. Verification

- Claude checked the frames with screenshots taken inside Figma. 15 inherited off-page links were removed, hover states were kept and 19 new links were added. Claude did not play the flows in Present mode.
- The seventeen captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 503,000 (`2771:457776` to `2771:514918`). Prototype reactions were removed and each Font Awesome icon instance was swapped for `Icon/placeholder`: 912 swaps across the copies. A scan then found no Font Awesome instance left, no copy with a prototype link, and none of 3,640 visible texts with a stored colour that differs from its bound variable.
- The captures were exported at scale 1 with the Figma connector. The export is capped at 4,096 px, so the two full-length reports (desktop 7,345 px, tablet 7,471 px) were each split into three clipped frames at section boundaries, `2790:340724` to `2790:342288` and `2790:343268` to `2790:344832`, giving twenty-one images. The hashes are in the [captures README](../reference/ui/reporting/sales-performance-design-r01/README.md).
- **Captures page flow list.** While the copies were being made, the page's list of flow starting points went from about 120 to none, and another session then added one. Claude could not establish whether its own cleanup or that session caused this. The list only names flows on capture copies, whose links are removed; no frame or capture image changed. Earlier records that state a count of those flows describe the page as it was then.
- **The named version.** Waiting for Dean: "Sales performance · RP-02 — accepted". This pull request stays a draft until he confirms it.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
