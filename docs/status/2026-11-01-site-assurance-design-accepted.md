---
title: Site assurance design accepted
date: 2026-11-01
---

Dean accepted the Figma design for Site assurance, `scope:PJ-09/site-assurance`, as its own Projects page: "Accept with Option A". The [design decision](../decisions/site-assurance-figma-design.md) (PPO-PJ09-SITE-ASSURANCE-FIGMA-DEC) records D1–D12 and the recommended answers to Q1–Q9:
- inspection and test plans per work package, with hold points that stop the next step and witness points that invite;
- checks run where their owner keeps them: the FI-03 runner, EN-08 or PJ-06;
- a failed attempt is kept and raises a defect and retest, reviewed by someone other than the person who fixed it;
- a changed plan is a new revision, with completed checks kept against theirs;
- a release names what's included and excluded, is reviewed by someone other than the preparer, and goes to PJ-09. It never accepts for the customer.

Q2–Q9 are design direction, not verified operating rules. Whether Powerplants runs ITPs this way is still to be checked before any build. Twenty-three icon-free captures with hashes are retained in [site-assurance-design-r01](../reference/ui/projects/site-assurance-design-r01/README.md), and the design register page for `scope:PJ-09` cites them. In Figma the capture copies sit on the Captures page at y = 1,500,000.

Checked:
- No Font Awesome instance or stray vector is left in the capture copies, and no copy carries a prototype link.
- The page has no overlaps, and copied links were stripped.

Not done:
- The prototype flows weren't played in Figma Present mode. Devices, keyboard and screen reader weren't checked.
- `/projects/assurance` doesn't exist, and the rail item stays unavailable in the application.
- The named Figma version "Site assurance — accepted" waits for Dean.
- PJ-09 isn't edited, so "Assurance released" isn't on its checks bar. Pages this one draws on that are still proposals stay proposals; the decision lists the differences on EN-08, PJ-06 and PJ-09.

No application code, route, migration, permission, grant, adapter or parent ID changes.

<!-- decision-index -->
[Site assurance design](../decisions/site-assurance-figma-design.md) (PPO-PJ09-SITE-ASSURANCE-FIGMA-DEC) records Dean's 1 November 2026 acceptance of the Site assurance design under PJ-09, traced to PRJ-06: ITPs per package with hold and witness points, kept failed attempts and independent retest review, plan revisions, and a scoped release handed to PJ-09 that never accepts for the customer. Building the page isn't decided.
