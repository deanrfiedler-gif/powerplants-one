---
document_id: PPO-CS07-ACCOUNT-DEVELOPMENT-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Account development and visit plan design — owner decision

On 23 October 2026 Dean asked Claude to design and build the "Account development and visit plan (CS-07)" page in Figma as a proposal for his review, drawing the page rather than stopping at a written brief. Claude drew it on 23–24 October from these sources:
- the CS-07 design register page [scope-cs-07](../design/development/pages/scope-cs-07.md) and the built page: `CsLanding` and `CsWorkspace` with kind `AccountPlan` in `src/components/cs-workspace.tsx`, its form in `src/components/cs-forms.tsx` and `PlanContent` in `src/shared/cs/model.ts`;
- the [Organisations design](organisations-figma-design.md) (Q1, D2, side menu and record layout), the [Calendar design](calendar-figma-design.md), the [Facilities design](facilities-figma-design.md) and the [CR-05 design](sales-aftercare-renewal-design.md) with its [receiving contract](../contracts/sales-aftercare-receiving.md);
- BP-01 for the parent requirement.

Dean then accepted the design: "Accept as recommended", answering "Do you accept the CS-07 design with D1–D12 and the recommended Q1–Q6?" That adopts D1–D12 and the recommended answers to Q1–Q6.

Dean then asked for an audit: "Give the pages an audit and polish" to find refinements, new features, ways to be more professional and gaps (section 6). Claude applied the corrections and recommended six additions. Dean answered "Draw the six", and after they were drawn, "Accept as recommended", answering "Do you accept the additions D13–D18 with the recommended Q7–Q11?" That adopts D13–D18 and the recommended answers to Q7–Q11. The named Figma version waits for Dean's explicit yes (section 7).

Scope:
- `scope:CS-07` "Account development and visit plan", with `route:/customers/[id]/development`. A register across customers is part of this design; its route is the proposed `/customers/development` (Q6).
- Parent requirement CRM-04 and parity item PAR-07 are unchanged. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, Calendar write, deal creation or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design CS-07 in Figma as a proposal | User decision, 23 October 2026 | Dean's brief, summarised above |
| Departures D1–D18 | Accepted as recommended, 31 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Segmentation | Resolved as recommended | The organisation's recorded sector (crop group) plus a recorded territory on the plan, both free text as built. No size, value or health bands and no score until a decision names a taxonomy and its owner |
| Q2 Minimum visit frequency per segment | Resolved as recommended | None now. Each plan records its own programme as the owner's choice with its basis; "No visit planned" and "Not booked in Calendar" make gaps visible. A frequency can come later only as a sourced rule with its ID and revision, as CR-05 requires for due dates |
| Q3 Meaningful activity | Resolved as recommended | The latest completed meeting, site visit or call with a logged outcome on the organisation, its sites or its people. Emails, notes and automatic events do not count |
| Q4 Plan ownership | Resolved as recommended | The account manager owns the plan. The service lead is a named contributor who can own objectives and actions and reviews submitted revisions (built states Draft, Submitted, Returned, Reviewed). Ownership never changes silently |
| Q5 The end-of-support climate computer | Resolved as recommended | The brief placed EQ-07's end-of-support climate computer at the Glasshouse 4 customer; the EQ-07 proposal draws it at SYN Northbank Nursery. Keep EQ-07's story: Hillview shows CC-4 as "Support status Unknown" with an objective to confirm support, and Northbank's register row shows "Support ending within 12 months" |
| Q6 Register route and model change | Resolved as recommended | A register route at `/customers/development` and structured objective and visit fields, as one later increment with its own migration, if a build is approved. No deal, forecast, score or visit cadence is added |
| Q7 Closing a commitment | Resolved as recommended | The person it belongs to or the plan owner, with the date and a basis. A customer's commitment is never closed automatically |
| Q8 Sources for Since the last visit | Resolved as recommended | Deals, Quotations, Service, Projects, People and logged activity, permitted records only. Finance stays out unless the viewer holds Finance access |
| Q9 An offline outcome on a phone | Resolved as recommended | It stays until sent, then is removed. How long statements are retained overall remains open in the CR-05 contract |
| Q10 Reviewing one's own revision | Resolved as recommended | Not allowed. Another named person reviews |
| Q11 Quarterly account review on Organisations | Resolved as recommended | Organisations lists "Quarterly account review · Tue 27 Oct"; this page keeps the Q4 visit on Wed 21 Oct, and Organisations is corrected at its next amendment |
| Audit and six additions | User decisions, 31 October 2026 | Quoted above. Sections 4 and 6 |
| Accept the design, then the additions | User decisions, 31 October 2026 | Quoted above |
| Named Figma version | Waiting for Dean's explicit yes | Proposed title "Account development — accepted". Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Account development · CS-07" `2302:786940`, under "— Shared records —", after Organisations · CS-01. The page header `2302:786941` holds the conformance declaration; the notes card `2324:796006` is in Flows and notes. File index row "Row / Account development · CS-07" `2836:21834`, after the Organisations row |
| Desktop 1440 | Register: My accounts `2302:787009`, By segment `2318:3381`, No plan `2318:4522`, Visits this month `2858:13724`, Objectives overdue `2858:14418`. Hillview Growers record, full length (1440 × 2829) `2302:787108`; Plan a visit `2310:791945`; Objective detail `2310:792417`; Record visit outcome `2315:10166`; Start a plan `2866:19014`; Submit revision `2866:19127`; Review revision `2866:19659` |
| Tablet 1024 | Register with the side menu collapsed `2302:787251` |
| Phone 390 and 320 | Before the visit, record summary, at 390 `2302:787333` and 320 `2302:787400`; People to meet `2320:3764`; Record visit outcome at 390 `2320:3838` and 320 `2320:3932`, all full length. No signal: outcome `2866:20370`, waiting to send `2866:20514`, kept not sent `2866:20570` |
| States | Phone 390: loading `2302:787467`; could not load `2302:787538`. Desktop: nothing matches `2322:3610`; read only `2322:4004`; no plan yet `2322:4669`; Date needed `2322:5139`; context source out of date `2322:5667`; visit not yet booked in Calendar `2322:6176` |
| Page parts | No new components. The account grid row and group band, Objective row, Statement with basis and side form panel are frames on this page |
| Prototype | Flows "CS-07 — desktop" (register row to record; side menu views; Plan a visit; objective detail; Q4 review row to Record visit outcome; "…" to Submit and Review; a No plan row to Start a plan) and "CS-07 — phone" (record summary to People to meet and back; Record visit outcome and the no-signal frames) |
| Story | Synthetic. Desktop as at Tue 13 Oct 2026, 09:00 AEST, signed in as Jamie Park, account manager and relationship owner of Hillview Growers (`SYN-PPO-ORG-000007`); service lead Jordan Kim. People as on Stakeholders CS-03: Priya Shah, Aroha Ngata, Graham Holt and Noah Clarke. Objectives "Extend climate screens to Glasshouse 5 in 2027" (`SYN-OBJ-000011`), "Train the grower's two new staff on CP-4" (`SYN-OBJ-000012`, Date needed) and "Confirm CC-4 support before Glasshouse 5 design" (`SYN-OBJ-000013`). A quarterly programme (`SYN-VIS-000021` to `-000024`) with the next visit on Wed 21 Oct, booked. Deal stages as on Organisations: `SYN-PPO-OPP-000097` Won, `-000118` Proposal, `-000131` Qualification. From Sales aftercare: site walk `SYN-ACR-000905`, training `SYN-TRN-000702`, discussion `SYN-CSG-000602`. Service visit `SYN-APT-000188` and a work window are synthetic, for the site conflict. New references `SYN-ADP-000002` to `-000006`, `SYN-OBJ-000010` to `-000014`, `SYN-CMT-000021` to `-000024` and `SYN-ACT-000140` to `-000145`. No plan: SYN Greenhouse Growers |
| Retained captures | [Account development design r01](../reference/ui/customers/account-development-design-r01/README.md): twenty-eight icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CS-07` and `route:/customers/[id]/development`; a register across customers is proposed (D1). Parent requirement CRM-04 and parity item PAR-07, unchanged |
| Page type (r20) | Planning workspace for the customer record, as the register entry declares. Supporting types: Register or worklist (register), Record detail (objective), Form or guided workflow (Plan a visit, Record visit outcome) |
| Reused components | The Organisations shell (Rail with More selected, the top bar with the Conversations action, side menu); Grid / Header cell, Cell, Checkbox and row actions; Record / Header, Readiness bar and Check item, Field, Section heading, View tab and Banner; Tag; Button; Shell / Phone header · compact |
| Incoming handovers | Organisations CS-01 (Account development action; Related menu); Customer 360 and Sites CS-04; Facilities CS-05 and Equipment EQ-01 and EQ-07 (crops, areas, installed equipment, support status; read only); People CS-02 (people to meet); Deals (stage; read only); Calendar EC-03 (booking status); Sales aftercare CR-05 (event follow-up, training, discussions; read only); My Work (activities) |
| Outgoing handovers | Plan a visit to Calendar EC-03 with site, time, purpose and people filled in; Raise in Deals to Deals with the customer and objective filled in; next actions to My Work; Add them in People to People CS-02; corrections to Facilities and Equipment; Open in Sales aftercare to CR-05. It reads Scheduling and Access & readiness for site conflicts and Sites for Before you go. It sends no invitation, creates no appointment or deal, and edits no customer, site, equipment or person |
| Source authority | The CS-07 design register page; `src/components/cs-workspace.tsx`, `src/components/cs-forms.tsx`, `src/shared/cs/model.ts`; the accepted and proposed designs named above; BP-01 CRM-04 |
| Proposed departures | D1–D18 in section 4, accepted |
| Status | Owner-accepted design, 31 October 2026 |
| Decision record | This file |
| Named version | Waiting for Dean's explicit yes |

## 4. What the design shows

### Departures, accepted

| ID | Departure | Basis |
|---|---|---|
| D1 | A register across customers: plan state, owner, objectives open, next visit, last meaningful activity, Calendar status, objectives overdue, equipment support, recorded segment and territory, next review and plan reference. Accounts with no plan stay visible as "No plan" | Dean's brief; the built page has only the per-customer route |
| D2 | The Organisations side menu is kept. Account development under Related expands into All accounts, My accounts, No plan, Visits this month, Objectives overdue and By segment | CS-01 D2 |
| D3 | Accepted grid cells with fixed checkbox and settings columns. By segment groups by recorded sector, and each band runs across the fixed columns in its group's colour | Organisations grid; Dean's grid band rule of 19 October |
| D4 | The shared record layout: header with plan state, revision, owner and reviewer; a "Context for this plan" bar stating each source in words; a column with Relationship, Horticultural context (read only) and People to meet; tabs Overview, Objectives, Visits, Next actions, Opportunities, Reviews & history | CS-01 D3. Built tabs: Account context, Relationship objectives, Planned visits, Next actions, Reviews & history |
| D5 | Objectives as structured records: owner, target date with its basis or "Date needed", dated evidence each with its basis, and status in words. No percentage, score or likelihood | Dean's brief; CR-05 due-date rule. The built plan holds objectives in one free-text field |
| D6 | Each planned visit records purpose, site, people to meet and objectives covered. Calendar status is read from Calendar: Not booked, Booked, Held · outcome needed, Outcome recorded. Plan a visit hands over to Calendar | scope-cs-07; EC-03 never sends invitations |
| D7 | Record visit outcome: notes, statements each with a required basis (Quoted, Paraphrased, Internal interpretation), objective updates, next actions created in My Work and an opportunity handover to Deals | Dean's brief; CR-05 `feedback_basis` |
| D8 | Opportunities raised from objectives, with their stage as Deals holds it, plus other open deals named but not linked. Raise in Deals opens Deals filled in; this page never creates a deal, forecast or stage | Dean's brief; CRM owns opportunity creation |
| D9 | Last meaningful activity is defined on screen in the register and the record | Q3 |
| D10 | Phone car-park views: compact Record header, record summary, People to meet with Text and Call, and a full-screen outcome form with 16 px inputs, 48 px actions and the basis as large choices. No tab bar on records | Phone header amendment |
| D11 | Two story times: desktop as at Tue 13 Oct 2026, 09:00 AEST; the car-park phone frames and both outcome frames as at Wed 21 Oct, labelled on each frame | The 21 October visit and its outcome cannot both fit one time |
| D12 | The rail, top bar and side menu are copied from Organisations, as briefed, with Jamie Park signed in. A Sales user would see the Sales rail with More selected; that is not redrawn | Dean's brief |
| D13 | Before you go at the top of the phone summary: address with Maps, gate and parking, biosecurity and the user's own induction. Access details never establish readiness or authority | Sites CS-04; Access & readiness CS-06 |
| D14 | An outcome without signal: draft kept on the phone, Waiting to send, what needs signal, and "Kept, not sent" when someone changed the same field meanwhile, with nothing overwritten | My jobs and Customer response offline wording |
| D15 | Start a plan, Submit revision and Review revision as side forms over the built states, with the built required reason. Returning needs a note; reviewing grants no commercial approval | Built `state` and `revision`; Q4 and Q10 |
| D16 | Since the last visit: a dated list of changes across permitted sources on the record, shortened on the phone. It is not a rating, and restricted sources are left out rather than counted as nothing | CS-01 D4; Q8 |
| D17 | Commitments: what each side said it would do, with basis, owner and a date or Date needed; Open, Kept or Not kept. Recorded in the visit outcome and carried to the next visit. No score | CR-05 statement basis; Q7 |
| D18 | At this site that day in Plan a visit: booked service visits and recorded work windows, and whether they overlap. It changes neither | Scheduling owns bookings; CS-06 owns windows |

## 5. Not decided and not drawn

- **Building the page.** The built route keeps its native treatment. The build order is not decided.
- **Prerequisites for a build**, none adopted by this decision:
  - a register read and the proposed route (Q6);
  - structured objectives with owners, dates, date basis, evidence and status, replacing one free-text field;
  - visit fields for people to meet and objectives covered, and a read of Calendar status from linked meetings;
  - statements with basis on a visit outcome;
  - a read of deal stage for linked opportunities, and the prefilled handovers to Calendar and Deals;
  - a definition-backed read of last meaningful activity (Q3);
  - a commitments record, a read of changes since the last visit, and reads of service bookings, work windows and site access for this page;
  - an offline draft store and send queue for visit outcomes (Q9);
  - a rule preventing a plan owner reviewing their own revision (Q10).
- **Pages that do not yet match this page:** Organisations lists "Quarterly account review · Tue 27 Oct" (Q11) and has no view of plan state. Two Stakeholders items are not shown here: P. Shah, a possible duplicate, and Marcus Webb, who has left, appears only in Since the last visit.
- **Glasshouse 4 customer:** other proposals place Glasshouse 4 climate screens at SYN Riverbend Growers. This page follows accepted CS-01 and CR-05, with SYN Glasshouse 4 at Hillview Growers.
- **Not drawn:** the tablet record view; editing an objective; a returned revision; closing a commitment on its own; nearby accounts, a voice-note draft, a post-visit customer summary, register bulk actions and owner transfer, which the audit listed for later; the History tab at full size; hover and focus states; 200% zoom; the Sales rail variant.
- **Data in the frames:** the organisations, sites, people, phone numbers and records are synthetic. They are not operational records.

## 6. Audit and polish

Before presenting the proposal Claude checked every frame for clipped text, leftover Organisations wording and fonts, and agreed the shared story by message with the sessions drawing CR-05 and EQ-07. Corrected then: table widths and two long cells; the Date needed popover, moved inside its frame; a long context label; and the inherited record actions menu, rewritten for this page.

At lock-in the capture check found that Grid / Cell's default "v1" suffix showed beside references. It was cleared on all 678 cells of the accepted frames and their copies.

Dean's later audit corrected: the nothing-matches state, which contradicted Block C's overdue objective; the Opportunities and action counts; a deal Owner column whose values Claude had not confirmed for every deal; and the outcome frame still saying CP-4 was planned. It added attendees and objectives on each visit, as the brief asked; Graham Holt and Aroha Ngata from Stakeholders; the second site; the achieved objective; Who attended on the phone; the two remaining register views; 48 px phone link targets; the register note directly under the grid; centred full-width phone buttons; and full-length phone frames.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma, and measured every truncated single-line text against its rendered width; none is clipped after the corrections above. A programmatic check found no overlaps and nothing outside its section. Roboto is the only text family apart from the shared Roboto Mono references.
- The twenty-eight captures are copies on the "Captures (icon-free)" page, from y = 650,000 (`2866:49538`–`2866:61494`). Hidden overlays, prototype links and flow starting points were removed, and each of the 832 Font Awesome icon instances was swapped for `Icon/placeholder`. A scan found no Font Awesome instance, no visible vector outside a placeholder or the logo, and no prototype link left. The images were exported at scale 1 with the Figma connector. Hashes are in the [captures README](../reference/ui/customers/account-development-design-r01/README.md).
- The named Figma version "Account development — accepted" is not saved yet; it needs Dean's explicit yes. This pull request stays in draft until then.
- Claude did not play the flows in Present mode.
- Nothing new is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
