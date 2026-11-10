---
title: Grid table interactions drawn in PPO - Library
date: 2026-11-10
---

Dean created the private Figma file "PPO - Library" and asked for the shared table interactions page to be drawn there, so that every module's registers use one behaviour for moving and resizing columns instead of each module redrawing its own interaction sheet. The [proposal record](../decisions/library-grid-table-interactions.md) (PPO-LIBRARY-GRID-INTERACTIONS-PROP) lists what was drawn.

- **Variables.** The library now holds the 66 "PPO colour" variables copied from PPO - Shell (accepted 8 November 2026). Twenty of them carry web code syntax where the app already has an identical CSS value.
- **Text styles.** Seven proposed Roboto text styles.
- **Components.** Page "Grid · Table interactions" holds five `Status: Proposed` component families: Grid / Header cell (8 states), Grid / Row (7), Grid / Checkbox, Grid / Column divider and Grid / Drop indicator.
- **Review board.** Six cards:
  - column reorder, with its keyboard, non-drag and touch routes;
  - column resize, with its hit zone, guide, limits, double-click to fit, keyboard steps and the Set width… popover;
  - sort, header states and frozen edge;
  - row states;
  - values, sources and the accepted decisions;
  - the WAI-ARIA data grid keyboard contract, touch rules and shared-view behaviour.
- **Sources.** The page consolidates the Sales ST01 and Estimating ST01 sheets, which differ on the focus-ring colour and the frozen edge. The Projects and Supply interaction pages are empty and adopt the library page directly.
- **Decisions.** Dean asked for the recommendations to be checked as the most professional approach; the check against WCAG 2.2 AA, the component rules and data-grid practice changed D3 and D4 and added D6–D8. Dean then accepted D1–D8 as recommended on 10 November 2026, and the page was updated to match. The page itself, and its components, remain proposed until he accepts it.
- **Audit.** Dean then asked for an audit of the pages. Section 9 of the record holds it: four stale captions corrected in the file, gaps G1–G12, refinements R1–R6, presentation items P1–P7, ideas N1–N10 and a recommended order. Its main finding is that the header menu has no pointer or touch opener, so the touch resize route accepted in D7 cannot be reached until a menu button is added (G1). None of the recommendations is drawn yet.
- **Community libraries.** Dean switched off the eight community libraries on the file; a connector read confirmed none remain added.

**Checked:** every card was rendered and inspected after each change, and drawing defects found on the way were fixed (icon placement, focus rings shifting content, an oversized stage). Contrast ratios for D1 and D8 were computed from the colour values. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py` and `python3 scripts/check_foundation.py`.

**Not done:**
- The page is not accepted and the library is not published.
- No module file uses the components yet, and Sales ST01 and Estimating ST01 are unchanged.
- Layout variables, effect styles, icons, shell components and the page template are not in the library.
- No application code, binding, register or page guide changed; RegisterTable alignment and per-type width limits are later reviewed changes.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Grid table interactions in PPO - Library](../decisions/library-grid-table-interactions.md) (PPO-LIBRARY-GRID-INTERACTIONS-PROP) records the shared column reorder, column resize, sort, frozen-edge, row-state, keyboard, touch and shared-view pattern drawn in the private library file on 10 November 2026, its sources in the Sales and Estimating interaction sheets, its values and Dean's accepted decisions D1–D8. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
