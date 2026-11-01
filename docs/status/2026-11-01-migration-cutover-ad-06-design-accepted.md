---
title: Migration and cutover AD-06 design accepted
date: 2026-11-01
---

Dean accepted the Figma design for AD-06, the migration, coexistence and cutover workbench: "Accept". The [design decision](../decisions/migration-cutover-figma-design.md) (PPO-AD06-MIGRATION-CUTOVER-FIGMA-DEC) records departures D1–D10 and answers Q1–Q6:
- every rehearsal runs on a synthetic or specifically approved redacted snapshot, in an isolated rehearsal space, and anything else is refused before a row is read;
- each exception keeps one owner, with duplicates handed to Data quality and unmapped keys to Mappings and reconciliation;
- sign-off needs the module owner and a second person who isn't the preparer, and is blocked while an exception is open or a difference is unexplained;
- the coexistence plan is labelled "Proposed plan: not a decision", and the best readiness result is "Ready for decision".

Twenty icon-free captures with hashes are retained in [migration-cutover-design-r01](../reference/ui/migration-cutover-design-r01/README.md), and the design register page for `scope:AD-06` cites them. In Figma the capture copies sit on the Captures page at y = 1,430,000.

Checked:
- No Font Awesome instance is left in the capture copies, and no copy carries a navigation link.
- The page's navigation links stay on the page. The flows were traced in code, not played in Present mode.

Dean saved the named Figma version "Migration & cutover — accepted".

Not done:
- `/admin/migration` is not built.
- The AD-03, AD-04, AD-05, AD-07 and AD-10 pages this design hands to aren't accepted by this decision.

No application code, route, migration, permission, grant, adapter, workflow or parent ID changes. This authorises no real migration, integration or cutover.
