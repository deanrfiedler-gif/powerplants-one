---
title: Cash outlook FN-05 design accepted
date: 2026-10-31
---

Dean accepted the Figma design for FN-05, cash timing and commercial outlook: "Accept and lock in." The [design decision](../decisions/cash-outlook-figma-design.md) (PPO-FN05-CASH-OUTLOOK-FIGMA-DEC) records departures D1–D15 and answers Q1–Q13:
- actual receipts and payments from MYOB stay apart from forecast scenarios, and every figure shows source, time and AUD;
- three stated bases, with confidence lines on the cumulative chart that are not probabilities;
- overlay scenarios that never change a claim, invoice, order or MYOB;
- an owned gaps worklist, with expected recoveries, payroll, overheads and BAS not counted;
- a GST memo line, because $17,884.94 net GST in these 13 weeks is payable through BAS and not deducted.

Thirty-five icon-free captures with hashes are retained in [cash-outlook-design-r01](../reference/ui/finance/cash-outlook-design-r01/README.md), and the design register page for `scope:FN-05` cites them. In Figma the capture copies sit on the Captures page from y = 960,000.

Checked:
- By script and screenshots: frames in their sections, no overlap, linked top bars, no old figures, no link off the page.
- No Font Awesome instance is left in the capture copies, and no copy carries a prototype link.

Not done:
- `/finance/outlook` is not built, and the date, staleness and GST rules are proposed, not verified.
- The prototype flows were traced in code but not played in Present mode.
- FN-01, FN-02, FN-04, SC-02 and SC-08, which FN-05 draws on, are still proposals. Q9–Q11 name differences between FN-02 and FN-04 that stay open.

At Dean's instruction ("You save it"), Claude saved the named Figma version "Cash outlook — accepted" and saw it in the file's version history.

No application code, route, migration, permission, grant, adapter, customer message or parent ID changes.

<!-- decision-index -->
[Cash outlook design](../decisions/cash-outlook-figma-design.md) (PPO-FN05-CASH-OUTLOOK-FIGMA-DEC) records Dean's 31 October 2026 acceptance of the FN-05 design: actuals from MYOB kept apart from forecast scenarios, stated bases with confidence lines, overlay scenarios that never change source records, and an owned gaps worklist. Building it is not decided, and its date rules are proposed, not verified.
