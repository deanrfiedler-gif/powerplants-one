---
title: Time & labour review FI-01 design accepted
date: 2026-10-31
---

Dean accepted the Figma design for the coordinator's Time & labour review, the coordinator side of FI-01 traced to SVC-08: "Accept and draw F1–F3". The [design decision](../decisions/time-labour-review-figma-design.md) (PPO-FI01-TIME-REVIEW-FIGMA-DEC) records D1–D19 and answers Q1–Q14:
- planned, recorded, reviewed and billable time stay separate on every record;
- recorded time is never edited in place, and an adjustment is a reviewed record with a reason;
- billable marking is a coordinator decision with a reason, and travel is non-billable by default;
- reviewed billable hours attach to the work order's Finance handoff, and this page never invoices;
- payroll is out of scope, and workshop hours stay on Workshop builds.

Thirty-four icon-free captures with hashes are retained in [time-labour-review-design-r01](../reference/ui/service/time-labour-review-design-r01/README.md), and the design register page for `scope:FI-01` cites them. In Figma the File index row is `2960:12231` and the capture copies sit on the Captures page from y = 1,335,000.

Not done:
- The named Figma version "Time & labour review — accepted" waits for Dean's explicit yes.
- Options F1–F3 are drawn on the page and await Dean's review. They are not part of this acceptance or the captures.
- The prototype flows have not been played in Present mode.
- The page is not built. It needs a time-entry and adjustment model, an allowance source, capabilities and a go-ahead, and the route `/service/time` does not exist.

No application code, route, migration, permission, grant or parent ID changes. All hours, quoted labour and thresholds in the frames are synthetic.

<!-- decision-index -->
[Time & labour review design](../decisions/time-labour-review-figma-design.md) (PPO-FI01-TIME-REVIEW-FIGMA-DEC) records Dean's 31 October 2026 acceptance of the coordinator's review of recorded field time: separate planned, recorded, reviewed and billable hours, adjustments that keep the original, and hand-offs to Finance and the planner. Building the page is not decided.
