---
document_id: PPO-LIBRARY-GANTT-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 10 November 2026 at Dean's request; the five items in section 6 were confirmed by Dean on 11 November 2026, and item G6 in section 7 was decided by him on 12 November 2026; every component is Status Proposed until Dean accepts the page; nothing published from the library; the Projects file and its open pull request are unchanged; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Gantt · Bars and links in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposed. The five items in [section 6](#6-confirmed--11-november-2026) were confirmed by Dean on 11 November 2026. G6 in [section 7](#7-decided--12-november-2026) was decided by him on 12 November 2026 and amends the label in G1. The page itself awaits acceptance.

On 10 November 2026 Dean accepted an order for the next pages of `PPO - Library`: Controls, shared rules for moving things, board cards, planners and calendars with a shared time axis, and the Gantt chart ([Controls record](library-controls.md)). After the [Time page](library-time.md) he answered: "Confirm all five items as recommended and draw the next page". This record covers that page, the last in the accepted order.

The accepted order placed the Gantt chart in the Projects file. That file is the subject of another session's open pull request #896, which awaits Dean's review. Asked where to draw the Gantt parts, Dean chose "Library page (Recommended)": draw them on a page named "Gantt · Bars and links" in `PPO - Library`, and leave the Projects file and pull request #896 untouched. The Projects sheets switch to these parts once that file is accepted and the library is published.

This record is a **proposal**. Drawing the page does not accept it, publish it or change any module file.

## 1. Sources

| Source | Status of source | Use |
|---|---|---|
| [Gantt colours from Figma](gantt-figma-colours.md) (PPO-GANTT-FIGMA-COLOURS-DEC) | Owner decision, 14 October 2026; colours built on a branch | Green complete, blue in progress, orange at risk, grey planned and grey phase bars, violet Today; the unused red for an Overdue state that has no rule; status without colour left as a refinement |
| [PJ-03 baseline and forecast design](baseline-forecast-figma-design.md) (PPO-PJ03-BASELINE-FORECAST-FIGMA-DEC) | Owner decisions D1 to D11, Q1 to Q8 | Baseline bars as a Display option and dashed moved milestones (D1), variance counts that name their calendar (D2), Links tab in the task panel (D4), the inline dependency check that moves nothing (D5), shading from the saved calendar with dated exceptions and the underlined non-working date (D6), "+nd" on moved tasks and the latest reason (D9), Ask owners to review (D10); critical path, signed lag and automatic rescheduling out of scope (Q5); the reasoned forecast save; loading and partial-source states (PS12, PS13) |
| [Gantt component](../design/development/components/gantt.md) and `src/app/projects-gantt.css` | Repository; built | 38 px rows, 20 px bars with 4 px corners, 15 px milestone diamond with a 1.5 px outline and 2 px corners, 7 px phase bar with 12 px caps, 1.25 px grey links and 1.5 px dashed red warning links, the 1 px Today line with a dot and label, Week, Month and Fit |
| Projects file, page PJ-03, sheets PG01 to PG13 and ST01 | Proposal sheets; read only, not edited | The programme and baseline layouts the parts must serve, and the task panel after a drop (PG04) |
| [Time](library-time.md), [Move](library-move.md), [Board](library-board.md) and [Grid](library-grid-table-interactions.md) records; [Controls](library-controls.md) | Proposed; items confirmed | The shared axis and bands, ghost, readout, reason tag and Move menu, the register for the task list, buttons, fields, menus, tooltips, banners |
| WCAG 2.2 AA | Standard | 1.4.1 use of colour, 2.5.7 dragging movements |

File links and keys stay outside this public repository (ADR-0050, ADR-0053).

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared Gantt parts for the Projects programme and baseline views; no new route. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Planning workspace: the time view inside it |
| Reused components | Time / Band, Hatch, Ghost, Resize handle and Now line; Move / Origin slot; Controls / Chip, Button, Icon button, Field, Menu item, Tooltip and Banner; the Attention and Close icons and the Grabbing cursor. On the board the task list is drawn as a layout at the Grid row height and the links as paths drawn to the Gantt / Dependency specimen; a module page builds the list from the Grid components. New in the library, all `Status: Proposed`: the six parts in section 3 and two new Time / Band kinds |
| Incoming handover | A module programme view places these components on the Time page's axis |
| Outgoing handover | The task panel (Details, Actual dates, Links) and its reasoned forecast save, unchanged |
| Departures | The items in sections 6 and 7 |

## 3. What was drawn

**Page** "Gantt · Bars and links" `116:37`: components section `116:52`; review board `117:58`.

**Variables added.** A new collection "Gantt colour" holds the eleven Gantt colours, and "PPO layout" gains three variables and now holds 30. The library holds 113 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

| Variable | Value | Code name | Use |
|---|---|---|---|
| `gantt/blue-fill` | `#e8f1fb` | `var(--gantt-blue-fill)` | In progress bar |
| `gantt/blue-progress` | `#b7d1ef` | `var(--gantt-blue-progress)` | In progress, filled from the left |
| `gantt/blue-outline` | `#4a7bb7` | `var(--gantt-blue-outline)` | In progress outline |
| `gantt/orange-progress` | `#f6cd8b` | `var(--gantt-orange-progress)` | At risk progress |
| `gantt/green-progress` | `#9fcd8e` | `var(--gantt-green-progress)` | Complete bar and milestone |
| `gantt/red-progress` | `#f2b5a7` | `var(--gantt-red-progress)` | Defined for Overdue; unused until a rule exists |
| `gantt/today` | `#7c5cc4` | `var(--gantt-today)` | Today line and label outline |
| `gantt/today-surface` | `#eee9fb` | `var(--gantt-today-surface)` | Today label fill |
| `gantt/today-text` | `#5b3fb0` | `var(--gantt-today-text)` | Today label text |
| `gantt/dependency` | `#899eb1` | None | Dependency line |
| `gantt/dependency-warning` | `#b95445` | None | Dependency line while the check warns |
| `gantt/bar-height` | 20 | None | Height of a task bar |
| `gantt/week-width` | 120 | None | One week at Week zoom |
| `radius/milestone` | 2 | None | Corner of the milestone diamond |

The nine code names are the custom properties `src/app/projects-gantt.css` already declares, with identical values.

**Components** (all `Status: Proposed`, in section `116:52`)

| Component | Node | Variants and options |
|---|---|---|
| Gantt / Bar | `116:184` | 15: Status (Planned, In progress, At risk, Complete, Conflict) by State (Rest, Focus, Selected). Options: Title, Moved, Show moved, Show label |
| Gantt / Milestone | `116:194` | 3: Planned, Complete, Baseline. Options: Label, Show label |
| Gantt / Phase bar | `116:195` | One component |
| Gantt / Baseline bar | `116:199` | One component |
| Gantt / Today line | `116:200` | One component: a 9 px dot and a 1 px line. Its label and Label option were removed on 12 November 2026 (G6) |
| Gantt / Dependency | `116:215` | 2: Tone (Neutral, Warning); the option was State, with Default, until 12 November 2026. A specimen; the path is drawn to fit the two bars |
| Gantt / Today cell | `261:13418` | One component: the date cell that holds today. Option: Date. Added 12 November 2026 (G6) |
| Gantt / Today key | `261:13420` | One component: the violet dot at icon size, for the toolbar's Today button. Added 12 November 2026 (G6) |

**Time / Band** (`97:365`, on the Time page) gains two kinds for the saved calendar's dated exceptions: Working exception `116:1848` (status/success-surface) and Non-working exception `116:1850` (status/warning-surface, labelled with the closure). It now has seven kinds.

**Review board** `117:58`

| Card | Node | Holds |
|---|---|---|
| Page header | `117:59` | Status, owner, date, Dean's choice of place, sources, contents |
| 1 · Anatomy of a Gantt | `117:67` | A synthetic programme with eleven numbered parts: task list, scale, phase bar, task bar, baseline bar, dependency, milestone, baseline milestone, Today, working and non-working exceptions |
| 2 · Bars and milestones | `119:717` | Five statuses by three states, milestones, phase and title placement; rules |
| 3 · Dependencies | `119:866` | Finish to start at rest and while warning, the successors to review; rules |
| 4 · Baselines and moved tasks | `119:1681` | Baseline bars, a moved milestone, "+4 cd · +2 wd"; rules |
| 5 · Calendar and scale | `119:2170` | Week zoom with named exceptions, Month and Fit, Today on a Gantt beside Now on a planner, the non-working date |
| 6 · Changing dates | `121:2212` | Move a bar, stretch the end, the drop opens the task panel, without dragging |
| 7 · States | `121:2977` | Loading, undated task, partial source, view only |
| 8 · Do and Don't | `121:3047` | Three pairs |
| 9 · Values, sources and confirmed items | `121:3142` | The table in section 5, the items in section 6, where the page is used, what is not here, change log |

The Read me page and the Foundations board were updated: the page index, rules 2 and 4, the variable and component lists, a Gantt colour card with eleven bound swatches, three rows in the layout table, and the twenty-four confirmed items on the Grid, Controls, Move, Board and Time pages.

## 4. Rules drawn

- **One register, one axis.** A Gantt is a Grid register on the left (task, status in words, owner, dates) and the Time page's axis on the right, one row per task. Rows line up across the two.
- **Bars.** A bar's length is its forecast span. Colour by status as the colour decision sets it: Planned grey, In progress blue, At risk orange, Complete green, progress filled from the left. Conflict keeps the built red outline. The title sits 8 px after the bar, so short tasks stay readable; "+2 cd" says how far a moved task moved (D9).
- **Status in words.** The task list names every status; At risk and Conflict also carry the Attention icon on the bar. Colour is never the only cue.
- **Milestones and phases.** A milestone is a diamond on its date, filled green when complete. A phase bar spans its tasks and is grey whatever their status. There is no Overdue status until Dean sets its rule.
- **Dependencies.** Finish to start only, thin grey at rest, dashed red with the icon while the check warns. The check runs whenever dates change, lists successors to review with their owners, offers Ask owners to review, and never moves a date (D5, D10). Links are added in the task panel's Links tab (D4).
- **Baselines.** Baseline bars are a Display option, off by default; a dashed diamond marks where a moved milestone sat (D1). Variance shows calendar days first, then working days by the calendar named in the column header (D2). The latest reason, its date and author are on Baselines (D9) and, new here, in the bar's tooltip.
- **Calendar and scale.** Shading comes from the project's saved calendar: weekends hatched, a worked day and a closure named in words (D6). A forecast date on a non-working day is underlined in the warning colour and counted as a schedule issue. Week zoom is 120 px a week; Month and Fit shrink the week to 48 px or less, stop shading weekends and move titles to tooltips.
- **Today.** A 9 px violet dot on the date row's lower edge with a 1 px violet line below, because green means complete on a Gantt. The chart carries no Today label, so nothing covers the dates (G6).
  - The date cell that holds today is tinted violet, with its date in violet.
  - The word "Today" is on the toolbar's Today button, which carries the same dot and scrolls the chart to today, and in the marker's tooltip and accessible name.
  - Calendars and planners keep the Time page's Now line.
- **Changing dates.** Moving or stretching a bar shows the Time page's ghost with a readout of the new dates and the change, snapped to whole days. The drop opens the task panel with the new dates, the required reason and the dependency check; nothing is saved until Save, and Cancel puts the bar back. Every change is also in the bar's menu and the task panel; keyboard: Space picks a bar up, Left and Right move it a day, Shift with them a week, Enter opens the panel, Esc cancels. Touch and phones use the menu.
- **States.** Loading draws the scale and Today first, with placeholder rows and no counts (PS12). A task without dates has no bar and offers Add dates; it is never drawn at today. A source that cannot be read shows a dash, never a guess, and the chart says the list may be incomplete (PS13). Someone who may not change the programme gets no handles and no drag, and the menu says why.

## 5. Values and sources

| Part | Value | Source |
|---|---|---|
| Row | 40 px (`grid/row-height`), the task list's row | Grid; built Gantt 38 px (G2) |
| Bar | 20 px (`gantt/bar-height`), 4 px corners, 1 px outline; title 8 px after it | Built ProjectsGantt |
| Bar colours | Planned grey, In progress blue, At risk orange, Complete green; progress filled from the left | PPO-GANTT-FIGMA-COLOURS-DEC |
| Conflict | 2 px status/danger outline on status/danger-surface, with the icon | Built ProjectsGantt; icon new (G3) |
| Milestone | 15 px diamond, 1.5 px outline, 2 px corners (`radius/milestone`); Complete filled green; Baseline dashed | Colour decision; PJ-03 D1; built |
| Phase bar | 7 px grey with 12 px end caps | Colour decision; built |
| Baseline bar | 4 px line/strong under the task bar; Display option | PJ-03 D1 |
| Dependency | Finish to start; 1.25 px grey; warning 1.5 px dashed red with the icon | Built ProjectsGantt; icon new |
| Today | 9 px violet dot on the date row's lower edge and a 1 px line; today's date cell in `gantt/today-surface` with `gantt/today-text`; no label on the chart; "Today" on the toolbar button and in the tooltip | Colour decision (G1); Dean, 12 November 2026 (G6) |
| Scale | Week zoom 120 px a week (`gantt/week-width`); Month 48 px a week; Fit fills the width | Built ProjectsGantt |
| Snap | Whole days | New (G4) |
| Shading | Weekends hatched as not working; working and non-working exceptions named | PJ-03 D6; Time page |
| Variance | Calendar days first, working days by the named calendar | PJ-03 D2 |
| Changing dates | Drag or stretch proposes; the task panel opens with the dates and a required reason | PJ-03 D5, PG04; new (G5) |

## 6. Confirmed — 11 November 2026

Asked for a recommendation on each open item, the answer recommended confirming all five as drawn. On 11 November 2026 Dean answered: "Confirm all sixteen as recommended, with the refinements" (these five, the six Forms items and the five States items). None of the refinements concerns this page. Card 9 and the page header now say so, and card 9's change log records the answer. Confirming G2 means the built ProjectsGantt's 38 px rows move to 40 px in a later reviewed change.

| ID | Item | Confirmed as drawn | Why it needed a decision |
|---|---|---|---|
| G1 | Today stays violet | On a Gantt Today is the violet line of the colour decision, because green means complete there; calendars and planners keep the green-deep Now line | The Time page confirmed one axis for every view (T2); this keeps two markers for "now" |
| G2 | 40 px rows | Gantt rows take `grid/row-height` (40 px) so the task list is a Grid register | The built Gantt uses 38 px |
| G3 | Icon on At risk and Conflict | Status in words in the list, plus the Attention icon on those bars | The colour decision names a text or icon cue as a possible refinement, designed in Figma first |
| G4 | Whole-day snap | Moves and stretches snap to days on a Gantt; the Time page's 15-minute step applies where hours show | The Time page set a 15-minute snap for every view (T2) |
| G5 | A drop opens the task panel | Dragging proposes dates and opens the panel with the reason; it never saves on its own | No source drags a Gantt bar; PJ-03 changes dates in the task panel |

## 7. Decided — 12 November 2026

On 12 November 2026 Dean noted that the Today pill covered the dates in its row. He offered three ideas: a taller date row with the pill under the dates, the dot and line alone with a larger dot on the row's lower edge, or a new row for the pill. Claude recommended his second idea with a tinted date cell, and the word "Today" moved to the toolbar and the tooltip. Dean answered: "Proceed based on your recommendations." Cards 1, 5 and 9 and the page header now say so.

| ID | Item | Decided | What it changes |
|---|---|---|---|
| G6 | Today without a label | The Today label leaves the chart. Today's date cell is tinted, a 9 px dot sits on the date row's lower edge with the 1 px line below, and the word "Today" is on the toolbar's Today button and in the marker's tooltip and accessible name | Amends the label in G1; the violet colour stands. The built Gantt draws the label and aligns at its next reviewed change |

The dot is 9 px, not the 8 px first suggested, so the 1 px line centres on it. The two ideas that add a row were set aside because each costs every chart about 20 px of height for one marker.

## 8. Not done and open

- **Page acceptance and publishing.** As for the other library pages: the components stay `Status: Proposed` until Dean accepts the page, and the library is not published.
- **Projects file unchanged.** The Projects file and pull request #896 were not touched. Its Schedule and Programme sheets (PG01 to PG13, ST01) switch to these parts once that file is accepted and the library is published.
- **Built Gantt unchanged.** ProjectsGantt keeps 38 px rows, its own bars and the Today label until a reviewed change aligns it with this page and G1 to G5, which Dean confirmed.- **Out of scope or candidates, not drawn.** Critical path, signed lag and automatic rescheduling (PJ-03 Q5); an Overdue status; drawing links by dragging; resource loading under the chart.
- **No proof beyond the design.** No prototype links were set on the Gantt parts. Dragging, snapping, keyboard, screen-reader and touch behaviour need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. The two dependency colours and the three new layout variables have no CSS property yet.
- **Accepted order complete.** Every page in the accepted order is now drawn. Forms · Fields and validation followed, as the first of the groups the design-to-build standard requires ([its record](library-forms.md)); it changed Controls / Field and Banner, which the task panel on card 6 uses.

## 9. Checks

**12 November 2026**
- The Today line, the new cell and key, card 1's chart and cards 5 and 9 were rendered and inspected.
- All seven example charts were updated by script: the marker moved to the date row's lower edge at the same day, and the cell that holds today became a Gantt / Today cell with its date. No other page places the Today line.
- A structural read of the Gantt page found, outside instances, no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style, no plain corner radius, no default layer name and no component without a status line.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**10 and 11 November 2026**

- The components section and every card of the review board were rendered and inspected. Defects found while drawing were fixed: progress fills that overflowed short bars, off-centre milestone diamonds, callouts and the Today pill over labels, clipped labels and banner text, a column that pushed card 6 past its edge, and a source citation in card 6.
- A structural read of the page (3,652 nodes, 189 instances) found, outside instances, no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style and no layer named as a default. The milestone diamond's plain 2 px corner was bound to the new `radius/milestone`; the section and component-set frames keep Figma's default corners, as on the other pages.
- Variables read back from the file: 66 in "PPO colour", 30 in "PPO layout", 3 in "Grid density", 3 in "Control size" and 11 in "Gantt colour" (113). The nine Gantt code names were matched against `src/app/projects-gantt.css`.
- The Read me texts were read back after their update; the Gantt colour card was rendered and inspected.
- On 11 November 2026, after G1 to G5 were confirmed, card 9 and the page header were updated and card 9 was rendered and inspected. An earlier attempt the same day was refused at the Figma connection's tool-call limit; a read of card 9 showed it had changed nothing.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `python3 scripts/check_design_tokens.py`.
