---
document_id: PPO-PJ08-STAKEHOLDER-UPDATES-FIGMA-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 861e6195831a533c808066ac64153fbde465fdb5
versioning: git
---

# Stakeholder updates design — owner decision

On 19 October 2026 Dean asked: "You task is to now design and build the "(PJ-08) Stakeholder update preparation and publication" UI page in Figma for the Powerplants One app." The page is `scope:PJ-08` at the proposed route `/projects/updates`. It is the screen for the M4 Project update of the [customer communications decision](customer-communications-d025.md): the project coordinator drafts each update, and a second person approves and sends that exact revision.

Claude drew the page from these sources:
- the PJ-08 design register page ([scope-pj-08](../design/development/pages/scope-pj-08.md)) and its draft guide `guide.pj.08` ("Editing a published update requires a successor; earlier acknowledgement stays with its original content");
- the [customer communications decision](customer-communications-d025.md): the M4 Reviewed class, rules R1–R9, the M4 gaps, and stage S6, which names this design;
- [ADR-0058](ADR-0058-outbound-customer-email.md) (one shared customer mailbox) and the [customer communications contract](../contracts/customer-communications.md) behind the merged S2 core ([S2 record](customer-communications-core-s2.md));
- BP-01 PRJ-07 ("Produce approved stakeholder updates and delivery forecasts") and OUT-11, and finding 4 of the [projects source assessment](../blueprints/projects-source-assessment.md) (the last update date is shown without adopting an SLA or auto-stale rule);
- copies of accepted designs: the Projects register ([decision](projects-register-design.md)), the Project record ([decision](project-record-page-design.md)) and the PJ-05 record layout, notice panel and dialog ([decision](project-commercial-figma-design.md)); and the Customer messages · EC-04 proposal (email preview, Confirm and send dialog, delivery steps, phone frames), with which the story is matched exactly.

Dean then asked for an audit and a run of the prototype: "Give the PJ-08 page an audit and polish first, and play the prototype flows in Present mode." He first declined Figma control and then gave it: "You can take control of my computer and play the prototype page now to ensure everything is correct and as professional as possible." He asked for one last pass, naming the grouped-row bands that stopped short of the checkbox column: "Give it one final an audit to ensure it is professional as possible." Finally he accepted the design: "I accept the Stakeholder updates PJ-08 design with your recommendations, including D1–D8 and Q1–Q6. Lock it in." That adopts D1–D8 and the recommended answers to Q1–Q6.

Scope:
- `scope:PJ-08` "Stakeholder update preparation and publication", proposed routes `/projects/updates` (register) and `/projects/[id]/updates/[update]` (record), and an Updates view on the project record.
- Parent requirements PRJ-07, OUT-11, DOC-05, OUT-17 and TR-03; acceptance AT-32, AT-36 and AT-38. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, mailbox, provider connection, message class switch or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design PJ-08 in Figma | User decision, 19 October 2026 | Dean's request quoted above |
| Audit and polish, then play the flows in Present mode | User decision, 19 October 2026 | Quoted above. Sections 5 and 6 |
| Group bands across the checkbox column, and a final audit | User decision, 19 October 2026 | Quoted above. Section 5 |
| Departures D1–D8 | Accepted as recommended, 19 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 A business number for updates | Resolved as recommended | None. An update is "Update N" within its project, with revisions r1, r2…, and an internal id, as FI-07 customer responses are |
| Q2 Who may approve | Resolved as recommended | Anyone holding the customer send duty for the project, except the person who prepared that revision (the D-025 default). A named Projects approver role can follow when the Projects team exists |
| Q3 Writing drafts on a phone | Resolved as recommended | Not for now. Phones read, review and approve; writing a draft needs its sources beside it, on desktop or tablet |
| Q4 Story clashes with accepted pages | Resolved as recommended | Corrected when those pages next change: the accepted Projects register (as at 10:42) lists seven projects without SYN-PPO-PRJ-000014 and -000019, which Emails · EC-01 and Customer messages · EC-04 use; and the accepted Project record shows Priya Shah as site contact for SYN Northbank Block C although People CS-02 records her at Hillview. Because R1 refuses another customer's contact, Block C's update recipient is drawn as Sam Okafor, a new synthetic Northbank contact |
| Q5 Customer questions | Resolved as recommended | Recorded on the project with an owner and an answer-by date, shown in My Work as Waiting on customer (a new source for `src/activities/work-waiting.ts`); staff record the answer from the reply |
| Q6 Empty sections | Resolved as recommended | An empty section (for example Done since in PRJ-000014 r2) is left out of the email, as the EC-04 held message shows |
| Accept the design | User decision, 19 October 2026 | Quoted above |
| Named Figma version | Saved, 19 October 2026 | "Stakeholder updates — accepted", saved by Claude in the Figma desktop app on Dean's "Yes, save the named Figma version "Stakeholder updates — accepted" and mark the PR ready." and checked at the top of the version history |
| Building the page | Not decided | Section 7 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Stakeholder updates — accepted". The file's link is not recorded in this public repository (ADR-0050, [ADR-0053](ADR-0053-figma-page-design.md)) |
| Page | "Stakeholder updates · PJ-08" `1577:10373`, under "— Projects —", after Contract obligations, notices and variations · PJ-05. The page header `1577:10374` holds the conformance declaration; the notes card `1602:3735` is in Flows and notes. File index row "Row / Stakeholder updates · PJ-08" `1657:356962`, after the PJ-05 row |
| Desktop 1440 | All updates register `1577:427034`; Update 3 draft r3 written from sources `1577:429030` and full length `1577:429520`; the draft's Sources view `1613:3732`; Prepare to send dialog `1577:429822`; Prepared r3 with the approver, Kai Morgan's view `1577:430303`; Review and approve, Sasha Cole's view, full length `1582:1423`; Approve and send dialog `1583:1598`; Return for changes dialog `1613:4113`; Sent, Distribution view, full length `1585:1788`; Correct a sent update dialog `1591:2291`; Held, do not notify (PRJ-000014) `1587:1954`; Update settings panel `1589:2119`; Project record Updates view (PRJ-000027, under More) `1593:2473` |
| Prototype frames | Scrolling 900 px viewports of the review `1631:4090` and sent views `1631:4423`; Sasha Cole's register at 09:05 `1640:4458` and at 09:12 `1640:5070`; Kai Morgan's sent view on Wed 14 Oct `1640:5690`; the phone review as a scrolling 844 px viewport `1631:4758` |
| Tablet 1024 | Register with the rail and side menu collapsed `1593:429144` |
| Phone 390 and 320 | All updates list at 390 `1597:3280` and 320 `1597:3588`; Review and approve, full length `1597:430016`; Approve and send sheet `1597:430175` |
| States | Section `1577:10424`: loading; nothing to prepare; couldn't load; can't prepare without recipients; sources changed after preparing; you drafted it; prepare not confirmed; view only; unsaved changes |
| Parts | Update grid header `1577:14819` and Update grid row `1577:14831` (Default, Hover, Selected, Closed) in Page components, cloned from the EC-04 message grid parts. They stay on the page until a second page reuses them. The phone frames use Shell / Phone header · compact `1530:110` |
| Prototype | Flows "PJ-08 — desktop, register", "— desktop, draft and prepare", "— desktop, approve", "— desktop, correct a sent update", "— project record Updates view", "— tablet", "— phone" and "— phone 320" |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST (sites Australia/Brisbane). Kai Morgan coordinates SYN-PPO-PRJ-000019 Propagation house fit-out for SYN Isolation Nursery and drafts Update 3 "October progress": r1 Fri 9 Oct, r2 Mon 12 Oct, r3 saved 08:24 and prepared 08:30 for Dana Brooks. Sasha Cole, who holds the customer send duty, checks it against schedule baseline v4 and approves and sends it at 09:08 (sent 09:09, delivery not confirmed). Update 2 for SYN-PPO-PRJ-000014 is held because Priya Shah asked not to be notified. The EC-04 M4 message, its held PRJ-000014 message and their times match these frames |
| Retained captures | [Stakeholder updates design r01](../reference/ui/projects/stakeholder-updates-design-r01/README.md): nineteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PJ-08`, proposed routes `/projects/updates` and `/projects/[id]/updates/[update]`, and an Updates view on `/projects/[id]`. Parent requirements PRJ-07, OUT-11, DOC-05, OUT-17 and TR-03, unchanged. No capability exists yet; `project.update.prepare` and `project.update.approve` (default-denied) are proposed, and sending uses the existing `customer_message.send` duty |
| Page type (r20) | Register or worklist (updates across projects), a record detail with an editor (one update and its revisions), and a review comparison (the exact message beside the sources it was built from) |
| Reused components | Shell v2 (Rail · Projects, the Projects side menu, the top bar with the Conversations action), Record / Header, Readiness bar, Field, Section heading, View tab and Banner, Grid cells, Tag, Button, My Work group rows, the EC-04 email preview, delivery steps and dialog, the PJ-05 notice panel, and Shell / Phone header · compact. New: Update grid header and Update grid row |
| Incoming handovers | Schedule baseline and milestone dates from Programme (read only, typed dates only); customer questions owned on the project; update recipients and notice preferences from People CS-02; the Project update template published in DK-06; the cadence trigger (M4), which creates a draft and an owned Activity for the coordinator |
| Outgoing handovers | Prepare to send hands the fixed revision to Customer messages EC-04 as an M4 message (Prepared). Approve and send is the EC-04 action, reachable here beside the sources. Return for changes, Withdraw (before sending only) and Correct a sent update (a successor). Questions become Waiting on customer items in My Work. It never sends from the editor, never takes a typed address, and never claims delivery or reading |
| Source authority | The PJ-08 design register page and `guide.pj.08`; the customer communications decision (M4, R1–R9, S6); ADR-0058; BP-01 PRJ-07 and OUT-11; the projects source assessment, finding 4 |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 19 October 2026 |
| Decision record | This file |
| Named version | "Stakeholder updates — accepted", saved 19 October 2026 |

## 4. What the design shows

- **Register.** All updates across projects, grouped To prepare, With approver, Needs follow-up, Sent and Not scheduled, with the next due date, coordinator, recipient, customer, last change and project reference. Group bands run the full row width, through the checkbox and settings columns.
- **Draft.** The update record on the shared record layout: a facts bar (sources current, recipient allowed, question owned, internal note never sent, someone else approves), a details column (update, recipients, project), and the Draft view. The subject has a fixed format; milestone dates come from the schedule baseline and are read only; the opening, done-since and risks text is written for the customer; questions come from the project's customer questions; an internal note stays with the revision.
- **Sources.** What the revision was written from (schedule baseline v4, the Programme tasks completed since the last update, the open customer question, the last sent update) and what is never copied (Risks & issues, contract obligations and variations).
- **Prepare, review and approve.** Prepare to send fixes the revision and its recipient. The approver sees the exact email, a check of each statement against its source (Matches, or Judgement for a forecast), the drafter's note and internal note, and a required approval note; Approve and send opens the EC-04 dialog; Return for changes needs a reason and withdraws the prepared message.
- **Sent and correction.** Delivery steps from the communication record (Prepared, Queued, Submitted, Sent with the copy found in Sent Items, delivery not confirmed), the question waiting on the customer, the next due date and the revision list. Correct this update starts Update 4, which says what it corrects; Update 3 stays as sent.
- **Held.** A held update (Do not notify) is dimmed, with its owned Customer contact follow-up as the main action and Withdraw beside it.
- **Update settings.** Cadence of 7, 14 or 30 days counted from the last send, recipients chosen from the project customer's current named contacts with their notice preference, and the approvers.
- **Phone.** The All updates list under the compact header, and the review with flush sections and a sticky full-width Approve and send, which opens a bottom sheet.

### Departures, accepted

| ID | Departure | Built page |
|---|---|---|
| D1 | A Customer updates group in the Projects side menu (To prepare, With approver, Needs follow-up, All updates) at `/projects/updates`; the rail keeps its eight items. The project record gains an Updates view under More, with Files, as PJ-05 Q5 accepted once the tabs no longer fit | No route, menu entry or project view |
| D2 | Updates are numbered per project and every save makes a revision that never changes. Only a prepared revision can be sent. A sent update is never edited; Correct this update starts a successor, and the two link to each other | No update record |
| D3 | Written from sources: typed dates from the schedule baseline, read only; customer-facing text written by the coordinator; questions with an owner and a date; an internal note never sent; nothing copied from Risks & issues | None |
| D4 | Prepare to send hands the fixed revision to Customer messages as an M4 message. Revise withdraws the prepared message and starts the next revision from it | None; S2 has no M4 trigger |
| D5 | Approval beside the sources: each statement checked against its source; Approve and send is the EC-04 action with a required approval note; Return for changes needs a reason. The same action stays in Customer messages | None |
| D6 | Distribution stays with the update: delivery steps, questions waiting on the customer, the next due date and the revision list | None |
| D7 | Update settings per project: cadence 7, 14 or 30 days from the last send, shown as Due and never Overdue; recipients only from the project customer's current named contacts, with their notice preference; approvers from the send duty | No recipients or cadence |
| D8 | Phone: the list under the compact header; review and approve with flush sections and a sticky Approve and send; drafting on desktop and tablet (Q3) | None |

## 5. Audit and polish

At Dean's requests Claude audited the page three times.

- **First pass:** added the draft's Sources view (the first PJ-08 task, prepare from current source records, had no screen) and the Return for changes dialog; fixed the draft's queue position (2 of 4 to prepare at 08:24), History counts that follow the events, a truncated Next due column, a duplicate sort arrow, the settings panel spacing and a duplicate flow start.
- **Present mode (section 6):** record content now scrolls inside 900 px frames, using scrolling copies of the review and sent views (the full-length frames stay as the reference); the register toolbar no longer clips its More button; scroll areas end with 48 px of space; the approver's path stays as Sasha Cole, with her register at 09:05 and at 09:12; the correction starts from Kai Morgan's sent view; the phone lists scroll and hold all nine updates; the phone sheet sits fully on screen; no link jumps to a frame for another width or person.
- **Final pass:** the group bands now run through the checkbox and settings columns in each group's own colour (the cloned bands had all kept the first band's cream), and those columns line up with the rows to the pixel; phone group labels use the same colours; Held · do not notify is Warning, as on EC-04; tables no longer double their bottom border; state cards in a row share one height; approvers are named the same way everywhere; the 320 list shows short dates so titles fit.

The audits are recorded on the notes card `1602:3735`.

## 6. Verification

- Claude checked the frames with screenshots taken inside Figma, and swept every frame for placeholder text, fonts (Roboto only) and clipped text by measuring each truncating text against its rendered width. The only clipping found, a 320 list title, was fixed.
- Claude played all eight flows in Present mode in Dean's Figma desktop app at Dean's request: register to the prepared and held updates and back; the draft through Sources, Update settings, Prepare to send (Cancel and confirm) to the prepared view; review through Return for changes (Cancel), Approve and send and the sent view, back to Sasha Cole's register and into the sent update again; the correction from Kai Morgan's sent view (Cancel); the project record; the tablet; and the phone list through the review, the Approve and send sheet and back. Every link worked. Scrolling was checked by dragging, because the tool's wheel events do not reach Present mode.
- The nineteen captures are copies of the accepted frames on the "Captures (icon-free)" page at y = 300,000 (`1655:247451` to `1655:250009`). Prototype links were removed and each of the 537 Font Awesome icon instances was swapped for `Icon/placeholder`, keeping its colour. No Font Awesome instance is left; the only vector outside a placeholder is the Key dates strip's forecast diamond, a PPO shape. The five flow starting points the copies brought were removed from the Captures page.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/projects/stakeholder-updates-design-r01/README.md).
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.

## 7. Not decided and not drawn

- **Building the page.** The build order is not decided. Stage S6 of the customer communications decision holds it.
- **Prerequisites for a build** (all S6 gaps in that decision):
  - an update record with immutable revisions, a prepared revision and successors;
  - update recipients per project (R1) and the notice preference read from People;
  - customer questions with an owner and an answer-by date, as a Waiting on customer source (Q5);
  - prepare and approve duties for Projects (`project.update.prepare`, `project.update.approve`), with the drafter excluded from approving (Q2);
  - the cadence (14 days by default, 7 or 30 set by the coordinator) and the M4 trigger that creates a draft and an Activity and never sends;
  - an M4 message kind and template in the S2 communications core, with the M4 switch off by default (R9);
  - the compact phone header in the application, in its own pull request (Phone header amendment, `docs/decisions/phone-header-amendment.md`, draft PR #606).
- **Not drawn:** the cadence trigger's My Work card, Update 4 after a correction, the History view, a tablet record, the phone sent view, attachments or photos in an update, a PDF output (DK-03) and the customer portal; 200% zoom and keyboard order.
- **Data in the frames:** the people, organisations, projects, addresses and dates are synthetic; `*.example` addresses are placeholders, and the shared mailbox address is the EC-04 synthetic placeholder (ADR-0058, Q3).
