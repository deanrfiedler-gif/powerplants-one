---
title: Board page drawn in PPO - Library
date: 2026-11-10
---

After the Move page was reported, with Board cards named as next in the order Dean had accepted, Dean answered "Continue". The page "Board · Cards and stages" is now drawn in the private Figma file "PPO - Library". The [proposal record](../decisions/library-board.md) (PPO-LIBRARY-BOARD-PROP) lists what was drawn.

- **One card and one stage for every board.** Deals by stage, service requests by status, project tasks by phase use the same card, with its rows in a fixed order taken from the accepted Sales board.
- **Parts.** Five `Status: Proposed` families: Card (seven states), Activity line, Count, Stage header and Stage · Collapsed.
- **Review board.** Nine cards: anatomy of a board, the card, card states, stages, moving cards, board states, keyboard, touch and phone, Do and Don't, and the values.
- **Moving cards.** A drop is the stage-change command, the same as Move to stage in the card's menu, and uses the Move page parts.
- **Foundations.** Two `board/` variables, the Elevation / Card effect style, and Icon / Calendar and Icon / Clock. The library now holds 95 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.
- **Confirmed.** Five items needed Dean's decision: the card rows for every board, signals and age at 12 px, a menu button on cards, stage paging and collapsing, and whether a drag can reach any permitted stage or only the next one. He confirmed them later the same day, with the five on the Move page ("Confirm all ten items as recommended and draw the next page").

**Checked:** the components and every card were rendered and inspected, and drawing defects found on the way were fixed. A structural read found no solid fill or stroke without a variable, no text without a text style and no plain corner radius; shadows that scaling had detached from their style were re-applied. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- No page is accepted and the library is not published.
- No prototype links were set on the Board parts.
- The accepted Sales board is unchanged; no module file uses the parts yet.
- Planners and calendars, and the Gantt chart, are not started.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Board · Cards and stages in PPO - Library](../decisions/library-board.md) (PPO-LIBRARY-BOARD-PROP) records the shared board card and stage drawn in the private library file on 10 November 2026, their sources in the accepted Sales board, and five items for Dean to confirm. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
