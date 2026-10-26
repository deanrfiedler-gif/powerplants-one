---
title: PR 712 documentation review corrections prepared
date: 2026-10-26
---

Dean instructed this review session to proceed with the five verified documentation corrections after the recheck of [PR #712](https://github.com/deanrfiedler-gif/powerplants-one/pull/712) at a7817657868c5f37f85811f623526bb6fff72383.

Owner: Codex review-corrections session for Dean. The corrections were prepared as draft [PR #716](https://github.com/deanrfiedler-gif/powerplants-one/pull/716), targeting #712 under the one-owner rule instead of pushing directly to that branch. The preparation base includes main f8ea675ef0c8394dc04b101f837fdcf445356f7e. Scope: the [PJ-07 contract](../contracts/project-delivery-readiness.md), [R10 reconciliation](../decisions/r10-workflow-reconciliation.md), [correction brief](../design/project-delivery-readiness-correction-brief.md), [working scope specification](../design/development/pages/scope-pj-07.md) and this fragment. Accepted owner decisions and existing runtime functionality remain unchanged. This is documentation work, not a new implementation build.

The [earlier Claude review](https://github.com/deanrfiedler-gif/powerplants-one/pull/712#pullrequestreview-5645700055) identified four Medium findings and one Low finding. All five were independently rechecked against the parent head before this correction task. This correction's author check is not an independent different-model review of the corrected head.

| Finding | Proposed correction |
|---|---|
| Contradictory new-scope state | Undetermined applicability produces Evidence needed under the existing priority; No review recorded is separate history. Native Forecast Demand remains Not assessed. |
| Missing native-operation correlation | Projects/Scheduling-owned receiving adapters reserve exact intent/operation identities, atomically retain native effects/receipts and typed execution evidence, and recover originals. Ordinary unbound outcomes remain Reported only. Native Scheduling alone decides requests; no extra apply step. |
| Outstanding request during reassignment/correction | Keep one outstanding action across successor submissions; explicitly adopt an unchanged pending request or verify native cancellation/rejection before replacement. Acceptance races require reconciliation; unknown originals hold replacement. PL-04 current-state acceptance and independent native work remain unchanged. |
| Restricted information through Activities | Require a source-enforcing Activity target before enabling criterion-linked follow-up. Apply current source checks across lists/counts/detail/history/export and recovery; unsupported protection refuses creation/linking. Generic Project Activities retain existing behaviour. |
| Stale audit merge statement | Retain the original main snapshot as historical evidence and record #694's merge and #712's integration separately from design acceptance. |

PJ07-19–24 add future acceptance examples; PJ07-10 explicitly depends on the proposed correlation adapter. The contract now contains 24 examples. They are not executed application tests. The correction brief and working scope specification receive the matching states without changing Figma, accepted frames, issued references, guides, register fingerprints or native code.

Local validation passed: foundation and local links, naming, prototype consistency, status sources, 22 documentation unit tests, development-register integrity and whitespace. The register reports 342 unreviewed and 26 stale entries, matching the parent review; no review is granted. The register check used Node 24.22.1 and the existing local tsx loader directly, with no dependency or lockfile change. Committed-tree scope, final-main ancestry and remote byte verification are recorded in #716 after publication. No application, database or browser execution is claimed for this documentation-only change.

At the preparation checkpoint, the parent #712 had not integrated these corrections. Dean subsequently instructed this session to proceed with correction integration into #712 and different-model review. Integration of the correction PR is distinct from merging #712 into main: #712 must remain draft and unmerged. The PR timelines record the exact reviewed/integrated heads, finding dispositions and current CI results; this historical preparation record does not assert those later outcomes. Independent different-model review and Dean's visual acceptance remain separate; no visual approval, deployment or production readiness is asserted.
