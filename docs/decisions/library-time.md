---
document_id: PPO-LIBRARY-TIME-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 10 November 2026 at Dean's request; the five items in section 6 were confirmed by Dean the same day; every component is Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Time · Planners and calendars in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposed. The five items in [section 6](#6-confirmed--10-november-2026) were confirmed by Dean on 10 November 2026. The page itself awaits acceptance.

On 10 November 2026 Dean accepted an order for the next pages of `PPO - Library`: Controls, shared rules for moving things, board cards, planners and calendars with a shared time axis, and the Gantt chart kept in the Projects file ([Controls record](library-controls.md)). After the [Move](library-move.md) and [Board](library-board.md) pages he answered: "Confirm all ten items as recommended and draw the next page". This record covers that page, named "Time · Planners and calendars".

The page gives one time axis for every view that places things in time: the activities calendar, the service planner and, in the Projects file, the Gantt chart. Time can run down the page (calendar) or across it (planner, Gantt); the parts and rules are the same.

This record is a **proposal**. Drawing the page does not accept it, publish it or change any module file.

## 1. Sources

| Source | Status of source | Use |
|---|---|---|
| "PPO - Sales module (accepted)", page "Tasks, Activities and Email" `133:27407`, sheet A01 `29:4156` (Activities week view), TB18 `102:26601`, PH11 `103:27822` | Accepted by Dean, 9 November 2026 | 48 px hours, the Due lane for untimed items, today's column, the Now line, PPO activities in the workspace accent, read-only Outlook meetings in navy, tentative (dashed) and private meetings, "1 overlap" in the day header, times in the person's zone with the organiser's time when it differs, the phone day agenda |
| [Service planner page guide](../design/development/pages/route-schedule.md) and the [planner](../design/development/components/planner.md) and [appointment](../design/development/components/appointment.md) components | Repository; built 10 October 2026; accepted phone and state designs | 07:00 to 18:00, standard hours 08:00 to 17:00 (Dean, 10 October 2026), extended hours, not working, leave and closures hatched and named, reservations hidden by a filter never drawn as free, past-time wash, the Now pill and line, travel joined to visits, confirmed, needs attention and proposed visits, one total per person and per day, load shading, 15-minute snap, Move or reassign, the 360 px details panel, loading, empty day, no access and last good read |
| [Move · Drag and drop](library-move.md) and [Board · Cards and stages](library-board.md) | Proposed; items confirmed | Lift, ghost, refusal with a reason tag, keyboard pick-up, the Move menu, after the drop; Board / Activity line for untimed items |
| [Controls](library-controls.md); shell rules R17, R44, R71, R101 | Proposed; accepted | Buttons, chips, fields, menus, tooltips, banners; person colours |
| WCAG 2.2 AA | Standard | 1.4.1 use of colour, 2.5.7 dragging movements, 2.5.8 target size |

File links and keys stay outside this public repository (ADR-0050, ADR-0053). The private refinement canvas named in the planner page guide was not read for this page.

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared time pattern used by the calendar, planner and schedule views of every module; no new route. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Planning workspace: the time view inside it |
| Reused components | Controls / Chip, Avatar, Button, Field, Menu item, Tooltip, Filter chip and Banner; Move / Origin slot and Reason tag; Board / Activity line. New in the library, all `Status: Proposed`: the nine parts in section 3 |
| Incoming handover | A module time view places these components |
| Outgoing handover | The event's details panel or record, unchanged |
| Departures | The items in section 6 |

## 3. What was drawn

**Page** "Time · Planners and calendars" `97:37`: components section `97:42`; review board `100:254`.

**Variables added** to "PPO layout", which now holds 27. The library holds 99 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

| Variable | Value | Use |
|---|---|---|
| `time/hour-height` | 48 | One hour where time runs down the page |
| `time/hour-width` | 96 | One hour where time runs across |
| `time/gutter` | 64 | The column of hour labels beside a vertical axis |
| `time/lane-height` | 64 | One person or resource lane on a horizontal axis |

**Components** (all `Status: Proposed`, in section `97:42`)

| Component | Node | Variants and options |
|---|---|---|
| Time / Event | `98:353` | 18: Kind (Activity, Meeting, Visit, Attention, Tentative, Busy) by State (Rest, Focus, Selected). Options: Title, Meta, Show meta |
| Time / Day header | `98:372` | 3: Kind (Day, Today, Warning); the option was State, with Default, until 12 November 2026. Options: Day, Note, Show note |
| Time / Lane header | `98:386` | 2: Status (Available, Away); the option was State, with Default, until 12 November 2026. Options: Name, Role, Total. Exposed: Avatar |
| Time / Band | `97:365` | 7: Extended hours, Not working, Unavailable, Past, Today, Working exception, Non-working exception. Options: Label (on Extended hours), Not working label, Unavailable label. The last two were added on 12 November 2026 so each kind starts with its own name |
| Time / Now line | `97:152` | 2: Horizontal, Vertical. Option: Time |
| Time / Ghost | `97:369` | One component. Exposed: Readout |
| Time / Resize handle | `97:368` | 2: Vertical, Horizontal |
| Time / Travel | `97:374` | One component. Option: Label |
| Time / Hatch | `97:43` | One component: the pattern inside Not working and Unavailable |

The axis itself (hour labels, hour lines, day columns or lanes) is drawn as a layout on the board, because its length depends on the view; its sizes are the four variables above.

**Review board** `100:254`

| Card | Node | Holds |
|---|---|---|
| Page header | `100:255` | Status, owner, date, sources, contents |
| 1 · One axis, two directions | `100:263` | A calendar week (time down) and a planner day (time across), with numbered callouts |
| 2 · Events | `104:581` | Six kinds with their meanings, three states, four lengths, rules |
| 3 · Bands and the Now line | `104:707` | Extended hours, not working, closure, past and the Now line on a planner; rules |
| 4 · Scales | `104:1010` | The same axis at day, week and quarter scale; the quarter row shows how the Gantt chart uses it |
| 5 · Overlaps | `104:1355` | Two, three and more than three at once; rules |
| 6 · Moving, resizing and planning | `108:1183` | To another time, longer or shorter, to another person, time that will not take it, planning by dragging, without dragging; rules |
| 7 · Keyboard, touch and phone | `108:1520` | Keys, touch rules, a 320 px phone day |
| 8 · States | `110:1399` | Loading, empty day, no access, last good read |
| 9 · Do and Don't | `110:1509` | Three pairs |
| 10 · Values, sources and confirmed items | `110:1783` | The table in section 5, the items in section 6, where the page is used, what is not here, change log |

The Read me page and the Foundations board were updated for the new page and variables. Read me also now says that the nineteen items on the Grid, Controls, Move and Board pages are confirmed.

## 4. Rules drawn

- **One axis, two directions.** Time runs down the page in a calendar (days are columns) and across it in a planner or Gantt chart (people or phases are rows). The parts, colours and rules are the same; only the variable for an hour changes.
- **Events.** Title first, then times and where or with whom. Six kinds, each with words as well as colour: Activity (the workspace's accent; a PPO activity, which never reserves time on its own), Meeting (navy; from Outlook, read only), Visit (info; reserves the crew's time), Attention (warning, with the icon and what is needed), Tentative (dashed, and says Tentative or Proposed), Busy (someone else's time; details hidden). 30 minutes or less shows the title only.
- **Bands.** Extended hours inside the calendar but outside standard hours (allowed, with a warning); Not working outside the calendar; Unavailable for leave, closures and reservations hidden by a filter, hatched and named with their times; Past as a light wash; Today behind today's column or row. Time that was not read, or is hidden by a filter, is never drawn as free.
- **Now line.** On today only, in status/success with the time in a pill. It was brand/green-deep until 11 November 2026, when the [library audit](library-audit.md) measured the white time on it at 3.57:1 and Dean chose status/success (6.1:1) for the pill and the line.
- **Time zone.** Always named in the corner; the organiser's time is added when it differs.
- **Overlaps.** Side by side up to three, then "+N more"; the day header counts them. On a planner an overlap splits the lane's height, not its width. Whether an overlap is allowed is the server's decision.
- **Moving, resizing and planning.** A ghost snaps to 15 minutes with a readout of the new day and times. Handles at both ends of a selected event change its times. Dragging across empty time proposes a new item with a small form. Outside a person's calendar there is no ghost: the not-allowed cursor and a reason tag say why. Every change is also in the event's menu and details panel (Change times, Move or reassign), the only route on touch and on phones. A drop proposes; the server checks calendars, crew, travel, readiness and policy holds again.
- **Keyboard.** The time grid is one Tab stop; arrows move between events and days or lanes; Enter opens the details panel; Space picks an event up, arrows move it by 15 minutes (with Shift, an hour) or to another day or person, Space or Enter drops, Esc cancels; each step is announced.
- **Phone.** Below 768 px: day chips, the untimed items and the day as a list; the planner shows a card per person with a 07:00 to 18:00 strip; details open as a bottom sheet.
- **States.** Loading shows placeholders and "Loading…"; an empty day offers Plan; no access shows Busy blocks only; after a failed refresh the last read stays with a banner giving its time and Try again.

## 5. Values and sources

| Part | Value | Source |
|---|---|---|
| Hour, time down | 48 px (`time/hour-height`); events 2 px shorter so neighbours never touch | Sales A01 |
| Hour, time across | 96 px (`time/hour-width`) | Service planner; value new |
| Hour labels | 64 px gutter (`time/gutter`); 11 Medium text/secondary; the zone named in the corner | Sales A01 |
| Lane | 64 px (`time/lane-height`); people who cannot be booked in 36 px rows last | Service planner |
| Day header | 44 px; today surface/navy-tint with the Today chip; one total or a warning | Sales A01; Service planner Week |
| Untimed lane | 56 px; items use Board / Activity line; they never reserve time | Sales A01 (Due lane) |
| Event | 4 px corners, 3 px start bar, 12 Medium title, 12 Regular meta; 22 px for 30 minutes or less | Sales A01; Service planner |
| Event kinds | Activity accent, Meeting navy, Visit info, Attention warning with icon, Tentative dashed, Busy chrome | Sales A01; Service planner; merged (T1) |
| Focus and selected | 2 px text/link ring; navy edge with Elevation / Popover | Grid D1; Service planner |
| Bands | Extended hours surface/hover; Not working and Unavailable hatched on surface/chrome; Past and Today surface/workspace | Service planner; Sales A01 |
| Hours | Standard 08:00 to 17:00; calendars publish 07:00 to 18:00 | Dean, 10 October 2026 |
| Now line | 2 px status/success with the time in a pill, 11 Medium white (6.1:1); today only | Sales A01; Service planner; colour from the audit, 11 November 2026. The accepted Sales week view and the built Service planner keep brand/green-deep until a reviewed change aligns them |
| Snap | 15 minutes for moves, resizes and new items | Service planner |
| Overlaps | Side by side up to three, then "+N more"; the day header counts them | Sales A01 ("1 overlap"); limit new |
| Moving | Move page parts; Time / Ghost with a readout; Move or reassign | Move page; Service planner |
| Resizing | Time / Resize handle at both ends, 8 px target each side of the edge; Change times in the menu | New |
| Planning by dragging | A "New" ghost and a small form; pointer only | New |
| Phone | Day chips, the untimed items and the day as a list; planner cards per person with a strip | Sales PH11; Service phone design |

## 6. Confirmed — 10 November 2026

On 10 November 2026 Dean confirmed these five items: "Confirm all five items as recommended and draw the next page". Card 10 and the page header now say so. Confirming T1 means the built Service planner's hatched proposed visits and its colours are to be aligned with this page in a later reviewed change.

| ID | Item | Confirmed as drawn | Why it needed a decision |
|---|---|---|---|
| T1 | Event kinds | Six kinds that merge the Sales calendar's colours (activity, Outlook meeting, tentative, private) with the Service planner's (confirmed, needs attention, proposed). Proposed visits become dashed instead of hatched | The two sources draw proposed and confirmed differently; hatching is kept for time nobody can book |
| T2 | One axis, two directions | 48 px an hour down the page, 96 px an hour across, 15-minute snap, for the calendar, the planner and the Gantt chart | The 96 px value is new, and applying one axis to the Gantt chart is a choice for the Projects file |
| T3 | Resizing by an edge | Handles at both ends of a selected event, with a readout; Change times in the menu on touch | Neither source resizes an event by dragging |
| T4 | Planning by dragging | Dragging across empty time proposes a new item with a small form; pointer only | No source draws it; Sales plans from a button |
| T5 | Overlaps | Side by side up to three, then "+N more" | Sales draws two side by side; no source sets a limit |

## 7. Not done and open

- **Page acceptance and publishing.** As for the other library pages: the components stay `Status: Proposed` until Dean accepts the page, and the library is not published.
- **Module files unchanged.** The accepted Sales Activities sheets keep their local events. The Service planner is built in code to its own refinement decisions; its hover growth, hatched proposed visits and colours differ from this page until a reviewed change aligns them with T1, which Dean confirmed.
- **Candidates, not drawn.** A month view (no accepted page draws one), multi-day bars in a calendar week, the planner's map, editing a repeating meeting.
- **No proof beyond the design.** No prototype links were set on the Time parts. Timing, snapping, keyboard, screen-reader and touch behaviour need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. The four `time/` variables have no CSS property yet.
- **Next page in the accepted order.** The Gantt chart was to be drawn in the Projects file on this page's axis. At Dean's choice it was drawn on a library page, Gantt · Bars and links, instead ([its record](library-gantt.md)). That page added two kinds to Time / Band, Working exception and Non-working exception, for the saved calendar's dated exceptions; Time / Band now has seven kinds.

## 8. Checks

- The components section and every card of the review board were rendered and inspected. Defects found while drawing were fixed: event titles that pushed the times out of one-hour events, a clipped travel label, callouts covering the Now pills, a clipped leave label and role, a week axis drawn wider than its days, load shading on days with nothing booked, overlap rules wider than their card, a ghost readout that could not follow the ghost's height, a lifted visit covering its readout, and a truncated banner.
- A structural read of the page (2,763 nodes, 196 instances) found, outside instances, no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style, no plain corner radius and no component without a status line. Four layers with names that read as defaults were renamed.
- Variables read back from the file: 66 in "PPO colour", 27 in "PPO layout", 3 in "Grid density", 3 in "Control size" (99).
- The Read me card was rendered and inspected after its update; the four rows were added to the Foundations layout table.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `python3 scripts/check_design_tokens.py`.
