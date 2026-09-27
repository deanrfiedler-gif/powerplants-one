# Repository consolidation and service verification

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. State: authorised implementation in progress, 27 September 2026. [Decision and migration sequence](../decisions/repository-consolidation.md). All 78 parent requirements remain unchanged.

## Starting evidence

- Main `80b2f418b90a69d267ac2e65682a5b560a8b4356`, tree `5c9ee19d6af6e12b5cb5bf464338aacba9172059`; no open PR at preflight. The root planning checkout is 162 commits behind and contains uncommitted work, which remains untouched.
- [Application CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36098609739): 434 unit cases, 601 main database cases and the additional separately reported suites passed. [Compiled browser CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36098609686): 516 passed, 79 skipped. All seven configured protected contexts passed. Counts are component evidence, not complete acceptance.
- [Deployment 36204121972](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36204121972), 26 September: image source `80b2f41`, digest `sha256:83348b2854d0483b687640488204176bfd62fb57315089f20f7f80f80d97d73c`; database gate, selected web readiness/health and anonymous refusal passed; worker configured with the same digest. Fresh signed-in record/output, worker execution and managed PostgreSQL minor were not checked by this audit.
- Fresh audit checks on unchanged main: foundation, prototype, naming and design-register integrity passed; all 78 parent dispositions retained. Register: 320 entries, 166 source routes, 28 components, zero integrity errors, 320 entry reviews and 28 component reviews pending. Twenty-four focused field/readiness/inspection/development units passed. The production dependency advisory audit reported zero known vulnerabilities; this is not a security certification.
- [Performance job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36098609739/job/107956098735): all sixteen compiled groups missed the 3-second candidate; p95 3.42–10.03 seconds. All sixteen development groups also missed. Successful execution is deliberately distinct from meeting the candidate. These measurements do not establish hosted response times or their cause.

## Delivery ledger

| Work | Source and state | Remaining proof |
|---|---|---|
| Baseline records | `codex/repository-consolidation` from current main; README/STATUS refreshed and prior snapshot preserved in STATUS-log | Foundation, prototype and naming checks passed locally; all 78 parents retained. PR CI and owner acceptance remain separate. |
| Timer/offline | Existing `feat/fi01-fi02-field-timer-offline` in the original field worktree; incomplete, uncommitted implementation retained and inspected | Finish source, API/browser/restart/upgrade proof, register/component/guide maintenance and protected PR |
| Migration allocation | Supply 0049 retained; timer 0050, Maintenance 0051, Products 0052 in that order | Reconcile each unpublished branch and all exact upgrade/grant assertions; no working database rewrite |
| Complete service narrative | Existing P01–P12 components and fixtures retained | Continuous current-source evidence for PT-30, explicit PT-28 disposition, performance findings and owner/device review |

## Pre-existing work preserved

The root branch retains its field-quality plan/prompt, STATUS/register edits and estimating-reference relocation. Maintenance/Warranty has committed native work plus local modifications; Products has uncommitted native work; Excel import also has unfinished local work. These do not become complete, reviewed or deployed through the consolidation record. No branch is discarded and no historical source is overwritten.

Migration 0049 in Maintenance/Products is an unpublished proposal that conflicts with merged Supply Chain. Its future numbering must change with the complete branch reconciliation. Their local test databases are not evidence of the merged upgrade path. The timer branch already starts at current main and proposes 0050.

## Acceptance boundaries

Use [PP-01 procedures](../testing/prototype-acceptance.md), the [P12 remaining obligations](p12-handover.md), and the current [field programme](field-quality-native-handover.md). FI-05 is merged via #316; dedicated FI-03/FI-04/FI-06 remain later work. Preserve report/Finance authority and exact prior outputs. Synthetic completion does not grant business acceptance, live-system write access or production readiness.

This ledger is updated with actual results as work executes. Do not convert an earlier observation, source implementation or green CI count into a new acceptance claim.
