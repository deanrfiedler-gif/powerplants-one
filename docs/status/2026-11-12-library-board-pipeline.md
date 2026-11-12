---
title: Board page updated from the built Deals board
date: 2026-11-12
---

On 12 November 2026 Dean supplied four screenshots of the built Deals board and asked whether the Board sections of the private Figma file "PPO - Library" should be updated. He asked for arrow-shaped stage headers, a green stage under a dragged card, and Won, Lost, Delete and Move boxes shown while a card is dragged. Claude recommended each in a refined form, and Dean answered: "Proceed based on your recommendaitons." The [Board record](../decisions/library-board.md) (PPO-LIBRARY-BOARD-PROP), section 7, holds the six decisions.

- **Decisions B6 to B11.**
  - B6: a 3 px danger marker on a card that needs action, in place of a pink card.
  - B7: Preview, Plan activity and Email on hover and focus, with More; on touch More only.
  - B8: the stage under a lifted card turns green on its lane and header, with the outline.
  - B9: a drop bar with Lost, Won and Move while a card is lifted; Delete stays in the card's menu.
  - B10: arrow-shaped headers for ordered pipelines; the plain header elsewhere.
  - B11: stages share the page width, from 240 px to 360 px.
- **Correction the same day.** Dean reviewed the first drawing of the arrow headers and asked that each header merge into its column and that its lower edge match the column's width. Both are done: header and lane are one surface, and the arrow point overhangs into the gap between stages. He then asked for the green outline of a target stage to go around the header too, with no line between header and column; that is done as well.
- **Card refinements.** A two-line next action, whole dollars, and a title of one or two lines.
- **Parts.** Board / Stage header now has seven variants (Plain and three flow shapes, each at rest or as a target). Two new `Status: Proposed` parts: Board / Drop action and Board / Drop bar. Board / Card gained an Attention option and hover actions; Board / Activity line gained a second line; Icon / Eye was added.
- **Review board.** A new card 6, "Pipeline boards", shows a Deals board with a card lifted over a green stage and the drop bar. Cards 6 to 9 became 7 to 10, and the wording of cards 2, 3, 5 and 10 follows the decisions.
- **Move page.** B8 amends Move M1: the container tint goes from 6% to 14% ([Move record](../decisions/library-move.md)).
- **Variables.** `board/stage-max-width` (360). The library now holds 139 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

**Checked:** the components and the changed cards were rendered and inspected, and drawing defects found on the way were fixed. The fourteen stage headers already placed kept their names and totals. A structural read of the Board page found no solid fill or stroke without a variable, no text without a text style, no plain corner radius, no default layer name and no component without a status line. Variables were read back from the file. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- The built Deals board and the accepted Sales file are unchanged; they align at their next reviewed change.
- The paired avatars on the built card were not checked in the application.
- Seven example cards shown at 82% have shadows with no effect style, which Figma does not keep on scaled copies.
- No prototype links were set, and nothing was tried with a keyboard or on a touch screen.
- No page is accepted and the library is not published.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Board · Cards and stages in PPO - Library](../decisions/library-board.md) (PPO-LIBRARY-BOARD-PROP) now records Dean's six decisions of 12 November 2026 from the built Deals board: an attention marker, card actions on hover, a green target stage, a drop bar for Lost, Won and Move, arrow-shaped headers for pipelines and stages that share the page width. They amend B1, B3 and Move M1. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
