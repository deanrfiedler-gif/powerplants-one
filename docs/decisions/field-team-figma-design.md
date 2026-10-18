---
document_id: PPO-PL02-FIELD-TEAM-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: ca7695245cbf66bf9a85c1a9fb55776589042f37
versioning: git
---

# Field team design — owner decision

On 18 October 2026 Dean asked Claude to design and draw the next Service page in Figma: Field team, scope PL-02 "Resource availability and competence". It covers the register at `/service/technicians` and the person page at `/service/technicians/[id]`. He asked for the same process as Service requests (SV-01/SV-02) and Service review (SV-06), and for the page to stop for his acceptance.

Claude drew the page from these sources:
- the PL-02 design register pages ([scope-pl-02](../design/development/pages/scope-pl-02.md), [route-service-technicians](../design/development/pages/route-service-technicians.md), [route-service-technicians-id](../design/development/pages/route-service-technicians-id.md));
- [PPO-SCHED-ADR](scheduling-resources-architecture.md);
- the built `FieldTechniciansScreen` and `ResourceWorkspaceScreen`, and `competenceState` in `src/scheduling/workspace-model.ts`;
- the accepted [Field Technicians r05](../reference/ui/field-technicians/powerplants-one-field-technicians-r05-change-record.md) baseline;
- the accepted [Work orders](work-orders-design.md), [Work order record](work-order-record-page-design.md), [Service planner](service-planner-figma-design.md), [Service requests](service-requests-figma-design.md), [Service review](service-review-figma-design.md) and [Appointment detail](appointment-detail-figma-design.md) pages.

While the page was being drawn, Dean added: "Don't forget to add the Conversation icon to the main top bar, just to the left of the information icon." Before accepting, he asked for an audit and polish: "Give the new page UIs an audit and professional polish first to ensure they are accurate and look as professional as possible." He then accepted it: "I accept the Field team PL-02 design with your recommendations, including D1–D8 and Q1–Q5." The design reference is the named Figma version "Field team — accepted".

Scope:
- `scope:PL-02` "Resource availability and competence", with `route:/service/technicians` and `route:/service/technicians/[id]`.
- Parent requirement IDs are not traced to PL-02 individually. [PPO-SCHED-ADR](scheduling-resources-architecture.md) traces the scheduling programme (SVC-04/05 and the others it lists). No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Field team (PL-02) next | User decision, 18 October 2026 | Dean's request quoted above |
| Conversations action in the top bar | User decision, 18 October 2026 | "Don't forget to add the Conversation icon to the main top bar, just to the left of the information icon." Applied as D8 |
| Audit and polish before acceptance | User decision, 18 October 2026 | Quoted above. Section 6 |
| Departures D1–D8 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Default view | Resolved as recommended | Technicians, because the planner now shows the day's visits and dispatch holds. Visits and Needs preparation stay one click away |
| Q2 Review window | Resolved as recommended | Keep the built rule: the person page starts on the incoming day for seven days (Tue 13 – Mon 19 Oct in the frames), not on Monday like the planner's Week board |
| Q3 Role label | Resolved as recommended | Show the resource type until the resource source publishes a role. The role (Lead technician, Controls specialist and so on) is a build prerequisite; no read supplies it today |
| Q4 Hours total | Resolved as recommended | Adopt the planner's accepted rule for both pages: standard hours less leave and other work, with proposed visits not counted. PPO-SCHED-ADR defines no working-time denominator, so the rule is recorded when the page is built |
| Q5 Reviewer | Resolved as recommended | Show the reviewer ID in the evidence panel now. A name needs a people read later |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Field team — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Field team · PL-02" `1289:54`, under "— Service operations —", after Appointment detail `1187:50` and before Job pack `272:2`. The page header holds the conformance declaration; the notes card `1295:5240` is in Flows and notes. File index row "Row / Field team · PL-02" |
| Desktop 1440 × 900 | Register, Technicians view `1295:4183`; person snapshot, Casey Ward `1295:4405`; person record, full length (1440 × 1705) `1295:4633`; competence evidence side panel `1302:4533` |
| Tablet 1024 | Register with the side menu collapsed `1295:4833` |
| Phone 390 and 320 | Register `1295:4892` and `1307:5242`; person page, full length, `1295:4933` and `1310:307367` |
| States | Phone 390: loading `1295:5069`; no matches `1295:5108`; could not load `1295:5132`; view only, visit details outside your access `1310:309552`; incomplete result `1310:309369`. The spec allows no edits, so there is no save, stale or refused-save state |
| Prototype | Flows "PL-02 — desktop (proposal)" and "PL-02 — phone (proposal)": register row to snapshot, snapshot to record, record competence row to the evidence panel and back, breadcrumb to the register; phone row to the person page and back. Claude set the links through the connector but did not play them in Present mode |
| Page parts | Section "Page components (proposed)" `1292:54`: Field team / Avatar `1292:59`, Technician grid header `1292:60` and row `1292:234`, Technician list row (phone) `1294:201`, Availability / Segment `1294:654`, Competence row `1294:739` and its phone form `1308:5295`, Technician / Visit row `1294:740` and its phone form `1308:5296`. They stay on the page, as the Service requests and Service review parts do |
| Story | Synthetic: Casey Ward (lead technician) on Tue 13 Oct 2026, with the planner's people and day totals, SYN-PPO-WO-000040 / APT-000052 from the field readiness gate story and Appointment detail, and WO-000047 from the planner tray |
| Retained captures | [Field team design r01](../reference/ui/service/field-team-design-r01/README.md): ten icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PL-02`, `route:/service/technicians` (rail item Field team) and `route:/service/technicians/[id]`. Parent requirements as traced by PPO-SCHED-ADR, unchanged. Capabilities unchanged (`schedule.read` and the existing scoped reads) |
| Page type (r20) | Register or worklist for the Field team views. Record detail with existing register for the read-only person page, as one scrolling page. A read-only review panel for competence evidence |
| Reused components | Shell v2 (Rail · Service, top bar, Menu item, Menu heading, Menu strip and edge), Grid header and cells, the large snapshot, Record / Header, Readiness bar, Check item, Field, Section heading, Tag, Button, the Service planner avatar style (planner-avatar tokens), and Shell / Top bar action · Conversations from the proposed shell amendment. New: the page parts in section 2 |
| Incoming handovers | The exact permitted resource, review day, site and display time zone from the Service planner or the Field team register; the published resource, calendar, skill evidence, exceptions, availability blocks, anonymous busy reservations and permitted appointments, all read-only |
| Outgoing handovers | Permitted appointment records (SV-04) for commitments and booking history, site records, the Visits view filtered to the person, and the planner filtered to the person. The page never edits a resource, calendar, block or competence, and never books, assigns or dispatches |
| Source authority | The PL-02 design register pages; [PPO-SCHED-ADR](scheduling-resources-architecture.md); the built screens and `competenceState`; Field Technicians r05; the accepted pages listed above |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Field team — accepted" |

## 4. What the design shows

### Register

- **Grid:** the Work orders grid (D1). Columns run Technician (avatar and name), Role, Hours today, Competence, Visits today, First scheduled visit, Resource status, Time zone, Calendar and Coordinator handover, scrolling sideways with fixed checkbox and settings columns. Competence counts each skill's state for the seven days from the selected day.
- **Toolbar:** Search technicians, the day, All permitted sites, the time zone, the count with its read time, Refresh and "…".
- **Side menu:** Technicians (default), Visits and Needs preparation, then a People group with Active, Away today, Inactive and Competence to review (D2).
- **People:** the planner's avatar, role and one total ("8 of 9 h booked"), with no bars. People on leave or inactive sit last, dimmed, with a grey avatar (D3).
- **Snapshot:** a row opens the large snapshot (D4). It shows today, the next seven days, competence and upcoming visits, with View visits and Availability & competence.

### Person page

- **Layout:** the Work order record layout as one scrolling page, the Appointment detail pattern (D5).
  - The header shows the role, resource version, base time zone, source time and record position.
  - An Evidence bar for the seven days covers the resource and calendar publication, skills expiring, expired and with Unknown evidence, and the permitted sites.
  - The details column holds Summary, Published calendar and Permitted sites.
- **Review window:** Week starting, Review time zone and Refresh evidence, with the read time and completeness. "Source editors are not available here."
- **Seven-day availability:** one 07:00–18:00 track per day in the planner's tokens (D6). It shows shaded extended hours outside 08:00–17:00, each visit with its travel inside one border, proposed visits dashed, leave and days with no published hours as full-day blocks, busy time without details when it is outside your access, a Now marker on today, and a total for each day. Exceptions and other work are listed below the tracks with their time zone.
- **Competence and evidence:** one row per skill with the `competenceState` words for the window: Verified for selected period, Expires within selected period, Expired, Unknown / unverified evidence, Not yet valid or Inactive. Each row shows the source status, version, validity and review evidence. Review evidence opens a read-only side panel with the source record, the evidence reference, reviewer ID and content hash, which wrap (D7). Synthetic skills are not statutory certificates; certificate and renewal evidence reads Unknown.
- **Upcoming visits:** each permitted appointment in the window, opening Appointment detail for its booking history.

### Phone

- **Register:** list rows with the avatar, the name and one total, the role and today's visits, and one status line with an icon.
- **Person page:** the review-window controls first, then availability as thin day strips in the planner's phone strip tokens, competence, upcoming visits, permitted sites, and the resource and calendar fields. The resource ID wraps.
- **Access:** Field team is reached from More on a phone, as Service review is (SV-06 D6).
- **States:** loading; no matches, with removable filter chips; could not load, with no stale list or counts; view only, with busy time shown without details; incomplete result, with no rows or counts until the read is complete.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | The register uses the Work orders grid, one row per person, with competence for the seven days from the selected day | The built six-column Field technicians table (Technician, Skills / time zone, Resource status, Visits, First scheduled visit, Coordinator handover) under the r05 heading tiles |
| D2 | Views move into the side menu: Technicians (default), Visits and Needs preparation, then a People group with Active, Away today, Inactive and Competence to review | Three tabs with Visits first. Active and Inactive were a status filter; Away today and Competence to review are new |
| D3 | The planner's people visuals: 28 px pastel purple avatar, role and one total, with no bars; people on leave or inactive sit last, dimmed, with a grey avatar | r05 green initials avatars, an alphabetical list including inactive people, and no hours |
| D4 | A row opens the large snapshot | A row switched to the Visits view; Availability & competence was a link in the row |
| D5 | The person page uses the Work order record layout as one scrolling page, with an Evidence bar, a details column and the review-window controls. View visits on the record needs the person filter in the URL; today the filter is page state | A page header over stacked cards with the Scheduling tabs |
| D6 | Seven-day availability is one 07:00–18:00 track per day in the planner's tokens | Weekly intervals, blocks and busy times as lines of text |
| D7 | Review evidence opens a read-only side panel, the Work order record R6 pattern; phone rows stack | An inline Review evidence disclosure in each skill card |
| D8 | The Conversations action sits left of the information icon on every frame, from the proposed shell amendment on the Conversations page. Top bars and phone headers are detached on these frames only. At 1024 px the search narrows so the bell and account button fit, the SV-01 Q2 follow-up. At 320 px the page guide moves into the identity menu so the title stays whole | Shell / Top bar without the action, which clipped the account button at 1024 px |

## 5. Not decided and not drawn

- **Building the page.** The built register is the r05 Field technicians page with three tabs. The built person page is a page header over stacked cards. The build order is not decided.
- **Prerequisites for a build:**
  - a role published by the resource source (Q3);
  - a booked-hours read using the planner's rule (Q4);
  - the competence summary per person for the register;
  - a person filter in the Field team URL for View visits from the record (D5).
- **The Conversations action** is part of the proposed top-bar shell amendment. `Shell / Top bar` and `Shell / Phone header` change only when that amendment is accepted.
- **Not drawn:**
  - the Visits and Needs preparation views and their visit details drawer (accepted in r05, unchanged);
  - the phone views, filters and evidence sheets;
  - the open date picker and time zone menu;
  - hover states, desktop register states and the tablet person page;
  - 200% zoom, which the spec reviews separately.
- **Data in the frames:** the people, visits, skills, sites and times are synthetic. They are not operational records.

## 6. Audit and polish

The audit checked every field, option, state and sentence against `FieldTechniciansScreen`, `ResourceWorkspaceScreen`, `competenceState`, the seed's skill statuses (Verified, Unverified, Expired) and the PL-02 register pages.

- **Restored built controls and wording:** Search technicians, All permitted sites, the time zone control, First scheduled visit, Resource status, Week starting, Refresh evidence, Retry loading, Loading permitted records…, and "Complete" as the read returns it.
- **Corrected:** an invented line about calendar exceptions was removed; a skill validity that began before the resource was corrected; Alex Nguyen's visit is marked proposed; every register says "9 technicians".
- **Polished:** plain legend swatches; days with no published hours are darker than the extended-hours bands; hour labels sit on their gridlines; a Now marker on today; a lighter hatch on proposed visits; competence rows say when a skill ends or ended.
- **Measured with a script on every frame:**
  - no text overlaps another text, except under intended overlays (the snapshot, the evidence panel and sticky phone footers);
  - no clipped text, except the sideways-scrolling grid, scrolled content and the accepted rail's group labels;
  - desktop rows sit 16 px inside their card border, and phone rows were moved from 14 to 16 px.

Every frame was screenshotted after the fixes.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma and audited the page with scripts (section 6).
- Prototype links copied from the Service review page were removed. The rail's component hover interactions were kept.
- The ten captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 188,000. Prototype links were removed and each of the 524 Font Awesome icon instances was swapped for `Icon/placeholder`. Two scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 1,342 visible texts had a stored colour that differed from its bound variable.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/service/field-team-design-r01/README.md).
- Claude did not play the prototype in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
