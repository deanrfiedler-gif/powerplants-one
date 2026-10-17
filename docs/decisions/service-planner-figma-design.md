---
document_id: PPO-PL01-PLANNER-FIGMA-DEC
date: 2026-10-17
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: b2bd0110f74dc515e1ed26ce08d6ead27896f7e1
versioning: git
---

# Service planner design — owner decision

On 17 October 2026, after the Appointment detail design was locked in, Dean asked Claude to "proceed with the Service planner (PL-01) design and build in Figma". Claude drew the planner (`scope:PL-01`, `/schedule`) from four sources:
- Dean's 10 October planner decisions ([UI build sequence](ui-build-sequence.md#planner-boards-refined-10-october-2026));
- the built Day timeline, Week board and phone layout;
- the accepted [field readiness gate](field-readiness-gate-proposal.md);
- the E9 planner exemplar from the [UX benchmark](../design/research/ux-benchmark/README.md).

Dean then made a series of decisions on the same day, quoted in section 1. He accepted the result: "I accept the PL-01 Service planner design with your recommendations, including D1–D6 and the two open items as recommended. Save the named version, add the File index row, export the captures and open the draft PR." The design reference is the named Figma version "Service planner — accepted".

Scope:
- `scope:PL-01` "Service planner and unassigned demand" and `route:/schedule` "Service planner".
- Parent requirements SVC-03, SVC-04 and SCM-08. No parent requirement ID is added or renamed.
- UXB-12 from the UX benchmark is adopted for this page (section 1).

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design PL-01 next | User decision, 17 October 2026 | "Now proceed with the Service planner (PL-01) design and build in Figma." |
| Adopt UXB-12: one tray for unscheduled and on-hold work, and a needs-attention band with one suggested action | User decision, 17 October 2026 | "Adopt UXB-12 as you recommend: merge E9's tray with Unscheduled and On hold, and the needs-attention band with one suggested action, into the PL-01 page, keeping the 10 October rules (no bars, no reasons on cards)." The E9 exemplar itself stays a proposal |
| E9 card style | User decision, 17 October 2026 | "Restyle the PL-01 appointment cards to the E9 look as you recommend: 12 px type, one border, crew initials in the time line, travel kept as a quiet tinted extension with no icon or minutes, and no reason line." |
| Car icon on travel, attention icon | Delegated to Claude, 17 October 2026 | "Just do whatever you need to do, and whatever you believe is the most professional and innovative what to style these cards." A muted car on travel of 30 minutes or more, and a small amber warning icon on attention cards so status is never colour alone |
| No purple suggested card on the board | Resolved as recommended, 17 October 2026 | A suggestion shows as a dashed navy "Preview · not saved" card only while Plan visit is open |
| Final polish and fixes 1–6 | User decision, 17 October 2026 | "Now give all the new pages you just created for the Planner a final polish…", then "Proceed with all the fixes and improvements." |
| Avatars | User decision, 17 October 2026 | "Fix the avatars that are used for the technician names, as they should be circles. Maybe you could make them the pastel purple colour so they stand out more." |
| Stronger travel tint | User decision, 17 October 2026 | "yes", to making travel a muted, slightly greyer version of the visit's own colour |
| Away and inactive rows | User decision, 17 October 2026 | "I think we should still included the technicians role label in the bottom two technician rows, and make them the same height as the other rows." |
| Departures D1–D6 | Accepted as recommended, 17 October 2026 | The acceptance quoted above. Section 4 |
| Hold reasons | Resolved as recommended, 17 October 2026 | Same words. Start with Parts, Customer and Access window |
| Suggestions | Resolved as recommended, 17 October 2026 | Same words. Build the needs-attention band with the gate's existing reasons first, then suggestions, which need a backend read |
| Accept the design and lock it in | User decision, 17 October 2026 | Quoted above |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Service planner — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Service planner · PL-01" `1203:5805`, under "— Service operations —", after Work order record page `312:2` and before Appointment detail `1187:50`. The page header `1203:5806` holds the conformance declaration; the notes card is in Flows and notes `1203:5870`. File index row "Row / Service planner · PL-01" |
| Desktop 1440 × 960 | Section `1203:5851`: Day `1205:52`; Day with a visit selected `1220:7149`; Week `1221:7163`; Plan visit from the tray `1221:276662`; Move this visit? after a drag `1222:8031` |
| Tablet 1024 | Section `1203:5855`: Day with the tray collapsed to a strip `1222:9219` |
| Phone 390 and 320 | Section `1203:5859`: Day at 390 `1212:273202` and 320 `1213:5747` (full length); Week `1214:5547`; visit details sheet `1214:5913`; Needs attention and tray `1223:8067` |
| States | Section `1203:5866`, phone 390: loading `1214:275141`; empty day `1214:275500`; no access `1214:275856`; last good read after a failure `1214:276212` |
| Prototype | Flows "PL-01 — desktop planner" and "PL-01 — phone planner". Clicked through in Figma's Present mode: visit to details and back, Day to Week and back, tray card to Plan visit, phone card to sheet and back, tray row to the tray page and back |
| Page parts (proposed) | Section `1204:54`: Planner / Visit `1204:133`, Travel `1204:134`, Person `1204:152`, Block `1204:153`, Week tile `1204:441`, Input `1211:5112`, Tray card `1218:7152` and Exception `1218:7153` |
| New icon and tokens | Icon/car-side `1229:4084` on the Components page (Font Awesome Pro Light from Dean's Kit; not in this repository). Proposed colour variables: `planner-confirmed-surface` `#eef4fa`, `planner-confirmed-border` `#c8d6e5`, `planner-attention-selected` `#fff5df`, `planner-confirmed-travel` `#e9eef4`, `planner-attention-travel` `#f6efe2`, `planner-avatar-surface` `#ece7fb` and `planner-avatar-text` `#4f3a9c` |
| Exemplar | E9 on the UX benchmark exemplars page `1013:5988` stays a proposal; this page is where it is redrawn |
| Retained captures | [Service planner design r01](../reference/ui/service/service-planner-design-r01/README.md): twelve icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PL-01` and `route:/schedule`. Parent requirements SVC-03, SVC-04 and SCM-08, unchanged. UXB-12 adopted. Capabilities unchanged (`schedule.read` and the existing booking grants) |
| Page type (r20) | Planning workspace: Day timeline and Week board. The tray is a register or worklist; Plan visit and Move or reassign are form or guided-workflow panels. Phone: person cards with a day strip, a week list and a bottom sheet |
| Reused components | Shell v2 (Rail · Service, top bar, Menu item, Menu heading, Menu strip and edge), Button, Tag, Grid header and cells, Record / Field and Section heading, Job pack / Form field, Callout, Shell / Phone header, Tab bar (phone). New, proposed: the Planner page parts in section 2 |
| Incoming handovers | Authorised work-order demand (the tray), appointments with their readiness from the field readiness gate, resource calendars, leave and closures, all read-only here |
| Outgoing handovers | Plan visit (save a proposal), Move or reassign, and links to Appointment detail (SV-04) for confirmation, contact and readiness, to the work order and to the person. The board never confirms, dispatches or contacts the customer |
| Source authority | [UI build sequence](ui-build-sequence.md) (planner boards and working hours, 10 October); design register [scope-pl-01](../design/development/pages/scope-pl-01.md) and [route-schedule](../design/development/pages/route-schedule.md); [PPO-SCHED-ADR](scheduling-resources-architecture.md); the [field readiness gate proposal](field-readiness-gate-proposal.md) (P1, P4, P5); the [Appointment detail design](appointment-detail-figma-design.md) |
| Proposed departures | D1–D6 in section 4, accepted |
| Status | Owner-accepted design, 17 October 2026 |
| Decision record | This file |
| Named version | "Service planner — accepted" |

## 4. What the design shows

### Layout

- **Side menu:** the Scheduling views (Planner, Resources, then Follow-up) sit in the side menu, which starts collapsed to its strip on the planner (D1).
- **Toolbar:** date navigation, Today, Day and Week, Site and People filters, and the time zone. Its hover text holds the site time, standard hours and extended hours (D2).
- **Needs attention band:** each row names its cause and one suggested action, and clears by itself when the cause is fixed. It includes the field readiness gate's dispatch holds: parts, job pack acknowledgement or review, and site readiness (D3).
- **Tray:** "To plan" and "On hold" in one column beside the board. Each hold has a reason and an end, then returns to the tray by itself. The tray collapses to a 44 px strip with its counts and an expand control while a visit's details are open, and on tablets (D4).
- **Board:** a 07:00 to 18:00 Day timeline with shaded extended hours and a Now pill, one row per person, and a Week board whose shading deepens as a day fills.
- **Details:** a selected visit opens the 360 px details panel; on a phone, a sheet above the tab bar.
- **Moves:** dropping a visit opens Move this visit?, comparing the current and proposed times and warning when a new site readiness confirmation is needed (gate P4) (D5).

### Cards

- **Content:** title, time and site, in 12 px type inside one border. Crew initials ("CW, RT") appear in the time line, only on shared visits. There is no reason line.
- **Colour:** faint blue confirmed, amber needs attention with a small warning icon, hatched proposed.
- **Travel:** a muted, slightly greyer tint of the visit's own colour inside the same border, with a muted car on segments of 30 minutes or more. The visit is the brightest part of the booking.
- **Selection:** a navy outline; a selected attention card keeps its pale amber border inside it.
- **Phone:** cards keep a 14 px title. Week tiles show the time only where two visits share a cell, with the title in the hover text and details.

### People

- **Rows:** a 28 px pastel purple circle avatar, the name, the role and one total, such as "8 of 9 h booked". No bars.
- **Away or inactive:** people on leave or inactive sit last, in full-height rows with their role, dimmed, with a grey avatar.

### Kept from the 10 October decisions

- 07:00 to 18:00 with shaded extended hours.
- One total per person, and away people last.
- Cards flat at rest.
- A clock for extended hours.
- No reasons on cards.
- A slim weekend strip.
- Phone day chips and person cards with a strip.

### Proposed departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | Scheduling views move into the side menu, collapsed on the planner because the tray needs the width | Workspace tabs above the planner |
| D2 | Toolbar with date, Today, Day/Week, Site and People filters and time zone; the four count tiles go | Count tiles and inline filters |
| D3 | Needs attention includes the gate's dispatch holds | Proposed and needs-attention counts only |
| D4 | Tray collapses to a 44 px strip with counts, an expand control and "To plan" / "On hold" captions | Unassigned demand panel below the board |
| D5 | A drop opens Move this visit?, comparing times and warning on site readiness | A drop opens Move or reassign |
| D6 | Desktop frames are 1440 × 960, the planner's review size, so the band, tray and board fit without scrolling | 1440 × 900 on other accepted pages |

### Audit and polish

The final polish measured every frame for:
- clipped text, overlaps, and insets of 12 to 16 px;
- the selected Day/Week label in the ink colour, and axis labels hidden under the Now pill;
- toolbar controls never half-covered behind the Plan visit panel;
- the preview card's label, "Preview · not saved".

It also gave the phone Week its tray row.

The fixes that followed:
- wrote initials as "CW, RT" everywhere;
- gave the phone states their tray row;
- added the collapsed tray strip's expand control and captions;
- faded expanded trays at the bottom to show they scroll;
- gave the phone tray page a back arrow;
- kept a selected attention card's amber border inside the navy outline.

## 5. Not decided and not drawn

- **Building the page.** The built planner has the 10 October Day timeline, Week board and phone layout, with workspace tabs, count tiles and an unassigned-demand panel. It has no tray, no holds, no needs-attention band and no Move this visit? dialog.
- **Prerequisites for a build:**
  - hold reasons that match work-order statuses (UXB-12's dependency; start with Parts, Customer and Access window);
  - the gate's dispatch holds from [PR #541](https://github.com/deanrfiedler-gif/powerplants-one/pull/541) and later increments;
  - a backend read for suggestions (free time that fits tray work, and the next action for each exception), built after the band.
- **The build order is not decided.**
- **Not drawn:** the Map view (it needs a map provider decision record first), the other Scheduling views, the phone Filters sheet and hover states.
- **Data in the frames:** the visits, people, work orders and times are synthetic, from the field readiness gate story on Tue 13 Oct 2026. They are not operational records.

No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
