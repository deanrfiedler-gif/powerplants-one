---
title: Gantt Today marker no longer covers the dates
date: 2026-11-12
---

On 12 November 2026 Dean noted that the Today pill on the Gantt page of the private Figma file "PPO - Library" covered the dates in its row, and offered three ideas. Claude recommended his second idea, refined, and Dean answered: "Proceed based on your recommendations." The [Gantt record](../decisions/library-gantt.md) (PPO-LIBRARY-GANTT-PROP), section 7, holds the decision.

- **Decision G6.** The Today label leaves the chart.
  - Today's date cell is tinted violet, with its date in violet.
  - A 9 px violet dot sits on the date row's lower edge, with the 1 px line below at today's exact position.
  - The word "Today" is on the toolbar's Today button, which carries the same dot and scrolls the chart to today, and in the marker's tooltip and accessible name.
- **Parts.** Gantt / Today line lost its label. Two new `Status: Proposed` parts: Gantt / Today cell and Gantt / Today key.
- **Review board.** All seven example charts were updated. Card 5 gained a "Today in the toolbar" example, and cards 1, 5 and 9 and the page header say what changed.
- **Not adopted.** A taller date row and an extra row for the pill: each costs every chart about 20 px of height for one marker.

**Checked:** the changed parts and cards were rendered and inspected. A structural read of the Gantt page found no solid fill or stroke without a variable, no text without a text style, no plain corner radius, no default layer name and no component without a status line. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- The built Gantt still draws the Today label; it aligns at its next reviewed change.
- No prototype links were set, and the tooltip and the Today button were not tried in a browser.
- No page is accepted and the library is not published.
- No application code, binding, register or page guide changed. No variable was added or changed.

<!-- decision-index -->
[Gantt · Bars and links in PPO - Library](../decisions/library-gantt.md) (PPO-LIBRARY-GANTT-PROP) now records Dean's decision of 12 November 2026 on the Today marker (G6): no label on the chart, a tinted date cell, a dot on the date row's lower edge with the line below, and the word "Today" on the toolbar button and in the tooltip. It amends the label in G1 and authorises no application code or deployment.
