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
| Timer/offline | Existing `feat/fi01-fi02-field-timer-offline` in the original field worktree; implementation completed for PR review with exact existing work preserved | Local proof: 9 database, 12 focused units, 4 new compiled browser cases, actual process restart and 200% zoom passed; guides/register/component/API records updated. Protected PR and remaining owner/device acceptance are separate. |
| Migration allocation | Supply 0049 retained; timer 0050, Maintenance 0051, Products 0052 in that order | Reconcile each unpublished branch and all exact upgrade/grant assertions; no working database rewrite |
| Complete service narrative | Two selected desktop/phone journeys passed on `7f36e92`; the same jobs retained 125 receipts and 22 exact issued files across application/PostgreSQL restart | Return proposals remain unassigned; completed return attendance, full PT-28 procedure, full PT-30 and owner/device acceptance remain open. [Evidence](../testing/evidence/field-timer-native/README.md#integrated-service-follow-up). |

## Pre-existing work preserved

The root branch retains its field-quality plan/prompt, STATUS/register edits and estimating-reference relocation. Maintenance/Warranty has committed native work plus local modifications; Products has uncommitted native work; Excel import also has unfinished local work. These do not become complete, reviewed or deployed through the consolidation record. No branch is discarded and no historical source is overwritten.

Migration 0049 in Maintenance/Products is an unpublished proposal that conflicts with merged Supply Chain. Its future numbering must change with the complete branch reconciliation. Their local test databases are not evidence of the merged upgrade path. The timer branch already starts at current main and proposes 0050.

## Acceptance boundaries

Use [PP-01 procedures](../testing/prototype-acceptance.md), the [P12 remaining obligations](p12-handover.md), and the current [field programme](field-quality-native-handover.md). FI-05 is merged via #316; dedicated FI-03/FI-04/FI-06 remain later work. Preserve report/Finance authority and exact prior outputs. Synthetic completion does not grant business acceptance, live-system write access or production readiness.

This ledger is updated with actual results as work executes. Do not convert an earlier observation, source implementation or green CI count into a new acceptance claim.

## PT-27 phase audit

Inspected the retained compiled artifact `10848413175` from run `36098609739` on the exact starting main tree. Its 320 successful compiled observations preserve ten concurrent browser users, the declared throttled network and the original candidate boundary. The following medians combine desktop and phone (20 cold and 60 warm observations per view); they are descriptive phase measurements, not new acceptance groups or sums of independent percentiles.

| View | Cold / warm time before first core request | Cold / warm core request to complete body | Cold / warm body-to-settled UI |
|---|---|---|---|
| Customers | 3,284 / 2,413 ms | 3,810 / 3,441 ms | 210 / 181 ms |
| Work order | 3,122 / 2,210 ms | 1,136 / 1,348 ms | 443 / 428 ms |
| Planner | 2,995 / 2,526 ms | 1,458 / 1,456 ms | 336 / 265 ms |
| My Jobs | 2,753 / 2,141 ms | 875 / 1,161 ms | 259 / 244 ms |

This narrows the next performance experiment to initial page/assets/hydration and the longer Customers core-read path. It does not establish that database execution alone caused the Customers interval: transport, declared throttling, concurrent browser load and application work are included. The same artifact records a compiled cold Customers sample fetching the variable Roboto font alongside three shell weights and waiting several seconds for assets; this is an investigation lead, not proof that removing a font fixes the candidate. Inspect the actual compiled payload and server timings, make one bounded change, then repeat the unchanged declared fixture/profile. Do not weaken the candidate or relabel current misses as success. Hosted performance remains unmeasured.

## Publication and next acceptance boundary

Baseline reconciliation is in [PR #320](https://github.com/deanrfiedler-gif/powerplants-one/pull/320), with all seven required checks passed. Timer/offline and the selected continuous-service proof are in [stacked PR #321](https://github.com/deanrfiedler-gif/powerplants-one/pull/321). Its initial CI exposed obsolete offline-label assertions; these and the independent-refresh defect have been corrected and tested locally. The latest publication must receive its own full CI result. Neither PR is merged or deployed by this handover.

The next acceptance increment should complete the return attendance and PT-28 compatible-update/unsupported-original/scheduling-policy procedure, and disposition the remaining PT-30 prerequisites. Keep the PT-27 phase-led performance experiment and owner/device review visible. Maintenance 0051 and Products 0052 remain preserved integration work, with their full upgrade/grant obligations outstanding; allocation alone is not reconciliation.
