---
document_id: PPO-CR04-PIPELINE-INSIGHTS-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; changing the built page and UI baseline acceptance separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Pipeline insights and forecast review CR-04 design — owner decision

On 24 October 2026 Dean asked for the design of this page: "Your task is to design and build the "Pipeline insights and forecast review (CR-04)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma covering:
- the insights overview, stage ageing, the no-next-action list, close-date movement and About these numbers;
- the October forecast review, with owner statements kept apart from system data;
- drill-through to the Deals List;
- tablet, phone and states.

On 31 October 2026 Dean asked for an audit, then answered "Draw the five" to the question "Should I draw the five recommended additions before you decide on acceptance?". That added the review snapshot, the review lifecycle, closed deals beside the review, the save and data states, and an Expected close filter.

Claude drew the page from these sources:
- the built read model and panel: `src/crm/insights.ts`, `src/components/crm-insights.tsx`, `src/crm/worklist-presentation.ts` and `src/crm/value-summary.ts`;
- the [CR-04 design reference](../design/development/pages/scope-cr-04.md);
- the [stage model](crm-pipeline-stage-model.md), the [Deals correction](crm-deals-design-correction.md), the [r11 board correction](crm-r11-board-polish.md), the [r38 integration](crm-deals-r38-integration.md) and the accepted [Deals design](deals-figma-design.md);
- BP-01 section 22.3, REP-01 and REP-02.

On 31 October 2026 Claude asked "Do you accept the CR-04 design with the recommended answers?" and Dean answered: "Accept, lock in". That adopts D1–D16 and the recommended answers to Q1–Q9.

Scope:
- `scope:CR-04` "Pipeline insights and forecast review", at `/sales/opportunities`, shared with Deals (Deals decision Q7). No new scope is added.
- No parent requirement ID is added or renamed; all 78 remain. The page elaborates CRM-02, CRM-05 and CRM-08 (PAR-03, PAR-04, PAR-12), with REP-01, REP-02 and AT-25.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed or deployment, and it changes no hosted authority. Every record, person, statement and date shown is synthetic. Accepting the design does not adopt REP-01 or REP-02 definitions: the page labels or withholds what they do not support.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the CR-04 page | User decision, 24 October 2026 | Dean's request quoted above |
| Draw the five additions | User decision, 31 October 2026 | "Draw the five", quoted above |
| Decisions D1–D16 | Accepted as drawn, 31 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Commit categories, or only reviewed close dates | Resolved as recommended | Keep Commit, Best case and Omitted as a review record. Date changes happen on the deal |
| Q2 Which ageing thresholds flag a deal | Resolved as recommended | None until a full quarter of recorded stage durations exists; then per-stage thresholds near the upper quartile of completed durations, shown as "Over threshold" in words. No threshold is adopted by this decision |
| Q3 Insights for every salesperson, own deals only | Resolved as recommended | Insights covers exactly the deals the person can already see in Deals; managers see their team. Statements are editable by the deal owner and the review manager, readable by the team |
| Q4 Monthly or quarterly review | Resolved as recommended | Monthly: the current month plus open deals past their close date, with next month read-only. A quarterly roll-up can follow from the same records |
| Q5 Window for close-date movement | Resolved as recommended | Rolling 90 days by default, with This quarter and Last quarter as choices. Dean's brief said "this quarter"; at 13 October the calendar quarter had 13 days |
| Q6 Story date | Resolved as recommended | Keep Tue 13 Oct 2026, 09:00 AEST as briefed, with Dean Fiedler signed in. The accepted Deals page reads Thu 15 Oct with Sasha Clarke signed in, and "Overdue 2 days" is carried from it |
| Q7 Completing with a deal not stated | Resolved as recommended | Not allowed. Omitted with a reason already covers a deal the owner will not stand behind |
| Q8 Who completes and reopens a review | Resolved as recommended | Only the review manager; reopening always needs a reason. An owner who is also the manager stays recorded under both roles |
| Q9 Expected close in the Deals filters | Resolved as recommended | Yes, as a small amendment to Deals · CR-04, so both views keep the same filters. Open deals with no close date are left out unless chosen. The amendment is not yet drawn on the Deals page (section 6) |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Corrections made before acceptance | Claude's audit and polish, disclosed here | Section 7 |
| Named Figma version | Not saved; waits for Dean | Section 8 |
| Changing the built page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Pipeline insights · CR-04" `2336:155`, under "— Sales —", directly after Deals · CR-04 `549:2`. The page header `2336:224` holds the conformance declaration; the notes card `2348:805962` holds D1–D16, Q1–Q9, the flows, what is not drawn and the checks. File index: the row "Row / Pipeline insights · CR-04" `2875:11582` in the Sales group, after Deals |
| Desktop 1440 | Insights overview `2337:85`; Stage ageing `2340:385`; No-next-action list with the row menu open `2342:800450`; Close-date movement `2343:1053`; Forecast review, October `2345:801457`; Record a statement `2346:803923`; About these numbers `2346:804291`; Drill-through to Deals List `2347:803913`; What changed since statements `2864:13919`; Complete review dialog `2866:4546`; Completed and locked `2866:3724`; Reopen review dialog `2866:5379`; Filters with Expected close `2866:39739` |
| Tablet 1024 | Insights overview with the rail collapsed `2347:805188` |
| Phone 390 | Overview cards `2347:808073`; no-next-action list `2347:808819` |
| Phone 320 | Overview cards `2347:808468`; no-next-action list `2347:808908` |
| States | S1 loading `2348:2960`; S2 no deals in filter `2348:2998`; S3 could not load `2348:3032`; S4 definition unadopted, value withheld `2348:3075`; S5 partial results `2348:3116`; S6 read-only, another owner's forecast `2348:3156`; S7 Omitted with no reason `2866:39466`; S8 saving `2866:39509`; S9 saved `2866:39549`; S10 save failed `2866:39595`; S11 outcome uncertain `2866:39641`; S12 deal changed while the form was open `2866:39687` |
| Components | Insights / KPI tile `2338:797980`, moved at acceptance to Components · Sales parts `1095:257410`, keeping its node ID and instances |
| Prototype | Flows "CR-04 — desktop" (from the overview) and "CR-04 — phone" (from the 390 overview), 102 links. Tabs open each view; Filters opens the Expected close range; Open 2 deals in Deals List opens the drill-through and its Back returns; the review leads to What changed, Record a statement, Complete, Completed and Reopen |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, signed in as Dean Fiedler, review manager. The lifecycle frames run on to Fri 16 Oct. 18 open deals, $1,189,150.50 known, 2 not estimated. 15 of 18 have a planned next activity; 2 have none ($252,500.50); 1 is overdue. LED propagation lighting moved three times (+56 days) and its date has passed. Review SYN-FRV-000001: Commit $110,600.00, Best case $161,900.00, Omitted $127,500.50 (Climate and dosing integration, with a reason), not yet reviewed $95,900.00. Closed in October, from Archive: 2 Won $62,700.00, 1 Lost $17,500.00 |
| Retained captures | [Pipeline insights design r01](../reference/ui/crm/pipeline-insights-design-r01/README.md): eighteen icon-free PNGs with hashes. Copies on the Captures page from y 812,000 |

## 3. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | `scope:CR-04`, Pipeline insights and forecast review; parents CRM-02, CRM-05 and CRM-08; REP-01, REP-02; AT-25 |
| Page type (r20) | Overview / dashboard; supporting Review / comparison for the forecast review and Register / worklist for drill-through; a view of the Deals module, not a new module |
| Reused components | Rail · Sales as on Deal record CR-01, with Deals selected; Shell / Top bar with the Conversations action (badge 3); the accepted Deals toolbar; Button; Tag; Record / View tab, Banner and Filter chip; Grid header cell, cell, checkbox and row actions cell; Deals/Form field; Deals/Phone list row; Shell / Phone header · compact; v2 / Tab bar with the Sales items |
| Source authority | Figures and rules: the built read model. Stage and forecast model: the decisions listed above. Definitions: labelled as implemented, unadopted, withheld or owner statement. Story: synthetic. Composition: this accepted design |
| Incoming handovers | Deals read model: permitted result, filters, as-at time and completeness; stage and close-date snapshots; next-action state per deal; owner identities; Won and Lost outcomes from Archive |
| Outgoing handovers | Each figure opens Deals List with that filter and a way back; a deal title opens Deal record CR-01; REP-01 and REP-02 link to Reports overview RP-01; forecast statements stay in the review record and never change a deal |
| Exceptions and recovery | S1–S12 above: nothing partial while loading; empty is not zero; nothing stale on failure; withheld values give reasons; every partial figure says so; words are kept after a failed save; an uncertain save is checked before any retry; a save is tested against the deal's saved version |
| Departures | Section 5 |
| Verification | Sections 7 and 8 |

## 4. What the design shows

- **D1, Insights opens from Deals, in its own view.** Deals' status row link "Pipeline insights" opens it, with the same toolbar, filters, permitted result and as-at time and no view button selected. The rail keeps Deals selected and adds no item.
- **D2, six views on a tab row.** Overview, Stage ageing, Next actions, Close-date movement, Forecast review and About these numbers.
- **D3, no probabilities, weights, targets or rotting.** The forecast is value by expected close month and stage, unweighted AUD excluding GST; unknown values are listed, never zero.
- **D4, every figure opens its deals.** In Deals List, with that filter and a way back. The prototype draws one such path (no next activity); the others follow the same pattern.
- **D5, basis in words on every figure.** Implemented rule, Unadopted, Withheld, Owner statement or Partial result, never colour alone.
- **D6, charts readable without hover.** Horizontal bars and a dot strip with printed values; stages use `chart/1`–`chart/5` in fixed order, each with its own pattern; About these numbers is the table view.
- **D7, ageing withholds what the rules cannot support.** A re-entered deal (Screening and ventilation) stays listed but is left out of medians; no deal is flagged until thresholds are adopted.
- **D8, close-date movement from recorded snapshots.** Later moves add slipped days; earlier moves count as changes only; the first recorded date is not a change; missing history is unknown.
- **D9, the forecast review is its own record.** SYN-FRV-000001 holds Commit, Best case and Omitted (reason required) beside system data. Statements never change a deal and are never added to system totals.
- **D10, Pipedrive-style registers and a compact phone.** Grids with checkbox and settings columns and full-width group bands; a flush row menu; compact phone header, list rows and a full-width 48 px action.
- **D11, story and references.** Deals, owners and values from the accepted Deals page, including its corrections C1 and C2, so Potting machine and take-off is Sasha Clarke's and on time and 3 deals need attention. That closes C4 of the Deals decision. New record SYN-FRV-000001; no existing reference is rewritten.
- **D12, statements keep a snapshot.** Each statement stores the deal's stage, value, expected close, next-activity state and saved version; a completed review also stores its system totals. What changed lists deals that moved after their statement and leaves the statement standing until its owner changes it.
- **D13, review lifecycle.** Opened, Statements, Completed, then Reopened only with a recorded reason. Completing needs every deal stated, locks statements and system totals, and leaves deals free to change. Reopening keeps the completed version in history.
- **D14, closed deals beside the review.** Won and Lost deals with an outcome in the month appear in a read-only band from Archive, need no statement and stay outside the review total.
- **D15, save and data states in words.** No reason, saving, saved, not saved, outcome uncertain and deal changed.
- **D16, Expected close range in Filters.** A date range with quick choices joins the accepted Deals filter fields here. Sort and Page size are left out because they do not apply to insights.

## 5. Departures and earlier records

Departures from the built page, accepted with this design:
- a separate view with six tabs, instead of the collapsible panel above the worklist;
- charts, instead of text and fact lists;
- a forecast review record with owner statements. The [CR-04 reference](../design/development/pages/scope-cr-04.md) records that no forecast categories are adopted in the built page; this decision accepts them as a design for owner statements only, not as a forecast or financial policy;
- a rolling 90-day movement window;
- statement snapshots and a review lifecycle, which need a new record and permission if built;
- an Expected close range in Filters.

Departures from the r38 HTML: its stage probabilities, weighted totals, monthly targets and rotting are not carried, and owner categories move off the deal into the review record.

Earlier records: the [Deals design](deals-figma-design.md) stays as accepted, and its C4 is met here. Q9 asks for a small amendment to it when that page is next changed.

## 6. Not decided and not drawn

- Applying this design to the built page, and any change to the route, read model, schema or permissions. The built panel stays as it is, with acceptance pending.
- The Expected close amendment on Deals · CR-04 itself (Q9): adopted as direction, not drawn, because this work did not edit that accepted page.
- REP-01 and REP-02 definitions, ageing thresholds, snapshot retention and the treatment of transferred deals: all stay unadopted, and About these numbers says so.
- Not drawn: Board, List, Forecast and Archive (unchanged Deals views); export; saved Insights views; next month's review; a review history list; phone forecast review; dark mode; focus and hover states.
- Known limit: `Deals/Phone list row` keeps 358 px text at 320 px, so a long title would clip. It is a part shared with the accepted Deals page and was not edited.

## 7. Audit and polish

Before acceptance, 31 October 2026, at Dean's request. These correct no decision:
- the page was aligned to the accepted Deals page: toolbar, breadcrumb, Sales phone bar, corrections C1 and C2, and the adopted chart colours in fixed order;
- review wording was corrected: Sasha Clarke added to the reviewed owners, Complete review disabled while a statement is outstanding, and Record a statement drawn in its before-save state;
- review questions, internal IDs and source file paths were removed from screens users see, and kept in the notes;
- the note on Q2 was corrected: its first example thresholds rested on too little data and were removed;
- the page header no longer lists two parts that do not exist, and the notes card no longer carries a checks paragraph left over from the page it was cloned from;
- tile values, chart totals and card links now line up, chart date labels clear the as-at line, grid columns were rebalanced, and a refresh control sits beside the as-at time.

## 8. Verification

- **Figures:** totals and dates were reconciled by hand to the 18 deals and $1,189,150.50.
- **Layout:** a scripted check found no overlaps and nothing outside its section; grid text was measured and none is cut off.
- **Captures:** a final pass found no Font Awesome instance left in the eighteen copies and no prototype link on them.
- **Prototype:** all 102 links read back with destinations on this page. The flows were **not played in Present mode**.
- **Visual:** frames were inspected by screenshots taken inside Figma while drawing and after the audit, and three exported captures (05, 13 and 16) were opened to confirm they are icon-free.
- **Named version:** "Pipeline insights — accepted" has not been saved. It waits for Dean.
- **Not done:** no application check, because no application code changes; no accessibility tool, device or screen-reader test of the design; no paired comparison with the built page.
