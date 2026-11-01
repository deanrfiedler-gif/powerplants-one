---
title: Material change impact SC-09 design accepted
date: 2026-10-31
---

Dean accepted the Figma design for SC-09, material change-impact review: "Accept all". The [design decision](../decisions/material-changes-figma-design.md) (PPO-SC09-MATERIAL-CHANGES-FIGMA-DEC) records D1–D11 and the recommended answers to Q1–Q8:
- a register grouped by status, and a change record with before and after evidence, affected records by type, remaining holds, unmet demand and an "Unchanged" statement;
- the page shows and routes; each owner acts in their own page and the state reads back, and it never edits demand, orders, reservations, receipts, bookings or packs;
- an acknowledgement says only that the owner has seen the change; a receipt correction still needs each affected demand owner's own decision;
- shortfall reductions are chosen by a person, never by priority, and unmet demand and holds stay;
- Material changes sits as a group in the Material demand side menu.

Q1–Q8 are design direction, not verified operating rules. Twenty-one icon-free captures with hashes are retained in [material-changes-design-r01](../reference/ui/supply-chain/material-changes-design-r01/README.md), and the design register page for `scope:SC-09` cites them. In Figma the capture copies sit on the Captures page at y = 1,350,000.

Checked:
- No Font Awesome instance or stray vector is left in the capture copies, and no copy carries a prototype link.
- The page has no overlaps, and off-page links were stripped.

Not done:
- The prototype flows weren't played in Figma Present mode. Devices, keyboard and screen reader weren't checked.
- `/supply/changes` isn't changed.
- The named Figma version "Material changes — accepted" waits for Dean.
- Pages this one draws on that are still proposals stay proposals; accepting SC-09 doesn't accept them. The decision lists the differences on Material demand and Change review.

No application code, route, migration, permission, grant, adapter or parent ID changes.

<!-- decision-index -->
[Material change impact design](../decisions/material-changes-figma-design.md) (PPO-SC09-MATERIAL-CHANGES-FIGMA-DEC) records Dean's 31 October 2026 acceptance of the SC-09 design: a register by status and a change record that shows before and after evidence and routes each owner to their own page, editing nothing. Reductions are chosen by a person, never by priority. Changing the application page isn't decided.
