---
title: Nine library items confirmed and the Move page drawn in PPO - Library
date: 2026-11-10
---

Dean confirmed the nine open items on the Grid and Controls pages of the private Figma file "PPO - Library" and asked for the next page in the order he had accepted ("Confirm all nine items as recommended and draw the next page"). The [proposal record](../decisions/library-move.md) (PPO-LIBRARY-MOVE-PROP) lists what was drawn.

- **Nine items confirmed.** On the Grid page: the 40% frozen-zone limit, the personal-layout rules, Compact density for pointer devices only and the quick-edit rules. On the Controls page: the button hover and pressed values, the merged chip-tone meanings ("Draft" is Neutral), the new field, filter-chip and tab states, the Small size, and the checkbox aligned to the Sales kit. Both pages and both records now say so. Confirming the items is not acceptance of the pages.
- **Move page.** A page named "Move · Drag and drop" gives one set of rules for moving register columns, list rows, board cards, planner appointments and Gantt bars. A review board of ten cards covers the six moments of a move, handle or whole item, reordering a list, moving between containers, several items at once, scrolling, moving without dragging, what happens after the drop, Do and Don't, and the values.
- **Parts.** Six `Status: Proposed` families: Handle, Drop indicator, Drop target, Origin slot, Count badge and Reason tag. The former Grid / Drop indicator is now the Vertical variant of Move / Drop indicator, with its node unchanged.
- **Without dragging.** Every move can also be made from the keyboard and from a Move menu, and a drop calls the same command as the menu item, so permission, confirmation and Undo are identical.
- **Variables and icon.** Four `move/` variables in "PPO layout" and Icon / Blocked. The library now holds 93 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.
- **To confirm.** Five items await Dean: the target feedback (line, outline, refusal with a reason tag), handle or whole item, moving several items at once, opening a closed container after 600 ms, and the touch rules.

**Checked:** the components and every card were rendered and inspected, and drawing defects found on the way were fixed. A structural read found no solid fill or stroke without a variable, no text without a text style and no shadow without an effect style. The updated cards on the Grid, Controls, Read me and Foundations pages were rendered and inspected. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- No page is accepted and the library is not published.
- The moves are drawn as steps, not played; no prototype links were set on the Move parts.
- Board cards, planners and calendars, and the Gantt chart are not started.
- No module file uses the parts yet.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Move · Drag and drop in PPO - Library](../decisions/library-move.md) (PPO-LIBRARY-MOVE-PROP) records the shared parts and rules for moving things drawn in the private library file on 10 November 2026, their sources in the accepted grid decisions and the repository's component rules, and five items for Dean to confirm. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
