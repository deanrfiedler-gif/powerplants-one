---
document_id: PPO-CALLS-FIGMA-DEC
date: 2026-10-23
owner: Dean Fiedler
status: Owner-accepted design, 23 October 2026; native implementation (stage 1c) and UI baseline acceptance separate
source_commit: 01cef3916c874159a9404f737065292ae2466046
versioning: git
---

# Calling stage 1a design (Figma) — owner decision

On 23 October 2026 Dean accepted the [calling design paper](calling-and-caller-id-design.md) (PPO-CALLS-CALLER-ID-PROP) and its recommended answers, and authorised stage 1a: "Proceed with your recommended answers to Q1 to Q12 of the calling paper, and start stage 1 (1a Figma proposal and 1b server core)." Section 5.7 of the paper lists what stage 1a draws:

- the Log call sheet, as a desktop dialog and a phone full-screen sheet;
- the Calls to log section in My Work;
- the Call control and its states;
- the phone numbers editor on person and organisation pages.

Claude drew them in Dean's Figma file as a proposal, with departures D1–D8 and open questions Q1–Q8, each with a recommended answer. Dean accepted the design the same day: "I accept the Calling stage 1a design with your recommendations, including D1–D8 and Q1–Q8." That adopts D1–D8 and the recommended answers to Q1–Q8. Stage 1c, which builds the web UI, also depends on the stage 1b server core merging, and the paper still lists it as not authorised.

Claude drew the design from these sources:
- the paper's rules R1–R9 (section 4) and stage 1 (section 5), and [ADR-0063](ADR-0063-native-phone-app.md) for what later stages add;
- the existing Record outcome dialog in `src/activities/components/client/my-work-dialogs.tsx` (outcome presets, notes, "What happens next?", the next-action hint and the "Outcome saved — next activity not saved" state) and its accepted drawing on My Work `413:92879`;
- the accepted My Work, People CS-02 and Organisations CS-01 pages, the Conversations top-bar action, and Dean's Pipedrive shell preferences (flush sheets, grid-style lists, no green fill on navy).

Scope:
- Stage 1 adds no route and no scope ID (paper section 1). The surfaces live inside existing pages: My Work (`/work`), People `scope:CS-02` (`/people/[id]`), Organisations `scope:CS-01` (`/customers/[id]`), Leads (`/sales/leads/[id]`) and Deals `scope:CR-01` (`/sales/opportunities/[id]`).
- Parent requirements CRM-02, CRM-03, CRM-08 and PAR-05; NFR-01, NFR-02, NFR-05, NFR-08 and NFR-09. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, dependency, provider connection or call. It does not edit `src/`, `db/`, `tests/` or the design-development register: stage 1b builds the server in its own pull request, and stage 1c updates the register and components when it builds the UI.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Draw the stage 1a proposal | User decision, 23 October 2026 | Dean's words quoted above |
| Rules R1–R9, Q1–Q12 of the paper | Accepted by the owner, 23 October 2026 | [Calling design paper](calling-and-caller-id-design.md), sections 4, 5 and 8 |
| Departures D1–D8 (section 4) | Accepted as recommended, 23 October 2026 | Dean's acceptance, quoted above |
| Q1–Q8 (section 5) | Resolved as recommended, 23 October 2026 | Dean's acceptance, quoted above |
| Accept the design | User decision, 23 October 2026 | "I accept the Calling stage 1a design with your recommendations, including D1–D8 and Q1–Q8." |
| Named Figma version | Saved 24 October 2026 at Dean's request | Dean: "Yes, save the named Figma version "Calling — call core, accepted" and mark PR #676 ready." Claude saved it in the Figma desktop app (version history, +) and saw it at the top of the history after reopening the panel |
| Building the UI (stage 1c) | Not authorised | The [calling design paper](calling-and-caller-id-design.md) lists stage 1c as not authorised. It depends on this acceptance and on stage 1b merging (section 7) |

## 2. Design reference

| Reference | Identity |
|---|---|
| Design file | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository ([ADR-0053](ADR-0053-figma-page-design.md)) |
| Page | "Calling and call logging · CS-01 · CS-02 · CR-01" `2125:688373`, under "— My Work —", after Search · SH-04. Duplicated from the Template `626:20` ([ADR-0055](ADR-0055-figma-file-structure.md)). The page header `2125:688374` holds the conformance declaration and Dean's acceptance. File index row "Row / Calling and call logging · CS-01 · CS-02 · CR-01" `2158:9931` on Start here, in the My Work group after Conversations |
| Desktop 1440 | My Work Overview with Calls to log `2125:688442`; Skip a call, reasons menu `2127:689333`; Log call from Calls to log with several matches (R5) `2128:9831`; Log call from click to call, full length `2128:9258`; Log a call by hand from My Work `2125:688581`; Call saved, next activity failed `2128:10600`; Log call, Wrong number offers Number needs checking `2128:11085`; Person phone numbers editor `2134:4550`; Organisation main numbers editor `2134:4838`; Call control states and where it replaces `tel:` links `2134:4252` |
| Tablet 1024 | Not drawn (Q8) |
| Phone 390 and 320 | My Work with Calls to log `2125:688978`; Skip a call, reasons sheet `2130:4613`; Log call sheet from click to call `2130:4022`; Log call sheet, several matches `2130:4455`; Log call sheet at 320 `2130:4311`; Phone numbers editor sheet `2135:4889`; Log call sheet, full length `2130:4167` |
| States | Calls to log empty `2127:689731`; call source outage (R9) `2127:690121` |
| Notes | "Proposal notes · Calling" `2135:4947` in Flows and notes: Dean's acceptance, story, D1–D8, Q1–Q8 and what is not drawn |
| New part | Component set "Call / Control" `2134:4251`, ten variants `2134:4201`–`2134:4248` (Default, Hover, Focus, Opening, Several numbers, Needs checking, Unreadable, No number, Icon only, Icon unavailable) with a Number text property. Drawn on the page as "Call / Control (proposed)"; at acceptance it moved to Components › Controls `1095:257405` (same node ID, instances kept, the board re-checked by screenshot) and lost the "(proposed)" suffix. Stage 1c registers it as a shared component |
| Reused parts | The desktop frames are clones of accepted My Work, People CS-02 and Organisations CS-01 frames. The two My Work desktop clones had their top bar replaced with the PL-04 top bar with the Conversations action `1326:4564`; the People and Organisations clones already had it, and the My Work phone frame already uses Shell / Phone header · compact `1530:110`. Button `3:41`, Tag `3:13`, My Work / Summary cell `408:368` and existing icons, including Icon/phone `196:47`. No new icon was added |
| Story | Synthetic, as at Tue 13 Oct 2026, signed in as Jamie Park (JP), sales. Priya Shah, SYN Hillview Growers: mobile 0491 570 806, work (02) 5550 1840. That work number is also the organisation's main number and Ellis Grant's work number, so a call to it has three matches. Dana Brooks, SYN Isolation Nursery: 0491 570 159. Deals `SYN-OPP-000118` Glasshouse 4 shade screen upgrade and `SYN-OPP-000131` Propagation house irrigation review, project `SYN-PRJ-000014` Glasshouse 4 screen controls, deal `SYN-OPP-000026` Substrate store dosing review. Phone numbers are in ACMA's fictional ranges |
| Retained captures | [Calling design r01](../reference/ui/crm/calling-design-r01/README.md): 19 icon-free PNGs with hashes, from capture copies `2135:693792`–`2135:701905` on "Captures (icon-free)" from y 373,000 |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | No new route or scope: stage 1 adds none. My Work (`/work`), People `scope:CS-02`, Organisations `scope:CS-01`, Leads and Deals `scope:CR-01`. Parents CRM-02, CRM-03, CRM-08 and PAR-05; NFR-01, NFR-02, NFR-05, NFR-08 and NFR-09, unchanged. Capabilities unchanged: logging uses the existing activity create and edit permissions (paper 5.6) |
| Page type (r20) | Form / guided workflow (the Log call sheet and the phone numbers editor) and a worklist section (Calls to log) inside existing worklist and record detail pages; one shared control (Call) |
| Reused components | The accepted shell (rail, top bar with the Conversations action, side menu), Shell / Phone header · compact, Button, Tag, My Work / Summary cell and the Record outcome dialog pattern. New, proposed: Call / Control |
| Incoming handovers | Call events from Click to call in stage 1; Phone app and Teams events in stages 2 and 3 through the same interface. The read-only number lookup supplies Who and the Linked to suggestions, for permitted records only (R4) |
| Outgoing handovers | Saving creates one completed Call activity with its links and marks the event Logged, in one command. Plan the next activity uses the parent's own next-action command, as Record outcome does. Wrong number can flag the number Number needs checking on the person or organisation. Skip marks the event Skipped with an optional reason |
| Source authority | PPO-CALLS-CALLER-ID-PROP sections 4 and 5; ADR-0063; Record outcome in `src/activities/components/client/my-work-dialogs.tsx`; CRM feature report r02 section 10 |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 23 October 2026 |
| Decision record | This file |
| Named version | "Calling — call core, accepted", saved 24 October 2026 |

## 4. What the design shows

### Log call sheet

- **One sheet, built on Record outcome.** It keeps the 560 px dialog shell, "What happened?" with presets and notes, "What happens next?" with the next-action hint, and the same failure state. It adds three groups above them: Who, Linked to and Call.
- **Who.** From click to call or a Calls to log item, the matched person is filled in, with Change. Where a number is held by several permitted records, all are listed and none is chosen; Save says "Choose who you spoke with before saving" (R5). Logging by hand starts with a search by name or number that lists only records the user may see, and an optional number field (R3, R4).
- **Linked to.** Suggested open deals, leads and projects for the chosen person, as ticks the person can change, plus "Link another record". Before Who is chosen, the group says suggestions appear after choosing.
- **Call.** Direction (Outgoing or Incoming), when, duration, and the five results as single-choice chips: Connected, No answer, Left voicemail, Busy, Wrong number. A line under them says where the call came from, for example "From click to call at 09:42. Correct the time and duration if they are wrong."
- **From click to call.** When Jamie comes back to PPO after calling Priya, an information notice says "You called Priya Shah at 09:42. Save to log the call, or close and it waits in Calls to log." (Q8 of the paper).
- **Next activity failed.** The title becomes "Call saved — next activity not saved". A danger notice says the call is saved and no longer in Calls to log, and that the entries are kept. A Saved summary replaces the call groups, the next activity stays editable with its error, and the actions are Close and Retry next activity.
- **Wrong number.** Choosing it shows a warning and a ticked offer: "Flag 0491 570 159 on Dana Brooks as Number needs checking". The number is kept and nothing is deleted.
- **Phone.** A full-screen sheet with a 60 px header (close on the left, centred title) and one sticky full-width primary button. Direction is a full-width segmented control and the next activity's fields stack. Closing the sheet leaves the event in Calls to log.

### Calls to log

- **Where.** A section at the top of the My Work Overview main column, above My activities, and at the top of the phone Overview, newest first. The summary strip gains a fifth cell, "Calls to log", with the count.
- **Rows.** Person (or "main line" for an organisation number), organisation, number with its label, direction and source, time, and duration when known. A number with several matches says "3 matches: choose who" in the warning colour. Each row has Log and Skip.
- **Skip.** A menu on desktop and a bottom sheet on phone: Personal, Not business, Already logged, or Skip without a reason. The foot says skipped calls are deleted after 30 days (paper Q5).
- **Empty.** "No calls to log. Calls you start from PPO wait here until you log or skip them."
- **Source outage (R9).** A warning above the list ("Teams calls could not be checked since 07:10"), and the heading says calls may be missing. Stage 1 has only Click to call, so the frame uses a stage 3 Teams example and says so.

### Call control

- **Ten states:** Default, Hover, Focus, Opening, Several numbers (with a menu of all numbers and Edit phone numbers), Needs checking, Unreadable, No number (with Add), Icon only and Icon unavailable.
- **Rules it keeps:** it dials the stored international form and shows the number as entered; it records one Click to call event per tap (R8); it shows only numbers on records the user may read; and it never logs or completes a call (R1).
- **Where it replaces `tel:` links,** a table on the board, built in stage 1c: the people register, the CRM directory, the customer workspace, the site workspace, the Conversations context panel and the My Work activity detail. The My Work Contact note changes from "Opening one records nothing here" to say the call waits in Calls to log.

### Phone numbers editor

- **Person.** A dialog with one row per number: label (Mobile, Work, Home or Other), the number as entered, Primary, and Remove. A "Read as" line shows the international form and any other records that hold the same number. A number PPO cannot read is kept exactly as entered, tinted, tagged Number needs checking and explained: "PPO could not read it as a phone number, so it cannot be called until it is corrected. Moved from the old phone field." The notes say numbers without a country code are read as Australian, the company's country, and that every change goes to History.
- **Organisation.** "Main numbers" with the same labels, and a note that a call to or from a main number lists every record that holds it.
- **Phone.** A full-screen sheet with one card per number and a sticky Save phone numbers.

### Departures, accepted

| ID | Departure | Current pattern |
|---|---|---|
| D1 | Log call is one sheet built on Record outcome, adding Who, Linked to and Call | Record outcome only completes an activity that already exists |
| D2 | Phone Log call and phone numbers editor are full-screen sheets with a 60 px header and one sticky primary button | Phone sheets for other pages (EC-04 pattern) |
| D3 | Who lists every permitted record for a shared number with none chosen, and Save explains what is missing (R5) | No lookup exists |
| D4 | Result is five single-choice chips; Wrong number reveals the Number needs checking offer | Call presets "Spoke with the contact", "No answer", "Left a message" |
| D5 | Calls to log is a section at the top of the Overview with Log and Skip on every row, plus a fifth summary cell | Four summary cells; no call list |
| D6 | The R9 outage notice sits above the list and the heading says calls may be missing | No call sources |
| D7 | One Call control with ten states replaces six separate `tel:` links | Six hand-built `tel:` links that record nothing |
| D8 | Phone numbers editor with labels, primary, the number as entered, a "Read as" line and the flag, for people and organisations | One free-text phone per person; none for organisations |

## 5. Questions, resolved as recommended

Dean's acceptance adopted every recommended answer below.

| # | Question | Answer (recommended, accepted) |
|---|---|---|
| Q1 | The Result now records what the three Call presets record. What are the Log call presets? | Purpose presets: Agreed a next step, Sent information, Waiting on them, No change. Completing a planned Call activity in My Work opens the same Log call sheet, so there is one way to record a call |
| Q2 | Which suggested links start ticked? | The record the call started from (a deal, lead or project page, or a My Work activity). From a person or organisation page, the open deal with the nearest next activity. Never more than one ticked automatically |
| Q3 | Is the Wrong number flag ticked by default, and can a flagged number still be called? | Ticked by default and visible, so the person can untick it. A flagged number stays callable after a confirm ("Call anyway"); an unreadable number cannot be called until it is corrected |
| Q4 | Where does Calls to log sit? | A section on the My Work Overview plus a summary cell. No new route or side-menu view in stage 1 |
| Q5 | How are numbers shown? | As entered, everywhere. The international form is used only to dial and to match, and shows in the editor's "Read as" line |
| Q6 | Which record references do the frames use? | The short `SYN-OPP-` and `SYN-PRJ-` forms that new design work uses since Dean's 22 October 2026 instruction to drop "PPO" from synthetic numbers. Accepted pages that show `OPP-000118` are history and are not changed ([readable reference rule](readable-reference-namespaces.md)) |
| Q7 | Which icons show call direction? | Add Font Awesome Light `phone-arrow-up-right` and `phone-arrow-down-left` through the Kit at build. This proposal uses the existing arrow-up and arrow-down icons, and adds no icon to the Components page |
| Q8 | Does tablet need its own layout? | No. The 560 px Log call dialog and the 640 px phone numbers dialog fit 1024 unchanged, Calls to log follows the Overview columns, and the phone sheets apply below 768 px |

## 6. Not drawn and not decided

- **Not drawn:** the Log a call action on lead, deal and project pages (the same sheet opens, with that record ticked); a prototype click-through; the person page with its numbers shown through the Call control; Phone app and Teams sources (stages 2 and 3); any manager view of other people's calls (not in stage 1, paper Q4); 200% zoom.
- **Not proven:** keyboard and screen-reader use of the sheet, which stage 1c must prove (paper 5.7).
- **Building.** Nothing is built. Stage 1c needs this design accepted and stage 1b merged; it then registers the Call control and Log call sheet in `docs/design/development/components.json` with their consumer bindings.
- **Data in the frames:** every person, number, organisation and record is synthetic. Ellis Grant is a new synthetic contact for the shared-number case.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma (`node.screenshot()`), fixed wrapped field values and clipped table cells, and laid the page out to the Template: labels above frames, three desktop frames to a row, sections fitted and stacked, with a programmatic check that no frame overlaps another or leaves its section.
- The 19 capture copies have every icon swapped to `Icon/placeholder` `67:77` (862 swaps); a scan of each copy found none left. The PNGs are exported at scale 1 at each frame's size.
- The prototype was not wired or played.

## 8. Acceptance and lock-in

Dean accepted the design on 23 October 2026 (section 1). At lock-in Claude recorded his words on the page header and the notes card, added the File index row `2158:9931`, and moved the Call / Control set to Components › Controls. The retained r01 captures were exported before acceptance from the same frames, which did not change; only the page header, the notes card and the component's page changed afterwards. On 24 October 2026, at Dean's request, Claude saved the named version "Calling — call core, accepted" in the Figma desktop app and confirmed it in the version history. The page header's Named version field was updated just after, so the saved version still shows it as waiting.
