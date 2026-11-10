---
title: Controls page drawn in PPO - Library
date: 2026-11-10
---

Dean asked whether pages for other interactions (Gantt charts, board cards, planners and calendars) should join the private Figma file "PPO - Library". He accepted the recommended order and asked for the Controls page first ("Accept the recommended order and start with the Controls page"). The [proposal record](../decisions/library-controls.md) (PPO-LIBRARY-CONTROLS-PROP) lists what was drawn.

- **Order accepted.** Controls, then shared rules for moving things, board cards, planners and calendars with a shared time axis, and the Gantt chart kept in the Projects file. Only Controls is drawn.
- **Controls page.** Sixteen `Status: Proposed` families: Button, Link, Icon button, Chip, Filter chip, Tab, Avatar, Checkbox, Checkbox field, Field, Menu item, Menu divider, Tooltip, Toast, Banner and Dialog. A review board of nine cards gives the states, rules, values and sources of each.
- **Sources.** The page consolidates the accepted Sales kit and forms and the accepted shell sheets for dialogs, banners and toasts. States that no source draws are marked new.
- **Icons page.** The library's 19 icons and 5 annotation cursors now sit on their own page.
- **Variables and styles.** A "Control size" collection with Medium and Small modes, two radius variables, a 10 px text style and an Elevation / Dialog effect style. The library now holds 89 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.
- **Grid page.** 60 plain frames on the Grid · Table interactions board became Controls instances, and its checkbox moved to the Controls page; section 12 of [its record](../decisions/library-grid-table-interactions.md) has the detail.
- **To confirm.** Five items await Dean: the button hover and pressed values, the merged chip-tone meanings (where "Draft" differs between Sales and Estimating), the new field, filter-chip and tab states, the Small size, and the checkbox aligned to the Sales kit. The four open items on the grid page also remain open.

**Checked:** the components and every card were rendered and inspected, and drawing defects found on the way were fixed. A structural read found no solid fill or stroke without a variable, no text without a text style and no shadow without an effect style. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- The page is not accepted and the library is not published.
- The prototype links were set and read back but not played.
- Radio, switch, date picker and other controls that no accepted page draws are not included; the full icon set is not in the library.
- No module file uses the components yet.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Controls in PPO - Library](../decisions/library-controls.md) (PPO-LIBRARY-CONTROLS-PROP) records the sixteen shared control families drawn in the private library file on 10 November 2026, their sources in the accepted Sales kit, Sales forms and shell sheets, the accepted order for the next library pages, and five items for Dean to confirm. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
