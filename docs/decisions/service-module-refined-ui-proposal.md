---
document_id: PPO-SERVICE-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal, 10 November 2026; design acceptance is Dean's and has not been given; no named version is saved yet; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, MYOB endpoint, Customer messages send or deployment; every record shown is synthetic
source_commit: 2d9a8ff24b158f41eb34e438af4fbec7ea224f13
versioning: git
---

# Service module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposal. Sections 1 to 8 are the proposal record. Later sections will record the audit, Dean's acceptance, any further batches and the named versions exactly as the [Sales record](sales-module-refined-ui-proposal.md) does.

On 10 November 2026 Dean asked for the refined UI pages of the Powerplants One Service module (the "Service operations" workspace, rail label "Service") to be built in Figma from a written brief and its Addendum A3 (persona and story reconciliation), inside the accepted shell and to at least the standard of the Sales module file. The brief names the new private file "PPO - Service module (proposal)" as the target. The link Dean sent opened his "PPO - Settings module" file, which already holds Settings pages; the Service pages were built in the file the brief names and the Settings file was only read, as the source of the page kit. His standing instruction applies: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The ten questions in the brief were therefore answered by their stated defaults; each is recorded in section 5 and can be reversed.

This record is a **proposal**. It describes what was drawn, the rules applied, the assumptions made and the questions that remain. It changes no code, test, migration, seed, permission or route, and it authorises no business transaction, MYOB integration, manufacturer contact or customer communication. Four statements stay separate throughout: code delivery (none), design acceptance (Dean's, not given), production readiness (not inferred) and integration with MYOB, Customer messages, Supply, Engineering, Projects or a manufacturer (none exists, none authorised).

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026), pages "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked (accepted 8 November 2026)" | Chrome and geometry: 48 px top bar with global search, 80 px collapsed rail, 48 px right strip, content from x 80 to 1392, the 280 px docked workspace menu, the collapsed strip, the 1024 top bar (332 / 360 / 332), the Service operations flyout and docked menus with their nested views, the record header toolbar (Addendum A1) and sheet Z, the technician's sparse rail |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | Conventions mirrored: the page template, sheet labels, the page kit (chip, button, avatar, checkbox, filter chip, tab, KPI tile), the phone header and tab bar pattern |
| Private Figma file "PPO - Settings module" | Read only: the source of the copied kit, chrome and helper library (A2) |
| Private Figma file "PPO - Design", the accepted and proposed Service pages | Rules, stories and vocabulary of the 23 reference pages and their notes cards |
| [BP-01](../blueprints/BP-01-master-blueprint.md) section 13 and [BP-07 Service operations](../blueprints/BP-07-service-operations.md) | Parents SVC-01 to SVC-12; transitions TR-01 to TR-16; business rules SR-01 to SR-20; the offline matrix; cross-module rules BR-09 to BR-16, BR-23 and BR-24. No parent requirement ID is added or renamed; all 78 remain |
| Service page decisions: [requests](service-requests-figma-design.md) (PPO-SV01-REQUESTS-FIGMA-DEC), [request capture and triage](service-request-capture-and-triage.md), [requests refinement](service-requests-native-refinement.md), [work orders](work-orders-design.md) (PPO-SVC-WORK-ORDERS-DESIGN-DEC), [work order record](work-order-record-page-design.md) (PPO-SVC-WO-RECORD-DESIGN-DEC), [work order register](work-order-register-backend.md), [job pack](job-pack-figma-design.md) (PPO-SVC-JOB-PACK-FIGMA-DESIGN-DEC), [job pack design](job-pack-design.md), [job pack integration](job-pack-integration.md), [field readiness gate](field-readiness-gate-proposal.md) (PPO-SVC-FIELD-READINESS-GATE-PROP), [planner](service-planner-figma-design.md) (PPO-PL01-PLANNER-FIGMA-DEC), [changes and follow-up](changes-follow-up-figma-design.md) (PPO-PL04-CHANGES-FOLLOW-UP-FIGMA-DEC), [travel review](travel-review-figma-design.md) (PPO-PL05-TRAVEL-REVIEW-FIGMA-DEC), [capacity review](capacity-review-figma-design.md) (PPO-PL03-CAPACITY-REVIEW-FIGMA-DEC), [appointment detail](appointment-detail-figma-design.md) (PPO-SV04-APPOINTMENT-FIGMA-DEC), [field team](field-team-figma-design.md) (PPO-PL02-FIELD-TEAM-FIGMA-DEC), [field technicians](field-technicians-design.md) | Accepted page decisions carried into the redrawn pages |
| Field decisions: [My jobs](my-jobs-figma-design.md) (PPO-FI01-MYJOBS-FIGMA-DEC), [field work timer](field-work-timer-design.md), [native timer](field-timer-native.md), [closed visit guidance](field-closed-visit-guidance.md), [field readiness](field-readiness-native.md), [time and labour review](time-labour-review-figma-design.md) (PPO-FI01-TIME-REVIEW-FIGMA-DEC), [inspections](inspections-figma-design.md) (PPO-FI03-FI04-INSPECTIONS-FIGMA-DEC), [service inspections](service-inspections.md), [reading instruments](inspections-reading-instruments.md) (PPO-INSPECTIONS-READING-INSTRUMENTS-DEC), [incidents](incidents-figma-design.md) (PPO-FI06-INCIDENTS-FIGMA-DEC), [field incidents](field-incidents.md), [site readiness](site-readiness-figma-design.md) (PPO-FI05-SITE-READINESS-FIGMA-DEC), [site access readiness](site-access-readiness-design.md) | As above |
| Review and aftercare decisions: [service review](service-review-figma-design.md) (PPO-SV06-REVIEW-FIGMA-DEC), [reports workspace](service-review-reports-workspace-design.md) (PPO-SVC-REVIEW-DES), [customer response](customer-response-figma-design.md) (PPO-FI07-CUSTOMER-RESPONSE-FIGMA-DEC), [field customer response](field-customer-response.md), [findings](findings-figma-design.md) (PPO-SV07-FINDINGS-FIGMA-DEC), [findings backend](service-findings-backend.md), [escalations](escalations-figma-design.md) (PPO-SV08-ESCALATIONS-FIGMA-DEC), [native escalations](service-escalations-native.md) (PPO-SV08-NATIVE-DEC), [service performance](service-performance-figma-design.md) (PPO-RP04-SERVICE-PERFORMANCE-FIGMA-DEC), [maintenance and warranty native](maintenance-warranty-native.md), [TS-02 decisions](maintenance-service-ts02-decisions.md) (PPO-MAINTENANCE-TS02-DEC), [agreements and maintenance](service-agreements-maintenance-design.md) (PPO-MA-WORKSPACE-DES), [warranty customer resolution](warranty-customer-resolution-design.md) (PPO-WAR-WORKSPACE-DES), [project delivery billing](project-delivery-billing.md) (PPO-PROJECT-DELIVERY-BILLING-DEC), [won delivery continuity](won-delivery-continuity.md), [Sales aftercare](sales-aftercare-figma-design.md) (PPO-CR05-SALES-AFTERCARE-FIGMA-DEC) | As above |
| [PPO workspace, MYOB book of record](ppo-workspace-myob-book-of-record.md) (PPO-ERP-OPERATING-MODEL-DEC), contracts `field-customer-response`, `finance-handoff`, `supply-chain-readiness`, `lead-to-delivery-continuity`, `sales-aftercare-receiving`, `quotation-conversion`, `myob-integration-blueprint` | Finance owns charging; MYOB is the book of record; one work order per handoff; parts readiness from linked demands |
| [Readable reference namespaces](readable-reference-namespaces.md) (PPO-REFERENCE-NAMESPACES-DEC) and Addendum A2 to the brief | Reference form `SYN-<TYPE>-<NUMBER>`; service requests stay TKT and work orders stay WO |
| [PPO-STD-001](../standards/naming-conventions.md), [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [HTML module conformance](../standards/html-module-conformance.md), [named-version build handoff](figma-named-version-build-handoff.md) (PPO-FIGMA-NAMED-VERSION-HANDOFF-DEC), [design, build and review roles](design-build-review-roles.md) | Naming, page order, the nine-field declaration, r20 page types, and the rule that a named version pins a build basis |
| `src/shell/navigation.ts`, `src/components/product-navigation.tsx`, `src/platform/permissions.ts`, `db/migrations/` 0001 to 0124 as listed in the brief | The rail order and destinations, the nested views, the lifecycles in the schema and the Service capabilities; read only |

The files' links and keys are not recorded in this public repository ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

### 2.1 The module

| Field | Declaration |
|---|---|
| Scope identity | The Service operations workspace: `scope:SV-01` to `scope:SV-08`, `scope:PL-01` to `scope:PL-05`, `scope:FI-01` (with the proposed time review), `scope:FI-02` to `scope:FI-07`, `scope:MA-01` to `scope:MA-07` and the Service extract of `scope:RP-04`, under parents SVC-01 to SVC-12. Routes are listed per scope in 2.2. No scope ID or parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist; Record detail; Overview / dashboard (Service Pulse, Capacity review, the Service extract of Insights, the settings hub); Form / guided workflow as 432 px right panels, centred dialogs and full-screen phone sheets; Review / comparison (Policy impact, Changed since you acknowledged, Correct or clarify, Propose successor, propose, review and publish); the planner board; states; tablet and phone variants. Per scope in 2.2 |
| Reused components | Local copies of the accepted shell under the same names: Shell / Top bar, Shell / Rail · collapsed (a Current = Service variant added), Shell / Right rail · collapsed, Shell / Workspace menu · docked (Service operations, with nested views), Shell / Workspace menu · collapsed strip, the 1024 top bar, Shell / Record header · toolbar and its phone variant (Addendum A1); 101 shell icon components (Lucide stand-ins for Font Awesome Light) and the brand mark; the "PPO colour" variable collection (66 variables, same names as the Shell and Sales files); the Sales page kit under its Sales names. New in this file and proposed: the coordinator and technician phone tab bars; drawn parts for the checks bar, gate bar, planner board, timer dock, reading row, requirement row, condition card, offline bar, evidence tiles, response card and signals strip |
| Source authority | Dean's brief and its decisions D1 to D13 as amended by Addendum A3; the accepted Service page decisions in section 1; the Maintenance and warranty proposals as design direction, not accepted; this file's compositions as proposals. The fixture is fictional and synthetic: as at Thursday 5 November 2026, 09:00 AEDT, signed in as service coordinator Ravi Kumar, phone sheets as Casey Ward unless the sheet names another person |
| Incoming handover | Per scope in 2.2. Arriving on a page creates no business record |
| Outgoing handover | Per scope in 2.2. Nothing drawn books a visit from a request, authorises work from a coverage decision, releases a hold without its criterion, sends anything to a customer or a manufacturer, posts to MYOB or shows an amount outside a labelled Finance figure. "Issuing sends nothing" appears on every issue form; Customer messages (EC-04) is named wherever anything reaches a customer |
| Exceptions and recovery | Drawn per page (section 3) and on the cross-cutting states: loading permitted evidence, true-empty, filtered-empty, could not load with the last good read kept, denied or not found, stale (a newer save by someone else), partial source, outcome unknown with recovery, read only, bulk action partly failed, permission changed while open, offline per-item states. A count that cannot be read shows a dash and an unavailable or restricted source is never zero |
| Departures | Section 5 |
| Verification | Section 6 |

### 2.2 Per scope

Lifecycles are independent and nothing advances another by itself (SR-04). Dispatch is gated on the exact issued pack, its acknowledgement by the required crew and allowed readiness (SR-07). Review, issue and response are separate and issuing sends nothing (TR-13). Coverage, billability, warranty claim and supplier credit are four decisions by their owners (SR-18). Finance owns charging and MYOB is the book of record.

| Scope and route | Page types | Owns | Incoming handover | Outgoing handover |
|---|---|---|---|---|
| SV-01, SV-02 Service requests, `/service/tickets` | Register; Record detail; Form | The request, its statements and triage. Triage authorises no work and books no visit (TR-01) | Phone, email, manual and portal requests (CP-02); planned maintenance work requests (MA-04); aftercare referrals (CR-05) | A triaged request to a work order (SV-03); clarifications as owned follow-ups to My Work; a Sales lead through Hand to Sales |
| SV-03 Work orders, `/service/work-orders` | Register; Record detail; Form | Scope revisions and their authorisation. Authorisation freezes a revision, records the authoriser and books nothing (TR-02) | Triaged requests (SV-01); warranty remedies (MA-06); occurrences (MA-04); won deals and conversions (CR-03, ES-07); coverage decisions (MA-02) | Authorised scope to planning (PL-01) and packs (SV-05); work-order demand to Supply (SC-01); the handoff to Finance through review (FN-01) |
| PL-01, PL-03, PL-04, PL-05 Schedule, `/schedule` with Capacity review, Changes & follow-up, Policy impact and Travel review | Planner board; Register; Review / comparison; Overview | Bookings: a confirmed booking reserves the whole crew atomically and dispatch stays gated (TR-03); a move is a new confirmed version (TR-08) | Authorised work orders; schedule change requests from Projects (PJ-07, BR-09); impact reviews from Supply (SC-09) | Bookings to Appointment detail and My jobs; decisions on change requests to Projects; customer contact outcomes; scheduling policy versions with their impact |
| SV-04 Appointment detail, `/service/appointments/[id]` | Record detail | The visit's dispatch gate in words: parts, job pack acknowledged, site readiness, site and isolation controls, crew competency | Parts-ready from linked demands (SC-01, SC-10); the issued pack (SV-05); site readiness (FI-05); competence (PL-02) | Dispatch to My jobs; "Dispatch held until …" with its exact criterion |
| PL-02 Field team, `/service/technicians` | Register; Record detail; Panel | Availability and competence evidence for planning | Skill evidence and availability blocks | Competence to the dispatch gate; evidence reviews to My Work |
| SV-05 Job packs, `/service/packs` | Register; Record detail; Form | The pack and the field readiness gate: prepare, check and issue by different people where policy says so (TR-04, TR-05) | Authorised scope; readiness requirements (FI-05); outputs from DK-06 | The issued pack to the crew; acknowledgements and returns (TR-06); OUT-09 output to DK-03 |
| SV-06, FI-07, SV-07, SV-08 Service review, `/service/reports`, `/service/findings`, `/service/escalations` | Register; Record detail; Review; Form | Report review and issue (the author never reviews); the customer response (FI-07); findings by their source record; escalation cases | Submitted visits (TR-11); inspection outcomes (FI-04); responses by link | The issued report revision to Customer messages for sending (EC-04 owns sending); the Finance handoff on approval (FN-01); next actions to My Work; evidence packs a named person sends |
| FI-01 time review, proposed `/service/time` | Register; Record detail (day timeline); Form | Review of recorded time: planned, recorded, reviewed and billable are four rows; recorded time is never edited in place | Timer segments from the phone | Reviewed hours attached to the work order's handoff, which reaches Finance when the report is approved; no rate or amount |
| FI-01, FI-02, FI-05 My jobs, `/my-jobs` and Field site readiness | Phone register; Record detail (Work, Capture, Pack, Finish); full-screen sheets; Review (proposed coordinator site readiness review) | Capture, the timer and acknowledgements by the technician | Dispatched visits; the issued pack; readiness requirements by revision | Atomic submission with time and parts declarations (TR-11); equipment history to EQ-01; parts used to SC-10 |
| FI-03, FI-04 Inspections, `/my-jobs/inspections`, `/service/inspections` | Phone form; Register; Record detail | Attempts, readings with instrument and calibration at use, independent review and the outcome (the fixer never reviews the retest) | Templates and bindings (0055, shared with EN-08); instruments (EQ-09) | Defects to findings; the outcome, which sends nothing |
| FI-06 Incidents and actions, `/service/incidents` | Register; Record detail; Panel; phone form | Reports, triage, holds, corrective actions and closure; only closure releases a hold | Reports from the phone; Critical defects that prompt an incident (PJ-01) | Holds on exact scope to work orders and bookings; corrective actions to My Work; the prepared internal outcome |
| MA-01, MA-02, MA-05 Service agreements, `/maintenance/agreements`, Coverage & entitlement, Renewals & relationship review | Register; Record detail; Form | Agreement revisions, coverage decisions and renewal reviews. Covered authorises nothing | Commissioning obligations (EN-08); the signed contract (DK-01) | Coverage decisions to the work order owner and to Finance; the AgreementCharge handoff; renewal handovers to Sales |
| MA-03, MA-04 Maintenance, `/maintenance/due`, Maintenance plans | Register; Record detail; Review | Plans by revision, occurrences and their generation | Equipment and bulletins (EQ-01, EQ-06) | One owned service request per prepared occurrence (SV-01) |
| MA-06, MA-07 Warranty, `/warranty/cases`, Supplier recovery | Register; Record detail; Form | Cases, entitlement and remedy (proposed by the owner, approved by the named approver) and supplier claims | Bench results (CX-02); technician findings; credit notes observed in MYOB | The customer outcome prepared for EC-04; the supplier claim; a customer credit note request as a finished event; Finance decides goodwill and the credit |
| RP-04 Insights, Service extract | Overview | Nothing: Reporting owns the definitions | Facts already recorded in Service | Every count opens the rows on the page that owns them; "Definition pending" until a measure is published |
| Interaction states and Administration · SV | States; Settings; Review | The rules and lists Service reads its records by | Proposals from an administrator | Published versions with their impact on live visits and packs |

Ownership: SV-03 owns scope authorisation; PL-01 owns bookings, which Projects request; SV-05 owns the pack and the gate; FI-01 owns capture and the timer; SV-06 owns review and issue while Finance owns the handoff; FI-07 owns the response while EC-04 owns sending; MA-02 owns coverage while Finance owns the charge; MA-06 owns entitlement and remedy while Finance owns goodwill and credit and SC-08 owns the goods; EQ-01 owns the installed base.

## 3. Sheet inventory

The build is in progress and follows the brief's two halves. The first half is drawn: My jobs, Job packs, Appointment detail, Schedule, Work orders, Service requests, Inspections, and Incidents and actions. The second half follows: Service review, Time and labour review, Service agreements, Maintenance, Warranty, Insights, Field team, the Service flyout, Interaction states and Administration. The full inventory, with every sheet's code, view, size and node ID, is recorded here when the build is complete; until then this section lists the pages.

| Page | Node | State |
|---|---|---|
| Read me (header, "Sheet index and notes", audit and page template cards) | `0:1` | Cards to be completed with the inventory |
| — Accepted — and — Proposals — (separators, empty) | `11:2`, `11:3` | Empty |
| Service requests · SV-01 · SV-02 | `11:4` | Drawn |
| Work orders · SV-03 | `11:5` | Drawn |
| Schedule · PL-01 · PL-03 · PL-04 · PL-05 | `11:6` | Drawn |
| Appointment detail · SV-04 | `11:7` | Drawn |
| Field team · PL-02 | `11:8` | To draw |
| Job packs · SV-05 | `11:9` | Drawn |
| Service review · SV-06 · FI-07 · SV-07 · SV-08 | `11:10` | To draw |
| Time and labour review · FI-01 | `11:11` | To draw |
| My jobs · FI-01 · FI-02 · FI-05 | `11:12` | Drawn |
| Inspections · FI-03 · FI-04 | `11:13` | Drawn |
| Incidents and actions · FI-06 | `11:14` | Drawn |
| Service agreements · MA-01 · MA-02 · MA-05 | `11:15` | To draw |
| Maintenance · MA-03 · MA-04 | `11:16` | To draw |
| Warranty · MA-06 · MA-07 | `11:17` | To draw |
| Insights · RP-04 | `11:18` | To draw |
| Interaction states · SV | `11:19` | To draw |
| Administration · SV | `11:20` | To draw |
| Shell and kit (local copies until PPO - Library: shell components, icons, page kit, chrome, record header toolbar, workspace menus, the hidden helper library) | `11:21` | In place |
| Scratch | `11:22` | Empty |

## 4. Rules applied

- **Shell geometry and tokens.** Every desktop sheet instances the copied top bar, rail (Current = Service), right strip and either the docked Service operations menu with the current page and nested view, or the collapsed strip where the page needs the width (the planner, Capacity review, the time register) and on technician desktops. Content runs from x 80 to 1392; panels are 432 px at x 960 without a scrim; dialogs are 560 to 720 px over a 32 % navy scrim; Roboto 11 to 20 px; colours bound to the "PPO colour" variables.
- **One line per cell; no second search.** Register cells never wrap; the table scrolls sideways with frozen first columns and row menu. No search box appears in a page's content area; Find stays in the menus.
- **Page template.** Read me with four cards; separators; one page per scope area in rail order; six sections per page in the same order with 360 px gaps; desktop and dialog sheets at x 60, 1660, 3260 in rows 1060 apart, tablets at x 60, 1144, 2228, 3312 in rows 840 apart, phones at a 450 px pitch in rows 944 apart, full-length sheets on their own row; every sheet labelled 26 px above it as `CODE · Page — state (scope ID) [source]`.
- **Checks bars and gates.** Each record opens with its scope's checks bar (Before triage; Readiness n of 5; Dispatch gate; Before issue; Before outcome; Before closure; Case checks; the four time rows), each fact a chip with its rule and "why this" on derived states. Gate sentences name their exact criterion ("Dispatch held until …"); never "safe", "cleared", "compliant" or "ready to work".
- **Independence.** The person who cannot act sees the primary disabled with the reason (Addendum A1 rule R117): the drafter cannot authorise; the preparer cannot check; the author cannot review; the fixer cannot review the retest; the action owner cannot accept its evidence; the entitlement proposer cannot approve.
- **Phone first and offline.** Technician sheets at 390 and 320 with 16 px inputs, 48 px options and 56 px timer dock buttons; the connection state in words when it is not "Connected"; per-item Sending, Waiting for signal or Needs attention; a refused item kept with its reason; online-only actions say so before the attempt; no hash, receipt ID, UUID or sync jargon on a technician screen.
- **Content.** Counts state their rule; a dash when unreadable; every state a word with its chip tone; readings with value, unit, instrument and calibration; time segments with kind and duration; dates as "Thu 5 Nov 2026" with the site's time zone where it differs; no amount, rate or cost except Finance figures read back and labelled.

## 5. Assumptions and proposed departures

Each item is for Dean's decision. The working numbers A1 to A25 are those written on the sheets' notes cards; A26 onwards record the items the brief asks to be listed.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | The pages were built in "PPO - Service module (proposal)", the file the brief names. The link Dean sent opened "PPO - Settings module" (Settings pages in progress), which was only read. The design-to-build standard names the domain file "PPO - Service & Field"; the file's name is Dean's | Keep; rename only if Dean wishes |
| A2 | No published PPO library exists, so the shell components, kit, chrome and helper library were rebuilt in this file from the Settings file's copies under the same names. The collapsed strip copied is the accepted component as found, 12 px wide, not the 80 px the brief states | Swap to the published library on publication; confirm the strip width against the Shell file |
| A3 | Docked menu: Time & labour review added as a proposed page (17 pages), an Insights group, a clipped scroll region and the proposed Site readiness review view | Keep as proposed |
| A4 | Technician desktop sheets use the collapsed strip (the sparse technician rail, Shell sheet Z), not the coordinator's docked menu | Keep |
| A5 | Instruments: SYN-MEG-002 valid to Fri 30 Apr 2027 (Addendum A3 over the brief's Fri 29 Jan 2027); SYN-CLP-004 van 1 clamp meter expired Sat 31 Oct and flagged; SYN-CLP-006 renewed Tue 3 Nov is the calibrated alternative | Keep |
| A6 | Kim Taylor's timer: started Wed 4 Nov 16:05 at Westgate, finish set to 17:10 "forgot to stop", noticed Thu 07:42, flagged at 12 h; "Another job is timing" at Thu 07:50; the outside-hours exception moved to Tue 3 Nov 18:20 to 19:05 at Glasshouse Valley so one person never has two timers | Keep |
| A7 | Hillview visit timings: start 12:58; Travel pause collecting parts 13:41 to 14:02; stop 15:52 (labour 2 h 33); submit 15:56; no signal from 15:04; isolation approval recorded 11:20 | Keep |
| A8 | Glasshouse 4 readiness has six requirements (induction r2, heights r3, biosecurity r4, isolation approval r1 visit-specific, lock-out r2, access r1); rev 4 (Tue 3 Nov, Sam Patel) widened the crop restriction to bays 5 and 6 | Keep |
| A9 | The Waiting to send problem item is an observation kept for review because Ravi opened successor draft r03 at 15:02 (changed source) | Keep |
| A10 | The phone customer response shows the M-4 report SYN-RPT-000036 r01 of Thu 15 Oct, the only reviewed Hillview report | Keep |
| A11 | Block C day 1 rolled forward to Mon 16 Nov, Brisbane time (AEST) | Keep |
| A12 | The phone compact header has no back slot; a wrapper frame adds the back button | Replace with the accepted phone header when published |
| A13 | The phone visit dock shows no primary when the gate holds ("Can't start yet") | Keep |
| A14 | Jordan Kim both checks and issues before Riley Tran's pack check duty starts Mon 9 Nov (policy P-02, synthetic) | Keep as synthetic |
| A15 | The appointment's readiness Tag sits at the head of the gate bar, because the A1 header has one chip slot | Keep until the toolbar gains a second slot |
| A16 | SYN-APT-000093 added for the Riverbend pump visit | Keep |
| A17 | Depot stop at 11:40, not 11:15 | Keep |
| A18 | Pat Rowe's Block C 09:00 item is a remote session from the depot | Keep |
| A19 | The planner counts 7 appointments and 8 crew visits, not 11 visits | Keep |
| A20 | SYN-WO-000059 is not linked to SYN-TKT-000205 | Keep |
| A21 | Kim Taylor's inspection draft last saved 09:32 | Keep |
| A22 | Incident classifications drawn as Injury or illness, Near miss, Hazard, Damage to property or environment (the brief says four; the names are this file's; AD07 configures them) | Confirm the words |
| A23 | SYN-INC-000010 carries one Restricted item added by the review team on Wed 4 Nov, so the reporter's and the viewer's withheld states can be shown | Keep as synthetic |
| A24 | IC06 is Casey Ward's draft at Tue 3 Nov 14:18 (the report as it was being written), not a new report at the story time | Keep |
| A25 | Page titles are the rail labels (Service requests, Work orders, Schedule …) with the scope's full name as the sub-line (brief Q1) | Keep; the register records the departure |
| A26 | Ravi Kumar is the service coordinator; Sasha Cole keeps Equipment records (brief Q2, Addendum A3); the Design pages' "Sasha Cole, service coordinator" is an earlier fixture | Keep |
| A27 | Work-order stages In progress, Work complete and Closed are drawn as display stages derived from visits, reports and the handoff over the schema's Draft and Authorised, each with its "why" (brief Q3) | Keep as a proposed departure |
| A28 | A separate technician phone bar, My Work, My jobs, My inspections, Incidents, More, chosen by capability; the coordinator keeps the accepted W8 bar (brief Q4) | Keep; record for the register |
| A29 | Time & labour review is a proposed page after Service review, so the flyout shows 17 pages (brief Q5); no route exists | Keep as proposed |
| A30 | The Maintenance and warranty proposals' 680 px drawers are redrawn as 432 px panels; a long form scrolls (brief Q6) | Keep |
| A31 | Findings is a Service review view; the flyout's "Findings & follow-up" item stays as the Shell drew it, so it appears twice (brief Q7) | Keep; a Shell note |
| A32 | The coordinator's site readiness review (FI-05 D7, no read model) is drawn as a proposed view under My jobs (brief Q8) | Keep as proposed |
| A33 | Goodwill limit shown as proposed, A$1,000 excluding GST a case, above it Dean (brief Q9, MA-06 Q2) | Keep as proposed |
| A34 | Block C commissioning support follows Engineering, Mon 16 and Tue 17 Nov, over the Design's 1 to 2 Dec (brief Q10) | Keep |
| A35 | References use the short form; service requests keep TKT; INS, INC, ESC, AGR, ENT, MPL, MOC, RNW, WAR, SCL and SCR are proposed additions to the PPO-STD-001 type catalogue; findings carry no number | Propose to PPO-STD-001 in its own change |
| A36 | The Service Pulse (IS02) ranks the day by rule; it is proposed, with no route | Keep as proposed |
| A37 | The Service extract of Insights (RP-04) is drawn as an extract; the Reporting page is not | Keep |
| A38 | Duties the seeds give only to the single `coordinator` profile (scope authorise, pack check and issue, report review and issue, incident review, close and sensitive, maintenance and warranty assess) are split across Ravi Kumar, Jordan Kim and Riley Tran as a design assumption | Confirm before any seed change |
| A39 | Service settings change by propose, review by a second person and publish as a version with its impact on live visits and packs (D8) | Keep |
| A40 | Story reconciliation: this file's dataset (brief section 9 as amended by Addendum A3) supersedes the earlier fixtures Sasha Cole as coordinator, `SYN-PPO-WO-000040`, Riverbend's "pump service", `SYN-SR-000212`, Block C on 1 to 2 Dec, Alex Nguyen as the FM-2 technician and Hillview's PT-3 warranty case | Keep; align the earlier pages when next touched |
| A41 | The Shell's three Recent-row stand-ins are redrawn in this file's story: SYN-WO-000041 EC/pH sensor replacement, SYN-TKT-000212, Casey Ward | Align the Shell file in its own change |
| A42 | Stale register notes, recorded and not fixed here: `scope-sv-03.md` is a generic stub; `route-service-findings.md` and `route-service-escalations.md` are discovery stubs with module "Unassigned"; `route-supply-service-stock.md` is a stub; the Maintenance pages have no approved mock-up images | Fix in the design-register change |

## 6. Verification

So far: sheets were rendered and read during each batch and the defects found were corrected before moving on (among them icon scaling, docked-menu row heights, phone tab highlighting, text clipped in fixed-height fields and a collapsed register column). The layout pass (rows by measured height, full-length sheets on their own row, labels moved with their sheets) has run on the Incidents and actions page. To run before this record is completed: the layout pass on every page, the structural pass and position audit, the contrast table computed from the PPO colour variables, the story, capability and authority, and offline scans of section 11.6 of the brief, and the repository checks. The build paused twice on 10 and 11 November when the Figma tool-call limit for the seat (200 calls in 24 hours, shared with other sessions) was reached.

## 7. Not drawn and open questions

Not drawn: Equipment pages EQ-01 to EQ-09 beyond chips, links and the "Record equipment history" hand-off; Service stock SC-10, Returns and claims SC-08 and Bench testing CX-02 (Supply and Workshop pages); Customer messages EC-04 and every customer-facing send; the Document library, Output issue and Template management beyond links and the issue action; Finance handoff pages beyond the Send and the handoff state; Sales aftercare and the deal; Projects and Engineering pages; the Reporting page RP-04; the customer portal; My Work (Service's contributions are shown on the Service sheets); prototype links.

Open questions, cited and not resolved: D-005, D-007, D-011, D-012, D-015 (scheduling values and the gate's synthetic window: site confirmation 5 days to 24 hours before, pack issue by 12:00 site time on the last working day before, return tasks due 09:00 on the visit day or 2 hours before start), D-016 (device and offline scope), D-017, D-018, D-019, D-024, D-025 (who sends to a manufacturer), D-026, D-028; ADR-0043 (ticket lifecycle after triage, Proposed, not accepted: the later lanes are not drawn); PPO-015 (deferred Service items in BP-07 section 16); MA-01 Q1 to Q6; MA-03 Q1 to Q6; MA-06 Q1 to Q7; FI-05 D7 (the coordinator's site readiness review has no read model); time review F1 to F3 (drawn, not accepted); FI-01 Q9. Acceptance tests AT-10 to AT-14, AT-19, AT-25 and AT-30 to AT-36 are not claimed by any sheet.

## 8. Boundary and next steps

This record authorises nothing in the application: no code, route, read model, migration, permission, capability, grant, seed, integration or deployment. The next steps are: Dean reviews the proposal and the audit and decides the A-list; Dean saves a named Figma version (recommended title "PPO - Service module (proposal)"), and any later design change needs a new one; the design register and the per-route page guidance in `docs/design/development/pages/` follow in their own reviewed change, which also fixes the stale notes of A42; the Shell file's Recent-row stand-ins are aligned with the reference families (A41); the proposed type-catalogue families go to PPO-STD-001 (A35); and the Supply and Engineering files are checked where Addendum A3 corrected their stories (the Service stock sheets SS01 to SS05 and the commissioning handover sheets CM12 and CM13 must read the same facts as this file).
