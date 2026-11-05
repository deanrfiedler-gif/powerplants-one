---
title: Excel import review corrections and main integration
date: 2026-11-05
---

[PR #800](https://github.com/deanrfiedler-gif/powerplants-one/pull/800) integrates main through #802 and #810 in merge-only commit `d619db760d07a623852c93d1c1aa2bf817964dc9`. The three authorised additive conflicts retain both contributions. Register: main's 392 + 1 = 393 entries. Guides: main's 367 + 0 = 367. Both have unique keys; the added and removed lines of all 43 contribution files are unchanged by the merge.

The two Low findings from Claude's completed review are addressed: reconciliation figures use readable labels from the accepted Draft design, later keys have a sentence-case fallback, and customer-preview amounts use the existing money formatter under Amount. Both the review and Import summary use the same labels. A component regression checks the rendered labels, fallback and `AUD 1,234.50`. The implementation records now describe agent decisions under the standing order, with relayed chat as context only, and refer to the governing pull-request flow limits. Module-integration hashes identify design references separately from proof and acceptance.

Foundation, prototype, naming, status, studio, lint and typechecking passed. The full unit rerun with network access passed 1,400 of 1,401 tests with none skipped; the remaining recovery-path assertion reproduces on clean main with `Recovery data must stay outside Git.` The required cloud setup failed during seeding at `ck_grants_capability`, so its environment file was not sourced and database/browser suites are **not run here; left to GitHub CI**. [Evidence](../testing/evidence/excel-import-ui/README.md#review-findings-and-main-integration--5-november-2026) records exact comparisons and boundaries; the PR completion comment records final build and ready-head CI results. Only confirmation of the two findings and merge is requested. Visual review, owner acceptance and deployment remain separate.
