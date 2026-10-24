---
title: Conversations T2e offline case and scoring review
date: 2026-10-24
---

Dean requested latest CI inspection and review/fixes for [draft PR #686](https://github.com/deanrfiedler-gif/powerplants-one/pull/686), keeping it draft and without live API calls. This is the author's review, not an independent second-model review or owner acceptance.

The correction removes L03's unsupported requirement to know the site's timezone, requires scoring all factual Answer claims and citations even on L11, predeclares fixed-refusal/N/A branches, and separates application invariants from model scores. L08/L09 injection resistance does not require explicit refusal wording. Case cards are generated from the inventory. The earlier package remains preserved; a fresh disposable synthetic database is used for the corrected catalogue. The [evaluation plan](../decisions/conversations-t2e-evaluation.md#fixture-matrix-and-rubric), [operator chapter](../delivery/conversations-t2d-local-adapter.md#offline-corpus-preparation-and-review), [contract](../contracts/conversations-t2b.md) and [evidence](../testing/evidence/conversations-t2e/README.md) carry the rules and validation checkpoints.

At inspected head `ecbcfa16486dc54dc119aa8ef0c5345f13c96e5c`, 10 of 15 workflow runs had succeeded, one was running and four were queued; none had failed. This includes merged-tree/typecheck, documentation, development-register and dependency-audit success; it is not complete application CI. Corrected focused unit checks pass 4/4 and focused lint passes. Full corrected corpus proof and final-head CI are recorded separately in the evidence chapter. No credentials inspected, provider calls, worker execution, merge or deployment.

The corrected 117-instance persisted proof passed in 233.547 seconds. The [corrected review package](../testing/evidence/conversations-t2e/scoring-review/cases.md) is retained separately at clean preparation source `de30d09e`; the original package is historical. All turns remain Queued with zero model calls and budget entries. Status, scope and naming checks pass. The PR remains draft and unmerged; final-head CI and owner review are separate.
