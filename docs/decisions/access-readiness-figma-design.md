---
document_id: PPO-CS06-ACCESS-READINESS-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; named Figma version recorded as saved; P4 build, work-window weekdays, native implementation and UI baseline acceptance separate
source_commit: 4296429bb96b70c982d5e87201e83ed8f9e5fb22
versioning: git
---

# Access & readiness design — owner decision

On 18 October 2026, after Dean accepted People (CS-02), Claude recommended Access & readiness next, because the accepted Sites page (CS-04; its decision `sites-figma-design.md`, PPO-CS04-SITES-FIGMA-DEC, is in draft pull request #587) sends every readiness question there. Dean replied: "I accept your recommendations for People CS-02. Proceed with the Access & readiness · CS-06 UI page build in Figma." Claude drew scope CS-06, site access and horticultural readiness, at `/sites/[id]/readiness`. The page is opened from a site (Sites › Access & readiness), so the rail shows Service with More selected.

Claude drew the page from these sources:
- the CS-06 design register pages ([scope-cs-06](../design/development/pages/scope-cs-06.md), [route-sites-id-readiness](../design/development/pages/route-sites-id-readiness.md));
- the built `src/shared/cs/readiness.ts`, `model.ts` and `service.ts`;
- [CS-06 Site access and horticultural readiness](site-access-readiness-design.md), the owning standalone design, and [Field readiness over CS-06](field-readiness-native.md);
- the [field readiness gate](field-readiness-gate-proposal.md) (PPO-SVC-FIELD-READINESS-GATE-PROP), whose customer site-readiness confirmation (P4) appears on this page;
- the accepted record pattern in [Appointment detail](appointment-detail-figma-design.md) (PPO-SV04-APPOINTMENT-FIGMA-DEC) and Sites (PPO-CS04-SITES-FIGMA-DEC);
- copies of the People frames and the Findings form card, drawn and accepted the same day. No accepted frame or main component was edited, and no new component was made.

Claude audited the page before presenting it. Dean then asked for a second pass: "Give the Access & readiness CS-06 page another audit and polish before I decide." (section 6). He then accepted the design: "I accept the Access & readiness CS-06 design with your recommendations, including D1–D7 and Q1–Q4." The page header and notes card record that the named version "Access & readiness — accepted" was saved the same day at Dean's "Yes, save the named Figma version". This lock-in did not open the version history to check it.

Scope:
- `scope:CS-06`, with `route:/sites/[id]/readiness`.
- Parent requirement IDs PRJ-04, SVC-03, SVC-04, SVC-06, SVC-10 and NFR-02 are unchanged. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment. It does not build P4.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Access & readiness (CS-06) next | User decision, 18 October 2026 | "Proceed with the Access & readiness · CS-06 UI page build in Figma.", recorded on the notes card, after Claude's recommendation |
| Conversations action in the top bar | User decision, 18 October 2026 | Dean asked for it on every new top bar. The shell amendment is a separate, still-open record (section 5). As on Sites, phone record headers carry no Conversations action |
| Second audit and polish before acceptance | User decision, 18 October 2026 | "Give the Access & readiness CS-06 page another audit and polish before I decide.", recorded on the notes card. Section 6 |
| Departures D1–D7 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Where P4 is recorded | Resolved as recommended | The customer's site-readiness confirmation is recorded from this page and from the appointment (SV-04), as **one record** on the appointment's schedule version. Both entry points write the same P4 contact; there is no second store |
| Q2 Read-only facts in forms | Resolved as recommended | The evidence review and acknowledgement forms show the capture and check facts as read-only field rows; only the review note or the reason is editable. The forms are drawn that way |
| Q3 Work windows by weekday | Resolved as recommended | The built model has dates, seasons and times but no weekdays. Weekdays are added to work windows before windows are used for real sites |
| Q4 Signal elsewhere | Resolved as recommended | Once P4 is built, the planner (PL-01) and the job pack (SV-05) show "Recheck required" from the latest check as a read-only signal |
| Acknowledgement grants nothing | Rule shown in the accepted design | Acknowledging a check records who saw its result and why. It grants no work authority, booking, resource reservation, pack issue or dispatch clearance; those stay with Work orders, the planner and Job packs |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Named version "Access & readiness — accepted" | Recorded as saved, 18 October 2026 | The page header and notes card quote Dean's "Yes, save the named Figma version". Not checked in the version history by this lock-in |
| Building the page, P4 and the weekday change | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, named version "Access & readiness — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Access & readiness · CS-06" `1400:346423`, under "— Shared records —", after People · CS-02 `1395:150275`. The page header `1400:346424` holds the conformance declaration; the notes card `1400:347414` ("Notes · CS-06 accepted 18 Oct 2026") is in Flows and notes `1400:347413`. File index row "Row / Access & readiness · CS-06" `1408:63` in the Shared records table, after People. The page header still reads "lock-in to do" and "Decision record: None yet"; it was left unchanged so the page matches the named version |
| Desktop 1440, full length | Overview for Thu 15 Oct `1400:346553`; Requirements `1400:351900`; Evidence, independent review `1400:353096`; Visit preparation, acknowledge with a blocker `1400:353479` |
| Tablet 1024 | Overview with the rail collapsed (`Rail=Collapsed` 198:3796) `1400:354078` |
| Phone 390 and 320 | Overview for Thu 15 Oct at 390 `1400:347071` and at 320 `1400:355748` |
| States | Phone 390: source changed since the check `1400:356261`; no requirements recorded, readiness unknown (SYN Nutrient Room) `1400:356329` |
| Prototype | No flow was designed for this page. One copied flow starting point ("Flow 1" on `1400:346553`) remains. Claude did not play the prototype in Present mode |
| Page parts | None. The page reuses Record / Header, Readiness bar, Field and View tab, Work order record / Blocker row, Planner / Input (proposed), Tag and Button |
| Story | Synthetic. SYN Glasshouse 4 (Hillview Growers, Gatton) has SYN-PPO-APT-000052, electrical work in bay 4 by Casey Ward and Riley Tran, moved to Thu 15 Oct 08:00–11:00 (accepted at 08:51, as on Changes and follow-up and Sites). Readiness owner Sam Patel; revision 3 of the requirements reviewed Fri 2 Oct by Jordan Kim. Check 1 at 08:58 finds two blockers: Riley Tran's induction, captured at 08:40 by Sam Patel, needs another editor's review, and the shade screen isolation approval covers Tuesday only. Sasha Cole (signed in) reviews the induction at 09:52; check 2 at 10:05 leaves one blocker, and Sasha acknowledges it with a reason. Revision 4 at 10:20 makes the check out of date. The P4 customer confirmation shows Unknown: Priya Shah confirmed Tuesday's visit on Mon 12 Oct at 11:02, which no longer counts after the move. The "as at" times are 09:00, 09:50 (Evidence) and 10:06 (Visit preparation) |
| Retained captures | [Access & readiness design r01](../reference/ui/site-access/access-readiness-design-r01/README.md): eight icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CS-06`, `route:/sites/[id]/readiness`, reached from Sites › Access & readiness. Parent requirement IDs unchanged (PRJ-04, SVC-03, SVC-04, SVC-06, SVC-10, NFR-02). Capabilities unchanged |
| Page type (r20) | Planning workspace; Review / comparison |
| Reused components | Shell v2 (Rail · Service with More selected, top bar, side menu), Record / Header, Readiness bar, Field and View tab, Work order record / Blocker row, Planner / Input (proposed), Tag, Button, and Shell / Top bar action · Conversations from the proposed shell amendment. No new components |
| Incoming handovers | Sites (CS-04): the Access & readiness button and the readiness card; appointments and visits (SV-04, PL-01); the field readiness gate (P4) |
| Outgoing handovers | The visit (SV-04), work order (SV-03), planner (PL-01) and job pack (SV-05); the site survey (CS-08); owned follow-up in My Work; source documents in SharePoint |
| Source authority | The CS-06 design register pages; the built `shared/cs/readiness.ts`, `model.ts` and `service.ts`; the decisions listed above |
| Proposed departures | D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Access & readiness — accepted", recorded as saved 18 October 2026 |

## 4. What the design shows

### Record layout and bar (D1)

- **Header:** "Access & readiness" with the readiness tag for the next visit ("Recheck for Thu 15 Oct"); the site, customer and location; the requirements revision and its review state; the readiness owner; the site time zone and the "as at" time. The record position ("1 of 7 in All sites"), Record readiness contact and the primary action Check preparation.
- **Bar for the next visit:** "For Thu 15 Oct, 08:00–11:00", then Requirements recorded, Work window, Inductions (1 of 2), Isolation approval, Customer confirmation and No work authority, each with its state colour. Amber is used only for open blockers.
- **Facts column:** Site (site, customer, time zone, contact, areas, survey); Readiness record (revision, reviewed, owner, and the rule that a requirement applies only where it is recorded for the site or an area and an activity: area type, crop or structure never implies readiness); Visits to prepare.
- **Tabs:** Overview, Requirements, Evidence, Work windows, Visit preparation and History, each with a count.

### Overview (D2, D3)

- **Preparation check for the next visit (D2):** the latest check's basis (visit, activity, area, time and visitors), each unmet requirement in words with the action that resolves it (Review evidence, Add evidence), then what was met. A footer says the check reads requirements, evidence and windows as they are now and must be run again after any change.
- **Customer confirmation, gate P4 (D3):** "Site readiness confirmed by the customer" with its window, why a new confirmation is needed after the move, and the four P4 checks (access arranged; power and water available; equipment accessible; isolation arrangements agreed), each "not asked yet". Record the call with Record readiness contact; a Not ready answer gives the readiness owner an owned follow-up. Powerplants One sends nothing.
- **Closing note:** acknowledging a check grants no work authority, booking, resource reservation, pack issue or dispatch clearance.

### Requirements (D4)

A table grouped by scope (Site-wide; Glasshouse 4 · all bays; Bay 4) with Requirement, Kind, Activity and Evidence in words ("Standing, reviewed", "1 of 2 reviewed", "Reviewed to 31 Dec", "Covers Tue only"). Each requirement names its source; source documents stay in SharePoint. Start revision 4 and Open the site survey are secondary buttons. A draft revision keeps revision 3 in force until another editor reviews it, and changing a requirement makes earlier evidence and checks stale.

### Evidence, independent review (D5)

"Review captured evidence" shows the exact capture as read-only rows (requirement and revision, visitor, captured, valid to, source in SharePoint) and asks for a required review note (Q2). Whoever captured the evidence cannot review it; the review covers exactly this capture, and an edit needs a new review and a new check. The preparation check stays below the form.

### Visit preparation, acknowledge with a blocker (D6)

"Acknowledge the check with a blocker" shows the visit, check, areas and activity, visitors and the open blocker as read-only rows, with a required reason (Q2). Acknowledging records who saw the result and why; the blocker stays open and work authority stays Not granted. If anything in the check changes before the save, the save is refused. Below it, check 2 with its one blocker, and "What acknowledging does not do": work authority, booking, resource reservation, pack issue and dispatch, each Not granted and each with the page that owns it.

### Phone and tablet (D7)

- **Phone 390:** the check first, with its blockers and actions, then the customer confirmation. Tabs Overview, Evidence, Windows and History. The footer keeps "…", Record contact and Check again.
- **Phone 320:** the footer keeps Check again; Record contact moves into "…".
- **Tablet 1024:** rail collapsed and a narrower facts column; the two information-only bar items are left to the cards below.
- **States:** source changed since the check (the acknowledgement was refused and nothing was saved; Check again is the footer action); no requirements recorded, where readiness is Unknown and no window does not mean access is open.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | The accepted record layout, opened from a site, with a bar for the next visit (requirements, work window, inductions, approvals, customer confirmation, work authority), site facts and the visits to prepare on the left, and Overview, Requirements, Evidence, Work windows, Visit preparation and History tabs | Built: the shared CS workspace (`src/components/cs-workspace.tsx`) with six tabs: Overview, Requirements, "Visitor, biosecurity & evidence", Work windows, Visit preparation and "Review & history" |
| D2 | The latest check for the next visit is on the overview: its basis, each unmet requirement in words with the action that resolves it, and what was met. Any change to a source makes the check out of date | Built: preparation is its own Visit preparation tab |
| D3 | The P4 customer confirmation (four checks) sits beside the check and is recorded from here as well as from the appointment, against the visit's schedule version (Q1). A move needs a new confirmation; Powerplants One sends nothing | Not built: P4 is the next field readiness increment |
| D4 | Requirements are a table grouped by site-wide and area scope, with kind, activity and evidence state in words. Editing starts a new revision; the current revision stays in force until another editor reviews the draft | Built: one card per requirement with evidence kind, applies to, activity, source revision and source |
| D5 | Evidence review is a form showing the exact capture and asking for a review note; whoever captured it cannot review it | Built: one card per captured evidence with its review status; the review is recorded in "Review & history" |
| D6 | Acknowledging a check with a blocker names the blocker, asks for a reason and lists what it does not grant. A changed source refuses the save | Built: a "Review, clarification or acknowledgement reason" field in "Review & history" |
| D7 | Phone: the check first, then customer confirmation; the footer keeps Check again, and at 320 Record contact moves into More. Tablet: rail collapsed and a narrower facts column | Not drawn |

Every desktop and tablet top bar also carries the proposed Conversations action left of the information icon, as Dean asked on 18 October 2026.

## 5. Not decided and not drawn

- **Building the page.** The built `/sites/[id]/readiness` is the shared CS workspace with six tabs of stacked cards. The build order is not decided.
- **P4 itself.** The customer site-readiness confirmation is accepted in the [field readiness gate](field-readiness-gate-proposal.md) but not built. Q1 settles that it is one record on the appointment's schedule version, recorded from this page and from the appointment. The P4 build brings the `SiteReadiness` contact purpose, its four checks and `CustomerSiteReadiness` in `SYN-PPO-P04` v3.
- **Work-window weekdays (Q3).** The built model (`src/shared/cs/model.ts`) has dates, seasons and times but no weekdays. The change is a model and migration decision of its own, made before windows are used for real sites.
- **The "Recheck required" signal (Q4)** on the planner and the job pack follows the P4 build. Neither page changes now.
- **The Conversations action** is part of the proposed top-bar shell amendment in the [Conversations proposal](ai-communications-threads-proposal.md) (PPO-AI-THREADS-PROP). That amendment is still open. `Shell / Top bar` and `Shell / Phone header` change only when it is accepted.
- **Prototype residue:** one copied flow starting point, "Flow 1", remains on the overview frame. No flow was designed.
- **Not drawn:**
  - the Work windows and History tabs;
  - the Record readiness contact form;
  - adding or editing a requirement, evidence or window;
  - the check form itself (visit, areas, activity, interval, visitors);
  - denied and restricted states and desktop states;
  - 200% zoom, which the spec reviews separately.
- **Data in the frames:** the sites, customers, people, visits, requirements, evidence and times are synthetic. They are not operational records.

## 6. Audits before acceptance

**First audit, before presenting (18 October 2026).** Claude checked every frame for truncation, clipping, placeholders, fonts (Roboto only), stale links and leftovers from the People copy, and the story against the accepted Sites page: the move at 08:51, Tuesday's confirmation on Mon 12 Oct 11:02, Casey Ward and Riley Tran, motor M-4 at the bay 4 gable and survey SYN-SRV-000031. Fixed: Riley's capture is 08:40, before check 1 at 08:58; record menus and the Check preparation link point to this page.

**Second audit and polish, at Dean's request (18 October 2026).** Changed: the evidence review and acknowledgement forms show the capture and check facts as read-only field rows, with only the note or reason editable (Q2); Sasha Cole, the signed-in user, both reviews and acknowledges; the later frames show their own "as at" times (09:50, 10:06) and counts (3 checks, 14 history entries); frame heights refitted. Checked again: amber is used only for open blockers; card insets are 16 px on desktop and 14 px on phone, as on the accepted pages; no truncated or clipped text; only Roboto.

## 7. Verification

- Claude read the notes card and page header with read-only scripts on 18 October 2026, and viewed the downloaded captures.
- The eight captures are copies of the accepted frames on the "Captures (icon-free)" page `115:2`, from y = 224,000. Prototype links were removed from 99 layers and each of the 273 Font Awesome icon instances was swapped for `Icon/placeholder` `67:77` at its original size. A scan after the swap found no Font Awesome instance and no visible vector outside a placeholder or the Powerplants logo.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/site-access/access-readiness-design-r01/README.md).
- A File index row "Row / Access & readiness · CS-06" `1408:63` was added after People in the Shared records table on Start here (frame `630:2`).
- Claude did not play the prototype in Present mode and did not open the version history.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
