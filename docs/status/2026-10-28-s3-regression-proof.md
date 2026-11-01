---
title: S3 regression fixture and upgrade-ledger corrections
date: 2026-10-28
---

Dean authorised proceeding with the professional next steps after the review of PR #730 on 28 October 2026. This Codex review follow-up session owns `codex/s3-regression-proof`, cut from main `f2e6932a` and retaining PR #730 at `6af0626` through an explicit integration merge. The contribution targets the existing S3 branch in PR #695; neither existing contributor branch is written. This is a follow-up within the existing S3 build, not a new feature workstream or merge authority.

The bounded correction covers two confirmed test defects in Application assurance run `40596724433`: the three owner-unavailability regressions update a Demand owner without advancing its exact record version, and the populated site-readiness upgrade expectations omit migration and seed 0121. Changes are limited to `tests/database/customer-delivery.test.ts`, `tests/database/site-readiness-upgrade.test.ts`, and this fragment. The application and migration implementations remain those under review in PR #730.

The claimed-handover regression and populated-0118 S3 upgrade passed in that run. The owner cases stopped during fixture setup before exercising the refusal behaviour. The separate Azure demo run `40596724384` timed out waiting for the appointment-saved notice while its screenshot showed an unresolved confirmation; its uploaded artifact contains screenshots only. No cause linking that failure to S3 has been established.

The owner fixture now advances `version` exactly once and scopes the update to its workspace. All three site-readiness starting histories explicitly expect 0121, and their exact added-seed expectation is `[120, 121]`. The original-ledger, receipt, issued-byte and repeat-application assertions are retained.

Local validation passed: TypeScript with a 2 GiB heap limit and incremental compilation disabled, ESLint for both changed test files, foundation (78 requirements), naming, status sources, migration numbering, all 25 documentation regression tests, and whitespace checks. The initial unrestricted TypeScript process was killed by the environment; the bounded retry completed successfully. Node 24.22.1 and npm 11.9.0 used the unchanged locked dependencies from the reviewed checkout. PostgreSQL is unavailable in this isolated runtime, so the repaired database regressions, HTTP and browser suites still require execution in CI; no local database pass is claimed.

The local claim was recorded before the test edits. Automatic approval review initially blocked publishing the branch because explicit approval for this payload and GitHub destination was required; no remote branch or PR was created by that attempt. After receiving the exact patch and publication request, Dean explicitly authorised pushing `codex/s3-regression-proof` to `deanrfiedler-gif/powerplants-one` and opening a draft contribution into PR #695, retaining PR #730's commits and merging nothing. Final-head CI remains pending. The existing merge hold remains in force; automated proof, independent review, business acceptance and production readiness are separate.
