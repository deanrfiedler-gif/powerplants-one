---
title: Products module Figma file independently reviewed; no Blocker, three Major alignment items and a drawer-width conflict with the Library
date: 2026-11-13
---

Dean asked for an audit of the accepted Products module UI pages in Figma and linked "PPO - Library" for comparison. The [review record](../decisions/products-module-independent-review.md) (PPO-PRODUCTS-REVIEW-PROP) holds the findings. It was read-only: nothing was changed in either file, and the accepted design stands until Dean saves a new named version.

- **Holds.**
  - The page template and all 122 sheets and 7 notes cards; every recorded node ID resolves.
  - Shell parts are instances, with the record header placed from the Shell component on every record sheet.
  - Colour is bound to variables apart from the scrims, and Roboto is the only font.
  - No contrast failure, and every weekday label is true.
  - No retired fixture, pronoun or forbidden word outside a quoted rule.
- **Major.**
  - The Pricing record header carries three different primaries for one record and state, one of them a navigation (R117).
  - Cost sources read `SYN-SRC-000024` in this file and `SYN-SRC-0024` in Estimating and the code.
  - No named version is saved, so the build basis cannot be cited.
- **Question.** The Library's drawer widths are panel widths (filters 360, editing 480) while this file draws every panel at 432 px beside the strip, as its accepted A5 reads them.
- **Minor and Polish.** Sixteen items: header variants named for quotation states, one-digit revisions on quoted records, two tones for "Unknown", the stored value "SourceReported" shown as a word, a 32 px phone button, grid order, kit parts not yet matching the Library, scrim and style tokens, and a stale section label.

Checked: all seven scope pages walked through the connector, three sheets read at full size, the Library's variables and Controls components read, and the node IDs compared with the record and the Read me index. `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` were run. Not done: 119 sheets were not read by eye; version history and the other module files were not read; flows, keyboard and screen-reader behaviour cannot be tested in a static file. No application code, register or page guide changed.

<!-- decision-index -->
[PPO - Products module independent review](../decisions/products-module-independent-review.md) (PPO-PRODUCTS-REVIEW-PROP) records a read-only audit of the accepted Products module Figma file on 13 November 2026, with PPO - Library read for comparison: 20 findings (PDR-01 to PDR-20; no Blocker, three Major, one Question), a 43-check alignment matrix and six questions for Dean. It changes and accepts no design and authorises no application code or deployment.
