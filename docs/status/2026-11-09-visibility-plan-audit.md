---
title: Small-table visibility plan audit
date: 2026-11-09
---

[Draft PR #877](https://github.com/deanrfiedler-gif/powerplants-one/pull/877) inventories 77 visibility-heavy interactive reader entries and measures ten default-screen main statements with native synthetic fixtures. The [evidence](../testing/evidence/visibility-plan-audit/README.md) records the corrected #870 baseline, selection, exclusions, complete-plan loop maxima, buffer hits, timings, JIT presence, manual ANALYZE controls and proposed source-local fixes. No application fix is implemented.

Seven measured readers are AT RISK: organisations (1,400 maximum loops), sites (654), My Work (960), Deals (1,110), Projects (552), equipment (648) and people (572). Facilities (40), conversations (30) and estimating workload (30) are BOUNDED in these fixtures. The organisation control remains above its bound at 1,020 loops. Explicit table-set never-analysed assertions pass before and after all ten baseline measurements; the final all-table snapshots also have zero analysis counters. Empty optional branches and single-run warm timings limit these findings as described in the evidence.

The manual `tests/database/visibility-plan-audit.proof.ts` runs only on `ppo_synthetic_test`, writes ignored `tmp/` evidence and is outside routine CI's database-test glob. `npm run check` passes, including 1,437 unit tests and the production build. Browser tooling is unavailable according to cloud setup; browser suites and the full ready-head CI suites remain for GitHub CI after Claude's one draft review. No business acceptance, review approval, deployment or merge is claimed.
