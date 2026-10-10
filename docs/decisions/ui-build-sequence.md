---
document_id: PPO-UI-SEQ-DEC
date: 2026-10-09
owner: Dean Fiedler
status: Adopted sequence rules SD-01 to SD-05 (9 October 2026); phase 00 owner verdicts recorded 9 October 2026; other placements and pages not owner-reviewed
source_commit: 5005e7e1763bd53a28b47d6d48f3c87210f5cc1c
versioning: git
---

# UI build and review sequence

On 9 October 2026 Dean asked for one page listing every UI page that still needs to be created or refined, and the order in which to work through them, starting from a home page. He asked for the most professional approach.

## What already existed

Dean's request did not need a new inventory or a new order:

- **Inventory:** the live design register (`docs/design/development/register.json`) holds every page and scope: 350 entries, made up of 196 routes, 150 scopes and 4 shared systems. It also records each entry's build, visual-review and functional-proof status.
- **Order:** the r05 App Page Register issued build plan r02 on 23 September 2026. It is a dependency-led sequence of 12 phases (00 to 11) with an explicit predecessor list for each of the 150 scopes. Its rank 1 is SH-01, the role-based home overview. r02 describes itself as "not an approved schedule or an estimate of effort".

A second, hand-made list would drift from both. The sequence is therefore **derived**: `scripts/build-ui-sequence.py` reads the register and the issued plan, then writes [the generated sequence](../design/development/ui-build-sequence.md) and its JSON data. The `--check` mode fails if either output is stale. No `build_rank`, scope ID or issued byte is changed.

## Today's position (generated at this commit)

| Measure | Count |
|---|---:|
| Register entries | 350 |
| Placed in a phase | 347 |
| Excluded (development tooling) | 3 |
| Built, awaiting owner visual review | 190 |
| To refine | 105 |
| To build | 46 |
| Awaiting a scope decision (phase 11) | 6 |
| Owner visual review recorded | 0 |

The bottleneck is review, not building: no entry has an owner visual review recorded yet.

## Departures from r02, adopted 9 October 2026

The r02 phase order and every issued rank are kept. Five rules are added on top. Dean adopted SD-01 to SD-05 on 9 October 2026 and started the phase 00 review. Adoption covers the rules, not each placement: individual placements and every page still need owner review.

| ID | Rule | Reason |
|---|---|---|
| SD-01 | A register entry added after r05, and therefore unranked, takes the phase and rank of its first ranked related scope. This places 79 routes; each row shows its placement basis. Development tooling routes are excluded. | Every entry lands in exactly one place by a rule anyone can rerun. To move an entry, edit its register record, not the generated output. |
| SD-02 | The four shared systems (shell, theme, guidance, offline) belong to phase 00. | They already exist and every page depends on them, so they are verified with the baseline. Changing a shared template fixes many pages at once. |
| SD-03 | Two tracks run in phase order. The **review track** covers built and to-refine entries and starts at phase 00. The **build track** covers unbuilt entries and starts at phase 01 (AD-01 first). Within a phase, review and refinement come before new builds. | Review is the constraint. Refinements to templates and shared controls should land before new pages copy them. The tracks are independent queues, so a review never waits on a build. |
| SD-04 | Walk one synthetic job, from customer to management report (15 steps), after each phase as far as the built pages reach. Re-check SH-01 home and SH-02 My Work after phase 08. | Phase order is not journey order. The walk shows handover gaps that page-by-page review misses; the 8 October direction asks for exactly these connected journey walks. Home aggregates later phases, so its content is only judgeable once they exist. r02 asked to "recheck affected flows after every later phase"; this makes the check concrete. |
| SD-05 | A phase is complete when every placed entry has an owner visual review recorded in the register and every to-refine entry has a recorded outcome. Functional proof and deployment stay separate statuses. | Gives each phase a finish line that is visible in the register, without folding review into implementation evidence. |

## Phase 00 first

The first review phase is the existing baseline. It contains:

- the 4 shared systems;
- SH-01 role-based home;
- SH-02 My Work;
- SV-04 appointment detail;
- PL-01 service planner;
- FI-01 technician Today;
- FI-02 offline;
- FI-07 attendance and report response;
- their 19 routes.

Starting here matches Dean's suggestion to begin with the home page.

## Phase 00 review, session 1 (9 October 2026)

Claude prepared the first review session; the verdicts remain Dean's.

- **Material:** [the evidence set](../testing/evidence/ui-review-phase-00-r01/README.md) holds 42 hashed captures of all 30 phase 00 entries at 1440 and 390 px from the running app, plus the automated checks and the findings.
- **Automated checks:** every page answered 200 in about 2 s, with no horizontal overflow, console errors or failed API calls. One shared contrast failure, the search shortcut hint, appears on 18 desktop pages.
- **Shared findings:** S1 to S9. Under SD-02 these are fixed first in the shell, theme and guidance, because each one fixes many pages.
- **Claude's proposed verdicts:** 7 accept, 5 accept with minor fixes, 16 refine, 1 own session (theme, through the component catalogue) and 1 later phase (FI-07, with SV-06).
- **Owner verdicts (9 October 2026):** Dean accepted the proposed verdicts. 28 entries now hold an owner visual review: a record in the page contract, then the reviewer, date and fingerprint in the register. Of these, 7 are accept, 5 accept with minor fixes and 16 refine. The theme review is deferred to a component-catalogue session, and FI-07 to phase 04. Phase 00 is not complete under SD-05 until the refinements have recorded outcomes.
- **Refinement batch 1:** the shared shell findings S1, S2, S4 and S7 are fixed; S3 was withdrawn after verification ([evidence](../testing/evidence/ui-refinement-batch-1/README.md)). The 28 reviews are now stale and need a fresh owner look. S5, S6, S8, S9 and the page-level refinements follow in later batches.

## Phase 00 refinement canvas (9 October 2026)

Dean asked for refinements to be worked on a separate board. Each phase gets its own refinement canvas, so the navigation canvas stays an architecture record.

- **Canvas:** [PPO UI refinement · Phase 00](https://claude.ai/artifact/E5wdx1FiF3ZUVb86oXps2E). It is private to Dean and is built with the Powerplants One design system.
- **Shared rules:** three boards propose S6 (one date and time format), S5 (plain wording in place of specification text) and S9 (page guide content). S6 asks Dean to choose between 24-hour times, which are the current rule, and am/pm.
- **Pages:** four pairs for My Work. Each pair has a "today" board with the batch 1 captures and a proposed desktop and phone layout. The pages are the overview, the activity record, Create activity and Reviews & handovers.
- **Proposed new behaviour:** Create activity fills in the working company. Today the user chooses it. Reviews & handovers renames tab and filter labels (All I can see, Area, Type, Owner) and shows exact counts in place of "(0+)".
- **Next on the canvas:** Sales and Service phase 00 pages.

The canvas is a proposal. Nothing on it is adopted until Dean marks it up or accepts it, and nothing changes in the app until a later batch builds it with fresh evidence. The repository remains the authority. The canvas has no retained capture.

### Owner decisions (9 October 2026)

Dean replied: "24-hour; accept S5, S9 and all My Work proposals".

| ID | Decision | Applies |
|---|---|---|
| S6 | Adopted, with **24-hour** times: year always shown; every scheduled time carries its zone and offset, e.g. "4 Sep 2026, 10:00 AEST (UTC+10)"; dense lists state the zone once; relative urgency keeps the actual date beside it; internal zone names such as Australia/Brisbane are never shown. Built as one shared formatter with its own tests. | Every phase 00 instance on the board |
| S5 | Adopted: each listed instance is rewritten in plain words, moved to the page guide or hidden. Statements that protect people stay visible in plain words; synthetic and fictional-data labels stay. | Every phase 00 instance on the board |
| S9 | Adopted: the drafted My Work guide becomes the page guide, and the development draft disclosure and revision label are shown only in the development workspace. The guide stays a draft in the register until Dean reviews it in the running app. | My Work, then each phase 00 page |
| My Work | All four proposals accepted: the overview, activity record, Create activity and Reviews & handovers. This includes the new Create activity behaviour: the person's working company is filled in for them and can still be changed. | `route:/work`, `/work/[id]`, `/work/new`, `/work/reviews`, `/work/waiting` |

**Build order.** Batch 2 builds the shared S6 formatter, S9 and the My Work pages, with the S5 and S6 instances on those pages. The S5 and S6 instances on Sales, Planner, Appointment, Field and Offline pages are built with those pages' own refinements in later batches, so each page changes once and is recaptured once. An acceptance here is a design decision; each built page still needs Dean's fresh visual review in the register before phase 00 closes (SD-05).

**Batch 2 built (9 October 2026).** The shared S6 formatter, the four My Work pages, the Blocked & waiting wording and the My Work guide are built ([evidence](../testing/evidence/ui-refinement-batch-2/README.md)). Two points differ from the drawings:

- **Access labels:** the canvas said "Service team only". The real rule is "Anyone who can see the linked record" (RestrictedService). The boards and the app use the accurate wording.
- **Company prefill:** if the person has no working company but can reach only one company, that company is filled in, as the header already shows it.

Every affected entry's owner review stays stale until Dean looks at the built page.

### Sales and Service pages on the canvas (9 October 2026)

Dean asked for the Sales and Service phase 00 boards to be added. The canvas now has a **Sales pages** page and a **Service pages** page, with 14 boards. Each page is shown as a "today" board, with fresh captures from the compiled app after batch 2, beside proposed desktop and phone layouts. The pages are:

- **Sales:** Add deal (`route:/sales/opportunities/new`, S8) and Sales tasks (`route:/sales/tasks`).
- **Service:** the planner (`route:/schedule`, PL-01); appointment detail (`route:/service/appointments/[id]`, SV-04); My jobs, field job and site readiness (FI-01); and the offline field workspace (`route:/offline/index.html`, FI-02, `system:offline`).

Each proposal applies the adopted S5, S6 and S8 rules to its page. These proposals need Dean's decision:

| Page | Decision needed |
|---|---|
| Planner | Open on the current week. Today, the planner's coded default day (`src/scheduling/navigation.ts`) is 22 September 2031, and browser suites may rely on that default. |
| Field job | Darker timer digits. This departs from the accepted timer baseline. |
| Offline | Restyle with PPO tokens and type, in place of its own teal palette. It stays standalone so it works without the network, and its rules are kept: a local save is not a server receipt, downloads expire, and unsent originals are never deleted. |
| Appointment | Restore the section gap under the action row, and move Cancel appointment to the foot of the page. |
| Add deal | The deal title comes first and the customer before the visibility company. The working company is filled in, as on Create activity. The save state is visible. |

Nothing on these boards is adopted until Dean accepts it. The main board lists their status as "Proposed".

### Planner working hours (10 October 2026)

Dean described the working day: "our standard hours are from 8am to 5pm, but it's not uncommon for a technician to work from 7am to 6pm at times. We try to avoid working early and later than this though."

The live booking rule (`fitsWorkingInterval` in `src/scheduling/booking-rules.ts`) refuses a visit or its travel outside the person's published calendar interval. The sample calendars (`db/seed-p05.sql`) publish 08:00 to 17:00, Monday to Friday, so work from 07:00 or until 18:00 cannot be booked today. Two options were put to Dean: publish calendars as 07:00 to 18:00 and warn outside 08:00 to 17:00, or keep 08:00 to 17:00 calendars and add a separate extended-hours rule. Dean replied: "Go with your recommendation on the calendars", which adopts the first.

| Rule | Decision |
|---|---|
| Published calendar interval | 07:00 to 18:00 on working days. The server rule is unchanged and still refuses anything outside the published interval. |
| Standard hours | 08:00 to 17:00. A visit or its travel outside them is allowed, with a warning that names the person and the times. |
| Capacity and free time | Count standard hours only, so extended hours are never offered as free time. |

The canvas planner and appointment boards show it as a 07:00 to 18:00 Day timeline with Extended hours bands, and the warning in "Checked as you edit".

**Built (10 October 2026), in the app as it stands:**

- **Sample calendars:** `db/seed-p05.sql` publishes 07:00 to 18:00 on weekdays, as "SYN weekday 07:00–18:00 Brisbane". Published calendars are immutable and seed 5 never re-runs, so only databases seeded from now on get it. Dean's local database and the hosted demo keep 08:00 to 17:00 until they are rebuilt; ADR-0030 accepted the same limit for its date shift.
- **Standard hours:** a fixed rule in `src/scheduling/working-hours.ts`, read in each person's calendar timezone. Calendars hold one interval per weekday and have no editor, so there is nowhere to record standard hours as data yet. Move it into calendar or policy data when a calendar editor is built.
- **Warning:** Confirm appointment, Move or reassign and Propose a schedule change show "Extended hours" when a person's visit or travel falls outside 08:00 to 17:00, naming the person and the times. It is worked out in the browser as the form changes and never blocks a save. The server rule is unchanged.
- **Planner:** a confirmed card in a person's lane says "Extended hours" with that person's times, including travel.
- **Not built:** the 07:00 to 18:00 Day timeline. The live planner has no time axis; that belongs to the board refinements below.
- **Capacity:** unchanged. The app computes no calendar-based capacity or free time, so "capacity counts standard hours only" waits for those calculations.

### Planner boards refined (10 October 2026)

Dean refined the four playable planner boards on the canvas (Day, Week, Map and phone) through board comments and messages on 9 and 10 October. The boards share one set of rules and synthetic data. Canvas version 159 (`1791622886-4b94`) holds the result, with a notes board that separates what is decided, what is simulated and what still needs his OK. The board sources run only in the Design runtime and are not copied here. These are design decisions; nothing has changed in the app. The build rules are in the [planner design contract](../design/development/pages/route-schedule.md#phase-00-refinement-boards--10-october-2026).

| Topic | Dean's words | Decision |
|---|---|---|
| Details | "Proceed however you believe is the most professional." (on the details pane and people column) | A selected visit opens as a snapshot in the live Deals snapshot's layout, in place of a fixed details pane. People on leave move to a short row at the bottom. |
| Neighbouring visits | "Refine this so they look more professional." (on two touching bookings) | Neighbouring bookings keep a 4 px gap. A visit and its own travel join with no gap. |
| Card colour | "I'm wondering if we should apply a very faint pastel blue colour to these cards that are white, as they are hard to see against the white table background." | Confirmed bookings are faint blue (`#eef4fa`, border `#c8d6e5`), lighter than any person's identity colour. Amber stays for needs attention and hatching for proposed. |
| Borders | "make the border go around the travel time slots as well, but don't apply the border that is between the travel timeslot and the appointment timeslot"; "make the border the same colour as the background colour that has been used in the Pack needed pill, not the text colour." | A booking and its travel read as one bordered shape. A selected card that needs attention takes `#fff5df`, the Pack needed pill's background, in place of navy. |
| At rest and on hover | "a border shadow is being applied to this two yellow cards, even when they are not selected or hovered over."; "Maybe if they jump out very slightly when hovered over"; "Don't make the hover effect based on a percentage"; "make it 3px" | Cards are flat at rest; only a selected card has a shadow. On hover a booking grows a fixed 3 px on every side, with no shadow or border change, and a visit and its travel grow together. Week tiles and phone cards grow 3 px each side and rise 1 px; map pins lift 3 px. |
| Help button | "I think we can remove this button as we already have the "?" icon in the very top banner on the page." | The planner has no help button of its own; the shell's help icon covers it. |
| Rail | "The left navigation rail should never scroll, so all icons must fit on the page." | All 13 Service destinations fit at 44 px, the touch minimum, with 2 px gaps. |
| Strip-back | "Yes, strip it back as you recommend" (Week), then "Apply the same strip-back to the phone planner", "... to the Day planner" and "... to the Map planner" | Each fact shows once. People show name, role on desktop and one total, such as "4 of 9 h booked", with no bars. Free time is hover and screen-reader text, because the gaps on the board already show it. Bookings show time, title and site; Week tiles show time and title. Colour and shape give the status; the status in words, travel and extended hours are in the hover text and the snapshot. Crew initials appear only on shared visits. The Week view shows how full a day is as a soft shading, and the weekend as a slim strip while nothing is booked there. The map marks a stop that needs attention with its key's amber "!" and draws no labels on route lines. |
| Phone and Map | "Apply the same refinements to the phone planner"; "Apply the same refinements to the Map planner" | Both follow the Day view: people on leave last, hours booked, the extended-hours marker, flat cards and the fixed hover. |

### Planner Day timeline (10 October 2026)

After the merges Dean asked why the live planner looked nothing like the boards: only the working hours had been built. He was offered a staged build (Day timeline, details panel, Week, phone, then Map) and replied: "Yes to both, proceed with your recommendations". That adopts the recommended answer to each open item the Day view needs:

| Item | Adopted |
|---|---|
| Hours booked and free time | Shown. Each person shows "x of y h booked": time reserved for visits and their travel inside standard hours, out of standard hours less unavailable time and closures. Free time is gaps of 30 minutes or more in the same window, from now on for today, in hover and screen-reader text. Both use every reservation the server returns for the person, so a site or status filter never makes someone look free. |
| Needs attention | Pack preparation or review required, or customer contact not confirmed, as on the board. The live app's scheduling policy holds and scope reviews also count, and are named first. |
| Day drop | Dropping a visit on the timeline proposes a new start time from where it lands, snapped to 15 minutes. It opens the existing Move or reassign form with the crew unchanged; nothing is saved until the server accepts it. The Week drop still keeps the time and changes the day. |
| Past time today | A very light wash from 07:00 to the Now line, with no label. |
| Details panel | A selected visit opens a 360 px details panel beside the board; the board narrows rather than being covered. Below 1100 px the panel sits over the board's right side. It was built with the Day view because the stripped-back cards carry no buttons: Move or reassign and Open appointment are in the panel. |

Built in the live planner the same day; see the [planner design contract](../design/development/pages/route-schedule.md#day-timeline-built--10-october-2026).

### Planner Week board (10 October 2026)

Dean, after stage 1: "Yes to both, proceed with the Week view" (Auto-fix on the stage 1 pull request, and stage 3). The Week view is now the stripped-back board he adopted on 10 October ("strip it back as you recommend"), built in the live planner on wide screens; see the [planner design contract](../design/development/pages/route-schedule.md#week-board-built--10-october-2026). The rules are those already adopted for the board, with three points the live data needed:

- Reserved time that no displayed visit accounts for (a site or status filter hides the visit) shows as a dashed "Reserved" block, so a cell is never drawn as free when the person is booked.
- People away for every weekday shown, and inactive people, move to short rows at the bottom with one line across the week.
- A weekend day is a slim strip while no one has a visit, unavailable time, a closure or a reservation on it; otherwise it is a full column.

### Planner phone layout (10 October 2026)

Dean, after stage 3: "Yes to both, proceed with the phone layout" (Auto-fix on the Week pull request, and stage 4). Below 781 px the planner now follows the phone board he aligned on 10 October: day chips for the week, an attention row, one card per person with a 07:00 to 18:00 strip and their visits, a Week list by day, and the details as a bottom sheet; see the [planner design contract](../design/development/pages/route-schedule.md#phone-layout-built--10-october-2026). Two points the live app needed:

- On a phone the Day view reads the whole week (Monday to Sunday) so the day chips can show how many visits each day has. Wide screens still read one day.
- The attention row counts proposed visits and visits that need attention in what is loaded, and jumps to the Proposed and cancelled list on the page. The board's separate To schedule tray is not built.
- To answer the phase 00 finding that tabs and filters filled the first phone screen, the Scheduling tabs scroll in one row on every Scheduling page, and the planner's timezone, Work orders link and filters fold behind a Filters button on phones.

Still to decide on the planner:

- Checks shown as you edit, and AEST times in the reservation message.
- A rule for windows too short for the rail. (The distinct icons for five Service destinations were decided separately and built in #394.)
- A map provider. It needs an architecture decision record before the Map view is built.
- Opening on the current week (from the table above).

## Where it is shown

The navigation architecture canvas gains a **UI build sequence** board drawn from the generated data. The repository files remain the authority. The board was added after the r02 capture set, so no capture of it is retained.

## Still open

- Owner review of individual placements, starting with phase 00.
- Whether any r02 rank should change now that most of phases 00 to 06 is built. No re-ranking is proposed without that review.
