---
title: Library items confirmed and the review's last items closed
date: 2026-11-12
---

On 12 November 2026 Claude listed five recommendations for the private Figma file "PPO - Library", and Dean answered: "Proceed based on your recommendations." This note records what that confirmed and what was then drawn.

- **Confirmed as drawn.**
  - Controls C6 to C11: where a search field goes, the multi-select, file types and size, rows per page, the switch and the segmented control ([Controls record](../decisions/library-controls.md), section 7).
  - Record R7 to R11: "How this was worked out" and "Changed since you last looked" ([Record record](../decisions/library-record.md), section 7).
- **Decided and drawn** ([library audit](../decisions/library-audit.md), section 9).
  - Spacing steps of 20 and 32 px: `space/20` and `space/32`. The 5 and 10 px values moved to the nearest step.
  - Danger, Pressed uses an 18% white layer, so its label is 4.70:1 where it was 4.12:1. This amends Controls C1 for Danger only.
  - A disabled Menu item dims to 45%, the accepted rule.
- **The independent review's last items.**
  - One count badge: Controls / Count, merged from Board / Count and Move / Count badge.
  - The card and row placeholders are built from State / Placeholder.
  - Unavailable days carry a line through the number.
  - The lone links on Phone / Status line and Phone / Selection bar are Touch-size buttons.
  - The seven banner-shaped parts stay separate, with their shared anatomy written on Controls / Banner. That is Claude's choice, with its reason in the audit record.
- **Option names.** Five more sets follow the naming rule: Form / Match card, Form / Option, Time / Day header, Time / Lane header and Gantt / Dependency.
- **Variables.** The library holds 141 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

**Checked:** each changed part was rendered and inspected. Placed instances were read back after every structural change: 58 count badges kept their numbers, 39 instances of the renamed sets kept their variants, and the three phone actions kept their labels. Variables were read back from the file. A read of every page found no solid fill or outline without a variable, no text without a text style and no component without a status line. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- No shared structural base for the banner-shaped parts.
- The application stores no per-person "last opened" time; building R10 needs its own decision and a migration.
- The two new variables have no CSS name; all names come with the reconciliation before publishing.
- Review-board texts were not re-read for the old option names.
- No page is accepted and the library is not published.
- No application code, binding, register or page guide changed.

File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Controls in PPO - Library](../decisions/library-controls.md) (PPO-LIBRARY-CONTROLS-PROP) and [Record · Details, tabs and history in PPO - Library](../decisions/library-record.md) (PPO-LIBRARY-RECORD-PROP) now record Dean's confirmation of 12 November 2026 of items C6 to C11 and R7 to R11. The [library audit](../decisions/library-audit.md) (PPO-LIBRARY-AUDIT-DEC) records his decisions the same day on spacing steps of 20 and 32 px, the Danger button's Pressed layer and the disabled Menu item, and the close of the independent review's last items. None accepts a page, publishes the library or authorises application code.
