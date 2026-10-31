---
title: D-025 S3 authoritative integration candidate and owner merge gate
date: 2026-10-29
---

This dated source records a synthetic-only, owner-controlled D-025 S3 integration candidate for issue #737. It does not approve merging, deployment, external provider calls or customer communications.

This integration branch is owned by the ChatGPT integration session acting on Dean's explicit 29 October instruction. It does not write to any existing contributor-owned branch. The repository's original S3 PR #695 remains the historical parent; #730 supplies the reviewed production corrections and #734 includes #730 plus its three-file regression-fixture/upgrade-ledger follow-up. The full #734 commit ancestry is preserved once through a two-parent merge from the current main, not independently applied as two cumulative PRs. Do not separately merge #695, #730 or #734 after an owner-approved integration is landed.

Source S3 head: `50f197390cdc23454f9b22861cda1d99354f2292` (all 24 recorded PR-triggered workflows green on that head). Source main integration base: `af079a2f11abb8e5c80d184d99ba0029702cee47`. Both source and main share `f2e6932a44ee68708e1e5babee8978f5d8a0b32f` as the comparison merge-base. The 106 S3-changed paths and 23 subsequent main-changed paths are disjoint, permitting an exact blob-preserving merge without editing historical migration or seed contents. The S3 integration retains migrations/seeds 0120 and 0121, native evidence guards, receipts, and all existing fixtures. The source-head check result is not a substitute for exact integrated-head CI or a second-model review.

Evidence to complete before owner merge: exact-head required workflow status, database-1/database-7, migrations and populated upgrades, API, browser, Azure demo, source-level permissions/predecessor/transaction/recovery review and diff against current main. The original #730 database-1/database-7 failures were test-fixture version/ledger assertions fixed by the #734 incremental three-file change; the earlier Azure appointment-confirmation timeout has not been causally attributed to S3. The cumulative #734 head later passed its Azure demo checks, but timing or independent reproduction is not established by that result.

Recovery: if not accepted, close this draft PR without merging. If later merged and the integrated result needs withdrawal, revert the owner-approved merge through a new reviewed PR while preserving all historical migrations/receipts and avoiding rollback of committed database migration versions; apply a forward correction for any live schema effect. Native and provider behaviour remains synthetic, with all customer-facing switches Off by default.
