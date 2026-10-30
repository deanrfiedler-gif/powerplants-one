---
title: Operational health AD-09 design accepted
date: 2026-10-31
---

Dean accepted the Figma design for AD-09, operational health, recovery and release readiness: "Accept as drawn". The [design decision](../decisions/operational-health-figma-design.md) (PPO-AD09-OPERATIONAL-HEALTH-FIGMA-DEC) records departures D1–D10 and answers Q1–Q7:
- a health overview with each check's time and result in words, and Local on anything local-only;
- incidents with an owner, impact in words and a timeline, where closing needs a reason and a cause-addressed check;
- recovery items with an owner and a safe retry using the same identities, linked to incidents;
- a release readiness review listing only checks that exist, with evidence, time and reviewer, whose result is "Ready for demo upgrade" or "Not ready", never production ready;
- Dean signs off a demo upgrade, and Foundation checks never run on the hosted demo.

Eighteen icon-free captures with hashes are retained in [operational-health-design-r01](../reference/ui/operational-health-design-r01/README.md), and the design register pages for `scope:AD-09` and `route:/foundation` cite them. In Figma the capture copies sit on the Captures page from y = 684,341.

Checked:
- No Font Awesome instance is left in the capture copies, and no copy carries a prototype link.
- All 38 navigation links stay on the page. The flows were traced in code, not played in Present mode.

Not done:
- The Overview, Incidents and Release readiness views, scheduled hosted checks and alerts are not built.
- The named Figma version "Operational health — accepted" is not saved yet.
- Integrations AD-04 and the other administration proposals AD-09 draws on are still proposals; accepting AD-09 doesn't accept them.

No application code, route, migration, permission, grant, adapter, workflow or parent ID changes.

<!-- decision-index -->
[Operational health design](../decisions/operational-health-figma-design.md) (PPO-AD09-OPERATIONAL-HEALTH-FIGMA-DEC) records Dean's 31 October 2026 acceptance of the AD-09 design: health overview, owned incidents, recovery with safe retry, and a release readiness review for the hosted-demo upgrade only. Nothing on the page runs a deployment or claims production readiness. Building it is not decided.
