---
document_id: PPO-ES10-WORKSPACE-DES
title: Reference cases and calibration proposals — design and receiving handover
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Authorised standalone design; owner acceptance and application integration separate
source_commit: d565a9de01b94aa7ad3fffe3a996f78c3aee589b
---

# ES-10 — Reference Cases & Calibration Proposals

Dean authorised the recommended ES-10 build, interactive HTML and detailed professional companion report, aligned to the Powerplants One r20 theme board. The five views are reference cases, case detail/applicability, comparable-job comparison, calibration proposals and the estimator reference panel.

- [Interactive HTML](../reference/ui/reference-calibration/PPO-Reference-Cases-and-Calibration-Proposals-r01.html)
- [Detailed report](../reference/ui/reference-calibration/PPO-Reference-Cases-and-Calibration-Proposals-Report-r01.md)
- [Source and rebuild instructions](../design/reference-calibration/README.md)
- [Actual verification and limitations](../testing/evidence/reference-calibration-r01/README.md)

## Basis and scope

Based on main `d565a9de01b94aa7ad3fffe3a996f78c3aee589b`; ES-09 inspected at PR #220 head `19a029bb9f7e97517432b9538ba17f7144ed2023`. The coverage register defines ES-10 as a page plus estimator panel dependent on ES-09. Its page ID is distinct from the unchanged EST parent requirement IDs.

The [feedback-loop proposal](../blueprints/estimate-actual-feedback-design.md) supplies candidate reference and calibration behaviour; its policies remain unadopted. ES-10 labels the illustrative n thresholds and preview input limits accordingly. Its five authored reviewed cases must not be mistaken for imported ES-09 evidence. Northbank remains incoming Draft / Partial and is excluded from aggregation. Its 232 accepted installation hours and 291 used hours preserve the source fixture; no financial comparison is imported.

The authorised build uses the existing plain JavaScript/CSS, embedded font and deterministic HTML pattern. No new technology, dependencies, migration, application route, hosted service or operational adapter is introduced. Reusing the current r20 and Customer 360 patterns does not alter accepted UI baseline hashes. A native select is a disclosed first-pass alternative to the custom choice-card control.

## Decisions implemented in the design

1. Preserve original case and proposal evidence separately from the current source.
2. Exclude unreviewed, incomplete, expired, incompatible and bespoke evidence from the narrow demonstration aggregate, retaining reasons.
3. Show per-job hours ratios, median, n and full range; explicitly withhold aggregate numbers below the proposed sample threshold.
4. Draft, submission, independent review and rule adoption remain separate. Adoption is unavailable.
5. A changed source requires return/successor work and does not inherit review approval.
6. Scenario calculations affect only the preview; ES-08 formulae, mappings, rates, catalogue prices, historical and current estimates remain outside its write scope.
7. Enforce preview-role and state transitions in the local model. Actual server permissions remain receiving work.
8. Pause stale or unreadable local writes; preserve failed-save entries and provide explicit export/reset controls.

Fixture references `SYN-ES10-REF` and `SYN-ES10-CAL` are local labels, not additions to the adopted type-code registry. All 78 parent requirements remain intact.

## Receiving boundaries and next increment

ES-09 needs an exact reviewed outcome, comparison basis, line identity, completeness declaration, applicability and source revision before ES-10 can accept it operationally. Its current local handover does not establish that acceptance. A proposal can ask for ES-08 validation but cannot adopt a definition pack or rerun production calculations.

The older proposal's Projects-led sequence and ES-09's proposed Service-only A1 are not reconciled into a new runtime instruction by this HTML. D-017, financial definitions, commercial lineage, source contracts, governed registries and actual review/adoption authority remain unresolved.

Recommended next application increment, once prerequisites exist: read-only, permission-scoped reference cases at an existing estimate line. Proposal persistence and governed adoption are later bounded work. No automatic repricing is recommended or implemented.

No main merge, deployment, external communication, business transaction or live integration is part of this contribution. Owner visual acceptance and application integration remain separate from a successful CI run. Recovery is to revert this isolated design contribution; no application data migration is required.

## Verified contribution

Published in [draft PR #221](https://github.com/deanrfiedler-gif/powerplants-one/pull/221). Final HTML source `e5e3eb233e7dc865a67a7d8867757dc5d510e19b` passed 24 model and 18 native-browser groups, focused lint, deterministic assembly and all three documentation checks in [run 35157933992](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35157933992). The final ZIP, all 28 screenshot hashes and the delivered HTML hash were verified. Desktop/phone, case, snapshot and review captures were inspected during verification. The two observed layout defects were fixed and reverified. Preserved manifests and two original final-source screenshots are in the evidence directory. Evidence/report-only publication leaves the verified HTML unchanged. No owner acceptance or merge is inferred.
