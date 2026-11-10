---
title: Ten library items confirmed and the Time page drawn in PPO - Library
date: 2026-11-10
---

Dean confirmed the ten open items on the Move and Board pages of the private Figma file "PPO - Library" and asked for the next page in the order he had accepted ("Confirm all ten items as recommended and draw the next page"). The [proposal record](../decisions/library-time.md) (PPO-LIBRARY-TIME-PROP) lists what was drawn.

- **Ten items confirmed.** On the Move page: target feedback, handle or whole item, several items at once, opening a closed container after 600 ms, and the touch rules. On the Board page: the card rows for every board, signals and age at 12 px, a menu button on cards, stage paging and collapsing, and dragging to any permitted stage. Both pages and both records now say so. Confirming the items is not acceptance of the pages.
- **Time page.** A page named "Time · Planners and calendars" gives one time axis for the activities calendar, the service planner and, in the Projects file, the Gantt chart. Time runs down the page in a calendar and across it in a planner; the parts and rules are the same.
- **Parts.** Nine `Status: Proposed` families: Event (six kinds by three states), Day header, Lane header, Band, Now line, Ghost, Resize handle, Travel and Hatch.
- **Review board.** Ten cards: one axis in two directions, events, bands and the Now line, scales, overlaps, moving, resizing and planning, keyboard, touch and phone, states, Do and Don't, and the values.
- **Sources.** The accepted Sales Activities week view (A01) and the Service planner built on 10 October 2026, with Dean's working hours.
- **Variables.** Four `time/` variables. The library now holds 99 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.
- **To confirm.** Five items await Dean: the six event kinds (proposed visits dashed, not hatched), one axis at 48 px and 96 px an hour with a 15-minute snap, resizing by an edge, planning by dragging across empty time, and overlaps side by side up to three.

**Checked:** the components and every card were rendered and inspected, and drawing defects found on the way were fixed. A structural read found no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style and no plain corner radius. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- No page is accepted and the library is not published.
- No prototype links were set on the Time parts.
- The Sales Activities sheets and the built Service planner are unchanged.
- The Gantt chart is not started.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Time · Planners and calendars in PPO - Library](../decisions/library-time.md) (PPO-LIBRARY-TIME-PROP) records the shared time axis, events, bands and time-specific moving rules drawn in the private library file on 10 November 2026, their sources in the accepted Sales Activities week view and the built Service planner, and five items for Dean to confirm. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
