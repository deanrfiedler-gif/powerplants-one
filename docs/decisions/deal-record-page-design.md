---
document_id: PPO-CRM-DEAL-RECORD-DESIGN-DEC
date: 2026-10-16
owner: Dean Fiedler
status: Owner-accepted design; new reads, deal notes, email sending, file links, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 1552cfbb8efd6cea17438c2af18ba0effa4fc278
versioning: git
---

# Deal record page design — owner decision

On 15 October 2026 Dean asked for the deal record page (`/sales/opportunities/[id]`) to be built in Figma as a proposal for his review: the fourth use of the accepted shared record layout, after the [lead](lead-record-page-design.md), [work order](work-order-record-page-design.md) and [project](project-record-page-design.md) record pages. He asked for the Pipedrive deal record to be compared read-only, for PPO's rules to win where they differ, and for the page to be drawn from the code and the page contract with every item the app cannot do yet labelled a proposal.

The design was developed in four rounds:
1. **Proposal, 15 October:** drawn from the code, the decisions and a read-only look at Pipedrive's deal page; Claude listed eleven recommendations and nine open questions.
2. **"Proceed with your recommendations", 15 October:** every recommendation adopted and every question given its recommended answer. This removed the weighted totals, stage probabilities and forecast categories from the Deals proposal page and added the forward stage move.
3. **Audit and polish, 16 October:** Dean asked for an audit and polish, and that "all the tables align with the styles of the tables you have designed for the other UI pages". Every table was rebuilt in the record-page table style and the spacing, checks, dialogs and copy were corrected.
4. **Final pixel pass, 16 October:** Dean sent a screenshot of the activity Type control, whose selected fill did not reach its edges, and asked for the page to be "a truly outstanding UI page". The control was rebuilt, and a zoom audit fixed the remaining pixel-level defects.

Dean accepted the design on 16 October 2026: "I accept." The design reference is the named Figma version "Deal record page — shared record layout, accepted", which Dean saved himself.

This record retains:
- his decisions;
- the Pipedrive observation and what it changed;
- the design reference and its icon-free captures;
- the conformance declaration;
- the display rules and the departures from today's page;
- what remains open.

Scope:
- **Route:** the existing route `/sales/opportunities/[id]`, register entry `route:/sales/opportunities/[id]` ("Opportunity detail").
- **Scope:** `CR-01` "Opportunity detail and internal work" (page coverage register r06), under PPO-009.
- **Parent requirements:** CRM-02, CRM-03, CRM-04, CRM-05, CRM-07 and CRM-08. No parent requirement ID is added or renamed.

This is a design decision. It authorises none of the following:
- application code or new reads;
- deal notes, email sending from a deal, or SharePoint file links on deals;
- a route change or migration;
- a permission or capability;
- deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the deal record page on the shared record layout | User decision, 15 October 2026 | "Build the Deal record page for Powerplants One in Figma, as a proposal for my review." The brief named the layout, the components, the page contract's seven views, the frames to draw and the rules that must win over Pipedrive's |
| Pipedrive comparison | Bounded account observation, 15 October 2026 | Section 2. A read-only look at the deal record in Dean's `powerplants2` Pipedrive account. Patterns were borrowed, not branding or rules |
| Adopt the recommendations and the recommended answers | User decision, 15 October 2026 | "Proceed with your recommendations." R1–R11 below are adopted; Q1–Q9 take their recommended answers |
| Audit and polish; tables in the shared table style | User decision, 16 October 2026 | "Give all the pages you designed for the Deal Record UI an audit and polish", then "Make sure all the tables align with the styles of the tables you have designed for the other UI pages" |
| Final pixel pass | User decision, 16 October 2026 | Dean's screenshot of the Call button whose fill did not fill the control: "I want the Deals Record page to be a truly outstanding UI page" |
| Acceptance | User decision, 16 October 2026 | "I accept." Dean saved the named version "Deal record page — shared record layout, accepted" |
| R1 The shared record layout, unchanged | Claude's recommendation, adopted | The one-row header, the 380 px details column that scrolls on its own, and the main column with the work order page's view tabs and the lead page's composer, Focus and History in every view |
| R2 Seven view tabs | Claude's recommendation, adopted | Overview (default), Scope & sites, Activities, Estimates & quotations, Correspondence, Documents and History, from the page contract. Activities and Tasks are one tab, because tasks are activities |
| R3 Stage bar | Claude's recommendation, adopted | The five stages with days in each; each stage is a button that opens Change stage with only the moves the code allows |
| R4 Stage-exit readiness bar | Claude's recommendation, adopted | An advisory bar under the stage bar from the accepted exit conditions (section 5). Never a gate the server does not have |
| R5 Header actions | Claude's recommendation, adopted | In Closing: Won (primary) and Lost. In earlier stages: "Move to <next stage>" and Lost. "…" holds Edit deal, Edit requirements and scope, Change stage, Transfer deal owner and Copy link. None for a read-only viewer |
| R6 A reason on every stage move | Claude's recommendation, adopted | The command already stores one; today the app sends fixed text |
| R7 Evidence comparison table | Claude's recommendation, adopted | The outcome form shows the reviewed evidence against the current facts in a table, frozen at review |
| R8 After Won | Claude's recommendation, adopted | An Info banner, "Prepare receiving handover" as the main action, and Won-deal receiving in Linked work. Won never reads as delivery |
| R9 Email writes and sends | Claude's recommendation, adopted | As decided for the lead page, through the connected mailbox; build it with the mailbox pilot |
| R10 Phone | Claude's recommendation, adopted | Details, Activity, Quotes, Emails and Files tabs; Plan activity and Won in the footer; Lost, Write an email and the rest in the action sheet |
| R11 No probabilities on the Deals page | Claude's recommendation, adopted | The weighted totals, stage probabilities, forecast categories and the "Forecast ahead of stage" signal are hidden on the Deals proposal page `549:2`, because PPO has no deal probabilities and values stay unweighted. Its notes card records the change; the captures in pull request 473 predate it |
| Q1 Exit-condition note on a forward move | Resolved by "Proceed" | Yes: one short required note, saved as the move's reason, with an optional link to the activity, email or document that shows it |
| Q2 Rotting limits | Resolved by "Proceed" | Not yet. The flag stays a proposal until pipeline settings are versioned; the Deals proposal's settings are the starting point |
| Q3 Lost reasons | Resolved by "Proceed" | Keep the four (Price, Competitor, Timing, No decision) with the free-text notes; add reasons only from real lost-deal data |
| Q4 Notes on deals | Resolved by "Proceed" | Yes, in the same increment as the lead's in-place note |
| Q5 Files at conversion | Resolved by "Proceed" | The deal takes over the lead's SharePoint links |
| Q6 Default tab | Resolved by "Proceed" | Always Overview; Focus shows the next step on every tab |
| Q7 Tablet 1024 | Resolved by "Proceed" | The details column folds to a 44 px labelled strip, as on the project page. Not drawn |
| Q8 Checks in Change stage | Resolved by "Proceed" | A forward move shows the checks of the stage being left, read only, above the exit note |
| Q9 Next record page | Resolved by "Proceed" | The service request page, `/service/tickets/[id]`, as named after the work order page |
| Building the page, the reads and the shell | Not decided | Section 7 |

## 2. Pipedrive observation

On 15 October 2026 Claude looked at the deal record `deal/1` in Dean's `powerplants2` Pipedrive account through Claude in Chrome, read-only, and opened its History Changelog filter. Nothing was clicked that saves, wins, loses or deletes. This is a bounded observation of a demonstration account, not of Powerplants' operations. The Pipedrive API connector reads a different company and was not used.

| What Pipedrive's deal record carries | Where it is on this page |
|---|---|
| Header: owner, followers, Won with "Mark as won and create project", Lost | Header: owner with an avatar, Won and Lost. No followers: PPO has one accountable owner. Won records a handover due; a project is created separately in Won-deal receiving |
| Stage bar with days in the current stage | Stage bar with days in every stage; each stage opens Change stage |
| Summary, Details, Source, Person, Organization, Overview (deal age, inactive days) | Summary, Overview (deal age, days inactive), Customer and site, Contact, Source, Requirement |
| Composer: Activity, Notes, Meeting scheduler, Call, WhatsApp, Email, Files, Documents, Invoice | Note, Activity, Email (writes and sends) and File. Meetings and calls are activity types; quotation documents come from Estimating & quotation; MYOB is the ERP |
| Focus | Focus: the designated next activity with quick planning |
| History filtered by type, with a Changelog of every field and stage change | History grouped by day and filtered by All, Notes, Activities, Emails, Files, Quotations and Changes, with counts; Changes shows version and reason |
| Probability, weighted value, Products, installments, Invoice | Left out: PPO has no deal probabilities; Estimating & quotation owns lines; MYOB is the ERP |
| Labels, Sequences, Smart Bcc, Participants, the field builder, Merge, Delete | Left out: not PPO decisions; PPO keeps every record and its history |
| Organisation enrichment (website, LinkedIn, revenue, staff) | Left out: Customer 360 owns organisation detail |

Added for PPO: the stage-exit bar, separate stage and outcome, quotation evidence for Won and Lost with a frozen comparison, Linked work, and the view tabs.

## 3. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design" in Dean's Figma team, at the named version "Deal record page — shared record layout, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Deal record page · CR-01" `879:44`, sample SYN-PPO-OPP-000326 "Potting machine and take-off" at SYN Woodhaven Nursery, owned by the signed-in Sasha Clarke, in Closing; today Thursday 15 October 2026: <ul><li>Overview `879:213595`, Scope & sites `881:658`, Activities `884:4854`, Estimates & quotations `885:1878`, Correspondence `885:216987`, Documents `885:219004`, History `885:219653`;</li><li>Activities with the activity composer open `883:1051`; Correspondence with the email composer open `885:217627`;</li><li>Change stage, moving back `890:9950`; Change stage, moving forward `902:7711`; the stage-exit readiness bar, one per stage `890:222678`;</li><li>Record Won with quotation evidence `890:10143`; Record Lost with separate evidence `890:10374`; Won recorded, handover due `890:222114`;</li><li>the Deals list entry `892:222556`, whose snapshot gains "Open deal page";</li><li>the states section `879:105` (twelve states);</li><li>phone list `894:6600`, Details `894:6741`, actions `897:7726`, New activity `894:222638` and New email `894:222722`.</li></ul>Its notes cards `897:14003` and `897:14018` hold the conformance declaration, the Pipedrive comparison, the rules, the departures, the recommendations and questions, the polish passes, what is not in the app, what is not drawn and the prototype |
| Components | <ul><li>Page components (proposal): Deal record / Details column `879:3630`, used by every desktop view; Deal record / Stage bar `879:3940` (variants Closing, Negotiation, Discovery); Deal record / Focus card `879:3941`.</li><li>Reused unchanged: Record / Header, Field, Section heading, History item, Filter chip, Readiness bar, Check item, Banner and View tab from the earlier record pages; Rail · Sales; Shell / Top bar; Button; Tag; the lead page's composer and phone forms; the project page's dialog shell.</li></ul> |
| Prototype | Flows "Deal record — desktop" from the Deals list entry and "Deal record — phone" from the phone list. Tabs switch views; the composer's Activity and Email tabs open the planning and writing frames; Lost and Won open the outcome forms; Record Won leads to Won recorded; the Negotiation stage opens Change stage; the "In Negotiation" row of the stage-exit board opens the forward move; the breadcrumb and Cancel return |
| Retained captures | [Deal record page design r01](../reference/ui/crm/deal-record-page-design-r01/README.md): thirteen icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 4. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing route `/sales/opportunities/[id]` (`src/app/(business)/sales/opportunities/[id]/page.tsx`, which renders `OpportunityDetail` in `src/components/crm-screens.tsx`), register entry `route:/sales/opportunities/[id]`, scope `scope:CR-01`, parents CRM-02, CRM-03, CRM-04, CRM-05, CRM-07 and CRM-08. Capabilities, unchanged: `crm.opportunity.read` to see the deal; the current owner with `crm.opportunity.edit` to change it, plan for it, move its stage or record its outcome; `crm.opportunity.transfer.own` to transfer it. No capability is invented for notes, sending email or linking files |
| Page type (r20) | Record detail, as the Deal Workspace r01 declared; supporting Form / guided workflow (Change stage, Record Won, Record Lost) and Document & evidence (Estimates & quotations, Documents). On the phone: one record page with tabs. The Edit deal, Edit requirements and scope and Transfer deal owner dialogs keep their current types and are not redesigned here |
| Reused components | <ul><li>Rail · Sales and Shell / Top bar from the accepted Leads design.</li><li>The shared record parts from the [lead](lead-record-page-design.md), [work order](work-order-record-page-design.md) and [project](project-record-page-design.md) record page decisions.</li><li>The Deals list, snapshot and phone list from the Deals proposal (`docs/decisions/deals-figma-design.md`, PR #473; owner acceptance pending).</li><li>Button, Tag and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`.</li><li>New: the components in section 3.</li></ul> |
| Source authority | <ul><li>`OpportunityDetail` and `DealDialog` (`src/components/crm-screens.tsx`, `src/components/crm-deal-controls.tsx`): the sections, the outcome and transfer forms, and the labels.</li><li>`src/crm/reads.ts`: `can_edit`, `can_transfer`, `can_record_outcome`, the next-action states and the history events.</li><li>`src/crm/stages.ts` and `src/crm/refinements.ts`: the five stages, `permittedStageMove`, and the stage command's errors.</li><li>`src/crm/outcomes.ts`, `src/crm/outcome-sources.ts` and `src/estimating/response/model.ts`: Won from Closing only, the evidence choice, the Accepted response with its holds, the Declined report for Lost, the four lost reasons, the handover-due record.</li><li>[crm-pipeline-stage-model.md](crm-pipeline-stage-model.md): the stages and their exit conditions.</li><li>[deal-outcome-evidence.md](deal-outcome-evidence.md), [won-delivery-continuity.md](won-delivery-continuity.md) and [crm-opportunity-handover.md](crm-opportunity-handover.md).</li><li>[route-sales-opportunities-id.md](../design/development/pages/route-sales-opportunities-id.md): the seven views.</li></ul>Fixture: synthetic `SYN-PPO-OPP`, `SYN-PPO-LEAD`, `SYN-PPO-EST` and `SYN-PPO-QUO` references, customers, sites, people, `.example` addresses and dates; today is Thursday 15 October 2026 |
| Incoming handover | The Deals board and list (a row, or "Open deal page" in the snapshot), the Deals phone list, LC-11 lead conversion, My Work activity links, global search, emails linked in the Sales Inbox, and back-links from estimating handovers, quotations and Won-deal receiving |
| Outgoing handover | The estimating handover (CR-02); quotation release and reported response (ES-05/ES-06); Won → handover due → Won-deal receiving (CR-03, LC-16); the organisation, site and contact records; activities in My Work. Never an order, project, work order or ERP transaction |
| States shown | <ul><li>An open deal in Closing with an accepted quotation response, in every view.</li><li>The composer with the activity form and the email form open.</li><li>Change stage moving back and moving forward; Record Won; Record Lost; Won recorded.</li><li>Twelve states: no next activity; overdue; rotting (a proposal, not adopted); due date needed; read only; unavailable or denied; Won with the handover due; Lost; a newer saved version; an uncertain save; a refresh that failed; outcome evidence restricted or changed.</li><li>The phone list, Details, the action sheet, New activity and New email.</li></ul>Loading, tablet and the other phone tabs are not drawn |
| Departures | Section 6 |
| Verification | Section 9 |

## 5. Display rules

### Rules from the code

- **Stages.** Discovery, Scoping, Quoting, Negotiation, Closing. Forward one stage at a time; back to any earlier stage. Today a stage move saves the fixed reason "Change deal stage".
- **Stage and outcome are separate.** Won only from Closing; it keeps the stage. It needs an explicit evidence choice (an issued quotation whose current reported response is Accepted with its holds cleared, or a separate-evidence narrative) and acceptance or order evidence.
- **Lost** from any stage, with a structured reason (Price, Competitor, Timing, No decision); quotation evidence for Lost needs a Declined report. Reopening is unavailable after either outcome.
- **The reviewed evidence is frozen.** Refresh never advances it; a denied refresh removes it; an uncertain save can only be recovered.
- **Won writes one immutable handover-due record** owned by the closing owner. No order, project or ERP work.
- **Value** is one unweighted AUD amount excluding GST; unknown reads "Not estimated", never $0. There are no probabilities. Option estimates are never added to it.
- **Next activity:** Upcoming, Overdue, Due date needed, Next action needed or Unavailable. Changing the owner never moves an activity.
- **Every save sends the expected version;** a newer version refuses it and keeps the proposal.

### The stage-exit readiness bar (proposal)

| In stage | Bar title | Checks (Done, Asked later or Missing) |
|---|---|---|
| Discovery | Ready to move to Scoping | Customer contact; site or why unknown; next activity; exit: discovery meeting held and both agree to explore (asked when you move) |
| Scoping | Ready to move to Quoting | Requirements and scope; estimating handover submitted; next activity; exit: customer accepts feasibility and concept (asked when you move) |
| Quoting | Ready to move to Negotiation | Quotation issued; next activity; exit: issued to and acknowledged by the decision-makers (asked when you move) |
| Negotiation | Ready to move to Closing | Latest revision issued; next activity; exit: alignment on final price, scope and terms (asked when you move) |
| Closing | Ready to record Won | Stage: Closing; accepted response, holds cleared; customer contact; next activity; order evidence (asked when you record Won) |

The bar is advisory. The server allows one stage forward or any stage back and checks none of these items. The derived checks read records the app already holds; combining them into the bar is a new read. A forward move asks for the exit-condition note (Q1) and shows the checks of the stage being left, read only (Q8).

### Header actions

| Viewer | Actions |
|---|---|
| The current owner, deal in Closing | Won (primary) and Lost |
| The current owner, earlier stage | "Move to <next stage>" (primary) and Lost |
| The current owner, after Won | Prepare receiving handover |
| Anyone who can only read the deal | None; "…" keeps Copy link |

### Tables

Every table on the page follows the record-page table style accepted on the project record page: a white card with a hairline border, a light-grey header row with small uppercase labels, rows with thin dividers, a two-line first cell (icon, title, detail), status tags, and a row "…" menu. Numeric columns are right-aligned and last.

## 6. Departures from today's page

| ID | Departure | Today |
|---|---|---|
| D1 | The shared record layout: one-row header, stage bar, readiness bar, 380 px details column, view tabs | A page header, key facts and a stage track over eight tabs |
| D2 | Seven views from the page contract; Activities and Tasks become one tab | Eight tabs |
| D3 | A stage bar with days in each stage; each stage is a button | Buttons without days |
| D4 | An advisory stage-exit readiness bar; a forward move asks for the exit condition and shows the checks of the stage being left | Not shown |
| D5 | Won and Lost header buttons open the outcome form preset (`DealDialog` already accepts a target outcome) | One "Record sales outcome" button |
| D6 | Change stage lists only the permitted moves and asks for a reason | A select of every stage and a fixed reason |
| D7 | A composer with Note, Activity, Email (writes and sends) and File | Add note and plan-next-action forms; no email or file |
| D8 | Focus, Linked work, and History with day groups, type filters and counts; field before-and-after values in Changes | Panels and one combined list |
| D9 | The outcome form compares the reviewed evidence with the current facts in a table | Lines of text |
| D10 | New reads: days per stage, deal age, days inactive, last activity, other open work, record position, history counts and groups, Linked work | Not shown |
| D11 | Phone: one record page with Details, Activity, Quotes, Emails and Files; Scope & sites and History open from Details | The desktop page stacked |
| D12 | The read-only, unavailable, stale, uncertain and refresh states use Record / Banner; the rotting flag from the Deals proposal is drawn but not adopted | Status paragraphs and the shared notices |

Proposed new data: deal notes (Q4), email sending from the deal (R9) and SharePoint file links on deals (Q5). Each needs its own decision and, where a technology is chosen, an ADR. SharePoint owns business documents; MYOB stays the ERP authority.

## 7. Not decided

- **Building the page.** The view tabs, the stage bar, the readiness bar, the dialogs and the new reads (D10) need their own decisions and pull requests. Today's read returns the deal, its actions, events, stages, outcome sources, source lead, handover-due record and transfers, but not the derived figures, the record position or the day groups.
- **The reason on a stage move and the exit-condition note.** The command already takes a reason. Asking for it, and for the exit note with an optional link, is part of building the page.
- **New data (D6 note above):** deal notes, email sending and file links.
- **Rotting (Q2).** A proposal until pipeline settings are versioned.
- **The Deals page.** The Deals proposal `549:2` is not yet accepted (PR #473 merged; owner acceptance pending). R11 changed its frames; its captures predate that.
- **Rolling out the shell.** As for the registers, the shell parts are decided separately for every page.
- **Not drawn yet:**
  - tablet 1024 (decided, Q7) and phone 320;
  - the phone Activity, Quotes, Emails and Files tabs, and the phone versions of the states;
  - the Transfer deal owner, Edit deal and Edit requirements and scope dialogs (today's are kept);
  - loading; a full email thread; file preview; send and upload failures;
  - the LC-16 receiving panels and LC-17 follow-up back to Sales, which open from Won-deal receiving.

## 8. Consequences

- No application code, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [opportunity detail register entry](../design/development/pages/route-sales-opportunities-id.md) now links this design and its captures. Its visual status stays "Needs review": the app does not yet match the design.
- The shared record layout now has four record types. The record-page table style from the project record page is confirmed as the table style for record pages.
- The Deals proposal page lost its probability figures (R11). When that page is accepted, its record and captures must reflect the change.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 9. Verification

- Claude checked every frame with screenshots taken inside Figma after each round, and at 2× and 3× in the final pass. The polish passes fixed: tables not in the shared table style; two overlapping readiness checks; dialog options overflowing their dialog; the activity Type control's selected fill not reaching its edges; the phone type buttons wrapping; a right-aligned amount running into a status tag; the phone action sheet's divider mid-list; and stage bar segments, option rows and header buttons on fractional pixels, which blurred their 1 px borders.
- An audit of the page found no prototype link to another page or to its own frame, no overlapping frames, and no horizontal overflow. All 216 dated weekdays were checked against the calendar.
- **Contrast:** every visible text pair meets WCAG AA. The lowest is 4.62:1 (grey text on the light-grey panels), the same pair as the earlier record pages. The only pair below AA is the shared top bar's decorative "/" separator.
- Claude cannot run Present mode through the connector, so the click-through was not exercised by Claude.
- The thirteen captures are copies of the accepted frames, made on the "Captures (icon-free)" page, with every Font Awesome icon swapped for `Icon/placeholder` and every prototype link removed. A check after the swap found none left. They were exported at scale 1 with the Figma connector, downloaded, and inspected. The hashes are in the [captures README](../reference/ui/crm/deal-record-page-design-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
