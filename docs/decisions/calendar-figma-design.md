---
document_id: PPO-EC03-CALENDAR-FIGMA-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 70450f2eaa1166ed575736beb10cd5b335a8a4fd
versioning: git
---

# Calendar design — owner decision

On 19 October 2026, with Emails · EC-01 and Customer messages · EC-04 being drawn in other sessions, Dean asked: "You can now start designing and building the UI page for the EC-03 Calendar module in Figma." The page covers one route, `/calendar`. In the Sales rail it is labelled "Activities" and opens on the sales scope (`?scope=sales`, breadcrumb "Sales Activities"); elsewhere it is "Calendar" ("Personal Calendar"), as built.

Claude drew the page from these sources:
- the EC-03 design register pages ([scope-ec-03](../design/development/pages/scope-ec-03.md), [route-calendar](../design/development/pages/route-calendar.md)) and the EC-03 row of the PPO-HTML-Page-Coverage-Register r06 (personal and team views, record links, attendees, source and time zone, sync state and conflicts; a CRM meeting is not a Service booking);
- the built calendar: `EmailCalendar` in `src/components/email-screens.tsx` (Day and Agenda, the separate "Due this day" list, the event dialog), `readCalendar` and `calendarToday` in `src/email/service.ts`, and the Activities destination and `activitiesHref` in `src/shell/navigation.ts`;
- the [Email & Calendar integration design](../blueprints/email-calendar-integration.md): EC-S06 Calendar, section 7 (connection states) and section 8 (calendar ownership);
- copies of accepted or concurrent designs: the Emails · EC-01 desktop and tablet shell, the Service planner PL-01 toolbar, the My Work phone activity row, and the EC-01 phone sheets.

Dean then asked for an audit: "Carry out an audit and polish to ensure the pages look as professional as possible." With Pipedrive mobile calendar screenshots he added that the phone views should have fewer boxes, buttons and features at the top, even without the main top bar, and asked for Claude's opinion. Asked about Q5, he said: "I am happy for you to proceed based on your professional recommendations." That adopted the compact phone header for every phone page, recorded separately as the Phone header amendment (`docs/decisions/phone-header-amendment.md`, draft PR #606). He then asked Claude to play the prototype on his computer: "Did you want to take control of my computer and play the prototype for the EC-03 Calendar module in Figma to ensure all the UI pages are correct?" (section 6). Finally he accepted the design: "I accept the Calendar EC-03 design with your recommendations, including D1–D8 and Q1–Q5." That adopts D1–D8 and the recommended answers to Q1–Q5. Dean then asked for the named version: "Yes, save the named Figma version "Calendar — accepted"." Claude saved it in the Figma desktop app (section 6).

Scope:
- `scope:EC-03` "Calendar and activity coordination", with `route:/calendar`.
- EC-03 is page-register coverage under CRM-03, DOC-05, DOC-06, NFR-03 and NFR-05. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, Microsoft Graph connection, calendar write or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design EC-03 in Figma | User decision, 19 October 2026 | Dean's request quoted above |
| Audit and polish; simpler phone tops, even without the main top bar | User decision, 19 October 2026 | Quoted above. Section 5 |
| Compact phone header for every phone page (Q5) | Claude's recommendation, adopted 19 October 2026 | Quoted above; Phone header amendment, `docs/decisions/phone-header-amendment.md` (draft PR #606) |
| Departures D1–D8 | Accepted as recommended, 19 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Team availability | Resolved as recommended | Accept the design now; build it after the read-only Microsoft pilot proves calendar sync, behind a new team availability permission. The "not permitted" state is drawn |
| Q2 Adding a follow-up to Outlook | Resolved as recommended | "Also add to my Outlook calendar" stays visible but unavailable until a scoped calendar-write stage (`Calendars.ReadWrite`) is approved |
| Q3 Meeting record links | Resolved as recommended | Reuse the EC-01 link panel and its owner-only rule: a colleague who can open the deal sees nothing of the meeting unless it is shared |
| Q4 "Needs a next step" | Resolved as recommended | Counts meetings linked to an open deal or lead that ended with no later PPO activity on that record; nothing else |
| Q5 The global header on phone module pages | Resolved as recommended | Decided once for every phone page as the Phone header amendment |
| Accept the design | User decision, 19 October 2026 | Quoted above |
| Named Figma version | User decision, 19 October 2026 | Saved as "Calendar — accepted" at Dean's request quoted above. Section 6 |
| Building the page | Not decided | Section 7 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Calendar · EC-03" `1511:396797`, under "— Sales —", after Emails · EC-01 and before Customer messages · EC-04. The page header `1511:396798` holds the conformance declaration; the notes card `1516:404634` is in Flows and notes. File index row "Row / Calendar · EC-03" `1546:416358`, after the Emails row |
| Desktop 1440 | Week 12–16 Oct, my calendar `1511:396866`; Day Thu 15 Oct with the site visit selected and the detail panel `1513:399685`; Team availability `1514:1105`; Plan follow-up `1514:400630`; List, To do after saving `1515:5440` |
| Tablet 1024 | Week with the rail and side menu collapsed `1513:400872` |
| Phone 390 and 320 | Day at 390 `1520:402460` and 320 `1520:402591`; List, To do `1520:402724`; meeting sheet `1520:402935`; Choose view `1522:7073`; Filter, full screen `1522:7244` |
| States | Desktop: loading `1516:5706`; Outlook out of date `1516:6114`; reconnect required `1516:6406`; nothing on Saturday 17 Oct `1516:402281`; team availability not permitted `1516:402601`. Phone 390: Outlook out of date `1523:6831` |
| Parts | Moved to Components › Sales parts at acceptance: Calendar / Event `1511:400437` (Kind Meeting, Tentative, Private, Busy, Cancelled, Conflict × State), Calendar / Due activity `1511:400452` (To do, Overdue, Done) and Calendar / Attendee row `1511:400453`. Icon/solid/calendar-days `1511:397397` on Components › Icons for the selected Activities rail item. The phone frames use Shell / Phone header · compact `1530:110` from the Phone header amendment |
| Prototype | Flows "EC-03 — desktop" (Week → Thursday site visit → Day with panel → Plan follow-up → Save activity → List; side menu Team availability, To do and My calendar; Day, Week and List switches) and "EC-03 — phone" (Day → Priva call → meeting sheet; "Calendar ▾" → Choose view → List; Filter → Filter panel) |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:05 AEST, Outlook synced 08:58, signed in as Jamie Park (Sales). Week Mon 12 – Fri 16 Oct. The Thursday 08:00–10:00 site visit at SYN Isolation Nursery for SYN-PPO-OPP-000026 Substrate store dosing review follows Dana Brooks' email on Emails · EC-01 ("Thursday from 08:00 works for us") and overlaps the 08:30 stand-up. The Priva supplier call is organised in Sydney (AEDT). Six activities to do, one overdue, three done this week; Plan follow-up adds "Call Dana Brooks about dosing set points", Fri 16 Oct 10:00 |
| Retained captures | [Calendar design r01](../reference/ui/sales/calendar-design-r01/README.md): eighteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:EC-03` and `route:/calendar` (Sales rail "Activities", `?scope=sales`; "Calendar" elsewhere). Page-register coverage under CRM-03, DOC-05, DOC-06, NFR-03 and NFR-05, unchanged. Capabilities `activity.read` and `email.read` unchanged; a team availability permission is proposed (Q1) |
| Page type (r20) | Register or worklist (Week, Day and List views of one person's calendar), with a record detail panel, a side form and a team availability view |
| Reused components | Shell v2 (Rail · Sales with Activities selected, the top bar with the Conversations action, side menu), the Service planner PL-01 toolbar, Record / Field, Section heading and Banner, Tag, Button, Grid header and cells with the Done cell, Planner / Input, Job pack / Select row, Conversations / Avatar, the My Work Activity list row (phone), and the EC-01 Email / Record chip and Mailbox status. New: Calendar / Event, Due activity and Attendee row |
| Incoming handovers | Outlook meetings from the signed-in user's primary calendar (read only, synced); PPO activities the user owns; deal, organisation and person links; follow-ups planned from Emails · EC-01 |
| Outgoing handovers | Plan follow-up creates a PPO Activity through the existing Activity command; Link records adds owner-only meeting links (Q3); ticking an activity completes it on its Activity record; Open in Outlook opens the provider event. It never sends invitations, changes Outlook or books Service visits |
| Source authority | The EC-03 design register pages; `src/components/email-screens.tsx`; `src/email/service.ts`; `src/shell/navigation.ts`; the Email & Calendar integration design |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 19 October 2026 |
| Decision record | This file |
| Named version | "Calendar — accepted", saved 19 October 2026 |

## 4. What the design shows

- **Week (default) and Day.** A time grid from 08:00 to 18:00 in the user's zone, with the zone in the gutter, a purple now line, and today's column tinted. Above the grid, a Due lane holds PPO activities by their due time. Outlook meetings sit on the grid; each item states its kind in words.
- **Detail panel.** A flush right panel for a meeting: the overline "Outlook meeting · read only", tags (Overlaps 1 meeting, You organise), a warning banner naming the overlap, When, Where and Source, the attendees with their Outlook responses (a person not matched to PPO shows the address only), the linked records with Link records, the next step (the PPO activity), and a sticky footer with Open in Outlook and Plan follow-up.
- **Plan follow-up.** A side form for a new PPO Activity: type, subject, due date and time (AEST), owner, the linked records copied from the meeting, and "Also add to my Outlook calendar" shown unavailable (Q2). Save activity adds it to the List.
- **List.** The To do activities as a grid grouped by due day, Overdue first, with the Done cell, type, due and linked record.
- **Team availability.** Colleagues as rows and weekdays as columns, each a 08–18 track showing Busy, Tentative, Out of office or Unknown (calendar not connected), with a "Free together" row and a legend. Subjects, places and attendees are never shown.
- **Side menu.** Calendar (My calendar, Team availability), Activities (To do, Overdue, Done this week) and Meetings (Not linked, Conflicts, Needs a next step), with the calendar status card: Connected, Out of date or Reconnect required.
- **Phone.** The compact header ("Calendar ▾", Go to today, Conversations, Filter), the week strip, one day line and the Due row, then the timeline. A meeting opens a bottom sheet; "Calendar ▾" opens Choose view (the side menu); Filter opens a full-screen panel. Sync shows on the page only when Outlook is out of date or needs reconnecting.

### Departures, accepted

| ID | Departure | Built page |
|---|---|---|
| D1 | One page, two labels ("Activities" in Sales, "Calendar" elsewhere). Week is the default view; Day and List are the others; the side menu holds Calendar views, Activities filters and Meetings checks | Opens on Day; Day and Agenda toggle; Email/Calendar tabs; no side menu views |
| D2 | Meetings take time on the grid; PPO activities sit in a Due lane and never reserve time; Service visits are not shown and the footer points to the Service planner | A separate "Due this day" list above the meetings (same rule, different layout) |
| D3 | Outlook meetings are read only; PPO's own actions are Plan follow-up and Link records; Open in Outlook opens the provider event | A read-only dialog; Open activity for activities only |
| D4 | Every state has words: Tentative, Private, Cancelled in Outlook, Overlaps, Busy, Out of office, Unknown. The owner sees "Private appointment"; colleagues see Busy | "Private" or "Synthetic Outlook" only |
| D5 | Overlapping meetings share the day column side by side with the Overlaps treatment, a day-header count and the Conflicts view; PPO never resolves a conflict | The whole day falls back to Agenda when any meeting overlaps or is under 30 minutes |
| D6 | Times in the user's zone with the zone in the gutter; the organiser's time added when it differs; each item names its source; a status card shows Connected, Out of date or Reconnect required (meetings hidden, PPO activities still shown) | "Brisbane · AEST" beside the heading; no sync state |
| D7 | Team availability, free or busy only, with Unknown for a calendar that is not connected and a Free together row; booking stays in Outlook | Not built |
| D8 | Phone puts the calendar first: the compact header, week strip, one day line and Due row; sync status in Choose view; Team availability on tablet and desktop only | The global phone header and the full toolbar |

## 5. Audit and polish

At Dean's request Claude checked every frame and rebuilt the phone views.

- **Phone:** rebuilt with the compact header and no global top bar; the sync line, Today button and Day/List switch left the page (now Go to today, Choose view and Filter); about 70 px more timeline. Added the phone List (the accepted My Work phone row), Choose view and Filter, and a phone out-of-date state. Conversations kept in the header (Dean's 18 October rule).
- **Desktop and tablet:** the Thursday overlap pair rebalanced so both titles read; today's column tinted in Week; long meeting details and the overdue wording shortened.
- **Prototype run (section 6):** a duplicate phone flow removed; the phone Filter changed to a full-screen panel (P5 of the amendment); Plan follow-up now plans a new call that appears in the List after saving, instead of an activity the Week already showed.

The audit is recorded on the notes card `1516:404634`.

## 6. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and the audit, and measured visible single-line texts against their rendered width. Truncation is left only where a narrow Week cell ends a long title with an ellipsis, as the built calendar's full-details-on-open rule allows.
- Claude played both flows in Present mode in Dean's Figma desktop app at Dean's request: the desktop flow from Week through Day, Plan follow-up, Save activity, List, Team availability and back, and the phone flow from Day through the meeting sheet, Choose view, List, Filter and back. Every link worked; the three fixes in section 5 followed.
- The eighteen captures are copies of the accepted frames on the "Captures (icon-free)" page from y = 280,000 (`1546:410421` to `1546:415779`). Prototype links were removed and each of the 572 Font Awesome icon instances was swapped for `Icon/placeholder`. Then:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 1,348 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link, and the two flow starting points the copies brought were removed from the Captures page.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/sales/calendar-design-r01/README.md).
- The named Figma version "Calendar — accepted" was saved on 19 October 2026 in the Figma desktop app (Ctrl+Alt+S, title typed, Save) at Dean's request. Claude confirmed it at the top of version history, opened from the file-name menu, and then updated the page header and notes card.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.

## 7. Not decided and not drawn

- **Building the page.** The built `/calendar` keeps its Day and Agenda views. The build order is not decided.
- **Prerequisites for a build:**
  - a calendar read for a week, not one day, and meeting fields the synthetic events do not hold: location, organiser and organiser's zone, attendees with responses, recurrence, tentative and cancelled states;
  - a connection and sync-state read (Connected, Out of date with last success, Reconnect required), as section 7 of the integration design describes;
  - owner-only meeting record links (Q3) and the "Needs a next step" rule (Q4);
  - Plan follow-up through the existing Activity command with the meeting's links;
  - the compact phone header in the application, in its own pull request (Phone header amendment, P9);
  - for Team availability, an approved free/busy projection and its permission (Q1).
- **Not drawn:** all-day Outlook items (proposed: top of the Due lane), recurring-series detail, Month view, the phone Week and Team views, a tablet Day panel, the Link records panel for meetings (it reuses EC-01's), 200% zoom and keyboard order.
- **Data in the frames:** the people, organisations, meetings, addresses and times are synthetic; `*.example` addresses are placeholders.
