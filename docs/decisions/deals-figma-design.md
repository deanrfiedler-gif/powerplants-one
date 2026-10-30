---
document_id: PPO-CRM-DEALS-FIGMA-DEC
date: 2026-10-24
owner: Dean Fiedler
status: Owner-accepted design, 24 October 2026; named Figma version saved; native implementation and UI baseline acceptance separate
source_commit: 0691b661bf00ee8ce1c71d247ecf472ff93142ec
versioning: git
---

# Deals Figma design

**Owner:** Dean Fiedler · **Date:** 14 October 2026 · **Status:** Owner-accepted design, 24 October 2026 ([Acceptance — 24 October 2026](#acceptance--24-october-2026)), with one later amendment ([Amendment — 31 October 2026](#amendment--31-october-2026)). The sections from "Request and source" to "Acceptance boundary" are the 14 October proposal record, kept as written; the page they call "Deals (proposal)" is now named "Deals · CR-04".

## Request and source

Dean requested the Deals module UI in the existing PPO Design file using `docs/reference/ui/deals/ppo-deal-pipeline_r37.html`. The supplied node `190:20237` is the accepted Leads page. A dedicated Deals (proposal) page (`549:2`) in the "PPO - Design" Figma file preserves that existing work. The choice of r37 follows this specific request; the repository's retained r38 runtime references remain unchanged.

Source SHA-256: `3b0d7806907bc97e9db37f5ae7d0cedf385abb6d9ec2781b0bedd1e8e7c4ca39`. The issued HTML bytes were not edited. A temporary local copy was used for rendered inspection and a temporary Figma capture; the capture was removed after native composition.

## Conformance

| Field | Delivery |
|---|---|
| Scope | PPO-009 CRM Deals worklist; current consumer `route:/sales/opportunities` and related `scope:CR-04`; all parent IDs retained |
| Page type | Register / worklist; supporting persistent record snapshot and Form / guided workflow for pipeline configuration |
| Source authority | User-selected r37 reference and existing PPO Figma components; proposed composition and synthetic fixtures, not operating rules |
| Reused components | Sales rail `190:20256`, shared top bar `35:138`, Button `3:17`/`3:29`, accepted Leads Grid header/cell/checkbox/actions components, local Roboto text styles and PPO colour/layout variables; r37 inline SVG icons |
| New local components | Deals/Card Default and Rotting variants; desktop list header/row and phone row; form field; checkbox option; source SVG icon components |
| Incoming | Synthetic qualified opportunity, owner, stage/version, contact and current next activity |
| Outgoing | Reviewable follow-up, stage and pipeline context within CRM; Won does not create an order or authorise Projects/ERP work |
| Exceptions shown | Missing next action, overdue activity, rotting, forecast ahead, expired quotation, unknown estimate and external activity owner |
| Proposed departures | Collapsed Sales rail around the standalone workspace; existing shared shell/controls; 8px stage gutters instead of the issued 9px; stacked phone list; simplified Figma controls and bounded navigation between six composed states |
| Verification | Editable structure, source totals/counts and rendered desktop/phone inspection; exact frame links and PNG evidence are in the execution record |

## User-directed visual refinement

On 14 October Dean supplied a [stage/card screenshot](../testing/evidence/deals-figma/reference-columns.png), requested correctly positioned white chevrons and professional polish, then directed removal of the extra page container and consistency with other PPO tables. These are explicit user directions, not instructions inferred from the HTML.

All four board compositions now use paired 8px outgoing points/incoming cut-ins across 78px headers. Following Dean's further request to refine column gaps and card borders, the 8px PPO spacing token replaces the issued 9px gutter in this proposal. Each column is exactly 264px wide, with 8px card insets and 248 x 264px cards; the whole-pixel positions keep the 1px inside neutral borders crisp. The 1932px card stack preserves the final card and bottom padding in the longest stage. Cards retain correct activity-type and expected-close icons, overlapping owner avatars, task counts and distinct overdue/rotting cues. The five desktop workspaces place their toolbar, status strip and worklist directly below the shared top bar; the rounded module frame and inset were removed.

The list reuses the exact Grid components used by accepted Leads (`190:20513`): 40px white header and rows, 14px Roboto, 12px cell padding, fine right/bottom dividers, neutral stage tags, checkboxes, number alignment and action cells. Contact and next-activity due are separate columns. The 1604px grid scrolls horizontally within the 1364px workspace; all 18 rows fit vertically. Shared component masters and issued HTML remain unchanged.

## Acceptance boundary

This is Figma design delivery. Navigation links connect desktop Board/List, the first deal's Snapshot, Filters and Pipeline settings, with returns to the board. Apply/Save are review navigation only: they do not execute or persist a filter/pipeline command. Other source actions, drag behaviour, loading/error families, full record pages and additional responsive states remain outside these six views. No application, database, permission, dependency or hosted deployment changed.

The [working page contract](../design/development/pages/route-sales-opportunities.md), [component contract](../design/development/components/sales-board.md) and [evidence](../testing/evidence/deals-figma/README.md) retain separate source presence, agent visual inspection, owner review, runtime proof and deployment status. Existing review fingerprints were not refreshed.

## Acceptance — 24 October 2026

On 24 October 2026 Dean asked for the existing Deals page to be finished in Figma, brought up to the current PPO standard and given its correct name and scope ID, as a proposal for his review. Claude reconciled the page with the code on `main` (`0691b661`), re-skinned it to the Template, finished the missing frames and states, and presented the result with fifteen departures and nine questions. Dean accepted it the same day.

This section records:
- his decisions and the rename;
- what the code has, and the two verdicts that brief asked for;
- the design reference and its icon-free captures;
- the conformance declaration;
- what changed in the 14 October frames, the corrections, the departures and the answers;
- what remains open.

This is a design decision. It authorises no application code, read, route change, migration, permission, capability or deployment.

### Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Finish the existing page; rename it "Deals · CR-04" | User decision, 24 October 2026 | Dean's brief: work on page `549:2` itself, draw the missing frames, rename it from "Deals (proposal)" to "Deals · CR-04" ("this prompt is my instruction to rename it"), and keep every frame name and node ID |
| Acceptance | User decision, 24 October 2026 | "I accept the Deals · CR-04 design with your recommendations, including D1–D15 and the recommended answers to Q1–Q9. Proceed with the lock-in." |
| R11 · no probabilities | User decision, 15 October 2026, carried forward | [Deal record page design](deal-record-page-design.md) R11. Weighted totals, deal probabilities, forecast categories and the "Forecast ahead of stage" signal stay off this page; every value is unweighted AUD excluding GST |
| V1 Pipeline settings | Claude's verdict, adopted (Q3) | Kept only as a labelled proposal (capture 14): pipeline creation and editing, stage deletion and remapping and rotting configuration "need their own versioned services" ([r38 integration](crm-deals-r38-integration.md)) |
| V2 Rotting | Claude's verdict, adopted (Q6) | The code has no rotting rule, so rotting is removed from every card. The Rotting card variant stays on the page only as a labelled proposal, as [Deal record](deal-record-page-design.md) Q2 left it |
| D1–D15 and Q1–Q9 | Claude's recommendations, adopted | The acceptance words above |
| Named version | User decision, 24 October 2026 | "Yes, save the named Figma version "Deals · CR-04 — Pipedrive pattern, accepted" and finish the lock-in." Claude saved "Deals · CR-04 — Pipedrive pattern, accepted" in the Figma desktop app the same day and confirmed it in the file's version history |

### The rename

The Figma page `549:2` is now "Deals · CR-04". Its node ID and every 14 October frame name and node ID are unchanged. The 14 October sections above, [Deal record page design](deal-record-page-design.md), [Figma page template alignment](figma-page-template-alignment.md), [Phone header amendment](phone-header-amendment.md) and [ADR-0055](ADR-0055-figma-file-structure.md) keep "Deals (proposal)" as written, because they record what was true then. The living masters now use the new name: `components.json`, the `sales-board`, `sales-table` and `forecast` component specifications, the [page contract](../design/development/pages/route-sales-opportunities.md) and the [r01 evidence](../testing/evidence/deals-figma/README.md).

### What the code has

Read from `main` on 24 October 2026: `src/components/crm-worklist.tsx`, `crm-worklist-board.tsx`, `crm-worklist-tools.tsx`, `crm-deal-controls.tsx` and `crm-insights.tsx`, and `src/crm/worklist.ts`, `worklist-presentation.ts`, `worklist-location.ts`, `stages.ts`, `refinements.ts` and `outcomes.ts`.

- **Views:** Board, List, Forecast (3, 6 or 12 months; Overdue, each month, Later, No close date) and Archive (All closed, Won, Lost). Manual archiving and restoration are unavailable. Pipeline insights is a collapsible panel above the worklist; it is designed separately as Pipeline insights · CR-04 (`2336:155`).
- **Stages:** Discovery, Scoping, Quoting, Negotiation and Closing on the five-stage pipeline; the legacy I1 pipeline keeps Enquiry and Qualified. A deal moves forward one stage or back to any earlier stage. Won is recorded only from Closing; Lost from any stage, with Price, Competitor, Timing or No decision. Neither outcome can be reopened.
- **Toolbar:** Board, List and Forecast, Archive, + Deal (`/sales/opportunities/new`), the count with Pipeline totals, the Pipeline chooser, Help, Filters and Deal data options (export the current page as CSV). A second row holds Views (All open, Owned by me, Overdue activities, No next activity and visit-only saved views), Add condition, the condition chips, What changed, Triage, Sort and View options.
- **Card:** title, organisation, contact, close date, value or "Not estimated", next activity and due, one next-action label, deal and activity owner initials, and six shortcuts: Snapshot, Activities, Documents, Next activity, Change stage and Edit deal. A drop saves the stage directly with the version check; a drop on Lost or Won opens the outcome form; Delete is unavailable.
- **List columns:** Deal, Organisation, Primary contact, Value, Expected close, Stage / outcome, Owner and Next activity, resizable.
- **Snapshot:** reference, stage and outcome, organisation, contact, value, expected close, owner, site, Change stage, the next activity with its owner, and the work context; Close and Open full deal.
- **Not in the code:** probabilities, weighted totals, forecast categories, rotting or inactivity limits, health signals (single-threaded, quotation expired, close date passed), waiting-on, internal tasks and email on cards, tags, bulk actions other than CSV export, a column chooser and pipeline editing.

### Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Deals · CR-04 — Pipedrive pattern, accepted" (saved 24 October 2026). The file's link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, [ADR-0053](ADR-0053-figma-page-design.md)) |
| Page | "Deals · CR-04" `549:2`, under "— Sales —". Page header `2349:9650`; Sections Desktop 1440 `2349:9685`, Tablet 1024 `2349:9689`, Phone 390 and 320 `2349:9693`, States `2349:9700`, Flows and notes `2349:9704`, Page components (proposal) `2349:9708` |
| Desktop frames | <ul><li>01 Board `549:3`, 02 List `555:5333`, 03 Forecast `2362:63797`;</li><li>04 Archive `2366:6346`, 05 Snapshot `555:6027`, 06 Filters `555:6470`;</li><li>07 Two selected with the small panel `2367:7589`, 08 Column settings `2367:8772`, 09 Add deal `2368:8381`;</li><li>10 Record Won `2369:11867`, 11 Won recorded with the handover prompt `2368:8653`, 12 Record Lost `2369:12101`;</li><li>13 Refused stage move `2368:10058`, 14 Pipeline settings (proposal, not in the app) `555:6765`.</li></ul> |
| Tablet and phone | Tablet 1024 Board `2369:815641` and List `2369:815999`; Phone 390 list `555:7107`, Phone 320 list `2361:6377`, Phone 320 Search and filter `2369:818269` |
| States | Loading `2370:16205`, Could not load `2370:17646`, No deals yet `2370:17876`, No deals match the filters `2370:19278`, No access `2371:818632`, Stale results `2371:818894`, Partial page `2371:819118`, Card hover `2371:820229`, Row hover `2371:821611` |
| Notes | Notes card `555:7697`: the rename, the code inventory, R11, the verdicts, every change to the 14 October frames, the corrections, D1–D15, Q1–Q9 and the prototype |
| Page components | Deals/Card `551:947` (Default used; Rotting a labelled proposal), Deals/Form field `555:6233`, Deals/Checkbox option `555:6380`, and the new Deals/Forecast card `2362:63788`. They stay on this page; moving them to Components `1:4` is separate work |
| Prototype | Flows "CR-04 — desktop" (Board, List, Forecast and Archive; a card to the Snapshot; Filters; + Deal; Record Won to Won recorded; Record Lost; selection and column settings from the List) and "CR-04 — phone" (the list to Search and filter). The snapshot's Open deal page and a phone row continue on Deal record · CR-01 (`879:44`), another page, so they are not linked |
| Retained captures | [Deals design r02](../reference/ui/crm/deals-design-r02/README.md): 28 icon-free PNGs at exact frame size, with hashes. The 14 October [r01 evidence](../testing/evidence/deals-figma/README.md) stays unchanged |

### Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | Route `/sales/opportunities` (`src/app/(business)/sales/opportunities/page.tsx`, which renders `SalesWorklist`), register entry `route:/sales/opportunities`, `scope:CR-04` (shared with Pipeline insights, Q7), PPO-009, parents CRM-02 and CRM-05. No parent ID is added or renamed; all 78 remain. Capabilities, unchanged: `crm.opportunity.read` to see deals; `crm.opportunity.create` for + Deal; the deal owner with `crm.opportunity.edit` to move a stage or record an outcome |
| Page type (r20) | Register / worklist, with a persistent right-docked snapshot (Work queue + persistent detail) and Form / guided workflow for Filters, Add deal and Record sales outcome. Phone: a list with the compact header; a row opens the Deal record phone view |
| Reused components | Rail · Sales (proposal) `190:20238`, Expanded with Deals selected and Collapsed at 1024; the detached top bar with Shell / Top bar action · Conversations `1175:2205`; Shell / Phone header · compact `1530:110`; v2 / Tab bar (phone) `107:149` and Shell / Quick add (phone) `38:342`; Button `3:41`; Tag `3:13`; Record / Banner `251:2310`; Record / Filter chip `224:31`; My Work / Group row `408:375`; Grid / Checkbox cell `74:48` and Row actions cell `74:50` in the Leads fixed columns; Deals/List header `588:6771`, row `551:948` and phone row `555:7166`; Font Awesome Light icons named as in `src/components/font-awesome-icons.ts` |
| Source authority | The code above; this record; [deal-record-page-design.md](deal-record-page-design.md) (R11, Q2); [crm-deals-design-correction.md](crm-deals-design-correction.md); [crm-deals-r38-integration.md](crm-deals-r38-integration.md); [crm-pipeline-stage-model.md](crm-pipeline-stage-model.md); [leads-design.md](leads-design.md) (L1–L10); [shell-top-bar-amendment.md](shell-top-bar-amendment.md) (R1–R9); [phone-header-amendment.md](phone-header-amendment.md) (P1–P9); the [page contract](../design/development/pages/route-sales-opportunities.md). The r37 HTML is the earlier source only. Fixtures are synthetic; the story is as at Thursday 15 October 2026, 09:00 AEST, signed in as Sasha Clarke, as on Deal record CR-01 |
| Incoming handover | Qualified deals from LC-11 lead conversion or + Deal; the permitted result page with stages, version, owner, contact, value, expected close, next activity and its owner, the as-at time and completeness; for Won, the issued quotation and its reported response from Estimating & quotation |
| Outgoing handover | A card, a row or Open deal page opens Deal record · CR-01. Record Won writes the handover-due record and points to Won-deal receiving (CR-03); it never creates an order, project, work order or ERP transaction. Pipeline insights opens Pipeline insights · CR-04. Export list writes a CSV of permitted rows only |
| States shown | Loading; could not load; no deals yet; no deals match the filters; no access; stale results while paging; a partial page with no false total; card and row hover; a refused stage move; Won recorded with the handover due |
| Departures | D1–D15 below |
| Verification | Below |

### What changed in the 14 October frames

Before anything moved, every layer of the ten existing top-level nodes was fingerprinted: type, name, transform, size, text, fills, visibility, opacity, prototype reactions and main component. Moving them into the Template Sections changed none of them. The changes below were then made on purpose:

- **Shell, on Board, List, Snapshot, Filters and Pipeline settings:** the labelled Sales rail with Deals selected (white tile) replaces the collapsed 76 px rail; the detached top bar with the centred search, the breadcrumb "Deals" and Conversations (badge 3) left of Page guide replaces Shell / Top bar `35:138`; the workspace narrows from 1364 to 1200 px.
- **Toolbar:** Forecast joins Board and List; Archive is added; "Opportunity" becomes "+ Deal"; Views shows "All open"; "Triage 11" becomes "Triage 3". The status row adds "known · 2 not estimated", says "3 need attention" instead of "4 at risk", and links "Pipeline insights".
- **Boards (four compositions, 72 cards):** stages narrow from 264 to 228 px and cards from 248 to 212 px; shortcuts narrow from 25 to 22 px; the email shortcut becomes Change stage; task badges are hidden; the r37 health signals become the app's next-action labels; "Waiting on …" is removed; the two Rotting cards use the Default variant.
- **List:** "Opportunity" becomes "Deal"; the Leads fixed Select and Settings columns are added; the footer gives its basis ("all matching results · as at Thu 15 Oct 2026, 09:00 AEST").
- **Snapshot:** Health becomes Next activity ("Plan the next step"); Rotting, Internal task blocked, Single-threaded, Waiting on and Delivery timing are hidden; contact, site, Change stage and the work context are added; the footer has Close and Open deal page.
- **Filters:** the app's fields (Search, Company, Site, Deal owner, Owned by me, Sales outcome, Next action, Stage, Sort, Page size), Clear filters and Done. The r37 groups (stage boxes, health signals, value band, tags) are hidden.
- **Pipeline settings:** its header and footer say it is a proposal that is not in the app.
- **Phone list:** the compact header ("Deals 18", search, Conversations, filter) replaces the old header; the toolbar, view and summary rows are removed (P6); the Sales phone bar with Deals selected and the floating + are added.
- **Icons:** every r37 icon on these frames is now the Font Awesome Light icon the accepted pages use. The notes card lists each swap. The legacy `Deals/Icon/*` masters were not edited.

### Corrections to agree with the accepted pages

- **C1** Potting machine and take-off now matches Deal record CR-01 (`879:44`): owner Sasha Clarke (was Dean Fiedler), "SYN Woodhaven Nursery, NSW" (was "Woodhaven Nursery, NSW"), and the next activity due in 1 day, on Friday 16 October (was overdue by 1 day; "Waiting on Customer" removed). This applies to the cards, the list, the phone and the forecast.
- **C2** With C1, three deals need attention, not four: Glasshouse climate renewal and Climate and dosing integration have no next activity, and Potting line conveyor is overdue. Triage therefore reads 3. CR-01's accepted list entry (`892:222556`) still reads "4 at risk" and "Triage 11"; it was not edited.
- **C3** The other seventeen deals already matched CR-01's titles, owners, stages and values. Quotations (`123:40`) and Leads (`190:20237`) hold none of these deals.
- **C4** Pipeline insights · CR-04 (`2336:155`, a proposal drawn separately) still shows Potting machine overdue at "Woodhaven Nursery, NSW" and four deals needing attention; it should follow C1 and C2 when it is next changed.

The deals other pages rely on stay as they were: LED propagation lighting (close date moved three times, now passed) and the two deals with no next activity (both Dean Fiedler, $252,500.50). The six closed deals in the Archive are new synthetic records, SYN-OPP-000351 to SYN-OPP-000356, under the [readable-reference rule](readable-reference-namespaces.md); no existing reference changed.

### Departures

| ID | Departure | Today's app | Basis |
|---|---|---|---|
| D1 | The labelled Sales rail and the Conversations top bar on every frame | The app's shell | Leads L9; top bar R1–R9; Dean's 18 October Conversations rule |
| D2 | Stages 228 px and cards 212 px, so all five stages fit beside the labelled rail at 1440 | The grid divides the width equally | Fit at the review width |
| D3 | The next activity and its due straight after the deal in the List | Deal, Organisation, Contact, Value, Expected close, Stage / outcome, Owner, Next activity | Leads L4; Deal record CR-01's accepted list entry |
| D4 | Fixed checkbox and settings columns | Neither | The Leads register |
| D5 | The snapshot keeps Deal follow-through (issued quotation, estimating handover) and the advisory exit conditions | Not shown | CR-01's accepted list entry; CR-01 R4. A new read |
| D6 | Forecast groups each month by stage, with stage subtotals, and links to Pipeline insights for the chart | Each month lists its deals with a stage label | "By expected close month and stage", without duplicating Pipeline insights |
| D7 | Archive groups by outcome, with bands across the fixed columns | Closed deals are listed flat | The grid band rule |
| D8 | A selection opens a small panel with Open in sequence and Export list (CSV) | Whole-page CSV export only | Leads L7; Quotations |
| D9 | A column chooser from the gear | Columns resize only | Leads L4 |
| D10 | + Deal opens the Add deal form over the register, with the app's fields | `/sales/opportunities/new` opens as a page | The full-height form pattern of [crm-deals-design-correction.md](crm-deals-design-correction.md) |
| D11 | After Won, an Info notice with Prepare receiving handover (CR-03) and Open in Archive | The page reloads without a notice | CR-01 R8 |
| D12 | A refused stage move is a Warning notice with the command's reason and its recovery button | A plain status row | Status in words |
| D13 | Phone: the compact header, no toolbar rows, the Sales phone bar and the floating + | The app's phone header and stage navigation | P1–P9; Leads L8 and L10 |
| D14 | Tablet: the rail collapses, the top-bar zones hug, and What changed, Help and Pipeline move into "…" | Not adapted | The 1024 top bar rule |
| D15 | "No deals yet" adds guidance with Open Leads and + Deal | Empty stage lines only | Empty states that say how to start |

### Questions, with the answers adopted

| Question | Answer |
|---|---|
| Q1 Board or List as the default view? | Board, as the app does today; the URL keeps the last view |
| Q2 A flush side menu of views, as on Leads? | No. The board needs the width, Pipedrive's Deals has none, and the app keeps views in the Views chooser, so the tablet only collapses the rail |
| Q3 Keep Pipeline settings? | Keep it as a labelled proposal until a versioned pipeline service is decided; archive it below the page if that is not planned |
| Q4 Is value visible to all sales staff? | Yes, to everyone with `crm.opportunity.read`, as today. No value hiding is proposed |
| Q5 Retire the superseded captures of pull request 473? | No. The r01 evidence stays unchanged as history; the r02 captures are the reference |
| Q6 Remove the Rotting variant altogether? | No. It stays only as a labelled proposal in Page components until pipeline settings are versioned |
| Q7 The page coverage register gives CR-04 to "Pipeline insights and forecast review", and the Deals register has no CR ID of its own | Keep "Deals · CR-04" as instructed. The File index row says Deals and Pipeline insights share CR-04 and the route |
| Q8 Record Lost is drawn on the same deal as Record Won, as the other branch | Accepted, as Deal record CR-01 did |
| Q9 Bulk stage changes? | Still not proposed ([crm-pipeline-stage-model.md](crm-pipeline-stage-model.md)) |

### Not decided

- **Building the page.** The labelled rail, the toolbar, the fixed columns, the Forecast stage groups, the Archive bands, the selection panel, the column chooser, the Add deal panel, the Won notice and the phone header each need their own pull request; the snapshot's follow-through is a new read.
- **Not drawn:** the phone Board with stage navigation (the app's phone default), the Choose view sheet, phone selection, tablet Forecast and Archive, the open Pipeline totals, Views and Sort menus, a drag in progress with the drop targets, and the Transfer deal owner and Edit deal dialogs (Deal record CR-01 keeps today's).
- **Components.** Deals/Card, Deals/Form field, Deals/Checkbox option and Deals/Forecast card stay on this page; moving them to Components `1:4` is separate work.

### Consequences

- No application code, read, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [register entry](../design/development/pages/route-sales-opportunities.md) now links this design and its r02 captures. Its visual status stays "Needs review": the app does not yet match the design.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; the r02 bytes stay unchanged.

### Verification

- Claude checked every frame with screenshots taken inside Figma while drawing, and fixed what they showed: the segmented control clipping "Forecast", toolbars wider than 1200 px, a select chevron on text inputs, textareas that did not wrap, a long site name overflowing its field, label and section overlaps, and two cards that a failed script pass had left with the wrong next activity.
- A layout pass found no overlapping frames and no frame outside its Section. A text audit of the new frames found one overflow, which was fixed. No prototype link leaves the page; the two flow starting points are "CR-04 — desktop" and "CR-04 — phone".
- The 28 captures are copies of the accepted frames on the "Captures (icon-free)" page, with every Font Awesome icon swapped for `Icon/placeholder` at its original size and visibility and every prototype link removed. A layer-by-layer comparison of each copy with its source found no difference in visibility, size or text outside the swapped icons, no Font Awesome instance and no link. The hashes are in the [captures README](../reference/ui/crm/deals-design-r02/README.md).
- Claude cannot run Present mode through the connector, so the click-through was checked structurally, not played.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.

## Amendment — 31 October 2026

This section adds an Expected close range to the Deals Filters frame and the phone Search and filter frame. The 24 October sections above stay as written. This is a design change only: no application code, read, route, migration, permission or capability changes, and no page, scope or parent requirement ID changes.

### Why

Dean accepted Pipeline insights · CR-04 (`2336:155`) on 31 October 2026 with the words "Accept, lock in", which adopted the recommended answers to that page's questions. Its Q9 reads: "Yes, as a small amendment to Deals · CR-04, so both views keep the same filters. Open deals with no close date are left out unless chosen." Its D16 adds the range to the Insights filters and leaves out Sort and Page size, because they do not apply there. That lock-in did not edit this page. The record is `docs/decisions/pipeline-insights-figma-design.md` in [pull request #786](https://github.com/deanrfiedler-gif/powerplants-one/pull/786).

| Item | Classification | Evidence |
|---|---|---|
| Add Expected close to the Deals filters | User decision, 31 October 2026, adopted through Pipeline insights Q9 | "Accept, lock in" |
| Open deals with no close date are left out unless chosen | User decision, the same answer | Q9 |
| Keep Sort and Page size on Deals | Accepted Deals fields, unchanged. Insights leaves them out only because they do not apply there | D16 of Pipeline insights |
| Add it to Phone 320 Search and filter | User decision, 31 October 2026 | Asked whether to add it to the phone frame too, Dean answered: "Yes, draw the phone" |
| Three pairs of fields, so the form fits one screen | Claude's layout choice, drawn for Dean's review | D16 below |
| Named version for this amendment | User decision, 31 October 2026 | Asked whether Claude should save "Deals · CR-04 — Expected close amendment", Dean answered: "Yes, you save it". Claude saved it in the Figma desktop app the same day and confirmed it at the top of the file's version history. It was saved before the phone was drawn, so it does not hold the phone change |

### What changed on the page

Two frames changed, Filters `555:6470` and Phone 320 Search and filter `2369:818269`. Both keep their size. On Filters:

- **Expected close group,** after Stage and before Sort. It is copied from the Filters frame `2866:39739` on Pipeline insights: the heading, the quick choices This month, Next month, Date passed and No date, and From and To (Thu 1 Oct 2026 to Sat 31 Oct 2026), with This month selected. New nodes: heading `2895:20568`, quick choices `2895:20569`, range `2895:20574`, count line `2895:20577`.
- **Count line:** "7 of 18 open deals match, including 2 with a passed close date. Open deals with no close date are left out unless you choose No date." The second sentence is new; Insights has only the first.
- **Three field rows:** Company and Site `2895:20565`, Next action and Stage `2895:20566`, Sort and Page size `2895:20567`, each field 228 px wide with a 16 px gap. Field order is unchanged and every existing field keeps its node ID. The form keeps its 12 px gap, and its content now ends at 770 px of the 800 px form. Before this change Page size ran past the bottom edge, and the group would otherwise have added about 200 px more.
- **From and To chevrons:** `Icon/chevron-down`, as on every other field on this frame. The Insights copy still carries the smaller legacy `Deals/Icon/chevron`. That page was not edited.
- **Behind the scrim:** the board stays unfiltered, showing all 18 open deals, because Done has not been pressed. The count is the form's preview.
- **Phone 320 Search and filter** `2369:818269`, new group `2909:19474` after Stage:
  - the quick choices are 44 px high in two rows of two, instead of the 28 px desktop chips, as a touch target;
  - From and To are stacked, because "Sat 31 Oct 2026" does not fit in a half-width field at 320;
  - the count line is the same as on desktop, and the action reads "Show 7 deals" instead of "Show 18 deals";
  - the body now scrolls in the prototype, so Deal owner, Owned by me, Company, Site and Sort, which sit below the fold, can be reached. Sort was already cut off before this change.
- **Notes card** `555:7697`: an amendment heading and copy. The section "Flows and notes" grew to fit, and "Page components (proposal)" moved down with it. No other frame moved.

The count agrees with the List `555:5333` as at Thursday 15 October 2026: seven of the 18 open deals close in October, and LED propagation lighting (10 Oct) and Dosing controller replacement (11 Oct) have passed. Every open deal drawn has a close date, so No date would match none of them in this story.

### Departure

| ID | Departure | Today's app | Basis |
|---|---|---|---|
| D16 | The Filters form and the phone Search and filter have an Expected close range with quick choices. On desktop, Company and Site, Next action and Stage, and Sort and Page size share rows | No expected-close filter. The Forecast view groups by close month | Pipeline insights Q9. This Deals D16 is separate from D16 on that page |

### Design reference

[Deals design r03](../reference/ui/crm/deals-design-r03/README.md) holds two new captures, 06 Filters (`2895:424975`) and 19 Phone 320 Search and filter (`2909:444511`), both on "Captures (icon-free)". The other 26 captures in [r02](../reference/ui/crm/deals-design-r02/README.md) still show the current design, and all 28 r02 files stay unchanged. The named version "Deals · CR-04 — Expected close amendment" holds the desktop change only.

### What remains open

- **Named version for the phone.** The phone change is in the file but in no named version yet.
- **Phone view of Pipeline insights.** Its filters were not checked in this work.
- **Building it.** The filter needs its own pull request, including how the two views read the range.

### Verification

- The form was checked by screenshot inside Figma at scale 1, and by reading each visible child's position: no overlap, and no row wider than the form. A first read showed the Sort row sitting inside the group; it was moved to the end of the form and confirmed in a separate call and a second screenshot.
- The phone frame was checked by screenshot and by child positions. A first pass left the count line 2 px under the sticky action and the chips 1 px uneven; both were fixed, and the group now ends at 759 px of the 767 px body. Field order was confirmed in a separate call.
- A page check found no Section overlapping another and no node outside its Section. The two flow names are unchanged, and the existing Close and Done links were not touched. Present mode was not played.
- Each capture copy was compared with its frame layer by layer, across 1,381 layers on Filters and 81 on the phone: no difference in visibility, size or text outside the swapped icons. All 269 and 11 icon instances are `Icon/placeholder`, and no prototype link remains.
- Nothing is built, so there is no application or device evidence, and this record implies no visual review of the application.
