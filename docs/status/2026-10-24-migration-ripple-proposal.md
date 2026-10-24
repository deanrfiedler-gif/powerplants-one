---
title: Migration test ripple recommendations approved; implementation on hold
date: 2026-10-24
---

Dean Fiedler owns the [independent migration test expectations paper](../decisions/migration-test-expectations.md); Codex for Dean is its author. Dean approved all five recommendations on 24 October 2026, while requiring [PR #692](https://github.com/deanrfiedler-gif/powerplants-one/pull/692) to remain a draft and implementation to stay on hold.

At main 79bef1d32f42cd2dcdbf04ce0f30a4374199db2e, the 117 search returns 80 lines in 65 test files. At the paper's fixed measured heads, paginated diffs give 72 test files for #673 and 67 for #689, with 66 shared. The 12-landing sample has 33 non-merge corrective commits: 8 contain version/history repairs, 8 grant/seed expectation repairs and 17 other repairs. Of 55 failed workflow runs, 17 contain version/count misses (14 without other failures), 10 are grant/receipt-only and 28 are outside those classes. These are bounded observations, not demonstrated avoided failures; commands and per-item classifications are in the paper.

The approved recommendation is D: independently maintained current migration history plus a consistency check, retaining original ledgers and explicit historical case additions; seed/grant consolidation is deferred. Claude's review of b7afa1bc760d44906122d9dd233c00ebf00ac4e5 has been verified, with every finding's disposition recorded in section 11. Corrections clarify six starting-history checks, replay/rollback evidence, prefix preconditions, conditional overlap estimates and the compile-time/runtime demo gate. The corrected paper awaits follow-up review.

Only the paper, this fragment and a document-register entry change. A later conversion needs separate authorisation, a quiet window without open migration PRs, full equivalence evidence and application CI. Recommendation approval is not an implementation start, merge approval, business acceptance or production readiness. Head-specific checks remain in the draft PR.

<!-- decision-index -->

- [Independent migration test expectations](../decisions/migration-test-expectations.md): all five recommendations approved by Dean; review corrections recorded, follow-up review pending and implementation on hold.
