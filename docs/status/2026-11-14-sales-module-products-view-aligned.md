---
title: Sales alignment batch named version saved; Sales view of Products aligned with the Products file
date: 2026-11-14
---

Dean saved the named version "PPO - Sales module (accepted) · alignment batch" on 14 November 2026 and supplied the link to the accepted PPO - Products module file. The Sales file's Products register PR01 and its tablet sheet TB08 now follow that file's Sales view CA14: twelve catalogue rows, `SYN-PROD-` references with aliases, revisions with their tier, the bounded-read wording and footer, CA14's four views, no totals, and "Open in Products". [Section 15.7 of the proposal record](../decisions/sales-module-refined-ui-proposal.md#157-named-version-and-the-products-view--14-november-2026) (PPO-SALES-REFINED-FIGMA-PROP) records the change, and the review record marks SR-06 and SR-14 fixed.

Checked: renders of PR01 and TB08 against CA14; `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. Not done: the independent check of the changed sheets, and the version Dean saves after it, which also pins this change. No application code, binding, register or page guide changed.

<!-- decision-index -->
[PPO - Sales module refined UI pages](../decisions/sales-module-refined-ui-proposal.md) (PPO-SALES-REFINED-FIGMA-PROP) section 15.7 records the named version "PPO - Sales module (accepted) · alignment batch" and the Sales view of Products aligned with the Products file's CA14; it authorises no application code.
