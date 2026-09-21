# PR #269 merge-readiness repair — 21 September 2026

PJ-09 head `9e6b5c16` incorporates repaired EN-08 `81f7d616`, which incorporates EN-07 `30984721` and main `8ed8b0c5`. Merge commits preserve that dependency chain without rewriting existing branches.

The repair carries the latest EN-07 r03 source, readiness and deterministic-preview fixes, shifted fixtures, EN-08 phone inspector repair and CRM identity-loading regression proof into PJ-09. Engineering's two review workspaces use the current shared secondary menu and semantic breadcrumb. PJ-09 alone retains its existing explicit `baseline` presentation contract and its corresponding conformance tests. The source/document register retains both EN-07 and PJ-09 entries.

PJ-09 migrations 0032–0038, seed 32, permissions, exact grant expectations, source adapters, closed-project write guards, immutable output/recovery and commercial/receiving independence are unchanged by this merge. There is no ledger rewrite, test skip, disabled workflow or reduction in assertions. No hosted migration, deployment, message or transaction is authorised or performed.

Local TypeScript, lint, all 191 unit tests, foundation, prototype and naming checks pass on Node 24.21.0/npm 11.19.0. Published-head GitHub browser/database CI remains the merge gate and its results are reported on the PR. Earlier passing runs describe their earlier commits. Full owner/device/business acceptance remains separate.

Merge order: #266 → #270 → #269. Use merge commits to retain the reconciled ancestry. All three remain open for the owner's merge decision.

## Full application job budget

Published head `557e9a0f` passed its other 17 checks, including the complete compiled desktop/mobile suite. Application run `35572479711`, job `106246869622`, reached the serial database suite before GitHub cancelled it with “The job has exceeded the maximum execution time of 2h0m0s”. That cancellation is not a completed application proof.

This follow-up incorporates EN-07 commit `b28bc71e`, which increases only the overall application-job budget from 120 to 150 minutes. All retained suites, individual test deadlines, performance assertions and required check contexts remain intact. EN-08 head `3513256b` already passed all 17 checks; it merges cleanly with this budget change and remains unchanged. Fresh-head PJ-09 CI must complete before merge readiness is claimed.
