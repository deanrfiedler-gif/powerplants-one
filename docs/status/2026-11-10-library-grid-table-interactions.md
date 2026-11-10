---
title: Grid table interactions drawn in PPO - Library
date: 2026-11-10
---

Dean created the private Figma file "PPO - Library" and asked for the shared table interactions page to be drawn there, so that every module's registers use one behaviour for moving and resizing columns instead of each module redrawing its own interaction sheet. The [proposal record](../decisions/library-grid-table-interactions.md) (PPO-LIBRARY-GRID-INTERACTIONS-PROP) lists what was drawn.

- **Variables and styles.** The library holds 84 variables: the 66 "PPO colour" variables copied from PPO - Shell (accepted 8 November 2026), 15 "PPO layout" variables and 3 "Grid density" variables with Comfortable and Compact modes. It also holds eight text styles and one effect style. [`docs/design/library-variables.json`](../design/library-variables.json) records the variables.
- **Pages.** Read me (file cover, page index, how to use), Foundations (specimens) and Grid · Table interactions.
- **Components.** Nine `Status: Proposed` Grid component families: Header cell, Header cell · Select, Cell, Cell · Edit, Row, Row marker, Checkbox, Column divider and Drop indicator, with icons and annotation cursors.
- **Review board.** A header band, an anatomy figure and eleven cards: column reorder, column resize, sort and frozen edges, rows and selection, grid states, inline editing, columns and undo, keyboard and shared views, density, Do and Don't, and values with the decisions and a change log. A playground frame links the variants for a Figma prototype.
- **Decisions.** Dean accepted D1–D8 as recommended on 10 November 2026, after asking for the recommendations to be checked against professional practice.
- **Audit.** Dean then asked for an audit; section 9 of the record holds it. He accepted its recommended order ("Accept the recommended order and draw them"), and section 10 records what was drawn. The components and the board were rebuilt, so node IDs recorded earlier that day were replaced. The audit's main finding, that the header menu had no pointer or touch opener, is fixed by a menu button on the header cell.
- **Quick inline editing.** Dean then asked for quick inline edits in cells, with a Pipedrive example. Section 11 of the record holds it: an editable cell shows an outline and a pencil button on hover and focus, and the pencil opens an editor under the cell for text, number, date, single choice or person. Grid / Cell · Edit now has nine states, and card 6 was replaced.
- **To confirm.** Four things are new and await Dean: the 40% frozen-zone limit, the personal-layout rules, Compact density for pointer devices only, and the quick-edit rules (which cells offer it, and the editor replacing in-place typing).
- **Token check.** The enforced token check could not be pointed at the library, because it allows no new variable without a CSS name and 63 library variables have none. The 21 with a code name were verified against the app's CSS with the check's own logic.
- **Community libraries.** Dean switched off the eight community libraries on the file; a connector read confirmed none remain added.

**Checked:** every card, the components, the playground, the Foundations board and the cover were rendered and inspected, and drawing defects found on the way were fixed. A structural read found no solid fill or stroke without a variable, no text without a text style and no shadow without the effect style. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- The page is not accepted and the library is not published; no named version is saved.
- The prototype links were set and read back but not played.
- No module file uses the components yet, and Sales ST01 and Estimating ST01 are unchanged.
- Buttons, chips, menus and dialogs are not yet library components; audit candidates N4–N8 and N10 are not drawn.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Grid table interactions in PPO - Library](../decisions/library-grid-table-interactions.md) (PPO-LIBRARY-GRID-INTERACTIONS-PROP) records the shared register pattern drawn in the private library file on 10 November 2026 (column reorder and resize, sort, frozen edges, rows and selection, grid states, inline editing, column chooser, keyboard, touch, shared views and density), its sources in the Sales and Estimating interaction sheets, its values, Dean's accepted decisions D1–D8, the audit and the items drawn from it. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
