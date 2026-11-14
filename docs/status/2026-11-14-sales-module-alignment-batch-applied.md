---
title: Sales module alignment batch applied in the accepted Figma file; named version and independent check pending
date: 2026-11-14
---

On Dean's decisions of 14 November 2026 on the [Sales module review](../decisions/sales-module-independent-review.md) (PPO-SALES-REVIEW-PROP, section 11), the alignment batch was applied in "PPO - Sales module (accepted)". [Section 15 of the proposal record](../decisions/sales-module-refined-ui-proposal.md#15-alignment-batch--14-november-2026) (PPO-SALES-REFINED-FIGMA-PROP) records each change.

- **Facts.** One Riverbend story matching the Estimating file; one record per lead reference; 152 weekdays set to 2026; Kate Morgan, Jess Wong, Ravi Kumar and Noah Patel in their A3 roles; Hillview at Tatura; Melbourne AEDT; two-digit revisions; a read-only Sales view of Products.
- **Shell.** The record header toolbar, its phone component and the collapsed docked-menu strip are rebuilt in Shell and kit with the Shell's names. They are placed on 37 record headers and 82 desktop sheets, and the phone sticky bars hold Actions and the primary.
- **Accessibility and conventions.** No text below 4.5:1 and none under 11 px outside components; panels at 360 and 480 px and dialogs at 560 to 720 px; the phone tab bar is current per sheet; colours are bound to variables.
- **Pages.** Shell and kit sits below the Proposals separator; the pages take short names; Insights has its own page; labels cut off at the sheet's width.

Checked: scans of every page after the batch (about 16,000 text nodes) and renders of the changed parts; `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. Not done: about 100 sheets not read by eye; Dean's named version "PPO - Sales module (accepted) · alignment batch", which also pins the phone tab bar change of 10 November; the check of the changed sheets by a different session; the Products references (A3.13), which need the Products file. Open: TB15's deal reference conflicts with D01. No application code, binding, register or page guide changed.

<!-- decision-index -->
[PPO - Sales module refined UI pages](../decisions/sales-module-refined-ui-proposal.md) (PPO-SALES-REFINED-FIGMA-PROP) section 15 records the alignment batch of 14 November 2026 applied in the accepted Figma file; the build basis stays "PPO - Sales module (accepted) · batch 2 · N13" until Dean saves the alignment-batch version, and it authorises no application code.
