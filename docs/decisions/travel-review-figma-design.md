---
document_id: PPO-PL05-TRAVEL-REVIEW-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
versioning: git
---

# Travel review design — owner decision

On 18 October 2026 Claude recommended drawing Travel review next, to complete the Scheduling workspace, and Dean replied: "Yes, proceed on that basis." Claude drew the page in Figma: scope PL-05 "Visit route and travel review" at `/schedule/travel`. It sits in the Scheduling side menu under Reviews, next to the Changes and follow-up page (PL-04), which was drawn and accepted the same day ([Changes and follow-up design](changes-follow-up-figma-design.md)).

Claude drew the page from these sources:
- the PL-05 design register pages ([scope-pl-05](../design/development/pages/scope-pl-05.md), [route-schedule-travel](../design/development/pages/route-schedule-travel.md));
- [PPO-SCHED-ADR](scheduling-resources-architecture.md);
- the built `TravelWorkspaceScreen` and `travelSequences` in `src/scheduling/components/client/review-workspaces.client.tsx`;
- the PL-04 proposal frames, which this page copies for its shell and side menu;
- the accepted [Service planner](service-planner-figma-design.md) (PL-01), for the travel tint and the people and visits of the story.

Before accepting, Dean asked Claude to "give all the pages an audit and polish". Dean was then asked "Do you accept Travel review with the recommendations?" and replied: "I accept the Travel review PL-05 design with your recommendations, including D1–D5 and Q1–Q2." The intended named Figma version is "Travel review — accepted". It is **not saved yet**; it waits for Dean's explicit yes.

Scope:
- `scope:PL-05` "Visit route and travel review", with `route:/schedule/travel` (side menu item Travel review).
- Parent requirement IDs are not traced to PL-05 individually. [PPO-SCHED-ADR](scheduling-resources-architecture.md) traces the scheduling programme. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment. It chooses no route-estimate provider and no map.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Travel review (PL-05) next | User decision, 18 October 2026 | "Yes, proceed on that basis." to Claude's recommendation to complete the Scheduling workspace |
| Conversations action in the top bar | User decision, 18 October 2026 | Every new top bar carries the proposed Conversations action left of the information icon. The shell amendment itself is a separate record and is still open (section 5) |
| Audit and polish before acceptance | User decision, 18 October 2026 | "give all the pages an audit and polish". Section 6 |
| Departures D1–D5 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Route estimates | Resolved as recommended | Keep "Unknown" until a route-estimate provider is chosen through its own decision. No map in this design. The page shows planned travel allowances with their basis (reviewed standard allowances in the story) |
| Q2 Default view | Resolved as recommended | Start on one person, not "All permitted resources": the first person with a conflict, or the signed-in technician. Comparing an order needs one person |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Named version "Travel review — accepted" | Not saved | Waits for Dean's explicit yes |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The intended named version is "Travel review — accepted"; it is not saved yet. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Travel review · PL-05" `1371:3488`, under "— Service operations —", after Changes and follow-up · PL-04 `1326:4525` and before Appointment detail `1187:50`. The page header `1371:3489` holds the conformance declaration; the notes card `1374:985` is in Flows and notes. File index row "Row / Travel review · PL-05" `1396:355190` (Accepted, decision record `travel-review-figma-design.md`) |
| Desktop 1440 × 900 | Casey Ward's route with an availability block overlapping travel `1371:3524`; comparing a different order `1373:1001` |
| Tablet 1024 | Route with the rail and side menu collapsed `1371:3653` |
| Phone 390 and 320 | Route, full length: `1371:3722` (390 × 1697) and `1373:1604` (320 × 1849) |
| States | Phone 390: no assigned visits `1371:3758`; could not load `1371:3800` |
| Prototype | No frame-to-frame links are drawn. The frames keep the shell's own rail and side-menu toggle interactions. After acceptance on 18 October 2026, Claude removed six copied links to another page and renamed the flow starting points "PL-05 — desktop" and "PL-05 — phone" |
| Page parts | None as components. The route stop, travel leg and visit card are drawn as proposed layouts inside the frames; the page has no component section |
| Story | Synthetic: Casey Ward (lead technician) on Tue 13 Oct 2026 in AEST, with the same two visits as the planner and PL-04: SYN-PPO-APT-000049 (SYN-PPO-WO-000039, Irrigation controller firmware update, SYN Block C Plant Room) and SYN-PPO-APT-000052 (SYN-PPO-WO-000040, Shade screen motor replacement, SYN Glasshouse 4, with Riley Tran). A toolbox talk at the depot, 12:45–13:15, is the availability block. Pat Rowe has no assigned visits in the empty state |
| Retained captures | [Travel review design r01](../reference/ui/service/travel-review-design-r01/README.md): six icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PL-05` "Visit route and travel review", `route:/schedule/travel` (side menu item Travel review). Parent requirements as traced by PPO-SCHED-ADR, unchanged. Capabilities unchanged (`schedule.read` and the existing scoped reads) |
| Page type (r20) | Review / comparison for one person's day |
| Reused components | Shell v2 (Rail · Service with Schedule selected, top bar, the Scheduling side menu as drawn for PL-04), toolbar filters, Tag, Button, the planner's travel tint (PL-01), and Shell / Top bar action · Conversations from the proposed shell amendment. New, proposed: the route stop, travel leg and visit card layouts |
| Incoming handovers | A day, time zone and person from the Service planner or Field team; the current permitted scheduling assignments, anonymous busy intervals, availability blocks and calendar closures, all read-only |
| Outgoing handovers | An exact visit (appointment, resource, day, time zone and any site filter) to Changes and follow-up (PL-04) through "Review booking change"; the planner for proposed visits without a crew. The page never moves, books, assigns or dispatches |
| Source authority | The PL-05 design register pages; [PPO-SCHED-ADR](scheduling-resources-architecture.md); the built `TravelWorkspaceScreen`; the accepted Service planner |
| Proposed departures | D1–D5 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Travel review — accepted", not saved yet |

## 4. What the design shows

### Desktop

- **Toolbar:** Person (Casey Ward), the day, the time zone (AEST), the count and read time ("2 visits · read 08:45"), and two actions.
- **Heading:** "Casey Ward · lead technician", with the visit count, day and time zone.
- **Route estimate note:** "Route estimate: unknown, no provider is set up. These are planned travel allowances; actual field travel is recorded separately."
- **Route (D1):** stops, travel legs and visits in time order. The day starts with "08:00 Leave Brisbane depot" and ends with "17:00 Back at Brisbane depot".
  - Each travel leg is in the planner's travel tint and shows its minutes, before or after, from and to, and its basis ("reviewed standard allowance").
  - Each visit card shows its booked times, appointment number, status tag, scope, site, work order, crew and the customer window, or "customer window not supplied". It carries Earlier, Later and Review booking change. Earlier is disabled on the first visit and Later on the last.
  - A gap between reservations shows its length and says "whether the route fits is unknown".
- **Conflicts (D4):** an availability block or calendar closure is shown in words on the leg or visit it overlaps. In the story the travel leg before the second visit is amber: "Availability block 12:45–13:15 (toolbox talk at the depot) overlaps this travel. Review with the coordinator."
- **Day summary (D2):** Visits, Planned travel ("120 min in 4 legs"), Gaps, Issues, Route estimate ("Unknown"), Busy and Blocks in one panel. Below it, "Compare another order" explains Earlier and Later and holds Reset comparison.

### Comparing an order (D3)

- A note replaces the route estimate note: "Comparing a different order. Times stay as booked and gaps are not recalculated; nothing changes until a booking change is reviewed."
- Each visit shows its original and compared position ("Original order 2 · now 1"). The day starts at the depot with no time.
- A visit whose booked time now comes before an earlier visit says the reversal needs a controlled move through a booking change.
- The summary shows Gaps "Not recalculated" and adds "1 order reversal" to Issues. Reset comparison is enabled only while comparing.

### Tablet 1024

The rail shows icons only and the side menu is collapsed. The route and day summary stay side by side. The toolbar shows the count without the read time.

### Phone (D5)

- The same route as one scroll, with the day summary and Compare another order below it.
- The toolbar has two rows: the person, the count and an action; the day, the read time and an action. At 320 px the read time is not shown.
- Earlier and Later sit on one row and Review booking change on the next.
- At 320 px the title is "Travel", and each visit's top row wraps so the status tag sits under the time.
- Travel review is reached from More.

### States

- **No assigned visits:** "No assigned visits for Pat Rowe", saying proposed visits without a crew stay in the planner and an empty list does not certify availability, with Open the planner.
- **Could not load:** "Travel could not be loaded". No route is shown, so nothing on the page is out of date; the count shows "—" and "Current results unconfirmed"; bookings are unchanged; Retry loading.

### Departures, accepted

| ID | Departure | Earlier pattern (built page) |
|---|---|---|
| D1 | Route layout: depot, travel legs and visits in time order, each leg showing minutes, from and to, and its basis, in the planner's travel tint | A list of cards, one per visit, with travel before and after as a line of text in each card |
| D2 | Day summary: visits, planned travel, gaps, issues, route estimate, busy intervals and availability blocks in one panel | An expandable "Other busy intervals and availability blocks" section and a separate route-estimate sentence |
| D3 | Comparing an order: Earlier and Later reorder the route for comparison only; each card shows its original and compared position, gaps are not recalculated, and a reversal of booked times says a controlled move is needed. "Reset comparison" is enabled only while comparing | "Original order N" and the original-schedule gap in each card; "Reset sequence comparison" in the toolbar |
| D4 | Conflicts on the leg they affect: availability blocks and calendar closures are shown in words on the travel leg or visit they overlap, not only in a list | A status line on the visit card saying an availability block or calendar closure overlaps the reservation, without naming the block or the leg |
| D5 | Phone: the same route as one scroll with the summary below it; at 320 px the title is "Travel" and each visit's top row wraps | The desktop card list stacked |

## 5. Not decided and not drawn

- **Building the page.** The built page is `TravelWorkspaceScreen`: a page header, the day controls, a resource select starting on "All permitted resources", and a list of visit cards. The build order is not decided.
- **Prerequisites for a build:**
  - the rule for the starting person (Q2): the first person with a conflict, or the signed-in technician;
  - naming the overlapping block or closure and the leg it affects (D4), which the built `travelAvailabilityConflicts` result supports per visit but the page does not show today.
- **Route estimates.** No provider is configured. Choosing one, and any map, needs its own decision (Q1). Planned travel allowance, route estimate and actual field Travel stay separate facts.
- **The Conversations action** is part of the proposed top-bar shell amendment, which is a separate, still-open record. `Shell / Top bar` and `Shell / Phone header` change only when that amendment is accepted.
- **Not drawn:**
  - all permitted resources at once;
  - a day with an overlap between reservations;
  - the site filter note;
  - denied access;
  - 200% zoom, which the spec reviews separately;
  - a loading state, desktop and tablet states, hover states and the open person, day and time zone menus.
- **Data in the frames:** the people, visits, sites, blocks and times are synthetic. They are not operational records, and "reviewed standard allowance" is a synthetic basis, not an adopted travel rule.

## 6. Audit and polish

At Dean's request ("give all the pages an audit and polish"), Claude checked the seven new proposal pages of 18 October together:
- truncation and overflow;
- fonts (Roboto only);
- labels and rail selection;
- the Conversations action on every top bar;
- placeholders;
- one story across the pages (people, sites, dates and record IDs).

The notes card records that no change was needed on this page.

## 7. Verification

- The page was built from copies of the PL-04 proposal frames. The notes card records that no accepted frame or main component was edited.
- A read of the page on 18 October 2026, while writing this record, found no components on it and Roboto as the only text font.
- The six captures are copies of the accepted frames on the "Captures (icon-free)" page (`115:2`), from y = 212,000. Prototype links were removed and 170 Font Awesome icon instances were swapped for `Icon/placeholder` (`67:77`) at their original size. A scan after the swap found no Font Awesome instance and no visible vector outside a placeholder or the Powerplants logo.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/service/travel-review-design-r01/README.md).
- Claude did not play the prototype in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
