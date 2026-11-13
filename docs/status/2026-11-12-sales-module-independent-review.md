---
title: Sales module Figma file independently reviewed; the Riverbend record contradicts itself and owners differ between sheets in the accepted file
date: 2026-11-12
---

Dean asked for an audit of the accepted Sales module UI pages in Figma. The [review record](../decisions/sales-module-independent-review.md) (PPO-SALES-REVIEW-PROP) applies the checks of the cross-file alignment audit prompt to this one file in depth, re-tests eleven of the 23 findings the open cross-file audit counts against this file, and adds twenty. It was read-only: nothing was changed in Figma, and the accepted design and its named version stand until Dean saves a new one.

- **Holds.** Page template, 114 sheets on the grid with labels, shell instances and top-bar order, colour bound to variables apart from recorded exceptions, Roboto only, Australian spelling, A$ amounts, and the substance of the design (separate outcomes, archive not delete, rules not scores).
- **Wrong facts in the accepted file.** The Riverbend deal record shows two brief states, three quotation states and three estimate references; one lead reference names two leads; 151 weekdays are wrong for 2026, most of them right for 2025; Noah Clarke and a Werribee address for Hillview remain; Products shows totals and catalogue-form references.
- **Roles and story.** Priya Nair owns deals and also receives the briefs as estimator; desktop and tablet sheets name different Projects and Service owners; the tablet and phone Activities sheets stand a week later than the story clock, and the staff time zone is Brisbane.
- **Shell and Library.** The record header is hand-drawn rather than the Shell toolbar, the collapsed docked-menu strip is absent, panels are 432 px against the Library's widths, and the phone tab bar change has no named version.
- **Accessibility.** 22 texts fall below 4.5:1, including the board's health signals, against the file's own contrast proof.

Checked: all eight scope pages walked through the connector (about 62,000 nodes), 157 recorded node IDs resolved, the Shell's record header toolbar and Sales menu read for comparison, four renders inspected; `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. Not done: addenda A1 to A3 were not supplied, so A3 facts come from the prompt and later records; version history, the other module files and touch targets were not read; about 100 sheets were not read by eye. No application code, binding, register, page guide or other record changed.

<!-- decision-index -->
[PPO - Sales module independent review](../decisions/sales-module-independent-review.md) (PPO-SALES-REVIEW-PROP) records a read-only audit of the accepted Sales module Figma file on 12 November 2026: 30 findings (SR-01 to SR-30; 6 Blocker, 11 Major, 12 Minor, 1 Polish) mapped to the cross-file audit, a 43-check alignment matrix and ten questions for Dean. It changes and accepts no design and authorises no application code or deployment.
