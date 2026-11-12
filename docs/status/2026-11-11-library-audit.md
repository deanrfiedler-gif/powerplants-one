---
title: PPO - Library audited; fixes and a Drawer part drawn
date: 2026-11-11
---

Dean asked for an audit of every page in the private Figma file "PPO - Library": gaps, refinements, professional finish, industry practice and new features. The [audit record](../decisions/library-audit.md) (PPO-LIBRARY-AUDIT-DEC) holds the findings, his decisions and what was done.

- **Audit.** A measured scan of all twelve pages found the library sound on token binding and documentation. It found one contrast failure, small tick-box and radio targets, missing states, a tab that differed from the built app, and gaps in drawers, tokens, controls and handoff.
- **Decisions.** Dean chose status/success for the Now pill and line, 48 px tabs with a navy marker, and the retirement of 10 px text. He agreed twelve further recommendations, including dialog widths, breakpoints, proposed motion timings and the order of later work.
- **Fixes drawn.**
  - Tabs, the Now line and the retired text style.
  - New states: Disabled on tabs and filter chips, Hover on tick boxes, radios and choices, Focus on the date picker's day.
  - A target-size rule for tick boxes and radios, and a truncation rule on the Read me.
- **Drawer.** Controls / Drawer in the four drawer widths, with a title, a content slot and a save-bar footer.
- **Variables.** Two dialog widths, four breakpoints and a "Motion" collection of four. The library now holds 134 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.
- **Record items.** Dean confirmed R1 to R4 and R6 on the Record page ([record](../decisions/library-record.md), section 6).

**Checked:** each changed component and card was rendered and inspected. Variables and text styles were read back from the file. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- The audit left Controls / Dialog at 400 px and the Record page's card 7 without the Drawer component. Both were done with the [Phone page](2026-11-11-library-phone.md).
- The three proposed motion timings are not confirmed.
- The directions for later work are recorded, not drawn.
- No page is accepted and the library is not published.
- No application code, binding, register or page guide changed.

<!-- decision-index -->
[PPO - Library audit and decisions](../decisions/library-audit.md) (PPO-LIBRARY-AUDIT-DEC) records the audit of 11 November 2026 and Dean's decisions on it: the Now marker in status/success, 48 px tabs with a navy marker, no 10 px text, the missing states, one Drawer component, dialog widths, breakpoints and proposed motion timings, plus eight directions for later work. It lists what accepted pages align later and authorises no application code or deployment.
