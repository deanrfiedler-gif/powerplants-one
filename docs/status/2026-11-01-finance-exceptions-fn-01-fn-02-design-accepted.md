---
title: Finance exceptions FN-01 FN-02 design accepted
date: 2026-11-01
---

Dean accepted the Figma design for Finance exceptions, under FN-01 and FN-02 and traced to FIN-03 and FIN-06: "Accept and lock in". The [design decision](../decisions/finance-exceptions-figma-design.md) (PPO-FN-EXCEPTIONS-FIGMA-DEC) records D1–D10 and answers Q1–Q9:
- one worklist across the owner pages, with "Open in [source page]" on every row and amounts never totalled across GST bases;
- correction progress is Requested, Evidence supplied, Verified, Resolved, and the original result is always preserved;
- the Reconciler is a duty refused for whoever supplied that evidence;
- an unknown outcome offers a lookup, never a retry that could post twice;
- a credit hold warns and routes to Finance review, with ERP credit status verified separately in MYOB.

Twenty icon-free captures with hashes are retained in [finance-exceptions-design-r01](../reference/ui/finance/finance-exceptions-design-r01/README.md), and the design register pages for `scope:FN-01` and `scope:FN-02` cite them. In Figma the File index row is `3090:490441`, the capture copies sit on the Captures page from y = 1,420,000, the two new grid parts moved to Components · Finance parts, and Dean saved the named version "Finance exceptions — accepted" on 1 November 2026.

Not done:
- The prototype flows have not been played in Present mode.
- The page is not built, the route `/finance/exceptions` does not exist, and no owner page yet shows a Finance review.
- Cross-page differences on FN-01, AD-04 and RP-05 are recorded as Q5, Q6 and Q8 and wait for those pages to change.

No application code, route, migration, permission, grant, MYOB endpoint or parent ID changes. All records, amounts and rules in the frames are synthetic.

<!-- decision-index -->
[Finance exceptions design](../decisions/finance-exceptions-figma-design.md) (PPO-FN-EXCEPTIONS-FIGMA-DEC) records Dean's 1 November 2026 acceptance of the one Finance worklist across the owner pages: line comparison, preserved originals, independent verification, Finance review and unknown-outcome lookup. Building the page is not decided.
