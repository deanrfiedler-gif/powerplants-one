---
title: C1 connected billing assurance and demo setup
date: 2026-11-12
---

[PR #905](https://github.com/deanrfiedler-gif/powerplants-one/pull/905) continues on Dean's instruction with a bounded demo warm-up, a connected B4/M2/C1 Finance component and reconciled six-monthly TS-01/TS-02 fixtures. [Evidence](../testing/evidence/agreement-charge-c1/README.md#connected-billing-assurance-and-bounded-demo-setup--12-november-2026) records the incoming CI failure, the 90-route local HTTP probe, initial fixture errors and final verification. Existing step IDs, pricing rules, migrations, grants and UI assertions are preserved.

Incoming-head Application and compiled-browser CI passed; demo setup failed before its six cases. The corrected setup's local HTTP probe reached 90/90 routes in 209,913 ms with no unreachable routes. The connected database component and all four existing Maintenance/Service regressions passed (5/5, no skips). `npm run check` passed Studio, lint, TypeScript, all 1,453 unit tests and the production build; documentation checks and 44 documentation tests passed. Local Chrome is absent. Command-level document evidence uses the explicit synthetic-byte helper; no rendered PDF or full manual scenario acceptance is claimed. Final-head CI and Claude's outstanding finding confirmation remain delivery gates. No merge, deployment or operational financial authority.
