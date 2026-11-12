---
title: PPO - Library independently reviewed; one fault confirmed and findings handed to the session drawing it
date: 2026-11-12
---

Dean asked a second Claude session to audit the private Figma file "PPO - Library" for professional finish and industry practice. The [review record](../decisions/library-independent-review.md) (PPO-LIBRARY-REVIEW-PROP) holds the findings. It was read-only: nothing was changed in Figma.

- **Agrees with the 11 November audit** (PPO-LIBRARY-AUDIT-DEC, in pull request #915) on colour binding, text styles, layer names, descriptions and the use of modes.
- **A fault confirmed.** Two variants of Grid / Cell · Edit paint a black background. The earlier audit took the reading for an overlay and left it unconfirmed.
- **A correction.** Spacing is not fully bound: 342 of 1,130 padding and gap values inside components use no variable, mostly on the Time, Board, Gantt and States pages.
- **New findings.** Chosen and pointer state share one option on eight controls. Option names differ between parts. Seven banner-shaped parts share no base. The Danger button's Pressed label is 4.13:1.
- **Already decided, so not reopened.** The second tier of colour variables (B2), themes (B1), CSS names (B3), the icon set and chip tones.
- **Choices.** Dean answered "Proceed however you believe is the most professional." The record lists five choices Claude took under that instruction. None is Dean's acceptance of a design.

**Checked:** the fault was read twice and rendered twice; the spacing count was scanned on every page and read by hand on one component. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py` and `python3 scripts/check_foundation.py`.

**Not done:**
- This session did not edit the library. Pull request #915 holds that claim, and section 6 of the record hands the work to it.
- One item needs Dean: the Pressed layer on the Danger button, which changes a value he confirmed.
- `PPO - Shell`, the module files, prototype links and the application were not examined.
- No page is accepted and the library is not published.
- No application code, binding, register or page guide changed.

<!-- decision-index -->
[PPO - Library independent review](../decisions/library-independent-review.md) (PPO-LIBRARY-REVIEW-PROP) records a second, read-only audit of the library on 12 November 2026: one confirmed fault, a correction to the earlier audit's spacing finding, a proposed naming rule for component options and the work handed to the session that holds the library. Its choices are Claude's under Dean's instruction to proceed, not owner decisions. It authorises no application code or deployment.
