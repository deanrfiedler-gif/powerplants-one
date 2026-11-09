---
title: Small-table visibility plan audit
date: 2026-11-09
---

[Draft PR #877](https://github.com/deanrfiedler-gif/powerplants-one/pull/877) inventories 77 visibility-heavy interactive reader entries and measures ten default-screen main statements with native synthetic fixtures. The [evidence](../testing/evidence/visibility-plan-audit/README.md) records the corrected #870 baseline, selection, exclusions, complete-plan loop maxima, buffer hits, timings, JIT presence, manual ANALYZE controls and proposed source-local fixes. No application fix is implemented.

[Claude's one review, F1](https://github.com/deanrfiedler-gif/powerplants-one/pull/877#pullrequestreview-5820770148), found that one volume could not establish super-linear risk. The audit now compares 30 and 45 native fixture sets for all ten readers, states every denominator and reports loop, shared-hit and execution-time ratios. Seven are SUPER-LINEAR (AT RISK) in the documented two-point loop screen, none is LINEAR OVER SCREEN and three are BOUNDED. My Work has the largest loop-growth ratio (2.203×); Deals has the largest size-45 cost (161,528 shared hits, 197.201 ms). The original fix proposals remain unchanged and are re-ranked by growth, then absolute cost. Facilities stays within the loop bound but its 4.380× buffer growth is explicitly not classified as generally safe.

Before/after never-analysed assertions pass at both volumes, and the final all-table snapshots have zero analysis counters. Both volumes include manual ANALYZE controls. The evidence documents seed offsets, the Facilities population denominator correction, empty optional branches and single-run timing limits. No application fix is implemented.

The manual `tests/database/visibility-plan-audit.proof.ts` runs only on `ppo_synthetic_test`, writes ignored `tmp/` evidence and is outside routine CI's database-test glob. `npm run check` passes, including 1,437 unit tests and the production build. Browser tooling is unavailable according to cloud setup; browser suites and the full ready-head CI suites remain for GitHub CI after F1 is addressed under the requested readiness sequence; Claude then confirms only F1. No business acceptance, review approval, deployment or merge is claimed.
