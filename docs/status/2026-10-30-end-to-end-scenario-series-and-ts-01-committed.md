---
title: End-to-end scenario series and TS-01 committed
date: 2026-10-30
---

Dean asked for documented end-to-end test scenarios and accepted the recommendation to give them their own catalogue. PPO-STD-001 section 9.1 now declares TS (business scenarios) and TX (cross-cutting) identifiers. [TS-01](../testing/TS-01-berry-farm-fertigation-project.md) walks a synthetic berry farm's Priva fertigation project from website enquiry to Finance handoff and aftercare in 15 stages, 106 steps and 18 exception branches. The [scenario register](../testing/end-to-end-scenarios.md) plans TS-02 to TS-08 and TX-01 to TX-04.

TS-01 was drafted in a Claude Docs working copy, independently reviewed against main at `fa15714` and corrected; this repository file is now authoritative. Its section 8 records nine build findings (F-01 to F-09). PRs #750 (P4 site readiness) and #751 (project billing decision) address F-08 and F-02. The Priva supply EC, pH and bicarbonate inputs were checked against published guidance; valve flows and the unit model still need a Powerplants fertigation specialist. TS-01 has not been run, and no AT or PT status changes. Documentation only.
