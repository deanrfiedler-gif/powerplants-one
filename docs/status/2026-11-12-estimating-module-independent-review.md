---
title: Estimating module Figma file independently reviewed; stale facts and a Shell record-header misalignment found in the accepted file
date: 2026-11-12
---

Dean asked for an audit of the accepted Estimating module UI pages in Figma against five questions: gaps, refinements, professional finish, new features and industry practice. The [review record](../decisions/estimating-module-independent-review.md) (PPO-ESTIMATING-REVIEW-PROP) holds the findings. It was read-only: nothing was changed in Figma, and the accepted design and its named version stand until Dean saves a new one.

- **Holds.** Page template, 297 sheets on the grid with labels, all 306 recorded node IDs, shell instances, colour bound to variables throughout, Roboto only, and every weekday label true to the calendar.
- **Wrong facts in the accepted file.** The Riverbend estimate record shows two states and two sets of totals; one issued quotation document is drawn with two contents and two fingerprints; the exact-output preview and the customer page disagree on options and payment terms; the tablet and phone workload sheets still show the story before the re-alignment; a retired persona remains on 35 sheets.
- **Shell.** The outputs menu is named "Reports" on 33 record sheets where rule R119 names it "Outputs", and the record header is drawn by hand rather than placed from the Shell's record header toolbar of 10 November 2026. Rule R117's single "Issue & send" primary conflicts with the file's separate Issue and Send, and the organisation references differ from the accepted Sales file; both are questions for Dean.
- **Design ready defects.** Clipped gate sentences and table columns on five sheets, a misaligned import table, phone buttons 18 to 20 px high, phone inputs below 16 px and three contrast failures.
- **Answers.** Nine gaps, ten further feature candidates (N-E11 to N-E20, rules first), and a recommendation to redraw the customer quotation page, the least finished surface and the only one a customer sees.

Checked: all 15 scope pages walked through the connector (about 122,750 nodes, 29,340 texts) and 35 sheets read at full size; `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py`. Not done: 262 sheets were not read by eye; pattern counts are lower bounds because chips and tiles use non-breaking spaces; flows were counted, not played; version history, addenda A1 and A3, and the Shell, Sales and Library files were not read. No application code, binding, register or page guide changed.

<!-- decision-index -->
[PPO - Estimating module independent review](../decisions/estimating-module-independent-review.md) (PPO-ESTIMATING-REVIEW-PROP) records a read-only audit of the accepted Estimating module Figma file on 12 November 2026: 36 findings (ER-01 to ER-36) from stale facts to Shell record-header alignment and Design ready defects, answers to Dean's five questions, feature candidates N-E11 to N-E20 and nine questions for Dean. It changes and accepts no design and authorises no application code or deployment.
