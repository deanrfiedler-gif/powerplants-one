---
title: Grid table interactions drawn in PPO - Library
date: 2026-11-10
---

Dean created the private Figma file "PPO - Library" and asked for the shared table interactions page to be drawn there, so that every module's registers use one behaviour for moving and resizing columns instead of each module redrawing its own interaction sheet. The [proposal record](../decisions/library-grid-table-interactions.md) (PPO-LIBRARY-GRID-INTERACTIONS-PROP) lists what was drawn.

- **Variables.** The library now holds the 66 "PPO colour" variables copied from PPO - Shell (accepted 8 November 2026). Twenty of them carry web code syntax where the app already has an identical CSS value.
- **Text styles.** Seven proposed Roboto text styles.
- **Components.** Page "Grid · Table interactions" holds five `Status: Proposed` component families: Grid / Header cell (8 states), Grid / Row (7), Grid / Checkbox, Grid / Column divider and Grid / Drop indicator.
- **Review board.** Five cards:
  - column reorder, with its keyboard and non-drag alternative;
  - column resize, with its hit zone, guide, limits, double-click to fit and keyboard steps;
  - sort, header states and frozen edge;
  - row states;
  - values and sources, with decisions D1–D5.
- **Sources.** The page consolidates the Sales ST01 and Estimating ST01 sheets, which differ on the focus-ring colour (D1) and the frozen edge (D2). Several values come from neither sheet and are marked proposed (D3).

**Checked:** every card was rendered and inspected, and two drawing defects were fixed (icon placement, and focus rings shifting content). Repository checks: `python3 scripts/build_status.py --check` and `python3 scripts/check_naming.py`.

**Not done:**
- The library is not published.
- No module file uses the components yet, and Sales ST01 and Estimating ST01 are unchanged.
- Layout variables, effect styles, icons, shell components and the page template are not in the library.
- The eight enabled community libraries still need to be switched off in the desktop app.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Grid table interactions in PPO - Library](../decisions/library-grid-table-interactions.md) (PPO-LIBRARY-GRID-INTERACTIONS-PROP) records the shared column reorder, column resize, sort, frozen-edge and row-state pattern drawn in the private library file on 10 November 2026, its sources in the Sales and Estimating interaction sheets, its values and Dean's open decisions D1–D5. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
